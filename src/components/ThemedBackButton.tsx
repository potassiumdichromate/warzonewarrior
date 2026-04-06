import React from 'react';
import buttonImage from '../assets/button.png';
import './ThemedBackButton.css';

const ThemedBackButton = ({ onClick, className = '', label = 'Back', compact = false }) => {
  const classes = ['themed-back-button', compact ? 'themed-back-button-compact' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} onClick={onClick}>
      <img src={buttonImage} alt="" className="themed-back-button-image" aria-hidden="true" />
      <span className="themed-back-button-overlay" aria-hidden="true"></span>
      <span className="themed-back-button-content">
        <span className="themed-back-button-arrow" aria-hidden="true">←</span>
        <span className="themed-back-button-label">{label}</span>
      </span>
    </button>
  );
};

export default ThemedBackButton;
