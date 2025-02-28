// src/components/admin/RootFolderList.tsx
import { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { listUserFiles } from '../../services/S3Service';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import AlertMessage from '../common/AlertMessage';

interface RootFolderListProps {
  user: UserProfile;
  onSelectFolder: (folderPath: string) => void;
}

interface FolderInfo {
  id: string;       // Folder path
  name: string;     // Display name
  icon: string;     // Icon
  color: string;    // Color
  isProtected: boolean; // Whether folder is protected
}

const RootFolderList = ({ user, onSelectFolder }: RootFolderListProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  
  // Folder configuration (display info)
  const folderConfig: Record<string, Omit<FolderInfo, 'id'>> = {
    'certificate': { 
      name: 'Certificates', 
      icon: 'award', 
      color: 'primary',
      isProtected: true
    },
    'audit-report': { 
      name: 'Audit Reports', 
      icon: 'file-earmark-text', 
      color: 'success',
      isProtected: true
    },
    'auditor-resume': { 
      name: 'Auditor Profiles', 
      icon: 'person-badge', 
      color: 'info',
      isProtected: true
    },
    'statistics': { 
      name: 'Statistics', 
      icon: 'graph-up', 
      color: 'warning',
      isProtected: true
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user]);
  
  const fetchFolders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get root folders
      const items = await listUserFiles(user.uuid, '/');
      
      // Process folders
      const folderList: FolderInfo[] = items
        .filter(item => item.isFolder && item.name !== '..')
        .map(folder => {
          const folderName = folder.name;
          const config = folderConfig[folderName] || {
            name: folderName.charAt(0).toUpperCase() + folderName.slice(1),
            icon: 'folder',
            color: 'secondary',
            isProtected: folder.isProtected || false
          };
          
          return {
            id: folder.key,
            name: config.name,
            icon: config.icon,
            color: config.color,
            isProtected: config.isProtected
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setFolders(folderList);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError(`Failed to load folders: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderPath: string) => {
    onSelectFolder(folderPath);
  };
  
  if (loading) {
    return <LoadingSpinner text="Loading folders..." />;
  }
  
  if (error) {
    return <AlertMessage type="danger" message={error} />;
  }
  
  return (
    <Card title="User Folders">
      {folders.length === 0 ? (
        <p className="text-muted mb-0">No folders found</p>
      ) : (
        <div className="list-group">
          {folders.map(folder => (
            <button
              key={folder.id}
              className="list-group-item list-group-item-action d-flex align-items-center"
              onClick={() => handleFolderClick(folder.id)}
            >
              <div className={`bg-${folder.color} bg-opacity-10 p-2 rounded me-3`}>
                <i className={`bi bi-${folder.icon} text-${folder.color}`}></i>
              </div>
              <div className="flex-grow-1">
                <span>{folder.name}</span>
                {folder.isProtected && (
                  <span className="badge bg-danger ms-2" style={{ fontSize: '0.6rem' }}>Protected</span>
                )}
              </div>
              <i className="bi bi-chevron-right text-muted"></i>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RootFolderList;