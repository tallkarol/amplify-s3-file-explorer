// src/pages/NotificationsPage.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Notification } from '../types';
import { getNotifications, markAsRead, deleteNotification } from '../features/notifications/services/NotificationService';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import EmptyState from '../components/common/EmptyState';

const NotificationsPage = () => {
  const { user } = useAuthenticator();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const notifs = await getNotifications(user.userId);
      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setActionInProgress(notificationId);
    
    try {
      await markAsRead(notificationId);
      
      // Update the local state
      setNotifications(
        notifications.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setActionInProgress(notificationId);
    
    try {
      await deleteNotification(notificationId);
      
      // Remove from local state
      setNotifications(
        notifications.filter(notif => notif.id !== notificationId)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Function to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    
    // If less than 24 hours ago, show relative time
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);
    
    if (diffHrs < 24) {
      if (diffHrs < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      }
      const hours = Math.floor(diffHrs);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString();
  };

  // Function to get icon based on notification type
  const getNotificationIcon = (type: string, metadata?: Record<string, any>): string => {
    // If metadata has an icon, use that
    if (metadata && metadata.icon) {
      return metadata.icon;
    }
    
    // Otherwise use default icons based on type
    switch (type) {
      case 'system':
        return 'info-circle';
      case 'file':
        return 'file-earmark';
      case 'admin':
        return 'shield';
      case 'user':
        return 'person';
      default:
        return 'bell';
    }
  };

  // Function to get color based on notification type
  const getNotificationColor = (type: string, metadata?: Record<string, any>): string => {
    // If metadata has a color, use that
    if (metadata && metadata.color) {
      return metadata.color;
    }
    
    // Otherwise use default colors based on type
    switch (type) {
      case 'system':
        return 'info';
      case 'file':
        return 'success';
      case 'admin':
        return 'primary';
      case 'user':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Notifications</h2>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchNotifications}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>
      
      <Card>
        {loading ? (
          <LoadingSpinner text="Loading notifications..." />
        ) : error ? (
          <AlertMessage type="danger" message={error} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No Notifications"
            message="You don't have any notifications at the moment."
          />
        ) : (
          <div className="list-group">
            {notifications.map(notification => {
              // Parse metadata if it exists
              let metadata: Record<string, any> | undefined;
              if (notification.metadata) {
                try {
                  metadata = typeof notification.metadata === 'string' 
                    ? JSON.parse(notification.metadata) 
                    : notification.metadata;
                } catch (err) {
                  console.error('Error parsing notification metadata:', err);
                }
              }
              
              const iconName = getNotificationIcon(notification.type, metadata);
              const colorName = getNotificationColor(notification.type, metadata);
              
              return (
                <div 
                  key={notification.id} 
                  className={`list-group-item list-group-item-action p-3 ${!notification.isRead ? 'bg-light' : ''}`}
                >
                  <div className="d-flex">
                    <div className={`bg-${colorName} bg-opacity-10 rounded-circle p-2 me-3`} style={{ height: '48px', width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`bi bi-${iconName} text-${colorName} fs-4`}></i>
                    </div>
                    
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="mb-0 fw-bold">{notification.title}</h6>
                        <small className="text-muted">{formatDate(notification.createdAt)}</small>
                      </div>
                      
                      <p className="mb-1">{notification.message}</p>
                      
                      {notification.actionLink && (
                        <a 
                          href={notification.actionLink} 
                          className="btn btn-sm btn-link ps-0 text-decoration-none"
                        >
                          View Details
                          <i className="bi bi-arrow-right ms-1"></i>
                        </a>
                      )}
                    </div>
                    
                    <div className="d-flex flex-column">
                      {!notification.isRead && (
                        <button
                          className="btn btn-sm btn-outline-primary mb-1"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={actionInProgress === notification.id}
                        >
                          {actionInProgress === notification.id ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            <i className="bi bi-check-circle"></i>
                          )}
                        </button>
                      )}
                      
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(notification.id)}
                        disabled={actionInProgress === notification.id}
                      >
                        {actionInProgress === notification.id ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <i className="bi bi-trash"></i>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;