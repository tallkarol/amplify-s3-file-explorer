// src/pages/developer/DebugTools.tsx
import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import AlertMessage from '../../components/common/AlertMessage';
import { useUserRole } from '../../hooks/useUserRole';

// Simple interface for error logs
interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  userAgent?: string;
  component?: string;
  userId?: string;
}

const DebugTools = () => {
  const { isDeveloper } = useUserRole();
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [systemInfo, setSystemInfo] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('logs');

  useEffect(() => {
    // Load error logs from localStorage on component mount
    loadErrorLogs();
    // Collect system information
    collectSystemInfo();
  }, []);

  // Load saved error logs
  const loadErrorLogs = () => {
    try {
      const savedLogs = localStorage.getItem('dev_error_logs');
      if (savedLogs) {
        setErrorLogs(JSON.parse(savedLogs));
      }
    } catch (error) {
      console.error('Failed to load error logs:', error);
    }
  };

  // Collect basic system information
  const collectSystemInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
    };
    setSystemInfo(info);
  };

  // Clear all logs
  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all error logs?')) {
      localStorage.removeItem('dev_error_logs');
      setErrorLogs([]);
    }
  };

  // Generate a test error
  const generateTestError = () => {
    try {
      // Deliberately cause an error
      throw new Error('This is a test error generated from the debug tools page');
    } catch (error) {
      if (error instanceof Error) {
        logError(error);
      }
    }
  };

  // Log an error (would normally be called from an error boundary or try/catch)
  const logError = (error: Error, component?: string) => {
    const newLog: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      component: component || 'DebugTools',
      userId: 'developer' // In a real app, get from authentication
    };

    // Add to state and localStorage
    const updatedLogs = [newLog, ...errorLogs];
    setErrorLogs(updatedLogs);
    localStorage.setItem('dev_error_logs', JSON.stringify(updatedLogs));
  };

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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Developer Debug Tools</h2>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <Card title="Debug Actions">
            <div className="d-grid gap-2">
              <button
                className="btn btn-primary"
                onClick={() => generateTestError()}
              >
                <i className="bi bi-bug me-2"></i>
                Generate Test Error
              </button>
              <button
                className="btn btn-outline-danger"
                onClick={clearLogs}
              >
                <i className="bi bi-trash me-2"></i>
                Clear Error Logs
              </button>
            </div>
          </Card>
        </div>
        <div className="col-md-9">
          <Card>
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('logs')}
                >
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Error Logs
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'system' ? 'active' : ''}`}
                  onClick={() => setActiveTab('system')}
                >
                  <i className="bi bi-info-circle me-2"></i>
                  System Info
                </button>
              </li>
            </ul>

            <div className="p-3">
              {activeTab === 'logs' && (
                <>
                  <h5>Error Logs</h5>
                  {errorLogs.length === 0 ? (
                    <div className="alert alert-info">
                      No error logs found. Generate a test error to see how it works.
                    </div>
                  ) : (
                    <div className="list-group">
                      {errorLogs.map(log => (
                        <div key={log.id} className="list-group-item">
                          <div className="d-flex justify-content-between">
                            <h6 className="mb-1">{log.message}</h6>
                            <small>{new Date(log.timestamp).toLocaleString()}</small>
                          </div>
                          {log.component && (
                            <p className="mb-1">
                              <strong>Component:</strong> {log.component}
                            </p>
                          )}
                          {log.stack && (
                            <pre className="bg-light p-2 mt-2 rounded text-danger" style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                              {log.stack}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'system' && (
                <>
                  <h5>System Information</h5>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <tbody>
                        {Object.entries(systemInfo).map(([key, value]) => (
                          <tr key={key}>
                            <th scope="row" style={{ width: '30%' }}>{key}</th>
                            <td>{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DebugTools;