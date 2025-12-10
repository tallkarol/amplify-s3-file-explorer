import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { preSignup } from './auth/pre-signup/resource';
import { postConfirmation } from './auth/post-confirmation/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

defineBackend({
  auth,
  preSignup,
  postConfirmation,
  data,
  storage
});

// Bind the data resource to functions that need generated client config
data.bind(preSignup);
data.bind(postConfirmation);
