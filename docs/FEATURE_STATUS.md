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
| 📊 Grafici di utilizzo | 🟠 | Backend statistiche pronto e cachato (`StatsController`); nessun grafico in UI, solo numeri |
| 🏆 Classifiche | ⏳ | `LeaderboardPage.tsx` è ancora un placeholder "Prossimamente" |
| 🔍 Filtri avanzati | 🟠 | Genere/prezzo/OS fatti; mancano recensioni, voti di altri utenti, VR, colore copertina (issue #11) |
| 👥 Amici | 🟠 | Implementata (ricerca, richieste, lista) su branch `feat/pagina-amici`, PR non ancora mergiata |
| 👤 Profilo | ✅ | Giochi posseduti, statistiche base, sezione amici |
| 🎨 Modalità colorblind | ✅ | Presente |
| 🌐 Multilingua | ✅ | it/en/fr/es |
| 🔐 Login immediato | ✅ | JWT funzionante; redesign grafico da mockup non ancora fatto (issue #102) |

## Altri problemi/richieste aperte (da issue GitHub)

**Sicurezza/infrastruttura** (non affrontate):
- #84 Validazione/sanitizzazione input (SQL injection, XSS)
- #85 Credenziali ancora hardcoded in `application.properties`, da spostare in env/vault

**UI da rifare secondo mockup**:
- #102 Login/Register: card con sfondo, bottoni "Accedi con Steam/Google" (placeholder, serve OAuth)
- #103 Pagina prodotto: bottone dinamico Compra/Gioca + voto utente (oggi solo lettura)
- #146 Occhiolino mostra/nascondi password

**Backend**:
- #19 Messaggi di errore strutturati per ogni possibile fallimento (DB, rete, conflitti)
- #100 Da decidere: `/games` vs `/games/filter` duplicati, quale tenere
- #101 Molti giochi seed hanno `headerImageUrl` null (fallback immagine già aggiunto lato frontend)

**Minori**:
- #87 Nascondere giochi per adulti dalla home (non fatta)
- #106 Allineare il copyright nel footer

---
*Ultimo aggiornamento: 2026-07-08*
