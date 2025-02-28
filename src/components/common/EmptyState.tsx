// src/components/common/EmptyState.tsx
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: ReactNode;
}

const EmptyState = ({ icon = 'folder-plus', title, message, action }: EmptyStateProps) => {
  return (
    <div className="text-center p-4">
      <i className={`bi bi-${icon} fs-1 text-muted mb-3 d-block`}></i>
      <h5 className="mb-2">{title}</h5>
      <p className="text-muted">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};

export default EmptyState;