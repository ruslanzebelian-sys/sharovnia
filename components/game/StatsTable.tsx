import type { ColoredBall, Player } from "../../types/game";
import type { PlayerStats } from "../../services/stats-service";

type StatsTableProps = {
  players: Player[];
  coloredBalls: ColoredBall[];
  penalties: Record<string, number>;
  stats: PlayerStats[];
};

function formatPenalty(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  if (value < 0) {
    return `−${Math.abs(value)}`;
  }

  return "0";
}

function getPenaltyClassName(value: number): string {
  if (value > 0) {
    return "text-red-400";
  }

  if (value < 0) {
    return "text-emerald-400";
  }

  return "text-zinc-400";
}

export function StatsTable({ players, coloredBalls, penalties, stats }: StatsTableProps) {
  const playerById = new Map(players.map((player) => [player.id, player]));

  return (
    <div className="w-full max-w-full overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-max min-w-full border-collapse text-left text-sm">
        <thead className="bg-zinc-900">
          <tr>
            <th className="min-w-[180px] border-b border-zinc-800 px-4 py-3 font-semibold text-zinc-200">Player</th>
            {coloredBalls.map((ball) => (
              <th key={ball.id} className="min-w-[110px] border-b border-zinc-800 px-4 py-3 font-semibold text-zinc-200">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full border border-zinc-600"
                    style={{ backgroundColor: ball.color }}
                  />
                  <span>{ball.label}</span>
                </span>
              </th>
            ))}
            <th className="min-w-[110px] border-b border-zinc-800 px-4 py-3 font-semibold text-zinc-200">Штрафы</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((playerStats) => {
            const player = playerById.get(playerStats.playerId);
            if (!player) return null;

            return (
              <tr key={playerStats.playerId} className="bg-zinc-950/60">
                <td className="border-b border-zinc-800 px-4 py-3 text-zinc-100">{player.name}</td>
                {coloredBalls.map((ball) => (
                  <td key={`${playerStats.playerId}-${ball.id}`} className="border-b border-zinc-800 px-4 py-3 text-zinc-200">
                    {playerStats.coloredCounts[ball.id] ?? 0}
                  </td>
                ))}
                <td
                  className={`border-b border-zinc-800 px-4 py-3 font-semibold ${getPenaltyClassName(
                    penalties[playerStats.playerId] ?? 0
                  )}`}
                >
                  {formatPenalty(penalties[playerStats.playerId] ?? 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
