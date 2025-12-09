// src/features/clients/components/UserActionsCard.tsx
import { useState } from 'react';
import { UserProfile } from '@/types';
import Card from '@/components/common/Card';
import { useUserRole } from '@/hooks/useUserRole'; // Use the existing useUserRole instead
import { 
  deactivateUserAccount, 
  reactivateUserAccount, 
  markUserAsDeleted, 
  adminResetUserPassword 
} from '../services/clientService';
import { getAllAdminUserIds } from '@/services/adminService';
import { notifyAdminsOfPasswordReset } from '@/services/loginTrackingService';
import { createNotification } from '@/features/notifications/services/NotificationService';

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
  
  // Check user status
  const isActive = user.status === 'active';
  const isInactive = user.status === 'inactive';
  const isDeleted = user.status === 'deleted';
  
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
        case 'deactivate-account':
          if (!canModify) {
            throw new Error('You do not have permission to deactivate this user.');
          }
          await deactivateUserAccount(user.uuid);
          
          // Notify all admins about the deactivation
          try {
            const adminIds = await getAllAdminUserIds();
            const userName = [user.firstName, user.lastName]
              .filter(Boolean)
              .join(' ') || user.email;
            
            await Promise.all(
              adminIds.map(adminId =>
                createNotification({
                  userId: adminId,
                  type: 'admin',
                  title: 'User Account Deactivated',
                  message: `${userName} (${user.email}) has been deactivated. The account can be reactivated or marked for deletion.`,
                  isRead: false,
                  actionLink: `/admin/clients?clientId=${user.uuid}`,
                  metadata: {
                    userEmail: user.email,
                    userName,
                    userId: user.uuid,
                    icon: 'person-dash',
                    color: 'warning',
                    action: 'deactivated'
                  }
                })
              )
            );
          } catch (notifError) {
            console.error('Error sending deactivation notification:', notifError);
          }
          break;
          
        case 'reactivate-account':
          if (!canModify) {
            throw new Error('You do not have permission to reactivate this user.');
          }
          await reactivateUserAccount(user.uuid);
          break;
          
        case 'mark-as-deleted':
          if (!canModify) {
            throw new Error('You do not have permission to mark this user as deleted.');
          }
          await markUserAsDeleted(user.uuid);
          
          // Notify all admins about the deletion
          try {
            const adminIds = await getAllAdminUserIds();
            const userName = [user.firstName, user.lastName]
              .filter(Boolean)
              .join(' ') || user.email;
            
            await Promise.all(
              adminIds.map(adminId =>
                createNotification({
                  userId: adminId,
                  type: 'admin',
                  title: '⚠️ User Marked for Deletion',
                  message: `${userName} (${user.email}) has been marked as deleted. Files are preserved. Click to finalize or restore the account.`,
                  isRead: false,
                  actionLink: `/admin/clients?clientId=${user.uuid}`,
                  metadata: {
                    userEmail: user.email,
                    userName,
                    userId: user.uuid,
                    icon: 'person-x',
                    color: 'danger',
                    action: 'marked-deleted',
                    requiresAction: true
                  }
                })
              )
            );
          } catch (notifError) {
            console.error('Error sending deletion notification:', notifError);
          }
          break;
          
        case 'reset-password':
          await adminResetUserPassword(user.uuid);
          
          // Notify all admins about the password reset
          try {
            const adminIds = await getAllAdminUserIds();
            const userName = [user.firstName, user.lastName]
              .filter(Boolean)
              .join(' ') || user.email;
            
            await notifyAdminsOfPasswordReset(
              adminIds,
              user.email,
              userName,
              user.uuid
            );
          } catch (notifError) {
            console.error('Error sending password reset notification:', notifError);
            // Don't fail the reset if notification fails
          }
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
      case 'deactivate-account':
        return (
          <div className="alert alert-warning">
            <h6 className="alert-heading">Deactivate User Account?</h6>
            <p>This will set {user.email}'s status to <strong>inactive</strong> and disable their login access. All files will be preserved. The account can be reactivated later.</p>
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
                className="btn btn-sm btn-warning" 
                onClick={executeAction}
                disabled={processing || !canModify}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Deactivating...
                  </>
                ) : 'Deactivate Account'}
              </button>
            </div>
          </div>
        );
        
      case 'reactivate-account':
        return (
          <div className="alert alert-success">
            <h6 className="alert-heading">Reactivate User Account?</h6>
            <p>This will restore {user.email}'s access to the system and set their status to <strong>active</strong>.</p>
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
        
      case 'mark-as-deleted':
        return (
          <div className="alert alert-danger">
            <h6 className="alert-heading">Mark User as Deleted?</h6>
            <p>This will mark {user.email} as <strong>deleted</strong>. The account cannot login and email will be available for reuse. This is a soft-delete - files are preserved for compliance.</p>
            <p className="mb-0"><small><strong>Note:</strong> This action can only be performed on inactive accounts.</small></p>
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
                    Marking as Deleted...
                  </>
                ) : 'Mark as Deleted'}
              </button>
            </div>
          </div>
        );
        
      case 'reset-password':
        return (
          <div className="alert alert-info">
            <h6 className="alert-heading">Reset User Password?</h6>
            <p>A password reset email will be sent to <strong>{user.email}</strong>. The user will receive a temporary link to create a new password.</p>
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
                className="btn btn-sm btn-primary" 
                onClick={executeAction}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : 'Send Reset Email'}
              </button>
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
          {/* Show appropriate actions based on current status */}
          {isActive && (
            <button 
              className="list-group-item list-group-item-action d-flex align-items-center"
              onClick={() => handleActionClick('deactivate-account')}
              disabled={!canModify || isUserDeveloper}
              title={
                !canModify ? "You don't have permission to deactivate users" :
                isUserDeveloper ? "Developer accounts cannot be deactivated" :
                "Set user to inactive status"
              }
            >
              <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                <i className="bi bi-pause-circle text-warning"></i>
              </div>
              <div>
                <div className="fw-medium">Deactivate Account</div>
                <small className="text-muted">Disable user access (can be reactivated)</small>
              </div>
            </button>
          )}
          
          {isInactive && (
            <>
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
              
              <button 
                className="list-group-item list-group-item-action d-flex align-items-center"
                onClick={() => handleActionClick('mark-as-deleted')}
                disabled={!canModify}
                title={!canModify ? "You don't have permission to mark users as deleted" : "Mark user as deleted"}
              >
                <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                  <i className="bi bi-trash text-danger"></i>
                </div>
                <div>
                  <div className="fw-medium">Mark as Deleted</div>
                  <small className="text-muted">Soft-delete user (files preserved)</small>
                </div>
              </button>
            </>
          )}
          
          {isDeleted && (
            <div className="alert alert-danger mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>User is Deleted</strong>
              <p className="mb-0 mt-2 small">
                This user account has been marked as deleted. To permanently remove the account, use the Developer Tools.
              </p>
            </div>
          )}
          
          {/* Reset password button - available for active and inactive users */}
          {!isDeleted && (
            <button 
              className="list-group-item list-group-item-action d-flex align-items-center"
              onClick={() => handleActionClick('reset-password')}
              disabled={isDeleted}
            >
              <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                <i className="bi bi-key text-primary"></i>
              </div>
              <div>
                <div className="fw-medium">Reset Password</div>
                <small className="text-muted">Send a password reset email to the user</small>
              </div>
            </button>
          )}
        </div>
      )}
      
      <div className="text-muted small mt-3">
        <i className="bi bi-info-circle me-1"></i>
        {isUserDeveloper ? (
          "Developer accounts cannot be deactivated through this interface."
        ) : !canModify ? (
          "Only administrators can manage user account status."
        ) : isDeleted ? (
          "Deleted accounts can only be permanently removed by developers."
        ) : (
          "Account lifecycle: Active → Inactive → Deleted. All actions are logged for compliance."
        )}
      </div>
    </Card>
  );
};

export default UserActionsCard;