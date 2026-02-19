import { create } from "zustand";
import {
  applyPenalty,
  getPenaltyImbalance,
  isPenaltyBalanced,
  resetSessionPenalties,
} from "../services/session-penalty-service";
import type { PenaltyImbalance } from "../services/session-penalty-service";
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
  transitionError: string | null;
  penaltyImbalance: PenaltyImbalance;
  setActiveGame: (game: Game) => void;
  startSeries: (game: Game) => void;
  startSessionTimer: () => void;
  endSessionTimer: () => void;
  startNextSeriesGame: () => void;
  reverseGameOrder: (lastScorerId: string) => void;
  clearTransitionError: () => void;
  clearGame: () => void;
  randomizePlayerOrder: () => void;
  addShotEvent: (event: ShotEvent) => void;
};

export const useGameStore = create<GameStoreState>((set) => ({
  activeGame: null,
  activeSeries: null,
  shotEvents: [],
  transitionError: null,
  penaltyImbalance: {
    isBalanced: true,
    total: 0,
  },
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
      transitionError: null,
      penaltyImbalance: getPenaltyImbalance(series),
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
        transitionError: null,
        penaltyImbalance: getPenaltyImbalance(nextActiveSeries),
      };
    }),
  endSessionTimer: () =>
    set((state) => {
      if (!state.activeSeries) {
        return state;
      }

      const endedSeries = endSessionTimer(state.activeSeries);
      const nextActiveSeries = resetSessionPenalties(endedSeries);
      if (nextActiveSeries === state.activeSeries) {
        return state;
      }

      return {
        activeSeries: nextActiveSeries,
        transitionError: null,
        penaltyImbalance: getPenaltyImbalance(nextActiveSeries),
      };
    }),
  startNextSeriesGame: () =>
    set((state) => {
      if (!state.activeSeries || !state.activeGame) {
        return state;
      }
      if (!isPenaltyBalanced(state.activeSeries)) {
        return {
          transitionError: "Ошибка в штрафах",
        };
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
        transitionError: null,
        penaltyImbalance: getPenaltyImbalance(nextSeries),
      };
    }),
  reverseGameOrder: (lastScorerId) =>
    set((state) => {
      if (!state.activeSeries || !state.activeGame) {
        return state;
      }
      if (!isPenaltyBalanced(state.activeSeries)) {
        return {
          transitionError: "Ошибка в штрафах",
        };
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
        transitionError: null,
        penaltyImbalance: getPenaltyImbalance(nextSeries),
      };
    }),
  clearTransitionError: () => set({ transitionError: null }),
  clearGame: () =>
    set({
      activeGame: null,
      activeSeries: null,
      shotEvents: [],
      transitionError: null,
      penaltyImbalance: {
        isBalanced: true,
        total: 0,
      },
    }),
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
        transitionError: null,
        penaltyImbalance: state.activeSeries
          ? getPenaltyImbalance(state.activeSeries)
          : {
              isBalanced: true,
              total: 0,
            },
      };
    }),
  addShotEvent: (event) =>
    set((state) => {
      const nextShotEvents = [...state.shotEvents, event];

      if (event.source !== "penalty" || !state.activeSeries) {
        return {
          shotEvents: nextShotEvents,
        };
      }

      const nextSeries = applyPenalty(state.activeSeries, event.playerId, event.delta);

      return {
        shotEvents: nextShotEvents,
        activeSeries: nextSeries,
        penaltyImbalance: getPenaltyImbalance(nextSeries),
      };
    }),
}));
