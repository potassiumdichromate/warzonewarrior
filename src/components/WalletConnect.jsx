import React, { useState, useEffect, useContext, useCallback } from 'react';
import { loginUser, logout } from '../utils/api';
import { Box, Snackbar, Alert } from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { AuthContext } from '../contexts/AuthContext';

const WalletConnect = () => {
  const { setAuthState } = useContext(AuthContext);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      disconnect();
      setAuthState({ isAuthenticated: false, walletAddress: '' });
      localStorage.removeItem('token');
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Failed to log out');
      setSnackbarOpen(true);
    }
  }, [disconnect, setAuthState]);

  // Handle wallet connection and authentication
  useEffect(() => {
    const handleAuth = async () => {
      if (isConnected && address) {
        try {
          // Login and get token
          const loginResult = await loginUser(address);
          if (loginResult.token) {
            localStorage.setItem('token', loginResult.token);
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAddress', address);
            setAuthState({ isAuthenticated: true, walletAddress: address });
            
            // Verify the token is still valid
            try {
              const response = await fetch('https://api.warzonewarriors.xyz/warzone/verify-token', {
                headers: {
                  'Authorization': `Bearer ${loginResult.token}`
                }
              });
              
              if (!response.ok) {
                // Token is invalid, log out
                handleLogout();
              }
            } catch (verifyError) {
              console.error('Token verification failed:', verifyError);
              handleLogout();
            }
          }
        } catch (error) {
          console.error('Authentication failed:', error);
          setError('Failed to authenticate with the server');
          setSnackbarOpen(true);
          // Disconnect on error
          disconnect();
        }
      }
    };

    if (isConnected) {
      handleAuth();
    }
  }, [isConnected, address, setAuthState, disconnect, handleLogout]);

  // Close snackbar handler
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setError('');
  };

  return (
    <Box>
      <ConnectButton 
        showBalance={false}
        accountStatus="address"
        chainStatus="icon"
      />
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WalletConnect;
