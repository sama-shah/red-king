import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { PlayerProvider } from './context/PlayerContext';
import { GameProvider } from './context/GameContext';
import { HomePage } from './pages/HomePage';
import { LobbyPage } from './pages/LobbyPage';
import { GamePage } from './pages/GamePage';
import { ResultsPage } from './pages/ResultsPage';

export function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <PlayerProvider>
          <GameProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/lobby" element={<LobbyPage />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/results" element={<ResultsPage />} />
            </Routes>
          </GameProvider>
        </PlayerProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}
