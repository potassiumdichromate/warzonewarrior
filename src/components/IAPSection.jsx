import React from 'react';
import { useNavigate } from 'react-router-dom';
import './IAPSection.css';

// Import category images
import coinImage from '../assets/images/coin1.png';
import gemImage from '../assets/images/gem2.png';
import gunsImage from '../assets/images/guns3.png';
import marketplaceImage from '../assets/images/Marketplace-button.png';
import marketplaceDesktopImage from '../assets/images/Marketplace-Desktop.png';

const IAPSection = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'coins',
      name: 'Coins',
      image: coinImage,
      description: 'Purchase coins for in-game upgrades',
      color: 'rgba(255, 215, 0, 0.2)'
    },
    {
      id: 'gems',
      name: 'Gems',
      image: gemImage,
      description: 'Buy premium gems for special items',
      color: 'rgba(147, 51, 234, 0.2)'
    },
    {
      id: 'guns',
      name: 'Weapons',
      image: gunsImage,
      description: 'Unlock powerful weapons',
      color: 'rgba(239, 68, 68, 0.2)'
    }
  ];

  const handleCategoryClick = (category) => {
    navigate('/iap', { state: { selectedCategory: category.id } });
  };

  const handleMarketplaceClick = () => {
    navigate('/iap');
  };

  return (
    <div className="iap-section">
      <div className="iap-header">
        <h3 className="iap-title">
          <span className="title-icon">🛒</span>
          Marketplace
        </h3>
        <p className="iap-subtitle">Quick Purchase</p>
      </div>

      <div className="iap-categories">
        {categories.map((category) => (
          <div
            key={category.id}
            className="iap-category-card"
            onClick={() => handleCategoryClick(category)}
            style={{ '--category-color': category.color }}
          >
            <div className="category-image-container">
              <img 
                src={category.image} 
                alt={category.name}
                className="category-image"
              />
            </div>
            <div className="category-info">
              <h4 className="category-name">{category.name}</h4>
              <p className="category-description">{category.description}</p>
            </div>
            <div className="category-arrow">→</div>
          </div>
        ))}
      </div>

      <div className="iap-footer">
        <button 
          className="marketplace-button"
          onClick={handleMarketplaceClick}
        >
          <img 
            src={window.innerWidth < 768 ? marketplaceImage : marketplaceDesktopImage}
            alt="Visit Marketplace"
          />
        </button>
      </div>
    </div>
  );
};

export default IAPSection;
