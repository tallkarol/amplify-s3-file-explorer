// src/pages/inbox/Inbox.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, archiveNotification } from '@/features/notifications/services/NotificationService';
import { Notification } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import AlertMessage from '@/components/common/AlertMessage';
import { useNavigate, Link } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import '@/styles/inbox.css';

const Inbox = () => {
  const { user } = useAuthenticator();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Determine the current context based on the URL
  const getCurrentContext = (): 'user' | 'admin' | 'developer' => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin')) {
      return 'admin';
    } else if (pathname.startsWith('/developer')) {
      return 'developer';
    } else {
      return 'user';
    }
  };

  // Get the appropriate back link based on context
  const getBackLink = (): string => {
    const context = getCurrentContext();
    switch (context) {
      case 'admin':
        return '/admin';
      case 'developer':
        return '/developer';
      case 'user':
      default:
        return '/user';
    }
  };

  // Get context-specific title
  const getContextTitle = (): string => {
    const context = getCurrentContext();
    switch (context) {
      case 'admin':
        return 'Admin Inbox';
      case 'developer':
        return 'Developer Inbox';
      case 'user':
      default:
        return 'Inbox';
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications(user.userId, filter === 'unread');
      setNotifications(data);
      
      // Auto-select first notification if none selected
      if (!selectedNotification && data.length > 0) {
        setSelectedNotification(data[0]);
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.errors?.[0]?.message || 'Failed to load notifications';
      console.error('[Inbox] Error fetching notifications:', errorMessage);
      setError(`Failed to load notifications: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on component mount and when filter/user changes
  useEffect(() => {
    // Prevent duplicate calls with cancellation flag
    let isCancelled = false;
    
    const doFetch = async () => {
      if (!user?.userId || isCancelled) {
        if (!user?.userId) setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const data = await getNotifications(user.userId, filter === 'unread');
        
        if (isCancelled) return;
        
        setNotifications(data);
        
        // Auto-select first notification if none selected
        if (!selectedNotification && data.length > 0) {
          setSelectedNotification(data[0]);
        }
      } catch (err: any) {
        if (isCancelled) return;
        
        const errorMessage = err?.message || err?.errors?.[0]?.message || 'Failed to load notifications';
        console.error('[Inbox] Error fetching notifications:', errorMessage);
        setError(`Failed to load notifications: ${errorMessage}`);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    
    doFetch();
    
    // Cleanup: cancel if component unmounts or dependencies change
    return () => {
      isCancelled = true;
    };
  }, [filter, user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user?.userId) return;
    
    try {
      setMarkingAllRead(true);
      await markAllAsRead(user.userId);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(`Failed to mark all as read: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;
    
    try {
      await markAsRead(notification.id);
      // Update local state to show the notification as read
      setNotifications(prev => 
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      
      if (selectedNotification?.id === notification.id) {
        setSelectedNotification({ ...selectedNotification, isRead: true });
      }
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      const errorMessage = err?.message || err?.errors?.[0]?.message || JSON.stringify(err) || 'Unknown error';
      setError(`Failed to mark notification as read: ${errorMessage}`);
    }
  };

  // Handle archive notification
  const handleArchiveNotification = async (id: string) => {
    try {
      setDeletingId(id);
      await archiveNotification(id);
      
      // Update local state to remove the archived notification (archived notifications are filtered out)
      const updatedNotifications = notifications.filter(n => n.id !== id);
      setNotifications(updatedNotifications);
      
      // Clear selection if the archived notification was selected, or select next one
      if (selectedNotification?.id === id) {
        if (updatedNotifications.length > 0) {
          setSelectedNotification(updatedNotifications[0]);
        } else {
          setSelectedNotification(null);
        }
      }
    } catch (err: any) {
      console.error('Error archiving notification:', err);
      const errorMessage = err?.message || err?.errors?.[0]?.message || JSON.stringify(err) || 'Unknown error';
      setError(`Failed to archive notification: ${errorMessage}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle delete notification (admin only)
  const handleDeleteNotification = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteNotification(id);
      
      // Update local state to remove the deleted notification
      const updatedNotifications = notifications.filter(n => n.id !== id);
      setNotifications(updatedNotifications);
      
      // Clear selection if the deleted notification was selected, or select next one
      if (selectedNotification?.id === id) {
        if (updatedNotifications.length > 0) {
          setSelectedNotification(updatedNotifications[0]);
        } else {
          setSelectedNotification(null);
        }
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      const errorMessage = err?.message || err?.errors?.[0]?.message || JSON.stringify(err) || 'Unknown error';
      setError(`Failed to delete notification: ${errorMessage}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    
    // Mark as read when clicked
    if (!notification.isRead) {
      handleMarkAsRead(notification);
    }
  };

  // Handle action button click
  const handleActionClick = (notification: Notification) => {
    if (notification.actionLink) {
      // Mark as read and navigate to the action link
      handleMarkAsRead(notification).then(() => {
        navigate(notification.actionLink!);
      });
    }
  };

  // Get metadata from notification
  const getMetadata = (notification: Notification) => {
    if (!notification.metadata) return null;
    
    try {
      return typeof notification.metadata === 'string' 
        ? JSON.parse(notification.metadata) 
        : notification.metadata;
    } catch (err) {
      console.error('Error parsing metadata:', err);
      return null;
    }
  };

  // Get icon and color based on notification type or metadata
  const getIconAndColor = (notification: Notification): { icon: string; color: string } => {
    const metadata = getMetadata(notification);
    
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
    if (metadata?.icon) {
      icon = metadata.icon;
    }
    
    if (metadata?.color) {
      color = metadata.color;
    }
    
    return { icon, color };
  };

  // Format date in a readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }
  };

  // Filter notifications based on search term
  const filteredNotifications = notifications.filter(notification => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      notification.title.toLowerCase().includes(term) ||
      notification.message.toLowerCase().includes(term)
    );
  });

  // Check if there are unread notifications
  const hasUnread = notifications.some(n => !n.isRead);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Check if actionLink is a meaningful link (not just dashboard)
  const isValidActionLink = (actionLink?: string): boolean => {
    if (!actionLink || actionLink.trim() === '') return false;
    const trimmed = actionLink.trim();
    // Don't show button for dashboard links (default/fallback values)
    return trimmed !== '/user' && trimmed !== '/admin' && trimmed !== '/developer';
  };

  return (
    <div className="inbox-container">
      {/* Header */}
      <div className="bg-white border-bottom d-flex justify-content-between align-items-center px-4 py-3" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="d-inline-block mb-0 me-3" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#202124' }}>
            {getContextTitle()}
          </h1>
          {unreadCount > 0 && (
            <span className="inbox-unread-badge">{unreadCount} unread</span>
          )}
        </div>
        <Link to={getBackLink()} className="d-inline-flex align-items-center gap-2 text-decoration-none px-3 py-2 rounded" style={{ color: '#5f6368', fontSize: '0.875rem' }}>
          <i className="bi bi-arrow-left"></i>
          Back
        </Link>
      </div>

      {/* Main Content */}
      <div className="inbox-content">
        {/* Left Sidebar - Notification List */}
        <div className="inbox-sidebar bg-white border-end">
          {/* Toolbar */}
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom gap-2">
            <div className="inbox-filter-tabs">
              <button
                className={`inbox-filter-tab ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread
                {unreadCount > 0 && <span className="filter-badge">{unreadCount}</span>}
              </button>
              <button
                className={`inbox-filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
            </div>
            
            {hasUnread && filter === 'all' && (
              <button
                className="btn btn-sm p-2 border-0 bg-transparent"
                onClick={handleMarkAllAsRead}
                disabled={markingAllRead}
                title="Mark all as read"
                style={{ color: '#5f6368' }}
              >
                {markingAllRead ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <i className="bi bi-check-all"></i>
                )}
              </button>
            )}
          </div>

          {/* Search */}
          <div className="inbox-search px-3 py-2 border-bottom">
            <i className="bi bi-search"></i>
            <input
              type="text"
              className="inbox-search-input form-control"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="inbox-search-clear"
                onClick={() => setSearchTerm('')}
                type="button"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="inbox-list">
            {loading ? (
              <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '200px' }}>
                <LoadingSpinner text="Loading notifications..." />
              </div>
            ) : error ? (
              <div className="p-3">
                <AlertMessage
                  type="danger"
                  message={error}
                  dismissible
                  onDismiss={() => setError(null)}
                />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '200px' }}>
                <EmptyState
                  icon={filter === 'unread' ? 'check-circle' : 'bell-slash'}
                  title={
                    searchTerm
                      ? "No matching notifications"
                      : filter === 'unread'
                      ? "No unread notifications"
                      : "No notifications"
                  }
                  message={
                    searchTerm
                      ? `No notifications match "${searchTerm}"`
                      : filter === 'unread'
                      ? "You've read all your notifications"
                      : "You don't have any notifications yet"
                  }
                />
              </div>
            ) : (
              filteredNotifications.map(notification => {
                const { icon, color } = getIconAndColor(notification);
                const isSelected = selectedNotification?.id === notification.id;
                
                return (
                  <div
                    key={notification.id}
                    className={`inbox-item p-3 border-bottom ${isSelected ? 'selected' : ''} ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="d-flex gap-3 align-items-start">
                      <div className="inbox-item-icon position-relative flex-shrink-0">
                        <div className={`icon-badge icon-badge-${color}`}>
                          <i className={`bi bi-${icon}`}></i>
                        </div>
                        {!notification.isRead && <div className="unread-indicator"></div>}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                          <h3 className="inbox-item-title mb-0" style={{ fontSize: '0.9375rem', fontWeight: notification.isRead ? 600 : 700, color: '#202124', lineHeight: 1.4, flex: 1, minWidth: 0 }}>
                            {notification.title}
                          </h3>
                          <span className="text-muted small" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="inbox-item-preview text-muted small mb-2" style={{ fontSize: '0.875rem', color: '#5f6368', lineHeight: 1.4 }}>
                          {notification.message}
                        </p>
                        <div className="d-flex gap-2 align-items-center">
                          <span className={`inbox-item-type type-${notification.type}`}>
                            {notification.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Notification Details */}
        <div className="inbox-detail-panel bg-white">
          {selectedNotification ? (
            <div className="inbox-detail">
              {/* Detail Header */}
              <div className="d-flex justify-content-between align-items-start gap-3 p-4 border-bottom">
                <div className="d-flex gap-3 flex-grow-1 min-w-0">
                  {(() => {
                    const { icon, color } = getIconAndColor(selectedNotification);
                    return (
                      <div className={`inbox-detail-icon icon-badge-${color}`}>
                        <i className={`bi bi-${icon}`}></i>
                      </div>
                    );
                  })()}
                  <div className="flex-grow-1 min-w-0">
                    <h2 className="mb-2" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#202124' }}>
                      {selectedNotification.title}
                    </h2>
                    <div className="d-flex gap-3 align-items-center flex-wrap">
                      <span className={`inbox-detail-type type-${selectedNotification.type}`}>
                        {selectedNotification.type}
                      </span>
                      <span className="text-muted small">
                        {new Date(selectedNotification.createdAt).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                  {!selectedNotification.isRead && (
                    <button
                      className="inbox-action-btn"
                      onClick={() => handleMarkAsRead(selectedNotification)}
                      title="Mark as read"
                    >
                      <i className="bi bi-check-circle"></i>
                    </button>
                  )}
                  {!isAdmin && (
                    <button
                      className="inbox-action-btn"
                      onClick={() => handleArchiveNotification(selectedNotification.id)}
                      disabled={deletingId === selectedNotification.id}
                      title="Archive"
                    >
                      {deletingId === selectedNotification.id ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        <i className="bi bi-archive"></i>
                      )}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      className="inbox-action-btn inbox-action-btn-danger"
                      onClick={() => handleDeleteNotification(selectedNotification.id)}
                      disabled={deletingId === selectedNotification.id}
                      title="Delete"
                    >
                      {deletingId === selectedNotification.id ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        <i className="bi bi-trash"></i>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Detail Body */}
              <div className="inbox-detail-body p-4">
                <div className="inbox-detail-message mb-4" style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: '#202124' }}>
                  {selectedNotification.message}
                </div>

                {isValidActionLink(selectedNotification.actionLink) && (
                  <div className="mt-4 pt-4 border-top">
                    <button
                      className="inbox-action-link-btn btn d-inline-flex align-items-center"
                      onClick={() => handleActionClick(selectedNotification)}
                    >
                      <i className="bi bi-box-arrow-up-right me-2"></i>
                      View Related Content
                    </button>
                  </div>
                )}

                {selectedNotification.metadata && (
                  <div className="mt-4 pt-4 border-top">
                    <h4 className="small fw-semibold text-uppercase text-muted mb-3" style={{ fontSize: '0.875rem', letterSpacing: '0.5px' }}>
                      Additional Information
                    </h4>
                    <pre className="bg-light border rounded p-3 mb-0" style={{ fontSize: '0.8125rem', overflowX: 'auto', color: '#202124' }}>
                      {JSON.stringify(getMetadata(selectedNotification), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center p-5 h-100 text-center">
              <div className="inbox-detail-empty-icon bg-light rounded-circle mb-3" style={{ color: '#5f6368' }}>
                <i className="bi bi-envelope-open"></i>
              </div>
              <h3 className="mb-2" style={{ fontSize: '1.125rem', fontWeight: 600, color: '#202124' }}>
                Select a notification
              </h3>
              <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>
                Choose a notification from the list to view its details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
