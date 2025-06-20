Smart commit workflow that automatically handles branching, commits, and PRs.

## Workflow

1. **Analyze changes**: Check `git status` and `git diff` to understand file changes and content

2. **Smart branching**:
   - **Always create branch if on main/master** (never commit directly to main)
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
   - Stage and commit with conventional format (feat:, fix:, docs:, test:, chore:)
   - Push to remote with tracking
   - Auto-create PR with `gh pr create` (comprehensive description + test plan)
   - Auto-open PR in browser with `open [PR_URL]`

**Goal**: One command (`/commit`) → automatic branching → commit → PR → browser, with minimal user interruption.