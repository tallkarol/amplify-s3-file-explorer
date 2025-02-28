// src/components/layout/Navigation.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

// Define props interface with isAdmin property
interface NavigationProps {
  isAdmin: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ isAdmin }) => {
  const location = useLocation();
  const { signOut, user } = useAuthenticator();
  
  const isActive = (path: string) => location.pathname === path;
  
  const userEmail = user.username || '';

  return (
    <>
      {/* Main navigation bar */}
      <nav className="navbar navbar-expand navbar-dark bg-primary">
        <div className="container">
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <i className="bi bi-folder-fill me-2"></i>
            S3 File Explorer
          </Link>
          
          <div className="d-flex flex-grow-1">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link 
                  to="/user" 
                  className={`nav-link ${isActive('/user') ? 'active' : ''}`}
                >
                  <i className="bi bi-house-door me-1"></i>
                  Dashboard
                </Link>
              </li>
              
              {isAdmin && (
                <li className="nav-item">
                  <Link 
                    to="/admin" 
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    <i className="bi bi-speedometer2 me-1"></i>
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
      
      {/* User info and sign out bar */}
      <div className="bg-light py-2 border-bottom shadow-sm">
        <div className="container">
          <div className="d-flex justify-content-end align-items-center">
            {userEmail && (
              <div className="d-flex align-items-center me-3">
                <i className="bi bi-person-circle me-2 text-secondary"></i>
                <span className="text-secondary">{userEmail}</span>
              </div>
            )}
            
            <button 
              onClick={signOut}
              className="btn btn-outline-secondary btn-sm"
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;