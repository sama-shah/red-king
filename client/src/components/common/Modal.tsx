import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '90vw',
          boxShadow: 'var(--shadow-elevated)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>{title}</h3>
        )}
        {children}
      </div>
    </div>
  );
}
