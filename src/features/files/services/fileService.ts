import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { UserProfile } from '../../../types';

// Create a reusable client
const client = generateClient();

// Query to fetch a specific user by UUID
const getUserByUuidQuery = /* GraphQL */ `
  query GetUserByUuid($filter: ModelUserProfileFilterInput) {
    listUserProfiles(filter: $filter, limit: 1) {
      items {
        id
        email
        uuid
        profileOwner
        firstName
        lastName
        companyName
        createdAt
      }
    }
  }
`;

interface UserResponse {
  listUserProfiles: {
    items: UserProfile[];
  }
}

/**
 * Fetch a user by their UUID
 */
export const fetchUserByUuid = async (uuid: string): Promise<UserProfile | null> => {
  try {
    const response = await client.graphql<GraphQLQuery<UserResponse>>({
      query: getUserByUuidQuery,
      variables: {
        filter: {
          uuid: { eq: uuid }
        }
      },
      authMode: 'userPool'
    });
    
    const items = response?.data?.listUserProfiles?.items || [];
    return items.length > 0 ? items[0] : null;
  } catch (error) {
    console.error('Error fetching user by UUID:', error);
    throw error;
  }
};