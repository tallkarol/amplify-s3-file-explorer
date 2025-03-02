
// src/components/admin/dashboard/ActivityFeed.tsx
import React from 'react';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconBackground: string;
  timestamp: string;
}

interface ActivityFeedProps {
  title: string;
  activities: ActivityItem[];
  emptyMessage?: string;
  viewAllLink?: string;
  viewAllLabel?: string;
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  title,
  activities,
  emptyMessage = "No recent activity",
  viewAllLink,
  viewAllLabel = "View All",
  maxItems = 5
}) => {
  const displayedActivities = activities.slice(0, maxItems);
  
  return (
    <div className="activity-feed h-100">
      <div className="activity-feed-header">
        <i className="bi bi-activity me-2"></i>
        {title}
      </div>
      <div className="bg-white">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-4">
            <i className="bi bi-calendar2-x fs-1 text-muted mb-3 d-block"></i>
            <p className="text-muted">{emptyMessage}</p>
          </div>
        ) : (
          <>
            {displayedActivities.map(activity => (
              <div key={activity.id} className="activity-feed-item">
                <div className={`activity-feed-icon ${activity.iconBackground}`}>
                  <i className={`bi bi-${activity.icon} text-white`}></i>
                </div>
                <div className="activity-feed-content">
                  <div className="activity-feed-title">{activity.title}</div>
                  <p className="text-muted small mb-1">{activity.description}</p>
                  <div className="activity-feed-time">{activity.timestamp}</div>
                </div>
              </div>
            ))}
            
            {viewAllLink && (
              <div className="p-3 text-center">
                <a href={viewAllLink} className="btn btn-sm btn-primary px-4">
                  {viewAllLabel}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;

