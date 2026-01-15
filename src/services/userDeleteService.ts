// src/services/userDeleteService.ts
import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from '../../amplify_outputs.json';
import { devLog, devError } from '../utils/logger';

/**
 * Helper function to fetch requests to Lambda Function URL with Cognito token auth
 */
async function authenticatedFetch(url: string, options: RequestInit): Promise<Response> {
  devLog('[userDeleteService] Starting authenticated fetch to:', url);
  
  let session;
  try {
    session = await fetchAuthSession();
    devLog('[userDeleteService] Auth session retrieved');
  } catch (err: any) {
    devError('[userDeleteService] Error fetching auth session:', err);
    throw new Error(`Failed to get authentication session: ${err.message || 'Unknown error'}`);
  }
  
  const token = session.tokens?.idToken?.toString();
  
  if (!token) {
    devError('[userDeleteService] No ID token available in session');
    throw new Error('No authentication token available. Please sign in.');
  }
  
  devLog('[userDeleteService] Making fetch request with token (length:', token.length, ')');
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers as Record<string, string>),
      },
    });
    
    devLog('[userDeleteService] Fetch response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: url,
    });
    
    // Clone response for logging without consuming the body
    if (!response.ok) {
      const responseClone = response.clone();
      const errorText = await responseClone.text().catch(() => 'Unable to read error response');
      devError('[userDeleteService] Request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url,
      });
    }
    
    return response;
  } catch (err: any) {
    // Network error or fetch failed entirely
    devError('[userDeleteService] Fetch request failed:', {
      error: err.message || err,
      errorType: err.name || 'Unknown',
      url: url,
      stack: err.stack,
    });
    
    // Provide more helpful error messages
    if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      throw new Error(`Network error: Unable to reach delete user function. Please check: 1) Function URL is configured in amplify_outputs.json, 2) CORS is enabled on the Function URL, 3) Network connectivity. Original error: ${err.message}`);
    }
    
    throw err;
  }
}

/**
 * Get the delete-user function URL from amplify_outputs.json
 */
function getDeleteUserFunctionUrl(): string {
  devLog('[userDeleteService] Getting delete user function URL from amplify_outputs.json');
  
  const outputsData = outputs as any;
  
  // Check custom.functions.deleteUser.endpoint
  const customFunctions = outputsData?.custom?.functions;
  devLog('[userDeleteService] Custom functions in outputs:', customFunctions ? Object.keys(customFunctions) : 'none');
  
  if (customFunctions?.deleteUser?.endpoint) {
    const url = customFunctions.deleteUser.endpoint;
    devLog('[userDeleteService] Found delete user function URL:', url);
    return url;
  }
  
  devError('[userDeleteService] Delete user function URL not found in amplify_outputs.json');
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
  devLog(`[userDeleteService] Starting soft delete for user ${userId}, isSelfDelete: ${isSelfDelete}`);
  
  try {
    const functionUrl = getDeleteUserFunctionUrl();
    devLog(`[userDeleteService] Function URL: ${functionUrl}`);
    
    const requestBody = {
      action: 'softDeleteUser',
      userId,
      isSelfDelete,
    };
    devLog(`[userDeleteService] Request body:`, requestBody);
    
    const response = await authenticatedFetch(functionUrl, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      devError(`[userDeleteService] Soft delete failed with status ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    devLog(`[userDeleteService] Soft delete successful:`, result);
    return result;
  } catch (error: any) {
    devError(`[userDeleteService] Error soft deleting user ${userId}:`, {
      error: error.message || error,
      errorType: error.name || 'Unknown',
      stack: error.stack,
    });
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
  devLog(`[userDeleteService] Starting hard delete for user ${userId}`);
  
  try {
    const functionUrl = getDeleteUserFunctionUrl();
    devLog(`[userDeleteService] Function URL: ${functionUrl}`);
    
    const requestBody = {
      action: 'hardDeleteUser',
      userId,
    };
    devLog(`[userDeleteService] Request body:`, requestBody);
    
    const response = await authenticatedFetch(functionUrl, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      devError(`[userDeleteService] Hard delete failed with status ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    devLog(`[userDeleteService] Hard delete successful:`, result);
    return result;
  } catch (error: any) {
    devError(`[userDeleteService] Error hard deleting user ${userId}:`, {
      error: error.message || error,
      errorType: error.name || 'Unknown',
      stack: error.stack,
    });
    throw error;
  }
};
