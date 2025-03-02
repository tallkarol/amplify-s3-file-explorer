// src/components/admin/workflow/WorkflowTimeline.tsx
import React from 'react';

export interface WorkflowEvent {
  id: string;
  timestamp: string;
  type: 'notification' | 'task_created' | 'task_completed' | 'document_uploaded' | 'approval' | 'rejection' | 'comment';
  description: string;
  actor: string;
  metadata?: Record<string, any>;
}

interface WorkflowTimelineProps {
  events: WorkflowEvent[];
  title?: string;
}

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  events,
  title = "Workflow History"
}) => {
  // Helper function to get event type color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'notification': return 'info';
      case 'task_created': return 'primary';
      case 'task_completed': return 'success';
      case 'document_uploaded': return 'primary';
      case 'approval': return 'success';
      case 'rejection': return 'danger';
      case 'comment': return 'secondary';
      default: return 'primary';
    }
  };
  
  // Helper function to get event type icon
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'notification': return 'envelope';
      case 'task_created': return 'plus-circle';
      case 'task_completed': return 'check-circle';
      case 'document_uploaded': return 'file-earmark-arrow-up';
      case 'approval': return 'check2-all';
      case 'rejection': return 'x-circle';
      case 'comment': return 'chat-dots';
      default: return 'circle';
    }
  };
  
  if (events.length === 0) {
    return (
      <div className="text-center p-4">
        <i className="bi bi-hourglass text-muted fs-1 mb-3 d-block"></i>
        <p className="text-muted">No events recorded yet</p>
      </div>
    );
  }
  
  return (
    <div className="workflow-timeline mt-3">
      {title && <h6 className="mb-3">{title}</h6>}
      
      {events.map((event, index) => (
        <div key={event.id} className="timeline-item mb-3">
          <div className="d-flex">
            <div className="timeline-icon me-3">
              <div className={`bg-${getEventTypeColor(event.type)} bg-opacity-15 p-2 rounded-circle`}>
                <i className={`bi bi-${getEventTypeIcon(event.type)} text-${getEventTypeColor(event.type)}`}></i>
              </div>
              {index < events.length - 1 && (
                <div className="timeline-connector"></div>
              )}
            </div>
            <div className="timeline-content">
              <div className="d-flex justify-content-between align-items-start">
                <h6 className="mb-0">{event.description}</h6>
                <small className="text-muted">
                  {new Date(event.timestamp).toLocaleString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </small>
              </div>
              <p className="text-muted small mb-0">
                <span className={`text-${getEventTypeColor(event.type)}`}>{event.type.replace('_', ' ')}</span>
                {' by '}
                <span className="fw-medium">{event.actor}</span>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkflowTimeline;