// src/components/developer/AdminManagement.tsx
import React, { useState, useEffect } from 'react';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import { syncAdminStatusFromCognito, updateUserAdminStatus } from '@/services/adminService';
import { softDeleteUser, hardDeleteUser } from '@/services/userDeleteService';
import { fetchAllClients } from '@/features/clients/services/clientService';
import { UserProfile } from '@/types';

interface AdminManagementProps {}

const AdminManagement: React.FC<AdminManagementProps> = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<UserProfile | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard' | null>(null);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const allUsers = await fetchAllClients();
      setUsers(allUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(`Failed to fetch users: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Sync admin status from Cognito
  const handleSyncFromCognito = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccess(null);

      const result = await syncAdminStatusFromCognito();

      if (result.success) {
        setSuccess(`Successfully synced ${result.updated} users from Cognito.`);
        setLastSyncTime(new Date());
        // Refresh user list
        await fetchUsers();
      } else {
        setError(`Sync completed with errors: ${result.errors.join(', ')}`);
        // Still refresh to show updated data
        await fetchUsers();
      }
    } catch (err: any) {
      console.error('Error syncing from Cognito:', err);
      setError(`Failed to sync from Cognito: ${err.message || 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  // Handle soft delete
  const handleSoftDelete = async (user: UserProfile) => {
    if (!user.uuid) {
      setError('User UUID not found');
      return;
    }

    try {
      setDeleting((prev) => new Set(prev).add(user.uuid!));
      setError(null);
      setSuccess(null);

      const result = await softDeleteUser(user.uuid, false);

      if (result.success) {
        setSuccess(result.message);
        await fetchUsers(); // Refresh user list
        setDeleteModalUser(null);
        setDeleteType(null);
      } else {
        setError(`Failed to soft delete user: ${result.message}`);
      }
    } catch (err: any) {
      console.error('Error soft deleting user:', err);
      setError(`Failed to soft delete user: ${err.message || 'Unknown error'}`);
    } finally {
      setDeleting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.uuid!);
        return newSet;
      });
    }
  };

  // Handle hard delete
  const handleHardDelete = async (user: UserProfile) => {
    if (!user.uuid) {
      setError('User UUID not found');
      return;
    }

    try {
      setDeleting((prev) => new Set(prev).add(user.uuid!));
      setError(null);
      setSuccess(null);

      const result = await hardDeleteUser(user.uuid);

      if (result.success) {
        setSuccess(result.message);
        await fetchUsers(); // Refresh user list
        setDeleteModalUser(null);
        setDeleteType(null);
      } else {
        setError(`Failed to hard delete user: ${result.message}`);
      }
    } catch (err: any) {
      console.error('Error hard deleting user:', err);
      setError(`Failed to hard delete user: ${err.message || 'Unknown error'}`);
    } finally {
      setDeleting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.uuid!);
        return newSet;
      });
    }
  };

  // Toggle admin status for a user
  const handleToggleAdmin = async (user: UserProfile, isAdmin: boolean) => {
    if (!user.uuid) {
      setError('User UUID not found');
      return;
    }

    try {
      setUpdating((prev) => new Set(prev).add(user.uuid!));
      setError(null);
      setSuccess(null);

      // Note: We're only toggling admin status, developer status stays the same
      // In the UI, developers can only change admin status, not developer status
      const result = await updateUserAdminStatus(
        user.uuid,
        isAdmin,
        user.isDeveloper || false
      );

      if (result.success) {
        setSuccess(result.message);
        // Update local state
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.uuid === user.uuid ? { ...u, isAdmin } : u
          )
        );
      } else {
        setError(`Failed to update admin status: ${result.message}`);
      }
    } catch (err: any) {
      console.error('Error updating admin status:', err);
      setError(`Failed to update admin status: ${err.message || 'Unknown error'}`);
    } finally {
      setUpdating((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.uuid!);
        return newSet;
      });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.uuid?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <LoadingSpinner size="lg" text="Loading users..." />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Admin Status Management</h4>
          <p className="text-muted mb-0">
            Manage admin status for users. Developer status can only be changed in Cognito UI.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSyncFromCognito}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Syncing...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-repeat me-2"></i>
              Sync from Cognito
            </>
          )}
        </button>
      </div>

      {lastSyncTime && (
        <div className="alert alert-info mb-3">
          <i className="bi bi-info-circle me-2"></i>
          Last synced: {lastSyncTime.toLocaleString()}
        </div>
      )}

      {error && (
        <AlertMessage
          type="danger"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {success && (
        <AlertMessage
          type="success"
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      )}

      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by email, name, or UUID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>UUID</th>
              <th className="text-center">Admin</th>
              <th className="text-center">Developer</th>
              <th>Status</th>
              <th>Deleted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-4">
                  {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id || user.uuid || `user-${Math.random()}`}>
                  <td>{user.email || '-'}</td>
                  <td>
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : '-'}
                  </td>
                  <td>
                    <code className="small">{user.uuid || '-'}</code>
                  </td>
                  <td className="text-center">
                    <div className="form-check form-switch d-inline-block">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={user.isAdmin || false}
                        onChange={(e) =>
                          handleToggleAdmin(user, e.target.checked)
                        }
                        disabled={updating.has(user.uuid || '') || !user.uuid || user.isDeleted}
                        id={`admin-${user.uuid}`}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`admin-${user.uuid}`}
                      >
                        {updating.has(user.uuid || '') && (
                          <span className="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
                        )}
                      </label>
                    </div>
                  </td>
                  <td className="text-center">
                    {user.isDeveloper ? (
                      <span className="badge bg-info">
                        <i className="bi bi-check-circle me-1"></i>
                        Developer
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
                      <div>
                        <span className="badge bg-danger mb-1">Deleted</span>
                        {user.deletedAt && (
                          <div className="small text-muted">
                            {new Date(user.deletedAt).toLocaleDateString()}
                          </div>
                        )}
                        {user.deletedBy && (
                          <div className="small text-muted">
                            By: {user.deletedBy.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {user.isDeleted ? (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          setDeleteModalUser(user);
                          setDeleteType('hard');
                        }}
                        disabled={deleting.has(user.uuid || '')}
                      >
                        {deleting.has(user.uuid || '') ? (
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                        ) : (
                          <>
                            <i className="bi bi-trash me-1"></i>
                            Hard Delete
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => {
                          setDeleteModalUser(user);
                          setDeleteType('soft');
                        }}
                        disabled={deleting.has(user.uuid || '')}
                      >
                        {deleting.has(user.uuid || '') ? (
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                        ) : (
                          <>
                            <i className="bi bi-x-circle me-1"></i>
                            Soft Delete
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-muted small">
        <i className="bi bi-info-circle me-1"></i>
        Showing {filteredUsers.length} of {users.length} users
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalUser && deleteType && (
        <div
          className="modal fade show"
          style={{
            display: 'block',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => {
            setDeleteModalUser(null);
            setDeleteType(null);
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <div className="w-100 text-center position-relative">
                  <div className="position-absolute top-0 start-0">
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setDeleteModalUser(null);
                        setDeleteType(null);
                      }}
                      aria-label="Close"
                      disabled={deleting.has(deleteModalUser.uuid || '')}
                    ></button>
                  </div>
                  <div className="my-3">
                    <div className={`${deleteType === 'hard' ? 'bg-danger' : 'bg-warning'}-subtle rounded-circle d-inline-flex p-4 mb-3`}>
                      <i className={`bi bi-exclamation-triangle text-${deleteType === 'hard' ? 'danger' : 'warning'}`} style={{ fontSize: '2.25rem' }}></i>
                    </div>
                    <h4 className="mb-1 fw-bold text-danger">
                      {deleteType === 'hard' ? 'Hard Delete User' : 'Soft Delete User'}
                    </h4>
                    <p className="text-muted mb-0">{deleteModalUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="modal-body px-4 pt-2">
                <div className={`alert alert-${deleteType === 'hard' ? 'danger' : 'warning'} border-0 rounded-3 mb-4`}>
                  <h6 className="alert-heading fw-bold">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {deleteType === 'hard' ? 'Permanent Deletion' : 'Account Deactivation'}
                  </h6>
                  {deleteType === 'soft' ? (
                    <>
                      <p className="mb-2">Soft deleting will:</p>
                      <ul className="mb-0">
                        <li>Disable the user's login access</li>
                        <li>Mark the account as inactive</li>
                        <li>Preserve all data and files for compliance</li>
                        <li>Keep the user in Cognito (disabled)</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="mb-2">Hard deleting will:</p>
                      <ul className="mb-0">
                        <li>Permanently remove the user from Cognito</li>
                        <li>Mark the account as deleted in the database</li>
                        <li><strong>Preserve all data and files for compliance</strong></li>
                        <li>This action cannot be undone</li>
                      </ul>
                    </>
                  )}
                </div>

                <p className="text-muted small mb-0">
                  <strong>Note:</strong> All data and files will be preserved for compliance purposes.
                </p>
              </div>

              <div className="modal-footer border-0 pt-2 pb-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-3"
                  onClick={() => {
                    setDeleteModalUser(null);
                    setDeleteType(null);
                  }}
                  disabled={deleting.has(deleteModalUser.uuid || '')}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-${deleteType === 'hard' ? 'danger' : 'warning'} rounded-3`}
                  onClick={() => {
                    if (deleteType === 'hard') {
                      handleHardDelete(deleteModalUser);
                    } else {
                      handleSoftDelete(deleteModalUser);
                    }
                  }}
                  disabled={deleting.has(deleteModalUser.uuid || '')}
                >
                  {deleting.has(deleteModalUser.uuid || '') ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-2"></i>
                      {deleteType === 'hard' ? 'Hard Delete' : 'Soft Delete'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
