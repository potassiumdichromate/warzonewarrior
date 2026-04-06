import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getLeaderboard, getAllTimeLeaderboard } from '../utils/api';
import './LiveLeaderboard.css';

const LiveLeaderboard = ({
  data,
  autoRefresh = false,
  refreshInterval = 30000,
  isEvent = false,
  eventName = 'Global Leaderboard'
}) => {
  const [globalData, setGlobalData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const requestIdRef = useRef(0);
  const mode = isEvent ? 'event' : 'global';

  const leaderboardData = useMemo(
    () => (mode === 'event' ? eventData : globalData),
    [mode, eventData, globalData]
  );

  useEffect(() => {
    if (data) {
      if (mode === 'event') {
        setEventData(data);
      } else {
        setGlobalData(data);
      }
      setLoading(false);
      setError(null);
    }
  }, [data, mode]);

  useEffect(() => {
    if (!autoRefresh) return;

    let isAlive = true;
    const fetchLeaderboard = async () => {
      const requestId = ++requestIdRef.current;
      try {
        setLoading(true);
        setError(null);
        const freshData = isEvent ? await getAllTimeLeaderboard() : await getLeaderboard();

        // Ignore late/stale responses after tab switch or effect cleanup
        if (!isAlive || requestId !== requestIdRef.current) return;

        if (mode === 'event') {
          setEventData(freshData);
        } else {
          setGlobalData(freshData);
        }
        setLastUpdate(new Date());
      } catch (error) {
        if (!isAlive || requestId !== requestIdRef.current) return;
        console.error('Failed to fetch leaderboard:', error);
        if (mode === 'event') {
          setEventData([]);
        } else {
          setGlobalData([]);
        }
        setError('Unable to load leaderboard data.');
      } finally {
        if (!isAlive || requestId !== requestIdRef.current) return;
        setLoading(false);
      }
    };

    // Initial fetch if no data provided
    if (!data) {
      fetchLeaderboard();
    }

    // Set up interval for auto-refresh
    const interval = setInterval(fetchLeaderboard, refreshInterval);

    return () => {
      isAlive = false;
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, data, isEvent, mode]);

  // Sort data by coins; render full list and let the container scroll
  const sortedData = leaderboardData
    .slice()
    .sort((a, b) => (b.PlayerResources?.coin || 0) - (a.PlayerResources?.coin || 0));

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className={`live-leaderboard${isEvent ? ' event-leaderboard' : ''}`}>
      <div className="leaderboard-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px'}}>
        <h3 className="leaderboard-title">
          <span className="title-icon">{isEvent ? '🎮' : '🏆'}</span>
          {isEvent ? eventName : 'Live Leaderboard'}
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
      ) : error ? (
        <div className="leaderboard-loading">
          <p>{error}</p>
        </div>
      ) : (
        <div className="leaderboard-list" style={{maxHeight:"400px",overflowX:'hidden'}}>
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
