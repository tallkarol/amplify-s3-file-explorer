// src/components/admin/UserSelector.tsx
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { UserProfile, ListUserProfilesResponse } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import AlertMessage from '../common/AlertMessage';
import EmptyState from '../common/EmptyState';

interface UserSelectorProps {
  onUserSelect: (user: UserProfile | null) => void;
  selectedUser: UserProfile | null;
}

// Define the query
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

const UserSelector = ({ onUserSelect, selectedUser }: UserSelectorProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(user => {
          return (
            user.email.toLowerCase().includes(lowercaseSearch) ||
            (user.firstName?.toLowerCase() || '').includes(lowercaseSearch) ||
            (user.lastName?.toLowerCase() || '').includes(lowercaseSearch)
          );
        })
      );
    }
  }, [searchTerm, users]);

  async function fetchUsers() {
    try {
      setLoading(true);
      
      // Create a client for making GraphQL requests
      const client = generateClient();
            
      // Use the query with proper typing
      const response = await client.graphql<GraphQLQuery<ListUserProfilesResponse>>({
        query: listUserProfilesQuery,
        authMode: 'userPool'
      });
      
      // Safely access the data with proper typing
      const items = response?.data?.listUserProfiles?.items || [];
      setUsers(items);
      setFilteredUsers(items);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to load users: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen && searchTerm) {
      setSearchTerm('');
    }
  };

  // Handle user selection
  const handleSelectUser = (user: UserProfile) => {
    onUserSelect(user);
    setIsDropdownOpen(false);
  };

  // Format user display name
  const getUserDisplayName = (user: UserProfile) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  // Get the label for the selector button
  const getSelectorLabel = () => {
    if (selectedUser) {
      return getUserDisplayName(selectedUser);
    }
    return 'Select a user';
  };

  return (
    <div className="user-selector mb-4">
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-3">Client Selection</h5>
          
          <div className="position-relative">
            <div className="d-flex align-items-center mb-2">
              <button 
                className="btn btn-outline-primary dropdown-toggle flex-grow-1 text-start d-flex align-items-center"
                onClick={toggleDropdown}
                type="button"
                aria-expanded={isDropdownOpen}
              >
                {selectedUser ? (
                  <>
                    <i className="bi bi-person-circle me-2"></i>
                    <span className="text-truncate">{getSelectorLabel()}</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    <span>Select a client to manage files</span>
                  </>
                )}
              </button>
              
              {selectedUser && (
                <button 
                  className="btn btn-outline-secondary ms-2" 
                  onClick={() => onUserSelect(null)}
                  type="button"
                  title="Clear selection"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
            
            {isDropdownOpen && (
              <div className="card dropdown-menu position-absolute w-100 p-0 shadow-sm" style={{ display: 'block', zIndex: 1000 }}>
                <div className="p-2 border-bottom">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 bg-light"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="dropdown-items-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {loading ? (
                    <div className="p-3">
                      <LoadingSpinner size="sm" text="Loading users..." />
                    </div>
                  ) : error ? (
                    <div className="p-3">
                      <AlertMessage type="danger" message={error} />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-3">
                      <EmptyState 
                        icon="search" 
                        title="No users found" 
                        message={searchTerm ? `No users match "${searchTerm}"` : "No users available"} 
                      />
                    </div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {filteredUsers.map(user => (
                        <li 
                          key={user.id} 
                          className={`list-group-item list-group-item-action ${selectedUser?.id === user.id ? 'active' : ''}`}
                          onClick={() => handleSelectUser(user)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <i className="bi bi-person-circle me-2"></i>
                            </div>
                            <div className="flex-grow-1 ms-2">
                              <div className="fw-medium">{getUserDisplayName(user)}</div>
                              <div className="small text-muted">{user.email}</div>
                            </div>
                            {user.createdAt && (
                              <div className="flex-shrink-0 small text-muted">
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="p-2 border-top d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                  </small>
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={toggleDropdown}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {selectedUser && (
            <div className="user-info mt-3 p-3 bg-light rounded">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0 bg-white rounded-circle p-2">
                  <i className="bi bi-person-circle fs-3 text-primary"></i>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-0">{getUserDisplayName(selectedUser)}</h6>
                  <p className="text-muted mb-0">{selectedUser.email}</p>
                  {selectedUser.createdAt && (
                    <small className="text-muted">
                      <i className="bi bi-calendar me-1"></i>
                      Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </small>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSelector;