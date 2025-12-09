// src/layouts/components/DeveloperSidebar.tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import SidebarNotifications from './SidebarNotifications';

interface DeveloperSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const DeveloperSidebar = ({ collapsed, onToggle }: DeveloperSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuthenticator();
  
  // Track dropdown open states
  const [adminViewsOpen, setAdminViewsOpen] = useState(false);
  const [userViewsOpen, setUserViewsOpen] = useState(false);
  
  // Helper function to check if a path is active
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);
  
  // Helper function to check if a dropdown should be open based on current path
  const isDropdownActive = (paths: string[]) => {
    return paths.some(path => isActive(path));
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
              {!collapsed && <span>Developer Dashboard</span>}
            </Link>
          </li>
          
          {/* Add Notifications Link */}
          <li className="nav-item mb-2">
            <SidebarNotifications collapsed={collapsed} />
          </li>

          {/* ADMIN VIEWS DROPDOWN */}
          <li className="nav-item mb-2">
            <button
              className={`nav-link px-3 py-2 d-flex align-items-center rounded w-100 border-0 ${
                isDropdownActive(['/developer/admin']) 
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
              onClick={() => setAdminViewsOpen(!adminViewsOpen)}
              aria-expanded={adminViewsOpen}
            >
              <i className="bi bi-shield-lock me-3 fs-5"></i>
              {!collapsed && (
                <>
                  <span className="flex-grow-1 text-start">Admin Views</span>
                  <i className={`bi bi-chevron-${adminViewsOpen ? 'down' : 'right'} ms-2`}></i>
                </>
              )}
            </button>
            
            {/* Admin Views dropdown content */}
            <div className={`ms-4 mt-2 ${(adminViewsOpen || collapsed) ? 'd-block' : 'd-none'}`}>
              <ul className="nav flex-column">
                <li className="nav-item">
                  <Link 
                    to="/developer/admin" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      isActive('/developer/admin') && location.pathname === '/developer/admin'
                        ? 'active bg-info text-white' 
                        : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Admin Dashboard" : ""}
                  >
                    <i className="bi bi-speedometer2 me-2"></i>
                    {!collapsed && <span>Admin Dashboard</span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/developer/admin/clients" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      isActive('/developer/admin/clients') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Client Management" : ""}
                  >
                    <i className="bi bi-people me-2"></i>
                    {!collapsed && <span>Client Management</span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/developer/admin/files" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      isActive('/developer/admin/files') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "File Management" : ""}
                  >
                    <i className="bi bi-folder me-2"></i>
                    {!collapsed && <span>File Management</span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/developer/admin/inbox" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                      isActive('/developer/admin/inbox') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Admin Inbox" : ""}
                  >
                    <i className="bi bi-envelope me-2"></i>
                    {!collapsed && <span>Admin Inbox</span>}
                  </Link>
                </li>
              </ul>
            </div>
          </li>

          {/* USER VIEWS DROPDOWN */}
          <li className="nav-item mb-2">
            <button
              className={`nav-link px-3 py-2 d-flex align-items-center rounded w-100 border-0 ${
                isDropdownActive(['/developer/user']) 
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
              onClick={() => setUserViewsOpen(!userViewsOpen)}
              aria-expanded={userViewsOpen}
            >
              <i className="bi bi-person me-3 fs-5"></i>
              {!collapsed && (
                <>
                  <span className="flex-grow-1 text-start">User Views</span>
                  <i className={`bi bi-chevron-${userViewsOpen ? 'down' : 'right'} ms-2`}></i>
                </>
              )}
            </button>
            
            {/* User Views dropdown content */}
            <div className={`ms-4 mt-2 ${(userViewsOpen || collapsed) ? 'd-block' : 'd-none'}`}>
              <ul className="nav flex-column">
                <li className="nav-item">
                  <Link 
                    to="/developer/user" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      isActive('/developer/user') && location.pathname === '/developer/user'
                        ? 'active bg-info text-white' 
                        : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "User Dashboard" : ""}
                  >
                    <i className="bi bi-speedometer2 me-2"></i>
                    {!collapsed && <span>User Dashboard</span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/developer/user/inbox" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      isActive('/developer/user/inbox') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "User Inbox" : ""}
                  >
                    <i className="bi bi-envelope me-2"></i>
                    {!collapsed && <span>User Inbox</span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/developer/user/profile" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      isActive('/developer/user/profile') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Profile & Settings" : ""}
                  >
                    <i className="bi bi-gear me-2"></i>
                    {!collapsed && <span>Profile & Settings</span>}
                  </Link>
                </li>
                <li className="nav-item mt-2">
                  <div className={`text-muted small px-3 ${collapsed ? 'd-none' : ''}`}>Folders</div>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/developer/user/folder/certificate" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      location.pathname.includes('/folder/certificate') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Certificates" : ""}
                  >
                    <i className="bi bi-award me-2"></i>
                    {!collapsed && <span>Certificates</span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/developer/user/folder/audit-report" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      location.pathname.includes('/folder/audit-report') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Audit Reports" : ""}
                  >
                    <i className="bi bi-file-earmark-text me-2"></i>
                    {!collapsed && <span>Audit Reports</span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/developer/user/folder/auditor-resume" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      location.pathname.includes('/folder/auditor-resume') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Auditor Profiles" : ""}
                  >
                    <i className="bi bi-person-badge me-2"></i>
                    {!collapsed && <span>Auditor Profiles</span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/developer/user/folder/statistics" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                      location.pathname.includes('/folder/statistics') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Statistics" : ""}
                  >
                    <i className="bi bi-graph-up me-2"></i>
                    {!collapsed && <span>Statistics</span>}
                  </Link>
                </li>
              </ul>
            </div>
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
            <li className="nav-item mb-2">
              <Link 
                to="/developer/certification-form" 
                className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                  isActive('/developer/certification-form') 
                    ? 'active bg-info text-white' 
                    : 'text-light hover-highlight'
                }`}
              >
                <i className="bi bi-file-earmark-text me-3 fs-5"></i>
                {!collapsed && <span>Certification Form</span>}
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