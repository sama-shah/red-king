import { ClientGameState } from '@red-king/shared';

interface TurnIndicatorProps {
  gameState: ClientGameState;
}

export function TurnIndicator({ gameState }: TurnIndicatorProps) {
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const phaseLabel = gameState.phase === 'final_turns' ? ' (Final Turns)' : '';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '8px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)',
        fontSize: '14px',
      }}
    >
      <span style={{ color: 'var(--color-text-muted)' }}>Round {gameState.currentRound}</span>
      <span style={{ color: 'var(--color-border)' }}>|</span>
      <span style={{ color: gameState.isMyTurn ? 'var(--color-primary)' : 'var(--color-text)' }}>
        {gameState.isMyTurn ? 'Your turn' : `${currentPlayer?.name}'s turn`}
        {phaseLabel}
      </span>
      {gameState.callerPlayerId && (
        <>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <span style={{ color: 'var(--color-warning)', fontSize: '12px' }}>
            Called by {gameState.players.find(p => p.id === gameState.callerPlayerId)?.name}
          </span>
        </>
      )}
    </div>
  );
}
