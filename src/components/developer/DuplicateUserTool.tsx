// src/components/developer/DuplicateUserTool.tsx
import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { fetchAllClients } from '@/features/clients/services/clientService';
import { softDeleteUser, hardDeleteUser } from '@/services/userDeleteService';
import { listUserFiles } from '@/features/files/services/S3Service';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';

interface DuplicateGroup {
  key: string; // email or uuid
  type: 'email' | 'uuid';
  users: UserProfile[];
}

interface UserStats {
  fileCount: number;
  folderCount: number;
  totalSize: number;
  lastActivity?: string;
  notificationCount?: number;
  loading: boolean;
  error?: string;
}

const DuplicateUserTool: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [selectedDeleteUsers, setSelectedDeleteUsers] = useState<Set<string>>(new Set()); // Set of user IDs to delete
  const [userStats, setUserStats] = useState<Map<string, UserStats>>(new Map());
  const [fetchingStats, setFetchingStats] = useState<Set<string>>(new Set());

  const client = generateClient();

  // Load all users (including deleted)
  const loadAllUsers = async () => {
    console.log('[DuplicateUserTool] Loading all users (including deleted)...');
    try {
      setLoading(true);
      setError(null);
      // Fetch including deleted users
      const allUsers = await fetchAllClients(true);
      console.log(`[DuplicateUserTool] Loaded ${allUsers.length} users total`);
      setUsers(allUsers);
    } catch (err: any) {
      console.error('[DuplicateUserTool] Error loading users:', err);
      setError(`Failed to load users: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  // Fetch user statistics (file count, folder count, storage size, last activity)
  const fetchUserStats = async (userId: string, userUuid: string): Promise<UserStats> => {
    console.log(`[DuplicateUserTool] Fetching stats for user ${userId} (UUID: ${userUuid})`);
    try {
      setFetchingStats(prev => new Set(prev).add(userId));
      
      // Fetch all files for the user
      console.log(`[DuplicateUserTool] Listing files for user ${userUuid}...`);
      const allFiles = await listUserFiles(userUuid, '/');
      console.log(`[DuplicateUserTool] Found ${allFiles.length} items for user ${userUuid}`);
      
      // Separate files and folders
      const files = allFiles.filter(item => !item.isFolder);
      const folders = allFiles.filter(item => item.isFolder && item.name !== '..');
      console.log(`[DuplicateUserTool] User ${userUuid}: ${files.length} files, ${folders.length} folders`);
      
      // Calculate total size
      const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
      console.log(`[DuplicateUserTool] User ${userUuid}: Total size ${totalSize} bytes`);
      
      // Find last activity (most recent file modification)
      let lastActivity: string | undefined;
      if (files.length > 0) {
        const sortedFiles = [...files].sort((a, b) => {
          const aTime = a.lastModified ? new Date(a.lastModified).getTime() : 0;
          const bTime = b.lastModified ? new Date(b.lastModified).getTime() : 0;
          return bTime - aTime;
        });
        if (sortedFiles[0].lastModified) {
          // Convert to ISO string if it's a Date, otherwise use as-is
          lastActivity = typeof sortedFiles[0].lastModified === 'string' 
            ? sortedFiles[0].lastModified 
            : sortedFiles[0].lastModified instanceof Date 
              ? sortedFiles[0].lastModified.toISOString()
              : String(sortedFiles[0].lastModified);
          console.log(`[DuplicateUserTool] User ${userUuid}: Last activity ${lastActivity}`);
        }
      }
      
      // Fetch notification count (optional, don't fail if it errors)
      let notificationCount: number | undefined;
      try {
        console.log(`[DuplicateUserTool] Fetching notification count for user ${userUuid}...`);
        const notificationResponse = await client.graphql<GraphQLQuery<{ listNotifications: { items: { id: string }[] } }>>({
          query: /* GraphQL */ `
            query GetNotificationCount($userId: String!) {
              listNotifications(filter: { userId: { eq: $userId } }) {
                items {
                  id
                }
              }
            }
          `,
          variables: { userId: userUuid },
          authMode: 'userPool'
        });
        notificationCount = notificationResponse.data?.listNotifications?.items?.length || 0;
        console.log(`[DuplicateUserTool] User ${userUuid}: ${notificationCount} notifications`);
      } catch (err) {
        // Notification count is optional, don't fail if it errors
        console.warn(`[DuplicateUserTool] Could not fetch notification count for user ${userUuid}:`, err);
      }
      
      const stats: UserStats = {
        fileCount: files.length,
        folderCount: folders.length,
        totalSize,
        lastActivity,
        notificationCount,
        loading: false
      };
      
      console.log(`[DuplicateUserTool] Stats for user ${userId}:`, stats);
      setUserStats(prev => new Map(prev).set(userId, stats));
      return stats;
    } catch (err: any) {
      console.error(`[DuplicateUserTool] Error fetching stats for user ${userId}:`, err);
      const errorStats: UserStats = {
        fileCount: 0,
        folderCount: 0,
        totalSize: 0,
        loading: false,
        error: err.message || 'Failed to fetch stats'
      };
      setUserStats(prev => new Map(prev).set(userId, errorStats));
      return errorStats;
    } finally {
      setFetchingStats(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Fetch stats for all users in duplicate groups
  const fetchAllDuplicateStats = async (duplicateGroups: DuplicateGroup[]) => {
    console.log(`[DuplicateUserTool] Fetching stats for ${duplicateGroups.length} duplicate groups...`);
    const allUserIds = new Set<string>();
    duplicateGroups.forEach(group => {
      group.users.forEach(user => {
        if (user.id && user.uuid) {
          allUserIds.add(user.id);
        }
      });
    });

    console.log(`[DuplicateUserTool] Found ${allUserIds.size} unique users across duplicate groups`);

    // Fetch stats in parallel for all users
    const fetchPromises = Array.from(allUserIds).map(userId => {
      const user = users.find(u => u.id === userId);
      if (user && user.uuid) {
        return fetchUserStats(userId, user.uuid);
      }
      console.warn(`[DuplicateUserTool] User ${userId} not found in users list`);
      return Promise.resolve();
    });

    console.log(`[DuplicateUserTool] Starting parallel fetch of stats for ${fetchPromises.length} users...`);
    await Promise.all(fetchPromises);
    console.log(`[DuplicateUserTool] Completed fetching stats for all duplicate users`);
  };

  // Scan for duplicates
  const scanForDuplicates = async () => {
    console.log('[DuplicateUserTool] Starting duplicate scan...');
    setScanning(true);
    setError(null);
    setSuccess(null);
    setDuplicates([]);
    setSelectedDeleteUsers(new Set());
    setUserStats(new Map());

    try {
      console.log(`[DuplicateUserTool] Scanning ${users.length} users for duplicates...`);
      const duplicateGroups: DuplicateGroup[] = [];
      
      // Group by email (case-insensitive)
      const emailMap = new Map<string, UserProfile[]>();
      users.forEach(user => {
        if (user.email) {
          const emailKey = user.email.toLowerCase().trim();
          if (!emailMap.has(emailKey)) {
            emailMap.set(emailKey, []);
          }
          emailMap.get(emailKey)!.push(user);
        }
      });

      console.log(`[DuplicateUserTool] Found ${emailMap.size} unique emails`);

      // Find email duplicates (more than one user with same email)
      emailMap.forEach((userList, email) => {
        if (userList.length > 1) {
          console.log(`[DuplicateUserTool] Found ${userList.length} users with email: ${email}`);
          duplicateGroups.push({
            key: email,
            type: 'email',
            users: userList,
          });
        }
      });

      // Group by UUID
      const uuidMap = new Map<string, UserProfile[]>();
      users.forEach(user => {
        if (user.uuid) {
          const uuidKey = user.uuid;
          if (!uuidMap.has(uuidKey)) {
            uuidMap.set(uuidKey, []);
          }
          uuidMap.get(uuidKey)!.push(user);
        }
      });

      console.log(`[DuplicateUserTool] Found ${uuidMap.size} unique UUIDs`);

      // Find UUID duplicates (more than one profile with same UUID)
      uuidMap.forEach((userList, uuid) => {
        if (userList.length > 1) {
          console.log(`[DuplicateUserTool] Found ${userList.length} profiles with UUID: ${uuid}`);
          duplicateGroups.push({
            key: uuid,
            type: 'uuid',
            users: userList,
          });
        }
      });

      console.log(`[DuplicateUserTool] Found ${duplicateGroups.length} duplicate groups`);
      setDuplicates(duplicateGroups);
      
      if (duplicateGroups.length === 0) {
        console.log('[DuplicateUserTool] No duplicates found');
        setSuccess('No duplicates found! All users are unique.');
      } else {
        setSuccess(`Found ${duplicateGroups.length} duplicate group(s). Loading statistics...`);
        
        // Fetch stats for all duplicate users
        await fetchAllDuplicateStats(duplicateGroups);
        
        setSuccess(`Found ${duplicateGroups.length} duplicate group(s)`);
      }
    } catch (err: any) {
      console.error('[DuplicateUserTool] Error scanning for duplicates:', err);
      setError(`Failed to scan for duplicates: ${err.message || 'Unknown error'}`);
    } finally {
      setScanning(false);
    }
  };

  // Delete selected duplicate users (two-stage: soft delete first, then hard delete)
  const deleteDuplicates = async (group: DuplicateGroup) => {
    console.log(`[DuplicateUserTool] Starting deletion for group: ${group.key} (${group.type})`);
    
    // Get users selected for deletion in this group
    const usersToDelete = group.users.filter(u => u.id && selectedDeleteUsers.has(u.id));
    console.log(`[DuplicateUserTool] ${usersToDelete.length} users selected for deletion in group ${group.key}`);
    
    if (usersToDelete.length === 0) {
      console.warn('[DuplicateUserTool] No users selected for deletion');
      setError('Please select at least one user to delete');
      return;
    }

    // Ensure at least one user remains in the group
    if (usersToDelete.length >= group.users.length) {
      console.warn('[DuplicateUserTool] Cannot delete all users in group');
      setError('Cannot delete all users in a group. At least one user must remain.');
      return;
    }

    try {
      setDeleting((prev) => {
        const newSet = new Set(prev);
        usersToDelete.forEach(u => {
          if (u.id) newSet.add(u.id);
        });
        return newSet;
      });
      setError(null);
      setSuccess(null);

      // Delete each selected duplicate user
      // First delete: soft delete (if not already soft deleted)
      // Second delete: hard delete (if already soft deleted)
      const deletePromises = usersToDelete.map(async (user) => {
        if (!user.uuid) {
          console.warn(`[DuplicateUserTool] User missing UUID, skipping:`, user);
          return { user, action: 'skipped', reason: 'missing UUID' };
        }

        console.log(`[DuplicateUserTool] Processing deletion for user ${user.email || user.uuid} (UUID: ${user.uuid})`);
        console.log(`[DuplicateUserTool] User status - isDeleted: ${user.isDeleted}, status: ${user.status}`);

        try {
          // If user is already soft deleted (isDeleted = true), hard delete them
          if (user.isDeleted) {
            console.log(`[DuplicateUserTool] User ${user.uuid} is already soft deleted, performing hard delete...`);
            const result = await hardDeleteUser(user.uuid);
            console.log(`[DuplicateUserTool] Hard delete result for ${user.uuid}:`, result);
            return { user, action: 'hardDelete', result };
          } else {
            // User is active, soft delete them first
            console.log(`[DuplicateUserTool] User ${user.uuid} is active, performing soft delete...`);
            const result = await softDeleteUser(user.uuid, false);
            console.log(`[DuplicateUserTool] Soft delete result for ${user.uuid}:`, result);
            return { user, action: 'softDelete', result };
          }
        } catch (err: any) {
          console.error(`[DuplicateUserTool] Error deleting user ${user.uuid}:`, {
            error: err.message || err,
            errorType: err.name || 'Unknown',
            stack: err.stack,
            user: {
              email: user.email,
              uuid: user.uuid,
              id: user.id,
            },
          });
          
          // Provide more detailed error message
          let errorMessage = err.message || 'Unknown error';
          if (err.message?.includes('Failed to fetch') || err.message?.includes('Network error')) {
            errorMessage = `Network error: ${err.message}. Check console for details.`;
          }
          
          return { user, action: 'error', error: errorMessage };
        }
      });

      const results = await Promise.all(deletePromises);
      console.log(`[DuplicateUserTool] Deletion results:`, results);

      // Count successes and failures
      const softDeleted = results.filter(r => r.action === 'softDelete').length;
      const hardDeleted = results.filter(r => r.action === 'hardDelete').length;
      const errors = results.filter(r => r.action === 'error');
      const skipped = results.filter(r => r.action === 'skipped').length;

      console.log(`[DuplicateUserTool] Deletion summary: ${softDeleted} soft deleted, ${hardDeleted} hard deleted, ${errors.length} errors, ${skipped} skipped`);

      if (errors.length > 0) {
        const errorMessages = errors.map(e => `${e.user.email || e.user.uuid}: ${e.error}`).join(', ');
        console.error(`[DuplicateUserTool] Some deletions failed:`, errorMessages);
        setError(`Some deletions failed: ${errorMessages}`);
      }

      const remainingUsers = group.users.filter(u => !usersToDelete.includes(u));
      const remainingUser = remainingUsers[0];
      
      let successMessage = `Successfully processed ${usersToDelete.length} duplicate user(s). `;
      if (softDeleted > 0) {
        successMessage += `${softDeleted} soft deleted (made inactive). `;
      }
      if (hardDeleted > 0) {
        successMessage += `${hardDeleted} hard deleted (removed from Cognito). `;
      }
      successMessage += `Remaining user: ${remainingUser?.email || remainingUser?.uuid || 'N/A'}`;
      
      setSuccess(successMessage);
      
      // Remove deleted users from selection
      setSelectedDeleteUsers(prev => {
        const newSet = new Set(prev);
        usersToDelete.forEach(u => {
          if (u.id) newSet.delete(u.id);
        });
        return newSet;
      });
      
      // Remove stats for deleted users
      setUserStats(prev => {
        const newMap = new Map(prev);
        usersToDelete.forEach(u => {
          if (u.id) newMap.delete(u.id);
        });
        return newMap;
      });
      
      // Refresh the list
      console.log('[DuplicateUserTool] Refreshing user list...');
      await loadAllUsers();
      // Re-scan for duplicates
      setTimeout(() => {
        console.log('[DuplicateUserTool] Re-scanning for duplicates...');
        scanForDuplicates();
      }, 1000);
    } catch (err: any) {
      console.error('[DuplicateUserTool] Error deleting duplicates:', err);
      setError(`Failed to delete duplicates: ${err.message || 'Unknown error'}`);
    } finally {
      setDeleting((prev) => {
        const newSet = new Set(prev);
        usersToDelete.forEach(u => {
          if (u.id) newSet.delete(u.id);
        });
        return newSet;
      });
    }
  };

  // Toggle user selection for deletion
  const toggleUserSelection = (userId: string, group: DuplicateGroup) => {
    console.log(`[DuplicateUserTool] Toggling selection for user ${userId} in group ${group.key}`);
    setSelectedDeleteUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        console.log(`[DuplicateUserTool] Deselecting user ${userId}`);
        newSet.delete(userId);
      } else {
        // Ensure at least one user remains in the group
        const selectedInGroup = group.users.filter(u => u.id && newSet.has(u.id)).length;
        if (selectedInGroup >= group.users.length - 1) {
          console.warn(`[DuplicateUserTool] Cannot select all users in group ${group.key}`);
          setError('Cannot select all users for deletion. At least one user must remain.');
          return prev;
        }
        console.log(`[DuplicateUserTool] Selecting user ${userId} for deletion`);
        newSet.add(userId);
      }
      setError(null);
      console.log(`[DuplicateUserTool] Selected users: ${Array.from(newSet).join(', ')}`);
      return newSet;
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getDuplicateCount = () => {
    return duplicates.reduce((total, group) => total + group.users.length - 1, 0);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Duplicate User Detection & Cleanup</h4>
          <p className="text-muted mb-0">
            Scan for duplicate users by email or UUID and remove duplicates while preserving data.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={loadAllUsers}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Loading...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh Users
              </>
            )}
          </button>
          <button
            className="btn btn-primary"
            onClick={scanForDuplicates}
            disabled={scanning || loading || users.length === 0}
          >
            {scanning ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Scanning...
              </>
            ) : (
              <>
                <i className="bi bi-search me-2"></i>
                Scan for Duplicates
              </>
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

      <div className="mb-3">
        <div className="card bg-light">
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-4">
                <div className="h3 mb-0">{users.length}</div>
                <small className="text-muted">Total Users</small>
              </div>
              <div className="col-md-4">
                <div className="h3 mb-0 text-warning">{duplicates.length}</div>
                <small className="text-muted">Duplicate Groups</small>
              </div>
              <div className="col-md-4">
                <div className="h3 mb-0 text-danger">{getDuplicateCount()}</div>
                <small className="text-muted">Duplicate Users</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="text-center py-5">
          <LoadingSpinner size="lg" text="Loading users..." />
        </div>
      ) : duplicates.length === 0 && !scanning ? (
        <Card>
          <div className="text-center py-5">
            <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3">No Duplicates Found</h5>
            <p className="text-muted">
              Click "Scan for Duplicates" to check for duplicate users by email or UUID.
            </p>
          </div>
        </Card>
      ) : (
        <div>
          {duplicates.map((group) => {
            const isDeleting = group.users.some(u => u.id && deleting.has(u.id));
            const selectedCount = group.users.filter(u => u.id && selectedDeleteUsers.has(u.id)).length;
            const canDelete = selectedCount > 0 && selectedCount < group.users.length;
            
            // Sort users by file count (most files first) to help decision making
            const sortedUsers = [...group.users].sort((a, b) => {
              const aStats = userStats.get(a.id || '');
              const bStats = userStats.get(b.id || '');
              const aFiles = aStats?.fileCount || 0;
              const bFiles = bStats?.fileCount || 0;
              return bFiles - aFiles; // Descending order
            });
            
            return (
              <Card key={`${group.type}-${group.key}`} className="mb-3">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="mb-1">
                      <span className={`badge ${group.type === 'email' ? 'bg-info' : 'bg-warning'} me-2`}>
                        {group.type === 'email' ? 'Email' : 'UUID'}
                      </span>
                      {group.type === 'email' ? group.key : `${group.key.substring(0, 8)}...`}
                    </h5>
                    <p className="text-muted mb-0">
                      {group.users.length} user(s) found with {group.type === 'email' ? 'this email' : 'this UUID'}
                      {selectedCount > 0 && (
                        <span className="ms-2">
                          ({selectedCount} selected for deletion)
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteDuplicates(group)}
                    disabled={!canDelete || isDeleting}
                    title={!canDelete ? 'Select at least one user to delete (at least one must remain)' : 'Delete selected users'}
                  >
                    {isDeleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash me-2"></i>
                        Delete Selected ({selectedCount})
                      </>
                    )}
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>Delete</th>
                        <th>Email</th>
                        <th>UUID</th>
                        <th>Name</th>
                        <th>Date Registered</th>
                        <th>Files</th>
                        <th>Folders</th>
                        <th>Size</th>
                        <th>Last Activity</th>
                        <th>Status</th>
                        <th>Deleted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.map((user) => {
                        const isSelected = !!(user.id && selectedDeleteUsers.has(user.id));
                        const isDeletingUser = !!(user.id && deleting.has(user.id));
                        const stats = userStats.get(user.id || '');
                        const isLoadingStats = !!(user.id && fetchingStats.has(user.id));
                        
                        // Highlight users with more data (help identify which to keep)
                        const hasMoreData = stats && (stats.fileCount > 0 || stats.folderCount > 0);
                        
                        return (
                          <tr
                            key={user.id}
                            className={
                              isSelected 
                                ? 'table-danger' 
                                : isDeletingUser 
                                  ? 'table-secondary' 
                                  : hasMoreData 
                                    ? 'table-light' 
                                    : ''
                            }
                          >
                            <td>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (user.id) {
                                      toggleUserSelection(user.id, group);
                                    }
                                  }}
                                  disabled={isDeletingUser}
                                  title={isSelected ? 'Deselect to keep this user' : 'Select to delete this user'}
                                />
                              </div>
                            </td>
                            <td>
                              {user.email || '-'}
                              {isSelected && (
                                <span className="badge bg-danger ms-2">Delete</span>
                              )}
                              {!isSelected && hasMoreData && (
                                <span className="badge bg-info ms-2" title="Has files/folders">Data</span>
                              )}
                            </td>
                            <td>
                              <code className="small">{user.uuid || '-'}</code>
                            </td>
                            <td>
                              {user.firstName || user.lastName
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                : '-'}
                            </td>
                            <td>
                              {user.createdAt ? (
                                <span title={new Date(user.createdAt).toLocaleString()}>
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {isLoadingStats ? (
                                <span className="spinner-border spinner-border-sm" role="status" title="Loading..."></span>
                              ) : stats?.error ? (
                                <span className="text-muted" title={stats.error}>N/A</span>
                              ) : (
                                <span title={`${stats?.fileCount || 0} files`}>
                                  {stats?.fileCount || 0}
                                </span>
                              )}
                            </td>
                            <td>
                              {isLoadingStats ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                              ) : stats?.error ? (
                                <span className="text-muted">N/A</span>
                              ) : (
                                <span title={`${stats?.folderCount || 0} folders`}>
                                  {stats?.folderCount || 0}
                                </span>
                              )}
                            </td>
                            <td>
                              {isLoadingStats ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                              ) : stats?.error ? (
                                <span className="text-muted">N/A</span>
                              ) : (
                                <span title={`${formatFileSize(stats?.totalSize || 0)} total storage`}>
                                  {formatFileSize(stats?.totalSize || 0)}
                                </span>
                              )}
                            </td>
                            <td>
                              {isLoadingStats ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                              ) : stats?.error ? (
                                <span className="text-muted">N/A</span>
                              ) : stats?.lastActivity ? (
                                <span title={new Date(stats.lastActivity).toLocaleString()}>
                                  {new Date(stats.lastActivity).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {user.status && (
                                <span
                                  className={`badge ${
                                    user.status === 'active'
                                      ? 'bg-success'
                                      : user.status === 'inactive'
                                      ? 'bg-secondary'
                                      : 'bg-danger'
                                  }`}
                                >
                                  {user.status}
                                </span>
                              )}
                            </td>
                            <td>
                              {user.isDeleted ? (
                                <span className="badge bg-danger" title={`Soft deleted${user.deletedAt ? ` on ${new Date(user.deletedAt).toLocaleString()}` : ''}`}>
                                  Deleted
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="alert alert-warning mt-3 mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Warning:</strong> Deleting duplicates uses a two-stage process: First delete will soft delete (make inactive) active users, preserving all data and files for compliance. Second delete will hard delete (remove from Cognito) users that are already soft deleted. 
                  Select users to delete using checkboxes. At least one user must remain in each group. Users are sorted by file count (most files first) to help identify which users have data.
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DuplicateUserTool;
