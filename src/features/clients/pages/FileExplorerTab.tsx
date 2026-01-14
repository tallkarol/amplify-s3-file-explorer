// src/features/clients/pages/FileExplorerTab.tsx
import React, { useState, useEffect } from 'react';
import { Button, Dropdown, Alert, Form, Badge } from 'react-bootstrap';
// import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import DragDropUpload from '../../../components/common/DragDropUpload';
import FolderPermissionsPanel from '../../files/components/FolderPermissionsPanel';
import { UserProfile } from '../../../types';
import { 
  EnhancedS3Item, 
  listUserFilesWithPermissions, 
  deleteFolderWithPermissions, 
  canDownloadFromPath,
  getFileUrl,
  createSubfolder,
  FOLDER_DISPLAY_NAMES 
} from '../../files/services/S3Service';
import './FileExplorerTab.css';

interface FileExplorerTabProps {
  client: UserProfile;
  onPathChange?: (path: string) => void;
  initialPath?: string;
}

interface BreadcrumbItem {
  label: string;
  path: string;
}

const FileExplorerTab: React.FC<FileExplorerTabProps> = ({ 
  client, 
  onPathChange,
  initialPath 
}) => {
  const [files, setFiles] = useState<EnhancedS3Item[]>([]);
  const [currentPath, setCurrentPath] = useState(initialPath || '/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [showPermissionsPanel, setShowPermissionsPanel] = useState(false);
  const [permissionsFolderPath, setPermissionsFolderPath] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Folder creation states
  const [createInlineMode, setCreateInlineMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createFolderLoading, setCreateFolderLoading] = useState(false);
  const [createFolderError, setCreateFolderError] = useState<string | null>(null);

  // Update currentPath when initialPath prop changes
  useEffect(() => {
    if (initialPath !== undefined && initialPath !== currentPath) {
      setCurrentPath(initialPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPath]);

  useEffect(() => {
    fetchFiles();
    updateBreadcrumbs(currentPath);
  }, [client, currentPath]);

  const fetchFiles = async (retryCount = 0) => {
    setLoading(true);
    setError(null);

    try {
      const items = await listUserFilesWithPermissions(client.uuid, currentPath);
      setFiles(items);
    } catch (err) {
      console.error('Error fetching files:', err);
      
      if (retryCount === 0 && err instanceof Error && err.message.includes('permission')) {
        console.warn('Permissions lookup failed, falling back to basic file listing...');
        try {
          const { listUserFiles } = await import('../../files/services/S3Service');
          const basicItems = await listUserFiles(client.uuid, currentPath);
          
          const enhancedItems: EnhancedS3Item[] = basicItems.map(item => ({
            ...item,
            permissions: {
              downloadRestricted: false,
              uploadRestricted: false,
              canCreateSubfolders: true,
              canDeleteFolder: !item.isProtected
            }
          }));
          
          setFiles(enhancedItems);
        } catch (fallbackErr) {
          setError(`Failed to load files: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`);
        }
      } else {
        setError(`Failed to load files: ${err instanceof Error ? err.message : String(err)}`);
      }
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
      const displayName = FOLDER_DISPLAY_NAMES[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      items.push({
        label: displayName,
        path: currentPath
      });
    });
    
    setBreadcrumbs(items);
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setCreateInlineMode(false);
    setNewFolderName('');
    // Notify parent component of path change
    if (onPathChange) {
      onPathChange(path);
    }
  };

  const navigateToFolder = (folderKey: string) => {
    if (folderKey.endsWith('/..')) {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      const parentPath = parts.length > 0 ? '/' + parts.join('/') + '/' : '/';
      navigateToPath(parentPath);
      return;
    }
    
    const userPrefix = `users/${client.uuid}/`;
    let cleanPath = folderKey;
    
    if (folderKey.startsWith(userPrefix)) {
      cleanPath = '/' + folderKey.substring(userPrefix.length);
      if (!cleanPath.endsWith('/')) cleanPath += '/';
    } else if (!folderKey.startsWith('/')) {
      cleanPath = '/' + folderKey;
      if (!cleanPath.endsWith('/')) cleanPath += '/';
    }
    
    navigateToPath(cleanPath);
  };

  const downloadFile = async (file: EnhancedS3Item) => {
    try {
      const canDownload = await canDownloadFromPath(client.uuid, file.key);
      if (!canDownload) {
        setError('Download is restricted for this file');
        return;
      }
    } catch (permErr) {
      console.warn('Permission check failed, allowing download:', permErr);
    }

    setActionLoading(file.key);
    try {
      const url = await getFileUrl(file.key);
      window.open(url, '_blank');
    } catch (err) {
      setError(`Failed to download file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteFolder = async (file: EnhancedS3Item) => {
    if (!confirm(`Are you sure you want to delete "${file.name}" and all its contents?`)) {
      return;
    }

    setActionLoading(file.key);
    try {
      await deleteFolderWithPermissions(client.uuid, file.key.replace(`users/${client.uuid}`, ''));
      setTimeout(() => {
        fetchFiles();
      }, 1000);
    } catch (err) {
      setError(`Failed to delete folder: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const startInlineCreate = () => {
    setCreateInlineMode(true);
    setNewFolderName('');
    setCreateFolderError(null);
    setTimeout(() => {
      const input = document.getElementById('inline-folder-name');
      if (input) input.focus();
    }, 100);
  };

  const cancelInlineCreate = () => {
    setCreateInlineMode(false);
    setNewFolderName('');
    setCreateFolderError(null);
  };

  const createFolderInline = async () => {
    if (!newFolderName.trim()) {
      setCreateFolderError('Please enter a folder name');
      return;
    }

    setCreateFolderLoading(true);
    setCreateFolderError(null);

    try {
      await createSubfolder(client.uuid, currentPath, newFolderName);
      setCreateInlineMode(false);
      setNewFolderName('');
      
      let retryCount = 0;
      const maxRetries = 5;
      const retryDelay = 1000;
      
      const checkForNewFolder = async (): Promise<void> => {
        try {
          const items = await listUserFilesWithPermissions(client.uuid, currentPath);
          const folderExists = items.some(item => 
            item.isFolder && 
            item.name.toLowerCase() === newFolderName.trim().toLowerCase().replace(/\s+/g, '-')
          );
          
          if (folderExists || retryCount >= maxRetries) {
            setFiles(items);
            return;
          }
          
          retryCount++;
          console.log(`Folder not found yet, retrying in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`);
          
          setTimeout(checkForNewFolder, retryDelay);
        } catch (err) {
          console.error('Error checking for new folder:', err);
          fetchFiles();
        }
      };
      
      checkForNewFolder();
      
    } catch (err) {
      setCreateFolderError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setCreateFolderLoading(false);
    }
  };

  const handleInlineKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      createFolderInline();
    } else if (e.key === 'Escape') {
      cancelInlineCreate();
    }
  };

  const getFileIcon = (file: EnhancedS3Item) => {
    if (file.name === '..') return 'arrow-up';
    if (file.isFolder) {
      if (file.isProtected) return 'lock-fill';
      if (file.permissions?.uploadRestricted && file.permissions?.downloadRestricted) return 'folder-x';
      if (file.permissions?.downloadRestricted) return 'folder-minus';
      if (file.permissions?.uploadRestricted) return 'folder-check';
      return 'folder-fill';
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'file-earmark-pdf-fill';
      case 'doc':
      case 'docx': return 'file-earmark-word-fill';
      case 'xls':
      case 'xlsx': return 'file-earmark-excel-fill';
      case 'ppt':
      case 'pptx': return 'file-earmark-slides-fill';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'file-earmark-image-fill';
      default: return 'file-earmark-fill';
    }
  };

  // In your FileExplorerTab.tsx, update the getFileColor function:

const getFileColor = (file: EnhancedS3Item) => {
  if (file.name === '..') return 'text-secondary';
  if (file.isFolder) {
    if (file.isProtected) return 'text-danger';
    if (file.permissions?.uploadRestricted && file.permissions?.downloadRestricted) return 'text-dark';
    if (file.permissions?.downloadRestricted) return 'text-warning';
    if (file.permissions?.uploadRestricted) return 'text-info';
    
    // Handle specific folder colors for the new folders
    const folderName = file.name.toLowerCase();
    switch (folderName) {
      case 'certificate': return 'text-primary';
      case 'audit-report': return 'text-success';
      case 'auditor-resume': return 'text-info';
      case 'statistics': return 'text-warning';
      case 'private': return 'text-dark';
      case 'confirmation-notices': return 'text-secondary';
      case 'other': return 'text-muted';
      default: return 'text-primary';
    }
  }
  
  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf': return 'text-danger';
    case 'doc':
    case 'docx': return 'text-primary';
    case 'xls':
    case 'xlsx': return 'text-success';
    case 'ppt':
    case 'pptx': return 'text-warning';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return 'text-info';
    default: return 'text-muted';
  }
};

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
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
    if (!date) return '—';
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString();
  };

  const getQuickStats = () => {
    const totalFiles = files.filter(f => !f.isFolder && f.name !== '..').length;
    const totalFolders = files.filter(f => f.isFolder && f.name !== '..').length;
    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
    
    return {
      items: totalFiles + totalFolders,
      files: totalFiles,
      folders: totalFolders,
      size: formatFileSize(totalSize)
    };
  };

  const stats = getQuickStats();

  return (
    <div className="file-explorer-container">
      {/* Modern Header */}
      <div className="file-explorer-header">
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb-container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb-modern">
              <li className="breadcrumb-item-modern">
                <button 
                  className="breadcrumb-button"
                  onClick={() => navigateToPath('/')}
                >
                  <i className="bi bi-house-fill me-2"></i>
                  Root
                </button>
              </li>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <li className="breadcrumb-separator">
                    <i className="bi bi-chevron-right"></i>
                  </li>
                  <li className="breadcrumb-item-modern">
                    {index === breadcrumbs.length - 1 ? (
                      <span className="breadcrumb-current">{item.label}</span>
                    ) : (
                      <button 
                        className="breadcrumb-button"
                        onClick={() => navigateToPath(item.path + '/')}
                      >
                        {item.label}
                      </button>
                    )}
                  </li>
                </React.Fragment>
              ))}
            </ol>
          </nav>
        </div>

        {/* Action Toolbar */}
        <div className="toolbar-container">
          <div className="toolbar-section">
            <Button 
              className="action-button primary"
              onClick={startInlineCreate}
              disabled={createInlineMode}
            >
              <i className="bi bi-folder-plus"></i>
              <span>New Folder</span>
            </Button>
            
            <Button 
              className="action-button secondary"
              onClick={() => {
                setPermissionsFolderPath(null); // Use current browsing path
                setShowPermissionsPanel(!showPermissionsPanel);
              }}
            >
              <i className="bi bi-shield-lock"></i>
              <span>Permissions</span>
            </Button>
            
            <Button 
              className="action-button secondary"
              onClick={() => fetchFiles()}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Refresh</span>
            </Button>
            
            <div className="view-selector">
              <Dropdown>
                <Dropdown.Toggle className="view-toggle">
                  <i className="bi bi-list me-2"></i>
                  Table View
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item active>
                    <i className="bi bi-list me-2"></i>
                    Table View
                  </Dropdown.Item>
                  <Dropdown.Item disabled>
                    <i className="bi bi-grid me-2"></i>
                    Grid View (Coming Soon)
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-value">{stats.items}</span>
              <span className="stat-label">items</span>
            </div>
            <div className="stat-separator">•</div>
            <div className="stat-item">
              <span className="stat-value">{stats.folders}</span>
              <span className="stat-label">folders</span>
            </div>
            <div className="stat-separator">•</div>
            <div className="stat-item">
              <span className="stat-value">{stats.files}</span>
              <span className="stat-label">files</span>
            </div>
            <div className="stat-separator">•</div>
            <div className="stat-item">
              <span className="stat-value">{stats.size}</span>
              <span className="stat-label">total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Panel */}
      {showPermissionsPanel && (
        <div className="permissions-panel-container">
          <FolderPermissionsPanel
            userId={client.uuid}
            currentPath={permissionsFolderPath || currentPath}
            onPermissionsChange={() => {
              fetchFiles();
              setPermissionsFolderPath(null);
            }}
            onClose={() => {
              setShowPermissionsPanel(false);
              setPermissionsFolderPath(null);
            }}
          />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="modern-alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* File Table */}
      <div className="file-table-container">
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner text="Loading files..." />
          </div>
        ) : (
          <DragDropUpload
            currentPath={currentPath}
            userId={client.uuid}
            onUploadComplete={() => {
              setTimeout(() => {
                fetchFiles();
              }, 1000);
            }}
            disabled={currentPath === '/'}
          >
            <div className="table-wrapper">
              <table className="file-table">
                <thead>
                  <tr>
                    <th className="col-icon"></th>
                    <th className="col-name">Name</th>
                    <th className="col-type">Type</th>
                    <th className="col-size">Size</th>
                    <th className="col-modified">Modified</th>
                    <th className="col-permissions">Permissions</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Inline Folder Creation Row */}
                  {createInlineMode && (
                    <tr className="creating-row">
                      <td className="col-icon">
                        <i className="bi bi-folder-fill text-primary file-icon"></i>
                      </td>
                      <td className="col-name">
                        <Form.Control
                          id="inline-folder-name"
                          type="text"
                          className="folder-name-input"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={handleInlineKeyPress}
                          placeholder="Enter folder name"
                          isInvalid={!!createFolderError}
                          disabled={createFolderLoading}
                        />
                        {createFolderError && (
                          <div className="invalid-feedback d-block">
                            {createFolderError}
                          </div>
                        )}
                      </td>
                      <td className="col-type">
                        <Badge bg="primary" className="modern-badge">Folder</Badge>
                      </td>
                      <td className="col-size">—</td>
                      <td className="col-modified">
                        <span className="creating-text">Creating...</span>
                      </td>
                      <td className="col-permissions">
                        <Badge bg="secondary" className="modern-badge">Default</Badge>
                      </td>
                      <td className="col-actions">
                        <div className="action-buttons">
                          <Button 
                            className="action-btn success"
                            onClick={createFolderInline}
                            disabled={createFolderLoading}
                          >
                            {createFolderLoading ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="bi bi-check-lg"></i>
                            )}
                          </Button>
                          <Button 
                            className="action-btn cancel"
                            onClick={cancelInlineCreate}
                            disabled={createFolderLoading}
                          >
                            <i className="bi bi-x-lg"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* File Rows */}
                  {files.map((file, index) => (
                    <tr 
                      key={index} 
                      className={`file-row ${file.isFolder ? 'folder-row' : 'file-row-item'}`}
                    >
                      <td className="col-icon">
                        <i className={`bi bi-${getFileIcon(file)} ${getFileColor(file)} file-icon`}></i>
                      </td>
                      <td className="col-name">
                        <div className="file-name-container">
                          <span 
                            className={`file-name ${file.isFolder ? 'folder-name' : ''}`}
                            onClick={() => file.isFolder && navigateToFolder(file.key)}
                            onDoubleClick={() => file.isFolder && navigateToFolder(file.key)}
                          >
                            {file.name}
                          </span>
                          {file.isProtected && (
                            <i className="bi bi-shield-fill-check text-danger ms-2" title="Protected"></i>
                          )}
                        </div>
                      </td>
                      <td className="col-type">
                        {file.isFolder ? (
                          <Badge bg="primary" className="modern-badge">Folder</Badge>
                        ) : (
                          <Badge bg="light" text="dark" className="modern-badge">File</Badge>
                        )}
                      </td>
                      <td className="col-size">{file.isFolder ? '—' : formatFileSize(file.size)}</td>
                      <td className="col-modified">{formatDate(file.lastModified)}</td>
                      <td className="col-permissions">
                        <div className="permission-badges">
                          {file.permissions?.downloadRestricted ? (
                            <Badge bg="warning" className="permission-badge" title="Download restricted">
                              <i className="bi bi-download me-1"></i>
                              Restricted
                            </Badge>
                          ) : (
                            <Badge bg="success" className="permission-badge" title="Download allowed">
                              <i className="bi bi-check-circle me-1"></i>
                              Open
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="col-actions">
                        {file.name !== '..' && (
                          <Dropdown align="end">
                            <Dropdown.Toggle className="action-dropdown">
                              <i className="bi bi-three-dots-vertical"></i>
                            </Dropdown.Toggle>
                            
                            <Dropdown.Menu className="action-menu">
                              <Dropdown.Item 
                                onClick={() => file.isFolder ? navigateToFolder(file.key) : downloadFile(file)}
                                disabled={actionLoading === file.key}
                                className="dropdown-item-action"
                              >
                                {actionLoading === file.key ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    {file.isFolder ? 'Opening...' : 'Downloading...'}
                                  </>
                                ) : (
                                  <>
                                    <i className={`bi bi-${file.isFolder ? 'folder-open' : 'download'} me-2`}></i>
                                    {file.isFolder ? 'Open Folder' : 'Download File'}
                                  </>
                                )}
                              </Dropdown.Item>
                              
                              {file.isFolder && (
                                <>
                                  <Dropdown.Item 
                                    onClick={() => {
                                      // Extract folder path from file.key (remove users/{userId}/ prefix)
                                      let folderPath = file.key;
                                      const userPrefix = `users/${client.uuid}/`;
                                      const userPrefixNoSlash = `users/${client.uuid}`;
                                      
                                      if (folderPath.startsWith(userPrefix)) {
                                        folderPath = folderPath.substring(userPrefix.length);
                                      } else if (folderPath.startsWith(userPrefixNoSlash)) {
                                        folderPath = folderPath.substring(userPrefixNoSlash.length);
                                      }
                                      
                                      // Normalize: ensure starts with / and ends with / (except root)
                                      if (!folderPath.startsWith('/')) {
                                        folderPath = '/' + folderPath;
                                      }
                                      // For root, it should be just '/', not '//'
                                      if (folderPath === '/' || folderPath === '//') {
                                        folderPath = '/';
                                      } else if (!folderPath.endsWith('/')) {
                                        folderPath += '/';
                                      }
                                      
                                      setPermissionsFolderPath(folderPath);
                                      setShowPermissionsPanel(true);
                                    }}
                                    className="dropdown-item-action"
                                  >
                                    <i className="bi bi-shield-lock me-2"></i>
                                    Manage Permissions
                                  </Dropdown.Item>
                                  
                                  {file.permissions?.canDeleteFolder && !file.isProtected && (
                                    <>
                                      <Dropdown.Divider />
                                      <Dropdown.Item 
                                        onClick={() => deleteFolder(file)} 
                                        className="dropdown-item-action danger"
                                      >
                                        <i className="bi bi-trash me-2"></i>
                                        Delete Folder
                                      </Dropdown.Item>
                                    </>
                                  )}
                                </>
                              )}
                              
                              {!file.isFolder && (
                                <>
                                  <Dropdown.Divider />
                                  <Dropdown.Item className="dropdown-item-info" disabled>
                                    <i className="bi bi-info-circle me-2"></i>
                                    Size: {formatFileSize(file.size)}
                                  </Dropdown.Item>
                                </>
                              )}
                            </Dropdown.Menu>
                          </Dropdown>
                        )}
                      </td>
                    </tr>
                  ))}

                  {files.length === 0 && !createInlineMode && (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        <div className="empty-content">
                          <i className="bi bi-folder-x empty-icon"></i>
                          <h6 className="empty-title">This folder is empty</h6>
                          <p className="empty-description">Get started by creating your first folder</p>
                          <Button className="action-button primary" onClick={startInlineCreate}>
                            <i className="bi bi-folder-plus"></i>
                            <span>Create Folder</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DragDropUpload>
        )}
      </div>
    </div>
  );
};

export default FileExplorerTab;