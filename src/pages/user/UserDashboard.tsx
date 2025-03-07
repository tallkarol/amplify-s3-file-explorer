// src/pages/user/UserDashboard.tsx
import { useParams, Link } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import FileBrowser from '@/features/files/components/FileBrowser';
import FolderGrid from '@/features/files/components/FolderGrid';
import UserAllFiles from '@/features/files/components/UserAllFiles';
import Card from '@/components/common/Card'; 
import DragDropDemo from '@/features/files/components/DragDropDemo';

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
      icon: string;
      color: string;
    }
    
    const folderMap: Record<string, FolderInfo> = {
      'certificate': { 
        title: 'Certificates',
        description: 'Store and manage your certification documents',
        icon: 'award',
        color: 'primary'
      },
      'audit-report': { 
        title: 'Audit Reports',
        description: 'Access your audit reports and documentation',
        icon: 'file-earmark-text',
        color: 'success'
      },
      'auditor-resume': { 
        title: 'Auditor Profiles',
        description: 'Manage auditor resumes and qualifications',
        icon: 'person-badge',
        color: 'info'
      },
      'statistics': { 
        title: 'Statistics & Analytics',
        description: 'View performance metrics and statistics',
        icon: 'graph-up',
        color: 'warning'
      }
    };
    
    return folderMap[folderId] || { 
      title: folderId?.charAt(0).toUpperCase() + folderId?.slice(1).replace(/-/g, ' ') || 'Unknown Folder', 
      description: '',
      icon: 'folder',
      color: 'secondary'
    };
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

  // Handle folder selection
  const handleFolderSelect = (folderPath: string) => {
    const folderName = folderPath.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes
    // Use the existing React Router setup for navigation
    window.location.href = folderName ? `/user/folder/${folderName}` : '/user';
  };

  // Handler for refreshing files
  const handleRefreshFiles = () => {
    // This will be passed to both components to allow them to trigger refresh on each other
    console.log("Refreshing all files view");
  };

  return (
    <div className="container-fluid p-4">
      {folderId ? (
        // Specific folder view with improved styling
        <>
          {/* Breadcrumb navigation with Bootstrap styling */}
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/user">Dashboard</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {folderInfo?.title}
              </li>
            </ol>
          </nav>

          {/* Folder header with icon and description */}
          <div className="d-flex align-items-center mb-4">
            <div className={`bg-${folderInfo?.color}-subtle text-${folderInfo?.color} p-3 rounded-3 me-3`} 
                style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`bi bi-${folderInfo?.icon} fs-2`}></i>
            </div>
            <div>
              <h1 className="h3 mb-1">{folderInfo?.title}</h1>
              <p className="text-muted mb-0">{folderInfo?.description}</p>
            </div>
          </div>
          
          {/* File browser */}
          <FileBrowser 
            userId={user.userId}
            initialPath={getCurrentPath()}
            restrictToCurrentFolder={true}
            folderDisplayName={folderInfo?.title}
          />
        </>
      ) : (
        // Root dashboard view with improved styling
        <>
          {/* Welcome header */}
          <div className="mb-4">
            <h1 className="h3 mb-2">Welcome to Your Dashboard</h1>
            <p className="text-muted">
              Access your files and documents in the folders below
            </p>
          </div>

          {/* Folder grid using the updated component */}
          <Card title="Your Folders" className="mb-4">
            <FolderGrid
              userId={user.userId}
              onSelectFolder={handleFolderSelect}
              currentPath={getCurrentPath()}
            />
          </Card>

          {/* Added: User All Files component */}
          <Card className="mb-4">
            <UserAllFiles 
              userId={user.userId}
              userName={user?.username || "User"}
              onRefreshRequest={handleRefreshFiles}
            />
          </Card>

          {/* Drag and drop demo with card styling for consistency */}
          <Card title="Upload Files" className="mb-4">
            <p className="text-muted mb-4">
              Need to upload files? Select a folder above or use the drag and drop feature below.
            </p>
            <DragDropDemo />
          </Card>
        </>
      )}
    </div>
  );
};

export default UserDashboard;