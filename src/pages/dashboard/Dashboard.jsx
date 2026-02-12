import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { getPlayerProfile, getLeaderboard } from '../../utils/api';
import PlayerProfileCard from '../../components/PlayerProfileCard';
import LiveLeaderboard from '../../components/LiveLeaderboard';
import IAPSection from '../../components/IAPSection';
import { usePrivy } from '@privy-io/react-auth';
import './Dashboard.css';

// Import assets
import connectedBackgroundImage from '../../assets/images/Desktop - After connect.png';
import mobileAfterConnectImage from '../../assets/images/After-mobile.png';
import playGameImage from '../../assets/images/Play-game.png';
import playGameDesktopImage from '../../assets/images/PlayGame-Desktop.png';
import gameManualButtonImage from '../../assets/images/Mobile-Game-manual-button .png';
import gameManualDesktopImage from '../../assets/images/GameManual-Desktop.png';
import disconnectImage from '../../assets/images/disconnect-button.png';
import disconnectDesktopImage from '../../assets/images/Disconnect-Desktop.png';
import gameManualPdf from '../../assets/images/Game-manual.pdf';

const Dashboard = () => {
  const { disconnect, isConnected, address } = useWallet();
  const { ready: privyReady, authenticated: privyAuthenticated } = usePrivy();
  const [playerData, setPlayerData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // Keep isMobile in sync with viewport (fixes orientation changes)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        const data = await getPlayerProfile(address);
        setPlayerData(data);
      } catch (error) {
        console.error('Failed to fetch player data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [address]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setLeaderboardData(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };

    fetchLeaderboard();
    // Refresh leaderboard every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayGame = () => {
    navigate('/game');
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('token');
      navigate('/');
    } catch (error) {
      console.error("Disconnection error:", error);
    }
  };

  const openGameManual = () => {
    window.open(gameManualPdf, '_blank');
  };

  if (!isConnected) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div 
      className="dashboard-container"
      style={{ 
        '--desktop-bg': `url(${connectedBackgroundImage})`,
        '--mobile-bg': `url(${mobileAfterConnectImage})`
      }}
    >
        {/* Festival overlay */}
        <div className="festival-overlay" aria-hidden="true">
          <div className="global-fire">
            <span className="global-ember ge1" />
            <span className="global-ember ge2" />
            <span className="global-ember ge3" />
            <span className="global-ember ge4" />
            <span className="global-ember ge5" />
            <span className="global-ember ge6" />
            <span className="global-ember ge7" />
            <span className="global-ember ge8" />
            <span className="global-ember ge9" />
            <span className="global-ember ge10" />
            <span className="global-ember ge11" />
            <span className="global-ember ge12" />
            <span className="global-ember ge13" />
            <span className="global-ember ge14" />
          </div>
        </div>

        <div className="dashboard-content">
          {/* Left Section - IAP */}
          <div className="dashboard-section left-section">
            <IAPSection />
          </div>

          {/* Center Section - Player Profile Card */}
          <div className="dashboard-section center-section">
            <PlayerProfileCard playerData={playerData} />
            
            {/* Action Buttons */}
            <div className="action-buttons">
              {/* Play Game Button */}
              <button onClick={handlePlayGame} className="action-button play-button">
                <img 
                  src={isMobile ? playGameImage : playGameDesktopImage} 
                  alt="Play Game" 
                />
              </button>
              
              {/* Secondary Buttons - Manual & Disconnect */}
              <div className="secondary-buttons">
                <button onClick={openGameManual} className="action-button manual-button">
                  <img 
                    src={isMobile ? gameManualButtonImage : gameManualDesktopImage} 
                    alt="Game Manual" 
                  />
                </button>
                
                <button onClick={handleDisconnect} className="action-button disconnect-button">
                  <img 
                    src={isMobile ? disconnectImage : disconnectDesktopImage} 
                    alt="Disconnect" 
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Live Leaderboard */}
          <div className="dashboard-section right-section">
            <LiveLeaderboard data={leaderboardData} />
          </div>
        </div>
      </div>
    );
  };
  
  export default Dashboard;
