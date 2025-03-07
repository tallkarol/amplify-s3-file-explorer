import React, { useState } from 'react';
import { CERTIFICATION_STANDARDS } from '../constants/certificationStandards';
import { GENERIC_WORKFLOW_STAGES } from '../constants/workflowStages';
import { UserProfile } from '@/types';

interface WorkflowCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: UserProfile[];
  onCreateWorkflow: (workflowData: any) => void;
}

const WorkflowCreationModal: React.FC<WorkflowCreationModalProps> = ({
  isOpen,
  onClose,
  clients,
  onCreateWorkflow
}) => {
  const [step, setStep] = useState(1);
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');

  const resetForm = () => {
    setStep(1);
    setSelectedStandard(null);
    setSelectedClient(null);
    setSelectedStages([]);
    setWorkflowTitle('');
    setWorkflowDescription('');
  };

  const handleNext = () => {
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleStageToggle = (stageId: string) => {
    setSelectedStages(prev => 
      prev.includes(stageId)
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  const handleSubmit = () => {
    if (!selectedStandard || !selectedClient || selectedStages.length === 0) {
      alert('Please complete all required fields');
      return;
    }

    const workflowData = {
      title: workflowTitle || `${CERTIFICATION_STANDARDS.find(s => s.id === selectedStandard)?.name} Workflow`,
      description: workflowDescription || 'Certification workflow for selected standard',
      standard: selectedStandard,
      client: selectedClient,
      stages: selectedStages
    };

    onCreateWorkflow(workflowData);
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="workflow-modal-backdrop">
      <div className="workflow-modal">
        <div className="workflow-modal-content">
          <div className="workflow-modal-header">
            <h5 className="workflow-modal-title">
              <i className="bi bi-diagram-3 me-2"></i>
              Create New Workflow
            </h5>
            <button 
              type="button" 
              className="workflow-close-button" 
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          
          <div className="workflow-modal-body">
            {/* Step Indicator */}
            <div className="workflow-steps">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className={`workflow-step ${stepNumber <= step ? 'active' : ''}`}>
                  <div className="step-number">{stepNumber}</div>
                  <div className="step-label">
                    {stepNumber === 1 && "Standard"}
                    {stepNumber === 2 && "Client"}
                    {stepNumber === 3 && "Stages"}
                    {stepNumber === 4 && "Details"}
                  </div>
                  {stepNumber < 4 && <div className={`step-connector ${stepNumber < step ? 'active' : ''}`}></div>}
                </div>
              ))}
            </div>

            {/* Step 1: Certification Standard Selection */}
            {step === 1 && (
              <div className="workflow-step-content fade-in">
                <h6 className="step-title">Select Certification Standard</h6>
                <div className="workflow-card-grid">
                  {CERTIFICATION_STANDARDS.map(standard => (
                    <div 
                      key={standard.id} 
                      className={`workflow-card ${selectedStandard === standard.id ? 'selected' : ''}`}
                      onClick={() => setSelectedStandard(standard.id)}
                    >
                      <div className="workflow-card-body">
                        <h5 className="workflow-card-title">{standard.name}</h5>
                        <p className="workflow-card-text">{standard.description}</p>
                        <div className="workflow-card-badge">
                          Industries: {standard.industries.join(', ')}
                        </div>
                        {selectedStandard === standard.id && (
                          <div className="workflow-card-check">
                            <i className="bi bi-check-circle-fill"></i>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Client Selection */}
            {step === 2 && (
              <div className="workflow-step-content fade-in">
                <h6 className="step-title">Select Client</h6>
                <div className="workflow-search">
                  <i className="bi bi-search"></i>
                  <input 
                    type="text" 
                    className="workflow-search-input" 
                    placeholder="Search clients..." 
                  />
                </div>
                <div className="workflow-client-list">
                  {clients.map(client => (
                    <div
                      key={client.id}
                      className={`workflow-client-item ${selectedClient === client.id ? 'selected' : ''}`}
                      onClick={() => setSelectedClient(client.id)}
                    >
                      <div className="workflow-client-avatar">
                        {client.firstName?.[0]}{client.lastName?.[0]}
                      </div>
                      <div className="workflow-client-info">
                        <h6>{client.firstName} {client.lastName}</h6>
                        <span>{client.email}</span>
                      </div>
                      {selectedClient === client.id && (
                        <div className="workflow-client-check">
                          <i className="bi bi-check-circle-fill"></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Workflow Stages Selection */}
            {step === 3 && (
              <div className="workflow-step-content fade-in">
                <h6 className="step-title">Select Workflow Stages</h6>
                <div className="workflow-card-grid">
                  {GENERIC_WORKFLOW_STAGES.map(stage => (
                    <div 
                      key={stage.id} 
                      className={`workflow-stage-card ${selectedStages.includes(stage.id) ? 'selected' : ''}`}
                      onClick={() => handleStageToggle(stage.id)}
                    >
                      <div className="workflow-stage-checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectedStages.includes(stage.id)}
                          onChange={() => handleStageToggle(stage.id)}
                        />
                        <span className="checkmark"></span>
                      </div>
                      <div className="workflow-stage-content">
                        <h6>{stage.title}</h6>
                        <p>{stage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Additional Details */}
            {step === 4 && (
              <div className="workflow-step-content fade-in">
                <h6 className="step-title">Workflow Details</h6>
                <div className="workflow-form-group">
                  <label>Workflow Title</label>
                  <input 
                    type="text" 
                    className="workflow-input" 
                    placeholder="Enter workflow title (optional)"
                    value={workflowTitle}
                    onChange={(e) => setWorkflowTitle(e.target.value)}
                  />
                </div>
                <div className="workflow-form-group">
                  <label>Description</label>
                  <textarea 
                    className="workflow-textarea" 
                    rows={3} 
                    placeholder="Enter workflow description (optional)"
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}
          </div>
          
          <div className="workflow-modal-footer">
            {step > 1 && (
              <button 
                className="workflow-button secondary" 
                onClick={handleBack}
              >
                <i className="bi bi-arrow-left"></i>
                Back
              </button>
            )}
            
            {step < 4 ? (
              <button 
                className="workflow-button primary" 
                onClick={handleNext}
                disabled={(step === 1 && !selectedStandard) || (step === 2 && !selectedClient)}
              >
                Next
                <i className="bi bi-arrow-right"></i>
              </button>
            ) : (
              <button 
                className="workflow-button success" 
                onClick={handleSubmit}
              >
                Create Workflow
                <i className="bi bi-check2"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCreationModal;