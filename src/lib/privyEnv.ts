/** Warzone: WalletConnect Cloud project ID (Privy + Wagmi WalletConnect connector). */
function sanitizeWalletConnectId(raw: string | undefined): string {
  if (!raw || String(raw).includes('YOUR_')) return ''
  return String(raw).trim()
}

export function getWalletConnectProjectId(): string {
  // guess_the_ai_frontend uses VITE_WALLETCONNECT_PROJECT_ID; warzone historically used VITE_WALLET_CONNECT_PROJECT_ID
  const a = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string | undefined
  const b = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined
  return sanitizeWalletConnectId(a) || sanitizeWalletConnectId(b)
}

export function getPrivyAppId(): string {
  return String(import.meta.env.VITE_PRIVY_APP_ID ?? '').trim()
}
