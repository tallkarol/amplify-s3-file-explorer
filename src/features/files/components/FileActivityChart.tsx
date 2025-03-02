// src/components/admin/FileActivityChart.tsx
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { UserProfile } from '../../../types';
import { listUserFiles } from '../services/S3Service';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

interface FileActivityChartProps {
  user: UserProfile;
}

interface ActivityDataPoint {
  date: string;
  files: number;
  uploads: number;
}

// Tooltip props type
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const FileActivityChart = ({ user }: FileActivityChartProps) => {
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);

  useEffect(() => {
    if (user) {
      generateActivityData();
    }
  }, [user]);

  const generateActivityData = async () => {
    setLoading(true);

    try {
      // Fetch all files to analyze when they were last modified
      const allFiles = await listUserFiles(user.uuid, '/');
      
      // We'll generate simulated data based on the number of files
      // In a real app, you would use actual file timestamps
      
      // Create a date range for the last 14 days
      const now = new Date();
      const data: ActivityDataPoint[] = [];
      
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        
        // Format date as MM/DD
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        
        // Generate some activity data - in a real app this would come from file metadata
        // Here we're just creating a random pattern
        const fileCount = allFiles.length;
        const baseCount = Math.max(1, Math.floor(fileCount / 10));
        const randomVariation = () => Math.floor(Math.random() * baseCount);
        
        data.push({
          date: formattedDate,
          files: baseCount + randomVariation(),
          uploads: Math.max(0, Math.floor(baseCount / 2) + randomVariation() - 1)
        });
      }
      
      setActivityData(data);
    } catch (error) {
      console.error('Error generating activity data:', error);
      // Fallback to empty data
      setActivityData([]);
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border shadow-sm">
          <p className="fw-medium mb-1">{label}</p>
          <p className="mb-0 text-primary">
            <span className="me-1">•</span>
            Files: {payload[0].value}
          </p>
          <p className="mb-0 text-success">
            <span className="me-1">•</span>
            Uploads: {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <LoadingSpinner text="Loading activity data..." />;
  }

  return (
    <div className="p-2">
      <h6 className="text-muted mb-3">File Activity (Last 14 Days)</h6>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={activityData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={30} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="files" 
            name="Files Accessed" 
            stroke="#0d6efd" 
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="uploads" 
            name="File Uploads" 
            stroke="#198754" 
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-center mt-2">
        <small className="text-muted">
          Note: This chart shows simulated activity data for demonstration purposes.
        </small>
      </div>
    </div>
  );
};

export default FileActivityChart;