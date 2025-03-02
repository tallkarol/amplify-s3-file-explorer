// src/contexts/FeatureFlagsContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import features, { Feature } from '../config/features';

// Type for the feature flags state (a map of feature ID to boolean)
type FeatureFlags = Record<string, boolean>;

// Context interface
interface FeatureFlagsContextType {
  flags: FeatureFlags;
  toggleFeature: (featureId: string) => void;
  enableFeature: (featureId: string) => void;
  disableFeature: (featureId: string) => void;
  isEnabled: (featureId: string) => boolean;
  getFeatureConfig: (featureId: string) => Feature | undefined;
  allFeatures: Feature[];
  resetToDefaults: () => void;
  userGroups: string[];
  hasFeatureAccess: (featureId: string) => boolean;
}

// Create context with default values
const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: {},
  toggleFeature: () => {},
  enableFeature: () => {},
  disableFeature: () => {},
  isEnabled: () => false,
  getFeatureConfig: () => undefined,
  allFeatures: features,
  resetToDefaults: () => {},
  userGroups: [],
  hasFeatureAccess: () => false
});

// Local storage key
const STORAGE_KEY = 'feature_flags';

// Provider component
export const FeatureFlagsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuthenticator();
  const [userGroups, setUserGroups] = useState<string[]>([]);
  
  // Initialize state with default values
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    // Try to load from local storage
    const savedFlags = localStorage.getItem(STORAGE_KEY);
    
    if (savedFlags) {
      try {
        return JSON.parse(savedFlags);
      } catch (error) {
        console.error('Failed to parse saved feature flags:', error);
      }
    }
    
    // If no saved flags or parsing failed, use defaults
    return features.reduce((acc, feature) => {
      acc[feature.id] = feature.defaultValue;
      return acc;
    }, {} as FeatureFlags);
  });
  
  // Fetch user groups when component mounts
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload?.['cognito:groups'] || [];
        setUserGroups(Array.isArray(groups) 
          ? groups.filter((group): group is string => typeof group === 'string')
          : []);
      } catch (error) {
        console.error('Error fetching user groups:', error);
        setUserGroups([]);
      }
    };
    
    fetchUserGroups();
  }, [user]);
  
  // Save flags to local storage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  }, [flags]);
  
  // Check if user has access to a feature based on their groups
  const hasFeatureAccess = (featureId: string): boolean => {
    const feature = getFeatureConfig(featureId);
    
    if (!feature) return false;
    
    // If feature doesn't have allowedGroups, it's available to everyone
    if (!feature.allowedGroups || feature.allowedGroups.length === 0) {
      return true;
    }
    
    // Check if user belongs to any of the allowed groups
    return userGroups.some(group => feature.allowedGroups?.includes(group));
  };
  
  // Toggle a feature flag
  const toggleFeature = (featureId: string) => {
    setFlags(prevFlags => ({
      ...prevFlags,
      [featureId]: !prevFlags[featureId]
    }));
  };
  
  // Enable a feature
  const enableFeature = (featureId: string) => {
    setFlags(prevFlags => ({
      ...prevFlags,
      [featureId]: true
    }));
  };
  
  // Disable a feature
  const disableFeature = (featureId: string) => {
    setFlags(prevFlags => ({
      ...prevFlags,
      [featureId]: false
    }));
  };
  
  // Check if a feature is enabled
  const isEnabled = (featureId: string) => {
    // First check if the flag is enabled in our state
    const isFeatureEnabled = !!flags[featureId];
    
    // Then check if the user has access to this feature
    const hasAccess = hasFeatureAccess(featureId);
    
    // Feature is only enabled if both conditions are true
    return isFeatureEnabled && hasAccess;
  };
  
  // Get feature configuration
  const getFeatureConfig = (featureId: string) => {
    return features.find(feature => feature.id === featureId);
  };
  
  // Reset all flags to default values
  const resetToDefaults = () => {
    const defaultFlags = features.reduce((acc, feature) => {
      acc[feature.id] = feature.defaultValue;
      return acc;
    }, {} as FeatureFlags);
    
    setFlags(defaultFlags);
  };
  
  // Context value
  const value = {
    flags,
    toggleFeature,
    enableFeature,
    disableFeature,
    isEnabled,
    getFeatureConfig,
    allFeatures: features,
    resetToDefaults,
    userGroups,
    hasFeatureAccess
  };
  
  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// Hook for using the feature flags context
export const useFeatureFlags = () => useContext(FeatureFlagsContext);

export default FeatureFlagsContext;