import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../config/api';
import connectedBackgroundImage from '../../assets/images/Desktop - After connect.png';
import mobileAfterConnectImage from '../../assets/images/After-mobile.png';
import './InterversePlayPage.css';

const TOURNAMENT_SLUG = 'kult-games';

function formatDate(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(ms) {
  if (!ms) return 'TBA';
  return new Date(ms).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const map = {
    RUNNING: { label: 'Live', className: 'live' },
    UPCOMING: { label: 'Upcoming', className: 'upcoming' },
    FINISHED: { label: 'Finished', className: 'finished' },
  };
  const s = map[status] || map.FINISHED;
  return <span className={`intraverse-status-badge ${s.className}`}>{s.label}</span>;
}

function RoundsSection({ rounds }) {
  if (!Array.isArray(rounds) || rounds.length === 0) {
    return <p className="intraverse-empty-state">No rounds data.</p>;
  }

  return (
    <div className="intraverse-rounds-grid">
      {rounds.map((r, i) => (
        <div key={r.id || i} className="intraverse-round-card">
          <div className="intraverse-round-top">
            <div>
              <div className="intraverse-round-name">{r.name || `Round ${i + 1}`}</div>
              <div className="intraverse-round-meta">
                <span>{formatDateTime(r.startDate)}</span>
                <span>{formatDateTime(r.endDate)}</span>
              </div>
            </div>
            <div className="intraverse-round-side">
              <div className="intraverse-round-index">Round {i + 1}</div>
              {r.id && <div className="intraverse-round-id">ID: {r.id}</div>}
            </div>
          </div>

          <div className="intraverse-round-stats">
            <div className="intraverse-round-stat">
              <span className="intraverse-round-stat-label">Rewards</span>
              <span className="intraverse-round-stat-value">{Array.isArray(r.rewards) ? r.rewards.length : 0}</span>
            </div>
            <div className="intraverse-round-stat">
              <span className="intraverse-round-stat-label">Window</span>
              <span className="intraverse-round-stat-value">{r.startDate && r.endDate ? 'Scheduled' : 'TBA'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TournamentCard({ tournament }) {
  const [expanded, setExpanded] = useState(false);
  const roundCount = Array.isArray(tournament.rounds) ? tournament.rounds.length : 0;
  const previewRounds = Array.isArray(tournament.rounds) ? tournament.rounds.slice(0, 3) : [];

  return (
    <article className="intraverse-tournament-card">
      <div
        className="intraverse-tournament-header"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="intraverse-tournament-main">
          {tournament.image && (
            <img src={tournament.image} alt="" className="intraverse-tournament-image" />
          )}
          <div className="intraverse-tournament-text">
            <div className="intraverse-tournament-title-row">
              <h2 className="intraverse-tournament-title">{tournament.name}</h2>
              <StatusBadge status={tournament.status} />
            </div>
            <div className="intraverse-tournament-date">
              {formatDate(tournament.startDate)} — {formatDate(tournament.endDate)}
            </div>
            <div className="intraverse-round-preview">
              {previewRounds.length > 0 ? previewRounds.map((round, index) => (
                <span key={round.id || index} className="intraverse-round-pill">
                  {round.name || `Round ${index + 1}`}
                </span>
              )) : <span className="intraverse-round-pill muted">No rounds yet</span>}
              {roundCount > previewRounds.length && (
                <span className="intraverse-round-pill muted">+{roundCount - previewRounds.length} more</span>
              )}
            </div>
          </div>
        </div>
        <div className="intraverse-tournament-side">
          <div className="intraverse-stat-strip">
            <div className="intraverse-stat-chip">
              <span className="intraverse-stat-chip-value">{roundCount}</span>
              <span className="intraverse-stat-chip-label">Rounds</span>
            </div>
          </div>
          <span className="intraverse-expand-indicator">{expanded ? 'Collapse' : 'Expand'}</span>
        </div>
      </div>

      {expanded && (
        <div className="intraverse-tournament-detail">
          <RoundsSection rounds={tournament.rounds} />
        </div>
      )}
    </article>
  );
}

export default function InterversePlayPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetch(buildApiUrl(`/test/intraverse/tournaments?slug=${TOURNAMENT_SLUG}&size=20`))
      .then((r) => r.json())
      .then((data) => {
        if (!data?.body?.data) throw new Error(data?.body?.message || 'No data returned');
        setTournaments(data.body.data);
      })
      .catch((err) => setError(err.message || 'Failed to load tournaments'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  const liveTournament = tournaments.find((t) => t.status === 'RUNNING');

  return (
    <div
      className="intraverse-page"
      style={{
        '--desktop-bg': `url(${connectedBackgroundImage})`,
        '--mobile-bg': `url(${mobileAfterConnectImage})`,
      }}
    >
      <div className="intraverse-page-inner">
        <button className="intraverse-top-back-btn" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <header className="intraverse-hero">
          <div className="intraverse-hero-copy">
            <div className="intraverse-eyebrow">Intraverse // {TOURNAMENT_SLUG}</div>
            <h1>Tournaments</h1>
            <p>
              Browse active events, upcoming brackets, and finished campaigns in a Warzone-styled tournament hub.
              Open a tournament to inspect its rounds, connected NFT projects, and reward drops.
            </p>
          </div>
          <div className="intraverse-hero-side">
            <div className="intraverse-hero-live-card">
              <span className="intraverse-live-label">Spotlight</span>
              <strong>{liveTournament?.name || 'No live tournament'}</strong>
              <span>{liveTournament ? `${formatDate(liveTournament.startDate)} - ${formatDate(liveTournament.endDate)}` : 'Check upcoming events below'}</span>
            </div>
            <div className="intraverse-hero-actions">
              <button className="intraverse-primary-btn" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
              <button className="intraverse-secondary-btn" onClick={load}>
                Refresh
              </button>
            </div>
          </div>
        </header>

        <section className="intraverse-list">
          {loading && <div className="intraverse-feedback-card">Loading tournaments…</div>}
          {error && <div className="intraverse-feedback-card error">{error}</div>}
          {!loading && !error && tournaments.length === 0 && (
            <div className="intraverse-feedback-card">No tournaments found.</div>
          )}
          {!loading && !error && tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </section>

        <nav className="intraverse-mobile-nav">
          <button
            className="intraverse-nav-item"
            onClick={() => navigate('/dashboard?tab=home')}
          >
            <span className="intraverse-nav-icon intraverse-home-icon"></span>
            <span>Home</span>
          </button>
          <button
            className="intraverse-nav-item"
            onClick={() => navigate('/dashboard?tab=shop')}
          >
            <span className="intraverse-nav-icon intraverse-shop-icon"></span>
            <span>Shop</span>
          </button>
          <button
            className="intraverse-nav-item"
            onClick={() => navigate('/dashboard?tab=leaderboards')}
          >
            <span className="intraverse-nav-icon intraverse-trophy-icon"></span>
            <span>Ranks</span>
          </button>
          <button
            className="intraverse-nav-item active"
            onClick={() => navigate('/interverse-play')}
          >
            <span className="intraverse-nav-icon intraverse-tournament-icon"></span>
            <span>Tournament</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
