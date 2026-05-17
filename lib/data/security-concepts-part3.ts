import { Concept } from '../types';

export const SECURITY_CONCEPTS_PART3: Concept[] = [
  {
    id: 'auth-rbac',
    cat: 'security',
    color: '#ef4444',
    icon: '👥',
    title: 'RBAC & ABAC Access Control',
    tag: 'Role-Based and Attribute-Based Access Control — architecting permissions at scale',
    overview: 'RBAC assigns permissions to roles and roles to users. ABAC makes access decisions based on attributes of the user, resource, and environment. ReBAC (Relationship-Based, Google Zanzibar model) grants access based on the relationship graph between subjects and resources. Choosing the right model is an architectural decision that determines how flexible, auditable, and scalable your permission system will be.',
    components: [
      {
        name: 'Subject',
        icon: '👤',
        role: 'Who is requesting access',
        detail: 'User, service account, or API client requesting access — has attributes: department, clearance, roles',
      },
      {
        name: 'Resource',
        icon: '📄',
        role: 'What is being accessed',
        detail: 'What is being accessed — has attributes: owner, classification, workspace_id',
      },
      {
        name: 'Action',
        icon: '⚡',
        role: 'What operation is requested',
        detail: 'read, write, delete, execute',
      },
      {
        name: 'Policy Engine',
        icon: '⚙️',
        role: 'Evaluates rules and returns allow/deny',
        detail: 'OPA, AWS IAM, Casbin — evaluates rules and returns allow/deny',
      },
      {
        name: 'Role',
        icon: '🏷️',
        role: 'Named bundle of permissions',
        detail: 'RBAC: a named bundle of permissions — admin, editor, viewer — users inherit all permissions of assigned roles',
      },
    ],
    howItWorks: 'RBAC flow: 1. Define permissions (orders:read, orders:write, users:manage). 2. Bundle into roles (admin=all, manager=orders:read+write, viewer=orders:read). 3. Assign roles to users. 4. Middleware checks: does user role include required permission? ABAC flow: 1. Define policy rules in Rego (OPA) or IAM JSON: allow if user.department == resource.department AND action == read AND env.time is business_hours. 2. On each request, collect: user attributes (dept, clearance), resource attributes (owner, classification), environment (time, IP, device). 3. Policy engine evaluates all matching rules → allow or deny. ReBAC (Zanzibar) flow: 1. Store relationship tuples: (user:alice, viewer, doc:report) or (group:finance, editor, folder:q4-reports). 2. On access check: traverse relationship graph — is there a path from alice to doc:report with viewer or higher permission? 3. Handles inheritance: alice is viewer of report because alice is member of finance who is editor of the parent folder. Role explosion problem: with RBAC, you start with 3 roles (admin, editor, viewer), then add roles for each team, region, and data tier — suddenly 50+ roles. Adding a new permission means updating 30 role definitions. Switch to ABAC when you hit ~20 roles.',
    failures: [
      {
        name: 'Role explosion',
        cause: 'RBAC with too many roles — every new requirement adds a role',
        symptom: '50+ roles, adding permission requires modifying dozens of role definitions, audit is impossible',
        fix: 'Decompose into fine-grained permissions + ABAC policies; use OPA for externalized policy logic',
        severity: 'medium',
      },
      {
        name: 'RBAC without resource-level checks',
        cause: 'Middleware checks role but not resource ownership',
        symptom: 'Admin role can see any user data (correct) but manager role also returns all orders not just their team (BOLA)',
        fix: 'Combine RBAC (function-level) with resource-level ownership checks',
        severity: 'critical',
      },
      {
        name: 'Over-privileged service accounts',
        cause: 'Service account given admin role for convenience',
        symptom: 'If service is compromised, attacker has full system access',
        fix: 'Least privilege — each service gets only the permissions it needs for its specific operations',
        severity: 'critical',
      },
    ],
    decision: {
      choose: [
        'RBAC for small apps with <10 well-defined, stable roles',
        'ABAC when rules depend on data attributes (department, data classification, time window, user tier)',
        'ReBAC for collaborative apps with hierarchical resource sharing (Google Docs, Notion, GitHub)',
        'OPA for policy-as-code: version-controlled, testable policies deployed independently of app code',
      ],
      avoid: [
        'RBAC when you have >20 roles — role explosion makes it unmaintainable',
        'Rolling your own ABAC engine — use OPA, Casbin, or Permit.io',
        'Mixing authorization logic in business logic — externalize to a policy layer',
      ],
      vs: [
        {
          name: 'OPA (Open Policy Agent)',
          when: 'Kubernetes admission control, API authorization. Rego policy language. CNCF graduated.',
        },
        {
          name: 'Casbin',
          when: 'Embedded authorization in apps. Supports RBAC, ABAC, ACL. Multiple language SDKs.',
        },
        {
          name: 'AWS IAM',
          when: 'AWS resource access. Attribute-based (resource tags). Deny-by-default. 10MB policy size limit.',
        },
      ],
    },
    a: {
      v: 'Building Access Control System',
      t: 'RBAC is like a building where your badge lets you into the floors assigned to your role (engineer=floors 1-3, manager=1-5, admin=all). ABAC is smarter: your badge + department + the room classification + time of day all factor into the decision. ReBAC is the most flexible: you can enter a room if you or your team has been explicitly granted access to it or any parent folder.',
      tx: 'Start with RBAC — simple and auditable. Add ABAC when your rules get complex. Add ReBAC when resources have hierarchical ownership (user → folder → document).',
      s: 'RBAC: user.role → permissions. ABAC: user + resource + env → policy engine → allow/deny',
    },
    te: {
      def: 'RBAC grants access based on assigned roles (user → role → permissions). ABAC evaluates policies over attributes of user, resource, and environment at runtime. ReBAC checks relationship graphs between subjects and resources — powers Google Zanzibar, used by Google Docs, Drive, YouTube.',
      types: [
        {
          n: 'Flat RBAC',
          d: 'Simple role→permission mapping, most SaaS',
        },
        {
          n: 'Hierarchical RBAC',
          d: 'Roles inherit from parent roles',
        },
        {
          n: 'ABAC/PBAC',
          d: 'Policy-Based: dynamic attribute evaluation at request time, AWS IAM',
        },
        {
          n: 'ReBAC/Zanzibar',
          d: 'Relationship graph traversal: user is viewer because they are member of a group that has editor on the parent folder',
        },
      ],
      when: 'Start with RBAC. Add ABAC when role explosion starts (>15-20 roles) or when access rules depend on data attributes. Add ReBAC when users share resources with hierarchical permissions (folders containing documents, orgs containing repos).',
      trade: 'RBAC: simple to implement and audit; brittle as requirements grow. ABAC: very flexible; policy debugging is hard, performance cost of evaluating complex policies (cache decisions with short TTL). ReBAC: powerful for hierarchical resources; requires a relationship store (SpiceDB, Zanzibar) — operational complexity.',
      code: '// RBAC middleware — role→permission map\nconst PERMISSIONS: Record<string, string[]> = {\n  admin: [\'orders:read\', \'orders:write\', \'users:manage\', \'billing:access\'],\n  manager: [\'orders:read\', \'orders:write\'],\n  viewer: [\'orders:read\'],\n};\n\nfunction rbacMiddleware(requiredPermission: string) {\n  return (req: Request, res: Response, next: NextFunction) => {\n    const userRole = req.user?.role;\n    const allowed = PERMISSIONS[userRole]?.includes(requiredPermission);\n    if (!allowed) return res.status(403).json({ error: \'Forbidden\' });\n    next();\n  };\n}\n\n// ABAC — call OPA policy engine\nasync function abackCheck(\n  user: { department: string; clearance: string },\n  resource: { owner: string; classification: string },\n  action: string\n): Promise<boolean> {\n  const res = await fetch(\'http://opa:8181/v1/data/authz/allow\', {\n    method: \'POST\',\n    headers: { \'Content-Type\': \'application/json\' },\n    body: JSON.stringify({ input: { user, resource, action } }),\n  });\n  const { result } = await res.json();\n  return result === true;\n}',
      rw: {
        ex: [
          'AWS IAM (ABAC with resource tags)',
          'Google Zanzibar (ReBAC — Google Docs permissions)',
          'OPA (Open Policy Agent — Kubernetes, API auth)',
          'Casbin (embedded RBAC/ABAC)',
          'Permit.io (managed permissions)',
          'GitHub (ReBAC: org→repo→branch permissions)',
        ],
        cs: 'Google Zanzibar (published 2019) powers permissions for Google Docs, Drive, Calendar, YouTube, and Maps. It evaluates "can user U perform action A on resource R?" by traversing a distributed relationship graph. A document can have direct viewers, inherited viewers from parent folders, and group-based access — all resolved via tuple traversal. Zanzibar handles 10M+ authorization checks per second with sub-10ms latency at Google scale using a globally consistent, Spanner-backed relationship store.',
      },
    },
    interview: {
      q: 'Your SaaS started with 3 roles: admin, editor, viewer. You now have 47 roles and adding a new permission requires touching 30 role definitions. Diagnose and redesign.',
      a: 'This is textbook role explosion — the core failure mode of RBAC at scale. Root cause: every new access requirement spawned a new role rather than composing existing permissions. Redesign in three steps: 1. Decompose monolithic roles into fine-grained permissions: orders:read, orders:write, reports:view, users:manage, billing:access. Roles become named permission bundles, not the source of truth. 2. Introduce ABAC for contextual rules: IF user.department == resource.workspace_owner AND resource.sensitivity != high THEN allow orders:read. This replaces dozens of department-specific roles with a single policy rule. 3. Externalize policy logic to OPA (Open Policy Agent): policies become Rego files version-controlled alongside code, tested independently, deployed without app changes. Teams can update access rules via PR without touching application code. 4. Add ReBAC for resource-level sharing: documents owned by teams, accessed by members of those teams — relationship tuples replace complex ABAC conditions. End state: ~10 base permissions, 3-5 base roles, ~20 ABAC policy rules covering all edge cases. Adding a new permission is one policy rule, not 30 role updates.',
      fu: [
        'What is Google Zanzibar and how does it solve the distributed authorization consistency problem?',
        'How does AWS IAM implement ABAC using resource tags?',
        'What is the principle of least privilege and how do you enforce it for microservices?',
        'How do you handle authorization caching for high-traffic APIs without serving stale access decisions?',
      ],
    },
  },
  {
    id: 'auth-encryption',
    cat: 'security',
    color: '#ef4444',
    icon: '🔑',
    title: 'Encryption, Hashing & Secrets',
    tag: 'Symmetric, asymmetric, password hashing — and the catastrophic mistakes of confusing them',
    overview: 'Encryption, hashing, and secret management are the three pillars of data security. Confusing them causes catastrophic breaches: encrypting passwords (wrong — should be hashed), hashing data you need to retrieve (wrong — should be encrypted), or using fast hashes for passwords (wrong — trivially brute-forced). Understanding when to use each — and which specific algorithm — is a Principal Engineer baseline.',
    components: [
      {
        name: 'AES-256-GCM',
        icon: '🔐',
        role: 'Symmetric authenticated encryption',
        detail: 'Symmetric encryption — one key encrypts+decrypts, hardware-accelerated, authenticated — detects tampering — gold standard for data at rest',
      },
      {
        name: 'RSA/ECDSA',
        icon: '🗝️',
        role: 'Asymmetric encryption and signing',
        detail: 'Asymmetric — public key encrypts/verifies, private key decrypts/signs — used for TLS key exchange and digital signatures',
      },
      {
        name: 'Argon2id',
        icon: '🛡️',
        role: 'Password hashing — memory-hard',
        detail: 'Password hashing — intentionally slow, memory-hard, resistant to GPU and ASIC attacks — 2015 Password Hashing Competition winner',
      },
      {
        name: 'HMAC-SHA256',
        icon: '✍️',
        role: 'Keyed message authentication',
        detail: 'Keyed hash for message authentication — proves message was signed by holder of the secret key — used in JWT HS256, Stripe webhook signatures',
      },
      {
        name: 'Envelope Encryption',
        icon: '📦',
        role: 'Two-layer key hierarchy',
        detail: 'Two-layer key hierarchy: DEK encrypts data, KEK in KMS encrypts DEK — rotating encryption key means re-encrypting the DEK, not all data',
      },
    ],
    howItWorks: 'When to use what: ENCRYPT when you need the data back in plaintext (credit card numbers, SSNs, health data — AES-256-GCM). HASH when you only need to verify (passwords — Argon2id). SIGN when you need to prove origin without encryption (JWT signature, webhook payloads — HMAC or ECDSA). AES-256-GCM details: symmetric (one key), authenticated encryption (AEAD — the auth tag detects tampering before decryption), requires a unique IV (12 bytes random) per encryption. Store: IV + auth_tag + ciphertext together. Argon2id vs SHA256 for passwords: SHA256 hashes 10 billion passwords/second on a consumer GPU — the entire RockYou password list cracked in seconds. Argon2id with memoryCost=64MB takes 200ms per hash — GPU-parallel cracking requires 64MB RAM per thread, making it 10 million times harder to brute-force. bcrypt is still acceptable (work factor 12 = ~300ms) but Argon2id is preferred for new systems. Envelope encryption: generate random 32-byte DEK per record/bucket. Encrypt data with DEK (AES-256-GCM). Encrypt DEK with KEK stored in AWS KMS (never exported — KMS encrypts/decrypts only). To read: call KMS.Decrypt(encrypted_DEK) → get DEK → decrypt data. Key rotation: re-encrypt DEK with new KEK — no need to re-encrypt all data. Each KMS call is logged in CloudTrail.',
    failures: [
      {
        name: 'SHA256 for passwords',
        cause: 'Developer used SHA256 thinking it is cryptographically secure (it is — but for the wrong use case)',
        symptom: 'GPU brute-forces all 8-char passwords in minutes after DB breach',
        fix: 'Argon2id (memoryCost=65536, timeCost=3) or bcrypt (cost=12)',
        severity: 'critical',
      },
      {
        name: 'Encrypting passwords instead of hashing',
        cause: 'Misunderstanding — thinking reversible is safer',
        symptom: 'Encryption key leak = all passwords recoverable',
        fix: 'Passwords must be hashed (one-way): hash+salt with Argon2id',
        severity: 'critical',
      },
      {
        name: 'AES-ECB mode',
        cause: 'Using ECB (Electronic Codebook) instead of GCM',
        symptom: 'Identical plaintext blocks produce identical ciphertext blocks — patterns visible in data (the famous ECB Linux Penguin)',
        fix: 'Always AES-256-GCM (authenticated) or AES-256-CBC+HMAC',
        severity: 'high',
      },
      {
        name: 'Hardcoded encryption key in source code',
        cause: 'Developer put key in constants file',
        symptom: 'Key committed to GitHub → all encrypted data decryptable',
        fix: 'Store keys in KMS/Vault only, derive per-environment keys, rotate on exposure',
        severity: 'critical',
      },
    ],
    decision: {
      choose: [
        'AES-256-GCM for all data at rest (PII, health data, payment data)',
        'Argon2id for all new password hashing (bcrypt acceptable for existing systems)',
        'HMAC-SHA256 for webhook signatures and JWT HS256',
        'Envelope encryption for database column encryption or file encryption at scale',
      ],
      avoid: [
        'MD5 or SHA1 or SHA256 for passwords — they are fast hashes, not password hashes',
        'AES-ECB mode — identical blocks produce identical ciphertext',
        'Storing encryption keys alongside encrypted data',
      ],
      vs: [
        {
          name: 'Argon2id',
          when: 'New systems. Memory-hard (64MB per hash). Best resistance to GPU and ASIC attacks.',
        },
        {
          name: 'bcrypt',
          when: 'Existing systems already using bcrypt. Work factor 12. Still adequate. Less memory-hard than Argon2id.',
        },
        {
          name: 'scrypt',
          when: 'Alternative to Argon2id. Memory-hard. Less widely supported.',
        },
      ],
    },
    a: {
      v: 'Secure Document Handling',
      t: 'Encryption is a lockbox — you can retrieve the contents with the key. Hashing is a paper shredder — once shredded, you can only verify if a new document would shred to the same pieces. HMAC is a wax seal — it proves who signed it without hiding the content. Use the right tool: shred passwords, lockbox credit cards, seal API messages.',
      tx: 'The most dangerous mistake is encrypting passwords — if the encryption key leaks, all passwords are instantly recoverable. Hashing is one-way by design. The second most dangerous is using a fast hash (SHA256) for passwords — fast for verification means fast for brute-forcing.',
      s: 'Passwords → Argon2id hash. PII → AES-256-GCM encrypt. Messages → HMAC sign.',
    },
    te: {
      def: 'Encryption is reversible transformation using a key (AES-256-GCM). Hashing is an irreversible one-way function (Argon2id). HMAC is a keyed hash for authentication — proving the message was created by the key holder. Each serves a distinct purpose; confusing them creates critical vulnerabilities.',
      types: [
        {
          n: 'AES-256-GCM',
          d: 'Symmetric AEAD encryption — data at rest',
        },
        {
          n: 'RSA-OAEP/ECDH',
          d: 'Asymmetric — key exchange, digital signatures',
        },
        {
          n: 'Argon2id',
          d: 'Password hashing — memory-hard, GPU-resistant',
        },
        {
          n: 'HMAC-SHA256',
          d: 'Message authentication — webhook and JWT signing',
        },
      ],
      when: 'Argon2id for every password. AES-256-GCM for every piece of PII, health data, or payment data stored at rest. TLS for all data in transit. HMAC for any message that needs origin verification. Envelope encryption for key-at-rest patterns.',
      trade: 'Argon2id intentionally adds 200-300ms to login (feature, not bug — makes brute-forcing impractical). AES-256-GCM at the application layer (before DB storage) adds complexity but provides defense-in-depth: even a full database dump is useless without the KMS key. KMS latency: ~5ms per decrypt call — cache decrypted DEKs in memory.',
      code: '// Argon2id password hash + verify (Node.js)\nimport argon2 from \'argon2\';\n\nconst ARGON2_OPTIONS = {\n  type: argon2.argon2id,\n  memoryCost: 65536, // 64MB\n  timeCost: 3,\n  parallelism: 1,\n};\n\nasync function hashPassword(password: string): Promise<string> {\n  return argon2.hash(password, ARGON2_OPTIONS);\n}\n\nasync function verifyPassword(hash: string, password: string): Promise<boolean> {\n  return argon2.verify(hash, password);\n}\n\n// AES-256-GCM encrypt with random IV\nimport { randomBytes, createCipheriv, createDecipheriv } from \'crypto\';\n\nfunction encrypt(plaintext: string, key: Buffer): { iv: string; tag: string; data: string } {\n  const iv = randomBytes(12);\n  const cipher = createCipheriv(\'aes-256-gcm\', key, iv);\n  const encrypted = Buffer.concat([cipher.update(plaintext, \'utf8\'), cipher.final()]);\n  const tag = cipher.getAuthTag();\n  return {\n    iv: iv.toString(\'base64\'),\n    tag: tag.toString(\'base64\'),\n    data: encrypted.toString(\'base64\'),\n  };\n}\n\nfunction decrypt(enc: { iv: string; tag: string; data: string }, key: Buffer): string {\n  const decipher = createDecipheriv(\'aes-256-gcm\', key, Buffer.from(enc.iv, \'base64\'));\n  decipher.setAuthTag(Buffer.from(enc.tag, \'base64\'));\n  return decipher.update(enc.data, \'base64\', \'utf8\') + decipher.final(\'utf8\');\n}\n\n// HMAC webhook verification\nimport { createHmac, timingSafeEqual } from \'crypto\';\n\nfunction verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {\n  const expected = createHmac(\'sha256\', secret).update(payload).digest(\'hex\');\n  const expectedBuf = Buffer.from(expected);\n  const receivedBuf = Buffer.from(signature);\n  if (expectedBuf.length !== receivedBuf.length) return false;\n  return timingSafeEqual(expectedBuf, receivedBuf);\n}',
      rw: {
        ex: [
          'AWS KMS (key management + envelope encryption)',
          'HashiCorp Vault',
          'Stripe (AES-256-GCM for card data, PCI DSS Level 1)',
          'Auth0 (Argon2id for passwords)',
          '1Password (Argon2id + AES-256-GCM)',
          'Signal (double ratchet — end-to-end encryption)',
        ],
        cs: 'LinkedIn (2012 breach): 6.5M password hashes posted online. They had used unsalted SHA1 — 90% cracked within days using rainbow tables and GPU brute force. In 2016 the full breach was revealed: 117M accounts, most passwords cracked within weeks. Modern standard: Argon2id with per-user salt (random 16 bytes) means each password must be brute-forced individually with 64MB memory requirement per attempt. Even with a complete database dump, strong passwords are computationally impractical to crack.',
      },
    },
    interview: {
      q: 'Your team stores user passwords as SHA256(password). A colleague says SHA256 is cryptographically secure. How do you respond and what is the migration plan?',
      a: 'SHA256 IS cryptographically secure as a general-purpose hash function — for integrity checking, digital signatures, Merkle trees. But it is catastrophically wrong for passwords because it is fast: a modern GPU computes 10 billion SHA256 hashes per second. An attacker with your hashed password database can try all 8-character alphanumeric combinations in under 10 minutes. Password hashing requires an intentionally slow, memory-hard function. Use Argon2id with memoryCost=65536 (64MB) and timeCost=3 — this takes ~200ms per hash and requires 64MB RAM per parallel attempt, making GPU farming impractical. Also: unsalted SHA256 is doubly dangerous — identical passwords hash identically, enabling rainbow table attacks. Argon2id uses a unique per-user salt automatically. Migration plan without forcing all users to reset: 1. On next successful login with existing SHA256 hash: verify password against SHA256 hash (works). 2. Immediately re-hash with Argon2id and update the stored hash field. 3. Add a hash_version column (sha256 or argon2id) to track migration progress. 4. After 90 days, expire all remaining SHA256 hashes and force password reset for those accounts via email.',
      fu: [
        'What is the difference between symmetric and asymmetric encryption and when do you use each?',
        'Why must password hashes be salted?',
        'What is envelope encryption and how does AWS KMS implement it?',
        'What is AES-GCM and why is authenticated encryption (AEAD) important?',
      ],
    },
  },
];
