// src/components/developer/ErrorLoggerDemo.tsx
import React, { useState } from 'react';
import Card from '../common/Card';
import { useErrorLogger, ErrorType } from '../../hooks/useErrorLogger';

interface ErrorLoggerDemoProps {
  onErrorLogged?: (errorType: string, errorMessage: string) => void;
}

const ErrorLoggerDemo: React.FC<ErrorLoggerDemoProps> = ({ onErrorLogged }) => {
  const { logError, logWithTypeDetection } = useErrorLogger();
  const [lastError, setLastError] = useState<{ type: string; message: string } | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [customErrorMessage, setCustomErrorMessage] = useState('');
  const [errorComponent, setErrorComponent] = useState('DataProcessor');
  const [useAutoDetection, setUseAutoDetection] = useState(true);
  
  // Error examples for different components
  const errorExamples: Record<string, string[]> = {
    'DataProcessor': [
      'Failed to parse JSON data: unexpected token',
      'Data validation failed: required field "name" is missing',
      'Unable to process data due to invalid format',
      'Data exceeds maximum allowed size of 5MB'
    ],
    'APIClient': [
      'API request failed with status 404: Resource not found',
      'Network connection timed out after 30 seconds',
      'Failed to fetch data: CORS policy violation',
      'API rate limit exceeded, please try again later'
    ],
    'UserDashboard': [
      'React Error: Cannot update a component while rendering a different component',
      'Failed to render UserCard component: props validation failed',
      'Hook called outside of component context',
      'Maximum update depth exceeded in UserDashboard'
    ],
    'AuthService': [
      'Authentication failed: Invalid credentials',
      'Session expired, please login again',
      'Access token is invalid or expired',
      'User is not authorized to access this resource'
    ],
    'FileUploader': [
      'Failed to upload file: S3 access denied',
      'File exceeds maximum size limit of 10MB',
      'Invalid file type, only .pdf and .docx are allowed',
      'Storage quota exceeded for this user'
    ]
  };

  // Get a random error message for the selected component
  const getRandomErrorMessage = (): string => {
    const messages = errorExamples[errorComponent] || errorExamples['DataProcessor'];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Handle logging a demonstration error
  const handleLogError = (manualType?: ErrorType) => {
    // Use custom message if provided, otherwise get a random one
    const errorMessage = customErrorMessage || getRandomErrorMessage();
    
    // Create an error object
    const error = new Error(errorMessage);
    
    try {
      if (useAutoDetection && !manualType) {
        // Use automatic type detection
        logWithTypeDetection(error, errorComponent);
      } else {
        // Use manually specified type
        const errorType = manualType || 'other';
        logError(error, errorType, errorComponent);
      }
      
      // Set the last error for UI feedback
      setLastError({ 
        type: manualType || 'auto-detected', 
        message: errorMessage 
      });
      
      // Show notification
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
      // Notify parent component if callback provided
      if (onErrorLogged) {
        onErrorLogged(manualType || 'auto-detected', errorMessage);
      }
    } catch (err) {
      console.error('Error while logging test error:', err);
    }
  };

  // Get component examples
  const componentOptions = Object.keys(errorExamples);

  return (
    <Card title="Error Logger Demo">
      <div className="alert alert-info mb-4">
        <div className="d-flex">
          <div className="me-3">
            <i className="bi bi-exclamation-circle-fill fs-3"></i>
          </div>
          <div>
            <h5 className="alert-heading">Error Logger Demo</h5>
            <p className="mb-0">
              Test the error logger hook with different error types and components.
              Errors will be logged to the database for viewing in the Error Log.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h6>Configuration</h6>
        <div className="row g-3">
          {/* Component Selection */}
          <div className="col-md-6">
            <label className="form-label">Component</label>
            <select 
              className="form-select"
              value={errorComponent}
              onChange={(e) => setErrorComponent(e.target.value)}
            >
              {componentOptions.map(component => (
                <option key={component} value={component}>
                  {component}
                </option>
              ))}
            </select>
          </div>
          
          {/* Error Detection Mode */}
          <div className="col-md-6">
            <label className="form-label">Error Type Detection</label>
            <div className="form-check form-switch mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="autoDetectionSwitch"
                checked={useAutoDetection}
                onChange={() => setUseAutoDetection(!useAutoDetection)}
              />
              <label className="form-check-label" htmlFor="autoDetectionSwitch">
                Automatic error type detection
              </label>
            </div>
          </div>
          
          {/* Custom Error Message Input */}
          <div className="col-12">
            <label className="form-label">Custom Error Message (optional)</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Enter custom error message or leave blank for random examples"
                value={customErrorMessage}
                onChange={(e) => setCustomErrorMessage(e.target.value)}
              />
              {customErrorMessage && (
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={() => setCustomErrorMessage('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
            <div className="form-text">
              Leave blank to use predefined error examples for the selected component
            </div>
          </div>
        </div>
      </div>

      {/* Error Generation Buttons */}
      <div className="mb-4">
        <h6>Generate and Log Errors</h6>
        {useAutoDetection ? (
          <div className="d-grid">
            <button 
              className="btn btn-primary"
              onClick={() => handleLogError()}
            >
              <i className="bi bi-lightning-charge me-2"></i>
              Generate Error with Auto-Detection
            </button>
            <small className="text-muted mt-2">
              The system will analyze the error message to determine its type automatically
            </small>
          </div>
        ) : (
          <div className="row g-2">
            <div className="col-md-3">
              <button 
                className="btn btn-danger w-100"
                onClick={() => handleLogError('runtime')}
              >
                Runtime Error
              </button>
            </div>
            <div className="col-md-3">
              <button 
                className="btn btn-warning w-100"
                onClick={() => handleLogError('api')}
              >
                API Error
              </button>
            </div>
            <div className="col-md-3">
              <button 
                className="btn btn-info text-white w-100"
                onClick={() => handleLogError('ui')}
              >
                UI Error
              </button>
            </div>
            <div className="col-md-3">
              <button 
                className="btn btn-secondary w-100"
                onClick={() => handleLogError('validation')}
              >
                Validation Error
              </button>
            </div>
            <div className="col-md-4">
              <button 
                className="btn btn-dark w-100 mt-2"
                onClick={() => handleLogError('storage')}
              >
                Storage Error
              </button>
            </div>
            <div className="col-md-4">
              <button 
                className="btn btn-primary w-100 mt-2"
                onClick={() => handleLogError('auth')}
              >
                Auth Error
              </button>
            </div>
            <div className="col-md-4">
              <button 
                className="btn btn-light border w-100 mt-2"
                onClick={() => handleLogError('other')}
              >
                Other Error
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Examples */}
      <div className="mb-4">
        <h6>Example Error Messages</h6>
        <div className="list-group">
          {errorExamples[errorComponent]?.map((example, index) => (
            <button 
              key={index}
              className="list-group-item list-group-item-action"
              onClick={() => {
                setCustomErrorMessage(example);
              }}
            >
              <i className="bi bi-arrow-right-circle me-2 text-primary"></i>
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Implementation Example */}
      <div className="card bg-light mb-4">
        <div className="card-header">
          <h6 className="mb-0">Implementation Example</h6>
        </div>
        <div className="card-body">
          <pre className="mb-0" style={{ fontSize: '0.8rem' }}>
{`// Inside your component
import { useErrorLogger } from '../../hooks/useErrorLogger';

const YourComponent = () => {
  const { logError, logWithTypeDetection } = useErrorLogger();
  
  const handleSomeAction = async () => {
    try {
      // Your code here
    } catch (error) {
      // Option 1: Specify the error type manually
      logError(error, 'api', 'YourComponent');
      
      // Option 2: Let the system detect the error type
      logWithTypeDetection(error, 'YourComponent');
    }
  };
  
  return (
    // Your component JSX
  );
};`}
          </pre>
        </div>
      </div>

      {/* Last Logged Error */}
      {lastError && (
        <div className="alert alert-secondary">
          <h6 className="mb-2">Last Logged Error:</h6>
          <div><strong>Type:</strong> {lastError.type}</div>
          <div><strong>Message:</strong> {lastError.message}</div>
          <div><strong>Component:</strong> {errorComponent}</div>
        </div>
      )}

      {/* Notification toast */}
      {showNotification && lastError && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
          <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div className="toast-header">
              <strong className="me-auto">Error Logged</strong>
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

export default ErrorLoggerDemo;