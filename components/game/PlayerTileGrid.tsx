"use client";

import { useMemo, useState } from "react";
import { createDeltaEvent } from "../../services/shot-event-service";
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

export function PlayerTileGrid({ players, coloredBalls, stats, addShotEvent }: PlayerTileGridProps) {
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
          const penaltyTotal = playerStats?.penaltyTotal ?? 0;

          return (
            <button
              key={player.id}
              type="button"
              onClick={(e) => openPopup(player.id, player.name, e.currentTarget)}
              className="h-full min-h-[180px] w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left transition duration-200 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)]"
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="truncate text-base font-semibold text-zinc-100">{player.name}</div>
                  <div className="mt-1 text-sm text-zinc-400">Фора: {player.handicap}</div>

                  <div className="mt-3 text-sm text-zinc-300">
                    Нетто: <span className="font-semibold text-zinc-100">{formatSigned(penaltyTotal)}</span>
                  </div>

                  <div className="mt-2 text-sm text-zinc-300">
                    Штрафы: <span className="font-semibold text-zinc-100">{formatSigned(penaltyTotal)}</span>
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
      />
    </>
  );
}
