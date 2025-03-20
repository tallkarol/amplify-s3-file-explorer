// src/layouts/components/SidebarNotifications.tsx
import { useNotifications } from '@/features/notifications/context/NotificationContext';
import NotificationBell from '@/features/notifications/components/NotificationBell';
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

  return (
    <div className={`sidebar-item d-flex ${collapsed ? 'justify-content-center' : 'px-3 py-2'}`}>
      {collapsed ? (
        <div className="position-relative">
          <NotificationBell onClick={showNotifications} />
          {/* Click on bell icon shows modal, but entire area navigates to inbox */}
          <Link to={inboxPath} className="stretched-link" title="Go to Inbox"></Link>
        </div>
      ) : (
        <div className="d-flex w-100">
          <div 
            className="nav-link d-flex align-items-center text-light hover-highlight py-2 rounded w-100"
            style={{ cursor: 'pointer' }}
          >
            {/* Bell icon shows the notification modal */}
            <span className="me-3" onClick={showNotifications}>
              <NotificationBell onClick={() => {}} />
            </span>
            
            {/* Text part navigates to the inbox page */}
            <Link to={inboxPath} className="d-flex align-items-center justify-content-between w-100 text-white text-decoration-none">
              <span>Inbox</span>
              {unreadCount > 0 && (
                <span className="badge bg-primary rounded-pill ms-2">{unreadCount}</span>
              )}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarNotifications;