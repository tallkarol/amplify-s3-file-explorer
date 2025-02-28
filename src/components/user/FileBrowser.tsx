// src/components/user/FileBrowser.tsx
import { useState, useEffect } from 'react';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Breadcrumb from '../common/Breadcrumb';
import AlertMessage from '../common/AlertMessage';
import { S3Item, BreadcrumbItem } from '../../types';

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileBrowser = () => {
  const [files, setFiles] = useState<S3Item[]>([]); // This line was fixed - change from "setFiles" to "files"
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    // Simulate loading files
    setLoading(true);
    setError(null);
    
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
    
    // Mock loading files with a delay
    const timer = setTimeout(() => {
      try {
        // In a real implementation, you would fetch files from S3 here
        // For now, we'll set an empty array
        setFiles([]);
        // Update breadcrumbs based on the current path
        updateBreadcrumbs(currentPath);
        setLoading(false);
      } catch (err) {
        console.error('Error loading files:', err);
        setError(`Failed to load files: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [currentPath]);

  const navigateToFolder = (path: string) => {
    console.log('Navigating to:', path);
    setCurrentPath(path);
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
                <div 
                  key={index} 
                  className="list-group-item list-group-item-action d-flex align-items-center"
                  onClick={() => file.isFolder && navigateToFolder(file.key)}
                  style={{ cursor: file.isFolder ? 'pointer' : 'default' }}
                >
                  <div className="me-3">
                    <i className={`bi bi-${file.isFolder ? 'folder' : 'file-earmark'} fs-4`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">{file.name}</h6>
                      {file.size && (
                        <span className="badge bg-secondary">
                          {formatFileSize(file.size)}
                        </span>
                      )}
                    </div>
                    {file.lastModified && (
                      <small className="text-muted">
                        {file.lastModified.toLocaleDateString()}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default FileBrowser;