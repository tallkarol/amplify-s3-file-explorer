// src/features/clients/components/ClientProfileCard.tsx
import React from 'react';
import Card from '@/components/common/Card';
import { UserProfile } from '@/types';

interface ClientProfileCardProps {
  client: UserProfile;
  onManageFiles: () => void;
  onContactClient: () => void;
}

const ClientProfileCard: React.FC<ClientProfileCardProps> = ({
  client,
  onContactClient
}) => {
  return (
    <Card className="mb-4">
      <div className="mb-4">
        <h4 className="mb-1">
          {client.firstName && client.lastName 
            ? `${client.firstName} ${client.lastName}` 
            : client.email}
        </h4>
        {(client.firstName || client.lastName) && (
          <p className="text-muted mb-2">{client.email}</p>
        )}
        {client.companyName && (
          <p className="text-muted mb-2">
            <i className="bi bi-building me-1"></i>
            {client.companyName}
          </p>
        )}
        {client.createdAt && (
          <div className="badge bg-light text-dark mb-2">
            <i className="bi bi-calendar me-1"></i>
            Client since {new Date(client.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>
      
      <div className="border-top pt-3">
        <h6 className="mb-3">Contact Information</h6>
        <div className="mb-2">
          <div className="text-muted small">Email</div>
          <div>{client.email}</div>
        </div>
        <div className="mb-2">
          <div className="text-muted small">Phone</div>
          <div>{client.phoneNumber || 'Not provided'}</div>
        </div>
        <div className="mb-2">
          <div className="text-muted small">Preferred Contact Method</div>
          <div className="badge bg-primary">
            {client.preferredContactMethod || 'Email'}
          </div>
        </div>
        <div className="mb-2">
          <div className="text-muted small">Client ID</div>
          <div className="text-muted small font-monospace">{client.uuid}</div>
        </div>
        <div className="mb-2">
          <div className="text-muted small">Last Login</div>
          <div>
            {client.lastLogin 
              ? new Date(client.lastLogin).toLocaleString()
              : <span className="text-muted">Never</span>}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="d-grid gap-2">
          <button 
            className="btn btn-outline-secondary"
            onClick={onContactClient}
          >
            <i className="bi bi-envelope me-1"></i>
            Contact Client
          </button>
        </div>
      </div>
    </Card>
  );
};

export default ClientProfileCard;