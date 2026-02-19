import type { Game } from "../../types/game";

export type ApplyPenalty = (game: Game, playerId: string, delta: number) => Game;

export type GetPenalty = (game: Game, playerId: string) => number;

export type ResetPenalties = (game: Game) => Game;

export type IsPenaltyBalanced = (game: Game) => boolean;

export type PenaltyImbalance = {
  isBalanced: boolean;
  total: number;
};

export type GetPenaltyImbalance = (game: Game) => PenaltyImbalance;
