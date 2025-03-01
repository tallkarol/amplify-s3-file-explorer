// src/services/FileNotificationService.ts
import { createNotification } from './NotificationService';

/**
 * Creates a notification when an admin uploads a file for a user
 * @param userId User ID to notify
 * @param adminName Name of the admin who uploaded the file
 * @param fileName Name of the uploaded file
 * @param folderPath Path where the file was uploaded
 * @param fileLink Optional link to the file
 */
export const notifyUserOfFileUpload = async (
  userId: string,
  adminName: string,
  fileName: string,
  folderPath: string,
  fileLink?: string
): Promise<void> => {
  const now = new Date().toISOString();
  
  try {
    await createNotification({
      userId,
      type: 'file',
      title: 'New File Uploaded',
      message: `${adminName} has uploaded a new file "${fileName}" to your ${getFolderDisplayName(folderPath)} folder.`,
      isRead: false,
      actionLink: fileLink || `/user/folder/${getFolderNameFromPath(folderPath)}`,
      metadata: JSON.stringify({
        fileName,
        folderPath,
        uploadedBy: adminName,
        icon: 'file-earmark-arrow-up',
        color: 'success'
      }),
      createdAt: now,
      updatedAt: now
    });
  } catch (error) {
    console.error('Error creating file upload notification:', error);
    throw error;
  }
};

/**
 * Notifies all admins when a user uploads a file
 * @param adminIds Array of admin user IDs
 * @param userName Name of the user who uploaded the file
 * @param fileName Name of the uploaded file
 * @param folderPath Path where the file was uploaded
 */
export const notifyAdminsOfUserFileUpload = async (
  adminIds: string[],
  userName: string,
  fileName: string,
  folderPath: string
): Promise<void> => {
  const now = new Date().toISOString();
  
  try {
    // Create notification for each admin
    await Promise.all(adminIds.map(adminId => 
      createNotification({
        userId: adminId,
        type: 'file',
        title: 'User File Upload',
        message: `${userName} has uploaded a new file "${fileName}" to their ${getFolderDisplayName(folderPath)} folder.`,
        isRead: false,
        actionLink: `/admin/user-files/${userName}/${getFolderNameFromPath(folderPath)}`,
        metadata: JSON.stringify({
          fileName,
          folderPath,
          uploadedBy: userName,
          icon: 'file-earmark-arrow-up',
          color: 'info'
        }),
        createdAt: now,
        updatedAt: now
      })
    ));
  } catch (error) {
    console.error('Error creating admin file upload notifications:', error);
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