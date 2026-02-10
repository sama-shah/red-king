import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GridPosition, Card as CardType } from '@red-king/shared';
import { useSocket } from '../context/SocketContext';
import { usePlayer } from '../context/PlayerContext';
import { useGame } from '../context/GameContext';
import { SelfArea } from '../components/PlayerArea/SelfArea';
import { OpponentArea } from '../components/PlayerArea/OpponentArea';
import { DrawPile } from '../components/GameBoard/DrawPile';
import { DiscardPile } from '../components/GameBoard/DiscardPile';
import { ActionPanel } from '../components/Actions/ActionPanel';
import { TurnIndicator } from '../components/HUD/TurnIndicator';
import { GameLog } from '../components/HUD/GameLog';
import { Card } from '../components/Card/Card';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

type InteractionMode =
  | 'none'
  | 'peek_select'
  | 'swap_select'
  | 'tap_self_select'
  | 'tap_other_select'
  | 'power_select';

export function GamePage() {
  const socket = useSocket();
  const { playerId } = usePlayer();
  const { gameState } = useGame();
  const navigate = useNavigate();

  const [mode, setMode] = useState<InteractionMode>('none');
  const [selectedSlots, setSelectedSlots] = useState<GridPosition[]>([]);
  const [peekedCards, setPeekedCards] = useState<CardType[]>([]);
  const [showPeekModal, setShowPeekModal] = useState(false);
  const [showScoresModal, setShowScoresModal] = useState(false);
  const [scores, setScores] = useState<{ roundScores: Record<string, number>; totalScores: Record<string, number[]>; roundWinner: string } | null>(null);
  const [revealGrids, setRevealGrids] = useState<Record<string, Array<{ slotIndex: GridPosition; card: CardType }>> | null>(null);

  useEffect(() => {
    socket.on('peek:prompt', () => {
      setMode('peek_select');
      setSelectedSlots([]);
    });

    socket.on('game:reveal', (data) => {
      setRevealGrids(data.grids);
    });

    socket.on('game:scores', (data) => {
      setScores(data);
      setShowScoresModal(true);
    });

    return () => {
      socket.off('peek:prompt');
      socket.off('game:reveal');
      socket.off('game:scores');
    };
  }, [socket]);

  useEffect(() => {
    if (!gameState && !showScoresModal) {
      navigate('/');
    }
  }, [gameState, navigate, showScoresModal]);

  const handleMyCardClick = useCallback((slotIndex: GridPosition) => {
    if (mode === 'peek_select') {
      setSelectedSlots(prev => {
        if (prev.includes(slotIndex)) return prev.filter(s => s !== slotIndex);
        if (prev.length >= 2) return prev;
        const next = [...prev, slotIndex];
        if (next.length === 2) {
          // Submit peek
          socket.emit('peek:select', next as [GridPosition, GridPosition], (res) => {
            if (res.ok && res.cards) {
              setPeekedCards(res.cards);
              setShowPeekModal(true);
            }
          });
          setMode('none');
        }
        return next;
      });
    } else if (mode === 'swap_select') {
      socket.emit('turn:drawn_action', { type: 'swap_with_grid', slotIndex }, () => {});
      setMode('none');
    } else if (mode === 'tap_self_select') {
      socket.emit('turn:action', { type: 'tap_self', slotIndex }, () => {});
      setMode('none');
    }
  }, [mode, socket]);

  if (!gameState) return null;

  const myPlayer = gameState.players.find(p => p.id === playerId);
  const opponents = gameState.players.filter(p => p.id !== playerId);
  const allSlots: GridPosition[] = [0, 1, 2, 3];

  const selectableSlots: GridPosition[] =
    mode === 'peek_select' || mode === 'swap_select' || mode === 'tap_self_select'
      ? allSlots
      : [];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      padding: '12px',
      gap: '12px',
    }}>
      {/* HUD */}
      <TurnIndicator gameState={gameState} />

      {/* Opponents */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {opponents.map(opp => (
          <OpponentArea
            key={opp.id}
            player={opp}
            isCurrentTurn={opp.id === gameState.currentPlayerId}
            selectableSlots={mode === 'tap_other_select' ? allSlots : []}
            onCardClick={(slotIndex) => {
              if (mode === 'tap_other_select') {
                socket.emit('turn:action', {
                  type: 'tap_other',
                  targetPlayerId: opp.id,
                  targetSlotIndex: slotIndex,
                }, () => {});
                setMode('none');
              }
            }}
          />
        ))}
      </div>

      {/* Center: Draw + Discard */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', padding: '12px 0' }}>
        <DrawPile
          count={gameState.drawPileCount}
          isClickable={false}
          onClick={() => {}}
        />
        <DiscardPile
          topCard={gameState.topDiscard}
          count={gameState.discardPileCount}
          isClickable={false}
          onClick={() => {}}
        />
      </div>

      {/* Action Panel */}
      <ActionPanel
        gameState={gameState}
        onDrawFromPile={() => socket.emit('turn:action', { type: 'draw_from_pile' }, () => {})}
        onTakeFromDiscard={() => socket.emit('turn:action', { type: 'take_from_discard' }, () => {})}
        onTapSelf={() => setMode('tap_self_select')}
        onTapOther={() => setMode('tap_other_select')}
        onCall={() => socket.emit('turn:action', { type: 'call' }, () => {})}
        onSwapDrawn={() => setMode('swap_select')}
        onDiscardDrawn={() => socket.emit('turn:drawn_action', { type: 'discard_drawn' }, () => {})}
        onUsePower={() => socket.emit('turn:drawn_action', { type: 'use_power' }, () => {})}
      />

      {/* Self Area */}
      {myPlayer && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SelfArea
            player={myPlayer}
            grid={gameState.myGrid}
            selectableSlots={selectableSlots}
            selectedSlot={selectedSlots.length > 0 ? selectedSlots[selectedSlots.length - 1] : null}
            onCardClick={handleMyCardClick}
            isCurrentTurn={gameState.isMyTurn}
          />
        </div>
      )}

      {/* Game Log */}
      <GameLog />

      {/* Peek Modal */}
      <Modal isOpen={showPeekModal} onClose={() => setShowPeekModal(false)} title="Your Peeked Cards">
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
          {peekedCards.map((card, i) => (
            <Card key={i} card={card} isRevealed size="lg" />
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          Remember these cards!
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button onClick={() => setShowPeekModal(false)} size="sm">Got it</Button>
        </div>
      </Modal>

      {/* Scores Modal */}
      <Modal isOpen={showScoresModal} onClose={() => setShowScoresModal(false)} title="Round Results">
        {revealGrids && (
          <div style={{ marginBottom: '16px' }}>
            {Object.entries(revealGrids).map(([pid, cards]) => {
              const player = gameState.players.find(p => p.id === pid);
              return (
                <div key={pid} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    {player?.name || pid.slice(0, 6)}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {cards.map(c => (
                      <Card key={c.slotIndex} card={c.card} isRevealed size="sm" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {scores && (
          <div>
            <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Scores</h4>
            {Object.entries(scores.roundScores).map(([pid, score]) => {
              const player = gameState.players.find(p => p.id === pid);
              const isWinner = pid === scores!.roundWinner;
              return (
                <div key={pid} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  fontWeight: isWinner ? 'bold' : 'normal',
                  color: isWinner ? 'var(--color-success)' : 'var(--color-text)',
                }}>
                  <span>{player?.name || pid.slice(0, 6)} {isWinner && '(Winner)'}</span>
                  <span>{score}</span>
                </div>
              );
            })}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button onClick={() => { setShowScoresModal(false); navigate('/'); }} size="sm">
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Mode indicator */}
      {mode !== 'none' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-warning)',
          color: '#000',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 100,
        }}>
          {mode === 'peek_select' && `Select 2 cards to peek (${selectedSlots.length}/2)`}
          {mode === 'swap_select' && 'Select a card to swap with'}
          {mode === 'tap_self_select' && 'Select your card to tap'}
          {mode === 'tap_other_select' && "Select an opponent's card to tap"}
          {mode === 'power_select' && 'Select target for power'}
          <button
            onClick={() => { setMode('none'); setSelectedSlots([]); }}
            style={{
              marginLeft: '12px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,0,0,0.2)',
              color: '#000',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
