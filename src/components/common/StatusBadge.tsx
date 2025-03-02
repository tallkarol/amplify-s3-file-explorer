// src/components/common/StatusBadge.tsx
import React from 'react';

type StatusType = 
  // General statuses
  'active' | 'inactive' | 'pending' | 'completed' | 
  // Task statuses
  'in_progress' | 'overdue' | 'blocked' | 'paused' |
  // Priority levels
  'urgent' | 'high' | 'medium' | 'low' |
  // Custom status
  string;

interface StatusBadgeProps {
  status: StatusType;
  type?: 'status' | 'priority';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  type = 'status',
  className = ''
}) => {
  const getColor = (status: StatusType, type: 'status' | 'priority'): string => {
    if (type === 'priority') {
      switch (status) {
        case 'urgent': return 'danger';
        case 'high': return 'warning';
        case 'medium': return 'primary';
        case 'low': return 'secondary';
        default: return 'secondary';
      }
    } else {
      switch (status) {
        case 'active': return 'success';
        case 'in_progress': return 'primary';
        case 'pending': return 'warning';
        case 'paused': return 'warning';
        case 'completed': return 'info';
        case 'inactive': return 'secondary';
        case 'blocked': return 'danger';
        case 'overdue': return 'danger';
        default: return 'secondary';
      }
    }
  };

  const formatStatus = (status: string): string => {
    // Replace underscores with spaces and capitalize each word
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const color = getColor(status, type);
  const displayText = formatStatus(status);

  return (
    <span className={`badge bg-${color} ${className}`}>
      {displayText}
    </span>
  );
};

export default StatusBadge;