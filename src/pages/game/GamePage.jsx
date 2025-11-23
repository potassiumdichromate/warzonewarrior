import React, { useState, useRef, useEffect } from 'react';
import './GamePage.css';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { getPlayerProfile } from '../../utils/api';
import LiveLeaderboard from '../../components/LiveLeaderboard';
import DailyQuests from '../../components/DailyQuests';
import centerImage from "../../assets/images/abc1.png";
import topRightImage from "../../assets/images/Frame 74.png";
import topRightAdditionalImage from "../../assets/images/image 32.png";

export const Game = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showIframe, setShowIframe] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const loadedRef = useRef(false);
  const iframeRef = useRef(null);
  const navigate = useNavigate();
  const { isConnected, address } = useWallet();
  const hasRunRef = useRef(false);

  // Get wallet address from localStorage or wallet context
  const walletAddress = address || localStorage.getItem('walletAddress');

  // Cloudflare R2 bucket URL for the Unity build
  const CLOUDFLARE_R2_GAME_URL = import.meta.env.VITE_CLOUDFLARE_R2_GAME_URL || 'https://warzonewarriors.xyz/game';

  // Construct game URL with wallet address as query parameter
  const gameUrl = walletAddress 
    ? `${CLOUDFLARE_R2_GAME_URL}?walletAddress=${encodeURIComponent(walletAddress)}`
    : CLOUDFLARE_R2_GAME_URL;

  // Simple page logger
  const log = (...args) => console.log('[Game]', new Date().toISOString(), ...args);

  const navigateToHome = () => {
    navigate('/');
  };

  // Fetch player data for daily quests
  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!walletAddress) return;
      
      try {
        const data = await getPlayerProfile(walletAddress);
        setPlayerData(data);
      } catch (error) {
        console.error('Failed to fetch player data:', error);
      }
    };

    fetchPlayerData();
  }, [walletAddress]);

  useEffect(() => {
    log('mount/useEffect start', { isConnected, walletAddress });
    const verifyAccess = async () => {
      log('verifyAccess called');
      if (!isConnected && !walletAddress) {
        log('not connected -> redirect home');
        alert('Please connect your wallet first');
        navigateToHome();
        return;
      }
      
      setShowIframe(true);
      log('setShowIframe(true) with URL:', gameUrl);

      // Fallback: if iframe does not fire onLoad, remove loading screen after timeout
      const fallback = setTimeout(() => {
        log('fallback fired (6000ms)', { loaded: loadedRef.current });
        setIsLoading(false);
      }, 6000);
      log('fallback timer set (6000ms)');

      return () => clearTimeout(fallback);
    };

    if (hasRunRef.current) { log('effect already ran, skipping'); return; }
    hasRunRef.current = true;
    verifyAccess();
  }, [isConnected, walletAddress, gameUrl]);

  const handleIframeLoad = () => {
    loadedRef.current = true;
    log('iframe onLoad');
    setIsLoading(false);
  };

  return (
    <div className="game-page-container">
      {isLoading && (
        <div className="loading-background">
          <div className="center-image">
            <img 
              src={centerImage} 
              alt="Game Center Piece" 
              className="center-image-content"
            />
          </div>
          <div className="loading-text">
            Loading Game...
          </div>
          <div className="top-right-container">
            <div className="top-right-image">
              <img 
                src={topRightImage} 
                alt="Top Right Decoration"
                className="top-image"
              />
            </div>
            <div className="top-right-additional">
              <img 
                src={topRightAdditionalImage} 
                alt="Additional Decoration"
                className="top-image"
              />
            </div>
          </div>
        </div>
      )}
      
      {showIframe && (
        <div className="game-layout">
          {/* Left Section - Live Leaderboard */}
          <div className="game-section left-section">
            <LiveLeaderboard autoRefresh={true} refreshInterval={30000} />
          </div>

          {/* Center Section - Game Iframe with Wrapper */}
          <div className="game-section center-section">
            <div className="game-iframe-wrapper">
              <iframe
                ref={iframeRef}
                src={gameUrl}
                title="Warzone Warriors Game"
                className={`game-iframe ${!isLoading ? 'loaded' : ''}`}
                onLoad={handleIframeLoad}
                onError={() => { 
                  log('iframe onError'); 
                  setIsLoading(false); 
                }}
                allow="fullscreen; autoplay; clipboard-read; clipboard-write; encrypted-media; accelerometer; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            {/* Back button overlay */}
            <button 
              className="back-to-home-button"
              onClick={navigateToHome}
              title="Back to Home"
            >
              ← Home
            </button>
          </div>

          {/* Right Section - Daily Quests */}
          <div className="game-section right-section">
            <DailyQuests questsData={playerData?.PlayerDailyQuestData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;