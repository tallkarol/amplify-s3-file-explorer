// src/services/s3Service.ts
import { list, getUrl, remove } from 'aws-amplify/storage';
import { S3Item } from '../types';

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
    
    // Format the full path including the user ID
    const fullPath = userId === path ? '' : `${userId}${directoryPath === '/' ? '/' : directoryPath}`;
    
    // List objects from S3
    const result = await list({
      path: fullPath,
      options: {
        // In Amplify v6, we don't need to specify pageSize as it handles pagination differently
      }
    });
    
    // Process and organize the results
    const items: S3Item[] = [];
    const folderPaths = new Set<string>();
    
    // If we're not at the root level of the user's folder, add a parent folder
    if (directoryPath !== '/' && directoryPath !== `/${userId}/`) {
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
      
      // Extract relative path from the item key
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
          
          items.push({
            key: folderPath,
            name: folderName,
            isFolder: true,
            parentFolder: directoryPath,
            lastModified: item.lastModified
          });
        }
      } else {
        // It's a file
        const fileName = relativePath.split('/').pop() || '';
        
        items.push({
          key: item.path,
          name: fileName,
          isFolder: false,
          parentFolder: directoryPath,
          lastModified: item.lastModified,
          size: item.size
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
 * Delete a file or folder
 * 
 * @param key - The full S3 key of the file or folder
 * @returns A promise that resolves when the delete operation is complete
 */
export const deleteFile = async (key: string): Promise<void> => {
  try {
    await remove({
      path: key
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};