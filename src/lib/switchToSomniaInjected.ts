import type { Eip1193Provider } from './injectedEthereum'
import { getStableInjectedProvider } from './injectedEthereum'
import { somniaChain } from '../wagmi.config'

/**
 * Multi-extension browsers expose `window.ethereum` as a proxy (evmAsk.js / selectExtension).
 * RPCs on that proxy often throw "Unexpected error". Prefer a single concrete provider from
 * `ethereum.providers[]`; fall back to `window.ethereum` only if needed (guess_the_ai style).
 */
function buildAddEthereumChainParams() {
  const http = somniaChain.rpcUrls?.default?.http ?? []
  const explorer = somniaChain.blockExplorers?.default?.url
  return {
    chainId: `0x${somniaChain.id.toString(16)}`,
    chainName: somniaChain.name,
    nativeCurrency: somniaChain.nativeCurrency,
    rpcUrls: [...http],
    blockExplorerUrls: explorer ? [explorer] : [],
  }
}

function getEthereumForChainOps(): Eip1193Provider | null {
  if (typeof window === 'undefined') return null
  const stable = getStableInjectedProvider()
  if (stable?.request) return stable
  const w = window as unknown as { ethereum?: Eip1193Provider }
  if (w.ethereum && typeof w.ethereum.request === 'function') return w.ethereum
  return null
}

/**
 * Match GUESS: require Somnia (5031) on the injected provider before Privy wallet login so SIWE
 * uses chain ID 5031, not Ethereum mainnet.
 */
export async function ensureInjectedChainToSomnia(): Promise<boolean> {
  const ethereum = getEthereumForChainOps()
  if (!ethereum?.request) return true

  const targetChainId = `0x${somniaChain.id.toString(16)}`
  try {
    const current = await ethereum.request({ method: 'eth_chainId' })
    if (typeof current === 'string' && current.toLowerCase() === targetChainId.toLowerCase()) {
      return true
    }
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    })
    return true
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: number }).code : undefined
    if (code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [buildAddEthereumChainParams()],
        })
        return true
      } catch (addErr) {
        console.error('[Privy] chain add failed', addErr)
        return false
      }
    }
    console.error('[Privy] chain switch failed', err)
    return false
  }
}
