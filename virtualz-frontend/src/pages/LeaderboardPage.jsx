import { useTranslation } from "react-i18next";

export default function LeaderboardPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold text-white mb-4">{t("nav.leaderboard")}</h1>
      <p className="text-zinc-400">Prossimamente.</p>
    </div>
  );
}
