import { useCallback, useMemo } from 'react';
import { usePrivy, useWallets, useSendTransaction, useFundWallet } from '@privy-io/react-auth';
import { getAllowedChainFromEnv } from '../lib/chain';

// Fallback chain configuration for Somnia mainnet when env vars are not set
const FALLBACK_ALLOWED_CHAIN = {
  caip2: 'eip155:5031',
  decimalChainId: 5031,
  hexChainId: '0x13a7',
  chainName: 'Somnia Mainnet',
  rpcUrls: ['https://api.infra.mainnet.somnia.network'],
  blockExplorerUrls: ['https://explorer.somnia.network'],
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'SOMI',
    decimals: 18,
  },
};

export const getPrimaryPrivyWallet = (user, wallets) => {
  if (!user) return undefined;

  if (user.wallet && user.wallet.address) return user.wallet;

  if (Array.isArray(user.embeddedWallets) && user.embeddedWallets[0]?.address) {
    return user.embeddedWallets[0];
  }

  if (Array.isArray(user.wallets) && user.wallets[0]?.address) {
    return user.wallets[0];
  }

  if (Array.isArray(wallets) && wallets[0]?.address) {
    return wallets[0];
  }

  if (Array.isArray(user.linkedAccounts)) {
    const w = user.linkedAccounts.find((a) => a?.type === 'wallet' && a?.address);
    if (w?.address) return w;
  }

  return undefined;
};

/**
 * Centralized Privy EVM wallet helpers so they can be
 * copy‑pasted into other projects with minimal changes.
 *
 * Exposes:
 *  - canUsePrivy: boolean (ready, authenticated, has wallet)
 *  - activeWallet: Privy wallet object with address
 *  - allowedChain: chain config (from env or Somnia fallback)
 *  - sendPrivyTransaction: raw useSendTransaction sender
 *  - openPrivyFunding: opens Privy's Add funds modal for the active wallet
 */
export const usePrivyWalletTools = () => {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const { fundWallet } = useFundWallet();

  const allowedChain = useMemo(
    () => getAllowedChainFromEnv() || FALLBACK_ALLOWED_CHAIN,
    []
  );

  const activeWallet = useMemo(
    () => getPrimaryPrivyWallet(user, wallets),
    [user, wallets]
  );

  const canUsePrivy = Boolean(
    ready &&
    authenticated &&
    activeWallet &&
    activeWallet.address
  );

  const openPrivyFunding = useCallback(
    async (fundingConfig) => {
      if (!canUsePrivy) {
        throw new Error('Privy wallet is not ready for funding.');
      }
      if (typeof fundWallet !== 'function') {
        throw new Error('Privy wallet funding is not available in this configuration.');
      }
      const address = activeWallet.address;
      if (!address) {
        throw new Error('No Privy wallet address available for funding.');
      }
      const baseConfig =
        allowedChain && allowedChain.decimalChainId
          ? { chain: { id: allowedChain.decimalChainId } }
          : {};

      return fundWallet(address, {
        ...baseConfig,
        ...(fundingConfig || {}),
      });
    },
    [canUsePrivy, fundWallet, activeWallet, allowedChain]
  );

  return {
    privyReady: ready,
    privyAuthenticated: authenticated,
    wallets,
    activeWallet,
    canUsePrivy,
    allowedChain,
    sendPrivyTransaction: sendTransaction,
    openPrivyFunding,
  };
};
