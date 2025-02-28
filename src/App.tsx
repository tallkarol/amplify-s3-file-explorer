import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { user, signOut } = useAuthenticator();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload?.['cognito:groups'];
        
        // If groups exists and is an array, check for admin or developer
        if (Array.isArray(groups)) {
          setIsAdmin(groups.includes('admin') || groups.includes('developer'));
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-container">
      <header>
        <nav className="navbar navbar-dark bg-primary">
          <div className="container">
            <span className="navbar-brand">S3 File Explorer</span>
            <div>
              <span className="text-light me-3">{user.username}</span>
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={signOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="container my-4">
        <Routes>
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/user" replace />} />
          <Route path="*" element={<Navigate to="/user" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;