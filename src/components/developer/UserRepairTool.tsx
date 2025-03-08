// src/components/developer/UserRepairTool.tsx
import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import Card from '../common/Card';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';

interface UserRepairToolProps {
  userId?: string;
  onSuccess?: () => void;
}

const UserRepairTool: React.FC<UserRepairToolProps> = ({ userId: initialUserId, onSuccess }) => {
  const [userId, setUserId] = useState(initialUserId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [results, setResults] = useState<{
    profileCreated: boolean;
    preferencesCreated: boolean;
    notificationCreated: boolean;
  } | null>(null);

  // Create a client for making GraphQL requests
  const client = generateClient();

  const resetState = () => {
    setError(null);
    setSuccess(null);
    setResults(null);
  };

  // Lookup user by username/email to get their ID if needed
  const lookupUserId = async (email: string) => {
    try {
      // Check if input is already a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(email)) {
        return email;
      }

      // Query Cognito to get user ID by email
      // This is a simplified example - you might need admin credentials for this
      const listUsers = /* GraphQL */ `
        query ListUsers($filter: ModelUserProfileFilterInput) {
          listUserProfiles(filter: $filter, limit: 1) {
            items {
              uuid
            }
          }
        }
      `;

      const response = await client.graphql<GraphQLQuery<any>>({
        query: listUsers,
        variables: {
          filter: { email: { eq: email } }
        },
        authMode: 'userPool'
      });

      const users = response.data?.listUserProfiles?.items || [];
      if (users.length > 0 && users[0].uuid) {
        return users[0].uuid;
      }

      throw new Error(`No user found with email: ${email}`);
    } catch (err) {
      console.error('Error looking up user ID:', err);
      throw err;
    }
  };

  // Create missing user profile
  const createUserProfile = async (userId: string, username: string) => {
    try {
      // Check if profile already exists
      const checkProfile = /* GraphQL */ `
        query CheckUserProfile($filter: ModelUserProfileFilterInput) {
          listUserProfiles(filter: $filter, limit: 1) {
            items {
              id
            }
          }
        }
      `;

      const profileCheck = await client.graphql<GraphQLQuery<any>>({
        query: checkProfile,
        variables: {
          filter: { uuid: { eq: userId } }
        },
        authMode: 'userPool'
      });

      if (profileCheck.data?.listUserProfiles?.items?.length > 0) {
        return { created: false, exists: true };
      }

      // Create the profile
      const createProfile = /* GraphQL */ `
        mutation CreateUserProfile($input: CreateUserProfileInput!) {
          createUserProfile(input: $input) {
            id
          }
        }
      `;

      const profileOwner = `${userId}::${username}`;
      
      await client.graphql<GraphQLQuery<any>>({
        query: createProfile,
        variables: {
          input: {
            email: username, // Using username as email
            uuid: userId,
            profileOwner: profileOwner,
            firstName: '',
            lastName: '',
            companyName: '',
            phoneNumber: '',
            preferredContactMethod: 'email'
          }
        },
        authMode: 'userPool'
      });

      return { created: true, exists: false };
    } catch (err) {
      console.error('Error creating user profile:', err);
      throw err;
    }
  };

  // Create notification preferences
  const createNotificationPreferences = async (userId: string) => {
    try {
      // Check if preferences already exist
      const checkPreferences = /* GraphQL */ `
        query CheckNotificationPreferences($filter: ModelNotificationPreferenceFilterInput) {
          listNotificationPreferences(filter: $filter, limit: 1) {
            items {
              id
            }
          }
        }
      `;

      const prefCheck = await client.graphql<GraphQLQuery<any>>({
        query: checkPreferences,
        variables: {
          filter: { userId: { eq: userId } }
        },
        authMode: 'userPool'
      });

      if (prefCheck.data?.listNotificationPreferences?.items?.length > 0) {
        return { created: false, exists: true };
      }

      // Create preferences
      const createPreferences = /* GraphQL */ `
        mutation CreateNotificationPreference($input: CreateNotificationPreferenceInput!) {
          createNotificationPreference(input: $input) {
            id
          }
        }
      `;

      await client.graphql<GraphQLQuery<any>>({
        query: createPreferences,
        variables: {
          input: {
            userId: userId,
            receiveSystemNotifications: true,
            receiveFileNotifications: true,
            receiveAdminNotifications: true,
            receiveUserNotifications: true,
            emailNotifications: true,
            inAppNotifications: true,
            emailDigestFrequency: 'instant'
          }
        },
        authMode: 'userPool'
      });

      return { created: true, exists: false };
    } catch (err) {
      console.error('Error creating notification preferences:', err);
      throw err;
    }
  };

  // Create welcome notification if missing
  const createWelcomeNotification = async (userId: string) => {
    try {
      // Check if welcome notification exists
      const checkNotification = /* GraphQL */ `
        query CheckWelcomeNotification($filter: ModelNotificationFilterInput) {
          listNotifications(filter: $filter, limit: 1) {
            items {
              id
            }
          }
        }
      `;

      const notifCheck = await client.graphql<GraphQLQuery<any>>({
        query: checkNotification,
        variables: {
          filter: {
            userId: { eq: userId },
            title: { contains: "Welcome" }
          }
        },
        authMode: 'userPool'
      });

      if (notifCheck.data?.listNotifications?.items?.length > 0) {
        return { created: false, exists: true };
      }

      // Create welcome notification
      const createNotification = /* GraphQL */ `
        mutation CreateNotification($input: CreateNotificationInput!) {
          createNotification(input: $input) {
            id
          }
        }
      `;

      await client.graphql<GraphQLQuery<any>>({
        query: createNotification,
        variables: {
          input: {
            userId: userId,
            type: 'system',
            title: 'Welcome to S3 Secure File Share',
            message: 'Thank you for joining! Your account has been successfully created.',
            isRead: false,
            actionLink: '/user'
          }
        },
        authMode: 'userPool'
      });

      return { created: true, exists: false };
    } catch (err) {
      console.error('Error creating welcome notification:', err);
      throw err;
    }
  };

  // Main repair function
  const repairUser = async () => {
    if (!userId.trim()) {
      setError('Please enter a User ID or email');
      return;
    }

    setLoading(true);
    resetState();

    try {
      // If user provided an email instead of ID, look up the ID
      let userIdToUse = userId;
      let username = userId;
      
      // If it contains @ symbol, treat as email
      if (userId.includes('@')) {
        try {
          userIdToUse = await lookupUserId(userId);
        } catch (err) {
          setError(`Failed to find user with email: ${userId}`);
          setLoading(false);
          return;
        }
      }

      // Store results for each operation
      const repairResults = {
        profileCreated: false,
        preferencesCreated: false,
        notificationCreated: false
      };

      // Step 1: Create user profile
      try {
        const profileResult = await createUserProfile(userIdToUse, username);
        repairResults.profileCreated = profileResult.created;
      } catch (err) {
        console.error('Failed to create user profile:', err);
      }

      // Step 2: Create notification preferences
      try {
        const prefResult = await createNotificationPreferences(userIdToUse);
        repairResults.preferencesCreated = prefResult.created;
      } catch (err) {
        console.error('Failed to create notification preferences:', err);
      }

      // Step 3: Create welcome notification
      try {
        const notifResult = await createWelcomeNotification(userIdToUse);
        repairResults.notificationCreated = notifResult.created;
      } catch (err) {
        console.error('Failed to create welcome notification:', err);
      }

      // Set results
      setResults(repairResults);
      setSuccess(`User repair process completed for ID: ${userIdToUse}`);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error repairing user:', err);
      setError(`Error repairing user: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="User Repair Tool">
      <div className="alert alert-info mb-4">
        <div className="d-flex">
          <div className="me-3">
            <i className="bi bi-tools fs-3"></i>
          </div>
          <div>
            <h5 className="alert-heading">User Account Repair</h5>
            <p className="mb-0">
              This tool creates missing User Profile and Notification Preferences for users.
              Enter a User ID or email address to fix an incomplete user account.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter User ID or Email"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && repairUser()}
          />
          <button
            className="btn btn-primary"
            onClick={repairUser}
            disabled={loading || !userId.trim()}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Repairing...
              </>
            ) : (
              <>Repair User</>
            )}
          </button>
        </div>
      </div>

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

      {loading && <LoadingSpinner text="Repairing user account..." />}

      {results && (
        <div className="card border-primary">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Repair Results</h5>
          </div>
          <div className="card-body">
            <table className="table table-bordered mb-0">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>User Profile</td>
                  <td>
                    {results.profileCreated ? (
                      <span className="badge bg-success">Created</span>
                    ) : (
                      <span className="badge bg-secondary">Already Exists</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Notification Preferences</td>
                  <td>
                    {results.preferencesCreated ? (
                      <span className="badge bg-success">Created</span>
                    ) : (
                      <span className="badge bg-secondary">Already Exists</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Welcome Notification</td>
                  <td>
                    {results.notificationCreated ? (
                      <span className="badge bg-success">Created</span>
                    ) : (
                      <span className="badge bg-secondary">Already Exists</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card-footer bg-light">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Run the User Validator again to confirm all components are now working properly.
            </small>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UserRepairTool;