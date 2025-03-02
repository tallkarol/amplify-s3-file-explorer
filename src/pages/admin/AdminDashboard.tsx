// src/pages/admin/AdminHome.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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
  
  // Recent activities data
  const recentActivities = [
    {
      id: 1,
      title: 'New documents uploaded',
      description: '3 certificates uploaded to Acme Corp\'s folder',
      icon: 'file-earmark-arrow-up',
      iconBg: 'bg-primary',
      time: '2 hours ago'
    },
    {
      id: 2,
      title: 'New client registered',
      description: 'John Smith created a new account',
      icon: 'person-plus',
      iconBg: 'bg-success',
      time: '5 hours ago'
    },
    {
      id: 3,
      title: 'Workflow completed',
      description: 'Document approval process completed for Global Partners',
      icon: 'check2-circle',
      iconBg: 'bg-accent',
      time: 'Yesterday'
    },
    {
      id: 4,
      title: 'New support ticket',
      description: 'Tech Solutions Inc. submitted a high priority ticket',
      icon: 'chat-dots',
      iconBg: 'bg-danger',
      time: 'Yesterday'
    },
    {
      id: 5,
      title: 'Storage quota warning',
      description: 'Atlas Enterprise approaching 90% of storage quota',
      icon: 'hdd-stack',
      iconBg: 'bg-warning',
      time: '2 days ago'
    }
  ];
  
  // Upcoming events data
  const upcomingEvents = [
    {
      id: 1,
      title: 'Client Review Meeting',
      description: 'Quarterly review with Acme Corporation',
      date: 'Today, 2:00 PM',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Document Submission Deadline',
      description: 'Tech Innovations compliance documents due',
      date: 'Tomorrow, 11:59 PM',
      priority: 'urgent'
    },
    {
      id: 3,
      title: 'System Maintenance',
      description: 'Scheduled downtime for updates',
      date: 'March 5, 2025',
      priority: 'medium'
    }
  ];
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };
  
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
        <div>
          <button className="btn btn-accent">
            <i className="bi bi-download me-2"></i>
            Export Dashboard
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-5">
          <LoadingSpinner text="Loading dashboard metrics..." />
        </div>
      ) : (
        <>
          
          {/* Quick action row */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Quick Actions</h5>
                  <span className="badge bg-primary">Management Tools</span>
                </div>
                <div className="card-body p-0">
                  <div className="row g-0">
                    <div className="col-md-4 p-3 border-end">
                      <Link to="/admin/clients" className="d-block text-decoration-none">
                        <div className="text-center py-4 px-2 rounded hover-transform">
                          <div className="overview-card-icon mx-auto bg-light">
                            <i className="bi bi-people text-primary"></i>
                          </div>
                          <h5 className="mt-3 mb-1">Client Management</h5>
                          <p className="text-muted small mb-0">Manage clients and accounts</p>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="col-md-4 p-3 border-end">
                      <Link to="/admin/files" className="d-block text-decoration-none">
                        <div className="text-center py-4 px-2 rounded hover-transform">
                          <div className="overview-card-icon mx-auto bg-light">
                            <i className="bi bi-folder text-primary"></i>
                          </div>
                          <h5 className="mt-3 mb-1">File Manager</h5>
                          <p className="text-muted small mb-0">Browse and manage files</p>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="col-md-4 p-3">
                      <Link to="/admin/workflows" className="d-block text-decoration-none">
                        <div className="text-center py-4 px-2 rounded hover-transform">
                          <div className="overview-card-icon mx-auto bg-light">
                            <i className="bi bi-diagram-3 text-primary"></i>
                          </div>
                          <h5 className="mt-3 mb-1">Workflows</h5>
                          <p className="text-muted small mb-0">Automate business processes</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4">
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
            </div>
          </div>
          
          {/* Recent activity and system status */}
          <div className="row g-4">
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
          </div>
        </>
      )}
    </div>
  );
};

export default AdminHome;