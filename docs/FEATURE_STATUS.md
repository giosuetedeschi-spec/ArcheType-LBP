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

**UI da rifare secondo mockup**:
- #102 Login/Register: redesign visivo fatto (PR #170); i bottoni Steam/Google restano placeholder disabilitati — l'integrazione OAuth vera e propria resta da fare

**Backend**:
- #101 Molti giochi seed hanno `headerImageUrl` null (fallback grafico già aggiunto lato frontend: `GameCoverPlaceholder`, gradiente animato con la palette del brand invece di un riquadro statico "No Image") — resta comunque data-quality del dataset Steam, non un bug di codice

---
*Ultimo aggiornamento: 2026-07-10 — chiusa #27 (sign-off FK di `db/init.sql`): ogni FK verificata contro i `@JoinColumn` JPA corrispondenti (games→developers/publishers, game_genres, game_categories, backlog→users/games, friends, reviews, game_sessions) — tutte corrette, nessun bug. Trovate però 3 tabelle in `init.sql` senza alcun codice che le usa: `wishlist` (la wishlist reale vive come `backlog.status = 'wishlist'`, non su questa tabella), `game_developers` (Game ha già developer_id diretto su `games`, mai popolata da `populate_db.py`), `user_settings` (mai letta/scritta dal backend). Non rimosse in questo giro — verifica, non nuovo lavoro di schema — ma segnalate come dead schema per una futura pulizia:*

*Precedente (stesso giorno) — sostituiti i tre fallback statici per `headerImageUrl` null (SVG "No Image" grigio in `GameCard`/`LibraryItemCard`, dipendenza esterna `placehold.co` in `GameDetailPage`) con un unico componente condiviso `GameCoverPlaceholder` (gradiente animato coi colori del brand — navy/pink/lime —, iniziale del nome, `role="img"`/`aria-label` per l'accessibilità, `prefers-reduced-motion` rispettato, e nessuna chiamata a servizi esterni); chiuse anche #140/#19 su GitHub (già risolte da PR #176/#178, mancava solo lo stato "Done" sulla issue) — vedi changelog del giorno precedente:*

*Precedente (2026-07-09) — risolte tutte le voci rimaste aperte tranne #101 (data-quality del dataset, non un bug) e la parte OAuth di #102 (fuori scope, richiede credenziali/integrazione reale con Steam/Google):*
- *#84 validazione input: `FriendRequest.friendId` e `LeaderboardFilterRequest.userId` non avevano `@NotNull`/`@Valid`, quindi un valore mancante arrivava fino a `findById(null)` e usciva come 500 invece di 400 (PR #176); `GlobalExceptionHandler` non gestiva `BindException` (validazione su query param) né `HttpRequestMethodNotSupportedException` (verbo HTTP sbagliato), quindi entrambi i casi finivano nel catch-all generico come 500 invece di 400/405 (PR #176, #178). SQL injection e XSS verificati direttamente: nessuna query concatenata (solo JPQL con binding), zero `dangerouslySetInnerHTML`/`innerHTML` nel frontend — non exploitable allo stato attuale, nessuna modifica necessaria*
- *#85 credenziali hardcoded: `spring.datasource.*` e `jwt.secret` erano hardcoded in `application.properties`; ora `${ENV_VAR:default-dev}`, sovrascrivibili per ambiente senza toccare il file (PR #176)*
- *#100 duplicazione `/games`: rimosso il `GET /api/games` non paginato (zero consumer, `/filter` copre lo stesso caso con page/size ora limitati) (PR #176)*
- *#106 copyright footer: `currentYear` era calcolato ma mai usato — il testo aveva l'anno hardcoded "2025-2026"; ora dinamico (PR #177)*
- *#146 occhiolino password: componente `PasswordInput` condiviso (icona Eye/EyeOff da `lucide-react`) su Login e Register (PR #177)*
- *#19 messaggi di errore strutturati: con le due voci sopra, tutti i fallimenti noti (validazione, non trovato, conflitto, verbo HTTP sbagliato) hanno ora uno status/messaggio specifico invece di un 500 generico; i soli 500 restano le eccezioni davvero impreviste, generiche di proposito per non esporre dettagli interni — considerato risolto*

*In precedenza (stesso giorno): risolti i 19 errori TypeScript di `LeaderboardPage.tsx` (commit `37d6e64`); mergiati sezione wishlist nel profilo (#167), bottone dinamico Compra/Gioca in base al possesso (#103, PR #168), esclusione dei giochi per adulti da home/filtro catalogo (#87, PR #169 — verificato via query diretta: esclude correttamente 139 giochi taggati `Nudity`/`Sexual Content`; nota di data-quality, non un bug: centinaia di altri titoli espliciti nel dataset Steam non sono taggati in quel modo), redesign Login/Register (#102 parziale — solo l'OAuth reale resta da fare, PR #170), fix layout navbar su schermi medi (PR #171), infrastruttura di test frontend con Vitest + Testing Library (PR #166); corrette chiavi i18n mancanti/incoerenti (PR #173); `docker compose up` ora avvia tutto con un solo comando, incluso il populate automatico del dataset (PR #174); ribackfillate le colonne `windows`/`mac`/`linux` (prima tutte `false` per un volume dati locale stantio) e i dati demo di amici/classifica sul volume di sviluppo locale.*
