// src/components/admin/UserActionsCard.tsx
import { useState } from 'react';
import { UserProfile } from '../../../types';
import Card from '../../../components/common/Card';

interface UserActionsCardProps {
  user: UserProfile;
}

const UserActionsCard = ({ user }: UserActionsCardProps) => {
  const [showActionConfirm, setShowActionConfirm] = useState<string | null>(null);
  
  // Handle action click
  const handleActionClick = (actionType: string) => {
    setShowActionConfirm(actionType);
  };
  
  // Cancel action
  const cancelAction = () => {
    setShowActionConfirm(null);
  };
  
  // Execute the selected action (this would integrate with actual functionality in a real app)
  const executeAction = () => {
    // In a real application, this would call the appropriate function
    // For now, we'll just show an alert and close the confirmation
    alert(`Action "${showActionConfirm}" would be performed on user ${user.email}`);
    setShowActionConfirm(null);
  };
  
  // Render confirmation panel based on action type
  const renderConfirmation = () => {
    switch (showActionConfirm) {
      case 'reset-password':
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
      case 'export-data':
        return (
          <div className="alert alert-info">
            <h6 className="alert-heading">Export User Data?</h6>
            <p>This will generate an export file with all of {user.email}'s data and file list.</p>
            <div className="d-flex justify-content-end">
              <button className="btn btn-sm btn-outline-secondary me-2" onClick={cancelAction}>Cancel</button>
              <button className="btn btn-sm btn-info" onClick={executeAction}>Export Data</button>
            </div>
          </div>
        );
      case 'suspend-account':
        return (
          <div className="alert alert-danger">
            <h6 className="alert-heading">Suspend User Account?</h6>
            <p>This will temporarily disable {user.email}'s access to the system.</p>
            <div className="d-flex justify-content-end">
              <button className="btn btn-sm btn-outline-secondary me-2" onClick={cancelAction}>Cancel</button>
              <button className="btn btn-sm btn-danger" onClick={executeAction}>Suspend Account</button>
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
          
          <button 
            className="list-group-item list-group-item-action d-flex align-items-center"
            onClick={() => handleActionClick('export-data')}
          >
            <div className="bg-info bg-opacity-10 p-2 rounded me-3">
              <i className="bi bi-download text-info"></i>
            </div>
            <div>
              <div className="fw-medium">Export User Data</div>
              <small className="text-muted">Download a report of all user data</small>
            </div>
          </button>
          
          <button 
            className="list-group-item list-group-item-action d-flex align-items-center"
            onClick={() => handleActionClick('suspend-account')}
          >
            <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
              <i className="bi bi-slash-circle text-danger"></i>
            </div>
            <div>
              <div className="fw-medium">Suspend Account</div>
              <small className="text-muted">Temporarily disable user access</small>
            </div>
          </button>
        </div>
      )}
      
      <div className="text-muted small mt-3">
        <i className="bi bi-info-circle me-1"></i>
        These actions require admin privileges and will be logged for auditing purposes.
      </div>
    </Card>
  );
};

export default UserActionsCard;