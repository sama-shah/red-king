import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ClientGameState } from '@red-king/shared';
import { useSocket } from './SocketContext';

type GameAction =
  | { type: 'GAME_STARTED'; payload: ClientGameState }
  | { type: 'STATE_UPDATE'; payload: ClientGameState }
  | { type: 'RESET' };

interface GameContextValue {
  gameState: ClientGameState | null;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

function gameReducer(state: ClientGameState | null, action: GameAction): ClientGameState | null {
  switch (action.type) {
    case 'GAME_STARTED':
    case 'STATE_UPDATE':
      return action.payload;
    case 'RESET':
      return null;
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const socket = useSocket();
  const [gameState, dispatch] = useReducer(gameReducer, null);

  useEffect(() => {
    socket.on('game:started', (state) => {
      dispatch({ type: 'GAME_STARTED', payload: state });
    });

    socket.on('game:state_update', (state) => {
      dispatch({ type: 'STATE_UPDATE', payload: state });
    });

    return () => {
      socket.off('game:started');
      socket.off('game:state_update');
    };
  }, [socket]);

  return (
    <GameContext.Provider value={{ gameState, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
