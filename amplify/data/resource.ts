// amplify/data/resource.ts
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postConfirmation } from "../auth/post-confirmation/resource";

const schema = a.schema({
  SupportTicket: a
    .model({
      userId: a.string(),
      userName: a.string(),
      subject: a.string(),
      message: a.string(),
      status: a.enum(['new', 'in_progress', 'resolved', 'closed']),
      priority: a.enum(['low', 'medium', 'high', 'urgent']),
      category: a.string(),
      metadata: a.json(),
      adminResponse: a.string(),
      responseDate: a.datetime(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId'),
      allow.groups(["admin", "developer"]).to(["read", "create", "update", "delete"]),
    ]),

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
      allow.ownerDefinedIn('profileOwner'),
      allow.groups(["admin", "developer"]).to(["read", "create", "update", "delete"]),
    ]),
    
  AdditionalContact: a
    .model({
      name: a.string(),
      email: a.string(),
      receiveNotifications: a.boolean(),
      profileOwner: a.string(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('profileOwner'),
      allow.groups(["admin", "developer"]).to(["read", "create", "update", "delete"]),
    ]),
    
  NotificationPreference: a
    .model({
      userId: a.string(),
      receiveSystemNotifications: a.boolean(),
      receiveFileNotifications: a.boolean(),
      receiveAdminNotifications: a.boolean(),
      receiveUserNotifications: a.boolean(),
      emailNotifications: a.boolean(),
      inAppNotifications: a.boolean(),
      emailDigestFrequency: a.enum(['instant', 'daily', 'weekly']),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId'),
      allow.groups(["admin", "developer"]).to(["read", "create", "update", "delete"]),
    ]),
    
  Notification: a
    .model({
      userId: a.string(),
      type: a.enum(['system', 'file', 'admin', 'user']),
      title: a.string(),
      message: a.string(),
      isRead: a.boolean(),
      actionLink: a.string(),
      metadata: a.json(),
      expiresAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId'),
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

