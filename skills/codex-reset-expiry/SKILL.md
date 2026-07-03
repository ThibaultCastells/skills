---
name: codex-reset-expiry
description: Find expiration dates for Codex Desktop usage reset credits. Use when the user asks when their Codex credits expire.
---

# Codex Reset Expiry

## Workflow

Use the bundled script first. Resolve this skill's installed directory from the loaded `SKILL.md` path, then run:

```bash
node "<skill-dir>/scripts/check-reset-credits.mjs"
```

Adjust `--timezone` to the user's preferred timezone when known. If omitted, the script uses the local system timezone.

The script:

- Reads `${CODEX_HOME:-$HOME/.codex}/auth.json`.
- Uses the cached ChatGPT access token only in process.
- Calls `https://chatgpt.com/backend-api/wham/rate-limit-reset-credits`.
- Prints available reset credits with `granted_at` and `expires_at` converted to the requested timezone.
- Redacts token values and credit IDs from output.

## Reporting

Report each available credit separately because credits can have different expiration dates. Include:

- Local expiration date and time.
- Original UTC `expires_at` timestamp.
- Status if any credit is not `available`.

Do not print auth tokens, refresh tokens, credit IDs, account IDs, or raw auth file contents.

## Troubleshooting

If the script reports missing auth, ask the user to sign in to Codex/ChatGPT locally and retry.

If the endpoint returns `401`, tell the user the local auth token is stale and ask them to refresh the Codex session, then retry. Do not attempt to manually refresh or rewrite `auth.json` unless the user explicitly asks.

If the endpoint shape changes, inspect the returned JSON keys only after redacting IDs and secrets, then update the script.
