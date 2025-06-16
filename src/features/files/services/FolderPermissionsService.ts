// src/features/files/services/FolderPermissionsService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';

const client = generateClient();

export interface FolderPermissions {
  id?: string;
  userId: string;
  folderPath: string;
  downloadRestricted: boolean;
  uploadRestricted: boolean;
  canCreateSubfolders: boolean;
  canDeleteFolder: boolean;
  inheritFromParent: boolean;
  createdBy?: string;
  lastModifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// GraphQL queries and mutations
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
    throw error;
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
    throw error;
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
    
    // Default permissions if none found
    const defaultPermissions: FolderPermissions = {
      userId,
      folderPath,
      downloadRestricted: false,
      uploadRestricted: false,
      canCreateSubfolders: true,
      canDeleteFolder: true,
      inheritFromParent: true
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
  } catch (error) {
    console.error('Error getting effective folder permissions:', error);
    throw error;
  }
};