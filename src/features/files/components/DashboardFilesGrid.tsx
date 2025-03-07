// src/features/files/components/DashboardFilesGrid.tsx
import React, { useState, useEffect } from 'react';
import { S3Item } from '@/types';
import { listUserFiles, getFileUrl } from '@/features/files/services/S3Service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import AlertMessage from '@/components/common/AlertMessage';

interface DashboardFilesGridProps {
  userId: string;
  limit?: number;
  title?: string;
}

const DashboardFilesGrid: React.FC<DashboardFilesGridProps> = ({ 
  userId, 
  limit = 8,
  title = "Recent Files"
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<S3Item[]>([]);

  useEffect(() => {
    if (userId) {
      fetchRecentFiles();
    }
  }, [userId, limit]);

  const fetchRecentFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First get the root folders
      const rootItems = await listUserFiles(userId, '/');
      const folders = rootItems.filter(item => item.isFolder && item.name !== '..');
      
      // Create an array to store all files
      let allFiles: S3Item[] = [];
      
      // For each folder, fetch its contents recursively
      for (const folder of folders) {
        const folderPath = folder.key.endsWith('/') ? folder.key : `${folder.key}/`;
        const folderFiles = await fetchFolderContentsRecursively(folderPath);
        allFiles = [...allFiles, ...folderFiles];
      }
      
      // Sort files by last modified date (newest first)
      allFiles.sort((a, b) => {
        const dateA = a.lastModified ? a.lastModified.getTime() : 0;
        const dateB = b.lastModified ? b.lastModified.getTime() : 0;
        return dateB - dateA;
      });
      
      // Limit the number of files
      setFiles(allFiles.slice(0, limit));
    } catch (err) {
      console.error('Error fetching recent files:', err);
      setError(`Failed to load files: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderContentsRecursively = async (folderPath: string): Promise<S3Item[]> => {
    try {
      const items = await listUserFiles(userId, folderPath);
      const filteredItems = items.filter(item => item.name !== '..');
      let allFiles: S3Item[] = filteredItems.filter(item => !item.isFolder);
      
      return allFiles;
    } catch (err) {
      console.error(`Error fetching contents of folder ${folderPath}:`, err);
      return [];
    }
  };

  const handleDownload = async (file: S3Item) => {
    try {
      const url = await getFileUrl(file.key);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Failed to download file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Format date with better readability
  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    
    // If today, show time only
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If this year, show month and day
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString();
  };

  // Get file extension
  const getFileExtension = (filename: string) => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  };

  // Get icon based on file type
  const getFileIcon = (filename: string) => {
    const extension = getFileExtension(filename);
    
    switch (extension) {
      case 'pdf': return 'file-earmark-pdf';
      case 'doc':
      case 'docx': return 'file-earmark-word';
      case 'xls':
      case 'xlsx': return 'file-earmark-excel';
      case 'ppt':
      case 'pptx': return 'file-earmark-slides';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg': return 'file-earmark-image';
      default: return 'file-earmark';
    }
  };

  // Get color based on file type
  const getFileColor = (filename: string) => {
    const extension = getFileExtension(filename);
    
    switch (extension) {
      case 'pdf': return 'danger';
      case 'doc':
      case 'docx': return 'primary';
      case 'xls':
      case 'xlsx': return 'success';
      case 'ppt':
      case 'pptx': return 'warning';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg': return 'info';
      default: return 'secondary';
    }
  };

  // Extract folder path from file key to display in the card
  const getFolderFromKey = (key: string): string => {
    // Remove user ID prefix first
    const userPrefix = `users/${userId}/`;
    const relativePath = key.startsWith(userPrefix) ? key.substring(userPrefix.length) : key;
    
    // Get the first folder in the path
    const parts = relativePath.split('/').filter(Boolean);
    return parts.length > 0 ? parts[0] : 'Root';
  };

  // Map folder names to nicer display names
  const getFolderDisplayName = (folderName: string): string => {
    const folderDisplayNames: Record<string, string> = {
      'certificate': 'Certificates',
      'audit-report': 'Audit Reports',
      'auditor-resume': 'Auditor Profiles',
      'statistics': 'Statistics'
    };
    
    return folderDisplayNames[folderName] || folderName.charAt(0).toUpperCase() + folderName.slice(1).replace(/-/g, ' ');
  };

  // Get folder color based on folder name to match the folder cards
  const getFolderColor = (folderName: string): string => {
    switch (folderName) {
      case 'certificate': return 'primary';
      case 'audit-report': return 'success';
      case 'auditor-resume': return 'info';
      case 'statistics': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading recent files..." />;
  }

  if (error) {
    return <AlertMessage type="danger" message={error} />;
  }

  if (files.length === 0) {
    return (
      <EmptyState
        icon="folder"
        title="No files found"
        message="You don't have any files uploaded yet. Upload files to get started."
      />
    );
  }

  return (
    <div>
      <h5 className="mb-3"><i className="bi bi-clock-history me-2"></i>{title}</h5>
      <div className="row g-3">
        {files.map((file) => {
          const folderName = getFolderFromKey(file.key);
          const folderDisplayName = getFolderDisplayName(folderName);
          const folderColor = getFolderColor(folderName);
          
          return (
            <div key={file.key} className="col-md-6 col-xl-3">
              <div className="card h-100 shadow-sm hover-lift" 
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onClick={() => handleDownload(file)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.08)';
                }}
              >
                <div className="card-header bg-white d-flex align-items-center py-2 px-3" 
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className={`bg-${folderColor} bg-opacity-10 rounded-circle p-1 me-2`}
                    style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bi bi-folder-fill text-${folderColor} small`}></i>
                  </div>
                  <small className="text-muted">{folderDisplayName}</small>
                </div>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex mb-2">
                    <div className={`bg-${getFileColor(file.name)}-subtle rounded p-2 me-3`}
                      style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`bi bi-${getFileIcon(file.name)} fs-3 text-${getFileColor(file.name)}`}></i>
                    </div>
                    <div>
                      <h6 className="mb-0 text-truncate" style={{ maxWidth: '200px' }} title={file.name}>
                        {file.name}
                      </h6>
                      <small className="text-muted">{formatFileSize(file.size)}</small>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-light py-2 d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    <i className="bi bi-clock me-1"></i>
                    {formatDate(file.lastModified)}
                  </small>
                  <button className="btn btn-sm btn-light">
                    <i className="bi bi-download"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center mt-3">
        <button 
          className="btn btn-outline-primary btn-sm" 
          onClick={() => window.location.href = '/user'}
        >
          View All Files
        </button>
      </div>
    </div>
  );
};

export default DashboardFilesGrid;