// src/features/clients/components/UserActionsCard.tsx
import { useState } from 'react';
import { UserProfile } from '@/types';
import Card from '@/components/common/Card';
import { useUserRole } from '@/hooks/useUserRole'; // Use the existing useUserRole instead
import { suspendUserAccount, reactivateUserAccount } from '../services/clientService';

interface UserActionsCardProps {
  user: UserProfile;
  onStatusChange?: () => void;
}

const UserActionsCard = ({ user, onStatusChange }: UserActionsCardProps) => {
  const [showActionConfirm, setShowActionConfirm] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useUserRole(); // Use the existing hook
  
  // Check if user is a developer (simplified logic)
  const isUserDeveloper = user.profileOwner?.includes('developer') || false;
  
  // Check if current user can modify this user
  const canModify = isAdmin && !isUserDeveloper;
  
  // Check if user is suspended - fix the type comparison issue
  const isSuspended = user.status === 'inactive' || user.status === 'suspended';
  
  // Handle action click
  const handleActionClick = (actionType: string) => {
    setShowActionConfirm(actionType);
    setError(null);
  };
  
  // Cancel action
  const cancelAction = () => {
    setShowActionConfirm(null);
  };
  
  // Execute the selected action
  const executeAction = async () => {
    if (!showActionConfirm) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      switch (showActionConfirm) {
        case 'suspend-account':
          if (!canModify) {
            throw new Error('You do not have permission to suspend this user.');
          }
          await suspendUserAccount(user.uuid);
          break;
          
        case 'reactivate-account':
          if (!canModify) {
            throw new Error('You do not have permission to reactivate this user.');
          }
          await reactivateUserAccount(user.uuid);
          break;
          
        case 'reset-password':
          // Existing reset password logic here
          alert(`Password reset link would be sent to ${user.email}`);
          break;
      }
      
      // Clear the confirm dialog
      setShowActionConfirm(null);
      
      // Notify parent component to refresh
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err) {
      console.error('Error executing action:', err);
      setError(`Failed to execute action: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  };
  
  // Render confirmation panel
  const renderConfirmation = () => {
    switch (showActionConfirm) {
      case 'suspend-account':
        return (
          <div className="alert alert-danger">
            <h6 className="alert-heading">Suspend User Account?</h6>
            <p>This will temporarily disable {user.email}'s access to the system. Their data will be preserved in compliance with retention policies.</p>
            {error && <div className="text-danger mt-2">{error}</div>}
            <div className="d-flex justify-content-end mt-3">
              <button 
                className="btn btn-sm btn-outline-secondary me-2" 
                onClick={cancelAction}
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                className="btn btn-sm btn-danger" 
                onClick={executeAction}
                disabled={processing || !canModify}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Suspending...
                  </>
                ) : 'Suspend Account'}
              </button>
            </div>
          </div>
        );
        
      case 'reactivate-account':
        return (
          <div className="alert alert-warning">
            <h6 className="alert-heading">Reactivate User Account?</h6>
            <p>This will restore {user.email}'s access to the system.</p>
            {error && <div className="text-danger mt-2">{error}</div>}
            <div className="d-flex justify-content-end mt-3">
              <button 
                className="btn btn-sm btn-outline-secondary me-2" 
                onClick={cancelAction}
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                className="btn btn-sm btn-success" 
                onClick={executeAction}
                disabled={processing || !canModify}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Reactivating...
                  </>
                ) : 'Reactivate Account'}
              </button>
            </div>
          </div>
        );
        
      case 'reset-password':
        // Existing reset password confirmation
        return (
          <div className="alert alert-warning">
            <h6 className="alert-heading">Reset User Password?</h6>
            <p>This will send a password reset link to {user.email}.</p>
            <div className="d-flex justify-content-end">
              <button className="btn btn-sm btn-outline-secondary me-2" onClick={cancelAction}>Cancel</button>
              <button className="btn btn-sm btn-warning" onClick={executeAction}>Reset Password</button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card title="User Management Actions">
      {showActionConfirm ? (
        renderConfirmation()
      ) : (
        <div className="list-group">
          {/* Show suspend or reactivate button based on current status */}
          {!isSuspended ? (
            <button 
              className="list-group-item list-group-item-action d-flex align-items-center"
              onClick={() => handleActionClick('suspend-account')}
              disabled={!canModify || isUserDeveloper}
              title={
                !canModify ? "You don't have permission to suspend users" :
                isUserDeveloper ? "Developer accounts cannot be suspended" :
                "Temporarily disable user access"
              }
            >
              <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                <i className="bi bi-slash-circle text-danger"></i>
              </div>
              <div>
                <div className="fw-medium">Suspend Account</div>
                <small className="text-muted">Temporarily disable user access</small>
              </div>
            </button>
          ) : (
            <button 
              className="list-group-item list-group-item-action d-flex align-items-center"
              onClick={() => handleActionClick('reactivate-account')}
              disabled={!canModify}
              title={!canModify ? "You don't have permission to reactivate users" : "Restore user access"}
            >
              <div className="bg-success bg-opacity-10 p-2 rounded me-3">
                <i className="bi bi-person-check text-success"></i>
              </div>
              <div>
                <div className="fw-medium">Reactivate Account</div>
                <small className="text-muted">Restore user access to the system</small>
              </div>
            </button>
          )}
          
          {/* Keep the reset password button */}
          <button 
            className="list-group-item list-group-item-action d-flex align-items-center"
            onClick={() => handleActionClick('reset-password')}
          >
            <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
              <i className="bi bi-key text-warning"></i>
            </div>
            <div>
              <div className="fw-medium">Reset Password</div>
              <small className="text-muted">Send a password reset link to the user</small>
            </div>
          </button>
        </div>
      )}
      
      <div className="text-muted small mt-3">
        <i className="bi bi-info-circle me-1"></i>
        {isUserDeveloper ? (
          "Developer accounts cannot be suspended through this interface."
        ) : !canModify ? (
          "Only administrators can suspend or reactivate user accounts."
        ) : (
          "These actions require admin privileges and will be logged for auditing purposes."
        )}
      </div>
    </Card>
  );
};

export default UserActionsCard;