import { defineChain } from 'viem';
import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { getStableInjectedProvider } from './lib/injectedEthereum';

// Privy + Wagmi: use viem defineChain so custom Somnia is recognized like first-class networks (SIWE chainId).
export const somniaChain = defineChain({
  id: 5031,
  name: 'Somnia',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia',
    symbol: 'SOMI',
  },
  rpcUrls: {
    default: { http: ['https://api.infra.mainnet.somnia.network'] },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network/',
    },
  },
  testnet: false,
});

/** @deprecated Use somniaChain; kept for existing imports */
export const somniaTestnet = somniaChain;

const rawWc = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;
const walletConnectProjectId =
  rawWc && !String(rawWc).includes('YOUR_') ? String(rawWc).trim() : '';

if (!walletConnectProjectId) {
  console.warn(
    '[Wagmi] Set VITE_WALLET_CONNECT_PROJECT_ID (WalletConnect Cloud project ID) for WalletConnect connector.'
  );
}

const connectors: unknown[] = [
  injected({
    getProvider() {
      return getStableInjectedProvider() ?? undefined;
    },
  } as any),
];
if (walletConnectProjectId) {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true,
      metadata: {
        name: 'War Zone Warriors',
        description: 'War Zone Warriors',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://warzonewarriors.xyz',
        icons: [],
      },
    })
  );
}

/** Wagmi for IAP / chain hooks — wallet UX is Privy, not RainbowKit */
export const config = createConfig({
  chains: [somniaChain],
  connectors: connectors as never,
  transports: {
    [somniaChain.id]: http('https://api.infra.mainnet.somnia.network'),
  },
});

export default config;
