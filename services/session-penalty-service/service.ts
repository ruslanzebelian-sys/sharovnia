import type { MatchSeries } from "../../types/game";
import type {
  ApplyPenalty,
  GetPenaltyImbalance,
  GetSessionPenalty,
  IsPenaltyBalanced,
  ResetSessionPenalties,
} from "./types";

function buildDefaultPenaltyBalance(series: MatchSeries): Record<string, number> {
  const firstGamePlayers = series.games[0]?.players ?? [];
  const balance: Record<string, number> = {};

  for (const player of firstGamePlayers) {
    balance[player.id] = 0;
  }

  return balance;
}

function ensurePenaltyBalance(series: MatchSeries): Record<string, number> {
  const current = series.sessionPenaltyBalance;
  if (!current) {
    return buildDefaultPenaltyBalance(series);
  }

  const merged = buildDefaultPenaltyBalance(series);
  for (const [playerId, value] of Object.entries(current)) {
    merged[playerId] = Number.isFinite(value) ? Math.trunc(value) : 0;
  }

  return merged;
}

export const applyPenalty: ApplyPenalty = (series, playerId, delta) => {
  if (!Number.isFinite(delta) || delta === 0) {
    return series;
  }

  const balance = ensurePenaltyBalance(series);
  balance[playerId] = (balance[playerId] ?? 0) + Math.trunc(delta);

  return {
    ...series,
    sessionPenaltyBalance: balance,
  };
};

export const getSessionPenalty: GetSessionPenalty = (series, playerId) => {
  const balance = ensurePenaltyBalance(series);
  return balance[playerId] ?? 0;
};

export const resetSessionPenalties: ResetSessionPenalties = (series) => {
  return {
    ...series,
    sessionPenaltyBalance: buildDefaultPenaltyBalance(series),
  };
};

export const isPenaltyBalanced: IsPenaltyBalanced = (series) => {
  return getPenaltyImbalance(series).isBalanced;
};

export const getPenaltyImbalance: GetPenaltyImbalance = (series) => {
  const balance = ensurePenaltyBalance(series);
  const total = Object.values(balance).reduce((acc, value) => acc + value, 0);
  return {
    isBalanced: total === 0,
    total,
  };
};
