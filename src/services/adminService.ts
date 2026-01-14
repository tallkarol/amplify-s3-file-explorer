// src/services/adminService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@aws-sdk/protocol-http';
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
  const region = urlObj.hostname.split('.')[2] || 'us-east-1'; // Extract region from URL
  
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
 * Sync admin/developer status from Cognito groups to UserProfile
 * Calls the admin-sync Lambda function
 */
export const syncAdminStatusFromCognito = async (): Promise<{ success: boolean; updated: number; errors: string[] }> => {
  try {
    const functionUrl = await getAdminSyncFunctionUrl();
    
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
 * Update user's admin/developer status in both Cognito and UserProfile
 * Calls the admin-sync Lambda function
 */
export const updateUserAdminStatus = async (
  userId: string,
  isAdmin: boolean,
  isDeveloper: boolean
): Promise<{ success: boolean; message: string }> => {
  try {
    const functionUrl = await getAdminSyncFunctionUrl();
    
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

/**
 * Get the admin-sync function URL
 * Checks multiple sources: amplify_outputs.json, CloudFormation outputs, and environment variables
 */
async function getAdminSyncFunctionUrl(): Promise<string> {
  try {
    // Import amplify_outputs.json
    // In Gen 2, functions are exposed via custom.functions after deployment
    // Type assertion needed because amplify_outputs.json type doesn't include custom yet
    const outputs = (await import('../../amplify_outputs.json')) as any;
    
    // Check various possible locations for the function URL
    const outputsData = outputs.default || outputs;
    
    // 1. Check custom.functions.adminSync.endpoint (expected location after generate outputs)
    const customFunctions = outputsData?.custom?.functions;
    if (customFunctions?.adminSync?.endpoint) {
      return customFunctions.adminSync.endpoint;
    }
    
    // 2. Check custom.adminSyncFunctionUrl (if added manually)
    if (outputsData?.custom?.adminSyncFunctionUrl) {
      return outputsData.custom.adminSyncFunctionUrl;
    }
    
    // 3. Check root level functionUrl (alternative structure)
    if (outputsData?.functionUrl) {
      return outputsData.functionUrl;
    }
    
    // Alternative: try to get from window if available (for runtime)
    if (typeof window !== 'undefined' && (window as any).__AMPLIFY_OUTPUTS__) {
      const runtimeOutputs = (window as any).__AMPLIFY_OUTPUTS__;
      if (runtimeOutputs.custom?.functions?.adminSync?.endpoint) {
        return runtimeOutputs.custom.functions.adminSync.endpoint;
      }
      if (runtimeOutputs.custom?.adminSyncFunctionUrl) {
        return runtimeOutputs.custom.adminSyncFunctionUrl;
      }
    }
  } catch (error) {
    console.warn('Could not load amplify_outputs.json:', error);
  }

  // Check environment variable as fallback
  if (typeof window !== 'undefined' && (window as any).process?.env?.REACT_APP_ADMIN_SYNC_FUNCTION_URL) {
    return (window as any).process.env.REACT_APP_ADMIN_SYNC_FUNCTION_URL;
  }

  // Final fallback: throw error with helpful message
  throw new Error(
    'Admin sync function URL not configured.\n' +
    'After deploying, add it to amplify_outputs.json under:\n' +
    '  "custom": {\n' +
    '    "functions": {\n' +
    '      "adminSync": {\n' +
    '        "endpoint": "https://your-function-url.lambda-url.region.on.aws/"\n' +
    '      }\n' +
    '    }\n' +
    '  }\n' +
    'Or check CloudFormation outputs for "AdminSyncFunctionUrlOutput"'
  );
}