export type NetworkInfo = {
  chainId: string;
  name: string;
  explorer: string;
  symbol: string;
  rpc: string;
};

export type GateAccountNetwork = {
  accountFormat?: string;
  accountFormatName?: string;
  address?: string;
  network?: string;
  accountPublicKey?: string;
};

export type GateAccountInfo = {
  walletName?: string;
  accountName?: string;
  walletId?: string;
  accountNetworkArr?: GateAccountNetwork[];
  moreAddressSort?: string[];
};

export type GateWalletProvider = {
  connect: () => Promise<GateAccountInfo>;
  getAccount?: () => Promise<GateAccountInfo>;
  getGateWalletCurrentNetwork?: () => Promise<NetworkInfo | null>;
  onGateWalletNetworkChanged?: (cb: (res: NetworkInfo | null) => void) => void;
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function getGateWalletProvider(): GateWalletProvider | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as any).gatewallet;
}

export function isGateWalletAvailable(): boolean {
  return Boolean(getGateWalletProvider());
}

export async function connectGateWallet(): Promise<GateAccountInfo> {
  const provider = getGateWalletProvider();
  if (!provider?.connect) throw new Error('Gate Wallet not detected');
  return provider.connect();
}

export function getPrimaryGateWalletAddress(info?: GateAccountInfo | null): string | undefined {
  const networks = info?.accountNetworkArr || [];
  const evm = networks.find((item) => item?.network?.toUpperCase() === 'EVM' && item?.address);
  if (evm?.address) return evm.address;
  const any = networks.find((item) => item?.address);
  return any?.address;
}

declare global {
  interface Window {
    gatewallet?: GateWalletProvider;
  }
}
