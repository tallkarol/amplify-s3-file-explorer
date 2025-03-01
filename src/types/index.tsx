// src/types/index.tsx
// Support Ticket types
export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  metadata?: Record<string, any>;
  adminResponse?: string;
  responseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListSupportTicketsResponse {
  listSupportTickets: {
    items: SupportTicket[];
  };
}

// S3 related types
export interface S3Item {
  key: string;
  name: string;
  isFolder: boolean;
  lastModified?: Date;
  size?: number;
  parentFolder: string;
  isProtected?: boolean;
}
  
// User related types
export interface UserProfile {
  id: string;
  email: string;
  uuid: string;
  profileOwner: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phoneNumber?: string;
  preferredContactMethod?: 'email' | 'phone';
  createdAt?: string;
  updatedAt?: string;
}

// Additional contact type
export interface AdditionalContact {
  id: string;
  name: string;
  email: string;
  receiveNotifications: boolean;
  profileOwner: string;
  createdAt?: string;
  updatedAt?: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'system' | 'file' | 'admin' | 'user';
  title: string;
  message: string;
  isRead: boolean;
  actionLink?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  receiveSystemNotifications: boolean;
  receiveFileNotifications: boolean;
  receiveAdminNotifications: boolean;
  receiveUserNotifications: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  emailDigestFrequency: 'instant' | 'daily' | 'weekly';
}
  
// API response types
export interface ListUserProfilesResponse {
  listUserProfiles: {
    items: UserProfile[];
  };
}

export interface ListAdditionalContactsResponse {
  listAdditionalContacts: {
    items: AdditionalContact[];
  };
}

export interface GetUserProfileWithContactsResponse {
  listUserProfiles: {
    items: UserProfile[];
  };
  listAdditionalContacts: {
    items: AdditionalContact[];
  };
}

export interface ListNotificationsResponse {
  listNotifications: {
    items: Notification[];
  };
}

export interface GetNotificationPreferenceResponse {
  listNotificationPreferences: {
    items: NotificationPreference[];
  };
}
  
// Tab navigation types
export interface TabItem {
  id: string;
  label: string;
  icon?: string;
}
  
// Breadcrumb types
export interface BreadcrumbItem {
  label: string;
  path: string;
}
  
// Card component types
export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}
  
// Alert types
export type AlertType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  
// Loading spinner types
export type SpinnerSize = 'sm' | 'md' | 'lg';