// src/components/common/FileUpload.tsx
import { useState, useRef, ChangeEvent } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { useAuthenticator } from '@aws-amplify/ui-react';
import AlertMessage from '../../../components/common/AlertMessage';
import { notifyUserOfFileUpload, notifyAdminsOfUserFileUpload } from '@/features/files/services/FileNotificationService';

interface FileUploadProps {
  currentPath: string;
  userId: string;
  onUploadComplete: () => void;
  isAdmin?: boolean; // Flag to indicate if uploader is an admin
}

const FileUpload = ({ 
  currentPath, 
  userId, 
  onUploadComplete,
  isAdmin = false
}: FileUploadProps) => {
  const { user } = useAuthenticator();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setShowModal(true);
    }
  };

  // Reset the form and state
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
          
          // Create notifications if admin is uploading for a user or if we want to notify admins of user uploads
          if (isAdmin && userId !== user.userId) {
            // Admin uploading for a user - notify the user
            // Fix: Remove attributes access
            const adminName = user.username;
            await notifyUserOfFileUpload(
              userId,
              adminName,
              file.name,
              currentPath,
              `/user/folder/${currentPath.split('/').filter(Boolean)[0]}`
            );
          } else if (!isAdmin) {
            // Regular user uploading - could notify admins
            // Note: In a real system, you'd query for all admin users
            // This is a placeholder that would be replaced with actual admin IDs
            const adminIds = ['ADMIN_USER_ID']; // Replace with real admin IDs
            if (adminIds.length > 0) {
              // Fix: Remove attributes access
              const userName = user.username;
              await notifyAdminsOfUserFileUpload(
                adminIds,
                userName,
                file.name,
                currentPath
              );
            }
          }
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

  // Trigger file selection dialog
  const openFileDialog = () => {
    // Prevent uploads to the root folder
    if (currentPath === '/') {
      alert('Please navigate to a specific folder before uploading files. Uploading to the root folder is not allowed.');
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
      
      {/* Upload button */}
      <button 
        className="btn btn-sm btn-primary"
        onClick={openFileDialog}
        disabled={isUploading}
      >
        <i className="bi bi-upload me-1"></i>
        Upload
      </button>
      
      {/* Clean Bootstrap modal */}
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
                    <p className="mb-2">Selected files: <span className="fw-medium">{selectedFiles.length}</span></p>
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
                      {isAdmin && userId !== user.userId && (
                        <div className="mt-1">
                          <i className="bi bi-bell me-1"></i>
                          The user will be notified of this upload.
                        </div>
                      )}
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

export default FileUpload;