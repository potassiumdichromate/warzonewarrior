// Chain configuration reader and helpers

export type AllowedChainConfig = {
  caip2: string // e.g., eip155:1
  decimalChainId: number // e.g., 1
  hexChainId: `0x${string}` // e.g., 0x1
  chainName?: string
  rpcUrls?: string[]
  blockExplorerUrls?: string[]
  nativeCurrency?: {
    name?: string
    symbol?: string
    decimals?: number
  }
  storageIndexerUrl?: string
}

function parseDecimal(input?: string): number | undefined {
  if (!input) return undefined
  const n = Number(input)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
}

export function getAllowedChainFromEnv(): AllowedChainConfig | null {
  const dec = parseDecimal((import.meta as any).env?.VITE_ALLOWED_CHAIN_ID)
  if (!dec) return null

  const hex = `0x${dec.toString(16)}` as `0x${string}`
  const caip2 = `eip155:${dec}`
  const chainName = (import.meta as any).env?.VITE_ALLOWED_CHAIN_NAME as string | undefined
  const rpc = (import.meta as any).env?.VITE_ALLOWED_RPC_URL as string | undefined
  const explorer = (import.meta as any).env?.VITE_ALLOWED_EXPLORER_URL as string | undefined
  const storageIndexer = (import.meta as any).env?.VITE_ALLOWED_STORAGE_INDEXER as string | undefined
  const currencyName = (import.meta as any).env?.VITE_ALLOWED_NATIVE_NAME as string | undefined
  const currencySymbol = (import.meta as any).env?.VITE_ALLOWED_NATIVE_SYMBOL as string | undefined
  const currencyDecimals = parseDecimal((import.meta as any).env?.VITE_ALLOWED_NATIVE_DECIMALS) ?? 18

  const cfg: AllowedChainConfig = {
    caip2,
    decimalChainId: dec,
    hexChainId: hex,
  }

  if (chainName) cfg.chainName = chainName
  if (rpc) cfg.rpcUrls = [rpc]
  if (explorer) cfg.blockExplorerUrls = [explorer]
  if (storageIndexer) cfg.storageIndexerUrl = storageIndexer
  if (currencyName || currencySymbol || currencyDecimals) {
    cfg.nativeCurrency = {
      name: currencyName,
      symbol: currencySymbol,
      decimals: currencyDecimals,
    }
  }

  return cfg
}
