// src/components/developer/DuplicateUserDetector.tsx
import React, { useState, useEffect } from 'react';
import { Alert, Button, Table, Badge, Spinner } from 'react-bootstrap';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { fetchAllClients, markUserAsDeleted } from '@/features/clients/services/clientService';
import { listUserFiles } from '@/features/files/services/S3Service';
import { UserProfile } from '@/types';

interface DuplicateGroup {
  email: string;
  users: UserProfileWithMetadata[];
}

interface UserProfileWithMetadata extends UserProfile {
  fileCount: number;
  isAdmin?: boolean;
  isDeveloper?: boolean;
  loading?: boolean;
}

const DuplicateUserDetector: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  useEffect(() => {
    scanForDuplicates();
  }, []);

  const scanForDuplicates = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Fetch all user profiles
      const users = await fetchAllClients();

      // Group by email
      const emailMap = new Map<string, UserProfile[]>();
      users.forEach(user => {
        if (user.email) {
          const existing = emailMap.get(user.email) || [];
          existing.push(user);
          emailMap.set(user.email, existing);
        }
      });

      // Filter to only duplicates (more than 1 user per email)
      const duplicateGroups: DuplicateGroup[] = [];
      
      for (const [email, groupUsers] of emailMap.entries()) {
        if (groupUsers.length > 1) {
          // Fetch metadata for each user in parallel
          const usersWithMetadata = await Promise.all(
            groupUsers.map(async (user) => {
              try {
                // Get file count
                const files = await listUserFiles(user.uuid, '/');
                const fileCount = files.filter(f => !f.isFolder).length;

                // Note: We can't easily check Cognito groups from the frontend
                // This would require an API call to Cognito which admins don't have access to
                // The profileOwner field might give us hints though
                
                return {
                  ...user,
                  fileCount,
                  loading: false
                };
              } catch (err) {
                console.error(`Error fetching metadata for user ${user.uuid}:`, err);
                return {
                  ...user,
                  fileCount: 0,
                  loading: false
                };
              }
            })
          );

          duplicateGroups.push({
            email,
            users: usersWithMetadata
          });
        }
      }

      setDuplicates(duplicateGroups);

      if (duplicateGroups.length === 0) {
        setSuccess('No duplicate user accounts found!');
      }
    } catch (err) {
      console.error('Error scanning for duplicates:', err);
      setError(err instanceof Error ? err.message : 'Failed to scan for duplicate users');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDeleted = async (userId: string, email: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark this user as DELETED?\n\n` +
      `Email: ${email}\n` +
      `UUID: ${userId}\n\n` +
      `This will:\n` +
      `- Set the user status to 'deleted'\n` +
      `- Disable the Cognito account\n` +
      `- Preserve all S3 files\n\n` +
      `This action can be reversed by a developer if needed.`
    );

    if (!confirmed) return;

    setProcessingUserId(userId);
    setError(null);
    setSuccess(null);

    try {
      await markUserAsDeleted(userId);
      setSuccess(`User ${email} has been marked as deleted successfully.`);
      
      // Refresh the duplicate list
      setTimeout(() => {
        scanForDuplicates();
      }, 1000);
    } catch (err) {
      console.error('Error marking user as deleted:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark user as deleted');
    } finally {
      setProcessingUserId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge bg="success">Active</Badge>;
      case 'inactive':
        return <Badge bg="warning">Inactive</Badge>;
      case 'deleted':
        return <Badge bg="danger">Deleted</Badge>;
      default:
        return <Badge bg="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card title="Duplicate User Detector">
        <LoadingSpinner text="Scanning for duplicate users..." />
      </Card>
    );
  }

  return (
    <Card title="Duplicate User Detector">
      <div className="mb-3">
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={scanForDuplicates}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh Scan
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      {duplicates.length === 0 ? (
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          No duplicate user accounts detected. All emails are unique.
        </Alert>
      ) : (
        <>
          <Alert variant="warning">
            <strong>
              <i className="bi bi-exclamation-triangle me-2"></i>
              Found {duplicates.length} email(s) with duplicate accounts
            </strong>
            <p className="mb-0 mt-2">
              Review the accounts below and mark duplicates as deleted. Keep the account with the most data/activity.
            </p>
          </Alert>

          {duplicates.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              <h5 className="mb-3">
                <i className="bi bi-envelope me-2"></i>
                {group.email}
                <Badge bg="danger" className="ms-2">{group.users.length} accounts</Badge>
              </h5>

              <Table bordered hover responsive>
                <thead>
                  <tr>
                    <th>UUID</th>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Created</th>
                    <th>Files</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.users.map((user) => (
                    <tr key={user.uuid}>
                      <td>
                        <small className="font-monospace">{user.uuid}</small>
                      </td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td>
                        {user.firstName || user.lastName 
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : <span className="text-muted">—</span>
                        }
                      </td>
                      <td>{user.companyName || <span className="text-muted">—</span>}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <Badge bg="info">{user.fileCount} files</Badge>
                      </td>
                      <td>
                        {user.status === 'deleted' ? (
                          <Badge bg="secondary">Already Deleted</Badge>
                        ) : (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleMarkAsDeleted(user.uuid, group.email)}
                            disabled={processingUserId === user.uuid}
                          >
                            {processingUserId === user.uuid ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="me-2"
                                />
                                Processing...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-trash me-2"></i>
                                Mark as Deleted
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Alert variant="warning" className="mb-0">
                <small>
                  <strong>Recommendation:</strong> Keep the account with:
                  <ul className="mb-0 mt-1">
                    <li>Most files</li>
                    <li>Oldest creation date (most established)</li>
                    <li>Complete profile information</li>
                  </ul>
                </small>
              </Alert>
            </div>
          ))}
        </>
      )}
    </Card>
  );
};

export default DuplicateUserDetector;

