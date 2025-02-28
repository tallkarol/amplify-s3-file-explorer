// src/components/common/TogglableCard.tsx
import { ReactNode, useState } from 'react';
import Card from './Card';

interface TogglableCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  initiallyExpanded?: boolean;
  className?: string;
  headerClassName?: string;
}

const TogglableCard = ({ 
  title, 
  subtitle, 
  children, 
  initiallyExpanded = false,
  className = '',
  headerClassName = ''
}: TogglableCardProps) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <Card className={className}>
      <div 
        className={`d-flex justify-content-between align-items-center cursor-pointer ${headerClassName}`} 
        onClick={toggleExpand}
        style={{ cursor: 'pointer' }}
      >
        <div>
          <h5 className="card-title mb-0">{title}</h5>
          {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
        </div>
        <button className="btn btn-sm btn-link p-0 text-muted">
          <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </Card>
  );
};

export default TogglableCard;