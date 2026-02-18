import type { CreateDeltaEvent } from "./types";

export const createDeltaEvent: CreateDeltaEvent = (playerId, delta, source, coloredBallId) => {
  return {
    playerId,
    delta: Number.isFinite(delta) ? Math.trunc(delta) : 0,
    source,
    coloredBallId: source === "colored" ? coloredBallId : undefined,
  };
};
