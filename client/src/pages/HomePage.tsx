import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { usePlayer } from '../context/PlayerContext';
import { Button } from '../components/common/Button';

export function HomePage() {
  const socket = useSocket();
  const { setPlayer, setRoomCode } = usePlayer();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return setError('Enter your name');
    setLoading(true);
    setError('');

    socket.emit('room:create', { playerName: name.trim() }, (res) => {
      setLoading(false);
      if (res.ok && res.roomCode && res.playerId) {
        setPlayer(res.playerId, name.trim());
        setRoomCode(res.roomCode);
        navigate('/lobby');
      } else {
        setError(res.error || 'Failed to create room');
      }
    });
  };

  const handleJoin = () => {
    if (!name.trim()) return setError('Enter your name');
    if (!joinCode.trim()) return setError('Enter a room code');
    setLoading(true);
    setError('');

    socket.emit('room:join', { playerName: name.trim(), roomCode: joinCode.trim().toUpperCase() }, (res) => {
      setLoading(false);
      if (res.ok && res.playerId) {
        setPlayer(res.playerId, name.trim());
        setRoomCode(joinCode.trim().toUpperCase());
        navigate('/lobby');
      } else {
        setError(res.error || 'Failed to join room');
      }
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      gap: '32px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'var(--color-primary)',
          marginBottom: '8px',
        }}>
          Red King
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '16px' }}>
          A multiplayer memory card game
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '360px',
      }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontSize: '16px',
            width: '100%',
          }}
        />

        <Button onClick={handleCreate} disabled={loading} size="lg" style={{ width: '100%' }}>
          Create Room
        </Button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--color-text-muted)',
          fontSize: '13px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          or join
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={5}
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontSize: '16px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              flex: 1,
            }}
          />
          <Button onClick={handleJoin} disabled={loading} variant="secondary" size="lg">
            Join
          </Button>
        </div>

        {error && (
          <div style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(220, 38, 38, 0.15)',
            color: 'var(--color-danger)',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
