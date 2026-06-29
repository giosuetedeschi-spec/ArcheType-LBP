import { Link } from "@tanstack/react-router";
import { Gamepad2, Heart, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { searchCatalog } from "../services/gamesApi";
import GameCard from "../components/GameCard";

export default function HomePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["games", "home"],
    queryFn: () => searchCatalog({ page: 0, size: 6 }),
  });

  const games = data?.content ?? [];
  const totalGames = data?.totalElements ?? 0;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-vz-pink/20 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-vz-lime/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-indigo-500/20 blur-[120px]" />
      </div>

      <section className="max-w-5xl mx-auto px-4 pt-20 pb-20 text-left">
        <p className="text-2xl sm:text-3xl font-display font-semibold text-white mb-3 animate-fade-in-up">
          {t("home.tagline")}
        </p>
        <p
          className="text-base sm:text-lg text-zinc-400 max-w-xl mb-10 animate-fade-in-up"
          style={{ animationDelay: "220ms" }}
        >
          {t("home.subtitle")}
        </p>
        <div
          className="flex flex-wrap items-center justify-start gap-4 animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          <Link
            to="/catalog"
            className="px-8 py-3.5 rounded-full bg-vz-lime text-vz-navy font-semibold text-lg hover:scale-105 hover:shadow-lg hover:shadow-vz-lime/25 transition-all"
          >
            {t("home.exploreCatalog")}
          </Link>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-full border border-zinc-600 text-white font-semibold text-lg hover:border-vz-pink hover:text-vz-pink transition-colors"
            >
              {t("home.getStarted")}
            </Link>
          )}
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { Icon: Gamepad2, key: "catalog" },
            { Icon: Heart, key: "library" },
            { Icon: BarChart3, key: "stats" },
          ].map(({ Icon, key }, i) => (
            <div
              key={key}
              className="bg-vz-charcoal/70 backdrop-blur border border-zinc-800 rounded-2xl p-6 hover:border-vz-lime/40 hover:-translate-y-1 transition-all animate-fade-in-up"
              style={{ animationDelay: `${380 + i * 80}ms` }}
            >
              <Icon className="h-8 w-8 mb-3 text-vz-lime" />
              <h3 className="font-display font-semibold text-lg text-white mb-2">
                {t(`home.features.${key}.title`)}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t(`home.features.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* STATISTICHE */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label={t("stats.totalGames")} value={totalGames} color="text-vz-lime" />
          <StatCard label={t("stats.inProgress")} value={0} color="text-blue-400" />
          <StatCard label={t("stats.finished")} value={0} color="text-emerald-400" />
          <StatCard label={t("stats.wishlistCount")} value={0} color="text-vz-pink" />
        </div>
      </section>

      {/* IN EVIDENZA */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display text-2xl font-bold text-white">{t("home.featured")}</h2>
          <Link to="/catalog" className="text-sm font-medium text-vz-lime hover:underline">
            {t("home.seeAll")} →
          </Link>
        </div>

        {isLoading && (
          <p className="text-zinc-400 text-center py-8">{t("common.loading")}</p>
        )}

        {!isLoading && games.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {games.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-vz-charcoal/70 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
    </div>
  );
}
