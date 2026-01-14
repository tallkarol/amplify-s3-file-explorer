// src/components/developer/AdminManagement.tsx
import React, { useState, useEffect } from 'react';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import { syncAdminStatusFromCognito, updateUserAdminStatus } from '@/services/adminService';
import { fetchAllClients } from '@/features/clients/services/clientService';
import { UserProfile } from '@/types';

interface AdminManagementProps {}

const AdminManagement: React.FC<AdminManagementProps> = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

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
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
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
                        disabled={updating.has(user.uuid || '') || !user.uuid}
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
    </div>
  );
};

export default AdminManagement;
