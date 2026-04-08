import axios from 'axios';
import { API_BASE_URL, buildApiUrl } from '../config/api';

const SESSION_CHANGED_EVENT = 'warzone-session-changed';

function notifySessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
  }
}

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies with requests
});

// Add a request interceptor to include the auth token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Leaderboard API
export const getLeaderboard = async () => {
  try {
    const response = await api.get('/leaderboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

// All-time (alternate DB) leaderboard
export const getAllTimeLeaderboard = async (params = {}) => {
  try {
    const response = await api.get('/leaderboard/allTime', { params });
    // newDBController returns { success, count, data }
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching all-time leaderboard:', error);
    throw error;
  }
};

/** Normalized row for the leaderboard UI (coins + optional XP). */
export type LeaderboardEntry = {
  rank: number;
  name: string;
  coins: number;
  experience: number;
};

/**
 * Accepts either all-time API rows `{ rank, name, coins, experience }` or legacy
 * `/leaderboard` rows `{ name, PlayerResources?: { coin } }`.
 */
export function normalizeLeaderboardRows(data: unknown): LeaderboardEntry[] {
  if (!Array.isArray(data) || data.length === 0) return [];

  const first = data[0] as Record<string, unknown>;
  const hasRank = typeof first?.rank === 'number';

  if (hasRank && first.name != null) {
    return (data as Record<string, unknown>[]).map((row) => ({
      rank: Number(row.rank),
      name: String(row.name ?? 'Unknown'),
      coins: Number(row.coins ?? 0),
      experience: Number(row.experience ?? 0),
    }));
  }

  const mapped = (data as Record<string, unknown>[]).map((row, i) => {
    const pr = row.PlayerResources as { coin?: number } | undefined;
    const coins = Number(pr?.coin ?? row.coins ?? 0);
    return {
      name: String(row.name ?? `Player ${i + 1}`),
      coins,
      experience: Number(row.experience ?? 0),
    };
  });
  mapped.sort((a, b) => b.coins - a.coins);
  return mapped.map((r, i) => ({ ...r, rank: i + 1 }));
}

// Name APIs
export const checkNameAvailability = async (name) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.post('/name', { 
      name 
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error checking name availability:', error);
    // If unauthorized, clear the token and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};

export const savePlayerName = async (name) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    const walletAddress = localStorage.getItem('walletAddress');
    const response = await api.post('/saveName', { 
      name,
      walletAddress
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error saving player name:', error);
    // If unauthorized, clear the token and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};

export const getPlayerName = async (walletAddress) => {
  try {
    const token = await localStorage.getItem('token');
    const response = await api.get(`/name?walletAddress=${walletAddress}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting player name:', error);
    // If unauthorized, clear the token and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    throw error;
  }
};

export const loginUser = async (walletAddress) => {
  try {
    // First, make sure we're not already logged in with this wallet
    // const currentWallet = getWalletAddress();
    // if (currentWallet && currentWallet.toLowerCase() === walletAddress.toLowerCase()) {
    //   console.log('Already logged in with this wallet');
    //   return { success: true, message: 'Already logged in' };
    // }

    // Clear any existing auth data
    localStorage.removeItem('token');
    
    // Make the login request
    const response = await api.post('/login', { walletAddress });
    
    // Log the full response for debugging
    console.log('Login response:', response);
    
    if (response.data && response.data.success) {
      // Store the wallet address in localStorage
      localStorage.setItem('walletAddress', walletAddress);
      
      // Store the token if provided
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Token stored in localStorage');
      } else {
        console.warn('No token received in login response');
      }

      notifySessionChanged();
      
      return response.data;
    } else {
      throw new Error(response.data?.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    // Clear any partial auth data on error
    localStorage.removeItem('token');
    localStorage.removeItem('walletAddress');
    notifySessionChanged();
    
    // Return a more detailed error message
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to connect to the server';
    
    throw new Error(errorMessage);
  }
};

export const updateMarketplaceData = async ({ type, value, orderId, txHash }) => {
  try {
    const response = await api.post('/iap/purchase', {
      category: type,
      product: value,
      orderId,
      txHash,
    });
    console.log('Marketplace update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Marketplace update failed:', error?.response?.data || error);
    throw error;
  }
};

export const getMarketplacePurchaseStatus = async ({ orderId, txHash }) => {
  try {
    const response = await api.get('/iap/purchase-status', {
      params: { orderId, txHash },
    });
    return response.data;
  } catch (error) {
    console.error('Marketplace purchase status failed:', error?.response?.data || error);
    throw error;
  }
};

export const getPlayerProfile = async (walletAddress) => {
  if (!walletAddress) throw new Error('walletAddress is required');
  try {
    const response = await api.get('/', {
      params: { walletAddress },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch player profile:', error?.response?.data || error);
    throw error;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('walletAddress');
};

export const getWalletAddress = () => {
  return localStorage.getItem('walletAddress');
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('walletAddress');
  notifySessionChanged();
  // Redirect to home or login page if needed
  window.location.href = '/';
};

export const getTournaments = async () => {
  const response = await fetch(
    buildApiUrl('/intraverse/tournaments?slug=warzone-warriors&size=20'),
  );
  return response.json();
};

export const checkNFTOwnership = async (walletAddress) => {
  try {
    const response = await api.get(`/check-nft?wallet=${walletAddress}`);
    return response.data.hasNFT === true;
  } catch (error) {
    console.error('Error checking NFT ownership:', error);
    throw error;
  }
};

export default api;
