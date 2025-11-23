import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from '../../contexts/WalletContext';
import LoginModal from '../../components/LoginModal';
import './style.css';

// Import images
import desktopBeforeConnectImage from '../../assets/images/Desktop-before connect.png';
import mobileBeforeConnectImage from '../../assets/images/BEFORE-Mobile.png';
import connectWalletImage from '../../assets/images/connect-wallet-button.png';
import connectWalletDesktopImage from '../../assets/images/Connect-Desktop.png';

export const Home = () => {
  const { isConnected, address, setUserToken } = useWallet();
  const { ready: privyReady } = usePrivy();
  const [showPrivyLogin, setShowPrivyLogin] = useState(false);
  const navigate = useNavigate();

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected && address) {
      navigate('/dashboard');
    }
  }, [isConnected, address, navigate]);

  // Set user token when connected
  useEffect(() => {
    const handleConnection = async () => {
      if (isConnected && address) {
        try {
          await setUserToken(address);
        } catch (error) {
          console.error('Error setting user token:', error);
        }
      }
    };
    
    handleConnection();
  }, [isConnected, address, setUserToken]);

  const renderPrivyLoginButton = () => {
    if (!privyReady) return null;
    return (
      <button 
        onClick={() => setShowPrivyLogin(true)}
        type="button"
        className="connect-wallet-button"
      >
        <img 
          src={window.innerWidth < 768 ? connectWalletImage : connectWalletDesktopImage} 
          alt="Connect Wallet" 
          className="connect-wallet-image"
        />
      </button>
    );
  };

  return (
    <>
      <div 
        className="home-container"
        style={{ 
          '--desktop-bg': `url(${desktopBeforeConnectImage})`,
          '--mobile-bg': `url(${mobileBeforeConnectImage})`
        }}
      >
        {/* Festival theme overlay */}
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
        <div className="content-container">
          <div className="button-group-container">
            <div className="connect-button-container">
              {renderPrivyLoginButton()}
            </div>
          </div>
        </div>
      </div>
      
      <LoginModal
        open={showPrivyLogin}
        onClose={() => setShowPrivyLogin(false)}
      />
    </>
  );
};

export default Home;