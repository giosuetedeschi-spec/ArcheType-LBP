import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { LibraryItem, LibraryStatus } from "@/types/api";
import GameCoverPlaceholder from "./GameCoverPlaceholder";

// Valori reali dello status, come validati dal backend (vedi
// BacklogRequest.java @Pattern) — minuscoli, non quelli che si potrebbero
// immaginare guardando solo le label visualizzate all'utente.
const STATUS_COLORS: Record<LibraryStatus, string> = {
  wishlist: "bg-vz-pink/20 text-vz-pink",
  playing: "bg-blue-500/20 text-blue-300",
  finished: "bg-vz-lime/20 text-vz-lime",
  abandoned: "bg-slate-700/40 text-slate-400",
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
export default function LibraryItemCard({ item, onStatusChange, onRemove }: LibraryItemCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // IMPORTANTE: passiamo sempre item.id (l'id della VOCE di backlog),
  // mai item.game.id — il backend identifica/modifica le voci per il
  // proprio id, non per il gameId collegato. Passare game.id qui
  // modificherebbe/cancellerebbe la voce sbagliata.
  return (
    <div className="bg-vz-charcoal rounded-xl border border-slate-800 overflow-hidden">
      <div className="flex gap-3 p-3">
        <div
          onClick={(e) => { e.stopPropagation(); navigate({ to: "/games/$id", params: { id: String(item.game.id) } }); }}
          className="cursor-pointer group"
        >
          {item.game.headerImageUrl ? (
            <img
              src={item.game.headerImageUrl}
              alt={item.game.name}
              className="w-24 aspect-[92/43] object-cover rounded-lg bg-slate-900 flex-shrink-0 group-hover:opacity-80 transition-opacity"
              loading="lazy"
            />
          ) : (
            <GameCoverPlaceholder
              name={item.game.name}
              seed={item.game.id}
              className="w-24 h-14 rounded-lg flex-shrink-0 group-hover:opacity-80 transition-opacity"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            onClick={(e) => { e.stopPropagation(); navigate({ to: "/games/$id", params: { id: String(item.game.id) } }); }}
            className="font-semibold text-white truncate cursor-pointer hover:text-vz-lime transition-colors"
          >
            {item.game.name}
          </h3>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
            {t(`library.status.${item.status}`)}
          </span>
        </div>
      </div>

      {/* Azioni di cambio stato — quali bottoni mostrare dipende dallo stato attuale */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-800/50 flex flex-wrap gap-2">
        {item.status === "wishlist" && (
          <button
            onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, "playing"); }}
            className="text-xs px-3 py-1 rounded-full bg-vz-lime text-vz-navy font-semibold"
          >
            {t("library.moveToBacklog")}
          </button>
        )}
        {item.status === "playing" && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, "abandoned"); }}
              className="text-xs px-3 py-1 rounded-full border border-slate-600 text-slate-400"
            >
              {t("library.markAsAbandoned")}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, "finished"); }}
              className="text-xs px-3 py-1 rounded-full border border-vz-lime text-vz-lime"
            >
              {t("library.markAsFinished")}
            </button>
          </>
        )}
        {item.status === "abandoned" && (
          <button
            onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, "playing"); }}
            className="text-xs px-3 py-1 rounded-full border border-blue-400 text-blue-300"
          >
            {t("library.markAsInProgress")}
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          className="text-xs px-3 py-1 rounded-full text-slate-500 hover:text-vz-pink"
        >
          {t("library.remove")}
        </button>
      </div>
    </div>
  );
}
