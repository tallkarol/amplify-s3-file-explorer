// src/pages/admin/AdminFileManagement.tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import Card from '@/components/common/Card';
import AlertMessage from '@/components/common/AlertMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FolderGrid from '../components/FolderGrid';
import { UserProfile } from '@/types';

// Import the updated components
import AdminFileBrowser from '../components/AdminFileBrowser';
import UserSelector from '@/components/common/UserSelector';
import UserAllFiles from '../components/UserAllFiles';

interface ListUserProfilesResponse {
  listUserProfiles: {
    items: UserProfile[];
  };
}

const AdminFileManagement = () => {
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create a client for making GraphQL requests
  const client = generateClient();
  
  // Parse URL query parameters for userId
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const userId = urlParams.get('userId');
    
    if (userId) {
      console.log('URL contains userId parameter:', userId);
      fetchUserByUuid(userId);
    } else {
      setInitialLoading(false);
    }
  }, [location.search]);
  
  // Define query to fetch a specific user by UUID
  const getUserByUuidQuery = /* GraphQL */ `
    query GetUserByUuid($filter: ModelUserProfileFilterInput) {
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
    setInitialLoading(true);
    setError(null);
    
    try {
      console.log('Fetching user with UUID:', uuid);
      
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
      
      console.log('Response from getUserByUuid:', response);
      
      const items = response?.data?.listUserProfiles?.items || [];
      if (items.length > 0) {
        console.log('User found:', items[0]);
        setSelectedUser(items[0]);
      } else {
        console.log('No user found with UUID:', uuid);
        setError(`No user found with ID: ${uuid}`);
      }
    } catch (err) {
      console.error('Error fetching user by UUID:', err);
      setError(`Failed to load user: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setInitialLoading(false);
    }
  };

  // Handle user selection from UserSelector
  const handleUserSelect = (user: UserProfile | null) => {
    console.log('User selected:', user);
    setSelectedUser(user);
    // Reset path to root when user changes
    setCurrentPath('/');
  };
  
  // Handle folder selection from FolderGrid
  const handleFolderSelect = (folderPath: string) => {
    console.log('Folder selected:', folderPath);
    setCurrentPath(folderPath);
  };
  
  // Handle path change from AdminFileBrowser
  const handlePathChange = (path: string) => {
    console.log('Path changed to:', path);
    setCurrentPath(path);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">File Management</h2>
          <p className="text-muted mb-0">
            {selectedUser 
              ? `Managing files for ${selectedUser.firstName || selectedUser.email}` 
              : 'Select a client to manage their files'}
          </p>
        </div>
      </div>
      
      {initialLoading ? (
        <Card>
          <LoadingSpinner text="Loading..." />
        </Card>
      ) : error ? (
        <AlertMessage 
          type="danger" 
          message={error} 
          dismissible 
          onDismiss={() => setError(null)} 
        />
      ) : (
        <div className="row">
          {/* Left column - User selection */}
          <div className="col-md-4 mb-4">
            <UserSelector 
              onUserSelect={handleUserSelect}
              selectedUser={selectedUser}
            />
            
            {!selectedUser && (
              <Card title="Instructions" className="mt-3">
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Select a client from the list above to browse their files and folders.
                </div>
              </Card>
            )}
          </div>
          
          {/* Right column - File browser */}
          <div className="col-md-8">
            {selectedUser && (
              <>
                {/* For root path, show folder grid */}
                {currentPath === '/' ? (
                <>
                  <Card title={`Folders for ${selectedUser.firstName || selectedUser.email}`}>
                    <FolderGrid 
                      userId={selectedUser.uuid}
                      onSelectFolder={handleFolderSelect} 
                    />
                  </Card>
                  <UserAllFiles 
                    userId={selectedUser.uuid} 
                    userName={selectedUser.firstName || selectedUser.email}
                  />
                </>
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
      )}
    </div>
  );
};

export default AdminFileManagement;