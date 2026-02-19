import type { MatchSeries, Game } from "../../types/game";
import { computePlayerStats } from "../stats-service";
import type {
  ComputeSeriesStats,
  CreateNextGameFromPrevious,
  CreateSeries,
  GetLastScoringPlayer,
  GetNextGameOrder,
  ReverseOrder,
  SeriesStats,
} from "./types";

function createSeriesId(game: Game): string {
  return `series-${game.id}`;
}

function createZeroScores(players: Game["players"]): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const player of players) {
    scores[player.id] = 0;
  }

  return scores;
}

export const reverseOrder: ReverseOrder = (order) => {
  return [...order].reverse();
};

export const getNextGameOrder: GetNextGameOrder = (baseOrder, gameIndex) => {
  if (gameIndex % 2 === 0) {
    return [...baseOrder];
  }

  return reverseOrder(baseOrder);
};

export const createSeries: CreateSeries = (initialGame) => {
  const preparedGame: Game = {
    ...initialGame,
    penalties: initialGame.penalties ?? {},
    settlementInput: initialGame.settlementInput ?? {},
    phase: initialGame.phase ?? "ACTIVE",
    seriesMeta: {
      gameIndex: 0,
      isReverse: false,
    },
  };

  const baseSeries: MatchSeries = {
    id: createSeriesId(initialGame),
    games: [preparedGame],
    baseOrder: [...initialGame.playerOrder],
    currentIndex: 0,
    sessionTimer: {
      startedAt: null,
      endedAt: null,
    },
    cumulativeScore: createZeroScores(preparedGame.players),
  };

  return baseSeries;
};

export const createNextGameFromPrevious: CreateNextGameFromPrevious = (prevGame, order, index) => {
  return {
    ...prevGame,
    id: `${prevGame.id}-g${index + 1}`,
    playerOrder: [...order],
    shotEvents: [],
    penalties: {},
    settlementInput: {},
    createdAt: Date.now(),
    phase: "ACTIVE",
    seriesMeta: {
      gameIndex: index,
      isReverse: index % 2 === 1,
    },
  };
};

export const getLastScoringPlayer: GetLastScoringPlayer = (events) => {
  let lastScoringPlayerId: string | null = null;

  for (const event of events) {
    if (event.delta > 0) {
      lastScoringPlayerId = event.playerId;
    }
  }

  return lastScoringPlayerId;
};

function mergeStats(
  aggregateByPlayerId: Map<string, { coloredCounts: Record<string, number>; penaltyTotal: number }>,
  stats: ReturnType<typeof computePlayerStats>
): void {
  for (const playerStats of stats) {
    if (!aggregateByPlayerId.has(playerStats.playerId)) {
      aggregateByPlayerId.set(playerStats.playerId, {
        coloredCounts: { ...playerStats.coloredCounts },
        penaltyTotal: playerStats.penaltyTotal,
      });
      continue;
    }

    const target = aggregateByPlayerId.get(playerStats.playerId);
    if (!target) continue;

    for (const [coloredBallId, count] of Object.entries(playerStats.coloredCounts)) {
      target.coloredCounts[coloredBallId] = (target.coloredCounts[coloredBallId] ?? 0) + count;
    }

    target.penaltyTotal += playerStats.penaltyTotal;
  }
}

export const computeSeriesStats: ComputeSeriesStats = (series) => {
  const perGame = series.games.map((game) => {
    const stats = computePlayerStats(game.players, game.coloredBalls ?? [], game.shotEvents ?? []);
    const gameIndex = game.seriesMeta?.gameIndex ?? 0;
    const isReverse = game.seriesMeta?.isReverse ?? false;

    return {
      gameId: game.id,
      gameIndex,
      isReverse,
      stats,
    };
  });

  const reverseGames = perGame.filter((gameStats) => gameStats.isReverse);

  const aggregateByPlayerId = new Map<string, { coloredCounts: Record<string, number>; penaltyTotal: number }>();
  for (const gameStats of perGame) {
    mergeStats(aggregateByPlayerId, gameStats.stats);
  }

  const aggregate = series.games[0]?.players.map((player) => {
    const merged = aggregateByPlayerId.get(player.id);

    return {
      playerId: player.id,
      coloredCounts: merged?.coloredCounts ?? {},
      penaltyTotal: merged?.penaltyTotal ?? 0,
    };
  }) ?? [];

  const result: SeriesStats = {
    perGame,
    reverseGames,
    aggregate,
  };

  return result;
};
