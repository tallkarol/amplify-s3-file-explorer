// src/layouts/components/SidebarNotifications.tsx
import { useNotifications } from '@/features/notifications/context/NotificationContext';
import { Link, useLocation } from 'react-router-dom';

interface SidebarNotificationsProps {
  collapsed: boolean;
}

const SidebarNotifications = ({ collapsed }: SidebarNotificationsProps) => {
  const { showNotifications, unreadCount } = useNotifications();
  const location = useLocation();
  
  // Determine the correct inbox path based on current location
  const getInboxPath = (): string => {
    if (location.pathname.startsWith('/admin')) {
      return '/admin/inbox';
    } else if (location.pathname.startsWith('/developer')) {
      return '/developer/inbox';
    } else {
      return '/inbox';
    }
  };
  
  const inboxPath = getInboxPath();
  const hasUnread = unreadCount > 0;

  return (
    <div className={`sidebar-notification ${hasUnread ? 'notification-has-unread' : ''}`}>
      <div className="d-flex align-items-center">
        <div className="sidebar-notification-link" role="button">
          {/* Bell icon that toggles notifications modal */}
          <div 
            className="notification-icon-container"
            onClick={showNotifications}
            title="Show notifications"
          >
            <i className="bi bi-bell-fill notification-icon"></i>
          </div>
          
          {!collapsed && (
            <>
              {/* Text part navigates to the inbox page */}
              <Link to={inboxPath} className="notification-label text-decoration-none text-white">
                Inbox
              </Link>
              
              {/* Badge with unread count */}
              {hasUnread && (
                <span className="notification-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </>
          )}
          
          {/* Badge for collapsed sidebar */}
          {collapsed && hasUnread && (
            <span className="notification-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
      
      {/* Invisible link for the whole element in collapsed mode */}
      {collapsed && (
        <Link 
          to={inboxPath} 
          className="stretched-link" 
          title="Go to Inbox"
          aria-label="Go to Inbox"
        ></Link>
      )}
    </div>
  );
};

export default SidebarNotifications;