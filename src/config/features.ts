// src/config/features.ts
export interface Feature {
    id: string;
    name: string;
    description: string;
    defaultValue: boolean;
    category: 'ui' | 'performance' | 'storage' | 'notifications' | 'experimental';
  }
  
  const features: Feature[] = [
    {
      id: 'advanced_file_search',
      name: 'Advanced File Search',
      description: 'Enable advanced search capabilities for files including metadata and content search.',
      defaultValue: false,
      category: 'ui'
    },
    {
      id: 'bulk_file_operations',
      name: 'Bulk File Operations',
      description: 'Enable bulk operations for files such as multi-select, delete, and download.',
      defaultValue: false,
      category: 'ui'
    },
    {
      id: 'enhanced_drag_drop',
      name: 'Enhanced Drag & Drop',
      description: 'Improved drag and drop experience with progress visualization and folder dropping.',
      defaultValue: true,
      category: 'ui'
    },
    {
      id: 'file_versioning',
      name: 'File Versioning',
      description: 'Keep track of file versions and allow restoring previous versions.',
      defaultValue: false,
      category: 'storage'
    },
    {
      id: 'real_time_notifications',
      name: 'Real-time Notifications',
      description: 'Enable real-time notifications for file changes and system events.',
      defaultValue: false,
      category: 'notifications'
    },
    {
      id: 'caching_optimization',
      name: 'Caching Optimization',
      description: 'Enable client-side caching to improve performance and reduce API calls.',
      defaultValue: true,
      category: 'performance'
    },
    {
      id: 'advanced_analytics',
      name: 'Advanced Analytics',
      description: 'Collect advanced usage analytics and display more detailed usage reports.',
      defaultValue: false,
      category: 'experimental'
    },
    {
      id: 'workflow_automation',
      name: 'Workflow Automation',
      description: 'Enable automated workflows for file processing and approvals.',
      defaultValue: false,
      category: 'experimental'
    }
  ];
  
  export default features;