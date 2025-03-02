// src/pages/admin/AdminSupport.tsx
import { useState } from 'react';
import Card from '../../components/common/Card';

const AdminSupport = () => {
  const [activeTab, setActiveTab] = useState<'documentation' | 'contact' | 'faq'>('documentation');
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Help & Support</h2>
      </div>
      
      <div className="mb-4">
        <ul className="nav nav-pills">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'documentation' ? 'active' : ''}`}
              onClick={() => setActiveTab('documentation')}
            >
              <i className="bi bi-book me-2"></i>
              Documentation
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              <i className="bi bi-headset me-2"></i>
              Contact Support
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              <i className="bi bi-question-circle me-2"></i>
              FAQs
            </button>
          </li>
        </ul>
      </div>
      
      {/* Documentation Tab */}
      {activeTab === 'documentation' && (
        <div className="row">
          <div className="col-md-3 mb-4">
            <Card className="h-100">
              <div className="d-flex flex-column align-items-center text-center p-3">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle mb-3">
                  <i className="bi bi-person-workspace fs-1 text-primary"></i>
                </div>
                <h5>Admin Guide</h5>
                <p className="mb-3 small text-muted">Complete guide for system administrators</p>
                <button className="btn btn-primary w-100">
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  Download PDF
                </button>
              </div>
            </Card>
          </div>
          
          <div className="col-md-3 mb-4">
            <Card className="h-100">
              <div className="d-flex flex-column align-items-center text-center p-3">
                <div className="bg-success bg-opacity-10 p-3 rounded-circle mb-3">
                  <i className="bi bi-journal-code fs-1 text-success"></i>
                </div>
                <h5>API Documentation</h5>
                <p className="mb-3 small text-muted">Integration guides and API references</p>
                <button className="btn btn-success w-100">
                  <i className="bi bi-code-square me-2"></i>
                  View Docs
                </button>
              </div>
            </Card>
          </div>
          
          <div className="col-md-3 mb-4">
            <Card className="h-100">
              <div className="d-flex flex-column align-items-center text-center p-3">
                <div className="bg-info bg-opacity-10 p-3 rounded-circle mb-3">
                  <i className="bi bi-gear fs-1 text-info"></i>
                </div>
                <h5>Technical Guide</h5>
                <p className="mb-3 small text-muted">Setup, configuration, and maintenance</p>
                <button className="btn btn-info w-100 text-white">
                  <i className="bi bi-tools me-2"></i>
                  View Guide
                </button>
              </div>
            </Card>
          </div>
          
          <div className="col-md-3 mb-4">
            <Card className="h-100">
              <div className="d-flex flex-column align-items-center text-center p-3">
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle mb-3">
                  <i className="bi bi-play-btn fs-1 text-warning"></i>
                </div>
                <h5>Video Tutorials</h5>
                <p className="mb-3 small text-muted">Step-by-step video walkthroughs</p>
                <button className="btn btn-warning w-100">
                  <i className="bi bi-collection-play me-2"></i>
                  View Videos
                </button>
              </div>
            </Card>
          </div>
          
          <div className="col-12">
            <Card title="Recent Documentation Updates">
              <div className="list-group list-group-flush">
                <div className="list-group-item border-0 px-0">
                  <div className="d-flex">
                    <div className="bg-light rounded p-2 me-3">
                      <i className="bi bi-journal-plus text-primary"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">New Workflow Management Guide</h6>
                      <p className="text-muted mb-1 small">Complete documentation on the new workflow automation features.</p>
                      <div>
                        <span className="badge bg-primary me-2">Admin</span>
                        <small className="text-muted">Added 3 days ago</small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="list-group-item border-0 px-0">
                  <div className="d-flex">
                    <div className="bg-light rounded p-2 me-3">
                      <i className="bi bi-journal-code text-success"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Updated API Authentication Documentation</h6>
                      <p className="text-muted mb-1 small">Changes to reflect the new OAuth 2.0 implementation.</p>
                      <div>
                        <span className="badge bg-success me-2">Developer</span>
                        <small className="text-muted">Updated 1 week ago</small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="list-group-item border-0 px-0">
                  <div className="d-flex">
                    <div className="bg-light rounded p-2 me-3">
                      <i className="bi bi-play-btn text-warning"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">New Client Onboarding Video Tutorial</h6>
                      <p className="text-muted mb-1 small">Step-by-step guide for onboarding new clients efficiently.</p>
                      <div>
                        <span className="badge bg-warning text-dark me-2">Tutorial</span>
                        <small className="text-muted">Added 2 weeks ago</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      {/* Contact Support Tab */}
      {activeTab === 'contact' && (
        <div className="row">
          <div className="col-md-6">
            <Card title="Contact Support Team">
              <div className="mb-4">
                <p>Fill out the form below to create a support ticket with our technical team.</p>
                
                <div className="mb-3">
                  <label htmlFor="supportSubject" className="form-label">Subject</label>
                  <input type="text" className="form-control" id="supportSubject" />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="supportCategory" className="form-label">Category</label>
                  <select className="form-select" id="supportCategory">
                    <option>Technical Issue</option>
                    <option>Account Management</option>
                    <option>Security Concern</option>
                    <option>Feature Request</option>
                    <option>Billing Question</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="supportPriority" className="form-label">Priority</label>
                  <select className="form-select" id="supportPriority">
                    <option>Low</option>
                    <option>Medium</option>
                    <option selected>High</option>
                    <option>Critical</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="supportMessage" className="form-label">Message</label>
                  <textarea className="form-control" id="supportMessage" rows={5}></textarea>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="supportAttachment" className="form-label">Attachments</label>
                  <input type="file" className="form-control" id="supportAttachment" multiple />
                  <div className="form-text">You can attach screenshots or log files (max 10MB each).</div>
                </div>
                
                <button className="btn btn-primary">
                  <i className="bi bi-send me-2"></i>
                  Submit Ticket
                </button>
              </div>
            </Card>
          </div>
          
          <div className="col-md-6">
            <Card title="Contact Information">
              <div className="list-group list-group-flush mb-4">
                <div className="list-group-item border-0 px-0">
                  <div className="d-flex">
                    <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                      <i className="bi bi-headset text-primary"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Technical Support</h6>
                      <p className="mb-1 small">Available 24/7 for critical issues</p>
                      <p className="mb-0">
                        <a href="mailto:support@example.com" className="text-decoration-none">
                          support@example.com
                        </a>
                      </p>
                      <p className="mb-0">
                        <a href="tel:+18005551234" className="text-decoration-none">
                          1-800-555-1234
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="list-group-item border-0 px-0">
                  <div className="d-flex">
                    <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                      <i className="bi bi-credit-card text-success"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Billing Support</h6>
                      <p className="mb-1 small">Monday-Friday, 9am-6pm ET</p>
                      <p className="mb-0">
                        <a href="mailto:billing@example.com" className="text-decoration-none">
                          billing@example.com
                        </a>
                      </p>
                      <p className="mb-0">
                        <a href="tel:+18005555678" className="text-decoration-none">
                          1-800-555-5678
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="list-group-item border-0 px-0">
                  <div className="d-flex">
                    <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                      <i className="bi bi-people text-info"></i>
                    </div>
                    <div>
                      <h6 className="mb-1">Account Management</h6>
                      <p className="mb-1 small">Monday-Friday, 9am-6pm ET</p>
                      <p className="mb-0">
                        <a href="mailto:accounts@example.com" className="text-decoration-none">
                          accounts@example.com
                        </a>
                      </p>
                      <p className="mb-0">
                        <a href="tel:+18005559012" className="text-decoration-none">
                          1-800-555-9012
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card bg-light border-0">
                <div className="card-body">
                  <h6 className="card-title">Support Hours</h6>
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <td>Technical Support</td>
                        <td>24/7/365</td>
                      </tr>
                      <tr>
                        <td>Billing Support</td>
                        <td>Mon-Fri, 9am-6pm ET</td>
                      </tr>
                      <tr>
                        <td>Account Management</td>
                        <td>Mon-Fri, 9am-6pm ET</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
            
            <Card title="Recent Tickets" className="mt-4">
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <div>
                    <h6 className="mb-1">Login Issues with New User Accounts</h6>
                    <p className="mb-0 small text-muted">Ticket #4593 - Opened 2 days ago</p>
                  </div>
                  <span className="badge bg-warning">In Progress</span>
                </div>
                
                <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <div>
                    <h6 className="mb-1">API Integration Documentation Request</h6>
                    <p className="mb-0 small text-muted">Ticket #4591 - Opened 3 days ago</p>
                  </div>
                  <span className="badge bg-success">Resolved</span>
                </div>
                
                <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <div>
                    <h6 className="mb-1">File Upload Error in Chrome Browser</h6>
                    <p className="mb-0 small text-muted">Ticket #4589 - Opened 4 days ago</p>
                  </div>
                  <span className="badge bg-success">Resolved</span>
                </div>
              </div>
              
              <div className="text-center mt-3">
                <button className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-list-ul me-1"></i>
                  View All Tickets
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <Card title="Frequently Asked Questions">
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 bg-light"
                placeholder="Search FAQs..."
              />
            </div>
          </div>
          
          <div className="accordion" id="faqAccordion">
            {/* User Management FAQs */}
            <div className="mb-4">
              <h5>User Management</h5>
              
              <div className="accordion-item border-0 mb-2">
                <h2 className="accordion-header" id="headingOne">
                  <button 
                    className="accordion-button collapsed bg-light" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#collapseOne" 
                    aria-expanded="false" 
                    aria-controls="collapseOne"
                    onClick={() => document.getElementById('collapseOne')?.classList.toggle('show')}
                  >
                    How do I add a new administrator account?
                  </button>
                </h2>
                <div id="collapseOne" className="accordion-collapse collapse" aria-labelledby="headingOne">
                  <div className="accordion-body">
                    <p>To add a new administrator account:</p>
                    <ol>
                      <li>Go to User Management in the Admin Settings</li>
                      <li>Click "Create New User"</li>
                      <li>Fill in the user details and select "Administrator" from the role dropdown</li>
                      <li>Assign appropriate permissions as needed</li>
                      <li>Click "Create User" to finish</li>
                    </ol>
                    <p>The new admin will receive an email with instructions to set their password.</p>
                  </div>
                </div>
              </div>
              
              <div className="accordion-item border-0 mb-2">
                <h2 className="accordion-header" id="headingTwo">
                  <button 
                    className="accordion-button collapsed bg-light" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#collapseTwo" 
                    aria-expanded="false" 
                    aria-controls="collapseTwo"
                    onClick={() => document.getElementById('collapseTwo')?.classList.toggle('show')}
                  >
                    How do I reset a user's password?
                  </button>
                </h2>
                <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo">
                  <div className="accordion-body">
                    <p>To reset a user's password:</p>
                    <ol>
                      <li>Navigate to the Clients section</li>
                      <li>Find the user in the list and click "View Details"</li>
                      <li>In the user detail view, click "Actions" then "Reset Password"</li>
                      <li>Confirm the action</li>
                    </ol>
                    <p>The user will receive an email with a link to reset their password. The link will expire after 24 hours.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* File Management FAQs */}
            <div className="mb-4">
              <h5>File Management</h5>
              
              <div className="accordion-item border-0 mb-2">
                <h2 className="accordion-header" id="headingThree">
                  <button 
                    className="accordion-button collapsed bg-light" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#collapseThree" 
                    aria-expanded="false" 
                    aria-controls="collapseThree"
                    onClick={() => document.getElementById('collapseThree')?.classList.toggle('show')}
                  >
                    What's the maximum file size for uploads?
                  </button>
                </h2>
                <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree">
                  <div className="accordion-body">
                    <p>The default maximum file size for uploads is 100MB per file. This can be adjusted in the Storage Settings section:</p>
                    <ul>
                      <li>Go to Settings → Storage</li>
                      <li>Adjust the "Maximum File Upload Size" value</li>
                      <li>Save your changes</li>
                    </ul>
                    <p>Note that increasing this limit may affect system performance. For very large files, we recommend using the chunked upload feature or contacting support for assistance.</p>
                  </div>
                </div>
              </div>
              
              <div className="accordion-item border-0 mb-2">
                <h2 className="accordion-header" id="headingFour">
                  <button 
                    className="accordion-button collapsed bg-light" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#collapseFour" 
                    aria-expanded="false" 
                    aria-controls="collapseFour"
                    onClick={() => document.getElementById('collapseFour')?.classList.toggle('show')}
                  >
                    How do I enable file versioning?
                  </button>
                </h2>
                <div id="collapseFour" className="accordion-collapse collapse" aria-labelledby="headingFour">
                  <div className="accordion-body">
                    <p>File versioning is enabled by default for all Enterprise tier accounts. To check or modify your versioning settings:</p>
                    <ol>
                      <li>Go to Settings → Storage</li>
                      <li>Scroll down to the "File Versioning" section</li>
                      <li>Enable or disable versioning as needed</li>
                      <li>Adjust the "Maximum Versions Stored" value if desired</li>
                      <li>Save your changes</li>
                    </ol>
                    <p>Note that enabling versioning will increase storage usage as multiple versions of files are retained.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Security FAQs */}
            <div className="mb-4">
              <h5>Security</h5>
              
              <div className="accordion-item border-0 mb-2">
                <h2 className="accordion-header" id="headingFive">
                  <button 
                    className="accordion-button collapsed bg-light" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#collapseFive" 
                    aria-expanded="false" 
                    aria-controls="collapseFive"
                    onClick={() => document.getElementById('collapseFive')?.classList.toggle('show')}
                  >
                    How do I enable two-factor authentication?
                  </button>
                </h2>
                <div id="collapseFive" className="accordion-collapse collapse" aria-labelledby="headingFive">
                  <div className="accordion-body">
                    <p>To enable two-factor authentication (2FA) for all users:</p>
                    <ol>
                      <li>Go to Settings → Security</li>
                      <li>Find the "Require Two-Factor Authentication" toggle</li>
                      <li>Enable the toggle</li>
                      <li>Save your changes</li>
                    </ol>
                    <p>Users will be prompted to set up 2FA the next time they log in. They can use any authenticator app that supports TOTP (Time-based One-Time Password) such as Google Authenticator, Microsoft Authenticator, or Authy.</p>
                  </div>
                </div>
              </div>
              
              <div className="accordion-item border-0 mb-2">
                <h2 className="accordion-header" id="headingSix">
                  <button 
                    className="accordion-button collapsed bg-light" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#collapseSix" 
                    aria-expanded="false" 
                    aria-controls="collapseSix"
                    onClick={() => document.getElementById('collapseSix')?.classList.toggle('show')}
                  >
                    Where can I find security audit logs?
                  </button>
                </h2>
                <div id="collapseSix" className="accordion-collapse collapse" aria-labelledby="headingSix">
                  <div className="accordion-body">
                    <p>Security audit logs can be accessed from the Security section:</p>
                    <ol>
                      <li>Go to Settings → Security</li>
                      <li>Scroll down to the "Audit Logs" section</li>
                      <li>Use the date filters to select the period you're interested in</li>
                      <li>Click "View Logs" to see the activity</li>
                    </ol>
                    <p>You can export logs to CSV or PDF format for record-keeping. Logs are retained for 90 days by default (this can be extended for Enterprise plans).</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-muted mb-3">Can't find what you're looking for?</p>
              <button className="btn btn-primary">
                <i className="bi bi-question-circle me-2"></i>
                Ask a New Question
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminSupport;