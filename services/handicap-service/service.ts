import type { ApplyHandicapToInitialScore, NormalizeHandicap, ValidateHandicap } from "./types";

export const normalizeHandicap: NormalizeHandicap = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized = Math.trunc(value);
  return Math.max(0, normalized);
};

export const validateHandicap: ValidateHandicap = (value) => {
  return Number.isInteger(value) && value >= 0;
};

export const applyHandicapToInitialScore: ApplyHandicapToInitialScore = (handicap) => {
  return normalizeHandicap(handicap);
};
