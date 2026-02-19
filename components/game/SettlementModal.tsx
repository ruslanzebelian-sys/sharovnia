"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Player } from "../../types/game";

type SettlementModalProps = {
  isOpen: boolean;
  players: Player[];
  playerOrder: string[];
  onConfirm: (inputMap: Record<string, number>) => void;
  onCancel: () => void;
};

function normalizeInput(rawValue: string): string {
  if (rawValue.length === 0) {
    return "";
  }

  const digits = rawValue.replace(/\D+/g, "");
  if (digits.length === 0) {
    return "";
  }

  return digits.replace(/^0+(?=\d)/, "");
}

export function SettlementModal({ isOpen, players, playerOrder, onConfirm, onCancel }: SettlementModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const playerById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);

  const rows = useMemo(() => {
    return playerOrder
      .map((playerId, index) => {
        const currentPlayer = playerById.get(playerId);
        if (!currentPlayer) return null;

        const previousIndex = index === 0 ? playerOrder.length - 1 : index - 1;
        const previousPlayerId = playerOrder[previousIndex];
        const previousPlayer = playerById.get(previousPlayerId);

        return {
          playerId,
          currentPlayerName: currentPlayer.name,
          previousPlayerName: previousPlayer?.name ?? "",
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [playerById, playerOrder]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const initialInputs: Record<string, string> = {};
    for (const playerId of playerOrder) {
      initialInputs[playerId] = "0";
    }
    setInputs(initialInputs);
  }, [isOpen, playerOrder]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
          onCancel();
        }
      }}
    >
      <div ref={panelRef} className="w-full max-w-xl rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-zinc-100">Счёт шаров</h3>

        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.playerId}>
              <label className="mb-1 block text-sm text-zinc-300">
                {`Сколько шаров игрок ${row.currentPlayerName} забил игроку ${row.previousPlayerName}?`}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputs[row.playerId] ?? "0"}
                onChange={(event) => {
                  const nextValue = normalizeInput(event.target.value);
                  setInputs((prev) => ({
                    ...prev,
                    [row.playerId]: nextValue,
                  }));
                }}
                onBlur={() => {
                  setInputs((prev) => ({
                    ...prev,
                    [row.playerId]: prev[row.playerId]?.length ? prev[row.playerId] : "0",
                  }));
                }}
                className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-zinc-100 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg bg-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition duration-200 hover:bg-zinc-600"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => {
              const inputMap: Record<string, number> = {};
              for (const playerId of playerOrder) {
                const value = inputs[playerId] ?? "0";
                inputMap[playerId] = Number(value.length ? value : 0);
              }

              onConfirm(inputMap);
            }}
            className="h-10 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-zinc-950 transition duration-200 hover:bg-cyan-400"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}
