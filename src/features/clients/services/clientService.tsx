// src/features/clients/services/clientService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { UserProfile } from '@/types';
import { CognitoIdentityProviderClient, AdminDisableUserCommand, AdminEnableUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import outputs from '../../../../amplify_outputs.json';

interface ListUserProfilesResponse {
  listUserProfiles: {
    items: UserProfile[];
  };
}

// Create a client for making GraphQL requests
const client = generateClient();

// Get User Pool ID and region from amplify_outputs.json
const getUserPoolId = (): string => {
  const outputsData = outputs as any;
  const userPoolId = outputsData?.auth?.user_pool_id;
  if (!userPoolId) {
    throw new Error('User Pool ID not found in amplify_outputs.json. Please ensure the auth resource is properly configured.');
  }
  return userPoolId;
};

const getAwsRegion = (): string => {
  const outputsData = outputs as any;
  return outputsData?.auth?.aws_region || outputsData?.data?.aws_region || 'us-east-1';
};

// Create the Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ 
  region: getAwsRegion()
});

/**
 * Disables a user in Cognito
 */
export const disableCognitoUser = async (username: string): Promise<void> => {
  try {
    const userPoolId = getUserPoolId();
    const command = new AdminDisableUserCommand({
      UserPoolId: userPoolId,
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
    const userPoolId = getUserPoolId();
    const command = new AdminEnableUserCommand({
      UserPoolId: userPoolId,
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
  query ListUserProfiles($filter: ModelUserProfileFilterInput) {
    listUserProfiles(filter: $filter) {
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
        isAdmin
        isDeveloper
        isDeleted
        deletedAt
        deletedBy
      }
    }
  }
`;

/**
 * Fetches all user profiles
 * @param includeDeleted - If true, includes deleted users. Defaults to false (filters out deleted users)
 * @returns Promise resolving to an array of user profiles
 */
export const fetchAllClients = async (includeDeleted: boolean = false): Promise<UserProfile[]> => {
  try {
    const filter = includeDeleted ? undefined : { isDeleted: { ne: true } };
    
    const response = await client.graphql<GraphQLQuery<ListUserProfilesResponse>>({
      query: listUserProfilesQuery,
      variables: filter ? { filter } : undefined,
      authMode: 'userPool'
    });
    
    return response?.data?.listUserProfiles?.items || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Sends a password reset email for a user via Lambda function
 * This generates a temporary password and sends it to the user's email
 * The user will be required to change their password on next login
 * @param userId The UUID of the user (Cognito username)
 * @returns Promise that resolves when the password reset email is sent
 */
export const resetUserPassword = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Import fetchAuthSession for authentication
    const { fetchAuthSession } = await import('aws-amplify/auth');
    
    console.log(`[resetUserPassword] Sending password reset email for user ${userId} via Lambda function`);

    // Get function URL from amplify_outputs.json
    const outputsData = outputs as any;
    const customFunctions = outputsData?.custom?.functions;
    const functionUrl = customFunctions?.adminSync?.endpoint;
    
    if (!functionUrl) {
      throw new Error('Admin sync function URL not configured. Please deploy the function first, then add it to amplify_outputs.json under: "custom": { "functions": { "adminSync": { "endpoint": "https://your-function-url.lambda-url.region.on.aws/" } } }');
    }
    
    // Get auth token
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    
    if (!token) {
      throw new Error('No authentication token available. Please sign in.');
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'resetUserPassword',
        userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[resetUserPassword] Lambda function error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log(`[resetUserPassword] Password reset email sent successfully for user ${userId}`);
    return result;
  } catch (error: any) {
    console.error(`[resetUserPassword] Error sending password reset email for user ${userId}:`, error);
    throw new Error(`Failed to send password reset email: ${error.message || 'Unknown error'}`);
  }
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