import { useState } from 'react';

const POWER_RULES = [
  { rank: '7', name: 'Peek Own', desc: 'Look at one of your own face-down cards.' },
  { rank: '8', name: 'Peek Other', desc: "Look at one of another player's face-down cards." },
  { rank: '9', name: 'Swap', desc: "Swap one of your cards with another player's card (no peeking)." },
  { rank: '10', name: 'Double Peek', desc: 'Look at any 2 cards on the table.' },
  { rank: 'J', name: 'Blind Swap', desc: 'Swap any 2 cards on the table (no peeking).' },
  { rank: 'Q', name: 'Reveal', desc: 'Permanently flip one of your cards face-up.' },
  { rank: 'K', name: 'Black King', desc: 'Look at any 2 cards, then swap any 2 cards.' },
];

const CARD_VALUES = [
  { label: 'Red King (♥K / ♦K)', value: '-1' },
  { label: 'Ace', value: '1' },
  { label: '2 - 10', value: 'Face value' },
  { label: 'Jack', value: '10' },
  { label: 'Queen', value: '10' },
  { label: 'Black King (♠K / ♣K)', value: '13' },
];

export function RulesPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'powers' | 'values'>('powers');

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          zIndex: 1001,
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          background: isOpen ? 'var(--color-primary)' : 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {isOpen ? 'Close Rules' : 'Rules'}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '48px',
            right: '12px',
            width: '300px',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            zIndex: 1000,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-elevated)',
            padding: '16px',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('powers')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'powers' ? 'var(--color-primary)' : 'transparent',
                color: 'var(--color-text)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Power Cards
            </button>
            <button
              onClick={() => setActiveTab('values')}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'values' ? 'var(--color-primary)' : 'transparent',
                color: 'var(--color-text)',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Card Values
            </button>
          </div>

          {activeTab === 'powers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                Powers activate only when drawn from the draw pile.
              </div>
              {POWER_RULES.map(rule => (
                <div
                  key={rule.rank}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: rule.rank === 'K' ? 'var(--color-text)' : 'var(--color-primary)' }}>
                      {rule.rank}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{rule.name}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                    {rule.desc}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'values' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                Lowest score wins! Try to get Red Kings (-1).
              </div>
              {CARD_VALUES.map(cv => (
                <div
                  key={cv.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.04)',
                    fontSize: '13px',
                  }}
                >
                  <span>{cv.label}</span>
                  <span style={{ fontWeight: 700, color: cv.value === '-1' ? 'var(--color-success)' : 'var(--color-text)' }}>
                    {cv.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
