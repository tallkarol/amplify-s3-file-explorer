import React from 'react';
import { FileViewMode } from '../types/fileTypes';

interface FileViewToggleProps {
  viewMode: FileViewMode;
  onChangeViewMode: (mode: FileViewMode) => void;
}

const FileViewToggle: React.FC<FileViewToggleProps> = ({
  viewMode,
  onChangeViewMode
}) => {
  return (
    <div className="btn-group btn-group-sm">
      <button
        className={`btn btn-${viewMode === 'list' ? 'primary' : 'outline-primary'}`}
        onClick={() => onChangeViewMode('list')}
        title="List view"
      >
        <i className="bi bi-list"></i>
      </button>
      <button
        className={`btn btn-${viewMode === 'grid' ? 'primary' : 'outline-primary'}`}
        onClick={() => onChangeViewMode('grid')}
        title="Grid view"
      >
        <i className="bi bi-grid"></i>
      </button>
    </div>
  );
};

export default FileViewToggle;