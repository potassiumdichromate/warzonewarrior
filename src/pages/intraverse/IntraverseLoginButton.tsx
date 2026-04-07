import React, { useState } from 'react';
import { buildApiUrl } from '../../config/api';

export default function IntraverseLoginButton() {
  const [loading, setLoading] = useState(false);

  const startIntraverseLogin = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/intraverse/auth/magic-link'));
      const data = await response.json();

      if (!response.ok || !data?.success || !data?.magicLoginUrl) {
        throw new Error(data?.message || 'Failed to start Intraverse login');
      }

      localStorage.setItem('intraversePendingAuthHash', data.authHash || '');
      localStorage.setItem('intraverseClientKey', data.clientKey || '');
      localStorage.setItem('intraverseMagicLoginUrl', data.magicLoginUrl);

      window.location.assign(data.magicLoginUrl);
    } catch (error) {
      window.alert(error.message || 'Failed to start Intraverse login.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#0b1220',
      }}
    >
      <button
        type="button"
        onClick={startIntraverseLogin}
        disabled={loading}
        style={{
          padding: '14px 24px',
          borderRadius: 10,
          border: '1px solid #334155',
          background: '#1d4ed8',
          color: '#ffffff',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Opening...' : 'Intraverse Login (Test)'}
      </button>
    </div>
  );
}
