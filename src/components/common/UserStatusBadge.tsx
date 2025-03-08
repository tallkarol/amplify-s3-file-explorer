// src/components/common/StatusBadge.tsx
import React from 'react';

interface UserStatusBadgeProps {
  status?: 'active' | 'inactive' | 'suspended' | string;
  className?: string;
}

const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status = 'active', className = '' }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { text: 'Active', color: 'success' };
      case 'inactive':
        return { text: 'Inactive', color: 'danger' };
      case 'suspended':
        return { text: 'Suspended', color: 'dark' };
      default:
        return { text: status, color: 'secondary' };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <span className={`badge bg-${statusInfo.color} ${className}`}>
      {statusInfo.text}
    </span>
  );
};

export default UserStatusBadge;