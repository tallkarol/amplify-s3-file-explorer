// src/services/SupportTicketService.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { SupportTicket, ListSupportTicketsResponse } from '../../../types';
import {
  createSupportTicketMutation,
  updateSupportTicketMutation,
  listUserSupportTickets,
  listAllSupportTickets,
  getSupportTicket
} from '../graphql/supportTickets';
import { createNotification } from '../../notifications/services/NotificationService';

const client = generateClient();

/**
 * Creates a new support ticket and notifies admins
 * @param ticketData Support ticket data
 * @returns The created support ticket
 */
export const createSupportTicket = async (
  ticketData: Omit<SupportTicket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'adminResponse' | 'responseDate'>
): Promise<SupportTicket> => {
  try {
    // Current timestamp
    const now = new Date().toISOString();
    
    // Create the support ticket
    const response = await client.graphql<GraphQLQuery<{ createSupportTicket: SupportTicket }>>({
      query: createSupportTicketMutation,
      variables: {
        input: {
          ...ticketData,
          status: 'new',
          createdAt: now,
          updatedAt: now
        }
      },
      authMode: 'userPool'
    });
    
    const createdTicket = response.data!.createSupportTicket;
    
    // Now create notifications for all admins
    // In a real system, you'd query for all admin users and notify each
    // For now, we'll just create a generic notification with a placeholder admin ID
    
    // This is a placeholder - in a real app, you'd get this admin ID from your user database
    const adminIds = ['ADMIN_USER_ID'];
    
    // Notify each admin
    await Promise.all(adminIds.map(adminId => 
      createNotification({
        userId: adminId,
        type: 'admin',
        title: 'New Support Ticket',
        message: `${ticketData.userName} submitted a new support ticket: ${ticketData.subject}`,
        isRead: false,
        actionLink: `/admin/support-tickets/${createdTicket.id}`,
        // Fix: Use object directly instead of string
        metadata: {
          ticketId: createdTicket.id,
          priority: createdTicket.priority,
          category: createdTicket.category,
          icon: 'headset',
          color: createdTicket.priority === 'urgent' ? 'danger' : 'primary'
        }
      })
    ));
    
    return createdTicket;
  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw error;
  }
};

/**
 * Updates a support ticket (admin functionality)
 * @param ticketData Ticket data to update
 * @returns The updated ticket
 */
export const updateSupportTicket = async (
  ticketData: Partial<SupportTicket> & { id: string }
): Promise<Partial<SupportTicket>> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ updateSupportTicket: Partial<SupportTicket> }>>({
      query: updateSupportTicketMutation,
      variables: {
        input: {
          ...ticketData,
          updatedAt: new Date().toISOString()
        }
      },
      authMode: 'userPool'
    });
    
    const updatedTicket = response.data!.updateSupportTicket;
    
    // If admin responded to the ticket, notify the user
    if (ticketData.adminResponse && ticketData.userId) {
      // Fix: Remove createdAt/updatedAt
      await createNotification({
        userId: ticketData.userId,
        type: 'system',
        title: 'Support Ticket Updated',
        message: `Your support ticket "${ticketData.subject || 'Support Request'}" has been updated with a response.`,
        isRead: false,
        actionLink: `/support-tickets/${ticketData.id}`,
        // Fix: Use object directly 
        metadata: {
          ticketId: ticketData.id,
          status: ticketData.status,
          icon: 'chat-dots',
          color: 'success'
        }
      });
    }
    
    return updatedTicket;
  } catch (error) {
    console.error('Error updating support ticket:', error);
    throw error;
  }
};

/**
 * Gets support tickets for a specific user
 * @param userId User ID
 * @returns User's support tickets
 */
export const getUserSupportTickets = async (userId: string): Promise<SupportTicket[]> => {
  try {
    const response = await client.graphql<GraphQLQuery<ListSupportTicketsResponse>>({
      query: listUserSupportTickets,
      variables: { userId },
      authMode: 'userPool'
    });
    
    return response.data?.listSupportTickets.items || [];
  } catch (error) {
    console.error('Error fetching user support tickets:', error);
    throw error;
  }
};

/**
 * Gets all support tickets (admin functionality)
 * @param filter Optional filter criteria
 * @param limit Optional limit on results
 * @returns All support tickets matching criteria
 */
export const getAllSupportTickets = async (
  filter?: any,
  limit?: number
): Promise<SupportTicket[]> => {
  try {
    const response = await client.graphql<GraphQLQuery<ListSupportTicketsResponse>>({
      query: listAllSupportTickets,
      variables: { filter, limit },
      authMode: 'userPool'
    });
    
    return response.data?.listSupportTickets.items || [];
  } catch (error) {
    console.error('Error fetching all support tickets:', error);
    throw error;
  }
};

/**
 * Gets a specific support ticket by ID
 * @param id Ticket ID
 * @returns The support ticket
 */
export const getSupportTicketById = async (id: string): Promise<SupportTicket | null> => {
  try {
    const response = await client.graphql<GraphQLQuery<{ getSupportTicket: SupportTicket }>>({
      query: getSupportTicket,
      variables: { id },
      authMode: 'userPool'
    });
    
    return response.data?.getSupportTicket || null;
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    throw error;
  }
};