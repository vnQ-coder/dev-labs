import { Concept } from '../types';

export const GIT_CONCEPTS_PART2: Concept[] = [
  {
    id: 'git-remote',
    cat: 'git',
    color: '#f05032',
    icon: '🌐',
    title: 'Git Remote & Collaboration',
    tag: 'A remote is just a URL alias — git push is copying commits to another object store',
    overview:
      'Remotes are named references to other Git repositories — most commonly on GitHub or GitLab. Understanding the difference between fetch and pull, how tracking branches work, and when to rebase vs merge on pull determines whether your team history is clean or a tangle of merge commits. The origin/upstream convention, safe force-pushing with --force-with-lease, and annotated tags are all essential daily-driver knowledge for collaborative workflows.',
    components: [
      {
        name: 'Remote',
        icon: '🔗',
        role: 'A named URL alias (origin, upstream) stored in .git/config',
        detail:
          'Points to another Git object store — GitHub, GitLab, or self-hosted. Remotes are just shorthand labels; the repo has no live connection until you run fetch/push. Add with `git remote add`, inspect with `git remote -v`.',
      },
      {
        name: 'Tracking Branch',
        icon: '📡',
        role: 'A local reference (origin/main) mirroring last known state of the remote branch',
        detail:
          'Stored under .git/refs/remotes/. Updated only by `git fetch` — never by local commits. They are read-only snapshots of what the remote looked like when you last fetched. `git branch -vv` shows the tracking relationship and how many commits ahead/behind you are.',
      },
      {
        name: 'git fetch',
        icon: '⬇️',
        role: 'Downloads new objects from remote but does NOT modify local branches',
        detail:
          'Safe to run anytime — no destructive side effects. Updates origin/* tracking refs so you can inspect remote changes with `git log origin/main` before integrating them. `git fetch --prune` removes tracking refs for branches deleted on the remote.',
      },
      {
        name: 'git pull',
        icon: '🔄',
        role: 'git fetch + git merge (default) or git fetch + git rebase (with --rebase)',
        detail:
          'The default merge strategy creates a "merge pull commit" that clutters history — especially noisy in PRs. `git pull --rebase` replays your local commits on top of the updated remote branch, keeping history linear. Set `git config pull.rebase true` to make rebase the default.',
      },
    ],
    howItWorks:
      'Remote tracking refs live in `.git/refs/remotes/`. When you run `git fetch origin`, Git downloads any new objects (blobs, trees, commits) from the remote and updates refs like `origin/main` to point to the new tip — but your local `main` branch is untouched. You must explicitly integrate the changes with `git merge origin/main` or `git rebase origin/main`.\n\n`git pull` is a two-step shortcut: fetch + merge. The merge creates an extra "Merge branch \'main\' of ..." commit that adds noise to history. `git pull --rebase` instead runs fetch + rebase, replaying your local commits on top of the updated remote tip. Configure it globally with `git config --global pull.rebase true`.\n\nConvention: `origin` = your fork or primary remote; `upstream` = the original repo you forked from. Add upstream with `git remote add upstream <url>`. Sync your fork: `git fetch upstream && git rebase upstream/main && git push --force-with-lease`.\n\nTags: lightweight tags (`git tag v1.0`) are just a ref pointing to a commit — no extra metadata. Annotated tags (`git tag -a v1.0 -m "Release"`) are full Git objects with a tagger name, email, date, and GPG signature capability. Always use annotated tags for releases. Push tags explicitly: `git push origin --tags` or `git push origin v1.0.0`.\n\nSetting upstream tracking: `git push -u origin feature` sets the tracking relationship so that subsequent `git push` (no args) knows where to push. Check tracking with `git branch -vv`.\n\nForce push safely: `git push --force-with-lease` checks that the remote ref matches what you last fetched — if someone else pushed since your last fetch, the command fails rather than silently overwriting their work. Always prefer `--force-with-lease` over `--force`. Configure `push.default current` to avoid accidentally pushing to wrong branches.',
    decision: {
      choose: [
        'Use `git pull --rebase` (or configure `pull.rebase true`) to keep local history linear',
        'Use `git fetch` first when you want to inspect remote changes before integrating',
        'Use annotated tags (`git tag -a`) for any versioned release — they carry metadata',
        'Use `--force-with-lease` instead of `--force` when rewriting pushed history',
        'Use `git remote add upstream` on forks to easily sync with the original repo',
        'Set `-u` on first push (`git push -u origin feature`) to enable arg-less future pushes',
      ],
      avoid: [
        'Avoid `git push --force` on shared branches — use `--force-with-lease`',
        'Avoid `git pull` (merge mode) on feature branches — it pollutes history with merge commits',
        'Avoid pushing directly to main/master without a PR review process',
        'Avoid lightweight tags for releases — they lack authorship and GPG signing capability',
        'Avoid forgetting `--prune` when remotes delete branches — stale tracking refs accumulate',
      ],
      vs: [
        {
          name: 'git pull (merge) vs git pull --rebase',
          when:
            'Use --rebase for feature branches to keep a clean, linear history. Use merge pull only when the merge commit itself is meaningful (e.g., integrating a long-lived release branch).',
        },
        {
          name: 'git push --force vs --force-with-lease',
          when:
            'Always prefer --force-with-lease — it fails safely if someone else pushed since your last fetch. Use --force only when you are absolutely certain no teammates have pushed (e.g., your own private fork).',
        },
        {
          name: 'Lightweight tag vs annotated tag',
          when:
            'Use annotated tags for releases, changelogs, and anything that needs authorship or GPG signing. Use lightweight tags only for ephemeral local markers that will never be pushed.',
        },
        {
          name: 'origin vs upstream remote',
          when:
            'origin = your fork where you push feature branches and open PRs. upstream = the canonical repo you forked from. Fetch from upstream to stay in sync; push to origin to share work.',
        },
      ],
    },
    failures: [
      {
        name: 'Force push wiping teammates\' commits',
        cause:
          'Running `git push --force` on a shared branch after rebasing locally — overwrites commits that teammates pushed since your last fetch',
        symptom:
          'Teammates see their commits disappear from the remote branch; CI breaks on missing refs; angry Slack messages',
        fix:
          'Always use `git push --force-with-lease` — it checks that the remote ref matches your last fetched state and fails if it has moved. Configure `git config push.default simple` to prevent accidental pushes to wrong branches. Establish a team rule: never force-push to main/develop.',
        severity: 'critical',
      },
      {
        name: 'Merge commits cluttering PR history',
        cause:
          '`git pull` defaulting to merge mode creates an extra "Merge branch..." commit every time you sync with the remote',
        symptom:
          'Git log is a tangled web of merge commits making bisect, blame, and code review painful',
        fix:
          'Set `git config --global pull.rebase true` so `git pull` always rebases. Use `git pull --rebase` explicitly until it is configured globally. Squash-merge feature branches on PR merge to keep main history clean.',
        severity: 'medium',
      },
    ],
    a: {
      v: '📬 Post office with named delivery addresses',
      t: 'Git remotes are like named post office addresses',
      tx: 'origin and upstream are just labels for delivery addresses (remote repos). git fetch picks up new mail (commits) into your local P.O. box (tracking refs) without unpacking it yet. git pull picks up the mail AND immediately puts it on your desk (merges into your branch). git push sends your outgoing mail to the remote address.',
      s: 'Remote = address label. fetch = pick up mail. pull = pick up + unpack. push = send mail.',
    },
    te: {
      def: 'A Git remote is a named alias for a URL pointing to another Git object store. Remote tracking branches (origin/main) are read-only local snapshots of the remote\'s branch tips, updated only by fetch. Pull combines fetch with either merge or rebase to integrate remote changes into the local branch.',
      types: [
        {
          n: 'HTTPS remote',
          d: 'Uses HTTPS URL — requires username/password or PAT for authentication. Easier to set up but prompts for credentials on each push unless a credential helper is configured.',
        },
        {
          n: 'SSH remote',
          d: 'Uses git@ URL — authenticates via SSH key pair. No password prompts after setup. Preferred for daily development. Switch with `git remote set-url origin git@github.com:user/repo.git`.',
        },
        {
          n: 'Tracking branch',
          d: 'A local read-only ref (origin/main) stored in .git/refs/remotes/. Shows last known state of the remote branch. Updated by fetch, never by local commits.',
        },
        {
          n: 'Annotated tag',
          d: 'A full Git object containing tagger identity, date, message, and optional GPG signature. Created with `git tag -a`. Preferred for releases because it carries metadata beyond just a commit pointer.',
        },
      ],
      when:
        'Use `git fetch` when you want to see what changed remotely before integrating. Use `git pull --rebase` for routine syncing to keep history linear. Use `git push --force-with-lease` when rewriting history on a shared branch (e.g., after an interactive rebase). Use annotated tags for every versioned release.',
      trade:
        'Merge pull preserves exact history of when integration happened but adds noisy merge commits. Rebase pull gives cleaner linear history but rewrites local commits, changing their SHAs — do not rebase commits already pushed to a shared branch. Force-with-lease is safer than force but still rewrites remote history; coordinate with the team first.',
      code: `# ── REMOTES ────────────────────────────────────────────
git remote -v                              # list remotes with URLs
git remote add origin https://github.com/user/repo.git
git remote add upstream https://github.com/original/repo.git
git remote set-url origin git@github.com:user/repo.git  # change URL
git remote remove upstream                 # remove a remote

# ── FETCH vs PULL ──────────────────────────────────────
git fetch origin          # download objects, update origin/*, don't touch local branches
git fetch --all           # fetch all remotes
git fetch --prune         # remove tracking refs for deleted remote branches

git pull                  # fetch + merge (creates merge commit)
git pull --rebase         # fetch + rebase (linear history, preferred)
git pull --rebase=interactive  # fetch + interactive rebase

# ── PUSH ───────────────────────────────────────────────
git push -u origin feature/login   # push + set upstream tracking
git push                           # subsequent pushes (upstream already set)
git push origin --delete feature/login  # delete remote branch
git push --force-with-lease        # safe force push (fails if remote changed)
git push --force                   # DANGEROUS — overwrites remote history

# ── SYNC FORK WITH UPSTREAM ────────────────────────────
git fetch upstream
git switch main
git rebase upstream/main
git push --force-with-lease

# ── TAGS ───────────────────────────────────────────────
git tag                            # list all tags
git tag v1.0.0                     # lightweight tag (just a ref)
git tag -a v1.0.0 -m "First GA release"  # annotated tag (full object)
git push origin --tags             # push all tags
git push origin v1.0.0             # push specific tag
git tag -d v1.0.0                  # delete local tag
git push origin --delete v1.0.0   # delete remote tag

# ── TRACKING ───────────────────────────────────────────
git branch -vv             # show tracking relationships
git branch --set-upstream-to=origin/main main`,
      rw: {
        ex: [
          'GitHub / GitLab — origin remote for all push/PR workflows',
          'Open source forks — upstream remote to sync with canonical repo via fetch + rebase',
          'CI/CD pipelines — git fetch to check remote state before deploying',
          'Release automation — annotated tags trigger GitHub Releases and semantic versioning tools',
          'Monorepos — multiple remotes (origin, mirror) for disaster recovery replication',
        ],
        cs: 'The Linux kernel project uses the upstream/origin convention across thousands of contributor forks. Each contributor clones Linus\'s tree as upstream and their own fork as origin. The "fetch upstream, rebase, push to origin, open PR" workflow is the backbone of all open-source collaboration on GitHub and keeps the canonical tree\'s history linear and bisectable.',
      },
    },
    interview: {
      q: 'What\'s the difference between `git fetch` and `git pull`, and which do you prefer?',
      a: '`git fetch` downloads new objects from the remote and updates remote tracking refs (origin/main) but leaves your local branches completely untouched — it is always safe. `git pull` is fetch + merge (by default) or fetch + rebase (with --rebase). I prefer `git pull --rebase` and configure it globally with `pull.rebase true` because it keeps history linear — my commits are replayed on top of the updated remote tip rather than creating a noisy merge commit. The key insight is that fetch is a read-only operation you can run anytime to inspect what changed before deciding how to integrate.',
      fu: [
        'What is a remote tracking branch and where is it stored on disk?',
        'When would you use `git push --force-with-lease` vs `--force`? What problem does --force-with-lease solve?',
        'What is the difference between a lightweight tag and an annotated tag? Which do you use for releases and why?',
        'Explain the origin vs upstream convention for a forked repository. How do you keep your fork in sync?',
        'What does `git push -u origin feature` do differently than `git push origin feature`?',
        'If a teammate says their commits disappeared from the remote branch, what likely happened and how do you prevent it?',
      ],
    },
  },

  {
    id: 'git-internals',
    cat: 'git',
    color: '#f05032',
    icon: '🔧',
    title: 'Git Internals & .git Directory',
    tag: 'Git is a content-addressable filesystem with a VCS interface on top',
    overview:
      'Every Git operation ultimately reads or writes to the `.git/` directory — a self-contained object store and ref database. Understanding the four object types (blob, tree, commit, tag), how SHA-1 addressing works, what the index file does, how packfiles compress history, and how hooks automate quality gates transforms Git from a black box into a transparent, debuggable system. This knowledge is essential for advanced operations like history rewriting, repo size management, and building CI tooling.',
    components: [
      {
        name: 'Object Store (.git/objects/)',
        icon: '🗄️',
        role: 'All blobs, trees, commits, and tags stored as zlib-compressed SHA-1-named files',
        detail:
          'Each object is identified by the SHA-1 hash of its type + size + content. Stored at .git/objects/ab/cdef... (first two hex chars = directory, remaining 38 = filename) for filesystem efficiency. Four types: blob (file content), tree (directory listing), commit (snapshot + metadata), tag (annotated tag object). Content-addressable means identical content always produces the same SHA — Git deduplicates automatically.',
      },
      {
        name: 'Refs (.git/refs/)',
        icon: '🏷️',
        role: 'Plain text files containing 40-char SHA hashes — human-readable names for commits',
        detail:
          'heads/ contains local branches (main = .git/refs/heads/main). remotes/ contains remote tracking refs (origin/main = .git/refs/remotes/origin/main). tags/ contains tag refs. HEAD is a symbolic ref pointing to the current branch file. Packed refs are consolidated into .git/packed-refs for performance when there are many refs.',
      },
      {
        name: 'Packfiles (.git/objects/pack/)',
        icon: '📦',
        role: 'Compressed archive of many objects with delta encoding for space efficiency',
        detail:
          'After many loose objects accumulate, `git gc` packs them into a .pack file alongside a .idx index. Delta compression stores only the diff between similar blobs (e.g., consecutive versions of the same file), reducing repo size by 10-50×. Each packfile has a companion .idx file for O(log n) object lookup without scanning the entire pack.',
      },
      {
        name: 'Git Hooks (.git/hooks/)',
        icon: '🪝',
        role: 'Shell scripts executed at lifecycle events to automate quality gates',
        detail:
          'Common hooks: pre-commit (runs before commit is created — exit 1 aborts), commit-msg (receives the commit message file — used to enforce conventional commits), pre-push (runs before push — used for tests), post-merge (runs after merge — used to reinstall dependencies). Hooks are not committed to the repo by default — use Husky or lefthook for team-wide hooks.',
      },
    ],
    howItWorks:
      'Walk through what happens when you run `git commit`:\n\n1. **Staging → Blobs**: For each file in the index (staging area), Git hashes the content as `blob <size>\\0<content>` → SHA-1 → writes a zlib-compressed file to `.git/objects/`.\n2. **Tree objects**: Git builds tree objects recursively for each directory — a tree lists filenames, modes (100644 for file, 040000 for dir), and the SHA of each blob or subtree.\n3. **Commit object**: Git creates a commit object containing: the root tree SHA, parent commit SHA(s), author name/email/timestamp, committer name/email/timestamp, and the commit message. This object is also SHA-1 hashed and stored.\n4. **Update ref**: Git writes the new commit SHA to `.git/refs/heads/<current-branch>` (or `.git/packed-refs`). HEAD continues pointing to the branch name.\n5. **Update index**: The index is updated to reflect the committed state, clearing the staged changes.\n\n**Index file** (`.git/index`): A binary file listing every tracked file with its mode, SHA-1, and stat cache (mtime, ctime, inode) for fast dirty checking. Git compares the filesystem stat metadata against the cached values — if stat matches, it skips re-hashing. Only if stat differs does it re-hash to confirm whether the file truly changed.\n\n**Packfiles and git gc**: Every commit creates new loose object files. After ~6,700 loose objects (or on explicit `git gc`), Git runs `git pack-objects` which: sorts objects by type and filename similarity, delta-compresses similar blobs (storing only the diff), writes a single `.pack` binary, and generates a binary `.idx` index for O(log n) lookup. This reduces thousands of small files into one compressed archive, improving clone speed and disk usage by up to 50×.\n\n**Hooks**: The `pre-commit` hook at `.git/hooks/pre-commit` is executed before Git creates the commit object. If it exits with a non-zero status, the commit is aborted. Used for linting, secret scanning, formatting. The `commit-msg` hook receives a path to a temp file containing the commit message — parse and validate it; exit 1 to reject. The `pre-push` hook runs before any push — ideal for running the test suite on changed files.\n\n**Config scoping**: Git merges config from three levels: system (`/etc/gitconfig`) → global (`~/.gitconfig`) → local (`.git/config`). Local always wins. Use `git config --list --show-origin` to see every setting and which file it came from.',
    decision: {
      choose: [
        'Use `git cat-file -p <SHA>` to inspect any object type when debugging mysterious repo state',
        'Use `git gc --aggressive` before archiving or sharing large repos to minimize size',
        'Use `git filter-repo` (not filter-branch) to surgically remove large files or secrets from history',
        'Use Husky or lefthook to commit hooks to the repo so all teammates get them automatically',
        'Use `git ls-files --stage` to debug staging area confusion (e.g., merge conflicts, partial adds)',
        'Use `git config --list --show-origin` to audit which config file is supplying which setting',
      ],
      avoid: [
        'Avoid `git filter-branch` — it is deprecated, slow, and error-prone; use `git filter-repo` instead',
        'Avoid committing large binary files (videos, compiled artifacts) — they bloat the object store permanently',
        'Avoid manually editing files in .git/ unless you know exactly what you are doing',
        'Avoid running `git gc --aggressive` frequently on active repos — it is slow and rarely necessary',
        'Avoid shipping hooks only in .git/hooks/ — teammates who clone fresh will not get them; use Husky',
      ],
      vs: [
        {
          name: 'Loose objects vs packfiles',
          when:
            'Loose objects are created for every new commit/blob/tree. Packfiles are created by git gc and are far more space-efficient for repos with history. You generally do not choose — gc runs automatically — but force it with `git gc` before sharing a large repo.',
        },
        {
          name: 'pre-commit vs commit-msg hook',
          when:
            'Use pre-commit for code quality checks (lint, format, secret scan) that inspect file content. Use commit-msg when you need to validate or transform the commit message itself (conventional commits, issue ID enforcement).',
        },
        {
          name: 'git filter-repo vs git filter-branch',
          when:
            'Always use git filter-repo — it is the officially recommended replacement. filter-branch is deprecated, 10-100× slower, and has well-documented data-loss edge cases.',
        },
        {
          name: '.git/hooks vs Husky/lefthook',
          when:
            'Use Husky (Node) or lefthook (Go) to version-control hooks in the repo so they are automatically installed for every contributor. .git/hooks is local-only and invisible to teammates who clone fresh.',
        },
      ],
    },
    failures: [
      {
        name: 'Hook not running because not executable',
        cause:
          'Git hook scripts in .git/hooks/ must have the executable bit set (`chmod +x`). A freshly created hook file has permissions 644 and is silently ignored by Git.',
        symptom:
          'Hooks appear to do nothing — commits go through without lint/tests running, no error message from Git',
        fix:
          'Run `chmod +x .git/hooks/pre-commit`. For team-wide hooks, use Husky (`npm install --save-dev husky`) or lefthook — they automatically install hooks with correct permissions via package.json prepare scripts and are committed to the repo so all contributors get them.',
        severity: 'medium',
      },
      {
        name: 'Repo bloated by large file committed and removed',
        cause:
          'A large binary file (video, dataset, build artifact) was committed then removed with `git rm`. The blob object still exists in .git/objects/ — `git rm` only removes the file from the index and adds a deletion commit; it does not erase the object from history.',
        symptom:
          'Repository clone size remains large; `git count-objects -v` shows high disk usage; `git gc` does not help because the object is reachable through historical commits',
        fix:
          'Use `git filter-repo --path bigfile.zip --invert-paths` to rewrite every commit in history, dropping the file. Then force-push all branches and tags (`git push --force-with-lease --all`). All collaborators must re-clone or run `git fetch --all && git reset --hard origin/main`. Add the file pattern to .gitignore immediately to prevent recurrence.',
        severity: 'high',
      },
    ],
    a: {
      v: '🏛️ Library with a content-addressed card catalog',
      t: 'Git\'s object store is like a library where books are filed by their content fingerprint',
      tx: 'Every file (blob), directory listing (tree), and snapshot (commit) is a "book" filed by its SHA-1 fingerprint — the Dewey Decimal number is derived from the content itself. Two identical files always get the same number, so the library never stores duplicates. The index is the librarian\'s checkout desk tracking what you currently have staged. Packfiles are archival boxes that compress many books together for storage efficiency.',
      s: 'Object = book filed by content fingerprint. Index = checkout desk. Packfile = archival compression box. Hooks = automated librarian rules.',
    },
    te: {
      def: 'Git is a content-addressable object store where every piece of data (file content, directory structure, commit metadata) is stored as a zlib-compressed file named by its SHA-1 hash. Four object types — blob, tree, commit, tag — compose the complete version history. Refs are human-readable pointers to commit SHAs. The index is a binary staging area cache. Packfiles delta-compress many objects for space efficiency.',
      types: [
        {
          n: 'Blob object',
          d: 'Stores raw file content only — no filename, no permissions. Format: "blob <size>\\0<content>". Two files with identical content share one blob regardless of their names or paths.',
        },
        {
          n: 'Tree object',
          d: 'Stores a directory listing: mode, object type, SHA-1, and filename for each entry. References blobs (files) and other trees (subdirectories). Represents a directory snapshot.',
        },
        {
          n: 'Commit object',
          d: 'Points to a root tree SHA, zero or more parent commit SHAs, author/committer identity + timestamps, and the commit message. Changing any field changes the SHA — commits are immutable.',
        },
        {
          n: 'Tag object',
          d: 'An annotated tag — points to any object (usually a commit) and adds tagger identity, date, message, and optional GPG signature. Lightweight tags are just refs, not objects.',
        },
      ],
      when:
        'Reach for git internals knowledge when: debugging a corrupt repo, removing secrets from history, understanding why `git status` is slow (stat cache misses), optimizing repo size before open-sourcing, or building custom Git tooling (CI scripts, migration tools). `git cat-file` and `git ls-tree` are the main inspection tools.',
      trade:
        'SHA-1 addressing means identical content is deduplicated automatically but also means commit objects are immutable — any change (even fixing a typo in a message) creates a new SHA and orphans the old commit. Loose objects are fast to write but slow to clone at scale — packfiles solve this with delta compression at the cost of `git gc` overhead. Hooks are powerful automation but are local-only by default, requiring Husky/lefthook for team adoption.',
      code: `# ── EXPLORE OBJECTS ────────────────────────────────────
git cat-file -t HEAD               # type: commit
git cat-file -p HEAD               # print commit object
git cat-file -p HEAD^{tree}        # print tree of current commit
git ls-tree -r HEAD                # recursive tree listing with blob SHAs
git show HEAD:src/index.ts         # print file content at HEAD

# ── REFS ───────────────────────────────────────────────
cat .git/HEAD                      # ref: refs/heads/main
cat .git/refs/heads/main           # abc1234... (the commit SHA)
git show-ref --heads               # list all branch refs
git for-each-ref --format='%(refname) %(objectname:short)' refs/heads/

# ── PACKFILES ──────────────────────────────────────────
git count-objects -v               # loose objects count + disk size
git gc                             # pack loose objects, prune unreachable
git gc --aggressive                # more thorough repacking (slow)
ls .git/objects/pack/              # *.pack + *.idx files

# ── INDEX ──────────────────────────────────────────────
git ls-files --stage               # show index contents (mode, SHA, stage, path)
git ls-files -m                    # modified tracked files
git ls-files -o --exclude-standard # untracked files

# ── HOOKS ──────────────────────────────────────────────
# .git/hooks/pre-commit (must be executable: chmod +x)
#!/bin/sh
npm run lint --silent || exit 1    # abort commit if lint fails
npx secrets-scan || exit 1        # abort if secrets detected

# commit-msg hook — enforce conventional commits
#!/bin/sh
MSG=$(cat "$1")
echo "$MSG" | grep -qE "^(feat|fix|chore|docs|refactor|test):.+" || {
  echo "ERROR: commit message must follow Conventional Commits"
  exit 1
}

# ── GITCONFIG ──────────────────────────────────────────
git config --global user.name "Jane Doe"
git config --global user.email "jane@example.com"
git config --global core.editor "code --wait"
git config --global pull.rebase true          # rebase by default on pull
git config --global push.default current      # push current branch
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --list --show-origin               # show all config with source file`,
      rw: {
        ex: [
          'GitHub — stores every repo as a Git object store; cloning is copying the .git/ directory',
          'Husky (npm) — installs pre-commit/commit-msg hooks from package.json so all contributors get them automatically',
          'git-filter-repo — uses Git internals to rewrite commit history for secret removal or repo surgery',
          'GitLab CI — uses git fetch + object inspection to compute changed file sets for selective pipeline triggers',
          'BFG Repo Cleaner — walks packfiles directly to strip large blobs without full history rewrite',
        ],
        cs: 'When the npm registry accidentally published a package containing AWS credentials in 2021, the team used `git filter-repo` to surgically remove the secrets from every commit in the repository history. They then invalidated the AWS keys, rotated all credentials, force-pushed the rewritten history, and required all contributors to re-clone. Understanding that `git rm` does not remove objects from history — and that `git filter-repo` rewrites history at the object level — was the critical knowledge that made the remediation possible within hours rather than days.',
      },
    },
    interview: {
      q: 'What actually happens inside Git when you run `git commit`?',
      a: 'Git performs five steps: (1) For each staged file, it hashes the content as "blob <size>\\0<content>" via SHA-1 and writes a zlib-compressed file to .git/objects/ — that is your blob. (2) It recursively builds tree objects for each directory, where each tree entry records the mode, blob/tree SHA, and filename. (3) It creates a commit object containing the root tree SHA, parent commit SHA, author/committer identity with timestamps, and the message — this is also SHA-1 hashed and stored as an object. (4) It writes the new commit SHA to the current branch ref file (e.g., .git/refs/heads/main). (5) It updates the index to reflect the committed state. The key insight is that Git is a content-addressable store — every object is identified by its content hash, making deduplication automatic and corruption detectable.',
      fu: [
        'What are the four Git object types and what does each store?',
        'What is the index file (.git/index) and how does it enable fast dirty checking without rehashing every file?',
        'What is a packfile and how does delta compression reduce repo size? When does git gc run automatically?',
        'A hook is not running even though the script exists. What is the most likely cause and fix?',
        'A developer committed a 500MB video file three months ago then deleted it. The repo is still 500MB. Why, and how do you fix it?',
        'What is the difference between HEAD, a branch ref, and a detached HEAD state?',
      ],
    },
  },
];
