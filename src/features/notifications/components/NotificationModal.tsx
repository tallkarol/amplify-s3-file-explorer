// src/features/notifications/components/NotificationModal.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Link } from 'react-router-dom';
import { Notification } from '@/types';
import { getNotifications, markAllAsRead } from '../services/NotificationService';
import NotificationItem from './NotificationItem';
// import LoadingSpinner from '@/components/common/LoadingSpinner';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal = ({ isOpen, onClose }: NotificationModalProps) => {
  const { user } = useAuthenticator();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    if (isOpen && user?.userId) {
      fetchNotifications();
    }
  }, [isOpen, user, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications(user.userId, filter === 'unread');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      await markAllAsRead(user.userId);
      handleRefresh();
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Failed to mark notifications as read.');
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Filter notifications based on current filter
  const filteredNotifications = notifications;
  const hasUnread = notifications.some(notification => !notification.isRead);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal backdrop with blur effect */}
      <div 
        className="modal-backdrop" 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1040,
          display: 'block',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
      ></div>
      
      {/* Modal dialog */}
      <div 
        className="modal d-block" 
        tabIndex={-1} 
        style={{ zIndex: 1050 }}
      >
        {/* Expanded modal size to 80vh and 80vw */}
        <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-xl notification-expanded-modal" 
             style={{ 
               maxWidth: '80vw', 
               width: '80vw', 
               height: '80vh', 
               maxHeight: '80vh',
               animation: 'slideIn 0.3s ease-out' 
             }}>
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden h-100">
            {/* Improved header with gradient background */}
            <div className="modal-header border-0 py-3" 
                 style={{ 
                   background: 'linear-gradient(to right, rgba(74, 108, 247, 0.9), rgba(117, 81, 194, 0.9))',
                   color: 'white'
                 }}>
              <h5 className="modal-title fw-bold d-flex align-items-center">
                <i className="bi bi-bell me-2"></i>
                Notifications
              </h5>
              <div className="d-flex align-items-center">
                {hasUnread && (
                  <button 
                    className="btn btn-sm btn-light me-2"
                    onClick={handleMarkAllAsRead}
                    disabled={markingAllRead || !hasUnread}
                    title="Mark all as read"
                  >
                    {markingAllRead ? (
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-check2-all me-1"></i>
                    )}
                    Mark all read
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={onClose}
                  aria-label="Close"
                ></button>
              </div>
            </div>
            
            {/* Filter tabs */}
            <div className="px-3 pt-3 pb-0">
              <ul className="nav nav-tabs nav-fill border-0">
                <li className="nav-item">
                  <button 
                    className={`nav-link rounded-top ${filter === 'all' ? 'active bg-white' : 'text-muted'}`}
                    onClick={() => setFilter('all')}
                  >
                    <i className="bi bi-collection me-2"></i>
                    All Notifications
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link rounded-top ${filter === 'unread' ? 'active bg-white' : 'text-muted'}`}
                    onClick={() => setFilter('unread')}
                  >
                    <i className="bi bi-envelope me-2"></i>
                    Unread
                    {hasUnread && (
                      <span className="badge bg-primary ms-2 rounded-pill">
                        {notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="modal-body p-0 overflow-auto">
              {loading ? (
                <div className="p-5 text-center">
                  <div className="notification-loading-animation mb-3">
                    <div className="notification-bell">
                      <i className="bi bi-bell fs-1 text-primary"></i>
                    </div>
                    <div className="notification-badge"></div>
                  </div>
                  <p className="text-muted">Loading your notifications...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger border-0 rounded-0 m-0">
                  <div className="d-flex">
                    <div className="me-3">
                      <i className="bi bi-exclamation-triangle-fill fs-4 text-danger"></i>
                    </div>
                    <div>
                      <h6 className="alert-heading mb-1">Something went wrong</h6>
                      <p className="mb-2">{error}</p>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleRefresh}
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center p-5">
                  <div className="mb-3" style={{ opacity: 0.7 }}>
                    <i className="bi bi-bell-slash fs-1 text-muted"></i>
                  </div>
                  <h5 className="mb-2">No notifications</h5>
                  <p className="text-muted mb-0">
                    {filter === 'all' 
                      ? "You don't have any notifications yet." 
                      : "You don't have any unread notifications."}
                  </p>
                  {filter === 'unread' && (
                    <button
                      className="btn btn-link"
                      onClick={() => setFilter('all')}
                    >
                      View all notifications
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Toolbar */}
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
                    <span className="text-muted small">
                      {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                    </span>
                    <button 
                      className="btn btn-sm btn-link text-decoration-none"
                      onClick={handleRefresh}
                      title="Refresh notifications"
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      Refresh
                    </button>
                  </div>
                  
                  {/* Notification list */}
                  <div className="notification-list">
                    {filteredNotifications.map((notification, index) => (
                      <div key={notification.id} 
                           style={{
                             animation: `fadeInSlide 0.3s ease-out ${index * 0.05}s both`
                           }}>
                        <NotificationItem
                          notification={notification}
                          onUpdate={handleRefresh}
                          onClose={onClose} // Pass onClose to each NotificationItem
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Footer with multiple actions */}
            {filteredNotifications.length > 0 && (
              <div className="modal-footer border-top py-3">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                >
                  Close
                </button>
                <Link 
                  to="/notifications"
                  className="btn btn-primary"
                  onClick={onClose}
                >
                  <i className="bi bi-arrows-fullscreen me-1"></i>
                  View Full Page
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationModal;