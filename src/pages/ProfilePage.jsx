import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPlayerProfile, savePlayerProfile } from '../utils/api';
import { Box, Typography, Paper, Avatar, Grid, Button, CircularProgress } from '@mui/material';
import NameInput from '../components/NameInput';

const ProfilePage = () => {
  const { walletAddress } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getPlayerProfile(walletAddress);
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchProfile();
    }
  }, [walletAddress]);

  const handleNameSaved = (newName) => {
    setProfile(prev => ({
      ...prev,
      name: newName
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Grid container justifyContent="center">
        <Grid item xs={12} md={8} lg={6}>
          <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
              <Avatar 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  fontSize: '3rem',
                  mb: 2,
                  bgcolor: 'primary.main'
                }}
              >
                {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </Avatar>
              
              <Typography variant="h4" component="h1" gutterBottom>
                {profile?.name || 'Anonymous Player'}
              </Typography>
              
              <Typography variant="body1" color="textSecondary" gutterBottom>
                {walletAddress}
              </Typography>
              
              <Button 
                variant="outlined" 
                onClick={() => setEditing(!editing)}
                sx={{ mt: 2 }}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>

            {editing && (
              <NameInput
                currentName={profile?.name}
                onNameSaved={handleNameSaved}
              />
            )}
          </Paper>

          {profile && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>Player Stats</Typography>
                  <Box>
                    <Typography>Level: {profile.PlayerProfile?.level || 1}</Typography>
                    <Typography>Experience: {profile.PlayerProfile?.exp || 0} XP</Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>Resources</Typography>
                  <Box>
                    <Typography>Coins: {profile.PlayerResources?.coin || 0}</Typography>
                    <Typography>Gems: {profile.PlayerResources?.gem || 0}</Typography>
                    <Typography>Stamina: {profile.PlayerResources?.stamina || 0}</Typography>
                    <Typography>Medals: {profile.PlayerResources?.medal || 0}</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
