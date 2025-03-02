import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import UserDashboard from './pages/UserDashboard';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Import Admin Pages
import AdminHome from './pages/admin/AdminHome';
import AdminClientManagement from './pages/admin/AdminClientManagement';
import AdminFileManagement from './pages/admin/AdminFileManagement';
import AdminWorkflowManagement from './pages/admin/AdminWorkflowManagement';
import AdminInbox from './pages/admin/AdminInbox';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSupport from './pages/admin/AdminSupport';

function App() {
  const {} = useAuthenticator();
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
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="/admin/*" element={
        isAdmin ? (
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminHome />} />
              <Route path="/clients" element={<AdminClientManagement />} />
              <Route path="/files" element={<AdminFileManagement />} />
              <Route path="/workflows" element={<AdminWorkflowManagement />} />
              <Route path="/inbox" element={<AdminInbox />} />
              <Route path="/calendar" element={<AdminCalendar />} />
              <Route path="/settings" element={<AdminSettings />} />
              <Route path="/support" element={<AdminSupport />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </AdminLayout>
        ) : (
          <Navigate to="/user" replace />
        )
      } />
      
      {/* User Routes */}
      <Route path="/user/*" element={
        <Layout isAdmin={isAdmin}>
          <Routes>
            <Route path="/" element={<UserDashboard />} />
            <Route path="/folder/:folderId" element={<UserDashboard />} />
            <Route path="*" element={<Navigate to="/user" replace />} />
          </Routes>
        </Layout>
      } />
      
      {/* Default redirect */}
      <Route path="/" element={
        <Navigate to={isAdmin ? "/admin" : "/user"} replace />
      } />
      <Route path="*" element={
        <Navigate to={isAdmin ? "/admin" : "/user"} replace />
      } />
    </Routes>
  );
}

export default App;