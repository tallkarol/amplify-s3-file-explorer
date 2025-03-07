// src/features/files/components/AdminFileBrowser.tsx
import { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AlertMessage from '@/components/common/AlertMessage';
import FileUpload from '@/features/files/components/FileUpload';
import DragDropUpload from '@/components/common/DragDropUpload';
import DragDropInfo from '@/components/common/DragDropInfo';
import { UserProfile, S3Item, BreadcrumbItem } from '@/types';
import { listUserFiles, getFileUrl } from '@/features/files/services/S3Service';
import '@/styles/dragdrop.css';
import '@/features/files/styles/filebrowser.css'; // Reuse the same CSS

interface AdminFileBrowserProps {
  selectedUser: UserProfile | null;
  initialPath?: string;
  onPathChange?: (path: string) => void;
}

// Map folder names to more readable display names
const FOLDER_DISPLAY_NAMES: Record<string, string> = {
  'certificate': 'Certificates',
  'audit-report': 'Audit Reports',
  'auditor-resume': 'Auditor Profiles',
  'statistics': 'Statistics & Analytics'
};

const AdminFileBrowser = ({ 
  selectedUser, 
  initialPath = '/', 
  onPathChange 
}: AdminFileBrowserProps) => {
  const [files, setFiles] = useState<S3Item[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Initialize path from props
  useEffect(() => {
    setCurrentPath(initialPath);
  }, [initialPath]);

  // Fetch files when user or path changes
  useEffect(() => {
    if (selectedUser && selectedUser.uuid) {
      console.log('Fetching files for user:', selectedUser.email);
      console.log('User UUID:', selectedUser.uuid);
      console.log('Current path:', currentPath);
      fetchFiles();
    } else {
      console.log('No selected user or missing UUID');
      setFiles([]);
      setBreadcrumbs([]);
    }
  }, [selectedUser, currentPath]);

  // Function to fetch files from S3
  const fetchFiles = async () => {
    if (!selectedUser || !selectedUser.uuid) {
      console.log('Cannot fetch files - missing user or UUID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching files for user ${selectedUser.uuid} at path ${currentPath}`);
      const items = await listUserFiles(selectedUser.uuid, currentPath);
      console.log('Files retrieved:', items.length);
      
      setFiles(items);
      updateBreadcrumbs(currentPath);
    } catch (err) {
      console.error('Error loading files:', err);
      setError(`Failed to load files: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to update breadcrumbs based on current path
  const updateBreadcrumbs = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];
    let currentPath = '';
    
    parts.forEach(part => {
      currentPath += `/${part}`;
      
      // Use the display name if available, otherwise use the part name
      const displayName = FOLDER_DISPLAY_NAMES[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      
      items.push({
        label: displayName,
        path: currentPath
      });
    });
    
    setBreadcrumbs(items);
  };

  // Fixed navigation function to properly handle folder paths
  const navigateToFolder = (folderKey: string) => {
    console.log('Original folder key:', folderKey);
    
    // Check if this is a parent folder navigation (..)
    if (folderKey.endsWith('/..')) {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      const parentPath = parts.length > 0 ? '/' + parts.join('/') + '/' : '/';
      console.log('Navigating to parent folder:', parentPath);
      updatePath(parentPath);
      return;
    }
    
    // For regular folder navigation
    const userPrefix = selectedUser ? `users/${selectedUser.uuid}/` : '';
    let cleanPath = folderKey;
    
    if (folderKey.startsWith(userPrefix)) {
      cleanPath = '/' + folderKey.substring(userPrefix.length);
      if (!cleanPath.endsWith('/')) {
        cleanPath += '/';
      }
    } else if (!folderKey.startsWith('/')) {
      cleanPath = '/' + folderKey;
      if (!cleanPath.endsWith('/')) {
        cleanPath += '/';
      }
    }
    
    console.log('Navigating to folder path:', cleanPath);
    updatePath(cleanPath);
  };

  // Update path locally and notify parent
  const updatePath = (newPath: string) => {
    setCurrentPath(newPath);
    if (onPathChange) {
      onPathChange(newPath);
    }
  };

  // Handle file actions (download or navigate)
  const handleFileAction = (file: S3Item) => {
    if (file.isFolder) {
      navigateToFolder(file.key);
    } else {
      downloadFile(file);
    }
  };

  // Download a file
  const downloadFile = async (file: S3Item) => {
    try {
      const url = await getFileUrl(file.key);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Failed to download file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Handler for when file upload or deletion completes
  const handleActionComplete = () => {
    fetchFiles();
  };

  // Delete a file
  const deleteFile = (file: S3Item) => {
    // Implementation would be hooked up to your delete service
    console.log(`Delete file: ${file.key}`);
    // After deletion is successful:
    handleActionComplete();
  };

  // Determine if drag and drop should be disabled
  const isDragDropDisabled = currentPath === '/' || !selectedUser;

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return '';
    
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

  // Function to get the title based on the path
  const getTitleFromPath = () => {
    if (currentPath === '/') {
      return 'Root Directory';
    }
    
    // Extract folder name from path
    const pathParts = currentPath.split('/').filter(Boolean);
    const folderName = pathParts[pathParts.length - 1];
    
    return FOLDER_DISPLAY_NAMES[folderName] || 
      folderName.charAt(0).toUpperCase() + folderName.slice(1).replace(/-/g, ' ');
  };

  // Get color based on path/folder name
  const getFolderColor = (path: string) => {
    const folderName = path.split('/').filter(Boolean)[0];
    
    switch (folderName) {
      case 'certificate': return 'primary';
      case 'audit-report': return 'success';
      case 'auditor-resume': return 'info';
      case 'statistics': return 'warning';
      default: return 'secondary';
    }
  };

  // Get file icon based on file type
  const getFileIcon = (file: S3Item) => {
    if (file.name === '..') return 'arrow-up';
    if (file.isFolder) return file.isProtected ? 'lock' : 'folder';
    
    const extension = file.name.split('.').pop()?.toLowerCase();
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
      case 'gif': return 'file-earmark-image';
      default: return 'file-earmark';
    }
  };

  // Get file color based on type
  const getFileColor = (file: S3Item) => {
    if (file.name === '..') return 'secondary';
    if (file.isFolder) return file.isProtected ? 'danger' : 'primary';
    
    const extension = file.name.split('.').pop()?.toLowerCase();
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
      case 'gif': return 'info';
      default: return 'secondary';
    }
  };

  // If no user is selected, show a message
  if (!selectedUser) {
    return (
      <Card title="File Management">
        <EmptyState
          icon="person-square"
          title="No User Selected"
          message="Please select a user to manage their files"
        />
      </Card>
    );
  }

  return (
    <Card>
      {loading ? (
        <LoadingSpinner text="Loading files..." />
      ) : error ? (
        <AlertMessage
          type="danger"
          title="Error loading files"
          message={error}
          details="Check the console for more information. This might be due to permissions issues or incorrect path configuration."
        />
      ) : (
        <DragDropUpload
          currentPath={currentPath}
          userId={selectedUser.uuid}
          onUploadComplete={handleActionComplete}
          disabled={isDragDropDisabled}
        >
          {/* Enhanced header */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-0">
                  <span className={`badge bg-${getFolderColor(currentPath)} me-2`}>
                    <i className={`bi bi-folder me-1`}></i>
                    {getTitleFromPath()}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.9em' }}>
                    {currentPath === '/' ? ' (Root)' : ` / ${selectedUser.email}`}
                  </span>
                </h5>
                
                {files.length > 0 && (
                  <div className="mt-1 small text-muted">
                    <span>
                      {files.length - (files.some(f => f.name === '..') ? 1 : 0)} 
                      {' '}item{files.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="d-flex gap-2">
                <div className="btn-group btn-group-sm">
                  <button
                    className={`btn btn-${viewMode === 'list' ? 'primary' : 'outline-primary'}`}
                    onClick={() => setViewMode('list')}
                    title="List view"
                  >
                    <i className="bi bi-list"></i>
                  </button>
                  <button
                    className={`btn btn-${viewMode === 'grid' ? 'primary' : 'outline-primary'}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                  >
                    <i className="bi bi-grid"></i>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Enhanced breadcrumb navigation */}
            <div className="mb-3">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb bg-white py-2 px-3 rounded shadow-sm mb-0">
                  <li className="breadcrumb-item">
                    <button 
                      className="btn btn-link text-decoration-none p-0"
                      onClick={() => navigateToFolder('/')}
                    >
                      <i className="bi bi-house-door me-1"></i>
                      Root
                    </button>
                  </li>
                  
                  {breadcrumbs.map((crumb, index) => (
                    <li 
                      key={index}
                      className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                    >
                      {index === breadcrumbs.length - 1 ? (
                        crumb.label
                      ) : (
                        <button 
                          className="btn btn-link text-decoration-none p-0"
                          onClick={() => navigateToFolder(crumb.path)}
                        >
                          {crumb.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            
            {/* File actions toolbar */}
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <button 
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={fetchFiles}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
                
                {currentPath !== '/' && (
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigateToFolder(currentPath + '..')}
                  >
                    <i className="bi bi-arrow-up me-1"></i>
                    Up to Parent
                  </button>
                )}
              </div>
              <div>
                {currentPath !== '/' ? (
                  <FileUpload
                    currentPath={currentPath}
                    userId={selectedUser.uuid}
                    onUploadComplete={handleActionComplete}
                    isAdmin={true}
                  />
                ) : (
                  <button 
                    className="btn btn-sm btn-secondary"
                    title="Please navigate to a specific folder to upload files"
                    disabled
                  >
                    <i className="bi bi-upload me-1"></i>
                    Upload
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Drag and drop info banner */}
          {currentPath !== '/' && (
            <DragDropInfo isDisabled={isDragDropDisabled} />
          )}
          
          {files.length === 0 ? (
            /* Empty state when no files are present */
            <EmptyState
              icon="folder"
              title="No files found"
              message={currentPath === '/' 
                ? "This is the root folder. Please navigate to a specific folder to upload files." 
                : "This folder is empty. Upload files to get started or drag & drop files here."}
              action={currentPath !== '/' && (
                <FileUpload
                  currentPath={currentPath}
                  userId={selectedUser.uuid}
                  onUploadComplete={handleActionComplete}
                  isAdmin={true}
                />
              )}
            />
          ) : viewMode === 'list' ? (
            /* NEW LIST VIEW WITH DOCUMENT CARDS */
            <div className="file-document-list">
              {files.map((file, index) => (
                <div 
                  key={index}
                  className={`file-document-item ${file.isFolder ? 'folder' : ''}`}
                  onClick={() => handleFileAction(file)}
                >
                  <div className={`file-document-icon bg-${getFileColor(file)}-subtle text-${getFileColor(file)}`}>
                    <i className={`bi bi-${getFileIcon(file)}`}></i>
                  </div>
                  
                  <div className="file-document-content">
                    <div className="file-document-title">
                      {file.name}
                      {file.isProtected && (
                        <span className="file-document-protected-badge ms-2">Protected</span>
                      )}
                    </div>
                    
                    <div className="file-document-description d-flex align-items-center">
                      {!file.isFolder && file.size !== undefined && (
                        <span className="me-3">
                          <i className="bi bi-hdd me-1 opacity-50"></i>
                          {formatFileSize(file.size)}
                        </span>
                      )}
                      
                      {file.lastModified && (
                        <span className="text-muted">
                          <i className="bi bi-clock me-1 opacity-50"></i>
                          {formatDate(file.lastModified)}
                        </span>
                      )}
                      
                      {/* User ownership label for admin context */}
                      <span className="ms-auto badge bg-light text-dark">
                        <i className="bi bi-person me-1"></i>
                        {selectedUser.email.split('@')[0]}
                      </span>
                    </div>
                  </div>
                  
                  <div className="file-document-actions">
                    {!file.isFolder && (
                      <button 
                        className="btn btn-sm btn-outline-primary file-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file);
                        }}
                        title="Download file"
                      >
                        <i className="bi bi-download"></i>
                      </button>
                    )}
                    
                    {!file.name.startsWith('..') && (
                      <button 
                        className="btn btn-sm btn-outline-danger file-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file);
                        }}
                        title={`Delete ${file.isFolder ? 'folder' : 'file'}`}
                        disabled={file.isProtected}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ENHANCED GRID VIEW LAYOUT */
<div className="row g-3">
  {files.map((file, index) => (
    <div key={index} className="col-sm-6 col-md-4 col-lg-3">
      <div 
        className={`file-document-card ${file.isFolder ? 'folder' : ''}`}
        onClick={() => handleFileAction(file)}
      >
        <div className="file-document-card-icon">
          <div className={`file-icon-wrapper bg-${getFileColor(file)}-subtle text-${getFileColor(file)}`}>
            <i className={`bi bi-${getFileIcon(file)} ${file.isFolder ? 'fs-2' : ''}`}></i>
            {file.isProtected && (
              <span className="position-absolute top-0 end-0 translate-middle-x badge-protected">
                <i className="bi bi-shield-lock"></i>
              </span>
            )}
          </div>
        </div>
        
        <div className="file-document-card-content">
          <h6 className="file-document-card-title text-truncate" title={file.name}>
            {file.name}
          </h6>
          
          <div className="file-document-card-details">
            {!file.isFolder && file.size !== undefined && (
              <span className="file-document-card-size">
                <i className="bi bi-hdd me-1 opacity-75 small"></i>
                {formatFileSize(file.size)}
              </span>
            )}
            
            {file.lastModified && (
              <span className="file-document-card-date">
                <i className="bi bi-clock me-1 opacity-75 small"></i>
                {formatDate(file.lastModified)}
              </span>
            )}
            
            {/* User ownership label */}
            <span className="file-document-card-user mt-1">
              <i className="bi bi-person me-1 opacity-75 small"></i>
              {selectedUser.email.split('@')[0]}
            </span>
          </div>
        </div>
        
        {/* Floating action buttons that appear on hover */}
        <div className="file-document-card-floating-actions">
          {!file.isFolder && (
            <button
              className="btn btn-sm btn-light shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(file);
              }}
              title="Download file"
            >
              <i className="bi bi-download"></i>
            </button>
          )}
          
          {!file.name.startsWith('..') && (
            <button
              className="btn btn-sm btn-light shadow-sm ms-2"
              onClick={(e) => {
                e.stopPropagation();
                deleteFile(file);
              }}
              title={`Delete ${file.isFolder ? 'folder' : 'file'}`}
              disabled={file.isProtected}
            >
              <i className="bi bi-trash"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  ))}
</div>
          )}
        </DragDropUpload>
      )}
    </Card>
  );
};

export default AdminFileBrowser;