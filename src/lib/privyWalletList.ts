/**
 * Single source of truth for Privy external wallet list (matches PrivyProvider `appearance.walletList`).
 * A connectWallet call with only one id skips the picker and jumps straight to that connector.
 */
export const PRIVY_WALLET_LIST = [
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
] as const

export type PrivyConfiguredWalletId = (typeof PRIVY_WALLET_LIST)[number]
