// src/components/developer/FeatureTogglePanel.tsx
import React, { useState } from 'react';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { Feature } from '../../config/features';

interface FeatureTogglePanelProps {
  className?: string;
}

const FeatureTogglePanel: React.FC<FeatureTogglePanelProps> = ({ className = '' }) => {
  const { allFeatures, flags, toggleFeature, resetToDefaults, userGroups, hasFeatureAccess, isEnabled } = useFeatureFlags();
  const [filter, setFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showOnlyAccessible, setShowOnlyAccessible] = useState<boolean>(false);
  
  // Get unique categories
  const categories = ['all', ...new Set(allFeatures.map(feature => feature.category))];
  
  // Filter features based on search term, category, and accessibility
  const filteredFeatures = allFeatures.filter(feature => {
    const matchesSearch = filter === '' || 
      feature.name.toLowerCase().includes(filter.toLowerCase()) ||
      feature.description.toLowerCase().includes(filter.toLowerCase());
      
    const matchesCategory = categoryFilter === 'all' || feature.category === categoryFilter;
    
    const matchesAccessibility = !showOnlyAccessible || hasFeatureAccess(feature.id);
    
    return matchesSearch && matchesCategory && matchesAccessibility;
  });
  
  // Group features by category
  const groupedFeatures: Record<string, Feature[]> = {};
  
  filteredFeatures.forEach(feature => {
    if (!groupedFeatures[feature.category]) {
      groupedFeatures[feature.category] = [];
    }
    groupedFeatures[feature.category].push(feature);
  });
  
  // Format the allowed groups for display
  const formatAllowedGroups = (groups?: string[]) => {
    if (!groups || groups.length === 0) {
      return 'All Users';
    }
    return groups.join(', ');
  };
  
  // Show if current user has access to a feature
  const getUserAccessLabel = (feature: Feature) => {
    const hasAccess = hasFeatureAccess(feature.id);
    return hasAccess 
      ? <span className="badge bg-success">Access Granted</span>
      : <span className="badge bg-secondary">No Access</span>;
  };
  
  return (
    <div className={className}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Feature Flags</h5>
        <div>
          <button 
            className="btn btn-sm btn-outline-secondary me-2"
            onClick={resetToDefaults}
          >
            <i className="bi bi-arrow-counterclockwise me-2"></i>
            Reset to Defaults
          </button>
          <button
            className="btn btn-sm btn-outline-info"
            title="View Your User Groups"
          >
            <i className="bi bi-people-fill me-1"></i>
            Your Groups: {userGroups.length > 0 ? userGroups.join(', ') : 'None'}
          </button>
        </div>
      </div>
      
      <div className="row mb-4 g-3">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 bg-light"
              placeholder="Search features..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select 
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <div className="form-check form-switch pt-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="showOnlyAccessible"
              checked={showOnlyAccessible}
              onChange={(e) => setShowOnlyAccessible(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="showOnlyAccessible">
              Show only accessible features
            </label>
          </div>
        </div>
      </div>
      
      {filteredFeatures.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          No features match your search criteria.
        </div>
      ) : (
        <>
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <div key={category} className="mb-4">
              <h6 className="text-muted mb-3 text-uppercase">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h6>
              
              <div className="list-group mb-3">
                {features.map(feature => {
                  const canAccess = hasFeatureAccess(feature.id);
                  const isFeatureEnabled = isEnabled(feature.id);
                  
                  return (
                    <div 
                      key={feature.id} 
                      className={`list-group-item list-group-item-action d-flex align-items-center ${!canAccess ? 'opacity-75' : ''}`}
                    >
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-1">
                            {feature.name}
                            {' '}
                            {getUserAccessLabel(feature)}
                          </h6>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`toggle-${feature.id}`}
                              checked={flags[feature.id] || false}
                              onChange={() => toggleFeature(feature.id)}
                              disabled={!canAccess}
                            />
                          </div>
                        </div>
                        <p className="text-muted mb-2 small">{feature.description}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-secondary">
                            Allowed Groups: <span className="badge bg-info text-dark">{formatAllowedGroups(feature.allowedGroups)}</span>
                          </small>
                          <small className="text-secondary">
                            Status: {isFeatureEnabled ? 
                              <span className="badge bg-success">Enabled</span> : 
                              <span className="badge bg-danger">Disabled</span>}
                          </small>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
      
      <div className="alert alert-secondary mt-3">
        <div className="d-flex">
          <i className="bi bi-info-circle-fill fs-4 me-2"></i>
          <div>
            <strong>About Feature Flags</strong>
            <p className="mb-0 mt-1">
              Feature flags allow enabling or disabling specific functionality without code changes.
              Some features may be restricted to specific user groups.
              Your current groups: <strong>{userGroups.length > 0 ? userGroups.join(', ') : 'None'}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureTogglePanel;