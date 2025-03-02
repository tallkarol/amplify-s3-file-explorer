
// src/components/admin/dashboard/MetricsRow.tsx
import React from 'react';
import DashboardMetricCard from './DashboardMetricCard';

interface Metric {
  id: string;
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

interface MetricsRowProps {
  metrics: Metric[];
}

const MetricsRow: React.FC<MetricsRowProps> = ({ metrics }) => {
  return (
    <div className="row g-4 mb-4">
      {metrics.map(metric => (
        <div key={metric.id} className="col-md-6 col-xl-3">
          <DashboardMetricCard
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            trend={metric.trend}
            subtitle={metric.subtitle}
            onClick={metric.onClick}
          />
        </div>
      ))}
    </div>
  );
};

export default MetricsRow;
