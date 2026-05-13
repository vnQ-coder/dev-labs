import { Concept } from '../types';

export const GHA_CONCEPTS_PART1: Concept[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. GitHub Actions Fundamentals
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'gha-fundamentals',
    cat: 'github-actions',
    color: '#2088ff',
    icon: '⚙️',
    title: 'GitHub Actions Fundamentals',
    tag: "A YAML recipe that runs on every push — the kitchen is GitHub's cloud",

    overview:
      'GitHub Actions is a CI/CD and automation platform built directly into GitHub. You declare workflows as YAML files; GitHub runs them on managed VMs whenever your chosen events fire. Core primitives are workflows, jobs, steps, and runners — composable building blocks that handle everything from linting on every PR to deploying to production with approval gates.',

    components: [
      {
        name: 'Workflow',
        icon: '📄',
        role: 'Top-level automation unit defined as a YAML file',
        detail:
          'Lives in `.github/workflows/`. Triggered by events (`on:`). Contains one or more jobs. Each workflow run is fully isolated — no shared state between runs unless you use artifacts or a cache.',
      },
      {
        name: 'Job',
        icon: '📦',
        role: 'A unit of work that executes on a runner VM',
        detail:
          'Jobs run in parallel by default; use `needs:` to declare dependencies and serialize them. Each job gets a fresh runner VM — no leftover files or processes from other jobs unless you explicitly share via artifacts.',
      },
      {
        name: 'Step',
        icon: '🔩',
        role: 'Individual task within a job — shell command or reusable action',
        detail:
          'A step is either a shell `run:` command or a reusable `uses:` action pulled from the marketplace. Steps within the same job share the filesystem and environment variables, executing sequentially.',
      },
      {
        name: 'Runner',
        icon: '🖥️',
        role: 'The VM that executes jobs',
        detail:
          'GitHub-hosted runners (`ubuntu-latest`, `windows-latest`, `macos-latest`) are ephemeral VMs managed by GitHub — fresh on every job, deleted after. Self-hosted runners are your own VM or Kubernetes pod; useful for private networking, custom hardware, or GPU workloads.',
      },
    ],

    howItWorks:
      'GitHub Actions is event-driven. Common triggers: `push` (on commit), `pull_request` (on PR open/sync/reopen), `schedule` (cron — `"0 2 * * *"` for 2 AM UTC), `workflow_dispatch` (manual trigger from the GitHub UI with optional inputs), and `workflow_call` (reusable workflows called from other workflows). You can filter triggers by branch and path: `on: push: branches: [main] paths: [\'src/**\']` — so a docs-only change won\'t trigger your test suite.\n\nExecution model: when the event fires, GitHub evaluates which workflows match. For each matching workflow, GitHub creates a run, queues jobs, and assigns each job to an available runner. The runner clones the repo, then executes steps sequentially. If a step fails, the job fails (unless `continue-on-error: true`).\n\nContext objects expose runtime data: `github.sha` (commit SHA), `github.ref` (branch/tag), `github.actor` (who triggered), `secrets.MY_SECRET` (masked value), `env.MY_VAR` (environment variable). Secret masking: any value stored in GitHub Secrets is automatically redacted from logs. Dynamic values can be masked with `echo "::add-mask::$DYNAMIC_VALUE"`.\n\nMatrix strategy: `strategy.matrix` lets you test across a grid — e.g., Node 18 × 20 on Ubuntu × macOS — GitHub fans out one job per combination. `fail-fast: false` prevents cancelling sibling jobs when one fails.\n\nCaching (`actions/cache`): cache `node_modules`, `.pip`, or `.m2` keyed by a hash of the lock file (`hashFiles(\'**/package-lock.json\')`). Cache hit restores the directory; miss falls through to install. Artifacts (`actions/upload-artifact` / `actions/download-artifact`): persist files across jobs in the same run — e.g., upload a build artifact in the `build` job, download it in `deploy`.\n\nEnvironment protection rules: tag a job with `environment: production` and GitHub enforces required reviewer approvals before the job runs — a human gate before production deploys.',

    decision: {
      choose: [
        'Your code already lives in GitHub — zero infrastructure to set up',
        'You need CI/CD, automation, and scheduled tasks in one place',
        'You want a large marketplace of pre-built actions for common tasks',
        'Your team is small-to-medium and wants managed runners without ops overhead',
        'You need GitHub-native integrations (PR checks, deployment environments, Dependabot)',
      ],
      avoid: [
        'You need more than 6 hours of continuous job runtime (GitHub-hosted limit)',
        'Your build requires specialized hardware not available on GitHub-hosted runners',
        'You are locked into a non-GitHub SCM (GitLab, Bitbucket) — use GitLab CI or Bitbucket Pipelines instead',
        'You need very high concurrency on free tier — GitHub limits parallel jobs per plan',
      ],
      vs: [
        {
          name: 'GitLab CI',
          when: 'Your code is in GitLab; GitLab CI is native there with identical tight integration',
        },
        {
          name: 'CircleCI',
          when: 'You need faster macOS runners or Docker layer caching out of the box without workarounds',
        },
        {
          name: 'Jenkins',
          when: 'You need full control over the CI infrastructure, plugins, and on-prem execution at large scale',
        },
        {
          name: 'AWS CodePipeline',
          when: 'Your entire stack is AWS-native and you prefer IAM-managed pipeline permissions over GitHub Secrets',
        },
      ],
    },

    failures: [
      {
        name: 'Secret exposed in logs',
        cause:
          '`echo $SECRET` or passing a secret as a positional shell argument — the shell expands it before GitHub can mask it',
        symptom: 'Plaintext credential visible in workflow run logs',
        fix:
          'Never echo secrets directly. Use `::add-mask::` for dynamic/derived values: `echo "::add-mask::$DERIVED_TOKEN"`. Pass secrets via environment variables (`env: MY_SECRET: ${{ secrets.MY_SECRET }}`) rather than shell arguments. GitHub automatically masks static secret values but cannot mask derived or concatenated values.',
        severity: 'critical',
      },
      {
        name: 'Unsafe fork PR access to secrets',
        cause:
          '`pull_request_target` runs in the context of the base repo (with secrets) but checks out untrusted fork code — a malicious PR can exfiltrate secrets',
        symptom:
          'Fork contributors can craft a PR that reads `secrets.*` values via modified workflow steps',
        fix:
          'Use `pull_request` (not `pull_request_target`) for fork PRs — it runs without secrets by default. Enable "Require approval for first-time contributors" in Settings → Actions → Fork pull request workflows. Only use `pull_request_target` when you explicitly need secrets and never check out fork code in that context.',
        severity: 'high',
      },
    ],

    a: {
      v: 'Assembly Line in a Factory',
      t: 'A push to GitHub is like a new order arriving at the factory',
      tx:
        'The workflow YAML is the instruction manual. Jobs are workstations — they can run in parallel or in sequence. Steps are the individual tasks at each workstation. The runner VM is the worker who picks up the order, follows every step, then clocks out (VM is destroyed). Secrets are the locked cabinet — workers can use the tools inside but can\'t read the label aloud.',
      s: 'Workflow → factory manual | Job → workstation | Step → individual task | Runner → worker (ephemeral) | Secret → locked tool cabinet',
    },

    te: {
      def: 'GitHub Actions is an event-driven CI/CD platform where workflows (YAML files in `.github/workflows/`) execute jobs on ephemeral runner VMs in response to repository events. Each job runs in isolation; steps within a job share the filesystem.',
      types: [
        {
          n: 'CI Workflow',
          d: 'Lint, test, and build on every push/PR. Provides fast feedback before merge.',
        },
        {
          n: 'CD Workflow',
          d: 'Deploy to staging or production after CI passes, optionally gated by environment approval.',
        },
        {
          n: 'Scheduled Workflow',
          d: 'Cron-triggered automation — database backups, nightly reports, stale issue cleanup.',
        },
        {
          n: 'Reusable Workflow',
          d: '`workflow_call` trigger turns a workflow into a callable module — shared CI logic across repos without copy-paste.',
        },
        {
          n: 'Composite Action',
          d: 'A packaged sequence of steps published as a single `uses:` action — the building block for shared step logic.',
        },
      ],
      when:
        'Use GitHub Actions whenever your source is in GitHub and you need automated testing, building, releasing, or any repository event-driven automation. It\'s the default choice for GitHub-hosted projects.',
      trade:
        'Managed runners eliminate ops overhead but cap job duration at 6 hours and limit concurrency per plan. YAML can become verbose for complex pipelines — reusable workflows and composite actions mitigate this. The marketplace accelerates development but introduces third-party action supply-chain risk — always pin actions to a commit SHA (`uses: actions/checkout@a5ac7e51b41094c92402da3b24376905380afc29`) rather than a mutable tag.',
      code: `# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - 'package*.json'
  pull_request:
    branches: [main]
  workflow_dispatch:        # manual trigger from GitHub UI
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'

env:
  NODE_VERSION: '20'        # workflow-level env var

jobs:
  # ── Job 1: Lint & Test (matrix) ───────────────────────
  test:
    name: Test on Node \${{ matrix.node }} / \${{ matrix.os }}
    runs-on: \${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        node: [18, 20]
        os: [ubuntu-latest, macos-latest]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: 'npm'      # built-in npm cache

      - name: Install dependencies
        run: npm ci         # clean install from package-lock.json

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-\${{ matrix.node }}-\${{ matrix.os }}
          path: coverage/
          retention-days: 7

  # ── Job 2: Build (depends on test) ────────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test             # waits for all test matrix jobs to pass

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  # ── Job 3: Deploy (needs approval) ────────────────────
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    environment: production  # requires manual approval in GitHub UI

    steps:
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: Deploy
        run: echo "Deploying to \${{ inputs.environment }}"
        env:
          API_KEY: \${{ secrets.PROD_API_KEY }}`,
      rw: {
        ex: [
          'Vercel and Netlify use GitHub Actions under the hood for preview deployments on every PR',
          'npm publishes packages to the registry via Actions triggered on GitHub Release creation',
          'Dependabot opens PRs automatically; Actions runs tests against those PRs before auto-merge',
          'AWS CDK pipelines use Actions to run `cdk diff` on PRs and `cdk deploy` on merge to main',
        ],
        cs: 'Shopify runs thousands of GitHub Actions workflow runs per day across its monorepo. They use matrix builds to parallelise Ruby and JavaScript tests, reusable workflows to share deployment logic across 100+ services, and environment protection rules with required reviewers before any production deploy fires.',
      },
    },

    interview: {
      q: 'How would you structure a GitHub Actions workflow for a monorepo with multiple services?',
      a: 'Use path filters on the `on:` trigger so each service\'s workflow only fires when its directory changes (`paths: [\'services/auth/**\']`). Create one workflow file per service, or use a single orchestrator workflow that uses `jobs.<job>.if:` conditions combined with `dorny/paths-filter` to detect which services changed. Share common CI logic (lint, test, build) via reusable workflows (`workflow_call`) to avoid duplication. Use matrix builds to parallelise testing across services when they share a test pattern. For deployments, use `environment:` protection rules per service so production deploys require approval.',
      fu: [
        'What is the difference between `pull_request` and `pull_request_target` — and why is the latter dangerous for fork PRs?',
        'How do you share build artifacts between jobs in the same workflow run?',
        'How do you pin a third-party action to a specific commit SHA and why does it matter for supply-chain security?',
        'What does `fail-fast: false` do in a matrix strategy, and when would you set it to false?',
        'How do environment protection rules work and what happens if the required reviewer rejects the deployment?',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. GitHub Actions: Build & Push Docker to ECR
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'gha-docker-ecr',
    cat: 'github-actions',
    color: '#2088ff',
    icon: '🐳',
    title: 'GitHub Actions: Build & Push Docker to ECR',
    tag: 'A container pipeline: build once, tag by commit SHA, push to ECR, deploy anywhere',

    overview:
      'This workflow pattern builds a Docker image inside GitHub Actions using a multi-stage Dockerfile, authenticates to AWS ECR via OIDC (no long-lived credentials), and pushes the image tagged with the commit SHA. OIDC authentication is the gold standard — GitHub issues a short-lived JWT; AWS verifies and returns temporary credentials. Layer caching via GitHub Actions cache keeps builds fast.',

    components: [
      {
        name: 'OIDC Auth (aws-actions/configure-aws-credentials)',
        icon: '🔐',
        role: 'Keyless AWS authentication via short-lived JWT',
        detail:
          'GitHub\'s OIDC provider issues a JWT scoped to the specific repo, branch, and workflow. AWS IAM verifies the JWT against the registered GitHub OIDC provider and returns temporary STS credentials for the configured role. No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` stored in GitHub Secrets — credentials are scoped to the job and expire when it ends.',
      },
      {
        name: 'ECR Login',
        icon: '🔑',
        role: 'Authenticate the Docker daemon with the ECR registry',
        detail:
          '`aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com`. The `aws-actions/amazon-ecr-login` action wraps this and exposes `outputs.registry` for use in subsequent steps.',
      },
      {
        name: 'Docker Build + Cache',
        icon: '🏗️',
        role: 'Build the image with layer caching to avoid redundant work',
        detail:
          '`docker buildx build` with `--cache-from type=gha --cache-to type=gha,mode=max`. GitHub Actions cache stores Docker layer blobs. `mode=max` caches every intermediate layer (not just the final stage), maximising cache reuse across runs. The `docker/build-push-action` action wraps buildx and integrates with the GHA cache backend natively.',
      },
      {
        name: 'Image Tagging Strategy',
        icon: '🏷️',
        role: 'Immutable SHA tag + convenience latest tag',
        detail:
          'Tag with `${{ github.sha }}` (40-character commit SHA) for immutability — every image is traceable to an exact commit. Also tag `latest` for convenience in dev environments. Never rely on `latest` alone in production — it is mutable and makes rollbacks impossible to reason about. In staging/prod always reference the SHA tag.',
      },
    ],

    howItWorks:
      'OIDC flow step-by-step: (1) The workflow requests a JWT from GitHub\'s OIDC endpoint (`id-token: write` permission required). (2) The JWT contains claims: `sub` (`repo:org/repo:ref:refs/heads/main`), `iss` (`https://token.actions.githubusercontent.com`), `aud`. (3) AWS verifies the JWT signature against GitHub\'s JWKS endpoint. (4) AWS checks the IAM role\'s trust policy — it must allow `sts:AssumeRoleWithWebIdentity` from the GitHub OIDC provider, with a condition on `token.actions.githubusercontent.com:sub` matching your repo. (5) AWS returns temporary credentials (access key, secret, session token) valid for the job duration.\n\nIAM role trust policy condition to scope to a specific repo and branch:\n```json\n"Condition": {\n  "StringLike": {\n    "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:ref:refs/heads/main"\n  }\n}\n```\n\nMulti-stage Dockerfile: Stage 1 (`AS builder`) installs all dependencies and runs the build. Stage 2 (`AS runtime`) starts from a minimal base (Alpine), copies only the compiled output from the builder stage. The final image contains no build tools, dev dependencies, or source code — smaller attack surface and smaller image size (often 5-10x smaller).\n\nLayer caching: `--cache-from type=gha` reads cached layers from GitHub Actions cache. `--cache-to type=gha,mode=max` writes all layers back. The cache key is derived from the layer content hash — unchanged layers are a cache hit. Critical Dockerfile ordering: always `COPY package*.json ./` → `RUN npm ci` → `COPY . .` so the `npm ci` layer is only invalidated when dependencies change, not on every source file change.\n\nECR lifecycle policies: configure a lifecycle rule to keep only the last N images (e.g., 10) by tag prefix (`sha-`) to control storage costs. Untagged images (replaced by a new `latest` push) are automatically expired.',

    decision: {
      choose: [
        'You are already using GitHub Actions for CI and want a seamless build-push step',
        'You want OIDC (keyless) AWS auth — the most secure approach, no long-lived credentials',
        'You need layer caching to keep Docker builds fast without managing a separate registry cache',
        'Your runtime target is any AWS service that pulls from ECR (ECS, EKS, EC2, Lambda)',
      ],
      avoid: [
        'Your images are not destined for AWS — use Docker Hub or GHCR instead',
        'You need advanced multi-registry mirroring — consider a dedicated registry proxy',
        'Your Dockerfile is monolithic with no multi-stage build — fix the Dockerfile first',
      ],
      vs: [
        {
          name: 'GitHub Container Registry (GHCR)',
          when: 'Images stay within the GitHub ecosystem; no AWS dependency; open-source projects that want public image hosting',
        },
        {
          name: 'Docker Hub',
          when: 'You need a public registry for open-source images or a vendor-neutral push target',
        },
        {
          name: 'AWS CodeBuild + ECR',
          when: 'Your CI is entirely AWS-native (CodePipeline); you prefer IAM roles on the build environment over OIDC',
        },
      ],
    },

    failures: [
      {
        name: 'Long-lived AWS credentials stored in GitHub Secrets',
        cause:
          'Team uses `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` as GitHub Secrets instead of OIDC',
        symptom:
          'Credentials persist indefinitely; if GitHub Secrets are leaked (e.g., via a malicious action or log exposure), attacker has durable AWS access',
        fix:
          'Migrate to OIDC (`aws-actions/configure-aws-credentials` with `role-to-assume`). If OIDC migration is blocked short-term: scope the IAM policy to minimal ECR permissions only (`ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`), rotate keys quarterly, and enable AWS CloudTrail alerting on unusual API calls.',
        severity: 'critical',
      },
      {
        name: 'Docker build cache miss on every run',
        cause:
          '`COPY . .` appears before `RUN npm ci` in the Dockerfile — any source file change invalidates the npm install layer',
        symptom: 'Full `npm ci` on every push even when `package.json` has not changed; slow builds',
        fix:
          'Reorder Dockerfile layers: `COPY package*.json ./` → `RUN npm ci` → `COPY . .`. This way the npm install layer is only invalidated when `package.json` or `package-lock.json` changes. Apply the same principle to all dependency manifests (requirements.txt, Gemfile, pom.xml).',
        severity: 'medium',
      },
    ],

    a: {
      v: 'Shipping a Package from a Factory to a Warehouse',
      t: 'Every commit triggers the factory to build a new product, seal it in a labelled box, and ship it to the warehouse',
      tx:
        'The Dockerfile is the manufacturing blueprint. Docker build is the factory floor assembling the product in stages (raw materials → finished goods). The commit SHA label on the box makes every shipment traceable. ECR is the warehouse. OIDC is the factory\'s temporary visitor badge — it grants access for the shift, then expires; no permanent key card needed.',
      s: 'Dockerfile → blueprint | Docker build → factory | Commit SHA tag → unique shipment label | ECR → warehouse | OIDC → temporary visitor badge',
    },

    te: {
      def: 'A GitHub Actions workflow that uses OIDC to assume an AWS IAM role, authenticates Docker to ECR, builds a multi-stage image with layer caching, and pushes it tagged with the commit SHA — providing an immutable, traceable artifact for downstream deployments.',
      types: [
        {
          n: 'OIDC Auth',
          d: 'Short-lived JWT from GitHub\'s OIDC provider exchanged for temporary AWS STS credentials — no stored secrets.',
        },
        {
          n: 'Multi-stage Build',
          d: 'Separate builder and runtime stages — smaller final image, no build tools or source code in production.',
        },
        {
          n: 'GHA Layer Cache',
          d: '`--cache-from/to type=gha` stores Docker layers in GitHub Actions cache — avoids re-downloading base images and re-running unchanged build steps.',
        },
        {
          n: 'SHA Tagging',
          d: 'Every image tagged with the full commit SHA — enables precise rollbacks and audit trails.',
        },
      ],
      when:
        'Use this pattern whenever you need a Docker image in ECR as part of a GitHub Actions CI/CD pipeline. It is the recommended pattern for any AWS-hosted application (ECS, EKS, EC2, App Runner) that needs container images built on every merge.',
      trade:
        'OIDC setup requires one-time IAM configuration (OIDC provider + role trust policy) — slightly more upfront work than pasting an access key, but eliminates credential rotation forever. GHA cache is bounded by the GitHub cache quota (10 GB per repo) — very large images may evict other caches. Multi-stage builds add Dockerfile complexity but are non-negotiable for production images.',
      code: `# .github/workflows/build-push-ecr.yml
name: Build & Push to ECR

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: my-app

permissions:
  id-token: write   # required for OIDC token
  contents: read

jobs:
  build-push:
    runs-on: ubuntu-latest

    outputs:
      image: \${{ steps.build.outputs.image }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # ── OIDC Auth — no stored AWS credentials ──────────
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-ecr
          aws-region: \${{ env.AWS_REGION }}

      # ── Login to ECR ───────────────────────────────────
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      # ── Set up Docker Buildx (for caching) ─────────────
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # ── Build & Push with layer caching ────────────────
      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: \${{ github.ref == 'refs/heads/main' }}   # only push on main
          tags: |
            \${{ steps.login-ecr.outputs.registry }}/\${{ env.ECR_REPOSITORY }}:\${{ github.sha }}
            \${{ steps.login-ecr.outputs.registry }}/\${{ env.ECR_REPOSITORY }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=\${{ github.run_id }}
            GIT_COMMIT=\${{ github.sha }}

      - name: Output image URI
        run: echo "Image pushed: \${{ steps.login-ecr.outputs.registry }}/\${{ env.ECR_REPOSITORY }}:\${{ github.sha }}"

# ── Multi-stage Dockerfile ─────────────────────────────
# FROM node:20-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci --only=production=false
# COPY . .
# RUN npm run build
#
# FROM node:20-alpine AS runtime
# WORKDIR /app
# ENV NODE_ENV=production
# COPY package*.json ./
# RUN npm ci --only=production && npm cache clean --force
# COPY --from=builder /app/dist ./dist
# EXPOSE 3000
# USER node
# CMD ["node", "dist/index.js"]`,
      rw: {
        ex: [
          'ECS Fargate deployments: build-push workflow outputs the SHA image URI; a downstream deploy workflow updates the ECS task definition',
          'GitOps with ArgoCD: push the new SHA tag to a `values.yaml` in a Helm chart repo; ArgoCD detects the change and syncs to Kubernetes',
          'AWS App Runner: configured to pull from ECR automatically on new image push — no deploy step needed',
          'Lambda container images: ECR-hosted images deployed to Lambda via `aws lambda update-function-code --image-uri`',
        ],
        cs: 'Duolingo builds and pushes hundreds of Docker images per day to ECR via GitHub Actions. They use OIDC for all AWS auth, multi-stage Dockerfiles to keep Lambda container images under 50 MB, and ECR lifecycle policies to automatically prune images older than 30 days — keeping storage costs flat despite high deploy frequency.',
      },
    },

    interview: {
      q: 'How do you authenticate GitHub Actions to AWS without storing credentials as secrets?',
      a: 'Use OpenID Connect (OIDC). You register GitHub as an OIDC identity provider in AWS IAM, then create an IAM role with a trust policy that allows `sts:AssumeRoleWithWebIdentity` from GitHub\'s OIDC provider (`token.actions.githubusercontent.com`). The trust policy includes a condition on the `sub` claim to scope it to a specific repo and branch — preventing other repos from assuming the same role. In the workflow, set `permissions: id-token: write` and use `aws-actions/configure-aws-credentials` with `role-to-assume`. GitHub issues a short-lived JWT; AWS verifies it and returns temporary STS credentials that expire when the job ends. No secrets stored, no rotation needed.',
      fu: [
        'What IAM permissions does the ECR role need? Walk me through the minimal policy.',
        'How do you scope the OIDC trust policy to prevent other GitHub repos from assuming the same role?',
        'How does `mode=max` differ from the default in `--cache-to type=gha` for Docker layer caching?',
        'Why do you only push the image when `github.ref == \'refs/heads/main\'` and not on pull requests?',
        'How would you implement ECR lifecycle policies to control storage costs?',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. GitHub Actions: Deploy Containerized App to EC2
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'gha-deploy-ec2',
    cat: 'github-actions',
    color: '#2088ff',
    icon: '🖥️',
    title: 'GitHub Actions: Deploy Containerized App to EC2',
    tag: 'SSH into EC2, pull the new image from ECR, restart the container — zero ceremony',

    overview:
      'The final leg of the CI/CD pipeline: take the Docker image pushed to ECR and deploy it to an EC2 instance. The workflow SSHes into the server, pulls the new image, stops the old container, starts the new one, runs a health check, and rolls back automatically if the app fails to respond. Simple, auditable, and sufficient for single-instance or small-cluster deployments.',

    components: [
      {
        name: 'SSH Action (appleboy/ssh-action)',
        icon: '🔗',
        role: 'Execute remote shell commands on EC2 over SSH',
        detail:
          'Uses the EC2 SSH private key stored in GitHub Secrets to connect and run a multi-line deploy script. The EC2 instance must have the corresponding public key in `~/.ssh/authorized_keys`. Environment variables from the GitHub Actions context are passed via `envs:` so the remote script can reference `IMAGE_URI`, `AWS_REGION`, etc.',
      },
      {
        name: 'Deploy Script',
        icon: '📜',
        role: 'Pull new image, swap containers atomically',
        detail:
          'Sequence: authenticate Docker with ECR → save current image tag for rollback → `docker pull` → `docker stop` + `docker rm` → `docker run -d --restart always`. The `--restart always` flag ensures Docker restarts the container on EC2 reboot without a systemd service file.',
      },
      {
        name: 'Health Check',
        icon: '❤️',
        role: 'Verify the new container is serving traffic before declaring success',
        detail:
          '`curl --retry` loop hits `/health` on the container port. Retries up to 10 times with 5-second intervals. If all retries fail, the script exits non-zero — failing the workflow step and triggering the rollback block. A passing health check triggers `docker image prune` to reclaim disk space from old layers.',
      },
      {
        name: 'EC2 Instance Profile',
        icon: '🪪',
        role: 'Allow the EC2 to pull from ECR without credentials on the server',
        detail:
          'Attach an IAM instance profile to the EC2 with ECR read permissions (`ecr:GetAuthorizationToken`, `ecr:BatchGetImage`, `ecr:GetDownloadUrlForLayer`). `aws ecr get-login-password` on the instance uses the instance profile — no AWS credentials stored on the server itself.',
      },
    ],

    howItWorks:
      'Two architectural approaches for GitHub Actions → EC2 deployment:\n\n**Approach 1 — GitHub-hosted runner SSHes into EC2:** The GitHub runner connects outbound to the EC2\'s SSH port (22). Simpler setup, but requires the EC2 security group to allow inbound SSH from GitHub\'s IP ranges (or `0.0.0.0/0` if you don\'t restrict). The SSH private key lives in GitHub Secrets.\n\n**Approach 2 — Self-hosted runner ON the EC2:** Install the GitHub Actions runner agent on the EC2. It polls GitHub for jobs and pulls them — no inbound port needed. Ideal for EC2s in private subnets. The runner executes deploy commands locally (no SSH hop). Trade-off: you manage the runner process (auto-restart via systemd).\n\n**Deploy sequence (Approach 1):**\n1. Workflow SSHes into EC2 via `appleboy/ssh-action`\n2. Remote script authenticates Docker with ECR using the EC2 instance profile (no stored credentials on the server)\n3. Saves current container image tag to a variable for rollback\n4. `docker pull <new-image>` — downloads only changed layers\n5. `docker stop <container> && docker rm <container>` — graceful shutdown (SIGTERM, then SIGKILL after 10s)\n6. `docker run -d --name app --restart always -p 80:3000 --env-file /etc/app.env --log-driver awslogs <new-image>` — starts the new container. `--env-file` keeps secrets off the command line. `awslogs` ships container logs to CloudWatch.\n7. Health check loop: `curl http://localhost:3000/health` with retries\n8. Success path: prune old images. Failure path: stop new container, `docker run` with previous image tag, exit 1\n\n**Zero-downtime blue-green at container level:** Run the new container on port 3001 while the old one serves port 3000. Run the health check against port 3001. On success, update nginx upstream to point to 3001. Stop the old container. This eliminates the brief downtime window between `docker stop` and the new container accepting connections.\n\n**Security considerations:** Prefer EC2 Instance Connect (ephemeral SSH keys, no stored private key) or AWS Systems Manager Session Manager (no SSH port, all traffic through SSM — zero inbound security group rules needed) over storing a permanent SSH key in GitHub Secrets.',

    decision: {
      choose: [
        'Simple single-instance or small-fleet deployment without an orchestrator',
        'You want direct control over the deploy process without ECS/EKS complexity',
        'Budget-sensitive: EC2 + Docker is cheaper than ECS Fargate at small scale',
        'You need to run stateful workloads (attached EBS volumes) that ECS Fargate cannot do',
      ],
      avoid: [
        'You need multi-instance rolling deploys across a fleet — use ECS or a load balancer + Auto Scaling Group',
        'You need container orchestration features (auto-scaling, service discovery, health-based replacement) — use ECS or EKS',
        'Your EC2 is in a private subnet with no SSH access — use self-hosted runner or SSM Session Manager',
      ],
      vs: [
        {
          name: 'ECS Fargate',
          when: 'You want managed container orchestration, auto-scaling, and rolling deployments without managing EC2 instances',
        },
        {
          name: 'AWS CodeDeploy',
          when: 'You need in-place or blue-green EC2 deployments managed by AWS with built-in rollback and fleet management',
        },
        {
          name: 'Kubernetes (EKS)',
          when: 'You need full container orchestration for a microservices fleet at scale',
        },
        {
          name: 'AWS App Runner',
          when: 'You want fully managed container hosting with zero infrastructure to manage — just point at ECR',
        },
      ],
    },

    failures: [
      {
        name: 'SSH private key stored in GitHub Secrets',
        cause:
          'Team stores a long-lived EC2 SSH private key in GitHub Secrets for the SSH action',
        symptom:
          'If the secret is compromised (e.g., via a malicious action or log leak), attacker has persistent SSH access to production EC2',
        fix:
          'This is acceptable for GitHub Secrets (AES-256 encrypted at rest, not exposed in logs). However, prefer EC2 Instance Connect (GitHub Action generates ephemeral one-time SSH key, no stored private key) or AWS Systems Manager Session Manager (`aws ssm start-session` — no SSH port, no stored key, all access logged in CloudTrail). Rotate the SSH key quarterly at minimum if using the stored-key approach.',
        severity: 'high',
      },
      {
        name: 'Deployment fails mid-switch — old container stopped, new container fails to start',
        cause:
          'New image has a startup crash (missing env var, port conflict, OOM). Old container is already stopped.',
        symptom:
          'Application is completely down — no container is serving traffic. Health check fails but rollback script did not trigger because the failure was in `docker run` itself (not the health check loop).',
        fix:
          'The deploy script uses `set -e` so any command failure exits immediately. The rollback block is triggered by health check failure — but also wrap `docker run` in an error check. For zero-downtime: implement blue-green at the container level (new container on a different port, health check it, then switch nginx upstream). This guarantees the old container keeps serving until the new one is proven healthy.',
        severity: 'critical',
      },
    ],

    a: {
      v: 'Swapping a Cashier at a Register',
      t: 'Deploying a new container version is like handing off a register from one cashier to the next',
      tx:
        'The SSH connection is the manager walking over to the register. Pulling the new Docker image is briefing the new cashier. `docker stop` taps the old cashier on the shoulder — they finish the current transaction (SIGTERM graceful shutdown) and step away. `docker run` opens the register for the new cashier. The health check is the manager watching the first few transactions to confirm everything works. Rollback is calling the old cashier back if the new one freezes up.',
      s: 'SSH → manager walkover | docker pull → briefing new cashier | docker stop → graceful handoff | docker run → new cashier opens register | health check → first transaction verification | rollback → calling old cashier back',
    },

    te: {
      def: 'A GitHub Actions CD workflow that SSHes into an EC2 instance, pulls a new Docker image from ECR using the EC2 instance profile, atomically swaps the running container, verifies the new version with a health check loop, and automatically rolls back to the previous image on failure.',
      types: [
        {
          n: 'In-place Swap',
          d: 'Stop old container, start new container on the same port. Simple but has a brief downtime window (seconds). Acceptable for low-traffic internal services.',
        },
        {
          n: 'Blue-Green (container level)',
          d: 'New container starts on a different port. Health-checked. Nginx upstream switched. Old container stopped. Zero downtime.',
        },
        {
          n: 'Self-hosted Runner Deploy',
          d: 'Runner agent on the EC2 executes deploy commands locally — no inbound SSH port needed. Ideal for private subnet EC2s.',
        },
        {
          n: 'SSM Session Manager Deploy',
          d: 'GitHub Actions uses AWS CLI `ssm send-command` to run the deploy script remotely — no SSH key, no open port, all audited in CloudTrail.',
        },
      ],
      when:
        'Use this pattern for straightforward single-instance deployments where simplicity and cost are priorities over orchestration features. Ideal for early-stage products, internal tools, or any workload where ECS/EKS is overkill.',
      trade:
        'Simple and auditable — every deploy step is visible in the workflow log. But does not scale beyond a single instance without additional tooling (load balancer, launch template, CodeDeploy). The brief `docker stop` → `docker run` window causes seconds of downtime for simple in-place swaps — mitigated by blue-green at the container level. The SSH key in Secrets is a credential that needs rotation; SSM Session Manager eliminates this.',
      code: `# .github/workflows/deploy-ec2.yml
name: Deploy to EC2

on:
  workflow_call:            # called by build-push-ecr.yml
    inputs:
      image_uri:
        required: true
        type: string

env:
  AWS_REGION: us-east-1
  CONTAINER_NAME: my-app
  HOST_PORT: 80
  CONTAINER_PORT: 3000

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to EC2 via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.EC2_HOST }}          # EC2 public IP or DNS
          username: ec2-user
          key: \${{ secrets.EC2_SSH_PRIVATE_KEY }}
          envs: IMAGE_URI,AWS_REGION,CONTAINER_NAME,HOST_PORT,CONTAINER_PORT
          script: |
            set -e  # exit on any error

            # ── Authenticate Docker with ECR ───────────────
            aws ecr get-login-password --region $AWS_REGION \\
              | docker login --username AWS --password-stdin \\
                $(echo $IMAGE_URI | cut -d'/' -f1)

            # ── Save current image for rollback ───────────
            PREVIOUS_IMAGE=$(docker inspect --format='{{.Config.Image}}' $CONTAINER_NAME 2>/dev/null || echo "none")

            # ── Pull new image ─────────────────────────────
            echo "Pulling $IMAGE_URI..."
            docker pull $IMAGE_URI

            # ── Stop & remove old container ────────────────
            docker stop $CONTAINER_NAME 2>/dev/null || true
            docker rm $CONTAINER_NAME 2>/dev/null || true

            # ── Start new container ────────────────────────
            docker run -d \\
              --name $CONTAINER_NAME \\
              --restart always \\
              -p $HOST_PORT:$CONTAINER_PORT \\
              --env-file /etc/app.env \\
              --log-driver awslogs \\
              --log-opt awslogs-region=$AWS_REGION \\
              --log-opt awslogs-group=/ec2/my-app \\
              $IMAGE_URI

            # ── Health check with rollback ─────────────────
            echo "Waiting for health check..."
            for i in $(seq 1 10); do
              STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$CONTAINER_PORT/health)
              if [ "$STATUS" = "200" ]; then
                echo "Health check passed"
                # Clean up old images (keep last 3)
                docker image prune -a --filter "until=72h" -f
                exit 0
              fi
              echo "Attempt $i: HTTP $STATUS — retrying in 5s..."
              sleep 5
            done

            # ── ROLLBACK on health check failure ──────────
            echo "Health check failed — rolling back to $PREVIOUS_IMAGE"
            docker stop $CONTAINER_NAME || true
            docker rm $CONTAINER_NAME || true
            if [ "$PREVIOUS_IMAGE" != "none" ]; then
              docker run -d \\
                --name $CONTAINER_NAME \\
                --restart always \\
                -p $HOST_PORT:$CONTAINER_PORT \\
                --env-file /etc/app.env \\
                $PREVIOUS_IMAGE
              echo "Rolled back to $PREVIOUS_IMAGE"
            fi
            exit 1   # fail the workflow`,
      rw: {
        ex: [
          'Indie SaaS products commonly use this exact pattern: GitHub Actions → ECR → EC2 SSH deploy — $50/month EC2 instead of $300/month ECS',
          'Internal tools and admin dashboards: single EC2 instance, simple deploy, no load balancer needed',
          'Staging environments: deploy on every merge to develop, promote the same SHA image to production on release',
          'Startup MVPs: ship fast with EC2 + Docker, migrate to ECS/EKS when traffic demands it',
        ],
        cs: 'Many early-stage YC companies use this exact pattern to move fast — EC2 running Docker, deployed via GitHub Actions SSH on every merge to main. The rollback mechanism has saved multiple teams during on-call incidents: a bad deploy is automatically reversed within 60 seconds without human intervention. As they scale, the same workflow is adapted to update an ECS task definition instead of SSHing directly.',
      },
    },

    interview: {
      q: 'How do you achieve zero-downtime deployments on EC2 with Docker?',
      a: 'The naive approach (stop old container, start new container) has a brief downtime window. For zero downtime, use blue-green at the container level: start the new container on a different port (e.g., 3001) while the old one continues serving on port 3000. Run the health check against port 3001. Once it passes, update the nginx upstream to point to 3001 (`nginx -s reload` — Nginx applies the change without dropping existing connections). Then stop the old container on port 3000. At no point are both containers down simultaneously. For a fleet, use an Application Load Balancer with a target group swap (register new instances, deregister old ones) or ECS rolling deployment.',
      fu: [
        'What is the difference between using a GitHub-hosted runner with SSH versus a self-hosted runner on the EC2 itself?',
        'How does `--restart always` differ from `--restart unless-stopped` in Docker, and which would you use?',
        'How would you adapt this workflow to deploy to a fleet of 10 EC2 instances behind a load balancer?',
        'What is AWS SSM Session Manager and how does it eliminate the need for SSH keys in the deploy workflow?',
        'How would you implement canary deployments (5% → 25% → 100% traffic) on EC2 without ECS?',
      ],
    },
  },
];
