Smart commit workflow that automatically handles branching, commits, and PRs.

## Workflow

1. **Analyze changes**: Check `git status` and `git diff` to understand file changes and content
   - **For large changesets**: Split into multiple logical commits when file changes span multiple concerns or exceed reasonable commit size
   - **Commit splitting criteria**:
     - Separate feature additions from bug fixes
     - Split test files from implementation files
     - Separate documentation updates from code changes
     - Group related file changes by functional area/module
     - Keep commits focused and atomic (one logical change per commit)

2. **Smart branching**:
   - **Always create branch FROM main/master if on main/master** (never commit directly to main)
   - **Always create new branches FROM main** regardless of current branch for unrelated changes
   - **Always pull latest main before creating new branches**: Run `git pull` when switching to main to ensure up-to-date base
   - **Score current branch relevance** (0-100) against detected change types:
     - Tests (`*test*`, `*spec*`) → test-related branches
     - Docs (`*.md`, README) → docs branches  
     - Config (`*.yml`, `package.json`, `.env`) → config/ci branches
     - Features (new files, major additions) → feat branches
     - Bug fixes (targeted changes) → fix branches
   - **Auto-create new branch** if relevance < 50
   - **Ask user preference** if relevance 50-89 (ambiguous match)
   - **Stay on current branch** if relevance 90+ (good match)

3. **Auto-generate branch names**:
   - Use kebab-case based on dominant change type
   - Examples: `test-auth-validation`, `fix-login-bug`, `feat-user-dashboard`, `docs-api-update`

4. **User input required only for**:
   - Ambiguous branch relevance (50-89 score)
   - Mixed change types spanning multiple areas
   - Branch name conflicts (generated name already exists)
   - Unclear change intent (large refactoring without clear pattern)

5. **Execute automatically**:
   - **For single commits**: Stage and commit with conventional format (feat:, fix:, docs:, test:, chore:)
   - **For multiple commits**: Create a series of focused commits in logical order:
     1. Foundation/setup changes first (config, dependencies)
     2. Core implementation changes
     3. Tests for new functionality
     4. Documentation updates
     5. Follow conventional commit format for each
   - Push to remote with tracking
   - Auto-create PR with `gh pr create` (comprehensive description + test plan)
   - Auto-open PR in browser with `open [PR_URL]`

**Goal**: One command (`/commit`) → automatic branching → commit → PR → browser, with minimal user interruption.