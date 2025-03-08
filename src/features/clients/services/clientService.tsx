// src/features/clients/services/clientService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { UserProfile } from '../../../types';

interface ListUserProfilesResponse {
  listUserProfiles: {
    items: UserProfile[];
  };
}

// Create a client for making GraphQL requests
const client = generateClient();

// Define query to fetch users
const listUserProfilesQuery = /* GraphQL */ `
  query ListUserProfiles {
    listUserProfiles {
      items {
        id
        email
        uuid
        profileOwner
        firstName
        lastName
        companyName
        phoneNumber
        preferredContactMethod
        createdAt
      }
    }
  }
`;

/**
 * Fetches all user profiles
 * @returns Promise resolving to an array of user profiles
 */
export const fetchAllClients = async (): Promise<UserProfile[]> => {
  try {
    const response = await client.graphql<GraphQLQuery<ListUserProfilesResponse>>({
      query: listUserProfilesQuery,
      authMode: 'userPool'
    });
    
    return response?.data?.listUserProfiles?.items || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Sends a password reset request for a user
 * @param userId The ID of the user
 */
export const resetUserPassword = async (userId: string): Promise<void> => {
  // Implementation will come later
  console.log(`Password reset requested for user ${userId}`);
};

/**
 * Suspends a user account
 * @param userId The ID of the user
 */
export const suspendUserAccount = async (userId: string): Promise<void> => {
  // Implementation will come later
  console.log(`Account suspension requested for user ${userId}`);
};