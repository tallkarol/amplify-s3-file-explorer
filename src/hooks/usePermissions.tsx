// src/hooks/usePermissions.ts (not in features/clients/hooks)
import { useUserRole } from './useUserRole';
import { fetchAuthSession } from 'aws-amplify/auth';

export function usePermissions() {
  const { isAdmin, isDeveloper } = useUserRole();
  
  // Check if the current user can modify the target user
  const canModifyUser = (targetUserRole: string): boolean => {
    // Admin can modify anyone except developers
    if (isAdmin && targetUserRole !== 'developer') {
      return true;
    }
    
    // No one else can modify users
    return false;
  };
  
  // Check if the current user can access the given resource
  const canAccessResource = async (resourceOwnerId: string): Promise<boolean> => {
    try {
      // Admins can access any resource
      if (isAdmin) return true;
      
      // Get current user ID
      const session = await fetchAuthSession();
      const currentUserId = session.tokens?.idToken?.payload?.sub;
      
      // Users can only access their own resources
      return currentUserId === resourceOwnerId;
    } catch (error) {
      console.error("Error checking resource access:", error);
      return false;
    }
  };
  
  return {
    canModifyUser,
    canAccessResource,
    isAdmin,
    isDeveloper
  };
}