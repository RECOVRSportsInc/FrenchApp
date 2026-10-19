# Learning progress service

This Worker stores roadmap completion, word-history counters and daily activity in D1. It is separate from the existing numeric XP service. The frontend works offline without configuring this service and explicitly labels learning progress as local.

## First deployment

Use Node 22.13 or newer for the storage tests. From the repository root:

```sh
npx wrangler login
npx wrangler d1 create frenchapp-learning-progress
```

Copy the returned database ID into `backend/wrangler.jsonc`, replacing `REPLACE_WITH_D1_DATABASE_ID`. It is an identifier, not a secret. Keep Cloudflare credentials outside this repository. Then run:

```sh
npx wrangler d1 execute frenchapp-learning-progress --remote --file backend/schema.sql --config backend/wrangler.jsonc
npx wrangler deploy --config backend/wrangler.jsonc
```

Set the deployed Worker address in the frontend:

```sh
node scripts/configure-learning-cloud.cjs https://YOUR-WORKER.workers.dev
node scripts/version-release.cjs 20261017-2
```

Commit the configuration and release changes on the feature branch and publish through a pull request. No hosting has been provisioned by the patch itself.

The allowed origins include the existing GitHub Pages host and Live Server on port 5500. If the local port differs, add its exact origin to `ALLOWED_ORIGINS` and redeploy. CORS is an origin restriction, not authentication. A 256-bit bearer learning key provides record access; the server stores its hash-derived record identifier. Never add a learner's actual key to this config, a screenshot, a URL or a Git commit.

## Multi-device use

On the first device, open Today, create a learning key and sync. On the second device, enter the same existing 4-digit XP code in Progress, then connect the private learning key in Today. Connecting another key merges current local learning records into that key's cloud record. Lost keys cannot be recovered from the server; keep a private copy. Keys are intentionally omitted from progress exports.

## Merge and recovery

Roadmap best scores use maximum; passed tiers and completed lessons use logical OR. Word counts have a legacy baseline and per-device cumulative counters. Legacy baselines use maximum because historical copies have no device provenance. New answers from distinct devices add together. Existing counts are never reduced, but independently earned pre-upgrade answers with overlapping totals cannot be reconstructed exactly.

Activity sessions have immutable random IDs; repeated uploads and rerendered results do not duplicate completions. Days retain the local date recorded at completion. Daily goals use timestamp ordering and a device-ID tie-break. Counts and streaks span all learning languages for one learner code.

PUT requires the current revision and uses SQL compare-and-swap. Conflicts fetch and merge again. The server also merges, so an old client cannot relock tiers. Local imports use a recovery journal before writing existing stores. Malformed original or recovery data is preserved for export rather than silently replaced.

Records are limited to 2 MiB. The Worker includes an IP rate-limit binding (120 requests per minute per Cloudflare location). Namespace `2026101701` should be changed if already used by another rate limiter in the same account. Configure usage alerts and database backups in the hosting account before public-scale use. This prototype has capability-key access, not email accounts, password resets, subscriptions or administrative recovery.

## Verification

```sh
node tests/progress-merge.test.cjs
node tests/progress-sync.test.cjs
node tests/progress-api.test.cjs
TZ=America/Toronto node tests/daily.test.cjs
```

After real deployment, verify two physical devices can connect, preserve an unlocked tier, merge offline answers, and recover after reload. Local browser and SQLite tests do not certify a live account configuration.

## Provider references

- https://developers.cloudflare.com/d1/get-started/
- https://developers.cloudflare.com/d1/worker-api/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
