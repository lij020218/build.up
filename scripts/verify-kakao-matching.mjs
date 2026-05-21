#!/usr/bin/env node
/**
 * market_location_signals.region_name 카카오맵 매칭 검증 스크립트 (2026-05-18)
 *
 * 목적: 각 region 의 region_name + search_keywords[0] 를 카카오 keywordSearch API 로
 *      검색해, 응답 첫 결과의 주소가 district_name 과 일치하는지 검증.
 *
 * 사용법:
 *   KAKAO_REST_API_KEY=xxx node scripts/verify-kakao-matching.mjs
 *
 * 또는 .env.local 파일에서 자동 로드 시도.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// ── .env.local 자동 로드 ──
function loadEnvLocal() {
  const envPath = path.join(ROOT, "apps/web/.env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  });
}
loadEnvLocal();

const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
if (!KAKAO_KEY) {
  console.error("❌ KAKAO_REST_API_KEY 환경변수 필요");
  process.exit(1);
}

// ── 검증 대상: migration 파일에서 region_key, region_name, district_name, search_keywords 추출 ──
function parseMigrations() {
  const migrationsDir = path.join(ROOT, "supabase/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => /seoul|gyeonggi|landmark|expand_search_keywords|residential_market_signals|seed_market|seed_more|seed_market_signals_expanded|seed_additional/i.test(f))
    .sort();

  const entries = new Map(); // region_key → entry
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
    // values ( ... 'region_key', 'region_name', 'district_name', null, array['k1', 'k2', ...], ... )
    const valueRegex =
      /\(\s*'([a-z0-9-]+)',\s*'([^']+)',\s*'([^']+)',\s*null,\s*array\[([^\]]+)\]/g;
    let m;
    while ((m = valueRegex.exec(sql))) {
      const [, region_key, region_name, district_name, keywordsRaw] = m;
      const search_keywords = [...keywordsRaw.matchAll(/'([^']+)'/g)].map((k) => k[1]);
      entries.set(region_key, { region_key, region_name, district_name, search_keywords });
    }
  }
  return [...entries.values()];
}

// ── 카카오 keywordSearch 호출 ──
async function kakaoSearch(query) {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
    query,
  )}&size=3`;
  const res = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${KAKAO_KEY}`,
      // 카카오 API 는 KA 헤더 (origin 또는 os 정보) 필수 — 없으면 AccessDeniedError
      KA: "os/javascript origin/http://localhost:3000",
    },
  });
  if (!res.ok) {
    return { error: `HTTP ${res.status}`, results: [] };
  }
  const data = await res.json();
  return {
    error: null,
    results: (data.documents ?? []).map((d) => ({
      place_name: d.place_name,
      address: d.road_address_name || d.address_name,
      x: d.x,
      y: d.y,
    })),
  };
}

// ── 매칭 점검: 응답 주소가 district_name 또는 region_name 키워드를 포함하는지 ──
function isMatch(result, entry) {
  if (!result.results || result.results.length === 0) return false;
  const top = result.results[0];
  const addr = top.address || "";
  // district_name 의 핵심 (예: "강남구", "성동구", "수원시 팔달구") 일부가 응답 주소에 포함되어야 함
  const districtCore = entry.district_name.split(/\s+/).find((p) => p.endsWith("구") || p.endsWith("시") || p.endsWith("군"));
  if (!districtCore) return true; // district 정의 모호하면 pass
  return addr.includes(districtCore);
}

// ── 메인 ──
async function main() {
  const entries = parseMigrations();
  console.log(`📋 검증 대상: ${entries.length} entries`);

  const ok = [];
  const fail = [];
  const noResult = [];

  // rate-limit (카카오 무료: 10/sec, 100K/day)
  const RATE_DELAY_MS = 110;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const query = entry.search_keywords?.[0] ?? entry.region_name;
    const result = await kakaoSearch(query);

    if (result.error) {
      console.error(`[${i + 1}/${entries.length}] ❌ ${entry.region_key}: ${result.error}`);
      fail.push({ ...entry, query, ...result });
    } else if (result.results.length === 0) {
      console.log(`[${i + 1}/${entries.length}] ⚠ ${entry.region_key} (${query}): 검색결과 없음`);
      noResult.push({ ...entry, query });
    } else if (!isMatch(result, entry)) {
      console.log(
        `[${i + 1}/${entries.length}] ❌ ${entry.region_key} (${query}): 주소 불일치`,
      );
      console.log(`   기대 district: ${entry.district_name}`);
      console.log(`   실제 응답: ${result.results[0].address}`);
      fail.push({ ...entry, query, top: result.results[0] });
    } else {
      ok.push({ ...entry, query, top: result.results[0] });
      if ((i + 1) % 20 === 0) console.log(`[${i + 1}/${entries.length}] 진행 중...`);
    }

    await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
  }

  // 결과 요약
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`총 ${entries.length} entries`);
  console.log(`✅ 매칭 성공: ${ok.length}`);
  console.log(`⚠  결과 없음: ${noResult.length}`);
  console.log(`❌ district 불일치: ${fail.length}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 매칭 실패 entry 의 search_keywords 첫 항목 후보 제안
  if (noResult.length > 0) {
    console.log("\n📝 search_keywords[0] 보강 권장 (검색결과 0건):");
    for (const e of noResult) {
      console.log(`  - ${e.region_key}: 현재 "${e.query}" → 다른 후보 (search_keywords): ${e.search_keywords.slice(1, 4).join(", ")}`);
    }
  }

  if (fail.length > 0) {
    console.log("\n📝 district 불일치 entry:");
    for (const e of fail.slice(0, 20)) {
      console.log(`  - ${e.region_key} (${e.query}): "${e.top?.address ?? "—"}" (기대 ${e.district_name})`);
    }
  }

  // 결과 파일 저장
  const out = path.join(ROOT, "scripts/kakao-verify-report.json");
  fs.writeFileSync(out, JSON.stringify({ ok, noResult, fail, total: entries.length, timestamp: new Date().toISOString() }, null, 2));
  console.log(`\n💾 상세 결과: ${out}`);
}

main().catch((err) => {
  console.error("스크립트 실패:", err);
  process.exit(1);
});
