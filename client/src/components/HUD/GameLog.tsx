import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

interface LogEntry {
  id: number;
  message: string;
  timestamp: number;
}

interface GameLogProps {
  playerId?: string;
}

let logId = 0;

export function GameLog({ playerId }: GameLogProps) {
  const socket = useSocket();
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    const addEntry = (message: string) => {
      setEntries(prev => [...prev.slice(-19), { id: logId++, message, timestamp: Date.now() }]);
    };

    socket.on('turn:drew_card', (data) => {
      if (playerId && data.playerId !== playerId) return;
      const source = data.fromPile === 'draw' ? 'draw pile' : 'discard pile';
      addEntry(`You drew from the ${source}.`);
    });
    socket.on('turn:power_used', (data) => {
      if (playerId && data.playerId !== playerId) return;
      addEntry(`You used ${data.powerRank}: ${data.description}`);
    });
    socket.on('tap:result', (data) => {
      if (playerId && data.tapperId !== playerId) return;
      addEntry(data.description);
    });
    socket.on('game:called', (data) => {
      if (playerId && data.callerId === playerId) {
        addEntry('You called! Final turns for everyone else.');
      } else {
        addEntry('A player called! Final turns.');
      }
    });

    return () => {
      socket.off('turn:drew_card');
      socket.off('turn:power_used');
      socket.off('tap:result');
      socket.off('game:called');
    };
  }, [socket, playerId]);

  return (
    <div
      style={{
        maxHeight: '120px',
        overflow: 'auto',
        padding: '8px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)',
        fontSize: '11px',
        color: 'var(--color-text-muted)',
      }}
    >
      {entries.length === 0 && <div>Game log...</div>}
      {entries.map(entry => (
        <div key={entry.id} style={{ padding: '2px 0' }}>
          {entry.message}
        </div>
      ))}
    </div>
  );
}
