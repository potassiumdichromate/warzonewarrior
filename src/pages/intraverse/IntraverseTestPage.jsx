import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const BASE = `${API_BASE_URL}/test/intraverse`;
const DOCS_BASE = 'https://api.intraverse.io/docs/api';

const AUTH_REFERENCE = [
  {
    title: 'Public APIs',
    summary: 'No authentication required. Use these for games, public guilds, and wallet NFT lookups.',
    badge: 'No Auth',
    color: '#38bdf8',
  },
  {
    title: 'User JWT',
    summary: 'Required for protected guild endpoints and user score lookups. Paste only the user bearer token in this page.',
    badge: 'Frontend Input',
    color: '#f59e0b',
  },
  {
    title: 'Game Client Key',
    summary: 'Sent only by the backend proxy as `x-game-key` for client-authenticated endpoints.',
    badge: 'Backend Only',
    color: '#8b5cf6',
  },
  {
    title: 'Game Server Key',
    summary: 'Sent only by the backend proxy as `x-game-server-key` for score submission endpoints.',
    badge: 'Backend Only',
    color: '#22c55e',
  },
];

const SCHEMA_REFERENCE = [
  {
    title: 'Guild DTO',
    slug: 'schemas/guild-dto',
    summary: 'Guild object used across public and protected guild responses.',
  },
  {
    title: 'Set New Game Point Request',
    slug: 'schemas/set-new-game-point-request',
    summary: 'Request body for `POST /api/v2/game-point/`.',
  },
  {
    title: 'Get User Game Score Response',
    slug: 'schemas/get-user-game-score-response',
    summary: 'Response shape for `GET /api/v2/game-point/game-client/:roundId`.',
  },
  {
    title: 'Calculate Tournament Score Request',
    slug: 'schemas/calculate-tournament-score-request',
    summary: 'Input DTO for tournament score calculation flows.',
  },
  {
    title: 'Calculate Tournament Score Response',
    slug: 'schemas/calculate-tournament-score-response',
    summary: 'Output DTO for tournament score calculation flows.',
  },
  {
    title: 'Drop DTO',
    slug: 'schemas/drop-dto',
    summary: 'Core drop schema returned by drop-related APIs.',
  },
  {
    title: 'List Drops Response',
    slug: 'schemas/list-drops-response',
    summary: 'Paginated collection shape used by drop listings.',
  },
  {
    title: 'Marketplace DTO',
    slug: 'schemas/marketplace-dto',
    summary: 'Marketplace metadata attached to drop resources.',
  },
  {
    title: 'Mint Phase DTO',
    slug: 'schemas/mint-phase-dto',
    summary: 'Mint phase configuration nested inside drop responses.',
  },
  {
    title: 'Rarity DTO',
    slug: 'schemas/rarity-dto',
    summary: 'Rarity object used inside NFT/drop payloads.',
  },
  {
    title: 'Game Token Response',
    slug: 'schemas/game-token-response',
    summary: 'Token-related response schema from game auth flows.',
  },
  {
    title: 'Verify Privy Payload',
    slug: 'schemas/verify-privy-payload',
    summary: 'Schema used by Privy payload verification flows.',
  },
];

const SECTIONS = [
  {
    id: 'smoke',
    label: 'Smoke Test',
    color: '#f59e0b',
    endpoints: [
      {
        id: 'smoke-all',
        label: 'Run configured smoke test',
        method: 'GET',
        path: '/',
        auth: 'optional-jwt',
        description: 'Backend runs representative public APIs and protected ones when a JWT is present.',
        docPath: 'authentication/',
      },
    ],
  },
  {
    id: 'games',
    label: 'Games API',
    color: '#38bdf8',
    endpoints: [
      {
        id: 'games-list',
        label: 'List Public Games',
        method: 'GET',
        path: '/games',
        auth: 'public',
        description: 'GET /api/v2/public/games',
        docPath: 'games/list-public-games',
        queryFields: [
          { key: 'size', label: 'Size', default: '10' },
          { key: 'orderBy', label: 'Order By', default: '' },
          { key: 'order', label: 'Order', default: '' },
          { key: 'key', label: 'Cursor Key', default: '' },
          { key: 'direction', label: 'Direction', default: '' },
        ],
      },
      {
        id: 'games-slug',
        label: 'Get Public Game',
        method: 'GET',
        path: '/games/:slug',
        auth: 'public',
        description: 'GET /api/v2/public/games/:slug',
        docPath: 'games/get-public-game',
        params: [{ key: 'slug', label: 'Game Slug', default: 'kult-games' }],
      },
      {
        id: 'games-versions',
        label: 'Get Game Versions',
        method: 'GET',
        path: '/games/:slug/versions',
        auth: 'public',
        description: 'GET /api/v2/public/games/:slug/versions',
        docPath: 'games/get-game-versions',
        params: [{ key: 'slug', label: 'Game Slug', default: 'kult-games' }],
      },
    ],
  },
  {
    id: 'guilds-public',
    label: 'Guilds API',
    color: '#a78bfa',
    endpoints: [
      {
        id: 'guilds-list',
        label: 'List Public Guilds',
        method: 'GET',
        path: '/guilds',
        auth: 'public',
        description: 'GET /api/v2/guilds/public',
        docPath: 'guilds/list-public-guilds',
        schemas: ['Guild DTO'],
        queryFields: [
          { key: 'size', label: 'Size', default: '10' },
          { key: 'name', label: 'Name Filter', default: '' },
          { key: 'orderBy', label: 'Order By', default: '' },
          { key: 'order', label: 'Order', default: '' },
          { key: 'key', label: 'Cursor Key', default: '' },
          { key: 'direction', label: 'Direction', default: '' },
        ],
      },
      {
        id: 'guild-by-id',
        label: 'Get Public Guild',
        method: 'GET',
        path: '/guilds/:id',
        auth: 'public',
        description: 'GET /api/v2/guilds/public/:id',
        docPath: 'guilds/get-public-guild',
        schemas: ['Guild DTO'],
        params: [{ key: 'id', label: 'Guild ID', default: '' }],
      },
      {
        id: 'guild-by-slug',
        label: 'Get Guild By Slug',
        method: 'GET',
        path: '/guilds/slug/:slug',
        auth: 'public',
        description: 'GET /api/v2/guilds/slug/:slug',
        docPath: 'guilds/get-guild-by-slug',
        schemas: ['Guild DTO'],
        params: [{ key: 'slug', label: 'Guild Slug', default: 'kult-games' }],
      },
      {
        id: 'guild-me',
        label: 'Get My Guild',
        method: 'GET',
        path: '/guilds/me',
        auth: 'jwt',
        description: 'GET /api/v2/guilds/me',
        docPath: 'guilds/get-my-guild',
        schemas: ['Guild DTO'],
      },
      {
        id: 'guild-member',
        label: 'Get Guild Member',
        method: 'GET',
        path: '/guilds/:guildId/members/:userId',
        auth: 'jwt',
        description: 'GET /api/v2/guilds/:guildId/members/:userId',
        docPath: 'guilds/get-guild-member',
        params: [
          { key: 'guildId', label: 'Guild ID', default: '' },
          { key: 'userId', label: 'User ID', default: '' },
        ],
      },
    ],
  },
  {
    id: 'guild-tournaments',
    label: 'Guild Tournament API',
    color: '#f97316',
    endpoints: [
      {
        id: 'guild-tournament-create',
        label: 'Create Guild Tournament',
        method: 'POST',
        path: '/guild-tournaments',
        auth: 'jwt',
        description: 'POST /api/v2/guild-tournaments',
        docPath: 'guilds/create-guild-tournament',
        bodyLabel: 'Request body JSON. Replace the placeholder fields with the exact payload required by your guild tournament flow.',
        body: {
          tournamentId: '',
          notes: 'Replace with the documented request body from Intraverse before running.',
        },
      },
      {
        id: 'guild-tournament-list-my',
        label: 'List My Guild Tournaments',
        method: 'GET',
        path: '/guild-tournaments/my',
        auth: 'jwt',
        description: 'GET /api/v2/guild-tournaments/my',
        docPath: 'guilds/list-my-guild-tournaments',
        queryFields: [
          { key: 'size', label: 'Size', default: '10' },
          { key: 'status', label: 'Status', default: '' },
          { key: 'key', label: 'Cursor Key', default: '' },
          { key: 'direction', label: 'Direction', default: '' },
        ],
      },
      {
        id: 'guild-tournament-get',
        label: 'Get Guild Tournament',
        method: 'GET',
        path: '/guild-tournaments/:id',
        auth: 'jwt',
        description: 'GET /api/v2/guild-tournaments/:id',
        docPath: 'guilds/get-guild-tournament',
        params: [{ key: 'id', label: 'Guild Tournament ID', default: '' }],
      },
      {
        id: 'guild-tournament-treasury',
        label: 'Get Guild Tournament Treasury',
        method: 'GET',
        path: '/guild-tournaments/:id/treasury',
        auth: 'jwt',
        description: 'GET /api/v2/guild-tournaments/:id/treasury',
        docPath: 'guilds/get-guild-tournament-treasury',
        params: [{ key: 'id', label: 'Guild Tournament ID', default: '' }],
      },
      {
        id: 'guild-tournament-update',
        label: 'Update Guild Tournament',
        method: 'PATCH',
        path: '/guild-tournaments/:id',
        auth: 'jwt',
        description: 'PATCH /api/v2/guild-tournaments/:id',
        docPath: 'guilds/update-guild-tournament',
        params: [{ key: 'id', label: 'Guild Tournament ID', default: '' }],
        bodyLabel: 'Request body JSON. Replace the placeholder fields with the exact patch payload required by Intraverse.',
        body: {
          status: '',
          notes: 'Replace with the documented patch body before running.',
        },
      },
      {
        id: 'guild-tournament-launch',
        label: 'Launch Guild Tournament',
        method: 'POST',
        path: '/guild-tournaments/:id/launch',
        auth: 'jwt',
        description: 'POST /api/v2/guild-tournaments/:id/launch',
        docPath: 'guilds/launch-guild-tournament',
        params: [{ key: 'id', label: 'Guild Tournament ID', default: '' }],
      },
    ],
  },
  {
    id: 'drops',
    label: 'Drop API',
    color: '#ec4899',
    endpoints: [
      {
        id: 'drop-wallet-nfts',
        label: 'Get Wallet NFTs',
        method: 'GET',
        path: '/drop/:dropId/wallet-nfts',
        auth: 'public',
        description: 'GET /api/v2/drop/:dropId/walletNFTs',
        docPath: 'drop/get-wallet-nfts',
        schemas: ['Drop DTO', 'Marketplace DTO', 'Mint Phase DTO', 'Rarity DTO'],
        params: [{ key: 'dropId', label: 'Drop ID', default: '' }],
        queryFields: [{ key: 'walletAddress', label: 'Wallet Address', default: '' }],
      },
    ],
  },
  {
    id: 'game-point',
    label: 'Game Point API',
    color: '#22c55e',
    endpoints: [
      {
        id: 'game-point-post',
        label: 'Set New Game Point',
        method: 'POST',
        path: '/game-point',
        auth: 'server-key',
        description: 'POST /api/v2/game-point/',
        docPath: 'game-point/set-new-point',
        schemas: ['Set New Game Point Request'],
        bodyLabel: 'Request body JSON. Backend attaches `x-game-server-key` automatically.',
        body: {
          roundId: 'test-round-001',
          walletAddress: '0x0000000000000000000000000000000000000001',
          score: 100,
          roomId: 'test-room-001',
        },
      },
      {
        id: 'game-point-get',
        label: 'Get User Score',
        method: 'GET',
        path: '/game-point/:roundId',
        auth: 'client-key+jwt',
        description: 'GET /api/v2/game-point/game-client/:roundId',
        docPath: 'game-point/get-user-score',
        schemas: ['Get User Game Score Response'],
        params: [{ key: 'roundId', label: 'Round ID', default: 'test-round-001' }],
      },
    ],
  },
];

const METHOD_STYLE = {
  GET: { background: '#082f49', color: '#7dd3fc' },
  POST: { background: '#052e16', color: '#86efac' },
  PATCH: { background: '#431407', color: '#fdba74' },
};

function buildDocUrl(docPath) {
  return `${DOCS_BASE}/${docPath}`;
}

function getFieldStateKey(endpointId, kind, fieldKey) {
  return `${endpointId}_${kind}_${fieldKey}`;
}

function buildPath(endpoint, formState) {
  let path = endpoint.path;
  (endpoint.params || []).forEach((field) => {
    const value = formState[getFieldStateKey(endpoint.id, 'param', field.key)] ?? field.default ?? '';
    path = path.replace(`:${field.key}`, encodeURIComponent(value));
  });
  return path;
}

function buildQuery(endpoint, formState) {
  const query = new URLSearchParams();
  (endpoint.queryFields || []).forEach((field) => {
    const value = formState[getFieldStateKey(endpoint.id, 'query', field.key)] ?? field.default ?? '';
    if (String(value).trim()) {
      query.set(field.key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

function StatusBadge({ status }) {
  if (!status) return null;

  const ok = status >= 200 && status < 300;
  const warn = status >= 400 && status < 500;

  return (
    <span
      style={{
        display: 'inline-block',
        marginLeft: 8,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: ok ? '#14532d' : warn ? '#78350f' : '#7f1d1d',
        color: ok ? '#bbf7d0' : warn ? '#fde68a' : '#fecaca',
      }}
    >
      {status}
    </span>
  );
}

function ReferenceCard({ title, summary, color, badge, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'block',
        padding: 18,
        borderRadius: 18,
        border: `1px solid ${color}44`,
        background: 'linear-gradient(180deg, rgba(15,23,42,0.86), rgba(2,6,23,0.96))',
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 10px',
          borderRadius: 999,
          background: `${color}22`,
          color,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {badge}
      </div>
      <div style={{ marginTop: 12, color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>{title}</div>
      <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{summary}</div>
    </a>
  );
}

export default function IntraverseTestPage() {
  const [meta, setMeta] = useState(null);
  const [metaError, setMetaError] = useState('');
  const [formState, setFormState] = useState({});
  const [bodyOverrides, setBodyOverrides] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [userJwt, setUserJwt] = useState('');

  useEffect(() => {
    let active = true;

    axios
      .get(`${BASE}/meta`)
      .then((response) => {
        if (!active) return;
        setMeta(response.data);
      })
      .catch((error) => {
        if (!active) return;
        setMetaError(error.response?.data?.error || error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const setField = (endpointId, kind, fieldKey, value) => {
    setFormState((current) => ({
      ...current,
      [getFieldStateKey(endpointId, kind, fieldKey)]: value,
    }));
  };

  const call = async (endpoint) => {
    const resolvedPath = buildPath(endpoint, formState);
    const url = `${BASE}${resolvedPath}${buildQuery(endpoint, formState)}`;

    setLoading((current) => ({ ...current, [endpoint.id]: true }));
    setResults((current) => ({ ...current, [endpoint.id]: null }));

    try {
      const headers = {};
      if (endpoint.auth === 'jwt' || endpoint.auth === 'client-key+jwt' || endpoint.auth === 'optional-jwt') {
        if (userJwt.trim()) {
          headers['x-user-jwt'] = userJwt.trim();
        }
      }

      let response;

      if (endpoint.method === 'POST' || endpoint.method === 'PATCH') {
        const rawBody = bodyOverrides[endpoint.id];
        let body = endpoint.body;

        if (rawBody) {
          try {
            body = JSON.parse(rawBody);
          } catch {
            body = endpoint.body;
          }
        }

        response = await axios({
          method: endpoint.method.toLowerCase(),
          url,
          headers,
          data: body,
        });
      } else {
        response = await axios.get(url, { headers });
      }

      setResults((current) => ({
        ...current,
        [endpoint.id]: { status: response.status, data: response.data },
      }));
    } catch (error) {
      const payload = error.response
        ? { status: error.response.status, data: error.response.data }
        : { error: error.message };

      setResults((current) => ({
        ...current,
        [endpoint.id]: payload,
      }));
    } finally {
      setLoading((current) => ({ ...current, [endpoint.id]: false }));
    }
  };

  const runSection = async (section) => {
    for (const endpoint of section.endpoints) {
      // Sequential execution keeps the page readable and avoids spamming protected APIs in parallel.
      // eslint-disable-next-line no-await-in-loop
      await call(endpoint);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(59,130,246,0.16), transparent 28%), radial-gradient(circle at 85% 15%, rgba(168,85,247,0.16), transparent 22%), linear-gradient(180deg, #020617 0%, #0f172a 58%, #111827 100%)',
        color: '#e2e8f0',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
        padding: '32px 20px 48px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            padding: 24,
            borderRadius: 28,
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.88), rgba(2,6,23,0.94))',
            boxShadow: '0 24px 80px rgba(2,6,23,0.45)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'rgba(56,189,248,0.12)',
                  color: '#7dd3fc',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                Intraverse Test Area
              </div>
              <h1 style={{ margin: '14px 0 8px', fontSize: 34, lineHeight: 1.1, color: '#f8fafc' }}>
                Full API coverage for games, guilds, auth rules, and schema references
              </h1>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#94a3b8' }}>
                The backend proxy keeps `x-game-key` and `x-game-server-key` off the frontend. This page only needs a user JWT for protected guild and score endpoints.
              </p>
            </div>

            <a
              href={buildDocUrl('authentication/')}
              target="_blank"
              rel="noreferrer"
              style={{
                alignSelf: 'center',
                padding: '12px 16px',
                borderRadius: 14,
                border: '1px solid rgba(245,158,11,0.28)',
                background: 'rgba(245,158,11,0.08)',
                color: '#fbbf24',
                textDecoration: 'none',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              Open Auth Docs
            </a>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14,
              marginTop: 24,
            }}
          >
            <div style={{ padding: 16, borderRadius: 18, background: 'rgba(15,23,42,0.74)', border: '1px solid rgba(56,189,248,0.16)' }}>
              <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Proxy Base</div>
              <div style={{ marginTop: 8, color: '#e2e8f0', fontSize: 13 }}>{BASE}</div>
            </div>

            <div style={{ padding: 16, borderRadius: 18, background: 'rgba(15,23,42,0.74)', border: '1px solid rgba(99,102,241,0.16)' }}>
              <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Intraverse Base</div>
              <div style={{ marginTop: 8, color: '#e2e8f0', fontSize: 13 }}>{meta?.baseUrl || 'Loading…'}</div>
            </div>

            <div style={{ padding: 16, borderRadius: 18, background: 'rgba(15,23,42,0.74)', border: '1px solid rgba(34,197,94,0.16)' }}>
              <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Backend Keys</div>
              <div style={{ marginTop: 8, color: '#e2e8f0', fontSize: 13 }}>
                Server: {meta?.keysLoaded?.serverKey || 'Loading…'}
              </div>
              <div style={{ marginTop: 4, color: '#e2e8f0', fontSize: 13 }}>
                Client: {meta?.keysLoaded?.clientKey || 'Loading…'}
              </div>
            </div>

            <div style={{ padding: 16, borderRadius: 18, background: 'rgba(15,23,42,0.74)', border: '1px solid rgba(245,158,11,0.16)' }}>
              <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Frontend Need</div>
              <div style={{ marginTop: 8, color: '#e2e8f0', fontSize: 13 }}>
                Only a user JWT for protected endpoints.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#94a3b8' }}>User JWT for protected guild endpoints and score lookup</label>
            <input
              type="text"
              value={userJwt}
              onChange={(event) => setUserJwt(event.target.value)}
              placeholder="Paste Bearer token value here if you want to test protected endpoints"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 14,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(2,6,23,0.72)',
                color: '#e2e8f0',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {metaError ? (
            <div style={{ marginTop: 14, color: '#fca5a5', fontSize: 13 }}>Failed to load backend metadata: {metaError}</div>
          ) : null}
        </div>

        <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {AUTH_REFERENCE.map((item) => (
            <ReferenceCard
              key={item.title}
              title={item.title}
              summary={item.summary}
              color={item.color}
              badge={item.badge}
              href={buildDocUrl('authentication/')}
            />
          ))}
        </div>

        <div style={{ marginTop: 32, marginBottom: 18, color: '#cbd5e1', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
          Endpoint Runner
        </div>

        {SECTIONS.map((section) => (
          <section key={section.id} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  color: section.color,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: 999, background: section.color, boxShadow: `0 0 18px ${section.color}` }} />
                {section.label}
              </div>

              <button
                type="button"
                onClick={() => runSection(section)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: `1px solid ${section.color}55`,
                  background: `${section.color}18`,
                  color: section.color,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Run Section
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {section.endpoints.map((endpoint) => {
                const result = results[endpoint.id];
                const isLoading = loading[endpoint.id];
                const methodStyle = METHOD_STYLE[endpoint.method] || METHOD_STYLE.GET;

                return (
                  <div
                    key={endpoint.id}
                    style={{
                      borderRadius: 22,
                      overflow: 'hidden',
                      border: '1px solid rgba(148,163,184,0.16)',
                      background: 'linear-gradient(180deg, rgba(15,23,42,0.88), rgba(2,6,23,0.96))',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                          <span style={{ ...methodStyle, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                            {endpoint.method}
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>{endpoint.label}</span>
                        </div>
                        <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 13 }}>{endpoint.description}</div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12 }}>
                          <a href={buildDocUrl(endpoint.docPath)} target="_blank" rel="noreferrer" style={{ color: section.color, textDecoration: 'none' }}>
                            Docs
                          </a>
                          <span style={{ color: '#64748b' }}>
                            Auth: {endpoint.auth === 'client-key+jwt' ? 'backend client key + user JWT' : endpoint.auth.replace('-', ' ')}
                          </span>
                          {endpoint.schemas?.length ? (
                            <span style={{ color: '#64748b' }}>Schemas: {endpoint.schemas.join(', ')}</span>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => call(endpoint)}
                        disabled={isLoading}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 12,
                          border: 'none',
                          background: isLoading ? '#334155' : section.color,
                          color: '#020617',
                          fontWeight: 800,
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          opacity: isLoading ? 0.7 : 1,
                        }}
                      >
                        {isLoading ? 'Running…' : 'Run'}
                      </button>
                    </div>

                    {endpoint.params?.length ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                        {endpoint.params.map((field) => (
                          <label key={field.key} style={{ display: 'block' }}>
                            <div style={{ marginBottom: 6, color: '#94a3b8', fontSize: 12 }}>{field.label}</div>
                            <input
                              type="text"
                              value={formState[getFieldStateKey(endpoint.id, 'param', field.key)] ?? field.default ?? ''}
                              onChange={(event) => setField(endpoint.id, 'param', field.key, event.target.value)}
                              placeholder={field.default || `Enter ${field.label.toLowerCase()}`}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: 12,
                                border: '1px solid rgba(148,163,184,0.2)',
                                background: 'rgba(2,6,23,0.68)',
                                color: '#e2e8f0',
                                boxSizing: 'border-box',
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {endpoint.queryFields?.length ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: '14px 18px', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                        {endpoint.queryFields.map((field) => (
                          <label key={field.key} style={{ display: 'block' }}>
                            <div style={{ marginBottom: 6, color: '#94a3b8', fontSize: 12 }}>{field.label}</div>
                            <input
                              type="text"
                              value={formState[getFieldStateKey(endpoint.id, 'query', field.key)] ?? field.default ?? ''}
                              onChange={(event) => setField(endpoint.id, 'query', field.key, event.target.value)}
                              placeholder={field.default || 'Optional'}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: 12,
                                border: '1px solid rgba(148,163,184,0.2)',
                                background: 'rgba(2,6,23,0.68)',
                                color: '#e2e8f0',
                                boxSizing: 'border-box',
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {(endpoint.method === 'POST' || endpoint.method === 'PATCH') && endpoint.body ? (
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                        <div style={{ marginBottom: 8, color: '#94a3b8', fontSize: 12 }}>
                          {endpoint.bodyLabel || 'Request body JSON'}
                        </div>
                        <textarea
                          rows={6}
                          defaultValue={JSON.stringify(endpoint.body, null, 2)}
                          onChange={(event) =>
                            setBodyOverrides((current) => ({
                              ...current,
                              [endpoint.id]: event.target.value,
                            }))
                          }
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: 14,
                            border: '1px solid rgba(148,163,184,0.2)',
                            background: 'rgba(2,6,23,0.72)',
                            color: '#93c5fd',
                            boxSizing: 'border-box',
                            resize: 'vertical',
                          }}
                        />
                      </div>
                    ) : null}

                    {result ? (
                      <div style={{ padding: '14px 18px 18px' }}>
                        <div style={{ marginBottom: 8, fontSize: 12, color: '#cbd5e1' }}>
                          Response
                          {result.status ? <StatusBadge status={result.status} /> : null}
                          {result.error ? <span style={{ marginLeft: 8, color: '#fca5a5' }}>{result.error}</span> : null}
                        </div>
                        <pre
                          style={{
                            margin: 0,
                            padding: '14px 16px',
                            borderRadius: 16,
                            border: '1px solid rgba(148,163,184,0.14)',
                            background: '#020617',
                            color: '#bae6fd',
                            fontSize: 12,
                            lineHeight: 1.55,
                            overflow: 'auto',
                            maxHeight: 420,
                          }}
                        >
                          {JSON.stringify(result.data ?? result, null, 2)}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div style={{ marginTop: 36, marginBottom: 18, color: '#cbd5e1', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
          DTO / Schema Reference
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {SCHEMA_REFERENCE.map((schema) => (
            <ReferenceCard
              key={schema.title}
              title={schema.title}
              summary={schema.summary}
              color="#34d399"
              badge="Schema"
              href={buildDocUrl(schema.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
