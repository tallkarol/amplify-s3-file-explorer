// src/components/developer/UserValidator.tsx
import React, { useState } from 'react'; // Add React import
import Card from '../../components/common/Card';
import AlertMessage from '../../components/common/AlertMessage';
import { generateClient } from 'aws-amplify/api';
import { list } from 'aws-amplify/storage';

// Update the interface to use a string literal union type
interface ValidationResult {
  name: string;
  status: 'pending' | 'success' | 'warning' | 'failure';
  message: string;
  details?: string;
}

const UserValidator = () => {
  const [userId, setUserId] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Generate a fresh results array
  const initializeResults = (): ValidationResult[] => {
    return [
      { name: 'UserProfile', status: 'pending', message: 'Not checked yet' },
      { name: 'Notification Preferences', status: 'pending', message: 'Not checked yet' },
      { name: 'Welcome Notification', status: 'pending', message: 'Not checked yet' },
      { name: 'S3 Root Folder', status: 'pending', message: 'Not checked yet' },
      { name: 'S3 Subfolders', status: 'pending', message: 'Not checked yet' }
    ];
  };

  // Validate a specific user ID
  const validateUser = async () => {
    if (!userId.trim()) {
      setError('Please enter a valid user ID');
      return;
    }

    setIsValidating(true);
    setError(null);
    const newResults = initializeResults();
    setResults(newResults);

    const client = generateClient();

    try {
      // Step 1: Check for user profile
      await validateUserProfile(client, newResults);
      
      // Step 2: Check notification preferences
      await validateNotificationPreferences(client, newResults);
      
      // Step 3: Check welcome notification
      await validateWelcomeNotification(client, newResults);
      
      // Step 4: Check S3 folders
      await validateS3Folders(newResults);
      
      setResults([...newResults]);
    } catch (err) {
      console.error('Validation error:', err);
      setError(`Validation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsValidating(false);
    }
  };

  // Validation functions for each component
  const validateUserProfile = async (client: any, results: ValidationResult[]) => {
    const userProfileIndex = results.findIndex(r => r.name === 'UserProfile');
    if (userProfileIndex === -1) return;

    results[userProfileIndex] = {
      ...results[userProfileIndex],
      status: 'pending',
      message: 'Checking user profile...'
    };
    setResults([...results]);

    try {
      const userProfileQuery = /* GraphQL */ `
        query GetUserProfile($filter: ModelUserProfileFilterInput) {
          listUserProfiles(filter: $filter, limit: 1) {
            items {
              id
              email
              uuid
              profileOwner
              firstName
              lastName
              preferredContactMethod
              createdAt
            }
          }
        }
      `;

      const response = await client.graphql({
        query: userProfileQuery,
        variables: {
          filter: {
            uuid: { eq: userId }
          }
        }
      });

      const profiles = response?.data?.listUserProfiles?.items || [];
      
      if (profiles.length > 0) {
        results[userProfileIndex] = {
          ...results[userProfileIndex],
          status: 'success',
          message: 'User profile found',
          details: JSON.stringify(profiles[0], null, 2)
        };
      } else {
        results[userProfileIndex] = {
          ...results[userProfileIndex],
          status: 'failure',
          message: 'No user profile found for this user ID'
        };
      }
    } catch (error) {
      results[userProfileIndex] = {
        ...results[userProfileIndex],
        status: 'failure',
        message: 'Error checking user profile',
        details: error instanceof Error ? error.message : String(error)
      };
    }

    setResults([...results]);
  };

  const validateNotificationPreferences = async (client: any, results: ValidationResult[]) => {
    const index = results.findIndex(r => r.name === 'Notification Preferences');
    if (index === -1) return;

    results[index] = {
      ...results[index],
      status: 'pending',
      message: 'Checking notification preferences...'
    };
    setResults([...results]);

    try {
      const prefQuery = /* GraphQL */ `
        query GetNotificationPreferences($filter: ModelNotificationPreferenceFilterInput) {
          listNotificationPreferences(filter: $filter, limit: 1) {
            items {
              id
              userId
              receiveSystemNotifications
              receiveFileNotifications
              receiveAdminNotifications
              receiveUserNotifications
              emailNotifications
              inAppNotifications
              emailDigestFrequency
              createdAt
            }
          }
        }
      `;

      const response = await client.graphql({
        query: prefQuery,
        variables: {
          filter: {
            userId: { eq: userId }
          }
        }
      });

      const prefs = response?.data?.listNotificationPreferences?.items || [];
      
      if (prefs.length > 0) {
        results[index] = {
          ...results[index],
          status: 'success',
          message: 'Notification preferences found',
          details: JSON.stringify(prefs[0], null, 2)
        };
      } else {
        results[index] = {
          ...results[index],
          status: 'failure',
          message: 'No notification preferences found'
        };
      }
    } catch (error) {
      results[index] = {
        ...results[index],
        status: 'failure',
        message: 'Error checking notification preferences',
        details: error instanceof Error ? error.message : String(error)
      };
    }

    setResults([...results]);
  };

  const validateWelcomeNotification = async (client: any, results: ValidationResult[]) => {
    const index = results.findIndex(r => r.name === 'Welcome Notification');
    if (index === -1) return;

    results[index] = {
      ...results[index],
      status: 'pending',
      message: 'Checking welcome notification...'
    };
    setResults([...results]);

    try {
      const notifQuery = /* GraphQL */ `
        query GetWelcomeNotification($filter: ModelNotificationFilterInput) {
          listNotifications(filter: $filter, limit: 10) {
            items {
              id
              userId
              type
              title
              message
              isRead
              createdAt
            }
          }
        }
      `;

      const response = await client.graphql({
        query: notifQuery,
        variables: {
          filter: {
            userId: { eq: userId },
            title: { contains: "Welcome" }
          }
        }
      });

      const notifications = response?.data?.listNotifications?.items || [];
      
      if (notifications.length > 0) {
        results[index] = {
          ...results[index],
          status: 'success',
          message: 'Welcome notification found',
          details: JSON.stringify(notifications[0], null, 2)
        };
      } else {
        results[index] = {
          ...results[index],
          status: 'failure',
          message: 'No welcome notification found'
        };
      }
    } catch (error) {
      results[index] = {
        ...results[index],
        status: 'failure',
        message: 'Error checking welcome notification',
        details: error instanceof Error ? error.message : String(error)
      };
    }

    setResults([...results]);
  };

  const validateS3Folders = async (results: ValidationResult[]) => {
    // Check root folder
    const rootIndex = results.findIndex(r => r.name === 'S3 Root Folder');
    if (rootIndex !== -1) {
      results[rootIndex] = {
        ...results[rootIndex],
        status: 'pending',
        message: 'Checking root folder...'
      };
      setResults([...results]);

      try {
        const rootPath = `users/${userId}/`;
        const rootListing = await list({
          path: rootPath
        });
        
        if (rootListing.items.length > 0) {
          results[rootIndex] = {
            ...results[rootIndex],
            status: 'success',
            message: 'Root folder exists',
            details: `Found ${rootListing.items.length} items in the root folder`
          };
        } else {
          results[rootIndex] = {
            ...results[rootIndex],
            status: 'warning',
            message: 'Root folder exists but is empty'
          };
        }
      } catch (error) {
        results[rootIndex] = {
          ...results[rootIndex],
          status: 'failure',
          message: 'Error checking root folder',
          details: error instanceof Error ? error.message : String(error)
        };
      }
      
      setResults([...results]);
    }
    
    // Check subfolders
    const subfolderIndex = results.findIndex(r => r.name === 'S3 Subfolders');
    if (subfolderIndex !== -1) {
      results[subfolderIndex] = {
        ...results[subfolderIndex],
        status: 'pending',
        message: 'Checking subfolders...'
      };
      setResults([...results]);

      try {
        const expectedFolders = [
          'certificate/',
          'audit-report/',
          'auditor-resume/',
          'statistics/'
        ];
        
        const foundFolders: string[] = [];
        const missingFolders: string[] = [];
        
        for (const folder of expectedFolders) {
          try {
            const folderPath = `users/${userId}/${folder}`;
            await list({
              path: folderPath
            });
            foundFolders.push(folder);
          } catch (error) {
            missingFolders.push(folder);
            console.error(`Error checking folder ${folder}:`, error);
          }
        }
        
        if (foundFolders.length === expectedFolders.length) {
          results[subfolderIndex] = {
            ...results[subfolderIndex],
            status: 'success',
            message: 'All required subfolders exist',
            details: `Found folders: ${foundFolders.join(', ')}`
          };
        } else if (foundFolders.length > 0) {
          results[subfolderIndex] = {
            ...results[subfolderIndex],
            status: 'warning',
            message: `Some subfolders missing (${missingFolders.length}/${expectedFolders.length})`,
            details: `Found: ${foundFolders.join(', ')}\nMissing: ${missingFolders.join(', ')}`
          };
        } else {
          results[subfolderIndex] = {
            ...results[subfolderIndex],
            status: 'failure',
            message: 'No required subfolders found'
          };
        }
      } catch (error) {
        results[subfolderIndex] = {
          ...results[subfolderIndex],
          status: 'failure',
          message: 'Error checking subfolders',
          details: error instanceof Error ? error.message : String(error)
        };
      }
      
      setResults([...results]);
    }
  };

  // Helper to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="badge bg-success">Success</span>;
      case 'warning':
        return <span className="badge bg-warning text-dark">Warning</span>;
      case 'failure':
        return <span className="badge bg-danger">Failed</span>;
      case 'pending':
        return <span className="badge bg-info">Checking...</span>;
      default:
        return <span className="badge bg-secondary">Not Checked</span>;
    }
  };

  return (
    <Card title="User Setup Validator">
      <div className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isValidating}
          />
          <button
            className="btn btn-primary"
            onClick={validateUser}
            disabled={isValidating || !userId.trim()}
          >
            {isValidating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Validating...
              </>
            ) : (
              <>Validate User</>
            )}
          </button>
        </div>
        <small className="text-muted">
          Enter a Cognito User ID (UUID) to validate their account setup
        </small>
      </div>

      {error && (
        <AlertMessage
          type="danger"
          message={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      {results.length > 0 && (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Component</th>
                <th>Status</th>
                <th>Message</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <React.Fragment key={idx}>
                  <tr>
                    <td>{result.name}</td>
                    <td>{renderStatusBadge(result.status)}</td>
                    <td>{result.message}</td>
                    <td>
                      {result.details && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          data-bs-toggle="collapse"
                          data-bs-target={`#details-${idx}`}
                          aria-expanded="false"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                  {result.details && (
                    <tr id={`details-${idx}`} className="collapse">
                      <td colSpan={4}>
                        <div className="bg-light p-2 rounded">
                          <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                            {result.details}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default UserValidator;