// src/components/common/FileUpload.tsx
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { useAuthenticator } from '@aws-amplify/ui-react';
import AlertMessage from '../../../components/common/AlertMessage';
import { notifyUserOfFileUpload } from '@/features/files/services/FileNotificationService';
import { notifyAdminsOfFileUpload } from '@/services/adminNotificationService';
import { canUploadToPath, invalidateFileCountCache } from '../services/S3Service';
import { useUserRole } from '@/hooks/useUserRole';
import { devLog, devError } from '@/utils/logger';

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
  const { isAdmin: userIsAdmin } = useUserRole();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [canUpload, setCanUpload] = useState<boolean>(true);
  const [checkingPermissions, setCheckingPermissions] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check permissions when path or userId changes
  useEffect(() => {
    const checkPermissions = async () => {
      // Can't upload to root folder
      if (currentPath === '/') {
        setCanUpload(false);
        setCheckingPermissions(false);
        return;
      }

      setCheckingPermissions(true);
      try {
        // Check actual permissions (UI reflects restrictions even for admins)
        const hasPermission = await canUploadToPath(userId, currentPath);
        setCanUpload(hasPermission);
      } catch (err) {
        devError('Error checking upload permissions:', err);
        // Default to restrictive on error
        setCanUpload(false);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkPermissions();
  }, [currentPath, userId]);

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
    
    // Defense in depth: Check permissions again before upload
    if (!isAdmin && !userIsAdmin) {
      try {
        const hasPermission = await canUploadToPath(userId, currentPath);
        if (!hasPermission) {
          setError('You do not have permission to upload files to this folder.');
          return;
        }
      } catch (err) {
        devError('Error verifying upload permissions:', err);
        setError('Unable to verify upload permissions. Please try again.');
        return;
      }
    }
    
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
          
          devLog(`Uploading file to: ${uploadPath}`);
          
          // Upload the file
          const result = await uploadData({
            path: uploadPath,
            data: file,
            options: {
              contentType: file.type,
            }
          });
          
          devLog('[FileUpload] Upload result for', file.name, ':', result);
          
          // Invalidate file count cache after successful upload
          invalidateFileCountCache(userId);
          
          successCount++;
          
          // Create notifications based on who is uploading (non-blocking - don't fail upload if notification fails)
          try {
            devLog('[FileUpload] Attempting to create notification for file:', file.name, {
              isAdmin,
              userIsAdmin,
              userId,
              currentUserId: user.userId,
              currentPath
            });
            
            // Determine if this is an admin uploading for a user
            const isAdminUploadingForUser = (isAdmin || userIsAdmin) && userId !== user.userId;
            
            // Determine if this is a regular user uploading their own file
            const isUserUploadingOwnFile = !isAdmin && !userIsAdmin && userId === user.userId;
            
            if (isAdminUploadingForUser) {
              // Admin uploading for a user - notify the user only
              devLog('[FileUpload] Admin uploading for user - notifying user:', userId);
              await notifyUserOfFileUpload(
                userId,
                user.userId, // Admin's user ID
                file.name,
                currentPath,
                `/user/folder/${currentPath.split('/').filter(Boolean)[0]}`
              );
              devLog('[FileUpload] Successfully notified user of admin upload');
            } else if (isUserUploadingOwnFile) {
              // User uploading their own file - notify admins only, NOT the user
              devLog('[FileUpload] User uploading their own file - notifying admins only');
              await notifyAdminsOfFileUpload(
                user.userId, // User's ID (will be converted to display name in the service)
                file.name,
                currentPath
              );
              devLog('[FileUpload] Successfully notified admins of user upload');
            } else {
              // Admin uploading their own file, or other edge cases - skip notifications
              devLog('[FileUpload] Skipping notification - uploader is same as target user or other edge case');
            }
          } catch (notificationError: any) {
            // Log error but don't break the upload flow
            devError('[FileUpload] Failed to create notification (upload still succeeded):', {
              error: notificationError,
              errorMessage: notificationError?.message,
              errorType: notificationError?.errorType,
              graphQLErrors: notificationError?.errors || notificationError?.graphQLErrors,
              fileName: file.name,
              userId,
              currentUserId: user.userId
            });
          }
        } catch (err) {
          devError('Error uploading file:', err);
          setError(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
          setIsUploading(false); // Reset uploading state immediately on error
          break;
        }
      }
      
      // Set final progress
      setUploadProgress(100);
      
      // Show success or partial success message
      if (successCount === selectedFiles.length) {
        devLog('All files uploaded successfully');
      } else {
        devLog(`Uploaded ${successCount} of ${selectedFiles.length} files`);
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
      devError('General upload error:', err);
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

    // Check permissions before opening dialog
    // Note: Admins can still upload even if restricted (checked in handleUpload), but UI reflects restriction
    if (!canUpload) {
      setError('You do not have permission to upload files to this folder.');
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
      
      {/* Upload button - hidden if no permission */}
      {checkingPermissions ? (
        <button 
          className="btn btn-sm btn-secondary"
          disabled
        >
          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          Checking...
        </button>
      ) : canUpload ? (
        <button 
          className="btn btn-sm btn-primary"
          onClick={openFileDialog}
          disabled={isUploading}
        >
          <i className="bi bi-upload me-1"></i>
          Upload
        </button>
      ) : null}
      
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