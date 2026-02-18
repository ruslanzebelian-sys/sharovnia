"use client";

import { useMemo } from "react";
import { GameInputTable } from "../../components/game/GameInputTable";
import { StatsTable } from "../../components/game/StatsTable";
import { computePlayerStats } from "../../services/stats-service";
import { useGameStore } from "../../store/game-store";

export default function GamePage() {
  const activeGame = useGameStore((state) => state.activeGame);
  const shotEvents = useGameStore((state) => state.shotEvents);
  const addShotEvent = useGameStore((state) => state.addShotEvent);
  const randomizePlayerOrder = useGameStore((state) => state.randomizePlayerOrder);

  const orderedPlayers = useMemo(() => {
    if (!activeGame) {
      return [];
    }

    const byId = new Map(activeGame.players.map((player) => [player.id, player]));

    return activeGame.playerOrder
      .map((playerId) => byId.get(playerId))
      .filter((player): player is NonNullable<typeof player> => Boolean(player));
  }, [activeGame]);

  const coloredBalls = activeGame?.coloredBalls ?? [];

  const playerStats = useMemo(() => {
    if (!activeGame) {
      return [];
    }

    return computePlayerStats(orderedPlayers, coloredBalls, shotEvents);
  }, [activeGame, orderedPlayers, coloredBalls, shotEvents]);

  return (
    <main className="min-h-screen px-4 py-8 text-zinc-100">
      <div className="mx-auto w-full max-w-[700px]">
        <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl shadow-black/20 sm:p-6">
          <h1 className="text-3xl font-bold tracking-tight">Калькулятор игры</h1>

          {!activeGame && <p className="mt-4 text-zinc-400">Активная игра не найдена. Сначала создайте стол.</p>}

          {activeGame && (
            <div className="mt-4">
              <button
                type="button"
                onClick={randomizePlayerOrder}
                className="h-11 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 active:scale-[0.98]"
              >
                Перемешать порядок
              </button>

              <h2 className="mt-5 text-lg font-semibold">Ввод</h2>
              <div className="mt-3">
                <GameInputTable players={orderedPlayers} coloredBalls={coloredBalls} addShotEvent={addShotEvent} />
              </div>

              <h2 className="mt-6 text-lg font-semibold">Статистика</h2>
              <div className="mt-3">
                <StatsTable players={orderedPlayers} coloredBalls={coloredBalls} stats={playerStats} />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
