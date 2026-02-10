import { Card, GridPosition } from '../types/card.js';
import { TurnAction, DrawnCardAction, PowerAction } from '../types/actions.js';

export interface ClientToServerEvents {
  'room:create': (
    data: { playerName: string },
    callback: (response: { ok: boolean; roomCode?: string; playerId?: string; error?: string }) => void
  ) => void;

  'room:join': (
    data: { playerName: string; roomCode: string },
    callback: (response: { ok: boolean; playerId?: string; error?: string }) => void
  ) => void;

  'room:leave': () => void;

  'room:get_state': (
    callback: (response: { ok: boolean; players?: Array<{ id: string; name: string; isHost: boolean; isConnected: boolean }>; hostId?: string; roomCode?: string; error?: string }) => void
  ) => void;

  'room:ready': (isReady: boolean) => void;

  'room:start': (
    callback: (response: { ok: boolean; error?: string }) => void
  ) => void;

  'peek:select': (
    slotIndices: [GridPosition, GridPosition],
    callback: (response: { ok: boolean; cards?: [Card, Card]; error?: string }) => void
  ) => void;

  'turn:action': (
    action: TurnAction,
    callback: (response: { ok: boolean; error?: string }) => void
  ) => void;

  'turn:drawn_action': (
    action: DrawnCardAction,
    callback: (response: { ok: boolean; drawnCard?: Card; error?: string }) => void
  ) => void;

  'turn:power': (
    action: PowerAction,
    callback: (response: {
      ok: boolean;
      revealedCards?: Array<{ playerId: string; slotIndex: GridPosition; card: Card }>;
      error?: string;
    }) => void
  ) => void;

  'turn:swap_after_take': (
    slotIndex: GridPosition,
    callback: (response: { ok: boolean; error?: string }) => void
  ) => void;

  'reconnect:attempt': (
    data: { playerId: string; roomCode: string },
    callback: (response: { ok: boolean; error?: string }) => void
  ) => void;
}
