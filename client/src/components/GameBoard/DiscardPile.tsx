import { Card as CardType } from '@red-king/shared';
import { Card } from '../Card/Card';

interface DiscardPileProps {
  topCard: CardType | null;
  count: number;
  isClickable: boolean;
  onClick: () => void;
}

export function DiscardPile({ topCard, count, isClickable, onClick }: DiscardPileProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Discard ({count})</div>
      <div
        onClick={isClickable ? onClick : undefined}
        style={{ cursor: isClickable ? 'pointer' : 'default' }}
      >
        {topCard ? (
          <Card card={topCard} isRevealed isSelectable={isClickable} isHighlighted={isClickable} />
        ) : (
          <div
            style={{
              width: 80,
              height: 112,
              borderRadius: 'var(--radius-card)',
              border: '2px dashed var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '12px',
            }}
          >
            Empty
          </div>
        )}
      </div>
    </div>
  );
}
