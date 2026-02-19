import type { Player } from "../../types/game";
import type { ClampPlayers, NormalizePenaltyNominal, ValidatePlayerCount } from "./types";

export const MAX_PLAYERS_PER_GAME = 8;
export const MIN_PENALTY_NOMINAL = 1;
export const MAX_PENALTY_NOMINAL = 5;
export const DEFAULT_PENALTY_NOMINAL = 2;

export const validatePlayerCount: ValidatePlayerCount = (count) => {
  return Number.isInteger(count) && count >= 0 && count <= MAX_PLAYERS_PER_GAME;
};

export const clampPlayers: ClampPlayers = (players) => {
  if (players.length <= MAX_PLAYERS_PER_GAME) {
    return [...players];
  }

  return players.slice(0, MAX_PLAYERS_PER_GAME);
};

export const normalizePenaltyNominal: NormalizePenaltyNominal = (value) => {
  if (!Number.isFinite(value)) {
    return DEFAULT_PENALTY_NOMINAL;
  }

  const integerValue = Math.trunc(value);
  if (integerValue < MIN_PENALTY_NOMINAL) {
    return MIN_PENALTY_NOMINAL;
  }

  if (integerValue > MAX_PENALTY_NOMINAL) {
    return MAX_PENALTY_NOMINAL;
  }

  return integerValue;
};
