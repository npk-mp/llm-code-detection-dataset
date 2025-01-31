import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface UserStats {
  totalOrders: number;
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: Date;
  }>;
  accountBalance: number;
}

const UserDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await axios.get<UserStats>('/api/user/stats');
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch user statistics');
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return null;

  return (
    <div className="dashboard-container">
      <h1>Your Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p>{stats.totalOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Account Balance</h3>
          <p>${stats.accountBalance.toFixed(2)}</p>
        </div>
      </div>
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <ul>
          {stats.recentActivity.map((activity) => (
            <li key={activity.id}>
              <span>{activity.action}</span>
              <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserDashboard;