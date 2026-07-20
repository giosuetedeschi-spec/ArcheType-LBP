# Google & Steam Login — Integration Plan

Plan for how to actually wire up "Sign in with Google" / "Sign in with Steam"
(issue #102 — the buttons in `OAuthButtons.tsx` are disabled placeholders,
`spring-boot-starter-oauth2-client` isn't in `pom.xml`, `SecurityConfig` only
does username/password JWT auth today, per `docs/FEATURE_STATUS.md`).

## What already exists

- `docs/auth-steam-google.md` — an earlier design sketch with a full flow diagram, Spring config, and code snippets. Useful as a reference for shape, but it has one **incorrect assumption worth flagging before building from it**: it configures Steam as a `spring.security.oauth2.client.registration.steam.*` entry with a `token-uri`/`jwk-set-uri` pointing at `steamcommunity.com/openid/login`. Steam doesn't speak OAuth2/OIDC at all — it only offers **OpenID 2.0** (`checkid_setup` redirect + `check_authentication` verification, no token/JWKS endpoints exist). `spring-boot-starter-oauth2-client` has no OpenID 2.0 support, so that registration block would not work as written. Google, by contrast, is standard OAuth2/OIDC and fits the Spring client directly.
- Current auth stack: `AuthController` (`/api/auth/login`, `/register`) does username+password via `AuthenticationManager` + `JwtUtils`, issuing the app's own JWT. Any OAuth addition needs to end at the same place — an app JWT — so the frontend's existing `AuthContext`/token handling doesn't need to branch by login method.
- `users` table (`db/init.sql`) has `password VARCHAR(255) NOT NULL` and no provider columns yet — an OAuth-only account has no password to store, so this needs a schema change either way (see implementation sketch).
- `docs/SUPABASE.md` evaluated moving the whole backend to Supabase (which bundles OAuth) and recommended it at the time, but the project has since built out a full Spring Boot backend (12+ controllers, JWT, caching, etc.) — that recommendation reflects an earlier decision point, not current direction. Noted here only because Supabase/Auth0/Firebase resurface below as an option and the "why not" is "we already diverged from that path," not a fresh evaluation.

## Approaches considered

### 1. Fully hand-rolled flow for both providers
Skip Spring's OAuth2 client entirely; write the authorization-code exchange for Google and the OpenID 2.0 handshake for Steam directly against their HTTP APIs.
- Pro: one consistent, fully-understood code path for both; no fighting a library's assumptions about protocols it doesn't support.
- Con: reimplements state/CSRF handling, code exchange, and token verification for Google by hand — all of which `spring-boot-starter-oauth2-client` already does correctly and is already a dependency pattern the team knows (Spring Security is already in `pom.xml`). Throwing that away for Google specifically to keep symmetry with Steam is negative value.

### 2. Protocol-appropriate hybrid: Spring OAuth2 client for Google, custom relying party for Steam
Use `spring-boot-starter-oauth2-client` for Google (it's built for exactly this protocol), and a small dedicated Steam module that does the actual OpenID 2.0 dance (redirect to `steamcommunity.com/openid/login` with `checkid_setup`, verify the return via `check_authentication`, then call the Steam Web API `ISteamUser/GetPlayerSummaries` for profile data — same API `scripts/steam_api.py` already talks to, just from Java instead of Python).
- Pro: each provider is handled with the mechanism actually built for its protocol, instead of forcing Steam into an OAuth2-shaped config that silently doesn't work. Reuses Spring Security's existing filter chain/session handling for Google. Both paths converge on the same place: mint an app JWT via the existing `JwtUtils`.
- Con: two different pieces of provider-integration code to maintain instead of one uniform abstraction — acceptable, since the providers are genuinely different protocols; a uniform abstraction here would be fake uniformity.

### 3. Frontend-driven Google Sign-In + backend-only Steam relying party
Use Google Identity Services' JS SDK on the frontend to get an `id_token` directly in the browser (no redirect round-trip through the backend), and send just that token to a backend endpoint that verifies it and issues the app JWT. Steam still needs the same backend OpenID relying party as option 2, since Steam has no equivalent client-side SDK.
- Pro: fewer backend redirect endpoints for Google, faster/simpler UX for that provider (no full-page redirect).
- Con: splits "how login works" between providers at the architecture level (client-side token for one, server-side redirect flow for the other), which is a bigger conceptual split than option 2's "different protocol, same shape of flow." Marginal UX win, real complexity cost.

### 4. Hosted identity provider (Supabase Auth / Auth0 / Firebase Auth) fronting Google, custom Steam bolt-on
Let a managed auth service handle the Google OAuth relationship entirely; the app backend just trusts that service's session/JWT. Steam still isn't a supported provider on any mainstream hosted-auth service, so a custom OpenID 2.0 relying party is still required on top, integrated with whichever hosted provider's user model.
- Con: adds a new external dependency and a second identity system to reconcile with the existing `users` table/JWT flow, to solve only half the problem (Google) — Steam's custom code is unavoidable regardless of this choice, so the hosted service isn't actually removing the hard part. Also re-opens the Supabase direction the team already moved away from in practice.

### 5. Google-only for v1, Steam deferred
Ship Google OAuth (a same-day integration with `spring-boot-starter-oauth2-client`) now; track Steam's OpenID 2.0 work as a separate, later follow-up given it's genuinely more work (no off-the-shelf Spring support, custom verification, extra Steam Web API call for profile data).
- This isn't a competing architecture, it's a sequencing choice — and a reasonable one given the size gap between the two integrations. Folded into the selected approach below rather than treated as a standalone option.

## Selected approach: #2 (protocol-appropriate hybrid), sequenced Google-first

Use `spring-boot-starter-oauth2-client` for Google; build a small standalone Steam OpenID 2.0 relying-party class for Steam. Both end at the same `JwtUtils`-minted app JWT the password-login path already produces. Ship Google first, Steam second (option 5's sequencing), since they're independent integrations and Google is most of the value for a fraction of the effort.

Why this one:
- It's the only option that doesn't either (a) force Steam through a protocol it doesn't support (rejected: existing draft doc's approach, and implicitly option 4), or (b) throw away Spring Security's working OAuth2 support for Google just to keep the two providers symmetric (rejected: option 1).
- Converging both providers on the existing `JwtUtils` app-JWT issuance (rather than a hosted provider's own session, option 4) means the frontend's `AuthContext` and every existing JWT-protected endpoint need zero changes to support the new login methods — only how the JWT gets minted changes, not what it is.

### Implementation sketch

1. **Google** (`spring-boot-starter-oauth2-client` + `spring-boot-starter-oauth2-resource-server` or a plain redirect flow):
   - Add the dependency, register `google` client-id/secret/scopes (`openid,profile,email`) as env vars, same `${ENV_VAR:default}` convention already used for `spring.datasource.*`/`jwt.secret` (per the #85 fix noted in `docs/FEATURE_STATUS.md` — no hardcoded secrets).
   - On successful OAuth2 login callback, look up or create a `User` by email, then call the existing `JwtUtils.generateToken(...)` and redirect the frontend to a page that stores it exactly like the password-login response does — `OAuthButtons.tsx`'s `handleGoogleLogin` becomes a real redirect to `/oauth2/authorization/google` instead of a disabled button.
2. **Schema**: `users.password` needs to become nullable (OAuth-only accounts have none), plus `auth_provider VARCHAR(20) DEFAULT 'local'` and `provider_id VARCHAR(255)` columns (the "Database Additions" section of `docs/auth-steam-google.md` already sketches this correctly — that part of the old doc is fine, only its Steam Spring-registration snippet is wrong).
3. **Steam**: new `SteamOpenIdService` — build the `checkid_setup` redirect URL by hand, verify the callback via `check_authentication`, extract the Steam ID from the returned claimed identity URL, then call `ISteamUser/GetPlayerSummaries` (same endpoint `scripts/steam_api.py` already uses) for username/avatar. Same "find-or-create user, mint JWT" convergence as Google.
4. **Frontend**: `OAuthButtons.tsx` loses its `disabled`/placeholder state once each backend redirect endpoint exists; no `AuthContext` changes needed since both flows end in the same JWT the app already knows how to store and use.
5. **Correction to make when this is built**: update or remove the Steam Spring-OAuth2-registration block in `docs/auth-steam-google.md` so it doesn't mislead whoever implements this — replace it with a pointer to the `SteamOpenIdService` approach above.

### Account linking — Google vs. Steam are NOT the same problem

Google's OAuth response includes a verified email, so "does this email match an existing local account" is a trustworthy signal: **if it matches, require the existing password once to link rather than silently merging** (avoids account-takeover via a spoofed email at the provider — the whole point of the password check is proving the OAuth login is the same person who owns the local account, not just someone whose provider profile happens to share an address).

**Steam gives no email at all** — only a Steam ID and a public display name, both of which a stranger can set to look like an existing user's on purpose. Reusing the email-matching heuristic for Steam (e.g. "match by display name") is a real account-takeover vector, not just an edge case, so it is explicitly **not** how Steam linking works here:

- **Login page ("Continua con Steam", anonymous)**: only ever finds-or-creates by `provider_id` (Steam ID). A Steam ID never seen before always creates a brand-new password-less account — it never attempts to attach itself to an existing local account, even if the display name looks similar.
- **Linking an existing account to Steam** happens only from a **new "Collega Steam" action inside the authenticated Profile page**, never from the public login page. Because the user is already authenticated when they click it, there is no identity to guess — the returned Steam ID is written straight onto `req.getUserPrincipal()`'s own `provider_id`/`auth_provider` (or a dedicated linked-accounts row if a user ends up needing more than one linked provider later). This mirrors how GitHub/Discord/most real products let you attach a second sign-in method — always an authenticated, deliberate action, never an automatic inference at login time.
- Practical effect: a user who registered with a password and later wants "log in with Steam" too must first log in normally once and use "Collega Steam" from their profile; only after that will the public Steam login button recognize their account.
