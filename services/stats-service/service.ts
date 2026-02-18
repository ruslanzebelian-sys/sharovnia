import type { ColoredBall, Player, ShotEvent } from "../../types/game";
import type { ComputePlayerStats, PlayerStats } from "./types";

function createInitialColoredCounts(coloredBalls: ColoredBall[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const ball of coloredBalls) {
    counts[ball.id] = 0;
  }

  return counts;
}

export const computePlayerStats: ComputePlayerStats = (players, coloredBalls, events) => {
  const playerIdSet = new Set(players.map((player) => player.id));
  const coloredBallIdSet = new Set(coloredBalls.map((ball) => ball.id));

  const statsByPlayerId = new Map<string, PlayerStats>();

  for (const player of players) {
    statsByPlayerId.set(player.id, {
      playerId: player.id,
      coloredCounts: createInitialColoredCounts(coloredBalls),
      penaltyTotal: 0,
    });
  }

  for (const event of events) {
    if (!playerIdSet.has(event.playerId)) {
      continue;
    }

    const playerStats = statsByPlayerId.get(event.playerId);
    if (!playerStats) {
      continue;
    }

    if (event.type === "colored") {
      if (!event.coloredBallId || !coloredBallIdSet.has(event.coloredBallId)) {
        continue;
      }

      if (!Number.isFinite(event.value)) {
        continue;
      }

      playerStats.coloredCounts[event.coloredBallId] += Math.trunc(event.value);
      continue;
    }

    if (event.type === "penalty" && Number.isFinite(event.value)) {
      playerStats.penaltyTotal += Math.trunc(event.value);
    }
  }

  return players
    .map((player) => statsByPlayerId.get(player.id))
    .filter((stats): stats is PlayerStats => Boolean(stats));
};
