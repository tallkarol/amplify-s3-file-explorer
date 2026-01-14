import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { adminSync } from './functions/admin-sync/resource';
import { deleteUser } from './functions/delete-user/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  adminSync,
  deleteUser,
});

// Grant adminSync function permissions to access Cognito User Pool
// Note: In Gen 2, functions need explicit IAM permissions for Cognito operations
backend.adminSync.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'cognito-idp:ListUsers',
      'cognito-idp:AdminListGroupsForUser',
      'cognito-idp:AdminAddUserToGroup',
      'cognito-idp:AdminRemoveUserFromGroup',
    ],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);

// Pass User Pool ID as environment variable
const adminSyncCfn = backend.adminSync.resources.lambda.node.defaultChild as CfnFunction;
adminSyncCfn.addPropertyOverride('Environment.Variables.USER_POOL_ID', backend.auth.resources.userPool.userPoolId);

// Grant deleteUser function permissions to access Cognito User Pool
backend.deleteUser.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'cognito-idp:AdminDisableUser',
      'cognito-idp:AdminDeleteUser',
    ],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);

// Pass User Pool ID as environment variable
const deleteUserCfn = backend.deleteUser.resources.lambda.node.defaultChild as CfnFunction;
deleteUserCfn.addPropertyOverride('Environment.Variables.USER_POOL_ID', backend.auth.resources.userPool.userPoolId);

// Note: Function URL uses NONE auth type and validates Cognito tokens in the handler
// No IAM permissions needed since we're using token-based authentication

// COMMENTED OUT: Using manually created Function URL with CORS configured in Lambda console
// The Function URL is managed manually to avoid conflicts and URL changes
// If you need to switch to CDK-managed in the future:
// 1. Delete the manual Function URL in Lambda console
// 2. Uncomment the code below
// 3. Deploy and update amplify_outputs.json with the new URL
//
// const functionUrl = new FunctionUrl(
//   backend.adminSync.resources.lambda.stack,
//   'AdminSyncFunctionUrl',
//   {
//     function: backend.adminSync.resources.lambda,
//     authType: FunctionUrlAuthType.AWS_IAM,
//     cors: {
//       allowedOrigins: ['*'], // Adjust to your frontend domain in production
//       allowedMethods: [HttpMethod.POST, HttpMethod.OPTIONS],
//       allowedHeaders: ['content-type', 'authorization'],
//     },
//   }
// );
//
// new CfnOutput(backend.adminSync.resources.lambda.stack, 'AdminSyncFunctionUrlOutput', {
//   value: functionUrl.url,
//   description: 'Admin Sync Lambda Function URL',
// });
