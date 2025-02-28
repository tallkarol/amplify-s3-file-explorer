// src/components/user/UserProfileModal.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { UserProfile } from '../../types';
import AlertMessage from '../common/AlertMessage';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define query to get user profile
const getUserProfileQuery = /* GraphQL */ `
  query GetUserProfile($profileOwner: String!) {
    listUserProfiles(filter: { profileOwner: { eq: $profileOwner } }, limit: 1) {
      items {
        id
        email
        uuid
        profileOwner
        firstName
        lastName
      }
    }
  }
`;

// Define mutation to update user profile
const updateUserProfileMutation = /* GraphQL */ `
  mutation UpdateUserProfile(
    $input: UpdateUserProfileInput!
  ) {
    updateUserProfile(input: $input) {
      id
      email
      firstName
      lastName
      profileOwner
    }
  }
`;

// Response type for getUserProfile query
interface GetUserProfileResponse {
  listUserProfiles: {
    items: UserProfile[];
  };
}

// Response type for updateUserProfile mutation
interface UpdateUserProfileResponse {
  updateUserProfile: UserProfile;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user } = useAuthenticator();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Create a client for making GraphQL requests
  const client = generateClient();

  // Fetch user profile on modal open
  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const profileOwner = `${user.userId}::${user.username}`;
      
      const response = await client.graphql<GraphQLQuery<GetUserProfileResponse>>({
        query: getUserProfileQuery,
        variables: {
          profileOwner
        },
        authMode: 'userPool'
      });
      
      const items = response?.data?.listUserProfiles?.items || [];
      
      if (items.length > 0) {
        setProfile(items[0]);
        setFirstName(items[0].firstName || '');
        setLastName(items[0].lastName || '');
      } else {
        setError('Profile not found. Please contact support.');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(`Failed to load profile: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Save user profile changes
  const handleSave = async () => {
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await client.graphql<GraphQLQuery<UpdateUserProfileResponse>>({
        query: updateUserProfileMutation,
        variables: {
          input: {
            id: profile.id,
            firstName,
            lastName
          }
        },
        authMode: 'userPool'
      });
      
      setSuccess('Profile updated successfully!');
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(`Failed to update profile: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1040,
      display: 'block'
    }}>
      <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Profile</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {error && <AlertMessage type="danger" message={error} />}
              {success && <AlertMessage type="success" message={success} />}
              
              <div className="text-center mb-4">
                <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
                  <i className="bi bi-person-circle text-primary" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <h5 className="mb-0">{user.username}</h5>
                <p className="text-muted">{profile?.email}</p>
              </div>
              
              <div className="mb-3">
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input 
                  type="text"
                  id="firstName"
                  className="form-control" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  disabled={loading}
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input 
                  type="text"
                  id="lastName" 
                  className="form-control" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;