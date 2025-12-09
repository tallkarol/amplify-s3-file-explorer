import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';
import UserProfileModal from '@/features/clients/components/UserProfileModal';
import SidebarNotifications from './SidebarNotifications';
import '@/styles/adminsidebar.css'; // We'll create this file for custom styles

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({ collapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut, user } = useAuthenticator();
  const [userInitials, setUserInitials] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  // Generate user initials from user email or attributes
  useEffect(() => {
    if (user && user.username) {
      // If using email, take first letter of parts before @
      const emailParts = user.username.split('@')[0].split('.');
      if (emailParts.length > 1) {
        setUserInitials(`${emailParts[0][0]}${emailParts[1][0]}`.toUpperCase());
      } else {
        setUserInitials(emailParts[0].substring(0, 2).toUpperCase());
      }
    }
  }, [user]);

  
  
  // Handle opening and closing the profile modal
  const openProfileModal = () => setProfileModalOpen(true);
  const closeProfileModal = () => setProfileModalOpen(false);
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);


  
  return (
    <>
      <div className={`sidebar bg-dark ${collapsed ? 'collapsed' : ''}`}>
        {/* Sidebar header with logo and toggle */}
        <div className="sidebar-header d-flex justify-content-between align-items-center p-3 border-bottom border-dark">
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
        
        {/* User info section - NEW MODERN SECTION - Now clickable */}
        <div 
          className="user-info-section p-3 clickable" 
          onClick={openProfileModal}
          title="Edit profile"
        >
          <div className="d-flex align-items-center">
            <div className="user-avatar">
              {userInitials}
            </div>
            
            {!collapsed && (
              <div className="user-details ms-3 fade-in">
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="user-name mb-0 text-white">
                    {(user as any)?.attributes?.name || 'Admin User'}
                  </h6>
                  <i className="bi bi-pencil-square ms-2 edit-icon"></i>
                </div>
                <div className="user-email">
                  {user?.username}
                </div>
                <span className="user-status">
                  <span className="status-indicator"></span>
                  Online
                </span>
              </div>
            )}
          </div>
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
          
          {/* Add Notifications Link */}
          <li className="nav-item mb-2">
            <SidebarNotifications collapsed={collapsed} />
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
              {!collapsed && <span>Client Management</span>}
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
              {!collapsed && <span>File Management</span>}
            </Link>
          </li>
        </ul>
      </div>
        
      {/* Sidebar footer with back to user dashboard link */}
      <div className="sidebar-footer mt-auto p-3 border-top border-dark d-flex flex-column gap-2">
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
    {/* Render the user profile modal when open */}
    <UserProfileModal 
        isOpen={profileModalOpen} 
        onClose={closeProfileModal} 
      />
      </>
  );
};

export default AdminSidebar;