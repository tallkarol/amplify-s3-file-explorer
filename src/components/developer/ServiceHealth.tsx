// src/components/developer/ServiceHealth.tsx
import { useState } from 'react';
import Card from '../../components/common/Card';
import { fetchAuthSession } from 'aws-amplify/auth';
import { list, uploadData, remove } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { devLog } from '../../utils/logger';

// Define service types - we'll keep this for future use even if not used now
type ServiceStatus = 'untested' | 'testing' | 'success' | 'failed';

interface ServiceTestResult {
  status: ServiceStatus;
  message: string;
  details?: string;
  timestamp?: string;
}

const ServiceHealth = () => {
  // Tracking state for each service
  const [authStatus, setAuthStatus] = useState<ServiceTestResult>({ 
    status: 'untested', 
    message: 'Not tested yet' 
  });
  
  const [apiStatus, setApiStatus] = useState<ServiceTestResult>({ 
    status: 'untested', 
    message: 'Not tested yet' 
  });
  
  const [storageStatus, setStorageStatus] = useState<ServiceTestResult>({ 
    status: 'untested', 
    message: 'Not tested yet' 
  });

  // Test Auth Service
  const testAuthService = async () => {
    setAuthStatus({
      status: 'testing',
      message: 'Testing authentication...'
    });

    try {
      const session = await fetchAuthSession();
      
      if (session.tokens?.idToken) {
        const idToken = session.tokens.idToken;
        // Fix for groups typing issue
        const groups = idToken.payload['cognito:groups'] as string[] || [];
        const username = idToken.payload['cognito:username'] as string || 'unknown';
        
        setAuthStatus({
          status: 'success',
          message: 'Authentication working properly',
          details: `Authenticated as: ${username}\nGroups: ${groups.join(', ') || 'none'}`,
          timestamp: new Date().toLocaleString()
        });
      } else {
        setAuthStatus({
          status: 'failed',
          message: 'No valid tokens in session',
          timestamp: new Date().toLocaleString()
        });
      }
    } catch (error) {
      console.error('Auth test failed:', error);
      setAuthStatus({
        status: 'failed',
        message: 'Authentication test failed',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toLocaleString()
      });
    }
  };

  // Test API Service
  const testApiService = async () => {
    setApiStatus({
      status: 'testing',
      message: 'Testing API...'
    });

    try {
      const client = generateClient();
      

      
      // Simple query to test if API is working
      const response = await client.graphql({
        query: `query TestQuery {
          __schema {
            queryType {
              name
            }
          }
        }`
      });

      devLog('API test response:', response);
      
      // We don't need to use the response, just checking if the request succeeds
      setApiStatus({
        status: 'success',
        message: 'API working properly',
        details: 'Successfully connected to AppSync API',
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('API test failed:', error);
      setApiStatus({
        status: 'failed',
        message: 'API test failed',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toLocaleString()
      });
    }
  };

  // Test Storage Service (S3)
  const testStorageService = async () => {
    setStorageStatus({
      status: 'testing',
      message: 'Testing storage...'
    });

    const testFilePath = 'debug/test-file.txt';
    const testContent = `Test file created at ${new Date().toISOString()}`;
    
    try {
      // Step 1: Upload a test file
      await uploadData({
        path: testFilePath,
        data: testContent,
        options: {
          contentType: 'text/plain'
        }
      });
      
      // Step 2: List files to verify it's there
      const listResult = await list({
        path: 'debug/'
      });
      
      const foundFile = listResult.items.some(item => 
        item.path === testFilePath
      );
      
      if (!foundFile) {
        throw new Error('Test file was uploaded but not found in listing');
      }
      
      // Step 3: Clean up by removing the test file
      await remove({
        path: testFilePath
      });
      
      setStorageStatus({
        status: 'success',
        message: 'Storage working properly',
        details: 'Successfully completed upload, list, and delete operations',
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Storage test failed:', error);
      setStorageStatus({
        status: 'failed',
        message: 'Storage test failed',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toLocaleString()
      });
    }
  };

  // Run all tests
  const testAllServices = () => {
    testAuthService();
    testApiService();
    testStorageService();
  };

  // Helper to render status badge
  const renderStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'success':
        return <span className="badge bg-success">Operational</span>;
      case 'failed':
        return <span className="badge bg-danger">Failed</span>;
      case 'testing':
        return <span className="badge bg-warning">Testing...</span>;
      default:
        return <span className="badge bg-secondary">Not Tested</span>;
    }
  };

  return (
    <Card title="Service Health Status">
      <div className="mb-3">
        <button 
          className="btn btn-primary"
          onClick={testAllServices}
        >
          <i className="bi bi-arrow-repeat me-2"></i>
          Test All Services
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Service</th>
              <th>Status</th>
              <th>Last Checked</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Auth Service */}
            <tr>
              <td>
                <i className="bi bi-shield-lock me-2"></i>
                Authentication
              </td>
              <td>{renderStatusBadge(authStatus.status)}</td>
              <td>{authStatus.timestamp || 'Never'}</td>
              <td>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={testAuthService}
                  disabled={authStatus.status === 'testing'}
                >
                  Test
                </button>
                {authStatus.details && (
                  <button
                    className="btn btn-sm btn-outline-secondary ms-2"
                    data-bs-toggle="collapse"
                    data-bs-target="#auth-details"
                    aria-expanded="false"
                  >
                    Details
                  </button>
                )}
              </td>
            </tr>
            {authStatus.details && (
              <tr id="auth-details" className="collapse">
                <td colSpan={4}>
                  <div className="bg-light p-2 rounded">
                    <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {authStatus.details}
                    </pre>
                  </div>
                </td>
              </tr>
            )}

            {/* API Service */}
            <tr>
              <td>
                <i className="bi bi-graph-up me-2"></i>
                GraphQL API
              </td>
              <td>{renderStatusBadge(apiStatus.status)}</td>
              <td>{apiStatus.timestamp || 'Never'}</td>
              <td>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={testApiService}
                  disabled={apiStatus.status === 'testing'}
                >
                  Test
                </button>
                {apiStatus.details && (
                  <button
                    className="btn btn-sm btn-outline-secondary ms-2"
                    data-bs-toggle="collapse"
                    data-bs-target="#api-details"
                    aria-expanded="false"
                  >
                    Details
                  </button>
                )}
              </td>
            </tr>
            {apiStatus.details && (
              <tr id="api-details" className="collapse">
                <td colSpan={4}>
                  <div className="bg-light p-2 rounded">
                    <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {apiStatus.details}
                    </pre>
                  </div>
                </td>
              </tr>
            )}

            {/* Storage Service */}
            <tr>
              <td>
                <i className="bi bi-cloud me-2"></i>
                Storage (S3)
              </td>
              <td>{renderStatusBadge(storageStatus.status)}</td>
              <td>{storageStatus.timestamp || 'Never'}</td>
              <td>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={testStorageService}
                  disabled={storageStatus.status === 'testing'}
                >
                  Test
                </button>
                {storageStatus.details && (
                  <button
                    className="btn btn-sm btn-outline-secondary ms-2"
                    data-bs-toggle="collapse"
                    data-bs-target="#storage-details"
                    aria-expanded="false"
                  >
                    Details
                  </button>
                )}
              </td>
            </tr>
            {storageStatus.details && (
              <tr id="storage-details" className="collapse">
                <td colSpan={4}>
                  <div className="bg-light p-2 rounded">
                    <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {storageStatus.details}
                    </pre>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ServiceHealth;