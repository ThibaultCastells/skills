#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ENDPOINT =
  "https://chatgpt.com/backend-api/wham/rate-limit-reset-credits";

function usage() {
  return `Usage: check-reset-credits.mjs [--timezone TZ] [--json]

Options:
  --timezone TZ   IANA timezone for display, e.g. Asia/Seoul
  --json          Print sanitized JSON instead of a human summary
`;
}

function parseArgs(argv) {
  let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let json = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--timezone") {
      const value = argv[i + 1];
      if (!value) throw new Error("--timezone requires a value");
      timezone = value;
      i += 1;
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { timezone, json };
}

function codexHome() {
  return process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

function readAuth() {
  const authPath = process.env.CODEX_AUTH_JSON || path.join(codexHome(), "auth.json");
  let raw;
  try {
    raw = fs.readFileSync(authPath, "utf8");
  } catch {
    throw new Error(`Unable to read Codex auth file at ${authPath}`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Codex auth file is not valid JSON: ${authPath}`);
  }
}

function jwtPayload(jwt) {
  const parts = String(jwt).split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function accountIdFromToken(token, auth) {
  const payload = jwtPayload(token);
  const authClaim = payload?.["https://api.openai.com/auth"];
  return authClaim?.chatgpt_account_id || auth.tokens?.account_id || null;
}

function tokenExpirySummary(token) {
  const exp = jwtPayload(token)?.exp;
  if (!Number.isFinite(exp)) return null;
  return new Date(exp * 1000).toISOString();
}

function getToken(auth) {
  const token = auth.tokens?.access_token || auth.tokens?.id_token;
  if (!token) throw new Error("No access token found in Codex auth cache");
  return token;
}

function formatDate(value, timezone) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    dateStyle: "full",
    timeStyle: "long",
  }).format(date);
}

function sanitizeCredit(credit, timezone) {
  return {
    status: credit.status ?? null,
    title: credit.title ?? null,
    reset_type: credit.reset_type ?? null,
    granted_at_utc: credit.granted_at ?? null,
    granted_at_local: formatDate(credit.granted_at, timezone),
    expires_at_utc: credit.expires_at ?? null,
    expires_at_local: formatDate(credit.expires_at, timezone),
  };
}

async function fetchCredits(auth, token) {
  const accountId = accountIdFromToken(token, auth);
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "OAI-Language": "en",
    originator: "Codex Desktop",
    "User-Agent": "Codex Desktop (codex-reset-expiry skill)",
  };
  if (accountId) headers["ChatGPT-Account-Id"] = accountId;

  const response = await fetch(ENDPOINT, { headers });
  const body = await response.text();

  if (!response.ok) {
    const exp = tokenExpirySummary(token);
    const expiryNote = exp ? ` Token expires/expires_at: ${exp}.` : "";
    throw new Error(
      `Endpoint returned HTTP ${response.status}.${expiryNote} Body: ${body.slice(0, 300)}`,
    );
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Endpoint returned non-JSON response");
  }
}

function buildResult(data, timezone) {
  const credits = Array.isArray(data.credits) ? data.credits : [];
  return {
    endpoint: ENDPOINT,
    timezone,
    available_count: data.available_count ?? credits.filter((c) => c.status === "available").length,
    total_earned_count: data.total_earned_count ?? null,
    credits: credits.map((credit) => sanitizeCredit(credit, timezone)),
  };
}

function printHuman(result) {
  console.log(`Available reset credits: ${result.available_count}`);
  console.log(`Timezone: ${result.timezone}`);
  console.log("");

  if (result.credits.length === 0) {
    console.log("No reset credits returned.");
    return;
  }

  result.credits.forEach((credit, index) => {
    console.log(`${index + 1}. ${credit.title || "Reset credit"}`);
    console.log(`   status: ${credit.status || "unknown"}`);
    console.log(`   expires: ${credit.expires_at_local || "unknown"}`);
    console.log(`   expires_at UTC: ${credit.expires_at_utc || "unknown"}`);
    if (credit.granted_at_utc) {
      console.log(`   granted: ${credit.granted_at_local}`);
      console.log(`   granted_at UTC: ${credit.granted_at_utc}`);
    }
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const auth = readAuth();
  const token = getToken(auth);
  const data = await fetchCredits(auth, token);
  const result = buildResult(data, options.timezone);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHuman(result);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
