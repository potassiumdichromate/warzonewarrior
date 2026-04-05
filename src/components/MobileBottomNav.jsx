import { useNavigate } from 'react-router-dom';
import './MobileBottomNav.css';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Home', path: '/dashboard', icon: '⌂' },
  { key: 'marketplace', label: 'Shop', path: '/iap', icon: '◫' },
  { key: 'leaderboard', label: 'Ranks', path: '/leaderboard', icon: '✦' },
  { key: 'tournament', label: 'Tournament', path: '/tournament', icon: '◎' },
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
