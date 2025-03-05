// src/components/layout/AdminSidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({ collapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const {signOut} = useAuthenticator();
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <div className={`sidebar bg-dark ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar header with logo and toggle */}
      <div className="sidebar-header d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
        <Link to="/admin" className="text-decoration-none text-white d-flex align-items-center">
          <i className="bi bi-shield-lock fs-4 me-2 text-primary"></i>
          {!collapsed && <span className="fs-5 fw-semibold">Admin Portal</span>}
        </Link>
        <button 
          className="btn btn-sm text-light border-0" 
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`}></i>
        </button>
      </div>
      
      {/* Admin navigation links */}
      <div className="sidebar-nav p-2">
        <ul className="nav flex-column">
          {/* Dashboard/Home */}
          <li className="nav-item mb-2">
            <Link 
              to="/admin" 
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/admin') && location.pathname === '/admin'
                  ? 'active bg-primary text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-speedometer2 me-3 fs-5"></i>
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>
          
          {/* Client Management */}
          <li className="nav-item mb-2">
            <Link 
              to="/admin/clients" 
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/admin/clients') 
                  ? 'active bg-primary text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-people me-3 fs-5"></i>
              {!collapsed && <span>Client Manager</span>}
            </Link>
          </li>
          
          {/* File Management */}
          <li className="nav-item mb-2">
            <Link 
              to="/admin/files" 
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/admin/files') 
                  ? 'active bg-primary text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-folder me-3 fs-5"></i>
              {!collapsed && <span>File Manager</span>}
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
          {!collapsed && <span>Preview User Dashboard</span>}
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

export default AdminSidebar;