// Do NOT call stabilizeWindowEthereumForMultiInjectedWallets() here: it pins window.ethereum to one
// extension (MetaMask first), so Privy only sees one injected wallet and skips the multi-wallet UI.
// Wagmi’s injected connector still uses getStableInjectedProvider() in wagmi.config.js for IAP.

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import { config, somniaChain } from './wagmi.config';
import { OptionsController } from '@reown/appkit-controllers';
import { getPrivyAppId, getWalletConnectProjectId } from './lib/privyEnv';
import './index.css';
import App from './App';

// This ensures the Buffer polyfill is available globally
import { Buffer } from 'buffer';
window.Buffer = Buffer;

const walletConnectProjectId = getWalletConnectProjectId();
const privyAppId = getPrivyAppId();

// Same rule as guess_the_ai_frontend: embedded wallets need a secure context (HTTPS) in the browser
const canUseEmbeddedWallets =
  typeof window === 'undefined' || window.isSecureContext;
// Same walletList as guess_the_ai_frontend/src/lib/privyConfig.ts — one list for all devices (no
// shorter mobile-only list, which was hiding most wallets on phones).
const privyWalletList = [
  'metamask',
  'coinbase_wallet',
  'base_account',
  'rainbow',
  'phantom',
  'zerion',
  'cryptocom',
  'uniswap',
  'okx_wallet',
  'bitget_wallet',
  'universal_profile',
  'wallet_connect',
];

// guess_the_ai_frontend does not pass walletConnectCloudProjectId — Privy uses dashboard + defaults.
export const privyConfig = {
  appearance: {
    theme: 'dark',
    accentColor: '#ffc647',
    walletChainType: 'ethereum-only',
    showWalletLoginFirst: true,
    walletList: privyWalletList,
  },
  ...(canUseEmbeddedWallets
    ? {
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }
    : {}),
  loginMethods: ['wallet', 'email', 'google'],
  supportedChains: [somniaChain],
  defaultChain: somniaChain,
  intl: {
    defaultCountry: 'US',
  },
};

if (!walletConnectProjectId) {
  console.warn(
    '[Privy/Wagmi] No WalletConnect project ID. Set VITE_WALLET_CONNECT_PROJECT_ID. Mobile / WalletConnect wallet login will fail without it.'
  );
}

if (!privyAppId) {
  console.warn('VITE_PRIVY_APP_ID is not set. Privy login will be disabled.');
}

OptionsController.setFeatures({ analytics: Boolean(walletConnectProjectId) });

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          color: 'white', 
          backgroundColor: '#ff3333',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.toString()}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#ff3333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

// Check if the root element exists
if (!rootElement) {
  console.error('Root element not found');
} else {
  const root = createRoot(rootElement);
  
  try {
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <PrivyProvider appId={privyAppId} config={privyConfig}>
            <WagmiProvider config={config}>
              <QueryClientProvider client={queryClient}>
                <App />
              </QueryClientProvider>
            </WagmiProvider>
          </PrivyProvider>
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    console.error('Error rendering app:', error);
    root.render(
      <div style={{ 
        padding: '20px', 
        color: 'white', 
        backgroundColor: '#ff3333',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>Critical Error</h1>
        <p>Failed to load the application. Please try refreshing the page.</p>
        <p>Error: {error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: 'white',
            color: '#ff3333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }
}
