// src/components/admin/file/UserAllFilesComponent.tsx
import React, { useState, useEffect } from 'react';
import { S3Item } from '../../../types';
import { listUserFiles, getFileUrl } from '../../../features/files/services/S3Service';
import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import AlertMessage from '../../../components/common/AlertMessage';
import SearchInput from '../../../components/common/SearchInput';
import Table from '../../../components/common/Table';
import Pagination from '../../../components/common/Pagination';

interface UserAllFilesProps {
  userId: string;
  userName: string;
  onRefreshRequest?: () => void;
}

const UserAllFiles: React.FC<UserAllFilesProps> = ({ 
  userId, 
  userName,
  onRefreshRequest 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<S3Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'name' | 'lastModified' | 'size'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const itemsPerPage = 10;

  useEffect(() => {
    if (userId) {
      fetchAllUserFiles();
    }
  }, [userId]);

  const fetchAllUserFiles = async () => {
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

  // Recursively fetch folder contents
  const fetchFolderContentsRecursively = async (folderPath: string): Promise<S3Item[]> => {
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

  // Download a file
  const handleDownload = async (file: S3Item) => {
    try {
      const url = await getFileUrl(file.key);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Failed to download file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Format file size
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

  // Table columns
  const columns = [
    {
      key: 'icon',
      header: '',
      width: '50px',
      render: (file: S3Item) => (
        <i className={`bi bi-${getFileIcon(file.name)} text-primary fs-5`}></i>
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
          <div>{file.name}</div>
          <small className="text-muted">
            Folder: {getFolderDisplayName(getFolderPathFromKey(file.key))}
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
        file.lastModified ? file.lastModified.toLocaleString() : 'Unknown'
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
    <Card title={`All Files for ${userName}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex gap-2 align-items-center">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by filename or folder..."
            className="w-auto"
          />
          <div className="badge bg-primary">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </div>
        </div>
        <div>
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
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedFiles}
            keyExtractor={(file) => file.key}
            emptyState={
              searchTerm ? (
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
              ) : (
                <EmptyState
                  icon="folder"
                  title="No Files Found"
                  message="This user doesn't have any files uploaded yet."
                />
              )
            }
          />

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
        </>
      )}
    </Card>
  );
};

export default UserAllFiles;