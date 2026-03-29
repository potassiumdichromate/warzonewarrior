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
import '@rainbow-me/rainbowkit/styles.css';
import './App.css';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isConnected } = useWallet();
  return isConnected ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="app">
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
            <Route path="/interverse-play" element={<InterversePlayPage />} />
            <Route path="/auth" element={<IntraverseLoginButton />} />
            <Route path="/auth/callback/intraverse/callback/*" element={<IntraverseLogin />} />
            <Route path="/intraverse-auth/callback/*" element={<IntraverseLogin />} />
            <Route path="/auto-login" element={<AutoLogin />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
