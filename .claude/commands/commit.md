Analyze the current git changes and create sensible commits based on the following workflow:

**Arguments**: 
- `$ARGUMENTS` can contain "new" to force creation of a new feature branch

1. **Handle branch creation**:
   - If `$ARGUMENTS` contains "new": Switch to default branch (main/master) and create a new feature branch
   - Name the branch appropriately based on the changes (e.g., "add-tests", "fix-auth", "update-docs", "refactor-scraper")
   - Use kebab-case and be descriptive but concise

2. **Analyze changed files**: Use `git status` and `git diff --name-only` to see what files have been modified

3. **Check branch relevance**: Determine if the current branch name is relevant to the changes:
   - Compare the branch name with the types of changes being made
   - Consider common branch naming patterns (feature/, fix/, docs/, test/, chore/)
   - Look for keywords in branch name that match the change types (e.g., "test" for test files, "docs" for documentation, "api" for API changes)
   - If the branch name doesn't match the changes (e.g., on "add-unit-tests" but making UI changes), suggest creating a new appropriate branch
   - If on main/master, always suggest creating a feature branch unless it's a hotfix
   - Examples of mismatched branches:
     - Branch "fix-auth" but changes are in test files → suggest "test-auth" or "add-auth-tests"
     - Branch "add-docs" but changes are in service code → suggest "feature-service-updates"
     - Branch "update-deps" but changes are feature additions → suggest "add-new-feature"

4. **Group changes logically**: Categorize files by type and purpose:
   - Configuration files (*.json, *.yaml, *.env, package.json, tsconfig.json)
   - Test files (*test*, *spec*)
   - Documentation (*.md, README, CHANGELOG)
   - Source code (*.ts, *.js, *.tsx, *.jsx, *.py)
   - Styles (*.css, *.scss, *.sass)
   - Other files

5. **Create appropriate commits**: 
   - Suggest grouping related changes into separate commits
   - Use conventional commit format (feat:, fix:, docs:, test:, chore:, etc.)
   - Ask for commit messages that describe the "why" not just the "what"

6. **Handle branching and PRs**:
   - If on main/master and "new" not specified: Create a feature branch first, then push commits
   - If on a feature branch: Push commits to the existing branch
   - Check if a PR exists for the current branch
   - If no PR exists and we're on a feature branch, automatically create one using `gh pr create`
   - After creating the PR, automatically open it in the browser using `open [PR_URL]`

7. **Execute the plan**: Actually run the git commands to stage, commit, and push the changes

8. **Automatic PR workflow**:
   - After successful commit and push, if on a feature branch, automatically create a PR
   - Use conventional commit message format for PR title
   - Generate a comprehensive PR description with:
     - Summary of changes (bullet points)
     - Test plan checklist
     - Generated with Claude Code footer
   - Open the created PR in the default browser automatically

Before proceeding, show me the current git status and ask for confirmation of the commit strategy.