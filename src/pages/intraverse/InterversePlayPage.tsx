import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Trophy, Star, X, CalendarRange, Layers } from 'lucide-react';
import { buildApiUrl } from '../../config/api';
import { getTournaments } from '../../utils/api';
import { useWallet } from '../../contexts/WalletContext';
import MobileBottomNav from '../../components/MobileBottomNav';
import PageWalletControls from '../../components/PageWalletControls';
import decoLamp from '@/assets/images/deco-lamp.png';
import decoChain from '@/assets/images/deco-chain.png';
import decoRubble from '@/assets/images/deco-rubble.png';
import './InterversePlayPage.css';

const TOURNAMENT_MARQUEE_ITEMS = [
  'BRACKETS',
  'LIVE OPS',
  'JOIN WINDOWS',
  'ACTIVE ROUNDS',
  'COMPETE',
  'WARZONE CIRCUIT',
  'CLAIM GLORY',
  'TOURNAMENT SEASON',
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtDate(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(ms) {
  if (!ms) return 'TBA';
  return new Date(ms).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function isRoundActive(round) {
  if (!Array.isArray(round?.intervals) || round.intervals.length === 0) return false;
  const now = Date.now();
  return round.intervals.some(iv => now >= iv.startDate && now <= iv.endDate);
}

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(buildApiUrl(path), { headers, ...opts });
  const json = await res.json();
  return { ok: res.ok, status: res.status, data: json };
}

/* ─── Rounds Modal ───────────────────────────────────────────────────────── */
function RoundsModal({ tournament, onClose }) {
  const activeRound = (tournament.rounds || []).find(isRoundActive);
  const roundCount = tournament.rounds?.length || 0;
  const statusKey = String(tournament.status || '').toLowerCase();
  const statusVariant = ['running', 'upcoming', 'finished'].includes(statusKey) ? statusKey : 'default';

  return (
    <div className="t-modal-overlay" onClick={onClose} role="presentation">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="t-modal-title"
        className="t-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        <div className="t-modal-hazard-bar" aria-hidden />
        <div className={`t-modal-hero ${tournament.image ? '' : 't-modal-hero--fallback'}`}>
          {tournament.image && (
            <img src={tournament.image} alt="" className="t-modal-hero-img" />
          )}
          <div className="t-modal-hero-overlay" />
          <div className="t-modal-hero-grid" aria-hidden />
          <button
            type="button"
            className="t-modal-close-floating"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="t-modal-close-icon" strokeWidth={2.5} />
          </button>
          <div className="t-modal-hero-content">
            <span className={`t-modal-status t-modal-status--${statusVariant}`}>
              {tournament.status || 'Tournament'}
            </span>
            <h3 id="t-modal-title" className="t-modal-title">
              {tournament.name}
            </h3>
            <p className="t-modal-subtitle">
              <CalendarRange className="t-modal-subtitle-icon" aria-hidden />
              {fmtDate(tournament.startDate)} — {fmtDate(tournament.endDate)}
            </p>
          </div>
        </div>

        <div className="t-modal-body">
          <div className="t-modal-summary">
            <div className="t-modal-summary-card">
              <Layers className="t-modal-summary-icon" aria-hidden />
              <span className="t-modal-summary-label">Rounds</span>
              <strong className="t-modal-summary-value">{roundCount}</strong>
            </div>
            <div className="t-modal-summary-card t-modal-summary-card--no-icon">
              <span className="t-modal-summary-label">Status</span>
              <strong className="t-modal-summary-value">{activeRound ? 'Live window' : 'Waiting'}</strong>
            </div>
            <div className="t-modal-summary-card t-modal-summary-card--wide t-modal-summary-card--no-icon">
              <span className="t-modal-summary-label">Active round</span>
              <strong className="t-modal-summary-value t-modal-summary-value--truncate">
                {activeRound ? activeRound.name || 'In progress' : '—'}
              </strong>
            </div>
          </div>

          <div className="t-modal-section-head">
            <span className="t-modal-section-kicker">Schedule</span>
            <h4 className="t-modal-section-title">Round windows</h4>
          </div>

          {(!tournament.rounds || tournament.rounds.length === 0) && (
            <p className="t-modal-empty">No rounds published yet. Check back soon.</p>
          )}
          <div className="t-rounds-list">
            {(tournament.rounds || []).map((round, i) => {
              const active = isRoundActive(round);
              const intervalCount = round?.intervals?.length || 0;
              return (
                <div key={round.id || i} className={`t-round-row ${active ? 'active' : ''}`}>
                  <div className="t-round-row-accent" aria-hidden />
                  <div className="t-round-row-top">
                    <div className="t-round-row-left">
                      <span className="t-round-index">{i + 1}</span>
                      <span className="t-round-row-name">{round.name || `Round ${i + 1}`}</span>
                    </div>
                    <div className="t-round-row-badges">
                      {active && <span className="t-round-live-badge">Live</span>}
                      {!active && (
                        <span className="t-round-count-badge">{intervalCount} slot{intervalCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="t-round-row-times">
                    {(round.intervals || []).map((iv, j) => (
                      <div key={j} className="t-round-interval">
                        <span className="t-round-interval-label">Window {j + 1}</span>
                        <div className="t-round-interval-row">
                          <span className="t-round-interval-range">{fmtDateTime(iv.startDate)}</span>
                          <span className="t-round-interval-arrow" aria-hidden>→</span>
                          <span className="t-round-interval-range">{fmtDateTime(iv.endDate)}</span>
                        </div>
                      </div>
                    ))}
                    {(!round.intervals || round.intervals.length === 0) && (
                      <div className="t-round-interval t-round-interval--muted">Schedule TBA</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Tournament Card ────────────────────────────────────────────────────── */
function TournamentCard({ t, walletAddress }) {
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const activeRound = (t.rounds || []).find(isRoundActive);
  const canJoin = !!activeRound && !!walletAddress;
  const statusClass = String(t.status || '').toLowerCase();
  const roundCount = t.rounds?.length || 0;

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      const r = await apiFetch(`/intraverse/tournaments/${t.id}/rounds/${activeRound.id}/join`, {
        method: 'POST',
        body: JSON.stringify({ walletAddress }),
      });
      if (!r.ok) throw new Error(r.data?.error || 'Failed to join');
      setJoined(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <div className="t-card" onClick={() => setModalOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setModalOpen(true);
        }
      }}>
        {t.image && (
          <div className="t-card-cover">
            <img src={t.image} alt={t.name} className="t-card-cover-img" />
            <div className="t-card-cover-overlay" />
          </div>
        )}
        <div className="t-card-status-row">
          <span className={`t-card-status-pill ${statusClass}`}>{t.status || 'Tournament'}</span>
          <span className="t-card-status-meta">{roundCount} {roundCount === 1 ? 'Round' : 'Rounds'}</span>
        </div>
        <div className="t-card-top">
          <div className="t-card-info">
            <div className="t-card-title">{t.name}</div>
            <div className="t-card-date">{fmtDate(t.startDate)} — {fmtDate(t.endDate)}</div>
            <div className="t-card-rounds">{activeRound ? `Live now: ${activeRound.name || 'Active round'}` : 'Waiting for next active round'}</div>
          </div>
        </div>
        <div className="t-card-strip" aria-hidden="true" />
        <div className="t-card-meta-grid">
          <div className="t-card-meta-box">
            <span className="t-card-meta-label">Access</span>
            <strong className="t-card-meta-value">{walletAddress ? 'Wallet Ready' : 'Connect Wallet'}</strong>
          </div>
          <div className="t-card-meta-box">
            <span className="t-card-meta-label">Join Window</span>
            <strong className="t-card-meta-value">{activeRound ? 'Open' : 'Closed'}</strong>
          </div>
        </div>
        {error && <div className="t-card-error">{error}</div>}
        <div className="t-card-actions" onClick={(e) => e.stopPropagation()}>
          {!joined ? (
            <button
              type="button"
              className="wz-btn wz-btn--sm wz-btn--primary wz-btn--grow t-btn t-btn-join"
              onClick={handleJoin}
              disabled={!canJoin || joining}
              title={!walletAddress ? 'Connect wallet first' : !activeRound ? 'No active round' : ''}
            >
              {joining ? 'Joining…' : 'Join'}
            </button>
          ) : (
            <span className="t-joined-badge">✓ Joined</span>
          )}
          <button type="button" className="wz-btn wz-btn--sm wz-btn--secondary wz-btn--grow t-btn t-btn-view" onClick={() => setModalOpen(true)}>
            View
          </button>
        </div>
      </div>
      {modalOpen && <RoundsModal tournament={t} onClose={() => setModalOpen(false)} />}
    </>
  );
}

/* ─── Tournament Section ─────────────────────────────────────────────────── */
function TournamentSection({ title, tournaments, walletAddress }) {
  if (!tournaments || tournaments.length === 0) return null;
  return (
    <section className="t-section">
      <h2 className="t-section-title">{title}</h2>
      <div className="t-cards-grid">
        {tournaments.map(t => (
          <TournamentCard key={t.id} t={t} walletAddress={walletAddress} />
        ))}
      </div>
    </section>
  );
}

function TournamentSkeletonCard() {
  return (
    <div className="t-card t-card--skeleton" aria-hidden="true">
      <div className="wz-skeleton t-skeleton-cover" />

      <div className="t-card-status-row">
        <div className="wz-skeleton t-skeleton-pill" />
        <div className="wz-skeleton t-skeleton-meta" />
      </div>

      <div className="t-card-top">
        <div className="t-card-info">
          <div className="wz-skeleton t-skeleton-title" />
          <div className="wz-skeleton t-skeleton-date" />
          <div className="wz-skeleton t-skeleton-rounds" />
        </div>
      </div>

      <div className="wz-skeleton t-skeleton-strip" />

      <div className="t-card-meta-grid">
        <div className="t-card-meta-box">
          <div className="wz-skeleton t-skeleton-box-label" />
          <div className="wz-skeleton t-skeleton-box-value" />
        </div>
        <div className="t-card-meta-box">
          <div className="wz-skeleton t-skeleton-box-label" />
          <div className="wz-skeleton t-skeleton-box-value" />
        </div>
      </div>

      <div className="t-card-actions">
        <div className="wz-skeleton t-skeleton-action" />
        <div className="wz-skeleton t-skeleton-action t-skeleton-action--secondary" />
      </div>
    </div>
  );
}

function TournamentSkeletonSection({ title, count = 2 }) {
  return (
    <section className="t-section t-section--skeleton" aria-hidden="true">
      <div className="t-section-title t-section-title--skeleton">{title}</div>
      <div className="t-cards-grid">
        {Array.from({ length: count }, (_, idx) => (
          <TournamentSkeletonCard key={`${title}-${idx}`} />
        ))}
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function InterversePlayPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected, disconnect } = useWallet();
  const openLogin = () => navigate('/login', { state: { from: location.pathname } });
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getTournaments()
      .then((res) => {
        if (!res?.body?.data) throw new Error(res?.body?.message || 'No tournaments found');
        setTournaments(res.body.data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = tournaments.filter(t => t.status === 'RUNNING');
  const upcoming = tournaments.filter(t => t.status === 'UPCOMING');
  const previous = tournaments.filter(t => t.status === 'FINISHED');
  const hasKnownStatus = active.length + upcoming.length + previous.length > 0;
  const others = hasKnownStatus ? [] : tournaments;

  return (
    <>
      <div className="min-h-screen bg-background relative overflow-x-hidden pb-36 sm:pb-0">
        <div className="fixed inset-0 z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-30">
            <source src="/videos/war-scene.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-background/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/60 to-background/95" />
        </div>

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
                <Trophy className="w-4 h-4 sm:w-6 sm:h-6 shrink-0 text-gold animate-pulse-glow" />
                <h1 className="font-orbitron text-sm sm:text-lg md:text-xl font-bold leading-none text-gradient-sunset whitespace-nowrap">TOURNAMENTS</h1>
              </div>
              <div className="relative z-10 hidden sm:block">
                <PageWalletControls
                  isConnected={isConnected}
                  address={address}
                  onDisconnect={disconnect}
                  onRequestLogin={openLogin}
                />
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

        <div className="relative z-10 pt-14 sm:pt-16">
          <div className="hazard-stripe-sm h-3" />
          <div
            className="overflow-hidden py-3 border-b border-gold/20"
            style={{
              background: 'linear-gradient(90deg, hsl(20,35%,6%) 0%, hsl(20,30%,10%) 50%, hsl(20,35%,6%) 100%)',
            }}
          >
            <div className="flex animate-marquee whitespace-nowrap">
              {[...TOURNAMENT_MARQUEE_ITEMS, ...TOURNAMENT_MARQUEE_ITEMS].map((item, i) => (
                <span key={`${item}-${i}`} className="flex items-center mx-6 sm:mx-10">
                  <Star className="w-3 h-3 text-gold mr-2" fill="hsl(42,100%,50%)" />
                  <span className="font-orbitron text-sm sm:text-base font-black text-foreground tracking-wider">
                    {item}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <section className="relative overflow-hidden">
            <div className="scan-line" />
            <motion.img
              src={decoLamp}
              alt=""
              className="absolute right-2 top-4 w-10 sm:w-14 z-[1] opacity-40 pointer-events-none"
              animate={{
                filter: [
                  'drop-shadow(0 0 12px hsl(28,100%,50%,0.5))',
                  'drop-shadow(0 0 24px hsl(28,100%,50%,0.8))',
                  'drop-shadow(0 0 12px hsl(28,100%,50%,0.5))',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              loading="lazy"
            />
            <img
              src={decoChain}
              alt=""
              className="absolute left-2 top-1/4 w-5 z-[1] hidden xl:block opacity-20 pointer-events-none"
              loading="lazy"
            />

            <div className="container mx-auto px-4 relative z-10 pb-28 pt-6 sm:pt-8">
              {!isConnected && (
                <div className="iplay-wallet-warn mb-6">
                  Connect your wallet to join tournaments.
                </div>
              )}

              {loading && (
                <div className="t-loading-state">
                  <p className="wz-loading-label">Loading tournaments</p>
                  <TournamentSkeletonSection title="Active Tournaments" count={2} />
                  <TournamentSkeletonSection title="Upcoming Tournaments" count={2} />
                </div>
              )}
              {error && <div className="intraverse-feedback-card error">{error}</div>}

              {!loading && !error && (
                <>
                  <TournamentSection title="Active Tournaments" tournaments={active} walletAddress={address} />
                  <TournamentSection title="Upcoming Tournaments" tournaments={upcoming} walletAddress={address} />
                  <TournamentSection title="Previous Tournaments" tournaments={previous} walletAddress={address} />
                  <TournamentSection title="Other Tournaments" tournaments={others} walletAddress={address} />
                  {tournaments.length === 0 && (
                    <div className="intraverse-feedback-card">No tournaments found.</div>
                  )}
                </>
              )}
            </div>

            <img
              src={decoRubble}
              alt=""
              className="absolute bottom-0 left-0 w-36 sm:w-52 z-[1] opacity-25 pointer-events-none"
              loading="lazy"
            />
            <img
              src={decoRubble}
              alt=""
              className="absolute bottom-0 right-0 w-28 sm:w-44 z-[1] opacity-15 pointer-events-none -scale-x-100"
              loading="lazy"
            />
          </section>
        </div>
      </div>

      <MobileBottomNav current="tournament" />
    </>
  );
}
