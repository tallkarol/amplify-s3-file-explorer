// src/components/developer/UserValidator.tsx
import React, { useState, useRef, useEffect } from 'react';
import Card from '../../components/common/Card';
import AlertMessage from '../../components/common/AlertMessage';
import { generateClient } from 'aws-amplify/api';
import { list } from 'aws-amplify/storage';
import UserDiagnosticTool from './UserDiagnosticTool';
import UserLookup from './UserLookup';

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
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [hasIssues, setHasIssues] = useState(false);
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [openDetailIndex, setOpenDetailIndex] = useState<number | null>(null);
  
  // Custom query overrides
  const queryOverridesRef = useRef<{
    userProfileQuery: string;
    notificationPrefsQuery: string;
  }>({
    userProfileQuery: "uuid: { eq: userId }",
    notificationPrefsQuery: "userId: { eq: userId }"
  });

  // Handler for user selection from UserLookup
  const handleUserSelect = (selectedUserId: string) => {
    if (selectedUserId) {
      setUserId(selectedUserId);
      setShowUserLookup(false);
      // Optionally auto-validate after selection
      setTimeout(() => validateUser(), 300);
    }
  };

  // Initialize results array
  const initializeResults = (): ValidationResult[] => {
    return [
      { name: 'UserProfile', status: 'pending', message: 'Not checked yet' },
      { name: 'Notification Preferences', status: 'pending', message: 'Not checked yet' },
      { name: 'Welcome Notification', status: 'pending', message: 'Not checked yet' },
      { name: 'S3 Root Folder', status: 'pending', message: 'Not checked yet' },
      { name: 'S3 Subfolders', status: 'pending', message: 'Not checked yet' }
    ];
  };

  // Handle query fix recommendations from diagnostic tool
  const handleQueryFix = (fixedQuery: string, component: string) => {
    if (component === "UserProfile") {
      queryOverridesRef.current.userProfileQuery = fixedQuery;
    } else if (component === "NotificationPreferences") {
      queryOverridesRef.current.notificationPrefsQuery = fixedQuery;
    }
    
    // Revalidate with the new queries
    setTimeout(() => {
      validateUser();
    }, 500);
  };

  // Validate a specific user ID
  const validateUser = async () => {
    if (!userId.trim()) {
      setError('Please enter a valid user ID');
      return;
    }

    setIsValidating(true);
    setError(null);
    setShowDiagnostics(false);
    setHasIssues(false);
    setOpenDetailIndex(null);
    
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
      
      // Check if any validation failed
      const hasFailures = newResults.some(result => result.status === 'failure');
      setHasIssues(hasFailures);
      
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
      // First try the direct query via UUID as done in UserProfileModal
      const userProfileQuery = /* GraphQL */ `
        query GetUserProfileByUuid($uuid: String!) {
          listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 10) {
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
          uuid: userId
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
      // Use a direct query approach similar to user profile
      const notificationPrefQuery = /* GraphQL */ `
        query GetNotificationPreferencesByUserId($userId: String!) {
          listNotificationPreferences(filter: { userId: { eq: $userId } }, limit: 10) {
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
        query: notificationPrefQuery,
        variables: {
          userId: userId
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
            details: `Root Path: ${rootPath}\n\nFound ${rootListing.items.length} items in the root folder\n\nItems:\n${JSON.stringify(rootListing.items, null, 2)}`
          };
        } else {
          results[rootIndex] = {
            ...results[rootIndex],
            status: 'warning',
            message: 'Root folder exists but is empty',
            details: `Root Path: ${rootPath}\n\nFolder exists but contains no items.`
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
        const folderDetails: Record<string, any> = {};
        
        for (const folder of expectedFolders) {
          try {
            const folderPath = `users/${userId}/${folder}`;
            const listing = await list({
              path: folderPath
            });
            
            foundFolders.push(folder);
            folderDetails[folder] = {
              path: folderPath,
              itemCount: listing.items.length,
              items: listing.items
            };
          } catch (error) {
            missingFolders.push(folder);
            folderDetails[folder] = {
              path: `users/${userId}/${folder}`,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        }
        
        if (foundFolders.length === expectedFolders.length) {
          results[subfolderIndex] = {
            ...results[subfolderIndex],
            status: 'success',
            message: 'All required subfolders exist',
            details: `Found all expected folders:\n\n${JSON.stringify(folderDetails, null, 2)}`
          };
        } else if (foundFolders.length > 0) {
          results[subfolderIndex] = {
            ...results[subfolderIndex],
            status: 'warning',
            message: `Some subfolders missing (${missingFolders.length}/${expectedFolders.length})`,
            details: `Found: ${foundFolders.join(', ')}\nMissing: ${missingFolders.join(', ')}\n\nDetails:\n${JSON.stringify(folderDetails, null, 2)}`
          };
        } else {
          results[subfolderIndex] = {
            ...results[subfolderIndex],
            status: 'failure',
            message: 'No required subfolders found',
            details: `All expected folders are missing: ${expectedFolders.join(', ')}`
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

  // Close all detail panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetElement = event.target as Element;
      
      // Skip if clicking on a detail button or panel
      if (targetElement.closest('.detail-button') || targetElement.closest('.detail-panel')) {
        return;
      }
      
      setOpenDetailIndex(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <Card title="User Setup Validator">
      <div className="mb-4">
        {!showUserLookup ? (
          <>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Enter User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={isValidating}
                onKeyPress={(e) => e.key === 'Enter' && validateUser()}
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
              <button
                className="btn btn-outline-secondary"
                onClick={() => setShowUserLookup(true)}
                disabled={isValidating}
                title="Search for a user"
              >
                <i className="bi bi-search"></i>
              </button>
            </div>
            <small className="text-muted">
              Enter a Cognito User ID (UUID) to validate their account setup, or use the search button to find a user
            </small>
          </>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">User Lookup</h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowUserLookup(false)}
              >
                <i className="bi bi-x-lg me-1"></i>
                Close
              </button>
            </div>
            <UserLookup onSelectUser={handleUserSelect} />
          </>
        )}
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
        <div className="mb-4">
          <div className="alert alert-light border mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted d-block mb-1">Current Query Settings:</small>
                <div className="d-flex gap-3">
                  <div>
                    <small><strong>User Profile:</strong> <code>{queryOverridesRef.current.userProfileQuery}</code></small>
                  </div>
                  <div>
                    <small><strong>Notification Prefs:</strong> <code>{queryOverridesRef.current.notificationPrefsQuery}</code></small>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  queryOverridesRef.current = {
                    userProfileQuery: "uuid: { eq: userId }",
                    notificationPrefsQuery: "userId: { eq: userId }"
                  };
                  validateUser();
                }}
                className="btn btn-sm btn-outline-secondary"
                disabled={
                  queryOverridesRef.current.userProfileQuery === "uuid: { eq: userId }" &&
                  queryOverridesRef.current.notificationPrefsQuery === "userId: { eq: userId }"
                }
              >
                Reset Queries
              </button>
            </div>
          </div>

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
                          <div className="position-relative">
                            <button
                              className="btn btn-sm btn-outline-secondary detail-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDetailIndex(openDetailIndex === idx ? null : idx);
                              }}
                            >
                              {openDetailIndex === idx ? 'Hide Details' : 'Show Details'}
                            </button>
                            
                            {openDetailIndex === idx && (
                              <div 
                                className="position-absolute bg-light p-3 rounded shadow-sm border detail-panel" 
                                style={{ 
                                  top: '100%', 
                                  right: 0, 
                                  zIndex: 1000, 
                                  minWidth: '300px', 
                                  maxWidth: '600px',
                                  marginTop: '5px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="mb-0">{result.name} Details</h6>
                                  <button 
                                    className="btn btn-sm btn-close" 
                                    onClick={() => setOpenDetailIndex(null)}
                                  ></button>
                                </div>
                                <pre 
                                  className="p-2 bg-white border rounded mb-0" 
                                  style={{ 
                                    whiteSpace: 'pre-wrap', 
                                    fontSize: '0.8rem', 
                                    maxHeight: '400px', 
                                    overflow: 'auto' 
                                  }}
                                >
                                  {result.details}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Show diagnostic option if issues found */}
      {hasIssues && !showDiagnostics && (
        <div className="alert alert-warning">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h5 className="alert-heading mb-1">Query Issues Detected</h5>
              <p className="mb-0">
                Data exists but can't be found with current queries. Would you like to run diagnostics to find the correct queries?
              </p>
            </div>
            <button
              className="btn btn-warning"
              onClick={() => setShowDiagnostics(true)}
            >
              <i className="bi bi-search me-2"></i>
              Run Diagnostics
            </button>
          </div>
        </div>
      )}

      {/* Diagnostic tool */}
      {showDiagnostics && (
        <div className="mt-4">
          <UserDiagnosticTool userId={userId} onQueryFix={handleQueryFix} />
        </div>
      )}
    </Card>
  );
};

export default UserValidator;