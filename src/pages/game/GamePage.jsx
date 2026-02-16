import React, { useState, useRef, useEffect, useCallback } from 'react';
import './GamePage.css';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import centerImage from "../../assets/images/abc1.png";

export const Game = () => {
  const [isLoading, setIsLoading]   = useState(true);
  const [showIframe, setShowIframe] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loadedRef  = useRef(false);
  const iframeRef  = useRef(null);
  const containerRef = useRef(null);
  const hasRunRef  = useRef(false);

  const navigate = useNavigate();
  const { isConnected, address } = useWallet();

  const walletAddress = address || localStorage.getItem('walletAddress');
  const GAME_BASE_URL = import.meta.env.VITE_CLOUDFLARE_R2_GAME_URL || 'https://warzonewarriors.xyz/game';
  const gameUrl = walletAddress
    ? `${GAME_BASE_URL}?walletAddress=${encodeURIComponent(walletAddress)}`
    : GAME_BASE_URL;

  /* ── Fullscreen logic — works on all browsers + iOS workaround ── */
  const requestFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen)            await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen)    await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen)     await el.msRequestFullscreen();
      // iOS Safari doesn't support Fullscreen API — fall back to locking orientation
      else if (iframeRef.current?.requestFullscreen) {
        await iframeRef.current.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen)            await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen)  await document.mozCancelFullScreen();
      else if (document.msExitFullscreen)     await document.msExitFullscreen();
    } catch (e) {
      console.warn('Exit fullscreen failed:', e);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) exitFullscreen();
    else              requestFullscreen();
  }, [isFullscreen, requestFullscreen, exitFullscreen]);

  /* Track fullscreen state changes from browser UI (e.g. Escape key) */
  useEffect(() => {
    const onChange = () => {
      const fsEl = document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullScreenElement
        || document.msFullscreenElement;
      setIsFullscreen(!!fsEl);
    };
    document.addEventListener('fullscreenchange',       onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    document.addEventListener('mozfullscreenchange',    onChange);
    document.addEventListener('MSFullscreenChange',     onChange);
    return () => {
      document.removeEventListener('fullscreenchange',       onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
      document.removeEventListener('mozfullscreenchange',    onChange);
      document.removeEventListener('MSFullscreenChange',     onChange);
    };
  }, []);

  /* ── Access check + show iframe ── */
  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    if (!isConnected && !walletAddress) {
      alert('Please connect your wallet first');
      navigate('/');
      return;
    }

    setShowIframe(true);

    // Fallback: remove loading screen after 6s if iframe onLoad never fires
    const fallback = setTimeout(() => setIsLoading(false), 6000);
    return () => clearTimeout(fallback);
  }, [isConnected, walletAddress, navigate]);

  const handleIframeLoad = () => {
    loadedRef.current = true;
    setIsLoading(false);
  };

  return (
    <div
      ref={containerRef}
      className={`game-page-container${isFullscreen ? ' is-fullscreen' : ''}`}
    >
      {/* Loading screen */}
      {isLoading && (
        <div className="loading-background">
          <div className="center-image">
            <img src={centerImage} alt="Warzone Warriors" className="center-image-content" />
          </div>
          <div className="loading-text">Assembling your Arsenal…</div>
        </div>
      )}

      {/* Top bar with back + fullscreen */}
      {showIframe && (
        <div className="game-topbar">
          <button className="back-to-home-button" onClick={() => navigate('/')}>
            ← HOME
          </button>
          <button className="fullscreen-button" onClick={toggleFullscreen} title="Toggle fullscreen">
            {isFullscreen ? '✕ EXIT FULL' : '⛶ FULLSCREEN'}
          </button>
        </div>
      )}

      {/* Game iframe — full container */}
      {showIframe && (
        <div className="game-iframe-wrapper">
          <iframe
            ref={iframeRef}
            src={gameUrl}
            title="Warzone Warriors"
            className={`game-iframe${!isLoading ? ' loaded' : ''}`}
            onLoad={handleIframeLoad}
            onError={() => setIsLoading(false)}
            allow="fullscreen; autoplay; clipboard-read; clipboard-write; encrypted-media; accelerometer; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
};

export default Game;
