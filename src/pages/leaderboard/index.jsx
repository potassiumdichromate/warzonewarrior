import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../../utils/api';
import ribbonImage from '../../assets/images/image 25.png';
import backgroundImage from '../../assets/images/Rectangle 3.png';
import bottomLeftImage from '../../assets/images/abc3.png';
import bottomRightImage from '../../assets/images/abc2.png';
import backButtonImage from '../../assets/images/BackBtn .png';
import './style.css';

export const Leaderboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await getLeaderboard();
        // Transform API data to match your component's expected format
        const formattedData = data.map((user, index) => ({
          id:    index,
          name:  user.name || `Player ${index + 1}`,
          coins: user.PlayerResources?.coin || 0,
          exp:   user.PlayerProfile?.exp || 0,
          // For previous week, you might need to fetch historical data or calculate it differently
        }));
        setUsers(formattedData);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="leaderboard-loading" style={{width:'100%',height:'100vh',display:'flex',justifyContent:'center',alignItems:'center'}}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  // Sort users by coins in descending order
  const sortedUsers = [...users].sort((a, b) => (b.coins || 0) - (a.coins || 0));

  const navigateToHome = () => {
    navigate("/");
  };

  return (
    <div className="leaderboard">
      <img 
        src={backgroundImage} 
        alt="Background" 
        className="leaderboard-background"
      />
      <img 
        src={bottomLeftImage} 
        alt="Bottom Left Decoration" 
        className="leaderboard-decoration-left"
      />
      <div className="decoration-right-container">
        <img 
          src={bottomRightImage} 
          alt="Bottom Right Decoration" 
          className="leaderboard-decoration-right"
        />
        <button className="back-button" onClick={navigateToHome}>
          <img src={backButtonImage} alt="Back" className="back-button-image" />
        </button>
      </div>
      <div className="leaderboard-header-container">
        <div className="ribbon-container">
          <img src={ribbonImage} alt="Ribbon" className="ribbon-image" />
          <span className="ribbon-text">LEADERBOARD</span>
        </div>
      </div>


      
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <span>Rank</span>
          <span>Player</span>
          <span>Coins</span>
          <span>Experience</span>
        </div>
        
        <div className="leaderboard-content">
          {sortedUsers.map((user, index) => (
            <div key={user.id} className="leaderboard-row">
              <div className="rank">
                <div className={`rank-badge ${index < 3 ? `rank-${index + 1}` : ''}`}>
                  {index + 1}
                </div>
              </div>
              <div className="player-info">
                <span className="player-name">{user.name}</span>
              </div>
              <div className="score">{(user.coins || 0).toLocaleString()}</div>
              <div className="score">{(user.exp || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
      

    </div>
  );
};

export default Leaderboard;
