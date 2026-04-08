import { useNavigate, useLocation } from 'react-router-dom';
import LoginModal from '@/components/LoginModal';
import warzoneLogo from '@/assets/logo.png';

/**
 * Dedicated login route — /login
 * Opens the LoginModal immediately. On close or successful login, returns
 * the user to wherever they came from (location.state.from) or home.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Where to go after login / close
  const from: string = (location.state as { from?: string })?.from ?? '/';

  const handleClose = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Modal always open on this page */}
      <LoginModal
        open={true}
        onClose={handleClose}
        centerLogoSrc={warzoneLogo}
      />
    </div>
  );
}
