import { defineFunction } from '@aws-amplify/backend';

export const adminSync = defineFunction({
  name: 'admin-sync',
  timeoutSeconds: 30,
  access: ['data'], // Grant access to data resource (required for getAmplifyDataClientConfig)
  resourceGroupName: 'auth', // Assign to auth stack to avoid circular dependency
});
