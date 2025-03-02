// src/layouts/components/DeveloperSidebar.tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface DeveloperSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const DeveloperSidebar = ({ collapsed, onToggle }: DeveloperSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuthenticator();
  
  // Dropdown state management
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  // Toggle dropdown for admin links
  const toggleAdminDropdown = (e: React.MouseEvent) => {
    if (collapsed) return; // Don't toggle when sidebar is collapsed
    e.preventDefault();
    setAdminDropdownOpen(!adminDropdownOpen);
    setUserDropdownOpen(false); // Close other dropdown
  };

  // Toggle dropdown for user links
  const toggleUserDropdown = (e: React.MouseEvent) => {
    if (collapsed) return; // Don't toggle when sidebar is collapsed
    e.preventDefault();
    setUserDropdownOpen(!userDropdownOpen);
    setAdminDropdownOpen(false); // Close other dropdown
  };

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
          
          {/* Admin Dashboard Dropdown */}
          <li className="nav-item mb-2">
            <a 
              href="#"
              onClick={toggleAdminDropdown}
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/admin') 
                  ? 'active bg-danger text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-shield-lock me-3 fs-5"></i>
              {!collapsed && (
                <div className="d-flex justify-content-between align-items-center w-100">
                  <span>Admin Portal</span>
                  <i className={`bi bi-chevron-${adminDropdownOpen ? 'up' : 'down'} fs-6`}></i>
                </div>
              )}
            </a>
            
            {/* Admin Links Dropdown */}
            {!collapsed && adminDropdownOpen && (
              <div className="ms-4 mt-2">
                <ul className="nav flex-column">
                  <li className="nav-item mb-1">
                    <Link to="/admin" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-house-door me-2"></i> Dashboard
                    </Link>
                  </li>
                  <li className="nav-item mb-1">
                    <Link to="/admin/clients" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-people me-2"></i> Client Management
                    </Link>
                  </li>
                  <li className="nav-item mb-1">
                    <Link to="/admin/files" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-folder me-2"></i> File Management
                    </Link>
                  </li>
                  <li className="nav-item mb-1">
                    <Link to="/admin/workflows" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-diagram-3 me-2"></i> Workflows
                    </Link>
                  </li>
                  <li className="nav-item mb-1">
                    <Link to="/admin/inbox" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-inbox me-2"></i> Inbox
                    </Link>
                  </li>
                  <li className="nav-item mb-1">
                    <Link to="/admin/calendar" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-calendar3 me-2"></i> Calendar
                    </Link>
                  </li>
                  <li className="nav-item mb-1">
                    <Link to="/admin/settings" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-gear me-2"></i> Settings
                    </Link>
                  </li>
                  <li className="nav-item mb-1">
                    <Link to="/admin/support" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-question-circle me-2"></i> Support
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </li>
          
          {/* User Dashboard Dropdown */}
          <li className="nav-item mb-2">
            <a 
              href="#"
              onClick={toggleUserDropdown}
              className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                isActive('/user') 
                  ? 'active bg-primary text-white' 
                  : 'text-light hover-highlight'
              }`}
            >
              <i className="bi bi-person me-3 fs-5"></i>
              {!collapsed && (
                <div className="d-flex justify-content-between align-items-center w-100">
                  <span>User Portal</span>
                  <i className={`bi bi-chevron-${userDropdownOpen ? 'up' : 'down'} fs-6`}></i>
                </div>
              )}
            </a>
            
            {/* User Links Dropdown */}
            {!collapsed && userDropdownOpen && (
              <div className="ms-4 mt-2">
                <ul className="nav flex-column">
                  <li className="nav-item mb-1">
                    <Link to="/user" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-house-door me-2"></i> Dashboard
                    </Link>
                  </li>
                  <li className="nav-item mb-1">
                    <Link to="/user/folder/certificate" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-award me-2"></i> Certificates
                    </Link>
                  </li>
                  <li className="nav-item mb-1">
                    <Link to="/user/folder/audit-report" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-file-earmark-text me-2"></i> Audit Reports
                    </Link>
                  </li>
                  <li className="nav-item mb-1">
                    <Link to="/user/folder/auditor-resume" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-person-badge me-2"></i> Auditor Profiles
                    </Link>
                  </li>
                  <li className="nav-item mb-1">
                    <Link to="/user/folder/statistics" className="nav-link py-1 text-light opacity-75 hover-highlight">
                      <i className="bi bi-graph-up me-2"></i> Statistics
                    </Link>
                  </li>
                </ul>
              </div>
            )}
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