// src/pages/developer/FeatureToggleManagement.tsx
import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import AlertMessage from '../../components/common/AlertMessage';
import FeatureTogglePanel from '../../components/developer/FeatureTogglePanel';
import features, {} from '../../config/features';

const FeatureToggleManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'danger' | 'info', text: string } | null>(null);
  
  // Fetch all available groups (for display purposes)
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        
        // For Phase 1, we'll just use the unique groups from the feature allowedGroups
        // We don't need to track all groups separately since we're using featuresPerGroup
        // In a real implementation, you might fetch this from the API
        // const response = await fetchGroups();
        // setGroups(response.data.groups);
        
        setMessage({
          type: 'info',
          text: 'Feature toggle settings are saved in your browser\'s local storage.'
        });
      } catch (error) {
        console.error('Error fetching groups:', error);
        setMessage({
          type: 'danger',
          text: 'Failed to load user groups. Some features may not be properly displayed.'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroups();
  }, []);
  
  // Count features by group
  const getFeaturesPerGroup = () => {
    const groupCounts: Record<string, number> = {};
    
    features.forEach(feature => {
      if (feature.allowedGroups && feature.allowedGroups.length > 0) {
        feature.allowedGroups.forEach(group => {
          if (!groupCounts[group]) {
            groupCounts[group] = 0;
          }
          groupCounts[group]++;
        });
      }
    });
    
    return groupCounts;
  };
  
  const featuresPerGroup = getFeaturesPerGroup();
  
  // Count features that have no group restrictions
  const getUnrestrictedFeatureCount = () => {
    return features.filter(feature => !feature.allowedGroups || feature.allowedGroups.length === 0).length;
  };
  
  const unrestrictedFeatureCount = getUnrestrictedFeatureCount();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-0">Feature Toggle Management</h2>
            <p className="text-muted mb-0">
              Configure feature flags for different user groups
            </p>
          </div>
        </div>
        
        {message && (
          <AlertMessage
            type={message.type}
            message={message.text}
            dismissible
            onDismiss={() => setMessage(null)}
          />
        )}
        
        {/* Group overview */}
        <Card title="Group Access Overview" className="mb-4">
          <div className="row mb-4">
            <div className="col-md-6">
              <h6 className="mb-3">User Groups with Restricted Features</h6>
              <ul className="list-group">
                {Object.entries(featuresPerGroup).map(([group, count]) => (
                  <li key={group} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <span className="badge bg-primary me-2">{group}</span>
                      <span className="text-muted">Group</span>
                    </div>
                    <span className="badge bg-secondary rounded-pill">{count} Features</span>
                  </li>
                ))}
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <span className="badge bg-success me-2">All Users</span>
                    <span className="text-muted">Unrestricted Features</span>
                  </div>
                  <span className="badge bg-secondary rounded-pill">{unrestrictedFeatureCount} Features</span>
                </li>
              </ul>
            </div>
            
            <div className="col-md-6">
              <div className="alert alert-info">
                <h6 className="alert-heading">About Group-Based Feature Access</h6>
                <p className="mb-0">
                  Features can be restricted to specific user groups. Users will only see and have access to 
                  features that match their group membership. Features without group restrictions are available to all users.
                </p>
              </div>
              
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                In Phase 1, feature toggles are saved in browser local storage. This means:
                <ul className="mb-0 mt-2">
                  <li>Toggles are device-specific</li>
                  <li>Clearing browser data will reset toggles</li>
                  <li>Toggles are not synced across devices</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Feature toggle panel */}
        <Card title="Feature Toggle Controls">
          <FeatureTogglePanel />
        </Card>
      </div>
    );
};

export default FeatureToggleManagement;