// src/features/files/components/UserAllFiles.tsx
import React, { useState, useEffect } from 'react';
import { S3Item } from '@/types';
import { listUserFiles, getFileUrl } from '@/features/files/services/S3Service';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import AlertMessage from '@/components/common/AlertMessage';
import SearchInput from '@/components/common/SearchInput';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import '@/features/files/styles/filebrowser.css'; // Import the shared CSS

interface UserAllFilesProps {
  userId: string;
  userName: string;
  onRefreshRequest?: () => void;
}

const UserAllFiles: React.FC<UserAllFilesProps> = ({ 
  userId, 
  onRefreshRequest 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<S3Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'name' | 'lastModified' | 'size'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const itemsPerPage = viewMode === 'list' ? 10 : 12;

  useEffect(() => {
    if (userId) {
      fetchAllUserFiles();
    }
  }, [userId]);

  // Reset to page 1 when changing view mode
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  const fetchAllUserFiles = async () => {
    // Existing code remains the same
    setLoading(true);
    setError(null);
    
    try {
      // First get the root folders
      const rootItems = await listUserFiles(userId, '/');
      const folders = rootItems.filter(item => item.isFolder && item.name !== '..');
      
      // Create an array to store all files
      let allFiles: S3Item[] = [];
      
      // For each folder, fetch its contents recursively
      for (const folder of folders) {
        const folderPath = folder.key.endsWith('/') ? folder.key : `${folder.key}/`;
        const folderFiles = await fetchFolderContentsRecursively(folderPath);
        allFiles = [...allFiles, ...folderFiles];
      }
      
      // Also include any files directly in the root folder
      const rootFiles = rootItems.filter(item => !item.isFolder);
      allFiles = [...allFiles, ...rootFiles];
      
      setFiles(allFiles);
    } catch (err) {
      console.error('Error fetching all user files:', err);
      setError(`Failed to load files: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Existing helper functions remain the same
  const fetchFolderContentsRecursively = async (folderPath: string): Promise<S3Item[]> => {
    // Keeping existing implementation
    try {
      const items = await listUserFiles(userId, folderPath);
      
      // Filter out parent folder navigation item
      const filteredItems = items.filter(item => item.name !== '..');
      
      // Keep track of all files found
      let allFiles: S3Item[] = filteredItems.filter(item => !item.isFolder);
      
      // For each subfolder, recursively fetch its contents
      const subfolders = filteredItems.filter(item => item.isFolder);
      
      for (const subfolder of subfolders) {
        const subfolderPath = subfolder.key.endsWith('/') ? subfolder.key : `${subfolder.key}/`;
        const subfolderFiles = await fetchFolderContentsRecursively(subfolderPath);
        allFiles = [...allFiles, ...subfolderFiles];
      }
      
      return allFiles;
    } catch (err) {
      console.error(`Error fetching contents of folder ${folderPath}:`, err);
      return [];
    }
  };

  const handleDownload = async (file: S3Item) => {
    try {
      const url = await getFileUrl(file.key);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Failed to download file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Format date with better readability
  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    
    // If today, show time only
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If this year, show month and day
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString();
  };

  // Get file extension
  const getFileExtension = (filename: string) => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  };

  // Get icon based on file type
  const getFileIcon = (filename: string) => {
    const extension = getFileExtension(filename);
    
    switch (extension) {
      case 'pdf':
        return 'file-earmark-pdf';
      case 'doc':
      case 'docx':
        return 'file-earmark-word';
      case 'xls':
      case 'xlsx':
        return 'file-earmark-excel';
      case 'ppt':
      case 'pptx':
        return 'file-earmark-slides';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return 'file-earmark-image';
      case 'zip':
      case 'rar':
      case '7z':
        return 'file-earmark-zip';
      case 'txt':
        return 'file-earmark-text';
      case 'csv':
        return 'file-earmark-spreadsheet';
      default:
        return 'file-earmark';
    }
  };

  // Get color based on file type for the document card
  const getFileColor = (filename: string) => {
    const extension = getFileExtension(filename);
    
    switch (extension) {
      case 'pdf':
        return 'danger';
      case 'doc':
      case 'docx':
        return 'primary';
      case 'xls':
      case 'xlsx':
        return 'success';
      case 'ppt':
      case 'pptx':
        return 'warning';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return 'info';
      case 'zip':
      case 'rar':
      case '7z':
        return 'secondary';
      case 'txt':
        return 'dark';
      case 'csv':
        return 'success';
      default:
        return 'secondary';
    }
  };

  // Extract folder path from file key
  const getFolderPathFromKey = (key: string): string => {
    // Remove user ID prefix first
    const userPrefix = `users/${userId}/`;
    const relativePath = key.startsWith(userPrefix) ? key.substring(userPrefix.length) : key;
    
    // Get folder path by removing the filename
    const lastSlashIndex = relativePath.lastIndexOf('/');
    if (lastSlashIndex === -1) return '/';
    
    return relativePath.substring(0, lastSlashIndex + 1);
  };

  // Get folder name from path
  const getFolderDisplayName = (path: string): string => {
    // Remove trailing slash
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    
    // Get the last segment
    const parts = cleanPath.split('/').filter(Boolean);
    const folderName = parts.length > 0 ? parts[parts.length - 1] : 'Root';
    
    // Convert to display name
    const folderDisplayNames: Record<string, string> = {
      'certificate': 'Certificates',
      'audit-report': 'Audit Reports',
      'auditor-resume': 'Auditor Profiles',
      'statistics': 'Statistics'
    };
    
    return folderDisplayNames[folderName] || 
      (folderName === 'Root' ? 'Root' : folderName.charAt(0).toUpperCase() + folderName.slice(1).replace(/-/g, ' '));
  };

  // Get folder color based on folder name
  const getFolderColor = (path: string): string => {
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const parts = cleanPath.split('/').filter(Boolean);
    const folderName = parts.length > 0 ? parts[parts.length - 1] : 'root';
    
    switch (folderName) {
      case 'certificate':
        return 'primary';
      case 'audit-report':
        return 'success';
      case 'auditor-resume':
        return 'info';
      case 'statistics':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Handle sort toggle
  const handleSort = (field: 'name' | 'lastModified' | 'size') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter files based on search term
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getFolderPathFromKey(file.key).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort files based on current sort field and direction
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortField === 'lastModified') {
      const dateA = a.lastModified ? a.lastModified.getTime() : 0;
      const dateB = b.lastModified ? b.lastModified.getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'size') {
      const sizeA = a.size || 0;
      const sizeB = b.size || 0;
      return sortDirection === 'asc' ? sizeA - sizeB : sizeB - sizeA;
    }
    return 0;
  });

  // Paginate files
  const totalPages = Math.ceil(sortedFiles.length / itemsPerPage);
  const paginatedFiles = sortedFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Table columns for list view
  const columns = [
    {
      key: 'icon',
      header: '',
      width: '50px',
      render: (file: S3Item) => (
        <i className={`bi bi-${getFileIcon(file.name)} text-${getFileColor(file.name)} fs-5`}></i>
      )
    },
    {
      key: 'name',
      header: (
        <div 
          className="d-flex align-items-center cursor-pointer"
          onClick={() => handleSort('name')}
        >
          Name
          {sortField === 'name' && (
            <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
          )}
        </div>
      ),
      render: (file: S3Item) => (
        <div>
          <div className="fw-medium">{file.name}</div>
          <small className="text-muted d-flex align-items-center">
            <i className="bi bi-folder me-1"></i>
            {getFolderDisplayName(getFolderPathFromKey(file.key))}
          </small>
        </div>
      )
    },
    {
      key: 'size',
      header: (
        <div 
          className="d-flex align-items-center cursor-pointer"
          onClick={() => handleSort('size')}
        >
          Size
          {sortField === 'size' && (
            <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
          )}
        </div>
      ),
      width: '100px',
      render: (file: S3Item) => formatFileSize(file.size)
    },
    {
      key: 'lastModified',
      header: (
        <div 
          className="d-flex align-items-center cursor-pointer"
          onClick={() => handleSort('lastModified')}
        >
          Modified
          {sortField === 'lastModified' && (
            <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
          )}
        </div>
      ),
      width: '170px',
      render: (file: S3Item) => 
        file.lastModified ? formatDate(file.lastModified) : 'Unknown'
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (file: S3Item) => (
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => handleDownload(file)}
          title="Download file"
        >
          <i className="bi bi-download"></i>
        </button>
      )
    }
  ];

  return (
    <Card title={`Your Files`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2 align-items-center">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by filename or folder..."
            className="w-auto"
          />
          <div className="badge bg-primary">
            {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
          </div>
        </div>

        <div className="d-flex gap-2">
          {/* View toggle buttons */}
          <div className="btn-group btn-group-sm">
            <button
              className={`btn btn-${viewMode === 'list' ? 'primary' : 'outline-primary'}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <i className="bi bi-list"></i>
            </button>
            <button
              className={`btn btn-${viewMode === 'grid' ? 'primary' : 'outline-primary'}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <i className="bi bi-grid"></i>
            </button>
          </div>
          
          {/* Refresh button */}
          <button 
            className="btn btn-outline-primary"
            onClick={() => {
              fetchAllUserFiles();
              if (onRefreshRequest) onRefreshRequest();
            }}
            disabled={loading}
          >
            <i className={`bi bi-${loading ? 'hourglass' : 'arrow-clockwise'} me-1`}></i>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading all files..." />
      ) : error ? (
        <AlertMessage
          type="danger"
          title="Error loading files"
          message={error}
        />
      ) : files.length === 0 ? (
        <EmptyState
          icon="folder"
          title="No Files Found"
          message="This user doesn't have any files uploaded yet."
        />
      ) : filteredFiles.length === 0 ? (
        <EmptyState
          icon="search"
          title="No matches found"
          message={`No files match the search term "${searchTerm}".`}
          action={
            <button 
              className="btn btn-outline-primary"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          }
        />
      ) : viewMode === 'list' ? (
        // List view (table)
        <>
          <Table
            columns={columns}
            data={paginatedFiles}
            keyExtractor={(file) => file.key}
            emptyState={
              <EmptyState
                icon="folder"
                title="No Files Found"
                message="This user doesn't have any files uploaded yet."
              />
            }
          />
        </>
      ) : (
        // Grid view with document cards
        <div className="row g-3">
          {paginatedFiles.map((file) => (
            <div key={file.key} className="col-sm-6 col-md-4 col-lg-3">
              <div className="file-document-card">
                <div className="file-document-card-icon">
                  <div className={`file-icon-wrapper bg-${getFileColor(file.name)}-subtle text-${getFileColor(file.name)}`}>
                    <i className={`bi bi-${getFileIcon(file.name)} fs-2`}></i>
                  </div>
                </div>
                
                <div className="file-document-card-content">
                  <h6 className="file-document-card-title text-truncate" title={file.name}>
                    {file.name}
                  </h6>
                  
                  <div className="file-document-card-folder mb-2">
                    <span className={`badge bg-${getFolderColor(getFolderPathFromKey(file.key))}-subtle text-${getFolderColor(getFolderPathFromKey(file.key))}`}>
                      <i className="bi bi-folder me-1"></i>
                      {getFolderDisplayName(getFolderPathFromKey(file.key))}
                    </span>
                  </div>
                  
                  <div className="file-document-card-details">
                    {file.size !== undefined && (
                      <span className="file-document-card-size">
                        <i className="bi bi-hdd me-1 opacity-75 small"></i>
                        {formatFileSize(file.size)}
                      </span>
                    )}
                    
                    {file.lastModified && (
                      <span className="file-document-card-date">
                        <i className="bi bi-clock me-1 opacity-75 small"></i>
                        {formatDate(file.lastModified)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="file-document-card-floating-actions">
                  <button
                    className="btn btn-sm btn-light shadow-sm"
                    onClick={() => handleDownload(file)}
                    title="Download file"
                  >
                    <i className="bi bi-download"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            maxVisiblePages={5}
          />
        </div>
      )}
    </Card>
  );
};

export default UserAllFiles;