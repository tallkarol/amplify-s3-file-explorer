// src/pages/developer/DebugTools.tsx
import { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Card from '../../components/common/Card';
import AlertMessage from '../../components/common/AlertMessage';
import { useUserRole } from '../../hooks/useUserRole';
import ServiceHealth from '../../components/developer/ServiceHealth';
import UserValidator from '../../components/developer/UserValidator';

const DebugTools = () => {
  const { isDeveloper } = useUserRole();
  const { user } = useAuthenticator();
  const [activeTab, setActiveTab] = useState('health');

  // If not a developer, show access denied
  if (!isDeveloper) {
    return (
      <AlertMessage
        type="danger"
        title="Access Denied"
        message="You do not have permission to access the developer tools."
      />
    );
  }

  return (
    <div className="debug-tools">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Developer Debug Tools</h2>
          <p className="text-muted mb-0">
            Tools for testing and validating application functionality
          </p>
        </div>
        <div className="badge bg-dark p-2">
          <i className="bi bi-code-slash me-1"></i>
          Developer Mode
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-dark text-white">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'health' ? 'active bg-white' : 'text-white'}`}
                    onClick={() => setActiveTab('health')}
                  >
                    <i className="bi bi-activity me-2"></i>
                    Service Health
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'user' ? 'active bg-white' : 'text-white'}`}
                    onClick={() => setActiveTab('user')}
                  >
                    <i className="bi bi-person-check me-2"></i>
                    User Validator
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'error' ? 'active bg-white' : 'text-white'}`}
                    onClick={() => setActiveTab('error')}
                  >
                    <i className="bi bi-bug me-2"></i>
                    Error Generator
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body p-4">
              {activeTab === 'health' && <ServiceHealth />}
              
              {activeTab === 'user' && <UserValidator />}
              
              {activeTab === 'error' && (
                <Card title="Error Generator">
                  <div className="alert alert-warning mb-4">
                    <div className="d-flex">
                      <div className="me-3">
                        <i className="bi bi-exclamation-triangle-fill fs-3"></i>
                      </div>
                      <div>
                        <h5 className="alert-heading">Test Error Generation</h5>
                        <p className="mb-0">
                          Use these buttons to generate different types of errors. This helps test your error 
                          handling and logging system.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4">
                    <div className="col-md-4">
                      <div className="card h-100 border-danger">
                        <div className="card-body">
                          <h5 className="card-title">
                            <i className="bi bi-exclamation-octagon-fill text-danger me-2"></i>
                            Runtime Error
                          </h5>
                          <p className="card-text">
                            Triggers a JavaScript runtime error with a stack trace.
                          </p>
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => {
                              try {
                                // Deliberately cause an error
                                const obj = null;
                                // @ts-ignore - This will throw an error
                                obj.nonExistentMethod();
                              } catch (error) {
                                console.error("Runtime error:", error);
                                alert("Runtime error generated. Check console.");
                              }
                            }}
                          >
                            Generate Runtime Error
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="card h-100 border-warning">
                        <div className="card-body">
                          <h5 className="card-title">
                            <i className="bi bi-hdd-network-fill text-warning me-2"></i>
                            API Error
                          </h5>
                          <p className="card-text">
                            Simulates a failed API call with error response.
                          </p>
                          <button 
                            className="btn btn-outline-warning"
                            onClick={() => {
                              try {
                                // Deliberately cause an error
                                throw new Error("API request failed: 404 Not Found");
                              } catch (error) {
                                console.error("API error:", error);
                                alert("API error generated. Check console.");
                              }
                            }}
                          >
                            Generate API Error
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="card h-100 border-primary">
                        <div className="card-body">
                          <h5 className="card-title">
                            <i className="bi bi-browser-chrome text-primary me-2"></i>
                            UI Error
                          </h5>
                          <p className="card-text">
                            Simulates a UI rendering error in a component.
                          </p>
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => {
                              try {
                                // Deliberately cause an error
                                throw new Error("UI Rendering Error: Failed to render component");
                              } catch (error) {
                                console.error("UI error:", error);
                                alert("UI error generated. Check console.");
                              }
                            }}
                          >
                            Generate UI Error
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-light border-0 shadow-sm">
        <div className="card-body">
          <h5>Developer Environment Info</h5>
          <div className="table-responsive">
            <table className="table table-borderless table-sm mb-0">
              <tbody>
                <tr>
                  <th scope="row" style={{ width: '200px' }}>User ID</th>
                  <td><code>{user.userId}</code></td>
                </tr>
                <tr>
                  <th scope="row">Username</th>
                  <td><code>{user.username}</code></td>
                </tr>
                <tr>
                  <th scope="row">Role</th>
                  <td>
                    <span className="badge bg-info">Developer</span>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Current Time</th>
                  <td>{new Date().toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugTools;