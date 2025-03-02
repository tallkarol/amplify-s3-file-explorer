// src/hooks/useFeatureFlag.ts
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import { Feature } from '../config/features';

/**
 * A hook for accessing a specific feature flag
 * @param featureId The ID of the feature to check
 * @returns An object with the feature state and methods to control it
 */
export const useFeatureFlag = (featureId: string) => {
  const { 
    isEnabled, 
    toggleFeature, 
    enableFeature, 
    disableFeature, 
    getFeatureConfig,
    hasFeatureAccess,
    userGroups
  } = useFeatureFlags();
  
  const enabled = isEnabled(featureId);
  const featureConfig = getFeatureConfig(featureId);
  const hasAccess = hasFeatureAccess(featureId);
  
  return {
    enabled,
    toggle: () => toggleFeature(featureId),
    enable: () => enableFeature(featureId),
    disable: () => disableFeature(featureId),
    config: featureConfig as Feature | undefined,
    hasAccess,
    userGroups
  };
};

export default useFeatureFlag;