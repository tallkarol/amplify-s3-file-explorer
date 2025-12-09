// src/features/files/components/AdditionalFolders.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { list } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';

interface AdditionalFolder {
  id: string;
  name: string;
  path: string;
  fileCount: number;
  icon: string;
}

interface AdditionalFoldersProps {
  userId: string;
}

const AdditionalFolders = ({ userId }: AdditionalFoldersProps) => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<AdditionalFolder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const client = generateClient();

  // Core folders that should be excluded
  const coreFolders = ['certificate', 'audit-report', 'auditor-resume', 'statistics'];

  useEffect(() => {
    fetchAdditionalFolders();
  }, [userId]);

  const fetchAdditionalFolders = async () => {
    try {
      setLoading(true);

      // 1. Fetch user's folder permissions
      const permissionsQuery = /* GraphQL */ `
        query ListFolderPermissions($userId: String!) {
          listFolderPermissions(filter: { userId: { eq: $userId } }) {
            items {
              id
              folderPath
              downloadRestricted
              uploadRestricted
            }
          }
        }
      `;

      const permissionsResponse = await client.graphql<GraphQLQuery<any>>({
        query: permissionsQuery,
        variables: { userId },
        authMode: 'userPool'
      });

      const permissions = permissionsResponse.data?.listFolderPermissions?.items || [];

      // 2. List folders from S3
      const path = `users/${userId}/`;
      const result = await list({
        path,
        options: {
          listAll: true,
        }
      });

      // 3. Parse folder names and count files
      const folderMap = new Map<string, number>();
      
      result.items.forEach((item) => {
        if (item.path) {
          // Extract folder name from path (e.g., "users/123/custom-folder/file.pdf" -> "custom-folder")
          const pathParts = item.path.replace(path, '').split('/');
          if (pathParts.length > 1 && pathParts[0]) {
            const folderName = pathParts[0];
            // Only count if not a core folder
            if (!coreFolders.includes(folderName)) {
              folderMap.set(folderName, (folderMap.get(folderName) || 0) + 1);
            }
          }
        }
      });

      // 4. Filter folders with permissions and files
      const additionalFolders: AdditionalFolder[] = [];
      
      folderMap.forEach((count, folderName) => {
        // Check if user has permission for this folder
        const hasPermission = permissions.some((p: any) => 
          p.folderPath && p.folderPath.includes(folderName)
        );

        // Only show folders with files and permissions
        if (count > 0 && (hasPermission || permissions.length === 0)) {
          additionalFolders.push({
            id: folderName,
            name: formatFolderName(folderName),
            path: `/${folderName}/`,
            fileCount: count,
            icon: getFolderIcon(folderName)
          });
        }
      });

      // Sort by name
      additionalFolders.sort((a, b) => a.name.localeCompare(b.name));
      
      setFolders(additionalFolders);
    } catch (error) {
      console.error('Error fetching additional folders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format folder name for display
  const formatFolderName = (folderName: string): string => {
    return folderName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get appropriate icon for folder
  const getFolderIcon = (folderName: string): string => {
    const iconMap: Record<string, string> = {
      'documents': 'file-earmark',
      'reports': 'file-earmark-text',
      'images': 'image',
      'contracts': 'file-earmark-ruled',
      'invoices': 'receipt',
    };

    // Check if folder name contains any key
    for (const [key, icon] of Object.entries(iconMap)) {
      if (folderName.toLowerCase().includes(key)) {
        return icon;
      }
    }

    return 'folder'; // Default icon
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted small mt-2">Loading additional folders...</p>
      </div>
    );
  }

  if (folders.length === 0) {
    return null; // Don't show anything if no additional folders
  }

  return (
    <div className="additional-folders mt-4">
      <div className="d-flex align-items-center mb-3">
        <h5 className="mb-0 text-muted">
          <i className="bi bi-folder-plus me-2"></i>
          Additional Folders
        </h5>
        <span className="badge bg-secondary ms-2">{folders.length}</span>
      </div>
      
      <div className="row g-3">
        {folders.map(folder => (
          <div key={folder.id} className="col-md-6 col-lg-4 col-xl-3">
            <div 
              className="card h-100 shadow-sm hover-lift"
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => navigate(`/user/folder/${folder.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="card-body d-flex align-items-center">
                <div 
                  className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3"
                  style={{ width: '50px', height: '50px', minWidth: '50px' }}
                >
                  <i className={`bi bi-${folder.icon} fs-4 text-primary`}></i>
                </div>
                <div className="flex-grow-1 overflow-hidden">
                  <h6 className="mb-1 text-truncate">{folder.name}</h6>
                  <p className="mb-0 small text-muted">
                    <i className="bi bi-file-earmark me-1"></i>
                    {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'}
                  </p>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdditionalFolders;

