import { defineFunction } from '@aws-amplify/backend';

export const adminSync = defineFunction({
  name: 'admin-sync',
  timeoutSeconds: 30,
});
