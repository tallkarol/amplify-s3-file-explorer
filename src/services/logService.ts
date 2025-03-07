// src/services/logService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { v4 as uuidv4 } from 'uuid'; // You may need to install this package
import { useAuthenticator } from '@aws-amplify/ui-react';

// Define types
export interface ErrorLogInput {
  userId: string;
  timestamp: number;
  logId: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  component?: string;
  deviceInfo: Record<string, any>;
  ttl: number;
}

// Create GraphQL mutations
const createErrorLogMutation = /* GraphQL */ `
  mutation CreateErrorLog($input: CreateErrorLogInput!) {
    createErrorLog(input: $input) {
      id
      userId
      timestamp
      logId
      errorType
      errorMessage
    }
  }
`;

const listUserErrorLogQuery = /* GraphQL */ `
  query ListUserErrorLogs($userId: String!, $limit: Int) {
    listErrorLogs(filter: { userId: { eq: $userId } }, limit: $limit) {
      items {
        id
        userId
        timestamp
        logId
        errorType
        errorMessage
        stackTrace
        component
        deviceInfo
        createdAt
      }
    }
  }
`;

// Create client
const client = generateClient();

// TTL helper - set logs to expire after 30 days
const calculateTTL = () => {
  const NOW_IN_MS = Date.now();
  const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
  return Math.floor(NOW_IN_MS / 1000) + THIRTY_DAYS_IN_SECONDS;
};

// Log an error to DynamoDB
export const logError = async (
  error: Error,
  errorType: string = 'Uncaught',
  component?: string,
  userId?: string
): Promise<void> => {
  try {
    // Get current user if userId not provided
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      try {
        // This should be called from a React component where the hook is valid
        // or you should pass in the userId from the component
        const { user } = useAuthenticator();
        effectiveUserId = user?.userId || 'anonymous';
      } catch (e) {
        effectiveUserId = 'anonymous';
      }
    }

    const timestamp = Date.now();
    
    // Collect device information
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Create log input
    const logInput: ErrorLogInput = {
      userId: effectiveUserId,
      timestamp: timestamp,
      logId: uuidv4(),
      errorType: errorType,
      errorMessage: error.message || 'Unknown error',
      stackTrace: error.stack || '',
      component: component || 'Unknown',
      deviceInfo: deviceInfo,
      ttl: calculateTTL()
    };

    // Log to console for immediate debug visibility
    console.error('Logging error to DynamoDB:', logInput);

    // Send to DynamoDB
    await client.graphql<GraphQLQuery<any>>({
      query: createErrorLogMutation,
      variables: {
        input: logInput
      },
      authMode: 'userPool'
    });

    console.log('Error successfully logged to DynamoDB');
  } catch (e) {
    // Fallback to console if DB logging fails
    console.error('Failed to log error to DynamoDB:', e);
    console.error('Original error:', error);
  }
};

// Fetch error logs for a specific user
export const getUserErrorLogs = async (userId: string, limit: number = 50): Promise<any[]> => {
  try {
    const response = await client.graphql<GraphQLQuery<any>>({
      query: listUserErrorLogQuery,
      variables: {
        userId,
        limit
      },
      authMode: 'userPool'
    });

    return response.data?.listErrorLogs?.items || [];
  } catch (e) {
    console.error('Failed to fetch error logs:', e);
    return [];
  }
};

// Fetch all error logs (admin/developer only)
export const getAllErrorLogs = async (limit: number = 100): Promise<any[]> => {
  try {
    const response = await client.graphql<GraphQLQuery<any>>({
      query: /* GraphQL */ `
        query ListAllErrorLogs($limit: Int) {
          listErrorLogs(limit: $limit) {
            items {
              id
              userId
              timestamp
              logId
              errorType
              errorMessage
              stackTrace
              component
              deviceInfo
              createdAt
            }
          }
        }
      `,
      variables: {
        limit
      },
      authMode: 'userPool'
    });

    return response.data?.listErrorLogs?.items || [];
  } catch (e) {
    console.error('Failed to fetch all error logs:', e);
    return [];
  }
};