/**
 * gen-franchise-brands-kftc.mts
 *
 * 공정거래위원회 브랜드별 가맹점 현황(data.go.kr 15110241)에서 가맹점 ≥30개 브랜드를
 * 손큐레이션 203개와 *동일한 FranchiseBrand 형태*로 생성 → franchise-brands-kftc.json.
 *   - 큐레이션 브랜드와 똑같은 UI/UX 로 흐르도록 모든 필수 필드 채움.
 *   - 5축 점수는 랜덤 위조 X — 공식 실데이터에서 투명한 공식으로 산출:
 *       수익성=평균매출 / 안정성=폐점률 / 브랜드력=가맹점수 / 진입성=창업비용 / 본사지원=나머지 평균(무신호).
 *   - 창업비용은 큐레이션 세부업종 평균을 프록시(costVerified=false, 출처 명시).
 *   - confidence "low" + tier "kftc" 로 '편집 검증 아님' 정직 표기.
 *   - 큐레이션과 이름 중복되면 제외(큐레이션 우선).
 *
 * 실행: npx tsx scripts/gen-franchise-brands-kftc.mts [year] [minStores]   (default 2024 30)
 */
import { readFileSync, writeFileSync } from "node:fs";

type StatRow = {
  year: string; industryL: string; industryM: string; companyName: string; brandName: string;
  storeCount: number; newOpenings: number; terminations: number; cancellations: number;
  nameChanges: number; avgSalesThousandWon: number; avgSalesPerAreaThousandWon: number; fetchedAt: string;
};
const { fetchAllBrandFrcsStats } = await import(
  new URL("../packages/shared/src/adapters/kftc-brand-stats.ts", import.meta.url).href
) as { fetchAllBrandFrcsStats: (c: { apiKey: string; baseUrl: string }, yr: string, o?: { numOfRows?: number; onPage?: (p: number, t: number) => void }) => Promise<StatRow[]> };

const YEAR = process.argv[2] ?? "2024";
const MIN_STORES = Number(process.argv[3] ?? 30);

function loadApiKey(): string {
  if (process.env.KFTC_API_KEY) return process.env.KFTC_API_KEY;
  const env = readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8");
  const line = env.split("\n").find((l) => l.startsWith("KFTC_API_KEY="));
  if (!line) throw new Error("KFTC_API_KEY not found");
  return line.slice("KFTC_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
}

function norm(s: string): string {
  return s.replace(/&amp;/g, "&").split("/")[0].replace(/[(（][^)）]*[)）]/g, "")
    .toLowerCase().replace(/\s+/g, "").replace(/[()（）「」\[\]·∙・.,'"`’&\-—_]/g, "").trim();
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

// ── KFTC 업종(중분류) → 우리 categoryId + subIndustryIds 매핑. 미정의는 대분류 fallback. ──
const M_MAP: Record<string, { c: string; s: string[] }> = {
  "한식": { c: "food", s: ["korean-casual"] },
  "분식": { c: "food", s: ["korean-casual"] },
  "치킨": { c: "food", s: ["chicken-burger"] },
  "패스트푸드": { c: "food", s: ["chicken-burger"] },
  "피자": { c: "food", s: ["delivery-meals"] },
  "주점": { c: "food", s: [] },
  "일식": { c: "food", s: ["ramen-noodle"] },
  "중식": { c: "food", s: ["ramen-noodle"] },
  "서양식": { c: "food", s: ["western-pasta-brunch"] },
  "기타 외국식": { c: "food", s: ["western-pasta-brunch"] },
  "기타 외식": { c: "food", s: [] },
  "커피": { c: "cafe-dessert", s: ["takeout-coffee"] },
  "음료 (커피 외)": { c: "cafe-dessert", s: ["takeout-coffee"] },
  "제과제빵": { c: "cafe-dessert", s: ["bakery-studio"] },
  "아이스크림/빙수": { c: "cafe-dessert", s: ["icecream-bingsu"] },
  "아이스크림/빙수 ": { c: "cafe-dessert", s: ["icecream-bingsu"] },
  "이미용": { c: "beauty", s: ["hair-salon"] },
  "화장품": { c: "retail", s: [] },
  "안경": { c: "retail", s: [] },
  "편의점": { c: "retail", s: ["convenience-small"] },
  "종합소매점": { c: "retail", s: ["convenience-small"] },
  "기타도소매": { c: "retail", s: [] },
  "(건강)식품": { c: "retail", s: [] },
  "농수산물": { c: "retail", s: [] },
  "의류 / 패션": { c: "retail", s: [] },
  "약국": { c: "retail", s: [] },
  "교육 (외국어)": { c: "education", s: ["kids-academy"] },
  "교육 (교과)": { c: "education", s: ["kids-academy"] },
  "기타 교육": { c: "education", s: [] },
  "유아 관련 (교육 외)": { c: "education", s: ["kids-academy"] },
  "유아관련": { c: "education", s: ["kids-academy"] },
  "세탁": { c: "living-service", s: ["laundry-service"] },
  "자동차 관련": { c: "living-service", s: [] },
  "부동산 중개 ": { c: "living-service", s: [] },
  "인력 파견": { c: "living-service", s: [] },
  "이사": { c: "living-service", s: [] },
  "운송": { c: "living-service", s: [] },
  "임대": { c: "living-service", s: [] },
  "기타 서비스": { c: "living-service", s: [] },
  "반려동물 관련": { c: "pet", s: ["pet-supplies"] },
  "스포츠 관련": { c: "fitness", s: ["pt-gym"] },
  "PC방": { c: "space", s: [] },
  "오락": { c: "space", s: [] },
  "숙박": { c: "space", s: [] },
};
const L_FALLBACK: Record<string, string> = { "외식": "food", "서비스": "living-service", "도소매": "retail" };

function mapCategory(L: string, M: string): { c: string; s: string[] } {
  return M_MAP[M] ?? M_MAP[M.trim()] ?? { c: L_FALLBACK[L] ?? "living-service", s: [] };
}

// ── 점수 산출 (실데이터 기반) ──
function scoreProfit(avgSalesWon: number): number {
  if (!avgSalesWon) return 50;
  if (avgSalesWon >= 60000) return 85;
  if (avgSalesWon >= 35000) return 75;
  if (avgSalesWon >= 20000) return 65;
  if (avgSalesWon >= 10000) return 55;
  return 45;
}
const scoreStability = (closurePct: number) => clamp(92 - closurePct * 1.8, 30, 92);
const scoreBrand = (stores: number) => clamp(30 + 14 * Math.log10(Math.max(stores, 1)), 35, 92);
function scoreAccess(startupCostWon: number): number {
  if (!startupCostWon) return 50;
  if (startupCostWon < 5000) return 85;
  if (startupCostWon < 8000) return 75;
  if (startupCostWon < 12000) return 63;
  if (startupCostWon < 18000) return 52;
  if (startupCostWon < 25000) return 44;
  return 38;
}

// 간단 결정적 해시 → ascii id
function hashId(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return "kftc-" + h.toString(36);
}

type Brand = Record<string, unknown>;

async function main() {
  const apiKey = loadApiKey();
  console.log(`▶ 가맹점 ≥${MIN_STORES} 브랜드 생성 — 기준년도 ${YEAR}`);
  const rows = await fetchAllBrandFrcsStats({ apiKey, baseUrl: "" }, YEAR, {
    numOfRows: 1000, onPage: (p, t) => process.stdout.write(`\r  page ${p} (총 ${t})   `),
  });
  console.log(`\n  ✓ ${rows.length} 레코드`);

  // 동명 dedup (최대 가맹점수)
  const byName = new Map<string, StatRow>();
  for (const r of rows) {
    if (r.storeCount < MIN_STORES) continue;
    const k = norm(r.brandName);
    const prev = byName.get(k);
    if (!prev || r.storeCount > prev.storeCount) byName.set(k, r);
  }

  // 큐레이션 로드 → 이름 set + 세부업종/카테고리 평균 비용 프록시
  const curated: Brand[] = JSON.parse(readFileSync(new URL("../packages/shared/src/franchise-brands.json", import.meta.url), "utf8"));
  // 큐레이션과 KFTC 표기차 별칭 (enrich-franchise-official-stats.mts 와 동일) — 중복 제외용.
  const CURATED_ALIASES: Record<string, string> = {
    "mega-coffee": "메가엠지씨커피", "cu": "씨유", "gs25": "지에스25", "olive-young": "Olive Young",
    "hollys": "할리스", "the-liter": "THE LITER (더리터", "dunkin": "던킨", "yoonsaeng": "윤선생영어교실",
    "myungrang-hotdog": "명랑시대쌀핫도그", "hansot-lunchbox": "한솥", "60gye-chicken": "60계",
    "hosik-chicken": "호식이두마리치킨", "puradak": "푸라닭", "hongkong-banjum": "홍콩반점0410",
    "yeokjeon-udon": "역전우동0410", "lian-hair": "리안", "jungsang": "JLS정상어학원",
    "seldog24-study": "셀독24스터디카페", "gymboree": "짐보리플레이앤뮤직",
  };
  // 큐레이션이 차지한 KFTC 이름(별칭 우선) + 큐레이션이 보강받은 officialStats 이름까지 제외.
  const curatedNames = new Set<string>();
  for (const b of curated) {
    curatedNames.add(norm((b.name as { ko: string }).ko));
    const alias = CURATED_ALIASES[String(b.id)];
    if (alias) curatedNames.add(norm(alias));
  }
  const subCost: Record<string, { cost: number[]; fee: number[] }> = {};
  const catCost: Record<string, { cost: number[]; fee: number[] }> = {};
  for (const b of curated) {
    const cost = Number(b.startupCostWon) || 0, fee = Number(b.franchiseFee) || 0;
    if (cost <= 0) continue;
    const cat = String(b.categoryId);
    (catCost[cat] ??= { cost: [], fee: [] }).cost.push(cost);
    catCost[cat].fee.push(fee);
    for (const s of (b.subIndustryIds as string[]) ?? []) {
      (subCost[s] ??= { cost: [], fee: [] }).cost.push(cost);
      subCost[s].fee.push(fee);
    }
  }
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
  function costProxy(cat: string, subs: string[]): { cost: number; fee: number } {
    for (const s of subs) if (subCost[s]?.cost.length) return { cost: avg(subCost[s].cost), fee: avg(subCost[s].fee) };
    if (catCost[cat]?.cost.length) return { cost: avg(catCost[cat].cost), fee: avg(catCost[cat].fee) };
    return { cost: 0, fee: 0 };
  }

  const out: Brand[] = [];
  const usedIds = new Set<string>(curated.map((b) => String(b.id)));
  let skippedCurated = 0;

  for (const r of [...byName.values()].sort((a, b) => b.storeCount - a.storeCount)) {
    const nk = norm(r.brandName);
    if (curatedNames.has(nk)) { skippedCurated++; continue; }

    const { c: categoryId, s: subIndustryIds } = mapCategory(r.industryL, r.industryM);
    const closurePct = r.storeCount > 0 ? ((r.terminations + r.cancellations) / r.storeCount) * 100 : 0;
    const avgSalesWon = r.avgSalesThousandWon > 0 ? Math.round(r.avgSalesThousandWon / 10) : 0;
    const avgSalesPerAreaWon = r.avgSalesPerAreaThousandWon > 0 ? Math.round(r.avgSalesPerAreaThousandWon / 10) : 0;
    const { cost: startupCostWon, fee: franchiseFee } = costProxy(categoryId, subIndustryIds);

    const profitability = scoreProfit(avgSalesWon);
    const stability = scoreStability(closurePct);
    const brandPower = scoreBrand(r.storeCount);
    const accessibility = scoreAccess(startupCostWon);
    const support = clamp((profitability + stability + brandPower + accessibility) / 4, 35, 92);

    // 이름: "한글(영문)" 형태면 영문 분리
    const enMatch = r.brandName.match(/[(（]([A-Za-z][^)）]*)[)）]/);
    const ko = r.brandName.replace(/\s*[(（][^)）]*[)）]\s*/g, "").trim() || r.brandName;
    const en = enMatch ? enMatch[1].trim() : ko;

    let id = hashId(nk);
    while (usedIds.has(id)) id += "x";
    usedIds.add(id);

    const tagKo = `전국 ${r.storeCount.toLocaleString()}개 가맹점` + (avgSalesWon ? ` · 점당 연매출 ${(avgSalesWon / 10000).toFixed(1)}억` : "");
    const tagEn = `${r.storeCount.toLocaleString()} stores nationwide` + (avgSalesWon ? ` · ${(avgSalesWon / 10000).toFixed(1)}억/store` : "");

    out.push({
      id,
      tier: "kftc",
      subIndustryIds,
      categoryId,
      name: { ko, en },
      tagline: { ko: tagKo, en: tagEn },
      startupCostWon,
      franchiseFee,
      monthlyRoyalty: 0,
      avgAnnualRevenueWon: avgSalesWon,
      storeCount: r.storeCount,
      closureRate: Math.round(closurePct * 10) / 10,
      scores: { profitability, stability, accessibility, brandPower, support },
      roadmapNotes: { ko: [], en: [] },
      costVerified: false,
      costSource: "큐레이션 세부업종 평균 추정 (창업비용은 공정위 미제공)",
      dataYear: YEAR,
      sources: [{ label: `공정거래위원회 브랜드별 가맹점 현황 ${YEAR}`, url: "https://www.data.go.kr/data/15110241/openapi.do", tier: "primary" }],
      confidence: "low",
      officialStats: {
        year: r.year,
        storeCount: r.storeCount,
        newOpenings: r.newOpenings,
        terminations: r.terminations,
        cancellations: r.cancellations,
        ...(avgSalesWon ? { avgSalesWon } : {}),
        ...(avgSalesPerAreaWon ? { avgSalesPerAreaWon } : {}),
        fetchedAt: new Date().toISOString().slice(0, 10),
      },
    });
  }

  const dest = new URL("../packages/shared/src/franchise-brands-kftc.json", import.meta.url);
  writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");

  const byCat: Record<string, number> = {};
  out.forEach((b) => (byCat[String(b.categoryId)] = (byCat[String(b.categoryId)] || 0) + 1));
  console.log(`✓ ${out.length}개 생성 (큐레이션 중복 ${skippedCurated} 제외)`);
  console.log("  카테고리:", byCat);
  console.log("  샘플:", out.slice(0, 3).map((b) => `${(b.name as { ko: string }).ko}(${b.storeCount}, 종합 점수계산)`).join(" / "));
}

main().catch((e) => { console.error(e); process.exit(1); });
