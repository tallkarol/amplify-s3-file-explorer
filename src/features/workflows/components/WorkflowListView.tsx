import React, { useState } from 'react';
import { CERTIFICATION_STANDARDS } from '../constants/certificationStandards';
import StatusBadge from '@/components/common/StatusBadge';

// Define workflow interface to match existing mock data structure
export interface Workflow {
  id: string;
  title: string;
  client: string;
  standard: string;
  status: 'active' | 'paused' | 'completed' | 'blocked';
  progress: number;
  startDate: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  stages?: string[]; // Added optional stages property
}

interface WorkflowListViewProps {
  workflows: Workflow[];
  onSelectWorkflow: (workflow: Workflow | null) => void;
}

const WorkflowListView: React.FC<WorkflowListViewProps> = ({ 
  workflows, 
  onSelectWorkflow 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStandard, setFilterStandard] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<keyof Workflow>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort workflows
  const processedWorkflows = workflows
    .filter(workflow => 
      (searchTerm === '' || 
        workflow.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        workflow.client.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStandard === 'all' || workflow.standard === filterStandard) &&
      (filterStatus === 'all' || workflow.status === filterStatus)
    )
    .sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';
      return valA > valB ? modifier : -modifier;
    });

  // Get unique standards and statuses for filtering
  const availableStandards = Array.from(new Set(workflows.map(w => w.standard)));
  const availableStatuses = Array.from(new Set(workflows.map(w => w.status)));

  // Helper to get standard display name
  const getStandardName = (standardId: string) => {
    const standard = CERTIFICATION_STANDARDS.find(s => s.id === standardId);
    return standard ? standard.name : standardId;
  };

  // Render method
  return (
    <div className="card">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-diagram-3 me-2"></i>
          Workflow Management
        </h5>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => onSelectWorkflow(null)}
        >
          <i className="bi bi-plus-circle me-1"></i>
          Create Workflow
        </button>
      </div>
      
      <div className="card-body">
        {/* Filters and Search */}
        <div className="row mb-4">
          <div className="col-md-4 mb-2">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-2 mb-2">
            <select 
              className="form-select"
              value={filterStandard}
              onChange={(e) => setFilterStandard(e.target.value)}
            >
              <option value="all">All Standards</option>
              {availableStandards.map(standard => (
                <option key={standard} value={standard}>
                  {getStandardName(standard)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 mb-2">
            <select 
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {availableStatuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Workflows Table */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th 
                  onClick={() => {
                    setSortBy('title');
                    setSortDirection(sortBy === 'title' && sortDirection === 'desc' ? 'asc' : 'desc');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  Workflow Title
                  {sortBy === 'title' && (
                    <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
                  )}
                </th>
                <th>Client</th>
                <th 
                  onClick={() => {
                    setSortBy('standard');
                    setSortDirection(sortBy === 'standard' && sortDirection === 'desc' ? 'asc' : 'desc');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  Standard
                  {sortBy === 'standard' && (
                    <i className={`bi bi-sort-${sortDirection === 'asc' ? 'down' : 'up'} ms-1`}></i>
                  )}
                </th>
                <th>Status</th>
                <th>Progress</th>
                <th>Start Date</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedWorkflows.map(workflow => (
                <tr key={workflow.id}>
                  <td>{workflow.title}</td>
                  <td>{workflow.client}</td>
                  <td>{getStandardName(workflow.standard)}</td>
                  <td>
                    <StatusBadge 
                      status={workflow.status} 
                      type="status" 
                    />
                  </td>
                  <td>
                    <div className="progress" style={{ height: '20px' }}>
                      <div 
                        className={`progress-bar bg-${
                          workflow.progress < 25 ? 'danger' : 
                          workflow.progress < 50 ? 'warning' : 
                          workflow.progress < 75 ? 'info' : 
                          'success'
                        }`} 
                        role="progressbar" 
                        style={{ width: `${workflow.progress}%` }}
                        aria-valuenow={workflow.progress} 
                        aria-valuemin={0} 
                        aria-valuemax={100}
                      >
                        {workflow.progress}%
                      </div>
                    </div>
                  </td>
                  <td>{new Date(workflow.startDate).toLocaleDateString()}</td>
                  <td>
                    {workflow.dueDate 
                      ? new Date(workflow.dueDate).toLocaleDateString() 
                      : 'N/A'}
                  </td>
                  <td>
                    <StatusBadge 
                      status={workflow.priority} 
                      type="priority" 
                    />
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onSelectWorkflow(workflow)}
                    >
                      <i className="bi bi-eye me-1"></i>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {processedWorkflows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center">
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      No workflows found matching your search criteria.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkflowListView;