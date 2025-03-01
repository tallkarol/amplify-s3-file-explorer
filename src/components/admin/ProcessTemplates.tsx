// src/components/admin/ProcessTemplates.tsx
import React from 'react';
import Card from '../common/Card';

interface ProcessTemplateProps {
  title: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  steps: number;
}

const ProcessTemplates: React.FC = () => {
  const templateData: ProcessTemplateProps[] = [
    {
      title: 'New Client Onboarding',
      description: 'Workflow for bringing new clients into the system',
      status: 'active',
      steps: 5
    },
    {
      title: 'Document Approval',
      description: 'Standard process for reviewing and approving documents',
      status: 'draft',
      steps: 3
    },
    {
      title: 'Periodic Account Review',
      description: 'Quarterly review of client accounts and documents',
      status: 'draft',
      steps: 4
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'secondary';
      default: return 'primary';
    }
  };

  return (
    <Card title="Process Templates" subtitle="Workflow Management (Coming Soon)">
      <div className="alert alert-info mb-3">
        <i className="bi bi-info-circle me-2"></i>
        Process Templates help standardize and automate your administrative workflows.
      </div>
      
      <div className="list-group">
        {templateData.map((template, index) => (
          <div 
            key={index} 
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
          >
            <div>
              <h6 className="mb-1">{template.title}</h6>
              <p className="text-muted small mb-1">{template.description}</p>
              <span 
                className={`badge bg-${getStatusColor(template.status)} me-2`}
              >
                {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
              </span>
              <span className="badge bg-secondary">{template.steps} Steps</span>
            </div>
            <div>
              <button 
                className="btn btn-sm btn-outline-primary me-2" 
                disabled
              >
                View Details
              </button>
              <button 
                className="btn btn-sm btn-outline-secondary" 
                disabled
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-3">
        <button className="btn btn-primary" disabled>
          <i className="bi bi-plus-circle me-2"></i>
          Create New Template
        </button>
      </div>
    </Card>
  );
};

export default ProcessTemplates;