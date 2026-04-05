import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { getPlayerProfile } from '../../utils/api';
import MobileBottomNav from '../../components/MobileBottomNav';
import './Dashboard.css';

import gameManualPdf from '../../assets/images/Game-manual.pdf';
import actionButtonImage from '../../assets/button.png';
import warzoneLogo from '../../assets/logo.png';

const Dashboard = () => {
  const { disconnect, isConnected, address } = useWallet();
  const navigate = useNavigate();

  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletCopied, setWalletCopied] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    getPlayerProfile(address)
      .then(setPlayerData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      ['walletConnected', 'walletAddress', 'token'].forEach((k) => localStorage.removeItem(k));
      navigate('/');
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  };

  const openGameManual = () => window.open(gameManualPdf, '_blank');
  const handleCopyWallet = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setWalletCopied(true);
      window.setTimeout(() => setWalletCopied(false), 1600);
    } catch (e) {
      console.error('Copy wallet failed:', e);
    }
  };

  if (!isConnected) {
    navigate('/');
    return null;
  }

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
    walletAddress = '',
    PlayerResources = {},
    PlayerGuns = {},
  } = playerData || {};

  const formatWallet = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '');
  const ownedGunsCount = Object.keys(PlayerGuns || {}).length;

  const heroStats = [
    { label: 'Coins', value: (PlayerResources?.coin || 0).toLocaleString() },
    { label: 'Gems', value: (PlayerResources?.gem || 0).toLocaleString() },
    { label: 'Guns', value: ownedGunsCount },
  ];

  const navActions = [
    { title: 'Play Now', onClick: () => navigate('/game'), primary: true },
    { title: 'Marketplace', onClick: () => navigate('/iap') },
    { title: 'Leaderboard', onClick: () => navigate('/leaderboard') },
    { title: 'Tournament', onClick: () => navigate('/tournament') },
    { title: 'Manual', onClick: openGameManual },
  ];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-brand-lockup" aria-hidden="true">
        <img src={warzoneLogo} alt="Warzone Warriors" className="dashboard-brand-logo" />
      </div>

      <main className="dash-main">
        <section className="dash-action-cluster">
          <div className="dash-meta-row">
            <button
              type="button"
              className="wz-btn wz-btn--sm wz-btn--outline wz-btn--pill wallet-chip"
              onClick={handleCopyWallet}
              title="Copy wallet address"
            >
              <span className="wallet-dot"></span>
              <span>{walletCopied ? 'Copied' : formatWallet(walletAddress)}</span>
            </button>
            <button type="button" className="wz-btn wz-btn--sm wz-btn--ghost wz-btn--pill btn-logout" onClick={handleDisconnect}>
              Logout
            </button>
          </div>

          <div className="dash-strip">
            {heroStats.map((item) => (
              <div key={item.label} className="dash-stat">
                <span className="dash-stat-value">{item.value}</span>
                <span className="dash-stat-label">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="dash-nav-row">
            {navActions.map((item) => (
              <button
                key={item.title}
                type="button"
                className={`dash-nav-btn ${item.primary ? 'dash-nav-btn-primary' : ''}`}
                onClick={item.onClick}
              >
                <img src={actionButtonImage} alt="" className="dash-nav-btn-image" aria-hidden="true" />
                <span className="dash-nav-btn-title">{item.title}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <MobileBottomNav current="dashboard" />
    </div>
  );
};

export default Dashboard;
