// src/layouts/components/Sidebar.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import UserProfileModal from '../../features/clients/components/UserProfileModal';
import SidebarNotifications from './SidebarNotifications';
// import { useNotifications } from '@/features/notifications/context/NotificationContext';
import { devLog } from '../../utils/logger';
import '@/styles/sidebar.css';
import '@/styles/adminsidebar.css';

interface SidebarProps {
  isAdmin: boolean;
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isAdmin, collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { signOut, user } = useAuthenticator();
  const [userEmail, setUserEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  const isActiveFolder = (folder: string) => location.pathname.includes(`/folder/${folder}`);

  // Create a client for making GraphQL requests
  const client = generateClient();
  
  // Generate user initials from user email or name
  useEffect(() => {
    if (user && user.username) {
      // If we have a full name, use that for initials
      devLog('User:', user);
      if (fullName) {
        const nameParts = fullName.split(' ');
        if (nameParts.length > 1) {
          setUserInitials(`${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase());
        } else {
          setUserInitials(nameParts[0].substring(0, 2).toUpperCase());
        }
      } else {
        // Otherwise use email parts
        const emailParts = user.username.split('@')[0].split('.');
        if (emailParts.length > 1) {
          setUserInitials(`${emailParts[0][0]}${emailParts[1][0]}`.toUpperCase());
        } else {
          setUserInitials(emailParts[0].substring(0, 2).toUpperCase());
        }
      }
    }
  }, [user, fullName]);
  
  // Fix the fetchUserProfile function to match UserProfileModal's approach
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        devLog("Fetching profile data for user:", user);
        
        // Use userId directly like in UserProfileModal
        const userId = user.userId;
        
        // Query by UUID instead of profileOwner - this is how UserProfileModal works successfully
        const queryByUuid = /* GraphQL */ `
          query GetUserProfileByUuid($uuid: String!) {
            listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 10) {
              items {
                id
                email
                uuid
                profileOwner
                firstName
                lastName
                companyName
                phoneNumber
                preferredContactMethod
              }
            }
          }
        `;
        
        const response = await client.graphql<GraphQLQuery<any>>({
          query: queryByUuid,
          variables: { uuid: userId },
          authMode: 'userPool'
        });
        
        devLog('Sidebar - Profile query response:', response);
        
        const items = response?.data?.listUserProfiles?.items;
        if (items && items.length > 0) {
          const userProfile = items[0];
          devLog("Profile data found:", userProfile);
          
          // Set email
          setUserEmail(userProfile.email || user.username);
          
          // Set full name if available
          const firstName = userProfile.firstName || '';
          const lastName = userProfile.lastName || '';
          
          if (firstName || lastName) {
            const name = `${firstName} ${lastName}`.trim();
            devLog("Setting full name:", name);
            setFullName(name);
          }
          
          // Set company name if available
          if (userProfile.companyName) {
            devLog("Setting company name:", userProfile.companyName);
            setCompanyName(userProfile.companyName);
          }
        } else {
          devLog("No profile data found, using username");
          setUserEmail(user.username);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setUserEmail(user.username || '');
      }
    };

    if (user?.userId) {
      fetchUserProfile();
    }
  }, [user?.userId]); // Only depend on userId, not entire user object or other changing values
  
  // Toggle profile modal
  const toggleProfileModal = () => {
    setIsProfileModalOpen(!isProfileModalOpen);
  };

  // Folder shortcuts data
  const folderShortcuts = [
    { id: 'certificate', name: 'Certificates', icon: 'award', color: 'primary' },
    { id: 'audit-report', name: 'Audit Reports', icon: 'file-earmark-text', color: 'success' },
    { id: 'auditor-resume', name: 'Auditor Profiles', icon: 'person-badge', color: 'info' },
    { id: 'statistics', name: 'Statistics', icon: 'graph-up', color: 'warning' }
  ];
  
  return (
    <>
      <div className={`sidebar bg-dark ${collapsed ? 'collapsed' : ''}`}>
        {/* Sidebar header with logo and toggle */}
        <div className="sidebar-header d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
          <Link to="/" className="text-decoration-none text-white d-flex align-items-center">
            <i className="bi bi-folder-fill fs-4 me-2 text-primary"></i>
            {!collapsed && <span className="fs-5 fw-semibold">Client Portal</span>}
          </Link>
          <button 
            className="btn btn-sm text-light border-0" 
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>
        
        {/* User info section - using the admin sidebar styling */}
        <div 
          className="user-info-section p-3 clickable" 
          onClick={toggleProfileModal}
          title="Edit profile"
        >
          <div className="d-flex align-items-center">
            <div className="user-avatar">
              {userInitials}
            </div>
            
            {!collapsed && (
              <div className="user-details ms-3 fade-in">
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="user-name mb-0 text-truncate text-white" style={{ maxWidth: '160px' }}>
                    {companyName || fullName || userEmail || (user?.username || '')}
                  </h6>
                  <i className="bi bi-pencil-square ms-2 edit-icon"></i>
                </div>
                
                <div className="d-flex align-items-center mt-1">
                  <span className={`badge ${isAdmin ? 'bg-danger' : 'bg-info'} me-2`} style={{ fontSize: '0.65rem' }}>
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
            
            {/* Add Notifications Link */}
            <li className="nav-item mb-2">
              <SidebarNotifications collapsed={collapsed} />
            </li>
            
            {/* Folders directly in the sidebar instead of dropdown */}
            {folderShortcuts.map(folder => (
              <li className="nav-item mb-2" key={folder.id}>
                <Link 
                  to={`/user/folder/${folder.id}`} 
                  className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
                    isActiveFolder(folder.id) 
                      ? `active bg-${folder.color} text-white` 
                      : 'text-light hover-highlight'
                  }`}
                  title={collapsed ? folder.name : ''}
                >
                  <i className={`bi bi-${folder.icon} me-3 fs-5`}></i>
                  {!collapsed && <span>{folder.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Sidebar footer with sign out */}
        <div className="sidebar-footer mt-auto p-3 border-top border-secondary">
          {isAdmin && (
            <Link 
              to="/admin" 
              className="btn btn-outline-light mb-3 btn-sm w-100 d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-speedometer2 me-2"></i>
              {!collapsed && <span>Admin Dashboard</span>}
            </Link>
          )}

          <button 
            onClick={signOut}
            className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center"
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
      
      {/* User profile modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;