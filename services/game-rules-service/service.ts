import type { Player } from "../../types/game";
import type { ClampPlayers, ValidatePlayerCount } from "./types";

export const MAX_PLAYERS_PER_GAME = 8;

export const validatePlayerCount: ValidatePlayerCount = (count) => {
  return Number.isInteger(count) && count >= 0 && count <= MAX_PLAYERS_PER_GAME;
};

export const clampPlayers: ClampPlayers = (players) => {
  if (players.length <= MAX_PLAYERS_PER_GAME) {
    return [...players];
  }

  return players.slice(0, MAX_PLAYERS_PER_GAME);
};
