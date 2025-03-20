// src/features/notifications/components/NotificationModal.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Link } from 'react-router-dom';
import { Notification } from '@/types';
import { getNotifications } from '../services/NotificationService';
import NotificationItem from './NotificationItem';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal = ({ isOpen, onClose }: NotificationModalProps) => {
  const { user } = useAuthenticator();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen && user?.userId) {
      fetchNotifications();
    }
  }, [isOpen, user, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications(user.userId, filter === 'unread');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  // Filter notifications based on current filter
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(notification => !notification.isRead);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal backdrop */}
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
        }}
        onClick={onClose}
      ></div>
      
      {/* Modal dialog */}
      <div 
        className="modal d-block" 
        tabIndex={-1} 
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-bell me-2"></i>
                Notifications
              </h5>
              <div className="d-flex align-items-center">
                <div className="btn-group btn-group-sm me-2">
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
                <button 
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={handleRefresh}
                  title="Refresh notifications"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={onClose}
                  aria-label="Close"
                ></button>
              </div>
            </div>
            
            <div className="modal-body p-0">
              {loading ? (
                <div className="p-4 text-center">
                  <LoadingSpinner text="Loading notifications..." />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <EmptyState
                  icon="bell-slash"
                  title="No notifications"
                  message={filter === 'all' 
                    ? "You don't have any notifications yet." 
                    : "You don't have any unread notifications."}
                />
              ) : (
                <div className="notification-list">
                  {filteredNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onUpdate={handleRefresh}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {filteredNotifications.length > 0 && (
              <div className="modal-footer">
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
                  View All Notifications
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