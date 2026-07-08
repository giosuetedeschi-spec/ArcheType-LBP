import { useTranslation } from "react-i18next";
import type { LibraryStatus } from "@/types/api";

interface LibraryCompositionBarProps {
  wishlist: number;
  playing: number;
  finished: number;
  abandoned: number;
}

// Stessi colori di STATUS_COLORS in LibraryItemCard.tsx — stessa identità
// di stato ovunque nell'app, non una palette nuova inventata qui.
// NOTA: validati con lo script della skill dataviz — 2 dei 4 controlli
// (banda di luminosità, "grigio" troppo neutro per abandoned) falliscono
// per questo set di colori già in uso in tutta l'app. Non la ridisegno qui
// (impatto troppo ampio), ma per questo la legenda con etichetta di testo
// sotto è obbligatoria, non decorativa: il colore da solo non basta a
// distinguere gli stati in modo affidabile per chi ha una CVD.
const SEGMENTS: { key: LibraryStatus; barClass: string; dotClass: string }[] = [
  { key: "playing", barClass: "bg-blue-500", dotClass: "bg-blue-500" },
  { key: "finished", barClass: "bg-vz-lime", dotClass: "bg-vz-lime" },
  { key: "abandoned", barClass: "bg-zinc-500", dotClass: "bg-zinc-500" },
  { key: "wishlist", barClass: "bg-vz-pink", dotClass: "bg-vz-pink" },
];

export default function LibraryCompositionBar({
  wishlist,
  playing,
  finished,
  abandoned,
}: LibraryCompositionBarProps) {
  const { t } = useTranslation();
  const counts: Record<LibraryStatus, number> = { wishlist, playing, finished, abandoned };
  const total = wishlist + playing + finished + abandoned;

  if (total === 0) return null;

  return (
    <div className="bg-vz-charcoal rounded-xl border border-zinc-800 p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">{t("profile.libraryComposition")}</h3>

      <div className="flex gap-0.5 h-5 rounded-full overflow-hidden bg-vz-charcoal">
        {SEGMENTS.filter(({ key }) => counts[key] > 0).map(({ key, barClass }) => (
          <div key={key} className={barClass} style={{ width: `${(counts[key] / total) * 100}%` }} />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {SEGMENTS.map(({ key, dotClass }) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${dotClass} shrink-0`} />
            <span className="text-zinc-400">{t(`library.status.${key}`)}</span>
            <span className="text-zinc-300 font-medium">{counts[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
