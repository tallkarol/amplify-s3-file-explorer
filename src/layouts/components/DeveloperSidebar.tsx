// src/layouts/components/DeveloperSidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface DeveloperSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const DeveloperSidebar = ({ collapsed, onToggle }: DeveloperSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuthenticator();
  
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
          {/* Developer Dashboard */}
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
              {!collapsed && <span>Developer Dashboard</span>}
            </Link>
          </li>
          {/* User Dashboard */}
          <li className="nav-item mb-2">
            <Link 
              to="/user" 
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/user') && location.pathname === '/user'
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-person me-3 fs-5"></i>
              {!collapsed && <span>User Dashboard</span>}
            </Link>
          </li>
          {/* Admin Dashboard */}
          <li className="nav-item mb-2">
            <Link 
              to="/admin" 
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/admin') && location.pathname === '/admin'
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-person-gear me-3 fs-5"></i>
              {!collapsed && <span>Admin Dashboard</span>}
            </Link>
          </li>
          

      {/* Divider */}
      <div className="border-top border-secondary my-2"></div>

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
      
      
      
      {/* Sidebar footer with sign out button */}
      <div className="sidebar-footer mt-auto p-3 border-top border-secondary">
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