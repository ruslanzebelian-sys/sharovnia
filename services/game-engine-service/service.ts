import type { GameConfig } from "../../types/game";
import { clampPlayers, normalizePenaltyNominal } from "../game-rules-service";
import type { CreateGameFromConfig } from "./types";

function createGameId(config: GameConfig): string {
  return `game-${config.createdAt}-${config.players.length}`;
}

export const createGameFromConfig: CreateGameFromConfig = (config) => {
  const players = clampPlayers(config.players);

  if (players.length < 2) {
    throw new RangeError("At least 2 players are required to create a game.");
  }

  return {
    id: createGameId(config),
    players,
    playerOrder: players.map((player) => player.id),
    shotEvents: [],
    ballPrice: config.ballPrice,
    createdAt: config.createdAt,
    coloredModeEnabled: config.coloredModeEnabled,
    coloredBalls: config.coloredBalls,
    rules: {
      penaltyNominal: normalizePenaltyNominal(config.penaltyNominal),
    },
  };
};
