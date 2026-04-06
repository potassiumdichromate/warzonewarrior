import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, ChevronLeft, ChevronRight, Home, RefreshCw, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getAllTimeLeaderboard,
  getLeaderboard,
  normalizeLeaderboardRows,
  type LeaderboardEntry,
} from '@/utils/api';
import PageWalletControls from '@/components/PageWalletControls';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useWallet } from '@/contexts/WalletContext';
import gameAction from '@/assets/images/game-action.png';
import coinIcon from '@/assets/images/icon-coins.png';

const FALLBACK_DATA: LeaderboardEntry[] = [
  { rank: 1, name: 'Ripkun', coins: 5158977, experience: 0 },
  { rank: 2, name: 'JERUZZALEM', coins: 3598546, experience: 0 },
  { rank: 3, name: 'Shy', coins: 3187241, experience: 0 },
  { rank: 4, name: 'JohnDigger10694', coins: 2715117, experience: 0 },
  { rank: 5, name: 'Fate', coins: 2200781, experience: 0 },
  { rank: 6, name: 'skysstars', coins: 1181530, experience: 0 },
  { rank: 7, name: 'JohnDigger2', coins: 943738, experience: 0 },
  { rank: 8, name: 'JohnDigger3276', coins: 767493, experience: 0 },
  { rank: 9, name: 'whisperer', coins: 474717, experience: 0 },
  { rank: 10, name: 'JohnDigger8164', coins: 470332, experience: 0 },
];

const LeaderboardScene = () => (
  <div className="fixed inset-0 z-0">
    <img src={gameAction} alt="" className="w-full h-full object-cover" loading="eager" />
    <div className="absolute inset-0 bg-background/80" />
    <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/75 to-background" />
  </div>
);

const RANK_MEDAL = ['👑', '🥈', '🥉'];

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_STYLES: Record<number | 'default', string> = {
  1: 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-900 ring-2 ring-yellow-400 shadow-[0_0_14px_rgba(255,215,0,0.6)]',
  2: 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900 ring-2 ring-gray-400',
  3: 'bg-gradient-to-br from-amber-400 to-amber-700 text-amber-100 ring-2 ring-amber-500',
  default: 'bg-gradient-to-br from-slate-600 to-slate-800 text-slate-300 ring-1 ring-white/10',
};

function Avatar({ name, rank, size = 'sm' }: { name: string; rank: number; size?: 'sm' | 'md' | 'lg' }) {
  const style = AVATAR_STYLES[rank <= 3 ? rank : 'default'];
  const dim =
    size === 'lg' ? 'w-16 h-16 text-lg' : size === 'md' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-xs';
  return (
    <div
      className={`rounded-full flex items-center justify-center font-black shrink-0 select-none ${dim} ${style}`}
    >
      {initials(name)}
    </div>
  );
}

const PODIUM_BASE: Record<number, string> = {
  1: 'h-20 sm:h-24 bg-gradient-to-t from-yellow-600 to-yellow-400 text-yellow-900',
  2: 'h-14 sm:h-16 bg-gradient-to-t from-gray-600 to-gray-400 text-gray-800',
  3: 'h-10 sm:h-12 bg-gradient-to-t from-amber-700 to-amber-500 text-amber-100',
};

function PodiumCard({ player, delay }: { player: LeaderboardEntry; delay: number }) {
  const isFirst = player.rank === 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 160, damping: 18 }}
      className="flex flex-col items-center"
    >
      <div className="text-2xl sm:text-3xl mb-2 drop-shadow-[0_0_8px_rgba(255,220,80,0.8)]">
        {RANK_MEDAL[player.rank - 1]}
      </div>
      <motion.div
        animate={isFirst ? { scale: [1, 1.06, 1] } : {}}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Avatar name={player.name} rank={player.rank} size={isFirst ? 'lg' : 'md'} />
      </motion.div>
      <div
        className={`mt-2 font-russo text-center leading-tight max-w-[90px] sm:max-w-[120px] truncate ${
          isFirst ? 'text-gold text-sm sm:text-base' : 'text-foreground text-xs sm:text-sm'
        }`}
      >
        {player.name}
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <img src={coinIcon} alt="" className="w-3 h-3 object-contain" />
        <span className="font-orbitron text-gold text-[11px] sm:text-xs font-bold">
          {player.coins.toLocaleString()}
        </span>
      </div>
      <div
        className={`mt-2 w-20 sm:w-28 rounded-t-lg flex items-center justify-center font-orbitron text-2xl sm:text-3xl font-black ${PODIUM_BASE[player.rank]}`}
      >
        {player.rank}
      </div>
    </motion.div>
  );
}

function LeaderboardRow({ player, index }: { player: LeaderboardEntry; index: number }) {
  const isTop3 = player.rank <= 3;
  const rowBg =
    player.rank === 1
      ? 'hover:bg-yellow-500/10 bg-yellow-500/5'
      : player.rank === 2
        ? 'hover:bg-slate-400/10 bg-slate-400/5'
        : player.rank === 3
          ? 'hover:bg-amber-500/10 bg-amber-500/5'
          : 'hover:bg-white/5';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025 }}
      className={`grid grid-cols-[44px_1fr_auto] md:grid-cols-[60px_1fr_140px_110px] items-center gap-3 px-3 md:px-5 py-3 border-b border-white/6 transition-colors cursor-default ${rowBg}`}
    >
      <div className="flex justify-center">
        {isTop3 ? (
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
              player.rank === 1
                ? 'bg-yellow-500/20 ring-1 ring-yellow-400/50'
                : player.rank === 2
                  ? 'bg-slate-400/20 ring-1 ring-slate-400/50'
                  : 'bg-amber-500/20 ring-1 ring-amber-500/50'
            }`}
          >
            {RANK_MEDAL[player.rank - 1]}
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center">
            <span className="font-orbitron text-xs text-muted-foreground">{player.rank}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar name={player.name} rank={player.rank} size="sm" />
        <span className={`font-russo text-sm truncate ${isTop3 ? 'text-gold' : 'text-foreground'}`}>
          {player.name}
        </span>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <img src={coinIcon} alt="" className="w-4 h-4 object-contain shrink-0" />
        <span className="font-orbitron text-sm font-bold text-gold">{player.coins.toLocaleString()}</span>
      </div>
      <div className="hidden md:flex justify-end">
        <span className="font-orbitron text-sm text-muted-foreground">
          {player.experience.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}

const ITEMS_PER_PAGE = 10;

async function fetchLeaderboardRows(): Promise<LeaderboardEntry[]> {
  try {
    const raw = await getAllTimeLeaderboard();
    const rows = normalizeLeaderboardRows(raw);
    if (rows.length) return rows;
  } catch {
    /* fallback */
  }
  try {
    const raw = await getLeaderboard();
    const rows = normalizeLeaderboardRows(raw);
    if (rows.length) return rows;
  } catch {
    /* use demo */
  }
  return FALLBACK_DATA;
}

export const Leaderboard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { isConnected, address, disconnect } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const openLogin = () => navigate('/login', { state: { from: location.pathname } });

  const { data: apiData, isLoading, isError, refetch } = useQuery({
    queryKey: ['leaderboard-warzone'],
    queryFn: fetchLeaderboardRows,
    staleTime: 60_000,
  });

  const allLeaderboardData: LeaderboardEntry[] = apiData?.length ? apiData : FALLBACK_DATA;
  const totalPages = Math.max(1, Math.ceil(allLeaderboardData.length / ITEMS_PER_PAGE));

  const currentData = allLeaderboardData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const goTo = (p: number) => setCurrentPage(Math.max(1, Math.min(totalPages, p)));

  const topThree = allLeaderboardData.slice(0, 3);
  const podiumPlayers =
    topThree.length >= 3 ? topThree : [...topThree, ...FALLBACK_DATA].slice(0, 3);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-36 sm:pb-24">
      <LeaderboardScene />

      <div className="relative z-10">
        <header className="fixed top-0 left-0 right-0 z-50">
          <div className="bg-background/95 backdrop-blur-md border-b border-border">
            <div className="container mx-auto px-4 relative flex items-center justify-between h-14 sm:h-16">
              <Link to="/" className="relative z-10 shrink-0">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-border hover:border-gold transition-all group"
                >
                  <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                  <Home className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                  <span className="font-russo text-xs text-muted-foreground group-hover:text-gold transition-colors hidden sm:block">
                    HOME
                  </span>
                </motion.div>
              </Link>

              <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 flex max-w-[calc(100%-120px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 px-2 text-center sm:max-w-none">
                <Trophy className="w-4 h-4 sm:w-6 sm:h-6 shrink-0 text-gold" />
                <h1 className="font-orbitron text-sm sm:text-lg md:text-xl font-bold leading-none text-gradient-gold whitespace-nowrap">
                  LEADERBOARD
                </h1>
              </div>

              <div className="relative z-10 hidden sm:block">
                {isConnected ? (
                  <PageWalletControls
                    isConnected={isConnected}
                    address={address}
                    onDisconnect={disconnect}
                    showLiveBadge={false}
                  />
                ) : isError ? (
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                    <span className="font-russo text-[10px] sm:text-xs text-red-400">RETRY</span>
                  </button>
                ) : isLoading ? (
                  <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-muted/30 border border-border">
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground animate-spin" />
                    <span className="font-russo text-[10px] sm:text-xs text-muted-foreground">LOADING</span>
                  </div>
                ) : (
                  <PageWalletControls
                    isConnected={isConnected}
                    address={address}
                    onDisconnect={disconnect}
                    onRequestLogin={openLogin}
                  />
                )}
              </div>
            </div>
            <div
              className="h-[2px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent, hsl(42,100%,50%) 30%, hsl(42,100%,50%) 70%, transparent)',
              }}
            />
          </div>
        </header>

        <main className="pt-20 sm:pt-24 pb-12 px-3 sm:px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="flex justify-center items-end gap-3 sm:gap-6 mb-8 sm:mb-10">
              {[1, 0, 2].map((idx) => (
                <PodiumCard key={idx} player={podiumPlayers[idx]} delay={idx * 0.08} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl overflow-hidden border border-gold/25 backdrop-blur-xl"
              style={{
                background:
                  'linear-gradient(180deg, rgba(30,35,60,0.92) 0%, rgba(12,15,30,0.96) 100%)',
              }}
            >
              <div className="grid grid-cols-[44px_1fr_auto] md:grid-cols-[60px_1fr_140px_110px] items-center gap-3 px-3 md:px-5 py-3 bg-gold/10 border-b border-gold/25">
                <div className="text-center font-russo text-[11px] text-gold tracking-widest">RANK</div>
                <div className="font-russo text-[11px] text-gold tracking-widest">PLAYER</div>
                <div className="text-right font-russo text-[11px] text-gold tracking-widest">COINS</div>
                <div className="hidden md:block text-right font-russo text-[11px] text-gold tracking-widest">
                  EXP
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isLoading && !apiData ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[44px_1fr_auto] md:grid-cols-[60px_1fr_140px_110px] items-center gap-3 px-3 md:px-5 py-3 border-b border-white/6 animate-pulse"
                      >
                        <div className="mx-auto w-9 h-9 rounded-full bg-white/10" />
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-white/10 shrink-0" />
                          <div className="h-3 w-28 rounded bg-white/10" />
                        </div>
                        <div className="h-3 w-16 rounded bg-white/10 ml-auto" />
                        <div className="hidden md:block h-3 w-10 rounded bg-white/10 ml-auto" />
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {currentData.map((player, index) => (
                      <LeaderboardRow key={`${player.rank}-${player.name}`} player={player} index={index} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 mt-6">
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => goTo(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl bg-card border border-border hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>

              <div className="flex items-center gap-1.5">
                {(() => {
                  let start = Math.max(1, currentPage - 1);
                  const end = Math.min(totalPages, start + 2);
                  start = Math.max(1, end - 2);
                  return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((page) => (
                    <motion.button
                      key={page}
                      type="button"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => goTo(page)}
                      className={`w-9 h-9 rounded-lg font-russo text-sm transition-all ${
                        currentPage === page
                          ? 'bg-gold text-background shadow-[0_0_12px_rgba(255,215,0,0.4)]'
                          : 'bg-card border border-border hover:border-gold text-muted-foreground'
                      }`}
                    >
                      {page}
                    </motion.button>
                  ));
                })()}
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => goTo(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl bg-card border border-border hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav current="leaderboard" />
    </div>
  );
};

export default Leaderboard;
