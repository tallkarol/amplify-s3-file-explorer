// src/pages/admin/AdminHome.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { devLog } from '../../utils/logger';

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  pendingApprovals: number;
  unreadMessages: number;
  upcomingTasks: number;
  storageUsed: number;
  storageTotal: number;
}

const AdminHome = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalDocuments: 0,
    pendingApprovals: 0,
    unreadMessages: 3,
    upcomingTasks: 5,
    storageUsed: 682,
    storageTotal: 1000
  });
  
  devLog('metrics:', metrics);

  // Create a client for making GraphQL requests
  const client = generateClient();
  
  useEffect(() => {
    // Fetch dashboard metrics
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        // Fetch user count using the list query
        const listUserProfilesQuery = /* GraphQL */ `
          query ListUserProfiles {
            listUserProfiles {
              items {
                id
              }
            }
          }
        `;
        
        const response = await client.graphql<GraphQLQuery<{ listUserProfiles: { items: { id: string }[] } }>>({
          query: listUserProfilesQuery,
          authMode: 'userPool'
        });
        
        const userCount = response?.data?.listUserProfiles?.items?.length || 0;
        
        // Update metrics with real user count, keep other metrics as placeholders
        setMetrics({
          totalUsers: userCount,
          activeUsers: Math.round(userCount * 0.8), // Simulate active users (80% of total)
          totalDocuments: userCount * 15, // Simulate approx. 15 docs per user
          pendingApprovals: Math.round(userCount * 0.5), // Simulate pending approvals
          unreadMessages: 3, // Placeholder
          upcomingTasks: 5, // Placeholder
          storageUsed: 682, // GB used
          storageTotal: 1000 // GB total
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
  }, []);
  
  return (
    <div>
      {/* Header with greeting and date */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Admin Dashboard</h2>
          <p className="text-muted mb-0">
            Welcome back • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-5">
          <LoadingSpinner text="Loading dashboard metrics..." />
        </div>
      ) : (
        <>
          
          {/* Quick action row - 2 column grid */}
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <Link to="/admin/clients" className="text-decoration-none">
                <div className="card h-100 hover-transform admin-action-card admin-action-card-clients">
                  <div className="card-body text-center p-4">
                    <div className="overview-card-icon mx-auto mb-3 admin-action-icon-clients">
                      <i className="bi bi-people"></i>
                    </div>
                    <h5 className="mb-2">Client Management</h5>
                    <p className="text-muted mb-0">Manage clients and accounts</p>
                  </div>
                </div>
              </Link>
            </div>
            
            <div className="col-lg-6">
              <Link to="/admin/files" className="text-decoration-none">
                <div className="card h-100 hover-transform admin-action-card admin-action-card-files">
                  <div className="card-body text-center p-4">
                    <div className="overview-card-icon mx-auto mb-3 admin-action-icon-files">
                      <i className="bi bi-folder"></i>
                    </div>
                    <h5 className="mb-2">File Management</h5>
                    <p className="text-muted mb-0">Browse and manage files</p>
                  </div>
                </div>
              </Link>
            </div>
            
            {/* <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-shield-check me-2"></i>
                    Notifications
                  </h5>
                </div>
                <div className="card-body">
                <div className="col-md-12">
                <div className="stat-card stat-primary h-100">
                  <div className="stat-icon">
                    <i className="bi bi-envelope"></i>
                  </div>
                  <div>
                    <div className="d-flex align-items-baseline">
                      <h3 className="mb-0 me-2">{metrics.unreadMessages}</h3>
                      {metrics.unreadMessages > 0 && (
                        <span className="badge rounded-pill bg-danger">New</span>
                      )}
                    </div>
                    <p className="text-muted mb-0">Unread Messages</p>
                    <Link to="/admin/inbox" className="stretched-link"></Link>
                  </div>
                </div>
              </div>
              
              <div className="col-md-12">
                <div className="stat-card stat-info h-100">
                  <div className="stat-icon">
                    <i className="bi bi-clipboard-check"></i>
                  </div>
                  <div>
                    <h3 className="mb-0">{metrics.pendingApprovals}</h3>
                    <p className="text-muted mb-0">Pending Approvals</p>
                    <Link to="/admin/files" className="stretched-link"></Link>
                  </div>
                </div>
              </div>
              
              <div className="col-md-12">
                <div className="stat-card stat-accent h-100">
                  <div className="stat-icon">
                    <i className="bi bi-calendar-event"></i>
                  </div>
                  <div>
                    <h3 className="mb-0">{metrics.upcomingTasks}</h3>
                    <p className="text-muted mb-0">Upcoming Tasks</p>
                    <Link to="/admin/calendar" className="stretched-link"></Link>
                  </div>
                </div>
              </div>
                </div>
              </div>
            </div> */}
          </div>
          
          {/* Recent activity and system status */}
          {/* <div className="row g-4">
            <div className="col-lg-8">
              <div className="activity-feed h-100">
                <div className="activity-feed-header">
                  <i className="bi bi-activity me-2"></i>
                  Recent Activity
                </div>
                <div className="bg-white">
                  {recentActivities.map(activity => (
                    <div key={activity.id} className="activity-feed-item">
                      <div className={`activity-feed-icon ${activity.iconBg}`}>
                        <i className={`bi bi-${activity.icon} text-white`}></i>
                      </div>
                      <div className="activity-feed-content">
                        <div className="activity-feed-title">{activity.title}</div>
                        <p className="text-muted small mb-1">{activity.description}</p>
                        <div className="activity-feed-time">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-3 text-center">
                    <Link to="/admin/activity" className="btn btn-sm btn-primary px-4">
                      View All Activity
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            


            <div className="col-lg-4">
              <div className="activity-feed h-100">
                <div className="activity-feed-header">
                  <i className="bi bi-calendar3-range me-2"></i>
                  Upcoming Events
                </div>
                <div className="bg-white">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="activity-feed-item">
                      <div className="activity-feed-icon bg-light">
                        <i className={`bi bi-calendar-event text-${getPriorityColor(event.priority)}`}></i>
                      </div>
                      <div className="activity-feed-content">
                        <div className="d-flex justify-content-between">
                          <div className="activity-feed-title">{event.title}</div>
                          <span className={`badge bg-${getPriorityColor(event.priority)}`}>
                            {event.priority}
                          </span>
                        </div>
                        <p className="text-muted small mb-1">{event.description}</p>
                        <div className="activity-feed-time">
                          <i className="bi bi-clock me-1"></i>
                          {event.date}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-3 text-center">
                    <Link to="/admin/calendar" className="btn btn-sm btn-primary px-4">
                      <i className="bi bi-calendar3 me-1"></i>
                      View Calendar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
        </>
      )}
    </div>
  );
};

export default AdminHome;