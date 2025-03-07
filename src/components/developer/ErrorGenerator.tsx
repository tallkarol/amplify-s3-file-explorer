// src/components/developer/ErrorGenerator.tsx
import React, { useState } from 'react';
import Card from '../common/Card';
import { logError } from '../../services/logService';

interface ErrorGeneratorProps {
  onErrorGenerated?: (errorType: string, errorMessage: string) => void;
}

// Define error types
type ErrorType = 'runtime' | 'api' | 'ui' | 'validation';

interface ErrorDefinition {
  title: string;
  description: string;
  errorMessages: string[];
  icon: string;
  color: string;
  component: string;
}

const ErrorGenerator: React.FC<ErrorGeneratorProps> = ({ onErrorGenerated }) => {
  const [lastError, setLastError] = useState<{ type: string; message: string } | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [customErrorMessage, setCustomErrorMessage] = useState('');

  // Error type definitions with multiple possible error messages for variety
  const errorDefinitions: Record<ErrorType, ErrorDefinition> = {
    runtime: {
      title: 'Runtime Error',
      description: 'JavaScript runtime error with a stack trace',
      errorMessages: [
        'TypeError: Cannot read property of undefined',
        'ReferenceError: variable is not defined',
        'RangeError: Invalid array length',
        'SyntaxError: Unexpected token'
      ],
      icon: 'exclamation-octagon-fill',
      color: 'danger',
      component: 'ErrorGenerator'
    },
    api: {
      title: 'API Error',
      description: 'Simulated API call failure with error response',
      errorMessages: [
        'API request failed: 404 Not Found',
        'API request failed: 500 Internal Server Error',
        'Network timeout after 30000ms',
        'API request failed: Unauthorized access'
      ],
      icon: 'hdd-network-fill',
      color: 'warning',
      component: 'APIService'
    },
    ui: {
      title: 'UI Error',
      description: 'React rendering error in a component',
      errorMessages: [
        'UI Rendering Error: Failed to render component',
        'Cannot update a component while rendering a different component',
        'Maximum update depth exceeded',
        'Invalid hook call'
      ],
      icon: 'layers-fill',
      color: 'info',
      component: 'UserInterface'
    },
    validation: {
      title: 'Validation Error',
      description: 'Data validation failure with detailed message',
      errorMessages: [
        'Validation Error: Email format is invalid',
        'Validation Error: Required field missing',
        'Validation Error: Value exceeds maximum length',
        'Validation Error: Invalid date format'
      ],
      icon: 'exclamation-diamond-fill',
      color: 'secondary',
      component: 'FormValidator'
    }
  };

  // Generate an error of the selected type
  const generateError = (errorType: ErrorType) => {
    const errorDef = errorDefinitions[errorType];
    
    // Select a random error message from the available options
    const randomErrorMessage = errorDef.errorMessages[
      Math.floor(Math.random() * errorDef.errorMessages.length)
    ];
    
    // Use custom message if provided, otherwise use random one
    const errorMessage = customErrorMessage || randomErrorMessage;
    
    try {
      // Create an error instance
      const error = new Error(errorMessage);
      error.name = errorType.charAt(0).toUpperCase() + errorType.slice(1) + 'Error';
      
      // Log the error to the service
      logError(error, errorType, errorDef.component);
      
      // Set the last error state for UI feedback
      setLastError({ type: errorType, message: errorMessage });
      
      // Show notification
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
      // Notify parent component if callback provided
      if (onErrorGenerated) {
        onErrorGenerated(errorType, errorMessage);
      }
      
      console.error(`Generated ${errorType} error:`, error);
    } catch (err) {
      console.error('Error while generating test error:', err);
    }
  };

  return (
    <Card title="Error Generator">
      <div className="alert alert-warning mb-4">
        <div className="d-flex">
          <div className="me-3">
            <i className="bi bi-exclamation-triangle-fill fs-3"></i>
          </div>
          <div>
            <h5 className="alert-heading">Test Error Generation</h5>
            <p className="mb-0">
              Generate different types of errors to test your error handling and logging system.
              All errors will be logged to DynamoDB for later analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Error Message Input */}
      <div className="mb-4">
        <div className="form-floating">
          <input
            type="text"
            className="form-control"
            id="customErrorMessage"
            placeholder="Enter custom error message"
            value={customErrorMessage}
            onChange={(e) => setCustomErrorMessage(e.target.value)}
          />
          <label htmlFor="customErrorMessage">Custom Error Message (optional)</label>
        </div>
        <div className="form-text">
          Leave blank to use default error messages for each type
        </div>
      </div>
      {/* Error Grid for Quick Access */}
      <div className="row g-4">
        {Object.entries(errorDefinitions).map(([type, def]) => (
          <div className="col-md-3" key={type}>
            <div className={`card h-100 border-${def.color}`}>
              <div className="card-body">
                <h5 className="card-title">
                  <i className={`bi bi-${def.icon} text-${def.color} me-2`}></i>
                  {def.title}
                </h5>
                <p className="card-text small">
                  {def.description}
                </p>
                <button 
                  className={`btn btn-sm btn-outline-${def.color} w-100`}
                  onClick={() => generateError(type as ErrorType)}
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notification toast */}
      {showNotification && lastError && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
          <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div className="toast-header">
              <strong className="me-auto">Error Generated</strong>
              <small>just now</small>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowNotification(false)}
              ></button>
            </div>
            <div className="toast-body">
              <strong>{lastError.type} Error:</strong> {lastError.message}
              <div className="mt-2 small">Successfully logged to DynamoDB</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ErrorGenerator;