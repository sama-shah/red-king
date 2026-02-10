import { Card as CardType } from '@red-king/shared';

interface CardProps {
  card: CardType | null;
  isRevealed?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

const sizeMap = {
  sm: { width: 60, height: 84, fontSize: 14 },
  md: { width: 80, height: 112, fontSize: 18 },
  lg: { width: 100, height: 140, fontSize: 22 },
};

export function Card({
  card,
  isRevealed = false,
  isSelectable = false,
  isSelected = false,
  isHighlighted = false,
  size = 'md',
  onClick,
}: CardProps) {
  const dims = sizeMap[size];
  const isFaceUp = card !== null && (isRevealed || card);
  const isRed = card && (card.suit === 'hearts' || card.suit === 'diamonds');

  return (
    <div
      onClick={isSelectable ? onClick : undefined}
      style={{
        width: dims.width,
        height: dims.height,
        borderRadius: 'var(--radius-card)',
        cursor: isSelectable ? 'pointer' : 'default',
        transition: 'all 0.2s',
        transform: isSelected ? 'translateY(-8px)' : isHighlighted ? 'scale(1.05)' : 'none',
        boxShadow: isSelected
          ? '0 4px 16px rgba(220, 38, 38, 0.5)'
          : isHighlighted
          ? '0 4px 12px rgba(220, 38, 38, 0.3)'
          : 'var(--shadow-card)',
        border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
        position: 'relative',
        userSelect: 'none',
        ...(isFaceUp && card
          ? {
              background: 'var(--color-card-front)',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              justifyContent: 'center',
              color: isRed ? 'var(--color-red-suit)' : 'var(--color-black-suit)',
            }
          : {
              background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #2a5080',
            }),
      }}
    >
      {isFaceUp && card ? (
        <>
          <div style={{ fontSize: dims.fontSize, fontWeight: 'bold', lineHeight: 1 }}>
            {card.rank}
          </div>
          <div style={{ fontSize: dims.fontSize * 1.2, lineHeight: 1 }}>
            {SUIT_SYMBOLS[card.suit]}
          </div>
        </>
      ) : (
        <div
          style={{
            width: dims.width - 12,
            height: dims.height - 12,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #2a5080',
            background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(42, 80, 128, 0.3) 3px, rgba(42, 80, 128, 0.3) 6px)',
          }}
        />
      )}
    </div>
  );
}
