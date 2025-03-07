import React, { useState } from 'react';
import WorkflowListView, { Workflow } from '../components/WorkflowListView';
import WorkflowCreationModal from '../components/WorkflowCreationModal';
import WorkflowDetailView from '../components/WorkflowDetailView';
import { UserProfile } from '@/types';

const AdminWorkflowDashboard: React.FC = () => {
  // Mock clients for workflow creation
  const mockClients: UserProfile[] = [
    { 
      id: '1', 
      uuid: 'u1', 
      email: 'acme@example.com', 
      firstName: 'John', 
      lastName: 'Doe', 
      profileOwner: 'u1' 
    },
    { 
      id: '2', 
      uuid: 'u2', 
      email: 'techcorp@example.com', 
      firstName: 'Jane', 
      lastName: 'Smith', 
      profileOwner: 'u2' 
    }
  ];

  // Initial mock workflows
  const [workflows, setWorkflows] = useState<Workflow[]>([
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
      title: 'TechCorp ISO 14001 Recertification',
      client: 'Jane Smith',
      standard: 'iso-14001',
      status: 'paused',
      progress: 40,
      startDate: '2025-03-01',
      dueDate: '2025-03-10',
      priority: 'medium',
      stages: [
        'application', 
        'quote-generation', 
        'contract-signing'
      ]
    },
    {
      id: 'wf3',
      title: 'Global Solutions IATF 16949',
      client: 'Alex Johnson',
      standard: 'iatf-16949',
      status: 'blocked',
      progress: 25,
      startDate: '2025-02-15',
      dueDate: '2025-03-05',
      priority: 'urgent',
      stages: [
        'application'
      ]
    }
  ]);

  // State for modal and detail view
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // Handler for creating a new workflow
  const handleCreateWorkflow = (
    newWorkflow: Omit<Workflow, 'id' | 'status' | 'progress' | 'startDate'>
  ) => {
    // Generate a unique ID and add to workflows
    const workflowWithId: Workflow = {
      ...newWorkflow,
      id: `wf${workflows.length + 1}`,
      status: 'active',
      progress: 0,
      startDate: new Date().toISOString(),
    };
    
    setWorkflows(prev => [...prev, workflowWithId]);
    setIsCreationModalOpen(false);
  };

  // Handler for selecting a workflow
  const handleSelectWorkflow = (workflow: Workflow | null) => {
    if (workflow === null) {
      // Open creation modal
      setIsCreationModalOpen(true);
    } else {
      // Open detail view
      setSelectedWorkflow(workflow);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Workflow Management</h2>
          <p className="text-muted mb-0">
            Manage certification workflows for your clients
          </p>
        </div>
      </div>

      {/* Workflow List View */}
      <WorkflowListView 
        workflows={workflows}
        onSelectWorkflow={handleSelectWorkflow}
      />

      {/* Workflow Creation Modal */}
      {isCreationModalOpen && (
        <WorkflowCreationModal
          isOpen={isCreationModalOpen}
          onClose={() => setIsCreationModalOpen(false)}
          clients={mockClients}
          onCreateWorkflow={handleCreateWorkflow}
        />
      )}

      {/* Workflow Detail View */}
      {selectedWorkflow && (
        <WorkflowDetailView
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          onEditWorkflow={(workflow) => {
            // Placeholder for future edit functionality
            console.log('Edit workflow:', workflow);
          }}
        />
      )}
    </div>
  );
};

export default AdminWorkflowDashboard;