export type ColoredBall = {
  id: string;
  label: string;
  nominal: number;
  color: string;
};

export type Player = {
  id: string;
  name: string;
  handicap: number;
};

export type ShotEvent = {
  playerId: string;
  delta: number;
  source: "white" | "colored" | "penalty";
  coloredBallId?: string;
};

export type SeriesGameMeta = {
  gameIndex: number;
  isReverse: boolean;
};

export type GameRules = {
  penaltyNominal: number;
};

export type GamePhase = "ACTIVE" | "SETTLED";

export type SessionTimer = {
  startedAt: number | null;
  endedAt: number | null;
};

export type GameConfig = {
  players: Player[];
  ballPrice: number;
  penaltyNominal: number;
  createdAt: number;
  coloredModeEnabled: boolean;
  coloredBalls?: ColoredBall[];
};

export type Game = {
  id: string;
  players: Player[];
  playerOrder: string[];
  shotEvents: ShotEvent[];
  penalties: Record<string, number>;
  settlementInput: Record<string, number>;
  ballPrice: number;
  createdAt: number;
  coloredModeEnabled: boolean;
  coloredBalls?: ColoredBall[];
  rules: GameRules;
  phase: GamePhase;
  seriesMeta?: SeriesGameMeta;
};

export type MatchSeries = {
  id: string;
  games: Game[];
  baseOrder: string[];
  currentIndex: number;
  sessionTimer: SessionTimer;
  cumulativeScore: Record<string, number>;
};
