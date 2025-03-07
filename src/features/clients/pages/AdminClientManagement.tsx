import React, { useState, useEffect } from 'react';
import Card from '@components/common/Card';
import AlertMessage from '@components/common/AlertMessage';
import LoadingSpinner from '@components/common/LoadingSpinner';
import UserList from '../components/UserList';
import UserActionsCard from '../components/UserActionsCard';
import ClientProfileCard from '../components/ClientProfileCard';
import ClientFolderAccess from '../components/ClientFolderAccess';
import UserAllFiles from '@/features/files/components/UserAllFiles';
import { fetchAllClients } from '../services/clientService';
import { UserProfile } from '@/types';
import '../styles/adminclientmanagement.css';

const AdminClientManagerPage: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'profile' | 'actions'>('files');
  
  // Fetch clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const userProfiles = await fetchAllClients();
        setClients(userProfiles);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError(`Failed to load clients: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadClients();
  }, []);

  // Handle client selection
  const handleClientSelect = (client: UserProfile | null) => {
    setSelectedClient(client);
  };
  
  // Navigate to file browser for selected client
  const navigateToClientFiles = () => {
    if (selectedClient) {
      window.location.href = `/admin/files?userId=${selectedClient.uuid}`;
    }
  };
  
  // Handle contact client action
  const handleContactClient = () => {
    alert('Email functionality coming soon!');
  };

  // Reset client selection
  const clearClientSelection = () => {
    setSelectedClient(null);
  };
  
  return (
    <div className="admin-client-dashboard">
      {/* Header Section */}
      <div className="admin-client-header">
        <div className="admin-client-header-content">
          <h2 className="admin-client-title">
            {selectedClient 
              ? `Managing ${selectedClient.firstName || selectedClient.lastName || selectedClient.email}` 
              : 'Client Management'}
          </h2>
          <p className="admin-client-subtitle">
            {selectedClient 
              ? `Client ID: ${selectedClient.uuid}` 
              : 'Select a client to manage their account, files and settings'}
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
                <UserList 
                  users={clients}
                  loading={loading}
                  error={error}
                  onViewDetails={handleClientSelect}
                />
              </Card>
            </div>
          ) : (
            /* Detail View with Tabs */
            <div className="admin-client-detail">
              {/* Tab Navigation */}
              <div className="admin-client-tabs">
                <button 
                  className={`admin-client-tab ${activeTab === 'files' ? 'active' : ''}`}
                  onClick={() => setActiveTab('files')}
                >
                  <i className="bi bi-folder me-2"></i>
                  Files
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
                    
                    {/* Workflows Preview Section */}
                    <div className="admin-client-preview-card">
                      <div className="admin-client-preview-header">
                        <h5 className="admin-client-preview-title">
                          <i className="bi bi-diagram-3 me-2 text-muted"></i>
                          Workflow Management
                        </h5>
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
                  
                  {/* Right Side - Tab Content */}
                  <div className="admin-client-content">
                    {activeTab === 'files' && (
                      <div className="admin-client-files fade-in">
                        {/* Client Folder Access */}
                        <ClientFolderAccess
                          client={selectedClient}
                          onSelectFolder={navigateToClientFiles}
                        />
                        
                        {/* All Files View */}
                        <div className="mt-4">
                          <UserAllFiles 
                            userId={selectedClient.uuid} 
                            userName={selectedClient.firstName || selectedClient.email}
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === 'profile' && (
                      <div className="admin-client-profile fade-in">
                        <Card title="Client Profile Details">
                          <div className="admin-client-profile-details">
                            <div className="admin-client-profile-section">
                              <h6 className="admin-client-section-title">Contact Information</h6>
                              <div className="admin-client-profile-grid">
                                <div className="admin-client-profile-field">
                                  <div className="admin-client-field-label">Email</div>
                                  <div className="admin-client-field-value">{selectedClient.email}</div>
                                </div>
                                <div className="admin-client-profile-field">
                                  <div className="admin-client-field-label">Phone</div>
                                  <div className="admin-client-field-value">{selectedClient.phoneNumber || 'Not provided'}</div>
                                </div>
                                <div className="admin-client-profile-field">
                                  <div className="admin-client-field-label">Company</div>
                                  <div className="admin-client-field-value">{selectedClient.companyName || 'Not provided'}</div>
                                </div>
                                <div className="admin-client-profile-field">
                                  <div className="admin-client-field-label">Preferred Contact</div>
                                  <div className="admin-client-field-value">{selectedClient.preferredContactMethod || 'Email'}</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="admin-client-profile-section">
                              <h6 className="admin-client-section-title">Account Information</h6>
                              <div className="admin-client-profile-grid">
                                <div className="admin-client-profile-field">
                                  <div className="admin-client-field-label">Name</div>
                                  <div className="admin-client-field-value">
                                    {(selectedClient.firstName && selectedClient.lastName) 
                                      ? `${selectedClient.firstName} ${selectedClient.lastName}`
                                      : 'Not provided'}
                                  </div>
                                </div>
                                <div className="admin-client-profile-field">
                                  <div className="admin-client-field-label">Client ID</div>
                                  <div className="admin-client-field-value">{selectedClient.uuid}</div>
                                </div>
                                <div className="admin-client-profile-field">
                                  <div className="admin-client-field-label">Created On</div>
                                  <div className="admin-client-field-value">
                                    {selectedClient.createdAt 
                                      ? new Date(selectedClient.createdAt).toLocaleDateString() 
                                      : 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="admin-client-profile-actions">
                            <button className="btn btn-primary">
                              <i className="bi bi-pencil me-2"></i>
                              Edit Profile
                            </button>
                          </div>
                        </Card>
                      </div>
                    )}

                    {activeTab === 'actions' && (
                      <div className="admin-client-actions fade-in">
                        <UserActionsCard user={selectedClient} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminClientManagerPage;