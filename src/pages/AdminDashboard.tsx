// src/pages/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import TabNavigation from '../components/admin/TabNavigation';
import UserList from '../components/admin/UserList';
import AdminFileBrowser from '../components/admin/AdminFileBrowser';
import { UserProfile, ListUserProfilesResponse, TabItem } from '../types';

// Define the query
const listUserProfilesQuery = /* GraphQL */ `
  query ListUserProfiles {
    listUserProfiles {
      items {
        id
        email
        uuid
        profileOwner
        firstName
        lastName
        createdAt
      }
    }
  }
`;

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('users');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Tab configuration
  const tabs: TabItem[] = [
    { id: 'users', label: 'User Management', icon: 'people' },
    { id: 'files', label: 'File Management', icon: 'folder' }
  ];

  useEffect(() => {
    // Only fetch users when the users tab is active or when we first load
    if (activeTab === 'users' || users.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  async function fetchUsers() {
    try {
      setLoading(true);
      
      // Create a client for making GraphQL requests
      const client = generateClient();
            
      // Use the query with proper typing
      const response = await client.graphql<GraphQLQuery<ListUserProfilesResponse>>({
        query: listUserProfilesQuery,
        authMode: 'userPool'
      });
      
      // Safely access the data with proper typing
      const items = response?.data?.listUserProfiles?.items || [];
      setUsers(items);
      
      // If no user is selected and we have users, select the first one
      if (!selectedUser && items.length > 0) {
        setSelectedUser(items[0]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to load users: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  const handleViewUserDetails = (user: UserProfile) => {
    setSelectedUser(user);
    // If we're on the users tab and select a user, switch to files tab
    if (activeTab === 'users') {
      setActiveTab('files');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Admin Dashboard</h2>
        <div>
          {selectedUser && (
            <div className="d-flex align-items-center">
              <i className="bi bi-person-circle me-2"></i>
              <span>
                Selected: <strong>{selectedUser.email}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <TabNavigation 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* Content based on active tab */}
      {activeTab === 'users' ? (
        <UserList 
          users={users}
          loading={loading}
          error={error}
          onViewDetails={handleViewUserDetails}
        />
      ) : (
        <AdminFileBrowser selectedUser={selectedUser} />
      )}
    </div>
  );
};

export default AdminDashboard;