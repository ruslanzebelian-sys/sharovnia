import type { CreateDeltaEvent, CreatePenaltyEvent } from "./types";
import { DEFAULT_PENALTY_NOMINAL, normalizePenaltyNominal } from "../game-rules-service";

function normalizePenaltyDelta(delta: number, penaltyNominal: number): number {
  const nominal = normalizePenaltyNominal(penaltyNominal);
  if (!Number.isFinite(delta) || delta === 0) {
    return 0;
  }

  return delta > 0 ? nominal : -nominal;
}

export const createDeltaEvent: CreateDeltaEvent = (playerId, delta, source, coloredBallId) => {
  const normalizedDelta = Number.isFinite(delta) ? Math.trunc(delta) : 0;

  return {
    playerId,
    delta:
      source === "penalty"
        ? normalizePenaltyDelta(normalizedDelta, DEFAULT_PENALTY_NOMINAL)
        : normalizedDelta,
    source,
    coloredBallId: source === "colored" ? coloredBallId : undefined,
  };
};

export const createPenaltyEvent: CreatePenaltyEvent = (playerId, isPositive, penaltyNominal) => {
  const nominal = normalizePenaltyNominal(penaltyNominal);

  return {
    playerId,
    delta: isPositive ? nominal : -nominal,
    source: "penalty",
  };
};
