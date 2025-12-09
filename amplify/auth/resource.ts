import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from './post-confirmation/resource';
import { preSignup } from './pre-signup/resource';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  triggers: {
    postConfirmation,
    preSignUp: preSignup
  },    
  groups: ["admin", "user","developer"],
});
