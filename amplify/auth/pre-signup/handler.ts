// amplify/auth/pre-signup/handler.ts
import type { PreSignUpTriggerHandler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from "$amplify/env/pre-signup";
import { dataEnv } from "$amplify/env/data";

// Merge the imported env with AWS environment variables into a single flat object.
const clientEnv = {
  ...env,
  ...dataEnv,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
  AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN!,
  AWS_REGION: process.env.AWS_REGION!,
};

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(clientEnv);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: PreSignUpTriggerHandler = async (event) => {
  try {
    console.log('Pre-signup handler started');
    const email = event.request.userAttributes.email;
    
    if (!email) {
      console.log('No email provided');
      return event;
    }
    
    console.log(`Checking for existing user with email: ${email}`);
    
    // Check if a user with this email already exists
    const existingUsers = await client.models.UserProfile.list({
      filter: {
        email: { eq: email }
      }
    });
    
    const users = existingUsers.data || [];
    
    if (users.length > 0) {
      // Check if any of the users are active or inactive
      const activeOrInactiveUsers = users.filter(
        user => user.status === 'active' || user.status === 'inactive'
      );
      
      if (activeOrInactiveUsers.length > 0) {
        console.log(`Email ${email} is already registered with status: ${activeOrInactiveUsers[0].status}`);
        // Throw an error to prevent signup
        throw new Error(
          'An account with this email address already exists. ' +
          'If you forgot your password, please use the "Forgot Password" link on the login page.'
        );
      }
      
      // Email exists but all users are deleted - allow signup
      console.log(`Email ${email} was previously used but all accounts are deleted. Allowing signup.`);
    }
    
    console.log(`Email ${email} is available for signup`);
    return event;
  } catch (error) {
    console.error('Error in pre-signup handler:', error);
    // Re-throw the error to prevent signup
    throw error;
  }
};

