import { useTranslation } from "react-i18next";

interface GenreBarChartProps {
  /** Conteggio giochi per genere (UserStats.gamesByGenre dal backend). */
  data: Record<string, number>;
}

const MAX_BARS = 6;

/**
 * Classifica per grandezza (quanti giochi per genere), non identità: una
 * sola tonalità (vz-lime), niente arcobaleno di colori per genere — la
 * lunghezza della barra porta già il valore. Generi oltre i primi 6
 * confluiscono in "Altro" invece di allungare il grafico all'infinito.
 */
export default function GenreBarChart({ data }: GenreBarChartProps) {
  const { t } = useTranslation();

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, MAX_BARS);
  const restTotal = entries.slice(MAX_BARS).reduce((sum, [, count]) => sum + count, 0);
  const rows = restTotal > 0 ? [...top, [t("profile.otherGenres"), restTotal] as const] : top;

  if (rows.length === 0) return null;

  const maxValue = Math.max(...rows.map(([, count]) => count));

  return (
    <div className="bg-vz-charcoal rounded-xl border border-zinc-800 p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">{t("profile.gamesByGenre")}</h3>
      <div className="space-y-2.5">
        {rows.map(([genre, count]) => (
          <div key={genre} className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 w-24 shrink-0 truncate" title={genre}>
              {genre}
            </span>
            <div className="flex-1 h-5 bg-zinc-800/60 rounded-r">
              <div
                className="h-5 bg-vz-lime rounded-r-[4px]"
                style={{ width: `${(count / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-xs text-zinc-300 w-6 text-right shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
