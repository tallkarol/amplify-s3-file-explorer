// src/components/user/DragDropDemo.tsx
import { useState, useEffect } from 'react';
import Card from '../../../components/common/Card';
import DragDropUpload from '../../../components/common/DragDropUpload';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { listUserFiles, canUploadToPath, FOLDER_DISPLAY_NAMES } from '../services/S3Service';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { devLog } from '@/utils/logger';

interface FolderOption {
  value: string;
  label: string;
}

/**
 * A demonstration component that provides an enhanced drag and drop experience.
 * This can be added to the user dashboard to provide a quick way to upload files.
 */
const DragDropDemo = () => {
  const { user } = useAuthenticator();
  const [uploadPath, setUploadPath] = useState<string>('');
  const [folderOptions, setFolderOptions] = useState<FolderOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch folders that the user has upload permissions for
  useEffect(() => {
    const fetchUploadableFolders = async () => {
      if (!user?.userId) return;
      
      setLoading(true);
      try {
        // Get all folders for the user
        const items = await listUserFiles(user.userId, '/');
        const folders = items.filter(item => item.isFolder && item.name !== '..');
        
        // Check upload permissions for each folder
        const uploadableFolders: FolderOption[] = [];
        
        for (const folder of folders) {
          try {
            const canUpload = await canUploadToPath(user.userId, folder.key);
            if (canUpload) {
              // Get display name from FOLDER_DISPLAY_NAMES or use folder name
              const folderName = folder.name;
              const displayName = FOLDER_DISPLAY_NAMES[folderName] || 
                folderName.charAt(0).toUpperCase() + folderName.slice(1).replace(/-/g, ' ');
              
              uploadableFolders.push({
                value: folder.key,
                label: displayName
              });
            }
          } catch (error) {
            console.error(`Error checking upload permissions for ${folder.key}:`, error);
            // Skip folders where permission check fails
          }
        }
        
        // Sort folders alphabetically by label
        uploadableFolders.sort((a, b) => a.label.localeCompare(b.label));
        
        setFolderOptions(uploadableFolders);
        
        // Set default upload path to first folder if no path is set or current path is not available
        if (uploadableFolders.length > 0) {
          const currentPathExists = uploadableFolders.some(f => f.value === uploadPath);
          if (!uploadPath || !currentPathExists) {
            setUploadPath(uploadableFolders[0].value);
          }
        }
      } catch (error) {
        console.error('Error fetching uploadable folders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUploadableFolders();
  }, [user?.userId]);
  
  // Force a refresh of the file list
  const refreshFiles = () => {
    // This function is used as a callback but doesn't need state
    devLog('Upload complete, refreshing...');
    // If you need to perform actions after upload, add them here
  };

  if (loading) {
    return (
      <div className="my-4">
        <Card title="Quick Upload" subtitle="Drag and drop files to upload them quickly">
          <LoadingSpinner text="Loading folders..." />
        </Card>
      </div>
    );
  }

  if (folderOptions.length === 0) {
    return (
      <div className="my-4">
        <Card title="Quick Upload" subtitle="Drag and drop files to upload them quickly">
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            No folders available for upload. Please contact an administrator if you need access to upload folders.
          </div>
        </Card>
      </div>
    );
  }

  const selectedFolderLabel = folderOptions.find(o => o.value === uploadPath)?.label || 'folder';

  return (
    <div className="my-4">
      <Card title="Quick Upload" subtitle="Drag and drop files to upload them quickly">
        <div className="mb-3">
          <label className="form-label">Select destination folder:</label>
          <select 
            className="form-select" 
            value={uploadPath}
            onChange={(e) => setUploadPath(e.target.value)}
          >
            {folderOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <DragDropUpload
          currentPath={uploadPath}
          userId={user.userId}
          onUploadComplete={refreshFiles}
          disabled={false}
        >
          <div className="p-5 border-2 border-dashed rounded-3 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '200px', backgroundColor: 'rgba(13, 110, 253, 0.05)' }}>
            <i className="bi bi-cloud-upload fs-1 text-primary mb-3"></i>
            <h5 className="text-center mb-2">Drop Files Here</h5>
            <p className="text-muted text-center mb-4">Drag and drop files here to upload them to your {selectedFolderLabel.toLowerCase()}</p>
            
            <button 
              className="btn btn-primary" 
              onClick={() => document.getElementById('demo-file-input')?.click()}
            >
              <i className="bi bi-file-earmark-arrow-up me-2"></i>
              Select Files
            </button>
          </div>
        </DragDropUpload>
      </Card>
    </div>
  );
};

export default DragDropDemo;