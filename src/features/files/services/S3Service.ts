// src/features/files/services/S3Service.ts
import { list, getUrl, remove, uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
// import { getCurrentUser } from 'aws-amplify/auth';
import { S3Item } from '../../../types';

const client = generateClient();

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

const getFolderPermissionQuery = /* GraphQL */ `
  query GetFolderPermission($userId: String!, $folderPath: String!) {
    listFolderPermissions(
      filter: { 
        userId: { eq: $userId },
        folderPath: { eq: $folderPath }
      },
      limit: 1
    ) {
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
      lastModifiedBy
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
    console.error('Error fetching folder permissions:', error);
    return []; // Return empty array instead of throwing to prevent UI breaks
  }
};

/**
 * Get permissions for a specific folder
 */
export const getFolderPermission = async (userId: string, folderPath: string): Promise<FolderPermissions | null> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ listFolderPermissions: { items: FolderPermissions[] } }>>({
      query: getFolderPermissionQuery,
      variables: { userId, folderPath },
      authMode: 'userPool'
    });

    const items = response.data?.listFolderPermissions?.items || [];
    return items.length > 0 ? items[0] : null;
  } catch (error) {
    console.error('Error fetching folder permission:', error);
    return null; // Return null instead of throwing to prevent UI breaks
  }
};

/**
 * Create or update folder permissions
 */
export const setFolderPermissions = async (permissions: Omit<FolderPermissions, 'id' | 'createdAt' | 'updatedAt'>): Promise<FolderPermissions> => {
  try {
    // Check if permissions already exist
    const existing = await getFolderPermission(permissions.userId, permissions.folderPath);
    
    if (existing) {
      // Update existing permissions
      const response = await client.graphql<GraphQLQuery<{ updateFolderPermission: FolderPermissions }>>({
        query: updateFolderPermissionMutation,
        variables: {
          input: {
            id: existing.id,
            downloadRestricted: permissions.downloadRestricted,
            uploadRestricted: permissions.uploadRestricted,
            canCreateSubfolders: permissions.canCreateSubfolders,
            canDeleteFolder: permissions.canDeleteFolder,
            inheritFromParent: permissions.inheritFromParent,
            isVisible: permissions.isVisible,
            lastModifiedBy: permissions.lastModifiedBy
          }
        },
        authMode: 'userPool'
      });

      return response.data!.updateFolderPermission;
    } else {
      // Create new permissions
      const response = await client.graphql<GraphQLQuery<{ createFolderPermission: FolderPermissions }>>({
        query: createFolderPermissionMutation,
        variables: { input: permissions },
        authMode: 'userPool'
      });

      return response.data!.createFolderPermission;
    }
  } catch (error) {
    console.error('Error setting folder permissions:', error);
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
    console.error('Error deleting folder permissions:', error);
    throw error;
  }
};

/**
 * Get effective permissions for a folder (considering inheritance)
 */
export const getEffectiveFolderPermissions = async (userId: string, folderPath: string): Promise<FolderPermissions> => {
  try {
    // Get direct permissions for this folder
    const directPermissions = await getFolderPermission(userId, folderPath);
    
    if (directPermissions && !directPermissions.inheritFromParent) {
      return directPermissions;
    }

    // If inheriting from parent or no permissions set, traverse up the path
    const pathParts = folderPath.split('/').filter(Boolean);
    
    // Default permissions if none found (permissive defaults)
    const defaultPermissions: FolderPermissions = {
      userId,
      folderPath,
      downloadRestricted: false,
      uploadRestricted: false,
      canCreateSubfolders: true,
      canDeleteFolder: true,
      inheritFromParent: true,
      isVisible: true
    };

    // Check parent folders
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const parentPath = '/' + pathParts.slice(0, i).join('/') + '/';
      const parentPermissions = await getFolderPermission(userId, parentPath);
      
      if (parentPermissions && !parentPermissions.inheritFromParent) {
        return {
          ...parentPermissions,
          folderPath, // Keep the original folder path
          inheritFromParent: true // Mark as inherited
        };
      }
    }

    return defaultPermissions;
  } catch (error: any) {
    // Check if it's an authorization error
    const isAuthError = error?.errors?.some((e: any) => 
      e.errorType === 'Unauthorized' || 
      e.message?.includes('Not Authorized') ||
      e.message?.includes('unauthorized')
    );
    
    if (isAuthError) {
      console.warn('Authorization error getting folder permissions - returning restrictive defaults:', error);
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
    
    console.error('Error getting effective folder permissions:', error);
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
 * List files and folders at a specific path for a user
 */
export const listUserFiles = async (userId: string, path: string = '/'): Promise<S3Item[]> => {
  try {
    // Ensure path ends with a slash for directory listing
    const directoryPath = path.endsWith('/') ? path : `${path}/`;
    
    // Format the full path including the 'users/' prefix and user ID
    // This matches the structure created in the post-confirmation function
    const fullPath = directoryPath === '/' 
      ? `users/${userId}/` 
      : `users/${userId}${directoryPath}`;
    
    console.log('Listing files at path:', fullPath);
    
    // List objects from S3
    const result = await list({
      path: fullPath,
      options: {
        // In Amplify v6, we don't need to specify pageSize as it handles pagination differently
      }
    });
    
    console.log('List result:', result);
    
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
    return items.sort((a, b) => {
      if (a.name === '..') return -1;
      if (b.name === '..') return 1;
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

/**
 * List files and folders with permissions
 */
export const listUserFilesWithPermissions = async (userId: string, path: string = '/'): Promise<EnhancedS3Item[]> => {
  try {
    // Get basic file listing
    const items = await listUserFiles(userId, path);
    
    // Enhance with permissions
    const enhancedItems: EnhancedS3Item[] = [];
    
    for (const item of items) {
      if (item.isFolder) {
        const permissions = await getEffectiveFolderPermissions(userId, item.key);
        enhancedItems.push({
          ...item,
          permissions: {
            downloadRestricted: permissions.downloadRestricted,
            uploadRestricted: permissions.uploadRestricted,
            canCreateSubfolders: permissions.canCreateSubfolders,
            canDeleteFolder: permissions.canDeleteFolder && !item.isProtected
          }
        });
      } else {
        // For files, get parent folder permissions
        const parentPath = getParentPath(item.key);
        const permissions = await getEffectiveFolderPermissions(userId, parentPath);
        enhancedItems.push({
          ...item,
          permissions: {
            downloadRestricted: permissions.downloadRestricted,
            uploadRestricted: permissions.uploadRestricted,
            canCreateSubfolders: false, // Files can't have subfolders
            canDeleteFolder: false // Files are not folders
          }
        });
      }
    }
    
    return enhancedItems;
  } catch (error) {
    console.error('Error listing files with permissions:', error);
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

    console.log(`Successfully created folder: ${fullPath}`);
  } catch (error) {
    console.error('Error creating subfolder:', error);
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
    console.error('Error getting file URL:', error);
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
    
    // Delete the file
    await remove({
      path: key
    });
    
    console.log(`Successfully deleted: ${key}`);
  } catch (error) {
    console.error('Error deleting file:', error);
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
    
    console.log(`Successfully deleted folder: ${key}`);
  } catch (error) {
    console.error('Error deleting folder:', error);
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
    console.error('Error deleting folder:', error);
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
    return !permissions.uploadRestricted;
  } catch (error) {
    console.error('Error checking upload permissions:', error);
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
    console.error('Error checking download permissions:', error);
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
    console.error('Error checking folder visibility:', error);
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