// src/services/loginTrackingService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { getAllAdminUserIds } from './adminService';
import { createNotification } from '@/features/notifications/services/NotificationService';

const client = generateClient();

/**
 * Track user login and notify admins on first login
 * @param userId User ID
 * @param userEmail User email
 * @returns Promise resolving when tracking is complete
 */
export const trackUserLogin = async (userId: string, userEmail: string): Promise<void> => {
  try {
    // Get the user's profile
    const getUserProfileQuery = /* GraphQL */ `
      query GetUserProfile($uuid: String!) {
        listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 1) {
          items {
            id
            email
            firstName
            lastName
            firstLoginAt
            lastLoginAt
          }
        }
      }
    `;

    const response = await client.graphql<GraphQLQuery<any>>({
      query: getUserProfileQuery,
      variables: { uuid: userId },
      authMode: 'userPool'
    });

    const profile = response.data?.listUserProfiles?.items[0];
    
    if (!profile) {
      console.error('User profile not found for login tracking');
      return;
    }

    const isFirstLogin = !profile.firstLoginAt;
    const now = new Date().toISOString();
    
    // Update the profile with login timestamps
    const updateProfileMutation = /* GraphQL */ `
      mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
        updateUserProfile(input: $input) {
          id
          firstLoginAt
          lastLoginAt
        }
      }
    `;

    const updateInput: any = {
      id: profile.id,
      lastLoginAt: now
    };

    // Only set firstLoginAt if this is the first login
    if (isFirstLogin) {
      updateInput.firstLoginAt = now;
    }

    await client.graphql<GraphQLQuery<any>>({
      query: updateProfileMutation,
      variables: { input: updateInput },
      authMode: 'userPool'
    });

    // If this is the first login, notify all admins
    if (isFirstLogin) {
      console.log('First login detected, notifying admins...');
      const adminIds = await getAllAdminUserIds();
      
      if (adminIds.length > 0) {
        const userName = [profile.firstName, profile.lastName]
          .filter(Boolean)
          .join(' ') || userEmail;

        await notifyAdminsOfUserLogin(adminIds, userEmail, userName, userId);
      }
    }
  } catch (error) {
    console.error('Error tracking user login:', error);
    // Don't throw - login tracking shouldn't break the login flow
  }
};

/**
 * Notify admins when a user logs in for the first time
 * @param adminIds Array of admin user IDs
 * @param userEmail User email address
 * @param userName User's display name
 * @param userId User ID
 */
export const notifyAdminsOfUserLogin = async (
  adminIds: string[],
  userEmail: string,
  userName: string,
  userId: string
): Promise<void> => {
  try {
    await Promise.all(adminIds.map(adminId =>
      createNotification({
        userId: adminId,
        type: 'user',
        title: 'New User First Login',
        message: `${userName} (${userEmail}) has logged in for the first time.`,
        isRead: false,
        actionLink: `/admin/clients?clientId=${userId}`,
        metadata: {
          userEmail,
          userName,
          userId,
          icon: 'person-check',
          color: 'success'
        }
      })
    ));
  } catch (error) {
    console.error('Error notifying admins of user login:', error);
    throw error;
  }
};

/**
 * Notify admins when a user's password is reset
 * @param adminIds Array of admin user IDs
 * @param userEmail User email address
 * @param userName User's display name
 * @param userId User ID
 */
export const notifyAdminsOfPasswordReset = async (
  adminIds: string[],
  userEmail: string,
  userName: string,
  userId: string
): Promise<void> => {
  try {
    await Promise.all(adminIds.map(adminId =>
      createNotification({
        userId: adminId,
        type: 'admin',
        title: 'User Password Reset',
        message: `${userName} (${userEmail}) has had their password reset by an administrator.`,
        isRead: false,
        actionLink: `/admin/clients?clientId=${userId}`,
        metadata: {
          userEmail,
          userName,
          userId,
          icon: 'key',
          color: 'warning'
        }
      })
    ));
  } catch (error) {
    console.error('Error notifying admins of password reset:', error);
    throw error;
  }
};

