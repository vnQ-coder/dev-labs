import { Concept } from '../types';

export const SECURITY_CONCEPTS_PART2: Concept[] = [
  {
    id: 'auth-tls',
    cat: 'security',
    color: '#ef4444',
    icon: '🔒',
    title: 'TLS & HTTPS Deep Dive',
    tag: 'How the padlock in your browser works — TLS handshake, certificates, and mTLS',
    overview:
      'TLS (Transport Layer Security) is the cryptographic protocol securing every HTTPS connection. It provides confidentiality (encrypted data), integrity (tamper detection), and server authentication (certificate verification). Understanding TLS deeply is essential for architects — it affects latency budgets, certificate lifecycle management, mTLS between microservices, and your overall security posture.',
    components: [
      {
        name: 'Certificate Authority',
        icon: '🏛️',
        role: 'Issues and signs X.509 certificates',
        detail:
          'Browser trust stores contain ~150 root CAs. Let Encrypt signs 3M+ certs/day free. CAs form a chain of trust: root CA signs intermediate CA, intermediate signs leaf cert. Browsers verify the entire chain.',
      },
      {
        name: 'X.509 Certificate',
        icon: '📜',
        role: 'Contains server identity and public key',
        detail:
          'Contains server domain in Subject Alternative Name (SAN), public key, CA digital signature, and validity period (max 398 days since 2020). The CA signature is verified using the CA public key embedded in the browser trust store.',
      },
      {
        name: 'TLS Handshake',
        icon: '🤝',
        role: 'Negotiates cipher suite and derives session keys',
        detail:
          'Authenticates server via certificate, negotiates encryption algorithm (cipher suite), and derives shared session keys via ECDHE — all in 1 round trip (TLS 1.3). TLS 1.2 required 2 round trips.',
      },
      {
        name: 'ECDHE (Ephemeral Diffie-Hellman)',
        icon: '🔑',
        role: 'Key exchange enabling Perfect Forward Secrecy',
        detail:
          'Both sides compute the same session key without transmitting it. Ephemeral key pairs are generated per session and discarded immediately after the handshake. Even if the server private key is stolen years later, past sessions cannot be decrypted.',
      },
      {
        name: 'mTLS (Mutual TLS)',
        icon: '🔐',
        role: 'Bidirectional certificate authentication',
        detail:
          'Both client AND server present certificates. Standard for service-to-service auth in microservices. Istio automatically issues SPIFFE-format certificates to every pod — providing service identity, not user identity. Envoy sidecar proxies handle the TLS transparently.',
      },
    ],
    howItWorks:
      'TLS 1.3 Handshake (1-RTT):\n\n1. Client sends ClientHello: max TLS version (1.3), supported cipher suites, random nonce, key_share (ECDH public key).\n\n2. Server sends ServerHello: chosen cipher (TLS_AES_256_GCM_SHA384), its ECDH public key, certificate chain.\n\n3. Both sides independently compute the same session key from ECDH:\n   session_key = ECDH(client_private, server_public) = ECDH(server_private, client_public)\n   Key is never transmitted.\n\n4. Server sends Finished (encrypted with session key — proves it holds the private key matching the certificate).\n\n5. Client verifies certificate chain: CA signature valid? Hostname matches SAN? Not expired? Not revoked (OCSP)?\n\n6. Client sends Finished.\n\n7. Encrypted application data flows.\n\nPerfect Forward Secrecy: ECDHE uses ephemeral key pairs — new ones per session, discarded immediately. Even if the server private key is stolen 5 years later, recorded past traffic cannot be decrypted.\n\nTLS 1.2 weakness: supported RSA key exchange (static — no PFS) and weak cipher suites (RC4, 3DES). TLS 1.3 removes all of these.\n\nmTLS: same process, but client also sends its certificate in step 2. Server verifies client cert against a trusted CA. Used by Istio to auto-issue SPIFFE-format certs to every pod — service identity, not user identity.',
    failures: [
      {
        name: 'Expired Certificate',
        cause: 'No automated renewal — cert expires after 1 year',
        symptom: 'Users see security error, site is completely inaccessible',
        fix: 'Use cert-manager in K8s (auto-renews Let Encrypt certs), AWS ACM (auto-renews), set monitoring alerts 30 days before expiry',
        severity: 'critical',
      },
      {
        name: 'Certificate for Wrong Domain',
        cause: 'Cert issued for api.example.com but site is www.example.com, or missing wildcard coverage',
        symptom: 'Browser rejects connection with hostname mismatch error',
        fix: 'Use Subject Alternative Names (SAN) covering all domains; wildcard *.example.com for subdomains',
        severity: 'high',
      },
      {
        name: 'Weak Cipher Suites Enabled',
        cause: 'Server still supports TLS 1.0, TLS 1.1, or RC4 cipher',
        symptom: 'BEAST, POODLE, SWEET32 attacks possible; PCI DSS non-compliance',
        fix: 'Enforce TLS 1.2 minimum (TLS 1.3 preferred), disable SSLv3/TLS 1.0/1.1, verify with ssllabs.com',
        severity: 'high',
      },
    ],
    decision: {
      choose: [
        'HTTPS everywhere — no exceptions, including internal APIs',
        'mTLS for service-to-service auth in microservices (let Istio/Envoy manage certificates automatically)',
        'TLS termination at load balancer to offload crypto from app servers',
        'Certificate pinning only for high-security mobile apps (careful: pinning breaks on cert rotation)',
      ],
      avoid: [
        'TLS 1.0/1.1 — deprecated, vulnerable to BEAST/POODLE',
        'Self-signed certs in production without a private CA (use Let Encrypt or ACM)',
        'Long-lived TLS session resumption without rotation (reduces forward secrecy benefit)',
      ],
      vs: [
        {
          name: 'TLS Termination at LB',
          when: 'Offload TLS from app servers. Internal traffic plain HTTP (acceptable if network is trusted and mTLS handles service auth).',
        },
        {
          name: 'End-to-End TLS',
          when: 'Compliance requirements (HIPAA, PCI DSS) mandate encryption in transit everywhere, including internal hops.',
        },
      ],
    },
    a: {
      v: 'Sealed Letter with Wax Seal',
      t: 'TLS is like sending a sealed letter through the post. The wax seal (certificate) proves it is from the real sender. The envelope (encryption) means only the recipient can read it. And a special invisible ink (ECDHE) means that even if someone stole the seal stamp later, they cannot read letters sent before.',
      tx: 'The genius of TLS is that encryption keys are negotiated without being transmitted — both parties independently compute the same key from public information (ECDH math). The key exchange is secure even over a wiretapped connection.',
      s: 'ClientHello → ServerHello + Cert → Verify CA → ECDHE key → AES-256-GCM data',
    },
    te: {
      def: 'TLS (Transport Layer Security) is a cryptographic protocol providing confidentiality (AES-256-GCM encryption), integrity (AEAD authentication tag), and server authentication (X.509 certificate verified against trusted CAs) over TCP connections.',
      types: [
        { n: 'TLS 1.3', d: 'Current standard — 1-RTT handshake, mandatory ECDHE for all key exchange, all weak ciphers removed, 0-RTT for repeat clients.' },
        { n: 'mTLS (Mutual TLS)', d: 'Both client and server present certificates — service mesh standard. Istio and Envoy automate cert issuance and rotation per pod.' },
        { n: 'TLS Termination', d: 'Load balancer decrypts TLS and forwards plain HTTP internally — reduces backend CPU load. Acceptable when internal network is trusted.' },
        { n: 'Certificate Pinning', d: 'Embed expected cert fingerprint in client app — prevents rogue CA attacks. Breaks on cert rotation — use with extreme care and a pin backup.' },
      ],
      when: 'TLS everywhere with no exceptions. Automate certificate issuance and renewal. Use mTLS for inter-service auth. Monitor cert expiry proactively. Test TLS configuration with ssllabs.com or testssl.sh.',
      trade: 'TLS 1.3 handshake adds ~1ms latency (mitigated by session resumption, HTTP/2 multiplexing, 0-RTT for repeat clients). mTLS adds certificate rotation complexity — automate with cert-manager or Istio CA. TLS CPU overhead is negligible on modern hardware with AES-NI hardware acceleration.',
      code:
        '# nginx: enforce TLS 1.3, HSTS, strong ciphers\nserver {\n  listen 443 ssl;\n  ssl_protocols TLSv1.3;          # TLS 1.3 only\n  ssl_prefer_server_ciphers off;  # let client pick from our list\n  ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256;\n  ssl_certificate     /etc/ssl/certs/example.com.crt;\n  ssl_certificate_key /etc/ssl/private/example.com.key;\n\n  # HSTS: tell browsers to use HTTPS for 1 year\n  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";\n}\n\n# Inspect certificate expiry date\nopenssl s_client -connect example.com:443 -servername example.com < /dev/null 2>/dev/null \\\n  | openssl x509 -noout -dates\n# notBefore=Jan  1 00:00:00 2025 GMT\n# notAfter =Mar 31 23:59:59 2026 GMT',
      rw: {
        ex: [
          'Cloudflare (TLS termination at 300+ PoPs)',
          'Let Encrypt (90-day auto-renewing certs)',
          'Istio (mTLS between all pods)',
          'AWS ACM (managed certs + auto-renewal)',
          'cert-manager (K8s TLS automation)',
        ],
        cs: 'Cloudflare terminates TLS at 300+ edge PoPs worldwide, then re-encrypts traffic to the origin using a private CA. Origins only need to trust Cloudflare CA — they are not exposed to the public internet. Cloudflare also supports mTLS for API zero-trust: only clients presenting a valid Cloudflare-issued client certificate can reach the origin. This eliminates credential-based attacks on APIs entirely.',
      },
    },
    interview: {
      q: 'Explain the TLS 1.3 handshake. What is Perfect Forward Secrecy and why does it matter practically?',
      a: 'TLS 1.3 handshake in one round trip: client sends ClientHello with its ECDH public key; server responds with ServerHello (chosen cipher), its ECDH public key, and its certificate chain. Both parties independently compute the same session key using the ECDH math — the key is never transmitted. Server sends Finished encrypted with this key, proving it holds the private key matching the certificate. Client verifies the certificate chain against its trusted CA store (signature valid, hostname matches SAN, not expired, not revoked via OCSP). Session is now encrypted with AES-256-GCM. Perfect Forward Secrecy: ECDHE uses ephemeral key pairs — a new pair is generated for every session and immediately discarded after the handshake. This means: if an attacker records all encrypted traffic today and later steals the server private key (breach, court order, key rotation mistake), they still cannot decrypt the recorded traffic — they would need the ephemeral session key which was never stored. This is the critical difference from older RSA key exchange where all past traffic could be retroactively decrypted with the stolen private key.',
      fu: [
        'What is SNI and why is it needed for virtual hosting?',
        'How does certificate transparency (CT) logging help detect rogue certificates?',
        'What is OCSP stapling and why is it better than live OCSP checks?',
        'How does Istio automatically issue and rotate mTLS certificates for microservices?',
      ],
    },
  },
  {
    id: 'auth-owasp',
    cat: 'security',
    color: '#ef4444',
    icon: '🛡️',
    title: 'OWASP Top 10 Vulnerabilities',
    tag: 'The 10 most critical web security risks — every Principal Engineer must know these cold',
    overview:
      'The OWASP Top 10 (2021 edition) is the authoritative reference for web application security risks. 94% of applications tested have some form of broken access control. Understanding these vulnerabilities — how they are exploited, detected, and prevented — is a baseline expectation for any engineer at Principal level or above.',
    components: [
      {
        name: 'A01 Broken Access Control',
        icon: '🚪',
        role: 'Most common — 94% of apps affected',
        detail:
          'Horizontal privilege escalation (IDOR/BOLA — accessing another user data by changing an ID) and vertical privilege escalation (BFLA — accessing higher-privilege functions). Fix: resource-level ownership check on every endpoint, not just route-level auth middleware.',
      },
      {
        name: 'A03 Injection',
        icon: '💉',
        role: 'Unsanitized input injected into interpreters',
        detail:
          'SQL, NoSQL, command, and LDAP injection via user input concatenated into queries or commands. Attacker can dump databases, bypass authentication, or execute OS commands. Fix: parameterized queries always, never string-concatenate user input into queries.',
      },
      {
        name: 'A03 XSS (Cross-Site Scripting)',
        icon: '📜',
        role: 'Malicious scripts injected into trusted web pages',
        detail:
          'Storing or reflecting unsanitized user input as HTML. Attacker injects script tags that steal session cookies, redirect users, or perform actions on their behalf. Fix: contextual output escaping (React does this by default), Content-Security-Policy header.',
      },
      {
        name: 'A07 Identification & Auth Failures',
        icon: '🔑',
        role: 'Weak authentication and session management',
        detail:
          'Weak passwords, missing MFA, no brute force protection, credential stuffing, insecure session tokens. Fix: Argon2id for password hashing, enforce MFA, rate-limit login endpoints, check passwords against breach databases (HaveIBeenPwned API).',
      },
      {
        name: 'A10 SSRF (Server-Side Request Forgery)',
        icon: '🌐',
        role: 'Server fetches attacker-controlled URLs',
        detail:
          'Server fetches user-supplied URLs without validation — attacker targets internal services or the cloud metadata endpoint (169.254.169.254) to steal IAM credentials. Fix: allowlist valid external domains, block RFC 1918 private IP ranges in all outbound HTTP requests.',
      },
    ],
    howItWorks:
      'Most exploited vulnerabilities in order of real-world impact:\n\nIDOR/BOLA: GET /api/orders/12345 — attacker changes ID to any number, gets another user\'s data because server only checks authentication, not resource ownership.\n\nSQL Injection: SELECT * FROM users WHERE id = \'' + 'userId\' — attacker sends: 1 OR 1=1, dumps entire table or bypasses auth.\n\nXSS Stored: attacker posts a comment with a script tag — every visitor who views the comment has their session cookie sent to the attacker\'s server.\n\nCSRF: attacker tricks a logged-in user into submitting a state-changing request (money transfer) — browser auto-sends cookies with the forged request.\n\nSSRF: image upload feature fetches the URL you provide — attacker provides http://169.254.169.254/latest/meta-data/iam/security-credentials/role — server returns AWS IAM credentials.\n\nMass Assignment: POST /users with {"name":"Alice","isAdmin":true} — if server binds all request fields to the model, user becomes admin.\n\nExcessive Data Exposure: GET /users/profile returns the entire user row including password_hash, SSN, internal_id — server should filter to a response DTO.',
    failures: [
      {
        name: 'SQL Injection',
        cause: 'String-concatenating user input into SQL query strings',
        symptom: 'Attacker dumps entire database, bypasses auth with OR 1=1, deletes data',
        fix: 'Always use parameterized queries (db.query($1, [value])) or ORMs — never concatenate',
        severity: 'critical',
      },
      {
        name: 'IDOR / BOLA',
        cause: 'Endpoint checks authentication but not resource ownership',
        symptom: 'Changing an order ID in the URL returns another user\'s private data',
        fix: 'After fetching: if (resource.userId !== req.user.id) return 403. Check on EVERY data endpoint.',
        severity: 'critical',
      },
      {
        name: 'XSS (Cross-Site Scripting)',
        cause: 'Rendering unsanitized user input as raw HTML in the browser',
        symptom: 'Script tag in user-submitted content executes for all subsequent visitors',
        fix: 'React escapes by default — avoid dangerouslySetInnerHTML. Set Content-Security-Policy header.',
        severity: 'critical',
      },
      {
        name: 'SSRF',
        cause: 'Server fetches user-supplied URLs without domain or IP validation',
        symptom: 'Attacker fetches internal services or AWS metadata endpoint to steal IAM credentials',
        fix: 'Allowlist valid external domains. Block RFC 1918 addresses (10.x, 172.16.x, 192.168.x, 169.254.x) in all outbound requests.',
        severity: 'critical',
      },
      {
        name: 'Mass Assignment',
        cause: 'Spreading entire request body onto model object without field whitelisting',
        symptom: 'Attacker adds isAdmin:true to a profile update request and escalates privilege',
        fix: 'Whitelist accepted fields explicitly. Use DTOs and schema validation (Zod, Pydantic) at every API boundary.',
        severity: 'critical',
      },
    ],
    decision: {
      choose: [
        'Parameterized queries for all database interactions',
        'Resource-level authorization checks on every endpoint (not just route-level auth middleware)',
        'Content-Security-Policy headers to limit XSS blast radius',
        'Input validation at every system boundary using schema validation (Zod, Joi, Pydantic)',
      ],
      avoid: [
        'String concatenation into SQL queries — ever',
        'Trusting client-supplied data for authorization decisions',
        'Returning raw database rows in API responses',
        'Allowing server-side URL fetching without strict domain allowlisting',
      ],
      vs: [
        {
          name: 'SAST (Static Analysis)',
          when: 'Catches injection and XSS patterns at CI time. Tools: Semgrep, SonarQube, CodeQL — runs on every PR.',
        },
        {
          name: 'DAST (Dynamic Analysis)',
          when: 'OWASP ZAP and Burp Suite actively attack a running app to find BOLA, SSRF, and auth issues that static analysis misses.',
        },
      ],
    },
    a: {
      v: 'Home Security Vulnerabilities',
      t: 'SQL injection is leaving your front door open. IDOR is giving every tenant the same master key to every apartment. XSS is letting strangers put hidden cameras in your lobby. SSRF is a delivery person you asked to fetch a package who instead walks into every room in your house. CSRF is someone forging your signature while your hand is on the pen.',
      tx: 'The vast majority of breaches exploit well-known, preventable vulnerabilities — not sophisticated zero-days. Mastering OWASP Top 10 prevents the overwhelming majority of real attacks.',
      s: 'Input → Validate → Parameterize → Authenticate → Authorize per resource → Filter output → Log',
    },
    te: {
      def: 'The OWASP Top 10 is a standard awareness document for the most critical security risks to web applications, updated every 3-4 years based on CVE data and security survey responses from hundreds of organizations.',
      types: [
        { n: 'Injection Flaws', d: 'SQL, command, LDAP injection via unsanitized input — parameterized queries and ORMs prevent these by default.' },
        { n: 'Access Control Failures', d: 'IDOR (horizontal — access peer data) and BFLA (vertical — access admin functions) — resource-level ownership checks fix both.' },
        { n: 'Client-Side Attacks', d: 'XSS (injected scripts) and CSRF (forged requests) — CSP headers and SameSite=Strict cookies are the primary mitigations.' },
        { n: 'Infrastructure Attacks', d: 'SSRF (server fetches internal URLs) and XXE (XML external entity injection) — URL allowlisting and hardened XML parser settings fix these.' },
      ],
      when: 'Apply OWASP controls at design time (threat modeling), implementation time (code review checklists, SAST in CI), and testing time (DAST against staging, penetration testing before launch, bug bounty program in production).',
      trade: 'Security controls add development time and some latency. Automate as much as possible: ORM prevents injection by default, React prevents XSS by default, Dependabot alerts on CVEs, Semgrep runs in CI. The residual manual effort (resource-level auth checks, security code review) cannot be fully automated — build it into PR review culture.',
      code:
        '// WRONG: SQL injection vulnerability\nconst result = await db.query(\n  `SELECT * FROM orders WHERE id = ${req.params.id}`  // never do this\n);\n\n// RIGHT: Parameterized query\nconst result = await db.query(\n  \'SELECT * FROM orders WHERE id = $1\',\n  [req.params.id]\n);\n\n// IDOR fix: check resource ownership after fetch\nasync function getOrder(req, res) {\n  const order = await db.query(\'SELECT * FROM orders WHERE id = $1\', [req.params.id]);\n  if (!order) return res.status(404).json({ error: \'Not found\' });\n  if (order.userId !== req.user.id) return res.status(403).json({ error: \'Forbidden\' });\n  return res.json(order);\n}\n\n// SSRF fix: validate URL before server-side fetch\nimport { URL } from \'url\';\nconst PRIVATE_IP = /^(10\\.|172\\.(1[6-9]|2\\d|3[01])\\.|192\\.168\\.|169\\.254\\.)/;\n\nfunction isSafeUrl(urlStr) {\n  try {\n    const parsed = new URL(urlStr);\n    if (!["http:", "https:"].includes(parsed.protocol)) return false;\n    if (PRIVATE_IP.test(parsed.hostname)) return false;  // block RFC1918 + metadata\n    return ALLOWLISTED_DOMAINS.has(parsed.hostname);\n  } catch { return false; }\n}',
      rw: {
        ex: [
          'HackerOne (bug bounty platform)',
          'Snyk (dependency vulnerability scanning)',
          'Semgrep (SAST — runs injection pattern checks in CI)',
          'OWASP ZAP (DAST — active scanner)',
          'Burp Suite (penetration testing)',
          'AWS WAF (SSRF and injection protection at edge)',
        ],
        cs: 'Capital One breach (2019): 100 million customer records exposed via SSRF. A misconfigured AWS WAF allowed a request to the EC2 Instance Metadata Service (IMDSv1, reachable at 169.254.169.254). The attacker retrieved IAM credentials attached to the WAF instance, which had overly broad S3 access. Prevention: block 169.254.x.x in WAF rules, use IMDSv2 (requires a session token — prevents SSRF from retrieving metadata), apply least-privilege IAM roles. The attacker was caught because CloudTrail logged the unusual S3 ListBuckets calls.',
      },
    },
    interview: {
      q: 'A penetration tester finds that GET /api/invoices/789 returns another user\'s invoice when authenticated as a different user. What is this vulnerability, how did it occur, and what is your remediation strategy across the entire API?',
      a: 'This is IDOR (Insecure Direct Object Reference), classified as OWASP A01 Broken Access Control. It occurs when the server authenticates the request (valid session/token) but does not verify that the authenticated user is authorized to access this specific resource — horizontal privilege escalation. Remediation has four layers: 1. Immediate fix: add a resource ownership check to every endpoint that returns user-specific data — fetch the resource, then verify resource.userId === req.user.id before returning. Return 403 if mismatch. 2. Systemic fix: create a data access layer where all user-scoped queries automatically filter by the authenticated user ID — the query itself is the authorization check: SELECT * FROM invoices WHERE id = $1 AND user_id = $2. This prevents the developer from forgetting the check. 3. Use non-sequential UUIDs or ULIDs as public IDs instead of auto-increment integers. This is defense-in-depth, not a replacement for authorization, but makes enumeration impractical. 4. Write integration tests that authenticate as User A and attempt to read User B resources — expect 403. Run these in CI on every deploy. Add DAST scanning (Burp Suite, OWASP ZAP) in the pre-production pipeline to catch BOLA before it reaches production.',
      fu: [
        'What is the difference between BOLA and BFLA?',
        'How does Content-Security-Policy prevent or limit XSS?',
        'How does SSRF lead to cloud credential theft — walk through the Capital One breach?',
        'What is the difference between authentication and authorization?',
      ],
    },
  },
];
