# 🚀 Pre-Deployment Testing Checklist

## Overview
This checklist ensures all core functionality is working before deployment. Test as **Admin**, **User**, and **Developer** roles.

---

## 🔧 Setup & Prerequisites

### Initial Setup
- [ ] Deploy latest code to Amplify
- [ ] Verify all Lambda triggers are active (post-confirmation, pre-signup)
- [ ] Ensure DynamoDB tables are created and accessible
- [ ] Verify S3 bucket permissions are correct
- [ ] Clear browser cache/use incognito mode for testing

### Test Accounts Needed
- [ ] **Admin Account** (existing or create new with admin group membership)
- [ ] **Developer Account** (existing or create new with developer group membership)
- [ ] **Test User 1** (new regular user - for upload/download testing)
- [ ] **Test User 2** (new regular user - for deletion flow testing)

---

## 📝 1. User Registration & Login Flow

### New User Sign-Up (Test User 1)
- [ ] Navigate to sign-up page
- [ ] Create new user account with valid email
- [ ] Verify email confirmation works
- [ ] Complete sign-up process
- [ ] **Expected**: User profile created in DynamoDB
- [ ] **Expected**: Welcome notification appears in inbox
- [ ] **Expected**: 4 core folders created in S3 (certificate, audit-report, auditor-resume, statistics)
- [ ] **Expected**: Default folder permissions created in DynamoDB

### Duplicate Email Prevention
- [ ] Attempt to create another account with same email as Test User 1
- [ ] **Expected**: Pre-signup trigger blocks registration
- [ ] **Expected**: Error message displayed

### User Login
- [ ] Sign in as Test User 1
- [ ] Verify redirect to user dashboard
- [ ] Check user initials/avatar in sidebar
- [ ] **Expected**: First login notification sent to all admins

### Admin Login
- [ ] Sign in as Admin
- [ ] Check for first-login notification from Test User 1
- [ ] Verify notification has correct format and action link
- [ ] Click notification link
- [ ] **Expected**: Navigates to Test User 1's profile in client management

---

## 📁 2. File Management (User Perspective)

### Upload Files as User (Test User 1)
- [ ] Navigate to Dashboard
- [ ] Click on "Certificates" folder
- [ ] Upload a file using drag-and-drop
  - **Expected**: Upload succeeds
  - **Expected**: File appears in folder
  - **Expected**: Admin receives notification about upload
- [ ] Upload another file using "Choose File" button
  - **Expected**: Upload succeeds
  - **Expected**: File count updates
- [ ] Try uploading to "Audit Reports" folder
  - **Expected**: Works if upload permission is enabled
- [ ] Navigate back to Dashboard
- [ ] **Expected**: File counts on folder cards are accurate

### Download Files as User
- [ ] Open "Certificates" folder with uploaded files
- [ ] Download a file
  - **Expected**: Download succeeds (if download permission enabled)
  - **Expected**: File downloads correctly
- [ ] Try downloading from restricted folder (if any)
  - **Expected**: Download blocked if permission disabled

### Additional Folders
- [ ] Create a custom folder (if subfolder creation is enabled)
- [ ] Upload files to custom folder
- [ ] Navigate to Dashboard
- [ ] **Expected**: Custom folder appears in "Other Folders" section
- [ ] **Expected**: File count is accurate
- [ ] Click custom folder
- [ ] **Expected**: Can view and manage files in custom folder

---

## 🔐 3. Folder Permissions (Admin Perspective)

### View User Permissions
- [ ] Sign in as Admin
- [ ] Navigate to Client Management
- [ ] Select Test User 1
- [ ] Click "Permissions" tab
- [ ] **Expected**: All folders (core + additional) are listed
- [ ] **Expected**: Current permissions are displayed correctly

### Modify Upload Permissions
- [ ] Toggle Upload permission OFF for "Audit Reports"
- [ ] Click "Save Changes"
- [ ] **Expected**: Success message appears
- [ ] Sign in as Test User 1
- [ ] Try to upload to "Audit Reports"
- [ ] **Expected**: Upload is blocked or shows error

### Modify Download Permissions
- [ ] Sign in as Admin
- [ ] Navigate to Test User 1 → Permissions
- [ ] Toggle Download permission OFF for "Certificates"
- [ ] Save changes
- [ ] Sign in as Test User 1
- [ ] Try to download file from "Certificates"
- [ ] **Expected**: Download is blocked or shows error

### Grant All / Revoke All
- [ ] Sign in as Admin
- [ ] Navigate to Test User 1 → Permissions
- [ ] Click "Revoke All"
- [ ] **Expected**: All upload/download permissions disabled
- [ ] Click "Grant All"
- [ ] **Expected**: All upload/download permissions enabled
- [ ] Save changes

### Additional Folder Permissions
- [ ] Verify custom folder appears in permissions tab
- [ ] Set specific permissions for custom folder
- [ ] Save and verify permissions apply correctly

---

## 📤 4. Admin File Upload for User

### Upload as Admin for User
- [ ] Sign in as Admin
- [ ] Navigate to File Management
- [ ] Select Test User 1 from dropdown
- [ ] Select a folder (e.g., "Audit Reports")
- [ ] Upload a file
  - **Expected**: Upload succeeds
  - **Expected**: File appears in user's folder
  - **Expected**: Test User 1 receives notification about admin upload
- [ ] Sign in as Test User 1
- [ ] Check notifications/inbox
- [ ] **Expected**: Notification about admin upload appears
- [ ] Click notification link
- [ ] **Expected**: Navigates to correct folder
- [ ] **Expected**: File is visible and downloadable

---

## 🔔 5. Notifications System

### User Notifications (Test User 1)
- [ ] Navigate to Inbox
- [ ] **Expected**: Welcome notification appears
- [ ] **Expected**: Admin file upload notification appears (if applicable)
- [ ] Test category filters:
  - [ ] Click "All" - shows all notifications
  - [ ] Click "System" - shows welcome message
  - [ ] Click "File" - shows file-related notifications
  - [ ] Click "Admin" - shows admin notifications
- [ ] Search for specific notification
  - **Expected**: Search filters results correctly
- [ ] Mark notification as read
  - **Expected**: Badge updates
  - **Expected**: Unread count decreases
- [ ] Delete a notification
  - **Expected**: Notification removed from list

### Admin Notifications
- [ ] Sign in as Admin
- [ ] Navigate to Inbox
- [ ] **Expected**: First-login notification from Test User 1
- [ ] **Expected**: User file upload notification (if Test User 1 uploaded)
- [ ] Test category filters work correctly
- [ ] Click on notification action links
  - **Expected**: Navigate to correct user/folder

---

## 👤 6. User Profile & Settings

### View Profile (User)
- [ ] Sign in as Test User 1
- [ ] Click "Profile & Settings" in sidebar
- [ ] **Expected**: Full page profile view loads
- [ ] **Expected**: All user information displayed correctly
- [ ] **Expected**: Account status shows "Active"
- [ ] **Expected**: User ID is visible

### Profile Navigation
- [ ] From profile page, navigate to Dashboard
- [ ] Return to Profile
- [ ] **Expected**: Sidebar active state updates correctly
- [ ] **Expected**: Navigation is smooth

---

## 🗑️ 7. User Account Deletion Flow

### User Self-Deletion (Test User 2)
- [ ] Create and sign in as Test User 2
- [ ] Upload at least 2 files to different folders
- [ ] Navigate to Profile & Settings
- [ ] Scroll to "Danger Zone"
- [ ] Click "Delete My Account"
- [ ] **Step 1**: Click "Yes, Continue"
- [ ] **Step 2**: Type "DELETE" in confirmation box
- [ ] **Step 3**: Click "Confirm Deletion"
- [ ] **Expected**: Account status changed to 'inactive'
- [ ] **Expected**: All admins receive notification
- [ ] **Expected**: User is signed out automatically
- [ ] **Expected**: Success message shown before sign-out

### Admin Receives Deletion Notification
- [ ] Sign in as Admin
- [ ] Check Inbox/Notifications
- [ ] **Expected**: "User Account Deactivation Request" notification
- [ ] **Expected**: Notification has warning icon and proper metadata
- [ ] Click notification action link
- [ ] **Expected**: Navigates to Test User 2's profile

### Admin Processes Deletion
- [ ] In Test User 2's profile, navigate to "Actions" tab
- [ ] **Expected**: User status shows "Inactive"
- [ ] **Expected**: "Mark as Deleted" button is available
- [ ] Click "Mark as Deleted"
- [ ] Confirm action
- [ ] **Expected**: Status changes to "Deleted"
- [ ] **Expected**: All admins receive "User Marked for Deletion" notification
- [ ] Check S3 bucket
- [ ] **Expected**: Test User 2's files are still present (not deleted)

### Verify Deleted User Cannot Login
- [ ] Attempt to sign in as Test User 2
- [ ] **Expected**: Login blocked or status check prevents access
- [ ] **Expected**: Appropriate error message shown

---

## 👨‍💼 8. Admin User Management

### Deactivate User (Admin Action)
- [ ] Sign in as Admin
- [ ] Navigate to Client Management
- [ ] Select Test User 1
- [ ] Go to "Actions" tab
- [ ] Click "Deactivate Account"
- [ ] Confirm action
- [ ] **Expected**: User status changes to "Inactive"
- [ ] **Expected**: All admins receive deactivation notification
- [ ] Check notification inbox
- [ ] **Expected**: "User Account Deactivated" notification appears

### Reactivate User
- [ ] In Test User 1's Actions tab
- [ ] **Expected**: "Reactivate Account" button available
- [ ] Click "Reactivate Account"
- [ ] Confirm action
- [ ] **Expected**: User status changes back to "Active"
- [ ] Attempt to sign in as Test User 1
- [ ] **Expected**: Login succeeds

### Admin Password Reset
- [ ] In Test User 1's Actions tab
- [ ] Click "Reset Password"
- [ ] Confirm action
- [ ] **Expected**: Password reset initiated in Cognito
- [ ] **Expected**: All admins receive password reset notification
- [ ] Check notification
- [ ] **Expected**: "Password Reset for [User]" notification appears

---

## 🧪 9. Developer Tools & Access

### Developer Dashboard
- [ ] Sign in as Developer
- [ ] Navigate to Developer Dashboard
- [ ] **Expected**: Access to all views (Admin, User, Dev Tools)

### Admin Views (Developer Context)
- [ ] Click "Admin Views" dropdown
- [ ] Navigate to Admin Dashboard
- [ ] **Expected**: Can access admin dashboard
- [ ] Navigate to Client Management
- [ ] **Expected**: Can manage users
- [ ] Navigate to File Management
- [ ] **Expected**: Can manage files
- [ ] Navigate to Admin Inbox
- [ ] **Expected**: Can view admin notifications

### User Views (Developer Context)
- [ ] Click "User Views" dropdown
- [ ] Navigate to User Dashboard
- [ ] **Expected**: Can view as user
- [ ] Navigate to User Profile
- [ ] **Expected**: Can view profile page
- [ ] Navigate to different folders
- [ ] **Expected**: Can browse folders

### Developer Debug Tools
- [ ] Navigate to Debug Tools
- [ ] Test "Duplicate User Detector"
  - **Expected**: Shows if any duplicate users exist
- [ ] Test "User Lookup"
  - **Expected**: Can search and find users
- [ ] Test "User Validator"
  - **Expected**: Shows user validation status
- [ ] Test "Error Log"
  - **Expected**: Displays any system errors

---

## 🎨 10. UI/UX Verification

### Sidebar Navigation
- [ ] Test sidebar collapse/expand
  - **Expected**: Smooth animation
  - **Expected**: Icons remain visible when collapsed
- [ ] Test all navigation links
  - **Expected**: Active states highlight correctly
  - **Expected**: No broken links

### Responsive Design
- [ ] Test on desktop (1920x1080)
  - **Expected**: All elements render correctly
- [ ] Test on tablet view (768px)
  - **Expected**: Layout adjusts appropriately
- [ ] Test on mobile view (375px)
  - **Expected**: Sidebar converts to mobile menu
  - **Expected**: Cards stack vertically

### Loading States
- [ ] Check loading spinners appear during data fetches
- [ ] Verify no flash of unstyled content (FOUC)
- [ ] Ensure proper loading messages

### Error States
- [ ] Test invalid file upload (wrong format/too large)
  - **Expected**: Appropriate error message
- [ ] Test network disconnection
  - **Expected**: Graceful error handling

---

## 📊 11. Data Consistency Checks

### DynamoDB Verification
- [ ] Check UserProfile table
  - **Expected**: All test users have records
  - **Expected**: Status fields are correct
  - **Expected**: firstLoginAt and lastLoginAt populated
- [ ] Check FolderPermission table
  - **Expected**: Permissions exist for each user
  - **Expected**: Permissions match UI settings
- [ ] Check Notification table
  - **Expected**: All notifications are recorded
  - **Expected**: Read/unread status accurate

### S3 Verification
- [ ] Check user folders in S3
  - **Expected**: Folder structure is `users/{userId}/{folderName}/`
  - **Expected**: All uploaded files are present
  - **Expected**: Deleted user files remain (not removed)

### Cognito Verification
- [ ] Check Cognito User Pool
  - **Expected**: All test users exist
  - **Expected**: Group memberships are correct
  - **Expected**: Inactive/deleted users cannot login

---

## 🚨 12. Edge Cases & Error Handling

### File Operations
- [ ] Upload file with special characters in name
- [ ] Upload file with very long name
- [ ] Upload duplicate file (same name)
- [ ] Upload empty file (0 bytes)
- [ ] Upload very large file (test size limits)

### Permission Edge Cases
- [ ] Set conflicting permissions (if possible)
- [ ] Remove all permissions and test access
- [ ] Test permission inheritance (if applicable)

### User State Edge Cases
- [ ] Try to delete already deleted user
- [ ] Try to activate already active user
- [ ] Access deleted user's files as admin

### Notification Edge Cases
- [ ] Generate many notifications quickly
- [ ] Test notification expiration (if applicable)
- [ ] Delete all notifications and verify count resets

---

## ✅ Final Checks

### Performance
- [ ] Dashboard loads in under 3 seconds
- [ ] File uploads complete in reasonable time
- [ ] No console errors in browser
- [ ] No 500 errors in Network tab

### Security
- [ ] User cannot access other user's files
- [ ] User cannot see other user's profile data
- [ ] Regular user cannot access admin routes
- [ ] Deleted/inactive users cannot login

### Documentation
- [ ] README is up to date
- [ ] All features are documented
- [ ] Known issues/limitations are noted

---

## 📝 Testing Notes & Issues

### Issues Found
```
Issue #1: [Description]
- Steps to reproduce:
- Expected behavior:
- Actual behavior:
- Severity: [Critical/High/Medium/Low]

Issue #2: [Description]
...
```

### Test Results Summary
- **Total Tests**: _____
- **Passed**: _____
- **Failed**: _____
- **Blocked**: _____
- **Pass Rate**: _____%

### Sign-Off
- [ ] All critical functionality tested and working
- [ ] All blockers resolved
- [ ] Ready for deployment

**Tested By**: ________________  
**Date**: ________________  
**Environment**: ________________  
**Build Version**: ________________

