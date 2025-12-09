// src/features/files/components/AdminFolderGrid.tsx
import { useState, useEffect } from 'react';
import { list } from 'aws-amplify/storage';
import '@/styles/foldergrid.css';

interface FolderData {
  id: string;
  name: string;
  path: string;
  fileCount: number;
  icon: string;
  gradient: string;
  isCore: boolean;
}

interface AdminFolderGridProps {
  userId: string;
  onSelectFolder: (folderPath: string) => void;
}

const AdminFolderGrid = ({ userId, onSelectFolder }: AdminFolderGridProps) => {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);

  // Core folder definitions
  const coreFolderDefs = [
    {
      id: 'certificate',
      name: 'Certificates',
      icon: 'award',
      gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'
    },
    {
      id: 'audit-report',
      name: 'Audit Reports',
      icon: 'file-earmark-text',
      gradient: 'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)'
    },
    {
      id: 'auditor-resume',
      name: 'Auditor Profiles',
      icon: 'person-badge',
      gradient: 'linear-gradient(135deg, #007adf 0%, #00ecbc 100%)'
    },
    {
      id: 'statistics',
      name: 'Statistics',
      icon: 'graph-up',
      gradient: 'linear-gradient(135deg, #ff8008 0%, #ffc837 100%)'
    }
  ];

  useEffect(() => {
    if (userId) {
      fetchFolders();
    }
  }, [userId]);

  const fetchFolders = async () => {
    try {
      setLoading(true);

      // List all files in user's directory
      const path = `users/${userId}/`;
      const result = await list({
        path,
        options: {
          listAll: true,
        }
      });

      // Count files per folder
      const folderCounts = new Map<string, number>();
      
      result.items.forEach((item) => {
        if (item.path) {
          // Extract folder name from path
          const relativePath = item.path.replace(path, '');
          const pathParts = relativePath.split('/');
          
          if (pathParts.length > 1 && pathParts[0]) {
            const folderName = pathParts[0];
            folderCounts.set(folderName, (folderCounts.get(folderName) || 0) + 1);
          }
        }
      });

      // Build folder list (core first, then additional)
      const folderList: FolderData[] = [];

      // Add core folders (always show, even if empty)
      coreFolderDefs.forEach(def => {
        folderList.push({
          id: def.id,
          name: def.name,
          path: `/${def.id}/`,
          fileCount: folderCounts.get(def.id) || 0,
          icon: def.icon,
          gradient: def.gradient,
          isCore: true
        });
      });

      // Add additional folders
      const additionalFolders: FolderData[] = [];
      const coreIds = coreFolderDefs.map(d => d.id);
      
      folderCounts.forEach((count, folderName) => {
        if (!coreIds.includes(folderName)) {
          additionalFolders.push({
            id: folderName,
            name: formatFolderName(folderName),
            path: `/${folderName}/`,
            fileCount: count,
            icon: getFolderIcon(folderName),
            gradient: getAdditionalGradient(folderName),
            isCore: false
          });
        }
      });

      // Sort additional folders by name
      additionalFolders.sort((a, b) => a.name.localeCompare(b.name));
      
      // Combine: core folders first, then additional
      folderList.push(...additionalFolders);

      setFolders(folderList);
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFolderName = (folderName: string): string => {
    return folderName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getFolderIcon = (folderName: string): string => {
    const iconMap: Record<string, string> = {
      'documents': 'file-earmark',
      'reports': 'file-earmark-text',
      'images': 'image',
      'contracts': 'file-earmark-ruled',
      'invoices': 'receipt',
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (folderName.toLowerCase().includes(key)) {
        return icon;
      }
    }

    return 'folder';
  };

  const getAdditionalGradient = (folderName: string): string => {
    // Generate consistent gradient based on folder name
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];

    const hash = folderName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading folders...</span>
        </div>
        <p className="text-muted mt-2">Scanning folders...</p>
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        No folders found for this user.
      </div>
    );
  }

  return (
    <div>
      {/* Core Folders Section */}
      <div className="folder-grid">
        {folders.filter(f => f.isCore).map(folder => (
          <div 
            key={folder.id} 
            className="folder-card"
            style={{ background: folder.gradient }}
            onClick={() => onSelectFolder(folder.path)}
          >
            <div className="folder-indicator">
              <i className={`bi bi-${folder.icon}`}></i>
            </div>
            <i className={`bi bi-${folder.icon} folder-icon`}></i>
            <div className="folder-content">
              <h3 className="folder-title">{folder.name}</h3>
              <p className="folder-description">
                <span className="badge bg-light text-dark" style={{ opacity: 0.8 }}>
                  {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Folders Section */}
      {folders.some(f => !f.isCore) && (
        <div className="mt-4">
          <div className="d-flex align-items-center mb-3">
            <h5 className="mb-0 text-muted">
              <i className="bi bi-folder-plus me-2"></i>
              Additional Folders
            </h5>
            <span className="badge bg-secondary ms-2">
              {folders.filter(f => !f.isCore).length}
            </span>
          </div>
          
          <div className="row g-3">
            {folders.filter(f => !f.isCore).map(folder => (
              <div key={folder.id} className="col-md-6 col-lg-4">
                <div 
                  className="card h-100 shadow-sm hover-lift"
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onClick={() => onSelectFolder(folder.path)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="card-body d-flex align-items-center">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ 
                        width: '50px', 
                        height: '50px', 
                        minWidth: '50px',
                        background: folder.gradient
                      }}
                    >
                      <i className={`bi bi-${folder.icon} fs-4 text-white`}></i>
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <h6 className="mb-1 text-truncate">{folder.name}</h6>
                      <p className="mb-0 small text-muted">
                        <i className="bi bi-file-earmark me-1"></i>
                        {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'}
                      </p>
                    </div>
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFolderGrid;

