import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { GameCard } from "@/components/GameCard";
import { StatusBadge } from "@/components/StatusBadge";
import { gameApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n/I18nContext";
import { Clock, Trophy, Heart, XCircle, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ArcheType" },
      { name: "description", content: "La tua dashboard per organizzare la libreria giochi." },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useI18n();

  const { data: games, isLoading, error } = useQuery({
    queryKey: ["games"],
    queryFn: gameApi.list,
  });

  const featured = (games ?? []).slice(0, 6);
  const totalGames = games?.length ?? 0;

  return (
    <AppLayout>
      {/* Hero Banner */}
      <section className="card-surface relative mb-8 overflow-hidden p-6 sm:p-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[image:var(--gradient-brand)] opacity-20 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-brand">{t("auth.welcome")}, Player</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            {t("home.whatToPlay")}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {t("home.heroSubtitle")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/catalog" className="btn-brand inline-flex items-center gap-2 px-5 py-2.5 text-sm">
              {t("home.exploreCatalog")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/library" className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium hover:bg-surface-3">
              {t("home.openLibrary")}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("home.totalGames")} value={totalGames} icon={<Clock className="h-4 w-4" />} tone="brand" />
        <StatCard label={t("game.status.playing")} value={0} icon={<Clock className="h-4 w-4" />} tone="playing" />
        <StatCard label={t("game.status.finished")} value={0} icon={<Trophy className="h-4 w-4" />} tone="finished" />
        <StatCard label={t("game.status.wishlist")} value={0} icon={<Heart className="h-4 w-4" />} tone="wishlist" />
      </section>

      {/* Featured Games */}
      <section className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("home.featured")}</h2>
        </div>
        <Link to="/catalog" className="text-sm font-medium text-brand hover:underline">
          {t("home.seeAll")} →
        </Link>
      </section>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <span className="ml-3 text-muted-foreground">{t("common.loading")}</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {t("common.error")}
        </div>
      )}

      {!isLoading && !error && featured.length === 0 && (
        <div className="rounded-lg border border-border bg-surface-2 p-12 text-center">
          <p className="text-muted-foreground">{t("home.noGames")}</p>
          <Link to="/catalog" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
            {t("home.exploreCatalog")} →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {featured.map((g) => <GameCard key={g.id} game={g} />)}
      </div>
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "brand" | "playing" | "finished" | "wishlist";
}) {
  const colorMap: Record<typeof tone, string> = {
    brand: "var(--brand)",
    playing: "var(--status-playing)",
    finished: "var(--status-finished)",
    wishlist: "var(--status-wishlist)",
  };
  const color = colorMap[tone];

  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
