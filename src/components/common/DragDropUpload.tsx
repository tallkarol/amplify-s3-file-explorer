// src/components/common/DragDropUpload.tsx
import { useState, useRef, useEffect, DragEvent, ReactNode } from 'react';
import { uploadData } from 'aws-amplify/storage';
import AlertMessage from './AlertMessage';

interface DragDropUploadProps {
  currentPath: string;
  userId: string;
  onUploadComplete: () => void;
  children: ReactNode;
  disabled?: boolean;
}

const DragDropUpload = ({ 
  currentPath, 
  userId, 
  onUploadComplete, 
  children, 
  disabled = false 
}: DragDropUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Track drag counter to handle nested elements
  const dragCounter = useRef(0);

  // Set up event listeners for the entire document
  useEffect(() => {
    if (disabled) return;
    
    const handleWindowDragOver = (e: DragEvent<HTMLElement> | any) => {
      e.preventDefault();
    };

    const handleDocumentDrop = (e: DragEvent<HTMLElement> | any) => {
      e.preventDefault();
    };

    // Add event listeners to window
    window.addEventListener('dragover', handleWindowDragOver as any);
    window.addEventListener('drop', handleDocumentDrop as any);

    return () => {
      // Remove event listeners when component unmounts
      window.removeEventListener('dragover', handleWindowDragOver as any);
      window.removeEventListener('drop', handleDocumentDrop as any);
    };
  }, [disabled]);

  // Handle drag enter event
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || currentPath === '/') return;
    
    dragCounter.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  // Handle drag leave event
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  // Handle drag over event
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || currentPath === '/') return;
    
    // Set the drop effect
    e.dataTransfer.dropEffect = 'copy';
  };

  // Handle drop event
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset drag counter and dragging state
    dragCounter.current = 0;
    setIsDragging(false);
    
    if (disabled || currentPath === '/') return;
    
    // Check if there are files to process
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Convert FileList to array
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
      setShowModal(true);
    }
  };

  // Handle manual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setShowModal(true);
    }
  };

  // Open file dialog
  const openFileDialog = () => {
    // Prevent uploads to the root folder
    if (currentPath === '/') {
      alert('Please navigate to a specific folder before uploading files.');
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Reset form
  const resetForm = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFiles([]);
    setUploadProgress(0);
    setError(null);
  };

  // Cancel upload
  const handleCancel = () => {
    resetForm();
    setShowModal(false);
  };

  // Upload selected files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      let successCount = 0;
      
      // Upload files one by one
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = Math.round(((i) / selectedFiles.length) * 100);
        setUploadProgress(progress);
        
        try {
          // Construct the path where the file will be uploaded
          const uploadPath = currentPath === '/' 
            ? `users/${userId}/${file.name}`
            : `users/${userId}${currentPath}${file.name}`;
          
          console.log(`Uploading file to: ${uploadPath}`);
          
          // Upload the file
          await uploadData({
            path: uploadPath,
            data: file,
            options: {
              contentType: file.type,
            }
          });
          
          successCount++;
        } catch (err) {
          console.error('Error uploading file:', err);
          setError(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
          break;
        }
      }
      
      // Set final progress
      setUploadProgress(100);
      
      // Show success or partial success message
      if (successCount === selectedFiles.length) {
        console.log('All files uploaded successfully');
      } else {
        console.log(`Uploaded ${successCount} of ${selectedFiles.length} files`);
      }
      
      // Reset and close modal first, then refresh the file list
      setTimeout(() => {
        resetForm();
        setIsUploading(false);
        setShowModal(false);
        
        // After modal is closed, refresh the file list
        setTimeout(() => {
          onUploadComplete();
        }, 100);
      }, 500);
    } catch (err) {
      console.error('General upload error:', err);
      setError(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
      setIsUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="d-none"
      />
      
      {/* Drag and Drop Container */}
      <div 
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="position-relative"
        style={{ minHeight: '100px' }}
      >
        {/* Children content (file browser) */}
        {children}
        
        {/* Drag overlay - only shown when dragging */}
        {isDragging && (
          <div 
            className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
            style={{
              backgroundColor: 'rgba(13, 110, 253, 0.1)',
              border: '2px dashed #0d6efd',
              zIndex: 10,
              borderRadius: '0.5rem'
            }}
          >
            <i className="bi bi-cloud-upload fs-1 text-primary mb-2"></i>
            <h5 className="text-primary">Drop files here to upload</h5>
            <p className="text-muted">Files will be uploaded to the current folder</p>
          </div>
        )}
      </div>
      
      {/* Upload button (kept for compatibility) */}
      {currentPath !== '/' && !disabled && (
        <button 
          className="btn btn-sm btn-primary"
          onClick={openFileDialog}
          disabled={isUploading}
        >
          <i className="bi bi-upload me-1"></i>
          Upload
        </button>
      )}
      
      {/* Upload Preview Modal */}
      {showModal && (
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
                  <h5 className="modal-title">Upload Files</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={handleCancel}
                    disabled={isUploading}
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
                  
                  <div className="mb-3">
                    <p className="mb-2">
                      Ready to upload <span className="fw-medium">{selectedFiles.length}</span> files
                    </p>
                    <div className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                          <div className="text-truncate me-3">
                            <i className="bi bi-file-earmark me-2"></i>
                            {file.name}
                          </div>
                          <span className="badge bg-secondary">{formatFileSize(file.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {isUploading && (
                    <div className="mb-3">
                      <label className="form-label d-flex justify-content-between">
                        <span>Upload Progress</span>
                        <span>{uploadProgress}%</span>
                      </label>
                      <div className="progress">
                        <div 
                          className="progress-bar" 
                          role="progressbar" 
                          style={{ width: `${uploadProgress}%` }}
                          aria-valuenow={uploadProgress} 
                          aria-valuemin={0} 
                          aria-valuemax={100}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="alert alert-info mb-0">
                    <small>
                      <i className="bi bi-info-circle me-1"></i>
                      Uploading to: {currentPath === '/' ? 'Root folder' : currentPath}
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleCancel}
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleUpload}
                    disabled={isUploading || selectedFiles.length === 0}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : 'Upload'}
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

export default DragDropUpload;