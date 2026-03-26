import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

function readTokenFromSearch(search) {
  const params = new URLSearchParams(search);
  return params.get('token') || '';
}

export default function IntraverseLogin() {
  const { idToken } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const token = useMemo(() => {
    return idToken || readTokenFromSearch(location.search);
  }, [idToken, location.search]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('intraverseIdToken', token);
    }

    // Redirect after storing so this page only handles callback work.
    navigate('/', { replace: true });
  }, [token, navigate]);

  return <div>Signing in...</div>;
}
