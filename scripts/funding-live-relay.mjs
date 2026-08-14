#!/usr/bin/env node
/**
 * funding-live-relay.mjs — K-Startup 공고를 한국 가정 IP에서 수집해 프로드로 중계.
 *
 *  왜: 2026-08-14부터 data.go.kr 게이트웨이가 클라우드(AWS 등) IP를 차단
 *      (400 INVALID_REQUEST_PARAMETER_ERROR 로 위장) → Vercel cron 직접 페치 불가.
 *  어떻게: 이 스크립트(launchd, 6시간마다)가 원본 JSON을 받아
 *      POST /api/cron/funding-live { items } 로 넘기면 서버가 SSOT 매핑·정규화·스냅샷 저장.
 *
 *  실행: node scripts/funding-live-relay.mjs
 *  launchd: ~/Library/LaunchAgents/com.foundone.funding-relay.plist
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROD = "https://foundone.dev";
const KSTARTUP = "https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01";
const PER_PAGE = 500;

function loadEnv() {
  const env = {};
  for (const line of readFileSync(join(ROOT, "apps/web/.env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !(m[1] in env)) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const apiKey = env.KSTARTUP_API_KEY;
const cronSecret = env.CRON_SECRET;
if (!apiKey || !cronSecret) {
  console.error(`[funding-relay] .env.local 에 KSTARTUP_API_KEY/CRON_SECRET 필요`);
  process.exit(1);
}

const sp = new URLSearchParams({ serviceKey: apiKey, returnType: "json", page: "1", perPage: String(PER_PAGE) });
sp.set("Rcrt_prgs_yn", "Y");

const res = await fetch(`${KSTARTUP}?${sp}`);
if (!res.ok) {
  console.error(`[funding-relay] K-Startup ${res.status}: ${(await res.text()).slice(0, 200)}`);
  process.exit(1);
}
const json = await res.json();
const items = Array.isArray(json?.data) ? json.data : [];
if (items.length === 0) {
  console.error(`[funding-relay] 수집 0건 — 중계 생략 (응답 키: ${Object.keys(json ?? {}).join(",")})`);
  process.exit(1);
}

const relay = await fetch(`${PROD}/api/cron/funding-live`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
  body: JSON.stringify({ items }),
});
const out = await relay.json().catch(() => ({}));
console.log(`[funding-relay] ${new Date().toISOString()} 수집 ${items.length}건 → ${relay.status}`, JSON.stringify(out));
process.exit(relay.ok && out.ok ? 0 : 1);
