import { Link } from "@tanstack/react-router";

/**
 * Informativa sulla privacy — testo placeholder standard, coerente con un
 * progetto studentesco (cliente fittizio Zero Lag S.r.l.). Non è consulenza
 * legale né un testo redatto da un legale: va sostituito con un testo reale
 * se il progetto viene mai messo in produzione con utenti veri.
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-20">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8 text-center">
          Informativa sulla privacy
        </h1>

        <div className="space-y-6 text-slate-400 text-sm leading-relaxed">
          <p>
            Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <section>
            <h2 className="text-lg font-display font-semibold text-white mb-2">1. Titolare del trattamento</h2>
            <p>
              VirtualZ è un progetto sviluppato nell'ambito di un percorso formativo ITS,
              per il cliente dimostrativo Zero Lag S.r.l. Questa informativa ha scopo
              illustrativo e non costituisce un documento legale vincolante.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-white mb-2">2. Dati raccolti</h2>
            <p>
              In fase di registrazione raccogliamo username, email e, se scegli il login
              tramite provider esterno, le informazioni base del profilo (nome utente,
              email, avatar) fornite da Steam o Google.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-white mb-2">3. Finalità del trattamento</h2>
            <p>
              I dati vengono usati esclusivamente per far funzionare l'account, la libreria
              giochi personale, le statistiche di gioco e le funzionalità social (amici,
              classifiche). Non vengono ceduti a terzi né usati per finalità pubblicitarie.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-white mb-2">4. Conservazione dei dati</h2>
            <p>
              I dati restano associati al tuo account finché non richiedi la cancellazione
              dello stesso, contattandoci agli indirizzi riportati nella pagina Contatti.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-white mb-2">5. I tuoi diritti</h2>
            <p>
              Puoi richiedere in qualsiasi momento accesso, correzione o cancellazione dei
              tuoi dati scrivendo a{" "}
              <a href="mailto:virtualz@archetype.it" className="text-vz-lime hover:underline">
                virtualz@archetype.it
              </a>.
            </p>
          </section>
        </div>
      </div>

      <Link
        to="/"
        className="mt-12 px-8 py-3 rounded-full bg-vz-lime text-vz-navy font-semibold hover:opacity-90 transition-opacity"
      >
        Torna alla Home
      </Link>
    </div>
  );
}
