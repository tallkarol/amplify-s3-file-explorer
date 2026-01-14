// src/features/files/components/FolderRow.tsx
import React from 'react';
import { S3Item } from '@/types';
import '@/styles/folderrow.css';

interface FolderRowProps {
  folder: S3Item;
  onClick: () => void;
  onAction?: (action: string) => void;
  showActions?: boolean;
  fileCount?: number;
}

const FolderRow: React.FC<FolderRowProps> = ({
  folder,
  onClick,
  onAction,
  showActions = false,
  fileCount
}) => {
  // Convert folder name to sentence case (e.g., "audit-report" -> "Audit Report")
  const formatFolderName = (name: string): string => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div 
      className="folder-row d-flex align-items-center p-3 border-bottom"
      style={{ 
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        backgroundColor: '#ffffff'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f8f9fa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#ffffff';
      }}
    >
      <div className="d-flex align-items-center flex-grow-1 min-w-0">
        <div className="me-3 flex-shrink-0">
          <i className="bi bi-folder text-primary" style={{ fontSize: '1.5rem' }}></i>
        </div>
        
        <div className="flex-grow-1 min-w-0">
          <div className="fw-medium" style={{ fontSize: '0.95rem', color: '#212529' }}>
            {formatFolderName(folder.name)}
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3 flex-shrink-0">
        {fileCount !== undefined && (
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </div>
        )}
        
        {showActions && onAction && (
          <div onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onAction('manage')}
              title="Manage folder"
            >
              <i className="bi bi-three-dots-vertical"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderRow;
