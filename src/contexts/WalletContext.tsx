import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useAccount, useDisconnect, useConnect, useSwitchChain, useChainId, useConnectors } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { loginUser } from '../utils/api';
import { createPublicClient, http } from 'viem';
import { buildApiUrl } from '../config/api';
import { getStableInjectedProvider } from '../lib/injectedEthereum';

const DEBUG_LOGIN_TRACE = String(import.meta.env.VITE_DEBUG_LOGIN_TRACE || '').toLowerCase() === 'true';
const trace = (...args: unknown[]) => {
  if (DEBUG_LOGIN_TRACE) {
    console.log('[wallet-trace]', ...args);
  }
};

// Somnia Network Configuration (Mainnet)
export const somniaTestnet = {
  id: 5031,
  name: 'Somnia',
  network: 'somnia',
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'SOMI',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://api.infra.mainnet.somnia.network'] },
    public: { http: ['https://api.infra.mainnet.somnia.network'] },
  },
  blockExplorers: {
    default: { 
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network/',
    },
  },
  testnet: false,
};

// NFT Contract Addresses from environment variables
console.log('Environment variables:', import.meta.env);
const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_APP_NFT_CONTRACT_ADDRESS ?? "0xe5cB757613bE827b836029d5E2700D76466745BD";
const NFT_CONTRACT_ADDRESS_2 = import.meta.env.VITE_APP_NFT_CONTRACT_ADDRESS_2 ?? "0xf4aacc6576b9749c3c7aab51f3050027f5a720be";
console.log('NFT Contract Address 1:', NFT_CONTRACT_ADDRESS);
console.log('NFT Contract Address 2:', NFT_CONTRACT_ADDRESS_2);

export type WalletContextValue = {
  isConnected: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setUserToken: (address: string) => Promise<unknown>;
  isNFTOwner: boolean;
  checkNFTOwnership: (walletAddress?: string | null) => Promise<boolean>;
  switchToSomnia: () => Promise<boolean>;
};

const defaultWalletContext: WalletContextValue = {
  isConnected: false,
  address: null,
  connect: async () => {},
  disconnect: async () => {},
  setUserToken: async () => null,
  isNFTOwner: false,
  checkNFTOwnership: async () => false,
  switchToSomnia: async () => false,
};

const WalletContext = createContext<WalletContextValue>(defaultWalletContext);

function readStoredSession() {
  if (typeof window === 'undefined') {
    return { walletAddress: null, token: null };
  }

  const walletAddress = localStorage.getItem('walletAddress');
  const token = localStorage.getItem('token');
  return { walletAddress, token };
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isNFTOwner, setIsNFTOwner] = useState(false);
  const backendLoginSentRef = useRef(null);
  const backendLoginSentFromConnectedRef = useRef(null);
  const [privyAddress, setPrivyAddress] = useState(null);
  const [storedSession, setStoredSession] = useState(readStoredSession);
  
  // Wagmi hooks (optional path alongside Privy)
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const { ready: privyReady, authenticated: privyAuthenticated, user: privyUser, logout: privyLogout } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  
  // Handle disconnection
  const handleDisconnect = useCallback(async () => {
    try {
      backendLoginSentRef.current = null;
      backendLoginSentFromConnectedRef.current = null;
      disconnect();
      setIsNFTOwner(false);
      setPrivyAddress(null);
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('token');
      localStorage.removeItem('Intraverse');
      localStorage.removeItem('intraverseUserId');
      localStorage.removeItem('intraverseUserInfo');
      setStoredSession({ walletAddress: null, token: null });

      // Always attempt Privy logout — privyAuthenticated may be false on mobile
      // even when the user has an active wallet session
      if (privyLogout) {
        try {
          await privyLogout();
        } catch (err) {
          console.error('Error logging out of Privy:', err);
        }
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }, [disconnect, privyLogout]);

  useEffect(() => {
    const syncStoredSession = () => {
      setStoredSession(readStoredSession());
    };

    window.addEventListener('storage', syncStoredSession);
    window.addEventListener('intraverse-user-saved', syncStoredSession);
    return () => {
      window.removeEventListener('storage', syncStoredSession);
      window.removeEventListener('intraverse-user-saved', syncStoredSession);
    };
  }, []);
  
  // Check if wallet is connected on mount and on address change
  useEffect(() => {
    const checkConnection = async () => {
      if (wagmiIsConnected && wagmiAddress) {
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', wagmiAddress);

        // Check NFT ownership when wallet is connected
        try {
          await setUserToken(wagmiAddress);

          // const hasNFT = await checkNFTOwnership(wagmiAddress);
          setIsNFTOwner(true);
        } catch (error) {
          console.error('Error checking NFT ownership:', error);
        }
      }
    };

    checkConnection();
  }, [wagmiIsConnected, wagmiAddress]);

  // Prefer external (injected) wallet from linkedAccounts — matches Privy + GUESS_THE_AI flow
  // so MetaMask / Bitget / OKX logins resolve the correct address for /login.
  const getPrimaryPrivyAddress = useCallback((user, wallets) => {
    if (!user) return undefined;
    const linked = Array.isArray(user.linkedAccounts) ? user.linkedAccounts : [];
    const isEmbedded = (a) => String(a?.connectorType || '').toLowerCase() === 'embedded';

    const externalLinked = linked.find(
      (a) => a?.type === 'wallet' && a?.address && !isEmbedded(a)
    );
    if (externalLinked?.address) return externalLinked.address;

    if (user.wallet?.address && !isEmbedded(user.wallet)) {
      return user.wallet.address;
    }

    if (user.wallet?.address) return user.wallet.address;

    if (Array.isArray(user.embeddedWallets) && user.embeddedWallets[0]?.address) {
      return user.embeddedWallets[0].address;
    }
    if (Array.isArray(user.wallets) && user.wallets[0]?.address) {
      return user.wallets[0].address;
    }
    if (Array.isArray(wallets) && wallets[0]?.address) {
      return wallets[0].address;
    }
    const anyWallet = linked.find((a) => a?.type === 'wallet' && a?.address);
    if (anyWallet?.address) return anyWallet.address;
    return undefined;
  }, []);

  useEffect(() => {
    if (!privyAuthenticated) {
      backendLoginSentRef.current = null;
    }
  }, [privyAuthenticated]);

  useEffect(() => {
    if (!privyAuthenticated) {
      backendLoginSentFromConnectedRef.current = null;
    }
  }, [privyAuthenticated]);

  
  
  // Check NFT ownership using direct blockchain verification
  const checkNFTOwnership = useCallback(async (walletAddress) => {
    console.log('Starting NFT ownership check for:', walletAddress);
    if (!walletAddress) {
      console.log('No wallet address provided');
      return false;
    }

    try {
      // First try to use the injected provider from Wagmi / browser
      const w = window as Window & { web3?: { currentProvider?: unknown } };
      const provider = window.ethereum || (w.web3 && w.web3.currentProvider);
      
      // If no provider is found, check for WalletConnect or other injected providers
      if (!provider) {
        // Try to detect if we're in a mobile web environment
        if (window.ethereum?.isMetaMask || 
            window.ethereum?.isTrust || 
            window.ethereum?.isStatus ||
            window.ethereum?.isImToken) {
          // We have an injected provider
          console.log('Using injected provider for NFT check');
        } else if (w.web3) {
          // Legacy web3 provider
          console.log('Using legacy web3 provider for NFT check');
        } else {
          // No provider detected, might be mobile web
          console.log('No Web3 provider detected, might be mobile web');
          // For mobile web, we should use WalletConnect or similar
          // For now, we'll just return false and log the issue
          console.warn('Web3 provider not found. Please use a Web3-compatible browser or wallet.');
          setIsNFTOwner(true);
          return false;
        }
      }

      console.log('Checking NFT ownership via blockchain...');
      const hasNFT = await checkNFTOwnershipDirect(walletAddress);
      console.log("has NFT ",hasNFT)
      setIsNFTOwner(hasNFT);
      return hasNFT;
      
    } catch (error) {
      console.error('Blockchain check failed:', error);
      // In case of error, we'll assume no NFT to avoid blocking the user
      // You might want to implement a fallback API check here
      // setIsNFTOwner(false);
      return true;
    }
  }, [wagmiAddress]);

  // Blockchain check using viem
  // const checkNFTOwnershipDirect = async (walletAddress) => {
    
  //   try {
    
  //     if (!window.ethereum) {
  //       throw new Error('No Ethereum provider available');
  //     }

  //     // ERC-721 ABI with balanceOf and supportsInterface
  //     const erc721ABI = [
  //       {
  //         "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
  //         "name": "balanceOf",
  //         "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
  //         "stateMutability": "view",
  //         "type": "function"
  //       },
  //       {
  //         "inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}],
  //         "name": "supportsInterface",
  //         "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
  //         "stateMutability": "view",
  //         "type": "function"
  //       }
  //     ];

  //     console.log('Calling balanceOf for address:', walletAddress);
      
  //     // Create a public client for read operations
  //     const publicClient = createPublicClient({
  //       chain: somniaTestnet,
  //       transport: http('https://dream-rpc.somnia.network')
  //     });

  //     // Check if contract supports ERC721 interface
  //     console.log('Checking if contract supports ERC721 interface...');
  //     const isERC721 = await publicClient.readContract({
  //       address: NFT_CONTRACT_ADDRESS,
  //       abi: erc721ABI,
  //       functionName: 'supportsInterface',
  //       args: ['0x80ac58cd'] // ERC721 interface ID
  //     });

  //     if (!isERC721) {
  //       console.error('Contract does not support ERC721 interface');
  //       return false;
  //     }
      
  //     console.log('Sending balanceOf request...');
  //     const balance = await publicClient.readContract({
  //       address: NFT_CONTRACT_ADDRESS,
  //       abi: erc721ABI,
  //       functionName: 'balanceOf',
  //       args: [walletAddress]
  //     });
      
  //     const hasNFT = BigInt(balance) > 0n;
  //     console.log('NFT check result:', { 
  //       balance: balance.toString(),
  //       hasNFT,
  //       contractAddress: NFT_CONTRACT_ADDRESS,
  //       chainId: somniaTestnet.id
  //     });
      
  //     return hasNFT;
      
  //   } catch (error) {
  //     console.error('Error in direct NFT check:', {
  //       message: error.message,
  //       code: error.code,
  //       data: error.data,
  //       stack: error.stack,
  //       contractAddress: NFT_CONTRACT_ADDRESS,
  //       walletAddress: walletAddress
  //     });
  //     throw error; // Re-throw to be handled by the caller
  //   }
  // };

  // Blockchain check using viem via Ankr RPC (checks both NFT contracts)
  const checkNFTOwnershipDirect = async (walletAddress) => {
    try {
      console.log("1.walletADdress: ",walletAddress)
      if (!walletAddress) throw new Error('No wallet address provided');

      const erc721ABI = [
        {
          inputs: [{ internalType: "address", name: "owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ];

      const publicClient = createPublicClient({
        chain: somniaTestnet,
        transport: http('https://api.infra.mainnet.somnia.network'),
      });

      // Function to check a single contract
      const checkContract = async (contractAddress) => {
        try {
          const balance = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: erc721ABI,
            functionName: 'balanceOf',
            args: [walletAddress as `0x${string}`],
          } as never);
          return BigInt(String(balance)) > 0n;
        } catch (error) {
          console.error(`Error checking NFT contract ${contractAddress}:`, error);
          return false;
        }
      };

      // Check both contracts in parallel
      const [hasNFT1, hasNFT2] = await Promise.all([
        checkContract(NFT_CONTRACT_ADDRESS),
        checkContract(NFT_CONTRACT_ADDRESS_2)
      ]);

      const hasNFT = hasNFT1 || hasNFT2;
      console.log('NFT check result:', {
        hasNFT1,
        hasNFT2,
        hasAnyNFT: hasNFT,
        contract1: NFT_CONTRACT_ADDRESS,
        contract2: NFT_CONTRACT_ADDRESS_2,
        chainId: somniaTestnet.id,
      });

      return hasNFT;
    } catch (error) {
      console.error('Error in NFT ownership check:', {
        message: error?.message,
        code: error?.code,
        data: error?.data,
        stack: error?.stack,
        walletAddress,
      });
      return true;
    }
  };



  // Switch to Somnia network
  const switchToSomnia = useCallback(async () => {
    // Never throw; return boolean so UI can gracefully proceed
    try {
      if (chainId === somniaTestnet.id) return true;

      try {
        await switchChain({ chainId: somniaTestnet.id });
        return true;
      } catch (switchError) {
        console.error('Error switching to Somnia:', switchError);

        if (switchError?.code === 4902) {
          try {
            const injected = typeof window !== 'undefined' ? getStableInjectedProvider() : null;
            if (injected?.request) {
              await injected.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${somniaTestnet.id.toString(16)}`,
                  chainName: somniaTestnet.name,
                  nativeCurrency: somniaTestnet.nativeCurrency,
                  rpcUrls: [somniaTestnet.rpcUrls.public.http[0]],
                  blockExplorerUrls: somniaTestnet.blockExplorers ? [somniaTestnet.blockExplorers.default.url] : []
                }]
              });
              return true;
            }
            console.warn('No ethereum provider available to add chain.');
            return false;
          } catch (addError) {
            console.error('Failed to add Somnia network:', addError);
            return false;
          }
        }

        if (switchError?.code === 4001) {
          console.warn('User rejected network switch. Proceeding.');
          return false;
        }
        return false;
      }
    } catch (error) {
      console.error('Error in switchToSomnia (non-fatal):', error);
      return false;
    }
  }, [chainId, switchChain]);

  const checkPlayerName = useCallback(async (walletAddress) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await fetch(buildApiUrl(`/name?walletAddress=${walletAddress}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error checking player name:', error);
      return null;
    }
  }, []);

  const setUserToken = useCallback(async (_address) => {
    try {
      if (!_address) {
        throw new Error('Could not get wallet address');
      }
      trace('setUserToken:start', { address: _address });
      
      const loginResult = await loginUser(_address);
      trace('setUserToken:loginUser:done', { hasToken: Boolean(loginResult?.token) });
      if (loginResult.token) {
        localStorage.setItem('token', loginResult.token);
        localStorage.setItem('walletAddress', _address);
        const playerInfo = await checkPlayerName(_address);
        trace('setUserToken:checkPlayerName:done', { hasPlayerInfo: Boolean(playerInfo) });
        return playerInfo;
      }
      trace('setUserToken:noToken');
      return null;  
    } catch (error) {
      console.error("Wallet connection error:", error);
      trace('setUserToken:error', error);
      return null;
    }
  }, [checkPlayerName]);

  // When a Privy session is authenticated, mirror it into our wallet state
  useEffect(() => {
    if (!privyReady || !privyAuthenticated) return;
    trace('privySession:authenticated', {
      privyReady,
      privyAuthenticated,
      wallets: Array.isArray(privyWallets) ? privyWallets.length : 0,
    });

    const addr = getPrimaryPrivyAddress(privyUser, privyWallets);
    if (!addr) {
      trace('privySession:noAddressResolved');
      return;
    }
    trace('privySession:addressResolved', { addr });

    setPrivyAddress(addr);

    const stored = localStorage.getItem('walletAddress');
    const token = localStorage.getItem('token');
    if (token && stored && stored.toLowerCase() === addr.toLowerCase()) {
      backendLoginSentRef.current = addr;
      localStorage.setItem('walletConnected', 'true');
      trace('privySession:alreadyLoggedIn', { addr });
      return;
    }

    backendLoginSentRef.current = addr;

    (async () => {
      try {
        await setUserToken(addr);
        if (!localStorage.getItem('token')) {
          console.error('[WalletContext] Backend /login failed after Privy auth; address:', addr);
          trace('privySession:backendLoginFailed', { addr });
          backendLoginSentRef.current = null;
          return;
        }
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', addr);
        trace('privySession:backendLoginSuccess', { addr });
      } catch (err) {
        console.warn('Failed to persist Privy wallet info:', err);
        trace('privySession:persistFailed', err);
        backendLoginSentRef.current = null;
      }
    })();
  }, [privyReady, privyAuthenticated, privyUser, privyWallets, getPrimaryPrivyAddress, setUserToken]);

  // Mobile fallback: if wallet is connected but Privy auth is delayed, still try backend login by address.
  // This unblocks gameplay flows that only require wallet address + backend token.
  useEffect(() => {
    if (!privyReady || privyAuthenticated) return;
    const connectedAddr = Array.isArray(privyWallets) ? privyWallets[0]?.address : undefined;
    trace('privyConnectedFallback:check', {
      privyReady,
      privyAuthenticated,
      connectedAddr: connectedAddr || null,
      wallets: Array.isArray(privyWallets) ? privyWallets.length : 0,
    });
    if (!connectedAddr) return;

    setPrivyAddress(connectedAddr);
    const stored = localStorage.getItem('walletAddress');
    const token = localStorage.getItem('token');
    if (token && stored && stored.toLowerCase() === connectedAddr.toLowerCase()) {
      localStorage.setItem('walletConnected', 'true');
      trace('privyConnectedFallback:alreadyLoggedIn', { connectedAddr });
      backendLoginSentFromConnectedRef.current = connectedAddr;
      return;
    }

    if (
      backendLoginSentFromConnectedRef.current &&
      String(backendLoginSentFromConnectedRef.current).toLowerCase() === connectedAddr.toLowerCase()
    ) {
      trace('privyConnectedFallback:skipDuplicate', { connectedAddr });
      return;
    }

    backendLoginSentFromConnectedRef.current = connectedAddr;
    trace('privyConnectedFallback:loginAttempt', { connectedAddr });
    (async () => {
      try {
        await setUserToken(connectedAddr);
        const nextToken = localStorage.getItem('token');
        if (!nextToken) {
          trace('privyConnectedFallback:loginFailedNoToken', { connectedAddr });
          backendLoginSentFromConnectedRef.current = null;
          return;
        }
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', connectedAddr);
        trace('privyConnectedFallback:loginSuccess', { connectedAddr });
      } catch (err) {
        trace('privyConnectedFallback:loginError', err);
        backendLoginSentFromConnectedRef.current = null;
      }
    })();
  }, [privyReady, privyAuthenticated, privyWallets, setUserToken]);

  const connectWallet = useCallback(async () => {
    try {
      const connector = connectors[0];
      if (!connector) {
        console.error('No wagmi connector available');
        return;
      }
      const result = await connectAsync({ connector });
      const accountAddress = result.accounts[0];
      if (accountAddress) {
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', accountAddress);
        console.log('calling 1 ', accountAddress);
        try {
          const hasNFT = await checkNFTOwnership(accountAddress);
          setIsNFTOwner(hasNFT);
        } catch (error) {
          console.error('Error checking NFT ownership:', error);
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }, [connectAsync, connectors, checkNFTOwnership]);

  // Enforce Somnia network whenever connected or chain changes
  useEffect(() => {
    const ensureSomnia = async () => {
      try {
        if (wagmiIsConnected && chainId !== somniaTestnet.id) {
          await switchToSomnia();
        }
      } catch (e) {
        console.warn('Enforcing Somnia network failed:', e);
      }
    };
    ensureSomnia();
  }, [wagmiIsConnected, chainId, switchToSomnia]);

  const sessionAddress = storedSession.walletAddress || null;
  const sessionConnected = Boolean(storedSession.walletAddress && storedSession.token);
  const effectiveAddress = wagmiAddress || privyAddress || sessionAddress;
  const hasConnectedPrivyWallet = Boolean(Array.isArray(privyWallets) && privyWallets[0]?.address);
  const isPrivyConnected = Boolean((privyReady && privyAuthenticated && privyAddress) || (privyReady && hasConnectedPrivyWallet));
  const effectiveIsConnected = Boolean(wagmiIsConnected || isPrivyConnected || sessionConnected);

  return (
    <WalletContext.Provider
      value={{
        isConnected: effectiveIsConnected,
        address: effectiveAddress,
        connect: connectWallet,
        disconnect: handleDisconnect,
        isNFTOwner,
        checkNFTOwnership,
        switchToSomnia,
        setUserToken
      }}
    >
      {children}
    </WalletContext.Provider>
  );

};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
