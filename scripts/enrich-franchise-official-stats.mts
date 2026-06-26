/**
 * enrich-franchise-official-stats.mts
 *
 * 공정거래위원회_브랜드별 가맹점 현황(data.go.kr 15110241)을 1회 수집해
 * packages/shared/src/franchise-brands.json 의 각 브랜드에 officialStats 를 병합한다.
 *  - 손큐레이션 storeCount/avgAnnualRevenueWon 은 *덮어쓰지 않고* 공식 출처로 병기.
 *  - 연 1회 갱신(연간 통계). iOS 는 franchise-brands.json 심링크로 자동 반영.
 *
 * 실행: KFTC_API_KEY 가 apps/web/.env.local 또는 환경변수에 있어야 함.
 *   npx tsx scripts/enrich-franchise-official-stats.mts [year]   (default 2024)
 *
 * 단위: KFTC avrgSlsAmt·arUnitAvrgSlsAmt 는 천원 → ÷10 으로 만원 변환(앱 표준).
 */
import { readFileSync, writeFileSync } from "node:fs";

type BrandFrcsStatsData = {
  year: string; industryL: string; industryM: string; companyName: string; brandName: string;
  storeCount: number; newOpenings: number; terminations: number; cancellations: number;
  nameChanges: number; avgSalesThousandWon: number; avgSalesPerAreaThousandWon: number; fetchedAt: string;
};

const { fetchAllBrandFrcsStats } = await import(
  new URL("../packages/shared/src/adapters/kftc-brand-stats.ts", import.meta.url).href
) as { fetchAllBrandFrcsStats: (config: { apiKey: string; baseUrl: string }, yr: string, opts?: { numOfRows?: number; onPage?: (p: number, total: number) => void }) => Promise<BrandFrcsStatsData[]> };

const YEAR = process.argv[2] ?? "2024";

// ── KFTC_API_KEY 로드 (env → apps/web/.env.local) ──
function loadApiKey(): string {
  if (process.env.KFTC_API_KEY) return process.env.KFTC_API_KEY;
  try {
    const env = readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8");
    const line = env.split("\n").find((l) => l.startsWith("KFTC_API_KEY="));
    if (line) return line.slice("KFTC_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
  } catch { /* ignore */ }
  throw new Error("KFTC_API_KEY not found (env or apps/web/.env.local)");
}

/**
 * 브랜드명 정규화. KFTC 는 "한글명(영문명)" · "한글명/별칭" 형태가 많아:
 *  ① &amp; 디코드 ② "/" 앞 세그먼트만 ③ 괄호(…) 내용 제거 ④ 공백·구두점 제거·소문자.
 *  → 컴포즈커피(COMPOSE COFFEE)·매머드커피(Mammoth coffee)·던킨/던킨도너츠 등 자동 일치.
 */
function norm(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .split("/")[0]
    .replace(/[(（][^)）]*[)）]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）「」\[\]·∙・.,'"`’&\-—_]/g, "")
    .trim();
}

// 표기 차이 별칭 (우리 id → KFTC 브랜드명). norm 후 KFTC 레코드 키와 일치하면 매칭.
//  스타벅스·빕스·써브웨이·구몬·눈높이·메가스터디 등은 가맹통계 미존재(직영/방문학습) → 별칭 없음(정상 미매칭).
const ALIASES: Record<string, string> = {
  "mega-coffee": "메가엠지씨커피",          // 메가엠지씨커피(MEGA MGC COFFEE)
  "cu": "씨유",                              // 씨유(CU)
  "gs25": "지에스25",                        // 지에스25(GS25)
  "olive-young": "Olive Young",             // Olive Young(올리브영)
  "hollys": "할리스",                        // 할리스
  "the-liter": "THE LITER",                 // THE LITER (더리터)
  "dunkin": "던킨",                          // 던킨/던킨도너츠
  "yoonsaeng": "윤선생영어교실",            // 윤선생
  "myungrang-hotdog": "명랑시대쌀핫도그",   // 명랑핫도그 → 명랑시대(쌀핫도그)
  "hansot-lunchbox": "한솥",                 // 한솥도시락 → 한솥
  "60gye-chicken": "60계",                   // 60계치킨 → 60계
  "hosik-chicken": "호식이두마리치킨",       // 호식이두마리 → 호식이두마리치킨
  "puradak": "푸라닭",                       // 푸라닭치킨 → 푸라닭
  "hongkong-banjum": "홍콩반점0410",         // 백종원 홍콩반점
  "yeokjeon-udon": "역전우동0410",           // 백종원 역전우동
  "lian-hair": "리안",                       // 리안헤어 → 리안
  "jungsang": "JLS정상어학원",               // 정상어학원
  "seldog24-study": "셀독24스터디카페",      // 셀독24
  "gymboree": "짐보리플레이앤뮤직",          // 짐보리
  "the-liter": "THE LITER (더리터",          // KFTC 표기 괄호 불균형(데이터 quirk) 그대로
};

type BrandJson = {
  id: string;
  name: { ko: string; en: string };
  officialStats?: unknown;
  [k: string]: unknown;
};

async function main() {
  const apiKey = loadApiKey();
  console.log(`▶ KFTC 브랜드별 가맹점 현황 수집 — 기준년도 ${YEAR}`);

  const rows = await fetchAllBrandFrcsStats(
    { apiKey, baseUrl: "" },
    YEAR,
    { numOfRows: 1000, onPage: (p, total) => process.stdout.write(`\r  page ${p} … (총 ${total})   `) }
  );
  console.log(`\n  ✓ ${rows.length}개 레코드 수집`);

  // 정규화 이름 → 최대 가맹점수 레코드 (동명 중복 시 본진 선택)
  const byName = new Map<string, BrandFrcsStatsData>();
  for (const r of rows) {
    const k = norm(r.brandName);
    const prev = byName.get(k);
    if (!prev || r.storeCount > prev.storeCount) byName.set(k, r);
  }

  const brandsPath = new URL("../packages/shared/src/franchise-brands.json", import.meta.url);
  const brands: BrandJson[] = JSON.parse(readFileSync(brandsPath, "utf8"));

  const won = (thousandWon: number) => (thousandWon > 0 ? Math.round(thousandWon / 10) : undefined);
  const today = new Date().toISOString().slice(0, 10);

  let matched = 0;
  const unmatched: BrandJson[] = [];

  for (const b of brands) {
    const candidates = [ALIASES[b.id], b.name.ko].filter(Boolean) as string[];
    let rec: BrandFrcsStatsData | undefined;
    for (const c of candidates) {
      rec = byName.get(norm(c));
      if (rec) break;
    }
    if (!rec) { unmatched.push(b); delete b.officialStats; continue; }

    b.officialStats = {
      year: rec.year,
      storeCount: rec.storeCount,
      newOpenings: rec.newOpenings,
      terminations: rec.terminations,
      cancellations: rec.cancellations,
      ...(won(rec.avgSalesThousandWon) !== undefined ? { avgSalesWon: won(rec.avgSalesThousandWon) } : {}),
      ...(won(rec.avgSalesPerAreaThousandWon) !== undefined ? { avgSalesPerAreaWon: won(rec.avgSalesPerAreaThousandWon) } : {}),
      fetchedAt: today,
    };
    matched += 1;
  }

  writeFileSync(brandsPath, JSON.stringify(brands, null, 2) + "\n", "utf8");

  console.log(`\n✓ 병합 완료: ${matched}/${brands.length} 매칭, ${unmatched.length} 미매칭`);
  if (unmatched.length) {
    console.log(`\n── 미매칭 브랜드 + KFTC 후보(부분일치) — ALIASES 보강용 ──`);
    for (const b of unmatched) {
      const nk = norm(b.name.ko);
      const cands = [...byName.values()]
        .filter((r) => { const rn = norm(r.brandName); return rn.includes(nk) || nk.includes(rn); })
        .slice(0, 4)
        .map((r) => `${r.brandName}(${r.storeCount})`);
      console.log(`  ${b.id} / ${b.name.ko}${cands.length ? "  ← 후보: " + cands.join(", ") : "  (후보 없음)"}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
