import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from "./pages/home/index";
import Dashboard from "./pages/dashboard/Dashboard";
import { Game } from "./pages/game/GamePage";
import { Leaderboard } from "./pages/leaderboard/index";
import IAP from "./pages/iap/iap";
import { WalletProvider } from './contexts/WalletContext';
import { useWallet } from './contexts/WalletContext';
import InterversePlayPage from './pages/intraverse/InterversePlayPage';
import IntraverseLogin from './pages/intraverse/IntraverseLogin';
import IntraverseLoginButton from './pages/intraverse/IntraverseLoginButton';
import AutoLogin from './pages/AutoLogin';
import VideoBackground from './components/VideoBackground';
import './App.css';
import './styles/warzone-ui.css';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isConnected } = useWallet();
  return isConnected ? children : <Navigate to="/" replace />;
};

function AppShell() {
  return (
    <div className="app">
      <div className="app-media-layer" aria-hidden="true">
        <VideoBackground />
        <div className="app-video-dim" />
      </div>

      <div className="app-routes">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/game" 
            element={
              <ProtectedRoute>
                <Game />
              </ProtectedRoute>
            } 
          />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/iap" element={<IAP />} />
          <Route path="/tournament" element={<InterversePlayPage />} />
          <Route path="/auth" element={<IntraverseLoginButton />} />
          <Route path="/auth/callback/intraverse/callback/*" element={<IntraverseLogin />} />
          <Route path="/intraverse-auth/callback/*" element={<IntraverseLogin />} />
          <Route path="/auto-login" element={<AutoLogin />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <Router>
        <AppShell />
      </Router>
    </WalletProvider>
  );
}

export default App;
