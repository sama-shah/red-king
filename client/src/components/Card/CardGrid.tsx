import { ClientCard, GridPosition } from '@red-king/shared';
import { Card } from './Card';

interface CardGridProps {
  cards: ClientCard[];
  size?: 'sm' | 'md' | 'lg';
  selectableSlots?: GridPosition[];
  selectedSlot?: GridPosition | null;
  onCardClick?: (slotIndex: GridPosition) => void;
}

export function CardGrid({
  cards,
  size = 'md',
  selectableSlots = [],
  selectedSlot = null,
  onCardClick,
}: CardGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, auto)',
        gap: '8px',
        justifyContent: 'center',
      }}
    >
      {cards.map((clientCard) => (
        <Card
          key={clientCard.slotIndex}
          card={clientCard.card}
          isRevealed={clientCard.isRevealed}
          isSelectable={selectableSlots.includes(clientCard.slotIndex as GridPosition)}
          isSelected={selectedSlot === clientCard.slotIndex}
          size={size}
          onClick={() => onCardClick?.(clientCard.slotIndex as GridPosition)}
        />
      ))}
    </div>
  );
}
