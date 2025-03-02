// src/layouts/componeents/DeveloperSidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface DeveloperSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const DeveloperSidebar = ({ collapsed, onToggle }: DeveloperSidebarProps) => {
  const location = useLocation();
  const {signOut} = useAuthenticator();
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <div className={`sidebar bg-dark ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar header with logo and toggle */}
      <div className="sidebar-header d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
        <Link to="/developer" className="text-decoration-none text-white d-flex align-items-center">
          <i className="bi bi-code-slash fs-4 me-2 text-info"></i>
          {!collapsed && <span className="fs-5 fw-semibold">Developer Portal</span>}
        </Link>
        <button 
          className="btn btn-sm text-light border-0" 
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`}></i>
        </button>
      </div>
      
      {/* Developer navigation links */}
      <div className="sidebar-nav p-2">
        <ul className="nav flex-column">
          {/* Dashboard */}
          <li className="nav-item mb-2">
            <Link 
              to="/developer" 
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/developer') && location.pathname === '/developer'
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-speedometer2 me-3 fs-5"></i>
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>
          
          {/* Feature Toggles */}
          <li className="nav-item mb-2">
            <Link 
              to="/developer/features" 
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/developer/features') 
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-toggles me-3 fs-5"></i>
              {!collapsed && <span>Feature Toggles</span>}
            </Link>
          </li>
          
          {/* Support Tickets */}
          <li className="nav-item mb-2">
            <Link 
              to="/developer/support" 
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/developer/support') 
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-ticket-detailed me-3 fs-5"></i>
              {!collapsed && <span>Support Tickets</span>}
            </Link>
          </li>
          
          {/* Debug Tools */}
          <li className="nav-item mb-2">
            <Link 
              to="/developer/debug" 
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/developer/debug') 
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-bug me-3 fs-5"></i>
              {!collapsed && <span>Debug Tools</span>}
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Divider */}
      <div className="border-top border-secondary my-2"></div>
      
      {/* Additional links */}
      <div className="sidebar-nav p-2">
        <ul className="nav flex-column">
          {/* API Documentation */}
          <li className="nav-item mb-2">
            <Link 
              to="/developer/api-docs" 
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/developer/api-docs') 
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-file-earmark-code me-3 fs-5"></i>
              {!collapsed && <span>API Docs</span>}
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Sidebar footer with back to user dashboard link */}
      <div className="sidebar-footer mt-auto p-3 border-top border-secondary d-flex flex-column gap-2">
        <Link 
          to="/user" 
          className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center"
        >
          <i className="bi bi-layout-text-window me-2"></i>
          {!collapsed && <span>User Dashboard</span>}
        </Link>
        
        <button 
          onClick={signOut}
          className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center"
        >
          <i className="bi bi-box-arrow-right me-2"></i>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default DeveloperSidebar;