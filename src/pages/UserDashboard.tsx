// src/pages/UserDashboard.tsx
import FileBrowser from '../components/user/FileBrowser';
import TabNavigation from '../components/admin/TabNavigation';
import { TabItem } from '../types';
import { useState, useEffect } from 'react';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('files');
  
  // Define the tabs configuration - for user dashboard we only have one tab
  const tabs: TabItem[] = [
    { id: 'files', label: 'File Management', icon: 'folder' }
  ];

  useEffect(() => {
    // This hook can be used for any initializations when the tab changes
    // For now it's simple, but later you might fetch data based on the active tab
  }, [activeTab]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">User Dashboard</h2>
      </div>

      {/* Tab navigation */}
      <TabNavigation 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* Content based on active tab */}
      <FileBrowser />
    </div>
  );
};

export default UserDashboard;