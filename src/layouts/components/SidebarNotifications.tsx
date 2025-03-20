// src/layouts/components/SidebarNotifications.tsx
import { useNotifications } from '@/features/notifications/context/NotificationContext';
import NotificationBell from '@/features/notifications/components/NotificationBell';

interface SidebarNotificationsProps {
  collapsed: boolean;
}

const SidebarNotifications = ({ collapsed }: SidebarNotificationsProps) => {
  const { showNotifications } = useNotifications();

  return (
    <div className={`sidebar-item d-flex ${collapsed ? 'justify-content-center' : 'px-3 py-2'}`}>
      {collapsed ? (
        <NotificationBell onClick={showNotifications} />
      ) : (
        <div 
          className="nav-link d-flex align-items-center text-light hover-highlight py-2 rounded"
          onClick={showNotifications}
          style={{ cursor: 'pointer' }}
        >
          <span onClick={(e) => e.stopPropagation()}>
            <NotificationBell onClick={() => {}} className="me-3" />
          </span>
          <span>Notifications</span>
        </div>
      )}
    </div>
  );
};

export default SidebarNotifications;