// src/graphql/supportTickets.ts

// Create a new support ticket
export const createSupportTicketMutation = /* GraphQL */ `
  mutation CreateSupportTicket($input: CreateSupportTicketInput!) {
    createSupportTicket(input: $input) {
      id
      userId
      userName
      subject
      message
      status
      priority
      category
      metadata
      createdAt
      updatedAt
    }
  }
`;

// Update a support ticket (for admins)
export const updateSupportTicketMutation = /* GraphQL */ `
  mutation UpdateSupportTicket($input: UpdateSupportTicketInput!) {
    updateSupportTicket(input: $input) {
      id
      status
      priority
      adminResponse
      responseDate
      updatedAt
    }
  }
`;

// List support tickets for a user
export const listUserSupportTickets = /* GraphQL */ `
  query ListUserSupportTickets($userId: String!) {
    listSupportTickets(filter: { userId: { eq: $userId } }) {
      items {
        id
        subject
        message
        status
        priority
        category
        createdAt
        adminResponse
        responseDate
      }
    }
  }
`;

// List all support tickets (for admins)
export const listAllSupportTickets = /* GraphQL */ `
  query ListAllSupportTickets($filter: ModelSupportTicketFilterInput, $limit: Int, $nextToken: String) {
    listSupportTickets(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        userName
        subject
        message
        status
        priority
        category
        createdAt
        updatedAt
        adminResponse
        responseDate
      }
      nextToken
    }
  }
`;

// Get a specific support ticket
export const getSupportTicket = /* GraphQL */ `
  query GetSupportTicket($id: ID!) {
    getSupportTicket(id: $id) {
      id
      userId
      userName
      subject
      message
      status
      priority
      category
      metadata
      createdAt
      updatedAt
      adminResponse
      responseDate
    }
  }
`;