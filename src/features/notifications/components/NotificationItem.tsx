// src/features/notifications/components/NotificationItem.tsx
import { useState } from 'react';
import { Notification } from '@/types';
import { markAsRead, deleteNotification } from '../services/NotificationService';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
  notification: Notification;
  onUpdate: () => void;
  onClose?: () => void; // Add optional onClose prop
}

const NotificationItem = ({ notification, onUpdate, onClose }: NotificationItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const navigate = useNavigate();

  // Format date to show relative time (today, yesterday, or date)
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than an hour
    const diffMinutes = Math.floor(diff / (60 * 1000));
    if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    const diffHours = Math.floor(diff / (60 * 60 * 1000));
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    const diffDays = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
    
    // Default to formatted date
    return date.toLocaleDateString();
  };

  // Get icon based on notification type
  const getIcon = (type: string): string => {
    switch (type) {
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

  // Get icon color based on notification type
  const getIconColor = (type: string): string => {
    switch (type) {
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

  // Handle marking as read
  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.isRead || isMarkingRead) return;
    
    try {
      setIsMarkingRead(true);
      await markAsRead(notification.id);
      onUpdate();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsMarkingRead(false);
    }
  };

  // Handle deletion
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      await deleteNotification(notification.id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting notification:', error);
      setIsDeleting(false);
    }
  };

  // Handle notification click - navigate to notification detail page
  const handleClick = async () => {
    // If the notification is not read, mark it as read
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
        onUpdate();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Close the modal if onClose is provided
    if (onClose) {
      onClose();
    }
    
    // Navigate to the notification detail page
    navigate(`/notifications/detail/${notification.id}`);
  };

  // Get metadata icon if it exists
  const getMetadataIcon = (): string | null => {
    try {
      if (!notification.metadata) return null;
      const metadata = typeof notification.metadata === 'string' 
        ? JSON.parse(notification.metadata) 
        : notification.metadata;
      
      return metadata.icon || null;
    } catch (e) {
      return null;
    }
  };

  // Get metadata color if it exists
  const getMetadataColor = (): string | null => {
    try {
      if (!notification.metadata) return null;
      const metadata = typeof notification.metadata === 'string' 
        ? JSON.parse(notification.metadata) 
        : notification.metadata;
      
      return metadata.color || null;
    } catch (e) {
      return null;
    }
  };

  const metadataIcon = getMetadataIcon();
  const metadataColor = getMetadataColor();
  const iconToUse = metadataIcon || getIcon(notification.type);
  const colorToUse = metadataColor || getIconColor(notification.type);

  return (
    <div 
      className={`notification-item ${notification.isRead ? 'read' : 'unread'} clickable`}
      onClick={handleClick}
    >
      {/* Unread indicator dot */}
      {!notification.isRead && (
        <div className="unread-indicator-dot"></div>
      )}
      
      <div className={`notification-icon bg-${colorToUse}-subtle text-${colorToUse} ${!notification.isRead ? 'glow-' + colorToUse : ''}`}>
        <i className={`bi bi-${iconToUse}`}></i>
      </div>
      
      <div className="notification-content">
        <div className="notification-title">{notification.title}</div>
        <div className="notification-message">{notification.message}</div>
        <div className="notification-time">
          <i className="bi bi-clock me-1 opacity-50"></i>
          {formatDate(notification.createdAt)}
          <span className="ms-2 text-primary">
            <i className="bi bi-info-circle me-1"></i>
            View details
          </span>
        </div>
      </div>
      
      <div className="notification-actions">
        {!notification.isRead && (
          <button 
            className="btn btn-sm btn-link text-primary"
            title="Mark as read"
            onClick={handleMarkAsRead}
            disabled={isMarkingRead}
          >
            {isMarkingRead ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-check2-all"></i>
            )}
          </button>
        )}
        <button 
          className="btn btn-sm btn-link text-danger"
          title="Delete notification"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <i className="bi bi-trash"></i>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;