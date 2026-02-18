import type { ColoredBall, Player, ShotEvent } from "../../types/game";

export type PlayerStats = {
  playerId: string;
  coloredCounts: Record<string, number>;
  penaltyTotal: number;
};

export type ComputePlayerStats = (
  players: Player[],
  coloredBalls: ColoredBall[],
  events: ShotEvent[]
) => PlayerStats[];
