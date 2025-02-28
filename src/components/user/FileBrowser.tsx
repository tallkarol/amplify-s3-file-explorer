// src/components/user/FileBrowser.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Breadcrumb from '../common/Breadcrumb';
import AlertMessage from '../common/AlertMessage';
import FileItem from './FileItem';
import FileUpload from '../common/FileUpload';
import { S3Item, BreadcrumbItem } from '../../types';
import { listUserFiles, getFileUrl } from '../../services/S3Service';

interface FileBrowserProps {
  initialPath?: string;
  restrictToCurrentFolder?: boolean;
  folderDisplayName?: string;
}

// Map of folder IDs to their display names
const FOLDER_DISPLAY_NAMES: Record<string, string> = {
  'certificate': 'Certificates',
  'audit-report': 'Audit Reports',
  'auditor-resume': 'Auditor Profiles',
  'statistics': 'Statistics & Analytics'
};

const FileBrowser = ({ 
  initialPath = '/', 
  restrictToCurrentFolder = false,
  folderDisplayName
}: FileBrowserProps) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<S3Item[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const { user } = useAuthenticator();
  const userId = user.userId;

  useEffect(() => {
    fetchFiles();
  }, [userId, currentPath]);

  // Function to extract folder name from path for title
  const getFolderTitle = (path: string): string => {
    // If a display name is provided, use it
    if (folderDisplayName) {
      return folderDisplayName;
    }
    
    // Otherwise, generate a title from the path
    // Remove trailing slash if exists
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    // Get the last part of the path
    const parts = cleanPath.split('/').filter(Boolean);
    const folderName = parts[parts.length - 1] || 'Root';
    
    // Check if we have a display name for this folder
    if (FOLDER_DISPLAY_NAMES[folderName]) {
      return FOLDER_DISPLAY_NAMES[folderName];
    }
    
    // Convert to title case and replace hyphens with spaces
    return folderName
      .replace(/-/g, ' ')
      .replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
  };

  // Function to fetch files from S3
  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching files for current user');
      console.log('User ID:', userId);
      console.log('Current path:', currentPath);
      
      const items = await listUserFiles(userId, currentPath);
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
      items.push({
        label: FOLDER_DISPLAY_NAMES[part] || part,
        path: currentPath
      });
    });
    
    setBreadcrumbs(items);
  };

  const navigateToFolder = (path: string) => {
    console.log('Navigating to folder path:', path);
    
    // If restricted mode is on, don't allow navigation above the initial path
    if (restrictToCurrentFolder && 
        initialPath !== '/' && 
        !path.startsWith(initialPath) && 
        path !== '/') {
      console.log('Navigation restricted to current folder.');
      return;
    }
    
    setCurrentPath(path);
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

  // Handler for when file upload completes
  const handleUploadComplete = () => {
    fetchFiles();
  };

  // Get title for the current view
  const getTitle = () => {
    if (restrictToCurrentFolder && initialPath !== '/') {
      // When in a specific folder view, use a nice title
      return getFolderTitle(initialPath);
    }
    return 'Files';
  };
  
  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    navigate('/user');
  };

  return (
    <div>
      {/* Folder title and back button */}
      {restrictToCurrentFolder && initialPath !== '/' && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">{getFolderTitle(initialPath)}</h3>
          <button 
            className="btn btn-outline-secondary" 
            onClick={handleBackToDashboard}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
          </button>
        </div>
      )}
      
      <Card title={restrictToCurrentFolder ? '' : getTitle()} subtitle={currentPath !== '/' ? `Path: ${currentPath}` : ''}>
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
          <>
            {/* Breadcrumb navigation */}
            {(!restrictToCurrentFolder || initialPath === '/') && (
              <Breadcrumb 
                items={breadcrumbs} 
                onNavigate={navigateToFolder} 
              />
            )}
            
            {/* File actions toolbar */}
            <div className="d-flex justify-content-between align-items-center my-3">
              <div>
                <button 
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={fetchFiles}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
              </div>
              <div>
                {currentPath !== '/' ? (
                  <FileUpload
                    currentPath={currentPath}
                    userId={userId}
                    onUploadComplete={handleUploadComplete}
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
            
            {files.length === 0 ? (
              /* Empty state when no files are present */
              <EmptyState
                icon="folder"
                title="No files found"
                message={currentPath === '/' 
                  ? "This is the root folder. Please navigate to a specific folder to upload files." 
                  : "This folder is empty. Upload files to get started."}
                action={currentPath !== '/' && (
                  <FileUpload
                    currentPath={currentPath}
                    userId={userId}
                    onUploadComplete={handleUploadComplete}
                  />
                )}
              />
            ) : (
              /* Display files when available */
              <div className="list-group mt-3">
                {files.map((file, index) => (
                  <FileItem 
                    key={index}
                    file={file}
                    isAdmin={false} // Regular users are not admins
                    onNavigate={handleFileAction}
                    onActionComplete={fetchFiles}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default FileBrowser;