import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'amplify-s3-file-explorer-storage',
});