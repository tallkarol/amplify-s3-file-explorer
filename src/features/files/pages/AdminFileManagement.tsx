import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../../../components/common/Card';
import UserFileSelector from '../components/UserFileSelector';
import FilePathBreadcrumbs from '../components/FilePathBreadcrumbs';
import FileToolbar from '../components/FileToolbar';
import FileViewToggle from '../components/FileViewToggle';
import { FileManagerState, FilePathSegment, FileViewMode } from '../types/fileTypes';
import { fetchUserByUuid } from '../services/fileService';
import { UserProfile } from '../../../types';

const AdminFileManagement: React.FC = () => {
  const location = useLocation();
  const [state, setState] = useState<FileManagerState>({
    selectedUser: null,
    currentPath: '/',
    isLoading: false,
    error: null,
    viewMode: 'list'
  });
  
  // Parse URL query parameters for userId
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const userId = urlParams.get('userId');
    
    if (userId) {
      loadUserById(userId);
    }
  }, [location.search]);
  
  const loadUserById = async (userId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await fetchUserByUuid(userId);
      
      if (user) {
        setState(prev => ({ 
          ...prev, 
          selectedUser: user,
          isLoading: false
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: `No user found with ID: ${userId}`,
          isLoading: false
        }));
      }
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: `Error loading user: ${err instanceof Error ? err.message : String(err)}`,
        isLoading: false
      }));
    }
  };
  
  const handleUserSelect = (user: UserProfile | null) => {
    setState(prev => ({ 
      ...prev, 
      selectedUser: user,
      currentPath: '/' // Reset path when user changes
    }));
  };
  
  const handlePathChange = (path: string) => {
    setState(prev => ({ ...prev, currentPath: path }));
  };
  
  const handleViewModeChange = (mode: FileViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  };
  
  const handleRefresh = () => {
    // This would trigger a refresh of the file list
    console.log('Refreshing files');
  };
  
  const handleUpload = () => {
    // This would open the file upload dialog
    console.log('Opening upload dialog');
  };
  
  const handleNavigateUp = () => {
    // Navigate to parent folder
    const parts = state.currentPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = parts.length > 0 ? '/' + parts.join('/') + '/' : '/';
    handlePathChange(parentPath);
  };
  
  // Generate breadcrumb segments from current path
  const getBreadcrumbSegments = (): FilePathSegment[] => {
    const parts = state.currentPath.split('/').filter(Boolean);
    
    return parts.map((part, index) => {
      const pathUpToHere = '/' + parts.slice(0, index + 1).join('/') + '/';
      return {
        label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
        path: pathUpToHere
      };
    });
  };
  
  const { selectedUser, currentPath, isLoading, error, viewMode } = state;
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">File Management</h2>
      </div>
      
      <div className="row">
        {/* Left column - User selection */}
        <div className="col-md-4 mb-4">
          <UserFileSelector
            selectedUser={selectedUser}
            onSelectUser={handleUserSelect}
            isLoading={isLoading && !selectedUser}
            error={error}
          />
          
          {selectedUser && currentPath === '/' && (
            <Card title="Instructions" className="mt-3">
              <div className="alert alert-info mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Select a folder to browse files or upload new content.
              </div>
            </Card>
          )}
        </div>
        
        {/* Right column - File browser */}
        <div className="col-md-8">
          {selectedUser ? (
            <>
              {currentPath === '/' ? (
                /* Root folder view */
                <Card title={`Folders for ${selectedUser.firstName || selectedUser.email}`}>
                  {/* Replace with your FolderGrid component */}
                  <p>Folder grid would go here</p>
                </Card>
              ) : (
                /* File browser view */
                <Card>
                  <div className="p-3 mb-4 bg-light rounded shadow-sm">
                    {/* Path display and navigation */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">
                        Browsing Files
                      </h5>
                      
                      <FileViewToggle 
                        viewMode={viewMode}
                        onChangeViewMode={handleViewModeChange}
                      />
                    </div>
                    
                    {/* Breadcrumb navigation */}
                    <div className="mb-3">
                      <FilePathBreadcrumbs
                        segments={getBreadcrumbSegments()}
                        onNavigate={handlePathChange}
                      />
                    </div>
                    
                    {/* File actions toolbar */}
                    <FileToolbar
                      currentPath={currentPath}
                      onRefresh={handleRefresh}
                      onUpload={handleUpload}
                      onNavigateUp={handleNavigateUp}
                      disableUpload={currentPath === '/'}
                    />
                  </div>
                  
                  {/* File list or grid would go here */}
                  {/* This would integrate with your existing FileBrowser component */}
                  <div className="border p-5 text-center bg-light">
                    <i className="bi bi-folder-fill fs-1 text-primary mb-3"></i>
                    <h5>File Browser Component</h5>
                    <p className="text-muted">
                      This is where your existing FileBrowser component would be rendered,
                      showing files for {selectedUser.email} at path {currentPath}
                    </p>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="text-center p-5">
                <i className="bi bi-person-badge fs-1 text-muted mb-3"></i>
                <h5>Select a Client</h5>
                <p className="text-muted">Please select a client from the panel on the left to browse their files.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFileManagement