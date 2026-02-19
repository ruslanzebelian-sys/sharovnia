import type { MatchSeries } from "../../types/game";

export type ApplyPenalty = (series: MatchSeries, playerId: string, delta: number) => MatchSeries;

export type GetSessionPenalty = (series: MatchSeries, playerId: string) => number;

export type ResetSessionPenalties = (series: MatchSeries) => MatchSeries;

export type IsPenaltyBalanced = (series: MatchSeries) => boolean;

export type PenaltyImbalance = {
  isBalanced: boolean;
  total: number;
};

export type GetPenaltyImbalance = (series: MatchSeries) => PenaltyImbalance;
