// src/features/notifications/examples/NotificationUsageExample.tsx
import { useState } from 'react';
import useNotification from '../hooks/useNotification';

interface NotificationUsageExampleProps {
  action: string;
  entityName: string;
}

/**
 * This is an example component showing how to use the useNotification hook
 * in a real-world scenario like a file upload, form submission, etc.
 */
const NotificationUsageExample: React.FC<NotificationUsageExampleProps> = ({
  action,
  entityName
}) => {
  const { createUserNotification, isCreating, error } = useNotification();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Simulate an action like file upload, form submission, etc.
  const handleAction = async () => {
    setIsProcessing(true);
    setShowSuccess(false);
    
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // After successful action, create a notification
      await createUserNotification({
        title: `${action} Successful`,
        message: `Your ${entityName.toLowerCase()} has been ${action.toLowerCase()} successfully.`,
        type: 'system',
        actionLink: '/user',
        metadata: {
          icon: 'check-circle',
          color: 'success',
          entityType: entityName,
          action: action
        }
      });
      
      setShowSuccess(true);
    } catch (err) {
      console.error(`Error ${action.toLowerCase()} ${entityName}:`, err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Example: {action} {entityName}</h5>
        <p className="card-text">
          This demonstrates using the notification system when {action.toLowerCase()}ing a {entityName.toLowerCase()}.
        </p>
        
        {error && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Error creating notification: {error}
          </div>
        )}
        
        {showSuccess && (
          <div className="alert alert-success">
            <i className="bi bi-check-circle-fill me-2"></i>
            {entityName} {action.toLowerCase()}ed successfully! Check your notifications.
          </div>
        )}
        
        <button 
          className="btn btn-primary"
          onClick={handleAction}
          disabled={isProcessing || isCreating}
        >
          {isProcessing || isCreating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            <>
              <i className="bi bi-upload me-2"></i>
              {action} {entityName}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationUsageExample;