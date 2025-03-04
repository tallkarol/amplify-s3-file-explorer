// src/pages/admin/AdminClientManagement.tsx
import { useState, useEffect } from 'react';
import { GraphQLQuery, generateClient } from '@aws-amplify/api';
import UserList from '@/features/clients/components/UserList';
import UserActionsCard from '@/features/clients/components/UserActionsCard';
import Card from '@/components/common/Card';
import AlertMessage from '@/components/common/AlertMessage';
import RootFolderList from '@/features/files/components/RootFolderList';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { UserProfile } from '@/types';
import UserAllFiles from '@/features/clients/components/UserAllFiles';

interface ListUserProfilesResponse {
  listUserProfiles: {
    items: UserProfile[];
  };
}

const AdminClientManagement = () => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');
  
  // Create a client for making GraphQL requests
  const client = generateClient();
  
  // Define query to fetch users
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
          companyName
          phoneNumber
          preferredContactMethod
          createdAt
        }
      }
    }
  `;
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to fetch all users
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
    if (user) {
      setView('detail');
    }
  };
  
  // Navigate back to user list
  const backToList = () => {
    setView('list');
  };
  
  // Navigate to file browser for selected user
  const navigateToUserFiles = () => {
    if (selectedUser) {
      window.location.href = `/admin/files?userId=${selectedUser.uuid}`;
    }
  };
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          {view === 'list' ? 'Client Management' : 'Client Details'}
        </h2>
        {view === 'detail' && (
          <button 
            className="btn btn-outline-secondary"
            onClick={backToList}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Back to Client List
          </button>
        )}
      </div>
      
      {loading && users.length === 0 ? (
        <div className="text-center py-5">
          <LoadingSpinner text="Loading clients..." />
        </div>
      ) : error ? (
        <AlertMessage 
          type="danger" 
          title="Error Loading Clients"
          message={error}
        />
      ) : (
        <>
          {view === 'list' ? (
            /* List View */
            <Card>
              <UserList 
                users={users}
                loading={loading}
                error={error}
                onViewDetails={handleUserSelect}
              />
            </Card>
          ) : (
            /* Detail View */
            selectedUser && (
              <div className="row">
                <div className="col-lg-4 mb-4">
                  {/* User Profile Card */}
                  <Card className="mb-4">
                    <div className="text-center mb-4">
                      <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
                        <i className="bi bi-person-circle fs-1 text-primary"></i>
                      </div>
                      <h4 className="mb-1">
                        {selectedUser.firstName && selectedUser.lastName 
                          ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                          : selectedUser.email}
                      </h4>
                      {(selectedUser.firstName || selectedUser.lastName) && (
                        <p className="text-muted mb-2">{selectedUser.email}</p>
                      )}
                      {selectedUser.companyName && (
                        <p className="text-muted mb-2">
                          <i className="bi bi-building me-1"></i>
                          {selectedUser.companyName}
                        </p>
                      )}
                      {selectedUser.createdAt && (
                        <div className="badge bg-light text-dark mb-2">
                          <i className="bi bi-calendar me-1"></i>
                          Client since {new Date(selectedUser.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="border-top pt-3">
                      <h6 className="mb-3">Contact Information</h6>
                      <div className="mb-2">
                        <div className="text-muted small">Email</div>
                        <div>{selectedUser.email}</div>
                      </div>
                      <div className="mb-2">
                        <div className="text-muted small">Phone</div>
                        <div>{selectedUser.phoneNumber || 'Not provided'}</div>
                      </div>
                      <div className="mb-2">
                        <div className="text-muted small">Preferred Contact Method</div>
                        <div className="badge bg-primary">
                          {selectedUser.preferredContactMethod || 'Email'}
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="text-muted small">Client ID</div>
                        <div className="text-muted small font-monospace">{selectedUser.uuid}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="d-grid gap-2">
                        <button 
                          className="btn btn-primary"
                          onClick={navigateToUserFiles}
                        >
                          <i className="bi bi-folder me-1"></i>
                          Manage Client Files
                        </button>
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => alert('Email functionality coming soon!')}
                        >
                          <i className="bi bi-envelope me-1"></i>
                          Contact Client
                        </button>
                      </div>
                    </div>
                  </Card>
                  
                  {/* User Actions Card */}
                  <UserActionsCard user={selectedUser} />
                </div>
                
                <div className="col-lg-8">
                  {/* User Folders Quick Access */}
                  <Card title="Client Folders" className="mb-4">
                    <RootFolderList 
                      user={selectedUser}
                      onSelectFolder={() => navigateToUserFiles()}
                    />
                  </Card>
                  <UserAllFiles 
                    userId={selectedUser.uuid} 
                    userName={selectedUser.firstName || selectedUser.email}
                  />
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default AdminClientManagement;