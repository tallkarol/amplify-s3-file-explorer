// src/features/files/services/S3Service.ts
import { list, getUrl, remove, uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
// import { getCurrentUser } from 'aws-amplify/auth';
import { S3Item } from '../../../types';
import { devLog, devWarn, devError } from '../../../utils/logger';

const client = generateClient();

// Permission cache: userId -> Map<folderPath, FolderPermissions>
const permissionCache = new Map<string, Map<string, FolderPermissions>>();
const permissionCacheTimestamp = new Map<string, number>();
const CACHE_TTL = 60000; // 1 minute cache

// File count cache: userId -> Map<folderPath, fileCount>
const fileCountCache = new Map<string, Map<string, number>>();
const fileCountCacheTimestamp = new Map<string, number>();
const FILE_COUNT_CACHE_TTL = 30000; // 30 second cache for file counts

// File listing cache: userId -> Map<path, S3Item[]>
const fileListCache = new Map<string, Map<string, S3Item[]>>();
const fileListCacheTimestamp = new Map<string, number>();
const FILE_LIST_CACHE_TTL = 10000; // 10 second cache for file listings

// Request deduplication: Map<key, Promise>
const pendingRequests = new Map<string, Promise<any>>();

// Protected folders that should not be deleted (UPDATED)
const PROTECTED_FOLDERS = [
  'certificate',
  'audit-report',
  'auditor-resume',
  'statistics',
  'private',
  'confirmation-notices',
  'other'
];

// Folder display names (UPDATED)
const FOLDER_DISPLAY_NAMES: Record<string, string> = {
  'certificate': 'Certificates',
  'audit-report': 'Audit Reports',
  'auditor-resume': 'Auditor Profiles',
  'statistics': 'Statistics',
  'private': 'Private Documents',
  'confirmation-notices': 'Confirmation Notices',
  'other': 'Other Documents'
};

// Enhanced S3Item with permissions
export interface EnhancedS3Item extends S3Item {
  permissions?: {
    downloadRestricted: boolean;
    uploadRestricted: boolean;
    canCreateSubfolders: boolean;
    canDeleteFolder: boolean;
  };
}

// Folder permissions interface
export interface FolderPermissions {
  id?: string;
  userId: string;
  folderPath: string;
  downloadRestricted: boolean;
  uploadRestricted: boolean;
  canCreateSubfolders: boolean;
  canDeleteFolder: boolean;
  inheritFromParent: boolean;
  isVisible: boolean;
  createdBy?: string;
  lastModifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// GraphQL queries and mutations for folder permissions
const listFolderPermissionsQuery = /* GraphQL */ `
  query ListFolderPermissions($userId: String!) {
    listFolderPermissions(filter: { userId: { eq: $userId } }) {
      items {
        id
        userId
        folderPath
        downloadRestricted
        uploadRestricted
        canCreateSubfolders
        canDeleteFolder
        inheritFromParent
        isVisible
        createdBy
        lastModifiedBy
        createdAt
        updatedAt
      }
    }
  }
`;

const createFolderPermissionMutation = /* GraphQL */ `
  mutation CreateFolderPermission($input: CreateFolderPermissionInput!) {
    createFolderPermission(input: $input) {
      id
      userId
      folderPath
      downloadRestricted
      uploadRestricted
      canCreateSubfolders
      canDeleteFolder
      inheritFromParent
      isVisible
      createdBy
      lastModifiedBy
      createdAt
      updatedAt
    }
  }
`;

const updateFolderPermissionMutation = /* GraphQL */ `
  mutation UpdateFolderPermission($input: UpdateFolderPermissionInput!) {
    updateFolderPermission(input: $input) {
      id
      userId
      folderPath
      downloadRestricted
      uploadRestricted
      canCreateSubfolders
      canDeleteFolder
      inheritFromParent
      isVisible
      createdBy
      lastModifiedBy
      createdAt
      updatedAt
    }
  }
`;

const deleteFolderPermissionMutation = /* GraphQL */ `
  mutation DeleteFolderPermission($input: DeleteFolderPermissionInput!) {
    deleteFolderPermission(input: $input) {
      id
    }
  }
`;

/**
 * Get all folder permissions for a user
 */
export const getUserFolderPermissions = async (userId: string): Promise<FolderPermissions[]> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ listFolderPermissions: { items: FolderPermissions[] } }>>({
      query: listFolderPermissionsQuery,
      variables: { userId },
      authMode: 'userPool'
    });

    return response.data?.listFolderPermissions?.items || [];
  } catch (error) {
    devError('Error fetching folder permissions:', error);
    return []; // Return empty array instead of throwing to prevent UI breaks
  }
};

/**
 * Normalize folder path to ensure consistent format
 */
export const normalizeFolderPath = (path: string | null | undefined): string => {
  // Handle null/undefined
  if (!path) {
    devWarn('[S3Service] normalizeFolderPath received null/undefined, returning "/"');
    return '/';
  }
  
  // Trim and handle empty/whitespace
  let normalized = path.trim();
  
  // Handle empty string or just whitespace
  if (!normalized || normalized === '') {
    devWarn('[S3Service] normalizeFolderPath received empty string, returning "/"');
    return '/';
  }
  
  // Remove any double slashes in the middle (but preserve leading /)
  normalized = normalized.replace(/([^/])\/\//g, '$1/');
  
  // Ensure path starts with /
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  
  // Handle root path - should be just '/'
  // Check for '//', '///', etc. and normalize to '/'
  if (normalized.match(/^\/+$/)) {
    return '/';
  }
  
  // For non-root paths, ensure they end with /
  if (!normalized.endsWith('/')) {
    normalized = normalized + '/';
  }
  
  // Final check: if somehow we still have '//' or more, convert to '/'
  if (normalized.match(/^\/\/+$/)) {
    return '/';
  }
  
  return normalized;
};

/**
 * Load all permissions for a user into cache
 */
const loadUserPermissionsIntoCache = async (userId: string): Promise<void> => {
  const now = Date.now();
  const cacheTime = permissionCacheTimestamp.get(userId) || 0;
  
  // Return cached data if still valid
  if (permissionCache.has(userId) && (now - cacheTime) < CACHE_TTL) {
    return;
  }
  
  try {
    const allPermissions = await getUserFolderPermissions(userId);
    const pathMap = new Map<string, FolderPermissions>();
    
    // Index permissions by normalized path
    for (const perm of allPermissions) {
      const normalizedPath = normalizeFolderPath(perm.folderPath);
      pathMap.set(normalizedPath, perm);
    }
    
    devLog('[loadUserPermissionsIntoCache] Loaded permissions for userId:', userId, {
      count: allPermissions.length,
      paths: Array.from(pathMap.keys()),
      permissions: allPermissions.map(p => ({
        path: p.folderPath,
        normalizedPath: normalizeFolderPath(p.folderPath),
        isVisible: p.isVisible,
        inheritFromParent: p.inheritFromParent
      }))
    });
    
    permissionCache.set(userId, pathMap);
    permissionCacheTimestamp.set(userId, now);
  } catch (error) {
    devError('[S3Service] Error loading permissions into cache:', error);
    // Set empty cache to prevent repeated failures
    permissionCache.set(userId, new Map());
    permissionCacheTimestamp.set(userId, now);
  }
};

/**
 * Invalidate cache for a user (call after creating/updating/deleting permissions)
 */
export const invalidatePermissionCache = (userId: string): void => {
  permissionCache.delete(userId);
  permissionCacheTimestamp.delete(userId);
};

/**
 * Get permissions for a specific folder (uses cache)
 */
export const getFolderPermission = async (userId: string, folderPath: string): Promise<FolderPermissions | null> => {
  try {
    const normalizedPath = normalizeFolderPath(folderPath);
    
    // Ensure cache is loaded
    await loadUserPermissionsIntoCache(userId);
    
    const userCache = permissionCache.get(userId);
    if (!userCache) {
      return null;
    }
    
    return userCache.get(normalizedPath) || null;
  } catch (error) {
    devError('[S3Service] Error fetching folder permission:', {
      error,
      userId,
      folderPath
    });
    return null;
  }
};

/**
 * Create or update folder permissions
 */
export const setFolderPermissions = async (permissions: Omit<FolderPermissions, 'id' | 'createdAt' | 'updatedAt'>): Promise<FolderPermissions> => {
  try {
    // Normalize the folder path before processing
    const normalizedPath = normalizeFolderPath(permissions.folderPath);
    const normalizedPermissions = {
      ...permissions,
      folderPath: normalizedPath
    };
    
    // Check if permissions already exist (uses cache)
    const existing = await getFolderPermission(normalizedPermissions.userId, normalizedPermissions.folderPath);
    
    if (existing) {
      // Update existing permissions
      const updateInput = {
        id: existing.id,
        downloadRestricted: normalizedPermissions.downloadRestricted,
        uploadRestricted: normalizedPermissions.uploadRestricted,
        canCreateSubfolders: normalizedPermissions.canCreateSubfolders,
        canDeleteFolder: normalizedPermissions.canDeleteFolder,
        inheritFromParent: normalizedPermissions.inheritFromParent,
        isVisible: normalizedPermissions.isVisible,
        lastModifiedBy: normalizedPermissions.lastModifiedBy
      };
      
      const response = await client.graphql<GraphQLQuery<{ updateFolderPermission: FolderPermissions }>>({
        query: updateFolderPermissionMutation,
        variables: {
          input: updateInput
        },
        authMode: 'userPool'
      });

      const result = response.data!.updateFolderPermission;
      
      if (!result) {
        throw new Error('Update mutation returned null or undefined');
      }
      
      // Invalidate cache after update
      invalidatePermissionCache(normalizedPermissions.userId);
      
      return result;
    } else {
      // Create new permissions
      const response = await client.graphql<GraphQLQuery<{ createFolderPermission: FolderPermissions }>>({
        query: createFolderPermissionMutation,
        variables: { input: normalizedPermissions },
        authMode: 'userPool'
      });

      const result = response.data!.createFolderPermission;
      
      if (!result) {
        throw new Error('Create mutation returned null or undefined');
      }
      
      // Invalidate cache after create
      invalidatePermissionCache(normalizedPermissions.userId);
      
      return result;
    }
  } catch (error) {
    devError('[S3Service] Error setting folder permissions:', {
      error,
      permissions,
      fullError: JSON.stringify(error, null, 2),
      errorDetails: (error as any)?.errors
    });
    throw error;
  }
};

/**
 * Delete folder permissions
 */
export const deleteFolderPermissions = async (permissionId: string): Promise<void> => {
  try {
    await client.graphql({
      query: deleteFolderPermissionMutation,
      variables: { input: { id: permissionId } },
      authMode: 'userPool'
    });
  } catch (error) {
    devError('Error deleting folder permissions:', error);
    throw error;
  }
};

/**
 * Get effective permissions for a folder (considering inheritance) - optimized with cache
 */
export const getEffectiveFolderPermissions = async (userId: string, folderPath: string): Promise<FolderPermissions> => {
  try {
    const normalizedPath = normalizeFolderPath(folderPath);
    
    // Ensure cache is loaded
    await loadUserPermissionsIntoCache(userId);
    
    const userCache = permissionCache.get(userId);
    if (!userCache) {
      devLog('[getEffectiveFolderPermissions] No cache found, returning defaults for:', normalizedPath);
      // Return defaults if cache failed
      return {
        userId,
        folderPath: normalizedPath,
        downloadRestricted: false,
        uploadRestricted: false,
        canCreateSubfolders: true,
        canDeleteFolder: true,
        inheritFromParent: true,
        isVisible: true
      };
    }
    
    // Get direct permissions for this folder
    const directPermissions = userCache.get(normalizedPath);
    devLog('[getEffectiveFolderPermissions] Checking:', {
      folderPath: normalizedPath,
      hasDirectPermissions: !!directPermissions,
      directPermissions: directPermissions ? {
        isVisible: directPermissions.isVisible,
        inheritFromParent: directPermissions.inheritFromParent
      } : null
    });
    
    // Default permissions if none found (permissive defaults - folders are visible by default)
    const defaultPermissions: FolderPermissions = {
      userId,
      folderPath: normalizedPath,
      downloadRestricted: false,
      uploadRestricted: false,
      canCreateSubfolders: true,
      canDeleteFolder: true,
      inheritFromParent: true,
      isVisible: true // CRITICAL: Default to visible
    };

    // If folder has explicit permissions and doesn't inherit, return them as-is
    if (directPermissions && !directPermissions.inheritFromParent) {
      // Ensure isVisible defaults to true if not explicitly set (null/undefined -> true)
      return {
        ...directPermissions,
        isVisible: (directPermissions.isVisible !== undefined && directPermissions.isVisible !== null) 
          ? directPermissions.isVisible 
          : true
      };
    }

    // If inheriting from parent or no permissions set, traverse up the path (using cache)
    const pathParts = normalizedPath.split('/').filter(Boolean);
    
    // Check parent folders (using cache, no API calls)
    // IMPORTANT: For visibility, we default to true unless explicitly set on THIS folder
    // Parent visibility settings should NOT hide child folders
    let inheritedPermissions: FolderPermissions | null = null;
    
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const parentPath = '/' + pathParts.slice(0, i).join('/') + '/';
      const normalizedParentPath = normalizeFolderPath(parentPath);
      const parentPermissions = userCache.get(normalizedParentPath);
      
      if (parentPermissions && !parentPermissions.inheritFromParent) {
        inheritedPermissions = parentPermissions;
        break;
      }
    }

    // Determine final isVisible value
    // CRITICAL: isVisible should ONLY be false if explicitly set to false on THIS folder
    // Never inherit isVisible: false from parents
    // Treat null/undefined as "not set" and default to true
    let finalIsVisible = true; // Default to visible
    
    if (directPermissions && directPermissions.isVisible !== undefined && directPermissions.isVisible !== null) {
      // Folder has explicit isVisible setting (not null/undefined) - use it
      finalIsVisible = directPermissions.isVisible;
      devLog('[getEffectiveFolderPermissions] Using direct isVisible:', finalIsVisible, 'for', normalizedPath);
    } else {
      // No explicit setting on folder (null/undefined) - default to visible (don't inherit parent's isVisible)
      finalIsVisible = true;
      devLog('[getEffectiveFolderPermissions] No direct isVisible (was', directPermissions?.isVisible, '), defaulting to true for', normalizedPath);
    }

    // If we found inherited permissions, merge them but override isVisible
    if (inheritedPermissions) {
      devLog('[getEffectiveFolderPermissions] Found inherited permissions for', normalizedPath, {
        inheritedIsVisible: inheritedPermissions.isVisible,
        finalIsVisible
      });
      const result = {
        ...inheritedPermissions,
        folderPath: normalizedPath, // Keep the original folder path
        inheritFromParent: true, // Mark as inherited
        // CRITICAL FIX: Never inherit parent's isVisible - always default to true unless folder explicitly sets it
        isVisible: finalIsVisible
      };
      devLog('[getEffectiveFolderPermissions] Returning inherited permissions with isVisible:', result.isVisible);
      return result;
    }

    // No permissions found anywhere - return defaults (visible by default)
    // If folder has permissions but inherits, use its explicit isVisible or default to true
    if (directPermissions) {
      const result = {
        ...defaultPermissions,
        ...directPermissions,
        folderPath: normalizedPath,
        // Ensure isVisible is true unless explicitly set to false
        isVisible: finalIsVisible
      };
      devLog('[getEffectiveFolderPermissions] Returning direct permissions with isVisible:', result.isVisible);
      return result;
    }

    devLog('[getEffectiveFolderPermissions] Returning default permissions (isVisible: true) for', normalizedPath);
    return defaultPermissions;
  } catch (error: any) {
    // Check if it's an authorization error
    const isAuthError = error?.errors?.some((e: any) => 
      e.errorType === 'Unauthorized' || 
      e.message?.includes('Not Authorized') ||
      e.message?.includes('unauthorized')
    );
    
    if (isAuthError) {
      devWarn('Authorization error getting folder permissions - returning restrictive defaults:', error);
      // Return restrictive defaults on authorization error (fail secure)
      return {
        userId,
        folderPath,
        downloadRestricted: true,
        uploadRestricted: true,
        canCreateSubfolders: false,
        canDeleteFolder: false,
        inheritFromParent: true,
        isVisible: false
      };
    }
    
    devError('Error getting effective folder permissions:', error);
    // Return safe defaults on other errors (permissive to avoid breaking existing functionality)
    return {
      userId,
      folderPath,
      downloadRestricted: false,
      uploadRestricted: false,
      canCreateSubfolders: true,
      canDeleteFolder: !PROTECTED_FOLDERS.some(folder => folderPath.includes(folder)),
      inheritFromParent: true,
      isVisible: true
    };
  }
};

/**
 * Get file count for a folder (with caching)
 */
export const getFolderFileCount = async (userId: string, folderPath: string): Promise<number> => {
  const normalizedPath = normalizeFolderPath(folderPath);
  const now = Date.now();
  const cacheTime = fileCountCacheTimestamp.get(userId) || 0;
  
  // Check cache first
  const userFileCountCache = fileCountCache.get(userId);
  if (userFileCountCache && (now - cacheTime) < FILE_COUNT_CACHE_TTL) {
    const cachedCount = userFileCountCache.get(normalizedPath);
    if (cachedCount !== undefined) {
      return cachedCount;
    }
  }
  
  // Cache miss - fetch and cache
  try {
    const files = await listUserFiles(userId, normalizedPath);
    const count = files.filter(item => !item.isFolder).length;
    
    // Update cache
    if (!userFileCountCache) {
      fileCountCache.set(userId, new Map([[normalizedPath, count]]));
    } else {
      userFileCountCache.set(normalizedPath, count);
    }
    fileCountCacheTimestamp.set(userId, now);
    
    return count;
  } catch (error) {
    devError(`Error getting file count for ${folderPath}:`, error);
    return 0;
  }
};

/**
 * Get file counts for multiple folders (batched with caching)
 */
export const getFolderFileCounts = async (userId: string, folderPaths: string[]): Promise<Record<string, number>> => {
  const now = Date.now();
  const cacheTime = fileCountCacheTimestamp.get(userId) || 0;
  const isCacheValid = (now - cacheTime) < FILE_COUNT_CACHE_TTL;
  
  let userFileCountCache = fileCountCache.get(userId);
  if (!userFileCountCache) {
    userFileCountCache = new Map();
    fileCountCache.set(userId, userFileCountCache);
  }
  
  const results: Record<string, number> = {};
  const pathsToFetch: string[] = [];
  
  // Check cache for each path
  for (const folderPath of folderPaths) {
    const normalizedPath = normalizeFolderPath(folderPath);
    if (isCacheValid) {
      const cachedCount = userFileCountCache.get(normalizedPath);
      if (cachedCount !== undefined) {
        results[normalizedPath] = cachedCount;
        continue;
      }
    }
    pathsToFetch.push(normalizedPath);
  }
  
  // Fetch missing counts in parallel
  if (pathsToFetch.length > 0) {
    const fetchPromises = pathsToFetch.map(async (path) => {
      try {
        const files = await listUserFiles(userId, path);
        const count = files.filter(item => !item.isFolder).length;
        userFileCountCache.set(path, count);
        results[path] = count;
      } catch (error) {
        devError(`Error getting file count for ${path}:`, error);
        userFileCountCache.set(path, 0);
        results[path] = 0;
      }
    });
    
    await Promise.all(fetchPromises);
    fileCountCacheTimestamp.set(userId, now);
  }
  
  return results;
};

/**
 * Invalidate file count cache for a user
 */
export const invalidateFileCountCache = (userId: string): void => {
  fileCountCache.delete(userId);
  fileCountCacheTimestamp.delete(userId);
};

/**
 * Invalidate file list cache for a user
 */
export const invalidateFileListCache = (userId: string): void => {
  fileListCache.delete(userId);
  fileListCacheTimestamp.delete(userId);
};

/**
 * List files and folders at a specific path for a user
 * Uses caching and request deduplication to prevent unnecessary S3 calls
 */
export const listUserFiles = async (userId: string, path: string = '/'): Promise<S3Item[]> => {
  // Ensure path ends with a slash for directory listing
  const directoryPath = path.endsWith('/') ? path : `${path}/`;
  
  // Create cache key
  const cacheKey = `${userId}:${directoryPath}`;
  
  // Check cache first
  const userCache = fileListCache.get(userId);
  const cacheTime = fileListCacheTimestamp.get(userId);
  const now = Date.now();
  
  if (userCache && cacheTime && (now - cacheTime) < FILE_LIST_CACHE_TTL) {
    const cachedResult = userCache.get(directoryPath);
    if (cachedResult) {
      devLog('[listUserFiles] Using cached result for:', cacheKey);
      return cachedResult;
    }
  }
  
  // Check if there's already a pending request for this key
  if (pendingRequests.has(cacheKey)) {
    devLog('[listUserFiles] Waiting for pending request:', cacheKey);
    return pendingRequests.get(cacheKey)!;
  }
  
  // Create new request
  const requestPromise = (async () => {
    try {
      // Format the full path including the 'users/' prefix and user ID
      // This matches the structure created in the post-confirmation function
      const fullPath = directoryPath === '/' 
        ? `users/${userId}/` 
        : `users/${userId}${directoryPath}`;
      
      // List objects from S3
      const result = await list({
        path: fullPath,
        options: {
          // In Amplify v6, we don't need to specify pageSize as it handles pagination differently
        }
      });
      
      devLog('[listUserFiles] Fetched from S3:', cacheKey);
    
    // Process and organize the results
    const items: S3Item[] = [];
    const seenFolders = new Set<string>();
    
    // If we're not at the root level of the user's folder, add a parent folder navigation
    if (directoryPath !== '/') {
      const parentParts = directoryPath.split('/').filter(Boolean);
      parentParts.pop(); // Remove the last part
      
      const parentPath = parentParts.length > 0 
        ? `/${parentParts.join('/')}/` 
        : '/';
      
      items.push({
        key: parentPath,
        name: '..',
        isFolder: true,
        parentFolder: directoryPath,
        size: 0
      });
    }
    
    // First pass: identify all distinct folders
    for (const item of result.items) {
      // Skip the current directory itself
      if (item.path === fullPath) continue;
      
      // Remove the user prefix to get the relative path
      const relativePath = item.path.replace(`users/${userId}/`, '');
      
      // Check if this is a folder (ends with /)
      if (item.path.endsWith('/')) {
        // It's definitely a folder - extract the folder name
        const folderName = item.path.split('/').filter(Boolean).pop() || '';
        
        // If we're at root, check if this is a direct child folder
        if (directoryPath === '/') {
          const folderDepth = relativePath.split('/').filter(Boolean).length;
          
          // Only include top-level folders
          if (folderDepth === 1) {
            const folderPath = `/${relativePath.split('/')[0]}/`;
            
            if (!seenFolders.has(folderPath)) {
              seenFolders.add(folderPath);
              
              // Check if this is a protected folder
              const isProtected = PROTECTED_FOLDERS.includes(folderName);
              
              items.push({
                key: folderPath,
                name: folderName,
                isFolder: true,
                parentFolder: directoryPath,
                lastModified: item.lastModified,
                isProtected
              });
            }
          }
        }
        // If we're in a subfolder, only include direct children
        else {
          const relativeToCurrentDir = relativePath.replace(directoryPath.substring(1), '');
          const relativePathParts = relativeToCurrentDir.split('/').filter(Boolean);
          
          // Only include direct children folders (depth = 1)
          if (relativePathParts.length === 1) {
            const folderPath = `${directoryPath}${relativePathParts[0]}/`;
            
            if (!seenFolders.has(folderPath)) {
              seenFolders.add(folderPath);
              
              // Check if this is a protected folder
              const isProtected = PROTECTED_FOLDERS.includes(relativePathParts[0]);
              
              items.push({
                key: folderPath,
                name: relativePathParts[0],
                isFolder: true,
                parentFolder: directoryPath,
                lastModified: item.lastModified,
                isProtected
              });
            }
          }
        }
      }
      // Not a folder itself, but might be in a subfolder
      else {
        // For files at root, include only if they're direct children
        if (directoryPath === '/') {
          // Check if the file contains any subdirectories
          if (relativePath.includes('/')) {
            // Extract the top-level folder
            const topFolder = relativePath.split('/')[0];
            const folderPath = `/${topFolder}/`;
            
            // Add the folder if we haven't seen it yet
            if (!seenFolders.has(folderPath)) {
              seenFolders.add(folderPath);
              
              // Check if this is a protected folder
              const isProtected = PROTECTED_FOLDERS.includes(topFolder);
              
              items.push({
                key: folderPath,
                name: topFolder,
                isFolder: true,
                parentFolder: directoryPath,
                lastModified: item.lastModified,
                isProtected
              });
            }
          }
          // Direct file in the root folder (no subdirectories)
          else {
            // Check if this file belongs to a protected folder
            const isInProtectedFolder = PROTECTED_FOLDERS.includes(relativePath.split('/')[0]);
            
            items.push({
              key: item.path,
              name: relativePath,
              isFolder: false,
              parentFolder: directoryPath,
              lastModified: item.lastModified,
              size: item.size,
              isProtected: isInProtectedFolder
            });
          }
        }
        // For files in subfolders, check if they belong to the current folder
        else {
          const relativeToCurrentDir = relativePath.replace(directoryPath.substring(1), '');
          
          // If the file has no additional path separators, it's in this directory
          if (!relativeToCurrentDir.includes('/')) {
            // Check if this file belongs to a protected folder
            const currentFolder = directoryPath.split('/').filter(Boolean).pop() || '';
            const isInProtectedFolder = PROTECTED_FOLDERS.includes(currentFolder);
            
            items.push({
              key: item.path,
              name: relativeToCurrentDir,
              isFolder: false,
              parentFolder: directoryPath,
              lastModified: item.lastModified,
              size: item.size,
              isProtected: isInProtectedFolder
            });
          }
          // Otherwise, it's in a subfolder - add the subfolder
          else {
            const subfolder = relativeToCurrentDir.split('/')[0];
            const folderPath = `${directoryPath}${subfolder}/`;
            
            if (!seenFolders.has(folderPath)) {
              seenFolders.add(folderPath);
              
              // Check if this is a protected folder
              const isProtected = PROTECTED_FOLDERS.includes(subfolder);
              
              items.push({
                key: folderPath,
                name: subfolder,
                isFolder: true,
                parentFolder: directoryPath,
                lastModified: item.lastModified,
                isProtected
              });
            }
          }
        }
      }
    }
    
      // Sort: folders first, then files alphabetically
      const sortedItems = items.sort((a, b) => {
        if (a.name === '..') return -1;
        if (b.name === '..') return 1;
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      
      // Store in cache
      if (!userCache) {
        fileListCache.set(userId, new Map());
      }
      fileListCache.get(userId)!.set(directoryPath, sortedItems);
      fileListCacheTimestamp.set(userId, now);
      
      return sortedItems;
    } catch (error) {
      devError('[listUserFiles] Error listing files:', error);
      throw error;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(cacheKey);
    }
  })();
  
  // Store pending request
  pendingRequests.set(cacheKey, requestPromise);
  
  return requestPromise;
};

/**
 * List files and folders with permissions - OPTIMIZED with batch permission loading
 */
export const listUserFilesWithPermissions = async (userId: string, path: string = '/'): Promise<EnhancedS3Item[]> => {
  try {
    // Load all permissions for this user into cache FIRST (single API call)
    await loadUserPermissionsIntoCache(userId);
    
    // Get basic file listing
    const items = await listUserFiles(userId, path);
    
    // Enhance with permissions (now using cache, no additional API calls)
    const enhancedItems: EnhancedS3Item[] = [];
    const userPrefix = `users/${userId}/`;
    
    for (const item of items) {
      if (item.isFolder) {
        // Extract folder path from item.key (remove users/{userId}/ prefix)
        let folderPath = item.key;
        if (folderPath.startsWith(userPrefix)) {
          folderPath = folderPath.substring(userPrefix.length);
        }
        const normalizedFolderPath = normalizeFolderPath(folderPath);
        
        const permissions = await getEffectiveFolderPermissions(userId, normalizedFolderPath);
        // Set isProtected based on permissions: if folder has any restrictions, mark as protected
        const hasPermissionRestrictions = permissions.downloadRestricted || permissions.uploadRestricted;
        const isProtected = hasPermissionRestrictions || item.isProtected;
        
        enhancedItems.push({
          ...item,
          isProtected,
          permissions: {
            // Ensure boolean values (not null/undefined)
            downloadRestricted: permissions.downloadRestricted === true,
            uploadRestricted: permissions.uploadRestricted === true,
            canCreateSubfolders: permissions.canCreateSubfolders === true,
            canDeleteFolder: permissions.canDeleteFolder === true && !isProtected
          }
        });
      } else {
        // For files, get parent folder permissions (from cache)
        const parentPath = getParentPath(item.key);
        let folderPath = parentPath;
        if (folderPath.startsWith(userPrefix)) {
          folderPath = folderPath.substring(userPrefix.length);
        }
        const normalizedFolderPath = normalizeFolderPath(folderPath);
        
        const permissions = await getEffectiveFolderPermissions(userId, normalizedFolderPath);
        const hasPermissionRestrictions = permissions.downloadRestricted || permissions.uploadRestricted;
        const isProtected = hasPermissionRestrictions || item.isProtected;
        
        enhancedItems.push({
          ...item,
          isProtected,
          permissions: {
            // Ensure boolean values (not null/undefined)
            downloadRestricted: permissions.downloadRestricted === true,
            uploadRestricted: permissions.uploadRestricted === true,
            canCreateSubfolders: false,
            canDeleteFolder: false
          }
        });
      }
    }
    
    return enhancedItems;
  } catch (error) {
    devError('Error listing files with permissions:', error);
    // Fallback to basic listing with default permissions
    const basicItems = await listUserFiles(userId, path);
    return basicItems.map(item => ({
      ...item,
      permissions: {
        downloadRestricted: false,
        uploadRestricted: false,
        canCreateSubfolders: !item.isProtected,
        canDeleteFolder: !item.isProtected
      }
    }));
  }
};

/**
 * Create a new subfolder
 */
export const createSubfolder = async (userId: string, parentPath: string, folderName: string): Promise<void> => {
  try {
    // Validate folder name
    if (!folderName || folderName.trim() === '') {
      throw new Error('Folder name cannot be empty');
    }

    if (!/^[a-zA-Z0-9\-_\s]+$/.test(folderName)) {
      throw new Error('Folder name can only contain letters, numbers, hyphens, underscores, and spaces');
    }

    // Check permissions
    const permissions = await getEffectiveFolderPermissions(userId, parentPath);
    if (!permissions.canCreateSubfolders) {
      throw new Error('You do not have permission to create subfolders in this location');
    }

    // Normalize folder name (replace spaces with hyphens, lowercase)
    const normalizedName = folderName.trim().toLowerCase().replace(/\s+/g, '-');
    
    // Create the folder path
    const newFolderPath = parentPath === '/' 
      ? `/${normalizedName}/`
      : `${parentPath}${normalizedName}/`;

    // Create the full S3 key
    const fullPath = `users/${userId}${newFolderPath}`;

    // Create the folder by uploading an empty file
    await uploadData({
      path: fullPath,
      data: new Blob([''], { type: 'text/plain' }),
      options: {
        contentType: 'text/plain'
      }
    });
    
    // Invalidate file list cache for this user
    invalidateFileListCache(userId);

    // Invalidate file count cache for parent folder
    invalidateFileCountCache(userId);
  } catch (error) {
    devError('Error creating subfolder:', error);
    throw error;
  }
};

/**
 * Get a download URL for a file
 */
export const getFileUrl = async (key: string): Promise<string> => {
  try {
    const result = await getUrl({
      path: key
    });
    return result.url.toString();
  } catch (error) {
    devError('Error getting file URL:', error);
    throw error;
  }
};

/**
 * Check if a path is protected from deletion
 */
export const isProtectedPath = (key: string): boolean => {
  // Check if this is one of the protected folders or a file within them
  return PROTECTED_FOLDERS.some(folder => {
    const regex = new RegExp(`/users/[^/]+/${folder}(/|$)`);
    return regex.test(key);
  });
};

/**
 * Delete a file or folder
 */
export const deleteFile = async (key: string): Promise<void> => {
  try {
    // Check if this is a protected path
    if (isProtectedPath(key)) {
      throw new Error('This item is protected and cannot be deleted');
    }
    
    // Extract userId for cache invalidation
    const match = key.match(/^users\/([^/]+)\//);
    if (match) {
      const userId = match[1];
      invalidateFileCountCache(userId);
    }
    
    // Delete the file
    await remove({
      path: key
    });
  } catch (error) {
    devError('Error deleting file:', error);
    throw error;
  }
};

/**
 * Delete a folder and all its contents
 */
export const deleteFolder = async (key: string): Promise<void> => {
  try {
    // Check if this is a protected folder
    if (isProtectedPath(key)) {
      throw new Error('This folder is protected and cannot be deleted');
    }
    
    // Extract userId for cache invalidation
    const match = key.match(/^users\/([^/]+)\//);
    if (match) {
      const userId = match[1];
      invalidateFileCountCache(userId);
      invalidateFileListCache(userId);
    }
    
    // List all items in the folder
    const result = await list({
      path: key,
    });
    
    // Check if any item in the folder is protected
    const hasProtectedItems = result.items.some(item => isProtectedPath(item.path));
    if (hasProtectedItems) {
      throw new Error('This folder contains protected items and cannot be deleted');
    }
    
    // Delete all items in the folder
    const deletePromises = result.items.map(item => 
      remove({ path: item.path })
    );
    
    // Wait for all delete operations to complete
    await Promise.all(deletePromises);
    
    // Delete the folder itself (represented by an empty object)
    await remove({ path: key });
  } catch (error) {
    devError('Error deleting folder:', error);
    throw error;
  }
};

/**
 * Delete a folder with permission checks
 */
export const deleteFolderWithPermissions = async (userId: string, folderPath: string): Promise<void> => {
  try {
    // Check if this is a protected folder
    if (isProtectedPath(`users/${userId}${folderPath}`)) {
      throw new Error('This folder is protected and cannot be deleted');
    }

    // Check permissions
    const permissions = await getEffectiveFolderPermissions(userId, folderPath);
    if (!permissions.canDeleteFolder) {
      throw new Error('You do not have permission to delete this folder');
    }

    // Proceed with deletion
    await deleteFolder(`users/${userId}${folderPath}`);
  } catch (error) {
    devError('Error deleting folder:', error);
    throw error;
  }
};

/**
 * Check if user can upload to a specific path
 * @param userId - The user ID
 * @param path - The folder path (e.g., '/audit-report/')
 * @returns true if user can upload to this folder
 */
export const canUploadToPath = async (userId: string, path: string): Promise<boolean> => {
  try {
    // Ensure path ends with slash for folder paths
    const folderPath = path.endsWith('/') ? path : `${path}/`;
    // Check permissions for the folder itself (permissions are set on folders)
    const permissions = await getEffectiveFolderPermissions(userId, folderPath);
    // Treat null/undefined as false (not restricted) - only explicitly true means restricted
    const isRestricted = permissions.uploadRestricted === true;
    devLog('[canUploadToPath] Checking upload permission:', {
      path: folderPath,
      uploadRestricted: permissions.uploadRestricted,
      isRestricted,
      canUpload: !isRestricted
    });
    return !isRestricted;
  } catch (error) {
    devError('Error checking upload permissions:', error);
    return false;
  }
};

/**
 * Check if user can download from a specific path
 */
export const canDownloadFromPath = async (userId: string, path: string): Promise<boolean> => {
  try {
    const parentPath = getParentPath(path);
    const permissions = await getEffectiveFolderPermissions(userId, parentPath);
    return !permissions.downloadRestricted;
  } catch (error) {
    devError('Error checking download permissions:', error);
    return false;
  }
};

/**
 * Check if a folder is visible to a user
 */
export const isFolderVisible = async (userId: string, folderPath: string): Promise<boolean> => {
  try {
    const permissions = await getEffectiveFolderPermissions(userId, folderPath);
    return permissions.isVisible;
  } catch (error) {
    devError('Error checking folder visibility:', error);
    // Default to visible on error to avoid breaking existing functionality
    return true;
  }
};

/**
 * Get parent path from a file/folder path
 */
const getParentPath = (path: string): string => {
  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 2) return '/'; // users/userId/ -> /
  
  // Remove users/userId prefix and get parent
  const relativeParts = parts.slice(2);
  if (relativeParts.length === 0) return '/';
  
  relativeParts.pop(); // Remove last part (file or folder name)
  return relativeParts.length === 0 ? '/' : `/${relativeParts.join('/')}/`;
};

export { FOLDER_DISPLAY_NAMES, PROTECTED_FOLDERS };