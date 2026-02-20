import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { getPlayerProfile } from '../../utils/api';
import IAPSection from '../../components/IAPSection';
import LiveLeaderboard from '../../components/LiveLeaderboard';
import { usePrivy } from '@privy-io/react-auth';
import './Dashboard.css';

import gameManualPdf from '../../assets/images/Game-manual.pdf';
import connectedBackgroundImage from '../../assets/images/Desktop - After connect.png';
import mobileAfterConnectImage from '../../assets/images/After-mobile.png';

// Tab IDs for mobile
const TAB_HOME = 'home';
const TAB_SHOP = 'shop';
const TAB_LEADERBOARDS = 'leaderboards';

// Leaderboard tabs
const LB_GLOBAL = 'global';
const LB_EVENT = 'event';

const Dashboard = () => {
  const { disconnect, isConnected, address } = useWallet();
  const { ready: privyReady } = usePrivy();
  const navigate = useNavigate();

  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TAB_HOME);
  const [activeLbTab, setActiveLbTab] = useState(LB_GLOBAL);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    getPlayerProfile(address)
      .then(setPlayerData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

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

  if (!isConnected) { navigate('/'); return null; }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader-ring">
          <div></div><div></div><div></div><div></div>
        </div>
        <p>Preparing Battlefield...</p>
      </div>
    );
  }

  const {
    name = 'Warrior',
    walletAddress = '',
    PlayerProfile = {},
    PlayerResources = {},
    PlayerAchievementData = {},
    PlayerGuns = {}
  } = playerData || {};

  const formatWallet = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  const ownedGunsCount = Object.keys(PlayerGuns || {}).length;

  return (
    <div
      className="dashboard-wrapper"
      style={{
        '--desktop-bg': `url(${connectedBackgroundImage})`,
        '--mobile-bg': `url(${mobileAfterConnectImage})`,
      }}
    >
      {/* Header */}
      <header className="dash-header">
        <div className="header-left">
          <div className="brand">
            <span className="brand-icon">W</span>
            <span className="brand-text">WARZONE</span>
          </div>
        </div>
        <div className="header-right">
          <div className="wallet-chip">
            <span className="wallet-dot"></span>
            <span>{formatWallet(walletAddress)}</span>
          </div>
          <button className="btn-logout" onClick={handleDisconnect}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dash-main">
        {/* Profile & Actions Section */}
        <section className={`dash-section profile-section ${activeTab === TAB_HOME ? 'active' : ''}`}>
          <div className="profile-hero">
            <div className="hero-avatar">
              <span>{name.slice(0, 2).toUpperCase()}</span>
              <div className="level-badge">LV {PlayerProfile?.level || 1}</div>
            </div>
            <div className="hero-info">
              <h1 className="hero-name">{name}</h1>
              <p className="hero-title">Warzone Warrior</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon coins-icon"></div>
              <div className="stat-content">
                <span className="stat-value">{(PlayerResources?.coin || 0).toLocaleString()}</span>
                <span className="stat-label">Coins</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon gems-icon"></div>
              <div className="stat-content">
                <span className="stat-value">{(PlayerResources?.gem || 0).toLocaleString()}</span>
                <span className="stat-label">Gems</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon xp-icon"></div>
              <div className="stat-content">
                <span className="stat-value">{(PlayerProfile?.exp || 0).toLocaleString()}</span>
                <span className="stat-label">XP</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon guns-icon"></div>
              <div className="stat-content">
                <span className="stat-value">{ownedGunsCount}</span>
                <span className="stat-label">Guns</span>
              </div>
            </div>
          </div>

          <div className="achievements-row">
            <div className="achievement-item">
              <span className="ach-value">{PlayerAchievementData?.KILL_ENEMY_GENERAL?.progress || 0}</span>
              <span className="ach-label">Generals</span>
            </div>
            <div className="achievement-item">
              <span className="ach-value">{PlayerAchievementData?.KILL_ENEMY?.progress || 0}</span>
              <span className="ach-label">Kills</span>
            </div>
            <div className="achievement-item">
              <span className="ach-value">{PlayerAchievementData?.KILL_ENEMY_TANK?.progress || 0}</span>
              <span className="ach-label">Tanks</span>
            </div>
            <div className="achievement-item">
              <span className="ach-value">{PlayerAchievementData?.KILL_ENEMY_BY_GRENADE?.progress || 0}</span>
              <span className="ach-label">Grenades</span>
            </div>
          </div>

          <div className="action-row">
            <button className="btn-play" onClick={handlePlayGame}>
              <span className="play-icon"></span>
              PLAY NOW
            </button>
            <button className="btn-secondary" onClick={openGameManual}>
              Manual
            </button>
          </div>
        </section>

        {/* Shop Section */}
        <section className={`dash-section shop-section ${activeTab === TAB_SHOP ? 'active' : ''}`}>
          <IAPSection />
        </section>

        {/* Leaderboards Section */}
        <section className={`dash-section leaderboards-section ${activeTab === TAB_LEADERBOARDS ? 'active' : ''}`}>
          {/* Leaderboard Tabs */}
          <div className="lb-tabs">
            <button
              className={`lb-tab ${activeLbTab === LB_GLOBAL ? 'active' : ''}`}
              onClick={() => setActiveLbTab(LB_GLOBAL)}
            >
               <span className="lb-tab-icon">🎮</span>
              <span>Friday Games Arena</span>
              <span className="event-live-dot"></span>
            </button>
            <button
              className={`lb-tab ${activeLbTab === LB_EVENT ? 'active' : ''}`}
              onClick={() => setActiveLbTab(LB_EVENT)}
            >
              <span className="lb-tab-icon">🏆</span>
              <span>Global Rankings</span>
            </button>
          </div>

          {/* Leaderboard Content */}
          <div className="lb-content">
            {activeLbTab === LB_GLOBAL ? (
              
              <LiveLeaderboard
                key={LB_EVENT}
                autoRefresh={true}
                refreshInterval={30000}
                eventName="Friday Gamers Arena"
              />
            ) : (
              <LiveLeaderboard
                key={LB_GLOBAL}
                autoRefresh={true}
                refreshInterval={30000}
                isEvent={true}
              />
             )}
          </div>
        </section>
      </main>

      {/* Mobile Navigation */}
      <nav className="mobile-nav">
        <button
          className={`nav-item ${activeTab === TAB_HOME ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_HOME)}
        >
          <span className="nav-icon home-icon"></span>
          <span>Home</span>
        </button>
        <button
          className={`nav-item ${activeTab === TAB_SHOP ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_SHOP)}
        >
          <span className="nav-icon shop-icon"></span>
          <span>Shop</span>
        </button>
        <button
          className={`nav-item ${activeTab === TAB_LEADERBOARDS ? 'active' : ''}`}
          onClick={() => setActiveTab(TAB_LEADERBOARDS)}
        >
          <span className="nav-icon trophy-icon"></span>
          <span>Ranks</span>
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;
