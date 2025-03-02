// src/components/developer/FeatureTogglePanel.tsx
import React, { useState } from 'react';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import Card from '../../components/common/Card';
import { Feature } from '../../config/features';

interface FeatureTogglePanelProps {
  className?: string;
}

const FeatureTogglePanel: React.FC<FeatureTogglePanelProps> = ({ className = '' }) => {
  const { allFeatures, flags, toggleFeature, resetToDefaults } = useFeatureFlags();
  const [filter, setFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Get unique categories
  const categories = ['all', ...new Set(allFeatures.map(feature => feature.category))];
  
  // Filter features based on search term and category
  const filteredFeatures = allFeatures.filter(feature => {
    const matchesSearch = filter === '' || 
      feature.name.toLowerCase().includes(filter.toLowerCase()) ||
      feature.description.toLowerCase().includes(filter.toLowerCase());
      
    const matchesCategory = categoryFilter === 'all' || feature.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Group features by category
  const groupedFeatures: Record<string, Feature[]> = {};
  
  filteredFeatures.forEach(feature => {
    if (!groupedFeatures[feature.category]) {
      groupedFeatures[feature.category] = [];
    }
    groupedFeatures[feature.category].push(feature);
  });
  
  return (
    <Card className={className}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Feature Flags</h5>
        <button 
          className="btn btn-sm btn-outline-secondary"
          onClick={resetToDefaults}
        >
          <i className="bi bi-arrow-counterclockwise me-2"></i>
          Reset to Defaults
        </button>
      </div>
      
      <div className="row mb-4 g-3">
        <div className="col-md-8">
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
        <div className="col-md-4">
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
                {features.map(feature => (
                  <div key={feature.id} className="list-group-item list-group-item-action d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <h6 className="mb-1">{feature.name}</h6>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`toggle-${feature.id}`}
                            checked={flags[feature.id] || false}
                            onChange={() => toggleFeature(feature.id)}
                          />
                        </div>
                      </div>
                      <p className="text-muted mb-0 small">{feature.description}</p>
                    </div>
                  </div>
                ))}
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
              Changes will be saved in your browser and persist between sessions.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FeatureTogglePanel;