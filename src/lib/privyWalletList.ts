/**
 * Single source of truth for Privy external wallet list.
 *
 * Per Privy docs (https://docs.privy.io/recipes/react/wallet-list-configurations):
 * - Named wallets work on both desktop (extension) and mobile (deep link / in-app browser).
 * - `wallet_connect` loads the full WalletConnect relayer + 100-wallet registry; it crashes
 *   when multiple WC SDK versions coexist in the bundle (`publishCustom is not a function`).
 * - `wallet_connect_qr` is desktop-only; skipped here for mobile compatibility.
 *
 * This list matches guess_the_ai_frontend/src/lib/privyConfig.ts.
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
] as const

export type PrivyConfiguredWalletId = (typeof PRIVY_WALLET_LIST)[number]
