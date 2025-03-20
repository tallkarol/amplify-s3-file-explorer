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
  const [workflowsOpen, setWorkflowsOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const [dashboardsOpen, setDashboardsOpen] = useState(false); // Add state for dashboards dropdown
  
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

          {/* DASHBOARDS DROPDOWN - NEW */}
          <li className="nav-item mb-2">
            <button
              className={`nav-link px-3 py-2 d-flex align-items-center rounded w-100 border-0 ${
                isDropdownActive(['/user', '/admin']) && 
                !isDropdownActive(['/user/workflows', '/user/files', '/admin/workflows', '/admin/files', '/admin/clients'])
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
              onClick={() => setDashboardsOpen(!dashboardsOpen)}
              aria-expanded={dashboardsOpen}
            >
              <i className="bi bi-grid-1x2 me-3 fs-5"></i>
              {!collapsed && (
                <>
                  <span className="flex-grow-1 text-start">Dashboards</span>
                  <i className={`bi bi-chevron-${dashboardsOpen ? 'down' : 'right'} ms-2`}></i>
                </>
              )}
            </button>
            
            {/* Dashboards dropdown content */}
            <div className={`ms-4 mt-2 ${(dashboardsOpen || collapsed) ? 'd-block' : 'd-none'}`}>
              <ul className="nav flex-column">
                <li className="nav-item">
                  <Link 
                    to="/user" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      isActive('/user') && location.pathname === '/user' 
                        ? 'active bg-info text-white' 
                        : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "User Dashboard" : ""}
                  >
                    <i className="bi bi-person me-3 fs-5"></i>
                    {!collapsed && <span>User Dashboard</span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/admin" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                      isActive('/admin') && location.pathname === '/admin' 
                        ? 'active bg-info text-white' 
                        : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Admin Dashboard" : ""}
                  >
                    <i className="bi bi-person-gear me-3 fs-5"></i>
                    {!collapsed && <span>Admin Dashboard</span>}
                  </Link>
                </li>
              </ul>
            </div>
          </li>

          {/* CLIENTS DROPDOWN */}
          <li className="nav-item mb-2">
            <button
              className={`nav-link px-3 py-2 d-flex align-items-center rounded w-100 border-0 ${
                isDropdownActive(['/admin/clients']) 
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
              onClick={() => setClientsOpen(!clientsOpen)}
              aria-expanded={clientsOpen}
            >
              <i className="bi bi-people me-3 fs-5"></i>
              {!collapsed && (
                <>
                  <span className="flex-grow-1 text-start">Clients</span>
                  <i className={`bi bi-chevron-${clientsOpen ? 'down' : 'right'} ms-2`}></i>
                </>
              )}
            </button>
            
            {/* Dropdown content */}
            <div className={`ms-4 mt-2 ${(clientsOpen || collapsed) ? 'd-block' : 'd-none'}`}>
              <ul className="nav flex-column">
                <li className="nav-item">
                  <Link 
                    to="/admin/clients" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                      isActive('/admin/clients') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Admin Clients Dashboard" : ""}
                  >
                    <i className="bi bi-people-fill me-3 fs-5"></i>
                    {!collapsed && <span>Admin Clients Dashboard</span>}
                  </Link>
                </li>
              </ul>
            </div>
          </li>          

          {/* FILES DROPDOWN */}
          <li className="nav-item mb-2">
            <button
              className={`nav-link px-3 py-2 d-flex align-items-center rounded w-100 border-0 ${
                isDropdownActive(['/user/files', '/admin/files']) 
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
              onClick={() => setFilesOpen(!filesOpen)}
              aria-expanded={filesOpen}
            >
              <i className="bi bi-folder me-3 fs-5"></i>
              {!collapsed && (
                <>
                  <span className="flex-grow-1 text-start">Files</span>
                  <i className={`bi bi-chevron-${filesOpen ? 'down' : 'right'} ms-2`}></i>
                </>
              )}
            </button>
            
            {/* Dropdown content */}
            <div className={`ms-4 mt-2 ${(filesOpen || collapsed) ? 'd-block' : 'd-none'}`}>
              <ul className="nav flex-column">
                <li className="nav-item">
                  <Link 
                    to="/user/files" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      isActive('/user/files') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "User Files Dashboard" : ""}
                  >
                    <i className="bi bi-file-earmark-person me-3 fs-5"></i>
                    {!collapsed && <span>User Files Dashboard</span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/admin/files" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                      isActive('/admin/files') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Admin Files Dashboard" : ""}
                  >
                    <i className="bi bi-file-earmark-lock me-3 fs-5"></i>
                    {!collapsed && <span>Admin Files Dashboard</span>}
                  </Link>
                </li>
              </ul>
            </div>
          </li>
          
          {/* WORKFLOWS DROPDOWN */}
          <li className="nav-item mb-2">
            <button
              className={`nav-link px-3 py-2 d-flex align-items-center rounded w-100 border-0 ${
                isDropdownActive(['/user/workflows', '/admin/workflows']) 
                  ? 'active bg-info text-white' 
                  : 'text-light hover-highlight'
              }`}
              onClick={() => setWorkflowsOpen(!workflowsOpen)}
              aria-expanded={workflowsOpen}
            >
              <i className="bi bi-diagram-3 me-3 fs-5"></i>
              {!collapsed && (
                <>
                  <span className="flex-grow-1 text-start">Workflows</span>
                  <i className={`bi bi-chevron-${workflowsOpen ? 'down' : 'right'} ms-2`}></i>
                </>
              )}
            </button>
            
            {/* Dropdown content - always visible if sidebar is collapsed */}
            <div className={`ms-4 mt-2 ${(workflowsOpen || collapsed) ? 'd-block' : 'd-none'}`}>
              <ul className="nav flex-column">
                <li className="nav-item">
                  <Link 
                    to="/user/workflows" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded mb-1 ${
                      isActive('/user/workflows') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "User Workflow Dashboard" : ""}
                  >
                    <i className="bi bi-person-lines-fill me-3 fs-5"></i>
                    {!collapsed && <span>User Workflow Dashboard</span>}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    to="/admin/workflows" 
                    className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                      isActive('/admin/workflows') ? 'active bg-info text-white' : 'text-light hover-highlight'
                    }`}
                    title={collapsed ? "Admin Workflow Dashboard" : ""}
                  >
                    <i className="bi bi-gear-wide-connected me-3 fs-5"></i>
                    {!collapsed && <span>Admin Workflow Dashboard</span>}
                  </Link>
                </li>
              </ul>
            </div>
          </li>
          
          {/* Removed standalone User and Admin Dashboard links */}
          
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