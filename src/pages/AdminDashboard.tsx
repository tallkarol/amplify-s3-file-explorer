// src/pages/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import UserList from '../components/admin/UserList';
import UserSelector from '../components/admin/UserSelector';
import AdminFileBrowser from '../components/admin/AdminFileBrowser';
import UserStatsCard from '../components/admin/UserStatsCard';
import UserActionsCard from '../components/admin/UserActionsCard';
import CompactFileActivity from '../components/admin/CompactFileActivity';
import FolderGrid from '../components/admin/FolderGrid';
import TogglableCard from '../components/common/TogglableCard';
import Card from '../components/common/Card';
import { UserProfile } from '../types';

// Define query to list all users
const listUserProfilesQuery = /* GraphQL */ `
  query ListUserProfiles {
    listUserProfiles {
      items {
        id
        email
        uuid
        profileOwner
        firstName
        lastName
        createdAt
      }
    }
  }
`;

// Response type for listUserProfiles query
interface ListUserProfilesResponse {
  listUserProfiles: {
    items: UserProfile[];
  };
}

const AdminDashboard = () => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserList, setShowUserList] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Create a client for making GraphQL requests
  const client = generateClient();
  
  // Fetch all user profiles
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.graphql<GraphQLQuery<ListUserProfilesResponse>>({
        query: listUserProfilesQuery,
        authMode: 'userPool'
      });
      
      const items = response?.data?.listUserProfiles?.items || [];
      setUsers(items);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to load users: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection
  const handleUserSelect = (user: UserProfile | null) => {
    setSelectedUser(user);
    // Reset path to root when user changes
    setCurrentPath('/');
    // Hide user list if it was shown
    setShowUserList(false);
  };
  
  // Handle folder selection
  const handleFolderSelect = (folderPath: string) => {
    setCurrentPath(folderPath);
  };
  
  // Toggle user list view
  const toggleUserList = () => {
    setShowUserList(!showUserList);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Admin Dashboard</h2>
        <button 
          className="btn btn-outline-primary"
          onClick={toggleUserList}
        >
          <i className={`bi bi-people me-2`}></i>
          {showUserList ? 'Hide User List' : 'Show User List'}
        </button>
      </div>

      {/* User List View (when toggled) */}
      {showUserList && (
        <Card title="User Management" className="mb-4">
          <UserList 
            users={users}
            loading={loading}
            error={error}
            onViewDetails={handleUserSelect}
          />
        </Card>
      )}

      <div className="row">
        {/* Left column - User selection and stats */}
        <div className="col-md-4 mb-4 mb-md-0">
          {/* User Selector Component */}
          <UserSelector 
            onUserSelect={handleUserSelect}
            selectedUser={selectedUser}
          />
          
          {/* Only show user-related cards when a user is selected */}
          {selectedUser && (
            <>
              {/* User Stats */}
              <TogglableCard 
                title="Storage Statistics" 
                subtitle="User storage usage overview"
                className="mb-4"
                initiallyExpanded={false}
              >
                <UserStatsCard user={selectedUser} />
              </TogglableCard>
              
              {/* Activity Chart */}
              <TogglableCard 
                title="File Activity" 
                subtitle="Recent file activity trends"
                className="mb-4"
                initiallyExpanded={false}
              >
                <CompactFileActivity user={selectedUser} />
              </TogglableCard>
              
              {/* User Actions */}
              <TogglableCard 
                title="User Management" 
                subtitle="Management actions for this user"
                className="mb-4"
                initiallyExpanded={false}
              >
                <UserActionsCard user={selectedUser} />
              </TogglableCard>
            </>
          )}
          
          {/* Help card when no user is selected */}
          {!selectedUser && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Admin File Manager</h5>
                <p className="card-text text-muted">
                  Use the user selector above to choose a user whose files you want to manage. Once selected, you can:
                </p>
                <ul className="list-group list-group-flush mb-3">
                  <li className="list-group-item">
                    <i className="bi bi-folder me-2 text-primary"></i>
                    Browse user's folder structure
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-upload me-2 text-primary"></i>
                    Upload files to user's folders
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-download me-2 text-primary"></i>
                    Download user's files
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-trash me-2 text-primary"></i>
                    Delete files (if not in protected folders)
                  </li>
                </ul>
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  As an admin, you have additional privileges to manage user files while respecting protected folder restrictions.
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right column - File browser and folders grid */}
        <div className="col-md-8">
          {selectedUser ? (
            <>
              {/* Quick Access Navigation - Only show in non-root paths */}
              {currentPath !== '/' && (
                <FolderGrid 
                  user={selectedUser} 
                  onSelectFolder={handleFolderSelect} 
                  compact={true}
                  currentPath={currentPath}
                />
              )}
            
              {/* For root path, show folder grid */}
              {currentPath === '/' ? (
                <Card title="User Storage">
                  <div className="mb-3">
                    <p className="text-muted">Select a folder to manage files for <strong>{selectedUser.email}</strong>:</p>
                  </div>
                  <FolderGrid 
                    user={selectedUser} 
                    onSelectFolder={handleFolderSelect} 
                  />
                </Card>
              ) : (
                /* For non-root paths, show file browser */
                <AdminFileBrowser 
                  selectedUser={selectedUser} 
                  initialPath={currentPath}
                  onPathChange={setCurrentPath}
                />
              )}
            </>
          ) : (
            <div className="card">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <div className="bg-primary bg-opacity-10 d-inline-flex p-4 rounded-circle mb-3">
                    <i className="bi bi-shield-lock fs-1 text-primary"></i>
                  </div>
                  <h3 className="card-title">Welcome to Admin Dashboard</h3>
                  <p className="card-text text-muted">
                    This dashboard allows you to manage user files, view statistics, and perform administrative actions.
                  </p>
                </div>
                
                <div className="row g-4 mb-4">
                  <div className="col-md-4">
                    <div className="card h-100 admin-stat-card border-0 shadow-sm">
                      <div className="card-body text-center p-4">
                        <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
                          <i className="bi bi-person-check fs-4 text-primary"></i>
                        </div>
                        <h5 className="card-title">User Management</h5>
                        <p className="card-text small text-muted">
                          Manage user accounts and view detailed statistics about their storage usage.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="card h-100 admin-stat-card border-0 shadow-sm">
                      <div className="card-body text-center p-4">
                        <div className="bg-success bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
                          <i className="bi bi-folder-symlink fs-4 text-success"></i>
                        </div>
                        <h5 className="card-title">File Management</h5>
                        <p className="card-text small text-muted">
                          Browse, upload, download, and manage files in user storage areas.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="card h-100 admin-stat-card border-0 shadow-sm">
                      <div className="card-body text-center p-4">
                        <div className="bg-info bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
                          <i className="bi bi-graph-up fs-4 text-info"></i>
                        </div>
                        <h5 className="card-title">Usage Analytics</h5>
                        <p className="card-text small text-muted">
                          View file activity and storage usage statistics for all users.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="alert alert-primary d-flex" role="alert">
                  <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                  <div>
                    <strong>Get Started:</strong> Select a user from the panel on the left to view and manage their files.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;