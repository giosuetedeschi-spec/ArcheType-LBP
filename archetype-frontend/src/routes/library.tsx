import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { GAMES, type GameStatus } from "@/lib/games-data";
import { useLibrary } from "@/lib/library-store";
import { GameCard } from "@/components/GameCard";
import { STATUS_LABELS } from "@/components/StatusBadge";
import { Search, Heart } from "lucide-react";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Libreria — SteamStats" },
      { name: "description", content: "Wishlist e backlog personale: in corso, finiti, abbandonati." },
    ],
  }),
  component: LibraryPage,
});

const TABS: { key: GameStatus | "all"; label: string; color: string }[] = [
  { key: "all", label: "Tutti", color: "var(--brand)" },
  { key: "wishlist", label: STATUS_LABELS.wishlist, color: "var(--status-wishlist)" },
  { key: "playing", label: STATUS_LABELS.playing, color: "var(--status-playing)" },
  { key: "finished", label: STATUS_LABELS.finished, color: "var(--status-finished)" },
  { key: "abandoned", label: STATUS_LABELS.abandoned, color: "var(--status-abandoned)" },
];

function LibraryPage() {
  const entries = useLibrary((s) => s.entries);
  const [tab, setTab] = useState<GameStatus | "all">("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const list = Object.values(entries);
    return {
      all: list.length,
      wishlist: list.filter((e) => e.status === "wishlist").length,
      playing: list.filter((e) => e.status === "playing").length,
      finished: list.filter((e) => e.status === "finished").length,
      abandoned: list.filter((e) => e.status === "abandoned").length,
    };
  }, [entries]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GAMES.filter((g) => {
      const e = entries[g.id];
      if (!e) return false;
      if (tab !== "all" && e.status !== tab) return false;
      if (q && !g.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, tab, search]);

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">La mia libreria</h1>
          <p className="text-sm text-muted-foreground">Organizza wishlist e backlog personale.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca nella libreria…"
            className="w-full rounded-md border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
      </div>

      <div className="card-surface mb-6 flex gap-1 overflow-x-auto p-1.5">
        {TABS.map((t) => {
          const active = tab === t.key;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="group flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors"
              style={{
                background: active ? t.color : "transparent",
                color: active ? "var(--background)" : "var(--muted-foreground)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: active ? "var(--background)" : t.color }}
              />
              {t.label}
              <span
                className="rounded-full px-1.5 py-0.5 text-xs"
                style={{
                  background: active ? "rgb(0 0 0 / 0.15)" : "var(--surface-2)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {results.length === 0 ? (
        <div className="card-surface grid place-items-center gap-3 p-12 text-center">
          <Heart className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            {counts.all === 0
              ? "La tua libreria è vuota. Aggiungi un gioco dal catalogo."
              : "Nessun gioco in questa sezione."}
          </p>
          <Link to="/catalog" className="btn-brand px-4 py-2 text-sm">Esplora il catalogo</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.map((g) => <GameCard key={g.id} game={g} />)}
        </div>
      )}
    </AppLayout>
  );
}
