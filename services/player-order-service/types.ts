import type { Player } from "../../types/game";

export type ShufflePlayers = (players: Player[], seed?: number) => Player[];
