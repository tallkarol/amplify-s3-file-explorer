// src/pages/admin/AdminCalendar.tsx
import { useState } from 'react';
import Card from '../../components/common/Card';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'deadline' | 'task' | 'reminder';
  client?: string;
  description?: string;
}

const AdminCalendar = () => {
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'list'>('month');
  
  // Sample events
  const events: Event[] = [
    {
      id: '1',
      title: 'Quarterly Review with Acme Corp',
      date: '2025-03-01',
      time: '10:00 AM - 11:30 AM',
      type: 'meeting',
      client: 'Acme Corporation',
      description: 'Review Q1 performance and discuss upcoming audit requirements'
    },
    {
      id: '2',
      title: 'Document Submission Deadline',
      date: '2025-03-03',
      time: '11:59 PM',
      type: 'deadline',
      client: 'Tech Innovations Inc.',
      description: 'Last day for client to submit annual certification documents'
    },
    {
      id: '3',
      title: 'Team Meeting - Workflow Updates',
      date: '2025-03-05',
      time: '2:00 PM - 3:00 PM',
      type: 'meeting',
      description: 'Discuss changes to the document approval workflow'
    }
  ];
  
  // Get event type badge color
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'primary';
      case 'deadline': return 'danger';
      case 'task': return 'warning';
      case 'reminder': return 'info';
      default: return 'secondary';
    }
  };
  
  // Generate calendar grid (simplified placeholder)
  const generateCalendarGrid = () => {
    return (
      <div className="calendar-grid">
        <div className="row text-center fw-bold bg-light py-2 mb-2">
          <div className="col">Sun</div>
          <div className="col">Mon</div>
          <div className="col">Tue</div>
          <div className="col">Wed</div>
          <div className="col">Thu</div>
          <div className="col">Fri</div>
          <div className="col">Sat</div>
        </div>
        {[...Array(5)].map((_, weekIndex) => (
          <div key={`week-${weekIndex}`} className="row" style={{ minHeight: '100px' }}>
            {[...Array(7)].map((_, dayIndex) => {
              const day = weekIndex * 7 + dayIndex - 4; // Offset to start March 1 on a Saturday
              const isCurrentMonth = day > 0 && day <= 31;
              const date = `2025-03-${isCurrentMonth ? String(day).padStart(2, '0') : '01'}`;
              const dayEvents = events.filter(event => 
                isCurrentMonth && event.date === date
              );
              
              return (
                <div 
                  key={`day-${weekIndex}-${dayIndex}`} 
                  className={`col position-relative border ${isCurrentMonth ? 'bg-white' : 'bg-light text-muted'} p-1`}
                  style={{ height: '120px' }}
                >
                  <div className="d-flex justify-content-between">
                    <span className={day === 1 ? 'fw-bold text-primary' : ''}>
                      {isCurrentMonth ? day : (day <= 0 ? 31 + day : day - 31)}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="badge bg-primary rounded-pill">{dayEvents.length}</span>
                    )}
                  </div>
                  <div className="event-container small overflow-hidden" style={{ maxHeight: '90px' }}>
                    {dayEvents.slice(0, 2).map((event) => (
                      <div 
                        key={`event-${event.id}`}
                        className={`bg-${getEventTypeColor(event.type)} bg-opacity-10 text-${getEventTypeColor(event.type)} p-1 rounded mb-1 text-truncate`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-muted small text-center">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };
  
  // Generate list view of events
  const generateListView = () => {
    return (
      <div className="list-group">
        {events.map(event => (
          <div key={event.id} className="list-group-item list-group-item-action">
            <div className="d-flex w-100 justify-content-between">
              <h5 className="mb-1">{event.title}</h5>
              <span className={`badge bg-${getEventTypeColor(event.type)}`}>
                {event.type}
              </span>
            </div>
            <p className="mb-1">{event.date} | {event.time}</p>
            {event.client && <p className="mb-1"><strong>Client:</strong> {event.client}</p>}
            {event.description && <p className="mb-0 small text-muted">{event.description}</p>}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Calendar</h2>
        <div>
          <button className="btn btn-outline-primary">
            <i className="bi bi-plus-circle me-1"></i>
            Add Event
          </button>
        </div>
      </div>
      
      <Card>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="btn-group">
            <button className="btn btn-outline-secondary">
              <i className="bi bi-chevron-left"></i>
            </button>
            <button className="btn btn-outline-secondary px-4 fw-bold">
              March 2025
            </button>
            <button className="btn btn-outline-secondary">
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
          
          <div className="btn-group">
            <button 
              className={`btn btn-${currentView === 'month' ? 'primary' : 'outline-primary'}`}
              onClick={() => setCurrentView('month')}
            >
              Month
            </button>
            <button 
              className={`btn btn-${currentView === 'week' ? 'primary' : 'outline-primary'}`}
              onClick={() => setCurrentView('week')}
            >
              Week
            </button>
            <button 
              className={`btn btn-${currentView === 'day' ? 'primary' : 'outline-primary'}`}
              onClick={() => setCurrentView('day')}
            >
              Day
            </button>
            <button 
              className={`btn btn-${currentView === 'list' ? 'primary' : 'outline-primary'}`}
              onClick={() => setCurrentView('list')}
            >
              List
            </button>
          </div>
          
          <button className="btn btn-outline-secondary">
            <i className="bi bi-calendar-check me-1"></i>
            Today
          </button>
        </div>
        
        {/* Calendar views */}
        {currentView === 'month' && generateCalendarGrid()}
        {currentView === 'list' && generateListView()}
        {(currentView === 'week' || currentView === 'day') && (
          <div className="text-center py-5">
            <i className="bi bi-calendar-week fs-1 text-muted mb-3"></i>
            <h5>{currentView === 'week' ? 'Week' : 'Day'} View</h5>
            <p className="text-muted">This view is coming soon!</p>
          </div>
        )}
      </Card>
      
      <div className="row mt-4">
        <div className="col-md-6">
          <Card title="Upcoming Events">
            <div className="list-group list-group-flush">
              {events
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 3)
                .map(event => (
                  <div key={event.id} className="list-group-item border-0 px-0">
                    <div className="d-flex">
                      <div className={`bg-${getEventTypeColor(event.type)} bg-opacity-10 p-2 rounded me-3`}>
                        <i className={`bi bi-${
                          event.type === 'meeting' ? 'people' :
                          event.type === 'deadline' ? 'calendar-x' :
                          event.type === 'task' ? 'check2-square' : 'bell'
                        } text-${getEventTypeColor(event.type)}`}></i>
                      </div>
                      <div>
                        <h6 className="mb-0">{event.title}</h6>
                        <div className="small text-muted">{event.date} | {event.time}</div>
                        {event.client && <div className="small">{event.client}</div>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
        
        <div className="col-md-6">
          <Card title="Event Types">
            <div className="list-group list-group-flush">
              <div className="list-group-item border-0 px-0 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                    <i className="bi bi-people text-primary"></i>
                  </div>
                  <div>Meetings</div>
                </div>
                <span className="badge bg-primary rounded-pill">
                  {events.filter(e => e.type === 'meeting').length}
                </span>
              </div>
              <div className="list-group-item border-0 px-0 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="bg-danger bg-opacity-10 p-2 rounded me-3">
                    <i className="bi bi-calendar-x text-danger"></i>
                  </div>
                  <div>Deadlines</div>
                </div>
                <span className="badge bg-danger rounded-pill">
                  {events.filter(e => e.type === 'deadline').length}
                </span>
              </div>
              <div className="list-group-item border-0 px-0 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
                    <i className="bi bi-check2-square text-warning"></i>
                  </div>
                  <div>Tasks</div>
                </div>
                <span className="badge bg-warning rounded-pill">
                  {events.filter(e => e.type === 'task').length}
                </span>
              </div>
              <div className="list-group-item border-0 px-0 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="bg-info bg-opacity-10 p-2 rounded me-3">
                    <i className="bi bi-bell text-info"></i>
                  </div>
                  <div>Reminders</div>
                </div>
                <span className="badge bg-info rounded-pill">
                  {events.filter(e => e.type === 'reminder').length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;