# Feature Status

Stato reale delle funzionalità richieste (vedi tabella "Funzionalità" in
[`README.md`](../README.md)), aggiornato ad ogni feature/fix rilevante.
Non è una lista statica: va tenuta sincronizzata col codice, non con le
intenzioni — se una riga qui dice "✅ Fatta", deve esserlo davvero.

Legenda: ✅ Fatta · 🟠 A metà/parziale · ⏳ Non iniziata

## Funzionalità principali (dal README)

| Funzionalità | Stato | Note |
|---|---|---|
| 📚 Libreria personale | ✅ | Import Steam via `populate_db.py`, libreria con stati playing/finished/abandoned |
| ❤️ Wishlist | 🟠 | Backend pronto; sezione dedicata nel profilo lasciata come TODO per un collega |
| 📊 Grafici di utilizzo | ✅ | Due grafici reali nel profilo (giochi per genere, composizione libreria), riusando `StatsController` già cachato; developer/anno/rating ancora solo numeri, non graficati |
| 🏆 Classifiche | ✅ | `LeaderboardPage.tsx` implementata (tab globale/amici, filtro metrica, paginazione), ma **19 errori TypeScript** già presenti su `main` (verificato con `tsc --noEmit`) — funziona a runtime solo perché Vite non blocca la build sui type error di default |
| 🔍 Filtri avanzati | 🟠 | Genere/prezzo/OS fatti; recensioni/voti utente ora implementati (tabella `reviews`, CRUD, UI su pagina gioco e profilo — non ancora mergiati in `main`), ma **non ancora collegati come filtro** nel catalogo (es. "voto minimo utenti"); mancano ancora VR (dati già importati come categoria, da collegare) e colore copertina (script esistente ma non integrato, richiederebbe elaborare le immagini di 122k giochi) — issue #11 |
| 👥 Amici | ✅ | Ricerca, richieste (invio/accetta/rifiuta), lista amici con statistiche — mergiata in `main` (PR #150) |
| 👤 Profilo | ✅ | Giochi posseduti, statistiche + grafici, sezione amici, riassunto classifica (posizione + top 3), sezione "Le mie recensioni" con link al gioco |
| 🎨 Modalità colorblind | ✅ | Presente |
| 🌐 Multilingua | ✅ | it/en/fr/es |
| 🔐 Login immediato | ✅ | JWT funzionante, checkbox conferma maggiore età aggiunta (PR #151); redesign grafico da mockup non ancora fatto (issue #102) |

## Altri problemi/richieste aperte (da issue GitHub)

**Sicurezza/infrastruttura** (non affrontate):
- #84 Validazione/sanitizzazione input (SQL injection, XSS)
- #85 Credenziali ancora hardcoded in `application.properties`, da spostare in env/vault

**UI da rifare secondo mockup**:
- #102 Login/Register: card con sfondo, bottoni "Accedi con Steam/Google" (placeholder, serve OAuth)
- #103 Pagina prodotto: bottone dinamico Compra/Gioca (non fatto) + voto utente — **il voto/recensione utente è ora scrivibile** su `GameDetailPage` (separato dal rating Steam), manca ancora il bottone dinamico Compra/Gioca in base al possesso
- #146 Occhiolino mostra/nascondi password

**Backend**:
- #19 Messaggi di errore strutturati per ogni possibile fallimento (DB, rete, conflitti) — parzialmente affrontato: `GlobalExceptionHandler` ora logga (`log.error`) ogni eccezione non gestita prima di rispondere 500, prima era invisibile nei log. Il messaggio restituito al client resta generico di proposito; messaggi più specifici per singolo scenario restano da fare
- #100 Da decidere: `/games` vs `/games/filter` duplicati, quale tenere
- #101 Molti giochi seed hanno `headerImageUrl` null (fallback immagine già aggiunto lato frontend)

**Trovato ma non ancora tracciato come issue**:
- `LeaderboardPage.tsx` (PR #149, già su `main`): 19 errori TypeScript (`tsc --noEmit`), soprattutto `user` possibilmente `null` non gestito e uno state tipizzato `null` invece del tipo reale della risposta. Non causa crash visibile perché Vite non blocca la build sui type error, ma va corretto.

**Minori**:
- #87 Nascondere giochi per adulti dalla home (non fatta)
- #106 Allineare il copyright nel footer

---
*Ultimo aggiornamento: 2026-07-08 — mergiati amici (#150), checkbox età (#151), classifica (#149); aggiunti grafici statistiche e riassunto classifica al profilo; logging aggiunto a GlobalExceptionHandler; aggiunte recensioni/voti utente (tabella `reviews`, CRUD, UI su pagina gioco e profilo) — non ancora mergiate in `main`.*
