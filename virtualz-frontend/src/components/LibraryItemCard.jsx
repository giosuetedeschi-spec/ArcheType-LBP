import { useState } from "react";
import { useTranslation } from "react-i18next";

// Valori reali dello status, come validati dal backend (vedi
// BacklogRequest.java @Pattern) — minuscoli, non quelli che si potrebbero
// immaginare guardando solo le label visualizzate all'utente.
const STATUS_COLORS = {
  wishlist: "bg-vz-pink/20 text-vz-pink",
  playing: "bg-blue-500/20 text-blue-300",
  finished: "bg-vz-lime/20 text-vz-lime",
  abandoned: "bg-zinc-700/40 text-zinc-400",
};

/**
 * Mostra una voce della libreria utente (backlog).
 *
 * NOTA: il campo `item.inactivityWarning` qui sotto fa riferimento a una
 * feature pensata per un backend diverso (non quello ArcheType-LBP usato
 * oggi, che non calcola questo campo lato server) — il banner quindi non
 * comparirà mai con il backend attuale. Non è un bug bloccante: degrada
 * con grazia (nessun banner), ma va tenuto a mente prima di fidarsi che
 * questa funzionalità sia "viva".
 */
export default function LibraryItemCard({ item, onStatusChange, onRemove }) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  const showWarning = item.inactivityWarning && !dismissed && item.status === "playing";

  // IMPORTANTE: passiamo sempre item.id (l'id della VOCE di backlog),
  // mai item.game.id — il backend identifica/modifica le voci per il
  // proprio id, non per il gameId collegato. Passare game.id qui
  // modificherebbe/cancellerebbe la voce sbagliata.
  return (
    <div className="bg-vz-charcoal rounded-xl border border-zinc-800 overflow-hidden">
      <div className="flex gap-3 p-3">
        <img
          src={item.game.headerImageUrl}
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

      {/* Banner di inattività — vedi nota in cima al file: non si attiva con il backend attuale */}
      {showWarning && (
        <div className="bg-vz-pink/10 border-t border-vz-pink/30 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-vz-pink">{t("library.inactivityWarning")}</p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onStatusChange(item.id, "abandoned")}
              className="text-xs px-2 py-1 rounded-full bg-vz-pink text-vz-navy font-semibold"
            >
              {t("library.confirmAbandon")}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs px-2 py-1 rounded-full border border-zinc-600 text-zinc-300"
            >
              {t("library.dismissWarning")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
