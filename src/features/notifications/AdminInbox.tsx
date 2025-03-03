// src/pages/admin/AdminInbox.tsx
import { useState } from 'react';
import Card from '../../components/common/Card';

type MessageType = 'notification' | 'support' | 'system';
type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';

interface Message {
  id: string;
  type: MessageType;
  subject: string;
  sender: string;
  content: string;
  date: string;
  read: boolean;
  priority: MessagePriority;
}

const AdminInbox = () => {
  const [activeTab, setActiveTab] = useState<MessageType>('notification');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  // Sample data
  const messages: Message[] = [
    {
      id: '1',
      type: 'notification',
      subject: 'New document uploaded by client',
      sender: 'System Notification',
      content: 'Acme Corporation has uploaded a new certificate to their folder. The document is pending review.',
      date: '2 hours ago',
      read: false,
      priority: 'medium'
    },
    {
      id: '2',
      type: 'support',
      subject: 'Unable to access audit reports',
      sender: 'John Smith (john@techcorp.com)',
      content: 'I\'m trying to view my audit reports folder but keep getting an error message. Could you please help me resolve this issue? I need to access these documents for a meeting tomorrow.',
      date: '5 hours ago',
      read: false,
      priority: 'high'
    },
    {
      id: '3',
      type: 'system',
      subject: 'Storage quota warning',
      sender: 'Storage Monitor',
      content: 'Storage usage for client "Global Solutions" has reached 85% of their allocated quota. Consider upgrading their plan or alerting them to clean up unnecessary files.',
      date: 'Yesterday',
      read: true,
      priority: 'medium'
    },
    {
      id: '4',
      type: 'notification',
      subject: 'Workflow completed: Document Approval',
      sender: 'Workflow Engine',
      content: 'The "Document Approval" workflow for Tech Innovations Inc. has been completed successfully. All documents have been processed and approved.',
      date: '2 days ago',
      read: true, 
      priority: 'low'
    }
  ];
  
  // Filter messages based on active tab
  const filteredMessages = messages.filter(message => message.type === activeTab);
  
  // Count unread messages by type
  const unreadCounts = {
    notification: messages.filter(m => m.type === 'notification' && !m.read).length,
    support: messages.filter(m => m.type === 'support' && !m.read).length,
    system: messages.filter(m => m.type === 'system' && !m.read).length
  };
  
  // Get priority badge color
  const getPriorityColor = (priority: MessagePriority) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'secondary';
    }
  };
  
  // Handle message selection
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
  };
  
  // Handle message mark as read
  const handleMarkAsRead = (id: string) => {
    // In a real implementation, this would call an API to update the message
    console.log(`Marking message ${id} as read`);
  };
  
  // Handle message delete
  const handleDeleteMessage = (id: string) => {
    // In a real implementation, this would call an API to delete the message
    console.log(`Deleting message ${id}`);
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }
  };
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Inbox</h2>
        <button className="btn btn-outline-primary">
          <i className="bi bi-envelope-check me-1"></i>
          Mark All as Read
        </button>
      </div>
      
      <div className="row">
        <div className="col-md-4">
          {/* Inbox navigation */}
          <Card className="mb-4">
            <ul className="nav nav-pills nav-fill mb-3">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'notification' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notification')}
                >
                  <div className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-bell me-1"></i>
                    Notifications
                    {unreadCounts.notification > 0 && (
                      <span className="ms-1 badge bg-danger rounded-pill">{unreadCounts.notification}</span>
                    )}
                  </div>
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'support' ? 'active' : ''}`}
                  onClick={() => setActiveTab('support')}
                >
                  <div className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-headset me-1"></i>
                    Support
                    {unreadCounts.support > 0 && (
                      <span className="ms-1 badge bg-danger rounded-pill">{unreadCounts.support}</span>
                    )}
                  </div>
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'system' ? 'active' : ''}`}
                  onClick={() => setActiveTab('system')}
                >
                  <div className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-gear me-1"></i>
                    System
                    {unreadCounts.system > 0 && (
                      <span className="ms-1 badge bg-danger rounded-pill">{unreadCounts.system}</span>
                    )}
                  </div>
                </button>
              </li>
            </ul>
            
            {/* Message list */}
            <div className="list-group">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-inbox fs-1 text-muted"></i>
                  <p className="mt-2 mb-0 text-muted">No messages found</p>
                </div>
              ) : (
                filteredMessages.map(message => (
                  <button
                    key={message.id}
                    className={`list-group-item list-group-item-action ${!message.read ? 'fw-bold bg-light' : ''} ${selectedMessage?.id === message.id ? 'active' : ''}`}
                    onClick={() => handleSelectMessage(message)}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">
                        {message.subject}
                      </h6>
                      <small>{message.date}</small>
                    </div>
                    <p className="mb-1 text-truncate small">{message.content}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">{message.sender}</small>
                      <span className={`badge bg-${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
        
        <div className="col-md-8">
          {/* Message detail view */}
          {selectedMessage ? (
            <Card>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">{selectedMessage.subject}</h5>
                <div>
                  {!selectedMessage.read && (
                    <button 
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleMarkAsRead(selectedMessage.id)}
                    >
                      <i className="bi bi-envelope-open me-1"></i>
                      Mark as Read
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="mb-3 pb-3 border-bottom">
                <div className="d-flex justify-content-between">
                  <div>
                    <strong>From:</strong> {selectedMessage.sender}
                  </div>
                  <div>
                    <strong>Received:</strong> {selectedMessage.date}
                  </div>
                </div>
                <div>
                  <strong>Priority:</strong>
                  <span className={`ms-2 badge bg-${getPriorityColor(selectedMessage.priority)}`}>
                    {selectedMessage.priority}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <p style={{ whiteSpace: 'pre-line' }}>{selectedMessage.content}</p>
              </div>
              
              {selectedMessage.type === 'support' && (
                <div className="mt-3 pt-3 border-top">
                  <h6>Reply</h6>
                  <div className="mb-3">
                    <textarea 
                      className="form-control" 
                      rows={4} 
                      placeholder="Enter your response here..."
                    ></textarea>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button className="btn btn-primary">
                      <i className="bi bi-reply me-1"></i>
                      Send Response
                    </button>
                  </div>
                </div>
              )}
              
              {selectedMessage.type === 'notification' && (
                <div className="d-flex justify-content-end mt-3 pt-3 border-top">
                  <button className="btn btn-primary">
                    <i className="bi bi-arrow-right me-1"></i>
                    View Details
                  </button>
                </div>
              )}
              
              {selectedMessage.type === 'system' && (
                <div className="alert alert-info mt-3">
                  <i className="bi bi-info-circle me-2"></i>
                  This is a system message that may require your attention.
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <div className="text-center py-5">
                <i className="bi bi-envelope-paper fs-1 text-muted mb-3"></i>
                <h5>No Message Selected</h5>
                <p className="text-muted">Select a message from the list to view its details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInbox;