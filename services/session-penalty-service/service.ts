import type { Game } from "../../types/game";
import type {
  ApplyPenalty,
  GetPenaltyImbalance,
  GetPenalty,
  IsPenaltyBalanced,
  ResetPenalties,
} from "./types";

function buildDefaultPenaltyBalance(game: Game): Record<string, number> {
  const balance: Record<string, number> = {};

  for (const player of game.players) {
    balance[player.id] = 0;
  }

  return balance;
}

function ensurePenaltyBalance(game: Game): Record<string, number> {
  const current = game.penalties;
  if (!current) {
    return buildDefaultPenaltyBalance(game);
  }

  const merged = buildDefaultPenaltyBalance(game);
  for (const [playerId, value] of Object.entries(current)) {
    merged[playerId] = Number.isFinite(value) ? Math.trunc(value) : 0;
  }

  return merged;
}

export const applyPenalty: ApplyPenalty = (game, playerId, delta) => {
  if (!Number.isFinite(delta) || delta === 0) {
    return game;
  }

  const balance = ensurePenaltyBalance(game);
  balance[playerId] = (balance[playerId] ?? 0) + Math.trunc(delta);

  return {
    ...game,
    penalties: balance,
  };
};

export const getPenalty: GetPenalty = (game, playerId) => {
  const balance = ensurePenaltyBalance(game);
  return balance[playerId] ?? 0;
};

export const resetPenalties: ResetPenalties = (game) => {
  return {
    ...game,
    penalties: buildDefaultPenaltyBalance(game),
  };
};

export const isPenaltyBalanced: IsPenaltyBalanced = (game) => {
  return getPenaltyImbalance(game).isBalanced;
};

export const getPenaltyImbalance: GetPenaltyImbalance = (game) => {
  const balance = ensurePenaltyBalance(game);
  const total = Object.values(balance).reduce((acc, value) => acc + value, 0);
  return {
    isBalanced: total === 0,
    total,
  };
};
