import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const BASE = `${API_BASE_URL}/test/intraverse`;

const SECTIONS = [
  {
    label: 'Master',
    color: '#f59e0b',
    endpoints: [
      {
        id: 'all',
        label: 'Run All APIs',
        method: 'GET',
        path: '/',
        description: 'Fires every Intraverse endpoint at once and returns combined results',
      },
    ],
  },
  {
    label: 'Games',
    color: '#3b82f6',
    endpoints: [
      {
        id: 'games-list',
        label: 'List Games',
        method: 'GET',
        path: '/games',
        description: 'GET /api/v2/public/games — public, no auth',
      },
      {
        id: 'games-slug',
        label: 'Get kult-games',
        method: 'GET',
        path: '/games/kult-games',
        description: 'GET /api/v2/public/games/kult-games',
      },
      {
        id: 'games-versions',
        label: 'Game Versions',
        method: 'GET',
        path: '/games/kult-games/versions',
        description: 'GET /api/v2/public/games/kult-games/versions',
      },
    ],
  },
  {
    label: 'Tournaments',
    color: '#f97316',
    endpoints: [
      {
        id: 'tournaments-list',
        label: 'List Tournaments',
        method: 'GET',
        path: '/tournaments',
        description: 'GET /api/v2/tournament/game/kult-games — public, no auth',
      },
      {
        id: 'tournament-by-id',
        label: 'Get Tournament by ID',
        method: 'GET',
        path: '/tournaments/:id',
        paramKey: 'tournamentId',
        paramDefault: '',
        paramLabel: 'Tournament ID',
        description: 'GET /api/v2/tournament/:id — fill in ID from list above',
      },
    ],
  },
  {
    label: 'Guilds',
    color: '#8b5cf6',
    endpoints: [
      {
        id: 'guilds-list',
        label: 'List Public Guilds',
        method: 'GET',
        path: '/guilds',
        description: 'GET /api/v2/guilds/public — public, no auth',
      },
      {
        id: 'guild-by-slug',
        label: 'Guild by Slug',
        method: 'GET',
        path: '/guilds/slug/kult-games',
        description: 'GET /api/v2/guilds/slug/kult-games',
      },
      {
        id: 'guild-by-id',
        label: 'Guild by ID',
        method: 'GET',
        path: '/guilds/:id',
        paramKey: 'guildId',
        paramDefault: '',
        paramLabel: 'Guild ID',
        description: 'GET /api/v2/guilds/public/:id — fill in ID from list above',
      },
    ],
  },
  {
    label: 'Drop (NFTs)',
    color: '#ec4899',
    endpoints: [
      {
        id: 'drop-wallet-nfts',
        label: 'Wallet NFTs',
        method: 'GET',
        path: '/drop/:dropId/wallet-nfts',
        paramKey: 'dropId',
        paramDefault: '',
        paramLabel: 'Drop ID',
        queryParam: 'walletAddress',
        queryDefault: '',
        queryLabel: 'Wallet Address (optional)',
        description: 'GET /api/v2/drop/:id/walletNFTs — public, no auth',
      },
    ],
  },
  {
    label: 'Game Point',
    color: '#10b981',
    endpoints: [
      {
        id: 'game-point-post',
        label: 'Set Game Point',
        method: 'POST',
        path: '/game-point',
        description: 'POST /api/v2/game-point/ — x-game-server-key (INTRAVERSE_SERVER_KEY)',
        body: {
          roundId: 'test-round-001',
          walletAddress: '0x0000000000000000000000000000000000000001',
          score: 100,
          roomId: 'test-room-001',
        },
      },
      {
        id: 'game-point-get',
        label: 'Get Score',
        method: 'GET',
        path: '/game-point/:roundId',
        paramKey: 'roundId',
        paramDefault: 'test-round-001',
        paramLabel: 'Round ID',
        description: 'GET /api/v2/game-point/game-client/:roundId — x-game-key + optional user JWT',
        jwtInput: true,
      },
    ],
  },
];

const METHOD_STYLE = {
  GET:  { bg: '#1e3a5f', color: '#93c5fd' },
  POST: { bg: '#064e3b', color: '#6ee7b7' },
};

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const ok = status >= 200 && status < 300;
  const warn = status >= 400 && status < 500;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 700,
      marginLeft: 8,
      background: ok ? '#166534' : warn ? '#92400e' : '#7f1d1d',
      color: ok ? '#bbf7d0' : warn ? '#fde68a' : '#fca5a5',
    }}>
      {status}
    </span>
  );
};

function buildPath(ep, params) {
  if (!ep.paramKey) return ep.path;
  const val = params[ep.id + '_param'] || ep.paramDefault;
  return ep.path.replace(`:${ep.paramKey}`, encodeURIComponent(val));
}

export default function IntraverseTestPage() {
  const [results, setResults]         = useState({});
  const [loading, setLoading]         = useState({});
  const [params, setParams]           = useState({});
  const [bodyOverrides, setBodyOverrides] = useState({});

  const setParam = (key, value) => setParams(p => ({ ...p, [key]: value }));

  const call = async (ep) => {
    const resolvedPath = buildPath(ep, params);
    let url = `${BASE}${resolvedPath}`;

    // Append query param if present
    if (ep.queryParam) {
      const qval = params[ep.id + '_query'] ?? ep.queryDefault;
      if (qval) url += `?${ep.queryParam}=${encodeURIComponent(qval)}`;
    }

    setLoading(p => ({ ...p, [ep.id]: true }));
    setResults(p => ({ ...p, [ep.id]: null }));

    try {
      const headers = {};
      if (ep.jwtInput) {
        const jwt = params[ep.id + '_jwt'] || '';
        if (jwt) headers['x-user-jwt'] = jwt;
      }

      let res;
      if (ep.method === 'POST') {
        const body = (() => {
          const raw = bodyOverrides[ep.id];
          if (!raw) return ep.body;
          try { return JSON.parse(raw); } catch { return ep.body; }
        })();
        res = await axios.post(url, body, { headers });
      } else {
        res = await axios.get(url, { headers });
      }

      console.log(`[intraverse-test] ${ep.method} ${resolvedPath}`, res.status, res.data);
      setResults(p => ({ ...p, [ep.id]: { status: res.status, data: res.data } }));
    } catch (err) {
      const errData = err.response
        ? { status: err.response.status, data: err.response.data }
        : { error: err.message };
      console.error(`[intraverse-test] ${ep.method} ${resolvedPath}`, errData);
      setResults(p => ({ ...p, [ep.id]: errData }));
    } finally {
      setLoading(p => ({ ...p, [ep.id]: false }));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'monospace', padding: '32px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
          Intraverse API Tester
        </h1>
        <p style={{ color: '#64748b', fontSize: 12, marginBottom: 36 }}>
          Proxy: <span style={{ color: '#f59e0b' }}>{BASE}</span>
          &nbsp;·&nbsp;Base: <span style={{ color: '#94a3b8' }}>https://api-stage.intraverse.io</span>
        </p>

        {SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 40 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              color: section.color, textTransform: 'uppercase',
              borderBottom: `1px solid ${section.color}33`,
              paddingBottom: 6, marginBottom: 16,
            }}>
              {section.label}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {section.endpoints.map(ep => {
                const result  = results[ep.id];
                const isLoading = loading[ep.id];
                const mStyle  = METHOD_STYLE[ep.method];

                return (
                  <div key={ep.id} style={{
                    background: '#1e293b',
                    borderRadius: 8,
                    border: '1px solid #334155',
                    overflow: 'hidden',
                  }}>
                    {/* Header row */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 16px', borderBottom: '1px solid #334155',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{ ...mStyle, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                        {ep.method}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 14, color: section.color }}>
                        {ep.label}
                      </span>
                      <span style={{ color: '#475569', fontSize: 11, flex: 1 }}>
                        {ep.description}
                      </span>
                      <button
                        onClick={() => call(ep)}
                        disabled={isLoading}
                        style={{
                          background: isLoading ? '#374151' : section.color,
                          color: '#fff', border: 'none', borderRadius: 6,
                          padding: '5px 14px', fontWeight: 700, fontSize: 12,
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          opacity: isLoading ? 0.6 : 1, whiteSpace: 'nowrap',
                        }}
                      >
                        {isLoading ? 'Loading…' : 'Run'}
                      </button>
                    </div>

                    {/* Path param input */}
                    {ep.paramKey && (
                      <div style={{ padding: '8px 16px', borderBottom: '1px solid #334155', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <label style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{ep.paramLabel}:</label>
                        <input
                          type="text"
                          placeholder={ep.paramDefault || `enter ${ep.paramKey}`}
                          defaultValue={ep.paramDefault}
                          onChange={e => setParam(ep.id + '_param', e.target.value)}
                          style={{
                            flex: 1, background: '#0f172a', color: '#a5f3fc',
                            border: '1px solid #334155', borderRadius: 4,
                            padding: '4px 8px', fontFamily: 'monospace', fontSize: 12,
                          }}
                        />
                      </div>
                    )}

                    {/* Query param input */}
                    {ep.queryParam && (
                      <div style={{ padding: '8px 16px', borderBottom: '1px solid #334155', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <label style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{ep.queryLabel}:</label>
                        <input
                          type="text"
                          placeholder={ep.queryDefault || `optional`}
                          defaultValue={ep.queryDefault}
                          onChange={e => setParam(ep.id + '_query', e.target.value)}
                          style={{
                            flex: 1, background: '#0f172a', color: '#a5f3fc',
                            border: '1px solid #334155', borderRadius: 4,
                            padding: '4px 8px', fontFamily: 'monospace', fontSize: 12,
                          }}
                        />
                      </div>
                    )}

                    {/* JWT input */}
                    {ep.jwtInput && (
                      <div style={{ padding: '8px 16px', borderBottom: '1px solid #334155', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <label style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>User JWT (optional):</label>
                        <input
                          type="text"
                          placeholder="paste user JWT token to test auth"
                          onChange={e => setParam(ep.id + '_jwt', e.target.value)}
                          style={{
                            flex: 1, background: '#0f172a', color: '#a5f3fc',
                            border: '1px solid #334155', borderRadius: 4,
                            padding: '4px 8px', fontFamily: 'monospace', fontSize: 12,
                          }}
                        />
                      </div>
                    )}

                    {/* POST body editor */}
                    {ep.method === 'POST' && (
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #334155' }}>
                        <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
                          Request Body (JSON) — walletAddress or userId required
                        </label>
                        <textarea
                          rows={5}
                          defaultValue={JSON.stringify(ep.body, null, 2)}
                          onChange={e => setBodyOverrides(p => ({ ...p, [ep.id]: e.target.value }))}
                          style={{
                            width: '100%', background: '#0f172a', color: '#a5f3fc',
                            border: '1px solid #334155', borderRadius: 6,
                            padding: '8px 10px', fontFamily: 'monospace', fontSize: 12,
                            resize: 'vertical', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    )}

                    {/* Response panel */}
                    {result && (
                      <div style={{ padding: '10px 16px' }}>
                        <div style={{ marginBottom: 6, fontSize: 12, color: '#94a3b8' }}>
                          Response
                          {result.status && <StatusBadge status={result.status} />}
                          {result.error && <span style={{ color: '#f87171', marginLeft: 8 }}>{result.error}</span>}
                        </div>
                        <pre style={{
                          background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
                          padding: '10px 12px', fontSize: 11, color: '#a5f3fc',
                          overflow: 'auto', maxHeight: 400, margin: 0,
                        }}>
                          {JSON.stringify(result.data ?? result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
