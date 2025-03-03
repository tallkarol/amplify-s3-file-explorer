// src/components/user/FolderCardsView.tsx
import { useNavigate } from 'react-router-dom';

interface FolderCard {
  id: string;       // Actual folder name in S3
  title: string;    // Display title for the UI
  description: string;
  icon: string;
  color: string;
}

interface FolderCardsViewProps {
  userId: string;
}

const FolderCardsView = ({ }: FolderCardsViewProps) => {
  const navigate = useNavigate();
  
  // The standard folder structure with custom display titles
  const folders: FolderCard[] = [
    {
      id: 'certificate',
      title: 'Certificates',
      description: 'Store and manage your certification documents',
      icon: 'award',
      color: 'primary'
    },
    {
      id: 'audit-report',
      title: 'Audit Reports',
      description: 'Access your audit reports and documentation',
      icon: 'file-earmark-text',
      color: 'success'
    },
    {
      id: 'auditor-resume',
      title: 'Auditor Profiles',
      description: 'Manage auditor resumes and qualifications',
      icon: 'person-badge',
      color: 'info'
    },
    {
      id: 'statistics',
      title: 'Statistics & Analytics',
      description: 'View performance metrics and statistics',
      icon: 'graph-up',
      color: 'warning'
    }
  ];
  
  // Navigate to the specific folder
  const navigateToFolder = (folderId: string) => {
    navigate(`/user/folder/${folderId}`);
  };
  
  return (
    <div className="container p-0">
      <div className="row row-cols-1 row-cols-md-2 g-4">
        {folders.map(folder => (
          <div className="col" key={folder.id}>
            <div 
              className="card h-100 shadow-sm" 
              onClick={() => navigateToFolder(folder.id)}
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div className="card-body d-flex">
                <div className={`bg-${folder.color} bg-opacity-10 p-3 rounded me-3 d-flex align-items-center justify-content-center`} style={{ width: '60px', height: '60px' }}>
                  <i className={`bi bi-${folder.icon} fs-1 text-${folder.color}`}></i>
                </div>
                <div>
                  <h5 className="card-title">{folder.title}</h5>
                  <p className="card-text text-muted">{folder.description}</p>
                </div>
              </div>
              <div className="card-footer bg-transparent">
                <small className="text-muted">
                  <i className="bi bi-folder me-1"></i> 
                  View Files
                  <i className="bi bi-chevron-right ms-2"></i>
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FolderCardsView;