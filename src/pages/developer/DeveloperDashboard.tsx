// src/pages/developer/DeveloperDashboard.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuthenticator } from '@aws-amplify/ui-react';
import FeatureTogglePanel from '../../components/developer/FeatureTogglePanel';

interface SystemStatus {
  component: string;
  status: 'operational' | 'degraded' | 'outage';
  latency?: number;
  uptime?: string;
}

interface ApiMetric {
  endpoint: string;
  requests: number;
  avgResponseTime: number;
  errorRate: number;
}

const DeveloperDashboard = () => {
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [apiMetrics, setApiMetrics] = useState<ApiMetric[]>([]);

  useEffect(() => {
    // Simulate loading of dashboard data
    const timer = setTimeout(() => {
      setSystemStatus([
        { component: 'Authentication Service', status: 'operational', latency: 45, uptime: '99.99%' },
        { component: 'Storage Service', status: 'operational', latency: 62, uptime: '99.95%' },
        { component: 'Database Service', status: 'operational', latency: 53, uptime: '99.97%' },
        { component: 'API Gateway', status: 'operational', latency: 38, uptime: '100.00%' }
      ]);
      
      setApiMetrics([
        { endpoint: '/api/files', requests: 1245, avgResponseTime: 78, errorRate: 0.2 },
        { endpoint: '/api/users', requests: 856, avgResponseTime: 92, errorRate: 0.5 },
        { endpoint: '/api/auth', requests: 2103, avgResponseTime: 45, errorRate: 0.1 },
        { endpoint: '/api/tickets', requests: 342, avgResponseTime: 65, errorRate: 0.3 }
      ]);
      
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'success';
      case 'degraded': return 'warning';
      case 'outage': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Developer Dashboard</h2>
          <p className="text-muted mb-0">
            Welcome, {user.username} • Role: Developer
          </p>
        </div>
        <div>
          <button className="btn btn-outline-primary">
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh Data
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading dashboard data..." />
      ) : (
        <>
          {/* Quick Actions Section */}
          <div className="row mb-4">
            <div className="col-12">
              <Card title="Quick Actions" className="mb-4">
                <div className="row">
                  <div className="col-md-3 mb-3 mb-md-0">
                    <Link to="/developer/features" className="btn btn-outline-primary d-flex align-items-center justify-content-center flex-column py-4 h-100 w-100">
                      <i className="bi bi-toggles fs-1 mb-2"></i>
                      <span>Manage Features</span>
                    </Link>
                  </div>
                  <div className="col-md-3 mb-3 mb-md-0">
                    <Link to="/developer/support" className="btn btn-outline-info d-flex align-items-center justify-content-center flex-column py-4 h-100 w-100">
                      <i className="bi bi-ticket-detailed fs-1 mb-2"></i>
                      <span>Support Tickets</span>
                    </Link>
                  </div>
                  <div className="col-md-3 mb-3 mb-md-0">
                    <Link to="/developer/debug" className="btn btn-outline-warning d-flex align-items-center justify-content-center flex-column py-4 h-100 w-100">
                      <i className="bi bi-bug fs-1 mb-2"></i>
                      <span>Debug Tools</span>
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link to="/developer/api-docs" className="btn btn-outline-secondary d-flex align-items-center justify-content-center flex-column py-4 h-100 w-100">
                      <i className="bi bi-file-earmark-code fs-1 mb-2"></i>
                      <span>API Documentation</span>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* System Status and API Metrics */}
          <div className="row mb-4">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <Card title="System Status" className="h-100">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th>Status</th>
                        <th>Latency</th>
                        <th>Uptime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemStatus.map((system, index) => (
                        <tr key={index}>
                          <td>{system.component}</td>
                          <td>
                            <span className={`badge bg-${getStatusColor(system.status)}`}>
                              {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                            </span>
                          </td>
                          <td>{system.latency}ms</td>
                          <td>{system.uptime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
            
            <div className="col-lg-6">
              <Card title="API Metrics (Last 24h)" className="h-100">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Endpoint</th>
                        <th>Requests</th>
                        <th>Avg Response</th>
                        <th>Error Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiMetrics.map((api, index) => (
                        <tr key={index}>
                          <td>
                            <code>{api.endpoint}</code>
                          </td>
                          <td>{api.requests.toLocaleString()}</td>
                          <td>{api.avgResponseTime}ms</td>
                          <td>
                            <span className={`badge ${api.errorRate < 0.5 ? 'bg-success' : 'bg-warning'}`}>
                              {api.errorRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="row">
            <div className="col-12">
              <Card title="Feature Toggles" subtitle="Manage feature flags for testing and rollout">
                <FeatureTogglePanel />
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DeveloperDashboard;