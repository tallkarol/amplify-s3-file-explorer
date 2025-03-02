// src/components/notification/NotificationIcon.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getUnreadCount } from '../../../features/notifications/services/NotificationService';

interface NotificationIconProps {
  collapsed?: boolean;
}

const NotificationIcon = ({ collapsed = false }: NotificationIconProps) => {
  const { user } = useAuthenticator();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch unread notification count
    const fetchUnreadCount = async () => {
      try {
        setLoading(true);
        const count = await getUnreadCount(user.userId);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Set up polling for notifications every 60 seconds
    const intervalId = setInterval(fetchUnreadCount, 60000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [user.userId]);

  // Handle click to navigate to notifications page
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/notifications');
  };

  return (
    <a 
      href="#"
      onClick={handleClick}
      className="nav-link px-3 py-2 d-flex align-items-center rounded text-light hover-highlight position-relative"
    >
      {loading ? (
        <i className="bi bi-hourglass me-3 fs-5"></i>
      ) : (
        <i className="bi bi-bell me-3 fs-5"></i>
      )}
      {!collapsed && <span>Notifications</span>}
      
      {unreadCount > 0 && (
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ marginLeft: '-1rem' }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </a>
  );
};

export default NotificationIcon;