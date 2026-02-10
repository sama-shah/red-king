import { ClientPlayerState, GridPosition } from '@red-king/shared';
import { CardGrid } from '../Card/CardGrid';

interface OpponentAreaProps {
  player: ClientPlayerState;
  isCurrentTurn: boolean;
  selectableSlots?: GridPosition[];
  onCardClick?: (slotIndex: GridPosition) => void;
}

export function OpponentArea({
  player,
  isCurrentTurn,
  selectableSlots = [],
  onCardClick,
}: OpponentAreaProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '12px',
        borderRadius: 'var(--radius-lg)',
        background: isCurrentTurn ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
        border: isCurrentTurn ? '2px solid var(--color-primary)' : '2px solid transparent',
        opacity: player.isConnected ? 1 : 0.5,
        transition: 'all 0.3s',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--color-text-muted)' }}>
        {player.name}
        {!player.isConnected && ' (disconnected)'}
      </div>
      <CardGrid
        cards={player.grid}
        size="md"
        selectableSlots={selectableSlots}
        onCardClick={onCardClick}
      />
    </div>
  );
}
