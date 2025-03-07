import React, { useState } from 'react';
import { Workflow } from '../components/WorkflowListView';
import { CERTIFICATION_STANDARDS } from '../constants/certificationStandards';
import { GENERIC_WORKFLOW_STAGES } from '../constants/workflowStages';
import StatusBadge from '@/components/common/StatusBadge';
import '../styles/workflow.css';

const UserWorkflowDashboard: React.FC = () => {
  // State for selected workflow when user wants to view details
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'timeline'>('overview');

  // Mock user information
  const user = {
    id: '1',
    name: 'John Doe',
    company: 'ACME Corp',
    email: 'acme@example.com',
  };

  // Mock workflows for this specific user
  const userWorkflows: Workflow[] = [
    {
      id: 'wf1',
      title: 'ACME Corp ISO 9001 Certification',
      client: 'John Doe',
      standard: 'iso-9001',
      status: 'active',
      progress: 65,
      startDate: '2025-02-28',
      dueDate: '2025-03-15',
      priority: 'high',
      stages: [
        'application', 
        'quote-generation', 
        'contract-signing', 
        'pre-audit-planning', 
        'auditor-assignment'
      ]
    },
    {
      id: 'wf2',
      title: 'ACME Corp ISO 14001 Initial Assessment',
      client: 'John Doe',
      standard: 'iso-14001',
      status: 'paused',
      progress: 25,
      startDate: '2025-03-01',
      dueDate: '2025-04-10',
      priority: 'medium',
      stages: [
        'application', 
        'quote-generation'
      ]
    }
  ];

  // Get the active workflow if one is selected
  const activeWorkflow = activeWorkflowId 
    ? userWorkflows.find(wf => wf.id === activeWorkflowId)
    : userWorkflows[0]; // Default to first workflow

  // Get standard details for the active workflow
  const activeStandard = CERTIFICATION_STANDARDS.find(s => s.id === activeWorkflow?.standard);

  // Get workflow stages for the active workflow
  const activeStages = GENERIC_WORKFLOW_STAGES.filter(
    stage => activeWorkflow?.stages?.includes(stage.id)
  );

  // Mock upcoming tasks
  const upcomingTasks = [
    {
      id: 't1',
      title: 'Upload Quality Manual',
      dueDate: '2025-03-10',
      status: 'pending',
      priority: 'high',
      description: 'Please upload your organization\'s Quality Management Manual.',
      workflowId: 'wf1'
    },
    {
      id: 't2',
      title: 'Complete Pre-Audit Questionnaire',
      dueDate: '2025-03-08',
      status: 'completed',
      priority: 'high',
      description: 'Fill out the pre-audit assessment form.',
      workflowId: 'wf1'
    },
    {
      id: 't3',
      title: 'Review Audit Schedule',
      dueDate: '2025-03-12',
      status: 'pending',
      priority: 'medium',
      description: 'Review and confirm the proposed audit schedule.',
      workflowId: 'wf1'
    }
  ].filter(task => task.workflowId === activeWorkflowId || !activeWorkflowId);

  // Mock document requirements
  const requiredDocuments = [
    {
      id: 'd1',
      title: 'Quality Manual',
      description: 'Complete quality management system documentation',
      required: true,
      uploaded: false,
      workflowId: 'wf1'
    },
    {
      id: 'd2',
      title: 'Process Maps',
      description: 'Visual representation of key business processes',
      required: true,
      uploaded: true,
      workflowId: 'wf1'
    },
    {
      id: 'd3',
      title: 'Internal Audit Reports',
      description: 'Results from recent internal quality audits',
      required: true,
      uploaded: false,
      workflowId: 'wf1'
    },
    {
      id: 'd4',
      title: 'Environmental Policy',
      description: 'Company environmental policy statement',
      required: true,
      uploaded: false,
      workflowId: 'wf2'
    }
  ].filter(doc => doc.workflowId === activeWorkflowId || !activeWorkflowId);

  // Mock timeline events
  const timelineEvents = [
    {
      id: 'e1',
      date: new Date('2025-02-28'),
      title: 'Certification Process Started',
      description: 'Application submitted and accepted',
      completed: true,
      workflowId: 'wf1'
    },
    {
      id: 'e2',
      date: new Date('2025-03-01'),
      title: 'Quote Generated',
      description: 'Certification cost quote provided',
      completed: true,
      workflowId: 'wf1'
    },
    {
      id: 'e3',
      date: new Date('2025-03-02'),
      title: 'Contract Signed',
      description: 'Certification agreement executed',
      completed: true,
      workflowId: 'wf1'
    },
    {
      id: 'e4',
      date: new Date('2025-03-10'),
      title: 'Document Submission Deadline',
      description: 'All required documentation must be submitted',
      completed: false,
      workflowId: 'wf1'
    },
    {
      id: 'e5',
      date: new Date('2025-03-15'),
      title: 'Stage 1 Audit',
      description: 'Initial documentation review audit',
      completed: false,
      workflowId: 'wf1'
    }
  ].filter(event => event.workflowId === activeWorkflowId || !activeWorkflowId);

  return (
    <div className="user-workflow-dashboard">
      {/* Welcome Header */}
      <div className="user-welcome-header">
        <div className="user-welcome-content">
          <h1 className="user-welcome-title">Welcome, {user.name}</h1>
          <p className="user-welcome-subtitle">{user.company}</p>
        </div>
      </div>

      <div className="workflow-dashboard-grid">
        {/* Sidebar - Workflow Selection */}
        <div className="workflow-sidebar">
          <div className="workflow-sidebar-header">
            <h2 className="workflow-sidebar-title">Your Certifications</h2>
          </div>

          <div className="workflow-sidebar-list">
            {userWorkflows.map(workflow => (
              <div 
                key={workflow.id} 
                className={`workflow-sidebar-item ${activeWorkflowId === workflow.id ? 'active' : ''}`}
                onClick={() => setActiveWorkflowId(workflow.id)}
              >
                <div className="workflow-sidebar-item-content">
                  <h3 className="workflow-sidebar-item-title">{activeStandard?.name || workflow.standard}</h3>
                  <div className="workflow-sidebar-item-subtitle">{workflow.title}</div>
                  <div className="workflow-sidebar-item-meta">
                    <StatusBadge status={workflow.status} type="status" />
                    <div className="workflow-sidebar-item-date">
                      Due: {workflow.dueDate ? new Date(workflow.dueDate).toLocaleDateString() : 'Not set'}
                    </div>
                  </div>
                  <div className="workflow-progress-container mt-2">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="workflow-main-content">
          {/* Workflow Detail Header */}
          <div className="workflow-detail-header">
            <div className="workflow-detail-header-content">
              <div className="workflow-detail-badge-container">
                <div className="workflow-detail-standard-badge">
                  {activeStandard?.name || activeWorkflow?.standard}
                </div>
                <StatusBadge status={activeWorkflow?.status || 'active'} type="status" />
              </div>
              <h2 className="workflow-detail-title">{activeWorkflow?.title}</h2>
            </div>
            <div className="workflow-detail-actions">
              <button className="workflow-button outline-secondary">
                <i className="bi bi-question-circle me-1"></i>
                Get Help
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="workflow-tabs mt-4">
            <button 
              className={`workflow-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-grid-1x2 me-2"></i>
              Overview
            </button>
            <button 
              className={`workflow-tab ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              <i className="bi bi-check2-square me-2"></i>
              Tasks
              <span className="workflow-tab-badge">
                {upcomingTasks.filter(t => t.status === 'pending').length}
              </span>
            </button>
            <button 
              className={`workflow-tab ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <i className="bi bi-file-earmark-text me-2"></i>
              Documents
              <span className="workflow-tab-badge">
                {requiredDocuments.filter(d => !d.uploaded).length}
              </span>
            </button>
            <button 
              className={`workflow-tab ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <i className="bi bi-calendar-event me-2"></i>
              Timeline
            </button>
          </div>

          {/* Tab Content */}
          <div className="workflow-tab-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <div className="workflow-overview-grid">
                  {/* Certification Info Card */}
                  <div className="workflow-detail-card">
                    <div className="workflow-detail-card-body">
                      <h6 className="workflow-detail-card-title">
                        <i className="bi bi-award me-2 text-primary"></i>
                        Certification Information
                      </h6>
                      <div className="workflow-detail-item">
                        <strong>Standard:</strong>
                        <span>{activeStandard?.name}</span>
                      </div>
                      <div className="workflow-detail-item">
                        <strong>Scope:</strong>
                        <span>Quality Management System</span>
                      </div>
                      <div className="workflow-detail-item">
                        <strong>Type:</strong>
                        <span>Initial Certification</span>
                      </div>
                      <div className="workflow-detail-badge-list">
                        {activeStandard?.industries.map(industry => (
                          <span key={industry} className="workflow-detail-industry-badge">
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className="workflow-detail-card">
                    <div className="workflow-detail-card-body">
                      <h6 className="workflow-detail-card-title">
                        <i className="bi bi-graph-up me-2 text-primary"></i>
                        Certification Progress
                      </h6>
                      <div className="workflow-detail-progress">
                        <div className="workflow-detail-item">
                          <strong>Status:</strong>
                          <StatusBadge status={activeWorkflow?.status || 'active'} type="status" />
                        </div>
                        <div className="workflow-detail-item">
                          <strong>Start Date:</strong>
                          <span>{activeWorkflow ? new Date(activeWorkflow.startDate).toLocaleDateString() : ''}</span>
                        </div>
                        <div className="workflow-detail-item">
                          <strong>Target Date:</strong>
                          <span>{activeWorkflow?.dueDate ? new Date(activeWorkflow.dueDate).toLocaleDateString() : 'Not set'}</span>
                        </div>
                        <div className="workflow-progress-container mt-3">
                          <div className="workflow-progress-track">
                            <div 
                              className={`workflow-progress-bar ${
                                (activeWorkflow?.progress || 0) < 25 ? 'danger' : 
                                (activeWorkflow?.progress || 0) < 50 ? 'warning' : 
                                (activeWorkflow?.progress || 0) < 75 ? 'info' : 
                                'success'
                              }`} 
                              style={{ width: `${activeWorkflow?.progress || 0}%` }}
                            >
                              <span className="workflow-progress-text">{activeWorkflow?.progress || 0}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Stage Card */}
                  <div className="workflow-detail-card">
                    <div className="workflow-detail-card-body">
                      <h6 className="workflow-detail-card-title">
                        <i className="bi bi-arrow-right-circle me-2 text-primary"></i>
                        Current Stage
                      </h6>
                      <div className="workflow-current-stage">
                        <div className="workflow-current-stage-badge">
                          <i className="bi bi-file-earmark-check"></i>
                        </div>
                        <div className="workflow-current-stage-content">
                          <h4 className="workflow-current-stage-name">Pre-audit Documentation</h4>
                          <p className="workflow-current-stage-description">
                            Submit all required documentation for pre-audit review.
                            Our auditors will assess your documentation before proceeding to the on-site audit.
                          </p>
                          <button className="workflow-button primary mt-3">
                            <i className="bi bi-arrow-right me-2"></i>
                            Go to Document Submission
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Tasks Preview */}
                  <div className="workflow-detail-card">
                    <div className="workflow-detail-card-body">
                      <h6 className="workflow-detail-card-title">
                        <i className="bi bi-calendar3 me-2 text-primary"></i>
                        Upcoming Tasks
                      </h6>
                      <ul className="workflow-task-list">
                        {upcomingTasks.slice(0, 3).map(task => (
                          <li key={task.id} className="workflow-task-item">
                            <div className="workflow-task-checkbox">
                              {task.status === 'completed' ? (
                                <i className="bi bi-check-circle-fill"></i>
                              ) : (
                                <i className="bi bi-circle"></i>
                              )}
                            </div>
                            <div className="workflow-task-content">
                              <div className="workflow-task-title">{task.title}</div>
                              <div className="workflow-task-due">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="workflow-task-priority">
                              <StatusBadge status={task.priority} type="priority" />
                            </div>
                          </li>
                        ))}
                      </ul>
                      <button className="workflow-link-button mt-2" onClick={() => setActiveTab('tasks')}>
                        View all tasks <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Certification Process Flow */}
                <div className="workflow-process-section mt-4">
                  <h6 className="workflow-section-title">
                    <i className="bi bi-diagram-3 me-2 text-primary"></i>
                    Certification Process
                  </h6>
                  <div className="workflow-process-flow">
                    {activeStages.map((stage, index) => (
                      <div 
                        key={stage.id} 
                        className={`workflow-process-step ${
                          index < 3 ? 'completed' : 
                          index === 3 ? 'active' : ''
                        }`}
                      >
                        <div className="workflow-process-step-number">
                          {index < 3 ? <i className="bi bi-check-lg"></i> : index + 1}
                        </div>
                        <div className="workflow-process-step-content">
                          <h6 className="workflow-process-step-title">{stage.title}</h6>
                        </div>
                        {index < activeStages.length - 1 && (
                          <div className={`workflow-process-connector ${index < 2 ? 'completed' : ''}`}></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="fade-in">
                <div className="workflow-section-header">
                  <h6 className="workflow-section-title">
                    <i className="bi bi-check2-square me-2 text-primary"></i>
                    Required Tasks
                  </h6>
                  <div className="workflow-section-actions">
                    <div className="workflow-filter">
                      <select className="workflow-select">
                        <option value="all">All Tasks</option>
                        <option value="pending">Pending Tasks</option>
                        <option value="completed">Completed Tasks</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="workflow-task-grid">
                  {upcomingTasks.map(task => (
                    <div key={task.id} className={`workflow-task-card ${task.status === 'completed' ? 'completed' : ''}`}>
                      <div className="workflow-task-card-header">
                        <StatusBadge status={task.priority} type="priority" />
                        <div className="workflow-task-due-date">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="workflow-task-card-body">
                        <div className="workflow-task-card-status">
                          {task.status === 'completed' ? (
                            <i className="bi bi-check-circle-fill"></i>
                          ) : (
                            <i className="bi bi-circle"></i>
                          )}
                        </div>
                        <div className="workflow-task-card-content">
                          <h5 className="workflow-task-card-title">{task.title}</h5>
                          <p className="workflow-task-card-description">{task.description}</p>
                        </div>
                      </div>
                      <div className="workflow-task-card-footer">
                        {task.status !== 'completed' ? (
                          <button className="workflow-button primary">Complete Task</button>
                        ) : (
                          <button className="workflow-button outline-success" disabled>
                            <i className="bi bi-check-lg me-1"></i>
                            Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="fade-in">
                <div className="workflow-section-header">
                  <h6 className="workflow-section-title">
                    <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                    Required Documentation
                  </h6>
                  <div className="workflow-section-actions">
                    <div className="workflow-filter">
                      <select className="workflow-select">
                        <option value="all">All Documents</option>
                        <option value="pending">Missing Documents</option>
                        <option value="uploaded">Uploaded Documents</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="workflow-document-list">
                  {requiredDocuments.map(doc => (
                    <div key={doc.id} className={`workflow-document-item ${doc.uploaded ? 'uploaded' : ''}`}>
                      <div className="workflow-document-icon">
                        <i className={`bi bi-file-earmark${doc.uploaded ? '-check' : ''}`}></i>
                      </div>
                      <div className="workflow-document-content">
                        <h5 className="workflow-document-title">{doc.title}</h5>
                        <p className="workflow-document-description">{doc.description}</p>
                        {doc.required && <div className="workflow-document-required-badge">Required</div>}
                      </div>
                      <div className="workflow-document-actions">
                        {doc.uploaded ? (
                          <>
                            <button className="workflow-button outline-success sm">
                              <i className="bi bi-check-lg me-1"></i>
                              Uploaded
                            </button>
                            <button className="workflow-button outline-secondary sm ms-2">
                              <i className="bi bi-arrow-repeat me-1"></i>
                              Replace
                            </button>
                          </>
                        ) : (
                          <button className="workflow-button primary">
                            <i className="bi bi-upload me-1"></i>
                            Upload
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="workflow-document-upload-section mt-4">
                  <div className="workflow-upload-dropzone">
                    <div className="workflow-upload-icon">
                      <i className="bi bi-cloud-arrow-up"></i>
                    </div>
                    <h5 className="workflow-upload-title">Drag and drop files here</h5>
                    <p className="workflow-upload-description">
                      Or click to browse your files
                    </p>
                    <button className="workflow-button secondary mt-2">
                      <i className="bi bi-folder me-1"></i>
                      Browse Files
                    </button>
                    <div className="workflow-upload-formats">
                      Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max 10MB)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="fade-in">
                <h6 className="workflow-section-title">
                  <i className="bi bi-calendar-event me-2 text-primary"></i>
                  Certification Timeline
                </h6>
                
                <div className="workflow-timeline">
                  {timelineEvents.map((event, index) => (
                    <div 
                      key={event.id} 
                      className={`workflow-timeline-item ${
                        index === 0 ? 'workflow-timeline-start' : 
                        index === timelineEvents.length - 1 ? 'workflow-timeline-end' : ''
                      } ${event.completed ? 'completed' : ''}`}
                    >
                      <div className="workflow-timeline-icon">
                        {event.completed ? (
                          <i className="bi bi-check-lg"></i>
                        ) : (
                          <i className="bi bi-circle"></i>
                        )}
                      </div>
                      <div className="workflow-timeline-content">
                        <h6 className="workflow-timeline-title">{event.title}</h6>
                        <p className="workflow-timeline-description">{event.description}</p>
                        <div className="workflow-timeline-date">
                          {event.date.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserWorkflowDashboard;