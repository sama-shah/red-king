import { Card } from '../Card/Card';

interface DrawPileProps {
  count: number;
  isClickable: boolean;
  onClick: () => void;
}

export function DrawPile({ count, isClickable, onClick }: DrawPileProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Draw ({count})</div>
      <div
        onClick={isClickable ? onClick : undefined}
        style={{ cursor: isClickable ? 'pointer' : 'default' }}
      >
        <Card card={null} isSelectable={isClickable} isHighlighted={isClickable} />
      </div>
    </div>
  );
}
