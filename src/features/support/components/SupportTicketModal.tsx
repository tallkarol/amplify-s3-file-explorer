// src/components/support/SupportTicketModal.tsx
import { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { createSupportTicket } from '../services/SupportTicketService';
import AlertMessage from '../../../components/common/AlertMessage';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupportTicketModal = ({ isOpen, onClose }: SupportTicketModalProps) => {
  const { user } = useAuthenticator();
  
  // Form fields
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Technical Support');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Get system info for metadata
  const getBrowserInfo = () => {
    return {
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      platform: navigator.platform,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  };
  
  // Submit the support ticket
  const handleSubmit = async () => {
    if (!subject || !message) {
      setError('Please provide both a subject and message.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Get user's display name
      // Fix: Remove attributes access and use username directly
      const userDisplayName = user.username;
      
      // Create the support ticket
      await createSupportTicket({
        userId: user.userId,
        userName: userDisplayName,
        subject,
        message,
        category,
        priority,
        // Fix: Use object directly instead of stringifying
        metadata: {
          browserInfo: getBrowserInfo(),
          submitTime: new Date().toISOString()
        }
      });
      
      // Show success message
      setSuccess('Your support ticket has been submitted successfully! Our team will respond as soon as possible.');
      
      // Reset form after a delay
      setTimeout(() => {
        resetForm();
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error submitting support ticket:', err);
      setError(`Failed to submit support ticket: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Reset form fields
  const resetForm = () => {
    setSubject('');
    setMessage('');
    setCategory('Technical Support');
    setPriority('medium');
    setError(null);
    setSuccess(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Modal overlay */}
      <div className="modal-backdrop" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1040,
        display: 'block',
        backdropFilter: 'blur(3px)',
        transition: 'opacity 0.15s linear'
      }}>
      
        {/* Modal */}
        <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
            
              {/* Header */}
              <div className="modal-header bg-light">
                <div className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                    <i className="bi bi-headset text-primary fs-4"></i>
                  </div>
                  <h5 className="modal-title">Contact Support</h5>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={onClose}
                  disabled={loading}
                  aria-label="Close"
                ></button>
              </div>
              
              {/* Body */}
              <div className="modal-body p-4">
                {error && <AlertMessage type="danger" message={error} dismissible onDismiss={() => setError(null)} />}
                {success && <AlertMessage type="success" message={success} />}
                
                {loading ? (
                  <div className="text-center py-4">
                    <LoadingSpinner text="Submitting your request..." />
                  </div>
                ) : (
                  <form>
                    <div className="mb-3">
                      <label htmlFor="subject" className="form-label">Subject</label>
                      <input 
                        type="text"
                        id="subject"
                        className="form-control" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Briefly describe your issue"
                        required
                      />
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="category" className="form-label">Category</label>
                        <select 
                          id="category"
                          className="form-select" 
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="Technical Support">Technical Support</option>
                          <option value="Account Issues">Account Issues</option>
                          <option value="File Access">File Access</option>
                          <option value="Feature Request">Feature Request</option>
                          <option value="Billing">Billing</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div className="col-md-6">
                        <label htmlFor="priority" className="form-label">Priority</label>
                        <select 
                          id="priority"
                          className="form-select" 
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="message" className="form-label">Message</label>
                      <textarea 
                        id="message"
                        className="form-control" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe your issue in detail"
                        rows={5}
                        required
                      ></textarea>
                    </div>
                    
                    <div className="alert alert-info">
                      <div className="d-flex">
                        <div className="me-3">
                          <i className="bi bi-info-circle-fill"></i>
                        </div>
                        <div>
                          <p className="mb-0">Our support team will respond to your ticket as soon as possible. Additional system information will be automatically included to help us diagnose your issue.</p>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
              
              {/* Footer */}
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSubmit}
                  disabled={loading || !subject || !message}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting...
                    </>
                  ) : 'Submit Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportTicketModal;