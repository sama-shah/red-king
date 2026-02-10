import { useState } from 'react';

interface RoomCodeProps {
  code: string;
}

export function RoomCode({ code }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Room Code:</span>
      <span style={{
        fontSize: '24px',
        fontWeight: 'bold',
        letterSpacing: '4px',
        fontFamily: 'var(--font-mono)',
      }}>
        {code}
      </span>
      <button
        onClick={handleCopy}
        style={{
          padding: '4px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface-hover)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          fontSize: '12px',
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
