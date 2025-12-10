import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../../assets/images/WhatsApp Image 2025-06-11 at 14.01.20 1.png';
import backImage from '../../assets/images/back-iap.png';
import marketplaceHeader from '../../assets/images/marketplace-header.png';
import rightArrow from '../../assets/images/right-arrow.png';
import leftArrow from '../../assets/images/left-arrow.png';
import coinImage from '../../assets/images/coin1.png';
import gemImage from '../../assets/images/gem2.png';
import gunsImage from '../../assets/images/guns3.png';
import essentialsImage from '../../assets/images/essentials4.png';
import boosterImage from '../../assets/images/booster5.png';
import c1Image from '../../assets/images/c1.png';
import c2Image from '../../assets/images/c2.png';
import c3Image from '../../assets/images/c3.png';
import c4Image from '../../assets/images/c4.png';
import g1Image from '../../assets/images/g1.png';
import g2Image from '../../assets/images/g2.png';
import g3Image from '../../assets/images/g3.png';
import g4Image from '../../assets/images/g4.png';
import gun1Image from '../../assets/images/gun1.png';
import gun2Image from '../../assets/images/gun2.png';
import gun3Image from '../../assets/images/gun3.png';
import gun4Image from '../../assets/images/gun4.png';
// import b1Image from '../../assets/images/b1.png';
// import b2Image from '../../assets/images/b2.png';
// import b3Image from '../../assets/images/b3.png';
// import b4Image from '../../assets/images/b4.png';
// import b5Image from '../../assets/images/b5.png';
// import b6Image from '../../assets/images/b6.png';
// import e1Image from '../../assets/images/E1.png';
// import e2Image from '../../assets/images/E2.png';
import coin100Image from '../../assets/images/100-coins.png';
import coin500Image from '../../assets/images/500-coins.png';
import coin1000Image from '../../assets/images/1000-coins.png';
import coin2000Image from '../../assets/images/2000-coins.png';
import clickToBuyImage from '../../assets/images/Click-to-buy.png';
import gems100Image from '../../assets/images/100-gems.png';
import gems300Image from '../../assets/images/300-gems.png';
import gems500Image from '../../assets/images/500-gems.png';
import gems1000Image from '../../assets/images/1000-gems.png';
import gun1ImageDetail from '../../assets/images/gunn1.png';
import gun2ImageDetail from '../../assets/images/gunn2.png';
import gun3ImageDetail from '../../assets/images/gunn3.png';
import gun4ImageDetail from '../../assets/images/gunn4.png';
import gun5Image from '../../assets/images/gun5.png';
import gun6Image from '../../assets/images/gun6.png';
import gun5ImageDetail from '../../assets/images/gunn5.png';
import gun6ImageDetail from '../../assets/images/gunn6.png';
// import essen1ImageDetail from '../../assets/images/essen1.png';
// import essen2ImageDetail from '../../assets/images/essen2.png';
// import boos1ImageDetail from '../../assets/images/boos1.png';
// import boos2ImageDetail from '../../assets/images/boos2.png';
// import boos3ImageDetail from '../../assets/images/boos3.png';
// import boos4ImageDetail from '../../assets/images/boos4.png';
// import boos5ImageDetail from '../../assets/images/boos5.png';
// import boos6ImageDetail from '../../assets/images/boos6.png';
import buyButtonImage from '../../assets/images/buy-button.png';
import './iap.css';
import { getPlayerProfile, updateMarketplaceData } from '../../utils/api';
import { useAccount, useChainId, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';
import { useWallet } from '../../contexts/WalletContext';
import { somniaTestnet } from '../../wagmi.config';
import { getAllowedChainFromEnv } from '../../lib/chain';
import { encodeFunctionData, keccak256, parseEther, stringToBytes } from 'viem';
import contractAbi from '../../abi/WarzoneInAppPurchase.json';
import { usePrivyWalletTools } from '../../hooks/usePrivyWalletTools';
import PrivyWalletWidget from '../../components/PrivyWalletWidget';

// Simple price map for Guns (SOMI)
const GUN_PRICES_ETH = {
  'Shotgun': '0.4',
  'Bullpup': '0.8',
  'ScarH': '1',
  'Sniper Rifle': '1.2',
  'Tesla Mini': '1.5',
  'AWP': '2',
};

const GUN_IDS = {
  'ScarH': 2,
  'AWP': 3,
  'Shotgun': 4,
  'Bullpup': 6,
  'Sniper Rifle': 7,
  'Tesla Mini': 8,
};

const GUN_NAME_BY_ID = Object.fromEntries(
  Object.entries(GUN_IDS).map(([name, id]) => [String(id), name])
);

// Price maps for Coins and Gems (SOMI)
const COIN_PRICES_ETH = {
  '100': '0.5',
  '500': '2',
  '1000': '4',
  '2000': '7.5',
};

const GEM_PRICES_ETH = {
  '100': '0.5',
  '300': '1.5',
  '500': '2.5',
  '1000': '5',
};

const CoinDetail = ({ coinImage, onClose, type, value, onPurchased }) => {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [txHash, setTxHash] = useState(undefined);
  const [pendingOrder, setPendingOrder] = useState(null);
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: waitError } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const { switchToSomnia } = useWallet();
  const {
    privyReady,
    privyAuthenticated,
    canUsePrivy,
    activeWallet,
    sendPrivyTransaction,
    allowedChain,
  } = usePrivyWalletTools();
  const [showSuccess, setShowSuccess] = useState(false);
  const currentChainId = useChainId();

  // Contract configuration (Somnia mainnet)
  const contractAddress = import.meta.env.VITE_IAP_CONTRACT_ADDRESS;

  // Use the same allowed chain config as the login flow (LoginModal)
  const effectiveAllowedChain = allowedChain || getAllowedChainFromEnv() || {
    caip2: 'eip155:5031',
    decimalChainId: 5031,
    hexChainId: '0x13a7',
    chainName: 'Somnia Mainnet',
    rpcUrls: ['https://api.infra.mainnet.somnia.network'],
    blockExplorerUrls: ['https://explorer.somnia.network'],
  };


  //     console.log("privy Ready ",privyReady);
  // console.log("privy Authenticated ",privyAuthenticated);
  // console.log("canUsePrivy ",canUsePrivy);
  // console.log("currentChainId ",currentChainId);
  // console.log("isConnected ",isConnected);
  // console.log("isSending ",isSending);
  // console.log("isConfirming ",isConfirming);
  // console.log("isConfirmed ",isConfirmed);
  // console.log("waitError ",waitError);
  // console.log("sendError ",sendError);
  // console.log("pendingOrder ",pendingOrder);
  // console.log("txHash ",txHash);
  // console.log("showSuccess ",showSuccess);
  // console.log("contractAddress ",contractAddress);
  // console.log("address ",address);
  // console.log("walletClient ",walletClient);
  // console.log("type ",type);
  // console.log("value ",value);
  // console.log("onPurchased ",onPurchased);
  // console.log("onClose ",onClose);
  // console.log("coinImage ",coinImage);
  

  useEffect(() => {
    // After confirmation, call backend to finalize purchase
    const finalize = async () => {
      if (!isConfirmed || !type || !value || !pendingOrder || !txHash || pendingOrder.submitted) {
        return;
      }

      const orderSnapshot = pendingOrder;
      setPendingOrder(prev =>
        prev && prev.orderId === orderSnapshot.orderId ? { ...prev, submitted: true } : prev
      );

      const payload = { type, value, orderId: orderSnapshot.orderId, txHash };

      try {
        const response = await updateMarketplaceData(payload);
        console.log('Purchase finalized:', response);
        // If a gun was purchased, cache ownership locally and notify parent
        if (type === 'Guns') {
          try {
            const addr = localStorage.getItem('walletAddress');
            if (addr) {
              const key = `ownedGuns:${addr.toLowerCase()}`;
              const existing = JSON.parse(localStorage.getItem(key) || '[]');
              if (!existing.includes(String(value))) {
                const updated = [...existing, String(value)];
                localStorage.setItem(key, JSON.stringify(updated));
              }
            }
          } catch (e) {
            console.warn('Failed to update owned guns cache:', e);
          }
          onPurchased?.(value);
        }
      } catch (e) {
        console.error('Failed to finalize purchase:', e);
        setPendingOrder(prev =>
          prev && prev.orderId === orderSnapshot.orderId ? { ...prev, submitted: false } : prev
        );
      }
    };
    finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, pendingOrder, type, value, txHash]);

  // Show success popup when the transaction is confirmed
  useEffect(() => {
    if (isConfirmed && txHash) {
      setShowSuccess(true);
    }
  }, [isConfirmed, txHash]);

  const handleBuyNow = async () => {
    try {
      if (isSending || isConfirming) {
        alert('Please wait for the current transaction to finish.');
        return;
      }
      setShowSuccess(false);
      setSendError(null);

      // Coins/Gems/Guns all pay with SOMI via MetaMask
      if (!isConnected) {
        alert('Please connect your wallet to proceed.');
        return;
      }
      if (!contractAddress) {
        alert('Purchase contract address is not configured.');
        return;
      }

      // Guard: prevent purchasing a gun that's already owned (local cache)
      if (type === 'Guns') {
        try {
          const addr = localStorage.getItem('walletAddress');
          if (addr) {
            const owned = JSON.parse(localStorage.getItem(`ownedGuns:${addr.toLowerCase()}`) || '[]');
            if (owned.includes(String(value))) {
              alert('You already own this gun.');
              return;
            }
          }
        } catch (e) {
          console.warn('Owned guns cache read failed:', e);
        }
      }

      // Enforce allowed network only (same as login flow)
      if (currentChainId !== allowedChain.decimalChainId) {
        try {
          const switched = await switchToSomnia();
          if (!switched) {
            alert('Please switch to Somnia to continue.');
            return;
          }
        } catch (e) {
          console.error('Network switch failed:', e);
          alert(e?.message || 'Please switch to Somnia to continue.');
          return;
        }
      }

      let priceEth;
      if (type === 'Guns') {
        priceEth = GUN_PRICES_ETH[value];
      } else if (type === 'Coins') {
        priceEth = COIN_PRICES_ETH[value];
      } else if (type === 'Gems') {
        priceEth = GEM_PRICES_ETH[value];
      }

      if (!priceEth) {
        alert('Unknown product/price.');
        return;
      }

      if (!walletClient) {
        alert('Wallet is not ready. Please reconnect.');
        return;
      }

      const addresses = typeof walletClient.getAddresses === 'function'
        ? await walletClient.getAddresses()
        : [];
      const accountAddress = address || addresses[0] || walletClient.account?.address;

      if (!accountAddress) {
        alert('Unable to determine connected wallet address.');
        return;
      }

      const orderId =
        (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const orderHash = keccak256(stringToBytes(orderId));

      setPendingOrder({ orderId, orderHash, submitted: false });
      setIsSending(true);

      const data = encodeFunctionData({
        abi: contractAbi,
        functionName: 'purchase',
        args: [type, value, orderHash],
      });

      const valueWei = parseEther(priceEth);
      let valueHex = valueWei.toString(16);
      if (valueHex.length % 2) {
        valueHex = `0${valueHex}`;
      }
      const txParams = {
        from: accountAddress,
        to: contractAddress,
        data,
        value: valueWei === 0n ? '0x0' : `0x${valueHex}`,
      };

      const hash = await walletClient.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      setTxHash(hash);
    } catch (err) {
      setSendError(err);
      setPendingOrder(null);
      setTxHash(undefined);
      const msg = err?.shortMessage || err?.message || '';
      const code = err?.code ?? err?.cause?.code;
      console.error('Payment or purchase failed:', err);

      if (code === 4001 || /rejected/i.test(msg)) {
        alert('Transaction rejected in wallet.');
      } else if (/insufficient funds/i.test(msg)) {
        alert('Insufficient SOMI for this purchase (including gas).');
      } else if (/chain|network|mismatch/i.test(msg) || err?.name === 'ChainMismatchError') {
        alert('Wrong network selected. Please switch to Somnia and try again.');
      } else if (/GunAlreadyPurchased/i.test(msg)) {
        alert('You already own this gun.');
      } else {
        alert(msg || 'Transaction failed. Please try again.');
      }
      return;
    } finally {
      setIsSending(false);
    }
  };

  const handleBuyWithPrivy = async () => {
    try {
      if (isSending || isConfirming) {
        alert('Please wait for the current transaction to finish.');
        return;
      }
      setShowSuccess(false);
      setSendError(null);

      if (!privyReady) {
        alert('Wallet is still loading, please wait.');
        return;
      }

      if (!privyAuthenticated || !canUsePrivy || !activeWallet?.address) {
        alert('Please log in with Privy and create / connect a wallet first.');
        return;
      }

      if (!contractAddress) {
        alert('Purchase contract address is not configured.');
        return;
      }

      // Guard: prevent purchasing a gun that's already owned (local cache)
      if (type === 'Guns') {
        try {
          const addr = localStorage.getItem('walletAddress');
          if (addr) {
            const owned = JSON.parse(localStorage.getItem(`ownedGuns:${addr.toLowerCase()}`) || '[]');
            if (owned.includes(String(value))) {
              alert('You already own this gun.');
              return;
            }
          }
        } catch (e) {
          console.warn('Owned guns cache read failed:', e);
        }
      }

      let priceEth;
      if (type === 'Guns') {
        priceEth = GUN_PRICES_ETH[value];
      } else if (type === 'Coins') {
        priceEth = COIN_PRICES_ETH[value];
      } else if (type === 'Gems') {
        priceEth = GEM_PRICES_ETH[value];
      }

      if (!priceEth) {
        alert('Unknown product/price.');
        return;
      }

      const walletForPrivy = activeWallet;
      const orderId =
        (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const orderHash = keccak256(stringToBytes(orderId));

      setPendingOrder({ orderId, orderHash, submitted: false });
      setIsSending(true);

      const data = encodeFunctionData({
        abi: contractAbi,
        functionName: 'purchase',
        args: [type, value, orderHash],
      });

      const valueWei = parseEther(priceEth);
      let valueHex = valueWei.toString(16);
      if (valueHex.length % 2) {
        valueHex = `0${valueHex}`;
      }
      const valueHexStr = valueWei === 0n ? '0x0' : `0x${valueHex}`;

      // Send transaction via Privy's embedded wallet.
      // `useSendTransaction` returns an EVM-style TransactionReceipt.
      const receipt = await sendPrivyTransaction(
        {
          // If a contract address is configured, send to contract;
          to: contractAddress,
          value: valueHexStr,
          data,
          chainId: effectiveAllowedChain.decimalChainId,
        },
        {
          // Keep Privy UI minimal (we already show status locally).
          showWalletUIs: false,
        },
        undefined,
        walletForPrivy?.address,
      );

      const txHashFromReceipt =
        typeof receipt === 'string'
          ? receipt
          : receipt?.transactionHash || receipt?.hash;

      if (!txHashFromReceipt) {
        throw new Error('Unable to determine transaction hash from Privy receipt');
      }

      setTxHash(txHashFromReceipt);
    } catch (err) {
      setSendError(err);
      setPendingOrder(null);
      setTxHash(undefined);
      const msg = err?.shortMessage || err?.message || '';
      const code = err?.code ?? err?.cause?.code;
      console.error('Privy payment or purchase failed:', err);

      if (code === 4001 || /rejected/i.test(msg)) {
        alert('Transaction rejected in wallet.');
      } else if (/insufficient funds/i.test(msg)) {
        alert('Insufficient SOMI for this purchase (including gas).');
      } else if (/chain|network|mismatch/i.test(msg) || err?.name === 'ChainMismatchError') {
        alert('Wrong network selected. Please switch to Somnia and try again.');
      } else if (/GunAlreadyPurchased/i.test(msg)) {
        alert('You already own this gun.');
      } else {
        alert(msg || 'Transaction failed. Please try again.');
      }
      return;
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="coin-detail-container">
      {showSuccess && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-title">Transaction Successful</div>
            <div className="success-body">
              <div className="success-item-row">
                <span className="label">Item:</span>
                <span className="value">{type} — {value}</span>
              </div>
              <div className="success-item-row">
                <span className="label">Price:</span>
                <span className="value">
                  {type === 'Guns' && GUN_PRICES_ETH[value] ? `${GUN_PRICES_ETH[value]} SOMI` : ''}
                  {type === 'Coins' && COIN_PRICES_ETH[value] ? `${COIN_PRICES_ETH[value]} SOMI` : ''}
                  {type === 'Gems' && GEM_PRICES_ETH[value] ? `${GEM_PRICES_ETH[value]} SOMI` : ''}
                </span>
              </div>
              {pendingOrder?.orderId && (
                <div className="success-item-row">
                  <span className="label">Order Id:</span>
                  <span className="value hash">{pendingOrder.orderId}</span>
                </div>
              )}
              {txHash && (
                <div className="success-item-row">
                  <span className="label">Tx Hash:</span>
                  <span className="value hash">{String(txHash).slice(0, 10)}...{String(txHash).slice(-6)}</span>
                </div>
              )}
            </div>
            <div className="success-actions">
              {txHash && (
                <a
                  className="view-explorer"
                  href={`https://explorer.somnia.network/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Explorer
                </a>
              )}
              <button
                className="close-success"
                onClick={() => {
                  setShowSuccess(false);
                  setPendingOrder(null);
                  setTxHash(undefined);
                  onClose?.();
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="coin-detail-content">
        <img src={coinImage} alt="Coins" className="coin-detail-image" />
        <div className="buy-buttons-stack">
          <button 
            className="buy-button" 
            onClick={handleBuyNow}
            disabled={isSending || isConfirming || currentChainId !== somniaTestnet.id}
            title={
              currentChainId !== somniaTestnet.id
                ? 'Switch to Somnia to purchase'
                : isSending
                ? 'Waiting for wallet'
                : isConfirming
                ? 'Waiting for confirmation'
                : 'Buy Now'
            }
          >
            <img src={buyButtonImage} alt="Buy Now" className="buy-button-image" />
          </button>
          <span className="buy-or-label">or</span>
          <button
            type="button"
            className="privy-buy-button"
            onClick={handleBuyWithPrivy}
            disabled={isSending || isConfirming || !canUsePrivy}
            title={
              !canUsePrivy
                ? 'Log in with Privy and connect a wallet to use this option'
                : isSending
                ? 'Waiting for wallet'
                : isConfirming
                ? 'Waiting for confirmation'
                : 'Buy using Privy'
            }
          >
            Buy using Privy
          </button>
        </div>
        <div className="purchase-meta">
          {(type === 'Guns' || type === 'Coins' || type === 'Gems') && (
            <div className="price-badge">
              {type === 'Guns' && GUN_PRICES_ETH[value] ? `${value} – ${GUN_PRICES_ETH[value]} SOMI` : ''}
              {type === 'Coins' && COIN_PRICES_ETH[value] ? `${value} – ${COIN_PRICES_ETH[value]} SOMI` : ''}
              {type === 'Gems' && GEM_PRICES_ETH[value] ? `${value} – ${GEM_PRICES_ETH[value]} SOMI` : ''}
            </div>
          )}
          {isSending && (
            <div className="status-note pending">Awaiting wallet confirmation…</div>
          )}
          {isConfirming && (
            <div className="status-note confirming">Confirming on-chain…</div>
          )}
          {(sendError || waitError) && (
            <div className="status-note error">Transaction failed or rejected</div>
          )}
          {txHash && (
            <div className="tx-chip">Tx: {String(txHash).slice(0, 10)}...{String(txHash).slice(-6)}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const IAP = () => {
  const navigate = useNavigate();
  const { address: connectedAddress, isConnected } = useAccount();
  const [currentPage, setCurrentPage] = React.useState(0);
  const [currentIndex, setCurrentIndex] = React.useState({
    coins: 0,
    gems: 0,
    guns: 0
  });
  const [detailView, setDetailView] = React.useState({ 
    show: false, 
    image: null, 
    type: null, // "Coins" or Gems or other types
    value: null
  });
  const [ownedGuns, setOwnedGuns] = useState([]);
  const totalPages = 3; // Total number of pages (coins, gems, guns, essentials, boosters)
  const [isMobile, setIsMobile] = useState(false);
  
  // Load owned guns for the connected wallet from localStorage
  useEffect(() => {
    try {
      const addr = localStorage.getItem('walletAddress');
      if (addr) {
        const key = `ownedGuns:${addr.toLowerCase()}`;
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        setOwnedGuns(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.warn('Failed to load owned guns:', e);
    }
  }, []);

  useEffect(() => {
    if (!isConnected || !connectedAddress) {
      return;
    }
    let cancelled = false;

    const syncOwnedGuns = async () => {
      try {
        const profile = await getPlayerProfile(connectedAddress);
        const guns = profile?.PlayerGuns || {};
        const ownedSet = new Set();

        Object.entries(guns || {}).forEach(([key, gunValue]) => {
          const id = String(gunValue?.id ?? key);
          const gunName = GUN_NAME_BY_ID[id];
          if (gunName) ownedSet.add(gunName);
        });

        const ownedList = Array.from(ownedSet);
        if (!cancelled) {
          setOwnedGuns(ownedList);
          try {
            localStorage.setItem(
              `ownedGuns:${connectedAddress.toLowerCase()}`,
              JSON.stringify(ownedList)
            );
          } catch (err) {
            console.warn('Failed to cache owned guns:', err);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to sync owned guns from backend:', err);
        }
      }
    };

    syncOwnedGuns();
    return () => {
      cancelled = true;
    };
  }, [isConnected, connectedAddress]);

  useEffect(() => {
    if (!isConnected) {
      setOwnedGuns([]);
    }
  }, [isConnected]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Coins data
  const coinsData = [
    {
      id: 1,
      image: c1Image,
      detailImage: coin100Image,
      name: '100 Coins',
      value: '100',
      type: 'Coins'
    },
    {
      id: 2,
      image: c2Image,
      detailImage: coin500Image,
      name: '500 Coins',
      value: '500',
      type: 'Coins'
    },
    {
      id: 3,
      image: c3Image,
      detailImage: coin1000Image,
      name: '1000 Coins',
      value: '1000',
      type: 'Coins'
    },
    {
      id: 4,
      image: c4Image,
      detailImage: coin2000Image,
      name: '2000 Coins',
      value: '2000',
      type: 'Coins'
    }
  ];

  // Gems data
  const gemsData = [
    {
      id: 1,
      image: g1Image,
      detailImage: gems100Image,
      name: '100 Gems',
      value: '100',
      type: 'Gems'
    },
    {
      id: 2,
      image: g2Image,
      detailImage: gems300Image,
      name: '300 Gems',
      value: '300',
      type: 'Gems'
    },
    {
      id: 3,
      image: g3Image,
      detailImage: gems500Image,
      name: '500 Gems',
      value: '500',
      type: 'Gems'
    },
    {
      id: 4,
      image: g4Image,
      detailImage: gems1000Image,
      name: '1000 Gems',
      value: '1000',
      type: 'Gems'
    }
  ];

  // Guns data
  const gunsData = [
    {
      id: 1,
      image: gun1Image,
      detailImage: gun1ImageDetail,
      name: 'AWP',
      value: 'AWP',
      type: 'Guns'
    },
    {
      id: 2,
      image: gun2Image,
      detailImage: gun2ImageDetail,
      name: 'Bullpup',
      value: 'Bullpup',
      type: 'Guns'
    },
    {
      id: 3,
      image: gun3Image,
      detailImage: gun3ImageDetail,
      name: 'Shotgun',
      value: 'Shotgun',
      type: 'Guns'
    },
    {
      id: 4,
      image: gun4Image,
      detailImage: gun4ImageDetail,
      name: 'Sniper Rifle',
      value: 'Sniper Rifle',
      type: 'Guns'
    },
    {
      id: 5,
      image: gun5Image,
      detailImage: gun5ImageDetail,
      name: 'Tesla Mini',
      value: 'Tesla Mini',
      type: 'Guns'
    },
    {
      id: 6,
      image: gun6Image,
      detailImage: gun6ImageDetail,
      name: 'ScarH',
      value: 'ScarH',
      type: 'Guns'
    }
  ];


  
  
  // Show all guns with horizontal scrolling
  const currentGuns = [...gunsData];

  const handleBack = () => {
    if (detailView.show) {
      setDetailView({ show: false, image: null, type: null , value: null});
    } else {
      navigate(-1);
    }
  };

  const handleNext = () => {
    if (currentPage === 0) { // Coins page
      setCurrentIndex(prev => ({
        ...prev,
        coins: (prev.coins + 1) % coinsData.length
      }));
    } else if (currentPage === 1) { // Gems page
      setCurrentIndex(prev => ({
        ...prev,
        gems: (prev.gems + 1) % gemsData.length
      }));
    } else if (currentPage === 2) { // Guns page
      setCurrentIndex(prev => ({
        ...prev,
        guns: (prev.guns + 1) % gunsData.length
      }));
    } else {
      setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
    }
  };

  const handlePrevious = () => {
    if (currentPage === 0) { // Coins page
      setCurrentIndex(prev => ({
        ...prev,
        coins: (prev.coins - 1 + coinsData.length) % coinsData.length
      }));
    } else if (currentPage === 1) { // Gems page
      setCurrentIndex(prev => ({
        ...prev,
        gems: (prev.gems - 1 + gemsData.length) % gemsData.length
      }));
    } else if (currentPage === 2) { // Guns page
      setCurrentIndex(prev => ({
        ...prev,
        guns: (prev.guns - 1 + gunsData.length) % gunsData.length
      }));
    } else {
      setCurrentPage(prev => Math.max(prev - 1, 0));
    }
  };

  const handleDotClick = (index) => {
    if (currentPage === 0) {
      setCurrentIndex(prev => ({ ...prev, coins: index }));
    } else if (currentPage === 1) {
      setCurrentIndex(prev => ({ ...prev, gems: index }));
    } else if (currentPage === 2) {
      setCurrentIndex(prev => ({ ...prev, guns: index }));
    }
  };

  const handleImageClick = (pageIndex) => {
    setCurrentPage(pageIndex);
  };

  // Render item with buy button or Owned badge
  const renderItem = (item) => {
    const owned = item.type === 'Guns' && ownedGuns.includes(String(item.value));
    const openDetail = () => {
      if (owned) return;
      setDetailView({ 
        show: true, 
        image: item.detailImage, 
        type: item.type, 
        value: item.value 
      });
    };

    return (
      <div className="carousel-item">
        <div className="item-container" style={{ position: 'relative' }}>
          <img 
            src={item.image} 
            alt={item.name} 
            className="item-image"
            onClick={openDetail}
            style={owned ? { filter: 'grayscale(80%)', opacity: 0.8, cursor: 'not-allowed' } : undefined}
          />
          {owned ? (
            <div 
              className="owned-badge"
              style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 6,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: 'uppercase'
              }}
            >
              Owned
            </div>
          ) : (
            <img 
              src={clickToBuyImage} 
              alt="Click to Buy"
              className="click-to-buy-button"
              onClick={openDetail}
            />
          )}
        </div>
      </div>
    );
  };

  // Get visible items for the current page (simple carousel)
  const getVisibleItems = (items, currentIdx) => {
    const itemCount = items.length;
    if (!itemCount) return [];

    const visibleCount = isMobile ? 1 : 3;
    if (itemCount <= visibleCount) return items;

    const result = [];
    for (let i = 0; i < visibleCount; i++) {
      const idx = (currentIdx + i + itemCount) % itemCount;
      result.push(items[idx]);
    }
    return result;
  };

  // Render navigation dots for carousel
  const renderDots = (count, current) => {
    return (
      <div className="carousel-dots">
        {Array.from({ length: count }).map((_, index) => (
          <span
            key={index}
            className={`dot ${index === current ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
          />
        ))}
      </div>
    );
  };

  // Render page content with navigation
  const renderPageContent = () => {
    // Get current data based on page
    let currentData, currentIndexValue, type;
    
    if (currentPage === 0) {
      currentData = coinsData;
      currentIndexValue = currentIndex.coins;
      type = 'Coins';
    } else if (currentPage === 1) {
      currentData = gemsData;
      currentIndexValue = currentIndex.gems;
      type = 'Gems';
    } else if (currentPage === 2) {
      currentData = gunsData;
      currentIndexValue = currentIndex.guns;
      type = 'Guns';
    } else {
      currentData = [];
      currentIndexValue = 0;
      type = '';
    }

    const visibleItems = getVisibleItems(currentData, currentIndexValue);

    return (
      <div className="display-container">
        <img
          src={leftArrow}
          alt="Previous"
          className="left-arrow"
          onClick={handlePrevious}
        />
        <img
          src={rightArrow}
          alt="Next"
          className="right-arrow"
          onClick={handleNext}
        />

        <div className="carousel-container">
          <div className="carousel-items">
            {visibleItems.map((item, idx) => (
              <div key={`${type}-${item.id}-${idx}`} className="carousel-item-wrapper">
                {renderItem(item)}
              </div>
            ))}
          </div>
          {renderDots(currentData.length, currentIndexValue)}
        </div>
      </div>
    );
  };

  if (detailView.show) {
    return (
      <div className="iap-container" style={{ '--background-image': `url(${backgroundImage})` }}>
        <button onClick={handleBack} className="back-button">
          <img src={backImage} alt="Back" />
        </button>
        <div className="marketplace-header">
          <img src={marketplaceHeader} alt="Marketplace" />
        </div>
        <PrivyWalletWidget />
        <CoinDetail 
          coinImage={detailView.image} 
          type={detailView.type}
          value={detailView.value}
          onClose={() => setDetailView({ show: false, image: null, type: null, value: null })}
          onPurchased={(gunName) => {
            if (!gunName) return;
            setOwnedGuns(prev => {
              if (prev.includes(String(gunName))) return prev;
              const next = [...prev, String(gunName)];
              try {
                const addr = localStorage.getItem('walletAddress');
                if (addr) {
                  localStorage.setItem(`ownedGuns:${addr.toLowerCase()}`, JSON.stringify(next));
                }
              } catch (e) {
                console.warn('Failed to persist owned guns:', e);
              }
              return next;
            });
          }} 
        />
      </div>
    );
  }

  return (
    <div className="iap-container" style={{ '--background-image': `url(${backgroundImage})` }}>
      <button className="back-button" onClick={handleBack}>
        <img src={backImage} alt="Back" className="back-button-image" />
      </button>
      <div className="marketplace-header">
        <img src={marketplaceHeader} alt="Marketplace" />
        <div className="currency-container">
          <img 
            src={coinImage} 
            alt="Coins" 
            className={`currency-image coin-image ${currentPage === 0 ? 'active' : ''}`} 
            onClick={() => handleImageClick(0)}
          />
          <img 
            src={gemImage} 
            alt="Gems" 
            className={`currency-image gem-image ${currentPage === 1 ? 'active' : ''}`} 
            onClick={() => handleImageClick(1)}
          />
          <img 
            src={gunsImage} 
            alt="Guns" 
            className={`currency-image guns-image ${currentPage === 2 ? 'active' : ''}`} 
            onClick={() => handleImageClick(2)}
          />
          {/* <img 
            src={essentialsImage} 
            alt="Essentials" 
            className={`currency-image essentials-image ${currentPage === 3 ? 'active' : ''}`} 
            onClick={() => handleImageClick(3)}
          />
          <img 
            src={boosterImage} 
            alt="Booster" 
            className={`currency-image booster-image ${currentPage === 4 ? 'active' : ''}`} 
            onClick={() => handleImageClick(4)}
          /> */}
        </div>
        {renderPageContent()}
      </div>
    </div>
  );
};

export default IAP;
