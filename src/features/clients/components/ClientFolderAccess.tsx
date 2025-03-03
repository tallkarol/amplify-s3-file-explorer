// src/features/clients/components/ClientFolderAccess.tsx

import React from 'react';
import Card from '../../../components/common/Card';
import RootFolderList from '../../../features/files/components/RootFolderList';
import { UserProfile } from '../../../types';

interface ClientFolderAccessProps {
  client: UserProfile;
  onSelectFolder: () => void;
}

const ClientFolderAccess: React.FC<ClientFolderAccessProps> = ({
  client,
  onSelectFolder
}) => {
  return (
    <Card title="Client Folders">
      <RootFolderList 
        user={client}
        onSelectFolder={onSelectFolder}
      />
    </Card>
  );
};

export default ClientFolderAccess;