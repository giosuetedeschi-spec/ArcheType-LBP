# Google & Steam Login — Design Record

> Nota (2026-07-23): questo documento era originariamente un piano per
> issue #102. Aggiornato per riflettere lo stato reale: **Steam è
> implementato e funzionante**, Google resta in mock in attesa di
> credenziali. Il ragionamento su protocolli/account-linking sotto resta
> valido ed è quello effettivamente seguito dal codice — vedi i
> riferimenti a questo file sparsi in `SteamAuthController`,
> `SteamOpenIdService`, `UserService`, `OAuthStateStore`, `User.java`,
> `UserRepository.java`, `application.properties`, la migrazione
> `V4__add_oauth_columns.sql` e `OAuthButtons.tsx`/`ProfilePage.tsx`.

## Perché Steam non usa `spring-boot-starter-oauth2-client`

Steam non parla affatto OAuth2/OIDC — offre solo **OpenID 2.0**
(redirect `checkid_setup` + verifica `check_authentication`, nessun
endpoint token/JWKS). `spring-boot-starter-oauth2-client` non supporta
OpenID 2.0, quindi non può essere usato per Steam in nessun modo.
Google invece è OAuth2/OIDC standard e si presterebbe alla configurazione
Spring — ma nel codice attuale anche Google è gestito senza
`oauth2Login()`, per un altro motivo: quel meccanismo si appoggia alla
`HttpSession` per tenere lo stato dell'authorization request, in
conflitto con `SessionCreationPolicy.STATELESS` di questo backend, e
comunque termina con una sessione lato server invece del redirect con
JWT verso il frontend che serve qui.

## Approccio scelto: gestione manuale per entrambi i provider

- **Steam** (`SteamAuthController`/`SteamOpenIdService`): relying party
  OpenID 2.0 scritta a mano — redirect a
  `steamcommunity.com/openid/login`, verifica del ritorno, poi
  `ISteamUser/GetPlayerSummaries` (stessa API Steam Web che
  `scripts/steam_api.py` già usa) per username/avatar. **Implementato,
  funzionante end-to-end.**
- **Google** (`GoogleAuthController`/`GoogleOAuthService`, branch
  `feature/google-login-manual-249`, non mergiato): stesso pattern di
  Steam — scambio Authorization Code scritto a mano invece di
  `oauth2Login()`. Codice pronto, ma **accantonato** in attesa di
  credenziali reali (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`) prima
  della scadenza. Il login Google reale in questo momento è sostituito
  da un mock (`AuthController./api/auth/mock-google`), vedi
  `docs/DOCS_MOCK_GOOGLE_AUTH.md`.

Entrambi i percorsi convergono nello stesso punto: un JWT applicativo
emesso da `JwtUtils`, esattamente come il login password — l'`AuthContext`
del frontend non deve distinguere per metodo di login.

## Account linking — Google e Steam NON sono lo stesso problema

Google fornisce un'email verificata nella risposta OAuth, quindi "questa
email combacia con un account locale esistente" è un segnale affidabile
(se Google venisse implementato: andrebbe comunque richiesta la password
esistente una volta per collegare, non fondere silenziosamente — evita
account-takeover via email falsificata dal provider).

**Steam non fornisce nessuna email** — solo uno Steam ID e un nome
pubblico, entrambi impostabili a piacere da chiunque per assomigliare a
un utente esistente. Riusare l'euristica di match per email/nome per
Steam sarebbe un vettore di account-takeover reale, non un caso limite —
per questo **non** è così che funziona il collegamento Steam:

- **Pagina di login ("Continua con Steam", anonimo)**: trova-o-crea
  solo per `provider_id` (Steam ID). Uno Steam ID mai visto prima crea
  sempre un account nuovo senza password — non tenta mai di agganciarsi
  a un account locale esistente, anche se il nome visualizzato sembra
  simile.
- **Collegare un account esistente a Steam** avviene solo tramite
  l'azione esplicita **"Collega Steam" dentro il Profilo autenticato**,
  mai dalla pagina di login pubblica. Essendo l'utente già autenticato
  quando clicca, non c'è nessuna identità da indovinare — lo Steam ID
  restituito viene scritto direttamente sull'utente già loggato. Stesso
  pattern di GitHub/Discord e la maggior parte dei prodotti reali per
  collegare un secondo metodo di accesso: sempre un'azione autenticata e
  deliberata, mai un'inferenza automatica al login.
- Effetto pratico: chi si è registrato con password e vuole poi
  "accedi con Steam" deve prima loggarsi normalmente una volta e usare
  "Collega Steam" dal proprio profilo; solo dopo il bottone di login
  Steam pubblico riconoscerà il suo account.
