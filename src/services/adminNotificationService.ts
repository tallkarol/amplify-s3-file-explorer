// src/features/admin/services/adminNotificationService.ts
import { getAllAdminUserIds } from './adminService';
import { notifyAdminsOfUserFileUpload } from '@/features/files/services/FileNotificationService';

/**
 * Notify admins with preference filtering
 */
export const notifyAdminsOfFileUpload = async (
  userName: string,
  fileName: string,
  folderPath: string,
  _fileType?: string
) => {
  try {
    const adminIds = await getAllAdminUserIds();
    
    // Filter admins based on notification preferences (future feature)
    const eligibleAdmins = adminIds; // For now, notify all admins
    
    if (eligibleAdmins.length > 0) {
      await notifyAdminsOfUserFileUpload(
        eligibleAdmins,
        userName,
        fileName,
        folderPath
      );
      
      console.log(`Notified ${eligibleAdmins.length} admins about file upload by ${userName}`);
    }
  } catch (error) {
    console.error('Error notifying admins of file upload:', error);
    throw error;
  }
};