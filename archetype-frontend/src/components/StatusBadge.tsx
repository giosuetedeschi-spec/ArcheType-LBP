import type { GameStatus } from "@/lib/games-data";

const LABELS: Record<GameStatus, string> = {
  playing: "In corso",
  finished: "Finito",
  abandoned: "Abbandonato",
  wishlist: "Wishlist",
};

const STYLES: Record<GameStatus, string> = {
  playing: "bg-[color:var(--status-playing)]/20 text-[color:var(--status-playing)] border-[color:var(--status-playing)]/40",
  finished: "bg-[color:var(--status-finished)]/20 text-[color:var(--status-finished)] border-[color:var(--status-finished)]/40",
  abandoned: "bg-[color:var(--status-abandoned)]/20 text-[color:var(--status-abandoned)] border-[color:var(--status-abandoned)]/40",
  wishlist: "bg-[color:var(--status-wishlist)]/20 text-[color:var(--status-wishlist)] border-[color:var(--status-wishlist)]/40",
};

export function StatusBadge({ status }: { status: GameStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}

export const STATUS_LABELS = LABELS;
