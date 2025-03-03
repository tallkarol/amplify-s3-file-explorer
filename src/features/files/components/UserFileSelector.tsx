import React from 'react';
import { UserProfile } from '../../../types';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import AlertMessage from '@components/common/AlertMessage';

interface UserFileSelectorProps {
  selectedUser: UserProfile | null;
  onSelectUser: (user: UserProfile | null) => void;
  isLoading: boolean;
  error: string | null;
}

const UserFileSelector: React.FC<UserFileSelectorProps> = ({
  selectedUser,
  onSelectUser,
  isLoading,
  error
}) => {
  // This component would reuse your existing UserSelector component
  // or implement a simplified version for file management

  if (isLoading) {
    return <LoadingSpinner text="Loading user..." />;
  }

  if (error) {
    return <AlertMessage type="danger" message={error} />;
  }

  return (
    <Card title="Select Client">
      {selectedUser ? (
        <div className="user-selected p-3">
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
              <i className="bi bi-person-circle text-primary"></i>
            </div>
            <div>
              <h5 className="mb-1">
                {selectedUser.firstName && selectedUser.lastName
                  ? `${selectedUser.firstName} ${selectedUser.lastName}`
                  : selectedUser.email}
              </h5>
              {(selectedUser.firstName || selectedUser.lastName) && (
                <p className="mb-0 text-muted">{selectedUser.email}</p>
              )}
            </div>
          </div>
          <div className="mt-3">
            <button
              className="btn btn-sm btn-outline-secondary me-2"
              onClick={() => onSelectUser(null)}
            >
              Change User
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon="person-square"
          title="No User Selected"
          message="Please select a user to manage their files"
          action={
            <button
              className="btn btn-primary"
              onClick={() => {
                // This would open your user selector interface
                // For now, we'll just show a placeholder message
                alert("This would open the user selector");
              }}
            >
              Select User
            </button>
          }
        />
      )}
    </Card>
  );
};

export default UserFileSelector;