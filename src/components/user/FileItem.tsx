// src/components/user/FileItem.tsx
import { S3Item } from '../../types';
  
interface FileItemProps {
  file: S3Item;
  onNavigate: (file: S3Item) => void;
}

const FileItem = ({ file, onNavigate }: FileItemProps) => {
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
    if (file.isFolder) return 'folder';
    
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
        <i className={`bi bi-${getFileIcon()} fs-4 ${file.isFolder ? 'text-primary' : ''}`}></i>
      </div>
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">{file.name}</h6>
          {!file.isFolder && file.size !== undefined && (
            <span className="badge bg-secondary">{formatFileSize(file.size)}</span>
          )}
        </div>
        {file.lastModified && (
          <small className="text-muted">{file.lastModified.toLocaleDateString()}</small>
        )}
      </div>
      {!file.isFolder && (
        <div className="ms-2">
          <button 
            className="btn btn-sm btn-outline-primary" 
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(file);
            }}
            title="Download file"
          >
            <i className="bi bi-download"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default FileItem;