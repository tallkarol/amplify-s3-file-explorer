// src/types/index.ts
// S3 related types
export interface S3Item {
    key: string;
    name: string;
    isFolder: boolean;
    lastModified?: Date;
    size?: number;
    parentFolder: string;
  }
  
  // User related types
  export interface UserProfile {
    id: string;
    email: string;
    uuid: string;
    profileOwner: string;
    firstName?: string;
    lastName?: string;
    createdAt?: string;
  }
  
  // API response types
  export interface ListUserProfilesResponse {
    listUserProfiles: {
      items: UserProfile[];
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