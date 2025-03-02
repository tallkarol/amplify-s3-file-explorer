// src/components/admin/ClientDashboardWidget.tsx
import React from 'react';
import Card from '../components/common/Card';

interface ClientStatusData {
  name: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
  documentCount: number;
  lastActivity: string;
}

const ClientDashboardWidget: React.FC = () => {
  const clientData: ClientStatusData[] = [
    {
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      status: 'active',
      documentCount: 24,
      lastActivity: '2 days ago'
    },
    {
      name: 'Tech Innovations Inc.',
      email: 'support@techinnovations.com',
      status: 'pending',
      documentCount: 12,
      lastActivity: '1 week ago'
    },
    {
      name: 'Global Solutions',
      email: 'admin@globalsolutions.com',
      status: 'inactive',
      documentCount: 5,
      lastActivity: '3 weeks ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Card 
      title="Client Overview" 
      subtitle="Client Relationship Management (Prototype)"
    >
      <div className="alert alert-info mb-3">
        <i className="bi bi-info-circle me-2"></i>
        Manage and track client relationships across your document ecosystem.
      </div>
      
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Status</th>
              <th>Documents</th>
              <th>Last Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clientData.map((client, index) => (
              <tr key={index}>
                <td>
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                      <i className="bi bi-building text-primary"></i>
                    </div>
                    <div>
                      <div className="fw-bold">{client.name}</div>
                      <small className="text-muted">{client.email}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span 
                    className={`badge bg-${getStatusColor(client.status)}`}
                  >
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </td>
                <td>{client.documentCount}</td>
                <td>{client.lastActivity}</td>
                <td>
                  <div className="btn-group btn-group-sm" role="group">
                    <button 
                      className="btn btn-outline-primary" 
                      disabled
                    >
                      View
                    </button>
                    <button 
                      className="btn btn-outline-secondary" 
                      disabled
                    >
                      Manage
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="text-center mt-3">
        <button className="btn btn-primary" disabled>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Client
        </button>
      </div>
    </Card>
  );
};

export default ClientDashboardWidget;