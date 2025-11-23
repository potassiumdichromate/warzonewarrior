import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/api';
import './LiveLeaderboard.css';

const LiveLeaderboard = ({ data, autoRefresh = false, refreshInterval = 30000 }) => {
  const [leaderboardData, setLeaderboardData] = useState(data || []);
  const [loading, setLoading] = useState(!data);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (data) {
      setLeaderboardData(data);
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (!autoRefresh) return;

    const fetchLeaderboard = async () => {
      try {
        const freshData = await getLeaderboard();
        setLeaderboardData(freshData);
        setLastUpdate(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };

    // Initial fetch if no data provided
    if (!data) {
      fetchLeaderboard();
    }

    // Set up interval for auto-refresh
    const interval = setInterval(fetchLeaderboard, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, data]);

  // Sort and limit to top 10
  const sortedData = leaderboardData
    .slice()
    .sort((a, b) => (b.PlayerResources?.coin || 0) - (a.PlayerResources?.coin || 0))
    .slice(0, 10);

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="live-leaderboard">
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">
          <span className="title-icon">🏆</span>
          Live Leaderboard
        </h3>
        {autoRefresh && (
          <div className="last-update">
            <span className="update-dot"></span>
            <span className="update-text">
              {lastUpdate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="leaderboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {sortedData.map((player, index) => {
            const rank = index + 1;
            const medal = getMedalEmoji(rank);
            const name = player.name || `Player ${rank}`;
            const coins = player.PlayerResources?.coin || 0;
            const exp = player.PlayerProfile?.exp || 0;

            return (
              <div 
                key={player._id || index} 
                className={`leaderboard-item rank-${rank <= 3 ? rank : 'other'}`}
              >
                <div className="rank-section">
                  {medal ? (
                    <span className="medal">{medal}</span>
                  ) : (
                    <span className="rank-number">#{rank}</span>
                  )}
                </div>

                <div className="player-section">
                  <div className="player-avatar">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="player-info">
                    <div className="player-name">{name}</div>
                    <div className="player-exp">{exp.toLocaleString()} XP</div>
                  </div>
                </div>

                <div className="coins-section">
                  <div className="coins-icon">🪙</div>
                  <div className="coins-value">{coins.toLocaleString()}</div>
                </div>
              </div>
            );
          })}

          {sortedData.length === 0 && (
            <div className="no-data">
              <p>No players found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveLeaderboard;
