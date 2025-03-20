// src/features/notifications/services/NotificationService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { 
  Notification, 
  NotificationPreference,
  ListNotificationsResponse,
  GetNotificationPreferenceResponse 
} from '../../../types';

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
    // Create a proper filter that works in both cases
    let filterConditions = [];
    
    // Always add the userId filter
    filterConditions.push({ userId: { eq: userId } });
    
    // Add isRead filter if only unread requested
    if (onlyUnread) {
      filterConditions.push({ isRead: { eq: false } });
    }
    
    // Build the filter object based on conditions
    let filter;
    if (filterConditions.length === 1) {
      filter = filterConditions[0]; // Just use the userId filter directly
    } else {
      filter = { and: filterConditions };
    }
    
    // Use an inline query that works with our filter structure
    const response = await client.graphql<GraphQLQuery<ListNotificationsResponse>>({
      query: /* GraphQL */ `
        query ListUserNotifications(
          $filter: ModelNotificationFilterInput!,
          $limit: Int
        ) {
          listNotifications(
            filter: $filter,
            limit: $limit
          ) {
            items {
              id
              userId
              type
              title
              message
              isRead
              actionLink
              metadata
              expiresAt
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: {
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
 * Get a specific notification by ID
 * @param id Notification ID
 * @returns Promise resolving to the notification or null if not found
 */
export const getNotificationById = async (id: string): Promise<Notification | null> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ getNotification: Notification }>>({
      query: /* GraphQL */ `
        query GetNotification($id: ID!) {
          getNotification(id: $id) {
            id
            userId
            type
            title
            message
            isRead
            actionLink
            metadata
            expiresAt
            createdAt
            updatedAt
          }
        }
      `,
      variables: { id },
      authMode: 'userPool'
    });
    
    return response.data?.getNotification || null;
  } catch (error) {
    console.error('Error fetching notification by ID:', error);
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
      query: /* GraphQL */ `
        query GetUnreadNotificationCount($filter: ModelNotificationFilterInput!) {
          listNotifications(filter: $filter) {
            items {
              id
            }
          }
        }
      `,
      variables: { 
        filter: { 
          and: [
            { userId: { eq: userId } },
            { isRead: { eq: false } }
          ]
        }
      },
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
 * Mark all notifications as read for a user
 * @param userId User ID
 * @returns Promise resolving when all notifications are marked as read
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    // First get all unread notifications
    const unreadNotifications = await getNotifications(userId, true, 100);
    
    // Then mark each as read in parallel
    await Promise.all(
      unreadNotifications.map(notification => 
        markAsRead(notification.id)
      )
    );
    
    console.log(`Marked ${unreadNotifications.length} notifications as read for user ${userId}`);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
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

// GraphQL query for getting user notification preferences
const getUserNotificationPreferences = /* GraphQL */ `
  query GetUserNotificationPreferences($userId: String!) {
    listNotificationPreferences(
      filter: { userId: { eq: $userId } },
      limit: 1
    ) {
      items {
        id
        userId
        receiveSystemNotifications
        receiveFileNotifications
        receiveAdminNotifications
        receiveUserNotifications
        emailNotifications
        inAppNotifications
        emailDigestFrequency
        createdAt
        updatedAt
      }
    }
  }
`;

// GraphQL mutation for creating a notification
const createNotificationMutation = /* GraphQL */ `
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
      id
      userId
      type
      title
      message
      isRead
      actionLink
      metadata
      expiresAt
      createdAt
      updatedAt
    }
  }
`;

// GraphQL mutation for marking a notification as read
const markNotificationAsReadMutation = /* GraphQL */ `
  mutation MarkNotificationAsRead($id: ID!) {
    updateNotification(input: {
      id: $id,
      isRead: true
    }) {
      id
      isRead
      updatedAt
    }
  }
`;

// GraphQL mutation for deleting a notification
const deleteNotificationMutation = /* GraphQL */ `
  mutation DeleteNotification($id: ID!) {
    deleteNotification(input: { id: $id }) {
      id
    }
  }
`;

// GraphQL mutation for updating notification preferences
const updateNotificationPreferencesMutation = /* GraphQL */ `
  mutation UpdateNotificationPreferences($input: UpdateNotificationPreferenceInput!) {
    updateNotificationPreference(input: $input) {
      id
      userId
      receiveSystemNotifications
      receiveFileNotifications
      receiveAdminNotifications
      receiveUserNotifications
      emailNotifications
      inAppNotifications
      emailDigestFrequency
      updatedAt
    }
  }
`;

// GraphQL mutation for creating notification preferences
const createNotificationPreferencesMutation = /* GraphQL */ `
  mutation CreateNotificationPreferences($input: CreateNotificationPreferenceInput!) {
    createNotificationPreference(input: $input) {
      id
      userId
      receiveSystemNotifications
      receiveFileNotifications
      receiveAdminNotifications
      receiveUserNotifications
      emailNotifications
      inAppNotifications
      emailDigestFrequency
      createdAt
      updatedAt
    }
  }
`;