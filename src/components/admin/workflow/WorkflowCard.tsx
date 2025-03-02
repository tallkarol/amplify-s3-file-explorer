// src/components/admin/workflow/WorkflowCard.tsx
import React from 'react';

export type WorkflowStatus = 'active' | 'paused' | 'completed' | 'blocked';
export type WorkflowPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WorkflowCardProps {
  id: string;
  title: string;
  description: string;
  client: string;
  status: WorkflowStatus;
  progress: number;
  startDate: string;
  dueDate?: string;
  priority: WorkflowPriority;
  onClick?: () => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  title,
  description,
  client,
  status,
  progress,
  startDate,
  dueDate,
  priority,
  onClick
}) => {
  // Helper functions for colors
  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      case 'blocked': return 'danger';
      default: return 'secondary';
    }
  };
  
  const getPriorityColor = (priority: WorkflowPriority) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };
  
  return (
    <div className="card h-100 workflow-card">
      <div className="card-body">
        <div className="d-flex justify-content-between mb-3">
          <h5 className="card-title mb-1">{title}</h5>
          <span className={`badge bg-${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        
        <p className="text-muted small mb-3">{description}</p>
        
        <div className="mb-3">
          <span className="fw-medium">Client:</span> {client}
        </div>
        
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="small text-muted">Progress</span>
            <span className="small">{progress}%</span>
          </div>
          <div className="progress" style={{ height: '6px' }}>
            <div 
              className={`progress-bar bg-${getStatusColor(status)}`} 
              role="progressbar" 
              style={{ width: `${progress}%` }} 
              aria-valuenow={progress} 
              aria-valuemin={0} 
              aria-valuemax={100}
            ></div>
          </div>
        </div>
        
        <div className="d-flex justify-content-between mb-3">
          <div>
            <span className="small text-muted d-block">Started</span>
            <span className="small">{startDate}</span>
          </div>
          {dueDate && (
            <div>
              <span className="small text-muted d-block">Due</span>
              <span className={`small ${status === 'blocked' ? 'text-danger fw-bold' : ''}`}>
                {dueDate}
              </span>
            </div>
          )}
          <div>
            <span className="small text-muted d-block">Priority</span>
            <span className={`badge bg-${getPriorityColor(priority)}`}>
              {priority}
            </span>
          </div>
        </div>
        
        {onClick && (
          <button 
            className="btn btn-sm btn-outline-primary w-100"
            onClick={onClick}
          >
            <i className="bi bi-eye me-1"></i>
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkflowCard;

