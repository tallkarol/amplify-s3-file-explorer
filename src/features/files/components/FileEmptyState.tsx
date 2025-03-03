import React from 'react';
import EmptyState from '../../../components/common/EmptyState';

interface FileEmptyStateProps {
  currentPath: string;
  onUpload?: () => void;
}

const FileEmptyState: React.FC<FileEmptyStateProps> = ({
  currentPath,
  onUpload
}) => {
  return (
    <EmptyState
      icon="folder"
      title="No files found"
      message={
        currentPath === '/'
          ? "This is the root folder. Please navigate to a specific folder to upload files."
          : "This folder is empty. Upload files to get started or drag & drop files here."
      }
      action={
        currentPath !== '/' && onUpload && (
          <button className="btn btn-primary" onClick={onUpload}>
            <i className="bi bi-upload me-2"></i>
            Upload Files
          </button>
        )
      }
    />
  );
};

export default FileEmptyState;