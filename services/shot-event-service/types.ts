import type { ShotEvent } from "../../types/game";

export type CreateDeltaEvent = (
  playerId: string,
  delta: number,
  source: "white" | "colored",
  coloredBallId?: string
) => ShotEvent;
