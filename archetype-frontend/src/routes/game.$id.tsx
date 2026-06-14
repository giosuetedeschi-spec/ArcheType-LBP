import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { GAMES, type GameStatus } from "@/lib/games-data";
import { useLibrary } from "@/lib/library-store";
import { STATUS_LABELS } from "@/components/StatusBadge";
import { Star, Monitor, Apple, Terminal, ArrowLeft, Trash2 } from "lucide-react";

export const Route = createFileRoute("/game/$id")({
  component: GamePage,
  notFoundComponent: () => (
    <AppLayout>
      <p className="text-center text-muted-foreground">Gioco non trovato.</p>
    </AppLayout>
  ),
  loader: ({ params }) => {
    const game = GAMES.find((g) => g.id === Number(params.id));
    if (!game) throw notFound();
    return { game };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `${loaderData.game.name} — SteamStats` }, { name: "description", content: loaderData.game.shortDescription }]
      : [{ title: "Gioco" }],
  }),
});

const STATUS_OPTIONS: GameStatus[] = ["wishlist", "playing", "finished", "abandoned"];

function GamePage() {
  const { game } = Route.useLoaderData();
  const entry = useLibrary((s) => s.entries[game.id]);
  const setStatus = useLibrary((s) => s.setStatus);
  const setHours = useLibrary((s) => s.setHours);

  return (
    <AppLayout>
      <Link to="/catalog" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Torna al catalogo
      </Link>

      <div className="card-surface overflow-hidden">
        <div className="relative h-56 sm:h-72" style={{ backgroundImage: game.cover }}>
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        </div>
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {game.genres.map((g: string) => (
                <span key={g} className="rounded bg-surface-2 px-2 py-0.5">{g}</span>
              ))}
              <span>· {game.releaseYear} · {game.developer}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{game.name}</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">{game.shortDescription}</p>

            <div className="mt-6 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-accent text-accent" />
                <span className="font-display text-2xl font-bold">{game.rating}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <div className="flex gap-2 text-muted-foreground">
                {game.platforms.includes("windows") && <Monitor className="h-5 w-5" />}
                {game.platforms.includes("mac") && <Apple className="h-5 w-5" />}
                {game.platforms.includes("linux") && <Terminal className="h-5 w-5" />}
              </div>
              <div className="text-xl font-bold text-brand">
                {game.price === 0 ? "Free to play" : `${game.price.toFixed(2)} €`}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {game.tags.map((t: string) => (
                <span key={t} className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs">{t}</span>
              ))}
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
