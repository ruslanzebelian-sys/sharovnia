import type { ShotEvent } from "../../types/game";

export type CreateDeltaEvent = (
  playerId: string,
  delta: number,
  source: "white" | "colored" | "penalty",
  coloredBallId?: string
) => ShotEvent;

export type CreatePenaltyEvent = (
  playerId: string,
  isPositive: boolean,
  penaltyNominal: number
) => ShotEvent;
