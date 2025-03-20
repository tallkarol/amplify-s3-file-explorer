// src/features/notifications/components/NotificationBell.tsx
import { useState, useEffect } from 'react';
import { getUnreadCount } from '../services/NotificationService';
import { useAuthenticator } from '@aws-amplify/ui-react';

interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

const NotificationBell = ({ onClick, className = '' }: NotificationBellProps) => {
  const { user } = useAuthenticator();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.userId) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      setLoading(true);
      const count = await getUnreadCount(user.userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      className={`btn btn-link text-decoration-none position-relative ${className}`}
      onClick={onClick}
      title="Notifications"
    >
      <i className="bi bi-bell fs-5"></i>
      {!loading && unreadCount > 0 && (
        <span 
          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
          style={{ fontSize: '0.6rem' }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
          <span className="visually-hidden">unread notifications</span>
        </span>
      )}
    </button>
  );
};

export default NotificationBell;