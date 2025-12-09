// src/pages/user/UserProfile.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AlertMessage from '@/components/common/AlertMessage';
import { deactivateUserAccount } from '@/features/clients/services/clientService';
import { getAllAdminUserIds } from '@/services/adminService';
import { createNotification } from '@/features/notifications/services/NotificationService';

interface UserProfileData {
  id: string;
  email: string;
  uuid: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phoneNumber?: string;
  preferredContactMethod?: string;
  status?: string;
}

const UserProfile = () => {
  const { user, signOut } = useAuthenticator();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const client = generateClient();

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const query = /* GraphQL */ `
        query GetUserProfile($uuid: String!) {
          listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 1) {
            items {
              id
              email
              uuid
              firstName
              lastName
              companyName
              phoneNumber
              preferredContactMethod
              status
            }
          }
        }
      `;

      const response = await client.graphql<GraphQLQuery<any>>({
        query,
        variables: { uuid: user.userId },
        authMode: 'userPool'
      });

      const items = response.data?.listUserProfiles?.items;
      if (items && items.length > 0) {
        setProfile(items[0]);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;

    try {
      setDeleteLoading(true);
      setError(null);

      // Deactivate the user account
      await deactivateUserAccount(profile.uuid);

      // Notify all admins
      const adminIds = await getAllAdminUserIds();
      const userName = [profile.firstName, profile.lastName]
        .filter(Boolean)
        .join(' ') || profile.email;

      await Promise.all(
        adminIds.map(adminId =>
          createNotification({
            userId: adminId,
            type: 'admin',
            title: 'User Account Deactivation Request',
            message: `${userName} (${profile.email}) has requested account deletion. The account has been deactivated and requires admin approval for final deletion.`,
            isRead: false,
            actionLink: `/admin/clients?clientId=${profile.uuid}`,
            metadata: {
              userEmail: profile.email,
              userName,
              userId: profile.uuid,
              icon: 'person-dash',
              color: 'warning',
              action: 'delete-requested'
            }
          })
        )
      );

      // Sign out the user
      setSuccess('Your account has been deactivated. An administrator will finalize the deletion. You will now be signed out.');
      
      setTimeout(() => {
        signOut();
      }, 3000);
    } catch (err) {
      console.error('Error deactivating account:', err);
      setError('Failed to deactivate account. Please try again or contact support.');
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-fluid p-4">
        <AlertMessage type="danger" message="Profile not found" />
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="mb-4">
        <h2>Profile & Settings</h2>
        <p className="text-muted">Manage your account information and preferences</p>
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

      <div className="row">
        {/* Account Information */}
        <div className="col-lg-8 mb-4">
          <Card title="Account Information">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold text-muted small">First Name</label>
                <p className="mb-0">{profile.firstName || 'Not provided'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold text-muted small">Last Name</label>
                <p className="mb-0">{profile.lastName || 'Not provided'}</p>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold text-muted small">Email Address</label>
                <p className="mb-0">{profile.email}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold text-muted small">Company</label>
                <p className="mb-0">{profile.companyName || 'Not provided'}</p>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold text-muted small">Phone Number</label>
                <p className="mb-0">{profile.phoneNumber || 'Not provided'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold text-muted small">Preferred Contact</label>
                <p className="mb-0">
                  <span className="badge bg-primary">
                    {profile.preferredContactMethod || 'Email'}
                  </span>
                </p>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold text-muted small">Account Status</label>
                <p className="mb-0">
                  <span className={`badge bg-${profile.status === 'active' ? 'success' : 'warning'}`}>
                    {profile.status || 'Active'}
                  </span>
                </p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold text-muted small">User ID</label>
                <p className="mb-0">
                  <code className="bg-light p-1 rounded small">{profile.uuid}</code>
                </p>
              </div>
            </div>

            <div className="alert alert-info mt-3">
              <i className="bi bi-info-circle me-2"></i>
              To update your profile information, please contact an administrator.
            </div>
          </Card>
        </div>

        {/* Account Actions */}
        <div className="col-lg-4">
          <Card title="Account Actions">
            <div className="d-grid gap-2">
              <button className="btn btn-outline-secondary" disabled>
                <i className="bi bi-key me-2"></i>
                Change Password
                <span className="badge bg-secondary ms-2">Coming Soon</span>
              </button>
              
              <hr />
              
              <div className="alert alert-danger">
                <h6 className="alert-heading">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Danger Zone
                </h6>
                <p className="mb-2 small">
                  Deleting your account will deactivate your access immediately. An administrator must approve the final deletion.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    className="btn btn-danger btn-sm w-100"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Delete My Account
                  </button>
                ) : (
                  <div className="mt-3">
                    {deleteStep === 1 && (
                      <>
                        <p className="fw-bold mb-2">Are you sure?</p>
                        <p className="small mb-3">
                          This action will:
                        </p>
                        <ul className="small mb-3">
                          <li>Immediately deactivate your account</li>
                          <li>Sign you out of all sessions</li>
                          <li>Notify administrators for approval</li>
                          <li>Preserve your files for record-keeping</li>
                        </ul>
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteStep(2)}
                          >
                            Yes, Continue
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteStep(1);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}

                    {deleteStep === 2 && (
                      <>
                        <p className="fw-bold mb-2 text-danger">
                          Final Confirmation
                        </p>
                        <p className="small mb-3">
                          Type <strong>DELETE</strong> to confirm:
                        </p>
                        <input
                          type="text"
                          className="form-control form-control-sm mb-3"
                          placeholder="Type DELETE"
                          onChange={(e) => {
                            if (e.target.value === 'DELETE') {
                              setDeleteStep(3);
                            }
                          }}
                        />
                        <button
                          className="btn btn-outline-secondary btn-sm w-100"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteStep(1);
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {deleteStep === 3 && (
                      <>
                        <p className="fw-bold mb-3 text-danger">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Proceeding with account deletion
                        </p>
                        <button
                          className="btn btn-danger btn-sm w-100"
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Deactivating...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-trash me-2"></i>
                              Confirm Deletion
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

