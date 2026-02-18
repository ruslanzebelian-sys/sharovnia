import type { Player } from "../../types/game";
import type { ShufflePlayers } from "./types";

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export const shufflePlayers: ShufflePlayers = (players, seed) => {
  const shuffled = [...players];
  const random = typeof seed === "number" && Number.isFinite(seed) ? createSeededRandom(seed) : Math.random;

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const temp: Player = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  return shuffled;
};
