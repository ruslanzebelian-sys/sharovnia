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
  const coloredBallById = new Map(coloredBalls.map((ball) => [ball.id, ball]));

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

    if (event.source === "colored") {
      if (!event.coloredBallId || !coloredBallById.has(event.coloredBallId)) {
        continue;
      }

      if (!Number.isFinite(event.delta)) {
        continue;
      }

      const coloredBall = coloredBallById.get(event.coloredBallId);
      if (!coloredBall) {
        continue;
      }

      const nominal = Number.isFinite(coloredBall.nominal) && coloredBall.nominal > 0 ? coloredBall.nominal : 1;
      const countDelta = Math.trunc(event.delta / nominal);
      playerStats.coloredCounts[event.coloredBallId] += countDelta;
      continue;
    }

    if (event.source === "white" && Number.isFinite(event.delta)) {
      playerStats.penaltyTotal += Math.trunc(event.delta);
    }
  }

  return players
    .map((player) => statsByPlayerId.get(player.id))
    .filter((stats): stats is PlayerStats => Boolean(stats));
};
