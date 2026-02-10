import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface PlayerState {
  playerId: string | null;
  playerName: string | null;
  roomCode: string | null;
}

interface PlayerContextValue extends PlayerState {
  setPlayer: (playerId: string, playerName: string) => void;
  setRoomCode: (code: string) => void;
  clear: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>({
    playerId: null,
    playerName: null,
    roomCode: null,
  });

  const setPlayer = useCallback((playerId: string, playerName: string) => {
    setState(prev => ({ ...prev, playerId, playerName }));
  }, []);

  const setRoomCode = useCallback((code: string) => {
    setState(prev => ({ ...prev, roomCode: code }));
  }, []);

  const clear = useCallback(() => {
    setState({ playerId: null, playerName: null, roomCode: null });
  }, []);

  return (
    <PlayerContext.Provider value={{ ...state, setPlayer, setRoomCode, clear }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
