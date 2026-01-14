import { defineFunction } from '@aws-amplify/backend';

export const deleteUser = defineFunction({
  name: 'delete-user',
  timeoutSeconds: 30,
  resourceGroupName: 'auth', // Assign to auth stack to avoid circular dependency
  // DO NOT add access: ['data'] - that was the error!
});
