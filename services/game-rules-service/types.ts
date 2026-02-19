import type { Player } from "../../types/game";

export type ValidatePlayerCount = (count: number) => boolean;

export type ClampPlayers = (players: Player[]) => Player[];

export type NormalizePenaltyNominal = (value: number) => number;
