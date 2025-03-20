// src/features/notifications/context/NotificationContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    if (user?.userId) {
      refreshUnreadCount();
      // Set up a refresh interval
      const interval = setInterval(() => {
        refreshUnreadCount();
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user?.userId) return;
    
    try {
      await getNotifications(user.userId);
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const refreshUnreadCount = async () => {
    if (!user?.userId) return;
    
    try {
      const count = await getUnreadCount(user.userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
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