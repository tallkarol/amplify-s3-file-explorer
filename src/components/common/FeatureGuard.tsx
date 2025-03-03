// src/components/common/FeatureGuard.tsx
import React, { ReactNode } from 'react';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';

interface FeatureGuardProps {
  featureId: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * A component that conditionally renders content based on feature flag status
 * Used for route protection and conditional rendering
 */
const FeatureGuard: React.FC<FeatureGuardProps> = ({ 
  featureId, 
  fallback = null, 
  children 
}) => {
  const { isEnabled, hasFeatureAccess } = useFeatureFlags();
  
  // Only render children if the feature is both enabled and user has access
  if (isEnabled(featureId) && hasFeatureAccess(featureId)) {
    return <>{children}</>;
  }
  
  // Otherwise render the fallback
  return <>{fallback}</>;
};

export default FeatureGuard;