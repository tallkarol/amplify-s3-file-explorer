import { defineFunction } from '@aws-amplify/backend';
import { data } from '../../data/resource';

export const postConfirmation = defineFunction({
  name: 'post-confirmation',
  entry: './handler.ts',
  timeoutSeconds: 15,
  access: [data]
});