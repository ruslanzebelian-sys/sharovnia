import type { Player } from "../../types/game";

export type ShufflePlayers = (players: Player[], seed?: number) => Player[];

export type GetReverseOrder = (endingOrder: string[], lastScoringPlayerId: string) => string[];
