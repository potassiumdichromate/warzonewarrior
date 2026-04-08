import { useState } from 'react';
import { Check, Copy, Loader2, LogOut, Wallet, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameButton } from '@/components/ui/game-button';

interface PageWalletControlsProps {
  isConnected: boolean;
  address: string | null;
  onDisconnect: () => void | Promise<void>;
  onRequestLogin?: () => void;
  showLiveBadge?: boolean;
}

const PageWalletControls = ({
  isConnected,
  address,
  onDisconnect,
  onRequestLogin,
  showLiveBadge = true,
}: PageWalletControlsProps) => {
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  if (!isConnected) {
    return onRequestLogin ? (
      <GameButton variant="gold" size="sm" onClick={onRequestLogin} className="shadow-lg shadow-gold/20">
        <Wallet className="w-3.5 h-3.5 sm:mr-1.5" />
        <span className="hidden sm:inline">CONNECT</span>
      </GameButton>
    ) : showLiveBadge ? (
      <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/30">
        <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
        <span className="font-russo text-[10px] sm:text-xs text-accent">LIVE</span>
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      </div>
    ) : null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-card/60 border border-gold/25 shadow-lg shadow-black/20"
    >
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
      <span className="hidden sm:inline font-russo text-xs text-gold">{shortAddress}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 rounded hover:bg-gold/10 transition-colors"
        title="Copy wallet address"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-gold" />
        )}
      </button>
      <button
        type="button"
        disabled={loggingOut}
        onClick={async () => {
          setLoggingOut(true);
          try { await onDisconnect(); } finally { setLoggingOut(false); }
        }}
        className="p-1 rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
        title="Logout"
      >
        {loggingOut
          ? <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
          : <LogOut className="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
        }
      </button>
    </motion.div>
  );
};

export default PageWalletControls;
