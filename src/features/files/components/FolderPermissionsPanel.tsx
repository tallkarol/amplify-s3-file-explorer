// src/features/files/components/FolderPermissionsPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Alert, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import Card from '../../../components/common/Card';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { FolderPermissions, getFolderPermission, setFolderPermissions } from '../services/S3Service';
import { getCurrentUser } from 'aws-amplify/auth';
import { devWarn } from '../../../utils/logger';

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
  // Helper function to create normalized permissions object
  const createNormalizedPermissions = (base: Partial<FolderPermissions> = {}, overrideUserId?: string, overridePath?: string): FolderPermissions => {
    // Normalize the folder path to prevent // issues
    const finalPath = base.folderPath || overridePath || currentPath || '/';
    const normalizedPath = finalPath === '//' ? '/' : finalPath;
    
    return {
    userId: base.userId || overrideUserId || userId,
    folderPath: normalizedPath,
    downloadRestricted: base.downloadRestricted ?? false,
    uploadRestricted: base.uploadRestricted ?? false,
    canCreateSubfolders: base.canCreateSubfolders ?? true,
    canDeleteFolder: base.canDeleteFolder ?? true,
    inheritFromParent: base.inheritFromParent ?? true,
    isVisible: base.isVisible ?? true,
    id: base.id,
    createdBy: base.createdBy,
    lastModifiedBy: base.lastModifiedBy,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt
    };
  };

  const [permissions, setPermissions] = useState<FolderPermissions>(createNormalizedPermissions({}, userId, currentPath));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const loadingRef = useRef<boolean>(false);

  useEffect(() => {
    // Only load permissions if we have valid userId and currentPath, and not already loading
    if (userId && currentPath && !loadingRef.current) {
      loadPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentPath]);

  const loadPermissions = async () => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      return;
    }
    
    // Validate inputs
    if (!userId || !currentPath) {
      devWarn('[FolderPermissionsPanel] Missing userId or currentPath:', { userId, currentPath });
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const existingPermissions = await getFolderPermission(userId, currentPath);
      
      if (existingPermissions) {
        // Normalize all boolean fields to ensure they're never undefined
        const normalized = createNormalizedPermissions(existingPermissions, userId, currentPath);
        setPermissions(normalized);
      } else {
        // Set default permissions for new folder
        const defaults = createNormalizedPermissions({}, userId, currentPath);
        setPermissions(defaults);
      }
      setHasChanges(false);
    } catch (err: any) {
      const errorMessage = err?.errors?.[0]?.message || err?.message || 'Failed to load permissions';
      console.error('[FolderPermissionsPanel] Error loading folder permissions:', errorMessage);
      setError(`Error loading permissions: ${errorMessage}`);
    } finally {
      setLoading(false);
      loadingRef.current = false;
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
    setSuccess(null);

    try {
      const currentUser = await getCurrentUser();
      const username = currentUser.username;
      
      // Check if this is a new permission (no id) or existing one
      const isNewPermission = !permissions.id;
      
      // Ensure all required fields are set before saving
      const normalizedPermissions = createNormalizedPermissions(permissions, userId, currentPath);
      const permissionsToSave = {
        ...normalizedPermissions,
        createdBy: isNewPermission ? username : normalizedPermissions.createdBy,
        lastModifiedBy: username
      };
      
      const updatedPermissions = await setFolderPermissions(permissionsToSave);

      // Normalize the response to ensure all boolean fields are defined
      const normalizedResponse = createNormalizedPermissions(updatedPermissions, userId, currentPath);
      setPermissions(normalizedResponse);
      setHasChanges(false);
      setSuccess('Permissions saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      if (onPermissionsChange) {
        onPermissionsChange(updatedPermissions);
      }
    } catch (err: any) {
      const errorMessage = err?.errors?.[0]?.message || err?.message || 'Failed to save permissions';
      console.error('[FolderPermissionsPanel] Error saving folder permissions:', errorMessage);
      setError(`Error saving permissions: ${errorMessage}`);
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
        <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-3" dismissible onClose={() => setSuccess(null)}>
          <i className="bi bi-check-circle me-2"></i>
          {success}
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

        <Row>
          <Col md={6}>
            <div className="permission-group mb-3">
              <h6 className="permission-group-title">
                <i className="bi bi-eye me-2"></i>
                Visibility
              </h6>
              <Form.Check
                type="switch"
                id="is-visible"
                label="Make folder visible to user"
                checked={permissions.isVisible}
                onChange={(e) => handlePermissionChange('isVisible', e.target.checked)}
                className="mb-2"
              />
              <small className="text-muted">
                When enabled, users can see this folder in their file browser
              </small>
            </div>
          </Col>

          <Col md={6}>
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
          </Col>
        </Row>

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