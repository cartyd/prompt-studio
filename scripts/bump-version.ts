#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

type BumpType = 'major' | 'minor' | 'patch';

function parseVersion(version: string): [number, number, number] {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return parts as [number, number, number];
}

function bumpVersion(version: string, bumpType: BumpType = 'patch'): string {
  const [major, minor, patch] = parseVersion(version);

  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid bump type: ${bumpType}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const bumpType: BumpType = (args[0] as BumpType) || 'patch';

  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('Usage: tsx scripts/bump-version.ts [major|minor|patch]');
    console.error('Default: patch');
    process.exit(1);
  }

  const packageJsonPath = join(__dirname, '../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const currentVersion = packageJson.version;
  const newVersion = bumpVersion(currentVersion, bumpType);

  packageJson.version = newVersion;

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

  console.log(`Version bumped: ${currentVersion} → ${newVersion}`);
}

main();
