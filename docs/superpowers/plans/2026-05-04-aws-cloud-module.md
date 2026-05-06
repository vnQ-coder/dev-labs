# AWS & Cloud Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a comprehensive AWS & Cloud module to System Design Lab — 15 concepts, 3 real-world AWS scenarios, 4 animated SVG diagram components, and a new "Cloud" sidebar category.

**Architecture:** All content slots into the existing `Concept` and `RealWorldSystem` types — no type changes needed. Concept data lives in a new `lib/data/concepts-cloud.ts` file (mirroring `concepts-part1.ts`, `concepts-messaging.ts` pattern), spread into the master `CONCEPTS` array. Real-world scenarios live in `lib/data/realworld-aws.ts`, spread into `REALWORLD`. Diagrams are SVG components registered in `components/tabs/DiagramTab.tsx`'s lazy-loaded map.

**Tech Stack:** TypeScript, Next.js 16, React 19, SVG (no extra deps).

---

## Conventions

**Concept structure** — Every concept must include:
- `id`, `cat: 'cloud'`, `color: '#22d3ee'`, `icon`, `title`, `tag`, `overview`, `components` (5–6 items), `howItWorks`, `decision` (`choose[]`, `avoid[]`, `vs[]`), `failures` (3 items with `severity`), `a` (analogy: `v`, `t`, `tx`, `s`), `te` (technical: `def`, `types[]`, `when`, `trade`, `code`, `rw.ex[]`, `rw.cs`), `interview` (`q`, `a`, `fu[]`).

**Adapt the spec's prose** — The spec gives prose for "Decision" and "Failures". Convert to the structured types:
- "Decision" prose → `decision.choose[]` (3–4 bullets) + `decision.avoid[]` (2–3 bullets) + `decision.vs[]` (2–3 alternatives with `when` rationale).
- "Failures" prose → `failures[]` array with `name`, `cause`, `symptom`, `fix`, `severity` (`critical` for security/data-loss, `high` for outage-causing, `medium` for cost/perf).

**Verification per task:** After each file is created/modified, run `npx tsc --noEmit` to ensure zero type errors, then commit.

---

## Task 1: Add Cloud Category

**Files:** Modify `lib/data/categories.ts`

- [ ] **Step 1.1:** Append cloud entry to `CATEGORIES` array

```typescript
{ id: 'cloud',       label: 'Cloud',        color: '#22d3ee' },
```

- [ ] **Step 1.2:** Type-check

```bash
npx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 1.3:** Commit

```bash
git add lib/data/categories.ts
git commit -m "feat(cloud): add Cloud sidebar category"
```

---

## Task 2: Create concepts-cloud.ts — Networking Group (5 concepts)

**Files:** Create `lib/data/concepts-cloud.ts`

Concepts in this batch: `vpc`, `subnets`, `security-groups`, `nat-gateway`, `ports-protocols`.

- [ ] **Step 2.1:** Create file with header + 5 concept objects, each fully fleshed out per the conventions above. Use the spec's content as source material. Each concept object follows the structure of existing concepts in `concepts-part1.ts`.

- [ ] **Step 2.2:** Type-check.

```bash
npx tsc --noEmit
```

- [ ] **Step 2.3:** Commit.

```bash
git add lib/data/concepts-cloud.ts
git commit -m "feat(cloud): add networking concepts (VPC, subnets, SGs, NAT, ports)"
```

---

## Task 3: Append DNS & Delivery Group (4 concepts)

**Files:** Modify `lib/data/concepts-cloud.ts`

Concepts: `dns`, `route53`, `cloudflare`, `cloudfront`.

- [ ] **Step 3.1:** Append 4 concept objects to the array.
- [ ] **Step 3.2:** Type-check.
- [ ] **Step 3.3:** Commit: `feat(cloud): add DNS & delivery concepts (DNS, Route 53, Cloudflare, CloudFront)`

---

## Task 4: Append Compute Group (3 concepts)

**Files:** Modify `lib/data/concepts-cloud.ts`

Concepts: `ec2`, `lambda`, `containers` (covers ECS/EKS).

- [ ] **Step 4.1:** Append 3 concept objects.
- [ ] **Step 4.2:** Type-check.
- [ ] **Step 4.3:** Commit: `feat(cloud): add compute concepts (EC2, Lambda, containers)`

---

## Task 5: Append Storage & Operations Group (3 concepts)

**Files:** Modify `lib/data/concepts-cloud.ts`

Concepts: `s3`, `rds`, `iam`.

- [ ] **Step 5.1:** Append 3 concept objects.
- [ ] **Step 5.2:** Type-check.
- [ ] **Step 5.3:** Commit: `feat(cloud): add storage & ops concepts (S3, RDS, IAM)`

---

## Task 6: Wire CONCEPTS_CLOUD into Master Array

**Files:** Modify `lib/data/concepts.ts`

- [ ] **Step 6.1:** Import + spread:

```typescript
import { CONCEPTS_CLOUD } from './concepts-cloud';

export const CONCEPTS: Concept[] = [
  ...CONCEPTS_PART1,
  ...CONCEPTS_PART2,
  ...CONCEPTS_MESSAGING,
  ...CONCEPTS_CLOUD,
];
```

- [ ] **Step 6.2:** Type-check.
- [ ] **Step 6.3:** Commit: `feat(cloud): wire cloud concepts into master CONCEPTS array`

---

## Task 7: VPCDiagram.tsx

**Files:** Create `components/diagrams/VPCDiagram.tsx`

Pattern: SVG component matching `LoadBalancerDiagram.tsx` style — uses `useColors()` hook, animated `offset-path` flow circles, dark/light theme support.

Layout: Internet → IGW → 2 columns (AZ-A, AZ-B) each with Public Subnet (ALB + NAT GW) → Private Subnet (EC2) → Private Subnet (RDS). Animated packets show traffic flow through the IGW.

- [ ] **Step 7.1:** Create the component.
- [ ] **Step 7.2:** Type-check.
- [ ] **Step 7.3:** Commit: `feat(cloud): add animated VPC architecture diagram`

---

## Task 8: DNSDiagram.tsx

**Files:** Create `components/diagrams/DNSDiagram.tsx`

Layout: Browser → OS Cache → Recursive Resolver → Root NS → TLD NS (.com) → Authoritative NS → IP Returned. Step-by-step animation: each layer lights up in sequence, with TTL countdown indicators on each cache layer.

- [ ] **Step 8.1:** Create. — [ ] **Step 8.2:** Type-check. — [ ] **Step 8.3:** Commit: `feat(cloud): add animated DNS resolution diagram`

---

## Task 9: CloudArchDiagram.tsx

**Files:** Create `components/diagrams/CloudArchDiagram.tsx`

Layout: User → Route 53 → CloudFront → ALB → EC2 ASG (across 2 AZs) → Aurora (Multi-AZ) + ElastiCache + S3. Animated request flow on load. Shows AZ separation visually with vertical dashed dividers.

- [ ] **Step 9.1:** Create. — [ ] **Step 9.2:** Type-check. — [ ] **Step 9.3:** Commit: `feat(cloud): add 3-tier AWS architecture diagram`

---

## Task 10: ServerlessDiagram.tsx

**Files:** Create `components/diagrams/ServerlessDiagram.tsx`

Layout: API Gateway → Lambda (ingest) → SQS → Lambda (processor) → DynamoDB + SNS → Subscribers. DLQ branch shown as dashed red flow. CloudWatch alarm icon. Animated message flow with batch size indicator on SQS.

- [ ] **Step 10.1:** Create. — [ ] **Step 10.2:** Type-check. — [ ] **Step 10.3:** Commit: `feat(cloud): add serverless event pipeline diagram`

---

## Task 11: Register Diagrams in DiagramTab.tsx

**Files:** Modify `components/tabs/DiagramTab.tsx`

Add 4 lazy imports keyed by concept ID:

```typescript
vpc: lazy(() => import('@/components/diagrams/VPCDiagram')),
dns: lazy(() => import('@/components/diagrams/DNSDiagram')),
ec2: lazy(() => import('@/components/diagrams/CloudArchDiagram')),
lambda: lazy(() => import('@/components/diagrams/ServerlessDiagram')),
```

- [ ] **Step 11.1:** Add the 4 entries to the `diagrams` map.
- [ ] **Step 11.2:** Type-check.
- [ ] **Step 11.3:** Commit: `feat(cloud): register cloud diagrams in DiagramTab`

---

## Task 12: Create realworld-aws.ts (3 scenarios)

**Files:** Create `lib/data/realworld-aws.ts`

Three `RealWorldSystem` objects:
- `aws-3tier` — Production 3-Tier Web App (10M req/day)
- `aws-serverless` — Serverless Event Pipeline (50M events/day)
- `aws-multiregion` — Multi-Region HA Architecture (1B req/day, 99.99% SLA)

Each object includes: `id`, `icon`, `name`, `color: '#22d3ee'`, `scale`, `focus`, `problem`, `functionalReqs[]`, `nonFunctionalReqs[]`, `scaleEstimation[]`, `highLevelDesign[]` (5–7 steps), `deepDive[]` (4 items), `decisions[]` (3 items), `interview[]` (4 Q/A pairs), `keyInsight`.

- [ ] **Step 12.1:** Create file with all 3 scenarios.
- [ ] **Step 12.2:** Type-check.
- [ ] **Step 12.3:** Commit: `feat(cloud): add 3 real-world AWS architecture scenarios`

---

## Task 13: Wire REALWORLD_AWS into Master Array

**Files:** Modify `lib/data/realworld.ts`

- [ ] **Step 13.1:** Refactor existing array to import + spread pattern, OR simply append the 3 scenarios. Match existing pattern.

- [ ] **Step 13.2:** Type-check.

- [ ] **Step 13.3:** Commit: `feat(cloud): wire real-world AWS scenarios into REALWORLD array`

---

## Task 14: Final Build Check

- [ ] **Step 14.1:** Run full Next.js build.

```bash
npm run build
```
Expected: build succeeds with zero errors.

- [ ] **Step 14.2:** Push.

```bash
GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519_github_second -o IdentitiesOnly=yes" git push origin main
```

---

## Self-Review Notes

**Spec coverage:**
- 15 concepts → Tasks 2–5 cover all 15 (5+4+3+3).
- 3 real-world scenarios → Task 12.
- 4 diagrams → Tasks 7–10.
- New Cloud category → Task 1.
- Wiring → Tasks 6, 11, 13.

**Type consistency:** All concept objects use existing `Concept` interface. Real-world objects use existing `RealWorldSystem`. No new types needed.
