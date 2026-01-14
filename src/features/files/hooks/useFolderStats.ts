// src/hooks/useFolderStats.ts
import { useState, useEffect } from 'react';
import { getFolderFileCounts } from '@/features/files/services/S3Service';

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

        // Batch fetch file counts using optimized function (uses cache)
        const paths = folderPaths.map(f => f.path);
        const countsByPath = await getFolderFileCounts(userId, paths);

        // Map counts back to folder IDs
        const stats = folderPaths.map(folder => ({
          id: folder.id,
          count: countsByPath[folder.path] || 0
        }));

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