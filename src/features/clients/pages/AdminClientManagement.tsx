import React, { useState, useEffect } from 'react';
import Card from '@components/common/Card';
import AlertMessage from '@components/common/AlertMessage';
import LoadingSpinner from '@components/common/LoadingSpinner';
import UserList from '../components/UserList';
import UserActionsCard from '../components/UserActionsCard';
import ClientProfileCard from '../components/ClientProfileCard';
import ClientFolderAccess from '../components/ClientFolderAccess';
import { fetchAllClients } from '../services/clientService';
import { UserProfile } from '@/types';
import '../styles/adminclientmanagement.css';

const AdminClientManagerPage: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');
  
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
    if (client) {
      setView('detail');
    }
  };
  
  // Navigate back to client list
  const backToList = () => {
    setView('list');
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
  
  return (
    <div className="client-management-container">
      <div className="client-management-header">
        <h2 className="client-management-title">
          {view === 'list' ? 'Client Management' : 'Client Details'}
        </h2>
        {view === 'detail' && (
          <button 
            className="client-back-button"
            onClick={backToList}
          >
            <i className="bi bi-arrow-left"></i>
            Back to Client List
          </button>
        )}
      </div>
      
      {loading && clients.length === 0 ? (
        <div className="client-management-loading">
          <LoadingSpinner text="Loading clients..." />
        </div>
      ) : error ? (
        <div className="client-management-error">
          <AlertMessage 
            type="danger" 
            title="Error Loading Clients"
            message={error}
          />
        </div>
      ) : (
        <>
          {view === 'list' ? (
            /* List View */
            <div className="client-list-container">
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
            /* Detail View */
            selectedClient && (
              <div className="client-detail-grid">
                <div className="client-detail-sidebar">
                  {/* Client Profile Card */}
                  <div className="client-detail-card">
                    <ClientProfileCard
                      client={selectedClient}
                      onManageFiles={navigateToClientFiles}
                      onContactClient={handleContactClient}
                    />
                  </div>
                  
                  {/* Client Actions Card */}
                  <div className="client-detail-card">
                    <UserActionsCard user={selectedClient} />
                  </div>
                </div>
                
                <div className="client-detail-content">
                  {/* Client Folders Access */}
                  <ClientFolderAccess
                    client={selectedClient}
                    onSelectFolder={navigateToClientFiles}
                  />
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default AdminClientManagerPage;