// src/components/user/FileActions.tsx
import { useState } from 'react';
import { S3Item } from '../../../types';
import { getFileUrl, deleteFile, deleteFolder } from '../services/S3Service';
import AlertMessage from '../../../components/common/AlertMessage';

interface FileActionsProps {
  file: S3Item;
  isAdmin: boolean;
  onActionComplete: () => void;
}

const FileActions = ({ file, isAdmin, onActionComplete }: FileActionsProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle download action
  const handleDownload = async () => {
    try {
      const url = await getFileUrl(file.key);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Failed to download: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Handle delete confirmation
  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      if (file.isFolder) {
        await deleteFolder(file.key);
      } else {
        await deleteFile(file.key);
      }
      
      // Close modal
      setShowDeleteModal(false);
      
      // Notify parent component to refresh the file list
      onActionComplete();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(`Failed to delete: ${err instanceof Error ? err.message : String(err)}`);
      setIsDeleting(false);
    }
  };
  
  // Open delete confirmation modal
  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setError(null);
  };
  
  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setError(null);
  };

  return (
    <>
      {/* Action buttons */}
      <div className="d-flex align-items-center">
        {!file.isFolder && (
          <button 
            className="btn btn-sm btn-outline-primary me-2" 
            onClick={handleDownload}
            title="Download file"
          >
            <i className="bi bi-download"></i>
          </button>
        )}
        
        {isAdmin && !file.isProtected && !file.name.startsWith('..') && (
          <button 
            className="btn btn-sm btn-outline-danger" 
            onClick={openDeleteModal}
            title={`Delete ${file.isFolder ? 'folder' : 'file'}`}
          >
            <i className="bi bi-trash"></i>
          </button>
        )}
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1040,
          display: 'block'
        }}>
          <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {file.isFolder ? 'Delete Folder' : 'Delete File'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  {error && (
                    <AlertMessage
                      type="danger"
                      message={error}
                    />
                  )}
                  
                  <p>
                    Are you sure you want to delete <strong>{file.name}</strong>?
                    {file.isFolder && ' This will delete all files in this folder.'}
                  </p>
                  
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    This action cannot be undone.
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Deleting...
                      </>
                    ) : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileActions;