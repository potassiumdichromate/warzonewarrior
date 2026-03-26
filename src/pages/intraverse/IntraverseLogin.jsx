import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
    if (callbackData.idToken) {
      localStorage.setItem('intraverseIdToken', callbackData.idToken);
    }
    if (callbackData.refreshToken) {
      localStorage.setItem('intraverseRefreshToken', callbackData.refreshToken);
    }
    if (callbackData.userId) {
      localStorage.setItem('intraverseUserId', callbackData.userId);
    }

    if (callbackData.idToken || callbackData.refreshToken || callbackData.userId) {
      window.dispatchEvent(new Event('intraverse-token-saved'));
    } else {
      console.warn('[intraverse] callback loaded but no auth values found in URL');
    }

    // Redirect after storing so this page only handles callback work.
    navigate('/', { replace: true });
  }, [callbackData, navigate]);

  return <div>Signing in...</div>;
}
