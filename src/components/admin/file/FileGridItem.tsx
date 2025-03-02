// src/components/admin/file/FileGridItem.tsx
import React from 'react';

export interface FolderCardProps {
  id: string;
  name: string;
  icon: string;
  color: string;
  isProtected?: boolean;
  onClick: () => void;
}

const FileGridItem: React.FC<FolderCardProps> = ({
  name,
  icon,
  color,
  isProtected,
  onClick
}) => {
  return (
    <div 
      className={`card h-100 folder-card ${color}-card`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {isProtected && (
        <span className="protection-badge badge bg-danger">Protected</span>
      )}
      
      <div className="card-body d-flex flex-column justify-content-center align-items-center">
        <div className={`folder-icon-container bg-${color} bg-opacity-15`}>
          <i className={`bi bi-${icon} fs-1 text-${color}`}></i>
        </div>
        <h4 className="card-title text-center mb-1">{name}</h4>
      </div>
      <div className="card-footer text-center">
        <span className="text-muted d-flex align-items-center justify-content-center">
          <i className="bi bi-arrow-right-circle me-2"></i> 
          Browse Files
        </span>
      </div>
    </div>
  );
};

export default FileGridItem;