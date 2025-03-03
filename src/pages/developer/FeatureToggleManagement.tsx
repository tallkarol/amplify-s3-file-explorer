// src/pages/developer/FeatureToggleManagement.tsx
import React, { useState } from 'react';
import Card from '../../components/common/Card';
import AlertMessage from '../../components/common/AlertMessage';
import FeatureTogglePanel from '../../components/developer/FeatureTogglePanel';

const FeatureToggleManagement: React.FC = () => {
  const [message, setMessage] = useState<{ type: 'success' | 'danger' | 'info', text: string } | null>({
    type: 'info',
    text: 'Module access controls are saved in your browser\'s local storage.'
  });
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Module Access Control</h2>
          <p className="text-muted mb-0">
            Enable or disable access to specific modules for different user groups
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
      
      <Card>
        <div className="mb-4">
          <div className="alert alert-info">
            <h5 className="alert-heading">How Module Access Control Works</h5>
            <p>This panel allows developers to control which modules are visible to different user groups:</p>
            <ul className="mb-0">
              <li><strong>Admin Group:</strong> Controls which modules are visible in the Admin sidebar</li>
              <li><strong>User Group:</strong> Controls which modules are visible in the User sidebar</li>
              <li><strong>Developer Group:</strong> Typically has access to all modules</li>
            </ul>
          </div>
        </div>
        
        <FeatureTogglePanel />
        
        <div className="alert alert-warning mt-4">
          <h5 className="alert-heading">Implementation Notes</h5>
          <p className="mb-0">
            In this phase, feature toggles are stored in browser local storage. In a production environment,
            these settings would be stored in the database and synchronized across all instances.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default FeatureToggleManagement;