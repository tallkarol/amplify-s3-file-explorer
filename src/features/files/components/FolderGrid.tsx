// src/features/files/components/FolderGrid.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { listUserFiles, isFolderVisible } from '../services/S3Service';
import { S3Item } from '@/types';
import useFolderStats from '../hooks/useFolderStats';
import FolderRow from './FolderRow';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import '@/styles/foldergrid.css';

interface FolderWithCount extends S3Item {
  fileCount?: number;
}

// Core 4 folders that should be displayed as cards
const CORE_FOLDERS = ['certificate', 'audit-report', 'auditor-resume', 'statistics'];

const CORE_FOLDER_CONFIG: Record<string, { title: string; description: string; icon: string; gradient: string }> = {
  'certificate': {
    title: 'Certificates',
    description: 'Access certification documents',
    icon: 'award',
    gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'
  },
  'audit-report': {
    title: 'Audit Reports',
    description: 'View audit documentation',
    icon: 'file-earmark-text',
    gradient: 'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)'
  },
  'auditor-resume': {
    title: 'Auditor Profiles',
    description: 'Access team qualifications',
    icon: 'person-badge',
    gradient: 'linear-gradient(135deg, #007adf 0%, #00ecbc 100%)'
  },
  'statistics': {
    title: 'Statistics',
    description: 'Review metrics & analytics',
    icon: 'graph-up',
    gradient: 'linear-gradient(135deg, #ff8008 0%, #ffc837 100%)'
  }
};

interface FolderGridProps {
  userId: string;
  onSelectFolder: (folderPath: string) => void;
  currentPath?: string;
  className?: string;
}

const FolderGrid: React.FC<FolderGridProps> = ({ userId, onSelectFolder }) => {
  const navigate = useNavigate();
  const { user } = useAuthenticator();
  const { folderStats, loading: statsLoading } = useFolderStats(user.userId);
  const [loading, setLoading] = useState(true);
  const [visibleFolders, setVisibleFolders] = useState<FolderWithCount[]>([]);

  useEffect(() => {
    const fetchFolders = async () => {
      setLoading(true);
      try {
        const items = await listUserFiles(userId, '/');
        const folderItems = items.filter(item => item.isFolder && item.name !== '..');
        
        // Check visibility for each folder
        const visibilityChecks = await Promise.all(
          folderItems.map(async (folder) => {
            const visible = await isFolderVisible(userId, folder.key);
            return { folder, visible };
          })
        );
        
        const visible = visibilityChecks
          .filter(({ visible }) => visible)
          .map(({ folder }) => folder);
        
        // Get file counts for each folder
        const foldersWithCounts = await Promise.all(
          visible.map(async (folder) => {
            try {
              const files = await listUserFiles(userId, folder.key);
              const fileCount = files.filter(item => !item.isFolder).length;
              return { ...folder, fileCount };
            } catch (error) {
              console.error(`Error getting file count for ${folder.name}:`, error);
              return { ...folder, fileCount: 0 };
            }
          })
        );
        
        setVisibleFolders(foldersWithCounts);
      } catch (error) {
        console.error('Error fetching folders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchFolders();
    }
  }, [userId]);

  const coreFolders = visibleFolders.filter(f => CORE_FOLDERS.includes(f.name));
  const otherFolders = visibleFolders.filter(f => !CORE_FOLDERS.includes(f.name));

  const handleFolderClick = (folder: S3Item) => {
    const folderName = folder.name;
    navigate(`/user/folder/${folderName}`);
    onSelectFolder(`/${folderName}/`);
  };

  if (loading) {
    return <LoadingSpinner text="Loading folders..." />;
  }

  return (
    <div>
      {/* Core 4 folders in 2x2 grid */}
      {coreFolders.length > 0 && (
        <div className="row g-3 mb-4">
          {coreFolders.map(folder => {
            const config = CORE_FOLDER_CONFIG[folder.name];
            if (!config) return null;
            
            const stat = folderStats.find(s => s.id === folder.name);
            const fileCount = statsLoading ? '...' : stat?.count || 0;
            
            return (
              <div key={folder.name} className="col-md-6">
                <div 
                  className="folder-card-flat h-100"
                  style={{ background: config.gradient }}
                  onClick={() => handleFolderClick(folder)}
                >
                  <div className="folder-content-flat">
                    <h3 className="folder-title-flat">{config.title}</h3>
                    <p className="folder-description-flat">
                      {config.description}
                      <span className="badge-flat ms-2">
                        {fileCount} {fileCount === 1 ? 'file' : 'files'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Other folders in rows */}
      {otherFolders.length > 0 && (
        <div className="border rounded bg-white">
          {otherFolders.map(folder => (
            <FolderRow
              key={folder.key}
              folder={folder}
              onClick={() => handleFolderClick(folder)}
              fileCount={folder.fileCount}
            />
          ))}
        </div>
      )}

      {visibleFolders.length === 0 && !loading && (
        <div className="text-center text-muted py-4">
          <i className="bi bi-folder-x fs-1 d-block mb-2"></i>
          No folders available
        </div>
      )}
    </div>
  );
};

export default FolderGrid;