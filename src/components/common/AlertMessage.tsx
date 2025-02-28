// src/components/common/AlertMessage.tsx
import { ReactNode } from 'react';

type AlertType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

interface AlertMessageProps {
  type: AlertType;
  title?: string;
  message: string | ReactNode;
  details?: string | ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const AlertMessage = ({ 
  type, 
  title, 
  message, 
  details, 
  dismissible = false,
  onDismiss
}: AlertMessageProps) => {
  return (
    <div className={`alert alert-${type} ${dismissible ? 'alert-dismissible' : ''}`} role="alert">
      {title && <h4 className="alert-heading">{title}</h4>}
      {typeof message === 'string' ? <p>{message}</p> : message}
      
      {details && (
        <>
          <hr />
          {typeof details === 'string' ? <p className="mb-0">{details}</p> : details}
        </>
      )}
      
      {dismissible && (
        <button 
          type="button" 
          className="btn-close" 
          data-bs-dismiss="alert" 
          aria-label="Close"
          onClick={onDismiss}
        ></button>
      )}
    </div>
  );
};

export default AlertMessage;