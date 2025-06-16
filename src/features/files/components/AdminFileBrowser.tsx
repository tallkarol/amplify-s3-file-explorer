// src/features/files/components/AdminFileBrowser.tsx
import React, { useState, useEffect } from 'react';
import { Button, ButtonGroup, Dropdown, Alert } from 'react-bootstrap';
import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';
import EmptyState from '../../../components/common/EmptyState';
import DragDropUpload from '../../../components/common/DragDropUpload'; // Fixed import path
import FolderPermissionsPanel from './FolderPermissionsPanel';
import CreateSubfolderModal from './CreateSubfolderModal';
import { UserProfile } from '../../../types';
import { 
  EnhancedS3Item, 
  listUserFilesWithPermissions, 
  deleteFolderWithPermissions, 
  canDownloadFromPath,
  getFileUrl,
  FOLDER_DISPLAY_NAMES 
} from '../services/S3Service';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface AdminFileBrowserProps {
  selectedUser: UserProfile;
  initialPath?: string;
  onPathChange?: (path: string) => void;
}

const AdminFileBrowser: React.FC<AdminFileBrowserProps> = ({
  selectedUser,
  initialPath = '/',
  onPathChange
}) => {
  const [files, setFiles] = useState<EnhancedS3Item[]>([]);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionsPanel, setShowPermissionsPanel] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
    updateBreadcrumbs(currentPath);
  }, [selectedUser, currentPath]);

  useEffect(() => {
    setCurrentPath(initialPath);
  }, [initialPath]);

  const fetchFiles = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);

    try {
      const items = await listUserFilesWithPermissions(selectedUser.uuid, currentPath);
      setFiles(items);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(`Failed to load files: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

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

  const updatePath = (newPath: string) => {
    setCurrentPath(newPath);
    if (onPathChange) {
      onPathChange(newPath);
    }
  };

  const downloadFile = async (file: EnhancedS3Item) => {
    // Check download permissions
    const canDownload = await canDownloadFromPath(selectedUser.uuid, file.key);
    if (!canDownload) {
      setError('Download is restricted for this file');
      return;
    }

    setActionLoading(file.key);
    try {
      const url = await getFileUrl(file.key);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Failed to download file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteFolder = async (file: EnhancedS3Item) => {
    if (!confirm(`Are you sure you want to delete the folder "${file.name}" and all its contents?`)) {
      return;
    }

    setActionLoading(file.key);
    try {
      await deleteFolderWithPermissions(selectedUser.uuid, file.key.replace(`users/${selectedUser.uuid}`, ''));
      await fetchFiles();
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError(`Failed to delete folder: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActionComplete = () => {
    fetchFiles();
  };

  const isDragDropDisabled = currentPath === '/' || !selectedUser;

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

  const getFileIcon = (file: EnhancedS3Item) => {
    if (file.name === '..') return 'arrow-up';
    if (file.isFolder) {
      if (file.isProtected) return 'lock';
      if (file.permissions?.uploadRestricted && file.permissions?.downloadRestricted) return 'folder-x';
      if (file.permissions?.downloadRestricted) return 'folder-minus';
      if (file.permissions?.uploadRestricted) return 'folder-check';
      return 'folder';
    }
    
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

  const getFileColor = (file: EnhancedS3Item) => {
    if (file.name === '..') return 'secondary';
    if (file.isFolder) {
      if (file.isProtected) return 'danger';
      if (file.permissions?.uploadRestricted && file.permissions?.downloadRestricted) return 'dark';
      if (file.permissions?.downloadRestricted) return 'warning';
      if (file.permissions?.uploadRestricted) return 'info';
      return 'primary';
    }
    
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

  const renderFileActions = (file: EnhancedS3Item) => {
    if (file.name === '..') return null;

    if (file.isFolder) {
      return (
        <Dropdown as={ButtonGroup} size="sm">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => navigateToFolder(file.key)}
            disabled={actionLoading === file.key}
          >
            <i className="bi bi-folder-open"></i>
          </Button>

          <Dropdown.Toggle 
            split 
            variant="outline-primary" 
            size="sm"
            disabled={actionLoading === file.key}
          />

          <Dropdown.Menu>
            <Dropdown.Item onClick={() => {
              setShowPermissionsPanel(true);
            }}>
              <i className="bi bi-shield-lock me-2"></i>
              Manage Permissions
            </Dropdown.Item>
            
            {file.permissions?.canCreateSubfolders && (
              <Dropdown.Item onClick={() => {
                setCurrentPath(file.key.replace(`users/${selectedUser.uuid}`, ''));
                setShowCreateFolderModal(true);
              }}>
                <i className="bi bi-folder-plus me-2"></i>
                Create Subfolder
              </Dropdown.Item>
            )}
            
            {file.permissions?.canDeleteFolder && !file.isProtected && (
              <>
                <Dropdown.Divider />
                <Dropdown.Item 
                  onClick={() => deleteFolder(file)}
                  className="text-danger"
                >
                  <i className="bi bi-trash me-2"></i>
                  Delete Folder
                </Dropdown.Item>
              </>
            )}
          </Dropdown.Menu>
        </Dropdown>
      );
    } else {
      return (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => downloadFile(file)}
          disabled={actionLoading === file.key || file.permissions?.downloadRestricted}
          title={file.permissions?.downloadRestricted ? 'Download restricted' : 'Download file'}
        >
          {actionLoading === file.key ? (
            <span className="spinner-border spinner-border-sm"></span>
          ) : (
            <i className="bi bi-download"></i>
          )}
        </Button>
      );
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
    <>
      <Card>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-1">
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
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowPermissionsPanel(!showPermissionsPanel)}
            >
              <i className="bi bi-shield-lock me-1"></i>
              Permissions
            </Button>
            
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => setShowCreateFolderModal(true)}
            >
              <i className="bi bi-folder-plus me-1"></i>
              New Folder
            </Button>
          </div>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <span 
                  className="text-primary" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => updatePath('/')}
                >
                  <i className="bi bi-house me-1"></i>
                  Root
                </span>
              </li>
              {breadcrumbs.map((item, index) => (
                <li 
                  key={index} 
                  className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                >
                  {index === breadcrumbs.length - 1 ? (
                    item.label
                  ) : (
                    <span 
                      className="text-primary" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => updatePath(item.path + '/')}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Permissions Panel */}
        {showPermissionsPanel && (
          <div className="mb-3">
            <FolderPermissionsPanel
              userId={selectedUser.uuid}
              currentPath={currentPath}
              onPermissionsChange={() => fetchFiles()}
              onClose={() => setShowPermissionsPanel(false)}
            />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* File List */}
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
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Modified</th>
                    <th>Permissions</th>
                    <th style={{ width: '120px' }}>Actions</th> {/* Fixed: use style instead of width prop */}
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className={`bi bi-${getFileIcon(file)} me-2 text-${getFileColor(file)}`}></i>
                          <span 
                            className={file.isFolder ? 'fw-bold' : ''}
                            style={{ cursor: file.isFolder ? 'pointer' : 'default' }}
                            onClick={() => file.isFolder && navigateToFolder(file.key)}
                          >
                            {file.name}
                          </span>
                          {file.isProtected && (
                            <i className="bi bi-shield-fill-check ms-2 text-danger" title="Protected folder"></i>
                          )}
                        </div>
                      </td>
                      <td>
                        {file.isFolder ? (
                          <span className="badge bg-primary">Folder</span>
                        ) : (
                          <span className="badge bg-secondary">File</span>
                        )}
                      </td>
                      <td>
                        {file.isFolder ? '-' : formatFileSize(file.size)}
                      </td>
                      <td>
                        {formatDate(file.lastModified)}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          {file.permissions?.downloadRestricted && (
                            <span className="badge bg-warning" title="Download restricted">
                              <i className="bi bi-download"></i>
                            </span>
                          )}
                          {file.permissions?.uploadRestricted && (
                            <span className="badge bg-info" title="Upload restricted">
                              <i className="bi bi-upload"></i>
                            </span>
                          )}
                          {!file.permissions?.canCreateSubfolders && file.isFolder && (
                            <span className="badge bg-secondary" title="Cannot create subfolders">
                              <i className="bi bi-folder-x"></i>
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {renderFileActions(file)}
                      </td>
                    </tr>
                  ))}
                  
                  {files.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        <i className="bi bi-folder-x mb-2 d-block" style={{ fontSize: '2rem' }}></i>
                        This folder is empty
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DragDropUpload>
        )}
      </Card>

      {/* Create Subfolder Modal */}
      <CreateSubfolderModal
        show={showCreateFolderModal}
        onHide={() => setShowCreateFolderModal(false)}
        userId={selectedUser.uuid}
        currentPath={currentPath}
        onFolderCreated={() => {
          setShowCreateFolderModal(false);
          fetchFiles();
        }}
      />
    </>
  );
};

export default AdminFileBrowser;