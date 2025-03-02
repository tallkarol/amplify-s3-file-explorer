// src/pages/UserDashboard.tsx
import { useParams } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import FileBrowser from '../../features/files/components/FileBrowser';
import FolderCardsView from '../../features/users/components/FolderCardsView';
import DragDropDemo from '../../features/files/components/DragDropDemo'; // Import the drag and drop demo component

const UserDashboard = () => {
  const { user } = useAuthenticator();
  const { folderId } = useParams();
  
  // Get folder information
  const getFolderInfo = () => {
    if (!folderId) return null;
    
    // Define the folder map with proper type
    interface FolderInfo {
      title: string;
      description: string;
    }
    
    const folderMap: Record<string, FolderInfo> = {
      'certificate': { 
        title: 'Certificates',
        description: 'Store and manage your certification documents'
      },
      'audit-report': { 
        title: 'Audit Reports',
        description: 'Access your audit reports and documentation'
      },
      'auditor-resume': { 
        title: 'Auditor Profiles',
        description: 'Manage auditor resumes and qualifications'
      },
      'statistics': { 
        title: 'Statistics & Analytics',
        description: 'View performance metrics and statistics'
      }
    };
    
    return folderMap[folderId] || { title: folderId, description: '' };
  };

  const folderInfo = getFolderInfo();
  
  // Get current folder path based on the URL parameter
  const getCurrentPath = (): string => {
    if (!folderId) {
      return '/'; // Root folder
    }
    
    // Specific folder
    return `/${folderId}/`;
  };

  return (
    <div>
      {/* Content based on folder */}
      {folderId ? (
        // Show file browser for specific folder
        <FileBrowser 
          userId={user.userId}
          initialPath={getCurrentPath()}
          restrictToCurrentFolder={true}
          folderDisplayName={folderInfo?.title}
        />
      ) : (
        // Show folder card view and drag drop demo for root
        <>
          <FolderCardsView userId={user.userId} />
          <DragDropDemo /> {/* Add the drag and drop demo component */}
        </>
      )}
    </div>
  );
};

export default UserDashboard;