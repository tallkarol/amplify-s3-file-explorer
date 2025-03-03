import React from 'react';

interface FileToolbarProps {
  currentPath: string;
  onRefresh: () => void;
  onUpload?: () => void;
  onNavigateUp?: () => void;
  disableUpload?: boolean;
}

const FileToolbar: React.FC<FileToolbarProps> = ({
  currentPath,
  onRefresh,
  onUpload,
  onNavigateUp,
  disableUpload = false
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center">
      <div>
        <button 
          className="btn btn-sm btn-outline-secondary me-2"
          onClick={onRefresh}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Refresh
        </button>
        
        {currentPath !== '/' && onNavigateUp && (
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={onNavigateUp}
          >
            <i className="bi bi-arrow-up me-1"></i>
            Up to Parent
          </button>
        )}
      </div>
      <div>
        {onUpload && (
          <button 
            className="btn btn-sm btn-primary"
            onClick={onUpload}
            disabled={disableUpload}
          >
            <i className="bi bi-upload me-1"></i>
            Upload
          </button>
        )}
      </div>
    </div>
  );
};

export default FileToolbar;