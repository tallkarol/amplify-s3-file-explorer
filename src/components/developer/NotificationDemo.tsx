// src/components/developer/NotificationDemo.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
// import { createNotification } from '@/features/notifications/services/NotificationService';
import AlertMessage from '@/components/common/AlertMessage';
import Card from '@/components/common/Card';
import { UserProfile } from '@/types';

interface NotificationDemoProps {
  onNotificationCreated?: (type: string, message: string) => void;
}

const NotificationDemo: React.FC<NotificationDemoProps> = ({ onNotificationCreated }) => {
  const { user } = useAuthenticator();
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test notification created from the Developer Debug Tools.');
  const [type, setType] = useState<'system' | 'file' | 'admin' | 'user'>('system');
  const [actionLink, setActionLink] = useState('/notifications');
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metadataIcon, setMetadataIcon] = useState('bell');
  const [metadataColor, setMetadataColor] = useState('primary');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Create a client for making GraphQL requests
  const client = generateClient();

  // Fetch users when the component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await client.graphql<GraphQLQuery<any>>({
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
              }
            }
          }
        `,
        authMode: 'userPool'
      });
      
      setAllUsers(response.data?.listUserProfiles?.items || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Failed to load users: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = allUsers.filter(u => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    return (
      u.email?.toLowerCase().includes(search) ||
      u.firstName?.toLowerCase().includes(search) ||
      u.lastName?.toLowerCase().includes(search) ||
      u.uuid?.toLowerCase().includes(search)
    );
  });

  // Get user display name
  const getUserName = (userProfile: UserProfile): string => {
    if (userProfile.firstName && userProfile.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    if (userProfile.firstName || userProfile.lastName) {
      return userProfile.firstName || userProfile.lastName || '';
    }
    return userProfile.email || 'Unknown User';
  };

  // Create a notification
  const handleCreateNotification = async () => {
    if (!user && !selectedUser) {
      setError('No user selected for the notification');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      setSuccess(null);

      // Create a simple metadata object with minimal properties
      // Keeping it very simple to avoid any serialization issues
      // const metadata = {
      //   icon: metadataIcon,
      //   color: metadataColor
      // };

      // Prepare notification data
      // Create a direct GraphQL mutation instead of using the service
      const createNotificationMutation = /* GraphQL */ `
        mutation CreateNotification($input: CreateNotificationInput!) {
          createNotification(input: $input) {
            id
            userId
            type
            title
            message
            isRead
            createdAt
          }
        }
      `;
      
      // Execute the mutation directly to avoid any conversion issues in the service
      const response = await client.graphql<GraphQLQuery<any>>({
        query: createNotificationMutation,
        variables: {
          input: {
            userId: selectedUser ? selectedUser.uuid : user.userId,
            type,
            title,
            message,
            isRead: false,
            actionLink,
            // Omit metadata for now to simplify troubleshooting
          }
        },
        authMode: 'userPool'
      });
      
      const result = response.data?.createNotification;

      // This line is no longer needed as we're creating the notification directly above
      
      setSuccess(`Notification created successfully with ID: ${result.id}`);
      
      if (onNotificationCreated) {
        onNotificationCreated(type, message);
      }

      // Reset form
      setTitle('Test Notification');
      setMessage('This is a test notification created from the Developer Debug Tools.');
      setActionLink('/notifications');
      setMetadataIcon('bell');
      setMetadataColor('primary');
    } catch (error) {
      console.error('Error creating notification:', error);
      setError(`Failed to create notification: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle user selection
  const handleSelectUser = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setShowUserDropdown(false);
  };

  // Clear selected user
  const clearSelectedUser = () => {
    setSelectedUser(null);
  };

  return (
    <Card title="Notification Demo Creator">
      {error && (
        <AlertMessage 
          type="danger"
          message={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}
      
      {success && (
        <AlertMessage 
          type="success"
          message={success}
          dismissible
          onDismiss={() => setSuccess(null)}
        />
      )}
      
      <div className="mb-3">
        <label className="form-label">Notification Recipient</label>
        <div className="input-group mb-2">
          <button 
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
          >
            <i className="bi bi-person me-1"></i>
            Select User
          </button>
          
          {selectedUser ? (
            <div className="form-control d-flex align-items-center justify-content-between">
              <span>
                {getUserName(selectedUser)}
                <span className="badge bg-secondary ms-2">{selectedUser.email}</span>
              </span>
              <button 
                className="btn btn-sm btn-link text-danger p-0" 
                onClick={clearSelectedUser}
              >
                <i className="bi bi-x-circle"></i>
              </button>
            </div>
          ) : (
            <input 
              type="text" 
              className="form-control bg-light" 
              placeholder="Current user (you) - click 'Select User' to change" 
              disabled 
            />
          )}
        </div>
        
        {showUserDropdown && (
          <div className="card mt-1 position-relative" style={{ zIndex: 100 }}>
            <div className="card-body p-2">
              <div className="input-group mb-2">
                <span className="input-group-text bg-light">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                {userSearch && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setUserSearch('')}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {loadingUsers ? (
                  <div className="text-center py-2">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span className="ms-2">Loading users...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-2 text-muted">
                    <i className="bi bi-search me-1"></i>
                    No users found
                  </div>
                ) : (
                  <div className="list-group">
                    {filteredUsers.map(userProfile => (
                      <button
                        key={userProfile.id}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleSelectUser(userProfile)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-medium">{getUserName(userProfile)}</div>
                            <div className="small text-muted">{userProfile.email}</div>
                          </div>
                          <span className="badge bg-light text-dark">ID: {userProfile.uuid.substring(0, 8)}...</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="form-text">
          {selectedUser 
            ? "The notification will be sent to the selected user." 
            : "If no user is selected, the notification will be sent to you."}
        </div>
      </div>
      
      <div className="mb-3">
        <label className="form-label">Notification Type</label>
        <select 
          className="form-select" 
          value={type}
          onChange={(e) => setType(e.target.value as any)}
        >
          <option value="system">System</option>
          <option value="file">File</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <div className="form-text">
          Different notification types have different styling and behaviors.
        </div>
      </div>
      
      <div className="mb-3">
        <label className="form-label">Title</label>
        <input 
          type="text" 
          className="form-control" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter notification title"
        />
      </div>
      
      <div className="mb-3">
        <label className="form-label">Message</label>
        <textarea 
          className="form-control" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter notification message"
          rows={3}
        />
      </div>
      
      <div className="mb-3">
        <label className="form-label">Action Link</label>
        <input 
          type="text" 
          className="form-control" 
          value={actionLink}
          onChange={(e) => setActionLink(e.target.value)}
          placeholder="Enter a link (e.g., /user)"
        />
        <div className="form-text">
          When the user clicks on the notification, they will be redirected to this link.
        </div>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Icon (Bootstrap Icons)</label>
          <div className="input-group">
            <span className="input-group-text">
              <i className={`bi bi-${metadataIcon}`}></i>
            </span>
            <input 
              type="text" 
              className="form-control" 
              value={metadataIcon}
              onChange={(e) => setMetadataIcon(e.target.value)}
              placeholder="Enter Bootstrap icon name"
            />
          </div>
        </div>
        
        <div className="col-md-6">
          <label className="form-label">Color</label>
          <select 
            className="form-select" 
            value={metadataColor}
            onChange={(e) => setMetadataColor(e.target.value)}
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="success">Success</option>
            <option value="danger">Danger</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="d-flex align-items-center mb-2">
          <div className="me-3">
            <div className={`bg-${metadataColor}-subtle text-${metadataColor} rounded-circle p-3`}>
              <i className={`bi bi-${metadataIcon} fs-4`}></i>
            </div>
          </div>
          <div>
            <h5 className="mb-1">{title}</h5>
            <p className="mb-0 text-muted">{message}</p>
          </div>
        </div>
        <div className="form-text">
          Preview of how your notification will appear.
        </div>
      </div>
      
      <div className="d-grid">
        <button 
          className="btn btn-primary"
          onClick={handleCreateNotification}
          disabled={isCreating || (!title || !message)}
        >
          {isCreating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating Notification...
            </>
          ) : (
            <>
              <i className="bi bi-bell me-2"></i>
              Create Notification
            </>
          )}
        </button>
      </div>
    </Card>
  );
};

export default NotificationDemo;