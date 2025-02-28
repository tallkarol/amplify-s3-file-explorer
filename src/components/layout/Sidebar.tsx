// src/components/layout/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface SidebarProps {
  isAdmin: boolean;
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isAdmin, collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { signOut, user } = useAuthenticator();
  
  const isActive = (path: string) => location.pathname === path;
  const userEmail = user.username || '';
  
  return (
    <div className={`sidebar bg-dark ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar header with logo and toggle */}
      <div className="sidebar-header d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
        <Link to="/" className="text-decoration-none text-white d-flex align-items-center">
          <i className="bi bi-folder-fill fs-4 me-2 text-primary"></i>
          {!collapsed && <span className="fs-5 fw-semibold">S3 Explorer</span>}
        </Link>
        <button 
          className="btn btn-sm text-light border-0" 
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`}></i>
        </button>
      </div>
      
      {/* User info section */}
      <div className="sidebar-user p-3 border-bottom border-secondary">
        <div className="d-flex align-items-center">
          <div className="bg-primary bg-opacity-25 text-primary rounded-circle p-2">
            <i className="bi bi-person-circle fs-4"></i>
          </div>
          {!collapsed && (
            <div className="ms-3 text-truncate">
              <div className="fw-semibold text-white">{userEmail}</div>
              <div className="text-light small">
                <span className={`badge ${isAdmin ? 'bg-danger' : 'bg-info'}`}>
                  {isAdmin ? 'Administrator' : 'User'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation links */}
      <div className="sidebar-nav p-2">
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link 
              to="/user" 
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/user') 
                  ? 'active bg-primary text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-house-door me-3 fs-5"></i>
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>
          
          {isAdmin && (
            <li className="nav-item mb-2">
              <Link 
                to="/admin" 
                className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                  isActive('/admin') 
                    ? 'active bg-primary text-white' 
                    : 'text-light hover-highlight'
                }`}
              >
                <i className="bi bi-speedometer2 me-3 fs-5"></i>
                {!collapsed && <span>Admin</span>}
              </Link>
            </li>
          )}
        </ul>
      </div>
      
      {/* Sidebar footer with sign out */}
      <div className="sidebar-footer mt-auto p-3 border-top border-secondary">
        <button 
          onClick={signOut}
          className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center"
        >
          <i className="bi bi-box-arrow-right me-2"></i>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;