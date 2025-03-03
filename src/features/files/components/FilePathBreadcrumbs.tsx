import React from 'react';
import { FilePathSegment } from '../types/fileTypes';

interface FilePathBreadcrumbsProps {
  segments: FilePathSegment[];
  onNavigate: (path: string) => void;
}

const FilePathBreadcrumbs: React.FC<FilePathBreadcrumbsProps> = ({
  segments,
  onNavigate
}) => {
  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb bg-white py-2 px-3 rounded shadow-sm mb-0">
        <li className="breadcrumb-item">
          <button 
            className="btn btn-link text-decoration-none p-0"
            onClick={() => onNavigate('/')}
          >
            <i className="bi bi-house-door me-1"></i>
            Root
          </button>
        </li>
        
        {segments.map((segment, index) => (
          <li 
            key={index}
            className={`breadcrumb-item ${index === segments.length - 1 ? 'active' : ''}`}
          >
            {index === segments.length - 1 ? (
              segment.label
            ) : (
              <button 
                className="btn btn-link text-decoration-none p-0"
                onClick={() => onNavigate(segment.path)}
              >
                {segment.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default FilePathBreadcrumbs;