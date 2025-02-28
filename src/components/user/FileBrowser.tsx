// src/components/user/FileBrowser.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Breadcrumb from '../common/Breadcrumb';
import AlertMessage from '../common/AlertMessage';
import FileItem from './FileItem';
import { S3Item, BreadcrumbItem } from '../../types';
import { listUserFiles, getFileUrl } from '../../services/S3Service';

const FileBrowser = () => {
  const [files, setFiles] = useState<S3Item[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const { user } = useAuthenticator();
  const userId = user.userId;

  useEffect(() => {
    // Function to fetch files from S3
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const items = await listUserFiles(userId, currentPath);
        setFiles(items);
        updateBreadcrumbs(currentPath);
        setLoading(false);
      } catch (err) {
        console.error('Error loading files:', err);
        setError(`Failed to load files: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };

    fetchFiles();
  }, [userId, currentPath]);

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
    console.log('Navigating to:', path);
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

  return (
    <Card title="Files" subtitle={`Current path: ${currentPath}`}>
      {loading ? (
        <LoadingSpinner text="Loading files..." />
      ) : error ? (
        <AlertMessage
          type="danger"
          title="Error loading files"
          message={error}
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
              <button className="btn btn-sm btn-outline-secondary me-2">
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
            <div>
              <button className="btn btn-sm btn-primary">
                <i className="bi bi-upload me-1"></i>
                Upload
              </button>
            </div>
          </div>
          
          {files.length === 0 ? (
            /* Empty state when no files are present */
            <EmptyState
              icon="folder"
              title="No files found"
              message="This folder is empty. Upload files to get started."
              action={
                <button className="btn btn-primary">
                  <i className="bi bi-upload me-2"></i>
                  Upload Files
                </button>
              }
            />
          ) : (
            /* Display files when available */
            <div className="list-group mt-3">
              {files.map((file, index) => (
                <FileItem 
                  key={index}
                  file={file}
                  onNavigate={handleFileAction}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default FileBrowser;