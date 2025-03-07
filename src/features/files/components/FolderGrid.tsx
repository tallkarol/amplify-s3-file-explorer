// src/features/files/components/FolderGrid.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import useFolderStats from '../hooks/useFolderStats';
import '@/styles/foldergrid.css';

interface FolderCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  count?: number;
}

// Define FolderGrid props interface
interface FolderGridProps {
  userId: string;
  onSelectFolder: (folderPath: string) => void;
  currentPath?: string;
  className?: string;
}

const FolderGrid: React.FC<FolderGridProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuthenticator();
  const { folderStats, loading } = useFolderStats(user.userId);
  
  // Define the folder data with vibrant gradients
  const folders: FolderCardProps[] = [
    {
      id: 'certificate',
      title: 'Certificates',
      description: 'Access certification documents',
      icon: 'award',
      gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'
    },
    {
      id: 'audit-report',
      title: 'Audit Reports',
      description: 'View audit documentation',
      icon: 'file-earmark-text',
      gradient: 'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)'
    },
    {
      id: 'auditor-resume',
      title: 'Auditor Profiles',
      description: 'Access team qualifications',
      icon: 'person-badge',
      gradient: 'linear-gradient(135deg, #007adf 0%, #00ecbc 100%)'
    },
    {
      id: 'statistics',
      title: 'Statistics',
      description: 'Review metrics & analytics',
      icon: 'graph-up',
      gradient: 'linear-gradient(135deg, #ff8008 0%, #ffc837 100%)'
    }
  ];

  return (
    <div className="folder-grid">
      

      {folders.map(folder => {
        // Find the folder stats for this folder
        const stat = folderStats.find(s => s.id === folder.id);
        const fileCount = loading ? '...' : stat?.count || 0;
        
        return (
          <div 
            key={folder.id} 
            className="folder-card"
            style={{ background: folder.gradient }}
            onClick={() => navigate(`/user/folder/${folder.id}`)}
          >
            <div className="folder-indicator">
              <i className={`bi bi-${folder.icon}`}></i>
            </div>
            <i className={`bi bi-${folder.icon} folder-icon`}></i>
            <div className="folder-content">
              <h3 className="folder-title">{folder.title}</h3>
              <p className="folder-description">
                {folder.description}
                <span className="badge bg-light text-dark ms-2" style={{ opacity: 0.8 }}>
                  {fileCount} {fileCount === 1 ? 'file' : 'files'}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FolderGrid;