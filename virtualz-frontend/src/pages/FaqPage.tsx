import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

/**
 * Centro assistenza — FAQ generiche, al posto del redirect a /coming-soon
 * che c'era prima nel footer. Domande scritte da noi (nessun contenuto
 * legale/contrattuale reale, coerente col resto del progetto studentesco).
 */
const FAQS = [
  {
    q: "Come recupero la password del mio account?",
    a: "Dalla pagina di login, clicca su \"Password dimenticata\" e segui le istruzioni via email.",
  },
  {
    q: "Come collego il mio account Steam a VirtualZ?",
    a: "Vai su Profilo → Impostazioni e clicca su \"Collega Steam\". Verrai reindirizzato alla pagina di autorizzazione di Steam.",
  },
  {
    q: "Perché non vedo tutti i miei giochi nella libreria?",
    a: "La sincronizzazione con Steam può richiedere qualche minuto dopo il collegamento dell'account. Se il problema persiste, prova a ricollegare l'account da Impostazioni.",
  },
  {
    q: "Come aggiungo un gioco alla Wishlist?",
    a: "Apri la pagina del gioco nel Catalogo e clicca sull'icona a forma di cuore in alto a destra.",
  },
  {
    q: "Posso usare VirtualZ da mobile?",
    a: "Sì, il sito è responsive e funziona da smartphone e tablet tramite il browser.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-20">
      <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 text-center">
        Centro assistenza
      </h1>
      <p className="text-slate-400 mb-12 text-center max-w-md">
        Le domande più frequenti su VirtualZ. Non trovi quello che cerchi?{" "}
        <Link to="/contact" className="text-vz-lime hover:underline">Contattaci</Link>.
      </p>

      <div className="w-full max-w-2xl space-y-3 mb-10">
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} className="rounded-lg border border-slate-700 bg-vz-charcoal overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-slate-100 font-medium hover:text-vz-lime transition-colors"
                aria-expanded={isOpen}
              >
                {item.q}
                <ChevronDown
                  className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <p className="px-5 pb-4 text-slate-400 text-sm">{item.a}</p>
              )}
            </div>
          );
        })}
      </div>

      <Link
        to="/"
        className="px-8 py-3 rounded-full bg-vz-lime text-vz-navy font-semibold hover:opacity-90 transition-opacity"
      >
        Torna alla Home
      </Link>
    </div>
  );
}
