// src/components/user/FileBrowser.tsx
import { useState, useEffect } from 'react';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Breadcrumb from '../common/Breadcrumb';
import AlertMessage from '../common/AlertMessage';
import { S3Item, BreadcrumbItem } from '../../types';

const FileBrowser = () => {
  const [setFiles] = useState<S3Item[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [loading, setLoading] = useState<boolean>(true);
  const [error] = useState<string | null>(null);
  const [breadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    // Simulate loading files
    setLoading(true);
    
    // Mock a delay for loading
    const timer = setTimeout(() => {
      setLoading(false);
      // Set empty files array for now
      setFiles([]);
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
          
          {/* Empty state for no files */}
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
        </>
      )}
    </Card>
  );
};

export default FileBrowser;