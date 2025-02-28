// src/components/admin/UserList.tsx
import UserCard from './UserCard';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import AlertMessage from '../common/AlertMessage';
import { UserProfile } from '../../types';


interface UserListProps {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
  onViewDetails: (user: UserProfile) => void;
}

const UserList = ({ users, loading, error, onViewDetails }: UserListProps) => {
  if (loading) {
    return <LoadingSpinner text="Loading users..." />;
  }
  
  if (error) {
    return (
      <AlertMessage
        type="danger"
        title="Error loading users"
        message={error}
        details="This might be due to permissions issues. Please check that your user is in the admin group and that the data model is properly configured."
      />
    );
  }
  
  if (users.length === 0) {
    return (
      <EmptyState
        icon="people"
        title="No users found"
        message="No users have been registered yet."
      />
    );
  }
  
  return (
    <div className="row">
      {users.map(user => (
        <div key={user.id} className="col-md-6 col-lg-4 mb-4">
          <UserCard 
            user={user} 
            onViewDetails={onViewDetails} 
          />
        </div>
      ))}
    </div>
  );
};

export default UserList;