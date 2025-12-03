# Version Management

This project uses semantic versioning (MAJOR.MINOR.PATCH) and automatically bumps version numbers with each build.

## Current Version
The current version is displayed in the About page, accessible from the user dropdown menu.

## Version Format
- **MAJOR**: Incompatible API changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New functionality in a backward-compatible manner (e.g., 0.1.0 → 0.2.0)
- **PATCH**: Backward-compatible bug fixes (e.g., 0.1.0 → 0.1.1)

## Build Commands

### Standard Build (Patch Bump)
```bash
npm run build
```
This automatically increments the patch version (0.1.0 → 0.1.1) and builds the project.

### Minor Version Bump
```bash
npm run build:minor
```
This increments the minor version (0.1.0 → 0.2.0) and builds the project.
Use this when adding new features.

### Major Version Bump
```bash
npm run build:major
```
This increments the major version (0.1.0 → 1.0.0) and builds the project.
Use this for breaking changes.

## Manual Version Bump
If you need to bump the version without building:
```bash
tsx scripts/bump-version.ts [major|minor|patch]
```

## How It Works
1. The version is stored in `package.json`
2. The build script automatically runs `scripts/bump-version.ts` before compilation
3. The `getAppVersion()` utility reads the version from `package.json` at runtime
4. The version is displayed on the About page at `/about`

## Viewing the Version
Users can view the current app version by:
1. Clicking their avatar in the top-right corner
2. Selecting "About" from the dropdown menu
3. The version is displayed prominently on the About page
