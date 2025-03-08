// src/components/developer/ErrorLog.tsx
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import { getAllErrorLogs, getUserErrorLogs } from '../../services/logService';
import { formatDistanceToNow } from '@/utils/dateUtils';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface ErrorLogProps {
  userIdFilter?: string;
  maxLogs?: number;
}

interface ErrorLogItem {
  id: string;
  userId: string;
  timestamp: number;
  logId: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  component?: string;
  deviceInfo?: Record<string, any>;
  createdAt: string;
}

const ErrorLog: React.FC<ErrorLogProps> = ({ userIdFilter, maxLogs = 100 }) => {
  const [logs, setLogs] = useState<ErrorLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthenticator();

  useEffect(() => {
    if (user && user.userId) {
      fetchLogs();
    }
  }, [userIdFilter, user]);

  const fetchLogs = async () => {
    if (!user || !user.userId) {
      setError("Cannot fetch logs: User not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let fetchedLogs: ErrorLogItem[];
      
      if (userIdFilter) {
        // Fetch logs for a specific user
        fetchedLogs = await getUserErrorLogs(userIdFilter, maxLogs);
      } else {
        // Fetch all logs (admin/developer only)
        fetchedLogs = await getAllErrorLogs(maxLogs);
      }
      
      // Sort logs by timestamp (newest first)
      fetchedLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      setLogs(fetchedLogs);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(`Failed to fetch error logs: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleLogDetails = (logId: string) => {
    if (expandedLogId === logId) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(logId);
    }
  };

  const getErrorTypeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'runtime':
      case 'referenceerror':
      case 'typeerror':
        return 'danger';
      case 'api':
      case 'network':
        return 'warning';
      case 'ui':
      case 'render':
        return 'info';
      case 'validation':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  // Filter logs based on search term and filter type
  const filteredLogs = logs.filter(log => {
    // Filter by search term
    const matchesSearch = 
      log.errorMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.errorType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.component?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      log.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by error type
    const matchesType = 
      filterType === 'all' ||
      log.errorType.toLowerCase().includes(filterType.toLowerCase());
    
    return matchesSearch && matchesType;
  });

  // Get unique error types for filter dropdown
  const errorTypes = Array.from(new Set(logs.map(log => log.errorType)));

  return (
    <Card title="Error Logs">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2 align-items-center">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="btn btn-outline-secondary border-start-0"
                onClick={() => setSearchTerm('')}
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
          
          <select 
            className="form-select w-auto"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Error Types</option>
            {errorTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <button 
            className="btn btn-outline-primary"
            onClick={fetchLogs}
            disabled={loading}
          >
            <i className={`bi bi-${loading ? 'hourglass' : 'arrow-clockwise'} me-1`}></i>
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <AlertMessage 
          type="danger"
          message={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}
      
      {loading ? (
        <LoadingSpinner text="Loading error logs..." />
      ) : filteredLogs.length === 0 ? (
        <div className="alert alert-info">
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle fs-4 me-3"></i>
            <div>
              <h5 className="mb-1">No Error Logs Found</h5>
              <p className="mb-0">
                {searchTerm || filterType !== 'all'
                  ? 'Try changing your search criteria or filters'
                  : 'No errors have been logged in the system yet'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Timestamp</th>
                  <th style={{ width: '150px' }}>Error Type</th>
                  <th>Error Message</th>
                  <th style={{ width: '120px' }}>Component</th>
                  <th style={{ width: '120px' }}>User ID</th>
                  <th style={{ width: '80px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr className={expandedLogId === log.id ? 'table-active' : ''}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <span className={`badge bg-${getErrorTypeClass(log.errorType)}`}>
                          {log.errorType}
                        </span>
                      </td>
                      <td className="text-truncate" style={{ maxWidth: '300px' }}>
                        {log.errorMessage}
                      </td>
                      <td>{log.component || 'Unknown'}</td>
                      <td className="text-truncate" style={{ maxWidth: '120px' }}>
                        <span title={log.userId}>{log.userId}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => toggleLogDetails(log.id)}
                        >
                          <i className={`bi bi-chevron-${expandedLogId === log.id ? 'up' : 'down'}`}></i>
                        </button>
                      </td>
                    </tr>
                    {expandedLogId === log.id && (
                      <tr>
                        <td colSpan={6} className="bg-light">
                          <div className="p-3">
                            <h6>Error Details</h6>
                            <div className="row">
                              <div className="col-md-6">
                                <div className="mb-3">
                                  <h6 className="text-muted mb-2">Error Message</h6>
                                  <div className="bg-white p-2 rounded border">
                                    {log.errorMessage}
                                  </div>
                                </div>
                                
                                <div className="mb-3">
                                  <h6 className="text-muted mb-2">Error Info</h6>
                                  <table className="table table-sm table-bordered mb-0">
                                    <tbody>
                                      <tr>
                                        <th style={{ width: '120px' }}>Log ID</th>
                                        <td>{log.logId}</td>
                                      </tr>
                                      <tr>
                                        <th>Component</th>
                                        <td>{log.component || 'Unknown'}</td>
                                      </tr>
                                      <tr>
                                        <th>Created</th>
                                        <td>
                                          {log.createdAt ? formatDistanceToNow(new Date(log.createdAt)) : 'Unknown'}
                                        </td>
                                      </tr>
                                      <tr>
                                        <th>User ID</th>
                                        <td>{log.userId}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              
                              <div className="col-md-6">
                                <div className="mb-3">
                                  <h6 className="text-muted mb-2">Stack Trace</h6>
                                  <pre className="bg-dark text-light p-2 rounded small overflow-auto" style={{ maxHeight: '200px' }}>
                                    {log.stackTrace || 'No stack trace available'}
                                  </pre>
                                </div>
                                
                                {log.deviceInfo && (
                                  <div>
                                    <h6 className="text-muted mb-2">Device Info</h6>
                                    <div className="bg-white p-2 rounded border overflow-auto" style={{ maxHeight: '150px' }}>
                                      <pre className="mb-0 small">
                                        {JSON.stringify(log.deviceInfo, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="text-muted small mt-2">
            Showing {filteredLogs.length} of {logs.length} error logs
            {searchTerm && ` (filtered by "${searchTerm}")`}
            {filterType !== 'all' && ` (filtered by type "${filterType}")`}
          </div>
        </>
      )}
    </Card>
  );
};

export default ErrorLog;