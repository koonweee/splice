Analyze the current git changes and create sensible commits based on the following workflow:

**Arguments**: 
- `$ARGUMENTS` can contain "new" to force creation of a new feature branch

1. **Handle branch creation**:
   - If `$ARGUMENTS` contains "new": Switch to default branch (main/master) and create a new feature branch
   - Name the branch appropriately based on the changes (e.g., "add-tests", "fix-auth", "update-docs", "refactor-scraper")
   - Use kebab-case and be descriptive but concise

2. **Analyze changed files**: Use `git status` and `git diff --name-only` to see what files have been modified

3. **Group changes logically**: Categorize files by type and purpose:
   - Configuration files (*.json, *.yaml, *.env, package.json, tsconfig.json)
   - Test files (*test*, *spec*)
   - Documentation (*.md, README, CHANGELOG)
   - Source code (*.ts, *.js, *.tsx, *.jsx, *.py)
   - Styles (*.css, *.scss, *.sass)
   - Other files

4. **Create appropriate commits**: 
   - Suggest grouping related changes into separate commits
   - Use conventional commit format (feat:, fix:, docs:, test:, chore:, etc.)
   - Ask for commit messages that describe the "why" not just the "what"

5. **Handle branching and PRs**:
   - If on main/master and "new" not specified: Create a feature branch first, then push commits
   - If on a feature branch: Push commits to the existing branch
   - Check if a PR exists for the current branch
   - If no PR exists and we're on a feature branch, offer to create one using `gh pr create`

6. **Execute the plan**: Actually run the git commands to stage, commit, and push the changes

Before proceeding, show me the current git status and ask for confirmation of the commit strategy.