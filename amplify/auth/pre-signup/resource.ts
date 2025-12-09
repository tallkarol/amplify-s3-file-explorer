// amplify/auth/pre-signup/resource.ts
import { defineFunction } from '@aws-amplify/backend';

export const preSignup = defineFunction({
  name: 'pre-signup',
  entry: './handler.ts'
});

