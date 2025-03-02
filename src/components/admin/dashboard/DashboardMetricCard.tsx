// src/components/admin/dashboard/DashboardMetricCard.tsx
import React from 'react';

interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  trend?: {
    value: number;
    isUpward: boolean;
  };
  subtitle?: string;
  onClick?: () => void;
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  subtitle,
  onClick
}) => {
  return (
    <div 
      className={`card admin-stat-card border-0 shadow-sm overflow-hidden h-100`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className={`bg-${color} bg-opacity-15 p-3 rounded`}>
            <i className={`bi bi-${icon} text-${color} fs-4`}></i>
          </div>
          {trend && (
            <div className={`badge bg-${trend.isUpward ? 'success' : 'danger'} bg-opacity-10 text-${trend.isUpward ? 'success' : 'danger'} px-2 py-1`}>
              <i className={`bi bi-arrow-${trend.isUpward ? 'up' : 'down'} me-1`}></i>
              {trend.value}%
            </div>
          )}
        </div>
        <h2 className="metric-value mb-1">{value}</h2>
        <div className="text-muted">{title}</div>
        {subtitle && <div className="small text-muted mt-2">{subtitle}</div>}
      </div>
    </div>
  );
};

export default DashboardMetricCard;
