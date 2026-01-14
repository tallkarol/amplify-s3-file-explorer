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
  const isActive = location.pathname === inboxPath || location.pathname.startsWith(`${inboxPath}/`);

  return (
    <li className="nav-item mb-2">
      <Link 
        to={inboxPath}
        className={`nav-link px-3 py-2 d-flex align-items-center rounded ${
          isActive
            ? 'active bg-primary text-white' 
            : 'text-light hover-highlight'
        }`}
        onClick={(e) => {
          // If clicking on icon, show notifications modal instead of navigating
          const target = e.target as HTMLElement;
          if (target.closest('.notification-icon-clickable')) {
            e.preventDefault();
            showNotifications();
          }
        }}
      >
        <i 
          className={`bi bi-bell${hasUnread ? '-fill' : ''} me-3 fs-5 notification-icon-clickable`}
          style={{ cursor: 'pointer' }}
          title="Show notifications"
        ></i>
        {!collapsed && (
          <>
            <span>Inbox</span>
            {hasUnread && (
              <span className="notification-badge ms-auto">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </>
        )}
        {collapsed && hasUnread && (
          <span className="notification-badge notification-badge-collapsed">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </li>
  );
};

export default SidebarNotifications;