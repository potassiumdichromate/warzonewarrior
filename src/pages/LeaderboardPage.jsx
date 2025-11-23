import React from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Container, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTableRow = styled(TableRow)(({ theme, rank }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // Highlight top 3 positions
  ...(rank <= 3 && {
    background: `linear-gradient(90deg, ${theme.palette.primary.light}30, ${theme.palette.primary.light}10)`,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  }),
}));

const RankCell = styled(TableCell)(({ rank }) => ({
  fontWeight: 'bold',
  ...(rank === 1 && {
    color: '#FFD700', // Gold
  }),
  ...(rank === 2 && {
    color: '#C0C0C0', // Silver
  }),
  ...(rank === 3 && {
    color: '#CD7F32', // Bronze
  }),
}));

const LeaderboardPage = () => {
  const { leaderboard, loading, error } = useLeaderboard();

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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4, fontWeight: 'bold' }}>
        Leaderboard
      </Typography>
      
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Player</TableCell>
              <TableCell align="right">Level</TableCell>
              <TableCell align="right">EXP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((player, index) => (
              <StyledTableRow key={player._id || index} rank={index + 1}>
                <RankCell component="th" scope="row" rank={index + 1}>
                  {index + 1}
                </RankCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>{player.name ? player.name.charAt(0).toUpperCase() : '?'}</Avatar>
                    <Typography>{player.name || 'Anonymous'}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">{player.PlayerProfile?.PlayerResources?.coin || 1}</TableCell>
                <TableCell align="right">{player.PlayerProfile?.PlayerProfile?.exp || 0}</TableCell>
              </StyledTableRow>
            ))}
            {leaderboard.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No players found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default LeaderboardPage;
