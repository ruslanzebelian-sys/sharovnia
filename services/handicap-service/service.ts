import type { ApplyHandicapToInitialScore, NormalizeHandicap, ValidateHandicap } from "./types";

export const normalizeHandicap: NormalizeHandicap = (value) => {
  const parsedValue =
    typeof value === "string" ? Number(value.trim().length > 0 ? value : 0) : value;

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  const normalized = Math.floor(parsedValue);
  return normalized < 0 ? 0 : normalized;
};

export const validateHandicap: ValidateHandicap = (value) => {
  return Number.isInteger(value) && value >= 0;
};

export const applyHandicapToInitialScore: ApplyHandicapToInitialScore = (handicap) => {
  return normalizeHandicap(handicap);
};
