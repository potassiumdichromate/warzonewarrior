import React, { useState, useEffect } from 'react';
import './style.css';
import disconnectImage from '../assets/images/Submit.jpeg';
import { checkNameAvailability, savePlayerName } from '../utils/api';

const WarriorNamePopup = ({ isOpen, onClose, walletAddress, name }) => {
  const [warriorName, setWarriorName] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nameAvailable, setNameAvailable] = useState(false);

  // Check if name is available
  const checkName = async () => {
    if (!warriorName.trim()) {
      setError('Please enter a warrior name');
      return false;
    }

    try {
      setIsChecking(true);
      const result = await checkNameAvailability(warriorName);
      if (result.success) {
        setError('');
        setNameAvailable(true);
        return true;
      } else {
        setError(result.message || 'Name is already taken');
        setNameAvailable(false);
        return false;
      }
    } catch (err) {
      console.error('Error checking name:', err);
      setError('Error checking name availability');
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First check if name is available
    const isAvailable = await checkName();
    if (!isAvailable) return;

    try {
      setIsSaving(true);
      const result = await savePlayerName(warriorName);
      
      if (result.success) {
        // If save is successful, close the popup
        onClose();
        // Optional: Show success message or trigger a refresh
        if (window.toast) {
          window.toast.success('Warrior name saved successfully!');
        }
      } else {
        setError(result.message || 'Failed to save name');
      }
      window.location.reload();
    } catch (err) {
      console.error('Error saving name:', err);
      setError('Error saving warrior name');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(()=>{
    setWarriorName(name);
  },[])

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>Update Warrior Name</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={warriorName}
              onChange={(e) => {
                setWarriorName(e.target.value);
                if (error) setError('');
                if (nameAvailable) setNameAvailable(false);
              }}
              placeholder="Enter your warrior name"
              className="warrior-input"
            />
            {error && <p className="error-message">{error}</p>}
            {nameAvailable && !error && (
              <p className="success-message">Name is available!</p>
            )}
          </div>
          <div className="button-group">
            <button 
              type="submit" 
              className="submit-button"
            >
              {isSaving ? (
                'Saving...'
              ) : (
                <img src={disconnectImage} alt="Save" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarriorNamePopup;