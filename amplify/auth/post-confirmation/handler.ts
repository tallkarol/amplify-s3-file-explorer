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
  const userId = event.request.userAttributes.sub;
  const userName = event.userName;
  const profileOwner = `${userId}::${userName}`;
  const now = new Date().toISOString();
  
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
  });
  
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
  
  // Create welcome notification
  await client.models.Notification.create({
    userId: userId,
    type: 'system',
    title: 'Welcome to Porter, a secure file management platform built by Sonder AI Solutions',
    message: 'Thank you for joining! Your account has been successfully created. You can now start uploading and managing your files securely.',
    isRead: false,
    actionLink: '/user',
    // FIX: Pass the object directly without JSON.stringify
    metadata: {
      icon: 'hand-thumbs-up',
      color: 'primary'
    },
    createdAt: now,
    updatedAt: now
  });

  // Create an S3 folder for the user.
  // Construct the folder key using the user's unique id (Cognito sub).
  const userFolderKey = `users/${userId}/`;
  const certificateFolderKey = `users/${userId}/certificate/`;
  const auditReportFolderKey = `users/${userId}/audit-report/`;
  const auditorResumeFolderKey = `users/${userId}/auditor-resume/`;
  const statisticsFolderKey = `users/${userId}/statistics/`;

  // Retrieve the bucket name from the environment variable set by Amplify Storage.
  const bucketName = "amplify-dcmp2wwnf9152-mai-amplifys3fileexplorersto-vmzmd3lja8iu";
  
  // Put an / object with the folder key.
  const userParams = {Bucket:bucketName, Key:userFolderKey, Body:"placeholder", ContentType:"text/plain"};
  const certificateParams = {Bucket:bucketName, Key:certificateFolderKey, Body:"placeholder", ContentType:"text/plain"};
  const auditReportParams = {Bucket:bucketName, Key:auditReportFolderKey, Body:"placeholder", ContentType:"text/plain"};
  const auditorResumeParams = {Bucket:bucketName, Key:auditorResumeFolderKey, Body:"placeholder", ContentType:"text/plain"};
  const statisticsParams = {Bucket:bucketName, Key:statisticsFolderKey, Body:"placeholder", ContentType:"text/plain"};

  try {await s3.putObject(userParams).promise();} catch (error) {console.error("Error creating folder:",userFolderKey, error);}
  try {await s3.putObject(certificateParams).promise();} catch (error) {console.error("Error creating folder:",certificateFolderKey, error);}
  try {await s3.putObject(auditReportParams).promise();} catch (error) {console.error("Error creating folder:",auditReportFolderKey, error);}
  try {await s3.putObject(auditorResumeParams).promise();} catch (error) {console.error("Error creating folder:",auditorResumeFolderKey, error);}
  try {await s3.putObject(statisticsParams).promise();} catch (error) {console.error("Error creating folder:",statisticsFolderKey, error);}

  return event;
};