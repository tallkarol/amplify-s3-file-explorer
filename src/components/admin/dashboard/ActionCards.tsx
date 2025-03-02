// src/components/admin/dashboard/ActionCards.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface ActionCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
}

interface ActionCardsProps {
  title?: string;
  subtitle?: string;
  cards: ActionCard[];
  layout?: 'grid' | 'list';
  columns?: 2 | 3 | 4;
}

const ActionCards: React.FC<ActionCardsProps> = ({
  title,
  subtitle,
  cards,
  layout = 'grid',
  columns = 3
}) => {
  const colClass = `col-md-${12 / columns}`;
  
  return (
    <div className="card h-100">
      {(title || subtitle) && (
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            {title && <h5 className="mb-0">{title}</h5>}
            {subtitle && <span className="text-muted small">{subtitle}</span>}
          </div>
        </div>
      )}
      <div className="card-body p-0">
        {layout === 'grid' ? (
          <div className="row g-0">
            {cards.map((card) => (
              <div className={colClass} key={card.id}>
                <Link to={card.link} className="d-block text-decoration-none">
                  <div className="text-center py-4 px-2 rounded hover-transform">
                    <div className="overview-card-icon mx-auto bg-light">
                      <i className={`bi bi-${card.icon} text-${card.color || 'primary'}`}></i>
                    </div>
                    <h5 className="mt-3 mb-1">{card.title}</h5>
                    <p className="text-muted small mb-0">{card.description}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {cards.map((card) => (
              <Link 
                key={card.id}
                to={card.link} 
                className="list-group-item list-group-item-action d-flex align-items-center p-3"
              >
                <div className={`bg-${card.color || 'primary'} bg-opacity-10 rounded-circle p-3 me-3`}>
                  <i className={`bi bi-${card.icon} text-${card.color || 'primary'}`}></i>
                </div>
                <div>
                  <h6 className="mb-1">{card.title}</h6>
                  <p className="mb-0 text-muted small">{card.description}</p>
                </div>
                <i className="bi bi-chevron-right ms-auto text-muted"></i>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionCards;

