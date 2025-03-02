// src/components/user/FileItem.tsx
import { S3Item } from '../../../types';
import FileActions from './FileActions';
  
interface FileItemProps {
  file: S3Item;
  isAdmin: boolean;
  onNavigate: (file: S3Item) => void;
  onActionComplete: () => void;
}

const FileItem = ({ file, isAdmin, onNavigate, onActionComplete }: FileItemProps) => {
  // Function to format file size
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
  
  // Function to get the correct icon based on file type
  const getFileIcon = () => {
    if (file.name === '..') return 'arrow-up';
    if (file.isFolder) return file.isProtected ? 'lock' : 'folder';
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'file-earmark-pdf';
      case 'doc':
      case 'docx':
        return 'file-earmark-word';
      case 'xls':
      case 'xlsx':
        return 'file-earmark-excel';
      case 'ppt':
      case 'pptx':
        return 'file-earmark-slides';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'file-earmark-image';
      default:
        return 'file-earmark';
    }
  };
  
  // Get icon class based on protected status
  const getIconClass = () => {
    const baseClass = 'bi bi-' + getFileIcon() + ' fs-4 ';
    if (file.isProtected) {
      return baseClass + 'text-danger';
    } else if (file.isFolder) {
      return baseClass + 'text-primary';
    }
    return baseClass;
  };
  
  // Handle click on the file/folder
  const handleClick = () => {
    onNavigate(file);
  };
  
  return (
    <div 
      className="list-group-item list-group-item-action d-flex align-items-center"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="me-3">
        <i className={getIconClass()}></i>
        {file.isProtected && (
          <i className="bi bi-shield-lock text-danger position-absolute" style={{ 
            fontSize: '0.7rem', 
            marginLeft: '-0.7rem', 
            marginTop: '0.7rem' 
          }}></i>
        )}
      </div>
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            {file.name}
            {file.isProtected && (
              <span className="badge bg-danger ms-2" style={{ fontSize: '0.6rem' }}>Protected</span>
            )}
          </h6>
          {!file.isFolder && file.size !== undefined && (
            <span className="badge bg-secondary">{formatFileSize(file.size)}</span>
          )}
        </div>
        {file.lastModified && (
          <small className="text-muted">{file.lastModified.toLocaleDateString()}</small>
        )}
      </div>
      
      {/* Actions component (for download and delete) */}
      <div className="ms-2" onClick={(e) => e.stopPropagation()}>
        <FileActions
          file={file}
          isAdmin={isAdmin}
          onActionComplete={onActionComplete}
        />
      </div>
    </div>
  );
};

export default FileItem;