// src/features/clients/pages/AdminClientManagerPage.tsx

import React, { useState, useEffect } from 'react';
import Card from '@components/common/Card';
import AlertMessage from '@components/common/AlertMessage';
import LoadingSpinner from '@components/common/LoadingSpinner';
import UserList from '../components/UserList'; // Using existing component
import UserActionsCard from '../components/UserActionsCard'; // Using existing component
import ClientProfileCard from '../components/ClientProfileCard';
import ClientFolderAccess from '../components/ClientFolderAccess';
import { fetchAllClients } from '../services/clientService';
import { UserProfile } from '../../../types';

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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          {view === 'list' ? 'Client Management' : 'Client Details'}
        </h2>
        {view === 'detail' && (
          <button 
            className="btn btn-outline-secondary"
            onClick={backToList}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Back to Client List
          </button>
        )}
      </div>
      
      {loading && clients.length === 0 ? (
        <div className="text-center py-5">
          <LoadingSpinner text="Loading clients..." />
        </div>
      ) : error ? (
        <AlertMessage 
          type="danger" 
          title="Error Loading Clients"
          message={error}
        />
      ) : (
        <>
          {view === 'list' ? (
            /* List View */
            <Card>
              <UserList 
                users={clients}
                loading={loading}
                error={error}
                onViewDetails={handleClientSelect}
              />
            </Card>
          ) : (
            /* Detail View */
            selectedClient && (
              <div className="row">
                <div className="col-lg-4 mb-4">
                  {/* Client Profile Card */}
                  <ClientProfileCard
                    client={selectedClient}
                    onManageFiles={navigateToClientFiles}
                    onContactClient={handleContactClient}
                  />
                  
                  {/* Client Actions Card */}
                  <UserActionsCard user={selectedClient} />
                </div>
                
                <div className="col-lg-8">
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