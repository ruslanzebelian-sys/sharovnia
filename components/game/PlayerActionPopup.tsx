"use client";

import { useEffect, useRef } from "react";
import type { ColoredBall } from "../../types/game";

type PopupPosition = {
  top: number;
  left: number;
};

type PopupPlacement = "above" | "below";

type PlayerActionPopupProps = {
  isOpen: boolean;
  playerName: string;
  coloredBalls: ColoredBall[];
  position: PopupPosition | null;
  placement?: PopupPlacement;
  onClose: () => void;
  onAction: (delta: number, source: "white" | "colored", coloredBallId?: string) => void;
};

export function PlayerActionPopup({
  isOpen,
  playerName,
  coloredBalls,
  position,
  placement = "above",
  onClose,
  onAction,
}: PlayerActionPopupProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!popupRef.current) return;
      if (popupRef.current.contains(event.target as Node)) return;
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !position) {
    return null;
  }

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-[320px] max-w-[calc(100vw-16px)] rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-xl"
      style={{
        top: position.top,
        left: position.left,
        transform: placement === "above" ? "translateY(-100%)" : undefined,
      }}
    >
      <div className="mb-2 text-sm font-semibold text-zinc-100">{playerName}</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            onAction(1, "white");
            onClose();
          }}
          className="h-9 rounded-lg border border-zinc-700 bg-zinc-800 px-2 text-sm font-semibold text-zinc-100 transition duration-150 hover:bg-zinc-700"
        >
          +1 шар
        </button>
        <button
          type="button"
          onClick={() => {
            onAction(-1, "white");
            onClose();
          }}
          className="h-9 rounded-lg border border-zinc-700 bg-zinc-800 px-2 text-sm font-semibold text-zinc-100 transition duration-150 hover:bg-zinc-700"
        >
          -1 шар
        </button>

        {coloredBalls.flatMap((ball) => [
          <button
            key={`plus-${ball.id}`}
            type="button"
            onClick={() => {
              onAction(ball.nominal, "colored", ball.id);
              onClose();
            }}
            className="h-9 rounded-lg border border-zinc-700 bg-zinc-800 px-2 text-left text-xs font-semibold text-zinc-100 transition duration-150 hover:bg-zinc-700"
          >
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full border border-zinc-600"
                style={{ backgroundColor: ball.color }}
              />
              <span>{`+ ${ball.label} (${ball.nominal})`}</span>
            </span>
          </button>,
          <button
            key={`minus-${ball.id}`}
            type="button"
            onClick={() => {
              onAction(-ball.nominal, "colored", ball.id);
              onClose();
            }}
            className="h-9 rounded-lg border border-zinc-700 bg-zinc-800 px-2 text-left text-xs font-semibold text-zinc-100 transition duration-150 hover:bg-zinc-700"
          >
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full border border-zinc-600"
                style={{ backgroundColor: ball.color }}
              />
              <span>{`- ${ball.label} (${ball.nominal})`}</span>
            </span>
          </button>,
        ])}
      </div>
    </div>
  );
}
