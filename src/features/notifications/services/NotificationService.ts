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
    // Build filter - use simpler structure that works reliably
    const filter: any = {
      userId: { eq: userId }
    };
    
    // Add isRead filter if only unread requested
    if (onlyUnread) {
      filter.isRead = { eq: false };
    }
    
    // Use an inline query that works with our filter structure
    // Note: If isArchived field doesn't exist in deployed schema yet, this will fail
    // Check browser console for detailed error messages
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
              isArchived
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
    
    // Filter out archived notifications client-side (more reliable than GraphQL filter for optional fields)
    // Treat null/undefined as "not archived" (falsy values)
    const items = response.data?.listNotifications.items || [];
    // Safely filter - handle case where isArchived might not exist in response yet
    return items.filter(n => {
      // If isArchived doesn't exist or is null/undefined/false, include it (not archived)
      return n.isArchived !== true;
    });
  } catch (error: any) {
    // Extract error message first - this is what users need to see
    const errorMessage = error?.message || error?.errors?.[0]?.message || 'Unknown error';
    const errorType = error?.errorType || error?.errors?.[0]?.errorType || 'Unknown';
    
    // Log a clean, readable error message
    console.error(`[getNotifications] Error: ${errorMessage}`, {
      errorType,
      userId,
      onlyUnread,
      limit,
      // Only log full error details if it's a GraphQL error
      ...(error?.errors && {
        graphQLErrors: error.errors.map((e: any) => ({
          message: e.message,
          errorType: e.errorType,
          path: e.path,
          locations: e.locations
        }))
      }),
      ...(error?.networkError && { networkError: error.networkError })
    });
    
    // Log full error object only in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('[getNotifications] Full error object:', error);
    }
    
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
            isArchived
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
 * Get all notifications for a user (admin view - includes archived)
 * @param userId User ID
 * @param includeArchived Whether to include archived notifications
 * @param limit Number of notifications to fetch
 * @returns Promise resolving to an array of notifications
 */
export const getAllNotificationsForUser = async (
  userId: string,
  includeArchived = true,
  limit = 100
): Promise<Notification[]> => {
  try {
    let filterConditions = [];
    
    // Always add the userId filter
    filterConditions.push({ userId: { eq: userId } });
    
    const filter = filterConditions.length === 1 
      ? filterConditions[0] 
      : { and: filterConditions };
    
    const response = await client.graphql<GraphQLQuery<ListNotificationsResponse>>({
      query: /* GraphQL */ `
        query GetAllUserNotifications(
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
              isArchived
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
    
    const items = response.data?.listNotifications.items || [];
    
    // Filter out archived if not including them (treat null as not archived)
    if (!includeArchived) {
      return items.filter(n => n.isArchived !== true);
    }
    
    return items;
  } catch (error) {
    console.error('Error fetching all notifications for user:', error);
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
    const response = await client.graphql<GraphQLQuery<{ listNotifications: { items: { id: string; isArchived: boolean | null }[] } }>>({
      query: /* GraphQL */ `
        query GetUnreadNotificationCount($filter: ModelNotificationFilterInput!) {
          listNotifications(filter: $filter) {
            items {
              id
              isArchived
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
    
    // Filter out archived notifications (treat null as not archived)
    const items = response.data?.listNotifications.items || [];
    return items.filter(n => n.isArchived !== true).length;
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
    // Build input object, only including defined fields
    // GraphQL JSON types need proper handling - omit undefined values
    const input: any = {
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      // Only include isArchived if explicitly set (allow null/undefined to mean "not archived")
      ...(notification.isArchived !== undefined && notification.isArchived !== null 
        ? { isArchived: notification.isArchived } 
        : {}),
    };
    
    // Only include optional fields if they have valid values
    if (notification.actionLink !== undefined && notification.actionLink !== null && notification.actionLink !== '') {
      input.actionLink = notification.actionLink;
    }
    
    // TEMPORARILY OMIT METADATA - it's causing "Variable 'metadata' has an invalid value" GraphQL errors
    // The mutation fails before reaching the database when metadata is included
    // Other working examples (post-confirmation handler, NotificationDemo) omit metadata
    // TODO: Investigate correct JSON field format for Amplify Gen 2 GraphQL mutations
    // if (notification.metadata !== undefined && notification.metadata !== null) {
    //   input.metadata = notification.metadata;
    // }
    
    if (notification.expiresAt !== undefined && notification.expiresAt !== null) {
      input.expiresAt = notification.expiresAt;
    }
    
    const response = await client.graphql<GraphQLQuery<{ createNotification: Notification }>>({
      query: createNotificationMutation,
      variables: {
        input
      },
      authMode: 'userPool'
    });
    
    return response.data!.createNotification;
  } catch (error: any) {
    console.error('Error creating notification:', {
      error,
      errorMessage: error?.message,
      errorType: error?.errorType,
      graphQLErrors: error?.errors || error?.graphQLErrors,
      networkError: error?.networkError,
      notificationPayload: notification
    });
    // Log the full error object for debugging
    if (error?.errors) {
      console.error('GraphQL Errors:', JSON.stringify(error.errors, null, 2));
    }
    if (error?.graphQLErrors) {
      console.error('GraphQL Errors (alt):', JSON.stringify(error.graphQLErrors, null, 2));
    }
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
  } catch (error: any) {
    console.error('Error marking notification as read:', {
      error,
      errorMessage: error?.message,
      graphQLErrors: error?.errors || error?.graphQLErrors,
      notificationId
    });
    if (error?.errors) {
      console.error('GraphQL Errors:', JSON.stringify(error.errors, null, 2));
    }
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
 * Archive a notification
 * @param notificationId ID of the notification to archive
 * @returns Promise resolving to the updated notification
 */
export const archiveNotification = async (notificationId: string): Promise<{ id: string; isArchived: boolean }> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ updateNotification: { id: string; isArchived: boolean } }>>({
      query: archiveNotificationMutation,
      variables: { 
        input: {
          id: notificationId,
          isArchived: true
        }
      },
      authMode: 'userPool'
    });
    
    return response.data!.updateNotification;
  } catch (error: any) {
    console.error('Error archiving notification:', {
      error,
      errorMessage: error?.message,
      graphQLErrors: error?.errors || error?.graphQLErrors,
      notificationId
    });
    if (error?.errors) {
      console.error('GraphQL Errors:', JSON.stringify(error.errors, null, 2));
    }
    throw error;
  }
};

/**
 * Unarchive a notification
 * @param notificationId ID of the notification to unarchive
 * @returns Promise resolving to the updated notification
 */
export const unarchiveNotification = async (notificationId: string): Promise<{ id: string; isArchived: boolean }> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ updateNotification: { id: string; isArchived: boolean } }>>({
      query: archiveNotificationMutation,
      variables: { 
        input: {
          id: notificationId,
          isArchived: false
        }
      },
      authMode: 'userPool'
    });
    
    return response.data!.updateNotification;
  } catch (error: any) {
    console.error('Error unarchiving notification:', {
      error,
      errorMessage: error?.message,
      graphQLErrors: error?.errors || error?.graphQLErrors,
      notificationId
    });
    if (error?.errors) {
      console.error('GraphQL Errors:', JSON.stringify(error.errors, null, 2));
    }
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
      isArchived
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

// GraphQL mutation for archiving/unarchiving a notification
const archiveNotificationMutation = /* GraphQL */ `
  mutation ArchiveNotification($input: UpdateNotificationInput!) {
    updateNotification(input: $input) {
      id
      isArchived
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