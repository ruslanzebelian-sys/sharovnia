"use client";

import { useMemo, useState } from "react";
import { createDeltaEvent, createPenaltyEvent } from "../../services/shot-event-service";
import type { PenaltyImbalance } from "../../services/session-penalty-service";
import type { PlayerStats } from "../../services/stats-service";
import type { ColoredBall, Player, ShotEvent } from "../../types/game";
import { PlayerActionPopup } from "./PlayerActionPopup";

type PopupPosition = {
  top: number;
  left: number;
};

type ActivePopupPlayer = {
  id: string;
  name: string;
};

type PlayerTileGridProps = {
  players: Player[];
  coloredBalls: ColoredBall[];
  penaltyNominal: number;
  penalties: Record<string, number>;
  cumulativeScore: Record<string, number>;
  penaltyImbalance: PenaltyImbalance;
  interactionsDisabled?: boolean;
  stats: PlayerStats[];
  addShotEvent: (event: ShotEvent) => void;
};

function clampPopupPosition(top: number, left: number): PopupPosition {
  const popupWidth = 320;
  const maxLeft = Math.max(8, window.innerWidth - popupWidth - 8);
  const clampedLeft = Math.min(Math.max(8, left), maxLeft);
  const maxTop = Math.max(8, window.innerHeight - 24);
  const clampedTop = Math.min(Math.max(8, top), maxTop);

  return { top: clampedTop, left: clampedLeft };
}

function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return "0";
}

export function PlayerTileGrid({
  players,
  coloredBalls,
  penaltyNominal,
  penalties,
  cumulativeScore,
  penaltyImbalance,
  interactionsDisabled = false,
  stats,
  addShotEvent,
}: PlayerTileGridProps) {
  const [activePopupPlayer, setActivePopupPlayer] = useState<ActivePopupPlayer | null>(null);
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);

  const statsByPlayerId = useMemo(() => {
    return new Map(stats.map((item) => [item.playerId, item]));
  }, [stats]);

  const openPopup = (playerId: string, playerName: string, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const actionRows = coloredBalls.length + 1; // base row (+1/-1) + one row per colored ball (+/-)
    const estimatedPopupHeight = 84 + actionRows * 44;
    const popupWidth = 320;
    const centeredLeft = rect.left + rect.width / 2 - popupWidth / 2;
    const minAnchorTop = estimatedPopupHeight + 8;
    const anchorTop = Math.max(minAnchorTop, rect.top - 8);
    const position = clampPopupPosition(anchorTop, centeredLeft);

    setActivePopupPlayer({ id: playerId, name: playerName });
    setPopupPosition(position);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {players.map((player) => {
          const playerStats = statsByPlayerId.get(player.id);
          const penaltyTotal = penalties[player.id] ?? 0;
          const netScore = cumulativeScore[player.id] ?? 0;
          const hasPenaltyHighlight = !penaltyImbalance.isBalanced && penaltyTotal !== 0;

          return (
            <button
              key={player.id}
              type="button"
              onClick={(e) => openPopup(player.id, player.name, e.currentTarget)}
              disabled={interactionsDisabled}
              className={`h-full min-h-[180px] w-full rounded-xl border p-4 text-left transition duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                hasPenaltyHighlight
                  ? "border-red-500 ring-1 ring-red-600 bg-red-900/10"
                  : "border-zinc-700 bg-zinc-900"
              }`}
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="truncate text-base font-semibold text-zinc-100">{player.name}</div>
                  <div className="mt-1 text-sm text-zinc-400">Фора: {player.handicap}</div>

                  <div className="mt-2 text-sm text-zinc-300">
                    Штрафы: <span className="font-semibold text-zinc-100">{formatSigned(penaltyTotal)}</span>
                  </div>

                  <div className="mt-2 text-sm text-zinc-300">
                    Общий счёт:{" "}
                    <span
                      className={`font-semibold ${
                        netScore > 0 ? "text-emerald-400" : netScore < 0 ? "text-red-400" : "text-zinc-400"
                      }`}
                    >
                      {formatSigned(netScore)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {coloredBalls.map((ball) => {
                    const count = playerStats?.coloredCounts[ball.id] ?? 0;

                    return (
                      <span key={`${player.id}-${ball.id}`} className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200">
                        <span className="inline-block h-2 w-2 rounded-full border border-zinc-600" style={{ backgroundColor: ball.color }} />
                        <span>{ball.label}</span>
                        <span className="font-semibold">{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <PlayerActionPopup
        isOpen={Boolean(activePopupPlayer && popupPosition)}
        playerName={activePopupPlayer?.name ?? ""}
        coloredBalls={coloredBalls}
        penaltyNominal={penaltyNominal}
        position={popupPosition}
        onClose={() => {
          setActivePopupPlayer(null);
          setPopupPosition(null);
        }}
        onAction={(delta, source, coloredBallId) => {
          if (!activePopupPlayer) return;
          const event = createDeltaEvent(activePopupPlayer.id, delta, source, coloredBallId);
          addShotEvent(event);
        }}
        onPenaltyAction={(isPositive) => {
          if (!activePopupPlayer) return;
          const event = createPenaltyEvent(activePopupPlayer.id, isPositive, penaltyNominal);
          addShotEvent(event);
        }}
      />
    </>
  );
}
