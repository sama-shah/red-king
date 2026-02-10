import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerPublicInfo } from '@red-king/shared';
import { useSocket } from '../context/SocketContext';
import { usePlayer } from '../context/PlayerContext';
import { Button } from '../components/common/Button';
import { PlayerList } from '../components/Lobby/PlayerList';
import { RoomCode } from '../components/Lobby/RoomCode';

export function LobbyPage() {
  const socket = useSocket();
  const { playerId, roomCode } = usePlayer();
  const navigate = useNavigate();

  const [players, setPlayers] = useState<PlayerPublicInfo[]>([]);
  const [hostId, setHostId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomCode) {
      navigate('/');
      return;
    }

    socket.on('room:state', (data) => {
      setPlayers(data.players);
      setHostId(data.hostId);
    });

    // Request current room state on mount (in case room:state was missed)
    socket.emit('room:get_state', (res) => {
      if (res.ok && res.players && res.hostId) {
        setPlayers(res.players);
        setHostId(res.hostId);
      }
    });

    socket.on('room:player_joined', (player) => {
      setPlayers(prev => [...prev, player]);
    });

    socket.on('room:player_left', (pid) => {
      setPlayers(prev => prev.filter(p => p.id !== pid));
    });

    socket.on('room:host_changed', (newHostId) => {
      setHostId(newHostId);
    });

    socket.on('game:started', () => {
      navigate('/game');
    });

    return () => {
      socket.off('room:state');
      socket.off('room:player_joined');
      socket.off('room:player_left');
      socket.off('room:host_changed');
      socket.off('game:started');
    };
  }, [socket, roomCode, navigate]);

  const isHost = playerId === hostId;

  const handleStart = () => {
    setError('');
    socket.emit('room:start', (res) => {
      if (!res.ok) setError(res.error || 'Could not start game');
    });
  };

  const handleLeave = () => {
    socket.emit('room:leave');
    navigate('/');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      gap: '24px',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      <h2 style={{ fontSize: '28px', color: 'var(--color-primary)' }}>Game Lobby</h2>

      {roomCode && <RoomCode code={roomCode} />}

      <div style={{ width: '100%' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          Players ({players.length}/8)
        </h3>
        <PlayerList players={players} hostId={hostId} />
      </div>

      {error && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(220, 38, 38, 0.15)',
          color: 'var(--color-danger)',
          fontSize: '13px',
          width: '100%',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <Button onClick={handleLeave} variant="ghost" style={{ flex: 1 }}>
          Leave
        </Button>
        <Button onClick={handleStart} disabled={players.length < 2} style={{ flex: 1 }}>
          Start Game
        </Button>
      </div>
    </div>
  );
}
