# S3 Secure File Share

A secure document sharing platform built with React, Vite, and AWS Amplify, enabling organizations to share and manage important certification documents in compliance with industry standards.

## Overview

S3 Secure File Share is a comprehensive solution designed to help organizations securely store, manage, and share sensitive documents. Built for compliance with industry standards, the application provides intuitive interfaces for both clients and administrators.

## Features

### User Features
- **Role-Based Access Control**: Separate interfaces for users, administrators, and developers
- **Secure Document Storage**: Files are organized in structured folders (Certificates, Audit Reports, Auditor Profiles, Statistics)
- **Drag-and-Drop File Uploads**: Intuitive file management with visual feedback
- **User Profile Management**: Manage contact information and notification preferences

### Admin Features
- **Client Management**: View and manage all clients in a centralized dashboard
- **File Management**: Access and manage files across all users
- **User Account Controls**: Ability to suspend/reactivate user accounts

### Developer Features
- **Service Health Monitoring**: Check the status of all connected services
- **User Validation Tools**: Verify and repair user account setup
- **Error Logging**: Comprehensive error tracking and diagnostics

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Bootstrap 5 with custom CSS
- **Authentication**: AWS Cognito via AWS Amplify
- **Storage**: Amazon S3
- **API**: AWS AppSync GraphQL
- **Database**: Amazon DynamoDB

## Architecture

The application follows a modular architecture with feature-based organization:

```
src/
├── assets/               # Static assets
├── components/           # Shared UI components
│   ├── common/           # Generic UI elements
│   ├── admin/            # Admin-specific components
│   ├── error/            # Error handling components
│   └── auth/             # Authentication components
│
├── features/             # Feature modules
│   ├── auth/             # Authentication feature
│   ├── clients/          # Client management
│   ├── files/            # File management
│   ├── notifications/    # Notification system
│   └── workflows/        # Workflow management
│
├── hooks/                # Custom React hooks
├── layouts/              # Page layouts for different user roles
├── pages/                # Main page components
├── services/             # API and service interfaces
├── styles/               # Global styles
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## AWS Amplify Integration

The application leverages AWS Amplify for:

- **Authentication**: User management with Cognito
- **Storage**: S3 bucket for secure file storage
- **API**: GraphQL API with AppSync
- **Data Models**: DynamoDB for structured data storage

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- AWS account with appropriate permissions

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/s3-secure-file-share.git
   cd s3-secure-file-share
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Initialize Amplify (if not already done):
   ```bash
   npm install -g @aws-amplify/cli
   amplify init
   ```

4. Pull existing Amplify environment (if applicable):
   ```bash
   amplify pull --appId YOUR_APP_ID --envName dev
   ```

### Running Locally

Start the development server:
```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Deployment

### Amplify Deployment

```bash
amplify push
```

### CI/CD Integration

The project includes an `amplify.yml` configuration for CI/CD pipeline integration.

## Project Structure

### Key Files

- `amplify/`: Contains AWS Amplify configuration and resources
- `amplify/data/resource.ts`: Data models definition
- `amplify/auth/resource.ts`: Authentication configuration
- `amplify/storage/resource.ts`: S3 storage configuration
- `src/App.tsx`: Main application component with routing
- `src/main.tsx`: Application entry point

## Security Considerations

- Role-based access control for user/admin/developer permissions
- S3 bucket configured with appropriate access policies
- All data transfers encrypted in transit
- User authentication with Cognito and JWT tokens

## Compliance

The application is designed with compliance features for:
- Document control procedures as outlined in ANAB accreditation standards
- Access controls with role-based permissions
- Secure document storage with auditable access logs

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.