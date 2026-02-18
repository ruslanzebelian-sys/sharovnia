"use client";

import { useMemo, useState } from "react";

type GameConfig = {
  players: string[];
  ballPrice: number;
  createdAt: number;
};

type PlayerRowProps = {
  index: number;
  value: string;
  canRemove: boolean;
  onChange: (index: number, nextValue: string) => void;
  onRemove: (index: number) => void;
};

function PlayerRow({ index, value, canRemove, onChange, onRemove }: PlayerRowProps) {
  const inputId = `player-${index}`;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <label htmlFor={inputId} className="mb-1 block text-sm text-zinc-300">
          Игрок {index + 1}
        </label>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(index, e.target.value)}
          placeholder={`Введите имя игрока ${index + 1}`}
          className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-zinc-100 placeholder:text-zinc-500 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
        />
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        aria-label={`Удалить игрока ${index + 1}`}
        className="mt-6 h-12 shrink-0 rounded-xl border border-zinc-700 bg-zinc-800 px-4 text-sm font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Удалить
      </button>
    </div>
  );
}

export default function StartPage() {
  const [players, setPlayers] = useState<string[]>([""]);
  const [ballPrice, setBallPrice] = useState<number>(100);

  const normalizedPlayers = useMemo(
    () => players.map((name) => name.trim()).filter((name) => name.length > 0),
    [players]
  );

  const isValid = normalizedPlayers.length >= 2;

  const updatePlayer = (index: number, nextValue: string) => {
    setPlayers((prev) => prev.map((name, i) => (i === index ? nextValue : name)));
  };

  const addPlayer = () => {
    setPlayers((prev) => [...prev, ""]);
  };

  const removePlayer = (index: number) => {
    setPlayers((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const createTable = () => {
    if (!isValid) return;

    const config: GameConfig = {
      players: normalizedPlayers,
      ballPrice: Number.isFinite(ballPrice) ? ballPrice : 100,
      createdAt: Date.now(),
    };

    console.log(config);
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
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
                  key={index}
                  index={index}
                  value={player}
                  canRemove={players.length > 1}
                  onChange={updatePlayer}
                  onRemove={removePlayer}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addPlayer}
              className="mt-4 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-700 active:scale-[0.99]"
            >
              Добавить игрока
            </button>
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
                value={ballPrice}
                onChange={(e) => setBallPrice(e.target.valueAsNumber)}
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-zinc-100 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
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
