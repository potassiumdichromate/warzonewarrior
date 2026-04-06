import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getWalletAddress, isAuthenticated, logout as apiLogout } from '../utils/api';

type AuthContextValue = {
  walletAddress: string | null;
  isAuthenticated: boolean;
  login: (address: string) => void;
  logout: () => void;
  loading: boolean;
};

const defaultAuthContext: AuthContextValue = {
  walletAddress: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  loading: true,
};

const AuthContext = createContext<AuthContextValue>(defaultAuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const address = getWalletAddress();
      if (address) {
        setWalletAddress(address);
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for account changes in MetaMask
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // User disconnected all accounts
          handleLogout();
        } else if (accounts[0] !== walletAddress) {
          // Account changed
          setWalletAddress(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
        }
      });
    }

    return () => {
      // Clean up event listener
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, [walletAddress]);

  const login = (address) => {
    setWalletAddress(address);
    localStorage.setItem('walletAddress', address);
  };

  const handleLogout = () => {
    apiLogout();
    setWalletAddress(null);
  };

  return (
    <AuthContext.Provider
      value={{
        walletAddress,
        isAuthenticated: isAuthenticated(),
        login,
        logout: handleLogout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
