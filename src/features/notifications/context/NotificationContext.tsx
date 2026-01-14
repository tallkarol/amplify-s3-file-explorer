// src/features/notifications/context/NotificationContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
// import { Notification } from '@/types';
import { getNotifications, getUnreadCount } from '../services/NotificationService';
import NotificationModal from '../components/NotificationModal';

interface NotificationContextType {
  showNotifications: () => void;
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuthenticator();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Define refreshUnreadCount first so it can be used in useEffect
  const refreshUnreadCount = useCallback(async () => {
    if (!user?.userId) return;
    
    try {
      const count = await getUnreadCount(user.userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  }, [user?.userId]); // Memoize to prevent recreation on every render

  useEffect(() => {
    if (!user?.userId) return;
    
    // Initial fetch
    refreshUnreadCount();
    
    // Only poll when tab is visible and user is active (reduces costs significantly)
    // Check every 5 minutes instead of 1 minute to reduce API calls
    const interval = setInterval(() => {
      // Only poll if tab is visible (user is actively using the app)
      if (document.visibilityState === 'visible') {
        refreshUnreadCount();
      }
    }, 300000); // Check every 5 minutes (reduced from 1 minute)
    
    return () => clearInterval(interval);
  }, [user?.userId, refreshUnreadCount]); // Include refreshUnreadCount in dependencies

  const fetchNotifications = async () => {
    if (!user?.userId) return;
    
    try {
      await getNotifications(user.userId);
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const showNotifications = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    refreshUnreadCount();
  };

  return (
    <NotificationContext.Provider value={{
      showNotifications,
      unreadCount,
      fetchNotifications,
      refreshUnreadCount
    }}>
      {children}
      <NotificationModal isOpen={isModalOpen} onClose={closeModal} />
    </NotificationContext.Provider>
  );
};