import { GridPosition } from './card.js';

export type TurnAction =
  | { type: 'draw_from_pile' }
  | { type: 'take_from_discard' }
  | { type: 'tap_self'; slotIndex: GridPosition }
  | { type: 'tap_other'; targetPlayerId: string; targetSlotIndex: GridPosition }
  | { type: 'call' };

export type DrawnCardAction =
  | { type: 'swap_with_grid'; slotIndex: GridPosition }
  | { type: 'discard_drawn' }
  | { type: 'use_power' };

export type PowerAction =
  | { type: 'peek_own'; slotIndex: GridPosition }
  | { type: 'peek_other'; targetPlayerId: string; targetSlotIndex: GridPosition }
  | { type: 'swap_own_with_other'; mySlotIndex: GridPosition; targetPlayerId: string; targetSlotIndex: GridPosition }
  | { type: 'look_at_two'; selections: Array<{ playerId: string; slotIndex: GridPosition }> }
  | { type: 'blind_swap'; from: { playerId: string; slotIndex: GridPosition }; to: { playerId: string; slotIndex: GridPosition } }
  | { type: 'reveal_own'; slotIndex: GridPosition }
  | { type: 'black_king_look'; selections: Array<{ playerId: string; slotIndex: GridPosition }> }
  | { type: 'black_king_swap'; from: { playerId: string; slotIndex: GridPosition }; to: { playerId: string; slotIndex: GridPosition } };
