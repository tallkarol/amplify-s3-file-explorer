// src/services/logService.ts
import { generateClient, GraphQLResult } from 'aws-amplify/api';
// import { GraphQLQuery } from '@aws-amplify/api';
// import { v4 as uuidv4 } from 'uuid';
import { devLog } from '../utils/logger';

// Create client
const client = generateClient();

// Define types
export interface ErrorLogInput {
  userId: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  component?: string;
}

/**
 * Log an error to DynamoDB - simplified version
 */
export const logError = async (
  error: Error,
  errorType: string = 'Uncaught',
  component?: string,
  userId?: string
): Promise<void> => {
  try {
    // If no userId is provided, we can't log the error
    if (!userId) {
      console.error('Cannot log error: No userId provided');
      console.error('Original error:', error);
      return;
    }

    // Log to console for immediate debug visibility
    console.error('Attempting to log error to DynamoDB for user:', userId);

    // Create minimalist log input with only essential fields
    const logInput = {
      userId,
      errorType: errorType,
      errorMessage: error.message || 'Unknown error',
      stackTrace: error.stack || '',
      component: component || 'Unknown'
    };

    // Send to DynamoDB using simplified GraphQL mutation
    const createErrorLogMutation = /* GraphQL */ `
      mutation CreateErrorLog($input: CreateErrorLogInput!) {
        createErrorLog(input: $input) {
          id
        }
      }
    `;

    const response = await client.graphql({
      query: createErrorLogMutation,
      variables: {
        input: logInput
      },
      authMode: 'userPool'
    }) as GraphQLResult<any>;

    devLog('Error successfully logged to DynamoDB:', response);
  } catch (e: any) {
    // Log detailed error information
    console.error('Failed to log error to DynamoDB:', e);
    
    // Extract and log GraphQL errors if they exist
    if (e.errors) {
      console.error('GraphQL Errors:', JSON.stringify(e.errors, null, 2));
    }
    
    // Log the original error that the user was reporting
    console.error('Original error:', error);
  }
};

/**
 * Get error logs for a specific user - simplified for testing
 */
export const getUserErrorLogs = async (userId: string, limit: number = 50): Promise<any[]> => {
  try {
    const query = /* GraphQL */ `
      query ListErrorLogs($filter: ModelErrorLogFilterInput, $limit: Int) {
        listErrorLogs(filter: $filter, limit: $limit) {
          items {
            id
            userId
            errorType
            errorMessage
            component
            stackTrace
            createdAt
          }
        }
      }
    `;

    const response = await client.graphql({
      query,
      variables: {
        filter: { userId: { eq: userId } },
        limit
      },
      authMode: 'userPool'
    }) as GraphQLResult<any>;
    
    return response.data?.listErrorLogs?.items || [];
  } catch (e) {
    console.error('Failed to fetch error logs:', e);
    return [];
  }
};

/**
 * Get all error logs - simplified for testing
 */
export const getAllErrorLogs = async (limit: number = 100): Promise<any[]> => {
  try {
    const query = /* GraphQL */ `
      query ListErrorLogs($limit: Int) {
        listErrorLogs(limit: $limit) {
          items {
            id
            userId
            errorType
            errorMessage
            component
            stackTrace
            createdAt
          }
        }
      }
    `;

    const response = await client.graphql({
      query,
      variables: {
        limit
      },
      authMode: 'userPool'
    }) as GraphQLResult<any>;
    
    return response.data?.listErrorLogs?.items || [];
  } catch (e) {
    console.error('Failed to fetch all error logs:', e);
    return [];
  }
};