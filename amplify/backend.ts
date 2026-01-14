import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType, FunctionUrl, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import { CfnOutput } from 'aws-cdk-lib';
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
backend.adminSync.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);

// Create Function URL manually using CDK FunctionUrl construct
// Since addFunctionUrl() might not be exposed by Amplify Gen 2 wrapper, we create it directly
// This leverages the existing Lambda function resource that Amplify created
const functionUrl = new FunctionUrl(
  backend.adminSync.resources.lambda.stack,
  'AdminSyncFunctionUrl',
  {
    function: backend.adminSync.resources.lambda,
    authType: FunctionUrlAuthType.AWS_IAM,
    cors: {
      allowedOrigins: ['*'], // Adjust to your frontend domain in production
      allowedMethods: [HttpMethod.POST, HttpMethod.OPTIONS],
      allowedHeaders: ['content-type', 'authorization'],
    },
  }
);

// Output the Function URL for reference (optional, helps with debugging)
new CfnOutput(backend.adminSync.resources.lambda.stack, 'AdminSyncFunctionUrlOutput', {
  value: functionUrl.url,
  description: 'Admin Sync Lambda Function URL',
});
