import { ClientGameState, Card as CardType, hasPower } from '@red-king/shared';
import { Button } from '../common/Button';
import { Card } from '../Card/Card';

interface ActionPanelProps {
  gameState: ClientGameState;
  onDrawFromPile: () => void;
  onTakeFromDiscard: () => void;
  onTapSelf: () => void;
  onTapOther: () => void;
  onCall: () => void;
  onSwapDrawn: () => void;
  onDiscardDrawn: () => void;
  onUsePower: () => void;
}

export function ActionPanel({
  gameState,
  onDrawFromPile,
  onTakeFromDiscard,
  onTapSelf,
  onTapOther,
  onCall,
  onSwapDrawn,
  onDiscardDrawn,
  onUsePower,
}: ActionPanelProps) {
  if (!gameState.isMyTurn) {
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    return (
      <div style={{
        textAlign: 'center',
        padding: '12px',
        color: 'var(--color-text-muted)',
        fontSize: '14px',
      }}>
        Waiting for {currentPlayer?.name || 'opponent'}...
      </div>
    );
  }

  if (gameState.turnPhase === 'pre_draw') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
          Your turn — choose an action
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button onClick={onDrawFromPile} size="sm">Draw</Button>
          <Button onClick={onTakeFromDiscard} variant="secondary" size="sm"
            disabled={!gameState.topDiscard}>
            Take Discard
          </Button>
          <Button onClick={onTapSelf} variant="ghost" size="sm"
            disabled={!gameState.topDiscard}>
            Tap Self
          </Button>
          <Button onClick={onTapOther} variant="ghost" size="sm"
            disabled={!gameState.topDiscard}>
            Tap Other
          </Button>
          {!gameState.callerPlayerId && (
            <Button onClick={onCall} variant="danger" size="sm">Call</Button>
          )}
        </div>
      </div>
    );
  }

  if (gameState.turnPhase === 'drawn' && gameState.drawnCard) {
    const canUsePower = hasPower(gameState.drawnCard);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          You drew:
        </div>
        <Card card={gameState.drawnCard} isRevealed size="md" />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button onClick={onSwapDrawn} size="sm">Swap with Card</Button>
          <Button onClick={onDiscardDrawn} variant="secondary" size="sm">Discard</Button>
          {canUsePower && (
            <Button onClick={onUsePower} variant="ghost" size="sm">
              Use Power ({gameState.drawnCard.rank})
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (gameState.turnPhase === 'using_power') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '12px',
        color: 'var(--color-warning)',
        fontSize: '14px',
      }}>
        Select targets for your power card...
      </div>
    );
  }

  return null;
}
