"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createColoredBall,
  getRandomDefaultColor,
  normalizeColor,
  normalizeColoredBalls,
  validateColoredBall,
} from "../services/colored-ball-service";
import { createGameFromConfig } from "../services/game-engine-service";
import {
  MAX_PLAYERS_PER_GAME,
  clampPlayers,
  validatePlayerCount,
} from "../services/game-rules-service";
import { normalizeHandicap, validateHandicap } from "../services/handicap-service";
import { useGameStore } from "../store/game-store";
import type { GameConfig, Player } from "../types/game";

type ColoredBallDraft = {
  id: string;
  label: string;
  nominal: number;
  color: string;
};

type PlayerDraft = {
  id: string;
  name: string;
  handicap: number;
};

type PlayerRowProps = {
  index: number;
  player: PlayerDraft;
  canRemove: boolean;
  onNameChange: (id: string, nextValue: string) => void;
  onHandicapChange: (id: string, nextValue: number) => void;
  onEnter: (id: string) => void;
  onRemove: (id: string) => void;
};

function PlayerRow({ index, player, canRemove, onNameChange, onHandicapChange, onEnter, onRemove }: PlayerRowProps) {
  const nameInputId = `player-name-${player.id}`;
  const handicapInputId = `player-handicap-${player.id}`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
        <div>
          <label htmlFor={nameInputId} className="mb-1 block text-sm text-zinc-300">
            Игрок {index + 1}
          </label>
          <input
            id={nameInputId}
            type="text"
            value={player.name}
            onChange={(e) => onNameChange(player.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onEnter(player.id);
              }
            }}
            placeholder={`Введите имя игрока ${index + 1}`}
            className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-zinc-100 placeholder:text-zinc-500 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>

        <div>
          <label htmlFor={handicapInputId} className="mb-1 block text-sm text-zinc-300">
            Фора (шары)
          </label>
          <input
            id={handicapInputId}
            type="number"
            min={0}
            max={50}
            step={1}
            inputMode="numeric"
            value={Number.isFinite(player.handicap) ? player.handicap : 0}
            onChange={(e) => onHandicapChange(player.id, e.target.valueAsNumber)}
            className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-zinc-100 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>

        <button
          type="button"
          onClick={() => onRemove(player.id)}
          disabled={!canRemove}
          aria-label={`Удалить игрока ${index + 1}`}
          className="h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

type ColoredBallRowProps = {
  index: number;
  ball: ColoredBallDraft;
  onLabelChange: (id: string, label: string) => void;
  onNominalChange: (id: string, nominal: number) => void;
  onColorChange: (id: string, color: string) => void;
  onRemove: (id: string) => void;
};

function ColoredBallRow({
  index,
  ball,
  onLabelChange,
  onNominalChange,
  onColorChange,
  onRemove,
}: ColoredBallRowProps) {
  const labelId = `colored-label-${ball.id}`;
  const nominalId = `colored-nominal-${ball.id}`;
  const colorId = `colored-color-${ball.id}`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-3 text-sm text-zinc-400">Шар {index + 1}</div>
      <div className="grid gap-3 sm:grid-cols-[1fr_160px_120px_auto] sm:items-end">
        <div>
          <label htmlFor={labelId} className="mb-1 block text-sm text-zinc-300">
            Название
          </label>
          <input
            id={labelId}
            type="text"
            value={ball.label}
            onChange={(e) => onLabelChange(ball.id, e.target.value)}
            placeholder="Например: Красный"
            className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-zinc-100 placeholder:text-zinc-500 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>

        <div>
          <label htmlFor={nominalId} className="mb-1 block text-sm text-zinc-300">
            Номинал
          </label>
          <input
            id={nominalId}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={Number.isFinite(ball.nominal) ? ball.nominal : ""}
            onChange={(e) => onNominalChange(ball.id, e.target.valueAsNumber)}
            className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-zinc-100 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>

        <div>
          <label htmlFor={colorId} className="mb-1 block text-sm text-zinc-300">
            Цвет
          </label>
          <input
            id={colorId}
            type="color"
            value={ball.color}
            onChange={(e) => onColorChange(ball.id, e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 p-2 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>

        <button
          type="button"
          onClick={() => onRemove(ball.id)}
          aria-label={`Удалить цветной шар ${index + 1}`}
          className="h-12 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 active:scale-[0.98]"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

function createColoredBallDraft(): ColoredBallDraft {
  const hasUuid = typeof crypto !== "undefined" && "randomUUID" in crypto;
  const id = hasUuid ? crypto.randomUUID() : `cb-${Date.now()}-${Math.random()}`;

  return {
    id,
    label: "",
    nominal: 1,
    color: getRandomDefaultColor(),
  };
}

function createPlayerDraft(): PlayerDraft {
  const hasUuid = typeof crypto !== "undefined" && "randomUUID" in crypto;
  const id = hasUuid ? crypto.randomUUID() : `pl-${Date.now()}-${Math.random()}`;

  return {
    id,
    name: "",
    handicap: 0,
  };
}

export default function StartPage() {
  const router = useRouter();
  const setActiveGame = useGameStore((state) => state.setActiveGame);
  const [players, setPlayers] = useState<PlayerDraft[]>([createPlayerDraft()]);
  const [ballPrice, setBallPrice] = useState<number>(100);
  const [coloredModeEnabled, setColoredModeEnabled] = useState<boolean>(false);
  const [coloredBallDrafts, setColoredBallDrafts] = useState<ColoredBallDraft[]>([]);

  const normalizedPlayers = useMemo(() => {
    const result: Player[] = [];

    for (const player of players) {
      const name = player.name.trim();
      if (name.length === 0) {
        continue;
      }

      const handicap = normalizeHandicap(player.handicap);
      if (!validateHandicap(handicap)) {
        continue;
      }

      result.push({
        id: player.id,
        name,
        handicap,
      });
    }

    return result;
  }, [players]);

  const validColoredBallCount = useMemo(() => {
    return coloredBallDrafts.reduce((acc, draft) => {
      const candidate = createColoredBall(draft.label, draft.nominal, draft.color);
      return validateColoredBall(candidate) ? acc + 1 : acc;
    }, 0);
  }, [coloredBallDrafts]);

  const normalizedColoredBalls = useMemo(() => {
    const source = coloredBallDrafts.map((draft) => createColoredBall(draft.label, draft.nominal, draft.color));
    return normalizeColoredBalls(source);
  }, [coloredBallDrafts]);

  const duplicateColoredBallCount = Math.max(validColoredBallCount - normalizedColoredBalls.length, 0);
  const isValid = normalizedPlayers.length >= 2;
  const canAddPlayer = validatePlayerCount(players.length + 1);
  const canAddColoredBall = coloredBallDrafts.length < 10;

  const updatePlayerName = (id: string, nextValue: string) => {
    setPlayers((prev) => prev.map((player) => (player.id === id ? { ...player, name: nextValue } : player)));
  };

  const updatePlayerHandicap = (id: string, nextValue: number) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, handicap: normalizeHandicap(nextValue) } : player
      )
    );
  };

  const addPlayer = () => {
    if (!canAddPlayer) return;
    setPlayers((prev) => [...prev, createPlayerDraft()]);
  };

  const addPlayerOnEnter = (id: string) => {
    const currentPlayer = players.find((player) => player.id === id);
    if (!currentPlayer || currentPlayer.name.trim().length === 0 || !canAddPlayer) return;
    addPlayer();
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((player) => player.id !== id);
    });
  };

  const addColoredBall = () => {
    if (!canAddColoredBall) return;
    setColoredBallDrafts((prev) => [...prev, createColoredBallDraft()]);
  };

  const updateColoredBallLabel = (id: string, label: string) => {
    setColoredBallDrafts((prev) => prev.map((ball) => (ball.id === id ? { ...ball, label } : ball)));
  };

  const updateColoredBallNominal = (id: string, nominal: number) => {
    setColoredBallDrafts((prev) => prev.map((ball) => (ball.id === id ? { ...ball, nominal } : ball)));
  };

  const updateColoredBallColor = (id: string, color: string) => {
    setColoredBallDrafts((prev) =>
      prev.map((ball) => (ball.id === id ? { ...ball, color: normalizeColor(color) } : ball))
    );
  };

  const removeColoredBall = (id: string) => {
    setColoredBallDrafts((prev) => prev.filter((ball) => ball.id !== id));
  };

  const createTable = () => {
    if (!isValid) return;

    const clampedPlayers = clampPlayers(normalizedPlayers);
    const config: GameConfig = {
      players: clampedPlayers,
      ballPrice: Number.isFinite(ballPrice) ? ballPrice : 100,
      createdAt: Date.now(),
      coloredModeEnabled,
      coloredBalls: coloredModeEnabled ? normalizedColoredBalls : undefined,
    };

    const game = createGameFromConfig(config);
    setActiveGame(game);
    router.push("/game");
  };

  return (
    <main className="min-h-screen px-4 py-8 text-zinc-100">
      <div className="mx-auto w-full max-w-[700px]">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">🎱 Колхоз — Настройка стола</h1>
          <p className="mt-2 text-zinc-400">Создайте стол и добавьте игроков для новой игры</p>
        </header>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">Игроки</h2>
            <div className="mt-4 space-y-4">
              {players.map((player, index) => (
                <PlayerRow
                  key={player.id}
                  index={index}
                  player={player}
                  canRemove={players.length > 1}
                  onNameChange={updatePlayerName}
                  onHandicapChange={updatePlayerHandicap}
                  onEnter={addPlayerOnEnter}
                  onRemove={removePlayer}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addPlayer}
              disabled={!canAddPlayer}
              className="mt-4 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Добавить игрока
            </button>
            {!canAddPlayer && (
              <p className="mt-2 text-sm text-amber-400">Максимум {MAX_PLAYERS_PER_GAME} игроков за столом</p>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold">Настройки</h2>
            <div className="mt-3">
              <label htmlFor="ball-price" className="mb-1 block text-sm text-zinc-300">
                Цена шара
              </label>
              <input
                id="ball-price"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={Number.isFinite(ballPrice) ? ballPrice : ""}
                onChange={(e) => setBallPrice(e.target.valueAsNumber)}
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-zinc-100 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold">Цветные шары</h2>

            <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
              <span className="text-sm text-zinc-200">Включить цветные шары</span>
              <input
                type="checkbox"
                checked={coloredModeEnabled}
                onChange={(e) => setColoredModeEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-zinc-600 bg-zinc-900 text-cyan-500 focus:ring-cyan-400"
              />
            </label>

            {coloredModeEnabled && (
              <div className="mt-4 space-y-3">
                {coloredBallDrafts.length === 0 && (
                  <p className="text-sm text-zinc-400">Добавьте цветные шары и задайте их номинал.</p>
                )}

                {coloredBallDrafts.map((ball, index) => (
                  <ColoredBallRow
                    key={ball.id}
                    index={index}
                    ball={ball}
                    onLabelChange={updateColoredBallLabel}
                    onNominalChange={updateColoredBallNominal}
                    onColorChange={updateColoredBallColor}
                    onRemove={removeColoredBall}
                  />
                ))}

                <button
                  type="button"
                  onClick={addColoredBall}
                  disabled={!canAddColoredBall}
                  className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Добавить цветной шар
                </button>

                {!canAddColoredBall && <p className="text-sm text-amber-400">Максимум 10 цветных шаров.</p>}

                {validColoredBallCount < coloredBallDrafts.length && (
                  <p className="text-sm text-amber-400">
                    У каждого цветного шара должны быть непустое название и номинал больше 0.
                  </p>
                )}

                {duplicateColoredBallCount > 0 && (
                  <p className="text-sm text-zinc-400">
                    Дубликаты по названию будут удалены автоматически ({duplicateColoredBallCount}).
                  </p>
                )}
              </div>
            )}
          </div>

          {!isValid && <p className="mt-5 text-sm text-amber-400">Добавьте минимум 2 непустых имени игроков.</p>}

          <button
            type="button"
            onClick={createTable}
            disabled={!isValid}
            className="mt-6 h-14 w-full rounded-xl bg-cyan-500 px-5 text-base font-bold text-zinc-950 transition duration-200 hover:bg-cyan-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            Создать стол
          </button>
        </section>
      </div>
    </main>
  );
}
