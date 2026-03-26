import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../config/api';

function readFromSearch(search) {
  const params = new URLSearchParams(search);
  return {
    idToken: params.get('idToken') || params.get('token') || '',
    refreshToken: params.get('refreshToken') || '',
    userId: params.get('userId') || params.get('user') || '',
  };
}

function readFromPath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const callbackIndex = parts.indexOf('callback');
  if (callbackIndex < 0) {
    return { idToken: '', refreshToken: '', userId: '' };
  }

  const idToken = decodeURIComponent(parts[callbackIndex + 1] || '');
  const refreshToken = decodeURIComponent(parts[callbackIndex + 2] || '');
  const userId = decodeURIComponent(parts[callbackIndex + 3] || '');

  return { idToken, refreshToken, userId };
}

export default function IntraverseLogin() {
  const location = useLocation();
  const navigate = useNavigate();

  const callbackData = useMemo(() => {
    const pathData = readFromPath(location.pathname);
    const queryData = readFromSearch(location.search);

    return {
      idToken: pathData.idToken || queryData.idToken,
      refreshToken: pathData.refreshToken || queryData.refreshToken,
      userId: pathData.userId || queryData.userId,
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    const finalize = async () => {
      try {
        if (!callbackData.idToken && !callbackData.userId) {
          console.warn('[intraverse] callback loaded but no auth values found in URL');
          navigate('/', { replace: true });
          return;
        }

        const response = await fetch(buildApiUrl('/test/intraverse/auth/user-login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: callbackData.idToken,
            userId: callbackData.userId,
          }),
        });
        const data = await response.json();

        const intraverseUserId = String(data?.intraverseUserId || '').trim();
        if (response.ok && intraverseUserId) {
          localStorage.removeItem('intraverseIdToken');
          localStorage.removeItem('intraverseRefreshToken');
          localStorage.setItem('intraverseUserId', intraverseUserId);
          localStorage.setItem('walletConnected', 'true');
          if (data?.walletAddress) {
            localStorage.setItem('walletAddress', String(data.walletAddress));
          }
          if (data?.token) {
            localStorage.setItem('token', String(data.token));
          }
          if (data?.Intraverse) {
            localStorage.setItem('Intraverse', JSON.stringify(data.Intraverse));
          } else {
            localStorage.setItem('Intraverse', JSON.stringify({
              userId: intraverseUserId,
              userName: data?.user?.name || '',
            }));
          }
          if (data?.user) {
            localStorage.setItem('intraverseUserInfo', JSON.stringify(data.user));
          }
          window.dispatchEvent(new Event('intraverse-user-saved'));
        } else {
          console.warn('[intraverse] user-login failed', data);
        }
      } catch (error) {
        console.error('[intraverse] user-login request failed', error);
      } finally {
        // Redirect after storing so this page only handles callback work.
        navigate('/dashboard', { replace: true });
      }
    };

    finalize();
  }, [callbackData, navigate]);

  return <div>Signing in...</div>;
}
