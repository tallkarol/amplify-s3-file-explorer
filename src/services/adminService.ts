// src/services/adminService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
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
 * Sync admin/developer status from Cognito groups to UserProfile
 * Calls the admin-sync Lambda function
 */
export const syncAdminStatusFromCognito = async (): Promise<{ success: boolean; updated: number; errors: string[] }> => {
  try {
    // Get the function endpoint URL
    // In Gen 2, functions expose HTTP endpoints automatically
    // The endpoint URL format: https://{api-id}.execute-api.{region}.amazonaws.com/{function-name}
    // We'll need to get this from amplify_outputs.json or construct it
    const functionUrl = await getAdminSyncFunctionUrl();
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'syncFromCognito',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
    
    const response = await fetch(functionUrl, {
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
      throw new Error(`HTTP error! status: ${response.status}`);
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
 * In Gen 2, this should be available from amplify_outputs.json
 */
async function getAdminSyncFunctionUrl(): Promise<string> {
  try {
    // Import amplify_outputs.json
    // In Gen 2, functions are exposed via custom.functions after deployment
    // Type assertion needed because amplify_outputs.json type doesn't include custom yet
    const outputs = (await import('../../amplify_outputs.json')) as any;
    
    // Check various possible locations for the function URL
    const outputsData = outputs.default || outputs;
    const customFunctions = outputsData?.custom?.functions;
    if (customFunctions?.adminSync?.endpoint) {
      return customFunctions.adminSync.endpoint;
    }
    
    // Alternative: try to get from window if available (for runtime)
    if (typeof window !== 'undefined' && (window as any).__AMPLIFY_OUTPUTS__) {
      const runtimeOutputs = (window as any).__AMPLIFY_OUTPUTS__;
      if (runtimeOutputs.custom?.functions?.adminSync?.endpoint) {
        return runtimeOutputs.custom.functions.adminSync.endpoint;
      }
    }
  } catch (error) {
    console.warn('Could not load amplify_outputs.json:', error);
  }

  // Fallback: construct URL from environment or use a placeholder
  // In production, this should be set via environment variables or amplify_outputs.json
  // After deploying the function, run: npx ampx generate outputs --app-id <app-id> --branch <branch>
  throw new Error('Admin sync function URL not configured. Please deploy the function first, then run "npx ampx generate outputs --app-id <app-id> --branch <branch>" to update amplify_outputs.json');
}