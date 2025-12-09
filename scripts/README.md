# Scripts

Purpose: operational and development utilities that are safe to version and do not contain secrets.

Security policy
- No secrets in source. Read required configuration from environment variables (e.g., .env on server).
- Scripts must be idempotent where possible and print what they do.
- Prefer read‑only by default; destructive operations should require a flag (e.g., --apply) or be clearly labeled.
- Server‑side scripts should run with plain Node and @prisma/client only (no dev toolchain required).

How we run scripts
- Local/dev: `npx tsx scripts/<name>.ts`
- Server/prod: `ssh root@45.55.131.181 'cd /var/www/prompt-studio && node scripts/<name>.js'`

Included examples
- `view-users.js` (ops): lists users (supports `--json` and an optional substring filter argument)
- `verify-existing-users.ts` (ops): bulk-verify existing users (use with care)

Deployment
- Our deploy flow rsyncs only runtime files (dist, package.json, etc.); the `scripts/` directory is not deployed to production runtime.

Conventions
- Keep ops/server scripts in plain JS when feasible (Node + Prisma only).
- Keep dev scripts (TypeScript) for local workflows and tooling.
- Add a short usage header comment to each script.
