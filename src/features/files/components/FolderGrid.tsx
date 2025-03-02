// src/components/files/FolderGrid.tsx
import React, { useState, useEffect } from 'react';
import { listUserFiles } from '../services/S3Service';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';
import '../../../styles/foldergrid.css'

interface FolderInfo {
  id: string;       // Folder path
  name: string;     // Display name
  icon: string;     // Icon
  color: string;    // Color
  isProtected: boolean; // Whether folder is protected
}

interface FolderGridProps {
  userId: string;
  onSelectFolder: (folderPath: string) => void;
  compact?: boolean; // Whether to show compact view for non-root navigation
  currentPath?: string; // Current path for highlighting active folder
  className?: string;
}

const FolderGrid: React.FC<FolderGridProps> = ({ 
  userId, 
  onSelectFolder, 
  compact = false,
  currentPath = '/',
  className = ''
}) => {
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
    if (userId) {
      fetchFolders();
    }
  }, [userId]);
  
  const fetchFolders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get root folders
      const items = await listUserFiles(userId, '/');
      
      // Process folders
      const folderList: FolderInfo[] = items
        .filter(item => item.isFolder && item.name !== '..')
        .map(folder => {
          const folderName = folder.name;
          const config = folderConfig[folderName] || {
            name: folderName.charAt(0).toUpperCase() + folderName.slice(1).replace(/-/g, ' '),
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

  // Handle folder selection
  const handleFolderClick = (folderPath: string) => {
    onSelectFolder(folderPath);
  };
  
  // Navigate to root
  const handleRootClick = () => {
    onSelectFolder('/');
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
      <div className={`folder-nav ${className}`}>
        {/* Root button */}
        <button
          className="navigation-button root-button"
          onClick={handleRootClick}
          title="Back to Root"
        >
          <i className="bi bi-house-door-fill"></i>
        </button>
        
        {/* Folder buttons */}
        {folders.map(folder => (
          <button
            key={folder.id}
            className={`navigation-button ${isFolderActive(folder.id) ? `active-button bg-${folder.color}` : ''}`}
            onClick={() => handleFolderClick(folder.id)}
            title={folder.name}
          >
            <i className={`bi bi-${folder.icon} me-2`}></i>
            {folder.name}
          </button>
        ))}
      </div>
    );
  }
  
  // Grid view for root folder
  return (
    <div className={`row g-4 ${className}`}>
      {folders.map(folder => (
        <div key={folder.id} className="col-sm-6 col-lg-3">
          <div 
            className={`card h-100 folder-card ${folder.color}-card`}
            onClick={() => handleFolderClick(folder.id)}
            style={{ cursor: 'pointer' }}
          >
            {folder.isProtected && (
              <span className="protection-badge badge bg-danger">Protected</span>
            )}
            
            <div className="card-body d-flex flex-column justify-content-center align-items-center">
              <div className={`folder-icon-container bg-${folder.color} bg-opacity-15`}>
                <i className={`bi bi-${folder.icon} fs-1 text-${folder.color}`}></i>
              </div>
              <h4 className="card-title text-center mb-1">{folder.name}</h4>
            </div>
            <div className="card-footer text-center">
              <span className="text-muted d-flex align-items-center justify-content-center">
                <i className="bi bi-arrow-right-circle me-2"></i> 
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