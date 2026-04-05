import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemedBackButton from '../../components/ThemedBackButton';
import { getLeaderboard, getAllTimeLeaderboard } from '../../utils/api';
import ribbonImage from '../../assets/images/image 25.png';
import backgroundImage from '../../assets/images/Rectangle 3.png';
import bottomLeftImage from '../../assets/images/abc3.png';
import bottomRightImage from '../../assets/images/abc2.png';
import './style.css';

export const Leaderboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); // all-time leaderboard (default DB)
  const [loading, setLoading] = useState(true);
  const [festivalUsers, setFestivalUsers] = useState([]); // festival view (all-time from alt DB)
  const [festivalLoading, setFestivalLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI: which leaderboard is visible
  const [activeBoard, setActiveBoard] = useState('all'); // 'all' | 'festival'
  const [highlightFestival, setHighlightFestival] = useState(true); // nudge to click festival
  const [showBurst, setShowBurst] = useState(false); // star burst on switch
  const [pageEntered, setPageEntered] = useState(false); // page opening animation
  const [showOpeningBurst, setShowOpeningBurst] = useState(false);

  // Fetch festival (all-time) data when user switches or on first view
  useEffect(() => {
    if (activeBoard !== 'festival') return;
    if (festivalUsers.length) return; // already loaded

    const fetchAllTime = async () => {
      try {
        setFestivalLoading(true);
        const data = await getAllTimeLeaderboard();
        const formatted = (Array.isArray(data) ? data : []).map((user, index) => ({
          id: index,
          name: user.name || user.walletAddress?.slice(0, 6) + '...' + user.walletAddress?.slice(-4) || `Player ${index + 1}`,
          coins: user?.PlayerResources?.coin || 0,
        }));
        setFestivalUsers(formatted);
      } catch (e) {
        console.error('Failed to fetch all-time leaderboard:', e);
      } finally {
        setFestivalLoading(false);
      }
    };
    fetchAllTime();
  }, [activeBoard, festivalUsers.length]);

  // No countdown shown in festival mode per latest request

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await getLeaderboard();
        // Transform API data to match your component's expected format
        const formattedData = data.map((user, index) => ({
          id:    index,
          name:  user.name || `Player ${index + 1}`,
          coins: user.PlayerResources?.coin || 0,
        }));
        setUsers(formattedData);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Page opening animations
  useEffect(() => {
    const t = setTimeout(() => setPageEntered(true), 30);
    setShowOpeningBurst(true);
    const t2 = setTimeout(() => setShowOpeningBurst(false), 1400);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

  const isFestival = activeBoard === 'festival';
  const headerLabels = isFestival
    ? ['Rank', 'Player', 'Gaming Party Coins']
    : ['Rank', 'Player', 'Coins'];

  if ((loading && !isFestival) || (festivalLoading && isFestival)) {
    return (
      <div className="leaderboard-loading">
        <div className="wz-spinner" aria-hidden="true" />
        <p className="wz-loading-label">Loading ranks</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-error">
        <p className="leaderboard-error-text">{error}</p>
        <button type="button" className="wz-btn wz-btn--primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }
  // Sort respective dataset by points/coins desc
  const dataset = isFestival ? festivalUsers : users;
  const sortedUsers = dataset
    .slice()
    .sort((a, b) => (b.coins || 0) - (a.coins || 0));

  const navigateToHome = () => {
    navigate("/");
  };

  return (
    <div className={`leaderboard ${isFestival ? 'festival-active' : ''} ${pageEntered ? 'page-enter' : ''}`}>
      <img 
        src={backgroundImage} 
        alt="Background" 
        className="leaderboard-background"
      />
      <img 
        src={bottomLeftImage} 
        alt="Bottom Left Decoration" 
        className="leaderboard-decoration-left"
      />
      <div className="decoration-right-container">
        <img 
          src={bottomRightImage} 
          alt="Bottom Right Decoration" 
          className="leaderboard-decoration-right"
        />
        <ThemedBackButton className="back-button" onClick={navigateToHome} compact />
      </div>
      <div className="leaderboard-header-container">
        <div className="ribbon-container">
          <img src={ribbonImage} alt="Ribbon" className="ribbon-image" />
          <span className="ribbon-text">{isFestival ? 'GAMING PARTY' : 'LEADERBOARD'}</span>
        </div>
      </div>

      {isFestival && <div className="star-sky" aria-hidden="true" />}
      {showOpeningBurst && <div className="opening-burst" aria-hidden="true" />}

      {isFestival && (
        <div className="right-strip" aria-hidden="true" title="5 Days Non‑Stop Gameplay">
          <span className="right-strip-label">5 Days Non‑Stop Gameplay</span>
        </div>
      )}

      {/* Container + elegant switch */}
      <div className={`leaderboard-container ${isFestival ? 'festival-theme' : ''}`}>
        {pageEntered && <div className="enter-shine" aria-hidden="true" />}
        <div className="leaderboard-switch" role="tablist" aria-label="Leaderboard mode">
          <div className={`switch-pill ${isFestival ? 'right' : 'left'}`} />
          <button
            className={`switch-option ${activeBoard === 'all' ? 'active' : ''}`}
            onClick={() => setActiveBoard('all')}
            role="tab"
            aria-selected={activeBoard === 'all'}
          >
            <span className="icon" aria-hidden>🏆</span>
            <span className="label">All-time</span>
          </button>
          <button
            className={`switch-option festival-option ${activeBoard === 'festival' ? 'active' : ''} ${!isFestival && highlightFestival ? 'attention' : ''}`}
            onClick={() => {
              setActiveBoard('festival');
              setHighlightFestival(false);
              setShowBurst(true);
              setTimeout(() => setShowBurst(false), 1400);
            }}
            role="tab"
            aria-selected={activeBoard === 'festival'}
            aria-label="Gaming Party Leaderboard — special rewards"
          >
            <span className="icon" aria-hidden>✨</span>
            <span className="label">Gaming Party</span>
          </button>
        </div>

        {showBurst && (
          <div className="fireworks" aria-hidden="true">
            {[0, 1, 2].map((n) => (
              <div key={`fw-${n}`} className={`firework f${n + 1}`}>
                <span className="core" />
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={`spark-${n}-${i}`}
                    className="spark"
                    style={{ '--angle': `${i * 30}deg`, animationDelay: `${n * 120}ms` }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}


        <div className="leaderboard-header">
          {headerLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="leaderboard-content">
          {sortedUsers.map((user, index) => (
            <div
              key={`${isFestival ? 'fest' : 'all'}-${user.id}`}
              className="leaderboard-row row-enter"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="rank">
                <div className={`rank-badge ${index < 3 ? `rank-${index + 1}` : ''}`}>
                  {index + 1}
                </div>
              </div>
              <div className="player-info">
                <span className="player-name">{user.name}</span>
              </div>
              <div className="score">{(user.coins || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
      

    </div>
  );
};

export default Leaderboard;
