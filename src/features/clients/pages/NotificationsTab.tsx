// src/features/clients/pages/NotificationsTab.tsx
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../../types';
import { Notification } from '../../../types';
import { getAllNotificationsForUser, archiveNotification, unarchiveNotification, deleteNotification } from '../../notifications/services/NotificationService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';
import Card from '../../../components/common/Card';

interface NotificationsTabProps {
  client: UserProfile;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ client }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [client.uuid]);

  const fetchNotifications = async () => {
    if (!client?.uuid) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getAllNotificationsForUser(client.uuid, true);
      // Sort by createdAt descending (newest first)
      const sorted = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(sorted);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(`Failed to load notifications: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      setActionLoading(id);
      await archiveNotification(id);
      await fetchNotifications();
    } catch (err: any) {
      console.error('Error archiving notification:', err);
      const errorMessage = err?.message || err?.errors?.[0]?.message || JSON.stringify(err) || 'Unknown error';
      setError(`Failed to archive notification: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      setActionLoading(id);
      await unarchiveNotification(id);
      await fetchNotifications();
    } catch (err: any) {
      console.error('Error unarchiving notification:', err);
      const errorMessage = err?.message || err?.errors?.[0]?.message || JSON.stringify(err) || 'Unknown error';
      setError(`Failed to unarchive notification: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(id);
      await deleteNotification(id);
      await fetchNotifications();
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      const errorMessage = err?.message || err?.errors?.[0]?.message || JSON.stringify(err) || 'Unknown error';
      setError(`Failed to delete notification: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'system': return 'primary';
      case 'file': return 'success';
      case 'admin': return 'danger';
      case 'user': return 'info';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner text="Loading notifications..." />
      </div>
    );
  }

  return (
    <Card title={`Notifications for ${client.firstName || client.email}`}>
      {error && (
        <AlertMessage
          type="danger"
          message={error}
          dismissible={true}
          onDismiss={() => setError(null)}
        />
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
          <p className="text-muted">No notifications found for this user.</p>
        </div>
      ) : (
        <div className="list-group list-group-flush">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`list-group-item border-bottom px-3 py-2 ${notification.isArchived === true ? 'bg-light' : ''}`}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                minHeight: '60px'
              }}
            >
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="d-flex align-items-start gap-2 mb-1">
                  <span className={`badge bg-${getTypeBadgeColor(notification.type)}`} style={{ fontSize: '0.7rem' }}>
                    {notification.type}
                  </span>
                  {!notification.isRead && (
                    <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>Unread</span>
                  )}
                  {notification.isArchived === true && (
                    <span className="badge bg-warning" style={{ fontSize: '0.7rem' }}>Archived</span>
                  )}
                </div>
                <div className="fw-semibold" style={{ fontSize: '0.875rem', color: '#202124', lineHeight: 1.3 }}>
                  {notification.title}
                </div>
                <div className="text-muted small mt-1" style={{ fontSize: '0.75rem', lineHeight: 1.4, color: '#5f6368' }}>
                  {notification.message}
                </div>
                <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                  {formatDate(notification.createdAt)}
                </div>
              </div>
              <div className="d-flex gap-1 flex-shrink-0 ms-3">
                {notification.isArchived !== true ? (
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleArchive(notification.id)}
                    disabled={actionLoading === notification.id}
                    title="Archive"
                    style={{ padding: '4px 8px' }}
                  >
                    {actionLoading === notification.id ? (
                      <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                    ) : (
                      <i className="bi bi-archive" style={{ fontSize: '0.875rem' }}></i>
                    )}
                  </button>
                ) : (
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => handleUnarchive(notification.id)}
                    disabled={actionLoading === notification.id}
                    title="Unarchive"
                    style={{ padding: '4px 8px' }}
                  >
                    {actionLoading === notification.id ? (
                      <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                    ) : (
                      <i className="bi bi-archive-fill" style={{ fontSize: '0.875rem' }}></i>
                    )}
                  </button>
                )}
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(notification.id)}
                  disabled={actionLoading === notification.id}
                  title="Delete"
                  style={{ padding: '4px 8px' }}
                >
                  {actionLoading === notification.id ? (
                    <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                  ) : (
                    <i className="bi bi-trash" style={{ fontSize: '0.875rem' }}></i>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default NotificationsTab;
