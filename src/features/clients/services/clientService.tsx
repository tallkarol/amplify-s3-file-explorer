// src/features/clients/services/clientService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { UserProfile } from '@/types';
import { CognitoIdentityProviderClient, AdminDisableUserCommand, AdminEnableUserCommand } from "@aws-sdk/client-cognito-identity-provider";

interface ListUserProfilesResponse {
  listUserProfiles: {
    items: UserProfile[];
  };
}

// Create a client for making GraphQL requests
const client = generateClient();

// Create the Cognito client - FIX: Replace process.env with import.meta.env for Vite
const cognitoClient = new CognitoIdentityProviderClient({ 
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1' 
});
const USER_POOL_ID = import.meta.env.VITE_USER_POOL_ID || '';

/**
 * Disables a user in Cognito
 */
export const disableCognitoUser = async (username: string): Promise<void> => {
  try {
    const command = new AdminDisableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username
    });
    
    await cognitoClient.send(command);
    console.log(`Cognito user ${username} disabled successfully`);
  } catch (error) {
    console.error('Error disabling Cognito user:', error);
    throw error;
  }
};

/**
 * Enables a user in Cognito
 */
export const enableCognitoUser = async (username: string): Promise<void> => {
  try {
    const command = new AdminEnableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username
    });
    
    await cognitoClient.send(command);
    console.log(`Cognito user ${username} enabled successfully`);
  } catch (error) {
    console.error('Error enabling Cognito user:', error);
    throw error;
  }
};



// Define query to fetch users
const listUserProfilesQuery = /* GraphQL */ `
  query ListUserProfiles {
    listUserProfiles {
      items {
        id
        email
        uuid
        profileOwner
        firstName
        lastName
        companyName
        phoneNumber
        preferredContactMethod
        createdAt
        status
      }
    }
  }
`;

/**
 * Fetches all user profiles
 * @returns Promise resolving to an array of user profiles
 */
export const fetchAllClients = async (): Promise<UserProfile[]> => {
  try {
    const response = await client.graphql<GraphQLQuery<ListUserProfilesResponse>>({
      query: listUserProfilesQuery,
      authMode: 'userPool'
    });
    
    return response?.data?.listUserProfiles?.items || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Sends a password reset request for a user
 * @param userId The ID of the user
 */
export const resetUserPassword = async (userId: string): Promise<void> => {
  // Implementation will come later
  console.log(`Password reset requested for user ${userId}`);
};

/**
 * Updates a user's status in the UserProfile table
 */
export const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'deleted'): Promise<void> => {
  try {
    // First get the profile ID
    const userProfileQuery = /* GraphQL */ `
      query GetUserProfileByUuid($uuid: String!) {
        listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 1) {
          items {
            id
          }
        }
      }
    `;

    const response = await client.graphql<GraphQLQuery<any>>({
      query: userProfileQuery,
      variables: { uuid: userId },
      authMode: 'userPool'
    });

    const profileId = response.data?.listUserProfiles?.items[0]?.id;
    
    if (!profileId) {
      throw new Error('User profile not found');
    }

    // Update the profile status
    const updateProfileMutation = /* GraphQL */ `
      mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
        updateUserProfile(input: $input) {
          id
          status
        }
      }
    `;

    await client.graphql<GraphQLQuery<any>>({
      query: updateProfileMutation,
      variables: {
        input: {
          id: profileId,
          status
        }
      },
      authMode: 'userPool'
    });
    
    console.log(`User profile ${profileId} status updated to: ${status}`);
  } catch (error) {
    console.error('Error updating user profile status:', error);
    throw error;
  }
};

/**
 * Get a user's current status
 */
export const getUserStatus = async (userId: string): Promise<string | null> => {
  try {
    const userProfileQuery = /* GraphQL */ `
      query GetUserProfileByUuid($uuid: String!) {
        listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 1) {
          items {
            status
          }
        }
      }
    `;

    const response = await client.graphql<GraphQLQuery<any>>({
      query: userProfileQuery,
      variables: { uuid: userId },
      authMode: 'userPool'
    });

    return response.data?.listUserProfiles?.items[0]?.status || null;
  } catch (error) {
    console.error('Error getting user status:', error);
    throw error;
  }
};

/**
 * Deactivates a user account (previously called "suspend")
 * Sets status to 'inactive' and disables Cognito login
 */
export const deactivateUserAccount = async (userId: string): Promise<void> => {
  try {
    // Step 1: Get the user's email/username
    const userProfileQuery = /* GraphQL */ `
      query GetUserProfileByUuid($uuid: String!) {
        listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 1) {
          items {
            email
            profileOwner
          }
        }
      }
    `;

    const response = await client.graphql<GraphQLQuery<any>>({
      query: userProfileQuery,
      variables: { uuid: userId },
      authMode: 'userPool'
    });

    const profile = response.data?.listUserProfiles?.items[0];
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Extract username from profileOwner or use email
    // profileOwner is in format "userId::username"
    let username;
    if (profile.profileOwner && profile.profileOwner.includes('::')) {
      username = profile.profileOwner.split('::')[1];
    } else {
      username = profile.email;
    }
    
    // Step 2: Disable the user in Cognito
    await disableCognitoUser(username);
    
    // Step 3: Update the user's status in the database to 'inactive'
    await updateUserStatus(userId, 'inactive');
    
    // Step 4: Log the action for audit purposes
    const logEntry = {
      action: 'DEACTIVATE_USER',
      userId: userId,
      performedBy: 'current-user-id', // Replace with actual current user ID
      timestamp: new Date().toISOString()
    };
    console.log('Audit log:', logEntry);
    
    // TODO: Add proper audit logging to database
  } catch (error) {
    console.error('Error deactivating user account:', error);
    throw error;
  }
};

/**
 * Legacy alias for backwards compatibility
 * @deprecated Use deactivateUserAccount instead
 */
export const suspendUserAccount = deactivateUserAccount;

/**
 * Reactivates an inactive user account
 */
export const reactivateUserAccount = async (userId: string): Promise<void> => {
  try {
    // Step 1: Get the user's email/username
    const userProfileQuery = /* GraphQL */ `
      query GetUserProfileByUuid($uuid: String!) {
        listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 1) {
          items {
            email
            profileOwner
            status
          }
        }
      }
    `;

    const response = await client.graphql<GraphQLQuery<any>>({
      query: userProfileQuery,
      variables: { uuid: userId },
      authMode: 'userPool'
    });

    const profile = response.data?.listUserProfiles?.items[0];
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Can only reactivate inactive users
    if (profile.status === 'deleted') {
      throw new Error('Cannot reactivate a deleted user. User must be permanently deleted and recreated.');
    }
    
    // Extract username from profileOwner or use email
    let username;
    if (profile.profileOwner && profile.profileOwner.includes('::')) {
      username = profile.profileOwner.split('::')[1];
    } else {
      username = profile.email;
    }
    
    // Step 2: Enable the user in Cognito
    await enableCognitoUser(username);
    
    // Step 3: Update the user's status in the database
    await updateUserStatus(userId, 'active');
    
    // Step 4: Log the action for audit purposes
    const logEntry = {
      action: 'REACTIVATE_USER',
      userId: userId,
      performedBy: 'current-user-id', // Replace with actual current user ID
      timestamp: new Date().toISOString()
    };
    console.log('Audit log:', logEntry);
    
    // TODO: Add proper audit logging to database
  } catch (error) {
    console.error('Error reactivating user account:', error);
    throw error;
  }
};

/**
 * Marks an inactive user as deleted
 * This is a soft delete - the user record remains but is marked as deleted
 * Files are preserved in S3
 */
export const markUserAsDeleted = async (userId: string): Promise<void> => {
  try {
    // Step 1: Get the user's current status
    const userProfileQuery = /* GraphQL */ `
      query GetUserProfileByUuid($uuid: String!) {
        listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 1) {
          items {
            id
            email
            profileOwner
            status
          }
        }
      }
    `;

    const response = await client.graphql<GraphQLQuery<any>>({
      query: userProfileQuery,
      variables: { uuid: userId },
      authMode: 'userPool'
    });

    const profile = response.data?.listUserProfiles?.items[0];
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Can only mark inactive users as deleted
    if (profile.status !== 'inactive') {
      throw new Error('User must be inactive before marking as deleted. Deactivate the user first.');
    }
    
    // Step 2: Update status to deleted
    await updateUserStatus(userId, 'deleted');
    
    // Step 3: Log the action for audit purposes
    const logEntry = {
      action: 'MARK_AS_DELETED',
      userId: userId,
      email: profile.email,
      performedBy: 'current-user-id', // Replace with actual current user ID
      timestamp: new Date().toISOString()
    };
    console.log('Audit log:', logEntry);
    
    // TODO: Add proper audit logging to database
    // Note: S3 files are intentionally NOT deleted for compliance
  } catch (error) {
    console.error('Error marking user as deleted:', error);
    throw error;
  }
};

/**
 * Permanently deletes a user account
 * This removes the user from Cognito and DynamoDB
 * Only works for users with status 'deleted'
 * S3 files are intentionally preserved for compliance
 */
export const permanentlyDeleteUser = async (userId: string): Promise<void> => {
  try {
    // Step 1: Get user profile and verify status
    const userProfileQuery = /* GraphQL */ `
      query GetUserProfileByUuid($uuid: String!) {
        listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 1) {
          items {
            id
            email
            profileOwner
            status
          }
        }
      }
    `;

    const response = await client.graphql<GraphQLQuery<any>>({
      query: userProfileQuery,
      variables: { uuid: userId },
      authMode: 'userPool'
    });

    const profile = response.data?.listUserProfiles?.items[0];
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Can only permanently delete users with 'deleted' status
    if (profile.status !== 'deleted') {
      throw new Error('User must be marked as deleted before permanent deletion. Current status: ' + profile.status);
    }
    
    // Extract username from profileOwner or use email
    let username;
    if (profile.profileOwner && profile.profileOwner.includes('::')) {
      username = profile.profileOwner.split('::')[1];
    } else {
      username = profile.email;
    }
    
    // Step 2: Delete from Cognito
    const { AdminDeleteUserCommand } = await import("@aws-sdk/client-cognito-identity-provider");
    const deleteCommand = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username
    });
    await cognitoClient.send(deleteCommand);
    
    // Step 3: Delete UserProfile from DynamoDB
    const deleteProfileMutation = /* GraphQL */ `
      mutation DeleteUserProfile($input: DeleteUserProfileInput!) {
        deleteUserProfile(input: $input) {
          id
        }
      }
    `;
    
    await client.graphql<GraphQLQuery<any>>({
      query: deleteProfileMutation,
      variables: {
        input: { id: profile.id }
      },
      authMode: 'userPool'
    });
    
    // Step 4: Delete related data (NotificationPreferences, FolderPermissions, etc.)
    // TODO: Add cleanup for NotificationPreferences
    // TODO: Add cleanup for FolderPermissions
    // TODO: Add cleanup for AdditionalContacts
    // TODO: Add cleanup for Notifications
    
    // Step 5: Log the action for audit purposes
    const logEntry = {
      action: 'PERMANENT_DELETE_USER',
      userId: userId,
      email: profile.email,
      username: username,
      performedBy: 'current-user-id', // Replace with actual current user ID
      timestamp: new Date().toISOString()
    };
    console.log('Audit log:', logEntry);
    
    // Note: S3 files are intentionally NOT deleted for compliance reasons
    // Files remain at users/{userId}/ and can be accessed by developers if needed
  } catch (error) {
    console.error('Error permanently deleting user:', error);
    throw error;
  }
};

/**
 * Admin triggers a password reset for a user
 * Sends a password reset email to the user via Cognito
 */
export const adminResetUserPassword = async (userId: string): Promise<void> => {
  try {
    // Step 1: Get the user's email/username
    const userProfileQuery = /* GraphQL */ `
      query GetUserProfileByUuid($uuid: String!) {
        listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 1) {
          items {
            email
            profileOwner
            status
          }
        }
      }
    `;

    const response = await client.graphql<GraphQLQuery<any>>({
      query: userProfileQuery,
      variables: { uuid: userId },
      authMode: 'userPool'
    });

    const profile = response.data?.listUserProfiles?.items[0];
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Cannot reset password for deleted users
    if (profile.status === 'deleted') {
      throw new Error('Cannot reset password for deleted users');
    }
    
    // Extract username from profileOwner or use email
    let username;
    if (profile.profileOwner && profile.profileOwner.includes('::')) {
      username = profile.profileOwner.split('::')[1];
    } else {
      username = profile.email;
    }
    
    // Step 2: Send password reset email via Cognito
    const { AdminResetUserPasswordCommand } = await import("@aws-sdk/client-cognito-identity-provider");
    const resetCommand = new AdminResetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username
    });
    
    await cognitoClient.send(resetCommand);
    
    // Step 3: Log the action for audit purposes
    const logEntry = {
      action: 'ADMIN_PASSWORD_RESET',
      userId: userId,
      email: profile.email,
      performedBy: 'current-user-id', // Replace with actual current user ID
      timestamp: new Date().toISOString()
    };
    console.log('Audit log:', logEntry);
    
    // TODO: Add proper audit logging to database
  } catch (error) {
    console.error('Error resetting user password:', error);
    throw error;
  }
};