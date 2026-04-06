import { useNavigate } from 'react-router-dom';
import './MobileBottomNav.css';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', path: '/', icon: '⌂' },
  { key: 'leaderboard', label: 'Rankings', path: '/leaderboard', icon: '✦' },
  { key: 'tournament', label: 'Tourney', path: '/tournament', icon: '◎' },
  { key: 'marketplace', label: 'Store', path: '/iap', icon: '◫' },
];

const MobileBottomNav = ({ current }) => {
  const navigate = useNavigate();

  return (
    <nav className="wz-mobile-nav" aria-label="Mobile navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = current === item.key;

        return (
          <button
            key={item.key}
            type="button"
            className={`wz-mobile-nav__item ${isActive ? 'is-active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="wz-mobile-nav__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="wz-mobile-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
