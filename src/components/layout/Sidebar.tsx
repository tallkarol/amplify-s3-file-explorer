// src/components/layout/Sidebar.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import UserProfileModal from '../user/UserProfileModal';

interface SidebarProps {
  isAdmin: boolean;
  collapsed: boolean;
  onToggle: () => void;
}

// Define query to get user email
const getUserProfileQuery = /* GraphQL */ `
  query GetUserProfile($profileOwner: String!) {
    listUserProfiles(filter: { profileOwner: { eq: $profileOwner } }, limit: 1) {
      items {
        email
        firstName
        lastName
      }
    }
  }
`;

// Response type for getUserProfile query
interface GetUserProfileResponse {
  listUserProfiles: {
    items: Array<{
      email: string;
      firstName?: string;
      lastName?: string;
    }>;
  };
}

const Sidebar = ({ isAdmin, collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { signOut, user } = useAuthenticator();
  const [userEmail, setUserEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  // Create a client for making GraphQL requests
  const client = generateClient();
  
  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profileOwner = `${user.userId}::${user.username}`;
        
        const response = await client.graphql<GraphQLQuery<GetUserProfileResponse>>({
          query: getUserProfileQuery,
          variables: {
            profileOwner
          },
          authMode: 'userPool'
        });
        
        const items = response?.data?.listUserProfiles?.items || [];
        
        if (items.length > 0) {
          setUserEmail(items[0].email || user.username);
          
          // Set full name if available
          const firstName = items[0].firstName || '';
          const lastName = items[0].lastName || '';
          
          if (firstName || lastName) {
            setFullName(`${firstName} ${lastName}`.trim());
          }
        } else {
          setUserEmail(user.username);
        }
      } catch (err) {
        console.error('Error fetching user email:', err);
        setUserEmail(user.username);
      }
    };

    fetchUserProfile();
  }, [user, isProfileModalOpen]); // Re-fetch when modal closes to update name
  
  // Toggle profile modal
  const toggleProfileModal = () => {
    setIsProfileModalOpen(!isProfileModalOpen);
  };
  
  return (
    <>
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
        
        {/* User info section - now clickable */}
        <div 
          className="sidebar-user p-3 border-bottom border-secondary"
          onClick={toggleProfileModal}
          style={{ cursor: 'pointer' }}
        >
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-25 text-primary rounded-circle p-2">
              <i className="bi bi-person-circle fs-4"></i>
            </div>
            {!collapsed && (
              <div className="ms-3 text-truncate">
                <div className="fw-semibold text-white">
                  {fullName || userEmail}
                </div>
                <div className="text-light small d-flex align-items-center">
                  <span className={`badge ${isAdmin ? 'bg-danger' : 'bg-info'} me-2`}>
                    {isAdmin ? 'Administrator' : 'User'}
                  </span>
                  {fullName && (
                    <span className="text-muted text-truncate">{userEmail}</span>
                  )}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="text-end mt-2">
              <span className="badge bg-light text-dark">
                <i className="bi bi-pencil me-1"></i>
                Edit Profile
              </span>
            </div>
          )}
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
      
      {/* User profile modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;