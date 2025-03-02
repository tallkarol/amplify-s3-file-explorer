// src/services/NotificationService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { 
  Notification, 
  NotificationPreference,
  ListNotificationsResponse,
  GetNotificationPreferenceResponse 
} from '../../../types';
import {
  listUserNotifications,
  getUnreadNotificationCount,
  getUserNotificationPreferences,
  createNotificationMutation,
  markNotificationAsReadMutation,
  deleteNotificationMutation,
  updateNotificationPreferencesMutation,
  createNotificationPreferencesMutation
} from '../graphql/notifications';

const client = generateClient();

/**
 * Get notifications for a user
 * @param userId User ID
 * @param onlyUnread Whether to filter to only unread notifications
 * @param limit Number of notifications to fetch
 * @returns Promise resolving to an array of notifications
 */
export const getNotifications = async (
  userId: string, 
  onlyUnread = false, 
  limit = 20
): Promise<Notification[]> => {
  try {
    const filter = onlyUnread ? { isRead: { eq: false } } : null;
    
    const response = await client.graphql<GraphQLQuery<ListNotificationsResponse>>({
      query: listUserNotifications,
      variables: {
        userId,
        filter,
        limit
      },
      authMode: 'userPool'
    });
    
    return response.data?.listNotifications.items || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get the count of unread notifications
 * @param userId User ID
 * @returns Promise resolving to the count of unread notifications
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ listNotifications: { items: { id: string }[] } }>>({
      query: getUnreadNotificationCount,
      variables: { userId },
      authMode: 'userPool'
    });
    
    return response.data?.listNotifications.items.length || 0;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

/**
 * Get notification preferences for a user
 * @param userId User ID
 * @returns Promise resolving to the user's notification preferences
 */
export const getNotificationPreferences = async (userId: string): Promise<NotificationPreference | null> => {
  try {
    const response = await client.graphql<GraphQLQuery<GetNotificationPreferenceResponse>>({
      query: getUserNotificationPreferences,
      variables: { userId },
      authMode: 'userPool'
    });
    
    const items = response.data?.listNotificationPreferences.items || [];
    return items.length > 0 ? items[0] : null;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    throw error;
  }
};

/**
 * Create a new notification
 * @param notification Notification data to create
 * @returns Promise resolving to the created notification
 */
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ createNotification: Notification }>>({
      query: createNotificationMutation,
      variables: {
        input: notification
      },
      authMode: 'userPool'
    });
    
    return response.data!.createNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param notificationId ID of the notification to mark as read
 * @returns Promise resolving to the updated notification
 */
export const markAsRead = async (notificationId: string): Promise<{ id: string; isRead: boolean }> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ updateNotification: { id: string; isRead: boolean } }>>({
      query: markNotificationAsReadMutation,
      variables: { id: notificationId },
      authMode: 'userPool'
    });
    
    return response.data!.updateNotification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param notificationId ID of the notification to delete
 * @returns Promise resolving when the notification is deleted
 */
export const deleteNotification = async (notificationId: string): Promise<{ id: string }> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ deleteNotification: { id: string } }>>({
      query: deleteNotificationMutation,
      variables: { id: notificationId },
      authMode: 'userPool'
    });
    
    return response.data!.deleteNotification;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Update notification preferences
 * @param preferences Notification preferences to update
 * @returns Promise resolving to the updated preferences
 */
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreference> & { id: string }
): Promise<NotificationPreference> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ updateNotificationPreference: NotificationPreference }>>({
      query: updateNotificationPreferencesMutation,
      variables: {
        input: preferences
      },
      authMode: 'userPool'
    });
    
    return response.data!.updateNotificationPreference;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Create initial notification preferences for a user
 * @param userId User ID
 * @returns Promise resolving to the created preferences
 */
export const createInitialNotificationPreferences = async (userId: string): Promise<NotificationPreference> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ createNotificationPreference: NotificationPreference }>>({
      query: createNotificationPreferencesMutation,
      variables: {
        input: {
          userId,
          receiveSystemNotifications: true,
          receiveFileNotifications: true,
          receiveAdminNotifications: true,
          receiveUserNotifications: true,
          emailNotifications: true,
          inAppNotifications: true,
          emailDigestFrequency: 'instant'
        }
      },
      authMode: 'userPool'
    });
    
    return response.data!.createNotificationPreference;
  } catch (error) {
    console.error('Error creating notification preferences:', error);
    throw error;
  }
};