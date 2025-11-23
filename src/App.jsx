import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from "./pages/home/index";
import Dashboard from "./pages/dashboard/Dashboard";
import { Game } from "./pages/game/GamePage";
import { Leaderboard } from "./pages/leaderboard/index";
import IAP from "./pages/iap/iap";
import { WalletProvider } from './contexts/WalletContext';
import { useWallet } from './contexts/WalletContext';
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
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;