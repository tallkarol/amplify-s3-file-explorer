import React, { useState } from 'react';
import { Workflow } from './WorkflowListView';
import { CERTIFICATION_STANDARDS } from '../constants/certificationStandards';
import { GENERIC_WORKFLOW_STAGES } from '../constants/workflowStages';
import StatusBadge from '@/components/common/StatusBadge';
import '../styles/workflow.css';

interface WorkflowDetailViewProps {
  workflow: Workflow;
  onClose: () => void;
  onEditWorkflow: (workflow: Workflow) => void;
}

const WorkflowDetailView: React.FC<WorkflowDetailViewProps> = ({ 
  workflow, 
  onClose, 
  onEditWorkflow 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stages' | 'timeline' | 'documents'>('overview');

  // Get standard details
  const standard = CERTIFICATION_STANDARDS.find(s => s.id === workflow.standard);

  // Get active workflow stages
  const activeStages = GENERIC_WORKFLOW_STAGES.filter(stage => 
    workflow.stages?.includes(stage.id)
  );

  // Simulate workflow events (placeholder)
  const workflowEvents = [
    {
      id: 'e1',
      date: new Date(workflow.startDate),
      type: 'start',
      title: 'Workflow Initiated',
      description: 'Workflow for client started'
    },
    {
      id: 'e2',
      date: new Date(workflow.startDate),
      type: 'milestone',
      title: 'Quote Generation',
      description: 'Preliminary quote created'
    },
    {
      id: 'e3',
      date: new Date(new Date(workflow.startDate).getTime() + 86400000), // Next day
      type: 'milestone',
      title: 'Contract Signing',
      description: 'Client approved the quote and signed contract'
    }
  ];

  return (
    <div className="workflow-modal-backdrop">
      <div className="workflow-modal workflow-detail-modal">
        <div className="workflow-modal-content">
          {/* Modal Header */}
          <div className="workflow-modal-header">
            <div className="workflow-modal-header-content">
              <h5 className="workflow-modal-title">
                <i className="bi bi-diagram-3 me-2"></i>
                {workflow.title}
              </h5>
              <div className="workflow-modal-subtitle">
                {standard?.name || workflow.standard}
              </div>
            </div>
            <div className="workflow-modal-actions">
              <button 
                className="workflow-button outline" 
                onClick={() => onEditWorkflow(workflow)}
              >
                <i className="bi bi-pencil me-1"></i>
                Edit
              </button>
              <button 
                type="button" 
                className="workflow-close-button" 
                onClick={onClose}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* Modal Body with Tabs */}
          <div className="workflow-modal-body workflow-detail-body p-0">
            {/* Navigation Tabs */}
            <div className="workflow-tabs">
              {[
                { id: 'overview', icon: 'info-circle', label: 'Overview' },
                { id: 'stages', icon: 'list-task', label: 'Workflow Stages' },
                { id: 'timeline', icon: 'clock-history', label: 'Timeline' },
                { id: 'documents', icon: 'file-earmark-text', label: 'Documents' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  className={`workflow-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <i className={`bi bi-${tab.icon} me-2`}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="workflow-tab-content">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="workflow-card-grid fade-in">
                  <div className="workflow-detail-card">
                    <div className="workflow-detail-card-body">
                      <h6 className="workflow-detail-card-title">
                        <i className="bi bi-info-circle me-2 text-primary"></i>
                        Workflow Details
                      </h6>
                      <div className="workflow-detail-item">
                        <strong>Status:</strong>
                        <StatusBadge 
                          status={workflow.status} 
                          type="status" 
                        />
                      </div>
                      <div className="workflow-detail-item">
                        <strong>Priority:</strong>
                        <StatusBadge 
                          status={workflow.priority} 
                          type="priority" 
                        />
                      </div>
                      <div className="workflow-detail-item">
                        <strong>Start Date:</strong>
                        <span>{new Date(workflow.startDate).toLocaleDateString()}</span>
                      </div>
                      {workflow.dueDate && (
                        <div className="workflow-detail-item">
                          <strong>Due Date:</strong>
                          <span>{new Date(workflow.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="workflow-detail-card">
                    <div className="workflow-detail-card-body">
                      <h6 className="workflow-detail-card-title">
                        <i className="bi bi-building me-2 text-primary"></i>
                        Client Information
                      </h6>
                      <div className="workflow-detail-item">
                        <strong>Name:</strong>
                        <span>{workflow.client}</span>
                      </div>
                      <div className="workflow-detail-item">
                        <strong>Certification:</strong>
                        <span>{standard?.name || workflow.standard}</span>
                      </div>
                      <div className="workflow-detail-item">
                        <strong>Industries:</strong>
                        <span>{standard?.industries.join(', ') || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="workflow-detail-card">
                    <div className="workflow-detail-card-body">
                      <h6 className="workflow-detail-card-title">
                        <i className="bi bi-graph-up me-2 text-primary"></i>
                        Progress
                      </h6>
                      <div className="workflow-progress-container">
                        <div className="workflow-progress-track">
                          <div 
                            className={`workflow-progress-bar ${
                              workflow.progress < 25 ? 'danger' : 
                              workflow.progress < 50 ? 'warning' : 
                              workflow.progress < 75 ? 'info' : 
                              'success'
                            }`} 
                            style={{ width: `${workflow.progress}%` }}
                          >
                            <span className="workflow-progress-text">{workflow.progress}%</span>
                          </div>
                        </div>
                        <div className="workflow-progress-labels">
                          <span>Start</span>
                          <span>Complete</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Workflow Stages Tab */}
              {activeTab === 'stages' && (
                <div className="fade-in">
                  <h6 className="workflow-section-title">
                    <i className="bi bi-list-task me-2 text-primary"></i>
                    Workflow Stages
                  </h6>
                  <div className="workflow-stage-list">
                    {activeStages.map((stage, index) => (
                      <div key={stage.id} className="workflow-stage-display-card">
                        <div className="workflow-stage-number">{index + 1}</div>
                        <div className="workflow-stage-display-content">
                          <h6 className="workflow-stage-display-title">{stage.title}</h6>
                          <p className="workflow-stage-display-description">{stage.description}</p>
                        </div>
                        <div className="workflow-stage-status">
                          <StatusBadge 
                            status={index === 0 ? "active" : index < 2 ? "completed" : "pending"} 
                            type="status" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="fade-in">
                  <h6 className="workflow-section-title">
                    <i className="bi bi-clock-history me-2 text-primary"></i>
                    Workflow Timeline
                  </h6>
                  <div className="workflow-timeline">
                    {workflowEvents.map((event, index) => (
                      <div 
                        key={event.id} 
                        className={`workflow-timeline-item ${
                          index === 0 ? 'workflow-timeline-start' : 
                          index === workflowEvents.length - 1 ? 'workflow-timeline-end' : ''
                        }`}
                      >
                        <div className="workflow-timeline-icon">
                          <i className={`bi bi-${
                            event.type === 'start' ? 'play-circle' : 
                            event.type === 'milestone' ? 'flag' : 
                            'circle'
                          }`}></i>
                        </div>
                        <div className="workflow-timeline-content">
                          <h6 className="workflow-timeline-title">{event.title}</h6>
                          <p className="workflow-timeline-description">{event.description}</p>
                          <div className="workflow-timeline-date">
                            {event.date.toLocaleDateString()} at {event.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="fade-in">
                  <h6 className="workflow-section-title">
                    <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                    Associated Documents
                  </h6>
                  <div className="workflow-info-alert">
                    <i className="bi bi-info-circle me-2"></i>
                    No documents have been uploaded for this workflow yet.
                  </div>
                  <div className="workflow-document-upload">
                    <button className="workflow-button secondary workflow-upload-btn">
                      <i className="bi bi-cloud-arrow-up me-2"></i>
                      Upload Document
                    </button>
                    <span className="workflow-upload-hint">Supported formats: PDF, DOCX, XLSX, JPG, PNG (Max: 10MB)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="workflow-modal-footer">
            <div className="workflow-footer-left">
              <span className="workflow-footer-info">
                <i className="bi bi-clock me-1"></i>
                Last updated: {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="workflow-footer-right">
              <button 
                type="button" 
                className="workflow-button secondary" 
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDetailView;