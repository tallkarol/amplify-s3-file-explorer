// src/services/adminService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@aws-sdk/protocol-http';
import outputs from '../../amplify_outputs.json';
// import { UserProfile } from '@/types';

const client = generateClient();

/**
 * Fetches all admin users from the system
 * Now uses the isAdmin field in UserProfile instead of querying all users
 */
export const getAllAdminUserIds = async (): Promise<string[]> => {
  try {
    const listAdminUsersQuery = /* GraphQL */ `
      query ListAdminUsers($filter: ModelUserProfileFilterInput) {
        listUserProfiles(filter: $filter) {
          items {
            uuid
          }
        }
      }
    `;

    const response = await client.graphql<GraphQLQuery<any>>({
      query: listAdminUsersQuery,
      variables: {
        filter: {
          isAdmin: { eq: true }
        }
      },
      authMode: 'userPool'
    });

    const users: { uuid?: string }[] = response.data?.listUserProfiles?.items || [];
    
    return users
      .filter((user) => user.uuid)
      .map((user) => user.uuid as string);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
};

/**
 * Helper function to sign and fetch requests to Lambda Function URL with IAM auth
 */
async function signedFetch(url: string, options: RequestInit): Promise<Response> {
  const session = await fetchAuthSession();
  const credentials = session.credentials;
  
  if (!credentials) {
    throw new Error('No AWS credentials available. Please sign in.');
  }
  
  const urlObj = new URL(url);
  const region = urlObj.hostname.split('.')[2] || 'us-east-1';
  
  const signer = new SignatureV4({
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
    region,
    service: 'lambda',
    sha256: Sha256,
  });
  
  const request = new HttpRequest({
    method: options.method || 'GET',
    hostname: urlObj.hostname,
    path: urlObj.pathname,
    headers: {
      'Content-Type': 'application/json',
      host: urlObj.hostname,
      ...(options.headers as Record<string, string>),
    },
    body: options.body as string,
  });
  
  const signedRequest = await signer.sign(request);
  
  return fetch(url, {
    method: signedRequest.method,
    headers: signedRequest.headers as HeadersInit,
    body: signedRequest.body as BodyInit,
  });
}

/**
 * Get the admin-sync function URL from amplify_outputs.json
 */
function getAdminSyncFunctionUrl(): string {
  const outputsData = outputs as any;
  
  // Check custom.functions.adminSync.endpoint
  const customFunctions = outputsData?.custom?.functions;
  if (customFunctions?.adminSync?.endpoint) {
    return customFunctions.adminSync.endpoint;
  }
  
  // Fallback: Use the manually created Function URL
  const manualFunctionUrl = 'https://tympuctd3ozlesbz2vmbgre6fy0hhumu.lambda-url.us-east-1.on.aws/';
  console.warn('Function URL not found in amplify_outputs.json, using manual URL');
  return manualFunctionUrl;
}

/**
 * Sync admin/developer status from Cognito groups to UserProfile
 * Calls the admin-sync Lambda function via Function URL
 */
export const syncAdminStatusFromCognito = async (): Promise<{ success: boolean; updated: number; errors: string[] }> => {
  try {
    const functionUrl = getAdminSyncFunctionUrl();
    
    const response = await signedFetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'syncFromCognito',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error syncing admin status from Cognito:', error);
    throw error;
  }
};

/**
 * Update user's admin/developer status in both Cognito groups and UserProfile
 * Calls the admin-sync Lambda function which handles:
 * 1. Adding/removing user from 'admin' Cognito group
 * 2. Adding/removing user from 'developer' Cognito group  
 * 3. Updating UserProfile.isAdmin/isDeveloper in database
 */
export const updateUserAdminStatus = async (
  userId: string,
  isAdmin: boolean,
  isDeveloper: boolean
): Promise<{ success: boolean; message: string }> => {
  try {
    const functionUrl = getAdminSyncFunctionUrl();
    
    const response = await signedFetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateUserAdminStatus',
        userId,
        isAdmin,
        isDeveloper,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error updating user admin status:', error);
    throw error;
  }
};
