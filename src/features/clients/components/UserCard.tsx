// src/components/admin/UserCard.tsx
import Card from '../../../components/common/Card';
import { UserProfile } from '../../../types';

interface UserCardProps {
  user: UserProfile;
  onViewDetails: (user: UserProfile) => void;
}

const UserCard = ({ user, onViewDetails }: UserCardProps) => {
  return (
    <Card className="h-100">
      <div className="d-flex align-items-center mb-3">
        <div className="bg-light rounded-circle p-3 me-3">
          <i className="bi bi-person fs-4"></i>
        </div>
        <div>
          <h6 className="card-title mb-1 small">{user.email}</h6>
          <p className="card-text text-muted small mb-0">ID: {user.uuid.substring(0, 8)}...</p>
        </div>
      </div>
      
      {user.createdAt && (
        <p className="card-text small mb-0">
          <i className="bi bi-calendar me-1"></i>
          Joined: {new Date(user.createdAt).toLocaleDateString()}
        </p>
      )}
      
      <button 
        className="btn btn-sm btn-primary mt-3"
        onClick={() => onViewDetails(user)}
      >
        View Details
      </button>
    </Card>
  );
};

export default UserCard;