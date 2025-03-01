// src/components/admin/WorkflowPlaceholder.tsx
import React from 'react';
import Card from '../common/Card';

interface WorkflowStep {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
}

const WorkflowPlaceholder: React.FC = () => {
  const workflowSteps: WorkflowStep[] = [
    {
      title: 'Initial Document Review',
      description: 'Review and categorize incoming documents',
      status: 'completed'
    },
    {
      title: 'Client Notification',
      description: 'Send automated notifications about document status',
      status: 'in-progress'
    },
    {
      title: 'Approval Process',
      description: 'Route documents to appropriate approval channels',
      status: 'pending'
    },
    {
      title: 'Final Archival',
      description: 'Store approved documents in secure archive',
      status: 'pending'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return { icon: 'check-circle', color: 'success' };
      case 'in-progress': return { icon: 'clock', color: 'warning' };
      case 'pending': return { icon: 'circle', color: 'secondary' };
      default: return { icon: 'dash-circle', color: 'secondary' };
    }
  };

  return (
    <Card 
      title="Workflow Automation" 
      subtitle="Streamline Document Processing (Coming Soon)"
    >
      <div className="alert alert-info mb-3">
        <i className="bi bi-info-circle me-2"></i>
        Automate and track your document processing workflows with intelligent routing.
      </div>
      
      <div className="workflow-timeline position-relative">
        {workflowSteps.map((step, index) => {
          const status = getStatusIcon(step.status);
          return (
            <div 
              key={index} 
              className={`workflow-step mb-3 p-3 border rounded ${
                step.status === 'in-progress' ? 'border-warning' : 
                step.status === 'completed' ? 'border-success' : 'border-secondary'
              }`}
            >
              <div className="d-flex align-items-center mb-2">
                <div 
                  className={`me-3 d-flex align-items-center text-${status.color}`}
                  style={{ fontSize: '1.5rem' }}
                >
                  <i className={`bi bi-${status.icon}`}></i>
                </div>
                <div>
                  <h6 className="mb-0">{step.title}</h6>
                  <small className={`text-${status.color}`}>
                    {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                  </small>
                </div>
              </div>
              <p className="text-muted mb-0">{step.description}</p>
            </div>
          );
        })}
      </div>
      
      <div className="text-center mt-3">
        <button className="btn btn-primary" disabled>
          <i className="bi bi-diagram-3 me-2"></i>
          Design New Workflow
        </button>
      </div>
    </Card>
  );
};

export default WorkflowPlaceholder;