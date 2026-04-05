import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../config/api';
import { useWallet } from '../../contexts/WalletContext';
import ThemedBackButton from '../../components/ThemedBackButton';
import MobileBottomNav from '../../components/MobileBottomNav';
import warzoneLogo from '../../assets/logo.png';
import './InterversePlayPage.css';

const TOURNAMENT_SLUG = 'kult-games';
const INTRAVERSE_GAME_URL = `https://intraverse.gg/games/${TOURNAMENT_SLUG}`;

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

  return (
    <div className="t-modal-overlay" onClick={onClose}>
      <div className="t-modal" onClick={e => e.stopPropagation()}>
        {tournament.image && (
          <div className="t-modal-hero">
            <img src={tournament.image} alt={tournament.name} className="t-modal-hero-img" />
            <div className="t-modal-hero-overlay" />
          </div>
        )}
        <div className="t-modal-header">
          <div className="t-modal-heading">
            <span className={`t-modal-status ${String(tournament.status || '').toLowerCase()}`}>
              {tournament.status || 'Tournament'}
            </span>
            <h3 className="t-modal-title">{tournament.name}</h3>
            <p className="t-modal-subtitle">
              {fmtDate(tournament.startDate)} — {fmtDate(tournament.endDate)}
            </p>
          </div>
          <button type="button" className="wz-btn wz-btn--icon wz-btn--ghost t-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        </div>
        <div className="t-modal-body">
          <div className="t-modal-summary">
            <div className="t-modal-summary-card">
              <span className="t-modal-summary-label">Rounds</span>
              <strong className="t-modal-summary-value">{roundCount}</strong>
            </div>
            <div className="t-modal-summary-card">
              <span className="t-modal-summary-label">Current Status</span>
              <strong className="t-modal-summary-value">{activeRound ? 'Live Round' : 'Waiting'}</strong>
            </div>
          </div>

          {(!tournament.rounds || tournament.rounds.length === 0) && (
            <p className="t-modal-empty">No rounds available.</p>
          )}
          {(tournament.rounds || []).map((round, i) => {
            const active = isRoundActive(round);
            const intervalCount = round?.intervals?.length || 0;
            return (
              <div key={round.id || i} className={`t-round-row ${active ? 'active' : ''}`}>
                <div className="t-round-row-left">
                  <span className="t-round-row-name">{round.name || `Round ${i + 1}`}</span>
                  {active && <span className="t-round-live-badge">Live</span>}
                  {!active && <span className="t-round-count-badge">{intervalCount} slots</span>}
                </div>
                <div className="t-round-row-times">
                  {(round.intervals || []).map((iv, j) => (
                    <span key={j} className="t-round-interval">
                      <span className="t-round-interval-label">Window {j + 1}</span>
                      <span>{fmtDateTime(iv.startDate)} → {fmtDateTime(iv.endDate)}</span>
                    </span>
                  ))}
                  {(!round.intervals || round.intervals.length === 0) && (
                    <span className="t-round-interval">TBA</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
      const r = await apiFetch(`/test/intraverse/tournaments/${t.id}/rounds/${activeRound.id}/join`, {
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
  const { address, isConnected } = useWallet();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    apiFetch(`/test/intraverse/tournaments?slug=${TOURNAMENT_SLUG}&size=20`)
      .then(r => {
        console.log('[Tournaments] API response:', r);
        if (!r.data?.body?.data) throw new Error(r.data?.body?.message || 'No tournaments found');
        console.log('[Tournaments] data:', r.data.body.data);
        setTournaments(r.data.body.data);
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
    <div className="intraverse-page">
      <div className="intraverse-page-inner">
        <ThemedBackButton
          className="intraverse-top-back-btn"
          onClick={() => navigate('/dashboard')}
          compact
        />
        <div className="intraverse-brand-lockup" aria-hidden="true">
          <img src={warzoneLogo} alt="Warzone Warriors" className="intraverse-brand-logo" />
        </div>

        <h1 className="t-page-title">Tournaments</h1>
        <div className="t-page-scroll">
          {!isConnected && (
            <div className="iplay-wallet-warn">
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
              <TournamentSection title="Tournaments" tournaments={others} walletAddress={address} />
              {tournaments.length === 0 && (
                <div className="intraverse-feedback-card">No tournaments found.</div>
              )}
            </>
          )}
        </div>

        <MobileBottomNav current="tournament" />
      </div>
    </div>
  );
}
