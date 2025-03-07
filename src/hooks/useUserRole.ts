// src/hooks/useUserRole.ts
import { useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export type UserRole = 'admin' | 'developer' | 'user';

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserRole() {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload?.['cognito:groups'];
        
        if (Array.isArray(groups)) {
          if (groups.includes('admin')) {
            setUserRole('admin');
          } else if (groups.includes('developer')) {
            setUserRole('developer');
          } else {
            setUserRole('user');
          }
        } else {
          setUserRole('user');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    }

    checkUserRole();
  }, []);

  const isAdmin = userRole === 'admin' || userRole === 'developer'; // Consider developers as admin too
  const isDeveloper = userRole === 'developer';
  const isUser = true; // Everyone has basic user access

  return {
    userRole,
    isAdmin,
    isDeveloper,
    isUser,
    loading,
  };
}