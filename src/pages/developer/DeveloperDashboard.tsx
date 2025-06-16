// src/pages/developer/DeveloperDashboard.tsx
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { useAuthenticator } from '@aws-amplify/ui-react';

const DeveloperDashboard = () => {
  const { user } = useAuthenticator();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Developer Dashboard</h2>
          <p className="text-muted mb-0">
            Welcome, {user.username} • Role: Developer
          </p>
        </div>
      </div>

      {(
        <>
          {/* Quick Actions Section */}
          <div className="row mb-4">
            <div className="col-12">
              <Card title="Quick Actions" className="mb-4">
                <div className="row">
                  <div className="col-md-3 mb-3 mb-md-0">
                    <Link to="/user" className="btn btn-outline-success d-flex align-items-center justify-content-center flex-column py-4 h-100 w-100">
                      <i className="bi bi-person fs-1 mb-2"></i>
                      <span>User Dashboard</span>
                    </Link>
                  </div>
                  <div className="col-md-3 mb-3 mb-md-0">
                    <Link to="/admin" className="btn btn-outline-dark d-flex align-items-center justify-content-center flex-column py-4 h-100 w-100">
                      <i className="bi bi-person-gear fs-1 mb-2"></i>
                      <span>Admin Dashboard</span>
                    </Link>
                  </div>
                  <div className="col-md-3 mb-3 mb-md-0">
                    <Link to="/developer/debug" className="btn btn-outline-secondary d-flex align-items-center justify-content-center flex-column py-4 h-100 w-100">
                      <i className="bi bi-bug fs-1 mb-2"></i>
                      <span>Debug Tools</span>
                    </Link>
                  </div>
                  <div className="col-md-3 mb-3 mb-md-0">
                  <Link to="/developer/certification-form" className="btn btn-outline-primary d-flex align-items-center justify-content-center flex-column py-4 h-100 w-100">
                    <i className="bi bi-file-earmark-text fs-1 mb-2"></i>
                    <span>Certification Form</span>
                  </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DeveloperDashboard;