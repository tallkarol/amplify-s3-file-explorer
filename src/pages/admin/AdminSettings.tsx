// src/pages/admin/AdminSettings.tsx
import { useState } from 'react';
import Card from '../../components/common/Card';

type SettingsTab = 'general' | 'security' | 'users' | 'storage' | 'notifications';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  
  // Sample states for form controls (simplified)
  const [companyName, setCompanyName] = useState('Secure File Exchange Admin');
  const [adminEmail, setAdminEmail] = useState('admin@example.com');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [timezone, setTimezone] = useState('America/New_York');
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Admin Settings</h2>
        <button className="btn btn-primary">
          <i className="bi bi-save me-2"></i>
          Save Changes
        </button>
      </div>
      
      <div className="row">
        <div className="col-md-3 mb-4">
          {/* Settings navigation */}
          <Card className="settings-sidebar">
            <div className="list-group list-group-flush">
              <button 
                className={`list-group-item list-group-item-action ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                <i className="bi bi-gear me-2"></i>
                General Settings
              </button>
              <button 
                className={`list-group-item list-group-item-action ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="bi bi-shield-lock me-2"></i>
                Security
              </button>
              <button 
                className={`list-group-item list-group-item-action ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <i className="bi bi-people me-2"></i>
                User Management
              </button>
              <button 
                className={`list-group-item list-group-item-action ${activeTab === 'storage' ? 'active' : ''}`}
                onClick={() => setActiveTab('storage')}
              >
                <i className="bi bi-hdd me-2"></i>
                Storage Settings
              </button>
              <button 
                className={`list-group-item list-group-item-action ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <i className="bi bi-bell me-2"></i>
                Notifications
              </button>
            </div>
          </Card>
          
          {/* Help card */}
          <Card className="bg-light">
            <div className="d-flex">
              <div className="me-3">
                <i className="bi bi-question-circle-fill fs-3 text-primary"></i>
              </div>
              <div>
                <h6>Need Help?</h6>
                <p className="small mb-2">For assistance with system settings, check our documentation or contact support.</p>
                <button className="btn btn-sm btn-outline-primary mt-1">View Documentation</button>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="col-md-9">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <Card title="General Settings">
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="companyName" className="form-label">Company Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <div className="form-text">This name will appear in system emails and reports.</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="adminEmail" className="form-label">Admin Email</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      id="adminEmail"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                    <div className="form-text">All system notifications will be sent to this email.</div>
                  </div>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="defaultLanguage" className="form-label">Default Language</label>
                    <select 
                      className="form-select" 
                      id="defaultLanguage"
                      value={defaultLanguage}
                      onChange={(e) => setDefaultLanguage(e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="timezone" className="form-label">Timezone</label>
                    <select 
                      className="form-select" 
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="card bg-light border-0 p-3">
                <h6 className="mb-2">System Information</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <th scope="row">System Version</th>
                        <td>2.3.5</td>
                      </tr>
                      <tr>
                        <th scope="row">Last Update</th>
                        <td>February 28, 2025</td>
                      </tr>
                      <tr>
                        <th scope="row">Environment</th>
                        <td>Production</td>
                      </tr>
                      <tr>
                        <th scope="row">Storage Provider</th>
                        <td>Amazon S3</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
          
          {/* Security Settings Tab */}
          {activeTab === 'security' && (
            <Card title="Security Settings">
              <div className="alert alert-info">
                <i className="bi bi-shield-check me-2"></i>
                These settings control system-wide security features. Changes affect all users.
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="loginAttempts" className="form-label">Failed Login Attempts</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="loginAttempts"
                      defaultValue="5"
                      min="1"
                      max="10"
                    />
                    <div className="form-text">Number of failed attempts before account lockout.</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="sessionTimeout" className="form-label">Session Timeout (minutes)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="sessionTimeout"
                      defaultValue="30"
                      min="5"
                      max="120"
                    />
                    <div className="form-text">User sessions will expire after this period of inactivity.</div>
                  </div>
                </div>
              </div>
              
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="twoFactorEnabled"
                      defaultChecked={true}
                    />
                    <label className="form-check-label" htmlFor="twoFactorEnabled">
                      Require Two-Factor Authentication
                    </label>
                    <div className="form-text">All users will be required to set up 2FA for their accounts.</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="auditLoggingEnabled"
                      defaultChecked={true}
                    />
                    <label className="form-check-label" htmlFor="auditLoggingEnabled">
                      Enable Audit Logging
                    </label>
                    <div className="form-text">Tracks all user actions for security and compliance.</div>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {/* User Management Tab (Simplified) */}
          {activeTab === 'users' && (
            <Card title="User Management Settings">
              <div className="mb-4">
                <h5>User Roles & Permissions</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Role</th>
                        <th>Access Level</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Administrator</td>
                        <td><span className="badge bg-danger">Full Access</span></td>
                        <td>Complete system access</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary">Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>Developer</td>
                        <td><span className="badge bg-warning">Extended Access</span></td>
                        <td>Technical access to system components</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary">Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td>User</td>
                        <td><span className="badge bg-secondary">Basic Access</span></td>
                        <td>Standard client access to own documents only</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
          
          {/* Storage Settings Tab (Simplified) */}
          {activeTab === 'storage' && (
            <Card title="Storage Settings">
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Changing storage settings may affect system performance.
              </div>
              
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="uploadLimit" className="form-label">Maximum File Upload Size (MB)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="uploadLimit"
                      defaultValue="100"
                      min="1"
                      max="1000"
                    />
                    <div className="form-text">Individual file size limit for all uploads.</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="storageTier" className="form-label">Storage Tier</label>
                    <select 
                      className="form-select" 
                      id="storageTier"
                      defaultValue="enterprise"
                    >
                      <option value="standard">Standard</option>
                      <option value="business">Business</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                    <div className="form-text">Determines storage capabilities and retention policies.</div>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {/* Notifications Tab (Simplified) */}
          {activeTab === 'notifications' && (
            <Card title="Notification Settings">
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="emailNotifications"
                      defaultChecked={true}
                    />
                    <label className="form-check-label" htmlFor="emailNotifications">
                      Enable Email Notifications
                    </label>
                    <div className="form-text">Send notification emails to users and administrators.</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="fileQuotaNotification" className="form-label">Storage Quota Alert (%)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="fileQuotaNotification"
                      defaultValue="80"
                      min="50"
                      max="95"
                    />
                    <div className="form-text">Send alerts when user storage reaches this percentage.</div>
                  </div>
                </div>
              </div>
              
              <h5 className="mb-3">Notification Types</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Email</th>
                      <th>In-App</th>
                      <th>Admin Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>New user registration</td>
                      <td>
                        <div className="form-check form-switch d-flex justify-content-center">
                          <input className="form-check-input" type="checkbox" defaultChecked />
                        </div>
                      </td>
                      <td>
                        <div className="form-check form-switch d-flex justify-content-center">
                          <input className="form-check-input" type="checkbox" defaultChecked />
                        </div>
                      </td>
                      <td>
                        <div className="form-check form-switch d-flex justify-content-center">
                          <input className="form-check-input" type="checkbox" defaultChecked />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>File upload</td>
                      <td>
                        <div className="form-check form-switch d-flex justify-content-center">
                          <input className="form-check-input" type="checkbox" defaultChecked />
                        </div>
                      </td>
                      <td>
                        <div className="form-check form-switch d-flex justify-content-center">
                          <input className="form-check-input" type="checkbox" defaultChecked />
                        </div>
                      </td>
                      <td>
                        <div className="form-check form-switch d-flex justify-content-center">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;