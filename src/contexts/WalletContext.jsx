import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useDisconnect, useConnect, useSwitchChain, useChainId } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, zora } from 'wagmi/chains';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { loginUser } from '../utils/api';
import { createPublicClient, http } from 'viem';
import { buildApiUrl } from '../config/api';

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

const WalletContext = createContext({
  isConnected: false,
  address: null,
  connect: () => {},
  disconnect: () => {},
  setUserToken: () => {},
  isNFTOwner: false,
  checkNFTOwnership: async () => false,
  switchToSomnia: async () => {}
});

export const WalletProvider = ({ children }) => {
  const [isNFTOwner, setIsNFTOwner] = useState(false);
  const backendLoginSentRef = useRef(null);
  const [privyAddress, setPrivyAddress] = useState(null);
  
  // RainbowKit hooks
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const { ready: privyReady, authenticated: privyAuthenticated, user: privyUser, logout: privyLogout } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  
  // Handle disconnection
  const handleDisconnect = useCallback(async () => {
    try {
      disconnect();
      setIsNFTOwner(false);
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('token');

      if (privyAuthenticated && privyLogout) {
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
  }, [disconnect, privyAuthenticated, privyLogout]);
  
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

  // Derive a primary wallet address from Privy user + wallets
  const getPrimaryPrivyAddress = useCallback((user, wallets) => {
    if (!user) return undefined;
    if (user.wallet && user.wallet.address) return user.wallet.address;
    if (Array.isArray(user.embeddedWallets) && user.embeddedWallets[0]?.address) {
      return user.embeddedWallets[0].address;
    }
    if (Array.isArray(user.wallets) && user.wallets[0]?.address) {
      return user.wallets[0].address;
    }
    if (Array.isArray(wallets) && wallets[0]?.address) {
      return wallets[0].address;
    }
    if (Array.isArray(user.linkedAccounts)) {
      const w = user.linkedAccounts.find((a) => a?.type === 'wallet' && a?.address);
      if (w?.address) return w.address;
    }
    return undefined;
  }, []);

  
  
  // Check NFT ownership using direct blockchain verification
  const checkNFTOwnership = useCallback(async (walletAddress) => {
    console.log('Starting NFT ownership check for:', walletAddress);
    if (!walletAddress) {
      console.log('No wallet address provided');
      return false;
    }

    try {
      // First try to use the injected provider from RainbowKit/Wagmi
      const provider = window.ethereum || (window.web3 && window.web3.currentProvider);
      
      // If no provider is found, check for WalletConnect or other injected providers
      if (!provider) {
        // Try to detect if we're in a mobile web environment
        if (window.ethereum?.isMetaMask || 
            window.ethereum?.isTrust || 
            window.ethereum?.isStatus ||
            window.ethereum?.isImToken) {
          // We have an injected provider
          console.log('Using injected provider for NFT check');
        } else if (window.web3) {
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
            address: contractAddress,
            abi: erc721ABI,
            functionName: 'balanceOf',
            args: [walletAddress],
          });
          return BigInt(balance) > 0n;
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
            if (typeof window !== 'undefined' && window.ethereum?.request) {
              await window.ethereum.request({
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
      
      const loginResult = await loginUser(_address);
      if (loginResult.token) {
        localStorage.setItem('token', loginResult.token);
        localStorage.setItem('walletAddress', _address);
        const playerInfo = await checkPlayerName(_address);
        return playerInfo;
      }
      return null;  
    } catch (error) {
      console.error("Wallet connection error:", error);
      return null;
    }
  }, [checkPlayerName]);

  // When a Privy session is authenticated, mirror it into our wallet state
  useEffect(() => {
    if (!privyReady || !privyAuthenticated) return;

    const addr = getPrimaryPrivyAddress(privyUser, privyWallets);
    if (!addr) return;

    setPrivyAddress(addr);

    if (backendLoginSentRef.current === addr) return;
    backendLoginSentRef.current = addr;

    try {
      // Call the existing backend login flow with the Privy wallet address
      // so the rest of the app (name, game, IAP) continues to work as-is.
      setUserToken(addr);
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', addr);
    } catch (err) {
      console.warn('Failed to persist Privy wallet info:', err);
    }
  }, [privyReady, privyAuthenticated, privyUser, privyWallets, getPrimaryPrivyAddress, setUserToken]);

  const connectWallet = useCallback(async () => {
    try {
      const result = await connect();
      if (result.account) {
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', result.account.address);
        console.log("calling 1 ",result.account.address)
        try {
          const hasNFT = await checkNFTOwnership(result.account.address);
          setIsNFTOwner(hasNFT);
        } catch (error) {
          console.error('Error checking NFT ownership:', error);
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }, [connect, checkNFTOwnership]);

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

  const effectiveAddress = wagmiAddress || privyAddress;
  const isPrivyConnected = Boolean(privyReady && privyAuthenticated && privyAddress);
  const effectiveIsConnected = Boolean(wagmiIsConnected || isPrivyConnected);

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
