import { PlayerPublicInfo } from '@red-king/shared';

interface PlayerListProps {
  players: PlayerPublicInfo[];
  hostId: string;
}

export function PlayerList({ players, hostId }: PlayerListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {players.map(player => (
        <div
          key={player.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>{player.name}</span>
            {player.id === hostId && (
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary)',
                color: 'white',
              }}>
                Host
              </span>
            )}
          </div>
          <span style={{
            fontSize: '11px',
            color: player.isConnected ? 'var(--color-success)' : 'var(--color-text-muted)',
          }}>
            {player.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      ))}
    </div>
  );
}
