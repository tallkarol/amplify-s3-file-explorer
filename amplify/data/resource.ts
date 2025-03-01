// amplify/data/resource.ts
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postConfirmation } from "../auth/post-confirmation/resource";

const schema = a.schema({
  SupportTicket: a
    .model({
      userId: a.string(),            // User who created the ticket
      userName: a.string(),          // User's name/email for display purposes
      subject: a.string(),           // Support ticket subject
      message: a.string(),           // Support ticket detailed message
      status: a.enum([              // Ticket status
        'new',                      // New/unread ticket
        'in-progress',              // Being worked on
        'resolved',                 // Issue resolved
        'closed'                    // Ticket closed
      ]),
      priority: a.enum([            // Ticket priority
        'low',                      // Low priority
        'medium',                   // Medium priority
        'high',                     // High priority
        'urgent'                    // Urgent priority
      ]),
      category: a.string(),          // Issue category (e.g., "Technical", "Billing", etc.)
      metadata: a.json(), // Additional metadata (browser info, etc.)
      adminResponse: a.string(), // Admin's response to the ticket
      responseDate: a.datetime(), // When admin responded
      createdAt: a.datetime(),      // When ticket was created
      updatedAt: a.datetime(),      // When ticket was last updated
    })
    .authorization((allow) => [
      allow.ownerDefinedIn("userId"),
      allow.groups(["admin", "developer"]).to(["read", "create", "update", "delete"]),
    ]),
  
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  UserProfile: a
    .model({
      email: a.string(),
      uuid: a.string(),
      profileOwner: a.string(),
      firstName: a.string(),
      lastName: a.string(),
      companyName: a.string(),
      phoneNumber: a.string(),
      preferredContactMethod: a.enum(['email', 'phone']),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn("profileOwner"),
      allow.groups(["admin", "developer"]).to(["read", "create", "update", "delete"]),
    ]),
    
  AdditionalContact: a
    .model({
      name: a.string(),
      email: a.string(),
      receiveNotifications: a.boolean(),
      profileOwner: a.string(),
      // Remove the problematic belongsTo relationship for now
    })
    .authorization((allow) => [
      allow.ownerDefinedIn("profileOwner"),
      allow.groups(["admin", "developer"]).to(["read", "create", "update", "delete"]),
    ]),
    
  Notification: a
    .model({
      userId: a.string(),            // User the notification is for
      type: a.enum([                 // Type of notification
        'system',                    // System notifications (maintenance, updates)
        'file',                      // File-related (uploads, shares, etc.)
        'admin',                     // Admin actions
        'user'                       // User-to-user notifications
      ]),
      title: a.string(),             // Short notification title
      message: a.string(),           // Detailed message content
      isRead: a.boolean(),           // Whether the notification has been read
      actionLink: a.string(),   // Optional link to take action on (e.g., view file)
      metadata: a.json(),       // Additional JSON metadata as needed
      expiresAt: a.datetime(),  // Optional expiration date
      createdAt: a.datetime(),       // Manually add these instead of using addTimestamps
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      // Fix the owner authorization to use the proper method
      allow.ownerDefinedIn("userId"),
      allow.groups(["admin", "developer"]).to(["read", "create", "update", "delete"]),
    ]),
    
  NotificationPreference: a
    .model({
      userId: a.string(),
      // Which notification types the user wants to receive
      receiveSystemNotifications: a.boolean(),
      receiveFileNotifications: a.boolean(),
      receiveAdminNotifications: a.boolean(),
      receiveUserNotifications: a.boolean(),
      // How notifications should be delivered
      emailNotifications: a.boolean(),
      inAppNotifications: a.boolean(),
      // Frequency preferences - don't use default here
      emailDigestFrequency: a.enum(['instant', 'daily', 'weekly']),
    })
    .authorization((allow) => [
      // Fix the owner authorization to use the proper method
      allow.ownerDefinedIn("userId"),
      allow.groups(["admin", "developer"]).to(["read", "create", "update", "delete"]),
    ]),
}).authorization((allow) => [allow.resource(postConfirmation)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});