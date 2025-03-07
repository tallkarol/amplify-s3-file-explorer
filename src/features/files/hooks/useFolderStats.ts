// src/hooks/useFolderStats.ts
import { useState, useEffect } from 'react';
import { listUserFiles } from '@/features/files/services/S3Service';

interface FolderStat {
  id: string;
  count: number;
}

export const useFolderStats = (userId: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folderStats, setFolderStats] = useState<FolderStat[]>([]);

  useEffect(() => {
    const fetchFolderStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Define the standard folders to check
        const folderPaths = [
          { id: 'certificate', path: '/certificate/' },
          { id: 'audit-report', path: '/audit-report/' },
          { id: 'auditor-resume', path: '/auditor-resume/' },
          { id: 'statistics', path: '/statistics/' }
        ];

        // Fetch file counts for each folder
        const stats = await Promise.all(
          folderPaths.map(async (folder) => {
            try {
              const files = await listUserFiles(userId, folder.path);
              // Count only files, not directories
              const fileCount = files.filter(item => !item.isFolder).length;
              return { id: folder.id, count: fileCount };
            } catch (err) {
              console.error(`Error fetching stats for ${folder.id}:`, err);
              return { id: folder.id, count: 0 };
            }
          })
        );

        setFolderStats(stats);
      } catch (err) {
        console.error('Error fetching folder stats:', err);
        setError(`Failed to load folder statistics: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFolderStats();
  }, [userId]);

  return { folderStats, loading, error };
};

export default useFolderStats;