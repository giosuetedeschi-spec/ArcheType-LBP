import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { gameApi, userGameApi } from "@/lib/api";
import { useLibrary } from "@/lib/library-store";
import { useState, useEffect } from "react";
import { GameCard } from "@/components/GameCard";
import { Clock, Trophy, Heart, XCircle, ArrowRight } from "lucide-react";
import { STATUS_LABELS } from "@/components/StatusBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SteamStats" },
      { name: "description", content: "La tua dashboard di statistiche per il backlog Steam." },
    ],
  }),
  component: Home,
});

function Home() {
  const entries = useLibrary((s) => s.entries);
  const list = Object.values(entries);
  const totalHours = list.reduce((sum, e) => sum + e.hoursPlayed, 0);
  const byStatus = {
    playing: list.filter((e) => e.status === "playing").length,
    finished: list.filter((e) => e.status === "finished").length,
    abandoned: list.filter((e) => e.status === "abandoned").length,
    wishlist: list.filter((e) => e.status === "wishlist").length,
  };
  const featured = games.slice(0, 6);

  return (
    <AppLayout>
      <section className="card-surface relative mb-8 overflow-hidden p-6 sm:p-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[image:var(--gradient-brand)] opacity-20 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-brand">Bentornato, Player_01</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">La tua collezione Steam,<br /> finalmente organizzata.</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Esplora oltre {games.length}+ giochi, organizza il backlog e tieni traccia delle tue ore di gioco.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/catalog" className="btn-brand inline-flex items-center gap-2 px-5 py-2.5 text-sm">
              Esplora il catalogo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/library" className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium hover:bg-surface-3">
              Apri la libreria
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ore totali" value={totalHours.toFixed(0)} icon={<Clock className="h-4 w-4" />} tone="brand" />
        <Stat label={STATUS_LABELS.playing} value={byStatus.playing} icon={<Clock className="h-4 w-4" />} tone="playing" />
        <Stat label={STATUS_LABELS.finished} value={byStatus.finished} icon={<Trophy className="h-4 w-4" />} tone="finished" />
        <Stat label={STATUS_LABELS.wishlist} value={byStatus.wishlist} icon={<Heart className="h-4 w-4" />} tone="wishlist" />
      </section>

      <section className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">In evidenza</h2>
          <p className="text-sm text-muted-foreground">Una selezione di giochi popolari dal catalogo</p>
        </div>
        <Link to="/catalog" className="text-sm font-medium text-brand hover:underline">
          Vedi tutto →
        </Link>
      </section>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {featured.map((g) => <GameCard key={g.id} game={g} />)}
      </div>

      {byStatus.abandoned > 0 && (
        <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <XCircle className="h-3 w-3" /> Hai {byStatus.abandoned} giochi abbandonati nella libreria.
        </p>
      )}
    </AppLayout>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: number | string; icon: React.ReactNode; tone: "brand" | "playing" | "finished" | "wishlist" }) {
  const colorVar: Record<typeof tone, string> = {
    brand: "var(--brand)",
    playing: "var(--status-playing)",
    finished: "var(--status-finished)",
    wishlist: "var(--status-wishlist)",
  };
  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span style={{ color: colorVar[tone] }}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-bold" style={{ color: colorVar[tone] }}>{value}</div>
    </div>
  );
}
