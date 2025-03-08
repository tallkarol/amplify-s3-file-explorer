// src/components/admin/UserList.tsx
import { useState } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import AlertMessage from '@/components/common/AlertMessage';
import { UserProfile } from '@/types';
import UserStatusBadge from '@/components/common/UserStatusBadge';


interface UserListProps {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
  onViewDetails: (user: UserProfile) => void;
}

type SortField = 'email' | 'createdAt' | 'lastLogin';
type SortDirection = 'asc' | 'desc';

const UserList = ({ users, loading, error, onViewDetails }: UserListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('email');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
                  <th>Name</th>
                  <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                    Joined
                    {sortField === 'createdAt' && (
                      <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('lastLogin')} style={{ cursor: 'pointer' }}>
                    Last Login
                    {sortField === 'lastLogin' && (
                      <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
                    )}
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(user => (
                  <tr 
                    key={user.id} 
                    onContextMenu={(e) => handleContextMenu(e, user)}
                    style={{ cursor: 'context-menu' }}
                  >
                    <td>{user.email}</td>
                    <td>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}</td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Never'}</td>
                    <td>
        <UserStatusBadge status={user.status} />
      </td>
      <td>
        <button 
          className="btn btn-md btn-primary"
          onClick={() => onViewDetails(user)}
        >
          Manage Client
        </button>
      </td>
    </tr>
                ))}
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