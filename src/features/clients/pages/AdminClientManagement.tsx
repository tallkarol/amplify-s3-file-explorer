// src/features/clients/pages/AdminClientManagement.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';
import UserList from '../components/UserList';
import ClientProfileCard from '../components/ClientProfileCard';
import AdminFileBrowser from '../../files/components/AdminFileBrowser';
import FolderGrid from '../../files/components/FolderGrid';
import UserAllFiles from '../../files/components/UserAllFiles';
import { UserProfile } from '../../../types';
import { fetchAllClients } from '../services/clientService'; // Updated import
import '../styles/adminclientmanagement.css';

const AdminClientManagement: React.FC = () => {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'profile' | 'actions'>('files');
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadClients();
    
    // Check if a specific client was requested via URL params
    const clientId = searchParams.get('clientId');
    if (clientId) {
      // Will be set after clients are loaded
    }
  }, []);

  useEffect(() => {
    // Set selected client after clients are loaded
    const clientId = searchParams.get('clientId');
    if (clientId && clients.length > 0) {
      const client = clients.find(c => c.uuid === clientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [clients, searchParams]);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const users = await fetchAllClients(); // Updated function name
      setClients(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: UserProfile) => {
    setSelectedClient(client);
    setActiveTab('files');
    setCurrentPath('/');
    setSearchParams({ clientId: client.uuid });
  };

  const clearClientSelection = () => {
    setSelectedClient(null);
    setCurrentPath('/');
    setSearchParams({});
  };

  const handlePathChange = (newPath: string) => {
    setCurrentPath(newPath);
  };

  const handleContactClient = () => {
    // Updated to match ClientProfileCard interface (no parameters)
    alert('Email functionality coming soon!');
  };

  const navigateToClientFiles = () => {
    setActiveTab('files');
    setCurrentPath('/');
  };

  const handleFolderSelect = (folderPath: string) => {
    setCurrentPath(folderPath);
  };

  return (
    <div className="admin-client-dashboard">
      {/* Header */}
      <div className="admin-client-header">
        <div>
          <h2 className="admin-client-title">
            {selectedClient 
              ? `Managing ${selectedClient.firstName || selectedClient.lastName || selectedClient.email}` 
              : 'Enhanced Client Management'}
          </h2>
          <p className="admin-client-subtitle">
            {selectedClient 
              ? `Client ID: ${selectedClient.uuid} • Advanced folder permissions and management` 
              : 'Select a client to manage their account, files, permissions, and folder structure'}
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
                    Click on a client to access enhanced file management with folder permissions, 
                    subfolder creation, and access controls.
                  </p>
                </div>
                
                <UserList 
                  users={clients}
                  loading={loading}
                  error={error}
                  onViewDetails={handleClientSelect}
                />
              </Card>
            </div>
          ) : (
            /* Detail View with Enhanced Features */
            <div className="admin-client-detail">
              {/* Tab Navigation */}
              <div className="admin-client-tabs">
                <button 
                  className={`admin-client-tab ${activeTab === 'files' ? 'active' : ''}`}
                  onClick={() => setActiveTab('files')}
                >
                  <i className="bi bi-folder me-2"></i>
                  Enhanced File Management
                </button>
                <button 
                  className={`admin-client-tab ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="bi bi-person me-2"></i>
                  Profile
                </button>
                <button 
                  className={`admin-client-tab ${activeTab === 'actions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('actions')}
                >
                  <i className="bi bi-gear me-2"></i>
                  Actions
                </button>
              </div>

              {/* Tab Content Area */}
              <div className="admin-client-tab-content">
                {activeTab === 'files' && (
                  <div className="admin-client-grid">
                    {/* Left Side - Client Card (Always Visible) */}
                    <div className="admin-client-sidebar">
                      <ClientProfileCard
                        client={selectedClient}
                        onManageFiles={() => {
                          setActiveTab('files');
                          navigateToClientFiles();
                        }}
                        onContactClient={handleContactClient}
                      />
                      
                      {/* Quick Stats */}
                      <Card className="mt-3">
                        <h6 className="mb-3">
                          <i className="bi bi-bar-chart me-2"></i>
                          Quick Stats
                        </h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Current Folder:</span>
                          <small className="text-muted">{currentPath}</small>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Account Status:</span>
                          <span className={`badge bg-${selectedClient.status === 'active' ? 'success' : 'warning'}`}>
                            {selectedClient.status || 'Active'}
                          </span>
                        </div>
                      </Card>
                      
                      {/* Workflows Preview Section */}
                      <div className="admin-client-preview-card mt-3">
                        <div className="admin-client-preview-header">
                          <h6 className="admin-client-preview-title">
                            <i className="bi bi-diagram-3 me-2 text-muted"></i>
                            Workflow Management
                          </h6>
                          <span className="admin-client-preview-badge">Preview</span>
                        </div>
                        <div className="admin-client-preview-body">
                          <div className="admin-client-preview-content">
                            <i className="bi bi-tools admin-client-preview-icon"></i>
                            <p className="admin-client-preview-text">
                              Workflow management functionality is coming soon. You'll be able to create 
                              and manage certification workflows for your clients directly from this interface.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Enhanced File Browser */}
                    <div className="admin-client-content">
                      {currentPath === '/' ? (
                        <>
                          <Card title={`Folders for ${selectedClient.firstName || selectedClient.email}`}>
                            <FolderGrid 
                              userId={selectedClient.uuid}
                              onSelectFolder={handleFolderSelect} 
                            />
                          </Card>
                          <UserAllFiles 
                            userId={selectedClient.uuid} 
                            userName={selectedClient.firstName || selectedClient.email}
                          />
                        </>
                      ) : (
                        <AdminFileBrowser 
                          selectedUser={selectedClient} 
                          initialPath={currentPath}
                          onPathChange={handlePathChange}
                        />
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="admin-client-grid">
                    <div className="admin-client-sidebar">
                      <ClientProfileCard
                        client={selectedClient}
                        onManageFiles={() => {
                          setActiveTab('files');
                          navigateToClientFiles();
                        }}
                        onContactClient={handleContactClient}
                      />
                    </div>
                    
                    <div className="admin-client-content">
                      <Card title="Client Profile">
                        <div className="row">
                          <div className="col-md-6">
                            <p><strong>Name:</strong> {selectedClient.firstName} {selectedClient.lastName}</p>
                            <p><strong>Email:</strong> {selectedClient.email}</p>
                            <p><strong>Company:</strong> {selectedClient.companyName || 'Not specified'}</p>
                          </div>
                          <div className="col-md-6">
                            <p><strong>Phone:</strong> {selectedClient.phoneNumber || 'Not specified'}</p>
                            <p><strong>Preferred Contact:</strong> {selectedClient.preferredContactMethod || 'Email'}</p>
                            <p><strong>Status:</strong> 
                              <span className={`badge bg-${selectedClient.status === 'active' ? 'success' : 'warning'} ms-2`}>
                                {selectedClient.status || 'Active'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'actions' && (
                  <div className="admin-client-grid">
                    <div className="admin-client-sidebar">
                      <ClientProfileCard
                        client={selectedClient}
                        onManageFiles={() => {
                          setActiveTab('files');
                          navigateToClientFiles();
                        }}
                        onContactClient={handleContactClient}
                      />
                    </div>
                    
                    <div className="admin-client-content">
                      <Card title="Client Actions">
                        <div className="d-grid gap-2 d-md-flex">
                          <button className="btn btn-primary">
                            <i className="bi bi-envelope me-2"></i>
                            Send Message
                          </button>
                          <button className="btn btn-outline-primary">
                            <i className="bi bi-shield-check me-2"></i>
                            Reset Permissions
                          </button>
                          <button className="btn btn-outline-warning">
                            <i className="bi bi-pause me-2"></i>
                            Suspend Account
                          </button>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminClientManagement;