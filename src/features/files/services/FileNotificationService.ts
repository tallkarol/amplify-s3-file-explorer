// src/features/files/services/FileNotificationService.ts
import { createNotification } from '../../notifications/services/NotificationService';
import { fetchUserByUuid } from './fileService';

/**
 * Get user display name from UUID
 */
const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const userProfile = await fetchUserByUuid(userId);
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return userProfile?.email || userId;
  } catch (error) {
    console.error('Error fetching user display name:', error);
    return userId;
  }
};

/**
 * Get user email from UUID (preferred for user upload notifications)
 * Falls back to userId only if email is unavailable
 */
const getUserEmail = async (userId: string): Promise<string> => {
  try {
    const userProfile = await fetchUserByUuid(userId);
    if (userProfile?.email) {
      console.log('[getUserEmail] Found email for user:', userId, 'email:', userProfile.email);
      return userProfile.email;
    }
    console.warn('[getUserEmail] No email found for user:', userId, 'profile:', userProfile);
    return userId;
  } catch (error) {
    console.error('[getUserEmail] Error fetching user email:', error);
    return userId;
  }
};

/**
 * Creates a notification when an admin uploads a file for a user
 * @param userId User ID to notify
 * @param adminUserId Admin user ID who uploaded the file
 * @param fileName Name of the uploaded file
 * @param folderPath Path where the file was uploaded
 * @param fileLink Optional link to the file
 */
export const notifyUserOfFileUpload = async (
  userId: string,
  adminUserId: string,
  fileName: string,
  folderPath: string,
  fileLink?: string
): Promise<void> => {
  try {
    console.log('[notifyUserOfFileUpload] Starting notification creation', {
      userId,
      adminUserId,
      fileName,
      folderPath,
      fileLink
    });
    
    // Get admin display name
    const adminName = await getUserDisplayName(adminUserId);
    console.log('[notifyUserOfFileUpload] Admin display name:', adminName);
    
    // Ensure actionLink is never undefined
    const actionLink = fileLink || `/user/folder/${getFolderNameFromPath(folderPath)}` || '/user';
    
    const notificationPayload = {
      userId,
      type: 'file' as const,
      title: 'New File Uploaded',
      message: `${adminName} has uploaded a new file "${fileName}" to your ${getFolderDisplayName(folderPath)} folder.`,
      isRead: false,
      actionLink,
      metadata: {
        fileName,
        folderPath,
        uploadedBy: adminName,
        uploadedByUserId: adminUserId,
        icon: 'file-earmark-arrow-up',
        color: 'success'
      }
    };
    
    console.log('[notifyUserOfFileUpload] Notification payload:', notificationPayload);
    
    const result = await createNotification(notificationPayload);
    console.log('[notifyUserOfFileUpload] Notification created successfully:', result.id);
  } catch (error: any) {
    console.error('[notifyUserOfFileUpload] Error creating file upload notification:', {
      error,
      errorMessage: error?.message,
      errorType: error?.errorType,
      graphQLErrors: error?.errors || error?.graphQLErrors,
      userId,
      adminUserId,
      fileName,
      folderPath
    });
    throw error;
  }
};

/**
 * Notifies all admins when a user uploads a file
 * @param adminIds Array of admin user IDs
 * @param userUserId User ID who uploaded the file
 * @param fileName Name of the uploaded file
 * @param folderPath Path where the file was uploaded
 */
export const notifyAdminsOfUserFileUpload = async (
  adminIds: string[],
  userUserId: string,
  fileName: string,
  folderPath: string
): Promise<void> => {
  try {
    console.log('[notifyAdminsOfUserFileUpload] Starting notification creation', {
      adminIds,
      userUserId,
      fileName,
      folderPath,
      adminCount: adminIds.length
    });
    
    // Filter out the uploader from admin list - don't notify the user who uploaded
    const eligibleAdminIds = adminIds.filter(adminId => adminId !== userUserId);
    
    if (eligibleAdminIds.length === 0) {
      console.log('[notifyAdminsOfUserFileUpload] No eligible admins to notify (all admins are the uploader)');
      return;
    }
    
    console.log('[notifyAdminsOfUserFileUpload] Filtered admin list:', {
      originalCount: adminIds.length,
      filteredCount: eligibleAdminIds.length,
      excludedUploader: userUserId
    });
    
    // Get user email (preferred over display name for user upload notifications)
    const userEmail = await getUserEmail(userUserId);
    console.log('[notifyAdminsOfUserFileUpload] User email:', userEmail);
    
    // Ensure actionLink is never undefined
    const actionLink = `/admin/files?clientId=${userUserId}&path=${encodeURIComponent(folderPath)}` || '/admin';
    
    // Create notification for each admin (excluding the uploader)
    const notificationPromises = eligibleAdminIds.map(async (adminId, index) => {
      const notificationPayload = {
        userId: adminId,
        type: 'file' as const,
        title: 'User File Upload',
        message: `${userEmail} has uploaded a new file "${fileName}" to their ${getFolderDisplayName(folderPath)} folder.`,
        isRead: false,
        actionLink,
        metadata: {
          fileName,
          folderPath,
          uploadedBy: userEmail,
          uploadedByUserId: userUserId,
          icon: 'file-earmark-arrow-up',
          color: 'info'
        }
      };
      
      console.log(`[notifyAdminsOfUserFileUpload] Creating notification ${index + 1}/${eligibleAdminIds.length} for admin:`, adminId);
      
      try {
        const result = await createNotification(notificationPayload);
        console.log(`[notifyAdminsOfUserFileUpload] Notification created successfully for admin ${adminId}:`, result.id);
        return result;
      } catch (err: any) {
        console.error(`[notifyAdminsOfUserFileUpload] Failed to create notification for admin ${adminId}:`, {
          error: err,
          errorMessage: err?.message,
          errorType: err?.errorType,
          graphQLErrors: err?.errors || err?.graphQLErrors,
          adminId,
          notificationPayload
        });
        throw err;
      }
    });
    
    const results = await Promise.all(notificationPromises);
    console.log(`[notifyAdminsOfUserFileUpload] Successfully created ${results.length} notifications`);
  } catch (error: any) {
    console.error('[notifyAdminsOfUserFileUpload] Error creating admin file upload notifications:', {
      error,
      errorMessage: error?.message,
      errorType: error?.errorType,
      graphQLErrors: error?.errors || error?.graphQLErrors,
      adminIds,
      userUserId,
      fileName,
      folderPath
    });
    throw error;
  }
};

// Helper function to get a nice display name for a folder
function getFolderDisplayName(path: string): string {
  const folderName = getFolderNameFromPath(path);
  
  const displayNames: Record<string, string> = {
    'certificate': 'Certificates',
    'audit-report': 'Audit Reports',
    'auditor-resume': 'Auditor Profiles',
    'statistics': 'Statistics'
  };
  
  return displayNames[folderName] || folderName;
}

// Helper function to extract folder name from path
function getFolderNameFromPath(path: string): string {
  // Remove leading/trailing slashes and get the last path segment
  const cleanPath = path.replace(/^\/|\/$/g, '');
  const parts = cleanPath.split('/');
  
  // Find the actual folder name - might not be the last part depending on the path structure
  if (parts.includes('users') && parts.length > 2) {
    // For paths like 'users/{userId}/certificate'
    return parts[2];
  }
  
  // For simpler paths, just return the last segment
  return parts[parts.length - 1];
}