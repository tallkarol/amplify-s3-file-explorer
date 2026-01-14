// amplify/functions/admin-sync/handler.ts
import type { Handler } from 'aws-lambda';
import { type Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/admin-sync';
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminListGroupsForUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';

// Merge the imported env with AWS environment variables into a single flat object.
const clientEnv = {
  ...env,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
  AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN!,
  AWS_REGION: process.env.AWS_REGION!,
  AMPLIFY_DATA_DEFAULT_NAME: process.env.AMPLIFY_DATA_DEFAULT_NAME!,
};

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(clientEnv);

Amplify.configure(resourceConfig, libraryOptions);

const dataClient = generateClient<Schema>();

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION! });

// Get User Pool ID from environment (will be set by Amplify)
const getUserPoolId = (): string => {
  // User Pool ID should be available in env or we can extract from auth resource
  // For now, we'll get it from the environment variable that Amplify sets
  const userPoolId = process.env.AMPLIFY_USER_POOL_ID || process.env.USER_POOL_ID;
  if (!userPoolId) {
    throw new Error('User Pool ID not found in environment variables');
  }
  return userPoolId;
};

interface SyncRequest {
  action: 'syncFromCognito' | 'updateUserAdminStatus';
  userId?: string;
  isAdmin?: boolean;
  isDeveloper?: boolean;
}

/**
 * Sync admin/developer status from Cognito groups to UserProfile
 */
async function syncFromCognito(): Promise<{ success: boolean; updated: number; errors: string[] }> {
  try {
    const userPoolId = getUserPoolId();
    const errors: string[] = [];
    let updatedCount = 0;

    // List all users in the User Pool
    let paginationToken: string | undefined;
    const allUsers: Array<{ userId: string; groups: string[] }> = [];

    do {
      const listUsersCommand = new ListUsersCommand({
        UserPoolId: userPoolId,
        PaginationToken: paginationToken,
        Limit: 60,
      });

      const response = await cognitoClient.send(listUsersCommand);
      
      if (response.Users) {
        // Get groups for each user
        for (const user of response.Users) {
          if (!user.Username) continue;
          
          try {
            const groupsCommand = new AdminListGroupsForUserCommand({
              UserPoolId: userPoolId,
              Username: user.Username,
            });
            
            const groupsResponse = await cognitoClient.send(groupsCommand);
            const groups = groupsResponse.Groups?.map(g => g.GroupName || '') || [];
            
            allUsers.push({
              userId: user.Username,
              groups,
            });
          } catch (error: any) {
            console.error(`Error getting groups for user ${user.Username}:`, error);
            errors.push(`Failed to get groups for user ${user.Username}: ${error.message}`);
          }
        }
      }

      paginationToken = response.PaginationToken;
    } while (paginationToken);

    console.log(`Found ${allUsers.length} users to sync`);

    // Update UserProfile records
    for (const { userId, groups } of allUsers) {
      try {
        const isAdmin = groups.includes('admin');
        const isDeveloper = groups.includes('developer');

        // Find existing UserProfile by uuid
        const profiles = await dataClient.models.UserProfile.list({
          filter: { uuid: { eq: userId } },
        });

        if (profiles.data && profiles.data.length > 0) {
          const profile = profiles.data[0];
          
          // Only update if values have changed
          if (profile.isAdmin !== isAdmin || profile.isDeveloper !== isDeveloper) {
            await dataClient.models.UserProfile.update({
              id: profile.id,
              isAdmin,
              isDeveloper,
            });
            updatedCount++;
            console.log(`Updated user ${userId}: admin=${isAdmin}, developer=${isDeveloper}`);
          }
        } else {
          console.warn(`UserProfile not found for user ${userId}, skipping`);
          errors.push(`UserProfile not found for user ${userId}`);
        }
      } catch (error: any) {
        console.error(`Error updating UserProfile for ${userId}:`, error);
        errors.push(`Failed to update UserProfile for ${userId}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      updated: updatedCount,
      errors,
    };
  } catch (error: any) {
    console.error('Error in syncFromCognito:', error);
    throw error;
  }
}

/**
 * Update user's admin/developer status in both Cognito and UserProfile
 */
async function updateUserAdminStatus(
  userId: string,
  isAdmin: boolean,
  isDeveloper: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const userPoolId = getUserPoolId();

    // Get current groups for the user
    const groupsCommand = new AdminListGroupsForUserCommand({
      UserPoolId: userPoolId,
      Username: userId,
    });
    
    const groupsResponse = await cognitoClient.send(groupsCommand);
    const currentGroups = groupsResponse.Groups?.map(g => g.GroupName || '') || [];
    const currentlyAdmin = currentGroups.includes('admin');
    const currentlyDeveloper = currentGroups.includes('developer');

    // Update Cognito groups
    if (isAdmin && !currentlyAdmin) {
      await cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: userId,
          GroupName: 'admin',
        })
      );
      console.log(`Added user ${userId} to admin group`);
    } else if (!isAdmin && currentlyAdmin) {
      await cognitoClient.send(
        new AdminRemoveUserFromGroupCommand({
          UserPoolId: userPoolId,
          Username: userId,
          GroupName: 'admin',
        })
      );
      console.log(`Removed user ${userId} from admin group`);
    }

    if (isDeveloper && !currentlyDeveloper) {
      await cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: userId,
          GroupName: 'developer',
        })
      );
      console.log(`Added user ${userId} to developer group`);
    } else if (!isDeveloper && currentlyDeveloper) {
      await cognitoClient.send(
        new AdminRemoveUserFromGroupCommand({
          UserPoolId: userPoolId,
          Username: userId,
          GroupName: 'developer',
        })
      );
      console.log(`Removed user ${userId} from developer group`);
    }

    // Update UserProfile
    const profiles = await dataClient.models.UserProfile.list({
      filter: { uuid: { eq: userId } },
    });

    if (profiles.data && profiles.data.length > 0) {
      const profile = profiles.data[0];
      await dataClient.models.UserProfile.update({
        id: profile.id,
        isAdmin,
        isDeveloper,
      });
      console.log(`Updated UserProfile for ${userId}`);
    } else {
      throw new Error(`UserProfile not found for user ${userId}`);
    }

    return {
      success: true,
      message: `Successfully updated admin status for user ${userId}`,
    };
  } catch (error: any) {
    console.error('Error in updateUserAdminStatus:', error);
    throw error;
  }
}

// HTTP handler for Gen 2 function endpoints
export const handler: Handler = async (event: any) => {
  try {
    console.log('Admin sync handler invoked:', JSON.stringify(event, null, 2));

    // Handle HTTP requests (Gen 2 functions expose HTTP endpoints)
    if (event.requestContext) {
      const body = event.body ? JSON.parse(event.body) : {};
      const { action, userId, isAdmin, isDeveloper } = body as SyncRequest;

      if (action === 'syncFromCognito') {
        const result = await syncFromCognito();
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
          },
          body: JSON.stringify(result),
        };
      } else if (action === 'updateUserAdminStatus') {
        if (!userId || isAdmin === undefined || isDeveloper === undefined) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              success: false,
              error: 'Missing required parameters: userId, isAdmin, isDeveloper',
            }),
          };
        }

        const result = await updateUserAdminStatus(userId, isAdmin, isDeveloper);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
          },
          body: JSON.stringify(result),
        };
      } else {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: false,
            error: `Unknown action: ${action}`,
          }),
        };
      }
    }

    // Fallback for direct invocation (testing)
    const { action, userId, isAdmin, isDeveloper } = event as SyncRequest;

    if (action === 'syncFromCognito') {
      return await syncFromCognito();
    } else if (action === 'updateUserAdminStatus') {
      if (!userId || isAdmin === undefined || isDeveloper === undefined) {
        throw new Error('Missing required parameters: userId, isAdmin, isDeveloper');
      }
      return await updateUserAdminStatus(userId, isAdmin, isDeveloper);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
    };
  }
};
