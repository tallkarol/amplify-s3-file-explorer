// src/services/adminNotificationService.ts
import { getAllAdminUserIds } from './adminService';
import { notifyAdminsOfUserFileUpload } from '@/features/files/services/FileNotificationService';
import { devLog } from '../utils/logger';

/**
 * Notify admins when a user uploads a file
 * @param userUserId User ID who uploaded the file (will be converted to display name)
 * @param fileName Name of the uploaded file
 * @param folderPath Path where the file was uploaded
 */
export const notifyAdminsOfFileUpload = async (
  userUserId: string,
  fileName: string,
  folderPath: string
) => {
  try {
    const adminIds = await getAllAdminUserIds();
    
    // Filter admins based on notification preferences (future feature)
    // For now, notify all users (which includes admins)
    // TODO: Improve this to only notify actual admins/devs (requires Lambda or UserProfile field)
    const eligibleAdmins = adminIds;
    
    if (eligibleAdmins.length > 0) {
      await notifyAdminsOfUserFileUpload(
        eligibleAdmins,
        userUserId,
        fileName,
        folderPath
      );
      
      devLog(`Notified ${eligibleAdmins.length} admins about file upload by user ${userUserId}`);
    }
  } catch (error) {
    console.error('Error notifying admins of file upload:', error);
    throw error;
  }
};