import { create } from "zustand";
import { shufflePlayers } from "../services/player-order-service";
import type { Game, ShotEvent } from "../types/game";

type GameStoreState = {
  activeGame: Game | null;
  shotEvents: ShotEvent[];
  setActiveGame: (game: Game) => void;
  clearGame: () => void;
  randomizePlayerOrder: () => void;
  addShotEvent: (event: ShotEvent) => void;
};

export const useGameStore = create<GameStoreState>((set) => ({
  activeGame: null,
  shotEvents: [],
  setActiveGame: (game) => set({ activeGame: game, shotEvents: [] }),
  clearGame: () => set({ activeGame: null, shotEvents: [] }),
  randomizePlayerOrder: () =>
    set((state) => {
      if (!state.activeGame) {
        return state;
      }

      const shuffledPlayers = shufflePlayers(state.activeGame.players);

      return {
        activeGame: {
          ...state.activeGame,
          playerOrder: shuffledPlayers.map((player) => player.id),
        },
      };
    }),
  addShotEvent: (event) =>
    set((state) => ({
      shotEvents: [...state.shotEvents, event],
    })),
}));
