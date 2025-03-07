// src/features/clients/components/UserProfileModal.tsx
import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { UserProfile, AdditionalContact } from '@/types';
import AlertMessage from '@/components/common/AlertMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useUserRole } from '@/hooks/useUserRole';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user } = useAuthenticator();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [additionalContacts, setAdditionalContacts] = useState<AdditionalContact[]>([]);
  const {isDeveloper} = useUserRole();
  
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

  // Debug function to help troubleshoot profile issues
  const debugUserProfile = async () => {
    try {
      console.log('Starting profile debugging...');
      const userId = user.userId;
      const username = user.username;
      
      console.log('User ID:', userId);
      console.log('Username:', username);
      
      // Try different profile query patterns
      const profileOwner = `${userId}::${username}`;
      console.log('Trying profileOwner format:', profileOwner);
      
      // Query 1: By profileOwner
      const queryByOwner = /* GraphQL */ `
        query GetUserProfileByOwner($profileOwner: String!) {
          listUserProfiles(filter: { profileOwner: { eq: $profileOwner } }, limit: 10) {
            items {
              id
              email
              uuid
              profileOwner
            }
          }
        }
      `;
      
      const ownerResponse = await client.graphql<GraphQLQuery<any>>({
        query: queryByOwner,
        variables: { profileOwner },
        authMode: 'userPool'
      });
      
      console.log('Query by owner result:', ownerResponse?.data?.listUserProfiles?.items);
      
      // Query 2: By UUID
      const queryByUuid = /* GraphQL */ `
        query GetUserProfileByUuid($uuid: String!) {
          listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 10) {
            items {
              id
              email
              uuid
              profileOwner
            }
          }
        }
      `;
      
      const uuidResponse = await client.graphql<GraphQLQuery<any>>({
        query: queryByUuid,
        variables: { uuid: userId },
        authMode: 'userPool'
      });
      
      console.log('Query by UUID result:', uuidResponse?.data?.listUserProfiles?.items);
      
      // Query 3: List all profiles (limit 10)
      const listAllQuery = /* GraphQL */ `
        query ListAllProfiles {
          listUserProfiles(limit: 10) {
            items {
              id
              uuid
              profileOwner
              email
            }
          }
        }
      `;
      
      const listResponse = await client.graphql<GraphQLQuery<any>>({
        query: listAllQuery,
        authMode: 'userPool'
      });
      
      console.log('List all profiles result (limit 10):', listResponse?.data?.listUserProfiles?.items);
      
    } catch (err) {
      console.error('Debug error:', err);
    }
  };


  
// Fetch user profile and additional contacts from API
const fetchUserProfileWithContacts = async () => {
  setLoading(true);
  setError(null);
  
  try {
    // Use userId directly
    const userId = user.userId;
    
    const queryByUuid = /* GraphQL */ `
      query GetUserProfileByUuid($uuid: String!) {
        listUserProfiles(filter: { uuid: { eq: $uuid } }, limit: 10) {
          items {
            id
            email
            uuid
            profileOwner
            firstName
            lastName
            companyName
            phoneNumber
            preferredContactMethod
          }
        }
      }
    `;
    
    const response = await client.graphql<GraphQLQuery<any>>({
      query: queryByUuid,
      variables: { uuid: userId },
      authMode: 'userPool'
    });
    
    console.log('Query response:', response);
    
    const items = response?.data?.listUserProfiles?.items;
    if (items && items.length > 0) {
      const userProfile = items[0];
      
      // Set the profile state with whatever we got
      setProfile(userProfile);
      
      // Initialize form fields with empty strings for any missing fields
      setFirstName('');
      setLastName('');
      setCompanyName('');
      setPhoneNumber('');
      setPreferredContactMethod('email');
      
      // Then override with actual values if they exist
      if (userProfile.firstName) setFirstName(userProfile.firstName);
      if (userProfile.lastName) setLastName(userProfile.lastName);
      if (userProfile.companyName) setCompanyName(userProfile.companyName);
      if (userProfile.phoneNumber) setPhoneNumber(userProfile.phoneNumber);
      if (userProfile.preferredContactMethod) setPreferredContactMethod(userProfile.preferredContactMethod);
      
      // Fetch additional contacts if needed
      if (userProfile.profileOwner) {
        try {
          const contactsQuery = /* GraphQL */ `
            query GetAdditionalContacts($profileOwner: String!) {
              listAdditionalContacts(filter: { profileOwner: { eq: $profileOwner } }) {
                items {
                  id
                  name
                  email
                  receiveNotifications
                  profileOwner
                  createdAt
                  updatedAt
                }
              }
            }
          `;
          
          const contactsResponse = await client.graphql<GraphQLQuery<any>>({
            query: contactsQuery,
            variables: {
              profileOwner: userProfile.profileOwner
            },
            authMode: 'userPool'
          });
          
          const contactItems = contactsResponse?.data?.listAdditionalContacts?.items || [];
          setAdditionalContacts(contactItems);
        } catch (err) {
          console.error('Error fetching contacts:', err);
          setAdditionalContacts([]);
        }
      }
    } else {
      console.error('No profile found');
      setError('Profile not found. Please contact support.');
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
    setError(`Failed to load profile: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    setLoading(false);
  }
};

// Add this debugging function to your component
const listAllProfiles = async () => {
  try {
    console.log('Listing all profiles to debug...');
    
    const listAllQuery = /* GraphQL */ `
      query ListAllProfiles {
        listUserProfiles(limit: 100) {
          items {
            id
            email
            uuid
            profileOwner
          }
        }
      }
    `;
    
    const response = await client.graphql<GraphQLQuery<any>>({
      query: listAllQuery,
      authMode: 'userPool'
    });
    
    console.log('All profiles:', response?.data?.listUserProfiles?.items);
    console.log('Looking for UUID:', user.userId);
    
    // Check if any profile has this UUID
    const matchingProfiles = response?.data?.listUserProfiles?.items.filter(
      (profile: any) => profile.uuid === user.userId
    );
    
    console.log('Matching profiles:', matchingProfiles);
  } catch (err) {
    console.error('Error listing profiles:', err);
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

  // Define necessary mutations
  const updateUserProfileMutation = /* GraphQL */ `
    mutation UpdateUserProfile(
      $input: UpdateUserProfileInput!
    ) {
      updateUserProfile(input: $input) {
        id
        email
        firstName
        lastName
        companyName
        phoneNumber
        preferredContactMethod
        profileOwner
        updatedAt
      }
    }
  `;

  const createAdditionalContactMutation = /* GraphQL */ `
    mutation CreateAdditionalContact(
      $input: CreateAdditionalContactInput!
    ) {
      createAdditionalContact(input: $input) {
        id
        name
        email
        receiveNotifications
        profileOwner
        createdAt
        updatedAt
      }
    }
  `;

  const updateAdditionalContactMutation = /* GraphQL */ `
    mutation UpdateAdditionalContact(
      $input: UpdateAdditionalContactInput!
    ) {
      updateAdditionalContact(input: $input) {
        id
        name
        email
        receiveNotifications
        profileOwner
        updatedAt
      }
    }
  `;

  const deleteAdditionalContactMutation = /* GraphQL */ `
    mutation DeleteAdditionalContact(
      $input: DeleteAdditionalContactInput!
    ) {
      deleteAdditionalContact(input: $input) {
        id
        profileOwner
      }
    }
  `;
  
  if (!isOpen) return null;
  
  // src/features/clients/components/UserProfileModal.tsx
// Only showing key styling changes, other code remains the same

return (
  <>
    {/* Modal overlay with improved blur effect */}
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1040,
      display: 'block',
      backdropFilter: 'blur(4px)',
      transition: 'opacity 0.2s ease'
    }}>
    
      {/* Modal with improved shadows and rounded corners */}
      <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg rounded-4">
          
            {/* Enhanced modal header */}
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
                
                {/* Updated avatar styling to match document cards */}
                <div className="my-3">
                  <div className="bg-primary-subtle rounded-circle d-inline-flex p-4 mb-3">
                    <i className="bi bi-person-circle text-primary" style={{ fontSize: '2.25rem' }}></i>
                  </div>
                  <h4 className="mb-1 fw-bold">Edit Profile</h4>
                  <p className="text-muted mb-0">{profile?.email}</p>
                </div>
              </div>
            </div>
            
            {/* Enhanced tab navigation */}
            <div className="px-4">
              <ul className="nav nav-tabs nav-fill border-0 gap-1">
                <li className="nav-item">
                  <button 
                    className={`nav-link border-0 rounded-3 ${activeTab === 'profile' ? 'active bg-primary-subtle text-primary' : 'text-muted'}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <i className="bi bi-person me-2"></i>
                    Profile
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link border-0 rounded-3 ${activeTab === 'contacts' ? 'active bg-primary-subtle text-primary' : 'text-muted'}`}
                    onClick={() => setActiveTab('contacts')}
                  >
                    <i className="bi bi-people me-2"></i>
                    Additional Contacts
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link border-0 rounded-3 ${activeTab === 'notifications' ? 'active bg-primary-subtle text-primary' : 'text-muted'}`}
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
                /* Profile Tab Content - with enhanced form styling */
                activeTab === 'profile' ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text"
                          id="firstName"
                          className="form-control rounded-3 border-light-subtle" 
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
                          className="form-control rounded-3 border-light-subtle" 
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
                          className="form-control rounded-3 border-light-subtle" 
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
                          className="form-control rounded-3 border-light-subtle" 
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
                          className="form-select rounded-3 border-light-subtle"
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
                
                /* Additional Contacts Tab Content - with document card styling */
                activeTab === 'contacts' ? (
                  <div>
                    {/* Contacts List - styled as document cards */}
                    {additionalContacts.length > 0 ? (
                      <div className="file-document-list mb-4">
                        {additionalContacts.map(contact => (
                          <div key={contact.id} className="file-document-item">
                            <div className={`file-document-icon bg-info-subtle text-info`}>
                              <i className="bi bi-person"></i>
                            </div>
                            
                            <div className="file-document-content">
                              <div className="file-document-title">
                                {contact.name}
                                {contact.receiveNotifications && (
                                  <span className="badge bg-success-subtle text-success ms-2 fs-8">Notifications On</span>
                                )}
                              </div>
                              
                              <div className="file-document-description">
                                <span>
                                  <i className="bi bi-envelope me-1 opacity-50"></i>
                                  {contact.email}
                                </span>
                              </div>
                            </div>
                            
                            <div className="file-document-actions">
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
                                className="btn btn-sm btn-outline-danger file-action-btn"
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
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-light text-center mb-4 rounded-4 shadow-sm">
                        <i className="bi bi-people fs-4 d-block mb-2 text-muted"></i>
                        <p className="mb-0">No additional contacts added yet.</p>
                      </div>
                    )}
                    
                    {/* Add New Contact Form - using document card styling */}
                    {showAddContactForm ? (
                      <div className="file-document-item">
                        <div className="file-document-icon bg-primary-subtle text-primary">
                          <i className="bi bi-person-plus"></i>
                        </div>
                        
                        <div className="file-document-content">
                          <div className="file-document-title mb-2">
                            Add New Contact
                          </div>
                          
                          <div className="row g-2">
                            <div className="col-md-5">
                              <input
                                type="text"
                                className="form-control rounded-3 border-light-subtle"
                                placeholder="Name"
                                value={newContactName}
                                onChange={(e) => setNewContactName(e.target.value)}
                              />
                            </div>
                            <div className="col-md-5">
                              <input
                                type="email"
                                className="form-control rounded-3 border-light-subtle"
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
                        </div>
                        
                        <div className="file-document-actions">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={resetContactForm}
                            disabled={savingContact}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-sm btn-primary ms-2"
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
                    ) : (
                      <button
                        className="btn btn-primary rounded-3 w-100"
                        onClick={() => setShowAddContactForm(true)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Add New Contact
                      </button>
                    )}
                    
                    <div className="alert alert-info rounded-4 mt-4 mb-0">
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
                
                /* Notifications Tab - with document-style card */
                activeTab === 'notifications' ? (
                  <div className="file-document-item py-5">
                    <div className="text-center w-100">
                      <div className="bg-warning-subtle text-warning rounded-circle d-inline-flex p-4 mb-3">
                        <i className="bi bi-bell fs-1"></i>
                      </div>
                      <h5>Notification Settings Coming Soon</h5>
                      <p className="text-muted mb-0">This feature will allow you to manage your notification preferences.</p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
            
            <div className="modal-footer border-0 pt-2 pb-4">
              <button 
                type="button" 
                className="btn btn-outline-secondary rounded-3" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              
              {activeTab === 'profile' && (
                <button 
                  type="button" 
                  className="btn btn-success rounded-3" 
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
              
              {/* Debug buttons with improved styling */}
              {isDeveloper && (
                <div className="ms-auto me-3">
                  <div className="btn-group btn-group-sm">
                    <button type="button" className="btn btn-outline-secondary" onClick={debugUserProfile}>
                      <i className="bi bi-bug me-1"></i> Debug
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={listAllProfiles}>
                      <i className="bi bi-list-ul me-1"></i> List Profiles
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
)};

export default UserProfileModal;