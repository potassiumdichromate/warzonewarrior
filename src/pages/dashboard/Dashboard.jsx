import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { getPlayerProfile, getLeaderboard } from '../../utils/api';
import PlayerProfileCard from '../../components/PlayerProfileCard';
import LiveLeaderboard from '../../components/LiveLeaderboard';
import IAPSection from '../../components/IAPSection';
import { usePrivy } from '@privy-io/react-auth';
import './Dashboard.css';

// Assets
import connectedBackgroundImage  from '../../assets/images/Desktop - After connect.png';
import mobileAfterConnectImage   from '../../assets/images/After-mobile.png';
import playGameImage             from '../../assets/images/Play-game.png';
import playGameDesktopImage      from '../../assets/images/PlayGame-Desktop.png';
import gameManualButtonImage     from '../../assets/images/Mobile-Game-manual-button .png';
import gameManualDesktopImage    from '../../assets/images/GameManual-Desktop.png';
import disconnectImage           from '../../assets/images/disconnect-button.png';
import disconnectDesktopImage    from '../../assets/images/Disconnect-Desktop.png';
import gameManualPdf             from '../../assets/images/Game-manual.pdf';

// Tab IDs
const TAB_PROFILE     = 'profile';
const TAB_IAP         = 'iap';
const TAB_LEADERBOARD = 'leaderboard';

const Dashboard = () => {
  const { disconnect, isConnected, address } = useWallet();
  const { ready: privyReady } = usePrivy();
  const navigate = useNavigate();

  const [playerData,     setPlayerData]     = useState(null);
  const [leaderboardData,setLeaderboardData] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [isMobile,       setIsMobile]       = useState(window.innerWidth <= 768);
  // mobile: which tab is selected — default to profile
  const [activeTab,      setActiveTab]      = useState(TAB_PROFILE);

  /* ── Track viewport ── */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── Data fetching ── */
  useEffect(() => {
    if (!address) return;
    setLoading(true);
    getPlayerProfile(address)
      .then(setPlayerData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  useEffect(() => {
    const fetch = () => getLeaderboard().then(setLeaderboardData).catch(console.error);
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, []);

  /* ── Handlers ── */
  const handlePlayGame = () => navigate('/game');

  const handleDisconnect = async () => {
    try {
      await disconnect();
      ['walletConnected', 'walletAddress', 'token'].forEach(k => localStorage.removeItem(k));
      navigate('/');
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  };

  const openGameManual = () => window.open(gameManualPdf, '_blank');

  /* ── Guards ── */
  if (!isConnected) { navigate('/'); return null; }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading Dashboard…</p>
      </div>
    );
  }

  /* ── Responsive image helper (reactive, not one-shot) ── */
  const img = (mobile, desktop) => isMobile ? mobile : desktop;

  /* ── Render ── */
  return (
    <div
      className="dashboard-container"
      style={{
        '--desktop-bg': `url(${connectedBackgroundImage})`,
        '--mobile-bg':  `url(${mobileAfterConnectImage})`,
      }}
    >
      {/* Fire overlay */}
      <div className="festival-overlay" aria-hidden="true">
        <div className="global-fire">
          {[...Array(14)].map((_, i) => (
            <span key={i} className={`global-ember ge${i + 1}`} />
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="dashboard-content">

        {/* LEFT — IAP/Marketplace */}
        <div className={`dashboard-section left-section${isMobile && activeTab === TAB_IAP ? ' tab-active' : ''}`}>
          <IAPSection />
        </div>

        {/* CENTER — Profile + Action Buttons */}
        <div className="dashboard-section center-section">
          <PlayerProfileCard playerData={playerData} />

          <div className="action-buttons">
            <button onClick={handlePlayGame} className="action-button play-button">
              <img src={img(playGameImage, playGameDesktopImage)} alt="Play Game" />
            </button>
            <div className="secondary-buttons">
              <button onClick={openGameManual} className="action-button manual-button">
                <img src={img(gameManualButtonImage, gameManualDesktopImage)} alt="Game Manual" />
              </button>
              <button onClick={handleDisconnect} className="action-button disconnect-button">
                <img src={img(disconnectImage, disconnectDesktopImage)} alt="Disconnect" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — Leaderboard */}
        <div className={`dashboard-section right-section${isMobile && activeTab === TAB_LEADERBOARD ? ' tab-active' : ''}`}>
          <LiveLeaderboard data={leaderboardData} />
        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <nav className="mobile-dashboard-tabs" aria-label="Dashboard sections">
          <button
            className={`dash-tab-btn${activeTab === TAB_IAP ? ' active' : ''}`}
            onClick={() => setActiveTab(TAB_IAP)}
          >
            <span className="tab-icon">🛒</span>
            SHOP
          </button>
          <button
            className={`dash-tab-btn${activeTab === TAB_PROFILE ? ' active' : ''}`}
            onClick={() => setActiveTab(TAB_PROFILE)}
          >
            <span className="tab-icon">⚔️</span>
            PROFILE
          </button>
          <button
            className={`dash-tab-btn${activeTab === TAB_LEADERBOARD ? ' active' : ''}`}
            onClick={() => setActiveTab(TAB_LEADERBOARD)}
          >
            <span className="tab-icon">🏆</span>
            RANKS
          </button>
        </nav>
      )}
    </div>
  );
};

export default Dashboard;
