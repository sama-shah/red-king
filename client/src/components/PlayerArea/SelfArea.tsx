import { ClientCard, ClientPlayerState, GridPosition } from '@red-king/shared';
import { CardGrid } from '../Card/CardGrid';

interface SelfAreaProps {
  player: ClientPlayerState;
  grid: ClientCard[];
  selectableSlots?: GridPosition[];
  selectedSlot?: GridPosition | null;
  onCardClick?: (slotIndex: GridPosition) => void;
  isCurrentTurn: boolean;
}

export function SelfArea({
  player,
  grid,
  selectableSlots = [],
  selectedSlot = null,
  onCardClick,
  isCurrentTurn,
}: SelfAreaProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        background: isCurrentTurn ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
        border: isCurrentTurn ? '2px solid var(--color-primary)' : '2px solid transparent',
        transition: 'all 0.3s',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>
        {player.name} (You)
      </div>
      <CardGrid
        cards={grid}
        size="lg"
        selectableSlots={selectableSlots}
        selectedSlot={selectedSlot}
        onCardClick={onCardClick}
      />
    </div>
  );
}
