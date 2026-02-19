"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateNetScores,
  MIN_TOTAL_BALLS,
  validateSettlementInput,
  validateTotalBalls,
} from "../../services/game-settlement-service";
import type { Player } from "../../types/game";

type SettlementModalProps = {
  isOpen: boolean;
  players: Player[];
  playerOrder: string[];
  penalties: Record<string, number>;
  initialInput: Record<string, number>;
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

export function SettlementModal({
  isOpen,
  players,
  playerOrder,
  penalties,
  initialInput,
  onConfirm,
  onCancel,
}: SettlementModalProps) {
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

  const numericInputMap = useMemo(() => {
    const next: Record<string, number> = {};

    for (const playerId of playerOrder) {
      const value = inputs[playerId] ?? "0";
      next[playerId] = Number(value.length ? value : 0);
    }

    return next;
  }, [inputs, playerOrder]);

  const normalizedInput = useMemo(() => {
    return validateSettlementInput(players, numericInputMap).normalized;
  }, [numericInputMap, players]);

  const totalBallsValidation = useMemo(() => {
    return validateTotalBalls(normalizedInput);
  }, [normalizedInput]);

  const netScorePreview = useMemo(() => {
    return calculateNetScores(playerOrder, normalizedInput, penalties);
  }, [playerOrder, normalizedInput, penalties]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const initialInputs: Record<string, string> = {};
    for (const playerId of playerOrder) {
      const value = initialInput[playerId];
      const normalized = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
      initialInputs[playerId] = String(normalized);
    }
    setInputs(initialInputs);
  }, [initialInput, isOpen, playerOrder]);

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

        {!totalBallsValidation.isValid && (
          <div className="mt-4 rounded-lg border border-yellow-600 bg-yellow-900/40 px-4 py-2 text-sm text-yellow-300">
            {`Внесено ${totalBallsValidation.total} шаров. Минимум ${MIN_TOTAL_BALLS}.`}
          </div>
        )}

        <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs text-zinc-300">
          <div className="mb-2 font-semibold text-zinc-200">Предпросмотр общего счёта</div>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {playerOrder.map((playerId) => {
              const player = playerById.get(playerId);
              const value = netScorePreview.netScores[playerId] ?? 0;
              const signed = value > 0 ? `+${value}` : `${value}`;

              return (
                <div key={`preview-${playerId}`} className="flex items-center justify-between">
                  <span>{player?.name ?? playerId}</span>
                  <span>{signed}</span>
                </div>
              );
            })}
          </div>
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
            onClick={() => onConfirm(numericInputMap)}
            className="h-10 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-zinc-950 transition duration-200 hover:bg-cyan-400"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}
