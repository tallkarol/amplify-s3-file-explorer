// amplify/auth/pre-signup/handler.ts
import type { PreSignUpTriggerHandler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { env } from "$amplify/env/pre-signup";

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: env.AMPLIFY_DATA_GRAPHQL_ENDPOINT,
      region: env.AWS_REGION,
      defaultAuthMode: 'iam',
    },
  },
});

const client = generateClient<Schema>({ authMode: 'iam' });

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

