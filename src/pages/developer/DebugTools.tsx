// src/pages/developer/DebugTools.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import AlertMessage from '../../components/common/AlertMessage';
import { useUserRole } from '../../hooks/useUserRole';
import ServiceHealth from '../../components/developer/ServiceHealth';
import UserValidator from '../../components/developer/UserValidator';
import ErrorGenerator from '../../components/developer/ErrorGenerator';
import ErrorLog from '../../components/developer/ErrorLog';

const DebugTools = () => {
  const { isDeveloper } = useUserRole();
  const { user } = useAuthenticator();
  const [activeTab, setActiveTab] = useState('health');
  const [errorStats, setErrorStats] = useState<{ count: number; lastTimestamp: Date | null }>({ count: 0, lastTimestamp: null });
  const [refreshKey, setRefreshKey] = useState(0);

  // Update error stats when an error is generated
  const handleErrorGenerated = () => {
    setErrorStats(prev => ({
      count: prev.count + 1,
      lastTimestamp: new Date()
    }));
    
    // Force a refresh of the error log component
    setRefreshKey(prev => prev + 1);
  };

  // Reset error stats when switching to error log tab
  useEffect(() => {
    if (activeTab === 'errorlog') {
      setErrorStats({ count: 0, lastTimestamp: null });
    }
  }, [activeTab]);

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
                    {errorStats.count > 0 && (
                      <span className="badge bg-danger ms-2">{errorStats.count}</span>
                    )}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'errorlog' ? 'active bg-white' : 'text-white'}`}
                    onClick={() => setActiveTab('errorlog')}
                  >
                    <i className="bi bi-journal-code me-2"></i>
                    Error Logs
                    {errorStats.count > 0 && (
                      <span className="badge bg-danger ms-2">New</span>
                    )}
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body p-4">
              {activeTab === 'health' && <ServiceHealth />}
              
              {activeTab === 'user' && <UserValidator />}
              
              {activeTab === 'error' && (
                <ErrorGenerator onErrorGenerated={handleErrorGenerated} />
              )}

              {activeTab === 'errorlog' && (
                <ErrorLog key={refreshKey} />
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
                {errorStats.lastTimestamp && (
                  <tr>
                    <th scope="row">Last Error Generated</th>
                    <td>{errorStats.lastTimestamp.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugTools;