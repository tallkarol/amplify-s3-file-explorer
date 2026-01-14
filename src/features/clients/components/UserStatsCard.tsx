// src/components/admin/UserStatsCard.tsx
import { useState, useEffect } from 'react';
import { UserProfile } from '../../../types';
import { listUserFiles } from '../../files/services/S3Service';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

interface UserStatsCardProps {
  user: UserProfile;
}

interface FolderStats {
  name: string;
  fileCount: number;
  totalSize: number;
  icon: string;
  color: string;
}

const UserStatsCard = ({ user }: UserStatsCardProps) => {
  const [loading, setLoading] = useState(true);
  const [folderStats, setFolderStats] = useState<FolderStats[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalSize, setTotalSize] = useState(0);

  // Folder configuration with display names
  const folderConfig = [
    { path: '/certificate/', name: 'Certificates', icon: 'award', color: 'primary' },
    { path: '/audit-report/', name: 'Audit Reports', icon: 'file-earmark-text', color: 'success' },
    { path: '/auditor-resume/', name: 'Auditor Profiles', icon: 'person-badge', color: 'info' },
    { path: '/statistics/', name: 'Statistics', icon: 'graph-up', color: 'warning' }
  ];

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    setLoading(true);
    
    try {
      // Batch fetch files for all folders in parallel
      const folderFilesPromises = folderConfig.map(folder => 
        listUserFiles(user.uuid, folder.path).catch(err => {
          console.error(`Error fetching files for ${folder.name}:`, err);
          return [];
        })
      );
      
      const allFolderFiles = await Promise.all(folderFilesPromises);
      
      // Process results
      const stats: FolderStats[] = [];
      let filesTotal = 0;
      let sizeTotal = 0;
      
      folderConfig.forEach((folder, index) => {
        const files = allFolderFiles[index];
        
        // Count only files, not folders
        const fileCount = files.filter(item => !item.isFolder).length;
        filesTotal += fileCount;
        
        // Calculate total size
        const size = files
          .filter(item => !item.isFolder)
          .reduce((sum, item) => sum + (item.size || 0), 0);
        sizeTotal += size;
        
        stats.push({
          name: folder.name,
          fileCount,
          totalSize: size,
          icon: folder.icon,
          color: folder.color
        });
      });
      
      setFolderStats(stats);
      setTotalFiles(filesTotal);
      setTotalSize(sizeTotal);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format size in human-readable format
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">User Storage Statistics</h5>
        <button 
          className="btn btn-sm btn-outline-secondary" 
          onClick={fetchUserStats}
          disabled={loading}
          title="Refresh statistics"
        >
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>
      
      <div className="card-body">
        {loading ? (
          <LoadingSpinner text="Loading statistics..." />
        ) : (
          <>
            {/* Overall stats */}
            <div className="row mb-4">
              <div className="col-6">
                <div className="card bg-light">
                  <div className="card-body text-center py-3">
                    <h6 className="text-muted mb-2">Total Files</h6>
                    <h3 className="mb-0">{totalFiles}</h3>
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="card bg-light">
                  <div className="card-body text-center py-3">
                    <h6 className="text-muted mb-2">Total Size</h6>
                    <h3 className="mb-0">{formatSize(totalSize)}</h3>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Per-folder stats */}
            <h6 className="mb-3">Folder Breakdown</h6>
            {folderStats.map((folder, index) => (
              <div key={index} className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center">
                    <div className={`bg-${folder.color} bg-opacity-10 p-1 rounded me-2`}>
                      <i className={`bi bi-${folder.icon} text-${folder.color}`}></i>
                    </div>
                    <span>{folder.name}</span>
                  </div>
                  <div className="text-muted small">
                    {folder.fileCount} file{folder.fileCount !== 1 ? 's' : ''} · {formatSize(folder.totalSize)}
                  </div>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className={`progress-bar bg-${folder.color}`} 
                    role="progressbar" 
                    style={{ 
                      width: `${totalSize ? (folder.totalSize / totalSize) * 100 : 0}%` 
                    }}
                    aria-valuenow={(totalSize ? (folder.totalSize / totalSize) * 100 : 0)}
                    aria-valuemin={0} 
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default UserStatsCard;