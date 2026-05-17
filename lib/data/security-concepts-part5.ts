import { Concept } from '../types';

export const SECURITY_CONCEPTS_PART5: Concept[] = [
  {
    id: 'auth-api-security',
    cat: 'security',
    color: '#ef4444',
    icon: '🛡️',
    title: 'API Security',
    tag: 'Securing APIs at every layer — BOLA, rate limiting, HMAC signing',
    overview: 'APIs are the primary attack surface of modern applications. API security requires defense in depth: TLS for transport, authentication for identity, rate limiting for availability, input validation to prevent injection, authorization on every resource access, and filtered responses to prevent data leakage. The OWASP API Security Top 10 documents the most common failures — BOLA is the #1 vulnerability, present in the vast majority of APIs.',
    components: [
      {
        name: 'BOLA Prevention',
        icon: '🚫',
        role: 'Broken Object Level Authorization — verify resource ownership on every endpoint',
        detail: 'if resource.userId !== req.user.id → 403 — the most common API vulnerability',
      },
      {
        name: 'Rate Limiting',
        icon: '⏱️',
        role: 'by IP + user ID + endpoint — 5 attempts/min on auth, 100/min on API',
        detail: 'use Redis sliding window counter — return 429 with Retry-After header',
      },
      {
        name: 'Input Validation',
        icon: '✅',
        role: 'Zod/Joi/Pydantic schema validation at every API boundary',
        detail: 'reject unexpected fields — prevent mass assignment and injection',
      },
      {
        name: 'Response DTO',
        icon: '📤',
        role: 'explicitly define returned fields — never serialize raw DB rows',
        detail: 'prevent accidental PII/internal data exposure',
      },
      {
        name: 'HMAC Request Signing',
        icon: '✍️',
        role: 'Stripe pattern: sign request body + timestamp with HMAC-SHA256',
        detail: 'receiver verifies — prevents replay attacks and ensures payload integrity',
      },
    ],
    howItWorks: 'Defense in depth — every request passes through security layers in order: 1. TLS (HTTPS): all traffic encrypted. 2. Rate limiting: Redis-based sliding window counter keyed by IP:endpoint — block early before processing. 3. Authentication: validate JWT signature, expiry, issuer. Or verify API key against hash in DB. 4. Input validation: Zod schema on request body — reject unknown fields (prevents mass assignment), validate types and lengths (prevents some injection). 5. Authorization — BOLA check: fetch resource, verify ownership. BFLA check: verify user role has permission for this operation. 6. Business logic: process the request. 7. Response filtering: serialize to DTO — only return fields the API contract specifies. Never return password_hash, internal IDs, other users data. HMAC webhook signing (Stripe pattern): sender computes: signature = HMAC-SHA256(timestamp + . + request_body, webhook_secret). Sends in header: Stripe-Signature: t=timestamp,v1=signature. Receiver recomputes HMAC and compares. Also validates timestamp is within 5 minutes (prevents replay). This ensures webhooks actually came from Stripe and were not tampered in transit. Mass assignment: POST /users with body {name:Alice, isAdmin:true} — if server does User.update(req.body), user becomes admin. Fix: use explicit allowlist of fields, never spread req.body onto model.',
    failures: [
      {
        name: 'BOLA (Broken Object Level Authorization)',
        cause: 'endpoint checks authentication but not resource ownership — symptom: GET /api/invoices/456 returns invoice belonging to user 456 when authenticated as user 123',
        symptom: 'GET /api/invoices/456 returns another user\'s invoice — attacker iterates IDs to harvest all user data',
        fix: 'every data endpoint must verify resource.userId === req.user.id — return 403 if not',
        severity: 'critical',
      },
      {
        name: 'Mass Assignment',
        cause: 'binding all request body fields to model without allowlist',
        symptom: 'attacker sends {name:Alice, isAdmin:true, credits:99999} in profile update — gets admin privileges',
        fix: 'whitelist accepted fields explicitly; never Object.assign(user, req.body)',
        severity: 'critical',
      },
      {
        name: 'Excessive Data Exposure',
        cause: 'returning entire DB row in API response',
        symptom: 'profile endpoint returns password_hash, internal_notes, other_user_ids — attacker harvests sensitive data',
        fix: 'create response DTOs — explicitly define what each endpoint returns',
        severity: 'high',
      },
      {
        name: 'No rate limiting on auth endpoints',
        cause: 'no throttling on /login, /forgot-password, /verify-otp',
        symptom: 'attacker attempts 10M passwords or OTP codes — brute forces credentials or MFA',
        fix: '5 attempts/min by IP, exponential backoff, CAPTCHA after 3 failures, alert on >50 failures/min',
        severity: 'high',
      },
    ],
    decision: {
      choose: [
        'Rate limiting at the API gateway layer (not just app code) — fail early before hitting compute',
        'HMAC signing for webhooks and B2B APIs where request integrity must be verifiable',
        'Schema validation on every endpoint input — make valid schemas explicit, reject everything else',
        'Structured security logging: every auth failure, every 403, every rate limit hit — log request ID, user ID, resource, reason',
      ],
      avoid: [
        'Trusting any client-supplied data for authorization decisions',
        'Returning raw database models in API responses',
        'Relying on obscurity (unguessable IDs) as an authorization substitute',
        'Generic error messages that leak implementation details (stack traces, SQL errors)',
      ],
      vs: [
        {
          name: 'API Keys',
          when: 'Server-to-server. Hash the key in DB (SHA256 lookup), never store plaintext. Rotate on exposure.',
        },
        {
          name: 'Bearer JWT',
          when: 'User-facing APIs. Short-lived access tokens validated by signature. Scale without DB call.',
        },
        {
          name: 'mTLS',
          when: 'High-security B2B APIs (financial, healthcare). Client certificate authentication. Most secure but highest setup complexity.',
        },
      ],
    },
    a: {
      v: 'Restaurant with Multiple Security Checkpoints',
      t: 'API security is like a restaurant with multiple checkpoints: doorman checks reservation (authentication), host checks you are at the right table not someone else seat (BOLA), waiter limits how many dishes you can order (rate limiting), kitchen validates the order makes sense (input validation), food runner only brings what you ordered not the whole menu (response filtering). Skip any checkpoint and the system breaks.',
      tx: 'No single security layer is sufficient — attackers probe each one independently. Authentication without authorization = BOLA. Authorization without input validation = injection. All of these without rate limiting = brute force. Defense in depth means every layer has one job.',
      s: 'TLS → Auth → Rate limit → Validate input → Authorize per resource → Filter response',
    },
    te: {
      def: 'API security is the set of controls protecting APIs from unauthorized access, data theft, abuse, and manipulation — including authentication, per-resource authorization (BOLA prevention), rate limiting, input validation, and response filtering.',
      types: [
        { n: 'BOLA/IDOR prevention', d: 'resource-level ownership check on every endpoint' },
        { n: 'Mass Assignment protection', d: 'explicit field allowlisting — never bind full request body to model' },
        { n: 'Rate Limiting', d: 'Redis sliding window by IP + user + endpoint' },
        { n: 'HMAC Request Signing', d: 'webhook and B2B API integrity — timestamp + body signed with shared secret' },
      ],
      when: 'Apply all API security controls from the first API endpoint. Retrofitting security is exponentially harder than building it in. Use API gateway (AWS API Gateway, Kong) for rate limiting and auth validation; use middleware for BOLA and input validation.',
      trade: 'Each security layer adds a small amount of processing time: Redis rate limit check (~1ms), schema validation (~1ms), auth token validation (~1ms). Total overhead: 3-5ms — completely acceptable. The alternative (no security) costs $10M+ in breach costs. Use API gateway to handle rate limiting and TLS at the network edge before requests reach application code.',
      code: 'import express from \'express\';\nimport helmet from \'helmet\';\nimport rateLimit from \'express-rate-limit\';\nimport { createHmac, timingSafeEqual } from \'crypto\';\nimport { z } from \'zod\';\n\nconst app = express();\napp.use(helmet()); // Security headers\napp.use(express.json());\n\n// Rate limiting on auth endpoint\nconst authLimiter = rateLimit({\n  windowMs: 60 * 1000, // 1 minute\n  max: 5, // 5 attempts/min\n  message: { error: \'Too many attempts\', retryAfter: 60 },\n  standardHeaders: true,\n});\n\n// Input validation schema\nconst UpdateProfileSchema = z.object({\n  name: z.string().min(1).max(100),\n  bio: z.string().max(500).optional(),\n  // isAdmin NOT here — prevents mass assignment\n});\n\n// BOLA check middleware\nasync function assertOwnership(req, res, next) {\n  const resource = await db.findById(req.params.id);\n  if (!resource) return res.status(404).json({ error: \'Not found\' });\n  if (resource.userId !== req.user.id) return res.status(403).json({ error: \'Forbidden\' });\n  req.resource = resource;\n  next();\n}\n\napp.post(\'/auth/login\', authLimiter, async (req, res) => {\n  // login logic\n});\n\napp.patch(\'/api/profile/:id\', authenticate, assertOwnership, async (req, res) => {\n  const parsed = UpdateProfileSchema.safeParse(req.body);\n  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });\n  const updated = await db.updateProfile(req.params.id, parsed.data); // only allowlisted fields\n  // Response DTO — never return raw DB row\n  return res.json({ id: updated.id, name: updated.name, bio: updated.bio });\n});\n\n// HMAC webhook verification (Stripe pattern)\nfunction verifyWebhook(payload: string, sigHeader: string, secret: string): boolean {\n  const [tPart, v1Part] = sigHeader.split(\',\');\n  const timestamp = tPart.replace(\'t=\', \'\');\n  const received = v1Part.replace(\'v1=\', \'\');\n  // Replay attack prevention: reject if >5 minutes old\n  if (Date.now() / 1000 - parseInt(timestamp) > 300) return false;\n  const expected = createHmac(\'sha256\', secret)\n    .update(timestamp + \'.\' + payload)\n    .digest(\'hex\');\n  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));\n}',
      rw: {
        ex: [
          'Stripe (HMAC webhook signing)',
          'AWS API Gateway (rate limiting + auth)',
          'Kong (API gateway)',
          'Cloudflare WAF (DDoS + injection)',
          'GitHub (API keys + OAuth scopes)',
          'Twilio (HMAC request validation)',
        ],
        cs: 'Peloton API (2021): security researcher found that unauthenticated requests to /api/user/{userId} returned private user profiles — age, city, workout history, weight, and gender — for any user ID without any authentication. The API had authentication on some endpoints but not this one. It was not just an authorization failure — it was a complete authentication bypass. 3M+ users potentially affected. Root cause: likely a missing authentication middleware on that specific route. Fix: authentication and authorization middleware should be applied globally with explicit exclusions for public endpoints, not added per-endpoint where they can be forgotten.',
      },
    },
    interview: {
      q: 'Walk me through the API security layers you would implement for a fintech API handling payment operations.',
      a: 'For a fintech payment API, defense in depth is non-negotiable. Layer by layer: 1. Transport: TLS 1.3 everywhere. HSTS header. No plain HTTP even internally. 2. Rate limiting: API gateway enforces: 100 req/min for general endpoints, 5 req/min for payment initiation, 3 attempts/min for PIN verification. Redis-backed, by user ID not just IP (VPN users share IPs). 3. Authentication: For user-facing: short-lived JWT (15 min) via RS256. For B2B partners: mTLS client certificates — strongest. For webhooks we send: HMAC-SHA256 signed payloads with timestamp (Stripe pattern). 4. Input validation: Zod schemas on every endpoint. Payment amount: BIGINT cents only (no floats). Reject unknown fields (prevents mass assignment). 5. Authorization — two levels: BFLA: requireRole(payment_initiator) middleware. BOLA: verify payment.accountId belongs to authenticated user before processing. 6. Idempotency: every payment endpoint requires Idempotency-Key header — stored in Redis, returns cached response for duplicate requests (prevents double-charge). 7. Response filtering: response DTOs never include internal account IDs, processing fees, risk scores, or other accounts in the same organization. 8. Audit logging: every payment attempt logged with request ID, user, amount, result, and all authorization decisions. Ingested into SIEM with alerts on unusual patterns (large amount, new beneficiary, unusual hours).',
      fu: [
        'What is the difference between BOLA and BFLA in the OWASP API Security Top 10?',
        'How does HMAC request signing prevent replay attacks?',
        'What is the difference between CORS and CSRF and how do you mitigate each?',
        'How do you design rate limiting that is fair to legitimate users while blocking attacks?',
      ],
    },
  },
  {
    id: 'auth-secret-mgmt',
    cat: 'security',
    color: '#ef4444',
    icon: '🗝️',
    title: 'Secret Management',
    tag: 'Keeping API keys, DB passwords, and certificates out of code — and out of attackers hands',
    overview: 'Secret management is the discipline of storing, distributing, rotating, and auditing sensitive values — API keys, database credentials, TLS certificates, encryption keys — without ever committing them to source code or exposing them in logs. A single hardcoded credential can compromise an entire production system: GitHub secret scanning bots find exposed credentials within 4 minutes of a public commit on average.',
    components: [
      {
        name: 'Secret Store',
        icon: '🏦',
        role: 'HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager',
        detail: 'encrypted at rest via KMS, access-controlled via IAM policies, every read audited in CloudTrail/Vault audit log',
      },
      {
        name: 'Dynamic Secrets',
        icon: '⏳',
        role: 'Vault generates temporary DB credentials per-service with 1-hour TTL',
        detail: 'automatically revoked after TTL — no long-lived DB passwords exist anywhere',
      },
      {
        name: 'Secret Rotation',
        icon: '🔄',
        role: 'AWS Secrets Manager rotates RDS passwords automatically',
        detail: 'old secret valid during rotation window — zero-downtime credential cycling',
      },
      {
        name: 'Envelope Encryption',
        icon: '📦',
        role: 'DEK per secret encrypted by KEK in KMS',
        detail: 'compromising one DEK exposes one secret, not the key hierarchy',
      },
      {
        name: 'Audit Trail',
        icon: '📋',
        role: 'every secret read/write logged with timestamp, caller identity, and source IP',
        detail: 'essential for SOC2, PCI DSS, HIPAA compliance and incident reconstruction',
      },
    ],
    howItWorks: 'Three patterns in order of maturity: Pattern 1 — Environment variables (minimum viable): secrets in OS env vars, injected at deploy time by CI/CD. Never in .env files committed to git. Limitation: no rotation, no audit, rotations require redeployment. Pattern 2 — Static secrets in manager: app calls AWS Secrets Manager at startup, fetches secret value, caches in memory. Rotation: AWS rotates automatically, app polls for new value or uses rotation hook (Lambda updates secret + restarts app). Limitation: secret still exists as a long-lived value, compromise window = rotation period. Pattern 3 — Dynamic secrets (HashiCorp Vault): 1. Service authenticates to Vault using its Kubernetes service account JWT (Vault K8s auth method). 2. Vault verifies the JWT against the K8s API server. 3. Vault generates a unique DB username+password valid for 1 hour (PostgreSQL dynamic secrets engine calls CREATE ROLE). 4. Service uses credentials. 5. After TTL: Vault calls DROP ROLE — credential no longer exists in the DB. Even if the service is compromised and credentials stolen, they expire in 1 hour. Envelope encryption for application-level encryption: 1. Generate random 32-byte DEK for each record group or S3 bucket. 2. Encrypt data with AES-256-GCM(DEK). 3. Encrypt DEK with KMS.Encrypt(KEK_id, DEK). 4. Store encrypted DEK alongside encrypted data. 5. To read: KMS.Decrypt(encrypted_DEK) → DEK → decrypt data. 6. Key rotation: KMS.ReEncrypt(encrypted_DEK, new_KEK_id) — no need to re-encrypt all data. Every KMS call logged in CloudTrail.',
    failures: [
      {
        name: 'Hardcoded secrets in source code',
        cause: 'developer committed DB password or API key',
        symptom: 'GitHub bots find it within 4 minutes; attacker has prod access',
        fix: 'pre-commit hooks (detect-secrets, gitleaks) block commits with high-entropy strings; rotate immediately on exposure; move to Secrets Manager',
        severity: 'critical',
      },
      {
        name: 'Secrets in application logs',
        cause: 'logging request/response objects that contain auth headers or body with credentials',
        symptom: 'log aggregation system (Datadog, CloudWatch) stores credentials in plaintext; often shared broadly',
        fix: 'redact sensitive fields before logging; never log Authorization headers; use structured logging with explicit field inclusion',
        severity: 'critical',
      },
      {
        name: 'Long-lived static credentials with no rotation',
        cause: 'DB password set once, never rotated because rotation requires downtime',
        symptom: 'breach from years ago is discovered only now because credentials were never cycled',
        fix: 'automate rotation with AWS Secrets Manager + RDS integration; implement dual-credential rotation (new password created, both valid briefly, old retired)',
        severity: 'high',
      },
    ],
    decision: {
      choose: [
        'AWS Secrets Manager for AWS-native workloads with automatic RDS rotation',
        'HashiCorp Vault for multi-cloud or on-premise with dynamic secrets (gold standard)',
        'Pre-commit hooks on every developer machine to prevent accidental secret commits',
        'IRSA/Workload Identity for K8s — pods authenticate to Secrets Manager using their service account, no static credentials needed',
      ],
      avoid: [
        '.env files in git repositories — even private repos have breach risk and are often shared',
        'Logging secrets even at debug level — logs are broadly accessible and often not encrypted at rest',
        'Long TTL on dynamic secrets — 1 hour max for DB credentials, 15 minutes for particularly sensitive ops',
      ],
      vs: [
        {
          name: 'AWS Secrets Manager',
          when: 'AWS workloads. Built-in RDS/Redshift rotation. $0.40/secret/month. Simple SDK.',
        },
        {
          name: 'HashiCorp Vault',
          when: 'Multi-cloud, on-premise, or dynamic secrets needed. More complex ops but most powerful.',
        },
        {
          name: 'Doppler',
          when: 'Developer-friendly secrets sync to AWS/GCP/Heroku. Good for small teams transitioning from .env.',
        },
      ],
    },
    a: {
      v: 'Bank Vault with Visitor Log',
      t: 'Secrets management is like a bank vault with a strict visitor log. You never photocopy your valuables and leave copies around the office — you keep them locked, grant time-limited access only when needed, log every visitor, and rotate the combination regularly. Dynamic secrets are even better: the vault generates a unique key for each visitor that only works for 1 hour then self-destructs.',
      tx: 'The goal is zero long-lived credentials in code, config files, or environment variables. Every secret has an owner, a TTL, and a complete audit trail. If any secret leaks, the blast radius is bounded by its TTL and its scope.',
      s: 'App → Vault auth → Dynamic cred (TTL 1hr) → DB → Vault auto-revokes',
    },
    te: {
      def: 'Secret management is the systematic process of creating, distributing, storing, rotating, and auditing sensitive credentials and cryptographic keys — ensuring secrets are never exposed in source code, logs, or unauthorized systems, and every access is traceable.',
      types: [
        { n: 'Static Secrets in Manager', d: 'long-lived credentials in Secrets Manager, better than code but require rotation policy' },
        { n: 'Dynamic Secrets', d: 'Vault generates per-request short-lived credentials — minimizes breach impact' },
        { n: 'Envelope Encryption', d: 'DEK+KEK hierarchy — application-level encryption without key sprawl' },
        { n: 'Workload Identity', d: 'K8s IRSA/Workload Identity — pods authenticate via service account, no static credential needed' },
      ],
      when: 'Use a secret manager from day one — retrofitting is painful and risky. Rotate all secrets immediately on any exposure. Use dynamic secrets for any credential that supports it (databases, cloud providers, Vault-integrated services). Use workload identity wherever possible to eliminate static credentials entirely.',
      trade: 'Fetching secrets at startup adds 100-300ms (acceptable — cache in memory). KMS decrypt per data read: ~5ms (cache decrypted DEKs with short TTL). Dynamic secrets add operational dependency on Vault availability — run Vault in HA mode (3-node cluster, Raft storage). The complexity is the price of not having a breach cost you $10M+ and your company reputation.',
      code: 'import { SecretsManagerClient, GetSecretValueCommand } from \'@aws-sdk/client-secrets-manager\';\n\nconst client = new SecretsManagerClient({ region: \'us-east-1\' });\n\n// Fetch secret from AWS Secrets Manager at startup — cache in memory\nasync function getSecret(secretName: string): Promise<string> {\n  try {\n    const response = await client.send(\n      new GetSecretValueCommand({ SecretId: secretName })\n    );\n    if (response.SecretString) return response.SecretString;\n    throw new Error(\'Secret has no string value\');\n  } catch (err) {\n    console.error(\'Failed to fetch secret:\', secretName, err);\n    throw err;\n  }\n}\n\n// ANTI-PATTERN: secret in code or .env committed to git\n// const DB_PASSWORD = \'mypassword123\'; // NEVER\n// const DB_PASSWORD = process.env.DB_PASSWORD; // Better, but still static\n\n// PATTERN: fetch from Secrets Manager at startup\nlet dbPassword: string;\nasync function initApp() {\n  dbPassword = await getSecret(\'prod/myapp/db-password\');\n  // Now connect to DB with the fetched credential\n  // Rotate: AWS Secrets Manager auto-rotates — app polls or uses Lambda hook\n}\n\n// Dynamic secrets concept (HashiCorp Vault):\n// 1. App authenticates to Vault with K8s service account JWT\n// 2. Vault issues: { username: \'v-app-abc123\', password: \'xyz789\', ttl: \'1h\' }\n// 3. App uses credentials for 1 hour\n// 4. Vault auto-calls DROP ROLE v-app-abc123 after TTL\n// 5. Even if stolen, credentials self-destruct in ≤1 hour',
      rw: {
        ex: [
          'HashiCorp Vault (dynamic secrets, PKI, encryption as a service)',
          'AWS Secrets Manager (managed rotation + RDS integration)',
          'GCP Secret Manager (IAM-controlled, version management)',
          'Doppler (developer-friendly, CI/CD integration)',
          '1Password Secrets Automation (team-friendly)',
          'cert-manager (K8s TLS certificate lifecycle)',
        ],
        cs: 'Toyota Connected (2022): a subsidiary accidentally published source code containing hardcoded credentials to a public GitHub repository. The credentials gave access to customer data for 296,019 users. The repository had been public for 5 years before discovery. Prevention: 1. Pre-commit hook (gitleaks/detect-secrets) would have blocked the initial commit. 2. GitHub Advanced Security secret scanning would have alerted within minutes. 3. AWS CloudTrail would have showed unusual access patterns years earlier. 4. Dynamic secrets would have meant no long-lived credential existed to steal — only a 1-hour window of exposure even if the credential was found. The 5-year exposure was only possible because credentials never rotated and no audit monitoring was in place.',
      },
    },
    interview: {
      q: 'A junior engineer committed a database password to a public GitHub repo. It has been there for 3 hours. Walk through your complete incident response.',
      a: 'Treat this as a confirmed breach — assume the credential was read. Step 1 — Rotate immediately (do not investigate first — rotate first): Change the database password right now. This closes the active attack vector. Step 2 — Revoke and invalidate: Terminate all existing DB connections using the old password. Check for any other systems using this credential. Step 3 — Remove from git history: git filter-branch or BFG Repo Cleaner to purge the commit from history. Force-push. Note: GitHub caches content — contact GitHub support to clear their cache. The public internet may have already indexed it (Common Crawl, Wayback Machine). Step 4 — Audit access logs: Pull DB query logs for the 3-hour window. Look for: unusual source IPs, unusual query patterns (bulk SELECT *, DROP TABLE attempts, large data exports). Pull CloudTrail for S3/IAM activity if the DB had cross-service permissions. Step 5 — Assess blast radius: What data was in this database? Was it PII? Payment data? If yes: GDPR/PCI DSS breach notification requirements (notify within 72 hours for GDPR). Step 6 — Prevent recurrence: Add detect-secrets pre-commit hook to all developer machines. Enable GitHub Advanced Security secret scanning on all repositories (automatic alerts). Add to developer onboarding and security training. Move all production credentials to AWS Secrets Manager — no credentials in code or env files. Step 7 — Post-mortem (blameless): Why was there no secret management process? What tooling was missing? Remediate the process, not just this one instance.',
      fu: [
        'What is envelope encryption and how does AWS KMS implement it without ever exposing the master key?',
        'How do dynamic secrets in HashiCorp Vault reduce blast radius compared to static credentials?',
        'What is IRSA (IAM Roles for Service Accounts) and how does it eliminate static credentials for K8s pods?',
        'How do you prevent secrets from appearing in application logs?',
      ],
    },
  },
];
