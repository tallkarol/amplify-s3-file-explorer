// src/services/userDeleteService.ts
import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from '../../amplify_outputs.json';

/**
 * Helper function to fetch requests to Lambda Function URL with Cognito token auth
 */
async function authenticatedFetch(url: string, options: RequestInit): Promise<Response> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  
  if (!token) {
    throw new Error('No authentication token available. Please sign in.');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });
  
  // Clone response for logging without consuming the body
  if (!response.ok) {
    const responseClone = response.clone();
    const errorText = await responseClone.text().catch(() => 'Unable to read error response');
    console.error('[authenticatedFetch] Request failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      url: url,
    });
  }
  
  return response;
}

/**
 * Get the delete-user function URL from amplify_outputs.json
 */
function getDeleteUserFunctionUrl(): string {
  const outputsData = outputs as any;
  
  // Check custom.functions.deleteUser.endpoint
  const customFunctions = outputsData?.custom?.functions;
  if (customFunctions?.deleteUser?.endpoint) {
    return customFunctions.deleteUser.endpoint;
  }
  
  throw new Error('Delete user function URL not configured. Please deploy the function first, then add it to amplify_outputs.json under: "custom": { "functions": { "deleteUser": { "endpoint": "https://your-function-url.lambda-url.region.on.aws/" } } }');
}

/**
 * Soft delete a user: Disable in Cognito, mark as deleted in DB
 * Users can soft delete themselves, admins/devs can soft delete others
 */
export const softDeleteUser = async (
  userId: string,
  isSelfDelete: boolean = false
): Promise<{ success: boolean; message: string }> => {
  try {
    const functionUrl = getDeleteUserFunctionUrl();
    
    const response = await authenticatedFetch(functionUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'softDeleteUser',
        userId,
        isSelfDelete,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error soft deleting user:', error);
    throw error;
  }
};

/**
 * Hard delete a user: Truly delete from Cognito, mark as deleted in DB
 * Only admins/devs can hard delete users
 */
export const hardDeleteUser = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const functionUrl = getDeleteUserFunctionUrl();
    
    const response = await authenticatedFetch(functionUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'hardDeleteUser',
        userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error hard deleting user:', error);
    throw error;
  }
};
