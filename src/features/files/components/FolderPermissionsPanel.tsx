// src/features/files/components/FolderPermissionsPanel.tsx
import React, { useState, useEffect } from 'react';
import { Alert, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { FolderPermissions, getFolderPermission, setFolderPermissions } from '../services/S3Service';
import { getCurrentUser } from 'aws-amplify/auth';

interface FolderPermissionsPanelProps {
  userId: string;
  currentPath: string;
  onPermissionsChange?: (permissions: FolderPermissions) => void;
  onClose?: () => void;
}

const FolderPermissionsPanel: React.FC<FolderPermissionsPanelProps> = ({
  userId,
  currentPath,
  onPermissionsChange,
  onClose
}) => {
  const [permissions, setPermissions] = useState<FolderPermissions>({
    userId,
    folderPath: currentPath,
    downloadRestricted: false,
    uploadRestricted: false,
    canCreateSubfolders: true,
    canDeleteFolder: true,
    inheritFromParent: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, [userId, currentPath]);

  const loadPermissions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const existingPermissions = await getFolderPermission(userId, currentPath);
      
      if (existingPermissions) {
        setPermissions(existingPermissions);
      } else {
        // Set default permissions for new folder
        setPermissions({
          userId,
          folderPath: currentPath,
          downloadRestricted: false,
          uploadRestricted: false,
          canCreateSubfolders: true,
          canDeleteFolder: true,
          inheritFromParent: true
        });
      }
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (field: keyof FolderPermissions, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const currentUser = await getCurrentUser();
      const updatedPermissions = await setFolderPermissions({
        ...permissions,
        lastModifiedBy: currentUser.username
      });

      setPermissions(updatedPermissions);
      setHasChanges(false);
      
      if (onPermissionsChange) {
        onPermissionsChange(updatedPermissions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const getFolderDisplayName = () => {
    if (currentPath === '/') return 'Root Directory';
    const parts = currentPath.split('/').filter(Boolean);
    const folderName = parts[parts.length - 1];
    return folderName.charAt(0).toUpperCase() + folderName.slice(1).replace(/-/g, ' ');
  };

  if (loading) {
    return (
      <Card>
        <LoadingSpinner text="Loading permissions..." />
      </Card>
    );
  }

  return (
    <Card>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className="bi bi-shield-lock me-2 text-primary"></i>
          Folder Permissions
        </h5>
        {onClose && (
          <Button variant="outline-secondary" size="sm" onClick={onClose}>
            <i className="bi bi-x"></i>
          </Button>
        )}
      </div>

      <div className="mb-3">
        <Badge bg="primary" className="me-2">
          <i className="bi bi-folder me-1"></i>
          {getFolderDisplayName()}
        </Badge>
        <small className="text-muted">{currentPath}</small>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      <Form>
        <Row>
          <Col md={6}>
            <div className="permission-group mb-3">
              <h6 className="permission-group-title">
                <i className="bi bi-download me-2"></i>
                Download Access
              </h6>
              <Form.Check
                type="switch"
                id="download-restricted"
                label="Restrict downloads from this folder"
                checked={permissions.downloadRestricted}
                onChange={(e) => handlePermissionChange('downloadRestricted', e.target.checked)}
                className="mb-2"
              />
              <small className="text-muted">
                When enabled, users cannot download files from this folder
              </small>
            </div>
          </Col>

          <Col md={6}>
            <div className="permission-group mb-3">
              <h6 className="permission-group-title">
                <i className="bi bi-upload me-2"></i>
                Upload Access
              </h6>
              <Form.Check
                type="switch"
                id="upload-restricted"
                label="Restrict uploads to this folder"
                checked={permissions.uploadRestricted}
                onChange={(e) => handlePermissionChange('uploadRestricted', e.target.checked)}
                className="mb-2"
              />
              <small className="text-muted">
                When enabled, users cannot upload files to this folder
              </small>
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <div className="permission-group mb-3">
              <h6 className="permission-group-title">
                <i className="bi bi-folder-plus me-2"></i>
                Subfolder Management
              </h6>
              <Form.Check
                type="switch"
                id="can-create-subfolders"
                label="Allow creating subfolders"
                checked={permissions.canCreateSubfolders}
                onChange={(e) => handlePermissionChange('canCreateSubfolders', e.target.checked)}
                className="mb-2"
              />
              <small className="text-muted">
                When enabled, users can create new subfolders here
              </small>
            </div>
          </Col>

          <Col md={6}>
            <div className="permission-group mb-3">
              <h6 className="permission-group-title">
                <i className="bi bi-trash me-2"></i>
                Folder Deletion
              </h6>
              <Form.Check
                type="switch"
                id="can-delete-folder"
                label="Allow folder deletion"
                checked={permissions.canDeleteFolder}
                onChange={(e) => handlePermissionChange('canDeleteFolder', e.target.checked)}
                className="mb-2"
              />
              <small className="text-muted">
                When enabled, this folder can be deleted
              </small>
            </div>
          </Col>
        </Row>

        <div className="permission-group mb-3">
          <h6 className="permission-group-title">
            <i className="bi bi-arrow-up me-2"></i>
            Inheritance
          </h6>
          <Form.Check
            type="switch"
            id="inherit-from-parent"
            label="Inherit permissions from parent folder"
            checked={permissions.inheritFromParent}
            onChange={(e) => handlePermissionChange('inheritFromParent', e.target.checked)}
            className="mb-2"
          />
          <small className="text-muted">
            When enabled, this folder inherits permissions from its parent
          </small>
        </div>

        <div className="d-flex gap-2">
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check me-2"></i>
                Save Permissions
              </>
            )}
          </Button>
          
          {hasChanges && (
            <Button variant="outline-secondary" onClick={loadPermissions}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Reset
            </Button>
          )}
        </div>
      </Form>

      <style>{`
        .permission-group {
          border-left: 3px solid #e9ecef;
          padding-left: 15px;
        }
        
        .permission-group-title {
          color: #495057;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .form-check-input:checked {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }
      `}</style>
    </Card>
  );
};

export default FolderPermissionsPanel;