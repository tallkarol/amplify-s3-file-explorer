// src/features/files/pages/AdminFileManagement.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AlertMessage from '@/components/common/AlertMessage';
import UserList from '@/features/clients/components/UserList';
import FileExplorerTab from '@/features/clients/pages/FileExplorerTab';
import { UserProfile } from '@/types';
import { fetchAllClients } from '@/features/clients/services/clientService';
import { FOLDER_DISPLAY_NAMES } from '../services/S3Service';
import '@/features/clients/styles/adminclientmanagement.css';

const AdminFileManagement: React.FC = () => {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadClients();
    
    const clientId = searchParams.get('clientId');
    const path = searchParams.get('path') || '/';
    
    if (clientId) {
      // Will be set after clients are loaded
      setCurrentPath(path);
    }
  }, []);

  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const path = searchParams.get('path') || '/';
    
    if (clientId && clients.length > 0) {
      const client = clients.find(c => c.uuid === clientId);
      if (client) {
        setSelectedClient(client);
        setCurrentPath(path);
      }
    } else {
      setSelectedClient(null);
      setCurrentPath('/');
    }
  }, [clients, searchParams]);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const users = await fetchAllClients();
      setClients(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: UserProfile) => {
    setSelectedClient(client);
    setCurrentPath('/');
    setSearchParams({ clientId: client.uuid, path: '/' });
  };

  const clearClientSelection = () => {
    setSelectedClient(null);
    setCurrentPath('/');
    setSearchParams({});
  };

  const handlePathChange = (path: string) => {
    setCurrentPath(path);
    if (selectedClient) {
      setSearchParams({ clientId: selectedClient.uuid, path });
    }
  };

  // Build breadcrumbs
  const buildBreadcrumbs = () => {
    const breadcrumbs: Array<{ label: string; path: string }> = [];
    
    // Always show "File Management" as first breadcrumb
    breadcrumbs.push({
      label: 'File Management',
      path: '/admin/files'
    });
    
    // If client is selected, add client name
    if (selectedClient) {
      breadcrumbs.push({
        label: selectedClient.firstName || selectedClient.lastName || selectedClient.email,
        path: `/admin/files?clientId=${selectedClient.uuid}&path=/`
      });
      
      // Add folder path segments
      if (currentPath && currentPath !== '/') {
        const parts = currentPath.split('/').filter(Boolean);
        let accumulatedPath = '';
        
        parts.forEach((part) => {
          accumulatedPath += `/${part}`;
          
          // Use FOLDER_DISPLAY_NAMES if available, otherwise format the part name
          const displayName = FOLDER_DISPLAY_NAMES[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
          
          breadcrumbs.push({
            label: displayName,
            path: `/admin/files?clientId=${selectedClient.uuid}&path=${accumulatedPath}/`
          });
        });
      }
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <div className="admin-client-dashboard">
      {/* Header */}
      <div className="admin-client-header">
        <div>
          <h2 className="admin-client-title">
            {selectedClient 
              ? `Managing Files for ${selectedClient.firstName || selectedClient.lastName || selectedClient.email}` 
              : 'File Management'}
          </h2>
          <p className="admin-client-subtitle">
            {selectedClient 
              ? `Client ID: ${selectedClient.uuid} • Browse and manage client files` 
              : 'Select a client to browse and manage their files'}
          </p>
        </div>
        {selectedClient && (
          <button 
            className="admin-client-back-button"
            onClick={clearClientSelection}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Client List
          </button>
        )}
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb mb-0">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li 
                  key={index}
                  className={`breadcrumb-item ${isLast ? 'active' : ''}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isLast ? (
                    crumb.label
                  ) : (
                    <Link to={crumb.path} className="text-primary text-decoration-none">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {loading && clients.length === 0 ? (
        <div className="admin-client-loading">
          <LoadingSpinner text="Loading clients..." />
        </div>
      ) : error ? (
        <div className="admin-client-error">
          <AlertMessage 
            type="danger" 
            title="Error Loading Clients"
            message={error}
          />
        </div>
      ) : (
        <>
          {!selectedClient ? (
            /* List View */
            <div className="admin-client-list-container">
              <Card>
                <div className="mb-3">
                  <h5>
                    <i className="bi bi-people me-2"></i>
                    All Clients ({clients.length})
                  </h5>
                  <p className="text-muted mb-0">
                    Select a client to browse and manage their files and folders.
                  </p>
                </div>
                
                <UserList 
                  users={clients}
                  loading={loading}
                  error={error}
                  onViewDetails={handleClientSelect}
                  variant="fileManagement"
                  actionButtonText="Manage Files"
                />
              </Card>
            </div>
          ) : (
            /* Detail View - File Explorer */
            <div className="admin-client-tab-content">
              <FileExplorerTab 
                client={selectedClient}
                onPathChange={handlePathChange}
                initialPath={currentPath}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminFileManagement;
