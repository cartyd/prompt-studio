# Release Process

This document describes the release workflow for Prompt Framework Studio.

## Quick Start

```bash
# Interactive mode (prompts for version type)
./release.sh

# Non-interactive mode
./release.sh patch   # Bug fixes (0.1.3 → 0.1.4)
./release.sh minor   # New features (0.1.3 → 0.2.0)
./release.sh major   # Breaking changes (0.1.3 → 1.0.0)
```

## What the Release Script Does

The `release.sh` script handles the complete release workflow:

1. **Pre-flight Checks**
   - ✓ Verifies you're on the `main` branch
   - ✓ Checks for uncommitted changes
   - ✓ Ensures local main is up-to-date with remote

2. **Version Bumping**
   - Prompts for version type (patch/minor/major)
   - Runs the appropriate `npm run version:*` script
   - Shows the new version number

3. **Git Operations**
   - Commits the version bump
   - Creates an annotated git tag
   - Optionally pushes to remote

4. **Deployment**
   - Optionally triggers production deployment via `deploy.sh`

## Version Types (Semantic Versioning)

### Patch (0.1.3 → 0.1.4)
- Bug fixes
- Security patches
- Performance improvements
- Documentation updates

**Example**: Fixed home page button styling issue

### Minor (0.1.3 → 0.2.0)
- New features (backwards compatible)
- New framework support
- UI enhancements
- Refactoring

**Example**: Added new Chain-of-Thought framework

### Major (0.1.3 → 1.0.0)
- Breaking API changes
- Database schema changes
- Removed features
- Major architecture changes

**Example**: Migrated to new authentication system

## Example Workflow

```bash
# 1. Make your changes on a feature branch
git checkout -b feature/new-framework
# ... make changes ...
git commit -m "feat: add new framework"
git push origin feature/new-framework

# 2. Create PR and merge to main
# ... via GitHub UI ...

# 3. Pull latest main
git checkout main
git pull origin main

# 4. Run release script
./release.sh

# The script will:
# - Show current version
# - Prompt for version type (patch/minor/major)
# - Bump version
# - Ask to commit & tag
# - Ask to push to remote
# - Ask to deploy

# 5. That's it! 🎉
```

## Manual Release (if needed)

If you need to release manually without the script:

```bash
# 1. Bump version
npm run version:patch  # or minor/major

# 2. Commit and tag
git add package.json
git commit -m "chore: bump version to v0.1.4"
git tag -a v0.1.4 -m "Release v0.1.4"

# 3. Push
git push origin main
git push origin v0.1.4

# 4. Deploy
./deploy.sh
```

## Rollback

If you need to rollback a release:

```bash
# 1. Revert the version commit (locally)
git revert HEAD

# 2. Delete the tag (locally)
git tag -d v0.1.4

# 3. Push revert
git push origin main

# 4. Delete remote tag
git push origin :refs/tags/v0.1.4

# 5. Redeploy previous version
git checkout v0.1.3
./deploy.sh
```

## Best Practices

1. **Always release from main branch** - The script enforces this
2. **One version per release** - Don't skip versions
3. **Write meaningful commit messages** - They appear in git history
4. **Test before releasing** - Run tests locally first
5. **Keep changelog updated** - Document what changed
6. **Tag format**: Always use `v` prefix (e.g., `v0.1.4`)

## Troubleshooting

### "Uncommitted changes detected"
Commit or stash your changes before releasing:
```bash
git stash
./release.sh
git stash pop
```

### "Local main is not up to date"
Pull latest changes:
```bash
git pull origin main
```

### "Must be on main branch"
Switch to main:
```bash
git checkout main
```

## CI/CD Integration (Future)

When CI/CD is set up, releases can be automated:
- Push tag → Trigger build → Run tests → Deploy
- GitHub Actions or similar can replace manual deployment

For now, use this script for manual releases with safety checks.
