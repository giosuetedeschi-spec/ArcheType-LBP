import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import type { GameStatus } from "@/components/StatusBadge";
import { useLibrary } from "@/lib/library-store";
import { STATUS_LABELS } from "@/components/StatusBadge";
import { gameApi, type Game } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Star, ArrowLeft, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/game/$id")({
  component: GamePage,
  notFoundComponent: () => (
    <AppLayout>
      <p className="text-center text-muted-foreground">Gioco non trovato.</p>
    </AppLayout>
  ),
});

const STATUS_OPTIONS: GameStatus[] = ["wishlist", "playing", "finished", "abandoned"];

function GamePage() {
  const { id } = Route.useParams();

  const { data: game, isLoading, error } = useQuery({
    queryKey: ["game", id],
    queryFn: () => gameApi.get(Number(id)),
  });

  const entries = useLibrary((s) => s.entries);
  const setStatus = useLibrary((s) => s.setStatus);
  const setHours = useLibrary((s) => s.setHours);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </AppLayout>
    );
  }

  if (error || !game) {
    throw notFound();
  }

  const entry = entries[game.id];
  const genres = game.genres?.split(",").map((g) => g.trim()).filter(Boolean) ?? [];

  const coverStyle = game.headerImageUrl
    ? { backgroundImage: `url(${game.headerImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)" };

  return (
    <AppLayout>
      <Link to="/catalog" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Torna al catalogo
      </Link>

      <div className="card-surface overflow-hidden">
        <div className="relative h-56 sm:h-72" style={coverStyle}>
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        </div>
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {genres.map((g) => (
                <span key={g} className="rounded bg-surface-2 px-2 py-0.5">{g}</span>
              ))}
              {game.releaseDate && <span>· {game.releaseDate} · {game.developer}</span>}
            </div>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{game.name}</h1>
            {game.description && <p className="mt-4 max-w-2xl text-muted-foreground">{game.description}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-6">
              {game.rating != null && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-display text-2xl font-bold">{game.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">/ 5.0</span>
                </div>
              )}
              <div className="text-xl font-bold text-brand">
                {game.price == null || game.price === 0 ? "Free to play" : `${game.price.toFixed(2)} €`}
              </div>
            </div>
          </div>

          <aside className="card-surface h-fit p-5">
            <h3 className="mb-3 font-display text-lg font-semibold">La mia libreria</h3>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(game.id, s)}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    entry?.status === s
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-surface-2 hover:border-brand/60"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {entry && (
              <>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ore giocate
                </label>
                <input
                  type="number"
                  min={0}
                  value={entry.hoursPlayed}
                  onChange={(e) => setHours(game.id, Math.max(0, Number(e.target.value)))}
                  className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
                <button
                  onClick={() => setStatus(game.id, null)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" /> Rimuovi dalla libreria
                </button>
              </>
            )}
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
