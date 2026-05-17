import { Concept } from '../types';

export const SECURITY_CONCEPTS_PART1: Concept[] = [
  {
    id: 'auth-oauth2',
    cat: 'security',
    color: '#ef4444',
    icon: '🔐',
    title: 'OAuth 2.0 & OpenID Connect (OIDC)',
    tag: 'Delegated authorization + identity federation — how Google Login works',
    overview: 'OAuth 2.0 is a delegated authorization protocol — it lets users grant third-party apps scoped access to their resources without sharing passwords. OpenID Connect (OIDC) adds an identity layer on top: it tells the app WHO the user is via a signed JWT called an ID token. Together they power every "Login with Google/GitHub/Apple" flow in modern applications.',
    components: [
      {
        name: 'Authorization Server',
        icon: '🏛️',
        role: 'Issues access, refresh, and ID tokens after authenticating the user',
        detail: 'The trusted identity authority — examples include Auth0, AWS Cognito, Google Identity, Okta. It owns the login UI, verifies credentials, enforces MFA, and signs tokens with its private key. All other parties trust it implicitly.',
      },
      {
        name: 'Resource Server',
        icon: '🗄️',
        role: 'Validates access tokens on every API call, returns 401 if invalid or expired',
        detail: 'Your API or microservice. It never trusts the client directly — it verifies the Bearer token signature using the auth server public key (JWKS endpoint). If the token is expired, tampered, or missing required scopes, it returns 401 Unauthorized.',
      },
      {
        name: 'Client',
        icon: '💻',
        role: 'The app requesting tokens on behalf of the user — web, mobile, or CLI',
        detail: 'Can be confidential (server-side app with a secure client_secret) or public (SPA, mobile app — cannot store secrets). Public clients MUST use PKCE. The client initiates the auth flow, receives tokens, and attaches them to API calls.',
      },
      {
        name: 'Access Token',
        icon: '🎫',
        role: 'Short-lived JWT or opaque token sent as Bearer in Authorization header',
        detail: 'Typically expires in 15 minutes. Contains the user sub, issued-at (iat), expiry (exp), and granted scopes. Resource servers validate it on every request. Short lifetime limits damage if leaked — the window of exploitation is narrow.',
      },
      {
        name: 'Refresh Token',
        icon: '🔄',
        role: 'Long-lived token used to get new access tokens without re-authentication',
        detail: 'Lives hours to days. Stored server-side (never in localStorage). When the access token expires, the client silently sends the refresh token to the token endpoint and receives a new access token. Refresh token rotation: each use issues a new refresh token and invalidates the old one — if the old token is used again, the server detects theft and revokes the entire family.',
      },
    ],
    howItWorks: 'Authorization Code + PKCE flow (most secure — for all public clients): 1. User clicks Login with Google. 2. App generates code_verifier (random 32 bytes, base64url) and code_challenge = BASE64URL(SHA256(code_verifier)). 3. App redirects to auth server with: client_id, redirect_uri, scope=openid profile email, response_type=code, state (CSRF token), code_challenge, code_challenge_method=S256. 4. User authenticates at Google. 5. Google redirects back to redirect_uri with authorization_code. 6. App sends code + code_verifier to auth server token endpoint (server-to-server, never in browser). 7. Auth server verifies SHA256(code_verifier) == code_challenge, issues access_token + refresh_token + id_token. 8. App uses access_token as Bearer header on API calls. 9. When expired, use refresh_token to silently get new access_token. Why PKCE: SPAs and mobile apps are public clients — they cannot store a client_secret. Without PKCE, a stolen authorization code can be exchanged for tokens by an attacker. PKCE binds the code to the session: the attacker has the code but not the code_verifier.',
    decision: {
      choose: [
        'Third-party identity (Login with Google/GitHub/Apple)',
        'Cross-service authorization in microservices',
        'Mobile apps needing secure auth without storing passwords',
        'Enterprise SSO — federate with corporate IdP (Okta, Azure AD)',
      ],
      avoid: [
        'Simple single-service APIs where API keys suffice',
        'Machine-to-machine calls — use Client Credentials flow instead',
        'When you control both client and server with no third-party identity',
      ],
      vs: [
        {
          name: 'Client Credentials',
          when: 'M2M auth — no user involved. Service A authenticates to Service B with client_id + client_secret.',
        },
        {
          name: 'Device Flow',
          when: 'CLI tools, smart TVs — devices without a browser. User enters a code on their phone.',
        },
        {
          name: 'Auth Code + PKCE',
          when: 'All user-facing apps. SPAs, mobile, web. The safe default.',
        },
      ],
    },
    failures: [
      {
        name: 'Missing PKCE on public clients',
        cause: 'Implicit Flow or Auth Code without PKCE in SPAs',
        symptom: 'Stolen auth code exchanged for tokens by an attacker who intercepted the redirect',
        fix: 'Always use PKCE. Implicit Flow is deprecated (RFC 9700). Never use response_type=token in SPAs.',
        severity: 'critical',
      },
      {
        name: 'Tokens in localStorage',
        cause: 'Developer stored JWT in localStorage for convenience',
        symptom: 'XSS attack reads localStorage, steals token — attacker has full API access until expiry',
        fix: 'Use httpOnly, Secure, SameSite=Strict cookies. In-memory for SPAs. Never localStorage.',
        severity: 'critical',
      },
      {
        name: 'Missing state parameter',
        cause: 'No CSRF token included in the authorization request',
        symptom: 'CSRF attack forces a user to link an attacker-controlled account to their profile',
        fix: 'Always include a cryptographically random state param; verify it matches exactly on callback.',
        severity: 'high',
      },
    ],
    a: {
      v: 'Hotel Key Card System',
      t: 'OAuth is like telling the hotel front desk to give the concierge a key card that only opens the gym — not your room. You never hand the concierge your master key (password). The key card (access token) has limited scope and expires.',
      tx: 'OAuth separates "who you are" (authentication, handled by OIDC) from "what you can do" (authorization, handled by OAuth scopes). The app never sees your password.',
      s: 'User → AuthServer → code → App → tokens → ResourceServer',
    },
    te: {
      def: 'OAuth 2.0 is a delegated authorization framework (RFC 6749). OIDC (OpenID Connect) is an identity layer on top of OAuth 2.0 that adds authentication via a signed JWT ID token containing user claims.',
      types: [
        { n: 'Authorization Code + PKCE', d: 'User-facing apps. Most secure. Code exchanged server-side; PKCE prevents code interception.' },
        { n: 'Client Credentials', d: 'M2M auth. No user context. Service authenticates with client_id + client_secret.' },
        { n: 'Device Flow', d: 'Browserless devices (CLI, TV). User authorizes on a secondary device using a short code.' },
        { n: 'Refresh Token Rotation', d: 'Each refresh token use issues a new token and invalidates the old — detects theft via reuse detection.' },
      ],
      when: 'Use OAuth2 whenever users authenticate via third-party IdP or when delegating access across services. Use OIDC when you need user identity (who they are). Use Client Credentials for service-to-service.',
      trade: 'Adds complexity and external IdP dependency. Auth server outage = no logins. Mitigate with managed services (Auth0, Cognito, Clerk). Token revocation is hard with short-lived JWTs — use refresh token revocation as the control point.',
      code: 'const crypto = require(\'crypto\');\n\n// Step 1: Generate PKCE code_verifier and code_challenge\nconst code_verifier = crypto.randomBytes(32).toString(\'base64url\');\nconst code_challenge = crypto\n  .createHash(\'sha256\')\n  .update(code_verifier)\n  .digest(\'base64url\');\n\n// Step 2: Build authorization URL (redirect user here)\nconst authUrl = new URL(\'https://accounts.google.com/o/oauth2/v2/auth\');\nauthUrl.searchParams.set(\'client_id\', process.env.GOOGLE_CLIENT_ID);\nauthUrl.searchParams.set(\'redirect_uri\', \'https://app.example.com/callback\');\nauthUrl.searchParams.set(\'response_type\', \'code\');\nauthUrl.searchParams.set(\'scope\', \'openid profile email\');\nauthUrl.searchParams.set(\'state\', crypto.randomBytes(16).toString(\'hex\'));\nauthUrl.searchParams.set(\'code_challenge\', code_challenge);\nauthUrl.searchParams.set(\'code_challenge_method\', \'S256\');\n\n// Step 3: Exchange authorization code for tokens (server-side)\nasync function exchangeCode(code, code_verifier) {\n  const params = new URLSearchParams({\n    grant_type: \'authorization_code\',\n    client_id: process.env.GOOGLE_CLIENT_ID,\n    client_secret: process.env.GOOGLE_CLIENT_SECRET,\n    redirect_uri: \'https://app.example.com/callback\',\n    code,\n    code_verifier, // Server verifies SHA256(code_verifier) === stored code_challenge\n  });\n\n  const res = await fetch(\'https://oauth2.googleapis.com/token\', {\n    method: \'POST\',\n    headers: { \'Content-Type\': \'application/x-www-form-urlencoded\' },\n    body: params,\n  });\n\n  const { access_token, refresh_token, id_token } = await res.json();\n  return { access_token, refresh_token, id_token };\n}',
      rw: {
        ex: ['Google OAuth', 'GitHub Apps', 'Auth0', 'AWS Cognito', 'Clerk', 'Stripe Connect'],
        cs: 'Stripe Connect uses OAuth 2.0 to let platforms (Shopify, WooCommerce) collect payments on behalf of merchants. The merchant authorizes Stripe to share their account — scoped tokens allow charging customers but not withdrawing to different bank accounts. The access token has explicit scopes that prevent privilege escalation.',
      },
    },
    interview: {
      q: 'Explain Authorization Code + PKCE. Why is PKCE essential for SPAs and what attack does it prevent?',
      a: 'Auth Code + PKCE flow: App generates random code_verifier, computes code_challenge = BASE64URL(SHA256(code_verifier)), sends challenge to auth server in authorization request. Auth server redirects back with one-time code. App exchanges code + original code_verifier for tokens — server-to-server. Auth server re-computes SHA256(code_verifier) and verifies it matches the stored challenge. PKCE prevents authorization code interception attacks: if an attacker intercepts the code (via redirect hijack, browser history, or malicious app on mobile), they cannot exchange it without the code_verifier which never left the originating app. SPAs cannot store client_secret (it would be public in browser bundle), making PKCE the only secure mechanism for public clients.',
      fu: [
        'What is the difference between OAuth 2.0 and OIDC?',
        'Where should access tokens and refresh tokens be stored in a browser app?',
        'How does refresh token rotation detect token theft?',
        'What is the difference between scope and claims in OAuth?',
      ],
    },
  },
  {
    id: 'auth-jwt',
    cat: 'security',
    color: '#ef4444',
    icon: '🎟️',
    title: 'JWT vs Session Tokens',
    tag: 'Stateless vs stateful authentication — the trade-off every architect must know',
    overview: 'JWT (JSON Web Token) is a self-contained, cryptographically signed token — the server validates it locally with no database lookup. Session tokens are opaque random IDs referencing server-side state in Redis or a database. The choice between them determines your scalability, logout capability, and security posture.',
    components: [
      {
        name: 'JWT Header',
        icon: '📋',
        role: 'Declares the signing algorithm and token type',
        detail: 'Base64url-encoded JSON: { "alg": "RS256", "typ": "JWT" }. NEVER trust alg from an incoming token — always specify the expected algorithm in your verify() call. The alg:none attack exploits libraries that read the alg field from the token itself and skip signature verification.',
      },
      {
        name: 'JWT Payload',
        icon: '📦',
        role: 'Contains claims — sub, iat, exp, roles — base64url encoded, NOT encrypted',
        detail: 'Anyone can decode the payload with atob(). Do not store sensitive data (SSN, PII, secrets) in a JWT payload unless using JWE (JSON Web Encryption). Standard claims: sub (subject/user ID), iat (issued at), exp (expiry Unix timestamp), jti (unique token ID for revocation). Custom claims: roles, permissions, tenant.',
      },
      {
        name: 'JWT Signature',
        icon: '✍️',
        role: 'Cryptographic proof the token was issued by your server and was not tampered with',
        detail: 'HMAC-SHA256 (HS256) uses a shared secret — both issuer and verifier must have the same secret. RS256 uses RSA private key to sign and public key to verify — better for microservices (each service only needs the public key, not the secret). ECDSA (ES256) is faster than RSA with equivalent security.',
      },
      {
        name: 'Session ID',
        icon: '🪪',
        role: 'Random UUID stored in httpOnly cookie — opaque reference to server-side state',
        detail: 'Typically 128–256 bits of cryptographic randomness. Stored in an httpOnly, Secure, SameSite=Strict cookie — inaccessible to JavaScript, transmitted only over HTTPS, not sent cross-site. The ID itself reveals nothing about the user; all user data lives in the server-side session store.',
      },
      {
        name: 'Session Store',
        icon: '🗄️',
        role: 'Redis preferred — sub-millisecond lookup, instant revocation by deleting the record',
        detail: 'Redis is the canonical choice: O(1) GET on session_id, TTL-based auto-expiry, atomic operations. Enables instant revocation (DEL session:{id}), multi-device management (one key per device), and session metadata storage. Add Redis Sentinel or Cluster for HA — session store outage = all users logged out.',
      },
    ],
    howItWorks: 'JWT: 1. User logs in. 2. Server creates JWT: header.payload.signature — signs with private key (RS256) or shared secret (HS256). 3. Client stores JWT in httpOnly cookie or memory (NOT localStorage). 4. Every request: client sends JWT in Authorization: Bearer header. 5. Server verifies signature locally — no DB call, O(1). 6. Token expires (15 min). Client uses refresh token to get new access token silently. Cannot revoke before expiry without a blocklist. Session: 1. User logs in. 2. Server creates random session_id, stores {userId, roles, metadata} in Redis with TTL. 3. Sends session_id in httpOnly Secure SameSite=Strict cookie. 4. Every request: server reads session_id from cookie, looks up Redis (sub-ms). 5. Logout: DEL session:{id} from Redis — instant, complete revocation. 6. Multi-device: each device has its own session key; invalidate individually or all at once.',
    decision: {
      choose: [
        'JWT: Stateless microservices — each service validates tokens independently without shared state',
        'JWT: Third-party API consumers where you cannot rely on a shared session store',
        'Sessions: Banking/healthcare apps requiring instant logout and multi-device session management',
        'Sessions: Admin panels where a compromised account must be locked out immediately',
      ],
      avoid: [
        'JWT with long expiry (>1 hour) without a revocation mechanism',
        'Storing sensitive data in JWT payload — it is base64, not encrypted; use JWE if needed',
        'Sessions when services are geographically distributed with no shared Redis',
      ],
      vs: [
        {
          name: 'JWT RS256',
          when: 'Microservices: auth server signs with private key, each service validates with public key — no shared secret.',
        },
        {
          name: 'JWT HS256',
          when: 'Simpler single-service setup. Shared secret. Riskier if secret leaks.',
        },
        {
          name: 'Opaque Session',
          when: 'Web apps needing instant revocation. Redis lookup adds ~1ms but enables full session control.',
        },
      ],
    },
    failures: [
      {
        name: 'JWT in localStorage',
        cause: 'Developer stored JWT in localStorage for convenience or to avoid cookie complexity',
        symptom: 'XSS attack injects a script that reads localStorage and exfiltrates the token to an attacker-controlled server',
        fix: 'Store tokens in httpOnly cookies (inaccessible to JS) or in-memory only. Never localStorage or sessionStorage.',
        severity: 'critical',
      },
      {
        name: 'alg:none attack',
        cause: 'JWT library trusts the alg field from the incoming token header instead of enforcing the expected algorithm',
        symptom: 'Attacker strips the signature, sets alg:none in the header, and the server accepts the unsigned token as valid',
        fix: 'Always pass the expected algorithm explicitly to verify() — never allow the library to auto-detect it from the token. Pin to RS256 or HS256.',
        severity: 'critical',
      },
      {
        name: 'No exp claim',
        cause: 'Developer forgot to set token expiry, or set it to an unreasonably large value',
        symptom: 'A leaked or stolen token remains valid indefinitely — no time-bound on the attack window',
        fix: 'Always set exp. Use short-lived access tokens (15 min) paired with refresh tokens. Treat missing exp as invalid.',
        severity: 'critical',
      },
      {
        name: 'Weak HS256 secret',
        cause: 'Short, predictable, or hardcoded HMAC secret used to sign tokens',
        symptom: 'Attacker collects a JWT, runs offline brute-force against the HMAC secret, forges tokens for any user ID',
        fix: 'Use RS256 (asymmetric — no shared secret to steal) or generate a 256-bit cryptographically random secret for HS256. Rotate regularly.',
        severity: 'critical',
      },
    ],
    a: {
      v: 'Passport vs Library Card',
      t: 'A JWT is a passport — self-contained, verified by anyone with the public key, works across borders (microservices), but if stolen, works until expiry. A session token is a library card — just a reference number; the library (server) holds all info and can cancel the card instantly.',
      tx: 'Passports are great for international travel (distributed systems). Library cards are great for instant revocation when a card is reported stolen.',
      s: 'JWT: verify signature → no DB. Session: lookup Redis → get user state',
    },
    te: {
      def: 'JWT (RFC 7519) is a compact, URL-safe, cryptographically signed token encoding JSON claims. Sessions are server-side state records referenced by an opaque ID in a cookie. The core trade-off: JWT = stateless + scalable + no revocation; Sessions = stateful + revocable + Redis dependency.',
      types: [
        { n: 'RS256 JWT', d: 'Asymmetric. Auth server signs with private key; resource servers verify with public key. No shared secret exposure.' },
        { n: 'HS256 JWT', d: 'Symmetric shared secret. Simpler but riskier — any service that can verify can also forge tokens.' },
        { n: 'Opaque Session', d: 'Random ID maps to server-side state in Redis. Instant revocation. 1ms lookup overhead.' },
        { n: 'Sliding Session', d: 'Session TTL resets on each request — user stays logged in while active. Risk: sessions never expire for active attackers.' },
      ],
      when: 'JWT for stateless APIs, microservices, mobile. Sessions for web apps requiring instant logout, device management, or regulatory compliance (HIPAA, PCI DSS mandate session control).',
      trade: 'JWT: cannot revoke without blocklist (Redis check per request = same as sessions). Payload bloat on every request. Clock skew between servers causes exp validation issues (use nbf + leeway). Sessions: Redis is a critical dependency; add replica + sentinel. Cross-datacenter session reads add latency.',
      code: 'const jwt = require(\'jsonwebtoken\');\nconst fs = require(\'fs\');\n\nconst privateKey = fs.readFileSync(\'private.pem\');\nconst publicKey = fs.readFileSync(\'public.pem\');\n\n// Sign a JWT with RS256 — private key stays on auth server only\nfunction issueToken(userId, roles) {\n  return jwt.sign(\n    { sub: userId, roles, jti: crypto.randomUUID() },\n    privateKey,\n    { algorithm: \'RS256\', expiresIn: \'15m\', issuer: \'auth.example.com\' }\n  );\n}\n\n// Verify — resource server only needs the PUBLIC key\n// ALWAYS specify algorithms — never let the library read alg from the token\nfunction verifyToken(token) {\n  return jwt.verify(token, publicKey, {\n    algorithms: [\'RS256\'], // Explicit allowlist — prevents alg:none attack\n    issuer: \'auth.example.com\',\n  });\n}\n\n// The alg:none attack — what happens without algorithm pinning:\n// Attacker crafts: header={alg:none} + payload={sub:admin} + empty signature\n// Vulnerable library: reads alg from token, skips verification, accepts it\n// Safe library with algorithms:[\'RS256\']: rejects — alg:none not in allowlist\n\n// Token that would be crafted by attacker:\nconst maliciousHeader = Buffer.from(JSON.stringify({ alg: \'none\', typ: \'JWT\' })).toString(\'base64url\');\nconst maliciousPayload = Buffer.from(JSON.stringify({ sub: \'admin\', roles: [\'superadmin\'] })).toString(\'base64url\');\nconst maliciousToken = maliciousHeader + \'.\' + maliciousPayload + \'.\'; // No signature\n// verifyToken(maliciousToken) throws: "invalid algorithm" — protected.',
      rw: {
        ex: ['Auth0 (JWTs)', 'Firebase Auth (JWTs)', 'GitHub web sessions (opaque)', 'Django (sessions)', 'Rails (sessions)', 'Next-Auth (configurable)'],
        cs: 'GitHub uses opaque session tokens (not JWTs) for web sessions — this lets them instantly invalidate sessions when a leaked token is reported via HackerOne. However GitHub Actions workflow tokens are JWTs: short-lived (job duration), scoped to exactly the permissions declared in the workflow yaml, and signed by GitHub. Two different tools for two different problems.',
      },
    },
    interview: {
      q: 'Your banking app uses JWTs with 24-hour expiry. A user reports their phone stolen. How do you invalidate their token immediately?',
      a: 'Pure stateless JWTs cannot be revoked before expiry — this is a fundamental design limitation. Solutions in order of preference: 1. Keep JWT expiry very short (15 min) + use refresh tokens stored server-side. Revoke the refresh token in Redis — the user cannot get new access tokens after their current one expires in 15 min. 2. JWT blocklist: store the jti (JWT ID) in Redis with TTL matching token lifetime. Every validation checks the blocklist. This adds one Redis lookup per request — effectively making JWTs stateful, which defeats their purpose for a single service. 3. For a banking app specifically: use sessions. The 1ms Redis lookup per request is trivially cheap; instant revocation is non-negotiable. The right architecture: short-lived JWTs for API calls between microservices (inter-service auth), sessions for user-facing web sessions (revocability).',
      fu: [
        'What is the alg:none JWT vulnerability and how do you prevent it?',
        'Why is localStorage dangerous for token storage?',
        'How does refresh token rotation detect if a refresh token was stolen?',
        'How do you handle clock skew when validating JWT expiry across distributed servers?',
      ],
    },
  },
];
