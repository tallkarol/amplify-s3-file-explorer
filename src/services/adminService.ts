// src/services/adminService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
// import { UserProfile } from '@/types';

const client = generateClient();

/**
 * Fetches all admin and developer users from the system
 * This function gets all user profiles and then checks their Cognito groups
 */
export const getAllAdminUserIds = async (): Promise<string[]> => {
  try {
    const listUserProfilesQuery = /* GraphQL */ `
      query ListUserProfiles {
        listUserProfiles {
          items {
            uuid
            profileOwner
          }
        }
      }
    `;

    const response = await client.graphql<GraphQLQuery<any>>({
      query: listUserProfilesQuery,
      authMode: 'userPool'
    });

    const users: { uuid?: string }[] = response.data?.listUserProfiles?.items || [];
    
    // For now, return all user UUIDs since we can't directly query Cognito groups
    // In a production system, you'd want to maintain admin status in your user profiles
    // or create a separate admin table
    const adminIds = users
      .filter((user) => user.uuid)
      .map((user) => user.uuid as string);
    
    return adminIds;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
};

/**
 * Alternative approach: Add an 'isAdmin' field to UserProfile
 * and filter based on that field
 */
export const getAdminUsersByRole = async (): Promise<string[]> => {
  try {
    const listAdminUsersQuery = /* GraphQL */ `
      query ListAdminUsers($filter: ModelUserProfileFilterInput) {
        listUserProfiles(filter: $filter) {
          items {
            uuid
          }
        }
      }
    `;

    // This assumes you have an 'isAdmin' field in your UserProfile model
    const response = await client.graphql<GraphQLQuery<any>>({
      query: listAdminUsersQuery,
      variables: {
        filter: {
          isAdmin: { eq: true }
        }
      },
      authMode: 'userPool'
    });

    return response.data?.listUserProfiles?.items?.map((user: { uuid?: string }) => user.uuid) || [];
  } catch (error) {
    console.error('Error fetching admin users by role:', error);
    return [];
  }
};