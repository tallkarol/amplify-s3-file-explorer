// src/features/files/components/UserFolderPermissions.tsx
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { list } from 'aws-amplify/storage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AlertMessage from '@/components/common/AlertMessage';

interface FolderPermission {
  id?: string;
  userId: string;
  folderPath: string;
  folderName: string;
  canView: boolean;
  canUpload: boolean;
  canDownload: boolean;
  downloadRestricted?: boolean;
  uploadRestricted?: boolean;
}

interface UserFolderPermissionsProps {
  userId: string;
  userEmail: string;
  userName?: string;
}

const UserFolderPermissions = ({ userId, userEmail, userName }: UserFolderPermissionsProps) => {
  const [permissions, setPermissions] = useState<FolderPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const client = generateClient();

  // Core folders that should always be visible
  const coreFolders = [
    { id: 'certificate', name: 'Certificates', path: '/certificate/' },
    { id: 'audit-report', name: 'Audit Reports', path: '/audit-report/' },
    { id: 'auditor-resume', name: 'Auditor Profiles', path: '/auditor-resume/' },
    { id: 'statistics', name: 'Statistics', path: '/statistics/' },
  ];

  useEffect(() => {
    fetchPermissions();
  }, [userId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch existing permissions
      const permissionsQuery = /* GraphQL */ `
        query ListFolderPermissions($userId: String!) {
          listFolderPermissions(filter: { userId: { eq: $userId } }) {
            items {
              id
              userId
              folderPath
              downloadRestricted
              uploadRestricted
            }
          }
        }
      `;

      const response = await client.graphql<GraphQLQuery<any>>({
        query: permissionsQuery,
        variables: { userId },
        authMode: 'userPool'
      });

      const existingPermissions = response.data?.listFolderPermissions?.items || [];

      // 2. Scan S3 for all folders
      const path = `users/${userId}/`;
      const result = await list({
        path,
        options: {
          listAll: true,
        }
      });

      // Extract unique folder names
      const folderNames = new Set<string>();
      result.items.forEach((item) => {
        if (item.path) {
          const relativePath = item.path.replace(path, '');
          const pathParts = relativePath.split('/');
          if (pathParts.length > 1 && pathParts[0]) {
            folderNames.add(pathParts[0]);
          }
        }
      });

      // 3. Create permission objects for core folders
      const permissionsList: FolderPermission[] = coreFolders.map(folder => {
        const existing = existingPermissions.find(
          (p: any) => p.folderPath && p.folderPath.includes(folder.id)
        );

        return {
          id: existing?.id,
          userId,
          folderPath: folder.path,
          folderName: folder.name,
          canView: true, // Core folders are always visible
          canUpload: existing ? !existing.uploadRestricted : true,
          canDownload: existing ? !existing.downloadRestricted : true,
          downloadRestricted: existing?.downloadRestricted || false,
          uploadRestricted: existing?.uploadRestricted || false,
        };
      });

      // 4. Add additional folders found in S3
      const coreIds = coreFolders.map(f => f.id);
      folderNames.forEach(folderName => {
        if (!coreIds.includes(folderName)) {
          const folderPath = `/${folderName}/`;
          const existing = existingPermissions.find(
            (p: any) => p.folderPath && p.folderPath.includes(folderName)
          );

          permissionsList.push({
            id: existing?.id,
            userId,
            folderPath,
            folderName: formatFolderName(folderName),
            canView: true, // Additional folders visible if they exist
            canUpload: existing ? !existing.uploadRestricted : true,
            canDownload: existing ? !existing.downloadRestricted : true,
            downloadRestricted: existing?.downloadRestricted || false,
            uploadRestricted: existing?.uploadRestricted || false,
          });
        }
      });

      setPermissions(permissionsList);
      setHasChanges(false);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Failed to load folder permissions');
    } finally {
      setLoading(false);
    }
  };

  const formatFolderName = (folderName: string): string => {
    return folderName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handlePermissionToggle = (index: number, field: 'canView' | 'canUpload' | 'canDownload') => {
    setPermissions(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: !updated[index][field]
      };
      return updated;
    });
    setHasChanges(true);
  };

  const handleGrantAllAccess = () => {
    setPermissions(prev => prev.map(perm => ({
      ...perm,
      canView: true,
      canUpload: true,
      canDownload: true
    })));
    setHasChanges(true);
  };

  const handleRevokeAllAccess = () => {
    setPermissions(prev => prev.map(perm => ({
      ...perm,
      canView: true, // Keep view permission
      canUpload: false,
      canDownload: false
    })));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Save each permission
      for (const perm of permissions) {
        const folderPath = `users/${userId}${perm.folderPath}`;
        
        if (perm.id) {
          // Update existing permission
          const updateMutation = /* GraphQL */ `
            mutation UpdateFolderPermission($input: UpdateFolderPermissionInput!) {
              updateFolderPermission(input: $input) {
                id
              }
            }
          `;

          await client.graphql<GraphQLQuery<any>>({
            query: updateMutation,
            variables: {
              input: {
                id: perm.id,
                downloadRestricted: !perm.canDownload,
                uploadRestricted: !perm.canUpload,
              }
            },
            authMode: 'userPool'
          });
        } else {
          // Create new permission
          const createMutation = /* GraphQL */ `
            mutation CreateFolderPermission($input: CreateFolderPermissionInput!) {
              createFolderPermission(input: $input) {
                id
              }
            }
          `;

          await client.graphql<GraphQLQuery<any>>({
            query: createMutation,
            variables: {
              input: {
                userId,
                folderPath,
                downloadRestricted: !perm.canDownload,
                uploadRestricted: !perm.canUpload,
                canCreateSubfolders: false,
                canDeleteFolder: false,
                inheritFromParent: false,
              }
            },
            authMode: 'userPool'
          });
        }
      }

      setSuccess('Permissions saved successfully!');
      setHasChanges(false);
      
      // Refresh permissions
      await fetchPermissions();
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('Failed to save permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingSpinner text="Loading folder permissions..." />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-white">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">
              <i className="bi bi-folder-lock me-2 text-primary"></i>
              Folder Permissions
            </h5>
            <p className="text-muted small mb-0">
              Manage access for {userName || userEmail}
            </p>
          </div>
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-outline-success"
              onClick={handleGrantAllAccess}
              title="Grant full access to all folders"
            >
              <i className="bi bi-check-all me-1"></i>
              Grant All
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={handleRevokeAllAccess}
              title="Revoke upload/download from all folders"
            >
              <i className="bi bi-x-circle me-1"></i>
              Revoke All
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        {error && (
          <AlertMessage
            type="danger"
            message={error}
            dismissible
            onDismiss={() => setError(null)}
          />
        )}

        {success && (
          <AlertMessage
            type="success"
            message={success}
            dismissible
            onDismiss={() => setSuccess(null)}
          />
        )}

        {/* Core Folders Section */}
        {permissions.filter((_p, idx) => idx < coreFolders.length).length > 0 && (
          <div className="folder-permissions-section mb-4">
            <div className="d-flex align-items-center mb-3">
              <h6 className="mb-0 text-muted">
                <i className="bi bi-folder-fill me-2"></i>
                Core Folders
              </h6>
              <span className="badge bg-primary ms-2">{coreFolders.length}</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40%' }}>Folder</th>
                    <th className="text-center" style={{ width: '20%' }}>
                      <i className="bi bi-eye me-1"></i>
                      View
                    </th>
                    <th className="text-center" style={{ width: '20%' }}>
                      <i className="bi bi-cloud-upload me-1"></i>
                      Upload
                    </th>
                    <th className="text-center" style={{ width: '20%' }}>
                      <i className="bi bi-cloud-download me-1"></i>
                      Download
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.slice(0, coreFolders.length).map((perm, index) => (
                    <tr key={perm.folderPath}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-folder text-primary me-2"></i>
                          <strong>{perm.folderName}</strong>
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="form-check form-switch d-inline-block">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`view-${index}`}
                            checked={perm.canView}
                            onChange={() => handlePermissionToggle(index, 'canView')}
                            disabled
                            style={{ cursor: 'not-allowed' }}
                          />
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="form-check form-switch d-inline-block">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`upload-${index}`}
                            checked={perm.canUpload}
                            onChange={() => handlePermissionToggle(index, 'canUpload')}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="form-check form-switch d-inline-block">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`download-${index}`}
                            checked={perm.canDownload}
                            onChange={() => handlePermissionToggle(index, 'canDownload')}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Additional Folders Section */}
        {permissions.length > coreFolders.length && (
          <div className="folder-permissions-section mb-4">
            <div className="d-flex align-items-center mb-3">
              <h6 className="mb-0 text-muted">
                <i className="bi bi-folder-plus me-2"></i>
                Additional Folders
              </h6>
              <span className="badge bg-secondary ms-2">{permissions.length - coreFolders.length}</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40%' }}>Folder</th>
                    <th className="text-center" style={{ width: '20%' }}>
                      <i className="bi bi-eye me-1"></i>
                      View
                    </th>
                    <th className="text-center" style={{ width: '20%' }}>
                      <i className="bi bi-cloud-upload me-1"></i>
                      Upload
                    </th>
                    <th className="text-center" style={{ width: '20%' }}>
                      <i className="bi bi-cloud-download me-1"></i>
                      Download
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.slice(coreFolders.length).map((perm, relIndex) => {
                    const index = coreFolders.length + relIndex;
                    return (
                      <tr key={perm.folderPath}>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-folder text-secondary me-2"></i>
                            <strong>{perm.folderName}</strong>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`view-${index}`}
                              checked={perm.canView}
                              onChange={() => handlePermissionToggle(index, 'canView')}
                              disabled
                              style={{ cursor: 'not-allowed' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`upload-${index}`}
                              checked={perm.canUpload}
                              onChange={() => handlePermissionToggle(index, 'canUpload')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`download-${index}`}
                              checked={perm.canDownload}
                              onChange={() => handlePermissionToggle(index, 'canDownload')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="alert alert-info d-flex align-items-start">
          <i className="bi bi-info-circle me-2 mt-1"></i>
          <div className="small">
            <strong>Permission Guide:</strong>
            <ul className="mb-0 mt-1 ps-3">
              <li><strong>View:</strong> User can see the folder and its contents (core folders always visible)</li>
              <li><strong>Upload:</strong> User can upload files to the folder</li>
              <li><strong>Download:</strong> User can download files from the folder</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2 justify-content-end">
          {hasChanges && (
            <button
              className="btn btn-outline-secondary"
              onClick={fetchPermissions}
              disabled={saving}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Reset Changes
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Save Permissions
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .folder-permissions-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
        }
        
        .table {
          background: white;
          margin-bottom: 0;
        }
        
        .form-check-input:checked {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }
        
        .form-check-input:disabled:checked {
          background-color: #6c757d;
          border-color: #6c757d;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};

export default UserFolderPermissions;

