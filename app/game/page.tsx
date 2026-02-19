"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { SettlementModal } from "../../components/game/SettlementModal";
import { PlayerTileGrid } from "../../components/game/PlayerTileGrid";
import { StatsTable } from "../../components/game/StatsTable";
import { DEFAULT_PENALTY_NOMINAL, normalizePenaltyNominal } from "../../services/game-rules-service";
import { formatSessionTime, getSessionElapsed } from "../../services/session-timer-service";
import { computePlayerStats } from "../../services/stats-service";
import { useGameStore } from "../../store/game-store";

export default function GamePage() {
  const [selectedLastScorerId, setSelectedLastScorerId] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [isEndSessionDialogOpen, setIsEndSessionDialogOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  const activeGame = useGameStore((state) => state.activeGame);
  const activeSeries = useGameStore((state) => state.activeSeries);
  const shotEvents = useGameStore((state) => state.shotEvents);
  const currentNetScores = useGameStore((state) => state.currentNetScores);
  const addShotEvent = useGameStore((state) => state.addShotEvent);
  const completeSettlement = useGameStore((state) => state.completeSettlement);
  const penaltyImbalance = useGameStore((state) => state.penaltyImbalance);
  const transitionError = useGameStore((state) => state.transitionError);
  const clearTransitionError = useGameStore((state) => state.clearTransitionError);
  const randomizePlayerOrder = useGameStore((state) => state.randomizePlayerOrder);
  const startSessionTimer = useGameStore((state) => state.startSessionTimer);
  const endSessionTimer = useGameStore((state) => state.endSessionTimer);
  const startNextSeriesGame = useGameStore((state) => state.startNextSeriesGame);
  const reverseGameOrder = useGameStore((state) => state.reverseGameOrder);

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
  const penaltyNominal = normalizePenaltyNominal(activeGame?.rules?.penaltyNominal ?? DEFAULT_PENALTY_NOMINAL);
  const sessionPenaltyBalance = useMemo(() => {
    const base: Record<string, number> = {};

    for (const player of orderedPlayers) {
      base[player.id] = 0;
    }

    if (!activeSeries?.sessionPenaltyBalance) {
      return base;
    }

    for (const [playerId, value] of Object.entries(activeSeries.sessionPenaltyBalance)) {
      base[playerId] = Number.isFinite(value) ? Math.trunc(value) : 0;
    }

    return base;
  }, [activeSeries?.sessionPenaltyBalance, orderedPlayers]);

  const playerStats = useMemo(() => {
    if (!activeGame) {
      return [];
    }

    return computePlayerStats(orderedPlayers, coloredBalls, shotEvents);
  }, [activeGame, orderedPlayers, coloredBalls, shotEvents]);

  useEffect(() => {
    setSelectedLastScorerId("");
    setIsSettlementModalOpen(false);
  }, [activeGame?.id]);

  const timerStartedAt = activeSeries?.sessionTimer.startedAt ?? null;
  const timerEndedAt = activeSeries?.sessionTimer.endedAt ?? null;
  const isSessionTimerStarted = timerStartedAt !== null;
  const isSessionTimerRunning = timerStartedAt !== null && timerEndedAt === null;

  useEffect(() => {
    setNow(Date.now());

    if (!isSessionTimerRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeSeries?.id, isSessionTimerRunning]);

  const elapsedMs = activeSeries ? getSessionElapsed(activeSeries, now) : 0;
  const timerLabel = isSessionTimerStarted ? formatSessionTime(elapsedMs) : "Запустить";
  const canEndSession = isSessionTimerStarted && timerEndedAt === null;

  const isSettled = activeGame?.phase === "SETTLED";
  const isActivePhase = activeGame?.phase === "ACTIVE";

  const canReverse =
    Boolean(activeSeries) &&
    Boolean(activeGame) &&
    isSettled &&
    shotEvents.length > 0 &&
    selectedLastScorerId.length > 0;

  const openEndSessionDialog = () => {
    if (!canEndSession) {
      return;
    }

    setIsEndSessionDialogOpen(true);
  };

  const closeEndSessionDialog = () => {
    setIsEndSessionDialogOpen(false);
  };

  const confirmEndSession = () => {
    endSessionTimer();
    setIsEndSessionDialogOpen(false);
  };

  return (
    <main className="min-h-screen px-4 py-8 text-zinc-100">
      <div className="mx-auto w-full max-w-[700px]">
        <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl shadow-black/20 sm:p-6">
          <h1 className="text-3xl font-bold tracking-tight">Калькулятор игры</h1>

          {!activeGame && <p className="mt-4 text-zinc-400">Активная игра не найдена. Сначала создайте стол.</p>}

          {activeGame && (
            <div className="mt-4">
              {!penaltyImbalance.isBalanced && (
                <div className="mb-3 inline-flex items-center rounded-full border border-red-600/70 bg-red-900/30 px-3 py-1 text-xs font-semibold text-red-200">
                  {`Баланс штрафов: ${penaltyImbalance.total > 0 ? "+" : ""}${penaltyImbalance.total}`}
                </div>
              )}
              {transitionError && (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-red-600 bg-red-900/40 px-4 py-2 text-red-300">
                  <span>{transitionError}</span>
                  <button
                    type="button"
                    onClick={clearTransitionError}
                    aria-label="Закрыть ошибку"
                    className="rounded p-1 text-red-300/90 transition duration-150 hover:bg-red-800/50 hover:text-red-200"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={randomizePlayerOrder}
                  className="h-11 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 active:scale-[0.98]"
                >
                  Перемешать порядок
                </button>
                <button
                  type="button"
                  onClick={startNextSeriesGame}
                  disabled={!isSettled}
                  className="h-11 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Следующая игра
                </button>
                {isActivePhase && (
                  <button
                    type="button"
                    onClick={() => setIsSettlementModalOpen(true)}
                    className="h-11 rounded-xl border border-cyan-500/70 bg-cyan-500/15 px-4 text-sm font-semibold text-cyan-200 transition duration-200 hover:bg-cyan-500/25 active:scale-[0.98]"
                  >
                    Ввести счёт
                  </button>
                )}
              </div>

              <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
                <span>
                  Игра #{(activeGame.seriesMeta?.gameIndex ?? activeSeries?.currentIndex ?? 0) + 1}
                  {activeGame.seriesMeta?.isReverse ? " (реверс)" : ""}
                </span>
                <span className="text-zinc-500">•</span>
                <span>{isActivePhase ? "Игра активна" : "Счёт введён"}</span>
                <span className="text-zinc-500">•</span>
                <span>Время за столом</span>
                <button
                  type="button"
                  onClick={startSessionTimer}
                  disabled={isSessionTimerStarted}
                  className={`inline-flex w-[136px] justify-center rounded-lg border px-3 py-1.5 text-sm font-semibold tabular-nums transition duration-200 ${
                    isSessionTimerStarted
                      ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.16)]"
                      : "border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                  } disabled:cursor-not-allowed disabled:opacity-90`}
                >
                  {timerLabel}
                </button>
                {activeGame.seriesMeta?.isReverse && (
                  <>
                    <span className="text-zinc-500">•</span>
                    <span>Порядок изменён</span>
                  </>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-sm text-zinc-300">Кто забил последний шар?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {orderedPlayers.map((player) => {
                    const isSelected = selectedLastScorerId === player.id;

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setSelectedLastScorerId(player.id)}
                        aria-pressed={isSelected}
                        className={`h-10 rounded-lg border px-3 text-sm font-medium transition duration-200 ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-500/15 text-cyan-200"
                            : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                        }`}
                      >
                        {player.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => reverseGameOrder(selectedLastScorerId)}
                  disabled={!canReverse}
                  className="h-11 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Реверс
                </button>
              </div>

              <h2 className="mt-5 text-lg font-semibold">Игроки</h2>
              <div className="mt-3">
                <PlayerTileGrid
                  players={orderedPlayers}
                  coloredBalls={coloredBalls}
                  penaltyNominal={penaltyNominal}
                  sessionPenaltyBalance={sessionPenaltyBalance}
                  currentNetScores={currentNetScores}
                  penaltyImbalance={penaltyImbalance}
                  interactionsDisabled={!isActivePhase}
                  stats={playerStats}
                  addShotEvent={addShotEvent}
                />
              </div>

              <h2 className="mt-6 text-lg font-semibold">Статистика</h2>
              <div className="mt-3">
                <StatsTable
                  players={orderedPlayers}
                  coloredBalls={coloredBalls}
                  sessionPenaltyBalance={sessionPenaltyBalance}
                  stats={playerStats}
                />
              </div>

              <div className="mt-10 border-t border-zinc-800 pt-6">
                <button
                  type="button"
                  onClick={openEndSessionDialog}
                  disabled={!canEndSession}
                  className="h-11 rounded-xl border border-rose-500/60 bg-rose-500/10 px-4 text-sm font-semibold text-rose-200 transition duration-200 hover:bg-rose-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Завершить игру полностью
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <SettlementModal
        isOpen={isSettlementModalOpen}
        players={orderedPlayers}
        playerOrder={activeGame?.playerOrder ?? []}
        onCancel={() => setIsSettlementModalOpen(false)}
        onConfirm={(inputMap) => {
          completeSettlement(inputMap);
          setIsSettlementModalOpen(false);
        }}
      />

      <ConfirmDialog
        isOpen={isEndSessionDialogOpen}
        title="Подтверждение"
        description="Вы уверены, что хотите завершить сессию?"
        onConfirm={confirmEndSession}
        onCancel={closeEndSessionDialog}
      />
    </main>
  );
}
