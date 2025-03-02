// src/components/admin/AdminFileBrowser.tsx
import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import Breadcrumb from '../../components/common/Breadcrumb';
import FileItem from '../../features/files/components/FileItem';
import FileUpload from '../../features/files/components/FileUpload';
import DragDropUpload from '../../components/common/DragDropUpload';
import DragDropInfo from '../../components/common/DragDropInfo';
import { UserProfile, S3Item, BreadcrumbItem } from '../../types';
import { listUserFiles, getFileUrl } from '../../features/files/services/S3Service';
import '../../styles/dragdrop.css';

interface AdminFileBrowserProps {
  selectedUser: UserProfile | null;
  initialPath?: string;
  onPathChange?: (path: string) => void;
}

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

  // Initialize path from props
  useEffect(() => {
    setCurrentPath(initialPath);
  }, [initialPath]);

  // Fetch files when user or path changes
  useEffect(() => {
    if (selectedUser) {
      fetchFiles();
    }
  }, [selectedUser, currentPath]);

  // Function to fetch files from S3
  const fetchFiles = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching files for user:', selectedUser.email);
      console.log('User UUID:', selectedUser.uuid);
      console.log('Current path:', currentPath);
      
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
      items.push({
        label: part,
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
    const userPrefix = `users/${selectedUser?.uuid}/`;
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
    
    // Map common folder names to more user-friendly titles
    const folderDisplayNames: Record<string, string> = {
      'certificate': 'Certificates',
      'audit-report': 'Audit Reports',
      'auditor-resume': 'Auditor Profiles',
      'statistics': 'Statistics & Analytics'
    };
    
    return folderDisplayNames[folderName] || 
      folderName.charAt(0).toUpperCase() + folderName.slice(1).replace(/-/g, ' ');
  };

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
    <Card 
      title="File Management" 
      subtitle={`Browsing ${getTitleFromPath()} for ${selectedUser.email}`}
    >
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
          {/* Breadcrumb navigation */}
          <Breadcrumb 
            items={breadcrumbs} 
            onNavigate={navigateToFolder} 
          />
          
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
                  isAdmin={true} // Admin has delete privileges
                  onNavigate={handleFileAction}
                  onActionComplete={handleActionComplete}
                />
              ))}
            </div>
          )}
        </DragDropUpload>
      )}
    </Card>
  );
};

export default AdminFileBrowser;