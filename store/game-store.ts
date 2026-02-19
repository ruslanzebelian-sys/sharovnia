import { create } from "zustand";
import { endSessionTimer, startSessionTimer } from "../services/session-timer-service";
import {
  createNextGameFromPrevious,
  createSeries,
  getNextGameOrder,
} from "../services/match-series-service";
import { getReverseOrder, shufflePlayers } from "../services/player-order-service";
import type { Game, MatchSeries, ShotEvent } from "../types/game";

type GameStoreState = {
  activeGame: Game | null;
  activeSeries: MatchSeries | null;
  shotEvents: ShotEvent[];
  setActiveGame: (game: Game) => void;
  startSeries: (game: Game) => void;
  startSessionTimer: () => void;
  endSessionTimer: () => void;
  startNextSeriesGame: () => void;
  reverseGameOrder: (lastScorerId: string) => void;
  clearGame: () => void;
  randomizePlayerOrder: () => void;
  addShotEvent: (event: ShotEvent) => void;
};

export const useGameStore = create<GameStoreState>((set) => ({
  activeGame: null,
  activeSeries: null,
  shotEvents: [],
  setActiveGame: (game) => set({ activeGame: game, shotEvents: game.shotEvents ?? [] }),
  startSeries: (game) => {
    const series = createSeries({
      ...game,
      shotEvents: game.shotEvents ?? [],
    });

    set({
      activeSeries: series,
      activeGame: series.games[series.currentIndex],
      shotEvents: series.games[series.currentIndex].shotEvents,
    });
  },
  startSessionTimer: () =>
    set((state) => {
      if (!state.activeSeries) {
        return state;
      }

      const nextActiveSeries = startSessionTimer(state.activeSeries);
      if (nextActiveSeries === state.activeSeries) {
        return state;
      }

      return {
        activeSeries: nextActiveSeries,
      };
    }),
  endSessionTimer: () =>
    set((state) => {
      if (!state.activeSeries) {
        return state;
      }

      const nextActiveSeries = endSessionTimer(state.activeSeries);
      if (nextActiveSeries === state.activeSeries) {
        return state;
      }

      return {
        activeSeries: nextActiveSeries,
      };
    }),
  startNextSeriesGame: () =>
    set((state) => {
      if (!state.activeSeries || !state.activeGame) {
        return state;
      }

      const currentIndex = state.activeSeries.currentIndex;
      const currentGameWithEvents: Game = {
        ...state.activeGame,
        shotEvents: [...state.shotEvents],
      };

      const committedGames = [...state.activeSeries.games];
      committedGames[currentIndex] = currentGameWithEvents;

      const nextIndex = currentIndex + 1;
      const nextOrder = getNextGameOrder(state.activeSeries.baseOrder, nextIndex);
      const nextGame = createNextGameFromPrevious(currentGameWithEvents, nextOrder, nextIndex);

      const nextSeries: MatchSeries = {
        ...state.activeSeries,
        games: [...committedGames, nextGame],
        currentIndex: nextIndex,
      };

      return {
        activeSeries: nextSeries,
        activeGame: nextGame,
        shotEvents: [],
      };
    }),
  reverseGameOrder: (lastScorerId) =>
    set((state) => {
      if (!state.activeSeries || !state.activeGame) {
        return state;
      }

      const currentIndex = state.activeSeries.currentIndex;
      const currentGameWithEvents: Game = {
        ...state.activeGame,
        shotEvents: [...state.shotEvents],
      };

      const committedGames = [...state.activeSeries.games];
      committedGames[currentIndex] = currentGameWithEvents;

      const endingOrder = [...currentGameWithEvents.playerOrder];
      if (!endingOrder.includes(lastScorerId)) {
        return state;
      }
      const nextOrder = getReverseOrder(endingOrder, lastScorerId);

      const nextIndex = currentIndex + 1;
      const nextGameBase = createNextGameFromPrevious(currentGameWithEvents, nextOrder, nextIndex);
      const nextGame: Game = {
        ...nextGameBase,
        seriesMeta: {
          gameIndex: nextIndex,
          isReverse: true,
        },
      };

      const nextSeries: MatchSeries = {
        ...state.activeSeries,
        games: [...committedGames, nextGame],
        currentIndex: nextIndex,
      };

      return {
        activeSeries: nextSeries,
        activeGame: nextGame,
        shotEvents: [],
      };
    }),
  clearGame: () => set({ activeGame: null, activeSeries: null, shotEvents: [] }),
  randomizePlayerOrder: () =>
    set((state) => {
      if (!state.activeGame) {
        return state;
      }

      const shuffledPlayers = shufflePlayers(state.activeGame.players);
      const nextPlayerOrder = shuffledPlayers.map((player) => player.id);
      const nextActiveGame = {
        ...state.activeGame,
        playerOrder: nextPlayerOrder,
      };

      if (!state.activeSeries) {
        return {
          activeGame: nextActiveGame,
        };
      }

      const nextGames = [...state.activeSeries.games];
      nextGames[state.activeSeries.currentIndex] = {
        ...nextGames[state.activeSeries.currentIndex],
        playerOrder: nextPlayerOrder,
      };

      return {
        activeGame: nextActiveGame,
        activeSeries: {
          ...state.activeSeries,
          games: nextGames,
        },
      };
    }),
  addShotEvent: (event) =>
    set((state) => ({
      shotEvents: [...state.shotEvents, event],
    })),
}));
