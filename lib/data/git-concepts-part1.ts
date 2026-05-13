import { Concept } from '../types';

export const GIT_CONCEPTS_PART1: Concept[] = [
  // ─────────────────────────────────────────────────────────────────
  // 1. GIT CORE WORKFLOW
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'git-basics',
    cat: 'git',
    color: '#f05032',
    icon: '🌿',
    title: 'Git Core Workflow',
    tag: 'A save-point system for code — every commit is a snapshot, not a diff',
    overview:
      'Git is a distributed version control system built around a content-addressable object store. Unlike systems that track file deltas, Git stores complete snapshots of your project at every commit, making branching and history traversal O(1) operations rather than expensive reconstructions. The three-tree architecture — working directory, staging index, and HEAD — gives developers precise control over what enters each commit. Understanding what Git actually stores at the object level transforms it from a black-box CLI tool into a predictable, recoverable system.',
    components: [
      {
        name: 'Working Directory',
        icon: '📁',
        role: 'The files on disk — tracked, untracked, and modified.',
        detail:
          'The working directory is the checkout of one version of the project. Git knows about tracked files (previously committed or staged) and ignores untracked ones (unless listed in .gitignore). Modified tracked files show up in `git status` and `git diff` as unstaged changes waiting to be staged.',
      },
      {
        name: 'Staging Index',
        icon: '📋',
        role: '`git add` moves changes here — the "what will be in the next commit" area.',
        detail:
          'The index is a binary file stored at `.git/index` that maps filenames to blob SHAs. When you run `git add`, Git creates a blob object for the file content and records the mapping in the index. A commit is built from exactly what is in the index at that moment, giving you fine-grained control over commit boundaries.',
      },
      {
        name: 'HEAD',
        icon: '👁️',
        role: 'A pointer to the current commit; advances every time you commit.',
        detail:
          'HEAD is stored at `.git/HEAD` as a symbolic reference — typically `ref: refs/heads/main`. After each commit, the branch pointer moves forward to the new commit, and HEAD follows. In "detached HEAD" state (when you checkout a commit SHA directly), HEAD points to a commit rather than a branch, meaning new commits won\'t be tracked by any branch.',
      },
      {
        name: 'Object Store (.git/)',
        icon: '🗄️',
        role: 'Blobs (file content), trees (directory), commits (snapshot + metadata + parent hash).',
        detail:
          'Git\'s object store lives under `.git/objects/`. Every object is addressed by its SHA-1 hash and stored as a zlib-compressed file. A blob holds raw file content. A tree maps filenames and permissions to blob or sub-tree SHAs. A commit records a root tree SHA, zero or more parent commit SHAs, author, committer, timestamp, and message. Together they form an immutable, tamper-evident DAG.',
      },
    ],
    howItWorks: `Git's content-addressable object store is the foundation of its reliability and speed. When you run \`git add\`, Git reads the file content, computes its SHA-1 hash, and stores the compressed content at \`.git/objects/<first-2-chars>/<remaining-38-chars>\`. Two files with identical content share one blob — there is no duplication. The same principle applies to trees: if a subdirectory didn't change between commits, both commits reference the same tree object.

A commit object contains exactly four things: the SHA of the root tree, the SHA(s) of parent commit(s), author/committer identity with timestamp, and the commit message. Nothing more. The entire project state at any point in history is recoverable by following the tree SHA in that commit object, then recursively resolving sub-trees and blobs — all without any delta reconstruction.

\`git diff\` between two commits does NOT read stored diffs. Git resolves both commit trees to lists of (filename, blob-SHA) pairs and compares them. Files whose blob SHA changed are diffed on the fly using the Myers diff algorithm. This means \`git diff\` is always authoritative and consistent regardless of how many intervening commits exist.

The staging index at \`.git/index\` is a binary file that acts as the proposed next snapshot. When you run \`git add\`, each file's blob is created (if new), and the index entry is updated with the new blob SHA, file mode, and stat data (mtime, size) for fast status checks. \`git status\` compares three sources: working directory stat data vs. the index (unstaged changes), and index blob SHAs vs. HEAD tree blob SHAs (staged changes).

When you run \`git commit\`, Git traverses the index and assembles tree objects for each directory, then creates the commit object pointing to the root tree and the current HEAD as parent. It then atomically writes the new commit SHA to the current branch file under \`.git/refs/heads/\`, which advances both the branch pointer and HEAD. The entire operation is transactional — if it fails partway, no partial state is left.

\`git log --oneline --graph --all\` reconstructs the DAG by following parent pointers from all branch heads. The \`--graph\` flag renders ASCII art of the merge topology. Because commits are immutable objects with parent pointers, the full project history is always self-contained and verifiable — pulling from a remote is just copying objects and updating remote-tracking refs.`,
    decision: {
      choose: [
        'Use `git add -p` (patch mode) to stage individual hunks when your working change contains multiple logical units that should be separate commits',
        'Use `git commit --amend` to fix a commit message or add a forgotten file to the most recent local commit before pushing',
        'Use `git log --oneline --graph --all` as your default history view to visualize branch topology at a glance',
        'Use `git diff --staged` before every commit to review exactly what will be recorded',
      ],
      avoid: [
        'Avoid `git add .` blindly — always run `git status` first to catch secrets, build artifacts, or debug files',
        'Avoid single-line commit messages for complex changes — use the body to explain WHY, not WHAT',
        'Avoid committing directly to main/master in a team workflow — use feature branches and PRs',
        'Avoid mixing whitespace-only changes with logic changes in a single commit — it pollutes `git blame`',
      ],
      vs: [
        {
          name: 'SVN / Centralized VCS',
          when: 'Use Git when you need offline work, cheap branching, and distributed collaboration. Use SVN only for large binary repositories where Git LFS is impractical or when a legacy corporate toolchain mandates it.',
        },
        {
          name: 'Mercurial (hg)',
          when: 'Git is preferred for its ecosystem (GitHub, GitLab, Bitbucket) and toolchain maturity. Mercurial has cleaner semantics for beginners but has effectively lost the ecosystem war.',
        },
      ],
    },
    failures: [
      {
        name: 'Committing secrets or API keys',
        cause: '`git add .` or `git add -A` without reviewing what is being staged, especially after copying config files or .env examples into the repo.',
        symptom: 'Credentials visible in git log, on GitHub, or in CI logs. Secret scanning alerts from GitHub Advanced Security or GitGuardian.',
        fix: 'Immediately rotate the compromised credential — treat it as breached. Use `git filter-repo --path <file> --invert-paths` to excise the file from all history, then force-push. Add the file to `.gitignore`. Install `git-secrets` or `pre-commit` hooks with `detect-secrets` to block future accidents.',
        severity: 'critical',
      },
      {
        name: 'Large binary files bloating repo',
        cause: 'Committing node_modules, compiled binaries, video/image assets, ML model weights, or build artifacts directly to the object store.',
        symptom: '`git clone` takes minutes. `.git/` directory is gigabytes. `git gc` runs for hours. GitHub rejects pushes over 100 MB.',
        fix: 'Use Git LFS (`git lfs track "*.psd"`) for large assets. Add `node_modules/`, `dist/`, and `*.pyc` to `.gitignore` before the first commit. Remove already-committed large files with `git filter-repo --path node_modules --invert-paths` and re-push.',
        severity: 'high',
      },
    ],
    a: {
      v: '📸 Polaroid Camera',
      t: 'Every Commit is a Photograph, Not a Flipbook',
      tx: 'A delta-based VCS is like a flipbook — to see page 100, you must replay all 99 changes before it. Git is like a stack of Polaroids: every commit is a complete, self-contained photo of your project. To see any point in history, Git just picks up that photo. Diffs are computed on demand by comparing two photos side-by-side, not replayed from scratch.',
      s: 'Snapshots over deltas — Git stores complete project state at every commit, making history traversal fast and reliable regardless of repository age.',
    },
    te: {
      def: 'Git is a distributed version control system that stores project history as a DAG of immutable snapshot objects, each addressed by its SHA-1 hash, enabling offline operation, cheap branching, and cryptographic history integrity.',
      types: [
        {
          n: 'Blob Object',
          d: 'Stores raw file content, compressed with zlib. Addressed by SHA-1 of its content. Two files with identical content share one blob, saving space.',
        },
        {
          n: 'Tree Object',
          d: 'Maps filenames and UNIX permission modes to blob or sub-tree SHAs. Represents a directory at a point in time.',
        },
        {
          n: 'Commit Object',
          d: 'Contains a root tree SHA, parent commit SHA(s), author, committer, timestamp, and message. The fundamental unit of project history.',
        },
        {
          n: 'Tag Object',
          d: 'An annotated tag: points to a commit, includes a tagger identity, timestamp, and message. Lightweight tags are just refs, not objects.',
        },
      ],
      when: 'Use Git for every software project regardless of size. The object store overhead is negligible, and the ability to recover from any mistake via reflog or object archaeology is invaluable. Avoid storing multi-gigabyte binaries directly — delegate those to Git LFS or object storage.',
      trade: 'Git\'s snapshot model trades storage space for speed and simplicity of mental model. Repos grow as you add objects, but `git gc` packs loose objects into packfiles using delta compression, recovering most of the space. The learning curve is steep because the CLI exposes internals (staging, SHAs, refs) that most VCS hide, but that transparency is also what makes Git recoverable from almost any mistake.',
      code: `# Initialize and first commit
git init my-project
cd my-project
echo "# My Project" > README.md
git add README.md
git status          # On branch main, Changes to be committed
git commit -m "feat: initial commit"
git log --oneline   # abc1234 feat: initial commit

# Stage specific lines (interactive)
git add -p          # review each hunk individually

# What's staged vs unstaged
git diff            # unstaged changes (working dir vs index)
git diff --staged   # staged changes vs HEAD

# Undo last commit (keep changes staged)
git reset --soft HEAD~1

# Show object internals
git cat-file -t HEAD        # commit
git cat-file -p HEAD        # commit object contents
git ls-tree HEAD            # tree contents
git cat-file -p HEAD:README.md  # blob contents

# Full history graph
git log --oneline --graph --all --decorate`,
      rw: {
        ex: [
          'Linux kernel development — 1,000+ contributors use Git with a strict patch-by-email workflow; Linus Torvalds originally wrote Git in 2005 specifically for this project',
          'GitHub itself uses Git with monorepo tooling (github/github) — internal tooling layers on top of the object store for scale',
          'Google\'s internal Piper monorepo is not Git, but Android, Chromium, and all open-source Google projects use Git with Gerrit code review',
        ],
        cs: 'A financial services team accidentally committed a .env file with production database credentials. The secret had been live in a public GitHub repository for 6 minutes before their GitHub Advanced Security alert fired. They immediately rotated the credential (preventing breach), ran `git filter-repo --path .env --invert-paths`, force-pushed all branches, and invalidated all forks. Post-incident: added `detect-secrets` to their pre-commit hook and required `git add -p` in their contribution guide. The object-store immutability meant the secret was cryptographically present in old object packs until `git gc --prune=now` was run — a subtle point that led them to also notify all contributors to delete their local clones and re-clone.',
      },
    },
    interview: {
      q: 'Explain what `git add` and `git commit` actually do at the object store level.',
      a: '`git add <file>` reads the file content, computes its SHA-1 hash, stores a zlib-compressed blob at `.git/objects/<sha>/`, and updates the binary index at `.git/index` to map the filename to that blob SHA. `git commit` then traverses the index, creates tree objects for each directory (hashing their contents), creates a commit object containing the root tree SHA, the current HEAD commit SHA as parent, author metadata, and message, writes that commit object to the object store, and atomically updates the current branch ref to point to the new commit SHA. HEAD, being a symbolic ref to the branch, implicitly advances.',
      fu: [
        'What happens to the object store when you run `git gc`? What is a packfile?',
        'What is the difference between an annotated tag and a lightweight tag at the object level?',
        'How does `git stash` use the object store? What type of object does it create?',
        'If two branches contain a file with identical content, how many blob objects exist for that file?',
        'What does "detached HEAD" mean, and what happens to commits made in that state?',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. GIT BRANCHING, MERGING & REBASING
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'git-branching',
    cat: 'git',
    color: '#f05032',
    icon: '🌲',
    title: 'Git Branching, Merging & Rebasing',
    tag: 'A branch is just a pointer to a commit — creating one is instant and free',
    overview:
      'In Git, a branch is nothing more than a 41-byte file containing a commit SHA — creating or deleting a branch is an O(1) file write, not a directory copy. This makes branching essentially free, enabling short-lived feature branches, parallel experiments, and isolated bug fixes without the performance penalty of other VCS implementations. Merging and rebasing are the two strategies for integrating work: merge preserves the exact history of how changes were developed (forks visible in the DAG), while rebase replays commits onto a new base to produce a linear, readable history at the cost of rewriting SHAs.',
    components: [
      {
        name: 'Branch',
        icon: '🌿',
        role: 'A 41-byte file in `.git/refs/heads/` containing a commit SHA. Creating a branch = writing a file. O(1).',
        detail:
          'A branch is a named, movable pointer to a commit. When you commit on a branch, Git writes the new commit SHA into the branch file, advancing the pointer. Branches are stored as plain text files under `.git/refs/heads/` (or packed in `.git/packed-refs`). The active branch is recorded in `.git/HEAD` as a symbolic ref like `ref: refs/heads/main`.',
      },
      {
        name: 'Fast-Forward Merge',
        icon: '⏩',
        role: 'When the target branch has no new commits since the feature branch diverged, HEAD just advances. No merge commit created.',
        detail:
          'A fast-forward merge is possible when the current branch is a direct ancestor of the branch being merged — meaning the commit graph is linear between them. Git simply advances the current branch pointer to match the other branch\'s tip. No new commit is created, and `git log` shows a perfectly linear history. Use `--no-ff` to force a merge commit for tracking purposes.',
      },
      {
        name: 'Three-Way Merge',
        icon: '🔀',
        role: 'Uses the common ancestor commit + both branch tips to compute a merge commit. Creates a new commit with two parents.',
        detail:
          'When two branches have diverged (both have commits the other doesn\'t), Git locates the merge base — the most recent common ancestor commit via Lowest Common Ancestor in the commit DAG. It then computes two diffs: merge-base → branch-A and merge-base → branch-B. Changes that don\'t overlap are applied automatically. Overlapping changes to the same lines produce conflicts that must be resolved manually.',
      },
      {
        name: 'Rebase',
        icon: '🔁',
        role: 'Moves commits from a branch onto a new base by replaying them one by one, creating NEW commits with the same changes but different SHAs.',
        detail:
          'Rebase takes each commit on the current branch that isn\'t on the target branch, computes its diff against its parent, and applies that diff onto the target branch tip, creating a new commit object. The new commits have the same tree changes and messages as the originals but different SHAs (different parent, different timestamp). The result is a linear history as if the feature branch was always developed on top of the latest main.',
      },
    ],
    howItWorks: `Branch creation in Git is a file write. \`git branch feature\` creates the file \`.git/refs/heads/feature\` containing the 40-character hex SHA of the current HEAD commit, plus a newline. \`git switch feature\` (or \`git checkout feature\`) updates \`.git/HEAD\` to contain \`ref: refs/heads/feature\`. From this point, every new commit advances the \`feature\` ref, not \`main\`. This is fundamentally different from Subversion, where branching copies directory trees.

Detached HEAD state occurs when you checkout a commit SHA, tag, or remote ref directly: \`.git/HEAD\` contains the raw SHA instead of a symbolic ref. New commits are made and tracked only by that SHA — if you switch branches without creating a new branch, those commits become unreachable (dangling objects) and will be garbage-collected after 90 days. \`git switch -c new-branch\` from detached HEAD saves the work.

The three-way merge algorithm finds the merge base using a Modified Brent Cycle Detection or Lowest Common Ancestor traversal of the commit DAG. Once the base is found, Git generates two patch sets and applies them to the base snapshot. Non-conflicting changes from both sides are merged automatically. A conflict occurs only when both branches modify the same region of the same file in incompatible ways. The conflict markers — \`<<<<<<<\`, \`=======\`, \`>>>>>>>\` — show the two alternatives, which the developer resolves before staging and running \`git merge --continue\`.

Interactive rebase (\`git rebase -i HEAD~N\`) opens a text editor listing the last N commits as \`pick\` entries. You can reorder commits by reordering lines, squash multiple commits into one with \`squash\` or \`fixup\`, edit a commit message with \`reword\`, or pause mid-rebase to amend a commit with \`edit\`. This is the standard way to clean up a messy branch before merging a PR — turning "WIP", "fix typo", and "forgot semicolon" commits into a coherent, reviewable unit.

Merge vs. rebase tradeoffs are philosophical as well as technical. Merge produces an honest record of development history — you can see when a feature branch diverged, who worked on what in parallel, and exactly when integration happened. Rebase produces a clean linear history that is easier to \`git log\`, easier to bisect, and easier for reviewers to read as a sequence of logical steps. The golden rule: **never rebase commits that have already been pushed to a shared remote**. Rebase creates new SHAs for existing commits; anyone who has fetched the originals will have a divergent history and face a forced-push conflict.

The \`--no-ff\` flag forces Git to always create a merge commit even when a fast-forward is possible. This is valuable in mainline branch strategies (e.g., GitFlow) where you want every feature integration to be visible as a merge node in the DAG, making it easy to revert an entire feature by reverting one merge commit. \`git log --first-parent\` on a \`--no-ff\` main branch shows only merge commits, giving a clean feature-level view of history.`,
    decision: {
      choose: [
        'Use merge when integrating long-lived feature branches into main — preserves the full development context and makes large feature rollbacks trivial (`git revert -m 1 <merge-commit>`)',
        'Use rebase to keep a feature branch up-to-date with main during development — produces a clean PR diff with no spurious merge commits',
        'Use interactive rebase to clean up local commits before pushing — squash WIP commits, fix messages, reorder logical steps',
        'Use `--no-ff` merge in GitFlow or release workflows where every feature integration should be a visible node in the history DAG',
      ],
      avoid: [
        'Never `git rebase` a branch that others have already fetched — it rewrites SHAs and forces a destructive force-push to recover',
        'Avoid deep nesting of merge commits from repeated `git merge main` on a feature branch — use `git rebase main` instead to keep the branch tip current',
        'Avoid squashing all commits of a long-running feature into one — lose the ability to bisect within the feature if a regression appears later',
        'Avoid leaving merge conflicts partially resolved — `git diff --check` in CI catches stray conflict markers before they reach production',
      ],
      vs: [
        {
          name: 'Merge (preserve history)',
          when: 'Use merge for integrating feature branches into long-lived branches (main, release). The history truthfully records parallel development. Prefer `--no-ff` so the merge is always visible.',
        },
        {
          name: 'Rebase (linear history)',
          when: 'Use rebase for updating a local feature branch against main before raising a PR. Never rebase after the branch has been pushed and shared with others.',
        },
        {
          name: 'Squash merge',
          when: 'Use squash merge (`git merge --squash`) when the feature branch history is too messy to preserve and you want a single clean commit on main. Loses the individual commit history of the feature.',
        },
      ],
    },
    failures: [
      {
        name: 'Rebasing a shared/public branch',
        cause: 'Running `git rebase main` on a branch that team members have already pulled, then force-pushing the rewritten branch to the remote.',
        symptom: 'Teammates\' `git pull` fails with "Your branch and \'origin/feature\' have diverged." They see duplicate commits, conflict loops, or must run `git pull --rebase` to untangle the mess.',
        fix: 'NEVER rebase commits that have been pushed to a shared remote branch. Use `git revert` to undo published commits safely. If a rebase of a shared branch is absolutely necessary (e.g., removing a committed secret), coordinate with all collaborators, have them delete their local copies and re-clone after the force-push.',
        severity: 'critical',
      },
      {
        name: 'Merge conflict markers left in code',
        cause: 'Developer resolves a conflict by accepting one side, saves the file, but misses a second conflict block. CI does not check for conflict markers.',
        symptom: 'Application fails to parse or compile. Syntax errors in JS/Python/YAML. In interpreted languages, the app crashes at runtime when the conflicted line is executed.',
        fix: 'Add `git diff --check` to your CI pipeline (exits non-zero if conflict markers are present). Use `git mergetool` with a visual diff tool (vimdiff, VS Code, Kaleidoscope) during conflict resolution. Configure your editor to highlight `<<<<<<<` patterns as errors.',
        severity: 'high',
      },
    ],
    a: {
      v: '🗺️ GPS Navigation',
      t: 'A Branch is a Bookmark, Not a Photocopy',
      tx: 'Creating a branch in older VCS (like SVN) is like photocopying an entire map — expensive and slow. Git branches are bookmarks: they just mark a page in the book. Creating one takes milliseconds regardless of repo size. Merging is like combining two travelers\' annotated maps — Git finds where they diverged from the same starting point and combines their annotations, flagging only the spots where both wrote conflicting notes.',
      s: 'Branches are cheap 41-byte pointers; merging uses a three-way algorithm from a common ancestor; rebasing replays commits onto a new base to linearize history — never rebase shared branches.',
    },
    te: {
      def: 'A Git branch is a mutable named reference (a file containing a commit SHA) that advances with each new commit. Merging integrates diverged histories by creating a merge commit from a common ancestor; rebasing replays commits onto a new base to produce a linear history, rewriting SHAs in the process.',
      types: [
        {
          n: 'Local Branch',
          d: 'Lives in `.git/refs/heads/`. Only exists on your machine until pushed. Tracks your working commits.',
        },
        {
          n: 'Remote-Tracking Branch',
          d: 'A local read-only snapshot of a remote branch, e.g. `origin/main`. Updated by `git fetch`. You cannot commit to it directly.',
        },
        {
          n: 'Tracking Branch',
          d: 'A local branch configured to track a remote-tracking branch. `git pull` and `git push` use this relationship to know where to sync.',
        },
        {
          n: 'Detached HEAD',
          d: 'HEAD points directly to a commit SHA rather than a branch name. New commits won\'t be tracked by any branch — capture them with `git switch -c new-branch` before leaving.',
        },
      ],
      when: 'Branch for every unit of work — features, bug fixes, experiments, hotfixes. Keep branches short-lived (days, not months) to minimize merge conflicts. Use a consistent branching strategy (GitHub Flow, GitFlow, trunk-based development) across the team to avoid confusion about what merges where.',
      trade: 'The merge-vs-rebase tradeoff is honesty vs. cleanliness. Merge history is a truthful record of parallel development but can produce a tangled DAG that is hard to read with `git log`. Rebased history is linear and readable but is a reconstruction — the "history" shown never literally happened in that sequence. Both are valid; the choice depends on team convention and whether auditability or readability is the higher priority.',
      code: `# Create and switch to a branch
git switch -c feature/user-auth    # modern syntax
git checkout -b feature/user-auth  # older equivalent

# List all branches
git branch -a          # local + remote
git branch -v          # with last commit

# Fast-forward merge
git switch main
git merge feature/user-auth        # fast-forward if no divergence

# Force a merge commit even when FF is possible
git merge --no-ff feature/user-auth

# Rebase feature branch onto main
git switch feature/user-auth
git rebase main                    # replay commits on top of latest main

# Interactive rebase — squash last 3 commits
git rebase -i HEAD~3
# In editor: change 'pick' to 'squash' on commits to combine

# Resolve a merge conflict
git merge feature/user-auth
# Edit conflicted files (look for <<<<<<< ======= >>>>>>>)
git add <resolved-files>
git merge --continue

# Delete branches
git branch -d feature/user-auth    # safe delete (checks merged)
git branch -D feature/user-auth    # force delete
git push origin --delete feature/user-auth  # delete remote branch

# Squash merge (all feature commits → one commit on main)
git switch main
git merge --squash feature/user-auth
git commit -m "feat: user auth (squashed)"`,
      rw: {
        ex: [
          'GitHub Flow — every feature is a short-lived branch off main, merged via PR with required review. Used by GitHub, Vercel, and most SaaS startups for continuous deployment.',
          'GitFlow — two long-lived branches (main + develop) with supporting feature/, release/, and hotfix/ branches. Used in teams with scheduled release cycles (mobile apps, firmware).',
          'Trunk-Based Development — all developers commit to a single main branch using feature flags to hide incomplete work. Used at Google, Facebook, and Netflix for high-frequency deployment.',
        ],
        cs: 'A platform team at a fintech company adopted a policy of rebasing all feature branches before merge. A senior engineer rebased a long-running payments-refactor branch (3 weeks, 47 commits) onto main and force-pushed. Four engineers had been reviewing and making small fixup commits on the remote branch. After the force-push, their local branches diverged from origin. Two engineers ran `git pull` (creating accidental merge commits), one ran `git pull --force` (losing their local fixups), and one correctly ran `git fetch && git rebase origin/payments-refactor`. The incident led to a team policy: rebase is only allowed on local-only branches; once a branch is pushed and in review, use merge commits only.',
      },
    },
    interview: {
      q: 'When would you use rebase instead of merge, and what is the danger of rebasing?',
      a: 'I use rebase in two scenarios: (1) keeping a local feature branch current with main during development — `git rebase main` on my feature branch gives me a clean PR diff with no spurious merge commits, and (2) cleaning up local commits before raising a PR with `git rebase -i HEAD~N` to squash WIP commits and improve messages. The danger of rebase is that it rewrites commit SHAs. Every rebased commit gets a new SHA because its parent has changed. If I rebase a branch that others have already fetched and built on, their local history diverges from the rewritten remote history. Their next `git pull` fails or creates duplicate commits. The golden rule: never rebase commits that exist on a shared remote. Use `git revert` instead to safely undo published commits by adding a new commit that reverses the changes.',
      fu: [
        'What is the merge base, and how does Git find it during a three-way merge?',
        'What does `git merge --squash` do, and how does it differ from interactive rebase squashing?',
        'How would you recover if you accidentally force-pushed a rebased branch over a shared remote branch?',
        'What is `git rerere` and when is it useful in a project with frequent merge conflicts?',
        'Explain what `git log --first-parent` shows and why it is useful on a `--no-ff` main branch.',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. GIT ADVANCED COMMANDS
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'git-advanced',
    cat: 'git',
    color: '#f05032',
    icon: '⚡',
    title: 'Git Advanced Commands',
    tag: 'Cherry-pick, stash, reset, revert — the surgeon tools of Git',
    overview:
      'Beyond the day-to-day add/commit/push workflow, Git provides a set of precision tools for manipulating history, recovering from mistakes, and isolating work in progress. `git stash` gives you a clean slate without committing, `git cherry-pick` applies individual commits across branches, `git reset` and `git revert` undo changes with different safety guarantees, `git reflog` is the universal undo for destructive operations, and `git bisect` uses binary search to locate regression-introducing commits in O(log n) time. Mastering these commands separates developers who fear Git history from those who use it as a safety net.',
    components: [
      {
        name: 'git stash',
        icon: '📦',
        role: 'Saves working directory + index state onto a stack, restores a clean working tree. `git stash pop` restores the latest stash and removes it from the stack.',
        detail:
          'Stash stores your work-in-progress as a special merge commit under `refs/stash`, with two parents: one for the index state and one for the working directory state. Multiple stashes form a LIFO stack addressed as `stash@{0}`, `stash@{1}`, etc. By default, untracked new files are not stashed — use `--include-untracked` to capture them.',
      },
      {
        name: 'git cherry-pick',
        icon: '🍒',
        role: 'Applies the diff introduced by a specific commit onto the current branch, creating a new commit with a new SHA.',
        detail:
          'Cherry-pick computes the diff between a commit and its parent, then applies that patch to the current HEAD. If the patch applies cleanly, a new commit is created with the same message and author but a new SHA and new parent. If the code has diverged, a conflict occurs and must be resolved before running `git cherry-pick --continue`. Use sparingly — cherry-picked commits create duplicate history that can confuse merges later.',
      },
      {
        name: 'git reset',
        icon: '↩️',
        role: 'Moves HEAD (and optionally the index and working directory) to a different commit. `--soft`: HEAD only. `--mixed` (default): HEAD + index. `--hard`: HEAD + index + working directory (destructive).',
        detail:
          'The three modes of reset map to the three-tree model. `--soft` only moves the HEAD ref — the index and working directory are untouched, so your changes are still staged. `--mixed` also resets the index to match the new HEAD — changes move from staged to unstaged. `--hard` additionally overwrites the working directory with the HEAD snapshot — all uncommitted changes are permanently destroyed. Only `--hard` is destructive to uncommitted work.',
      },
      {
        name: 'git revert',
        icon: '🔄',
        role: 'Creates a NEW commit that undoes the changes of a specific commit. Safe for public branches — does not rewrite history.',
        detail:
          'Revert computes the inverse diff of the target commit and applies it as a new commit. The original commit remains in history — history is never rewritten. This makes revert the only safe way to undo changes on a shared branch. `git revert -m 1 <merge-commit>` reverts an entire merge, choosing parent 1 (typically main) as the mainline.',
      },
    ],
    howItWorks: `\`git stash\` is implemented as a special commit in the object store. When you run \`git stash\`, Git creates a stash commit that is a merge commit with two parents: the index commit (a tree representing the staged state) and a working directory commit (a tree representing the full working directory state). The stash ref at \`refs/stash\` is updated to point to this commit, and previous stashes are recorded as additional parents, forming the stack. The working directory and index are then reset to HEAD. \`git stash pop\` applies the diff back and removes \`stash@{0}\` from the stack; \`git stash apply\` applies without removing.

\`git cherry-pick\` is patch application on top of a commit graph. Git computes \`diff(commit^, commit)\` — the diff between the target commit and its immediate parent — and applies that patch to the current HEAD using the same three-way merge machinery. This means cherry-pick benefits from the merge base algorithm: if the surrounding code has changed significantly, Git can still apply the patch correctly as long as the immediate context lines match. Cherry-pick conflicts arise when the same code that was changed in the cherry-picked commit has also changed differently in the target branch.

The \`git reset\` three-tree model is the clearest mental model in Git. Imagine three snapshots: HEAD (last committed state), the Index (proposed next commit), and the Working Directory (current files on disk). \`--soft\` moves only the HEAD label to a new commit; the index and working directory remain where they were, so your changes appear staged. \`--mixed\` (the default) moves HEAD and resets the index to match the new HEAD, effectively unstaging your changes. \`--hard\` moves all three — HEAD, index, and working directory all become identical to the target commit. Any uncommitted changes in the working directory that are not in the target commit are permanently lost.

\`git reflog\` is the safety net that makes Git effectively undo-able. Every time HEAD moves — whether from a commit, checkout, reset, rebase, or merge — Git appends an entry to \`.git/logs/HEAD\`. This log is kept for 90 days by default (controlled by \`gc.reflogExpire\`). After an accidental \`git reset --hard\`, the lost commit SHA is visible in the reflog as \`HEAD@{1}\` and you can recover it with \`git reset --hard HEAD@{1}\` or \`git branch recover HEAD@{1}\`. The crucial limitation: reflog only records committed states. Work that was never committed — staged or unstaged changes at the time of \`--hard\` reset — cannot be recovered through reflog.

\`git bisect\` turns a regression hunt from O(n) manual checkout-and-test into O(log n) binary search. You mark the current HEAD as bad (\`git bisect bad\`) and a known-good commit or tag (\`git bisect good v1.2.0\`). Git computes the midpoint of the commit range and checks it out. You test, then mark \`good\` or \`bad\`. Git halves the search space and checks out the next midpoint. After \`log2(N)\` iterations, Git identifies the exact first bad commit. \`git bisect run <test-script>\` automates the loop: the test script exits 0 for good, non-zero for bad.

\`git blame -L 10,25 src/auth.ts\` annotates each line with the last commit that touched it — author, SHA, date. This is the authoritative answer to "who wrote this and why" — every blame line is a clickable link to a commit message explaining the context. The pickaxe search \`git log -S "functionName" --all\` finds the exact commit that added or removed a string, even if it has moved across files — invaluable for tracing when a security-sensitive function was introduced or deleted.`,
    decision: {
      choose: [
        'Use `git stash push -m "description"` when you need to switch context urgently — always name your stashes so you know what\'s in them',
        'Use `git cherry-pick` for backporting a specific bug fix from main to a maintenance release branch without merging all of main',
        'Use `git revert` to undo changes on a shared/published branch — it never rewrites history and is always safe to push',
        'Use `git reflog` immediately after any accidental destructive operation — it is your first and best recovery tool',
        'Use `git bisect run <script>` to automate regression hunting in large codebases with a reliable automated test',
      ],
      avoid: [
        'Avoid accumulating many unnamed stashes — they become unmanageable. Use descriptive names or short-lived WIP branches instead',
        'Avoid `git reset --hard` when you have uncommitted changes you might need — always stash first',
        'Avoid cherry-picking commits that will later be merged via a PR — the duplicate SHAs confuse three-way merges and pollute `git log`',
        'Avoid `git reset --hard` on a shared branch — it rewrites history and forces collaborators into recovery mode',
      ],
      vs: [
        {
          name: '`git reset` vs `git revert`',
          when: 'Use `git reset` to undo local, unpublished commits — it rewrites history cleanly for work you haven\'t shared. Use `git revert` for undoing published commits — it adds a new commit and never breaks shared history.',
        },
        {
          name: '`git stash` vs WIP branch',
          when: 'Use stash for brief context switches (minutes to hours). Use a WIP branch (`git switch -c wip/feature`) for multi-day shelving — it shows up in `git branch`, is easier to push to a remote backup, and doesn\'t get lost in a stash stack.',
        },
        {
          name: '`git cherry-pick` vs `git merge`',
          when: 'Use cherry-pick to apply a specific isolated fix to another branch. Use merge to integrate all changes from one branch into another. Cherry-pick creates duplicate commit history; use it sparingly.',
        },
      ],
    },
    failures: [
      {
        name: '`git reset --hard` losing uncommitted work',
        cause: 'Running `git reset --hard HEAD` or `git reset --hard <sha>` while having staged or unstaged changes that were never committed. The three-tree hard reset overwrites the working directory with the target snapshot, permanently destroying non-committed content.',
        symptom: 'Files modified or staged before the reset are gone. `git status` shows a clean working tree. `git reflog` shows the reset happened but the lost changes were never in a commit — no object was created for them.',
        fix: 'The changes cannot be recovered via reflog because they were never committed. Prevention: always `git stash` before any hard reset, even if you think you don\'t need it. If you had staged changes, they might be recoverable via `git fsck --lost-found` which dumps dangling objects — but this is unreliable and only works if `git add` was run (creating blob objects) before the reset.',
        severity: 'critical',
      },
      {
        name: 'Cherry-pick creating duplicate commits',
        cause: 'A commit is cherry-picked onto a branch, and later that same branch is merged into main via PR — main now contains both the cherry-picked commit and the original commit with different SHAs but identical diffs.',
        symptom: '`git log` shows two commits with identical messages and changes. `git diff` between them shows nothing. Code review history is confusing. Automated tools that check for duplicate work may fire.',
        fix: 'Before cherry-picking, run `git log --cherry-pick --left-right branch1...branch2` to identify commits that are equivalent (marked with `=`) — these already exist on the other side and do not need cherry-picking. If duplicates already exist, they are harmless to the codebase but pollute history; use `git rebase --onto` to remove them if the branch hasn\'t been merged yet.',
        severity: 'medium',
      },
    ],
    a: {
      v: '🏥 Surgical Tools',
      t: 'Reset is a Scalpel, Revert is a Band-Aid',
      tx: '`git reset` is a scalpel — precise, powerful, and dangerous in the wrong situation. It cuts out history directly, leaving no trace. Perfect for private surgery (local commits), but you would never use it on a patient others are also treating (shared branches). `git revert` is a band-aid placed over the wound: the original injury is still visible in the record, but the damage is covered. Stash is your surgical tray — a sterile holding area for tools you need to set aside momentarily. Reflog is the hospital\'s black box recorder: even if the surgery goes wrong, you can replay exactly what happened.',
      s: 'Use revert for public branches (adds a new undo commit), reset for local history cleanup (rewrites history), stash for WIP shelving, and reflog as the universal recovery net for destructive operations.',
    },
    te: {
      def: 'Git\'s advanced commands manipulate the three-tree model (HEAD, index, working directory) and the commit DAG directly. Reset rewrites history locally, revert undoes publicly by appending, stash shelves work as a special commit, cherry-pick applies isolated diffs, reflog records every HEAD movement for recovery, and bisect performs binary search across the commit history.',
      types: [
        {
          n: 'git stash (stack-based WIP storage)',
          d: 'Stores working directory and index as a special merge commit under refs/stash. Supports named stashes, partial stashing with -p, and untracked file inclusion with --include-untracked.',
        },
        {
          n: 'git cherry-pick (single-commit patch application)',
          d: 'Applies the diff of a specific commit onto the current HEAD. Creates a new commit with a new SHA. Used for backporting fixes between release branches.',
        },
        {
          n: 'git reset (three-mode history rewrite)',
          d: 'Three modes: --soft (HEAD only), --mixed (HEAD + index), --hard (HEAD + index + working dir). Only --hard destroys uncommitted work. Never use on shared branches.',
        },
        {
          n: 'git bisect (binary search for regressions)',
          d: 'Marks a good and bad commit, then performs binary search through the commit DAG to find the first bad commit in O(log n) steps. Automatable with `git bisect run`.',
        },
        {
          n: 'git reflog (HEAD position journal)',
          d: 'Records every HEAD movement for 90 days. The first tool to reach for after any accidental destructive git operation. Commits can be recovered by SHA even after being "deleted" by reset.',
        },
      ],
      when: 'Use these tools when basic add/commit/push is insufficient: context switching mid-task (stash), backporting isolated fixes (cherry-pick), cleaning up local pre-push history (reset), undoing published mistakes (revert), recovering from accidents (reflog), and diagnosing when a regression was introduced (bisect).',
      trade: 'The power of these commands comes with proportional risk. `git reset --hard` and rebase are the only Git operations that can cause unrecoverable data loss (for uncommitted work). All committed work is recoverable for 90 days via reflog. The discipline tradeoff is between Git history as a faithful record of how work happened (merge, revert) versus Git history as a curated, readable narrative (reset, rebase, squash). High-trust teams with strong PR review culture lean toward linear, curated history; audit-heavy or compliance-driven teams lean toward preserving the raw record.',
      code: `# ── STASH ──────────────────────────────────────────────
git stash                          # stash everything (tracked changes)
git stash push -m "WIP auth flow"  # named stash
git stash push --include-untracked # include new untracked files
git stash list                     # stash@{0}, stash@{1}, ...
git stash pop                      # apply + remove stash@{0}
git stash apply stash@{2}          # apply without removing
git stash drop stash@{0}           # delete specific stash
git stash show -p stash@{0}        # diff of stash contents

# ── CHERRY-PICK ────────────────────────────────────────
git cherry-pick abc1234            # apply one commit
git cherry-pick abc1234..def5678   # apply a range (exclusive..inclusive)
git cherry-pick -n abc1234         # apply changes without committing (--no-commit)

# ── RESET ──────────────────────────────────────────────
git reset --soft HEAD~1    # undo commit, keep changes STAGED
git reset HEAD~1           # undo commit, keep changes UNSTAGED (mixed)
git reset --hard HEAD~1    # undo commit, DISCARD all changes (destructive!)
git reset HEAD <file>      # unstage a specific file

# ── REVERT ─────────────────────────────────────────────
git revert abc1234         # new commit that undoes abc1234 (safe for public branches)
git revert HEAD~3..HEAD    # revert last 3 commits
git revert -n abc1234      # stage the revert without committing

# ── REFLOG — the undo for reset --hard ─────────────────
git reflog                 # every HEAD position in last 90 days
git reset --hard HEAD@{3}  # recover to any previous state

# ── BISECT ─────────────────────────────────────────────
git bisect start
git bisect bad                     # current HEAD is broken
git bisect good v1.2.0             # this tag was working
# Git checks out midpoint — test it, then:
git bisect good   # or: git bisect bad
# Repeat until git reports the first bad commit
git bisect reset  # exit bisect mode

# ── BLAME ──────────────────────────────────────────────
git blame -L 10,25 src/auth.ts     # who wrote lines 10-25
git log -S "functionName" --all    # when was this string added/removed (pickaxe)`,
      rw: {
        ex: [
          'The Linux kernel uses `git cherry-pick` extensively to backport security fixes from mainline to stable branches (linux-5.15.y, linux-6.1.y) — each stable release is a curated set of cherry-picked patches',
          'Netflix engineering uses `git bisect run` with automated canary test scripts to identify which commit in a batch of changes caused a streaming quality regression',
          'GitHub\'s own monorepo uses `git reflog` workflows documented in internal runbooks as the first response for engineers who accidentally reset or rebased incorrectly in their feature branches',
        ],
        cs: 'A backend engineer at an e-commerce company ran `git reset --hard HEAD~5` intending to unstage some files, not realizing `--hard` would destroy their 3 hours of uncommitted work on a payment integration. `git reflog` showed `HEAD@{1}` through `HEAD@{5}` as the previous commits — but the actual in-progress code changes had never been committed, so they existed only as working directory files with no corresponding blob objects. `git fsck --lost-found` recovered two of the five modified files whose blobs happened to have been created by `git add` earlier in the session. The other three files were permanently lost. The incident led to a team rule: configure `git` aliases so that `git hard` always prompts for confirmation, and stash before any reset. The engineer also set up `git status` to run automatically in their shell prompt (via `oh-my-zsh` git plugin) as a constant reminder of uncommitted state.',
      },
    },
    interview: {
      q: 'What is the difference between `git reset` and `git revert`, and when do you use each?',
      a: '`git reset` moves the HEAD pointer (and optionally the index and working directory) to a previous commit, effectively rewriting history. In `--soft` mode, only HEAD moves and changes remain staged. In `--mixed` mode (default), HEAD and index are reset, moving changes to unstaged. In `--hard` mode, HEAD, index, and working directory are all reset — uncommitted changes are permanently lost. Because reset rewrites history, it is only safe for commits that have not been shared with others. `git revert` takes the opposite approach: it computes the inverse of a commit\'s changes and creates a NEW commit that undoes them. The original commit remains in history. This is always safe for public branches because history is never rewritten — collaborators can pull the revert commit normally. The decision rule: if the commit is local and unpublished, reset gives a clean history. If the commit is on a shared branch or already pushed, revert is the only safe choice.',
      fu: [
        'What is stored in `refs/stash` and how does Git implement the stash stack?',
        'How would you use `git bisect run` to automate finding a regression? What exit code conventions does the test script need to follow?',
        'What does `git reflog expire --expire=now --all && git gc --prune=now` do, and when would you need to run it?',
        'How do you revert a merge commit, and what does the `-m 1` flag mean?',
        'If you accidentally dropped a stash (`git stash drop`), how might you recover it?',
      ],
    },
  },
];
