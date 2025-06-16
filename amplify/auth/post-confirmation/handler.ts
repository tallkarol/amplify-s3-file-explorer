// amplify/auth/post-confirmation/handler.ts
import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from "$amplify/env/post-confirmation";
import * as AWS from "aws-sdk";

// Merge the imported env with AWS environment variables into a single flat object.
const clientEnv = {
  ...env,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
  AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN!,
  AWS_REGION: process.env.AWS_REGION!,
  AMPLIFY_DATA_DEFAULT_NAME: process.env.AMPLIFY_DATA_DEFAULT_NAME!,
};

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(clientEnv);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

// Create an S3 client instance.
const s3 = new AWS.S3({ region: process.env.AWS_REGION });

export const handler: PostConfirmationTriggerHandler = async (event) => {
  try {
    console.log('Post-confirmation handler started');
    const userId = event.request.userAttributes.sub;
    const userName = event.userName;
    const profileOwner = `${userId}::${userName}`;
    
    console.log('Creating user profile...');
    // Create user profile
    await client.models.UserProfile.create({
      email: event.request.userAttributes.email,
      uuid: userId,
      profileOwner: profileOwner,
      firstName: event.request.userAttributes.given_name || '',
      lastName: event.request.userAttributes.family_name || '',
      companyName: '',
      phoneNumber: event.request.userAttributes.phone_number || '',
      preferredContactMethod: 'email',
      status: 'active'
    });
    
    console.log('Creating notification preferences...');
    // Create default notification preferences
    await client.models.NotificationPreference.create({
      userId: userId,
      receiveSystemNotifications: true,
      receiveFileNotifications: true,
      receiveAdminNotifications: true,
      receiveUserNotifications: true,
      emailNotifications: true,
      inAppNotifications: true,
      emailDigestFrequency: 'instant'
    });
    
    console.log('Creating welcome notification...');
    // Create welcome notification
    await client.models.Notification.create({
      userId: userId,
      type: 'system',
      title: 'Welcome to S3 Secure File Share',
      message: 'Your account has been successfully created.',
      isRead: false,
      actionLink: '/user'
    });

    console.log('Creating S3 folders...');
    // Create S3 folders in parallel
    const userFolderKey = `users/${userId}/`;
    const certificateFolderKey = `users/${userId}/certificate/`;
    const auditReportFolderKey = `users/${userId}/audit-report/`;
    const auditorResumeFolderKey = `users/${userId}/auditor-resume/`;
    const statisticsFolderKey = `users/${userId}/statistics/`;
    const privateFolderKey = `users/${userId}/private/`;
    const confirmationNoticesFolderKey = `users/${userId}/confirmation-notices/`;
    const otherFolderKey = `users/${userId}/other/`;

    // Retrieve the bucket name from the environment variable set by Amplify Storage.
    const bucketName = "amplify-dcmp2wwnf9152-mai-amplifys3fileexplorersto-vmzmd3lja8iu";
    
    // Prepare folder creation requests
    const folderRequests = [
      s3.putObject({Bucket: bucketName, Key: userFolderKey, Body: "", ContentType: "text/plain"}).promise(),
      s3.putObject({Bucket: bucketName, Key: certificateFolderKey, Body: "", ContentType: "text/plain"}).promise(),
      s3.putObject({Bucket: bucketName, Key: auditReportFolderKey, Body: "", ContentType: "text/plain"}).promise(),
      s3.putObject({Bucket: bucketName, Key: auditorResumeFolderKey, Body: "", ContentType: "text/plain"}).promise(),
      s3.putObject({Bucket: bucketName, Key: statisticsFolderKey, Body: "", ContentType: "text/plain"}).promise(),
      s3.putObject({Bucket: bucketName, Key: privateFolderKey, Body: "", ContentType: "text/plain"}).promise(),
      s3.putObject({Bucket: bucketName, Key: confirmationNoticesFolderKey, Body: "", ContentType: "text/plain"}).promise(),
      s3.putObject({Bucket: bucketName, Key: otherFolderKey, Body: "", ContentType: "text/plain"}).promise()
    ];
    
    // Execute all folder creations in parallel
    await Promise.all(folderRequests);

    console.log('Creating default folder permissions...');
    // Create default folder permissions for protected folders
    const currentUser = event.request.userAttributes.email; // Use email as fallback for createdBy
    
    const defaultPermissions = [
      // Certificate folder - allow all operations
      {
        userId: userId,
        folderPath: '/certificate/',
        downloadRestricted: false,
        uploadRestricted: false,
        canCreateSubfolders: true,
        canDeleteFolder: false, // Protected folder
        inheritFromParent: false,
        createdBy: currentUser,
        lastModifiedBy: currentUser
      },
      // Audit Report folder - allow all operations
      {
        userId: userId,
        folderPath: '/audit-report/',
        downloadRestricted: false,
        uploadRestricted: false,
        canCreateSubfolders: true,
        canDeleteFolder: false, // Protected folder
        inheritFromParent: false,
        createdBy: currentUser,
        lastModifiedBy: currentUser
      },
      // Auditor Resume folder - allow all operations
      {
        userId: userId,
        folderPath: '/auditor-resume/',
        downloadRestricted: false,
        uploadRestricted: false,
        canCreateSubfolders: true,
        canDeleteFolder: false, // Protected folder
        inheritFromParent: false,
        createdBy: currentUser,
        lastModifiedBy: currentUser
      },
      // Statistics folder - allow all operations
      {
        userId: userId,
        folderPath: '/statistics/',
        downloadRestricted: false,
        uploadRestricted: false,
        canCreateSubfolders: true,
        canDeleteFolder: false, // Protected folder
        inheritFromParent: false,
        createdBy: currentUser,
        lastModifiedBy: currentUser
      },
      // Private folder - allow all operations (NEW)
      {
        userId: userId,
        folderPath: '/private/',
        downloadRestricted: false,
        uploadRestricted: false,
        canCreateSubfolders: true,
        canDeleteFolder: false, // Protected folder
        inheritFromParent: false,
        createdBy: currentUser,
        lastModifiedBy: currentUser
      },
      // Confirmation Notices folder - restrict uploads, allow downloads (NEW)
      {
        userId: userId,
        folderPath: '/confirmation-notices/',
        downloadRestricted: false,
        uploadRestricted: true, // Only admins should upload here
        canCreateSubfolders: false,
        canDeleteFolder: false, // Protected folder
        inheritFromParent: false,
        createdBy: currentUser,
        lastModifiedBy: currentUser
      },
      // Other folder - allow all operations (NEW)
      {
        userId: userId,
        folderPath: '/other/',
        downloadRestricted: false,
        uploadRestricted: false,
        canCreateSubfolders: true,
        canDeleteFolder: false, // Protected folder
        inheritFromParent: false,
        createdBy: currentUser,
        lastModifiedBy: currentUser
      }
    ];

    // Create permissions in parallel
    const permissionRequests = defaultPermissions.map(permission =>
      client.models.FolderPermission.create(permission)
    );
    
    await Promise.all(permissionRequests);
    
    console.log('Post-confirmation handler completed successfully');
    return event;
  } catch (error) {
    console.error('Error in post-confirmation handler:', error);
    // Important: Always return the event even if there's an error
    // This ensures the user is still created even if some post-registration steps fail
    return event;
  }
};