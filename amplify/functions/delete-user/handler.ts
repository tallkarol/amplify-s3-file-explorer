// amplify/functions/delete-user/handler.ts
import type { Handler } from 'aws-lambda';
import { type Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/delete-user';
import {
  CognitoIdentityProviderClient,
  AdminDisableUserCommand,
  AdminDeleteUserCommand,
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
  const userPoolId = process.env.AMPLIFY_USER_POOL_ID || process.env.USER_POOL_ID;
  if (!userPoolId) {
    throw new Error('User Pool ID not found in environment variables');
  }
  return userPoolId;
};

interface DeleteRequest {
  action: 'softDeleteUser' | 'hardDeleteUser';
  userId: string;
  isSelfDelete?: boolean; // For soft delete - user deleting themselves
}

/**
 * Validate Cognito token and extract user info
 * Verifies JWT signature using Cognito's JWKS endpoint
 * 
 * Security measures:
 * 1. Verifies JWT signature using Cognito's public keys (JWKS)
 * 2. Validates token issuer matches our User Pool
 * 3. Checks token expiration
 */
async function validateTokenAndCheckPermissions(
  authHeader: string | undefined,
  requireAdmin: boolean = false
): Promise<{ userId: string; isAdmin: boolean; isDeveloper: boolean }> {
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

    // Authorization check if admin/developer required
    if (requireAdmin && !isAdmin && !isDeveloper) {
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
 * Soft delete user: Disable in Cognito, mark as deleted in DB
 */
async function softDeleteUser(
  userId: string,
  callerId: string,
  isSelfDelete: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const userPoolId = getUserPoolId();

    // Authorization check
    if (isSelfDelete && callerId !== userId) {
      throw new Error('Unauthorized: Users can only delete themselves');
    }

    // Disable user in Cognito
    await cognitoClient.send(
      new AdminDisableUserCommand({
        UserPoolId: userPoolId,
        Username: userId,
      })
    );
    console.log(`Disabled user ${userId} in Cognito`);

    // Update UserProfile
    const profiles = await dataClient.models.UserProfile.list({
      filter: { uuid: { eq: userId } },
    });

    if (profiles.data && profiles.data.length > 0) {
      const profile = profiles.data[0];
      const now = new Date().toISOString();
      
      await dataClient.models.UserProfile.update({
        id: profile.id,
        status: 'inactive',
        isDeleted: true,
        deletedAt: now,
        deletedBy: callerId,
      });
      console.log(`Updated UserProfile for ${userId} - soft deleted`);
    } else {
      throw new Error(`UserProfile not found for user ${userId}`);
    }

    return {
      success: true,
      message: `Successfully soft deleted user ${userId}`,
    };
  } catch (error: any) {
    console.error('Error in softDeleteUser:', error);
    throw error;
  }
}

/**
 * Hard delete user: Truly delete from Cognito, mark as deleted in DB
 */
async function hardDeleteUser(
  userId: string,
  callerId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const userPoolId = getUserPoolId();

    // Safety check: Cannot hard delete yourself
    if (callerId === userId) {
      throw new Error('Cannot hard delete yourself');
    }

    // Delete user from Cognito
    await cognitoClient.send(
      new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: userId,
      })
    );
    console.log(`Deleted user ${userId} from Cognito`);

    // Update UserProfile (if not already updated)
    const profiles = await dataClient.models.UserProfile.list({
      filter: { uuid: { eq: userId } },
    });

    if (profiles.data && profiles.data.length > 0) {
      const profile = profiles.data[0];
      const now = new Date().toISOString();
      
      // Only update if not already deleted
      if (!profile.isDeleted) {
        await dataClient.models.UserProfile.update({
          id: profile.id,
          isDeleted: true,
          deletedAt: now,
          deletedBy: callerId,
        });
        console.log(`Updated UserProfile for ${userId} - hard deleted`);
      } else {
        // Update deletedBy if it wasn't set
        if (!profile.deletedBy) {
          await dataClient.models.UserProfile.update({
            id: profile.id,
            deletedBy: callerId,
          });
        }
      }
    } else {
      throw new Error(`UserProfile not found for user ${userId}`);
    }

    return {
      success: true,
      message: `Successfully hard deleted user ${userId}`,
    };
  } catch (error: any) {
    console.error('Error in hardDeleteUser:', error);
    throw error;
  }
}

// HTTP handler for Gen 2 function endpoints
export const handler: Handler = async (event: any) => {
  try {
    console.log('Delete user handler invoked:', JSON.stringify(event, null, 2));

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    };

    // Handle CORS preflight OPTIONS request
    const method = event.requestContext?.http?.method || 
                   event.requestContext?.httpMethod || 
                   event.httpMethod ||
                   event.requestContext?.method;
    
    if (method === 'OPTIONS') {
      console.log('Handling OPTIONS preflight request');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    // Handle HTTP requests (Gen 2 functions expose HTTP endpoints)
    if (event.requestContext) {
      // Validate authentication token
      const authHeader = event.headers?.authorization || event.headers?.Authorization;
      let callerInfo;
      
      const body = event.body ? JSON.parse(event.body) : {};
      const { action, userId, isSelfDelete } = body as DeleteRequest;

      // Determine if admin/developer is required
      // Hard delete always requires admin/dev
      // Soft delete requires admin/dev unless it's a self-delete
      const requireAdmin = action === 'hardDeleteUser' || (action === 'softDeleteUser' && !isSelfDelete);
      
      try {
        callerInfo = await validateTokenAndCheckPermissions(authHeader, requireAdmin);
        
        // Additional check for self-delete: caller must be the user being deleted
        if (action === 'softDeleteUser' && isSelfDelete && callerInfo.userId !== userId) {
          return {
            statusCode: 403,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
            body: JSON.stringify({
              success: false,
              error: 'Forbidden: Users can only delete themselves',
            }),
          };
        }
      } catch (error: any) {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
          body: JSON.stringify({
            success: false,
            error: error.message || 'Unauthorized',
          }),
        };
      }

      if (action === 'softDeleteUser') {
        if (!userId) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
            body: JSON.stringify({
              success: false,
              error: 'Missing required parameter: userId',
            }),
          };
        }

        const result = await softDeleteUser(userId, callerInfo.userId, isSelfDelete || false);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
          body: JSON.stringify(result),
        };
      } else if (action === 'hardDeleteUser') {
        if (!userId) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
            body: JSON.stringify({
              success: false,
              error: 'Missing required parameter: userId',
            }),
          };
        }

        // Hard delete requires admin/developer
        if (!callerInfo.isAdmin && !callerInfo.isDeveloper) {
          return {
            statusCode: 403,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
            body: JSON.stringify({
              success: false,
              error: 'Forbidden: Only admins and developers can hard delete users',
            }),
          };
        }

        const result = await hardDeleteUser(userId, callerInfo.userId);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
          body: JSON.stringify(result),
        };
      } else {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
          body: JSON.stringify({
            success: false,
            error: `Unknown action: ${action}`,
          }),
        };
      }
    }

    // Fallback for direct invocation (testing)
    const { action, userId, isSelfDelete } = event as DeleteRequest;

    if (action === 'softDeleteUser') {
      if (!userId) {
        throw new Error('Missing required parameter: userId');
      }
      // For direct invocation, we'd need caller info - this is mainly for testing
      throw new Error('Direct invocation not supported - use Function URL');
    } else if (action === 'hardDeleteUser') {
      if (!userId) {
        throw new Error('Missing required parameter: userId');
      }
      throw new Error('Direct invocation not supported - use Function URL');
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
    };
  }
};
