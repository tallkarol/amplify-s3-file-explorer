// amplify/auth/pre-signup/resource.ts
import { defineFunction } from '@aws-amplify/backend';
import { data } from '../../data/resource';

export const preSignup = defineFunction({
  name: 'pre-signup',
  entry: './handler.ts',
  access: [data]
});

