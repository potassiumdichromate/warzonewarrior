/**
 * When several extensions inject into the page, `window.ethereum` is often a proxy that must
 * "select" an extension for each RPC. That flow throws opaque errors (e.g. evmAsk.js /
 * selectExtension / "Unexpected error"). Prefer a single concrete provider from
 * `ethereum.providers` or the lone injected provider.
 */
export type Eip1193Provider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

export function getStableInjectedProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') return null
  const eth = (window as unknown as { ethereum?: Eip1193Provider & { providers?: Eip1193Provider[] } })
    .ethereum
  if (!eth) return null

  const rawList = Array.isArray(eth.providers) && eth.providers.length > 0 ? eth.providers : [eth]

  const pickers: Array<(p: Eip1193Provider & Record<string, unknown>) => boolean> = [
    (p) => p.isMetaMask === true,
    (p) => p.isBitKeep === true || p.isBitKeepWallet === true,
    (p) => p.isOkxWallet === true || p.isOKExWallet === true,
    (p) => p.isCoinbaseWallet === true,
    (p) => p.isTrust === true,
    (p) => p.isPhantom === true,
    (p) => p.isBraveWallet === true,
    (p) => typeof p.request === 'function',
  ]

  for (const pick of pickers) {
    const found = rawList.find((p) => pick(p as Eip1193Provider & Record<string, unknown>))
    if (found && typeof found.request === 'function') return found
  }
  return null
}

export function hasStableInjectedProvider(): boolean {
  return Boolean(getStableInjectedProvider()?.request)
}

/**
 * Replace the multi-wallet aggregator on `window.ethereum` with one concrete EIP-1193 provider
 * before Privy / wagmi touch it. Safe to no-op when there is a single provider.
 */
export function stabilizeWindowEthereumForMultiInjectedWallets(): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as { ethereum?: Eip1193Provider & { providers?: Eip1193Provider[] } }
  const eth = w.ethereum
  if (!eth) return

  const providers = eth.providers
  if (!Array.isArray(providers) || providers.length <= 1) return

  const stable = getStableInjectedProvider()
  if (!stable || typeof stable.request !== 'function') return

  w.ethereum = stable as typeof w.ethereum
}
