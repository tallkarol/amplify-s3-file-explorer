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

// Create the Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ 
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1' 
});
const USER_POOL_ID = process.env.REACT_APP_USER_POOL_ID || '';

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
export const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> => {
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

// Add these to src/features/clients/services/clientService.ts

/**
 * Suspends a user account
 */
export const suspendUserAccount = async (userId: string): Promise<void> => {
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
    
    // Step 3: Update the user's status in the database
    await updateUserStatus(userId, 'suspended');
    
    // Step 4: Log the action for audit purposes
    const logEntry = {
      action: 'SUSPEND_USER',
      userId: userId,
      performedBy: 'current-user-id', // Replace with actual current user ID
      timestamp: new Date().toISOString()
    };
    console.log('Audit log:', logEntry);
    
    // TODO: Add proper audit logging to database
  } catch (error) {
    console.error('Error suspending user account:', error);
    throw error;
  }
};

/**
 * Reactivates a suspended user account
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