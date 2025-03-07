// src/pages/admin/AdminWorkflowManagement.tsx
import { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import { UserProfile } from '@/types';

// Define workflow types
interface WorkflowInstance {
  id: string;
  title: string;
  description: string;
  client: string;
  status: 'active' | 'paused' | 'completed' | 'blocked';
  progress: number;
  startDate: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  processesUsed: string[];
  events: WorkflowEvent[];
}

interface WorkflowEvent {
  id: string;
  timestamp: string;
  type: 'notification' | 'task_created' | 'task_completed' | 'document_uploaded' | 'approval' | 'rejection' | 'comment';
  description: string;
  actor: string;
  metadata?: Record<string, any>;
}

interface WorkflowTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignee: string;
  client: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  workflowId: string;
}

interface ProcessTemplate {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'archived';
  steps: ProcessStep[];
}

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  type: 'approval' | 'upload' | 'review' | 'notification' | 'task';
  assignedRole: 'admin' | 'client' | 'system';
  timeEstimate?: number; // in hours
}

const AdminWorkflowDashboard = () => {
  const [activeView, setActiveView] = useState<'workflows' | 'templates'>('workflows');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate | null>(null);
  const [showNewWorkflowModal, setShowNewWorkflowModal] = useState(false);
  const [showRequestTemplateModal, setShowRequestTemplateModal] = useState(false);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [processTemplates, setProcessTemplates] = useState<ProcessTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state for new workflow
  const [newWorkflowData, setNewWorkflowData] = useState({
    title: '',
    templateId: '',
    clientId: '',
    priority: 'medium',
    dueDate: '',
    notes: ''
  });
  
  // Form state for template request
  const [templateRequestData, setTemplateRequestData] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });
  
  useEffect(() => {
    // Fetch clients and process templates
    const fetchData = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch this data from the GraphQL API
        // For now, we'll use mock data
        
        // Mock client data
        const mockClients: UserProfile[] = [
          { id: '1', uuid: 'u1', email: 'acme@example.com', profileOwner: 'u1', firstName: 'Acme', lastName: 'Corporation' },
          { id: '2', uuid: 'u2', email: 'tech@example.com', profileOwner: 'u2', firstName: 'Tech', lastName: 'Innovations' },
          { id: '3', uuid: 'u3', email: 'global@example.com', profileOwner: 'u3', firstName: 'Global', lastName: 'Solutions' }
        ];
        
        setClients(mockClients);
        
        // Mock process templates data
        const mockProcessTemplates: ProcessTemplate[] = [
          {
            id: '1',
            title: 'New Client Onboarding',
            description: 'Process for bringing new clients into the system',
            status: 'active',
            steps: [
              { id: 's1', title: 'Welcome Email', description: 'Send automated welcome email with account details', type: 'notification', assignedRole: 'system' },
              { id: 's2', title: 'Document Request', description: 'Request initial required documents from client', type: 'task', assignedRole: 'admin' },
              { id: 's3', title: 'Document Upload', description: 'Client uploads requested documents', type: 'upload', assignedRole: 'client' },
              { id: 's4', title: 'Document Review', description: 'Review uploaded documents for completeness', type: 'review', assignedRole: 'admin' },
              { id: 's5', title: 'Account Activation', description: 'Activate client account with full access', type: 'approval', assignedRole: 'admin' }
            ]
          },
          {
            id: '2',
            title: 'Document Approval',
            description: 'Standard process for reviewing and approving documents',
            status: 'active',
            steps: [
              { id: 's1', title: 'Initial Review', description: 'Perform first-level document review', type: 'review', assignedRole: 'admin' },
              { id: 's2', title: 'Feedback', description: 'Provide feedback to client if changes needed', type: 'notification', assignedRole: 'admin' },
              { id: 's3', title: 'Final Approval', description: 'Final approval of document', type: 'approval', assignedRole: 'admin' }
            ]
          },
          {
            id: '3',
            title: 'Periodic Account Review',
            description: 'Quarterly review of client accounts and documents',
            status: 'active',
            steps: [
              { id: 's1', title: 'Notification', description: 'Notify client of upcoming review', type: 'notification', assignedRole: 'system' },
              { id: 's2', title: 'Document Inventory', description: 'Check for expired or outdated documents', type: 'review', assignedRole: 'admin' },
              { id: 's3', title: 'Request Updates', description: 'Request updated documents if needed', type: 'task', assignedRole: 'admin' },
              { id: 's4', title: 'Status Report', description: 'Generate account status report', type: 'task', assignedRole: 'admin' }
            ]
          }
        ];
        
        setProcessTemplates(mockProcessTemplates);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Sample data for active workflows
  const activeWorkflows: WorkflowInstance[] = [
    {
      id: '1',
      title: 'Acme Corp Onboarding',
      description: 'Initial onboarding process for Acme Corporation',
      client: 'Acme Corporation',
      status: 'active',
      progress: 65,
      startDate: '2025-02-28',
      dueDate: '2025-03-15',
      priority: 'high',
      processesUsed: ['New Client Onboarding'],
      events: [
        { id: 'e1', timestamp: '2025-02-28T09:00:00', type: 'notification', description: 'Welcome email sent', actor: 'System' },
        { id: 'e2', timestamp: '2025-02-28T10:15:00', type: 'task_created', description: 'Document request task created', actor: 'Admin' },
        { id: 'e3', timestamp: '2025-03-01T14:30:00', type: 'document_uploaded', description: 'Client uploaded certificate documents', actor: 'Client' }
      ]
    },
    {
      id: '2',
      title: 'Tech Innovations Document Review',
      description: 'Review of quarterly compliance documents',
      client: 'Tech Innovations Inc.',
      status: 'active',
      progress: 40,
      startDate: '2025-03-01',
      dueDate: '2025-03-10',
      priority: 'medium',
      processesUsed: ['Document Approval'],
      events: [
        { id: 'e1', timestamp: '2025-03-01T08:00:00', type: 'task_created', description: 'Initial document review task created', actor: 'Admin' },
        { id: 'e2', timestamp: '2025-03-02T13:45:00', type: 'comment', description: 'Documents need signature on page 3', actor: 'Admin' }
      ]
    },
    {
      id: '3',
      title: 'Global Solutions Account Review',
      description: 'Quarterly account review and document verification',
      client: 'Global Solutions',
      status: 'blocked',
      progress: 80,
      startDate: '2025-02-15',
      dueDate: '2025-03-05',
      priority: 'urgent',
      processesUsed: ['Periodic Account Review'],
      events: [
        { id: 'e1', timestamp: '2025-02-15T10:00:00', type: 'notification', description: 'Review notification sent', actor: 'System' },
        { id: 'e2', timestamp: '2025-02-17T09:30:00', type: 'task_completed', description: 'Document inventory completed', actor: 'Admin' },
        { id: 'e3', timestamp: '2025-02-22T14:15:00', type: 'task_created', description: 'Request for updated certificates', actor: 'Admin' },
        { id: 'e4', timestamp: '2025-02-28T16:00:00', type: 'comment', description: 'Waiting for client response on certificate request', actor: 'Admin' }
      ]
    }
  ];
  
  // Sample data for tasks
  const tasks: WorkflowTask[] = [
    {
      id: '1',
      title: 'Review uploaded certificates',
      status: 'pending',
      assignee: 'You',
      client: 'Acme Corporation',
      dueDate: 'Today',
      priority: 'high',
      workflowId: '1'
    },
    {
      id: '2',
      title: 'Approve audit report',
      status: 'in_progress',
      assignee: 'You',
      client: 'Tech Innovations Inc.',
      dueDate: 'Tomorrow',
      priority: 'medium',
      workflowId: '2'
    },
    {
      id: '3',
      title: 'Follow up on missing documents',
      status: 'overdue',
      assignee: 'You',
      client: 'Global Solutions',
      dueDate: 'Yesterday',
      priority: 'urgent',
      workflowId: '3'
    },
    {
      id: '4',
      title: 'Schedule quarterly review call',
      status: 'pending',
      assignee: 'You',
      client: 'Reliable Partners',
      dueDate: 'Next Week',
      priority: 'low',
      workflowId: '3'
    },
    {
      id: '5',
      title: 'Initial document classification',
      status: 'completed',
      assignee: 'You',
      client: 'New Startup LLC',
      dueDate: 'Completed',
      priority: 'medium',
      workflowId: '1'
    }
  ];
  
  // Get status and priority badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      case 'blocked': return 'danger';
      case 'pending': return 'secondary';
      case 'in_progress': return 'primary';
      case 'overdue': return 'danger';
      default: return 'secondary';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };
  
  // Handle starting a new workflow
  const handleStartWorkflow = () => {
    // In a real app, this would call an API to create a new workflow
    console.log('Creating new workflow with data:', newWorkflowData);
    // Reset form and close modal
    setNewWorkflowData({
      title: '',
      templateId: '',
      clientId: '',
      priority: 'medium',
      dueDate: '',
      notes: ''
    });
    setShowNewWorkflowModal(false);
    // You would then refresh the workflows list
  };
  
  // Handle requesting a new template
  const handleRequestTemplate = () => {
    // In a real app, this would create a support ticket
    console.log('Creating template request:', templateRequestData);
    // Reset form and close modal
    setTemplateRequestData({
      title: '',
      description: '',
      priority: 'medium'
    });
    setShowRequestTemplateModal(false);
    // Show success message or redirect
  };
  
  // Render workflow timeline visualization
  const renderWorkflowTimeline = (workflow: WorkflowInstance) => {
    return (
      <div className="workflow-timeline mt-3">
        <h6 className="mb-3">Workflow History</h6>
        {workflow.events.map((event, index) => (
          <div key={event.id} className="timeline-item mb-3">
            <div className="d-flex">
              <div className="timeline-icon me-3">
                <div className={`bg-${getEventTypeColor(event.type)} bg-opacity-15 p-2 rounded-circle`}>
                  <i className={`bi bi-${getEventTypeIcon(event.type)} text-${getEventTypeColor(event.type)}`}></i>
                </div>
                {index < workflow.events.length - 1 && (
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
  
  // Render process template steps
  const renderProcessSteps = (template: ProcessTemplate) => {
    return (
      <div className="process-steps mt-3">
        <h6 className="mb-3">Process Steps</h6>
        {template.steps.map((step, index) => (
          <div key={step.id} className="process-step mb-3">
            <div className="d-flex">
              <div className="step-number me-3">
                <div className="bg-primary bg-opacity-15 p-2 rounded-circle text-center" style={{ width: '40px', height: '40px' }}>
                  <span className="fw-bold">{index + 1}</span>
                </div>
                {index < template.steps.length - 1 && (
                  <div className="step-connector"></div>
                )}
              </div>
              <div className="step-content">
                <div className="d-flex justify-content-between align-items-start">
                  <h6 className="mb-0">{step.title}</h6>
                  <span className={`badge bg-${getStepTypeColor(step.type)}`}>
                    {step.type}
                  </span>
                </div>
                <p className="text-muted small mb-2">{step.description}</p>
                <div className="d-flex align-items-center">
                  <span className="badge bg-light text-dark me-2">
                    <i className="bi bi-person me-1"></i>
                    {step.assignedRole}
                  </span>
                  {step.timeEstimate && (
                    <span className="badge bg-light text-dark">
                      <i className="bi bi-clock me-1"></i>
                      {step.timeEstimate} {step.timeEstimate === 1 ? 'hour' : 'hours'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Helper function to get step type color
  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'approval': return 'success';
      case 'upload': return 'primary';
      case 'review': return 'info';
      case 'notification': return 'secondary';
      case 'task': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border" role="status" aria-hidden="true"></div>
        <span className="ms-2">Loading...</span>
      </div>
    );
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Workflow Management (preview)</h2>
        <div className="btn-group">
          <button 
            className={`btn btn-${activeView === 'workflows' ? 'primary' : 'outline-primary'}`}
            onClick={() => setActiveView('workflows')}
          >
            <i className="bi bi-diagram-3 me-1"></i>
            Active Workflows
          </button>
          <button 
            className={`btn btn-${activeView === 'templates' ? 'primary' : 'outline-primary'}`}
            onClick={() => setActiveView('templates')}
          >
            <i className="bi bi-file-earmark-text me-1"></i>
            Process Templates
          </button>
        </div>
      </div>
      
      {activeView === 'workflows' && (
        <div className="row g-4">
          <div className="col-12">
            <Card title="Active Workflows" subtitle="Monitor and manage ongoing workflow instances">
              <div className="d-flex justify-content-end mb-3">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowNewWorkflowModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Start New Workflow
                </button>
              </div>
              
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Workflow</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeWorkflows.map(workflow => (
                      <tr key={workflow.id}>
                        <td>
                          <div className="fw-medium">{workflow.title}</div>
                          <small className="text-muted">{workflow.description}</small>
                        </td>
                        <td>{workflow.client}</td>
                        <td>
                          <span className={`badge bg-${getStatusColor(workflow.status)}`}>
                            {workflow.status}
                          </span>
                        </td>
                        <td>
                          <div className="progress" style={{ height: '10px' }}>
                            <div 
                              className={`progress-bar bg-${getStatusColor(workflow.status)}`} 
                              role="progressbar" 
                              style={{ width: `${workflow.progress}%` }} 
                              aria-valuenow={workflow.progress} 
                              aria-valuemin={0} 
                              aria-valuemax={100}
                            ></div>
                          </div>
                          <small className="text-muted">{workflow.progress}%</small>
                        </td>
                        <td>
                          {workflow.dueDate ? new Date(workflow.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <span className={`badge bg-${getPriorityColor(workflow.priority)}`}>
                            {workflow.priority}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => setSelectedWorkflow(workflow)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          
          {/* Tasks moved under active workflows */}
          <div className="col-12">
            <Card title="Current Tasks" subtitle="Workflow tasks that need your attention">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.filter(task => task.status !== 'completed').map(task => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td>{task.client}</td>
                        <td>
                          <span className={`badge bg-${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={task.status === 'overdue' ? 'text-danger fw-bold' : ''}>
                          {task.dueDate}
                        </td>
                        <td>
                          <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-success">
                              <i className="bi bi-check2"></i>
                            </button>
                            <button className="btn btn-outline-primary">
                              <i className="bi bi-arrow-right"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      {activeView === 'templates' && (
        <div className="row g-4">
          <div className="col-12 mb-4">
            <Card title="Process Templates Library">
              <div className="alert alert-info mb-4">
                <div className="d-flex">
                  <i className="bi bi-info-circle-fill fs-4 me-3 text-primary"></i>
                  <div>
                    <p className="mb-2"><strong>About Process Templates</strong></p>
                    <p className="mb-2">
                      Process templates are pre-defined workflows created by your development team. 
                      Each template consists of steps that guide you through common business processes 
                      systematically and efficiently.
                    </p>
                    <p className="mb-0">
                      Need a custom process template? Use the "Request a Template" button to submit 
                      your requirements to our development team.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="d-flex justify-content-end mb-3">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowRequestTemplateModal(true)}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Request a Template
                </button>
              </div>
              
              <div className="list-group">
                {processTemplates.map(template => (
                  <div 
                    key={template.id} 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <h6 className="mb-1">{template.title}</h6>
                      <p className="text-muted small mb-1">{template.description}</p>
                      <div>
                        <span 
                          className={`badge bg-${template.status === 'active' ? 'success' : 'secondary'} me-2`}
                        >
                          {template.status}
                        </span>
                        <span className="badge bg-secondary">
                          {template.steps.length} Steps
                        </span>
                      </div>
                    </div>
                    <div>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
      
      {/* New Workflow Modal */}
      {showNewWorkflowModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1040,
          display: 'block'
        }}>
          <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Start New Workflow</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowNewWorkflowModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="templateId" className="form-label">Process Template</label>
                    <select 
                      className="form-select" 
                      id="templateId"
                      value={newWorkflowData.templateId}
                      onChange={(e) => setNewWorkflowData({...newWorkflowData, templateId: e.target.value})}
                      required
                    >
                      <option value="">Select a template</option>
                      {processTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.title}
                        </option>
                      ))}
                    </select>
                    <div className="form-text">Choose the process template to use for this workflow</div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="clientId" className="form-label">Assign to Client</label>
                    <select 
                      className="form-select" 
                      id="clientId"
                      value={newWorkflowData.clientId}
                      onChange={(e) => setNewWorkflowData({...newWorkflowData, clientId: e.target.value})}
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.firstName} {client.lastName} ({client.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col">
                      <label htmlFor="priority" className="form-label">Priority</label>
                      <select 
                        className="form-select" 
                        id="priority"
                        value={newWorkflowData.priority}
                        onChange={(e) => setNewWorkflowData({...newWorkflowData, priority: e.target.value})}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="col">
                      <label htmlFor="dueDate" className="form-label">Due Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        id="dueDate"
                        value={newWorkflowData.dueDate}
                        onChange={(e) => setNewWorkflowData({...newWorkflowData, dueDate: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="notes" className="form-label">Additional Notes</label>
                    <textarea 
                      className="form-control" 
                      id="notes"
                      rows={3}
                      value={newWorkflowData.notes}
                      onChange={(e) => setNewWorkflowData({...newWorkflowData, notes: e.target.value})}
                      placeholder="Add any special instructions or context"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => setShowNewWorkflowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleStartWorkflow}
                    disabled={!newWorkflowData.title || !newWorkflowData.templateId || !newWorkflowData.clientId}
                  >
                    Start Workflow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Request Template Modal */}
      {showRequestTemplateModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1040,
          display: 'block'
        }}>
          <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Request Process Template</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowRequestTemplateModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    This will create a support ticket for our development team to create a new process template.
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="requestTitle" className="form-label">Template Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="requestTitle"
                      value={templateRequestData.title}
                      onChange={(e) => setTemplateRequestData({...templateRequestData, title: e.target.value})}
                      placeholder="E.g., Contract Renewal Process"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="requestDescription" className="form-label">Description & Requirements</label>
                    <textarea 
                      className="form-control" 
                      id="requestDescription"
                      rows={5}
                      value={templateRequestData.description}
                      onChange={(e) => setTemplateRequestData({...templateRequestData, description: e.target.value})}
                      placeholder="Describe the business process you need to automate. Include key steps, approvals required, notifications needed, etc."
                      required
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="requestPriority" className="form-label">Priority</label>
                    <select 
                      className="form-select" 
                      id="requestPriority"
                      value={templateRequestData.priority}
                      onChange={(e) => setTemplateRequestData({...templateRequestData, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => setShowRequestTemplateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleRequestTemplate}
                    disabled={!templateRequestData.title || !templateRequestData.description}
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1040,
          display: 'block'
        }}>
          <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Workflow Details</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setSelectedWorkflow(null)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h5 className="mb-3">{selectedWorkflow.title}</h5>
                      <p className="text-muted mb-3">{selectedWorkflow.description}</p>
                      
                      <div className="mb-3">
                        <strong>Status:</strong>{' '}
                        <span className={`badge bg-${getStatusColor(selectedWorkflow.status)}`}>
                          {selectedWorkflow.status}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Client:</strong> {selectedWorkflow.client}
                      </div>
                      
                      <div className="mb-3">
                        <strong>Started:</strong> {new Date(selectedWorkflow.startDate).toLocaleDateString()}
                      </div>
                      
                      {selectedWorkflow.dueDate && (
                        <div className="mb-3">
                          <strong>Due Date:</strong> {new Date(selectedWorkflow.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <strong>Priority:</strong>{' '}
                        <span className={`badge bg-${getPriorityColor(selectedWorkflow.priority)}`}>
                          {selectedWorkflow.priority}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Processes Used:</strong> {selectedWorkflow.processesUsed.join(', ')}
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="card border-0 bg-light h-100">
                        <div className="card-body">
                          <h6 className="card-title">Progress</h6>
                          <div className="progress mb-3" style={{ height: '20px' }}>
                            <div 
                              className={`progress-bar bg-${getStatusColor(selectedWorkflow.status)}`} 
                              role="progressbar" 
                              style={{ width: `${selectedWorkflow.progress}%` }} 
                              aria-valuenow={selectedWorkflow.progress} 
                              aria-valuemin={0} 
                              aria-valuemax={100}
                            >
                              {selectedWorkflow.progress}%
                            </div>
                          </div>
                          
                          <h6 className="card-title mt-4">Related Tasks</h6>
                          <ul className="list-group list-group-flush">
                            {tasks
                              .filter(task => task.workflowId === selectedWorkflow.id)
                              .map(task => (
                                <li key={task.id} className="list-group-item bg-transparent px-0">
                                  <div className="d-flex justify-content-between">
                                    <div>{task.title}</div>
                                    <span className={`badge bg-${getStatusColor(task.status)}`}>
                                      {task.status}
                                    </span>
                                  </div>
                                  <small className="text-muted">Due: {task.dueDate}</small>
                                </li>
                              ))
                            }
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Workflow Timeline */}
                  {renderWorkflowTimeline(selectedWorkflow)}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => setSelectedWorkflow(null)}
                  >
                    Close
                  </button>
                  {selectedWorkflow.status !== 'completed' && (
                    <>
                      <button 
                        type="button" 
                        className="btn btn-outline-primary me-2"
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-primary"
                      >
                        <i className="bi bi-arrow-right-circle me-1"></i>
                        Advance Workflow
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Process Template Detail Modal */}
      {selectedTemplate && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1040,
          display: 'block'
        }}>
          <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Process Template</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setSelectedTemplate(null)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-4">
                    <h5 className="mb-3">{selectedTemplate.title}</h5>
                    <p className="text-muted mb-3">{selectedTemplate.description}</p>
                    
                    <div className="d-flex gap-3 mb-3">
                      <div>
                        <span className={`badge bg-${selectedTemplate.status === 'active' ? 'success' : 'secondary'}`}>
                          {selectedTemplate.status}
                        </span>
                      </div>
                      <div>
                        <i className="bi bi-list-check me-1"></i>
                        {selectedTemplate.steps.length} steps
                      </div>
                    </div>
                  </div>
                  
                  {/* Process Steps Visualization */}
                  {renderProcessSteps(selectedTemplate)}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => setSelectedTemplate(null)}
                  >
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setShowNewWorkflowModal(true);
                      setNewWorkflowData({
                        ...newWorkflowData,
                        templateId: selectedTemplate.id,
                        title: `New ${selectedTemplate.title}`
                      });
                    }}
                  >
                    <i className="bi bi-play-circle me-1"></i>
                    Use This Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkflowDashboard;