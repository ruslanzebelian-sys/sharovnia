"use client";

import { useMemo, useState } from "react";
import { PlayerActionPopup } from "./PlayerActionPopup";
import { clampPlayers } from "../../services/game-rules-service";
import { createDeltaEvent } from "../../services/shot-event-service";
import type { ColoredBall, Player, ShotEvent } from "../../types/game";

type MetricType = "score" | "penalty" | "colored";

type MetricRow = {
  key: string;
  label: string;
  type: MetricType;
  coloredBallId?: string;
  color?: string;
  nominal?: number;
};

type GridState = Record<string, number>;

type PopupPosition = {
  top: number;
  left: number;
};

type ActivePopupPlayer = {
  id: string;
  name: string;
};

type GameInputTableProps = {
  players: Player[];
  coloredBalls: ColoredBall[];
  addShotEvent: (event: ShotEvent) => void;
};

function getCellKey(rowKey: string, playerId: string): string {
  return `${rowKey}:${playerId}`;
}

function normalizeInteger(value: number, allowNegative: boolean): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const integerValue = Math.trunc(value);
  if (allowNegative) {
    return integerValue;
  }

  return Math.max(0, integerValue);
}

function clampPopupPosition(top: number, left: number): PopupPosition {
  const popupWidth = 320;
  const maxLeft = Math.max(8, window.innerWidth - popupWidth - 8);
  const clampedLeft = Math.min(Math.max(8, left), maxLeft);
  const maxTop = Math.max(8, window.innerHeight - 24);
  const clampedTop = Math.min(Math.max(8, top), maxTop);

  return {
    top: clampedTop,
    left: clampedLeft,
  };
}

export function GameInputTable({ players, coloredBalls, addShotEvent }: GameInputTableProps) {
  const [grid, setGrid] = useState<GridState>({});
  const [activePopupPlayer, setActivePopupPlayer] = useState<ActivePopupPlayer | null>(null);
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const visiblePlayers = useMemo(() => clampPlayers(players), [players]);

  const rows = useMemo<MetricRow[]>(() => {
    const baseRows: MetricRow[] = [
      { key: "score", label: "Счёт", type: "score" },
      { key: "penalty", label: "Штрафы", type: "penalty" },
    ];

    const coloredRows = coloredBalls.map((ball) => ({
      key: `colored:${ball.id}`,
      label: ball.label,
      type: "colored" as const,
      coloredBallId: ball.id,
      color: ball.color,
      nominal: ball.nominal,
    }));

    return [...baseRows, ...coloredRows];
  }, [coloredBalls]);

  const emitEvent = (playerId: string, delta: number, source: "white" | "colored", coloredBallId?: string) => {
    const event = createDeltaEvent(playerId, delta, source, coloredBallId);
    addShotEvent(event);
  };

  const handleCellChange = (row: MetricRow, playerId: string, rawValue: number) => {
    const allowNegative = row.type === "penalty";
    const nextValue = normalizeInteger(rawValue, allowNegative);
    const cellKey = getCellKey(row.key, playerId);
    const prevValue = grid[cellKey] ?? 0;
    const delta = nextValue - prevValue;

    setGrid((prev) => ({
      ...prev,
      [cellKey]: nextValue,
    }));

    if (delta === 0) {
      return;
    }

    if (row.type === "colored") {
      const nominal = Number.isFinite(row.nominal) && row.nominal ? row.nominal : 1;
      emitEvent(playerId, delta * nominal, "colored", row.coloredBallId);
      return;
    }

    emitEvent(playerId, delta, "white");
  };

  const openPopup = (playerId: string, playerName: string, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const position = clampPopupPosition(rect.bottom + 8, rect.left);

    setActivePopupPlayer({ id: playerId, name: playerName });
    setPopupPosition(position);
  };

  return (
    <>
      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-zinc-800">
        <table className="table-fixed min-w-max border-collapse text-sm">
          <thead className="bg-zinc-900">
            <tr>
              <th className="sticky left-0 z-20 w-[140px] border-b border-zinc-800 bg-zinc-900 px-2 py-3 text-left font-semibold text-zinc-200">
                Metric
              </th>
              {visiblePlayers.map((player) => (
                <th key={player.id} className="w-[140px] border-b border-zinc-800 px-2 py-3 text-left font-semibold text-zinc-200">
                  <button
                    type="button"
                    onClick={(e) => openPopup(player.id, player.name, e.currentTarget)}
                    className="w-full rounded-md px-1 py-0.5 text-left transition duration-150 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <div className="max-w-[124px] truncate whitespace-nowrap">{player.name}</div>
                    <div className="mt-1 max-w-[124px] truncate whitespace-nowrap text-xs font-normal text-zinc-400">
                      Фора: {player.handicap}
                    </div>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="bg-zinc-950/60">
                <td className="sticky left-0 z-10 w-[140px] border-b border-zinc-800 bg-zinc-900 px-2 py-3 text-zinc-200">
                  {row.type === "colored" ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full border border-zinc-600"
                        style={{ backgroundColor: row.color }}
                      />
                      <span>{row.label}</span>
                    </span>
                  ) : (
                    row.label
                  )}
                </td>
                {visiblePlayers.map((player) => {
                  const key = getCellKey(row.key, player.id);
                  const allowNegative = row.type === "penalty";
                  const value = grid[key] ?? 0;

                  return (
                    <td key={key} className="w-[140px] border-b border-zinc-800 px-2 py-3">
                      <input
                        type="number"
                        step={1}
                        min={allowNegative ? undefined : 0}
                        value={value}
                        onChange={(e) => handleCellChange(row, player.id, e.target.valueAsNumber)}
                        className="h-9 w-full min-w-[100px] rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-zinc-100 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PlayerActionPopup
        isOpen={Boolean(activePopupPlayer && popupPosition)}
        playerName={activePopupPlayer?.name ?? ""}
        coloredBalls={coloredBalls}
        position={popupPosition}
        onClose={() => {
          setActivePopupPlayer(null);
          setPopupPosition(null);
        }}
        onAction={(delta, source, coloredBallId) => {
          if (!activePopupPlayer) return;
          emitEvent(activePopupPlayer.id, delta, source, coloredBallId);
        }}
      />
    </>
  );
}
