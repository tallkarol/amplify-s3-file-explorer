// src/services/s3Service.ts
import { list, getUrl, remove } from 'aws-amplify/storage';
import { S3Item } from '../../../types';

// Protected folders that should not be deleted
const PROTECTED_FOLDERS = [
  'certificate',
  'audit-report',
  'auditor-resume',
  'statistics'
];

/**
 * List files and folders at a specific path for a user
 * 
 * @param userId - The user's ID (Cognito sub)
 * @param path - The path to list items from (relative to the user's root)
 * @returns A promise that resolves to an array of S3Item objects
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
 * Get a download URL for a file
 * 
 * @param key - The full S3 key of the file
 * @returns A promise that resolves to a download URL
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
 * 
 * @param key - The full S3 key to check
 * @returns Boolean indicating if the path is protected
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
 * 
 * @param key - The full S3 key of the file or folder
 * @returns A promise that resolves when the delete operation is complete
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
 * 
 * @param key - The full folder key ending with /
 * @returns A promise that resolves when the delete operation is complete
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