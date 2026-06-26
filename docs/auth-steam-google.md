# Authentication System — Steam & Google OAuth

## Overview

ArcheType-LBP uses OAuth 2.0 authentication with two providers:
1. **Steam** — Primary provider (users are gamers, likely already have Steam accounts)
2. **Google** — Alternative provider for convenience

The flow follows the standard OAuth 2.0 authorization code flow with PKCE for security.

## Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Browser  │     │  Backend  │     │  Steam/Google │
│  (React)  │◄───►│  (Spring) │◄───►│   OAuth API   │
└──────────┘     └──────────┘     └──────────────┘

1. User clicks "Sign in with Steam" or "Sign in with Google"
2. Backend generates PKCE challenge + state token
3. Redirect to provider's OAuth page
4. User authorizes on provider's page
5. Provider redirects back to /auth/callback with code
6. Backend exchanges code for access token
7. Backend fetches user profile from provider
8. Backend creates/updates user + generates JWT
9. JWT stored in httpOnly cookie (or localStorage fallback)
10. Redirect to Home page
```

## Login Page UI

```
┌─────────────────────────────────────────┐
│              [Logo Placeholder]         │
│                                         │
│                "Welcome"                │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   🎮  Sign in with Steam        │   │  ← Primary CTA
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   🔍  Sign in with Google       │   │  ← Secondary
│  └─────────────────────────────────┘   │
│                                         │
│  [Error message - hidden by default]   │
│                                         │
└─────────────────────────────────────────┘
```

## Backend Implementation

### Dependencies (pom.xml additions)

```xml
<!-- Spring Security + OAuth2 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>
```

### Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/api/health").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .defaultSuccessUrl("/")
                .failureUrl("/login?error")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(oAuth2UserService())
                )
            );
        return http.build();
    }

    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> oAuth2UserService() {
        return new CustomOAuth2UserService();
    }
}
```

### application.properties (additions)

```properties
# Google OAuth2
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
spring.security.oauth2.client.registration.google.scope=openid,profile,email
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/login/oauth2/code/{registrationId}

# Steam OAuth2 (custom provider — Steam uses OpenID)
spring.security.oauth2.client.registration.steam.client-id=${STEAM_API_KEY}
spring.security.oauth2.client.registration.steam.client-name=Steam
spring.security.oauth2.client.registration.steam.authorization-grant-type=authorization_code
spring.security.oauth2.client.registration.steam.redirect-uri={baseUrl}/login/oauth2/code/steam
spring.security.oauth2.client.registration.steam.scope=openid
spring.security.oauth2.client.provider.steam.authorization-uri=https://steamcommunity.com/openid/login
spring.security.oauth2.client.provider.steam.token-uri=https://steamcommunity.com/openid/login
spring.security.oauth2.client.provider.steam.jwk-set-uri=https://steamcommunity.com/openid/login

# JWT
jwt.secret=${JWT_SECRET}
jwt.expiration=86400000
jwt.refresh-expiration=604800000
```

### Steam OAuth Details

Steam uses **OpenID** (not full OAuth2), which is slightly different:

- **No client_secret needed** for the auth step — uses API key for subsequent API calls
- **Redirect URI**: `https://yourdomain.com/login/oauth2/code/steam`
- **Identity extraction**: From the OpenID return URL (`https://steamcommunity.com/openid/id/76561198000000000`)
- **Profile data**: Must call Steam Web API (`ISteamUser/GetPlayerSummaries`) separately

```java
@Service
public class SteamOAuth2Service {

    @Value("${steam.api.key}")
    private String steamApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public SteamProfile authenticate(String openIdUrl) {
        // Extract Steam ID from OpenID URL
        // Format: https://steamcommunity.com/openid/id/76561198000000000
        String steamId = extractSteamId(openIdUrl);

        // Fetch profile from Steam Web API
        String url = String.format(
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=%s&steamids=%s",
            steamApiKey, steamId
        );

        SteamResponse response = restTemplate.getForObject(url, SteamResponse.class);
        return SteamProfile.fromResponse(response.getResponse().getPlayers()[0]);
    }

    private String extractSteamId(String openIdUrl) {
        // https://steamcommunity.com/openid/id/76561198000000000 → 76561198000000000
        return openIdUrl.substring(openIdUrl.lastIndexOf('/') + 1);
    }
}
```

### Google OAuth Details

Standard OAuth2 flow:

- **Client ID/Secret**: From Google Cloud Console
- **Scopes**: `openid`, `profile`, `email`
- **Redirect URI**: `https://yourdomain.com/login/oauth2/code/google`
- **User info**: Available from the userinfo endpoint

### JWT Token Structure

```java
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
            .setSubject(user.getId().toString())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(new SecretKeySpec(secret.getBytes(), "HmacSHA256"), SignatureAlgorithm.HS256)
            .compact();
    }
}
```

### Auth Controller

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(toResponse(user)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshToken(
            @RequestBody RefreshRequest request) {
        // Validate refresh token, issue new access token
        String newToken = jwtTokenProvider.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(new TokenResponse(newToken)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        // Client clears cookie/token. Server-side: add to blacklist if needed.
        return ResponseEntity.ok(ApiResponse.ok(null, "Logged out"));
    }
}
```

### Database Additions for Auth

```sql
-- Add auth fields to users table
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'local';
ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);

-- Refresh token storage (optional, for server-side token invalidation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

## Frontend Implementation

### Login Page Component

```tsx
export function LoginPage() {
  const handleSteamLogin = () => {
    window.location.href = `${API_BASE}/oauth2/authorization/steam`;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="card-surface w-full max-w-sm p-8 text-center">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">Welcome</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to access your game library
        </p>

        <button
          onClick={handleSteamLogin}
          className="mt-6 w-full flex items-center justify-center gap-3 rounded-md bg-[#1b2838] px-4 py-3 text-sm font-medium text-white hover:bg-[#2a475e] transition-colors"
        >
          <SteamIcon className="h-5 w-5" />
          Sign in with Steam
        </button>

        <button
          onClick={handleGoogleLogin}
          className="mt-3 w-full flex items-center justify-center gap-3 rounded-md border border-border bg-surface-2 px-4 py-3 text-sm font-medium hover:bg-surface-3 transition-colors"
        >
          <GoogleIcon className="h-5 w-5" />
          Sign in with Google
        </button>

        {/* Error display */}
        <AuthError />
      </div>
    </div>
  );
}
```

### Auth Context

```tsx
interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => userApi.getMe(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = useMutation({
    mutationFn: () => userApi.logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["auth"] });
      window.location.href = "/login";
    },
  });

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      isLoading,
      isAuthenticated: !!user,
      logout: logout.mutate,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Protected Route Wrapper

```tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

## Error Handling

| Error | Cause | UI Response |
|-------|-------|-------------|
| `access_denied` | User denied OAuth consent | "Sign-in cancelled. Try again." |
| `invalid_state` | CSRF/state mismatch | "Invalid request. Please try again." |
| `token_expired` | JWT expired | Silent refresh → redirect to login if fails |
| `provider_error` | Steam/Google API down | "Provider unavailable. Try later." |
| `account_linked` | Email already linked to another provider | "This email is already registered with Google. Sign in with Google instead." |

## Security Considerations

1. **CSRF Protection**: OAuth2 `state` parameter validated on callback
2. **PKCE**: Required for public clients (mobile/SPA)
3. **Token Storage**: Prefer httpOnly cookies over localStorage (XSS protection)
4. **Token Rotation**: Refresh tokens rotated on each use
5. **Scope Minimalism**: Request only `openid`, `profile`, `email` — no unnecessary permissions
6. **Rate Limiting**: `/api/auth/*` endpoints rate-limited to prevent brute force
7. **Account Linking**: Allow same email across providers to be linked after verification

## Setup Checklist

- [ ] Register app in Google Cloud Console → get CLIENT_ID + CLIENT_SECRET
- [ ] Register Steam Web API key at https://steamcommunity.com/dev/apikey
- [ ] Configure redirect URIs on both providers
- [ ] Set JWT_SECRET (min 256-bit random key)
- [ ] Add `refresh_tokens` table migration
- [ ] Implement Steam OpenID adapter (non-standard OAuth)
- [ ] Implement Google OAuth adapter (standard)
- [ ] Build LoginPage with both buttons
- [ ] Build AuthContext + ProtectedRoute
- [ ] Add error display component
- [ ] Test full flow: Steam login → callback → JWT → Home
- [ ] Test full flow: Google login → callback → JWT → Home
- [ ] Test token refresh
- [ ] Test logout (token invalidation)
