import { ServerGameState, calculateScore } from '@red-king/shared';

export class Scorer {
  calculateRoundScores(state: ServerGameState): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const playerId of state.players) {
      const grid = state.grids[playerId];
      scores[playerId] = calculateScore(grid);
    }
    return scores;
  }

  determineRoundWinner(roundScores: Record<string, number>): string {
    return Object.entries(roundScores)
      .sort(([, a], [, b]) => a - b)[0][0];
  }
}
