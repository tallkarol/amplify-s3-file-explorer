// src/features/clients/pages/AdminClientManagement.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';
import UserList from '../components/UserList';
import ClientProfileCard from '../components/ClientProfileCard';
import UserActionsCard from '../components/UserActionsCard';
import FileExplorerTab from './FileExplorerTab';
import NotificationsTab from './NotificationsTab';
import { UserProfile } from '../../../types';
import { fetchAllClients } from '../services/clientService';
import '../styles/adminclientmanagement.css';

const AdminClientManagement: React.FC = () => {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'files' | 'actions'>('profile'); // Profile first now
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadClients();
    
    const clientId = searchParams.get('clientId');
    if (clientId) {
      // Will be set after clients are loaded
    }
  }, []);

  useEffect(() => {
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
    setActiveTab('profile'); // Always start with profile
    setSearchParams({ clientId: client.uuid });
  };

  const clearClientSelection = () => {
    setSelectedClient(null);
    setSearchParams({});
  };

  const handleContactClient = () => {
    alert('Email functionality coming soon!');
  };

  return (
    <div className="admin-client-dashboard">
      {/* Header */}
      <div className="admin-client-header">
        <div>
          <h2 className="admin-client-title">
            {selectedClient 
              ? `Managing ${selectedClient.firstName || selectedClient.lastName || selectedClient.email}` 
              : 'Client Management'}
          </h2>
          <p className="admin-client-subtitle">
            {selectedClient 
              ? `Client ID: ${selectedClient.uuid} • Complete client and file management` 
              : 'Select a client to manage their profile, files, and account settings'}
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
                    Select a client to manage their profile, files, and account settings with advanced permissions and folder management.
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
            /* Detail View */
            <div className="admin-client-detail">
              {/* Tab Navigation - Reordered */}
              <div className="admin-client-tabs">
                <button 
                  className={`admin-client-tab ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="bi bi-person me-2"></i>
                  Profile
                </button>
                <button 
                  className={`admin-client-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <i className="bi bi-bell me-2"></i>
                  Notifications
                </button>
                <button 
                  className={`admin-client-tab ${activeTab === 'files' ? 'active' : ''}`}
                  onClick={() => setActiveTab('files')}
                >
                  <i className="bi bi-folder me-2"></i>
                  File Management
                </button>
                <button 
                  className={`admin-client-tab ${activeTab === 'actions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('actions')}
                >
                  <i className="bi bi-gear me-2"></i>
                  Actions
                </button>
              </div>

              {/* Tab Content */}
              <div className="admin-client-tab-content">
                {activeTab === 'profile' && (
                  <div className="admin-client-grid">
                    <div className="admin-client-sidebar">
                      <ClientProfileCard
                        client={selectedClient}
                        onManageFiles={() => setActiveTab('files')}
                        onContactClient={handleContactClient}
                      />
                    </div>
                    
                    <div className="admin-client-content">
                      <Card title="Client Details">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label fw-bold">Full Name</label>
                              <p className="mb-0">{selectedClient.firstName} {selectedClient.lastName}</p>
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-bold">Email Address</label>
                              <p className="mb-0">{selectedClient.email}</p>
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-bold">Company</label>
                              <p className="mb-0">{selectedClient.companyName || 'Not specified'}</p>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label fw-bold">Phone Number</label>
                              <p className="mb-0">{selectedClient.phoneNumber || 'Not specified'}</p>
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-bold">Preferred Contact Method</label>
                              <p className="mb-0">
                                <span className="badge bg-primary">
                                  {selectedClient.preferredContactMethod || 'Email'}
                                </span>
                              </p>
                            </div>
                            <div className="mb-3">
                              <label className="form-label fw-bold">Account Status</label>
                              <p className="mb-0">
                                <span className={`badge bg-${selectedClient.status === 'active' ? 'success' : 'warning'}`}>
                                  {selectedClient.status || 'Active'}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <hr />
                        
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label fw-bold">Client ID</label>
                              <p className="mb-0">
                                <code className="bg-light p-1 rounded">{selectedClient.uuid}</code>
                              </p>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label fw-bold">Member Since</label>
                              <p className="mb-0">
                                {selectedClient.createdAt 
                                  ? new Date(selectedClient.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })
                                  : 'Unknown'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <NotificationsTab client={selectedClient} />
                )}

                {activeTab === 'files' && (
                  <FileExplorerTab client={selectedClient} />
                )}

                {activeTab === 'actions' && (
                  <div className="admin-client-grid">
                    <div className="admin-client-sidebar">
                      <ClientProfileCard
                        client={selectedClient}
                        onManageFiles={() => setActiveTab('files')}
                        onContactClient={handleContactClient}
                      />
                    </div>
                    
                    <div className="admin-client-content">
                      <UserActionsCard
                        user={selectedClient}
                        onStatusChange={loadClients}
                      />
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