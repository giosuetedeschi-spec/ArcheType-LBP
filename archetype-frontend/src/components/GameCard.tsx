import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Game } from "@/lib/api";
import { useLibrary } from "@/lib/library-store";
import { StatusBadge } from "./StatusBadge";

export function GameCard({ game }: { game: Game }) {
  const entries = useLibrary((s) => s.entries);
  const entry = entries[game.id];

  const coverStyle = game.headerImageUrl
    ? { backgroundImage: `url(${game.headerImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)" };

  return (
    <Link
      to="/game/$id"
      params={{ id: String(game.id) }}
      className="group card-surface flex flex-col overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]"
    >
      <div className="relative aspect-[3/2] w-full" style={coverStyle}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
          <h3 className="font-display text-base font-bold leading-tight text-white drop-shadow">
            {game.name}
          </h3>
          {entry && <StatusBadge status={entry.status} />}
        </div>
        {game.rating != null && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {game.rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {game.genres && (
          <div className="flex flex-wrap gap-1">
            {game.genres.split(",").slice(0, 2).map((g) => (
              <span key={g} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
                {g.trim()}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          {game.developer && (
            <span className="text-xs text-muted-foreground truncate max-w-[60%]">{game.developer}</span>
          )}
          <div className="text-sm font-bold text-brand">
            {game.price == null || game.price === 0 ? "Free" : `${game.price.toFixed(2)} €`}
          </div>
        </div>
      </div>
    </Link>
  );
}
