import { Concept } from '../types';

export const AWS_SERVICES_PART2: Concept[] = [
  {
    id: 'aws-kms',
    cat: 'cloud',
    color: '#4db0c9',
    icon: '🔑',
    title: 'AWS KMS',
    tag: 'Managed encryption keys — never see the raw key material',

    overview:
      'AWS Key Management Service (KMS) is a fully managed service for creating and controlling cryptographic keys used to protect your data. The defining guarantee of KMS is that key material never leaves KMS unencrypted — every encrypt and decrypt operation happens inside FIPS 140-2 validated hardware security modules (HSMs) running inside AWS data centers. You submit plaintext data (up to 4 KB) or a data encryption key (DEK) and KMS returns ciphertext; the raw key bytes are never exposed to your application code or to AWS employees. KMS integrates natively with more than 100 AWS services — S3, EBS, RDS, DynamoDB, Secrets Manager, Lambda, SQS, SNS, and more — through the envelope encryption pattern, where each service calls KMS to obtain a fresh DEK, encrypts data locally with it, and stores only the encrypted DEK alongside the ciphertext. Every single KMS API call is automatically logged to AWS CloudTrail, giving you an immutable audit trail of who used which key, on what resource, from what IP address, and at what exact timestamp — a requirement for PCI DSS, HIPAA, and SOC 2 compliance programs.',

    components: [
      {
        name: 'KMS Keys (CMK)',
        icon: '🗝️',
        role: 'The cryptographic key resource in KMS — the root of all encryption operations',
        detail:
          'KMS offers three ownership tiers. AWS Managed Keys (e.g., aws/s3, aws/ebs) are automatically created by AWS services on your behalf, rotated annually at no charge, and cannot be managed or used directly by your code — they exist purely for service-level encryption. Customer Managed Keys (CMK) are keys you create: $1/month per key, custom rotation policy, and — critically — a key resource policy you control. CMKs can be shared cross-account by adding the external account to the key policy. AWS CloudHSM-backed keys (custom key store) reside in an HSM cluster you own and operate, giving you FIPS 140-2 Level 3 assurance and the ability to destroy key material independently of KMS. Key types: symmetric AES-256 (used for the vast majority of encrypt/decrypt workloads), asymmetric RSA 2048/4096 (public-key encryption or digital signatures), and ECC (P-256/P-384 for signing and verification). Key material can be KMS-generated (recommended) or imported from your own HSM, though imported keys lose automatic rotation eligibility.',
      },
      {
        name: 'Envelope Encryption',
        icon: '📦',
        role: 'The pattern by which KMS protects arbitrary-sized data while keeping key operations inside the HSM',
        detail:
          'KMS will not directly encrypt data larger than 4 KB — doing so would require moving large amounts of data in and out of the HSM on every operation, which is both slow and architecturally unsound. Instead, AWS mandates envelope encryption: call GenerateDataKey (specifying your CMK) to receive two things — a plaintext AES-256 DEK and an encrypted copy of that DEK (ciphertext blob). Encrypt your actual data locally using the plaintext DEK with AES-GCM. Discard the plaintext DEK from memory immediately after use. Persist the encrypted DEK alongside the ciphertext on disk or in a database field. To decrypt: load the encrypted DEK, call KMS Decrypt to recover the plaintext DEK, use it to decrypt the data, then zeroize the DEK from memory. KMS only ever handles the 32-byte DEK, not your data — so throughput is independent of data size, and your objects can be gigabytes or terabytes in size.',
      },
      {
        name: 'Key Policy & Grants',
        icon: '📜',
        role: 'Access control mechanisms that determine who can use and manage a KMS key',
        detail:
          'Every KMS key has a resource-based key policy (analogous to an S3 bucket policy). The AWS root account principal is always allowed — this prevents lockout. IAM identity-based policies alone are insufficient: the key policy must explicitly allow the principal (or allow IAM to delegate access). Key policy statements cover two categories: key administrators (CreateAlias, ScheduleKeyDeletion, PutKeyPolicy) and key users (Encrypt, Decrypt, GenerateDataKey, ReEncrypt). Grants are lightweight, delegatable access tokens that AWS services use internally when they need to call KMS on your behalf (e.g., when ECS pulls an encrypted secret for a task). Grants can specify a retiring principal and expire on a condition. The kms:ViaService IAM condition restricts a key to be usable only when the API call originates from a specific AWS service (e.g., "only Secrets Manager may call Decrypt with this key"), preventing lateral use of a key by unauthorized services even if an IAM policy would otherwise allow it.',
      },
      {
        name: 'CloudTrail Integration',
        icon: '📋',
        role: 'Immutable audit log of every KMS API call for compliance and forensic investigation',
        detail:
          'AWS CloudTrail records every KMS management and data-plane API call: CreateKey, PutKeyPolicy, DisableKey, ScheduleKeyDeletion, Encrypt, Decrypt, GenerateDataKey, GenerateDataKeyWithoutPlaintext, ReEncrypt, Sign, Verify. Each log entry includes: the IAM principal (user ARN, role ARN, or AWS service), the KMS key ARN used, the source IP address, the AWS request ID, the timestamp (millisecond precision), and any resource context (e.g., the S3 bucket or RDS instance that triggered the operation). Because every data access that touches KMS-protected data results in a Decrypt or GenerateDataKey call, CloudTrail effectively logs all access to encrypted data — making it possible to answer forensic questions like "who read this S3 object at 2:14 AM last Tuesday" without any application-level instrumentation. This is a hard compliance requirement under PCI DSS Requirement 10 and HIPAA § 164.312(b).',
      },
    ],

    howItWorks:
      'When an application writes data protected by KMS, it first calls GenerateDataKey, passing the ARN of a Customer Managed Key and requesting AES_256 key spec. KMS generates a fresh 256-bit DEK inside the HSM, encrypts a copy of it with the CMK, and returns both the 32-byte plaintext DEK and the ~180-byte encrypted DEK ciphertext blob. The application then encrypts its payload locally — typically with AES-256-GCM — using the plaintext DEK as the symmetric key. It persists the resulting ciphertext alongside the encrypted DEK (often as a header prepended to the ciphertext, or in a companion metadata field). The plaintext DEK is zeroed from memory immediately. KMS is never given the application data and the raw key material never transits the network.\n\nDecryption reverses this. The application reads the ciphertext and extracts the encrypted DEK blob. It calls KMS Decrypt, passing that blob and optionally an encryption context (a key-value map used as authenticated additional data — changes to the context cause decryption to fail, preventing ciphertext from being transplanted to a different object). KMS decrypts the DEK blob inside the HSM and returns the 32-byte plaintext DEK. The application decrypts the ciphertext locally, processes the plaintext, then zeroes the DEK from memory again. The total KMS latency for this roundtrip is roughly 3–10 ms within an AWS region.\n\nKey rotation in KMS is transparent. When you enable automatic annual rotation on a CMK, KMS generates fresh key material and makes it the active encrypting material. Critically, the key ID and ARN do not change — all references in application configs, IAM policies, and CloudFormation templates remain valid. KMS retains all prior key material versions indefinitely, so data encrypted under an older version can still be decrypted: KMS embeds the key version identifier in the ciphertext header and selects the right material automatically. Rotation only applies to symmetric CMKs with KMS-generated material; asymmetric keys and keys with imported material do not support automatic rotation.\n\nFor cross-account sharing, the key owner adds the external account root principal to the key policy. The external account then creates IAM policies granting its own principals the KMS actions. When a principal in account B calls KMS in account A\'s region, KMS validates both the key policy (account A) and the IAM policy (account B). KMS request quotas range from 5,500 to 30,000 requests/second depending on region and key type. For high-throughput workloads the correct mitigation is DEK caching: encrypt a large batch of records with a single DEK (rotating it every N records or T seconds), so only one GenerateDataKey call is needed per batch rather than one per record.',

    decision: {
      choose: [
        'Use KMS for all encryption at rest in AWS — S3 SSE-KMS, EBS volume encryption, RDS encryption, DynamoDB table encryption',
        'Use a Customer Managed Key (CMK) whenever you need to define a key policy, share access cross-account, set a custom rotation schedule, or need CloudTrail audit evidence of key usage per service',
        'Use envelope encryption for any payload larger than 4 KB — generate a DEK with GenerateDataKey, encrypt locally, store encrypted DEK with ciphertext',
        'Use KMS with Secrets Manager to get automatic secret rotation with every version of a secret encrypted under your CMK',
        'Use encryption context as an additional binding factor — pass the S3 bucket+key or DynamoDB table+partition key as context so a stolen ciphertext cannot be decrypted in a different context',
      ],
      avoid: [
        'Avoid calling KMS Encrypt/Decrypt for every record in a high-throughput pipeline (>30,000/s) — cache decrypted DEKs in-process with a short TTL (60–300 seconds) instead',
        'Avoid importing key material unless mandated by compliance — you lose automatic rotation, you own the entropy quality, and if you lose the material AWS cannot recover it',
        'Avoid sharing a single CMK across many unrelated services — blast radius on accidental key deletion or policy misconfiguration is proportional to how many services depend on it; use per-service CMKs',
        'Avoid deleting CMKs without a tested recovery plan — ScheduleKeyDeletion with minimum 7 days is irreversible; encrypted data becomes permanently unreadable',
      ],
      vs: [
        {
          name: 'KMS vs CloudHSM',
          when:
            'Use CloudHSM when you need dedicated hardware (FIPS 140-2 Level 3, vs KMS Level 2), need to run custom cryptographic algorithms inside the HSM, or regulatory requirements mandate that you control the HSM cluster. CloudHSM is significantly more expensive ($1.60/hour per HSM) and operationally complex. Use KMS (with a custom key store backed by CloudHSM) as a middle ground: KMS API convenience with your own HSM hardware.',
        },
        {
          name: 'KMS vs ACM',
          when:
            'AWS Certificate Manager (ACM) manages TLS/SSL certificates (public and private PKI), not symmetric encryption keys. Use ACM for HTTPS on ALB/CloudFront/API Gateway. Use KMS for encrypting data at rest, generating DEKs, or signing/verifying with asymmetric keys that you own. They are complementary: ACM protects data in transit, KMS protects data at rest.',
        },
      ],
    },

    failures: [
      {
        name: 'KMS Throttling on a Hot Key',
        cause:
          'A single CMK used by a high-throughput service (e.g., a Lambda function processing 50,000 events/second, each calling Decrypt) exceeds the per-key request quota for the region. KMS quotas are per key per region: symmetric operations default to 5,500–30,000 req/s depending on region.',
        symptom:
          'ThrottlingException errors on Decrypt or GenerateDataKey calls; Lambda function errors spike; service latency increases; CloudWatch KMS metric "ThrottledRequests" rises sharply.',
        fix: 'Implement DEK caching: cache the plaintext DEK in-process (e.g., in a TTL-bounded LRU cache keyed by encrypted DEK hash) so you call KMS once per DEK lifetime rather than once per record. Use separate CMKs per service or per data partition to distribute quota. Request a KMS quota increase in Service Quotas console (takes minutes). For Lambda, cache the decrypted DEK in the execution environment between invocations using a module-level variable with an expiry check.',
        severity: 'high',
      },
      {
        name: 'Accidental Key Deletion (ScheduleKeyDeletion)',
        cause:
          'A developer or automated script calls ScheduleKeyDeletion on a CMK that is actively used to protect data, intending to clean up a test key but targeting the wrong ARN. KMS begins a waiting period (7–30 days) before permanent deletion.',
        symptom:
          'All Decrypt and GenerateDataKey operations against that key return KmsInvalidStateException immediately after the deletion is scheduled. Services that depend on the key (S3, RDS, Secrets Manager) fail to access encrypted data. If the waiting period expires unnoticed, data is permanently inaccessible.',
        fix: 'Create a CloudWatch alarm on the CloudTrail event "ScheduleKeyDeletion" to page on-call immediately. Require MFA delete: add a key policy condition aws:MultiFactorAuthPresent for the kms:ScheduleKeyDeletion action on all production CMKs. Use the maximum 30-day waiting period (not the minimum 7 days). Cancel deletion immediately with CancelKeyDeletion if caught in time. Run quarterly drills: verify that encrypted data can be restored from backup using a copy of the CMK.',
        severity: 'critical',
      },
      {
        name: 'Access Denied Due to Missing Key Policy Entry',
        cause:
          'An IAM role has kms:Decrypt in its identity-based policy, but the key\'s resource policy does not include that role (or does not include a statement allowing IAM delegation with "Principal": {"AWS": "arn:aws:iam::ACCOUNT:root"}). KMS requires both the identity policy and the key policy to allow the action.',
        symptom:
          'AccessDeniedException on KMS API calls even though the IAM role appears to have the correct permissions. Common scenario: a new service role is created and given kms:Decrypt in IAM, but no one adds it to the key policy.',
        fix: 'Always add required IAM principals to the key policy explicitly, or add the account root principal to the key policy to delegate control fully to IAM. Use the kms:ViaService condition to restrict key usage to a specific AWS service, but ensure the service role is still listed. Audit key policies with aws kms get-key-policy and compare against your IAM grants regularly. Use IAM Access Analyzer to detect mismatches between intent and actual effective policy.',
        severity: 'high',
      },
    ],

    a: {
      v: 'The Bank Vault with Permission Slips',
      t: 'Imagine a bank vault so secure that not even the bank employees can open it without a complete audit trail. You never hold the vault combination yourself.',
      tx: 'AWS KMS is like a bank that has the most secure vault in existence — built to military specifications and audited by independent regulators. You store your master key inside that vault. When you want to protect something, you don\'t take the key out of the vault; instead, you slide your item through a secure slot, the vault encrypts it internally, and slides the locked box back to you. You can hand out permission slips (key policies and grants) that say "the payroll department is allowed to use this vault on Tuesdays between 9 AM and 5 PM, only for items labeled \'payroll\', and every access is logged in the bank\'s ledger." The bank never lets you leave with the master key, but every single time someone uses the vault — who, when, and for what — is recorded permanently.',
      s: 'KMS keeps your master key locked in an HSM. You never see the raw key. You hand out permission slips (key policies) that say who can use it. Every access is logged in CloudTrail — the bank\'s permanent ledger.',
    },

    te: {
      def: 'AWS KMS is a managed cryptographic service that stores master keys in FIPS 140-2 HSMs and exposes encrypt/decrypt/sign/verify APIs. It enforces envelope encryption (max 4 KB direct; DEK pattern for larger data), resource-based key policies, and logs every operation to CloudTrail.',
      types: [
        {
          n: 'AWS Managed Key',
          d: 'Auto-created by AWS services (aws/s3, aws/ebs, aws/rds). Free, rotated annually, no customer control over key policy. Suitable for basic encryption-at-rest with no audit or cross-account requirements.',
        },
        {
          n: 'Customer Managed Key (CMK)',
          d: '$1/month per key. You define the key policy, rotation schedule, and can share cross-account. Required for compliance workloads needing per-principal audit trails, custom rotation, or service-level key isolation.',
        },
        {
          n: 'Symmetric Key (AES-256)',
          d: 'Used for encrypt/decrypt operations. Single key used for both operations. The default and most common type — used by all AWS service integrations, GenerateDataKey, and direct Encrypt/Decrypt API calls.',
        },
        {
          n: 'Asymmetric Key (RSA/ECC)',
          d: 'Public/private key pair. RSA 2048/4096 for public-key encryption or signing. ECC P-256/P-384 for signing only. The public key can be downloaded and used outside KMS; private key operations happen inside the HSM.',
        },
        {
          n: 'CloudHSM-backed Key (Custom Key Store)',
          d: 'Key material lives in your own CloudHSM cluster. FIPS 140-2 Level 3. You can delete key material from your HSM independently of KMS, satisfying regulations that require cryptographic erasure. Highest operational complexity.',
        },
      ],
      when:
        'Use KMS any time you store sensitive data in AWS: S3 objects (SSE-KMS), EBS volumes, RDS/Aurora databases, DynamoDB tables, Secrets Manager secrets, SQS messages, Lambda environment variables. Use CMKs (not AWS Managed Keys) when you need compliance audit trails per service, cross-account data sharing, or key deletion control. Use envelope encryption in application code for any data > 4 KB or for data stored outside AWS managed services.',
      trade:
        'KMS adds 3–15 ms of latency per API call and incurs throttling limits (5,500–30,000 req/s per key per region). The envelope encryption pattern eliminates throughput bottlenecks for large data but requires careful DEK lifecycle management (caching, zeroization). CMKs cost $1/month — trivial for most workloads but worth organizing to avoid sprawl. Automatic key rotation replaces key material annually but does not re-encrypt existing data (old material is retained for decryption). Imported key material and asymmetric keys do not support automatic rotation.',
      code: `// Envelope encryption with AWS KMS — Node.js
// npm install @aws-sdk/client-kms

import {
  KMSClient,
  GenerateDataKeyCommand,
  DecryptCommand,
} from '@aws-sdk/client-kms';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const kms = new KMSClient({ region: 'us-east-1' });
const CMK_ARN = process.env.KMS_CMK_ARN!;

// ── ENCRYPT ──────────────────────────────────────────────────────────
export async function encryptData(
  plaintext: Buffer,
  encryptionContext: Record<string, string>
): Promise<{ ciphertext: Buffer; encryptedDek: Buffer }> {
  // 1. Ask KMS for a fresh 256-bit Data Encryption Key
  const { Plaintext: dekPlaintext, CiphertextBlob: encryptedDek } =
    await kms.send(
      new GenerateDataKeyCommand({
        KeyId: CMK_ARN,
        KeySpec: 'AES_256',
        EncryptionContext: encryptionContext, // binds DEK to this context
      })
    );

  if (!dekPlaintext || !encryptedDek) {
    throw new Error('KMS did not return DEK');
  }

  // 2. Encrypt data locally with AES-256-GCM
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', dekPlaintext, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 128-bit GCM authentication tag

  // 3. Zeroize plaintext DEK immediately
  (dekPlaintext as Buffer).fill(0);

  // 4. Bundle: [iv(12)] + [authTag(16)] + [ciphertext]
  const ciphertext = Buffer.concat([iv, authTag, encrypted]);

  return {
    ciphertext,
    encryptedDek: Buffer.from(encryptedDek), // store alongside ciphertext
  };
}

// ── DECRYPT ──────────────────────────────────────────────────────────
export async function decryptData(
  ciphertext: Buffer,
  encryptedDek: Buffer,
  encryptionContext: Record<string, string>
): Promise<Buffer> {
  // 1. Ask KMS to decrypt the encrypted DEK
  const { Plaintext: dekPlaintext } = await kms.send(
    new DecryptCommand({
      CiphertextBlob: encryptedDek,
      EncryptionContext: encryptionContext, // must match exactly
    })
  );

  if (!dekPlaintext) throw new Error('KMS Decrypt returned no plaintext');

  // 2. Unpack iv, authTag, encrypted payload
  const iv = ciphertext.subarray(0, 12);
  const authTag = ciphertext.subarray(12, 28);
  const payload = ciphertext.subarray(28);

  // 3. Decrypt locally with AES-256-GCM
  const decipher = createDecipheriv('aes-256-gcm', dekPlaintext, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(payload), decipher.final()]);

  // 4. Zeroize DEK
  (dekPlaintext as Buffer).fill(0);

  return plaintext;
}

// ── USAGE ─────────────────────────────────────────────────────────────
async function demo() {
  const context = { service: 'user-service', dataType: 'pii' };
  const original = Buffer.from('{"ssn":"123-45-6789","name":"Jane Doe"}');

  const { ciphertext, encryptedDek } = await encryptData(original, context);
  console.log('Encrypted:', ciphertext.toString('base64'));

  const recovered = await decryptData(ciphertext, encryptedDek, context);
  console.log('Decrypted:', recovered.toString()); // original JSON
}
`,
      rw: {
        ex: [
          'Amazon S3 SSE-KMS: every object PUT with x-amz-server-side-encryption: aws:kms triggers a GenerateDataKey call on your CMK; S3 stores the encrypted DEK in the object metadata. On GET, S3 calls KMS Decrypt, retrieves the DEK, and decrypts the object body — all transparently to the application.',
          'AWS Secrets Manager: each secret version is envelope-encrypted with a CMK of your choice. When a Lambda function retrieves a secret, Secrets Manager calls KMS GenerateDataKeyWithoutPlaintext at create time (storing the encrypted DEK) and calls KMS Decrypt at retrieval time. The CMK audit trail in CloudTrail records every secret access.',
          'Amazon EBS volume encryption: when you create an encrypted EBS volume, EC2 calls KMS to generate a unique volume DEK, then uses it to encrypt all data written to the volume via the NVMe driver. The encrypted DEK is stored in the EBS volume metadata. On volume attach, EC2 calls KMS Decrypt to retrieve the DEK and caches it in the hypervisor for the lifetime of the attachment.',
          'RDS Transparent Data Encryption: Aurora/RDS encrypts the storage layer using a CMK. Each DB instance has a unique DEK encrypted by the CMK. Backups, snapshots, and read replicas inherit the CMK — cross-region snapshots require the CMK to be accessible in the destination region (or re-encrypted with a different CMK using ReEncrypt).',
        ],
        cs: 'Coinbase uses AWS KMS CMKs with CloudHSM-backed custom key stores for their cold wallet key management infrastructure. Each wallet signing key is encrypted under a CMK that never leaves the HSM cluster. Key policy conditions enforce that signing operations can only be initiated via their internal authorization service (kms:ViaService equivalent), require MFA for key policy changes, and mandate a 30-day deletion waiting period. CloudTrail logs for KMS are streamed to a separate, write-once S3 bucket in a dedicated audit account — the CMK for that bucket is managed by a different team with no overlap in key administrators, ensuring no single team can both access data and erase the evidence of access.',
      },
    },

    interview: {
      q: 'Explain envelope encryption and why KMS does not directly encrypt large data objects.',
      a: 'KMS keys never leave the HSM, so every encrypt/decrypt operation requires a round-trip to the KMS API. If KMS encrypted large objects directly — say, a 1 GB S3 object — that 1 GB of data would need to travel to and from KMS on every read and write, which is prohibitively slow and expensive. The HSM hardware is optimized for small, fast key operations, not bulk data throughput. Envelope encryption solves this: you ask KMS to generate a short (32-byte) Data Encryption Key (DEK), encrypt your large payload locally with that DEK using AES-256-GCM (which can saturate NVMe throughput), and only give KMS the 32-byte DEK to encrypt. The encrypted DEK (roughly 180 bytes of ciphertext) is stored alongside your payload. KMS only ever handles the tiny DEK — your data never transits KMS. On decryption, you hand KMS the encrypted DEK, it returns the plaintext DEK, you decrypt locally, then zero the DEK from memory.',
      fu: [
        'If you cache decrypted DEKs in Lambda to reduce KMS API calls, what are the security implications and how do you mitigate them?',
        'How does encryption context work in KMS, and how does it prevent a stolen ciphertext from being decrypted in a different context?',
        'A CMK is accidentally scheduled for deletion and the waiting period expires. What data is lost and what is still recoverable?',
      ],
    },
  },

  {
    id: 'aws-waf',
    cat: 'cloud',
    color: '#4db0c9',
    icon: '🛡️',
    title: 'AWS WAF',
    tag: 'Layer 7 firewall rules protecting your APIs and web apps',

    overview:
      'AWS WAF (Web Application Firewall) is a Layer 7 firewall that inspects every HTTP/HTTPS request reaching your application and makes an allow, block, or count decision before the request reaches your origin. WAF operates at the edge of the AWS network — it can be attached to CloudFront distributions (global), Application Load Balancers (regional), API Gateway REST and HTTP APIs (regional), AppSync GraphQL APIs, and Amazon Cognito user pool endpoints. It protects against the OWASP Top 10 attack categories (injection, XSS, broken authentication, etc.), volumetric abuse, credential stuffing, malicious bots, and known-bad IP reputation. WAFv2 (the current generation, which replaced the legacy WAF Classic in 2019) uses a capacity unit (WCU) model to measure the computational cost of rules in a Web ACL, with a default limit of 1,500 WCUs per Web ACL. Rules are evaluated in ascending priority order — the first rule that matches a request determines the final action; no subsequent rules are evaluated.',

    components: [
      {
        name: 'Web ACL (Access Control List)',
        icon: '📋',
        role: 'The top-level WAF resource — a container of ordered rules attached to one or more AWS resources',
        detail:
          'A Web ACL is the primary WAF artifact. You create it, add rules and rule groups to it, set their priorities, and associate it with one or more resources (a CloudFront distribution, ALB, API Gateway stage, or AppSync API). Each Web ACL has a default action (ALLOW or BLOCK) that applies to any request not matched by any rule. Web ACLs have a capacity budget of 1,500 WCUs — each rule type consumes a different number of WCUs (e.g., a byte-match string rule costs 1 WCU; a regex pattern set rule costs 3 WCU; the AWSManagedRulesCommonRuleSet group costs 700 WCU). Web ACLs are scoped: REGIONAL (must be in the same AWS region as the ALB or API Gateway) or CLOUDFRONT (must be in us-east-1, regardless of where your CloudFront distribution serves traffic). A single Web ACL cannot be shared across scopes. You can associate one Web ACL with multiple resources; you cannot associate a resource with more than one Web ACL.',
      },
      {
        name: 'Rule Groups & Managed Rules',
        icon: '📦',
        role: 'Pre-built or custom collections of rules that can be reused across multiple Web ACLs',
        detail:
          'Rule groups let you package related rules together and share them across Web ACLs. AWS Managed Rule Groups are maintained by the AWS Threat Research Team and updated as new attack patterns emerge — you do not manage the rule logic. Key AWS Managed Rule Groups: AWSManagedRulesCommonRuleSet (OWASP Top 10 protections including LFI, RFI, SSRF — 700 WCU), AWSManagedRulesKnownBadInputsRuleSet (exploits targeting Log4j, Spring4Shell, etc.), AWSManagedRulesSQLiRuleSet (SQL injection patterns), AWSManagedRulesAmazonIpReputationList (AWS-tracked botnet IPs, scrapers, scanners — 25 WCU), AWSManagedRulesAnonymousIpList (TOR exit nodes, VPNs, hosting providers). Third-party managed rule groups are available from Cloudflare, F5, Fortinet, and others via AWS Marketplace — these supplement AWS rules with vendor-specific threat intelligence. Custom rule groups let you write rules once and deploy them to multiple Web ACLs across accounts via AWS Firewall Manager.',
      },
      {
        name: 'Rule Types',
        icon: '⚙️',
        role: 'Individual inspection primitives that compose into comprehensive protection policies',
        detail:
          'IP Set rules: maintain a list of IPv4 and IPv6 CIDR ranges; match requests from those ranges. Geographic match rules: allow or block requests by country code (based on GeoIP database; ~1% accuracy margin). Rate-based rules: count requests from each IP address over a rolling 5-minute window; block the IP if it exceeds a configured threshold (e.g., 2,000 requests per 5 minutes); automatically unblock after the window passes. Rate-based rules are the primary WAF mechanism for mitigating DDoS floods, credential stuffing, and scraping. String match rules: inspect a specific part of the request (URI path, query string, body, specific header, HTTP method, cookie) for the presence of a literal string, prefix, suffix, or substring — optionally with case transformation. Regex pattern set rules: match against a named set of regular expressions (up to 10 patterns per set); more flexible than string match but higher WCU cost. Size constraint rules: trigger if a component (body, URI, query string, header) exceeds a byte length — useful for blocking payload bloat attacks. SQL injection match and XSS match rules use AWS\'s heuristic detectors. Label match rules: one rule in the ACL can add a label to a request (e.g., "suspicious-agent"), and a subsequent rule matches on that label — enabling multi-stage chained evaluation.',
      },
      {
        name: 'Logging & Metrics',
        icon: '📊',
        role: 'Observability layer for auditing WAF decisions, tuning rules, and forensic investigation',
        detail:
          'WAF full request logging must be explicitly enabled on the Web ACL. Destination options: Amazon S3 (batched, ~5-minute lag), CloudWatch Logs log group (near-real-time), or Amazon Kinesis Data Firehose (for streaming to Splunk, Elasticsearch, Datadog). Each log record contains: timestamp, Web ACL name, default action, the first matching rule name and action, the complete request (method, URI, headers, body truncated at 8 KB), source IP, country, and any labels applied. CloudWatch metrics are emitted per rule and per Web ACL: AllowedRequests, BlockedRequests, CountedRequests, PassedRequests — enabling alarms on block rate spikes indicating an attack. WAF Sampled Requests (visible in the AWS console per rule) show the 500 most recent matching requests with the exact field that triggered the match — invaluable for diagnosing false positives without waiting for log delivery. Pricing: $5/month per Web ACL, $1/month per rule (up to 1,500 WCU rules — grouped rules are priced per rule group not per individual rule), $0.60 per 1 million requests inspected. Logging to S3/CloudWatch Logs has standard storage costs.',
      },
    ],

    howItWorks:
      'When a client sends a request to your application protected by WAF, the request first reaches the AWS WAF inspection layer before it is forwarded to your origin. For CloudFront-attached WAFs, inspection happens at the CloudFront PoP — request data never reaches the ALB or origin if WAF blocks it. For ALB-attached WAFs, inspection happens at the regional ALB before the request is forwarded to the target group. WAF extracts the relevant parts of the HTTP request — method, URI, query string, headers, and body (up to 8 KB by default, 64 KB for the body inspection override) — and passes them through each rule in ascending priority order. The very first rule whose match condition evaluates to true determines the final action: ALLOW (forward to origin), BLOCK (return HTTP 403 or a custom response), or COUNT (record a metric and continue evaluation to the next rule). COUNT mode is the key mechanism for safe rule rollout: you add a new rule in COUNT mode, observe the CloudWatch metric and sampled requests for false positives, and only flip it to BLOCK once you are satisfied.\n\nRate-based rules operate differently: WAF maintains a rolling 5-minute request counter per source IP (or per IP+URI, per IP+header, or just per header depending on your aggregation key). When a counter crosses the threshold, WAF automatically adds the IP to an internal block list and all subsequent requests from that IP are blocked until the counter drops below the threshold in the next evaluation window. Because the window is rolling (not fixed), a burst followed by a slow trickle will unblock the IP faster. You can exempt specific IPs (e.g., your own load balancer, monitoring systems) from rate-based rules using an IP Set scope-down statement.\n\nAWS WAF Bot Control is a managed rule group (additional cost) that uses advanced browser interrogation techniques. When Bot Control detects a request that looks automated (no JavaScript execution, suspicious TLS fingerprint, known bot user-agent), it can issue a CAPTCHA challenge (showing a visual puzzle) or a JavaScript silent challenge (a background JS execution test invisible to humans). Legitimate browsers complete the challenge and receive a session token that WAF validates on subsequent requests. This is far more effective against sophisticated bots than simple user-agent blocking.\n\nAWS Firewall Manager lets security teams centrally manage WAF policies across hundreds of AWS accounts in an AWS Organization. A security admin defines a Firewall Manager WAF policy (which Web ACL to apply, which resource types to protect) and Firewall Manager automatically enforces it on all in-scope accounts and resources — including resources created after the policy is applied. This eliminates the "new ALB deployed without WAF" class of security gap in large organizations.',

    decision: {
      choose: [
        'Attach WAF to CloudFront for any public-facing web application — this inspects traffic at the edge before it ever reaches your VPC, reducing origin load during attacks',
        'Use AWS Managed Rule Groups (CommonRuleSet + SQLiRuleSet + IPReputationList) as your baseline day-one protection; tune from there',
        'Use rate-based rules on all public API endpoints as a first line of defense against credential stuffing, scraping, and application-layer DDoS',
        'Use COUNT mode when first enabling any new rule to measure false positive impact before blocking real traffic',
        'Use WAF with Firewall Manager in multi-account organizations to guarantee consistent baseline protection across all accounts and auto-protect new resources',
      ],
      avoid: [
        'Avoid deploying WAF without enabling logging — you are flying blind on attack patterns and cannot tune rules effectively',
        'Avoid relying on WAF alone for security — WAF is one layer in a defense-in-depth architecture; combine with proper IAM policies, network security groups, input validation in code, and parameterized queries',
        'Avoid attaching WAF only to the ALB when you also have CloudFront — traffic that bypasses CloudFront (direct ALB DNS access) will also bypass WAF; protect the ALB with a secret CloudFront origin header',
        'Avoid setting the default Web ACL action to BLOCK without thorough testing — a misconfigured rule can 403 your own legitimate users globally',
      ],
      vs: [
        {
          name: 'AWS WAF vs Cloudflare WAF',
          when:
            'Cloudflare WAF is simpler to configure for non-AWS-native infrastructure and leverages Cloudflare\'s global Anycast network (potentially lower latency). AWS WAF integrates deeply with the AWS ecosystem (CloudFront, ALB, API Gateway, Firewall Manager, Shield) with no cross-cloud data egress. Choose AWS WAF when your entire stack is on AWS and you want unified IAM, CloudTrail, and Security Hub integration. Choose Cloudflare WAF when you have multi-cloud or on-prem origins, or when Cloudflare\'s bot management and DDoS mitigation capabilities (which include L3/L4 protection) are more important than AWS-native integration.',
        },
        {
          name: 'AWS WAF vs Shield Advanced',
          when:
            'AWS Shield Standard is free and provides automatic L3/L4 DDoS mitigation for all CloudFront and Route 53 resources. Shield Advanced ($3,000/month + data transfer fees) adds L3/L4 protection for EC2, ALB, and EIP; provides a 24/7 DDoS Response Team (DRT) for manual attack mitigation; gives cost protection (AWS credits for scaling costs during attacks); and includes WAF rule recommendations. Shield Advanced does not replace WAF — for application-layer (L7) protection against SQL injection, XSS, and malicious requests, you still need WAF. Shield Advanced is for organizations that face sophisticated volumetric DDoS attacks and need SLA-backed response.',
        },
      ],
    },

    failures: [
      {
        name: 'False Positives Blocking Legitimate Traffic',
        cause:
          'An AWS Managed Rule (e.g., AWSManagedRulesCommonRuleSet\'s CrossSiteScripting_BODY rule) triggers on legitimate application request bodies that contain patterns resembling XSS payloads — common in coding tools, security scanners, or CMS editors where users submit HTML/JS content.',
        symptom:
          'A subset of users receive HTTP 403 Forbidden responses on specific actions (e.g., submitting a code snippet, saving a rich-text document). The WAF BlockedRequests CloudWatch metric rises. Sampled requests in the console show the exact request field that triggered the rule.',
        fix: 'Switch the offending rule to COUNT mode immediately to stop blocking traffic while you investigate. Analyze sampled requests to identify the exact match field and value. Options: (1) Add an exception rule with higher priority that ALLOWs requests with a specific header your application injects (e.g., X-Internal-Request: true), scoped by IP set to your own services. (2) Add a label-based exception: a high-priority rule labels the request as known-safe, and override the managed rule to not match labeled requests. (3) Override the specific sub-rule within the managed rule group to COUNT via rule group override. Never disable the entire managed rule group to fix one false positive.',
        severity: 'high',
      },
      {
        name: 'WAF Bypassed via Direct ALB Access',
        cause:
          'Your architecture has WAF attached to CloudFront, but the ALB DNS name (e.g., myapp-alb-1234567890.us-east-1.elb.amazonaws.com) is publicly discoverable (e.g., via SSL certificate transparency logs or DNS enumeration). An attacker sends requests directly to the ALB, bypassing CloudFront and all WAF rules.',
        symptom:
          'WAF metrics show low traffic while your origin receives high traffic volume. SQL injection or XSS attacks reach the application. CloudTrail shows direct-to-ALB requests with origin IPs that are not CloudFront edge nodes.',
        fix: 'Configure CloudFront to inject a secret custom header (e.g., X-Origin-Verify: <random-value>) on all origin requests. Add an ALB listener rule as the first rule: if the X-Origin-Verify header does not match the expected value, return 403. Only CloudFront knows the secret value. Rotate the header value periodically using a Lambda function that updates both the CloudFront custom header config and the ALB listener rule atomically. Alternatively, restrict the ALB security group to only allow traffic from CloudFront IP ranges (published in the ip-ranges.json endpoint), but this requires a Lambda to automatically update the security group as CloudFront IPs change.',
        severity: 'critical',
      },
      {
        name: 'Rate-Based Rule Causing Self-DDoS',
        cause:
          'A rate-based rule set at 1,000 requests per 5 minutes is meant to block scrapers, but the threshold is too low for legitimate traffic patterns — mobile app users retrying aggressively on poor connections, ALB health check probes aggregated to a single source IP, or a bursty but legitimate API client exceeds the threshold.',
        symptom:
          'Legitimate users report intermittent 403 errors. CloudWatch shows BlockedRequests spiking during peak traffic hours (not during obvious attack periods). Sampled requests show your own monitoring IPs or mobile app user IPs being blocked.',
        fix: 'Use COUNT mode on the rate-based rule for 1–2 weeks to measure the actual request rate distribution of legitimate traffic before setting a threshold. Add an IP Set scope-down statement to the rate-based rule that excludes health check source IPs and known internal systems. Set the rate threshold at 3–5x the 99th percentile legitimate request rate per IP, not an arbitrary number. Consider aggregating by IP+URI for login endpoints (where you want tight limits) but by IP only for general traffic (where you want looser limits). Use Bot Control\'s browser challenge for suspected bots rather than hard rate limits, which do not distinguish humans from bots.',
        severity: 'medium',
      },
    ],

    a: {
      v: 'The Club Bouncer with a Blacklist and Pattern Recognition',
      t: 'Imagine a nightclub with a highly trained bouncer at the door who checks every person before letting them in.',
      tx: 'AWS WAF is like a bouncer at an exclusive club. Every person who walks up (every HTTP request) gets checked before entering. The bouncer has a list of banned individuals (IP blocklist), knows what banned behavior looks like (SQL injection patterns, XSS payloads), checks which country people are from (geo-match rules), and counts how many times someone has tried to get in recently (rate-based rules). The club management (AWS) provides the bouncer with an up-to-date list of known troublemakers (Managed Rule Groups) that gets refreshed automatically as new threats emerge. If someone is flagged but you\'re not sure yet, the bouncer can let them in but keeps a tally (COUNT mode) — once you\'re confident they\'re a problem, you tell the bouncer to turn them away (BLOCK). The velvet rope (rule priority) means the bouncer checks the most important rules first and stops checking once a decision is made.',
      s: 'WAF is a bouncer for HTTP traffic. Rules are checked in priority order — first match wins. AWS Managed Rules provide an up-to-date threat list. Rate-based rules count and auto-block repeat offenders. COUNT mode lets you test rules before blocking real traffic.',
    },

    te: {
      def: 'AWS WAF is a Layer 7 (HTTP/HTTPS) web application firewall that evaluates requests against an ordered list of rules in a Web ACL before forwarding to the origin. Rules can inspect any part of the HTTP request; the first matching rule determines the action (ALLOW/BLOCK/COUNT). Deployed on CloudFront, ALB, API Gateway, AppSync, or Cognito.',
      types: [
        {
          n: 'AWS Managed Rule Groups',
          d: 'Pre-built rule sets maintained by AWS Threat Research — updated automatically as new CVEs and attack patterns emerge. CommonRuleSet covers OWASP Top 10; SQLiRuleSet covers injection; IPReputationList blocks known malicious IPs. Add as a baseline; override individual rules if they cause false positives.',
        },
        {
          n: 'Custom Rules',
          d: 'Rules you write to match your application\'s specific traffic patterns — block requests missing a required API key header, allow only specific user-agent prefixes for a B2B API, block requests to deprecated endpoints. Use string match, regex, or size constraint rule types.',
        },
        {
          n: 'Rate-Based Rules',
          d: 'Count requests per source IP over a rolling 5-minute window. Auto-block IPs that exceed the threshold. Essential for DDoS mitigation and credential stuffing protection. Can be scoped to a specific URI (e.g., /login) to apply tighter limits to sensitive endpoints.',
        },
        {
          n: 'IP Set & Geo Match',
          d: 'Allow or block based on a static list of IP ranges (IP Set) or by country of origin (Geo Match). Use for allowlisting internal systems, blocklisting known attacker ASNs, or enforcing geo-restriction requirements.',
        },
        {
          n: 'Bot Control',
          d: 'An add-on managed rule group ($10/month + request fees) that uses advanced signals — TLS fingerprinting, browser behavior, JavaScript challenges — to distinguish humans from bots. Issues CAPTCHA or silent JS challenges to suspected bots. More sophisticated than simple user-agent or IP-based bot blocking.',
        },
      ],
      when:
        'Use AWS WAF on every public-facing HTTP endpoint in AWS. Minimum viable setup: attach to CloudFront with AWSManagedRulesCommonRuleSet + AWSManagedRulesAmazonIpReputationList + a rate-based rule on the /login path. Add WAF to API Gateway for internal APIs accessible from the internet. Increase sophistication (Bot Control, custom rules, geo-blocking) based on threat model and compliance requirements (PCI DSS requires WAF for internet-facing cardholder data systems).',
      trade:
        'WAF adds ~1 ms of inspection latency at the edge (negligible for web traffic). Cost is predictable: $5/Web ACL/month + ~$1/million requests + rule costs. The main operational burden is false positive management — AWS Managed Rules occasionally trigger on legitimate traffic (especially body inspection rules on apps with rich user-generated content). COUNT mode + sampled request analysis is the workflow for tuning. WCU budget (1,500 per Web ACL) constrains how many complex rules you can combine — adding Bot Control (50 WCU) + CommonRuleSet (700 WCU) + SQLiRuleSet (200 WCU) leaves ~550 WCU for custom rules.',
      code: `// AWS CDK (TypeScript) — Web ACL with Managed Rules + Rate Limiting + Logging
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class WafStack extends Stack {
  public readonly webAclArn: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // CloudWatch Logs destination for WAF full request logging
    const wafLogGroup = new logs.LogGroup(this, 'WafLogGroup', {
      logGroupName: 'aws-waf-logs-my-app', // MUST start with "aws-waf-logs-"
      retention: logs.RetentionDays.NINETY_DAYS,
    });

    const webAcl = new wafv2.CfnWebACL(this, 'AppWebAcl', {
      // CLOUDFRONT scope must be deployed in us-east-1
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} }, // allow by default; rules block specific traffic
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'AppWebAcl',
        sampledRequestsEnabled: true,
      },
      rules: [
        // ── Rule 1: Block known bad IP reputation (bots, scrapers, scanners) ──
        {
          name: 'AWSManagedRulesAmazonIpReputationList',
          priority: 10,
          overrideAction: { none: {} }, // use the managed rule group's own actions
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesAmazonIpReputationList',
            sampledRequestsEnabled: true,
          },
        },

        // ── Rule 2: OWASP Top 10 Common Rule Set ──────────────────────────────
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 20,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
              // Override body inspection rule to COUNT to avoid false positives
              // on apps with rich user-generated content
              excludedRules: [],
              ruleActionOverrides: [
                {
                  name: 'CrossSiteScripting_BODY',
                  actionToUse: { count: {} }, // COUNT first; flip to BLOCK after tuning
                },
              ],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet',
            sampledRequestsEnabled: true,
          },
        },

        // ── Rule 3: SQL Injection Rule Set ────────────────────────────────────
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 30,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesSQLiRuleSet',
            sampledRequestsEnabled: true,
          },
        },

        // ── Rule 4: Rate-based rule on /login endpoint (anti-brute-force) ─────
        {
          name: 'LoginRateLimit',
          priority: 40,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 300, // 300 requests per 5-minute window per IP
              aggregateKeyType: 'IP',
              scopeDownStatement: {
                // Only rate-limit requests to /login or /api/auth
                byteMatchStatement: {
                  fieldToMatch: { uriPath: {} },
                  positionalConstraint: 'STARTS_WITH',
                  searchString: '/login',
                  textTransformations: [{ priority: 0, type: 'LOWERCASE' }],
                },
              },
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'LoginRateLimit',
            sampledRequestsEnabled: true,
          },
        },

        // ── Rule 5: Global rate limit (anti-DDoS / scraping) ─────────────────
        {
          name: 'GlobalRateLimit',
          priority: 50,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 3000, // 3000 requests per 5 minutes per IP
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'GlobalRateLimit',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // Enable full request logging to CloudWatch Logs
    new wafv2.CfnLoggingConfiguration(this, 'WafLogging', {
      resourceArn: webAcl.attrArn,
      logDestinationConfigs: [wafLogGroup.logGroupArn],
      // Optionally redact sensitive headers from logs:
      redactedFields: [
        { singleHeader: { name: 'authorization' } },
        { singleHeader: { name: 'cookie' } },
      ],
    });

    this.webAclArn = webAcl.attrArn;
  }
}
`,
      rw: {
        ex: [
          'Netflix uses AWS WAF on CloudFront in front of their API endpoints to protect against OWASP Top 10 attacks. They layer AWSManagedRulesCommonRuleSet with custom rules that allow their CDN and partner IP ranges, and use rate-based rules tuned to their traffic patterns to distinguish real user bursty activity from scraper bot behavior.',
          'Shopify attaches WAF to ALB for their checkout and payment API endpoints. They use AWSManagedRulesSQLiRuleSet on POST request bodies to the /checkout endpoint, with geo-match rules that flag high-risk country combinations and route them through additional CAPTCHA verification instead of outright blocking (to avoid false positives for legitimate international shoppers using VPNs).',
          'A financial services firm uses AWS Firewall Manager to enforce a standard Web ACL policy across 200+ AWS accounts in their organization. Any new ALB created in any account automatically gets the baseline WAF policy attached within minutes of creation — eliminating the "new service deployed without WAF" gap that previously required quarterly manual audits to detect.',
          'Airbnb uses WAF Bot Control on their search and listing API endpoints to distinguish human browsing from competitor scraping and automated price monitoring bots. Bot Control\'s JavaScript silent challenge filters out headless Chrome scrapers that do not execute browser-environment checks, without adding friction for real users.',
        ],
        cs: 'Capital One runs AWS WAF as a core component of their PCI DSS compliance architecture, which covers their credit card application and account management surfaces. They use a layered Web ACL: AWSManagedRulesCommonRuleSet (OWASP coverage) + AWSManagedRulesSQLiRuleSet (required explicitly by PCI DSS Requirement 6.6) + custom rules enforcing that all API requests include a valid JWT Authorization header (blocking unauthenticated probing). WAF logs are streamed via Kinesis Firehose to their centralized SIEM (Splunk) in near-real-time. They maintain a Firewall Manager policy that auto-attaches the Web ACL to every new ALB and API Gateway in their AWS accounts, and run weekly automated tests that replay known attack payloads (OWASP testing guide payloads) against a staging endpoint to verify that WAF rules are blocking correctly after any managed rule group update.',
      },
    },

    interview: {
      q: 'How does AWS WAF evaluate rules, and how would you safely debug a managed rule that appears to be causing false positives in production?',
      a: 'WAF evaluates rules in ascending priority order — the lowest priority number is evaluated first. The first rule whose match condition is satisfied determines the final action (ALLOW, BLOCK, or COUNT); evaluation stops there. This means rule ordering matters: an explicit ALLOW rule with priority 1 for your internal IPs will protect those IPs from being blocked by a more aggressive rule at priority 10. To debug a false positive from a managed rule without causing an outage: first, switch the entire managed rule group from its default action to COUNT mode (via overrideAction: count). This means the rule still matches and records metrics but no longer blocks traffic. Then, go to the WAF console and look at Sampled Requests for that rule group — you will see the exact HTTP requests that triggered it, including which specific sub-rule matched and what field value caused the match. Use this data to identify the problematic sub-rule (e.g., CrossSiteScripting_BODY). Then, instead of keeping the entire group in COUNT, set only that specific sub-rule to COUNT via a rule action override, and switch the rest of the group back to its blocking action. Monitor the CloudWatch metric for that sub-rule in COUNT mode to confirm the false positive rate before deciding whether to write an exception rule with higher priority or permanently override the sub-rule to COUNT.',
      fu: [
        'If an attacker discovers your ALB DNS name and sends requests directly, bypassing CloudFront and your WAF entirely, how do you prevent that?',
        'You need to protect a public API that serves both browser clients and server-to-server B2B partners. How would you structure your WAF rules to apply different rate limits and bot protection policies to each traffic type?',
        'How does AWS WAF Bot Control differ from a simple user-agent blocklist, and what types of bots can evade each approach?',
      ],
    },
  },
];
