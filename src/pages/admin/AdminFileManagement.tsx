// src/pages/admin/AdminFileManagement.tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import UserSelector from '../../components/admin/UserSelector';
import AdminFileBrowser from './AdminFileBrowser';
import FolderGrid from '../../components/admin/FolderGrid';
import Card from '../../components/common/Card';
import { UserProfile } from '../../types';

interface ListUserProfilesResponse {
  listUserProfiles: {
    items: UserProfile[];
  };
}

const AdminFileManagement = () => {
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Create a client for making GraphQL requests
  const client = generateClient();
  
  // Parse URL query parameters for userId
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const userId = urlParams.get('userId');
    
    if (userId) {
      fetchUserByUuid(userId);
    }
  }, [location.search]);
  
  // Define query to fetch a specific user by UUID
  const getUserByUuidQuery = /* GraphQL */ `
    query ListUserProfiles($filter: ModelUserProfileFilterInput) {
      listUserProfiles(filter: $filter, limit: 1) {
        items {
          id
          email
          uuid
          profileOwner
          firstName
          lastName
          companyName
          createdAt
        }
      }
    }
  `;
  
  // Fetch user by UUID
  const fetchUserByUuid = async (uuid: string) => {
    setLoading(true);
    
    try {
      const response = await client.graphql<GraphQLQuery<ListUserProfilesResponse>>({
        query: getUserByUuidQuery,
        variables: {
          filter: {
            uuid: {
              eq: uuid
            }
          }
        },
        authMode: 'userPool'
      });
      
      const items = response?.data?.listUserProfiles?.items || [];
      if (items.length > 0) {
        setSelectedUser(items[0]);
      }
    } catch (err) {
      console.error('Error fetching user by UUID:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection
  const handleUserSelect = (user: UserProfile | null) => {
    setSelectedUser(user);
    setCurrentPath('/');
  };
  
  // Handle folder selection
  const handleFolderSelect = (folderPath: string) => {
    setCurrentPath(folderPath);
  };
  
  // Handle path change
  const handlePathChange = (path: string) => {
    setCurrentPath(path);
  };
  
  // Get navigation breadcrumb text
  const getNavText = () => {
    if (!selectedUser) {
      return 'Select a client to manage their files';
    }
    
    if (currentPath === '/') {
      return `Browsing root folder for ${selectedUser.firstName || selectedUser.email}`;
    }
    
    // Extract folder name from path
    const folderName = currentPath.split('/').filter(Boolean)[0];
    const folderDisplayNames: Record<string, string> = {
      'certificate': 'Certificates',
      'audit-report': 'Audit Reports',
      'auditor-resume': 'Auditor Profiles',
      'statistics': 'Statistics & Analytics'
    };
    
    const displayName = folderDisplayNames[folderName] || folderName;
    return `Browsing ${displayName} for ${selectedUser.firstName || selectedUser.email}`;
  };
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">File Management</h2>
          <p className="text-muted mb-0">{getNavText()}</p>
        </div>
      </div>
      
      <div className="row">
        {/* Left column - User selection */}
        <div className="col-md-4 mb-4 mb-md-0">
          {/* User Selector Component */}
          <UserSelector 
            onUserSelect={handleUserSelect}
            selectedUser={selectedUser}
          />
          
          {/* Help card when no user is selected */}
          {!selectedUser && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">File Manager Instructions</h5>
                <p className="card-text text-muted">
                  Use the client selector above to choose a client whose files you want to manage. Once selected, you can:
                </p>
                <ul className="list-group list-group-flush mb-3">
                  <li className="list-group-item">
                    <i className="bi bi-folder me-2 text-primary"></i>
                    Browse client's folder structure
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-upload me-2 text-primary"></i>
                    Upload files to client's folders
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-download me-2 text-primary"></i>
                    Download client's files
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-trash me-2 text-primary"></i>
                    Delete files (if not in protected folders)
                  </li>
                </ul>
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  As an admin, you have additional privileges to manage client files while respecting protected folder restrictions.
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right column - File browser and folders grid */}
        <div className="col-md-8">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading user data...</p>
            </div>
          ) : selectedUser && (
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
                <Card title="Client Storage">
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
                  onPathChange={handlePathChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFileManagement;