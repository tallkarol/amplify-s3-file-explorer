// src/components/admin/task/TaskList.tsx
import React from 'react';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string;
  client: string;
  dueDate: string;
  priority: TaskPriority;
  workflowId?: string;
}

interface TaskListProps {
  tasks: Task[];
  title?: string;
  onCompleteTask?: (taskId: string) => void;
  onViewTask?: (taskId: string) => void;
  showCompleted?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  title = "Tasks",
  onCompleteTask,
  onViewTask,
  showCompleted = false
}) => {
  const filteredTasks = showCompleted 
    ? tasks
    : tasks.filter(task => task.status !== 'completed');
  
  // Status and priority helper functions
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'pending': return 'secondary';
      case 'overdue': return 'danger';
      default: return 'secondary';
    }
  };
  
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };
  
  if (filteredTasks.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-check2-all fs-1 text-muted mb-3"></i>
          <h5>No Active Tasks</h5>
          <p className="text-muted">All tasks have been completed</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <h5 className="card-title mb-0">{title}</h5>
        </div>
      )}
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
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
              {filteredTasks.map(task => (
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
                      {task.status !== 'completed' && onCompleteTask && (
                        <button 
                          className="btn btn-outline-success"
                          onClick={() => onCompleteTask(task.id)}
                          title="Mark as Complete"
                        >
                          <i className="bi bi-check2"></i>
                        </button>
                      )}
                      {onViewTask && (
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => onViewTask(task.id)}
                          title="View Details"
                        >
                          <i className="bi bi-arrow-right"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskList;

