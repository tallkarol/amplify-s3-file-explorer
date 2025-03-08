// src/components/developer/UserLookup.tsx
import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import AlertMessage from '../common/AlertMessage';
import '../../styles/userlookup.css';

interface UserLookupProps {
  onSelectUser?: (userId: string) => void;
}

interface UserProfile {
  id: string;
  email: string;
  uuid: string;
  profileOwner: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phoneNumber?: string;
  createdAt: string;
}

const UserLookup: React.FC<UserLookupProps> = ({ onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState<'email' | 'name' | 'company'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [minSearchLength] = useState(2); // Minimum characters before searching
  const [debounceTimeout] = useState(300); // Debounce timeout in ms
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Create a client for making GraphQL requests
  const client = generateClient();

  // Handle search term change with debounce
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Don't search if term is too short
    if (searchTerm.length < minSearchLength) {
      setResults([]);
      setError(null);
      return;
    }
    
    // Set new timeout
    searchTimeout.current = setTimeout(() => {
      handleSearch();
    }, debounceTimeout);
    
    // Cleanup function
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, searchBy, minSearchLength]);

  // Handle deselection of user
  const handleDeselectUser = () => {
    setSelectedUser(null);
    // Notify parent that no user is selected
    if (onSelectUser) {
      onSelectUser("");
    }
  };
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedUser(null);

    try {
      // Build the filter based on search type
      let filter: any = {};
      
      // Make search case-insensitive by creating multiple filter conditions
      if (searchBy === 'email') {
        // For email, we'll just use lowercase since emails are usually not case-sensitive
        filter = { email: { contains: searchTerm.toLowerCase() } };
      } else if (searchBy === 'name') {
        // For name, try multiple case variations
        const searchLower = searchTerm.toLowerCase();
        const searchUpper = searchTerm.toUpperCase();
        const searchCapitalized = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();
        
        filter = {
          or: [
            // First name variations
            { firstName: { contains: searchTerm } },
            { firstName: { contains: searchLower } },
            { firstName: { contains: searchUpper } },
            { firstName: { contains: searchCapitalized } },
            
            // Last name variations
            { lastName: { contains: searchTerm } },
            { lastName: { contains: searchLower } },
            { lastName: { contains: searchUpper } },
            { lastName: { contains: searchCapitalized } }
          ]
        };
      } else if (searchBy === 'company') {
        // For company, try multiple case variations
        const searchLower = searchTerm.toLowerCase();
        const searchUpper = searchTerm.toUpperCase();
        const searchCapitalized = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();
        
        filter = {
          or: [
            { companyName: { contains: searchTerm } },
            { companyName: { contains: searchLower } },
            { companyName: { contains: searchUpper } },
            { companyName: { contains: searchCapitalized } }
          ]
        };
      }

      // GraphQL query to search for users
      const query = /* GraphQL */ `
        query SearchUserProfiles($filter: ModelUserProfileFilterInput, $limit: Int) {
          listUserProfiles(filter: $filter, limit: $limit) {
            items {
              id
              email
              uuid
              profileOwner
              firstName
              lastName
              companyName
              phoneNumber
              createdAt
            }
          }
        }
      `;

      const response = await client.graphql<GraphQLQuery<{ listUserProfiles: { items: UserProfile[] } }>>({
        query,
        variables: {
          filter,
          limit: 20
        },
        authMode: 'userPool'
      });

      let users = response.data?.listUserProfiles?.items || [];
      
      // Add client-side filtering as a backup to make sure we're truly case-insensitive
      if (users.length > 0) {
        if (searchBy === 'email') {
          const searchTermLower = searchTerm.toLowerCase();
          users = users.filter(user => 
            user.email.toLowerCase().includes(searchTermLower)
          );
        } else if (searchBy === 'name') {
          const searchTermLower = searchTerm.toLowerCase();
          users = users.filter(user => 
            (user.firstName?.toLowerCase().includes(searchTermLower) || false) ||
            (user.lastName?.toLowerCase().includes(searchTermLower) || false)
          );
        } else if (searchBy === 'company') {
          const searchTermLower = searchTerm.toLowerCase();
          users = users.filter(user => 
            user.companyName?.toLowerCase().includes(searchTermLower) || false
          );
        }
      }
      
      if (users.length === 0) {
        setError(`No users found matching "${searchTerm}"`);
      } else {
        setResults(users);
      }
    } catch (err) {
      console.error('Error searching for users:', err);
      setError(`Failed to search users: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection
  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    if (onSelectUser) {
      onSelectUser(user.uuid);
    }
  };

  // Format date for better display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper to get user display name
  const getUserDisplayName = (user: UserProfile): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    }
    return 'Unnamed User';
  };

  // Show a copy success toast
  const showCopyToast = () => {
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = 'User ID copied to clipboard!';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 2000);
    }, 10);
  };

  return (
    <div className="user-lookup-container">
      <Card title="User Lookup">
        <div className="search-container">
          {/* Search Type Selector */}
          <div className="search-type-selector mb-3">
            <button 
              className={`search-type-btn ${searchBy === 'email' ? 'active' : ''}`}
              onClick={() => setSearchBy('email')}
            >
              <i className="bi bi-envelope me-2"></i>
              Email
            </button>
            <button 
              className={`search-type-btn ${searchBy === 'name' ? 'active' : ''}`}
              onClick={() => setSearchBy('name')}
            >
              <i className="bi bi-person me-2"></i>
              Name
            </button>
            <button 
              className={`search-type-btn ${searchBy === 'company' ? 'active' : ''}`}
              onClick={() => setSearchBy('company')}
            >
              <i className="bi bi-building me-2"></i>
              Company
            </button>
          </div>

          {/* Search Input */}
          <div className="search-input-group">
            <input
              type="text"
              className="search-input"
              placeholder={`Search by ${searchBy}... (min ${minSearchLength} characters)`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="search-clear-button"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>
        </div>

        {error && (
          <AlertMessage
            type="warning"
            message={error}
            dismissible
            onDismiss={() => setError(null)}
          />
        )}

        {/* Selected user card */}
        {selectedUser && (
          <div className="selected-user-card">
            <div className="selected-user-header">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-person-check me-2"></i>
                  Selected User
                </div>
                <button 
                  className="btn-close btn-close-white" 
                  onClick={handleDeselectUser} 
                  title="Clear selection"
                  aria-label="Clear selection"
                ></button>
              </div>
            </div>
            <div className="selected-user-body">
              <div className="user-details-col">
                <div className="user-name">{getUserDisplayName(selectedUser)}</div>
                <div className="user-detail">
                  <span className="user-detail-label">Email:</span>
                  <span className="user-detail-value">{selectedUser.email}</span>
                </div>
                <div className="user-detail">
                  <span className="user-detail-label">Company:</span>
                  <span className="user-detail-value">{selectedUser.companyName || 'Not specified'}</span>
                </div>
                <div className="user-detail">
                  <span className="user-detail-label">Joined:</span>
                  <span className="user-detail-value">{formatDate(selectedUser.createdAt)}</span>
                </div>
                {selectedUser.phoneNumber && (
                  <div className="user-detail">
                    <span className="user-detail-label">Phone:</span>
                    <span className="user-detail-value">{selectedUser.phoneNumber}</span>
                  </div>
                )}
              </div>
              <div className="user-id-col">
                <div className="user-id-container">
                  <div className="user-id-label">User ID</div>
                  <div className="user-id-value">{selectedUser.uuid}</div>
                  <button
                    className="copy-button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedUser.uuid);
                      showCopyToast();
                    }}
                  >
                    <i className="bi bi-clipboard me-2"></i>
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results list */}
        {loading ? (
          <LoadingSpinner text="Searching for users..." />
        ) : results.length > 0 && !selectedUser ? (
          <table className="results-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map(user => (
                <tr key={user.id}>
                  <td>{getUserDisplayName(user)}</td>
                  <td>{user.email}</td>
                  <td>{user.companyName || '-'}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleSelectUser(user)}
                    >
                      <i className="bi bi-arrow-right me-1"></i>
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {/* Empty state */}
        {!loading && !error && results.length === 0 && !selectedUser && (
          <div className="empty-results">
            <i className="bi bi-search empty-icon d-block"></i>
            <h6 className="empty-title">Search for Users</h6>
            <p className="empty-message">
              Search for users by email, name, or company and select a user to view their error logs.
              <br />
              <small className="text-muted mt-2 d-block">
                <i className="bi bi-info-circle me-1"></i>
                Searches are case-insensitive - you can type in any capitalization.
              </small>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserLookup;