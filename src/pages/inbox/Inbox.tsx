// src/pages/inbox/Inbox.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '@/features/notifications/services/NotificationService';
import { Notification } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import AlertMessage from '@/components/common/AlertMessage';
import { useNavigate, Link } from 'react-router-dom';

const Inbox = () => {
  const { user } = useAuthenticator();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
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

  // Fetch notifications on component mount and when filter changes
  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab, filter]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user?.userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications(user.userId, filter === 'unread');
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(`Failed to load notifications: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(`Failed to mark notification as read: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteNotification(id);
      
      // Update local state to remove the deleted notification
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Clear selection if the deleted notification was selected
      if (selectedNotification?.id === id) {
        setSelectedNotification(null);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(`Failed to delete notification: ${err instanceof Error ? err.message : String(err)}`);
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
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // For today, show the time
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
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

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>{getContextTitle()}</h2>
              <p className="text-muted">
                View and manage your notifications and messages in one place.
              </p>
            </div>
            <Link to={getBackLink()} className="btn btn-outline-primary">
              <i className="bi bi-arrow-left me-2"></i>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          {/* Tab navigation */}
          <ul className="nav nav-tabs mb-4 d-flex">
            <li className="nav-item flex-fill">
              <button
                className={`nav-link small w-100 d-flex align-items-center justify-content-center ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <i className="bi bi-bell me-2"></i>
                Notifications
              </button>
            </li>
            <li className="nav-item flex-fill">
              <button
                className={`nav-link small w-100 d-flex align-items-center justify-content-center ${activeTab === 'messages' ? 'active' : ''}`}
                onClick={() => setActiveTab('messages')}
              >
                <i className="bi bi-chat-left-text me-2"></i>
                Messages
                <span className="badge bg-secondary ms-2">Coming Soon</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {activeTab === 'notifications' ? (
        <div className="row">
          {/* Left column - List of notifications */}
          <div className="col-md-5 col-lg-4 mb-4 mb-md-0">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-bell me-2"></i>
                    Notifications
                  </h5>
                  <div className="btn-group btn-group-sm">
                    <button
                      className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('all')}
                    >
                      All
                    </button>
                    <button
                      className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilter('unread')}
                    >
                      Unread
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="card-header bg-white border-top-0 border-bottom-0 pb-0">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 bg-light"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      type="button"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="card-body p-0">
                {loading ? (
                  <div className="p-4 text-center">
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
                ) : (
                  <div className="notification-list">
                    {filteredNotifications.map(notification => {
                      const { icon, color } = getIconAndColor(notification);
                      
                      return (
                        <div
                          key={notification.id}
                          className={`p-3 border-bottom ${
                            selectedNotification?.id === notification.id ? 'bg-light' : ''
                          } ${!notification.isRead ? 'fw-medium' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="d-flex">
                            <div 
                              className={`bg-${color}-subtle text-${color} p-2 rounded me-3`}
                              style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <i className={`bi bi-${icon} fs-5`}></i>
                            </div>
                            <div className="flex-grow-1 min-width-0">
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <h6 className="mb-0 text-truncate me-2" style={{ maxWidth: '85%' }}>
                                  {notification.title}
                                </h6>
                                {!notification.isRead && (
                                  <span className="badge bg-primary rounded-pill">New</span>
                                )}
                              </div>
                              <p className="text-muted small mb-1 text-truncate">
                                {notification.message}
                              </p>
                              <div className="d-flex align-items-center">
                                <small className="text-muted me-2">
                                  {formatDate(notification.createdAt)}
                                </small>
                                <span 
                                  className={`badge ${notification.type === 'system' ? 'bg-info' : 
                                                      notification.type === 'file' ? 'bg-success' : 
                                                      notification.type === 'admin' ? 'bg-danger' : 
                                                      'bg-primary'} bg-opacity-75`}
                                >
                                  {notification.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="card-footer bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">
                      {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                    </span>
                    <div>
                      {hasUnread && (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={handleMarkAllAsRead}
                          disabled={markingAllRead}
                        >
                          {markingAllRead ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1"></span>
                              Marking...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-all me-1"></i>
                              Mark All Read
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right column - Notification details */}
          <div className="col-md-7 col-lg-8">
            <div className="card border-0 shadow-sm h-100">
              {selectedNotification ? (
                <>
                  <div className="card-header bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">{selectedNotification.title}</h5>
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          id="notificationActions"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i className="bi bi-three-dots"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="notificationActions">
                          {!selectedNotification.isRead && (
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => handleMarkAsRead(selectedNotification)}
                              >
                                <i className="bi bi-check-circle me-2"></i>
                                Mark as Read
                              </button>
                            </li>
                          )}
                          <li>
                            <button
                              className="dropdown-item text-danger"
                              onClick={() => handleDeleteNotification(selectedNotification.id)}
                              disabled={deletingId === selectedNotification.id}
                            >
                              {deletingId === selectedNotification.id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-trash me-2"></i>
                                  Delete
                                </>
                              )}
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="d-flex mb-4">
                      {(() => {
                        const { icon, color } = getIconAndColor(selectedNotification);
                        return (
                          <div 
                            className={`bg-${color}-subtle text-${color} p-3 rounded me-3`}
                            style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <i className={`bi bi-${icon} fs-2`}></i>
                          </div>
                        );
                      })()}
                      <div>
                        <div className="mb-2">
                          <span 
                            className={`badge ${selectedNotification.type === 'system' ? 'bg-info' : 
                                            selectedNotification.type === 'file' ? 'bg-success' : 
                                            selectedNotification.type === 'admin' ? 'bg-danger' : 
                                            'bg-primary'}`}
                          >
                            {selectedNotification.type}
                          </span>
                          <span className="text-muted ms-2">
                            <i className="bi bi-clock me-1"></i>
                            {new Date(selectedNotification.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="lead mb-0">{selectedNotification.message}</p>
                      </div>
                    </div>
                    
                    {selectedNotification.actionLink && (
                      <div className="d-grid mt-4">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleActionClick(selectedNotification)}
                        >
                          <i className="bi bi-box-arrow-up-right me-2"></i>
                          View Related Content
                        </button>
                      </div>
                    )}
                    
                    {/* Additional metadata if available */}
                    {selectedNotification.metadata && (
                      <div className="card bg-light mt-4">
                        <div className="card-header bg-transparent">
                          <h6 className="mb-0">Additional Information</h6>
                        </div>
                        <div className="card-body">
                          <pre className="mb-0" style={{ fontSize: '0.875rem' }}>
                            {JSON.stringify(getMetadata(selectedNotification), null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="card-body d-flex flex-column align-items-center justify-content-center p-5">
                  <div 
                    className="bg-light rounded-circle mb-3 d-flex align-items-center justify-content-center"
                    style={{ width: '80px', height: '80px' }}
                  >
                    <i className="bi bi-envelope-open text-muted fs-1"></i>
                  </div>
                  <h4>Select a notification</h4>
                  <p className="text-muted text-center mb-0">
                    Choose a notification from the list to view its details here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-5 text-center">
                <div 
                  className="bg-light rounded-circle mb-3 mx-auto d-flex align-items-center justify-content-center"
                  style={{ width: '100px', height: '100px' }}
                >
                  <i className="bi bi-chat-dots text-primary fs-1"></i>
                </div>
                <h3>Messaging Coming Soon</h3>
                <p className="text-muted mb-4">
                  We're working on bringing you a powerful messaging system.<br />
                  Stay tuned for updates!
                </p>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => setActiveTab('notifications')}
                >
                  <i className="bi bi-bell me-2"></i>
                  View Notifications Instead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;