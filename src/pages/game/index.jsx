import React, { useState, useRef, useEffect } from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import centerImage from "../../assets/images/abc1.png";
import topRightImage from "../../assets/images/Frame 74.png";
import topRightAdditionalImage from "../../assets/images/image 32.png";

export const Game = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const loadedRef = useRef(false);
  const iframeRef = useRef(null);
  const navigate = useNavigate();
  const { isConnected, isNFTOwner, checkNFTOwnership, address } = useWallet();
  const hasRunRef = useRef(false);

  // Simple page logger
  const log = (...args) => console.log('[Game]', new Date().toISOString(), ...args);

  const navigateToHome = () => {
    navigate('/');
  };

  const navigateToLeaderboard = () => {
    navigate("/leaderboard");
  };

  useEffect(() => {
    log('mount/useEffect start', { isConnected, address });
    const verifyAccess = async () => {
      log('verifyAccess called');
      if (!isConnected) {
        log('not connected -> redirect home');
        alert('Please connect your wallet first');
        navigateToHome();
        return;
      }
      setShowIframe(true);
      log('setShowIframe(true)');

      // Do not block on network/NFT checks; show game ASAP
      try {
        // Optional: still trigger ownership check in background (non-blocking)
        await checkNFTOwnership(address);
        log('background NFT check invoked');
      } catch (err) {
        console.warn('[Game]', 'Non-fatal: NFT check failed. Proceeding to game.', err);
      }

      // Show the iframe immediately

      // Fallback: if iframe does not fire onLoad (e.g., X-Frame-Options),
      // remove the loading screen after a short timeout to not block UX
      const fallback = setTimeout(() => {
        log('fallback fired (6000ms)', { loaded: loadedRef.current });
        if (!loadedRef.current) {
          setIframeFailed(true);
        }
        setIsLoading(false);
      }, 6000);
      log('fallback timer set (6000ms)');

      return () => clearTimeout(fallback);
    };

    if (hasRunRef.current) { log('effect already ran, skipping'); return; }
    hasRunRef.current = true;
    verifyAccess();
  }, []);

  const handleIframeLoad = () => {
    loadedRef.current = true;
    log('iframe onLoad');
    setIsLoading(false);
    setIframeFailed(false);
  };

  return (
    <div className="game-container">
      {isLoading && (
        <div className="loading-background" style={{display:'flex'}}>
          <div className="center-image">
            <img 
              src={centerImage} 
              alt="Game Center Piece" 
              className="center-image-content"
            />
          </div>
          <div className="center-image-content" style={{maxWidth:'200px',width:"100%",textAlign:'right',fontSize:'40px',fontWeight:'bold',marginRight:'10px',marginBottom:"50px"}}>
            Loading ...
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
        <iframe
          ref={iframeRef}
          src={"https://warzonewarriors.xyz/game"}
          title="Game Content"
          className={`game-iframe ${!isLoading ? 'loaded' : ''}`}
          onLoad={handleIframeLoad}
          onError={() => { log('iframe onError'); setIframeFailed(true); setIsLoading(false); }}
          allow="fullscreen; autoplay; clipboard-read; clipboard-write; encrypted-media; accelerometer; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
      
      <div className={`game-buttons ${!isLoading ? 'hidden' : ''}`}>
        {/* <button 
          onClick={navigateToHome} 
          className="nav-button"
        >
          Go Back
        </button>
        <button 
          onClick={navigateToLeaderboard} 
          className="nav-button"
        >
          Leaderboard
        </button> */}
      </div>
    </div>
  );
};

export default Game;
