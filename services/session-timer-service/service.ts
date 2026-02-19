import type { MatchSeries } from "../../types/game";
import type {
  EndSessionTimer,
  FormatSessionTime,
  GetSessionElapsed,
  StartSessionTimer,
} from "./types";

export const startSessionTimer: StartSessionTimer = (series) => {
  if (series.sessionTimer.startedAt !== null) {
    return series;
  }

  return {
    ...series,
    sessionTimer: {
      startedAt: Date.now(),
      endedAt: null,
    },
  };
};

export const endSessionTimer: EndSessionTimer = (series) => {
  const { startedAt, endedAt } = series.sessionTimer;
  if (startedAt === null || endedAt !== null) {
    return series;
  }

  return {
    ...series,
    sessionTimer: {
      startedAt,
      endedAt: Date.now(),
    },
  };
};

export const getSessionElapsed: GetSessionElapsed = (series, now) => {
  const { startedAt, endedAt } = series.sessionTimer;
  if (startedAt === null) {
    return 0;
  }

  const endPoint = endedAt ?? now;
  return Math.max(0, endPoint - startedAt);
};

export const formatSessionTime: FormatSessionTime = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
