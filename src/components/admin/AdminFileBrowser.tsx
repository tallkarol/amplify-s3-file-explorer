// src/components/admin/AdminFileBrowser.tsx
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import { UserProfile } from '../../types';

interface AdminFileBrowserProps {
  selectedUser: UserProfile | null;
}

const AdminFileBrowser = ({ selectedUser }: AdminFileBrowserProps) => {
  if (!selectedUser) {
    return (
      <Card title="File Management">
        <EmptyState
          icon="person-square"
          title="No User Selected"
          message="Please select a user to manage their files"
        />
      </Card>
    );
  }

  return (
    <Card 
      title="File Management" 
      subtitle={`Files for ${selectedUser.email}`}
    >
      <EmptyState
        icon="folder"
        title="File browser coming soon"
        message="This feature is under development."
        action={
          <button className="btn btn-outline-primary" disabled>
            <i className="bi bi-upload me-2"></i>
            Upload Files
          </button>
        }
      />
    </Card>
  );
};

export default AdminFileBrowser;