import { useTranslation } from "react-i18next";
import type { LibraryItem, LibraryStatus } from "@/types/api";

// Valori reali dello status, come validati dal backend (vedi
// BacklogRequest.java @Pattern) — minuscoli, non quelli che si potrebbero
// immaginare guardando solo le label visualizzate all'utente.
const STATUS_COLORS: Record<LibraryStatus, string> = {
  wishlist: "bg-vz-pink/20 text-vz-pink",
  playing: "bg-blue-500/20 text-blue-300",
  finished: "bg-vz-lime/20 text-vz-lime",
  abandoned: "bg-zinc-700/40 text-zinc-400",
};

interface LibraryItemCardProps {
  /**
   * Voce di libreria da mostrare. Usa il tipo LibraryItem reale (da
   * @/types/api, quello effettivamente restituito da getLibrary()), non
   * un'interfaccia locale: item.game è di tipo LibraryGameSummary (solo
   * id/name/headerImageUrl/developer), un sottoinsieme di Game — non il
   * tipo Game completo.
   */
  item: LibraryItem;
  onStatusChange: (itemId: number, newStatus: LibraryStatus) => void;
  onRemove: (itemId: number) => void;
}

/**
 * Mostra una voce della libreria utente (backlog).
 *
 * NOTA rimossa durante la migrazione TSX: la versione .jsx precedente
 * leggeva un campo `item.inactivityWarning` per mostrare un banner
 * "stai abbandonando questo gioco?". TypeScript conferma (con il tipo
 * LibraryItem reale, non un'interfaccia locale inventata) che questo
 * campo NON esiste nella risposta del backend ArcheType-LBP: la UI del
 * banner era già codice morto prima di questa migrazione, non poteva mai
 * attivarsi. Rimossa qui insieme al codice che la calcolava; se in futuro
 * il backend implementerà questo campo, va reintrodotta ripartendo dal
 * tipo LibraryItem aggiornato (mai da un'interfaccia locale scollegata
 * dalla risposta reale dell'API, come accadeva prima).
 */
// Stesso fallback SVG di GameCard.tsx: molti giochi (es. i 5 di seed in
// db/init.sql) non hanno mai avuto header_image_url valorizzato, quindi
// senza questo placeholder l'immagine risulta rotta/vuota invece che
// mostrare un riquadro "No Image" coerente col resto del catalogo.
const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3Crect fill='%23272727' width='400' height='225'/%3E%3Ctext fill='%2371717a' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function LibraryItemCard({ item, onStatusChange, onRemove }: LibraryItemCardProps) {
  const { t } = useTranslation();

  // IMPORTANTE: passiamo sempre item.id (l'id della VOCE di backlog),
  // mai item.game.id — il backend identifica/modifica le voci per il
  // proprio id, non per il gameId collegato. Passare game.id qui
  // modificherebbe/cancellerebbe la voce sbagliata.
  return (
    <div className="bg-vz-charcoal rounded-xl border border-zinc-800 overflow-hidden">
      <div className="flex gap-3 p-3">
        <img
          src={item.game.headerImageUrl || NO_IMAGE_PLACEHOLDER}
          alt={item.game.name}
          className="w-24 h-14 object-cover rounded-lg bg-zinc-900 flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{item.game.name}</h3>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
            {t(`library.status.${item.status}`)}
          </span>
        </div>
      </div>

      {/* Azioni di cambio stato — quali bottoni mostrare dipende dallo stato attuale */}
      <div className="px-3 pb-3 flex flex-wrap gap-2">
        {item.status === "wishlist" && (
          <button
            onClick={() => onStatusChange(item.id, "playing")}
            className="text-xs px-3 py-1 rounded-full bg-vz-lime text-vz-navy font-semibold"
          >
            {t("library.moveToBacklog")}
          </button>
        )}
        {item.status === "playing" && (
          <>
            <button
              onClick={() => onStatusChange(item.id, "finished")}
              className="text-xs px-3 py-1 rounded-full border border-vz-lime text-vz-lime"
            >
              {t("library.markAsFinished")}
            </button>
            <button
              onClick={() => onStatusChange(item.id, "abandoned")}
              className="text-xs px-3 py-1 rounded-full border border-zinc-600 text-zinc-400"
            >
              {t("library.markAsAbandoned")}
            </button>
          </>
        )}
        {item.status === "abandoned" && (
          <button
            onClick={() => onStatusChange(item.id, "playing")}
            className="text-xs px-3 py-1 rounded-full border border-blue-400 text-blue-300"
          >
            {t("library.markAsInProgress")}
          </button>
        )}
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs px-3 py-1 rounded-full text-zinc-500 hover:text-vz-pink"
        >
          {t("library.remove")}
        </button>
      </div>
    </div>
  );
}
