Smart PR workflow that creates or updates pull requests with proper validation.

## Workflow

1. **Check branch status**: Verify we're on a feature branch (not main/master)
   - If on main/master: Notify user and abort

2. **Analyze feature branch commits**: Get commits on current branch that are not on default branch
   - Use `git log main..HEAD --oneline` to find feature commits

3. **Check for existing PR**: Use `gh pr view` to check for existing PR
   - If PR exists: Ask user "PR already exists. Update existing PR? (y/n)"
   - If user says no: Abort

4. **Create/update PR**: Generate a concise description from commits and create or update PR
   - Use `gh pr create` or `gh pr edit` with proper title and description

5. **Open in browser**: Use `open [PR_URL]` to open the PR

**Goal**: One command (`/pr`) ’ validate branch ’ create/update PR ’ open in browser.