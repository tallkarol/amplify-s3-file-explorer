import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'amplify-s3-file-explorer-storage',
  access: (allow) => ({
    'users/*': [
      allow.groups(['developer', 'admin']).to(['read', 'write','delete']),
      allow.authenticated.to(['read'])
    ]
  })
});