import type { MatchSeries, Game } from "../../types/game";
import type { PlayerStats } from "../stats-service";

export type CreateSeries = (initialGame: Game) => MatchSeries;

export type ReverseOrder = (order: string[]) => string[];

export type GetNextGameOrder = (baseOrder: string[], gameIndex: number) => string[];

export type CreateNextGameFromPrevious = (prevGame: Game, order: string[], index: number) => Game;

export type SeriesGameStats = {
  gameId: string;
  gameIndex: number;
  isReverse: boolean;
  stats: PlayerStats[];
};

export type SeriesStats = {
  perGame: SeriesGameStats[];
  reverseGames: SeriesGameStats[];
  aggregate: PlayerStats[];
};

export type ComputeSeriesStats = (series: MatchSeries) => SeriesStats;
