import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { adminSync } from './functions/admin-sync/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  adminSync,
});

// Grant adminSync function permissions to access Cognito User Pool
// Note: In Gen 2, functions need explicit IAM permissions for Cognito operations
backend.adminSync.resources.lambda.addToRolePolicy({
  effect: 'Allow',
  actions: [
    'cognito-idp:ListUsers',
    'cognito-idp:AdminListGroupsForUser',
    'cognito-idp:AdminAddUserToGroup',
    'cognito-idp:AdminRemoveUserFromGroup',
  ],
  resources: [backend.auth.resources.userPool.userPoolArn],
});

// Pass User Pool ID as environment variable
backend.adminSync.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);

