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
  type: "colored" | "penalty" | "score";
  coloredBallId?: string;
  value: number;
};

export type GameConfig = {
  players: Player[];
  ballPrice: number;
  createdAt: number;
  coloredModeEnabled: boolean;
  coloredBalls?: ColoredBall[];
};

export type Game = {
  id: string;
  players: Player[];
  playerOrder: string[];
  ballPrice: number;
  createdAt: number;
  coloredModeEnabled: boolean;
  coloredBalls?: ColoredBall[];
};
