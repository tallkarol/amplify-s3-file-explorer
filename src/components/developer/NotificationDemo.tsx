// src/components/developer/NotificationDemo.tsx
import { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { createNotification } from '@/features/notifications/services/NotificationService';
import { useNotifications } from '@/features/notifications/context/NotificationContext';

interface NotificationDemoProps {
  onNotificationCreated?: (type: string, message: string) => void;
}

const NotificationDemo: React.FC<NotificationDemoProps> = ({ onNotificationCreated }) => {
  const { user } = useAuthenticator();
  const { refreshUnreadCount } = useNotifications();
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test notification');
  const [type, setType] = useState<'system' | 'file' | 'admin' | 'user'>('system');
  const [actionLink, setActionLink] = useState('/user');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleCreateNotification = async () => {
    setLoading(true);
    setResult(null);
    setFeedback('');
    
    try {
      const notification = {
        userId: user.userId,
        type,
        title,
        message,
        isRead: false,
        actionLink,
        metadata: {
          icon: getIconForType(type),
          color: getColorForType(type),
          demo: true,
          created: new Date().toISOString()
        }
      };
      
      const createdNotification = await createNotification(notification);
      console.log('Created notification:', createdNotification);
      
      // Refresh the unread count to update the notification bell
      await refreshUnreadCount();
      
      setResult('success');
      setFeedback(`Notification created successfully with ID: ${createdNotification.id}`);
      
      // Call the callback if provided
      if (onNotificationCreated) {
        onNotificationCreated(type, message);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      setResult('error');
      setFeedback(`Error creating notification: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (notificationType: string): string => {
    switch (notificationType) {
      case 'system':
        return 'info-circle';
      case 'file':
        return 'file-earmark-arrow-up';
      case 'admin':
        return 'shield';
      case 'user':
        return 'person';
      default:
        return 'bell';
    }
  };

  const getColorForType = (notificationType: string): string => {
    switch (notificationType) {
      case 'system':
        return 'info';
      case 'file':
        return 'success';
      case 'admin':
        return 'danger';
      case 'user':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white">
        <h5 className="mb-0">
          <i className="bi bi-bell me-2"></i>
          Notification Demo Creator
        </h5>
      </div>
      <div className="card-body">
        <p className="text-muted mb-4">
          Create test notifications to see how they look and function in the notification system.
        </p>
        
        <div className="mb-3">
          <label className="form-label">Notification Type</label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="system">System Notification</option>
            <option value="file">File Notification</option>
            <option value="admin">Admin Notification</option>
            <option value="user">User Notification</option>
          </select>
          <div className="form-text">
            <i className={`bi bi-${getIconForType(type)} me-1 text-${getColorForType(type)}`}></i>
            Different types use different icons and colors
          </div>
        </div>
        
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title"
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Message</label>
          <textarea
            className="form-control"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message"
            rows={3}
          />
        </div>
        
        <div className="mb-4">
          <label className="form-label">Action Link (optional)</label>
          <input
            type="text"
            className="form-control"
            value={actionLink}
            onChange={(e) => setActionLink(e.target.value)}
            placeholder="Enter a link path (e.g. /user)"
          />
          <div className="form-text">When a user clicks on the notification, they will be redirected to this path</div>
        </div>
        
        <div className="d-grid">
          <button
            className="btn btn-primary"
            onClick={handleCreateNotification}
            disabled={loading || !title || !message}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-bell-fill me-2"></i>
                Create Notification
              </>
            )}
          </button>
        </div>
        
        {result === 'success' && (
          <div className="alert alert-success mt-3">
            <i className="bi bi-check-circle-fill me-2"></i>
            {feedback}
          </div>
        )}
        
        {result === 'error' && (
          <div className="alert alert-danger mt-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDemo;