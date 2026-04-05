import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from '../../contexts/WalletContext';
import LoginModal from '../../components/LoginModal';
import warzoneLogo from '../../assets/logo.png';
import './style.css';

export const Home = () => {
  const { isConnected, address, setUserToken } = useWallet();
  const { ready: privyReady } = usePrivy();
  const [showPrivyLogin, setShowPrivyLogin] = useState(false);
  const navigate = useNavigate();
  const privyConfigured = Boolean(import.meta.env.VITE_PRIVY_APP_ID);

  useEffect(() => {
    if (isConnected && address) navigate('/dashboard');
  }, [isConnected, address, navigate]);

  useEffect(() => {
    if (!isConnected || !address) return;
    setUserToken(address).catch(console.error);
  }, [isConnected, address, setUserToken]);

  return (
    <>
      <div className="home-container">
        {/* Ember particle overlay */}
        <div className="festival-overlay" aria-hidden="true">
          <div className="global-fire">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} className={`global-ember ge${i + 1}`} />
            ))}
          </div>
        </div>

        <div className="content-container">
          <div className="home-action-panel">
            <div className="home-copy-block">
              <div className="home-brand-lockup">
                <img src={warzoneLogo} alt="Warzone Warriors" className="home-brand-logo" />
              </div>
              <p className="home-subtitle">
                Connect your wallet to jump into the dashboard, marketplace, and leaderboard.
              </p>
            </div>

            <div className="button-group-container">
              <div className="connect-button-container">
                {privyConfigured && !privyReady ? (
                  <div
                    className="wz-skeleton wz-skeleton--btn"
                    role="status"
                    aria-live="polite"
                    aria-label="Loading wallet"
                  />
                ) : (
                  <button
                    onClick={() => setShowPrivyLogin(true)}
                    type="button"
                    className="wz-btn wz-btn--lg wz-btn--block wz-btn--primary home-connect-wallet"
                    disabled={!privyConfigured}
                  >
                    <span className="home-connect-icon" aria-hidden="true">
                      ⚔
                    </span>
                    <span className="home-connect-label">
                      {!privyConfigured ? 'Login Unavailable' : 'Connect Wallet'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <LoginModal open={showPrivyLogin} onClose={() => setShowPrivyLogin(false)} />
    </>
  );
};

export default Home;
