import React, { useState, useEffect } from 'react';
import { checkNameAvailability, savePlayerName, getPlayerName as fetchPlayerName } from '../utils/api';
import { TextField, Button, Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';

const NameInput = ({ walletAddress, currentName, onNameSaved }) => {
  const [name, setName] = useState(currentName || '');
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [nameAvailable, setNameAvailable] = useState(!!currentName);

  // Load player name on component mount
  useEffect(() => {
    const loadPlayerName = async () => {
      if (!walletAddress) return;
      
      try {
        setIsChecking(true);
        const result = await fetchPlayerName(walletAddress);
        if (result.success && result.name) {
          setName(result.name);
          setNameAvailable(true);
          if (onNameSaved) onNameSaved(result.name);
        }
      } catch (error) {
        console.error('Error getting player name:', error);
        setStatus({ type: 'error', message: 'Error loading player name' });
      } finally {
        setIsChecking(false);
      }
    };

    loadPlayerName();
  }, [walletAddress, onNameSaved]);

  // Update name when currentName prop changes
  useEffect(() => {
    if (currentName) {
      setName(currentName);
      setNameAvailable(true);
    }
  }, [currentName]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (status.type) setStatus({ type: '', message: '' });
    if (nameAvailable) setNameAvailable(false);
  };

  const checkName = async () => {
    if (!name.trim()) {
      setStatus({ type: 'error', message: 'Please enter a name' });
      return;
    }

    try {
      setIsChecking(true);
      const result = await checkNameAvailability(name);
      if (result.available) {
        setStatus({ type: 'success', message: 'Name is available!' });
        setNameAvailable(true);
      } else {
        setStatus({ type: 'error', message: result.message || 'Name is not available' });
        setNameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking name:', error);
      setStatus({ type: 'error', message: 'Error checking name availability' });
      setNameAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      setStatus({ type: 'error', message: 'Please enter a name' });
      return;
    }

    if (!nameAvailable && !currentName) {
      setStatus({ type: 'error', message: 'Please check name availability first' });
      return;
    }

    try {
      setIsSaving(true);
      const result = await savePlayerName(name);
      if (result.success) {
        setStatus({ type: 'success', message: 'Name saved successfully!' });
        setNameAvailable(true);
        if (onNameSaved) onNameSaved(name);
      } else {
        setStatus({ type: 'error', message: result.message || 'Failed to save name' });
      }
    } catch (error) {
      console.error('Error saving name:', error);
      setStatus({ type: 'error', message: 'Error saving name' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        {currentName ? 'Update Your Name' : 'Choose Your Player Name'}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Player Name"
          value={name}
          onChange={handleNameChange}
          disabled={isChecking || isSaving}
          placeholder="Enter your player name"
        />
        <Button
          variant="outlined"
          onClick={checkName}
          disabled={!name.trim() || isChecking || isSaving}
        >
          {isChecking ? <CircularProgress size={24} /> : 'Check'}
        </Button>
      </Box>

      {status.message && (
        <Alert severity={status.type} sx={{ mb: 2 }}>
          {status.message}
        </Alert>
      )}

      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handleSaveName}
        disabled={isSaving || (currentName ? false : !nameAvailable)}
      >
        {isSaving ? (
          <CircularProgress size={24} color="inherit" />
        ) : currentName ? (
          'Update Name'
        ) : (
          'Save Name'
        )}
      </Button>
    </Paper>
  );
};

export default NameInput;
