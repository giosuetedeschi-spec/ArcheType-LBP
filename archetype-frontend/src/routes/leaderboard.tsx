import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { statsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n/I18nContext";
import { Trophy, Loader2 } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Classifica — VirtualZ" },
      { name: "description", content: "Classifiche per genere, developer e anno." },
    ],
  }),
  component: LeaderboardPage,
});

const USER_ID = 1;

const PALETTE = [
  "var(--status-playing)",
  "var(--status-finished)",
  "var(--status-wishlist)",
  "var(--color-brand)",
  "var(--color-accent)",
  "var(--color-destructive)",
  "color-oklch(0.75 0.16 200)",
  "color-oklch(0.80 0.15 120)",
  "color-oklch(0.70 0.18 300)",
  "color-oklch(0.78 0.17 50)",
];

function LeaderboardPage() {
  const { t } = useI18n();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats", USER_ID],
    queryFn: () => statsApi.get(USER_ID),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </AppLayout>
    );
  }

  const byGenre = Object.entries(stats?.gamesByGenre ?? {}).sort((a, b) => b[1] - a[1]);
  const byDev = Object.entries(stats?.gamesByDeveloper ?? {}).sort((a, b) => b[1] - a[1]);
  const byYear = Object.entries(stats?.gamesByYear ?? {}).sort((a, b) => b[1] - a[1]);
  const maxGenre = Math.max(...byGenre.map(([, c]) => c), 1);
  const maxDev = Math.max(...byDev.map(([, c]) => c), 1);
  const maxYear = Math.max(...byYear.map(([, c]) => c), 1);

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-3">
        <Trophy className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold sm:text-3xl">{t("leaderboard.title") || "Classifiche"}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RankSection
          title={t("leaderboard.byGenre") || "Per Genre"}
          data={byGenre}
          max={maxGenre}
          palette={PALETTE}
        />
        <RankSection
          title={t("leaderboard.byDeveloper") || "Per Developer"}
          data={byDev}
          max={maxDev}
          palette={PALETTE.slice(2)}
        />
        <RankSection
          title={t("leaderboard.byYear") || "Per Anno"}
          data={byYear}
          max={maxYear}
          palette={PALETTE.slice(4)}
        />
      </div>
    </AppLayout>
  );
}

function RankSection({
  title,
  data,
  max,
  palette,
}: {
  title: string;
  data: [string, number][];
  max: number;
  palette: string[];
}) {
  return (
    <div className="card-surface p-5">
      <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun dato.</p>
      ) : (
        <ol className="space-y-2">
          {data.slice(0, 8).map(([key, count], i) => (
            <li key={key} className="flex items-center gap-3">
              <span className="w-5 text-right text-sm font-bold text-muted-foreground">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{key}</span>
                  <span className="font-bold text-foreground">{count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / max) * 100}%`,
                      background: palette[i % palette.length],
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
