// src/components/admin/UserList.tsx
import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import AlertMessage from '@/components/common/AlertMessage';
import { UserProfile } from '@/types';
import UserStatusBadge from '@/components/common/UserStatusBadge';
import { listUserFiles } from '@/features/files/services/S3Service';

interface UserListProps {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
  onViewDetails: (user: UserProfile) => void;
  variant?: 'default' | 'fileManagement';
  actionButtonText?: string;
}

interface UserFileStats {
  fileCount: number;
  folderCount: number;
  loading: boolean;
}

type SortField = 'email' | 'createdAt' | 'lastLogin' | 'fileCount' | 'folderCount';
type SortDirection = 'asc' | 'desc';

const UserList = ({ 
  users, 
  loading, 
  error, 
  onViewDetails, 
  variant = 'default',
  actionButtonText 
}: UserListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>(variant === 'fileManagement' ? 'fileCount' : 'email');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [userStats, setUserStats] = useState<Record<string, UserFileStats>>({});
  const hasFetchedStats = useRef(false);
  const itemsPerPage = 10;
  
  // Recursively count files and folders for a user
  const countFilesAndFoldersRecursively = async (userId: string, path: string = '/'): Promise<{ fileCount: number; folderCount: number }> => {
    try {
      const items = await listUserFiles(userId, path);
      
      // Filter out parent folder navigation item
      const filteredItems = items.filter(item => item.name !== '..');
      
      // Count files and folders at this level
      let fileCount = filteredItems.filter(item => !item.isFolder).length;
      let folderCount = filteredItems.filter(item => item.isFolder).length;
      
      // Recursively count files and folders in subfolders
      const subfolders = filteredItems.filter(item => item.isFolder);
      for (const subfolder of subfolders) {
        // Use the key directly - it should already be in the format /folder-name/
        // But ensure it starts with / and ends with /
        let subfolderPath = subfolder.key;
        
        // If key includes the full S3 path, extract just the relative path
        const userPrefix = `users/${userId}/`;
        if (subfolderPath.startsWith(userPrefix)) {
          subfolderPath = '/' + subfolderPath.substring(userPrefix.length);
        }
        
        // Ensure it starts with / and ends with /
        if (!subfolderPath.startsWith('/')) {
          subfolderPath = '/' + subfolderPath;
        }
        if (!subfolderPath.endsWith('/')) {
          subfolderPath += '/';
        }
        
        const subfolderStats = await countFilesAndFoldersRecursively(userId, subfolderPath);
        fileCount += subfolderStats.fileCount;
        folderCount += subfolderStats.folderCount;
      }
      
      return { fileCount, folderCount };
    } catch (err) {
      console.error(`Error counting files/folders for path ${path}:`, err);
      return { fileCount: 0, folderCount: 0 };
    }
  };

  // Fetch file/folder counts for file management variant (only once on page load)
  useEffect(() => {
    if (variant === 'fileManagement' && users.length > 0 && !hasFetchedStats.current) {
      hasFetchedStats.current = true;
      
      const fetchStats = async () => {
        const stats: Record<string, UserFileStats> = {};
        
        // Initialize all users with loading state
        users.forEach(user => {
          stats[user.uuid] = { fileCount: 0, folderCount: 0, loading: true };
        });
        setUserStats(stats);
        
        // Fetch stats for each user
        await Promise.all(
          users.map(async (user) => {
            try {
              const counts = await countFilesAndFoldersRecursively(user.uuid, '/');
              stats[user.uuid] = { 
                fileCount: counts.fileCount, 
                folderCount: counts.folderCount, 
                loading: false 
              };
            } catch (err) {
              console.error(`Error fetching stats for user ${user.uuid}:`, err);
              stats[user.uuid] = { fileCount: 0, folderCount: 0, loading: false };
            }
          })
        );
        
        setUserStats({ ...stats });
      };
      
      fetchStats();
    }
  }, [users, variant]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.firstName?.toLowerCase() || '').includes(searchLower) ||
      (user.lastName?.toLowerCase() || '').includes(searchLower) ||
      user.uuid.toLowerCase().includes(searchLower)
    );
  });
  
  // Sort users based on sort field and direction
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortField === 'email') {
      return sortDirection === 'asc' 
        ? a.email.localeCompare(b.email)
        : b.email.localeCompare(a.email);
    } else if (sortField === 'createdAt') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'lastLogin') {
      // This would use a lastLogin field when available
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0; // Using createdAt as placeholder
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'fileCount') {
      const countA = userStats[a.uuid]?.fileCount || 0;
      const countB = userStats[b.uuid]?.fileCount || 0;
      return sortDirection === 'asc' ? countA - countB : countB - countA;
    } else if (sortField === 'folderCount') {
      const countA = userStats[a.uuid]?.folderCount || 0;
      const countB = userStats[b.uuid]?.folderCount || 0;
      return sortDirection === 'asc' ? countA - countB : countB - countA;
    }
    return 0;
  });
  
  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle sort click
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, user: UserProfile) => {
    e.preventDefault();
    // For now, just view details on right-click
    onViewDetails(user);
  };
  
  if (loading) {
    return <LoadingSpinner text="Loading users..." />;
  }
  
  if (error) {
    return (
      <AlertMessage
        type="danger"
        title="Error loading users"
        message={error}
        details="This might be due to permissions issues. Please check that your user is in the admin group and that the data model is properly configured."
      />
    );
  }
  
  if (users.length === 0) {
    return (
      <EmptyState
        icon="people"
        title="No users found"
        message="No users have been registered yet."
      />
    );
  }
  
  return (
    <div>
      {/* Search bar */}
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text bg-light border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0 bg-light"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="btn btn-outline-secondary border-start-0"
              type="button"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
      </div>
      
      {/* Results count when searching */}
      {searchTerm && (
        <div className="mb-3 text-muted">
          Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchTerm}"
        </div>
      )}
      
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon="search"
          title="No matching users"
          message={`No users match the search term "${searchTerm}".`}
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
        <>
          {/* User Table */}
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                    Email
                    {sortField === 'email' && (
                      <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
                    )}
                  </th>
                  {variant === 'fileManagement' ? (
                    <>
                      <th onClick={() => handleSort('fileCount')} style={{ cursor: 'pointer' }} className="text-center">
                        File Count
                        {sortField === 'fileCount' && (
                          <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('folderCount')} style={{ cursor: 'pointer' }} className="text-center">
                        Folder Count
                        {sortField === 'folderCount' && (
                          <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
                        )}
                      </th>
                    </>
                  ) : (
                    <>
                      <th>Name</th>
                      <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                        Joined
                        {sortField === 'createdAt' && (
                          <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
                        )}
                      </th>
                    </>
                  )}
                  <th onClick={() => handleSort('lastLogin')} style={{ cursor: 'pointer' }} className="text-center">
                    Last Login
                    {sortField === 'lastLogin' && (
                      <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
                    )}
                  </th>
                  <th className="text-center">Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(user => {
                  const stats = userStats[user.uuid];
                  return (
                    <tr 
                      key={user.id} 
                      onContextMenu={(e) => handleContextMenu(e, user)}
                      style={{ cursor: 'context-menu' }}
                    >
                      <td>{user.email}</td>
                      {variant === 'fileManagement' ? (
                        <>
                          <td className="text-center">
                            {stats?.loading ? (
                              <span className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </span>
                            ) : (
                              <span className="badge bg-info">{stats?.fileCount || 0}</span>
                            )}
                          </td>
                          <td className="text-center">
                            {stats?.loading ? (
                              <span className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </span>
                            ) : (
                              <span className="badge bg-primary">{stats?.folderCount || 0}</span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}</td>
                          <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                        </>
                      )}
                      <td className="text-center">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Never'}</td>
                      <td className="text-center">
                        <UserStatusBadge status={user.status} />
                      </td>
                      <td className="text-end">
                        <button 
                          className="btn btn-md btn-primary"
                          onClick={() => onViewDetails(user)}
                        >
                          {actionButtonText || (variant === 'fileManagement' ? 'Manage Files' : 'Manage Client')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="User list pagination" className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default UserList;