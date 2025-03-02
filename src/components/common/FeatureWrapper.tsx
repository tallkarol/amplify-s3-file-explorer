// src/components/common/FeatureWrapper.tsx
import React, { ReactNode } from 'react';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

interface FeatureWrapperProps {
  featureId: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * A component that conditionally renders content based on feature flag status
 * 
 * @example
 * <FeatureWrapper featureId="advanced_file_search" fallback={<BasicSearchComponent />}>
 *   <AdvancedSearchComponent />
 * </FeatureWrapper>
 */
const FeatureWrapper: React.FC<FeatureWrapperProps> = ({ 
  featureId, 
  fallback = null, 
  children 
}) => {
  const { enabled, hasAccess } = useFeatureFlag(featureId);
  
  // Only render children if the feature is both enabled and user has access
  if (enabled && hasAccess) {
    return <>{children}</>;
  }
  
  // Otherwise render the fallback
  return <>{fallback}</>;
};

export default FeatureWrapper;