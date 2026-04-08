import { defineChain } from 'viem';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
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

const connectors: unknown[] = [
  injected({
    getProvider() {
      return getStableInjectedProvider() ?? undefined;
    },
  } as any),
];

/** Wagmi for IAP / chain hooks — wallet UX is Privy, not RainbowKit */
export const config = createConfig({
  chains: [somniaChain],
  connectors: connectors as never,
  transports: {
    [somniaChain.id]: http('https://api.infra.mainnet.somnia.network'),
  },
});

export default config;
