// src/components/user/DeleteAccountModal.tsx
import React, { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useNavigate } from 'react-router-dom';
import { softDeleteUser } from '@/services/userDeleteService';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuthenticator();
  const navigate = useNavigate();
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredText = 'DELETE MY ACCOUNT';
  const isConfirmed = confirmationText === requiredText;

  const handleDelete = async () => {
    if (!isConfirmed) {
      return;
    }

    if (!user?.userId) {
      setError('User ID not found');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await softDeleteUser(user.userId, true);

      // Sign out and redirect to login
      await signOut();
      navigate('/');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show"
      style={{
        display: 'block',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
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
                  onClick={onClose}
                  aria-label="Close"
                  disabled={loading}
                ></button>
              </div>
              <div className="my-3">
                <div className="bg-danger-subtle rounded-circle d-inline-flex p-4 mb-3">
                  <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '2.25rem' }}></i>
                </div>
                <h4 className="mb-1 fw-bold text-danger">Delete Account</h4>
                <p className="text-muted mb-0">This action cannot be undone</p>
              </div>
            </div>
          </div>

          <div className="modal-body px-4 pt-2">
            {error && (
              <AlertMessage
                type="danger"
                message={error}
                dismissible
                onDismiss={() => setError(null)}
              />
            )}

            <div className="alert alert-warning border-0 rounded-3 mb-4">
              <h6 className="alert-heading fw-bold">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Warning: Account Deletion
              </h6>
              <p className="mb-2">
                Deleting your account will:
              </p>
              <ul className="mb-0">
                <li>Disable your login access immediately</li>
                <li>Mark your account as inactive</li>
                <li>Preserve your data for compliance purposes</li>
                <li>Keep your files in S3 storage</li>
              </ul>
              <hr />
              <p className="mb-0 small">
                <strong>Note:</strong> Your data will be retained for compliance purposes. 
                Files and records will remain in the system but your account will be disabled.
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmationInput" className="form-label fw-semibold">
                To confirm, please type <strong className="text-danger">{requiredText}</strong>:
              </label>
              <input
                type="text"
                id="confirmationInput"
                className={`form-control form-control-lg rounded-3 ${
                  confirmationText && !isConfirmed ? 'is-invalid' : ''
                }`}
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={requiredText}
                disabled={loading}
                autoComplete="off"
              />
              {confirmationText && !isConfirmed && (
                <div className="invalid-feedback">
                  Text must match exactly: {requiredText}
                </div>
              )}
            </div>

            {loading && (
              <div className="text-center py-3">
                <LoadingSpinner text="Deleting account..." />
              </div>
            )}
          </div>

          <div className="modal-footer border-0 pt-2 pb-4">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-3"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger rounded-3"
              onClick={handleDelete}
              disabled={!isConfirmed || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash me-2"></i>
                  Delete My Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
