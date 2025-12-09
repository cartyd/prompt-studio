# Version Management

This project uses semantic versioning (MAJOR.MINOR.PATCH) and automatically bumps version numbers with each build.

## Current Version
The current version is displayed in the About page, accessible from the user dropdown menu.

## Version Format
- **MAJOR**: Incompatible API changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New functionality in a backward-compatible manner (e.g., 0.1.0 → 0.2.0)
- **PATCH**: Backward-compatible bug fixes (e.g., 0.1.0 → 0.1.1)

## Workflow for Version Management

### Development Workflow
1. Make your code changes
2. Bump the version (see commands below)
3. Build the project: `npm run build`
4. Commit changes including the new version: `git commit -am "Your message"`
5. Push to remote: `git push`
6. Deploy to production: `./deploy-remote.sh`

### Version Bump Commands

**Patch Version (Bug fixes)**
```bash
npm run version:patch
```
Increments the patch version (0.1.0 → 0.1.1). Use for bug fixes.

**Minor Version (New features)**
```bash
npm run version:minor
```
Increments the minor version (0.1.0 → 0.2.0). Use for new features.

**Major Version (Breaking changes)**
```bash
npm run version:major
```
Increments the major version (0.1.0 → 1.0.0). Use for breaking changes.

### Build Command
```bash
npm run build
```
Builds the project without changing the version.

## How It Works
1. The version is stored in `package.json`
2. You manually bump the version using `npm run version:patch|minor|major` commands
3. The version is committed to git along with your code changes
4. When deployed, the production server uses the same version from `package.json`
5. The `getAppVersion()` utility reads the version from `package.json` at runtime
6. The version is displayed on the About page at `/about`

## Viewing the Version
Users can view the current app version by:
1. Clicking their avatar in the top-right corner
2. Selecting "About" from the dropdown menu
3. The version is displayed prominently on the About page
