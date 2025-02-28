// src/components/user/DragDropDemo.tsx
import { useState } from 'react';
import Card from '../common/Card';
import DragDropUpload from '../common/DragDropUpload';
import { useAuthenticator } from '@aws-amplify/ui-react';

/**
 * A demonstration component that provides an enhanced drag and drop experience.
 * This can be added to the user dashboard to provide a quick way to upload files.
 */
const DragDropDemo = () => {
  const { user } = useAuthenticator();
  const [uploadPath, setUploadPath] = useState<string>('/certificate/');
  
  // Force a refresh of the file list
  const refreshFiles = () => {
    // This function is used as a callback but doesn't need state
    console.log('Upload complete, refreshing...');
    // If you need to perform actions after upload, add them here
  };
  
  // List of folder options
  const folderOptions = [
    { value: '/certificate/', label: 'Certificates' },
    { value: '/audit-report/', label: 'Audit Reports' },
    { value: '/auditor-resume/', label: 'Auditor Profiles' },
    { value: '/statistics/', label: 'Statistics' }
  ];

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
            <p className="text-muted text-center mb-4">Drag and drop files here to upload them to your {folderOptions.find(o => o.value === uploadPath)?.label.toLowerCase() || 'folder'}</p>
            
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