import type { MatchSeries } from "../../types/game";

export type StartSessionTimer = (series: MatchSeries) => MatchSeries;
export type EndSessionTimer = (series: MatchSeries) => MatchSeries;
export type GetSessionElapsed = (series: MatchSeries, now: number) => number;
export type FormatSessionTime = (ms: number) => string;
