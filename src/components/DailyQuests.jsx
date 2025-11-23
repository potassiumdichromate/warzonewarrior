import React from 'react';
import './DailyQuests.css';

const DailyQuests = ({ questsData }) => {
  if (!questsData || !Array.isArray(questsData)) {
    return (
      <div className="daily-quests">
        <div className="quests-header">
          <h3 className="quests-title">
            <span className="title-icon">📋</span>
            Daily Quests
          </h3>
        </div>
        <div className="no-quests">
          <p>No active quests</p>
        </div>
      </div>
    );
  }

  const questTypes = {
    0: { name: 'Complete Campaign', icon: '🎯', color: '#3b82f6' },
    1: { name: 'Kill Enemies', icon: '💀', color: '#ef4444' },
    2: { name: 'Win Battles', icon: '🏆', color: '#ecc94b' },
    3: { name: 'Collect Coins', icon: '🪙', color: '#f59e0b' },
    4: { name: 'Upgrade Weapons', icon: '⚔️', color: '#8b5cf6' },
    5: { name: 'Complete Missions', icon: '🎖️', color: '#10b981' },
    6: { name: 'Destroy Tanks', icon: '🔥', color: '#dc2626' },
    7: { name: 'Rescue Hostages', icon: '🆘', color: '#06b6d4' },
    8: { name: 'Defuse Bombs', icon: '💣', color: '#f97316' },
    9: { name: 'Headshot Kills', icon: '🎯', color: '#a855f7' },
    10: { name: 'Melee Kills', icon: '🔪', color: '#64748b' },
    11: { name: 'Grenade Kills', icon: '💥', color: '#f43f5e' }
  };

  const getQuestDetails = (type) => {
    return questTypes[type] || { 
      name: `Quest ${type}`, 
      icon: '❓',
      color: '#6b7280'
    };
  };

  const getProgressPercentage = (quest) => {
    // Most quests have targets around 10-100 based on the type
    const targets = {
      0: 5,    // Complete Campaign
      1: 100,  // Kill Enemies
      2: 10,   // Win Battles
      3: 1000, // Collect Coins
      4: 5,    // Upgrade Weapons
      5: 10,   // Complete Missions
      6: 10,   // Destroy Tanks
      7: 5,    // Rescue Hostages
      8: 5,    // Defuse Bombs
      9: 50,   // Headshot Kills
      10: 20,  // Melee Kills
      11: 20   // Grenade Kills
    };

    const target = targets[quest.type] || 100;
    const percentage = Math.min((quest.progress / target) * 100, 100);
    return { percentage, target };
  };

  return (
    <div className="daily-quests">
      <div className="quests-header">
        <h3 className="quests-title">
          <span className="title-icon">📋</span>
          Daily Quests
        </h3>
        <div className="quests-count">
          {questsData.filter(q => q.isClaimed).length}/{questsData.length} Completed
        </div>
      </div>

      <div className="quests-list">
        {questsData.map((quest, index) => {
          const details = getQuestDetails(quest.type);
          const { percentage, target } = getProgressPercentage(quest);
          const isCompleted = quest.isClaimed;
          const isReady = percentage >= 100 && !isCompleted;

          return (
            <div 
              key={index}
              className={`quest-item ${isCompleted ? 'completed' : ''} ${isReady ? 'ready' : ''}`}
            >
              <div className="quest-icon" style={{ '--quest-color': details.color }}>
                {details.icon}
              </div>

              <div className="quest-details">
                <div className="quest-name">{details.name}</div>
                <div className="quest-progress-bar">
                  <div 
                    className="quest-progress-fill"
                    style={{ 
                      width: `${percentage}%`,
                      background: details.color
                    }}
                  ></div>
                </div>
                <div className="quest-progress-text">
                  {quest.progress} / {target}
                </div>
              </div>

              <div className="quest-status">
                {isCompleted ? (
                  <span className="status-badge claimed">✓ Claimed</span>
                ) : isReady ? (
                  <span className="status-badge ready">Ready!</span>
                ) : (
                  <span className="status-badge progress">
                    {Math.floor(percentage)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyQuests;
