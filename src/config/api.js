// const DEFAULT_API_ORIGIN = 'https://api.warzonewarriors.xyz';
const DEFAULT_API_ORIGIN = 'http://localhost:3300';
const API_PATH_PREFIX = '/warzone';

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || DEFAULT_API_ORIGIN;
export const API_BASE_URL = `${API_ORIGIN}${API_PATH_PREFIX}`;

export const buildApiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

