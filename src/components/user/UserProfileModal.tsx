// src/components/user/UserProfileModal.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { UserProfile, AdditionalContact, GetUserProfileWithContactsResponse } from '../../types';
import AlertMessage from '../common/AlertMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  getUserProfileWithContacts,
  updateUserProfileMutation,
  createAdditionalContactMutation,
  updateAdditionalContactMutation,
  deleteAdditionalContactMutation
} from '../../graphql/notifications';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user } = useAuthenticator();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [additionalContacts, setAdditionalContacts] = useState<AdditionalContact[]>([]);
  
  // Profile form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<'email' | 'phone'>('email');
  
  // New contact form fields
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactReceiveNotifications, setNewContactReceiveNotifications] = useState(true);
  const [showAddContactForm, setShowAddContactForm] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [savingContact, setSavingContact] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  
  // Create a client for making GraphQL requests
  const client = generateClient();

  // Fetch user profile and contacts on modal open
  useEffect(() => {
    if (isOpen) {
      fetchUserProfileWithContacts();
    }
  }, [isOpen]);

  // Fetch user profile and additional contacts from API
  const fetchUserProfileWithContacts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const profileOwner = `${user.userId}::${user.username}`;
      
      const response = await client.graphql<GraphQLQuery<GetUserProfileWithContactsResponse>>({
        query: getUserProfileWithContacts,
        variables: {
          profileOwner
        },
        authMode: 'userPool'
      });
      
      const profileItems = response?.data?.listUserProfiles?.items || [];
      
      if (profileItems.length > 0) {
        const userProfile = profileItems[0];
        setProfile(userProfile);
        setFirstName(userProfile.firstName || '');
        setLastName(userProfile.lastName || '');
        setCompanyName(userProfile.companyName || '');
        setPhoneNumber(userProfile.phoneNumber || '');
        setPreferredContactMethod(userProfile.preferredContactMethod || 'email');
        
        // Set additional contacts
        const contactItems = response?.data?.listAdditionalContacts?.items || [];
        setAdditionalContacts(contactItems);
      } else {
        setError('Profile not found. Please contact support.');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(`Failed to load profile: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Save user profile changes
  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await client.graphql<GraphQLQuery<any>>({
        query: updateUserProfileMutation,
        variables: {
          input: {
            id: profile.id,
            firstName,
            lastName,
            companyName,
            phoneNumber,
            preferredContactMethod
          }
        },
        authMode: 'userPool'
      });
      
      setSuccess('Profile updated successfully!');
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(`Failed to update profile: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Add a new additional contact
  const handleAddContact = async () => {
    if (!profile || !newContactName || !newContactEmail) return;
    
    setSavingContact(true);
    setError(null);
    
    try {
      const response = await client.graphql<GraphQLQuery<any>>({
        query: createAdditionalContactMutation,
        variables: {
          input: {
            name: newContactName,
            email: newContactEmail,
            receiveNotifications: newContactReceiveNotifications,
            profileOwner: profile.profileOwner
          }
        },
        authMode: 'userPool'
      });
      
      const newContact = response.data?.createAdditionalContact;
      if (newContact) {
        setAdditionalContacts([...additionalContacts, newContact]);
        
        // Reset form
        setNewContactName('');
        setNewContactEmail('');
        setNewContactReceiveNotifications(true);
        setShowAddContactForm(false);
      }
    } catch (err) {
      console.error('Error adding contact:', err);
      setError(`Failed to add contact: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingContact(false);
    }
  };

  // Toggle notification preference for a contact
  const handleToggleNotifications = async (contact: AdditionalContact) => {
    try {
      const response = await client.graphql<GraphQLQuery<any>>({
        query: updateAdditionalContactMutation,
        variables: {
          input: {
            id: contact.id,
            receiveNotifications: !contact.receiveNotifications
          }
        },
        authMode: 'userPool'
      });
      
      const updatedContact = response.data?.updateAdditionalContact;
      if (updatedContact) {
        setAdditionalContacts(additionalContacts.map(c => 
          c.id === updatedContact.id ? updatedContact : c
        ));
      }
    } catch (err) {
      console.error('Error updating contact:', err);
      setError(`Failed to update contact: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Delete a contact
  const handleDeleteContact = async (contactId: string) => {
    setDeletingContactId(contactId);
    
    try {
      await client.graphql<GraphQLQuery<any>>({
        query: deleteAdditionalContactMutation,
        variables: {
          input: {
            id: contactId
          }
        },
        authMode: 'userPool'
      });
      
      setAdditionalContacts(additionalContacts.filter(c => c.id !== contactId));
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(`Failed to delete contact: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDeletingContactId(null);
    }
  };
  
  // Reset new contact form
  const resetContactForm = () => {
    setNewContactName('');
    setNewContactEmail('');
    setNewContactReceiveNotifications(true);
    setShowAddContactForm(false);
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
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
            
              {/* Modern styled header */}
              <div className="modal-header border-0 pb-0">
                <div className="w-100 text-center position-relative">
                  <div className="position-absolute top-0 start-0">
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={onClose}
                      aria-label="Close"
                    ></button>
                  </div>
                  
                  <div className="mt-3 mb-2">
                    <div className="bg-primary bg-opacity-10 d-inline-flex p-4 rounded-circle mb-2">
                      <i className="bi bi-person-circle text-primary" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h4 className="mb-0 fw-bold">Edit Profile</h4>
                    <p className="text-muted">{profile?.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Tab navigation */}
              <div className="px-4">
                <ul className="nav nav-tabs nav-fill border-0">
                  <li className="nav-item">
                    <button 
                      className={`nav-link border-0 ${activeTab === 'profile' ? 'active text-primary' : 'text-muted'}`}
                      onClick={() => setActiveTab('profile')}
                    >
                      <i className="bi bi-person me-2"></i>
                      Profile
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link border-0 ${activeTab === 'contacts' ? 'active text-primary' : 'text-muted'}`}
                      onClick={() => setActiveTab('contacts')}
                    >
                      <i className="bi bi-people me-2"></i>
                      Additional Contacts
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link border-0 ${activeTab === 'notifications' ? 'active text-primary' : 'text-muted'}`}
                      onClick={() => setActiveTab('notifications')}
                    >
                      <i className="bi bi-bell me-2"></i>
                      Notifications
                    </button>
                  </li>
                </ul>
              </div>
              
              <div className="modal-body px-4 pt-4">
                {error && <AlertMessage type="danger" message={error} dismissible onDismiss={() => setError(null)} />}
                {success && <AlertMessage type="success" message={success} />}
                
                {loading ? (
                  <div className="text-center p-5">
                    <LoadingSpinner text="Loading profile..." />
                  </div>
                ) : (
                  /* Profile Tab Content */
                  activeTab === 'profile' ? (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-floating">
                          <input 
                            type="text"
                            id="firstName"
                            className="form-control" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Enter your first name"
                          />
                          <label htmlFor="firstName">First Name</label>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-floating">
                          <input 
                            type="text"
                            id="lastName" 
                            className="form-control" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Enter your last name"
                          />
                          <label htmlFor="lastName">Last Name</label>
                        </div>
                      </div>
                      
                      <div className="col-12">
                        <div className="form-floating">
                          <input 
                            type="text"
                            id="companyName" 
                            className="form-control" 
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Enter your company name"
                          />
                          <label htmlFor="companyName">Company Name</label>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-floating">
                          <input 
                            type="tel"
                            id="phoneNumber" 
                            className="form-control" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Enter your phone number"
                          />
                          <label htmlFor="phoneNumber">Phone Number</label>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-floating">
                          <select 
                            id="preferredContactMethod" 
                            className="form-select"
                            value={preferredContactMethod}
                            onChange={(e) => setPreferredContactMethod(e.target.value as 'email' | 'phone')}
                          >
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                          </select>
                          <label htmlFor="preferredContactMethod">Preferred Contact Method</label>
                        </div>
                      </div>
                    </div>
                  ) : 
                  
                  /* Additional Contacts Tab Content */
                  activeTab === 'contacts' ? (
                    <div>
                      {/* Contacts List */}
                      {additionalContacts.length > 0 ? (
                        <div className="mb-4">
                          <div className="list-group">
                            {additionalContacts.map(contact => (
                              <div key={contact.id} className="list-group-item border-0 bg-light rounded mb-2 p-3">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <h6 className="mb-0">{contact.name}</h6>
                                    <p className="text-muted mb-0 small">{contact.email}</p>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <div className="form-check form-switch me-3">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`notification-toggle-${contact.id}`}
                                        checked={contact.receiveNotifications}
                                        onChange={() => handleToggleNotifications(contact)}
                                      />
                                      <label className="form-check-label small" htmlFor={`notification-toggle-${contact.id}`}>
                                        Notifications
                                      </label>
                                    </div>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteContact(contact.id)}
                                      disabled={deletingContactId === contact.id}
                                    >
                                      {deletingContactId === contact.id ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                      ) : (
                                        <i className="bi bi-trash"></i>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="alert alert-light text-center mb-4">
                          <i className="bi bi-people fs-4 d-block mb-2 text-muted"></i>
                          <p className="mb-0">No additional contacts added yet.</p>
                        </div>
                      )}
                      
                      {/* Add New Contact Form */}
                      {showAddContactForm ? (
                        <div className="card border-0 shadow-sm mb-3">
                          <div className="card-body p-3">
                            <h6 className="card-title">Add New Contact</h6>
                            <div className="row g-2 mb-3">
                              <div className="col-md-5">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Name"
                                  value={newContactName}
                                  onChange={(e) => setNewContactName(e.target.value)}
                                />
                              </div>
                              <div className="col-md-5">
                                <input
                                  type="email"
                                  className="form-control"
                                  placeholder="Email"
                                  value={newContactEmail}
                                  onChange={(e) => setNewContactEmail(e.target.value)}
                                />
                              </div>
                              <div className="col-md-2">
                                <div className="form-check form-switch pt-2">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="newContactNotifications"
                                    checked={newContactReceiveNotifications}
                                    onChange={(e) => setNewContactReceiveNotifications(e.target.checked)}
                                  />
                                  <label className="form-check-label small" htmlFor="newContactNotifications">
                                    Notify
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="d-flex justify-content-end">
                              <button
                                className="btn btn-outline-secondary btn-sm me-2"
                                onClick={resetContactForm}
                                disabled={savingContact}
                              >
                                Cancel
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={handleAddContact}
                                disabled={!newContactName || !newContactEmail || savingContact}
                              >
                                {savingContact ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                  </>
                                ) : 'Add Contact'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary w-100"
                          onClick={() => setShowAddContactForm(true)}
                        >
                          <i className="bi bi-plus-circle me-2"></i>
                          Add New Contact
                        </button>
                      )}
                      
                      <div className="alert alert-info mt-4 mb-0">
                        <div className="d-flex">
                          <div className="me-3">
                            <i className="bi bi-info-circle-fill fs-5"></i>
                          </div>
                          <div>
                            <strong>Additional Contacts</strong> are people who may be included in notifications about your account. Toggle their notification status to control whether they receive emails.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : 
                  
                  /* Notifications Tab - Placeholder for future implementation */
                  activeTab === 'notifications' ? (
                    <div>
                      <div className="alert alert-light border text-center py-5">
                        <i className="bi bi-bell fs-1 d-block mb-3 text-muted"></i>
                        <h5>Notification Settings Coming Soon</h5>
                        <p className="text-muted mb-0">This feature will allow you to manage your notification preferences.</p>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
              
              <div className="modal-footer border-0 pt-2">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                
                {activeTab === 'profile' && (
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfileModal;