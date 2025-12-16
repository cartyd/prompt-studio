import { readFileSync } from 'fs';
import { join } from 'path';
import { versionLogger } from './logger';

let cachedVersion: string | null = null;

export function getAppVersion(): string {
  if (cachedVersion !== null) {
    return cachedVersion;
  }

  try {
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const version: string = packageJson.version || '0.0.0';
    cachedVersion = version;
    return version;
  } catch (error) {
    versionLogger.error('Failed to read version from package.json', error);
    return '0.0.0';
  }
}
