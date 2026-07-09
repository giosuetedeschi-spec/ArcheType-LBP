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
| ❤️ Wishlist | ✅ | Backend + sezione dedicata nel profilo (PR #167) |
| 📊 Grafici di utilizzo | ✅ | Due grafici reali nel profilo (giochi per genere, composizione libreria), riusando `StatsController` già cachato; developer/anno/rating ancora solo numeri, non graficati |
| 🏆 Classifiche | ✅ | `LeaderboardPage.tsx` implementata (tab globale/amici, filtro metrica, paginazione, riassunto "tu" fisso); i 19 errori TypeScript segnalati in precedenza sono risolti (commit `37d6e64`) — `tsc --noEmit` pulito, riverificato il 2026-07-09 |
| 🔍 Filtri avanzati | 🟠 | Genere/prezzo/OS fatti (OS ora affidabile: colonne windows/mac/linux ribackfillate il 2026-07-09, prima erano tutte `false` per un volume dati stantio); recensioni/voti utente mergiati in `main` (tabella `reviews`, CRUD, UI su pagina gioco e profilo), ma **non ancora collegati come filtro** nel catalogo (es. "voto minimo utenti"); mancano ancora VR (dati già importati come categoria, da collegare) e colore copertina (script esistente ma non integrato, richiederebbe elaborare le immagini di 122k giochi) — issue #11 |
| 👥 Amici | ✅ | Ricerca, richieste (invio/accetta/rifiuta), lista amici con statistiche — mergiata in `main` (PR #150) |
| 👤 Profilo | ✅ | Giochi posseduti, statistiche + grafici, sezione wishlist dedicata, sezione amici, riassunto classifica (posizione + top 3), sezione "Le mie recensioni" con link al gioco |
| 🎨 Modalità colorblind | ✅ | Presente |
| 🌐 Multilingua | ✅ | it/en/fr/es; chiavi mancanti (`game.releaseDate`/`game.rating`, mostravano la chiave grezza) e incoerenze IT (loanword non tradotti, refuso "Confirma") corrette il 2026-07-09 |
| 🔐 Login immediato | ✅ | JWT funzionante, checkbox conferma maggiore età aggiunta (PR #151); redesign grafico da mockup fatto (PR #170) — i bottoni "Continua con Steam/Google" restano placeholder disabilitati, OAuth vero e proprio non ancora implementato |

## Altri problemi/richieste aperte (da issue GitHub)

**Sicurezza/infrastruttura** (non affrontate):
- #84 Validazione/sanitizzazione input (SQL injection, XSS)
- #85 Credenziali ancora hardcoded in `application.properties`, da spostare in env/vault

**UI da rifare secondo mockup**:
- #102 Login/Register: redesign visivo fatto (PR #170); i bottoni Steam/Google restano placeholder disabilitati — l'integrazione OAuth vera e propria resta da fare
- #146 Occhiolino mostra/nascondi password

**Backend**:
- #19 Messaggi di errore strutturati per ogni possibile fallimento (DB, rete, conflitti) — parzialmente affrontato: `GlobalExceptionHandler` ora logga (`log.error`) ogni eccezione non gestita prima di rispondere 500, prima era invisibile nei log. Il messaggio restituito al client resta generico di proposito; messaggi più specifici per singolo scenario restano da fare
- #100 Da decidere: `/games` vs `/games/filter` duplicati, quale tenere
- #101 Molti giochi seed hanno `headerImageUrl` null (fallback immagine già aggiunto lato frontend)

**Minori**:
- #106 Allineare il copyright nel footer (non riverificato dopo il redesign navbar/footer del 2026-07-09)

---
*Ultimo aggiornamento: 2026-07-09 — risolti i 19 errori TypeScript di `LeaderboardPage.tsx` (commit `37d6e64`); mergiati sezione wishlist nel profilo (#167), bottone dinamico Compra/Gioca in base al possesso (#103, PR #168), esclusione dei giochi per adulti da home/filtro catalogo (#87, PR #169 — verificato via query diretta: esclude correttamente 139 giochi taggati `Nudity`/`Sexual Content`; nota di data-quality, non un bug: centinaia di altri titoli espliciti nel dataset Steam non sono taggati in quel modo), redesign Login/Register (#102 parziale — solo l'OAuth reale resta da fare, PR #170), fix layout navbar su schermi medi (PR #171), infrastruttura di test frontend con Vitest + Testing Library (PR #166); corrette chiavi i18n mancanti/incoerenti (PR #173); `docker compose up` ora avvia tutto con un solo comando, incluso il populate automatico del dataset (PR #174); ribackfillate le colonne `windows`/`mac`/`linux` (prima tutte `false` per un volume dati locale stantio) e i dati demo di amici/classifica sul volume di sviluppo locale.*
