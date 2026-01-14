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
  GetUserCommand,
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
 * Validate Cognito token and check if user is admin or developer
 * Verifies JWT signature using Cognito's JWKS endpoint and checks user groups
 * 
 * Security measures:
 * 1. Verifies JWT signature using Cognito's public keys (JWKS)
 * 2. Validates token issuer matches our User Pool
 * 3. Checks token expiration
 * 4. Ensures only admin/developer users can access
 */
async function validateTokenAndCheckPermissions(authHeader: string | undefined): Promise<{ userId: string; isAdmin: boolean; isDeveloper: boolean }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const userPoolId = getUserPoolId();
  const region = process.env.AWS_REGION || 'us-east-1';

  try {
    // Decode JWT (without verification first to get header info)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const header = JSON.parse(
      Buffer.from(tokenParts[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    const payload = JSON.parse(
      Buffer.from(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );

    // Basic validation checks
    const expectedIssuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    if (payload.iss !== expectedIssuer) {
      throw new Error('Token issuer mismatch');
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token has expired');
    }

    // Verify JWT signature using Cognito's JWKS
    // This is critical - without signature verification, tokens can be forged
    const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    const jwksResponse = await fetch(jwksUrl);
    if (!jwksResponse.ok) {
      throw new Error('Failed to fetch JWKS from Cognito');
    }
    const jwks = await jwksResponse.json();

    // Find the key that matches the token's kid
    const key = jwks.keys.find((k: any) => k.kid === header.kid);
    if (!key) {
      throw new Error('No matching key found in JWKS - token may be invalid');
    }

    // Verify signature using Node.js crypto
    const crypto = await import('crypto');
    
    // Create public key from JWK
    const publicKey = crypto.createPublicKey({
      key: {
        kty: key.kty,
        n: key.n,
        e: key.e,
      },
      format: 'jwk',
    });

    // Verify the signature
    const signature = Buffer.from(tokenParts[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const dataToVerify = Buffer.from(`${tokenParts[0]}.${tokenParts[1]}`);
    
    const verified = crypto.verify(
      'RSA-SHA256',
      dataToVerify,
      publicKey,
      signature
    );

    if (!verified) {
      throw new Error('Token signature verification failed - token may be forged');
    }

    // Extract user info from verified token
    const userId = payload.sub as string;
    const groups = (payload['cognito:groups'] as string[]) || [];
    const isAdmin = groups.includes('admin');
    const isDeveloper = groups.includes('developer');

    // Authorization check: Only admins and developers can call this function
    if (!isAdmin && !isDeveloper) {
      throw new Error('Unauthorized: User must be admin or developer');
    }

    console.log(`Token validated successfully for user ${userId}, admin: ${isAdmin}, developer: ${isDeveloper}`);
    return { userId, isAdmin, isDeveloper };
  } catch (error: any) {
    console.error('Token validation error:', error);
    throw new Error(`Token validation failed: ${error.message}`);
  }
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

    // Handle CORS preflight OPTIONS request
    // Check multiple possible event structures for Function URL
    const method = event.requestContext?.http?.method || 
                   event.requestContext?.httpMethod || 
                   event.httpMethod ||
                   event.requestContext?.method;
    
      if (method === 'OPTIONS') {
      console.log('Handling OPTIONS preflight request');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
        body: '',
      };
    }

    // Handle HTTP requests (Gen 2 functions expose HTTP endpoints)
    if (event.requestContext) {
      // Validate authentication token
      const authHeader = event.headers?.authorization || event.headers?.Authorization;
      let callerInfo;
      try {
        callerInfo = await validateTokenAndCheckPermissions(authHeader);
      } catch (error: any) {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
          },
          body: JSON.stringify({
            success: false,
            error: error.message || 'Unauthorized',
          }),
        };
      }

      const body = event.body ? JSON.parse(event.body) : {};
      const { action, userId, isAdmin, isDeveloper } = body as SyncRequest;

      if (action === 'syncFromCognito') {
        const result = await syncFromCognito();
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-amz-date, x-amz-security-token',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-amz-date, x-amz-security-token',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
    };
  }
};
