// src/components/admin/AdminFileBrowser.tsx
import { useState, useEffect } from 'react';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
import AlertMessage from '../common/AlertMessage';
import Breadcrumb from '../common/Breadcrumb';
import FileItem from '../user/FileItem';
import FileUpload from '../common/FileUpload';
import { UserProfile, S3Item, BreadcrumbItem } from '../../types';
import { listUserFiles, getFileUrl } from '../../services/S3Service';

interface AdminFileBrowserProps {
  selectedUser: UserProfile | null;
}

const AdminFileBrowser = ({ selectedUser }: AdminFileBrowserProps) => {
  const [files, setFiles] = useState<S3Item[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

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

  const navigateToFolder = (path: string) => {
    console.log('Navigating to folder path:', path);
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

  // Handler for when file upload or deletion completes
  const handleActionComplete = () => {
    fetchFiles();
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
      subtitle={`Files for ${selectedUser.email}`}
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
        <>
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
          
          {files.length === 0 ? (
            /* Empty state when no files are present */
            <EmptyState
              icon="folder"
              title="No files found"
              message={currentPath === '/' 
                ? "This is the root folder. Please navigate to a specific folder to upload files." 
                : "This folder is empty."}
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
        </>
      )}
    </Card>
  );
};

export default AdminFileBrowser;