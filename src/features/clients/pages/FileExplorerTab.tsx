// src/features/clients/pages/FileExplorerTab.tsx
import React, { useState, useEffect } from 'react';
import { Button, ButtonGroup, Dropdown, Alert, Form } from 'react-bootstrap';
import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import DragDropUpload from '../../../components/common/DragDropUpload';
import FolderPermissionsPanel from '../../files/components/FolderPermissionsPanel'; // Fixed import path
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
import '../styles/fileexplorertab.css';

interface FileExplorerTabProps {
  client: UserProfile;
}

interface BreadcrumbItem {
  label: string;
  path: string;
}

const FileExplorerTab: React.FC<FileExplorerTabProps> = ({ client }) => {
  const [files, setFiles] = useState<EnhancedS3Item[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [showPermissionsPanel, setShowPermissionsPanel] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Folder creation states
  const [createInlineMode, setCreateInlineMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createFolderLoading, setCreateFolderLoading] = useState(false);
  const [createFolderError, setCreateFolderError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
    updateBreadcrumbs(currentPath);
  }, [client, currentPath]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await listUserFilesWithPermissions(client.uuid, currentPath);
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
  };

  const navigateToFolder = (folderKey: string) => {
    if (folderKey.endsWith('/..')) {
      // Navigate to parent
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      const parentPath = parts.length > 0 ? '/' + parts.join('/') + '/' : '/';
      navigateToPath(parentPath);
      return;
    }
    
    // Navigate to folder
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
    const canDownload = await canDownloadFromPath(client.uuid, file.key);
    if (!canDownload) {
      setError('Download is restricted for this file');
      return;
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
      await fetchFiles();
    } catch (err) {
      setError(`Failed to delete folder: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Inline folder creation
  const startInlineCreate = () => {
    setCreateInlineMode(true);
    setNewFolderName('');
    setCreateFolderError(null);
    // Focus the input after a brief delay to ensure it's rendered
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
      await fetchFiles();
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

  const formatDate = (date?: Date) => {
    if (!date) return '';
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
    <Card className="file-explorer-card">
      {/* Header with Breadcrumbs and Actions */}
      <div className="file-explorer-header">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <span 
                className="breadcrumb-link" 
                onClick={() => navigateToPath('/')}
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
                    className="breadcrumb-link" 
                    onClick={() => navigateToPath(item.path + '/')}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Action Toolbar */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="file-explorer-actions">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={startInlineCreate}
              disabled={createInlineMode}
            >
              <i className="bi bi-folder-plus me-1"></i>
              New Folder
            </Button>
            
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={() => setShowPermissionsPanel(!showPermissionsPanel)}
            >
              <i className="bi bi-shield-lock me-1"></i>
              Permissions
            </Button>
            
            <Dropdown as={ButtonGroup}>
              <Button variant="outline-secondary" size="sm">
                <i className="bi bi-list me-1"></i>
                Table
              </Button>
              <Dropdown.Toggle split variant="outline-secondary" size="sm" />
              <Dropdown.Menu>
                <Dropdown.Item>
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

          {/* Quick Stats */}
          <div className="file-explorer-stats">
            <small className="text-muted">
              {stats.items} items • {stats.folders} folders • {stats.files} files • {stats.size}
            </small>
          </div>
        </div>
      </div>

      {/* Permissions Panel */}
      {showPermissionsPanel && (
        <div className="mb-3">
          <FolderPermissionsPanel
            userId={client.uuid}
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

      {/* File Table */}
      {loading ? (
        <LoadingSpinner text="Loading files..." />
      ) : (
        <DragDropUpload
          currentPath={currentPath}
          userId={client.uuid}
          onUploadComplete={fetchFiles}
          disabled={currentPath === '/'}
        >
          <div className="table-responsive">
            <table className="table table-hover file-explorer-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Name</th>
                  <th style={{ width: '100px' }}>Type</th>
                  <th style={{ width: '100px' }}>Size</th>
                  <th style={{ width: '140px' }}>Modified</th>
                  <th style={{ width: '120px' }}>Permissions</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Inline Folder Creation Row */}
                {createInlineMode && (
                  <tr className="table-warning">
                    <td>
                      <i className="bi bi-folder text-primary"></i>
                    </td>
                    <td>
                      <Form.Control
                        id="inline-folder-name"
                        type="text"
                        size="sm"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={handleInlineKeyPress}
                        placeholder="New folder name"
                        isInvalid={!!createFolderError}
                        disabled={createFolderLoading}
                      />
                      {createFolderError && (
                        <Form.Control.Feedback type="invalid">
                          {createFolderError}
                        </Form.Control.Feedback>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-primary">Folder</span>
                    </td>
                    <td>-</td>
                    <td>Creating...</td>
                    <td>Inherit</td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button 
                          variant="success" 
                          onClick={createFolderInline}
                          disabled={createFolderLoading}
                        >
                          {createFolderLoading ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : (
                            <i className="bi bi-check"></i>
                          )}
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          onClick={cancelInlineCreate}
                          disabled={createFolderLoading}
                        >
                          <i className="bi bi-x"></i>
                        </Button>
                      </ButtonGroup>
                    </td>
                  </tr>
                )}

                {/* File Rows */}
                {files.map((file, index) => (
                  <tr 
                    key={index} 
                    className={file.isFolder ? 'file-row-folder' : 'file-row-file'}
                  >
                    <td>
                      <i className={`bi bi-${getFileIcon(file)} text-${getFileColor(file)}`}></i>
                    </td>
                    <td>
                      <span 
                        className={`file-name ${file.isFolder ? 'folder-name' : ''}`}
                        onClick={() => file.isFolder && navigateToFolder(file.key)}
                        onDoubleClick={() => file.isFolder && navigateToFolder(file.key)}
                      >
                        {file.name}
                      </span>
                      {file.isProtected && (
                        <i className="bi bi-shield-fill-check ms-2 text-danger" title="Protected"></i>
                      )}
                    </td>
                    <td>
                      {file.isFolder ? (
                        <span className="badge bg-primary">Folder</span>
                      ) : (
                        <span className="badge bg-secondary">File</span>
                      )}
                    </td>
                    <td>{file.isFolder ? '-' : formatFileSize(file.size)}</td>
                    <td>{formatDate(file.lastModified)}</td>
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
                      </div>
                    </td>
                    <td>
                      {file.name !== '..' && (
                        <Dropdown as={ButtonGroup} size="sm">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => file.isFolder ? navigateToFolder(file.key) : downloadFile(file)}
                            disabled={actionLoading === file.key}
                          >
                            {actionLoading === file.key ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className={`bi bi-${file.isFolder ? 'folder-open' : 'download'}`}></i>
                            )}
                          </Button>
                          
                          <Dropdown.Toggle split variant="outline-primary" size="sm" />
                          
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => file.isFolder ? navigateToFolder(file.key) : downloadFile(file)}>
                              <i className={`bi bi-${file.isFolder ? 'folder-open' : 'download'} me-2`}></i>
                              {file.isFolder ? 'Open' : 'Download'}
                            </Dropdown.Item>
                            
                            {file.isFolder && file.permissions?.canDeleteFolder && !file.isProtected && (
                              <>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => deleteFolder(file)} className="text-danger">
                                  <i className="bi bi-trash me-2"></i>
                                  Delete
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
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <i className="bi bi-folder-x mb-2 d-block" style={{ fontSize: '2rem' }}></i>
                      <p className="mb-2">This folder is empty</p>
                      <Button variant="outline-primary" size="sm" onClick={startInlineCreate}>
                        <i className="bi bi-folder-plus me-1"></i>
                        Create your first folder
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DragDropUpload>
      )}
    </Card>
  );
};

export default FileExplorerTab;