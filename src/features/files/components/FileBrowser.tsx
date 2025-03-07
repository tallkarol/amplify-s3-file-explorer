// src/features/files/components/FileBrowser.tsx
import React, { useState, useEffect } from 'react';
import { S3Item, BreadcrumbItem } from '@/types';
import { listUserFiles, getFileUrl } from '../services/S3Service';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Breadcrumb from '@/components/common/Breadcrumb';
import FileUpload from './FileUpload';
import DragDropUpload from '@/components/common/DragDropUpload';
import DragDropInfo from '@/components/common/DragDropInfo';
import '@/styles/dragdrop.css';
import '../styles/filebrowser.css'; // We'll create this file for the document styling

interface FileBrowserProps {
  userId: string;
  initialPath?: string;
  restrictToCurrentFolder?: boolean;
  folderDisplayName?: string;
  isAdmin?: boolean;
  onPathChange?: (path: string) => void;
  onNavigateBack?: () => void;
}

// Map of folder IDs to their display names
const FOLDER_DISPLAY_NAMES: Record<string, string> = {
  'certificate': 'Certificates',
  'audit-report': 'Audit Reports',
  'auditor-resume': 'Auditor Profiles',
  'statistics': 'Statistics & Analytics'
};

const FileBrowser: React.FC<FileBrowserProps> = ({
  userId,
  initialPath = '/',
  restrictToCurrentFolder = false,
  folderDisplayName,
  isAdmin = false,
  onPathChange,
  onNavigateBack
}) => {
  const [files, setFiles] = useState<S3Item[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Initialize path from props
  useEffect(() => {
    setCurrentPath(initialPath);
  }, [initialPath]);

  // Fetch files when user or path changes
  useEffect(() => {
    if (userId) {
      fetchFiles();
    }
  }, [userId, currentPath]);

  // Function to fetch files from S3
  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const items = await listUserFiles(userId, currentPath);
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
      items.push({
        label: FOLDER_DISPLAY_NAMES[part] || part,
        path: currentPath
      });
    });
    
    setBreadcrumbs(items);
  };

  // Navigate to a folder
  const navigateToFolder = (path: string) => {
    // Check if this is a parent folder navigation (..)
    if (path.endsWith('/..')) {
      const parts = currentPath.split('/').filter(Boolean);
      // Remove the last part and join back
      parts.pop();
      const parentPath = parts.length > 0 ? '/' + parts.join('/') + '/' : '/';
      updatePath(parentPath);
      return;
    }
    
    // If restricted mode is on, don't allow navigation above the initial path
    if (restrictToCurrentFolder && 
        initialPath !== '/' && 
        !path.startsWith(initialPath) && 
        path !== '/') {
      console.log('Navigation restricted to current folder.');
      return;
    }
    
    // For regular folder navigation
    // Ensure path ends with a slash
    const newPath = path.endsWith('/') ? path : `${path}/`;
    updatePath(newPath);
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

  // Handle action completion (refresh file list)
  const handleActionComplete = () => {
    fetchFiles();
  };

  // Get folder title
  const getFolderTitle = () => {
    if (folderDisplayName) {
      return folderDisplayName;
    }
    
    if (currentPath === '/') {
      return 'Files';
    }
    
    // Extract folder name from path
    const folderName = currentPath.split('/').filter(Boolean)[0];
    return FOLDER_DISPLAY_NAMES[folderName] || folderName;
  };

  // Determine if drag and drop should be disabled
  const isDragDropDisabled = currentPath === '/';

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

  return (
    <Card 
      title={restrictToCurrentFolder ? '' : getFolderTitle()} 
      subtitle={currentPath !== '/' ? `Path: ${currentPath}` : ''}
    >
      {loading ? (
        <LoadingSpinner text="Loading files..." />
      ) : error ? (
        <div className="alert alert-danger">
          <h5>Error loading files</h5>
          <p>{error}</p>
          <p className="mb-0">Check the console for more information. This might be due to permissions issues or incorrect path configuration.</p>
        </div>
      ) : (
        <DragDropUpload
          currentPath={currentPath}
          userId={userId}
          onUploadComplete={handleActionComplete}
          disabled={isDragDropDisabled}
        >
          {/* Navigation Controls */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              {(!restrictToCurrentFolder || initialPath === '/') && (
                <Breadcrumb 
                  items={breadcrumbs} 
                  onNavigate={navigateToFolder} 
                />
              )}
              
              {restrictToCurrentFolder && initialPath !== '/' && onNavigateBack && (
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={onNavigateBack}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Back
                </button>
              )}
            </div>
            
            <div className="d-flex">
              <button 
                className="btn btn-sm btn-outline-secondary me-2"
                onClick={fetchFiles}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
              
              {currentPath !== '/' ? (
                <FileUpload
                  currentPath={currentPath}
                  userId={userId}
                  onUploadComplete={handleActionComplete}
                  isAdmin={isAdmin}
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
          
          {/* Drag and drop info banner */}
          <DragDropInfo isDisabled={isDragDropDisabled} />
          
          {/* File List in Card Style (new UI) */}
          {files.length > 0 ? (
            <div className="file-document-list">
              {files.map(file => (
                <div 
                  key={file.key}
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
                    
                    {(isAdmin || !file.isProtected) && !file.name.startsWith('..') && (
                      <button 
                        className="btn btn-sm btn-outline-danger file-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          // In a real implementation, this would call a delete function
                          console.log(`Delete ${file.name}`);
                        }}
                        title={`Delete ${file.isFolder ? 'folder' : 'file'}`}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="folder"
              title="No files found"
              message={currentPath === '/' 
                ? "This is the root folder. Please navigate to a specific folder to upload files." 
                : "This folder is empty. Upload files to get started or drag & drop files here."}
              action={currentPath !== '/' && (
                <FileUpload
                  currentPath={currentPath}
                  userId={userId}
                  onUploadComplete={handleActionComplete}
                  isAdmin={isAdmin}
                />
              )}
            />
          )}
        </DragDropUpload>
      )}
    </Card>
  );
};

export default FileBrowser;