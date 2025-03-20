// src/features/notifications/hooks/useNotification.ts
import { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { createNotification } from '../services/NotificationService';
import { useNotifications } from '../context/NotificationContext';

type NotificationType = 'system' | 'file' | 'admin' | 'user';

interface CreateNotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  actionLink?: string;
  metadata?: Record<string, any>;
  userId?: string; // Optional, defaults to current user
}

interface UseNotificationReturn {
  createUserNotification: (options: CreateNotificationOptions) => Promise<string | null>;
  isCreating: boolean;
  error: string | null;
}

/**
 * A hook for easily creating notifications from any component
 */
export const useNotification = (): UseNotificationReturn => {
  const { user } = useAuthenticator();
  const { refreshUnreadCount } = useNotifications();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a notification for the current user or a specified user
   * @param options Notification options
   * @returns Promise resolving to the ID of the created notification or null if failed
   */
  const createUserNotification = async (options: CreateNotificationOptions): Promise<string | null> => {
    if (!user && !options.userId) {
      setError('No user is authenticated');
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Prepare the notification data
      const notification = {
        userId: options.userId || user.userId,
        type: options.type || 'system',
        title: options.title,
        message: options.message,
        isRead: false,
        actionLink: options.actionLink,
        metadata: options.metadata || {}
      };

      // Create the notification
      const result = await createNotification(notification);
      
      // Refresh the unread count if the notification is for the current user
      if (!options.userId || options.userId === user.userId) {
        await refreshUnreadCount();
      }

      return result.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error creating notification:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createUserNotification,
    isCreating,
    error
  };
};

export default useNotification;