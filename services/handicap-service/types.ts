export type NormalizeHandicap = (value: number | string) => number;

export type ValidateHandicap = (value: number) => boolean;

export type ApplyHandicapToInitialScore = (handicap: number) => number;
