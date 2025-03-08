// src/hooks/useErrorLogger.ts
import { useAuthenticator } from '@aws-amplify/ui-react';
import { logError } from '../services/logService';

// Define standard error types to match the ErrorGenerator categories
export type ErrorType = 
  | 'runtime'   // JavaScript runtime errors
  | 'api'       // API/network related errors
  | 'ui'        // React rendering/UI related errors
  | 'validation' // Form validation errors
  | 'storage'   // S3/file storage errors
  | 'auth'      // Authentication errors
  | 'data'      // Data processing errors
  | 'other';    // Catch-all for uncategorized errors

// Component context for better error tracking
export type ComponentContext = string;

/**
 * A hook that provides error logging functionality
 * @returns Object with logError function
 */
export const useErrorLogger = () => {
  const { user } = useAuthenticator();
  
  /**
   * Log an error to the database
   * @param error The error object
   * @param type Type of error
   * @param component Component where the error occurred
   * @returns void
   */
  const logApplicationError = (
    error: Error | string,
    type: ErrorType = 'other',
    component: ComponentContext = 'UnknownComponent'
  ) => {
    // Convert string errors to Error objects for consistent handling
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // Only log if we have a userId (required by the database)
    if (user && user.userId) {
      // Log to the error service
      logError(errorObj, type, component, user.userId);
      
      // Also log to console for immediate debugging
      console.error(`[${type}] Error in ${component}:`, errorObj);
    } else {
      // Still log to console if no user is available
      console.error(`[${type}] Error in ${component} (not logged to DB - no user):`, errorObj);
    }
  };
  
  /**
   * Helper function to detect and categorize errors by examining their properties
   * @param error The error to categorize
   * @returns The detected error type
   */
  const detectErrorType = (error: Error): ErrorType => {
    // Check for runtime errors by examining error name
    if (
      error.name === 'TypeError' || 
      error.name === 'ReferenceError' || 
      error.name === 'RangeError' || 
      error.name === 'SyntaxError'
    ) {
      return 'runtime';
    }
    
    // Check for fetch/API errors
    if (
      error.message.includes('fetch') || 
      error.message.includes('network') || 
      error.message.includes('API') || 
      error.message.includes('api') ||
      error.message.includes('status')
    ) {
      return 'api';
    }
    
    // Check for React errors
    if (
      error.message.includes('React') || 
      error.message.includes('render') || 
      error.message.includes('component') || 
      error.message.includes('hook') ||
      error.message.includes('element')
    ) {
      return 'ui';
    }
    
    // Check for validation errors
    if (
      error.message.includes('validate') || 
      error.message.includes('validation') || 
      error.message.includes('invalid') || 
      error.message.includes('required')
    ) {
      return 'validation';
    }
    
    // Check for storage errors
    if (
      error.message.includes('storage') || 
      error.message.includes('S3') || 
      error.message.includes('file') || 
      error.message.includes('upload')
    ) {
      return 'storage';
    }
    
    // Check for auth errors
    if (
      error.message.includes('auth') || 
      error.message.includes('login') || 
      error.message.includes('permission') || 
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden')
    ) {
      return 'auth';
    }
    
    // Default to 'other' if no specific category is detected
    return 'other';
  };
  
  /**
   * Log an error with automatic type detection
   * @param error The error object
   * @param component Component where the error occurred
   * @returns void
   */
  const logWithTypeDetection = (
    error: Error | string,
    component: ComponentContext = 'UnknownComponent'
  ) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const detectedType = detectErrorType(errorObj);
    logApplicationError(errorObj, detectedType, component);
  };
  
  // Return both the standard logger and the auto-detection version
  return {
    logError: logApplicationError,
    logWithTypeDetection
  };
};