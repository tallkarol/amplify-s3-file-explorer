// src/components/auth/UserStatusCheck.tsx
import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getUserStatus } from '@/features/clients/services/clientService';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface UserStatusCheckProps {
  children: React.ReactNode;
}

const UserStatusCheck: React.FC<UserStatusCheckProps> = ({ children }) => {
  const { user, signOut } = useAuthenticator();
  const [isChecking, setIsChecking] = useState(true);
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user || !user.userId) {
        setIsChecking(false);
        return;
      }
      
      try {
        const status = await getUserStatus(user.userId);
        
        if (status === 'disabled' || status === 'deleted') {
          setIsActive(false);
        } else {
          setIsActive(true);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        // Default to active if there's an error
        setIsActive(true);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkUserStatus();
  }, [user]);
  
  if (isChecking) {
    return <LoadingSpinner text="Verifying account status..." />;
  }
  
  if (!isActive) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-danger">
              <div className="card-header bg-danger text-white">
                <h5 className="mb-0">Account Suspended</h5>
              </div>
              <div className="card-body">
                <div className="text-center mb-4">
                  <i className="bi bi-slash-circle text-danger" style={{ fontSize: '4rem' }}></i>
                </div>
                <h5 className="text-center mb-3">Your account has been suspended</h5>
                <p className="text-center">
                  Access to your account has been temporarily disabled. 
                  Please contact your administrator for more information.
                </p>
                <div className="d-grid gap-2 mt-4">
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default UserStatusCheck;