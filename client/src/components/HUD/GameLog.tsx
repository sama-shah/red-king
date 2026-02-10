import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

interface LogEntry {
  id: number;
  message: string;
  timestamp: number;
}

let logId = 0;

export function GameLog() {
  const socket = useSocket();
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    const addEntry = (message: string) => {
      setEntries(prev => [...prev.slice(-19), { id: logId++, message, timestamp: Date.now() }]);
    };

    socket.on('turn:drew_card', (data) => {
      addEntry(`${data.playerId.slice(0, 6)}... drew from ${data.fromPile} pile`);
    });
    socket.on('turn:power_used', (data) => {
      addEntry(`${data.playerId.slice(0, 6)}... used ${data.powerRank}: ${data.description}`);
    });
    socket.on('tap:result', (data) => {
      addEntry(data.description);
    });
    socket.on('game:called', (data) => {
      addEntry(`${data.callerId.slice(0, 6)}... called! Final turns.`);
    });

    return () => {
      socket.off('turn:drew_card');
      socket.off('turn:power_used');
      socket.off('tap:result');
      socket.off('game:called');
    };
  }, [socket]);

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
