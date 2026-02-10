import { GamePhase, TurnPhase } from '@red-king/shared';

const PHASE_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  waiting: ['dealing'],
  dealing: ['peeking'],
  peeking: ['playing'],
  playing: ['final_turns', 'reveal'],
  final_turns: ['reveal'],
  reveal: ['scoring'],
  scoring: ['finished', 'dealing'],
  finished: ['waiting'],
};

const TURN_TRANSITIONS: Record<TurnPhase, TurnPhase[]> = {
  pre_draw: ['drawn', 'resolving_tap', 'turn_complete'],
  drawn: ['turn_complete', 'using_power'],
  using_power: ['turn_complete'],
  resolving_tap: ['turn_complete'],
  turn_complete: ['pre_draw'],
};

export class StateMachine {
  phase: GamePhase = 'waiting';
  turnPhase: TurnPhase = 'pre_draw';

  transition(to: GamePhase): void {
    if (!this.canTransition(to)) {
      throw new Error(`Invalid phase transition: ${this.phase} -> ${to}`);
    }
    this.phase = to;
  }

  transitionTurn(to: TurnPhase): void {
    if (!this.canTransitionTurn(to)) {
      throw new Error(`Invalid turn transition: ${this.turnPhase} -> ${to}`);
    }
    this.turnPhase = to;
  }

  canTransition(to: GamePhase): boolean {
    return PHASE_TRANSITIONS[this.phase]?.includes(to) ?? false;
  }

  canTransitionTurn(to: TurnPhase): boolean {
    return TURN_TRANSITIONS[this.turnPhase]?.includes(to) ?? false;
  }

  resetTurn(): void {
    this.turnPhase = 'pre_draw';
  }
}
