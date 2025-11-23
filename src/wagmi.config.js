import { http, createConfig } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Define the Somnia Mainnet chain
export const somniaTestnet = {
  id: 5031,
  name: 'Somnia',
  network: 'somnia',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia',
    symbol: 'SOMI',
  },
  rpcUrls: {
    default: { http: ['https://api.infra.mainnet.somnia.network'] },
    public: { http: ['https://api.infra.mainnet.somnia.network'] },
  },
  blockExplorers: {
    default: { 
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network/',
      apiUrl: 'https://explorer.somnia.network/api'
    },
  },
  testnet: false,
};

// Get the WalletConnect Project ID from environment variables
const walletConnectProjectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

if (!walletConnectProjectId) {
  console.warn('Warning: VITE_WALLET_CONNECT_PROJECT_ID is not set in .env file');
}

// Create the Wagmi config with all connectors
export const config = getDefaultConfig({
  appName: 'War Zone Warriors',
  projectId: walletConnectProjectId || 'default-project-id',
  // Only allow Somnia (Mainnet)
  chains: [somniaTestnet],
  ssr: true,
  // Add custom transports if needed
  ...(somniaTestnet && {
    transports: {
      [somniaTestnet.id]: http('https://api.infra.mainnet.somnia.network'),
    },
  })
});

export default config;
