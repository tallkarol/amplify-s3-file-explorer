// src/graphql/userProfile.ts

// Get user profile with additional contacts
export const getUserProfileWithContacts = /* GraphQL */ `
  query GetUserProfileWithContacts($profileOwner: String!) {
    listUserProfiles(filter: { profileOwner: { eq: $profileOwner } }, limit: 1) {
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
        updatedAt
      }
    }
    
    listAdditionalContacts(filter: { profileOwner: { eq: $profileOwner } }) {
      items {
        id
        name
        email
        receiveNotifications
        profileOwner
        createdAt
        updatedAt
      }
    }
  }
`;

// Update user profile
export const updateUserProfileMutation = /* GraphQL */ `
  mutation UpdateUserProfile(
    $input: UpdateUserProfileInput!
  ) {
    updateUserProfile(input: $input) {
      id
      email
      firstName
      lastName
      companyName
      phoneNumber
      preferredContactMethod
      profileOwner
      updatedAt
    }
  }
`;

// Create additional contact
export const createAdditionalContactMutation = /* GraphQL */ `
  mutation CreateAdditionalContact(
    $input: CreateAdditionalContactInput!
  ) {
    createAdditionalContact(input: $input) {
      id
      name
      email
      receiveNotifications
      profileOwner
      createdAt
      updatedAt
    }
  }
`;

// Update additional contact
export const updateAdditionalContactMutation = /* GraphQL */ `
  mutation UpdateAdditionalContact(
    $input: UpdateAdditionalContactInput!
  ) {
    updateAdditionalContact(input: $input) {
      id
      name
      email
      receiveNotifications
      profileOwner
      updatedAt
    }
  }
`;

// Delete additional contact
export const deleteAdditionalContactMutation = /* GraphQL */ `
  mutation DeleteAdditionalContact(
    $input: DeleteAdditionalContactInput!
  ) {
    deleteAdditionalContact(input: $input) {
      id
      profileOwner
    }
  }
`;

// Get user's notifications with optional filtering
export const listUserNotifications = /* GraphQL */ `
  query ListUserNotifications(
    $userId: String!,
    $filter: ModelNotificationFilterInput,
    $limit: Int,
    $nextToken: String
  ) {
    listNotifications(
      filter: { 
        and: [
          { userId: { eq: $userId } },
          $filter
        ]
      },
      limit: $limit,
      nextToken: $nextToken
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
      nextToken
    }
  }
`;

// Get unread notification count
export const getUnreadNotificationCount = /* GraphQL */ `
  query GetUnreadNotificationCount($userId: String!) {
    listNotifications(
      filter: { 
        userId: { eq: $userId },
        isRead: { eq: false }
      }
    ) {
      items {
        id
      }
    }
  }
`;

// Get user's notification preferences
export const getUserNotificationPreferences = /* GraphQL */ `
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

// Create a new notification
export const createNotificationMutation = /* GraphQL */ `
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

// Mark notification as read
export const markNotificationAsReadMutation = /* GraphQL */ `
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

// Mark all notifications as read
export const markAllNotificationsAsReadMutation = /* GraphQL */ `
  mutation MarkAllNotificationsAsRead($userId: String!) {
    # Note: This is a custom mutation that would need to be implemented
    # in an AWS Lambda function as Amplify/AppSync doesn't support
    # bulk operations out of the box
    markAllNotificationsAsRead(userId: $userId)
  }
`;

// Delete a notification
export const deleteNotificationMutation = /* GraphQL */ `
  mutation DeleteNotification($id: ID!) {
    deleteNotification(input: { id: $id }) {
      id
    }
  }
`;

// Update notification preferences
export const updateNotificationPreferencesMutation = /* GraphQL */ `
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

// Create initial notification preferences
export const createNotificationPreferencesMutation = /* GraphQL */ `
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