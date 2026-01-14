// src/components/developer/DuplicateUserTool.tsx
import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { fetchAllClients } from '@/features/clients/services/clientService';
import { hardDeleteUser } from '@/services/userDeleteService';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';

interface DuplicateGroup {
  key: string; // email or uuid
  type: 'email' | 'uuid';
  users: UserProfile[];
}

const DuplicateUserTool: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [selectedKeepUser, setSelectedKeepUser] = useState<Record<string, string>>({}); // groupKey -> userId to keep

  // Load all users (including deleted)
  const loadAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch including deleted users
      const allUsers = await fetchAllClients(true);
      setUsers(allUsers);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(`Failed to load users: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  // Scan for duplicates
  const scanForDuplicates = () => {
    setScanning(true);
    setError(null);
    setSuccess(null);
    setDuplicates([]);
    setSelectedKeepUser({});

    try {
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

      // Find email duplicates (more than one user with same email)
      emailMap.forEach((userList, email) => {
        if (userList.length > 1) {
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

      // Find UUID duplicates (more than one profile with same UUID)
      uuidMap.forEach((userList, uuid) => {
        if (userList.length > 1) {
          duplicateGroups.push({
            key: uuid,
            type: 'uuid',
            users: userList,
          });
        }
      });

      setDuplicates(duplicateGroups);
      
      if (duplicateGroups.length === 0) {
        setSuccess('No duplicates found! All users are unique.');
      } else {
        setSuccess(`Found ${duplicateGroups.length} duplicate group(s)`);
        
        // Auto-select the most recent non-deleted user as the one to keep for each group
        const autoSelected: Record<string, string> = {};
        duplicateGroups.forEach(group => {
          // Sort by createdAt (newest first), prefer non-deleted
          const sorted = [...group.users].sort((a, b) => {
            // Prefer non-deleted
            if (a.isDeleted && !b.isDeleted) return 1;
            if (!a.isDeleted && b.isDeleted) return -1;
            // Then by creation date (newest first)
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bDate - aDate;
          });
          
          if (sorted.length > 0) {
            autoSelected[group.key] = sorted[0].id;
          }
        });
        setSelectedKeepUser(autoSelected);
      }
    } catch (err: any) {
      console.error('Error scanning for duplicates:', err);
      setError(`Failed to scan for duplicates: ${err.message || 'Unknown error'}`);
    } finally {
      setScanning(false);
    }
  };

  // Delete duplicate users (keep the selected one)
  const deleteDuplicates = async (group: DuplicateGroup) => {
    const keepUserId = selectedKeepUser[group.key];
    if (!keepUserId) {
      setError('Please select which user to keep before deleting duplicates');
      return;
    }

    const keepUser = group.users.find(u => u.id === keepUserId);
    if (!keepUser || !keepUser.uuid) {
      setError('Invalid user selected to keep');
      return;
    }

    const usersToDelete = group.users.filter(u => u.id !== keepUserId);
    
    if (usersToDelete.length === 0) {
      setError('No users to delete');
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

      // Delete each duplicate user (hard delete since these are duplicates)
      const deletePromises = usersToDelete.map(user => {
        if (!user.uuid) {
          console.warn('User missing UUID, skipping:', user);
          return Promise.resolve();
        }
        return hardDeleteUser(user.uuid);
      });

      await Promise.all(deletePromises);

      setSuccess(`Successfully deleted ${usersToDelete.length} duplicate user(s). Kept user: ${keepUser.email || keepUser.uuid}`);
      
      // Refresh the list
      await loadAllUsers();
      // Re-scan for duplicates
      setTimeout(() => {
        scanForDuplicates();
      }, 1000);
    } catch (err: any) {
      console.error('Error deleting duplicates:', err);
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
            const keepUserId = selectedKeepUser[group.key];
            const isDeleting = group.users.some(u => u.id && deleting.has(u.id));
            
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
                    </p>
                  </div>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteDuplicates(group)}
                    disabled={!keepUserId || isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash me-2"></i>
                        Delete Duplicates
                      </>
                    )}
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>Keep</th>
                        <th>Email</th>
                        <th>UUID</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Deleted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.users.map((user) => {
                        const isSelected = keepUserId === user.id;
                        const isDeletingUser = !!(user.id && deleting.has(user.id));
                        
                        return (
                          <tr
                            key={user.id}
                            className={isSelected ? 'table-success' : isDeletingUser ? 'table-danger' : ''}
                          >
                            <td>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name={`keep-${group.key}`}
                                  checked={isSelected}
                                  onChange={() => {
                                    if (user.id) {
                                      setSelectedKeepUser(prev => ({
                                        ...prev,
                                        [group.key]: user.id
                                      }));
                                    }
                                  }}
                                  disabled={isDeletingUser}
                                />
                              </div>
                            </td>
                            <td>
                              {user.email || '-'}
                              {isSelected && (
                                <span className="badge bg-success ms-2">Keep</span>
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
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : '-'}
                            </td>
                            <td>
                              {user.isDeleted ? (
                                <span className="badge bg-danger">Deleted</span>
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
                  <strong>Warning:</strong> Deleting duplicates will permanently remove users from Cognito but preserve all data and files for compliance. 
                  Make sure to select the correct user to keep (usually the most recent non-deleted user).
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
