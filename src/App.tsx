import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import UserDashboard from './pages/user/UserDashboard';
import Layout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import DeveloperLayout from './layouts/DeveloperLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Import Admin Pages
import AdminHome from './pages/admin/AdminDashboard';
import AdminClientManagement from './pages/admin/AdminClientManagement';
import AdminFileManagement from './pages/admin/AdminFileManagement';
import AdminWorkflowManagement from './pages/admin/AdminWorkflowManagement';
import AdminInbox from './pages/admin/AdminInbox';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSupport from './pages/admin/AdminSupport';

// Import Developer Pages
import DeveloperDashboard from './pages/developer/DeveloperDashboard';
import DeveloperFeatureToggleManagement from '@components/developer/FeatureToggleManagement';


function App() {
  const {} = useAuthenticator();
  const [userRole, setUserRole] = useState<'admin' | 'developer' | 'user'>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUserRole() {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload?.['cognito:groups'];
        
        // Check user groups and set role accordingly
        if (Array.isArray(groups)) {
          if (groups.includes('admin')) {
            setUserRole('admin');
          } else if (groups.includes('developer')) {
            setUserRole('developer');
          } else {
            setUserRole('user');
          }
        } else {
          setUserRole('user');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('user');
      } finally {
        setIsLoading(false);
      }
    }

    checkUserRole();
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
        userRole === 'admin' || userRole === 'developer' ? (
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
      
      {/* Developer Routes */}
      <Route path="/developer/*" element={
        userRole === 'developer' || userRole === 'admin' ? (
          <DeveloperLayout>
            <Routes>
              <Route path="/" element={<DeveloperDashboard />} />
              <Route path="/feature" element={<DeveloperFeatureToggleManagement />} />
              <Route path="/support" element={<DeveloperDashboard />} />
              <Route path="/debug" element={<DeveloperDashboard />} />
              <Route path="/api-docs" element={<DeveloperDashboard />} />
              <Route path="*" element={<Navigate to="/developer" replace />} />
            </Routes>
          </DeveloperLayout>
        ) : (
          <Navigate to="/user" replace />
        )
      } />
      
      {/* User Routes */}
      <Route path="/user/*" element={
        <Layout isAdmin={userRole === 'admin'}>
          <Routes>
            <Route path="/" element={<UserDashboard />} />
            <Route path="/folder/:folderId" element={<UserDashboard />} />
            <Route path="*" element={<Navigate to="/user" replace />} />
          </Routes>
        </Layout>
      } />
      
      {/* Default redirect */}
      <Route path="/" element={
        <Navigate to={
          userRole === 'admin' ? "/admin" : 
          userRole === 'developer' ? "/developer" : 
          "/user"
        } replace />
      } />
      <Route path="*" element={
        <Navigate to={
          userRole === 'admin' ? "/admin" : 
          userRole === 'developer' ? "/developer" : 
          "/user"
        } replace />
      } />
    </Routes>
  );
}

export default App;