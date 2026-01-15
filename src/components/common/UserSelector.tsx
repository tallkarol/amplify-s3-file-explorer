import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { UserProfile, ListUserProfilesResponse } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AlertMessage from '@/components/common/AlertMessage';
import Card from '@/components/common/Card';
import { devLog } from '@/utils/logger';
import '@/styles/userselector.css';

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
      
      devLog('Fetching users...');
      
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
      
      devLog('GraphQL response received:', response);
      
      // Check if we got valid data
      if (!response.data || !response.data.listUserProfiles) {
        throw new Error('Invalid response structure');
      }
      
      const items = response.data.listUserProfiles.items || [];
      devLog(`Fetched ${items.length} users`);
      
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
    devLog('Selected user:', user);
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
      <div className="user-selector-header">
        <h5 className="user-selector-title">Client Selection</h5>
        <button 
          className="user-selector-refresh-btn"
          onClick={fetchUsers}
          disabled={loading}
          title="Refresh client list"
        >
          <i className="bi bi-arrow-clockwise"></i>
          <span>Refresh</span>
        </button>
      </div>
      
      {/* Search input */}
      <div className="user-selector-search">
        <div className="user-selector-search-container">
          <i className="bi bi-search user-selector-search-icon"></i>
          <input
            type="text"
            className="user-selector-search-input"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="user-selector-search-clear"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
      </div>
      
      {/* Selected user card */}
      {selectedUser && (
        <div className="user-selector-selected">
          <div className="user-selector-selected-card">
            <div className="user-selector-selected-content">
              <div 
                className="user-selector-avatar"
                style={{ backgroundColor: getAvatarColor(getUserDisplayName(selectedUser)) }}
              >
                {getUserInitials(selectedUser)}
              </div>
              <div className="user-selector-info">
                <h6 className="user-selector-name">{getUserDisplayName(selectedUser)}</h6>
                <p className="user-selector-email">{selectedUser.email}</p>
              </div>
              <button
                className="user-selector-clear-btn"
                onClick={() => onUserSelect(null)}
                title="Clear selection"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User list */}
      {loading ? (
        <div className="user-selector-loading">
          <LoadingSpinner text="Loading clients..." />
        </div>
      ) : error ? (
        <AlertMessage type="danger" message={error} />
      ) : filteredUsers.length > 0 ? (
        <div className="user-selector-list-container">
          <div className="user-selector-list-header">
            <span>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'client' : 'clients'} found
            </span>
            <span>
              {searchTerm && `Showing results for "${searchTerm}"`}
            </span>
          </div>
          
          <ul className="user-selector-list">
            {filteredUsers.map(user => (
              <li
                key={user.id}
                className={`user-selector-list-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => handleSelectUser(user)}
              >
                {/* User avatar */}
                <div 
                  className="user-selector-list-avatar"
                  style={{ backgroundColor: getAvatarColor(getUserDisplayName(user)) }}
                >
                  {getUserInitials(user)}
                </div>
                
                {/* User info */}
                <div className="user-selector-list-info">
                  <div className="user-selector-list-name-row">
                    <span className="user-selector-list-name">{getUserDisplayName(user)}</span>
                    {user.createdAt && (
                      <span className="user-selector-list-date">
                        Joined: {formatDate(user.createdAt)}
                      </span>
                    )}
                  </div>
                  <span className="user-selector-list-email">{user.email}</span>
                </div>
                
                {/* Selection indicator */}
                {selectedUser?.id === user.id && (
                  <div className="user-selector-list-check">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="user-selector-empty">
          <i className="bi bi-people"></i>
          <h6>{searchTerm ? `No users match "${searchTerm}"` : "No users available"}</h6>
          <p>
            {searchTerm ? (
              <button className="user-selector-link-btn" onClick={() => setSearchTerm('')}>
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