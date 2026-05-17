import { Concept } from '../types';

export const SECURITY_CONCEPTS_PART4: Concept[] = [
  {
    id: 'auth-zero-trust',
    cat: 'security',
    color: '#ef4444',
    icon: '🚫',
    title: 'Zero Trust Architecture',
    tag: 'Never trust, always verify — the security model that eliminated the perimeter',
    overview: 'Zero Trust replaces the castle-and-moat security model (trust everything inside the corporate network) with never trust, always verify. Every request — from inside or outside — is authenticated, authorized, encrypted, and logged. Adopted by Google (BeyondCorp, after the 2010 Operation Aurora attack), required by US federal agencies (NIST 800-207, Biden executive order 2021), and now the baseline expectation for any organization handling sensitive data.',
    components: [
      {
        name: 'Identity Provider',
        icon: '🪪',
        role: 'Okta, Azure AD, Google Workspace — every user and service has a verified, auditable digital identity',
        detail: 'The foundation of Zero Trust. Every human and service principal has a unique identity with full audit trail. SSO enforces central policy. SCIM automates provisioning/deprovisioning so access is removed the moment an employee leaves.',
      },
      {
        name: 'Policy Engine',
        icon: '⚖️',
        role: 'Evaluates: who is the user, what device, what location, what time, what resource, what action — returns allow/deny with reason',
        detail: 'The decision point. Ingests signals from IdP, MDM, threat intelligence, and SIEM. Applies least-privilege policies. Every access decision is logged with full context. OPA (Open Policy Agent) is a popular open-source policy engine for service-to-service authorization.',
      },
      {
        name: 'Device Trust via MDM',
        icon: '💻',
        role: 'Jamf for macOS, Intune for Windows — verifies: is OS patched, is disk encrypted, is EDR installed, is corp-managed',
        detail: 'Device posture is a trust signal. A corp-managed, fully patched device with EDR running gets higher trust than an unmanaged personal device. Non-compliant devices can be blocked or given limited access (e.g., read-only, no sensitive data).',
      },
      {
        name: 'Micro-segmentation',
        icon: '🧱',
        role: 'Each service only accepts traffic from explicitly allowed sources — even if Service A is compromised, it cannot reach Service B',
        detail: 'Default-deny network policies in Kubernetes. Service mesh authorization policies (Istio AuthorizationPolicy). Even if an attacker compromises one pod, lateral movement is blocked by policy — they cannot reach the database or adjacent services.',
      },
      {
        name: 'Continuous Verification',
        icon: '🔄',
        role: 'Trust is not granted at login and held — re-evaluated on each request based on current risk signals: new device, anomalous location, high-value operation triggers step-up auth',
        detail: 'Session tokens are short-lived. Risk signals are evaluated continuously. High-value operations (wire transfer, admin action, bulk data export) trigger step-up authentication (re-verify FIDO2). Anomalous signals (new country, 3am access) trigger alert + additional verification.',
      },
    ],
    howItWorks: 'Traditional model: VPN → trusted network → all internal resources accessible. If VPN credentials are phished, attacker has access to everything.\n\nZero Trust model:\n1. Device posture check: is this device corp-managed (MDM enrolled), OS patched, disk encrypted, no known malware?\n2. Identity verification: user authenticates with SSO + MFA (FIDO2 for phishing resistance).\n3. Context evaluation: location (unusual country?), time (outside business hours?), risk score (recent failed MFA attempts?).\n4. Policy engine evaluates all signals → grants access ONLY to the specific resource requested, not the network.\n5. All traffic encrypted: TLS for user-to-app, mTLS between services (Istio automatically issues SPIFFE-format certs to every pod).\n6. All access logged: SIEM ingests every access decision for anomaly detection and incident response.\n\nZero Trust for microservices (service mesh): Each microservice has a SPIFFE identity (spiffe://cluster.local/ns/default/sa/orders-service). Istio sidecar proxies enforce mTLS between ALL services. OPA (Open Policy Agent) controls which service can call which endpoint and with what permissions. If the orders service is compromised, it cannot make unauthorized calls to the payments service — policy engine blocks it.',
    failures: [
      {
        name: 'VPN as the only perimeter',
        cause: 'Assuming corporate network = trusted',
        symptom: 'One phished VPN credential gives attacker lateral movement to all internal systems',
        fix: 'Zero Trust replaces VPN — identity + device posture replaces network location as trust signal',
        severity: 'critical',
      },
      {
        name: 'Missing micro-segmentation',
        cause: 'All internal services can reach all other services',
        symptom: 'Single compromised service gives attacker access to database, internal APIs, secrets',
        fix: 'Default-deny network policies in K8s, service mesh authorization policies',
        severity: 'critical',
      },
      {
        name: 'Zero Trust theater',
        cause: 'Deploying a Zero Trust product without redesigning access model',
        symptom: 'All services are in the Zero Trust perimeter but still overprivileged',
        fix: 'Zero Trust requires least-privilege access redesign, not just a new product',
        severity: 'medium',
      },
    ],
    decision: {
      choose: [
        'Organizations moving away from VPN-centric architecture',
        'Remote/hybrid workforces where employees access internal tools from any network',
        'Microservices architectures requiring service-to-service authentication',
        'Any organization handling sensitive regulated data (healthcare, finance, government)',
      ],
      avoid: [
        'Buying a Zero Trust product without redesigning access model — Zero Trust is a strategy, not a product',
        'Applying Zero Trust only to external access while keeping flat internal networks',
        'Implementing without centralized logging — Zero Trust requires observability to be effective',
      ],
      vs: [
        {
          name: 'BeyondCorp (user-focused)',
          when: 'Replace VPN for human users. Identity + device posture grants per-application access. Google model.',
        },
        {
          name: 'ZTNA (Zero Trust Network Access)',
          when: 'Cloudflare Access, Zscaler, Tailscale. Software-defined perimeter for remote users.',
        },
        {
          name: 'Service Mesh ZT',
          when: 'Istio/Linkerd for service-to-service. mTLS + SPIFFE identity + OPA policy for east-west traffic.',
        },
      ],
    },
    a: {
      v: 'Airport Security vs Hotel Lobby',
      t: 'Traditional security is a hotel lobby: show ID once at the door, then walk anywhere freely. Zero Trust is airport security: show boarding pass at every gate, ID at security, passport at international departures — each checkpoint independently verifies you belong there. If someone steals your hotel keycard, they access everything. If someone steals your boarding pass, they can only reach your specific gate.',
      tx: 'The insight from Operation Aurora: once inside the perimeter, attackers move freely. Zero Trust makes every resource its own perimeter. Breach of one system cannot be leveraged to access others.',
      s: 'Request → Identity check → Device check → Context → Policy Engine → Only this resource',
    },
    te: {
      def: 'Zero Trust is a security model (NIST 800-207) based on the principle that no user, device, or service is trusted by default regardless of network location. Every access request is authenticated, authorized based on least privilege, encrypted, and logged.',
      types: [
        {
          n: 'BeyondCorp',
          d: 'User-focused ZT: identity + device replaces VPN — Google model',
        },
        {
          n: 'ZTNA',
          d: 'Zero Trust Network Access: software-defined perimeter — Cloudflare Access, Zscaler, Tailscale',
        },
        {
          n: 'Service Mesh',
          d: 'East-west ZT: mTLS + SPIFFE + OPA for service-to-service',
        },
        {
          n: 'Continuous Adaptive Trust',
          d: 'Risk-based: trust score recalculated continuously, high-value operations trigger step-up auth',
        },
      ],
      when: 'Begin Zero Trust migration when: 1. Removing VPN dependency, 2. Enabling remote work securely, 3. Building microservices, 4. Handling regulated data. Adopt incrementally: identity foundation first, then device trust, then ZTNA, then micro-segmentation.',
      trade: 'Significant implementation complexity and organizational change management. Requires investment in: IdP, MDM, policy engine, observability stack. A 12-18 month migration for a mid-size company. Start with the highest-risk systems (admin access, production databases) and expand. Cost is justified: Zero Trust is the only model that limits blast radius when breach occurs.',
      code: '# Istio AuthorizationPolicy — orders-service can call payments-service\napiVersion: security.istio.io/v1beta1\nkind: AuthorizationPolicy\nmetadata:\n  name: payments-service-policy\n  namespace: default\nspec:\n  selector:\n    matchLabels:\n      app: payments-service\n  action: ALLOW\n  rules:\n    - from:\n        - source:\n            principals:\n              - cluster.local/ns/default/sa/orders-service\n              - cluster.local/ns/default/sa/admin-service\n      to:\n        - operation:\n            methods: [\'POST\']\n            paths: [\'/v1/payments\', \'/v1/refunds\']\n---\n# Default deny all other traffic to payments-service\napiVersion: security.istio.io/v1beta1\nkind: AuthorizationPolicy\nmetadata:\n  name: deny-all-payments\n  namespace: default\nspec:\n  selector:\n    matchLabels:\n      app: payments-service\n  action: DENY\n  rules:\n    - {} # matches all requests not covered by ALLOW policy\n\n# Zero Trust policy engine call (pseudo-code)\nconst decision = await policyEngine.evaluate({\n  subject: { userId: req.user.id, deviceId: req.device.id },\n  resource: { service: \'payments\', endpoint: \'/v1/payments\' },\n  action: \'POST\',\n  context: {\n    ip: req.ip,\n    deviceCompliant: req.device.isCompliant,\n    mfaVerified: req.auth.mfaVerified,\n    riskScore: await riskEngine.score(req),\n  },\n});\nif (!decision.allow) {\n  return res.status(403).json({ error: \'Access denied\', reason: decision.reason });\n}',
      rw: {
        ex: [
          'Google BeyondCorp (2014, eliminated VPN for all engineers)',
          'Cloudflare Access (ZTNA)',
          'Zscaler ZPA (zero trust private access)',
          'Tailscale (WireGuard-based mesh VPN with identity)',
          'Istio (service mesh mTLS)',
          'Okta (IdP foundation)',
        ],
        cs: 'Google deployed BeyondCorp after Operation Aurora (2010) — a Chinese state-sponsored attack that breached Google and 20+ other companies by exploiting a single Internet Explorer zero-day on an employee machine, then moving laterally through the trusted corporate network. The insight: the perimeter had failed; the attacker had full internal network access from one compromised machine. BeyondCorp took 6 years to fully deploy. Every Google engineer now accesses internal tools from any network, any device, based solely on identity (Google SSO + hardware security key) and device certificate. No VPN. The corporate network and a coffee shop WiFi are treated identically.',
      },
    },
    interview: {
      q: 'Your company uses VPN for internal tool access. Post-breach analysis shows an attacker used one phished VPN credential to access your database, admin panel, and internal APIs over 3 weeks. Design a Zero Trust migration plan.',
      a: 'This breach demonstrates the core failure of perimeter security: one credential = full internal access. Zero Trust migration in phases:\n\nPhase 1 (0-3 months): Identity foundation. Deploy SSO (Okta/Azure AD), enforce MFA everywhere (FIDO2 for admin accounts), eliminate shared credentials. This alone closes the phishing vector that caused this breach.\n\nPhase 2 (3-6 months): Device trust. MDM enrollment (Jamf/Intune). Define compliance policies: OS must be patched, disk encrypted, EDR installed. Non-compliant devices cannot authenticate.\n\nPhase 3 (6-9 months): Replace VPN for the highest-risk applications first. Deploy Cloudflare Access or Zscaler for admin panel and production database access. Users authenticate with SSO + FIDO2 — no VPN.\n\nPhase 4 (9-12 months): Micro-segment internal services. Deploy Istio with mTLS between all services. OPA policies: payments service can only be called by checkout service and admin service — nothing else. Default deny.\n\nPhase 5 (12-18 months): Continuous monitoring. SIEM ingesting all access logs. Anomaly detection: alert on first-seen device, unusual access hours, bulk data reads. Decommission VPN.\n\nThe goal: even if an attacker re-phishes an employee credential, they can only access the specific applications that user is authorized for, from a device that passes health checks, and every action is logged.',
      fu: [
        'What is SPIFFE/SVID and how does it provide service identity in a Zero Trust service mesh?',
        'What is the difference between ZTNA and a traditional VPN?',
        'How does continuous adaptive trust (risk-based authentication) work?',
        'How do you implement Zero Trust for contractors who use their own devices?',
      ],
    },
  },
  {
    id: 'auth-mfa',
    cat: 'security',
    color: '#ef4444',
    icon: '📱',
    title: 'Multi-Factor Authentication (MFA)',
    tag: 'Something you know + something you have + something you are — blocking 99.9% of account takeovers',
    overview: 'Multi-Factor Authentication requires two or more verification factors from different categories: knowledge (password), possession (phone, hardware key), or inherence (biometric). Microsoft reports MFA blocks 99.9% of automated account takeover attacks. Understanding the security properties — and failure modes — of each MFA method is essential for architects: TOTP is phishable, FIDO2 is not, and SMS is the weakest option.',
    components: [
      {
        name: 'TOTP',
        icon: '🔢',
        role: 'Time-based OTP, RFC 6238: HMAC-SHA1(secret, floor(unix_time/30)) mod 10^6 — 6-digit code rotating every 30 seconds — shared secret stored in authenticator app and server',
        detail: 'Widely supported. Works offline. Phishable via AiTM (Adversary-in-the-Middle) proxy — attacker relays the code to the real site within the 30-second window. Shared secret is a risk: if server DB is breached, all TOTP secrets are compromised. Mitigated by encrypting secrets at rest.',
      },
      {
        name: 'FIDO2/WebAuthn',
        icon: '🔑',
        role: 'W3C standard: asymmetric key pair per domain — private key never leaves the authenticator device, domain-bound so fake sites get nothing — phishing-proof by cryptographic design',
        detail: 'The only phishing-proof MFA. Credential is bound to the exact relying party ID (domain). A credential registered for example.com cannot be used on evilexample.com — the browser enforces this. Hardware keys (YubiKey) or platform authenticators (Touch ID, Windows Hello). Private key never transmitted.',
      },
      {
        name: 'SMS OTP',
        icon: '📨',
        role: 'One-time code via text message — weakest MFA — vulnerable to SIM swap attacks where attacker ports your number',
        detail: 'Better than no MFA but the weakest form. SIM swap: attacker calls carrier, social-engineers them into porting the victim number to attacker SIM. Attacker now receives all SMS including OTPs. NIST 800-63 deprecated SMS OTP for high-assurance applications. Disable for all accounts with production or payment access.',
      },
      {
        name: 'Push Notification',
        icon: '📲',
        role: 'Duo, Okta Verify — user taps Approve on phone — vulnerable to MFA fatigue attacks: attacker spams approval requests until user accidentally approves',
        detail: 'Convenient UX. Vulnerable to MFA fatigue (push bombing): attacker has valid credentials, sends 20+ push notifications at 3am, exhausted user approves one. Fix: number matching (user must type a number shown in the browser into the app — attacker cannot automate this), context (show location and app in push), rate limiting.',
      },
      {
        name: 'Recovery Codes',
        icon: '🗝️',
        role: 'One-time backup codes generated at MFA setup — store encrypted in DB — essential UX for lost devices — must be securely generated with crypto.randomBytes',
        detail: 'Critical for UX: without recovery codes, locked-out users create support burden. Each code is single-use, generated with cryptographically secure randomness (crypto.randomBytes(32)), stored as bcrypt hash in DB. User stores codes offline (password manager or printed). Show once at generation, never again.',
      },
    ],
    howItWorks: 'TOTP flow:\n1. At setup: server generates secret (random 20 bytes), user scans QR code in Google Authenticator/Authy (encodes otpauth://totp/App:user@email?secret=BASE32SECRET).\n2. Both server and authenticator independently compute: HOTP(secret, floor(current_unix_time / 30)).\n3. On login: user enters 6-digit code, server verifies it matches the computed value (with ±1 time step tolerance for clock skew).\n4. Secret is the shared state — if server DB is breached, all TOTP secrets are compromised.\n\nFIDO2/WebAuthn flow:\n1. Registration: browser generates key pair on authenticator (YubiKey, Touch ID, Windows Hello). Public key sent to server. Private key never leaves device, never transmitted. Credential is bound to the relying party domain (rpId = example.com).\n2. Authentication: server sends a challenge. Authenticator signs it with the private key (requires user gesture: touch, PIN, biometric). Browser sends signed assertion. Server verifies signature against stored public key.\n\nDomain binding: credential created for example.com cannot be used on evilexample.com — the browser checks the domain. This makes phishing cryptographically impossible.\n\nAiTM phishing vs FIDO2: Adversary-in-the-Middle attack relays credentials including TOTP codes in real time. The attacker\'s proxy creates a real session on the legitimate site. FIDO2 blocks this: the credential is bound to the exact domain; the attacker\'s domain is different → authentication fails even if user never notices the fake site.',
    failures: [
      {
        name: 'TOTP phished via AiTM',
        cause: 'TOTP code valid for 30 seconds — attacker relays to real site instantly via reverse proxy',
        symptom: 'Attacker creates valid session despite MFA',
        fix: 'Switch to FIDO2/WebAuthn for admin and high-value accounts — phishing-resistant by design',
        severity: 'critical',
      },
      {
        name: 'SMS SIM swap',
        cause: 'Attacker socially engineers carrier to port victim number to attacker SIM',
        symptom: 'Attacker receives all SMS OTPs for account',
        fix: 'Disable SMS MFA for sensitive accounts; use TOTP minimum, FIDO2 for high-value',
        severity: 'high',
      },
      {
        name: 'MFA fatigue',
        cause: 'Push notification MFA with no context or rate limiting',
        symptom: 'Attacker sends 20+ push requests, exhausted user approves one',
        fix: 'Number matching (user must type a number shown in the browser into the push notification), add-context approvals, rate limit push requests, alert on multiple denials',
        severity: 'high',
      },
    ],
    decision: {
      choose: [
        'FIDO2/WebAuthn for all admin accounts and high-value operations — only phishing-proof MFA',
        'TOTP as minimum MFA for all user accounts',
        'Risk-based MFA (step-up authentication): trigger MFA re-verification only when risk is elevated',
        'Number matching for push notification MFA to prevent fatigue attacks',
      ],
      avoid: [
        'SMS OTP for any sensitive system — SIM swap bypasses it',
        'Allowing users to fall back to SMS when FIDO2 is unavailable for admin accounts',
        'No rate limiting on MFA attempts (brute force TOTP time windows)',
      ],
      vs: [
        {
          name: 'FIDO2 Hardware Key (YubiKey)',
          when: 'Highest security. Phishing-proof. No shared secret. No battery. Physical possession required. For admin, finance, security team.',
        },
        {
          name: 'Platform Authenticator (Touch ID/FaceID)',
          when: 'FIDO2-based. Synced via iCloud/Google for passkeys. Convenient for all users. Phishing-proof.',
        },
        {
          name: 'TOTP App',
          when: 'Minimum acceptable for general users. Not phishing-proof but blocks automated attacks. Wide compatibility.',
        },
      ],
    },
    a: {
      v: 'Safe Deposit Box',
      t: 'A password alone is a padlock — anyone with a copy of the key can open it. MFA is a bank safe deposit box: you need both your key AND the bank manager key. Stealing just your key gets nothing. FIDO2 is even better: the bank key is cryptographically tied to this specific bank branch — a fake bank branch cannot use it at all.',
      tx: 'Even the strongest password can be phished or leaked in a breach. MFA ensures that knowing the password is never sufficient. FIDO2 goes further: even if the user is fooled by a fake site, the credential cannot be used on the wrong domain.',
      s: 'Password (know) + TOTP/FIDO2 (have) + biometric (are) = access granted',
    },
    te: {
      def: 'MFA requires users to prove identity using two or more factors from distinct categories: knowledge (password/PIN), possession (phone/hardware key), or inherence (biometric). The combination makes account takeover exponentially harder even with a stolen password.',
      types: [
        {
          n: 'TOTP/RFC 6238',
          d: 'Time-based OTP — shared secret, 30-second window, phishable in real time by AiTM',
        },
        {
          n: 'FIDO2/WebAuthn',
          d: 'Asymmetric, domain-bound, phishing-proof — hardware key or platform authenticator',
        },
        {
          n: 'Passkeys',
          d: 'FIDO2 synced via iCloud/Google Password Manager — passwordless + phishing-proof',
        },
        {
          n: 'Push MFA',
          d: 'Duo/Okta Verify — convenient but vulnerable to fatigue attacks without number matching',
        },
      ],
      when: 'Enforce MFA for ALL accounts. Use FIDO2 for admin and privileged accounts — mandatory. For regular users: TOTP minimum. Offer passkeys as a better UX. Disable SMS MFA for any account with production access or payment authority.',
      trade: 'MFA adds friction to login — balance with UX: device trust (remember this device 30 days), risk-based step-up (only challenge on new device/location/high-value action), passkeys (passwordless + phishing-proof + no TOTP code to type). Security is a product feature: 99.9% attack block rate is a compelling value proposition to users.',
      code: '// TOTP verification with otplib\nimport { authenticator } from \'otplib\';\n\nconst secret = authenticator.generateSecret(); // Store encrypted in DB\nconst otpauthUrl = authenticator.keyuri(userEmail, \'MyApp\', secret);\n// Show QR code of otpauthUrl to user during setup\n\n// Verify on login\nconst isValid = authenticator.check(userProvidedCode, secret);\nif (!isValid) throw new Error(\'Invalid TOTP code\');\n\n// WebAuthn verification with simplewebauthn\nimport { verifyAuthenticationResponse } from \'@simplewebauthn/server\';\n\nconst verification = await verifyAuthenticationResponse({\n  response: req.body, // assertion from browser\n  expectedChallenge: session.challenge, // stored challenge\n  expectedOrigin: \'https://example.com\', // must match exactly\n  expectedRPID: \'example.com\', // relying party ID\n  authenticator: {\n    credentialID: storedCredential.id,\n    credentialPublicKey: storedCredential.publicKey,\n    counter: storedCredential.signCount,\n  },\n});\n\nif (!verification.verified) throw new Error(\'WebAuthn verification failed\');\n// Domain binding enforced: fake site domain != expectedOrigin → fails automatically',
      rw: {
        ex: [
          'Google (FIDO2 + passkeys — eliminated account takeover for employees)',
          'GitHub (TOTP + hardware security keys — required for all npm package maintainers)',
          'Stripe (enforces MFA for all dashboard access)',
          'Twilio (post-breach adopted FIDO2 for all employees)',
          'Apple (passkeys synced via iCloud Keychain)',
        ],
        cs: 'Twilio breach (August 2022): attackers sent SMS messages to Twilio employees impersonating IT ("Your Okta password has expired — login here"). The phishing page was a real-time AiTM proxy that relayed credentials and TOTP codes to the real Okta login instantly. 163 customer accounts were compromised. If Twilio had required FIDO2 hardware keys for all employees (they now do, post-breach), the attack would have failed: FIDO2 credentials are domain-bound — the attacker domain would not match Okta domain, and authentication would fail even with correct credentials and real-time TOTP relay. Post-incident, Twilio migrated all employee authentication to FIDO2 hardware keys.',
      },
    },
    interview: {
      q: 'Your admin dashboard uses TOTP-based MFA. A security researcher demonstrates they can bypass it using a real-time phishing proxy. How do you fix it and prevent future bypasses?',
      a: 'The attack is AiTM (Adversary-in-the-Middle) phishing: attacker runs a reverse proxy site that looks identical to your login page. User enters credentials + TOTP code → proxy relays them instantly to your real site → attacker gets a valid authenticated session. The TOTP code is valid for 30 seconds — plenty of time.\n\nFix: migrate admin accounts from TOTP to FIDO2/WebAuthn. FIDO2 is phishing-proof by design: the WebAuthn credential is cryptographically bound to the exact relying party ID (your actual domain). When the user tries to authenticate on the attacker domain, the browser has no matching credential → authentication fails → attacker gets nothing even with a perfect fake site.\n\nMigration plan:\n1. Issue hardware security keys (YubiKey 5 series) to all admin/engineering accounts.\n2. Register FIDO2 credentials in your IdP (Okta, Auth0).\n3. Enforce FIDO2 as the ONLY MFA option for admin accounts (remove TOTP fallback).\n4. For regular user accounts: implement number matching on push notifications (user must type a number displayed in the browser into the phone app — defeats automated approval).\n5. Add login anomaly detection: new device + failed MFA + unusual location → alert + account lock.\n\nThe key insight: TOTP is better than no MFA, but it does not protect against sophisticated phishing. For accounts with production access, FIDO2 is the only acceptable option.',
      fu: [
        'What is the TOTP algorithm (RFC 6238) — how is the 6-digit code computed?',
        'How do passkeys work and how are they different from hardware security keys?',
        'What is a SIM swap attack and which account types are most vulnerable?',
        'How do you implement risk-based (adaptive) authentication?',
      ],
    },
  },
];
