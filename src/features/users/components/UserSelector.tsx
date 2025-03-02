// src/features/users/components/UserSelector.tsx
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { UserProfile, ListUserProfilesResponse } from '../../../types';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';
import Card from '../../../components/common/Card';

interface UserSelectorProps {
  onUserSelect: (user: UserProfile | null) => void;
  selectedUser: UserProfile | null;
}

const UserSelector = ({ onUserSelect, selectedUser }: UserSelectorProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (searchTerm.trim() === '') return true;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(lowercaseSearch) ||
      (user.firstName?.toLowerCase() || '').includes(lowercaseSearch) ||
      (user.lastName?.toLowerCase() || '').includes(lowercaseSearch)
    );
  });

  // Fetch users from API
  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching users...');
      
      // Create a client for making GraphQL requests
      const client = generateClient();
      
      // List user profiles query
      const response = await client.graphql<GraphQLQuery<ListUserProfilesResponse>>({
        query: `
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
        `,
        authMode: 'userPool'
      });
      
      console.log('GraphQL response received:', response);
      
      // Check if we got valid data
      if (!response.data || !response.data.listUserProfiles) {
        throw new Error('Invalid response structure');
      }
      
      const items = response.data.listUserProfiles.items || [];
      console.log(`Fetched ${items.length} users`);
      
      setUsers(items);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to load users: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  // Handle user selection
  const handleSelectUser = (user: UserProfile) => {
    console.log('Selected user:', user);
    onUserSelect(user);
  };

  // Get display name for a user
  const getUserDisplayName = (user: UserProfile) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  // Get initials for user avatar
  const getUserInitials = (user: UserProfile) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return user.email.charAt(0).toUpperCase();
  };

  // Get background color based on user name (consistent for each user)
  const getAvatarColor = (name: string) => {
    const colors = [
      '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0', 
      '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#264653'
    ];
    
    // Use the first characters of name to pick a consistent color
    const charSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  // Format date for better display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Today';
    if (diffDays <= 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Client Selection</h5>
        <button 
          className="btn btn-sm btn-outline-primary"
          onClick={fetchUsers}
          disabled={loading}
          title="Refresh client list"
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Refresh
        </button>
      </div>
      
      {/* Search input with nicer styling */}
      <div className="mb-4">
        <div className="input-group input-group-lg shadow-sm">
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search text-primary"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ borderRadius: '0.375rem' }}
          />
          {searchTerm && (
            <button
              className="btn btn-outline-secondary border-start-0"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
      </div>
      
      {/* Selected user card with better styling */}
      {selectedUser && (
        <div className="mb-4">
          <div className="card border-primary shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: getAvatarColor(getUserDisplayName(selectedUser)),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginRight: '12px'
                  }}
                >
                  {getUserInitials(selectedUser)}
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0 fw-bold">{getUserDisplayName(selectedUser)}</h6>
                  <p className="mb-0 text-muted small">{selectedUser.email}</p>
                </div>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onUserSelect(null)}
                  title="Clear selection"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User list with improved styling */}
      {loading ? (
        <div className="text-center p-4">
          <LoadingSpinner text="Loading clients..." />
        </div>
      ) : error ? (
        <AlertMessage type="danger" message={error} />
      ) : filteredUsers.length > 0 ? (
        <div className="user-list">
          <div className="mb-2 d-flex justify-content-between align-items-center small text-muted px-2">
            <span>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'client' : 'clients'} found
            </span>
            <span>
              {searchTerm && `Showing results for "${searchTerm}"`}
            </span>
          </div>
          
          <div className="list-group shadow-sm rounded" style={{maxHeight: '400px', overflowY: 'auto'}}>
            {filteredUsers.map(user => (
              <button
                key={user.id}
                className={`list-group-item list-group-item-action d-flex align-items-center p-3 position-relative ${selectedUser?.id === user.id ? 'active' : ''}`}
                onClick={() => handleSelectUser(user)}
              >
                {/* User avatar */}
                <div 
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: getAvatarColor(getUserDisplayName(user)),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginRight: '12px'
                  }}
                >
                  {getUserInitials(user)}
                </div>
                
                {/* User info */}
                <div className="flex-grow-1 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-medium">{getUserDisplayName(user)}</span>
                    {user.createdAt && (
                      <span className="badge bg-light text-dark small">
                        Joined: {formatDate(user.createdAt)}
                      </span>
                    )}
                  </div>
                  <span className="text-muted small">{user.email}</span>
                </div>
                
                {/* Selection indicator */}
                {selectedUser?.id === user.id && (
                  <div 
                    className="position-absolute" 
                    style={{
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center p-4 bg-light rounded shadow-sm">
          <i className="bi bi-people text-muted fs-1 mb-2"></i>
          <h6>{searchTerm ? `No users match "${searchTerm}"` : "No users available"}</h6>
          <p className="text-muted mb-0">
            {searchTerm ? (
              <button className="btn btn-link p-0" onClick={() => setSearchTerm('')}>
                Clear search
              </button>
            ) : "Try refreshing the list"}
          </p>
        </div>
      )}
    </Card>
  );
};

export default UserSelector;