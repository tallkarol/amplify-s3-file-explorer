// src/pages/admin/AdminFileBrowser.tsx
import { useState, useEffect } from 'react';
import Card from '@components/common/Card';
import EmptyState from '@components/common/EmptyState';
import LoadingSpinner from '@components/common/LoadingSpinner';
import AlertMessage from '@components/common/AlertMessage';
import FileItem from '../components/FileItem';
import FileUpload from '../components/FileUpload';
import DragDropUpload from '@components/common/DragDropUpload';
import DragDropInfo from '@components/common/DragDropInfo';
import { UserProfile, S3Item, BreadcrumbItem } from '../../../types';
import { listUserFiles, getFileUrl } from '../services/S3Service';
import '../../styles/dragdrop.css';

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
    // Skip the first slash to avoid an empty first element
    const parts = path.split('/').filter(Boolean);
    
    // Build up the breadcrumb items
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
      // Remove the last part and join back
      parts.pop();
      const parentPath = parts.length > 0 ? '/' + parts.join('/') + '/' : '/';
      console.log('Navigating to parent folder:', parentPath);
      updatePath(parentPath);
      return;
    }
    
    // For regular folder navigation:
    // First, strip the "users/{userId}/" prefix if present
    const userPrefix = selectedUser ? `users/${selectedUser.uuid}/` : '';
    let cleanPath = folderKey;
    
    if (folderKey.startsWith(userPrefix)) {
      cleanPath = '/' + folderKey.substring(userPrefix.length);
      // Ensure path ends with a slash
      if (!cleanPath.endsWith('/')) {
        cleanPath += '/';
      }
    } else if (!folderKey.startsWith('/')) {
      // If it doesn't have a leading slash, add one
      cleanPath = '/' + folderKey;
      // Ensure path ends with a slash
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

  const handleFileAction = (file: S3Item) => {
    if (file.isFolder) {
      navigateToFolder(file.key);
    } else {
      downloadFile(file);
    }
  };

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

  // Determine if drag and drop should be disabled
  const isDragDropDisabled = currentPath === '/' || !selectedUser;

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
          <div className="p-3 mb-4 bg-light rounded shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                <span className={`badge bg-${getFolderColor(currentPath)} me-2`} style={{ fontSize: '0.7em' }}>
                  <i className={`bi bi-folder me-1`}></i>
                  {getTitleFromPath()}
                </span>
                <span className="text-muted" style={{ fontSize: '0.9em' }}>
                  {currentPath === '/' ? ' (Root)' : ` / ${selectedUser.email}`}
                </span>
              </h5>
              
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
          
          {/* File count information */}
          {files.length > 0 && (
            <div className="mb-3 small text-muted">
              <span>
                {files.length - (files.some(f => f.name === '..') ? 1 : 0)} 
                {' '}item{files.length !== 1 ? 's' : ''}
              </span>
            </div>
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
          ) : (
            /* Display files when available */
            viewMode === 'list' ? (
              <div className="list-group shadow-sm rounded">
                {files.map((file, index) => (
                  <FileItem 
                    key={index}
                    file={file}
                    isAdmin={true} // Admin has delete privileges
                    onNavigate={handleFileAction}
                    onActionComplete={handleActionComplete}
                  />
                ))}
              </div>
            ) : (
              /* Grid view layout */
              <div className="row g-3">
                {files.map((file, index) => {
                  // Get file extension for icon determination
                  const extension = file.isFolder ? 'folder' : 
                    file.name.split('.').pop()?.toLowerCase() || 'unknown';
                  
                  // Determine icon based on file type
                  let icon = 'file-earmark';
                  let iconColor = 'secondary';
                  
                  if (file.isFolder) {
                    icon = file.name === '..' ? 'arrow-up' : 'folder';
                    iconColor = file.isProtected ? 'danger' : 'primary';
                  } else {
                    switch (extension) {
                      case 'pdf': 
                        icon = 'file-earmark-pdf'; 
                        iconColor = 'danger';
                        break;
                      case 'doc':
                      case 'docx': 
                        icon = 'file-earmark-word'; 
                        iconColor = 'primary';
                        break;
                      case 'xls':
                      case 'xlsx': 
                        icon = 'file-earmark-excel'; 
                        iconColor = 'success';
                        break;
                      case 'ppt':
                      case 'pptx': 
                        icon = 'file-earmark-slides';
                        iconColor = 'warning';
                        break;
                      case 'jpg':
                      case 'jpeg':
                      case 'png':
                      case 'gif': 
                        icon = 'file-earmark-image';
                        iconColor = 'info';
                        break;
                    }
                  }
                  
                  // Format file size
                  const formatFileSize = (bytes?: number) => {
                    if (!bytes) return '';
                    
                    const units = ['B', 'KB', 'MB', 'GB'];
                    let size = bytes;
                    let unitIndex = 0;
                    
                    while (size >= 1024 && unitIndex < units.length - 1) {
                      size /= 1024;
                      unitIndex++;
                    }
                    
                    return `${size.toFixed(1)} ${units[unitIndex]}`;
                  };
                  
                  return (
                    <div key={index} className="col-sm-6 col-md-4 col-lg-3">
                      <div 
                        className="card h-100 shadow-sm"
                        onClick={() => handleFileAction(file)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="card-body text-center p-3">
                          <div className="mb-3">
                            <i className={`bi bi-${icon} text-${iconColor}`} style={{ fontSize: '2.5rem' }}></i>
                            {file.isProtected && (
                              <span className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger">
                                <i className="bi bi-shield-lock"></i>
                              </span>
                            )}
                          </div>
                          <h6 className="card-title mb-1 text-truncate" title={file.name}>
                            {file.name}
                          </h6>
                          {!file.isFolder && file.size && (
                            <p className="card-text small text-muted mb-0">
                              {formatFileSize(file.size)}
                            </p>
                          )}
                          {file.lastModified && (
                            <p className="card-text small text-muted mb-0">
                              {file.lastModified.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {!file.isFolder && (
                          <div className="card-footer p-2 d-flex justify-content-between bg-light">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(file);
                              }}
                              title="Download file"
                            >
                              <i className="bi bi-download"></i>
                            </button>
                            
                            {!file.isProtected && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // This would be connected to your delete function
                                  // Your FileItem component already handles this functionality
                                }}
                                title="Delete file"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </DragDropUpload>
      )}
    </Card>
  );
};

export default AdminFileBrowser;