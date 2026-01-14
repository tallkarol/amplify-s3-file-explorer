// src/pages/developer/DebugTools.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import AlertMessage from '../../components/common/AlertMessage';
import { useUserRole } from '../../hooks/useUserRole';
import ServiceHealth from '../../components/developer/ServiceHealth';
import UserValidator from '../../components/developer/UserValidator';
import ErrorGenerator from '../../components/developer/ErrorGenerator';
import ErrorLog from '../../components/developer/ErrorLog';
import UserLookup from '../../components/developer/UserLookup';
import ErrorLoggerDemo from '../../components/developer/ErrorLoggerDemo';
import NotificationDemo from '../../components/developer/NotificationDemo';
// import NotificationUsageExample from '../../features/notifications/examples/NotificationUsageExample';

const DebugTools = () => {
  const { isDeveloper } = useUserRole();
  const { user } = useAuthenticator();
  const [activeTab, setActiveTab] = useState('health');
  const [errorStats, setErrorStats] = useState<{ count: number; lastTimestamp: Date | null }>({ count: 0, lastTimestamp: null });
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [notificationStats, setNotificationStats] = useState<{ count: number; lastTimestamp: Date | null }>({ count: 0, lastTimestamp: null });

  // Update error stats when an error is generated
  const handleErrorGenerated = () => {
    setErrorStats(prev => ({
      count: prev.count + 1,
      lastTimestamp: new Date()
    }));
    
    // Force a refresh of the error log component
    setRefreshKey(prev => prev + 1);
  };

  // Handle errors logged via ErrorLoggerDemo
  const handleErrorLogged = (_errorType: string, _errorMessage: string) => {
    // Update stats just like with the error generator
    handleErrorGenerated();
  };

  // Handle notification creation
  const handleNotificationCreated = (_type: string, _message: string) => {
    setNotificationStats(prev => ({
      count: prev.count + 1,
      lastTimestamp: new Date()
    }));
  };

  // Handle user selection from UserLookup
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    // If not already on error log tab, switch to it
    if (activeTab !== 'errorlog') {
      setActiveTab('errorlog');
    }
  };

  // Reset error stats when switching to error log tab
  useEffect(() => {
    if (activeTab === 'errorlog') {
      setErrorStats({ count: 0, lastTimestamp: null });
    } else if (activeTab === 'notifications') {
      setNotificationStats({ count: 0, lastTimestamp: null });
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
              <ul className="nav nav-tabs card-header-tabs flex-wrap" style={{ borderBottom: 'none', gap: '0.25rem' }}>
                <li className="nav-item">
                  <button
                    className={`nav-link small d-flex align-items-center ${activeTab === 'health' ? 'active bg-white' : 'text-white'}`}
                    onClick={() => setActiveTab('health')}
                    style={{ 
                      whiteSpace: 'normal', 
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      lineHeight: '1.3',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      minWidth: 'fit-content'
                    }}
                  >
                    <i className="bi bi-activity me-2 flex-shrink-0" style={{ fontSize: '0.875rem' }}></i>
                    <span style={{ whiteSpace: 'nowrap' }}>Service Health</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link small d-flex align-items-center ${activeTab === 'user' ? 'active bg-white' : 'text-white'}`}
                    onClick={() => setActiveTab('user')}
                    style={{ 
                      whiteSpace: 'normal', 
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      lineHeight: '1.3',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      minWidth: 'fit-content'
                    }}
                  >
                    <i className="bi bi-person-check me-2 flex-shrink-0" style={{ fontSize: '0.875rem' }}></i>
                    <span style={{ whiteSpace: 'nowrap' }}>User Validator</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link small d-flex align-items-center ${activeTab === 'error' ? 'active bg-white' : 'text-white'}`}
                    onClick={() => setActiveTab('error')}
                    style={{ 
                      whiteSpace: 'normal', 
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      lineHeight: '1.3',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      minWidth: 'fit-content'
                    }}
                  >
                    <i className="bi bi-bug me-2 flex-shrink-0" style={{ fontSize: '0.875rem' }}></i>
                    <span style={{ whiteSpace: 'nowrap' }}>Error Generator</span>
                    {errorStats.count > 0 && (
                      <span className="badge bg-danger ms-2 flex-shrink-0" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>{errorStats.count}</span>
                    )}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link small d-flex align-items-center ${activeTab === 'errorlog' ? 'active bg-white' : 'text-white'}`}
                    onClick={() => setActiveTab('errorlog')}
                    style={{ 
                      whiteSpace: 'normal', 
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      lineHeight: '1.3',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      minWidth: 'fit-content'
                    }}
                  >
                    <i className="bi bi-journal-code me-2 flex-shrink-0" style={{ fontSize: '0.875rem' }}></i>
                    <span style={{ whiteSpace: 'nowrap' }}>Error Logs</span>
                    {errorStats.count > 0 && (
                      <span className="badge bg-danger ms-2 flex-shrink-0" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>New</span>
                    )}
                  </button>
                </li>
                {/* Logger Demo tab */}
                <li className="nav-item">
                  <button
                    className={`nav-link small d-flex align-items-center ${activeTab === 'logger' ? 'active bg-white' : 'text-white'}`}
                    onClick={() => setActiveTab('logger')}
                    style={{ 
                      whiteSpace: 'normal', 
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      lineHeight: '1.3',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      minWidth: 'fit-content'
                    }}
                  >
                    <i className="bi bi-journal-text me-2 flex-shrink-0" style={{ fontSize: '0.875rem' }}></i>
                    <span style={{ whiteSpace: 'nowrap' }}>Logger Demo</span>
                  </button>
                </li>
                {/* New Notifications tab */}
                <li className="nav-item">
                  <button
                    className={`nav-link small d-flex align-items-center ${activeTab === 'notifications' ? 'active bg-white' : 'text-white'}`}
                    onClick={() => setActiveTab('notifications')}
                    style={{ 
                      whiteSpace: 'normal', 
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      lineHeight: '1.3',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      minWidth: 'fit-content'
                    }}
                  >
                    <i className="bi bi-bell me-2 flex-shrink-0" style={{ fontSize: '0.875rem' }}></i>
                    <span style={{ whiteSpace: 'nowrap' }}>Notifications</span>
                    {notificationStats.count > 0 && (
                      <span className="badge bg-primary ms-2 flex-shrink-0" style={{ fontSize: '0.65rem', padding: '0.15rem 0.35rem' }}>{notificationStats.count}</span>
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
                <div>
                  <div className="mb-4">
                    <UserLookup onSelectUser={handleUserSelect} />
                  </div>
                  <ErrorLog 
                    key={refreshKey} 
                    userIdFilter={selectedUserId}
                  />
                </div>
              )}
              
              {/* Logger Demo */}
              {activeTab === 'logger' && (
                <ErrorLoggerDemo onErrorLogged={handleErrorLogged} />
              )}
              
              {/* Notifications Demo */}
              {activeTab === 'notifications' && (
                <NotificationDemo onNotificationCreated={handleNotificationCreated} />
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
                {notificationStats.lastTimestamp && (
                  <tr>
                    <th scope="row">Last Notification Created</th>
                    <td>{notificationStats.lastTimestamp.toLocaleString()}</td>
                  </tr>
                )}
                {selectedUserId && (
                  <tr>
                    <th scope="row">Selected User ID</th>
                    <td>
                      <code>{selectedUserId}</code>
                      <button
                        className="btn btn-sm btn-link text-primary ms-2"
                        onClick={() => setSelectedUserId(undefined)}
                        title="Clear selected user"
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </td>
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