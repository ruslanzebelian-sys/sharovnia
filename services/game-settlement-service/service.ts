import type { CalculateNetScores, ValidateSettlementInput, ValidateTotalBalls } from "./types";

export const MIN_TOTAL_BALLS = 16;

function normalizeSettlementValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized = Math.floor(value);
  return normalized < 0 ? 0 : normalized;
}

export const validateSettlementInput: ValidateSettlementInput = (players, inputMap) => {
  const normalized: Record<string, number> = {};

  for (const player of players) {
    const rawValue = inputMap[player.id];
    normalized[player.id] = normalizeSettlementValue(rawValue);
  }

  const isValid = players.every((player) => Number.isInteger(normalized[player.id]) && normalized[player.id] >= 0);

  return {
    isValid,
    normalized,
  };
};

export const calculateNetScores: CalculateNetScores = (
  playerOrder,
  settlementInput,
  penalties
) => {
  const netScores: Record<string, number> = {};

  for (let index = 0; index < playerOrder.length; index += 1) {
    const playerId = playerOrder[index];
    const nextIndex = index === playerOrder.length - 1 ? 0 : index + 1;
    const nextPlayerId = playerOrder[nextIndex];

    const scoredByPlayer = Number.isFinite(settlementInput[playerId]) ? Math.trunc(settlementInput[playerId]) : 0;
    const scoredAgainstPlayer = Number.isFinite(settlementInput[nextPlayerId])
      ? Math.trunc(settlementInput[nextPlayerId])
      : 0;
    const penalty = Number.isFinite(penalties[playerId]) ? Math.trunc(penalties[playerId]) : 0;

    netScores[playerId] = scoredByPlayer - scoredAgainstPlayer + penalty;
  }

  const totalSum = Object.values(netScores).reduce((acc, value) => acc + value, 0);

  return {
    netScores,
    isBalanced: totalSum === 0,
    totalSum,
  };
};

export const validateTotalBalls: ValidateTotalBalls = (settlementInput) => {
  const total = Object.values(settlementInput).reduce((acc, value) => {
    const normalized = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    return acc + normalized;
  }, 0);

  return {
    isValid: total >= MIN_TOTAL_BALLS,
    total,
  };
};
