import { create } from "zustand";
import {
  calculateNetScores,
  MIN_TOTAL_BALLS,
  validateSettlementInput,
  validateTotalBalls,
} from "../services/game-settlement-service";
import { applyPenalty, getPenaltyImbalance, isPenaltyBalanced } from "../services/session-penalty-service";
import type { PenaltyImbalance } from "../services/session-penalty-service";
import { endSessionTimer, startSessionTimer } from "../services/session-timer-service";
import {
  createNextGameFromPrevious,
  createSeries,
  getNextGameOrder,
} from "../services/match-series-service";
import { getReverseOrder, shufflePlayers } from "../services/player-order-service";
import type { Game, MatchSeries, ShotEvent } from "../types/game";

function mergeScores(
  base: Record<string, number>,
  delta: Record<string, number>
): Record<string, number> {
  const next = { ...base };

  for (const [playerId, value] of Object.entries(delta)) {
    next[playerId] = (next[playerId] ?? 0) + (Number.isFinite(value) ? Math.trunc(value) : 0);
  }

  return next;
}

function getScoreTotal(scores: Record<string, number>): number {
  return Object.values(scores).reduce((acc, value) => acc + value, 0);
}

function syncSeriesGame(series: MatchSeries, game: Game): MatchSeries {
  const nextGames = [...series.games];
  nextGames[series.currentIndex] = game;

  return {
    ...series,
    games: nextGames,
  };
}

type GameStoreState = {
  activeGame: Game | null;
  activeSeries: MatchSeries | null;
  shotEvents: ShotEvent[];
  transitionError: string | null;
  settlementValidationError: string | null;
  penaltyImbalance: PenaltyImbalance;
  setActiveGame: (game: Game) => void;
  startSeries: (game: Game) => void;
  startSessionTimer: () => void;
  endSessionTimer: () => void;
  completeSettlement: (settlementData: Record<string, number>) => void;
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
  settlementValidationError: null,
  penaltyImbalance: {
    isBalanced: true,
    total: 0,
  },
  setActiveGame: (game) =>
    set({
      activeGame: game,
      shotEvents: game.shotEvents ?? [],
      transitionError: null,
      settlementValidationError: null,
      penaltyImbalance: getPenaltyImbalance(game),
    }),
  startSeries: (game) => {
    const series = createSeries({
      ...game,
      shotEvents: game.shotEvents ?? [],
    });
    const currentGame = series.games[series.currentIndex];

    set({
      activeSeries: series,
      activeGame: currentGame,
      shotEvents: currentGame.shotEvents,
      transitionError: null,
      settlementValidationError: null,
      penaltyImbalance: getPenaltyImbalance(currentGame),
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
        settlementValidationError: null,
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
        transitionError: null,
        settlementValidationError: null,
      };
    }),
  completeSettlement: (settlementData) =>
    set((state) => {
      if (!state.activeSeries || !state.activeGame) {
        return state;
      }
      if (state.activeGame.phase !== "ACTIVE" && state.activeGame.phase !== "SETTLED") {
        return state;
      }

      const validation = validateSettlementInput(state.activeGame.players, settlementData);
      if (!validation.isValid) {
        return {
          transitionError: "Ошибка ввода счёта",
        };
      }

      const totalBallsValidation = validateTotalBalls(validation.normalized);
      if (!totalBallsValidation.isValid) {
        return {
          settlementValidationError: `Недостаточно шаров. Минимум ${MIN_TOTAL_BALLS}.`,
        };
      }

      const netScoresResult = calculateNetScores(
        state.activeGame.playerOrder,
        validation.normalized,
        state.activeGame.penalties
      );
      if (!netScoresResult.isBalanced) {
        return {
          transitionError: "Сумма шаров не сходится",
        };
      }

      const settledGame: Game = {
        ...state.activeGame,
        phase: "SETTLED",
        shotEvents: [...state.shotEvents],
        settlementInput: validation.normalized,
      };

      const nextSeries = syncSeriesGame(state.activeSeries, settledGame);

      return {
        activeGame: settledGame,
        activeSeries: nextSeries,
        transitionError: null,
        settlementValidationError: null,
        penaltyImbalance: getPenaltyImbalance(settledGame),
      };
    }),
  startNextSeriesGame: () =>
    set((state) => {
      if (!state.activeSeries || !state.activeGame) {
        return state;
      }
      if (state.activeGame.phase !== "SETTLED") {
        return {
          transitionError: "Сначала введите счёт",
        };
      }
      if (state.settlementValidationError) {
        return {
          transitionError: state.settlementValidationError,
        };
      }
      if (!isPenaltyBalanced(state.activeGame)) {
        return {
          transitionError: "Ошибка в штрафах",
        };
      }

      const currentGameNetScores = calculateNetScores(
        state.activeGame.playerOrder,
        state.activeGame.settlementInput,
        state.activeGame.penalties
      );
      if (!currentGameNetScores.isBalanced) {
        return {
          transitionError: "Сумма шаров не сходится",
        };
      }

      const cumulativeScore = mergeScores(
        state.activeSeries.cumulativeScore,
        currentGameNetScores.netScores
      );
      if (getScoreTotal(cumulativeScore) !== 0) {
        return {
          transitionError: "Сумма общего счёта не сходится",
        };
      }

      const currentIndex = state.activeSeries.currentIndex;
      const committedGame: Game = {
        ...state.activeGame,
        shotEvents: [...state.shotEvents],
      };

      const committedSeries = syncSeriesGame(
        {
          ...state.activeSeries,
          cumulativeScore,
        },
        committedGame
      );
      const nextIndex = currentIndex + 1;
      const nextOrder = getNextGameOrder(committedSeries.baseOrder, nextIndex);
      const nextGame = createNextGameFromPrevious(committedGame, nextOrder, nextIndex);

      const nextSeries: MatchSeries = {
        ...committedSeries,
        games: [...committedSeries.games, nextGame],
        currentIndex: nextIndex,
      };

      return {
        activeSeries: nextSeries,
        activeGame: nextGame,
        shotEvents: [],
        transitionError: null,
        settlementValidationError: null,
        penaltyImbalance: getPenaltyImbalance(nextGame),
      };
    }),
  reverseGameOrder: (lastScorerId) =>
    set((state) => {
      if (!state.activeSeries || !state.activeGame) {
        return state;
      }
      if (state.activeGame.phase !== "SETTLED") {
        return {
          transitionError: "Сначала введите счёт",
        };
      }
      if (state.settlementValidationError) {
        return {
          transitionError: state.settlementValidationError,
        };
      }
      if (!isPenaltyBalanced(state.activeGame)) {
        return {
          transitionError: "Ошибка в штрафах",
        };
      }

      const currentGameNetScores = calculateNetScores(
        state.activeGame.playerOrder,
        state.activeGame.settlementInput,
        state.activeGame.penalties
      );
      if (!currentGameNetScores.isBalanced) {
        return {
          transitionError: "Сумма шаров не сходится",
        };
      }

      const currentIndex = state.activeSeries.currentIndex;
      const committedGame: Game = {
        ...state.activeGame,
        shotEvents: [...state.shotEvents],
      };

      const endingOrder = [...committedGame.playerOrder];
      if (!endingOrder.includes(lastScorerId)) {
        return state;
      }
      const nextOrder = getReverseOrder(endingOrder, lastScorerId);

      const cumulativeScore = mergeScores(
        state.activeSeries.cumulativeScore,
        currentGameNetScores.netScores
      );
      if (getScoreTotal(cumulativeScore) !== 0) {
        return {
          transitionError: "Сумма общего счёта не сходится",
        };
      }

      const committedSeries = syncSeriesGame(
        {
          ...state.activeSeries,
          cumulativeScore,
        },
        committedGame
      );
      const nextIndex = currentIndex + 1;
      const nextGameBase = createNextGameFromPrevious(committedGame, nextOrder, nextIndex);
      const nextGame: Game = {
        ...nextGameBase,
        seriesMeta: {
          gameIndex: nextIndex,
          isReverse: true,
        },
      };

      const nextSeries: MatchSeries = {
        ...committedSeries,
        games: [...committedSeries.games, nextGame],
        currentIndex: nextIndex,
      };

      return {
        activeSeries: nextSeries,
        activeGame: nextGame,
        shotEvents: [],
        transitionError: null,
        settlementValidationError: null,
        penaltyImbalance: getPenaltyImbalance(nextGame),
      };
    }),
  clearTransitionError: () => set({ transitionError: null, settlementValidationError: null }),
  clearGame: () =>
    set({
      activeGame: null,
      activeSeries: null,
      shotEvents: [],
      transitionError: null,
      settlementValidationError: null,
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
      const nextActiveGame: Game = {
        ...state.activeGame,
        playerOrder: nextPlayerOrder,
      };

      if (!state.activeSeries) {
        return {
          activeGame: nextActiveGame,
          transitionError: null,
          settlementValidationError: null,
          penaltyImbalance: getPenaltyImbalance(nextActiveGame),
        };
      }

      const nextSeries = syncSeriesGame(state.activeSeries, nextActiveGame);

      return {
        activeGame: nextActiveGame,
        activeSeries: nextSeries,
        transitionError: null,
        settlementValidationError: null,
        penaltyImbalance: getPenaltyImbalance(nextActiveGame),
      };
    }),
  addShotEvent: (event) =>
    set((state) => {
      if (state.activeGame?.phase !== "ACTIVE") {
        return state;
      }

      const nextShotEvents = [...state.shotEvents, event];

      if (event.source !== "penalty") {
        return {
          shotEvents: nextShotEvents,
        };
      }

      const nextActiveGame = applyPenalty(state.activeGame, event.playerId, event.delta);
      if (!state.activeSeries) {
        return {
          shotEvents: nextShotEvents,
          activeGame: nextActiveGame,
          penaltyImbalance: getPenaltyImbalance(nextActiveGame),
        };
      }

      return {
        shotEvents: nextShotEvents,
        activeGame: nextActiveGame,
        activeSeries: syncSeriesGame(state.activeSeries, nextActiveGame),
        penaltyImbalance: getPenaltyImbalance(nextActiveGame),
      };
    }),
}));
