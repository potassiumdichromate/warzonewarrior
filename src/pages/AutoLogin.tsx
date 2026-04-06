import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../utils/api';

type DebugInfo = {
  loginType: string;
  walletAddress: string | null;
  timestamp: string;
  referrer: string;
};

// Detect if this page is running inside an iframe
const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin parent — access blocked, which itself confirms we're in an iframe
    return true;
  }
};

export default function AutoLogin() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [status, setStatus] = useState('initializing');
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    loginType: '',
    walletAddress: null,
    timestamp: '',
    referrer: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const walletAddress = params.get('walletAddress');
    const inIframe = isInIframe();

    const info = {
      loginType: inIframe ? 'iframe' : 'direct',
      walletAddress: walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : null,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'none',
    };
    setDebugInfo(info);

    // Tag this session so you can always tell how the user got logged in
    localStorage.setItem('loginType', inIframe ? 'iframe' : 'direct');
    localStorage.setItem('loginTimestamp', info.timestamp);

    if (!walletAddress) {
      setStatus('no_wallet');
      navigate('/', { replace: true });
      return;
    }

    setStatus('logging_in');

    loginUser(walletAddress)
      .then(() => {
        localStorage.setItem('walletConnected', 'true');
        setStatus('success');
      })
      .catch((err) => {
        console.error('[AutoLogin] login failed:', err);
        setStatus('error');
      })
      .finally(() => {
        navigate('/', { replace: true });
      });
  }, [search, navigate]);

  // Status label map for the debug badge
  const statusLabel = {
    initializing: '⏳ Initializing…',
    logging_in: '🔐 Logging in…',
    success: '✅ Logged in',
    error: '❌ Login failed — redirecting',
    no_wallet: '⚠️ No wallet — redirecting',
  }[status] ?? status;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>
          {debugInfo.loginType === 'iframe' ? '🖼 iframe' : '🌐 direct'}
        </div>

        <p style={styles.statusText}>{statusLabel}</p>

        {debugInfo.walletAddress && (
          <p style={styles.meta}>wallet: {debugInfo.walletAddress}</p>
        )}
        <p style={styles.meta}>referrer: {debugInfo.referrer}</p>
        <p style={styles.meta}>at: {debugInfo.timestamp}</p>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    fontFamily: 'monospace',
  },
  card: {
    border: '1px solid #333',
    borderRadius: 8,
    padding: '24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 280,
    background: '#111',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 4,
    background: '#1e3a5f',
    color: '#7ec8ff',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#e0e0e0',
    fontSize: 15,
    margin: 0,
  },
  meta: {
    color: '#555',
    fontSize: 11,
    margin: 0,
  },
};
