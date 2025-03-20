// src/App.tsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Import Error Boundary
import ErrorBoundary from "@/components/error/ErrorBoundary";

// Import User Pages
import Layout from '@/layouts/UserLayout';
import UserDashboard from '@/pages/user/UserDashboard';
import UserWorkflowDashboard from "@/features/workflows/pages/UserWorkflowDashboard";

// Import Admin Pages
import AdminLayout from '@/layouts/AdminLayout';
import AdminHome from '@/pages/admin/AdminDashboard';
import AdminClientManagement from '@/features/clients/pages/AdminClientManagement';
import AdminFileManagement from '@/features/files/pages/AdminFileManagement';
import AdminWorkflowDashboard from "@/features/workflows/pages/AdminWorkflowDashboard";

// Import Developer Pages
import DeveloperLayout from '@/layouts/DeveloperLayout';
import DeveloperDashboard from '@/pages/developer/DeveloperDashboard';
import DebugTools from "@/pages/developer/DebugTools";

// Import Notification Components
import { NotificationProvider } from "@/features/notifications/context/NotificationContext";
import NotificationDetail from "@/features/notifications/components/NotificationDetail";

// Import Inbox Component
import Inbox from '@/pages/inbox/Inbox';

// Import User Status Check
import UserStatusCheck from '@/components/auth/UserStatusCheck';

function App() {
  const { user } = useAuthenticator();
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
  }, [user]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <UserStatusCheck>
          <Routes>
            {/* Universal Inbox Route - can be accessed from any layout */}
            <Route path="/inbox" element={
              <Layout isAdmin={userRole === 'admin'}>
                <Inbox />
              </Layout>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              userRole === 'admin' || userRole === 'developer' ? (
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminHome />} />
                    <Route path="/clients" element={<AdminClientManagement />} />
                    <Route path="/files" element={<AdminFileManagement />} />
                    <Route path="/workflows" element={<AdminWorkflowDashboard />} />
                    <Route path="/inbox" element={<Inbox />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </AdminLayout>
              ) : (
                <Navigate to="/user" replace />
              )
            } />
            
            {/* Developer Routes */}
            <Route path="/developer/*" element={
              userRole === 'developer' ? (
                <DeveloperLayout>
                  <Routes>
                    <Route path="/" element={<DeveloperDashboard />} />
                    <Route path="/user" element={<UserDashboard />} />
                    <Route path="/admin" element={<AdminHome />} />
                    <Route path="/debug" element={<DebugTools />} />
                    <Route path="/inbox" element={<Inbox />} />
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
                    <Route path="/workflows" element={<UserWorkflowDashboard />} />
                    <Route path="/folder/:folderId" element={<UserDashboard />} />
                    <Route path="*" element={<Navigate to="/user" replace />} />
                </Routes>
              </Layout>
            } />
            
            {/* Notification Detail Route - Works with any layout */}
            <Route path="/notifications/detail/:id" element={
              <Layout isAdmin={userRole === 'admin'}>
                <NotificationDetail />
              </Layout>
            } />
            
            {/* Notification Listing Page */}
            <Route path="/notifications" element={
              <Layout isAdmin={userRole === 'admin'}>
                <div className="container py-4">
                  <h2>All Notifications</h2>
                  <p className="text-muted">View and manage all your notifications</p>
                  {/* This could be replaced with a dedicated NotificationsPage component */}
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    The full notifications page is coming soon. For now, you can view notifications by clicking the bell icon.
                  </div>
                </div>
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
          </Routes>
        </UserStatusCheck>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;