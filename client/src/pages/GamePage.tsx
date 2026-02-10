import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GridPosition, Card as CardType, hasPower } from '@red-king/shared';
import { useSocket } from '../context/SocketContext';
import { usePlayer } from '../context/PlayerContext';
import { useGame } from '../context/GameContext';
import { SelfArea } from '../components/PlayerArea/SelfArea';
import { OpponentArea } from '../components/PlayerArea/OpponentArea';
import { DrawPile } from '../components/GameBoard/DrawPile';
import { DiscardPile } from '../components/GameBoard/DiscardPile';
import { TurnIndicator } from '../components/HUD/TurnIndicator';
import { GameLog } from '../components/HUD/GameLog';
import { RulesPanel } from '../components/HUD/RulesPanel';
import { Card } from '../components/Card/Card';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

type InteractionMode =
  | 'none'
  | 'peek_select'
  | 'swap_select'
  | 'power_peek_own'
  | 'power_peek_other'
  | 'power_swap'
  | 'power_swap_target'
  | 'power_look_two'
  | 'power_blind_swap_from'
  | 'power_blind_swap_to'
  | 'power_reveal'
  | 'power_bk_look'
  | 'power_bk_swap_from'
  | 'power_bk_swap_to';

export function GamePage() {
  const socket = useSocket();
  const { playerId } = usePlayer();
  const { gameState } = useGame();
  const navigate = useNavigate();

  const [mode, setMode] = useState<InteractionMode>('none');
  const [selectedSlots, setSelectedSlots] = useState<GridPosition[]>([]);
  const [peekedCards, setPeekedCards] = useState<CardType[]>([]);
  const [showPeekModal, setShowPeekModal] = useState(false);
  const [showDrawnModal, setShowDrawnModal] = useState(false);
  const [drawnFrom, setDrawnFrom] = useState<'draw' | 'discard' | null>(null);
  const [showScoresModal, setShowScoresModal] = useState(false);
  const [scores, setScores] = useState<{ roundScores: Record<string, number>; totalScores: Record<string, number[]>; roundWinner: string } | null>(null);
  const [revealGrids, setRevealGrids] = useState<Record<string, Array<{ slotIndex: GridPosition; card: CardType }>> | null>(null);
  const [powerSelections, setPowerSelections] = useState<Array<{ playerId: string; slotIndex: GridPosition }>>([]);
  const [powerFrom, setPowerFrom] = useState<{ playerId: string; slotIndex: GridPosition } | null>(null);
  const [showPowerResultModal, setShowPowerResultModal] = useState(false);
  const [powerResultCards, setPowerResultCards] = useState<Array<{ playerId: string; slotIndex: GridPosition; card: CardType }>>([]);

  // Auto-enter peek mode when game state shows peeking phase
  // (handles the case where peek:prompt event was missed during navigation)
  useEffect(() => {
    if (gameState?.phase === 'peeking' && mode === 'none') {
      setMode('peek_select');
      setSelectedSlots([]);
    }
  }, [gameState?.phase]);

  // Reset state when turn phase resets
  useEffect(() => {
    if (!gameState?.isMyTurn || gameState?.turnPhase === 'pre_draw') {
      setShowDrawnModal(false);
      setDrawnFrom(null);
      setPowerSelections([]);
      setPowerFrom(null);
      if (mode !== 'peek_select' && mode !== 'none') {
        setMode('none');
      }
    }
  }, [gameState?.isMyTurn, gameState?.turnPhase]);

  useEffect(() => {
    socket.on('peek:prompt', () => {
      setMode('peek_select');
      setSelectedSlots([]);
    });

    socket.on('turn:drew_card', (data) => {
      if (data.playerId === playerId) {
        setDrawnFrom(data.fromPile);
        if (data.fromPile === 'draw') {
          setShowDrawnModal(true);
        } else {
          // Took from discard — must swap
          setMode('swap_select');
        }
      }
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
      socket.off('turn:drew_card');
      socket.off('game:reveal');
      socket.off('game:scores');
    };
  }, [socket, playerId]);

  useEffect(() => {
    if (!gameState && !showScoresModal) {
      navigate('/');
    }
  }, [gameState, navigate, showScoresModal]);

  // --- Card click handlers (no useCallback — avoids stale closures) ---

  const handleMyCardClick = (slotIndex: GridPosition) => {
    // Peek phase: select cards to peek
    if (mode === 'peek_select') {
      setSelectedSlots(prev => {
        if (prev.includes(slotIndex)) return prev.filter(s => s !== slotIndex);
        if (prev.length >= 2) return prev;
        const next = [...prev, slotIndex];
        if (next.length === 2) {
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
      return;
    }
    // Swap mode: place drawn/discard card into grid
    if (mode === 'swap_select') {
      socket.emit('turn:drawn_action', { type: 'swap_with_grid', slotIndex }, () => {});
      setMode('none');
      setShowDrawnModal(false);
      return;
    }
    // Power: peek own (7)
    if (mode === 'power_peek_own') {
      socket.emit('turn:power', { type: 'peek_own', slotIndex }, (res) => {
        if (res.ok && res.revealedCards) {
          setPowerResultCards(res.revealedCards);
          setShowPowerResultModal(true);
        }
      });
      setMode('none');
      return;
    }
    // Power: reveal own (Q)
    if (mode === 'power_reveal') {
      socket.emit('turn:power', { type: 'reveal_own', slotIndex }, () => {});
      setMode('none');
      return;
    }
    // Power: swap own card first (9)
    if (mode === 'power_swap') {
      setPowerFrom({ playerId: playerId!, slotIndex });
      setMode('power_swap_target');
      return;
    }
    // "any card" multi-select modes
    if (isAnyCardMode(mode)) {
      handleAnyCardSelect(playerId!, slotIndex);
      return;
    }
    // Pre-draw tap: tapping own card = tap self (claim match with discard)
    if (mode === 'none' && gameState?.isMyTurn && gameState.turnPhase === 'pre_draw' && gameState.topDiscard) {
      socket.emit('turn:action', { type: 'tap_self', slotIndex }, () => {});
      return;
    }
  };

  const handleOpponentCardClick = (targetPlayerId: string, slotIndex: GridPosition) => {
    // Power: peek other (8)
    if (mode === 'power_peek_other') {
      socket.emit('turn:power', { type: 'peek_other', targetPlayerId, targetSlotIndex: slotIndex }, (res) => {
        if (res.ok && res.revealedCards) {
          setPowerResultCards(res.revealedCards);
          setShowPowerResultModal(true);
        }
      });
      setMode('none');
      return;
    }
    // Power: swap target (9) — pick opponent's card to swap with
    if (mode === 'power_swap_target' && powerFrom) {
      socket.emit('turn:power', {
        type: 'swap_own_with_other',
        mySlotIndex: powerFrom.slotIndex,
        targetPlayerId,
        targetSlotIndex: slotIndex,
      }, () => {});
      setMode('none');
      setPowerFrom(null);
      return;
    }
    // "any card" multi-select modes
    if (isAnyCardMode(mode)) {
      handleAnyCardSelect(targetPlayerId, slotIndex);
      return;
    }
    // Pre-draw tap: tapping opponent's card = tap other (claim match with discard)
    if (mode === 'none' && gameState?.isMyTurn && gameState.turnPhase === 'pre_draw' && gameState.topDiscard) {
      socket.emit('turn:action', {
        type: 'tap_other',
        targetPlayerId,
        targetSlotIndex: slotIndex,
      }, () => {});
      return;
    }
  };

  // Handles modes where any card (own or opponent) can be selected
  const handleAnyCardSelect = (targetPlayerId: string, slotIndex: GridPosition) => {
    // Look at two (10) or Black King look phase
    if (mode === 'power_look_two' || mode === 'power_bk_look') {
      const currentMode = mode; // capture before async
      setPowerSelections(prev => {
        const next = [...prev, { playerId: targetPlayerId, slotIndex }];
        if (next.length === 2) {
          const powerType = currentMode === 'power_bk_look' ? 'black_king_look' : 'look_at_two';
          socket.emit('turn:power', { type: powerType, selections: next } as any, (res) => {
            if (res.ok && res.revealedCards) {
              setPowerResultCards(res.revealedCards);
              setShowPowerResultModal(true);
            }
            if (currentMode === 'power_bk_look') {
              setMode('power_bk_swap_from');
            } else {
              setMode('none');
            }
          });
          return [];
        }
        return next;
      });
      return;
    }
    // Blind swap from (J) or Black King swap from
    if (mode === 'power_blind_swap_from' || mode === 'power_bk_swap_from') {
      setPowerFrom({ playerId: targetPlayerId, slotIndex });
      setMode(mode === 'power_blind_swap_from' ? 'power_blind_swap_to' : 'power_bk_swap_to');
      return;
    }
    // Blind swap to (J) or Black King swap to
    if (mode === 'power_blind_swap_to' || mode === 'power_bk_swap_to') {
      if (!powerFrom) return;
      const powerType = mode === 'power_bk_swap_to' ? 'black_king_swap' : 'blind_swap';
      socket.emit('turn:power', {
        type: powerType,
        from: powerFrom,
        to: { playerId: targetPlayerId, slotIndex },
      } as any, () => {});
      setMode('none');
      setPowerFrom(null);
      return;
    }
  };

  // Drawn card popup choices
  const handleSwapChoice = () => {
    setShowDrawnModal(false);
    setMode('swap_select');
  };

  const handleDiscardChoice = () => {
    setShowDrawnModal(false);
    socket.emit('turn:drawn_action', { type: 'discard_drawn' }, () => {});
    setMode('none');
  };

  const handleUsePowerChoice = () => {
    // Capture the rank NOW before the async emit, so it won't go stale
    const cardRank = gameState?.drawnCard?.rank;
    if (!cardRank) return;
    setShowDrawnModal(false);
    socket.emit('turn:drawn_action', { type: 'use_power' }, (res) => {
      if (res.ok) {
        switch (cardRank) {
          case '7': setMode('power_peek_own'); break;
          case '8': setMode('power_peek_other'); break;
          case '9': setMode('power_swap'); break;
          case '10': setMode('power_look_two'); break;
          case 'J': setMode('power_blind_swap_from'); break;
          case 'Q': setMode('power_reveal'); break;
          case 'K': setMode('power_bk_look'); break;
        }
      }
    });
  };

  // Draw / Discard pile clicks
  const handleDrawPileClick = () => {
    if (!gameState?.isMyTurn || gameState.turnPhase !== 'pre_draw') return;
    socket.emit('turn:action', { type: 'draw_from_pile' }, () => {});
  };

  const handleDiscardPileClick = () => {
    if (!gameState?.isMyTurn || gameState.turnPhase !== 'pre_draw' || !gameState.topDiscard) return;
    socket.emit('turn:action', { type: 'take_from_discard' }, () => {});
  };

  const cancelMode = () => {
    setMode('none');
    setSelectedSlots([]);
    setPowerSelections([]);
    setPowerFrom(null);
  };

  if (!gameState) return null;

  const myPlayer = gameState.players.find(p => p.id === playerId);
  const opponents = gameState.players.filter(p => p.id !== playerId);
  const allSlots: GridPosition[] = [0, 1, 2, 3];

  const isMyTurnPreDraw = gameState.isMyTurn && gameState.turnPhase === 'pre_draw';
  const hasDiscard = !!gameState.topDiscard;
  const drawPileClickable = isMyTurnPreDraw;
  const discardPileClickable = isMyTurnPreDraw && hasDiscard;
  // During pre_draw with a discard, all cards are tappable (tap self / tap other)
  const cardsTappableForTap = isMyTurnPreDraw && hasDiscard && mode === 'none';

  // Determine which cards are selectable
  const selfSelectableModes: InteractionMode[] = [
    'peek_select', 'swap_select',
    'power_peek_own', 'power_reveal', 'power_swap',
    'power_look_two', 'power_bk_look',
    'power_blind_swap_from', 'power_blind_swap_to',
    'power_bk_swap_from', 'power_bk_swap_to',
  ];
  const oppSelectableModes: InteractionMode[] = [
    'power_peek_other', 'power_swap_target',
    'power_look_two', 'power_bk_look',
    'power_blind_swap_from', 'power_blind_swap_to',
    'power_bk_swap_from', 'power_bk_swap_to',
  ];

  const mySelectableSlots = selfSelectableModes.includes(mode) || cardsTappableForTap ? allSlots : [];
  const oppSelectableSlots = oppSelectableModes.includes(mode) || cardsTappableForTap ? allSlots : [];

  const canUsePower = gameState.drawnCard && hasPower(gameState.drawnCard);

  // --- Contextual guidance ---
  const getGuidance = (): { text: string; color: string } => {
    if (gameState.phase === 'peeking') {
      if (mode === 'peek_select') {
        return {
          text: `Tap 2 of your cards to peek at them (${selectedSlots.length}/2 selected)`,
          color: 'var(--color-warning)',
        };
      }
      return { text: 'Waiting for other players to peek...', color: 'var(--color-text-muted)' };
    }

    if (!gameState.isMyTurn) {
      const current = gameState.players.find(p => p.id === gameState.currentPlayerId);
      return { text: `Waiting for ${current?.name || 'opponent'}...`, color: 'var(--color-text-muted)' };
    }

    if (gameState.turnPhase === 'pre_draw') {
      if (hasDiscard) {
        return {
          text: 'Your turn! Tap a pile to pick up a card, or tap any card to claim it matches the discard.',
          color: 'var(--color-success)',
        };
      }
      return { text: 'Your turn! Tap the draw pile to draw a card.', color: 'var(--color-success)' };
    }

    if (mode === 'swap_select') {
      const label = drawnFrom === 'discard' ? 'discard card' : 'drawn card';
      return { text: `Tap one of your cards to swap it with the ${label}.`, color: 'var(--color-warning)' };
    }
    if (mode === 'power_peek_own') return { text: '7 Power — Tap one of your cards to peek at it.', color: 'var(--color-primary)' };
    if (mode === 'power_peek_other') return { text: "8 Power — Tap an opponent's card to peek at it.", color: 'var(--color-primary)' };
    if (mode === 'power_swap') return { text: '9 Power — Tap your card to start the swap.', color: 'var(--color-primary)' };
    if (mode === 'power_swap_target') return { text: "9 Power — Now tap an opponent's card to swap with.", color: 'var(--color-primary)' };
    if (mode === 'power_look_two') return { text: `10 Power — Tap any 2 cards to look at (${powerSelections.length}/2).`, color: 'var(--color-primary)' };
    if (mode === 'power_blind_swap_from') return { text: 'J Power — Tap the first card to swap (any card on the table).', color: 'var(--color-primary)' };
    if (mode === 'power_blind_swap_to') return { text: 'J Power — Now tap the second card to swap with.', color: 'var(--color-primary)' };
    if (mode === 'power_reveal') return { text: 'Q Power — Tap one of your cards to permanently reveal it.', color: 'var(--color-primary)' };
    if (mode === 'power_bk_look') return { text: `Black King — Choose any 2 cards to look at (${powerSelections.length}/2).`, color: 'var(--color-primary)' };
    if (mode === 'power_bk_swap_from') return { text: 'Black King — Now swap any 2 cards. Tap the first card.', color: 'var(--color-primary)' };
    if (mode === 'power_bk_swap_to') return { text: 'Black King — Tap the second card to complete the swap.', color: 'var(--color-primary)' };

    if (gameState.turnPhase === 'drawn') return { text: 'Choose what to do with your card.', color: 'var(--color-warning)' };

    return { text: '', color: 'var(--color-text-muted)' };
  };

  const guidance = getGuidance();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      padding: '12px',
      gap: '12px',
    }}>
      {/* HUD top bar */}
      <TurnIndicator gameState={gameState} />

      {/* Rules Panel (fixed top-right) */}
      <RulesPanel />

      {/* Contextual Guidance Banner */}
      {guidance.text && (
        <div style={{
          textAlign: 'center',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${guidance.color}`,
          color: guidance.color,
          fontSize: '14px',
          fontWeight: 600,
          animation: 'fadeIn 0.3s ease-out',
        }}>
          {guidance.text}
        </div>
      )}

      {/* Peek Phase Banner */}
      {gameState.phase === 'peeking' && mode === 'peek_select' && (
        <div style={{
          textAlign: 'center',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(220,38,38,0.15), rgba(202,138,4,0.15))',
          border: '1px solid var(--color-warning)',
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--color-warning)',
        }}>
          Peek at your cards! Tap any 2 cards below.
        </div>
      )}

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
            selectableSlots={oppSelectableSlots}
            onCardClick={(slotIndex) => handleOpponentCardClick(opp.id, slotIndex)}
          />
        ))}
      </div>

      {/* Center: Draw + Discard Piles */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '32px',
        padding: '16px 0',
      }}>
        <div style={{
          animation: drawPileClickable ? 'glow 2s ease-in-out infinite' : 'none',
          borderRadius: 'var(--radius-card)',
          padding: '4px',
        }}>
          <DrawPile
            count={gameState.drawPileCount}
            isClickable={drawPileClickable}
            onClick={handleDrawPileClick}
          />
        </div>

        <div style={{
          animation: discardPileClickable ? 'glow 2s ease-in-out infinite' : 'none',
          borderRadius: 'var(--radius-card)',
          padding: '4px',
        }}>
          <DiscardPile
            topCard={gameState.topDiscard}
            count={gameState.discardPileCount}
            isClickable={discardPileClickable}
            onClick={handleDiscardPileClick}
          />
        </div>
      </div>

      {/* Call button — only shown during pre_draw if nobody called yet */}
      {isMyTurnPreDraw && !gameState.callerPlayerId && (
        <div style={{ display: 'flex', justifyContent: 'center', animation: 'fadeIn 0.3s ease-out' }}>
          <Button
            onClick={() => socket.emit('turn:action', { type: 'call' }, () => {})}
            variant="danger"
            size="sm"
          >
            Call (end round)
          </Button>
        </div>
      )}

      {/* Self Area */}
      {myPlayer && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          animation: (mode === 'peek_select' || mode === 'swap_select' || cardsTappableForTap) ? 'glow 2s ease-in-out infinite' : 'none',
          borderRadius: 'var(--radius-lg)',
          padding: '4px',
        }}>
          <SelfArea
            player={myPlayer}
            grid={gameState.myGrid}
            selectableSlots={mySelectableSlots}
            selectedSlot={selectedSlots.length > 0 ? selectedSlots[selectedSlots.length - 1] : null}
            onCardClick={handleMyCardClick}
            isCurrentTurn={gameState.isMyTurn}
          />
        </div>
      )}

      {/* Game Log */}
      <GameLog />

      {/* ===== MODALS ===== */}

      {/* Peek Modal */}
      <Modal isOpen={showPeekModal} onClose={() => setShowPeekModal(false)} title="Your Peeked Cards">
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
          {peekedCards.map((card, i) => (
            <Card key={i} card={card} isRevealed size="lg" />
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          Remember these cards! The game begins once everyone peeks.
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button onClick={() => setShowPeekModal(false)} size="sm">Got it</Button>
        </div>
      </Modal>

      {/* Drawn Card Popup */}
      <Modal isOpen={showDrawnModal && !!gameState.drawnCard} title="You drew a card!">
        {gameState.drawnCard && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Card card={gameState.drawnCard} isRevealed size="lg" />
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              What would you like to do?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <Button onClick={handleSwapChoice} style={{ width: '100%' }}>
                Swap with one of my cards
              </Button>
              <Button onClick={handleDiscardChoice} variant="secondary" style={{ width: '100%' }}>
                Discard it
              </Button>
              {canUsePower && (
                <Button onClick={handleUsePowerChoice} variant="ghost" style={{ width: '100%' }}>
                  Use Power ({gameState.drawnCard.rank})
                </Button>
              )}
            </div>
            {canUsePower && (
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.04)',
                width: '100%',
              }}>
                {getPowerDescription(gameState.drawnCard.rank)}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Power Result Modal (peek results) */}
      <Modal isOpen={showPowerResultModal} onClose={() => setShowPowerResultModal(false)} title="Revealed Cards">
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
          {powerResultCards.map((rc, i) => {
            const owner = gameState.players.find(p => p.id === rc.playerId);
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <Card card={rc.card} isRevealed size="md" />
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {rc.playerId === playerId ? 'You' : owner?.name || '?'} — slot {rc.slotIndex + 1}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          Remember what you saw!
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button onClick={() => setShowPowerResultModal(false)} size="sm">Got it</Button>
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

      {/* Mode cancel button (fixed bottom) */}
      {mode !== 'none' && mode !== 'peek_select' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
        }}>
          <button
            onClick={cancelMode}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function isAnyCardMode(mode: InteractionMode): boolean {
  return [
    'power_look_two', 'power_bk_look',
    'power_blind_swap_from', 'power_blind_swap_to',
    'power_bk_swap_from', 'power_bk_swap_to',
  ].includes(mode);
}

function getPowerDescription(rank: string): string {
  switch (rank) {
    case '7': return 'Peek Own: Look at one of your own face-down cards.';
    case '8': return "Peek Other: Look at one of another player's face-down cards.";
    case '9': return "Swap: Swap one of your cards with another player's card (no peeking).";
    case '10': return 'Double Peek: Look at any 2 cards on the table.';
    case 'J': return 'Blind Swap: Swap any 2 cards on the table (no peeking).';
    case 'Q': return 'Reveal: Permanently flip one of your cards face-up.';
    case 'K': return 'Black King: Look at any 2 cards, then swap any 2 cards.';
    default: return '';
  }
}
