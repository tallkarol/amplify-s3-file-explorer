// src/components/developer/UserDiagnosticTool.tsx
import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import Card from '../common/Card';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';

interface UserDiagnosticToolProps {
  userId?: string;
  onQueryFix?: (fixedQuery: string, component: string) => void;
}

const UserDiagnosticTool: React.FC<UserDiagnosticToolProps> = ({ userId: initialUserId, onQueryFix }) => {
  const [userId, setUserId] = useState(initialUserId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  // Create a client for making GraphQL requests
  const client = generateClient();

  // Run full diagnostic queries
  const runDiagnostics = async () => {
    if (!userId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Structure to hold our results
      const diagnosticResults = {
        userIdFormats: {
          original: userId,
          lowercase: userId.toLowerCase(),
          uppercase: userId.toUpperCase()
        },
        userProfile: {
          exactMatch: null as any,
          altQueries: [] as any[],
          allProfiles: [] as any[],
          recommendedQuery: ''
        },
        notificationPreferences: {
          exactMatch: null as any,
          altQueries: [] as any[],
          allPreferences: [] as any[],
          recommendedQuery: ''
        },
        notifications: {
          welcomeNotification: null as any,
          allNotifications: [] as any[]
        }
      };

      // 1. Try to get exact user profile match
      console.log("Trying exact UserProfile match with uuid:", userId);
      try {
        const exactUserProfileQuery = /* GraphQL */ `
          query GetExactUserProfile($filter: ModelUserProfileFilterInput) {
            listUserProfiles(filter: $filter, limit: 1) {
              items {
                id
                email
                uuid
                profileOwner
              }
            }
          }
        `;

        const exactProfileResult = await client.graphql<GraphQLQuery<any>>({
          query: exactUserProfileQuery,
          variables: {
            filter: { uuid: { eq: userId } }
          }
        });

        diagnosticResults.userProfile.exactMatch = exactProfileResult.data?.listUserProfiles?.items || [];
      } catch (err) {
        console.error("Error in exact UserProfile query:", err);
      }

      // 2. Try alternate user profile queries
      // Try with profileOwner
      try {
        const altProfileQuery1 = /* GraphQL */ `
          query GetAltUserProfile($filter: ModelUserProfileFilterInput) {
            listUserProfiles(filter: $filter, limit: 10) {
              items {
                id
                email
                uuid
                profileOwner
              }
            }
          }
        `;

        const altProfileResult1 = await client.graphql<GraphQLQuery<any>>({
          query: altProfileQuery1,
          variables: {
            filter: { profileOwner: { contains: userId } }
          }
        });

        const profiles1 = altProfileResult1.data?.listUserProfiles?.items || [];
        if (profiles1.length > 0) {
          diagnosticResults.userProfile.altQueries.push({
            query: "profileOwner: { contains: userId }",
            results: profiles1
          });
        }
      } catch (err) {
        console.error("Error in alt UserProfile query 1:", err);
      }

      // Try case insensitive uuid
      try {
        const altProfileQuery2 = /* GraphQL */ `
          query GetAltUserProfile($filter: ModelUserProfileFilterInput) {
            listUserProfiles(filter: $filter, limit: 10) {
              items {
                id
                email
                uuid
                profileOwner
              }
            }
          }
        `;

        // Try lowercase
        const altProfileResult2 = await client.graphql<GraphQLQuery<any>>({
          query: altProfileQuery2,
          variables: {
            filter: { uuid: { eq: userId.toLowerCase() } }
          }
        });

        const profiles2 = altProfileResult2.data?.listUserProfiles?.items || [];
        if (profiles2.length > 0) {
          diagnosticResults.userProfile.altQueries.push({
            query: "uuid: { eq: userId.toLowerCase() }",
            results: profiles2
          });
        }

        // Try uppercase
        const altProfileResult3 = await client.graphql<GraphQLQuery<any>>({
          query: altProfileQuery2,
          variables: {
            filter: { uuid: { eq: userId.toUpperCase() } }
          }
        });

        const profiles3 = altProfileResult3.data?.listUserProfiles?.items || [];
        if (profiles3.length > 0) {
          diagnosticResults.userProfile.altQueries.push({
            query: "uuid: { eq: userId.toUpperCase() }",
            results: profiles3
          });
        }
      } catch (err) {
        console.error("Error in alt UserProfile queries:", err);
      }

      // 3. Get all user profiles to see what's there
      try {
        const allProfilesQuery = /* GraphQL */ `
          query GetAllUserProfiles {
            listUserProfiles(limit: 50) {
              items {
                id
                email
                uuid
                profileOwner
              }
            }
          }
        `;

        const allProfilesResult = await client.graphql<GraphQLQuery<any>>({
          query: allProfilesQuery
        });

        const allProfiles = allProfilesResult.data?.listUserProfiles?.items || [];
        
        // Find profiles with any part matching our userId
        const potentialMatches = allProfiles.filter((profile: { uuid?: string, profileOwner?: string, id?: string }) => 
          profile.uuid?.includes(userId) || 
          profile.profileOwner?.includes(userId) ||
          profile.id?.includes(userId)
        );
        
        diagnosticResults.userProfile.allProfiles = potentialMatches;
      } catch (err) {
        console.error("Error getting all profiles:", err);
      }

      // 4. Determine recommended UserProfile query
      if (diagnosticResults.userProfile.exactMatch?.length > 0) {
        diagnosticResults.userProfile.recommendedQuery = "uuid: { eq: userId }";
      } else if (diagnosticResults.userProfile.altQueries.length > 0) {
        // Use the first successful alternative query
        diagnosticResults.userProfile.recommendedQuery = diagnosticResults.userProfile.altQueries[0].query;
      } else if (diagnosticResults.userProfile.allProfiles.length > 0) {
        // If we found potential matches, recommend the most likely field to query
        const profile = diagnosticResults.userProfile.allProfiles[0];
        if (profile.uuid?.includes(userId)) {
          diagnosticResults.userProfile.recommendedQuery = "uuid: { contains: userId }";
        } else if (profile.profileOwner?.includes(userId)) {
          diagnosticResults.userProfile.recommendedQuery = "profileOwner: { contains: userId }";
        } else {
          diagnosticResults.userProfile.recommendedQuery = "id: { contains: userId }";
        }
      }

      // 5. Try to get exact notification preferences match
      console.log("Trying exact NotificationPreference match with userId:", userId);
      try {
        const exactPrefQuery = /* GraphQL */ `
          query GetExactNotificationPreferences($filter: ModelNotificationPreferenceFilterInput) {
            listNotificationPreferences(filter: $filter, limit: 1) {
              items {
                id
                userId
              }
            }
          }
        `;

        const exactPrefResult = await client.graphql<GraphQLQuery<any>>({
          query: exactPrefQuery,
          variables: {
            filter: { userId: { eq: userId } }
          }
        });

        diagnosticResults.notificationPreferences.exactMatch = exactPrefResult.data?.listNotificationPreferences?.items || [];
      } catch (err) {
        console.error("Error in exact NotificationPreference query:", err);
      }

      // 6. Try alternate notification preferences queries - ENHANCED
      // Try with lowercase/uppercase userId and contains operator
      try {
        console.log("Trying comprehensive NotificationPreference queries with multiple patterns...");
        const altPrefQuery1 = /* GraphQL */ `
          query GetAltNotificationPreferences($filter: ModelNotificationPreferenceFilterInput) {
            listNotificationPreferences(filter: $filter, limit: 10) {
              items {
                id
                userId
              }
            }
          }
        `;

        // Try contains variation
        const altPrefResult3 = await client.graphql<GraphQLQuery<any>>({
          query: altPrefQuery1,
          variables: {
            filter: { userId: { contains: userId } }
          }
        });

        const prefs3 = altPrefResult3.data?.listNotificationPreferences?.items || [];
        if (prefs3.length > 0) {
          diagnosticResults.notificationPreferences.altQueries.push({
            query: "userId: { contains: userId }",
            results: prefs3
          });
          console.log("SUCCESS with userId contains:", prefs3);
        } else {
          console.log("No results with userId contains");
        }
        
        // Try with ID as the field (some schemas use id instead of userId)
        const altPrefResult4 = await client.graphql<GraphQLQuery<any>>({
          query: altPrefQuery1,
          variables: {
            filter: { id: { contains: userId } }
          }
        });

        const prefs4 = altPrefResult4.data?.listNotificationPreferences?.items || [];
        if (prefs4.length > 0) {
          diagnosticResults.notificationPreferences.altQueries.push({
            query: "id: { contains: userId }",
            results: prefs4
          });
          console.log("SUCCESS with id contains:", prefs4);
        } else {
          console.log("No results with id contains");
        }
        
        // Try with OR pattern for multiple field matches
        const altPrefResult5 = await client.graphql<GraphQLQuery<any>>({
          query: altPrefQuery1,
          variables: {
            filter: { 
              or: [
                { userId: { eq: userId } },
                { userId: { contains: userId } },
                { id: { contains: userId } }
              ] 
            }
          }
        });

        const prefs5 = altPrefResult5.data?.listNotificationPreferences?.items || [];
        if (prefs5.length > 0) {
          diagnosticResults.notificationPreferences.altQueries.push({
            query: "OR combination (userId eq/contains, id contains)",
            results: prefs5
          });
          console.log("SUCCESS with OR combination:", prefs5);
        } else {
          console.log("No results with OR combination");
        }
        
        // Try with combined field pattern like profileOwner
        // Some implementations might store userId as `${userId}::${userName}`
        if (userId.length > 10) {  // Only try if we have a reasonably long ID
          const altPrefResult6 = await client.graphql<GraphQLQuery<any>>({
            query: altPrefQuery1,
            variables: {
              filter: { userId: { beginsWith: userId.substring(0, 10) } }
            }
          });

          const prefs6 = altPrefResult6.data?.listNotificationPreferences?.items || [];
          if (prefs6.length > 0) {
            diagnosticResults.notificationPreferences.altQueries.push({
              query: "userId: { beginsWith: userId.substring(0, 10) }",
              results: prefs6
            });
            console.log("SUCCESS with userId beginsWith partial:", prefs6);
          } else {
            console.log("No results with userId beginsWith partial");
          }
        }
      } catch (err) {
        console.error("Error in comprehensive NotificationPreference queries:", err);
      }

      // 7. Get a sample of notification preferences to examine structure - NEW
      try {
        console.log("Getting a sample of all NotificationPreference records to examine structure");
        const samplePrefsQuery = /* GraphQL */ `
          query GetSamplePreferences {
            listNotificationPreferences(limit: 10) {
              items {
                id
                userId
                receiveSystemNotifications
                createdAt
              }
            }
          }
        `;

        const samplePrefsResult = await client.graphql<GraphQLQuery<any>>({
          query: samplePrefsQuery
        });

        const samplePrefs = samplePrefsResult.data?.listNotificationPreferences?.items || [];
        
        if (samplePrefs.length > 0) {
          console.log("Sample NotificationPreference records:", JSON.stringify(samplePrefs, null, 2));
          
          // Check if the userId field format matches what we expect
          if (samplePrefs[0].userId) {
            console.log("Example userId format:", samplePrefs[0].userId);
            
            // Check if the userId format looks like a UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isUuid = uuidRegex.test(samplePrefs[0].userId);
            
            if (!isUuid) {
              console.log("WARNING: userId does not appear to be a UUID format. Actual format:", samplePrefs[0].userId);
            }
          } else {
            console.log("WARNING: userId field not found in NotificationPreference records");
          }
        } else {
          console.log("No NotificationPreference records found in the database");
        }
      } catch (err) {
        console.error("Error getting NotificationPreference samples:", err);
      }

      // Original code continues
      try {
        const allPrefsQuery = /* GraphQL */ `
          query GetAllNotificationPreferences {
            listNotificationPreferences(limit: 50) {
              items {
                id
                userId
              }
            }
          }
        `;

        const allPrefsResult = await client.graphql<GraphQLQuery<any>>({
          query: allPrefsQuery
        });

        const allPrefs = allPrefsResult.data?.listNotificationPreferences?.items || [];
        
        // Find preferences with userId containing our userId
        const potentialMatches = allPrefs.filter((pref: { userId?: string; id?: string }) => 
            pref.userId?.includes(userId) ||
            pref.id?.includes(userId)
          );
        
        diagnosticResults.notificationPreferences.allPreferences = potentialMatches;
      } catch (err) {
        console.error("Error getting all preferences:", err);
      }

      // 8. Determine recommended NotificationPreferences query
      if (diagnosticResults.notificationPreferences.exactMatch?.length > 0) {
        diagnosticResults.notificationPreferences.recommendedQuery = "userId: { eq: userId }";
      } else if (diagnosticResults.notificationPreferences.altQueries.length > 0) {
        // Use the first successful alternative query
        diagnosticResults.notificationPreferences.recommendedQuery = diagnosticResults.notificationPreferences.altQueries[0].query;
      } else if (diagnosticResults.notificationPreferences.allPreferences.length > 0) {
        // If we found potential matches, recommend the most likely field to query
        const pref: { userId?: string, id?: string } = diagnosticResults.notificationPreferences.allPreferences[0];
        if (pref.userId?.includes(userId)) {
          diagnosticResults.notificationPreferences.recommendedQuery = "userId: { contains: userId }";
        } else {
          diagnosticResults.notificationPreferences.recommendedQuery = "id: { contains: userId }";
        }
      }

      // 9. Check welcome notification (to see if this user has any notifications)
      try {
        const welcomeNotifQuery = /* GraphQL */ `
          query GetWelcomeNotification($filter: ModelNotificationFilterInput) {
            listNotifications(filter: $filter, limit: 1) {
              items {
                id
                userId
                title
              }
            }
          }
        `;

        const welcomeNotifResult = await client.graphql<GraphQLQuery<any>>({
          query: welcomeNotifQuery,
          variables: {
            filter: {
              userId: { eq: userId },
              title: { contains: "Welcome" }
            }
          }
        });

        diagnosticResults.notifications.welcomeNotification = welcomeNotifResult.data?.listNotifications?.items || [];
      } catch (err) {
        console.error("Error checking welcome notification:", err);
      }

      // 10. Get all notifications for this user (any case)
      try {
        const allNotifQuery = /* GraphQL */ `
          query GetAllUserNotifications {
            listNotifications(limit: 50) {
              items {
                id
                userId
                title
              }
            }
          }
        `;

        const allNotifResult = await client.graphql<GraphQLQuery<any>>({
          query: allNotifQuery
        });

        const allNotifications = allNotifResult.data?.listNotifications?.items || [];
        
        // Find notifications with userId containing our userId (any case)
        const userNotifications = allNotifications.filter((notif: { userId?: string }) => 
          notif.userId?.includes(userId) || 
          notif.userId?.toLowerCase().includes(userId.toLowerCase())
        );
        
        diagnosticResults.notifications.allNotifications = userNotifications;
      } catch (err) {
        console.error("Error getting all notifications:", err);
      }

      // Set results
      setResults(diagnosticResults);

      // Determine if we have recommended query fixes to apply
      if (onQueryFix) {
        if (diagnosticResults.userProfile.recommendedQuery && 
            diagnosticResults.userProfile.recommendedQuery !== "uuid: { eq: userId }") {
          onQueryFix(diagnosticResults.userProfile.recommendedQuery, "UserProfile");
        }
        
        if (diagnosticResults.notificationPreferences.recommendedQuery && 
            diagnosticResults.notificationPreferences.recommendedQuery !== "userId: { eq: userId }") {
          onQueryFix(diagnosticResults.notificationPreferences.recommendedQuery, "NotificationPreferences");
        }
      }

    } catch (err) {
      console.error('Error running diagnostics:', err);
      setError(`Error running diagnostics: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="User Query Diagnostics">
      <div className="alert alert-info mb-4">
        <div className="d-flex">
          <div className="me-3">
            <i className="bi bi-search fs-3"></i>
          </div>
          <div>
            <h5 className="alert-heading">Data Query Diagnostics</h5>
            <p className="mb-0">
              This tool helps identify why the validator can't find data that exists in the database.
              It will attempt different query variations to find the correct data.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && runDiagnostics()}
          />
          <button
            className="btn btn-primary"
            onClick={runDiagnostics}
            disabled={loading || !userId.trim()}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Running Diagnostics...
              </>
            ) : (
              <>Run Diagnostics</>
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

      {loading && <LoadingSpinner text="Running comprehensive query diagnostics..." />}

      {results && (
        <div className="results-container">
          <h5 className="mb-3">Diagnostic Results</h5>
          
          {/* User ID Variations */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">User ID Variations</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Original</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      value={results.userIdFormats.original} 
                      readOnly 
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Lowercase</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      value={results.userIdFormats.lowercase} 
                      readOnly 
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Uppercase</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      value={results.userIdFormats.uppercase} 
                      readOnly 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* User Profile Results */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center bg-light">
              <h6 className="mb-0">User Profile Query Results</h6>
              {results.userProfile.recommendedQuery && (
                <span className="badge bg-success">Found Fix</span>
              )}
            </div>
            <div className="card-body">
              <h6>Standard Query:</h6>
              <div className="mb-3">
                <code className="d-block p-2 bg-light rounded">
                  uuid: &#123; eq: userId &#125;
                </code>
                <div className="mt-2">
                  <strong>Result: </strong>
                  {results.userProfile.exactMatch?.length > 0 ? (
                    <span className="badge bg-success">Found</span>
                  ) : (
                    <span className="badge bg-danger">Not Found</span>
                  )}
                </div>
              </div>
              
              {results.userProfile.altQueries.length > 0 && (
                <div className="mb-3">
                  <h6>Successful Alternative Queries:</h6>
                  {results.userProfile.altQueries.map((altQuery: any, idx: number) => (
                    <div key={idx} className="mb-2 p-2 border rounded">
                      <div><strong>Query:</strong> <code>{altQuery.query}</code></div>
                      <div><strong>Found:</strong> {altQuery.results.length} result(s)</div>
                    </div>
                  ))}
                </div>
              )}
              
              {results.userProfile.allProfiles.length > 0 && (
                <div className="mb-3">
                  <h6>Potential Profile Matches:</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>UUID</th>
                          <th>Profile Owner</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.userProfile.allProfiles.map((profile: any, idx: number) => (
                          <tr key={idx}>
                            <td><code>{profile.id}</code></td>
                            <td><code>{profile.uuid}</code></td>
                            <td><code>{profile.profileOwner}</code></td>
                            <td>{profile.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {results.userProfile.recommendedQuery && (
                <div className="alert alert-success">
                  <h6 className="mb-2">Recommended Query Fix:</h6>
                  <code>{results.userProfile.recommendedQuery}</code>
                </div>
              )}
            </div>
          </div>
          
          {/* Notification Preferences Results */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center bg-light">
              <h6 className="mb-0">Notification Preferences Query Results</h6>
              {results.notificationPreferences.recommendedQuery && (
                <span className="badge bg-success">Found Fix</span>
              )}
            </div>
            <div className="card-body">
              <h6>Standard Query:</h6>
              <div className="mb-3">
                <code className="d-block p-2 bg-light rounded">
                  userId: &#123; eq: userId &#125;
                </code>
                <div className="mt-2">
                  <strong>Result: </strong>
                  {results.notificationPreferences.exactMatch?.length > 0 ? (
                    <span className="badge bg-success">Found</span>
                  ) : (
                    <span className="badge bg-danger">Not Found</span>
                  )}
                </div>
              </div>
              
              {results.notificationPreferences.altQueries.length > 0 && (
                <div className="mb-3">
                  <h6>Successful Alternative Queries:</h6>
                  {results.notificationPreferences.altQueries.map((altQuery: any, idx: number) => (
                    <div key={idx} className="mb-2 p-2 border rounded">
                      <div><strong>Query:</strong> <code>{altQuery.query}</code></div>
                      <div><strong>Found:</strong> {altQuery.results.length} result(s)</div>
                    </div>
                  ))}
                </div>
              )}
              
              {results.notificationPreferences.allPreferences.length > 0 && (
                <div className="mb-3">
                  <h6>Potential Preference Matches:</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>User ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.notificationPreferences.allPreferences.map((pref: any, idx: number) => (
                          <tr key={idx}>
                            <td><code>{pref.id}</code></td>
                            <td><code>{pref.userId}</code></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {results.notificationPreferences.recommendedQuery && (
                <div className="alert alert-success">
                  <h6 className="mb-2">Recommended Query Fix:</h6>
                  <code>{results.notificationPreferences.recommendedQuery}</code>
                </div>
              )}
            </div>
          </div>
          
          {/* Notifications Info */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h6 className="mb-0">Notifications</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h6>Welcome Notification Status:</h6>
                {results.notifications.welcomeNotification?.length > 0 ? (
                  <div className="alert alert-success py-2">
                    Found welcome notification with standard query
                  </div>
                ) : (
                  <div className="alert alert-warning py-2">
                    No welcome notification found with standard query
                  </div>
                )}
              </div>
              
              {results.notifications.allNotifications.length > 0 && (
                <div>
                  <h6>All Notifications for This User:</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>User ID</th>
                          <th>Title</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.notifications.allNotifications.map((notif: any, idx: number) => (
                          <tr key={idx}>
                            <td><code>{notif.id}</code></td>
                            <td><code>{notif.userId}</code></td>
                            <td>{notif.title}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UserDiagnosticTool;