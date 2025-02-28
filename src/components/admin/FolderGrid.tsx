// src/components/admin/FolderGrid.tsx
import { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { listUserFiles } from '../../services/S3Service';
import LoadingSpinner from '../common/LoadingSpinner';
import AlertMessage from '../common/AlertMessage';

interface FolderGridProps {
  user: UserProfile;
  onSelectFolder: (folderPath: string) => void;
  compact?: boolean; // Whether to show compact view for non-root navigation
  currentPath?: string; // Current path for highlighting active folder
}

interface FolderInfo {
  id: string;       // Folder path
  name: string;     // Display name
  icon: string;     // Icon
  color: string;    // Color
  isProtected: boolean; // Whether folder is protected
}

const FolderGrid = ({ 
  user, 
  onSelectFolder, 
  compact = false,
  currentPath = '/'
}: FolderGridProps) => {
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
  
  // Check if a folder is active (current path)
  const isFolderActive = (folderPath: string) => {
    if (currentPath === '/') return false;
    
    // Extract the folder name from both paths for comparison
    const currentFolderName = currentPath.split('/').filter(Boolean)[0];
    const folderName = folderPath.split('/').filter(Boolean)[0];
    
    return currentFolderName === folderName;
  };
  
  if (loading) {
    return <LoadingSpinner text="Loading folders..." />;
  }
  
  if (error) {
    return <AlertMessage type="danger" message={error} />;
  }
  
  if (folders.length === 0) {
    return <p className="text-muted">No folders found</p>;
  }
  
  // Compact view for navigation bar
  if (compact) {
    return (
      <div className="folder-nav mb-4">
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {folders.map(folder => (
            <button
              key={folder.id}
              className={`btn ${isFolderActive(folder.id) ? `btn-${folder.color}` : `btn-outline-${folder.color}`} px-3 py-2`}
              onClick={() => handleFolderClick(folder.id)}
              title={folder.name}
            >
              <i className={`bi bi-${folder.icon} me-2`}></i>
              {folder.name}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  // Grid view for root folder
  return (
    <div className="row g-4">
      {folders.map(folder => (
        <div key={folder.id} className="col-md-6 col-lg-3">
          <div 
            className={`card h-100 shadow-sm border-0 folder-card ${folder.color}-card`}
            onClick={() => handleFolderClick(folder.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-body d-flex flex-column justify-content-center align-items-center p-4">
              <div className={`bg-${folder.color} bg-opacity-15 p-4 rounded-circle mb-3`}>
                <i className={`bi bi-${folder.icon} fs-1 text-${folder.color}`}></i>
              </div>
              <h4 className="card-title text-center mb-1">{folder.name}</h4>
              {folder.isProtected && (
                <span className="badge bg-danger mt-2">Protected</span>
              )}
            </div>
            <div className="card-footer bg-transparent border-top-0 text-center">
              <span className="text-muted">
                <i className="bi bi-arrow-right-circle me-1"></i> 
                Browse Files
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FolderGrid;