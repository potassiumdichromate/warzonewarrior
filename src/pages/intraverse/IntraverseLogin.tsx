import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../config/api';

function decodeSegment(value) {
  try {
    return decodeURIComponent(value || '').trim();
  } catch {
    return String(value || '').trim();
  }
}

function uniqueValues(values) {
  return Array.from(new Set(values.map((value) => decodeSegment(value)).filter(Boolean)));
}

function readFromSearch(search) {
  const params = new URLSearchParams(search);
  return uniqueValues([
    params.get('idToken') || '',
    params.get('token') || '',
    params.get('accessToken') || '',
    params.get('id_token') || '',
  ]);
}

function readFromPath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const callbackIndex = parts.lastIndexOf('callback');
  if (callbackIndex < 0) {
    return [];
  }

  const callbackTail = parts.slice(callbackIndex + 1).map((part) => decodeSegment(part));
  if (!callbackTail.length) {
    return [];
  }

  const jwtLikeSegments = callbackTail.filter((part) => part.split('.').length >= 3);
  const callbackTailWithoutLast = callbackTail.length > 1
    ? callbackTail.slice(0, -1).join('/')
    : '';

  return uniqueValues([
    ...jwtLikeSegments,
    callbackTail[2] || '',
    callbackTail[callbackTail.length - 1] || '',
    callbackTailWithoutLast,
    callbackTail.join('/'),
    callbackTail[0] || '',
  ]);
}

function persistIntraverseSession(data) {
  const intraverseUserId = String(data?.intraverseUserId || '').trim();
  if (!intraverseUserId) {
    return false;
  }

  localStorage.removeItem('intraverseIdToken');
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
  return true;
}

export default function IntraverseLogin() {
  const location = useLocation();
  const navigate = useNavigate();

  const callbackData = useMemo(() => {
    const pathCandidates = readFromPath(location.pathname);
    const queryCandidates = readFromSearch(location.search);

    return {
      idTokenCandidates: uniqueValues([...queryCandidates, ...pathCandidates]),
    };
  }, [location.pathname, location.search]);

  useEffect(() => {
    const finalize = async () => {
      try {
        if (!callbackData.idTokenCandidates.length) {
          console.warn('[intraverse] callback loaded but no auth values found in URL');
          navigate('/', { replace: true });
          return;
        }

        let loginSucceeded = false;

        for (const [index, idToken] of callbackData.idTokenCandidates.entries()) {
          try {
            const response = await fetch(buildApiUrl('/intraverse/auth/user-login'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                idToken,
              }),
            });
            const data = await response.json();

            if (response.ok && persistIntraverseSession(data)) {
              loginSucceeded = true;
              break;
            }

            console.warn('[intraverse] user-login failed for callback candidate', {
              candidateIndex: index,
              candidateCount: callbackData.idTokenCandidates.length,
              tokenLength: idToken.length,
              ok: response.ok,
            });
          } catch (candidateError) {
            console.error('[intraverse] user-login request failed for callback candidate', {
              candidateIndex: index,
              candidateCount: callbackData.idTokenCandidates.length,
              tokenLength: idToken.length,
              error: candidateError,
            });
          }
        }

        if (!loginSucceeded) {
          console.warn('[intraverse] no callback token candidate succeeded', {
            candidateCount: callbackData.idTokenCandidates.length,
            pathname: location.pathname,
          });
        }
      } catch (error) {
        console.error('[intraverse] user-login request failed', error);
      } finally {
        // Redirect after storing so this page only handles callback work.
        navigate('/', { replace: true });
      }
    };

    finalize();
  }, [callbackData, location.pathname, navigate]);

  return <div>Signing in...</div>;
}
