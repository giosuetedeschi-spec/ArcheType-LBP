# Documentazione Tecnica: Implementazione Mock Google OAuth2

## Overview

Documentazione riguardo l'architettura e l'implementazione del sistema di autenticazione simulata (Mock) tramite Google all'interno dell'applicazione.
Il sistema permette di testare l'esperienza utente e i flussi di autorizzazione senza dipendere direttamente dalle API reali di Google Cloud Console o da connettività esterna, integrandosi con il backend Dockerizzato e il database PostgreSQL.

---

## 1. Flusso di Autenticazione

Il flusso riproduce le tappe fondamentali del protocollo OAuth2 standard, ottimizzandole per l'ambiente di sviluppo locale:

```
[ Frontend: OAuthButtons ] --(1) GET /api/auth/mock-google --> [ Backend: AuthController ]
|
(2) Verifica se esiste
(3) Crea utente se assente
|
[ Frontend: Carica Stato ] <--(4) Ritorna Token + Dati Utente ---------+
```

1. **Richiesta di Login:** L'utente clicca sul pulsante "Continua con Google". Il Frontend invia una richiesta GET al backend.
2. **Business Logic (Backend):** Il backend simula la ricezione del token da parte di Google, estrae i dati dell'utente di test e controlla sul database PostgreSQL se l'utente esiste già.
3. **Persistenza:** Se l'utente non esiste, viene registrato automaticamente tramite i servizi tradizionali del backend.
4. **Emissione JWT:** Il backend genera un token JWT (JSON Web Token) valido e risponde al frontend con i dati di sessione.
5. **Sincronizzazione Stato:** Il frontend intercetta la risposta, la memorizza nel contesto globale di React (`AuthContext`) e reindirizza l'utente alla Home Page in stato autenticato. 

--- 

## 2. Modifiche e Codice del Backend (Java / Spring Boot)

È stato introdotto un endpoint dedicato all'interno di `AuthController.java` che agisce da simulatore del server di autorizzazione.

### File: AuthController.java
```java
@GetMapping("/mock-google")
public ResponseEntity<ResponseDto<AuthResponseDto>> mockGoogleLogin() {
	// 1. Definizione delle credenziali dell'utente simulato da Google
	String mockEmail = "studente.test@gmail.com";
	String mockUsername = "google_test_user";
	
	User user;
	try {
		// Tenta di recuperare l'utente dal database se ha già effettuato l'accesso in passato
		user = userService.findByUsername(mockUsername);
	} catch (ResourceNotFoundException e) {
		// 2. Se l'utente non esiste, viene registrato dinamicamente nel sistema tradizionale
		RegisterRequestDto newUserReq = new RegisterRequestDto();
		newUserReq.setUsername(mockUsername);
		newUserReq.setEmail(mockEmail);
		// Viene assegnata una password di sicurezza di fallback
		newUserReq.setPassword("PasswordSicura123!");
		
		// Registrazione ufficiale tramite il servizio utente (crea record su DB)
		user = userService.register(newUserReq);
	}
		
	// 3. Generazione del token JWT ufficiale associato all'utente recuperato o creato
	String jwtToken = jwtService.generateToken(user);
	
	// 4. Costruzione della risposta di autenticazione allineata con i DTO di sistema AuthResponseDto
	authResponse = AuthResponseDto.builder()
		.token(jwtToken)
		.userId(user.getId())
		.username(user.getUsername())
		.email(user.getEmail())
		.build();
	
	return ResponseEntity.ok(ResponseDto.success(authResponse));
}
```

## 3. Modifiche e Codice del Frontend (React / TypeScript)

Per accogliere l'autenticazione tramite token generati esternamente alla form di login, si è reso necessario esporre la logica di persistenza dello stato globale e mappare il comportamento del click sul pulsante grafico.

### Modifica frontend/src/context/AuthContext.tsx

È stata esposta la funzione nativa `persistSession` nell'interfaccia pubblica del contesto per consentire a componenti esterni (i pulsanti di OAuth) di salvare il JWT e aggiornare lo stato isAuthenticated in modo reattivo, senza ricorrere a ricaricamenti brutali della pagina.

### Modifica frontend/src/components/OAuthButtons.tsx

Il componente gestisce l'interazione grafica e si collega direttamente all'endpoint Mock del backend, inoltrando poi i dati ricevuti alle funzioni di local storage strutturate dal modulo tokenStorage dell'applicazione.

```typescript
import { useTranslation } from "react-i18next";
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "@tanstack/react-router";

export default function OAuthButtons() {
  const { t } = useTranslation();
  const { persistSession } = useAuth(); 
  const navigate = useNavigate();

  // URL del backend isolato nell'ambiente Docker
  const API_BASE_URL = "http://localhost:8080";

  const handleGoogleLogin = async () => {
    try {
      // Chiamata API all'endpoint di simulazione Google
      const response = await axios.get(`${API_BASE_URL}/api/auth/mock-google`);
      
      if (response.data && response.data.data) {
        const authResponse = response.data.data;
        
        // Salvataggio centralizzato nel LocalStorage secondo le convenzioni del progetto
        persistSession(authResponse, true);
        
        alert("Accesso simulato con Google riuscito!");
        
        // Reindirizzamento pulito alla Home Page tramite TanStack Router
        navigate({ to: "/" });
      }
    } catch (error) {
      console.error("Errore durante il mock login con Google:", error);
      alert("Impossibile connettersi al mock di Google");
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-wide">
        <div className="h-px flex-1 bg-slate-800" />
        {t("auth.orContinueWith") || "Oppure continua con"}
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="mt-4 space-y-2">
        {/* Steam disabilitato per sviluppi futuri */}
        <button
          type="button"
          disabled
          title={t("auth.comingSoon")}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#1b2838] px-4 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
        >
          🎮 {t("auth.continueWithSteam") || "Continua con Steam"}
        </button>

        {/* Pulsante Google attivo e collegato alla logica di Mock */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-700 bg-vz-charcoal px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          🔍 {t("auth.continueWithGoogle") || "Continua con Google"}
        </button>
      </div>
    </div>
  );
}
```

## 4. Conclusioni

- **Indipendenza Ambientale:** Il sistema funziona offline all'interno dell'ecosistema docker-compose, senza richiedere configurazioni di credenziali (Client ID / Client Secret) sulla Google Cloud Console in questa fase di sviluppo.
- **Database:** L'utente creato viene registrato a tutti gli effetti nella tabella utenti di PostgreSQL. Gode degli stessi identici diritti, relazioni e persistenza di un utente standard.
- **Integrità del Frontend:** Sfruttando persistSession nativo, i componenti di sicurezza del frontend reagiscono in tempo reale aggiornando le viste protette, i menu di navigazione ed eventuali pannelli del profilo utente.
- **Predisposizione alla Produzione:** Quando l'applicazione dovrà passare all'OAuth2 reale di Google, le modifiche saranno limitate esclusivamente allo scambio del token nell'endpoint del backend, lasciando inalterata tutta l'infrastruttura di sincronizzazione e gestione della sessione del frontend.