// src/contexts/FeatureFlagsContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
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
  resetToDefaults: () => {}
});

// Local storage key
const STORAGE_KEY = 'feature_flags';

// Provider component
export const FeatureFlagsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
  
  // Save flags to local storage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  }, [flags]);
  
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
    return !!flags[featureId];
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
    resetToDefaults
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