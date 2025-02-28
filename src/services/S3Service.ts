// src/services/s3Service.ts
import { list, getUrl, remove } from 'aws-amplify/storage';
import { S3Item } from '../types';

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
    const folderPaths = new Set<string>();
    
    // If we're not at the root level of the user's folder, add a parent folder
    if (directoryPath !== '/' && !directoryPath.endsWith(`users/${userId}/`)) {
      const parentPath = directoryPath.split('/').slice(0, -2).join('/') + '/';
      items.push({
        key: parentPath,
        name: '..',
        isFolder: true,
        parentFolder: directoryPath,
        size: 0
      });
    }
    
    // Process the results
    result.items.forEach(item => {
      // Skip the current directory placeholder
      if (item.path === fullPath) return;
      
      // Extract relative path from the item key (remove the 'users/userId/' prefix)
      const relativePath = item.path.replace(fullPath, '');
      
      // If the item has a trailing slash or has a slash in the relative path, it's a folder or subfolder
      const isItemFolder = item.path.endsWith('/') || relativePath.includes('/');
      
      if (isItemFolder) {
        // Extract the folder name
        let folderPath: string;
        
        if (item.path.endsWith('/')) {
          // Direct subfolder
          folderPath = item.path;
        } else {
          // Nested subfolder, extract the top level folder
          const parts = relativePath.split('/');
          folderPath = `${fullPath}${parts[0]}/`;
        }
        
        // Avoid duplicate folders
        if (!folderPaths.has(folderPath)) {
          folderPaths.add(folderPath);
          
          // Get just the folder name from the path
          const folderName = folderPath
            .split('/')
            .filter(Boolean)
            .pop() || '';
          
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
      } else {
        // It's a file
        const fileName = relativePath.split('/').pop() || '';
        
        // Check if this file belongs to a protected folder
        const isInProtectedFolder = PROTECTED_FOLDERS.some(folder => 
          item.path.includes(`users/${userId}/${folder}/`)
        );
        
        items.push({
          key: item.path,
          name: fileName,
          isFolder: false,
          parentFolder: directoryPath,
          lastModified: item.lastModified,
          size: item.size,
          isProtected: isInProtectedFolder
        });
      }
    });
    
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