// src/features/notifications/components/NotificationDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Notification } from '@/types';
import { getNotificationById, markAsRead } from '../services/NotificationService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Card from '@/components/common/Card';

const NotificationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchNotification(id);
    }
  }, [id]);

  const fetchNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getNotificationById(notificationId);
      setNotification(data);
      
      // Mark as read if not already read
      if (data && !data.isRead) {
        await markAsRead(data.id);
      }
    } catch (err) {
      console.error('Error fetching notification:', err);
      setError('Could not load the notification. It may have been deleted or you may not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse metadata
  const parseMetadata = (metadata: any): Record<string, any> => {
    if (!metadata) return {};
    
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch (e) {
        return {};
      }
    }
    
    return metadata;
  };

  // Format date to human-readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    }).format(date);
  };

  // Get icon and color based on notification type or metadata
  const getIconAndColor = (): { icon: string; color: string } => {
    if (!notification) {
      return { icon: 'bell', color: 'primary' };
    }
    
    const metadata = parseMetadata(notification.metadata);
    
    // Default values based on notification type
    let icon = 'bell';
    let color = 'primary';
    
    // Set icon based on notification type
    switch (notification.type) {
      case 'system':
        icon = 'info-circle';
        color = 'info';
        break;
      case 'file':
        icon = 'file-earmark-arrow-up';
        color = 'success';
        break;
      case 'admin':
        icon = 'shield';
        color = 'danger';
        break;
      case 'user':
        icon = 'person';
        color = 'primary';
        break;
    }
    
    // Override with metadata if present
    if (metadata.icon) {
      icon = metadata.icon;
    }
    
    if (metadata.color) {
      color = metadata.color;
    }
    
    return { icon, color };
  };

  const { icon, color } = getIconAndColor();

  // Handle navigation to action link
  const handleNavigateToLink = () => {
    if (notification?.actionLink) {
      navigate(notification.actionLink);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <button 
              className="btn btn-outline-primary" 
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back
            </button>
            <h2 className="mb-0">Notification Details</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <LoadingSpinner text="Loading notification details..." />
            </div>
          ) : error ? (
            <div className="alert alert-danger">
              <div className="d-flex">
                <div className="me-3">
                  <i className="bi bi-exclamation-triangle-fill fs-3"></i>
                </div>
                <div>
                  <h5>Error Loading Notification</h5>
                  <p className="mb-0">{error}</p>
                </div>
              </div>
            </div>
          ) : notification ? (
            <Card>
              {/* Header with notification type and creation time */}
              <div className={`bg-${color}-subtle p-4 mb-4 rounded-3 notification-detail-header`}>
                <div className="d-flex align-items-center">
                  <div className={`bg-${color} text-white p-3 me-3 rounded-circle notification-detail-icon`}>
                    <i className={`bi bi-${icon} fs-3`}></i>
                  </div>
                  <div>
                    <h3 className="mb-1">{notification.title}</h3>
                    <div className="text-muted">
                      <span className={`badge bg-${color} me-2`}>
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </span>
                      <span>
                        <i className="bi bi-clock me-1"></i>
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Message content */}
              <div className="notification-detail-message p-4 mb-4 bg-light rounded-3">
                <h5 className="border-bottom pb-2 mb-3">Message</h5>
                <p className="fs-5 mb-0">{notification.message}</p>
              </div>
              
              {/* Action button if available */}
              {notification.actionLink && (
                <div className="d-grid gap-2 mb-4">
                  <button 
                    className={`btn btn-${color} btn-lg`}
                    onClick={handleNavigateToLink}
                  >
                    <i className="bi bi-box-arrow-up-right me-2"></i>
                    Open Related Content
                  </button>
                  <p className="text-muted text-center small">
                    <i className="bi bi-info-circle me-1"></i>
                    This notification is linked to a specific page or resource
                  </p>
                </div>
              )}
              
              {/* Additional details */}
              <div className="notification-detail-metadata">
                <h5 className="border-bottom pb-2 mb-3">Additional Information</h5>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">Notification ID</div>
                    <div className="font-monospace">{notification.id}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">Status</div>
                    <div>
                      <span className={`badge bg-${notification.isRead ? 'secondary' : 'primary'}`}>
                        {notification.isRead ? 'Read' : 'Unread'}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">Created At</div>
                    <div>{formatDate(notification.createdAt)}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="text-muted small">Last Updated</div>
                    <div>{formatDate(notification.updatedAt)}</div>
                  </div>
                  {notification.expiresAt && (
                    <div className="col-md-6 mb-3">
                      <div className="text-muted small">Expires At</div>
                      <div>{formatDate(notification.expiresAt)}</div>
                    </div>
                  )}
                </div>
                
                {/* Metadata display if present */}
                {notification.metadata && Object.keys(parseMetadata(notification.metadata)).length > 0 && (
                  <div className="mt-3">
                    <h6 className="mb-2">Metadata</h6>
                    <pre className="bg-light p-3 rounded">
                      {JSON.stringify(parseMetadata(notification.metadata), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="alert alert-warning">
              <div className="d-flex">
                <div className="me-3">
                  <i className="bi bi-exclamation-circle-fill fs-3"></i>
                </div>
                <div>
                  <h5>Notification Not Found</h5>
                  <p className="mb-0">The requested notification could not be found.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDetail;