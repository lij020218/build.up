/**
 * import-rone-market-rent.mts
 *
 * 한국부동산원 R-ONE Open API 에서 **상업용부동산 임대동향조사**의 최신 분기
 * 상권별 임대료·공실률을 수집해 packages/shared/src/market/rone-market-rent.json 생성.
 *
 * 데이터 성격 (정직성 라벨의 근거 — UI 문구가 여기서 나온다):
 *  - 국가승인통계. 조사 단위 = 전국 ~288개 개별 상권 (2024.3Q 표본 개편 이후 시리즈).
 *  - 임대료 단위: 천원/㎡ (월세 환산, 1층 기준 평균). "이 상권의 시세 수준"이지
 *    "내 점포 월세"가 아니다 — 보증금·권리금 미포함.
 *  - 분기 공표(익월 마지막 목요일). 분기마다 이 스크립트 재실행:
 *      npx tsx scripts/import-rone-market-rent.mts
 *
 * 통계표 (2024년 3분기~ 개편 시리즈, 2026-08-03 전수 조회로 확정):
 *  임대료  소규모 T248223134698125 / 중대형 T244363134858603 / 집합 T244913134948657
 *  공실률  소규모 T241833134686576 / 중대형 T249633134845544 / 집합 T243283134931290
 *
 * 검증 이력 (2026-08-03 실호출):
 *  - 최신 분기 202602 (2026 2분기) / 소규모 258·중대형 287 상권 / 대전>둔산 28.2천원 확인.
 *  - KEY 없으면 sample 모드로 같은 5행만 반복 반환 → 반드시 RONE_API_KEY 필요.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const BASE = "https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do";

const TABLES = [
  { statblId: "T248223134698125", metric: "rent", bldg: "small" },
  { statblId: "T244363134858603", metric: "rent", bldg: "medium" },
  { statblId: "T244913134948657", metric: "rent", bldg: "aggregate" },
  { statblId: "T241833134686576", metric: "vacancy", bldg: "small" },
  { statblId: "T249633134845544", metric: "vacancy", bldg: "medium" },
  { statblId: "T243283134931290", metric: "vacancy", bldg: "aggregate" },
] as const;

type Row = {
  WRTTIME_IDTFR_ID: string;   // "202602"
  CLS_ID: number;
  CLS_NM: string;             // "둔산"
  CLS_FULLNM: string | null;  // "대전>둔산" (시도>상권) — 상권 레벨 판별 기준
  ITM_NM: string;
  DTA_VAL: number;
  UI_NM: string;              // "천원/㎡" | "%"
  WRTTIME_DESC: string;       // "2026년 2분기"
};

function loadApiKey(): string {
  if (process.env.RONE_API_KEY) return process.env.RONE_API_KEY;
  try {
    const env = readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8");
    const line = env.split("\n").find((l) => l.startsWith("RONE_API_KEY="));
    if (line) return line.slice("RONE_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
  } catch { /* ignore */ }
  throw new Error("RONE_API_KEY not found (env or apps/web/.env.local)");
}

const KEY = loadApiKey();

async function fetchTable(statblId: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let p = 1; p <= 10; p++) {
    const url = `${BASE}?KEY=${KEY}&Type=json&pIndex=${p}&pSize=1000&STATBL_ID=${statblId}&DTACYCLE_CD=QY`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} (${statblId} p${p})`);
    const data = await resp.json() as Record<string, unknown>;
    const blocks = data.SttsApiTblData as Array<Record<string, unknown>> | undefined;
    if (!blocks) {
      // RESULT 만 오면 에러 응답 (ERROR-300 등)
      throw new Error(`unexpected response (${statblId}): ${JSON.stringify(data).slice(0, 200)}`);
    }
    const page = (blocks.find((b) => "row" in b)?.row ?? []) as Row[];
    rows.push(...page);
    const head = blocks.find((b) => "head" in b)?.head as Array<Record<string, unknown>> | undefined;
    const total = Number((head?.[0] as { list_total_count?: number })?.list_total_count ?? 0);
    if (rows.length >= total || page.length === 0) break;
  }
  return rows;
}

type DistrictEntry = {
  /** "대전>둔산" — 시도>상권. 조회 키 */
  fullName: string;
  sido: string;
  district: string;
  /** 천원/㎡ (월세 환산) — 건물유형별. 조사 표본 없는 유형은 없음 */
  rentThousandWonPerM2: Partial<Record<"small" | "medium" | "aggregate", number>>;
  /** % — 건물유형별 공실률 */
  vacancyPct: Partial<Record<"small" | "medium" | "aggregate", number>>;
};

const districts = new Map<string, DistrictEntry>();
let latestQuarter = "";
let latestQuarterLabel = "";

for (const t of TABLES) {
  const rows = await fetchTable(t.statblId);
  const latest = rows.reduce((m, r) => (r.WRTTIME_IDTFR_ID > m ? r.WRTTIME_IDTFR_ID : m), "");
  if (latest > latestQuarter) latestQuarter = latest;
  // 표별 최신 분기만 사용 (표마다 최신이 다르면 각자 자기 최신 — 기준시점은 엔트리에 공통 기록)
  const latestRows = rows.filter(
    (r) => r.WRTTIME_IDTFR_ID === latest && r.CLS_FULLNM && r.CLS_FULLNM.includes(">"),
  );
  for (const r of latestRows) {
    if (!latestQuarterLabel && r.WRTTIME_IDTFR_ID === latestQuarter) latestQuarterLabel = r.WRTTIME_DESC;
    const [sido, district] = r.CLS_FULLNM!.split(">", 2);
    if (!sido || !district) continue;
    const key = r.CLS_FULLNM!;
    let e = districts.get(key);
    if (!e) {
      e = { fullName: key, sido, district, rentThousandWonPerM2: {}, vacancyPct: {} };
      districts.set(key, e);
    }
    const val = Math.round(r.DTA_VAL * 10) / 10;   // 소수 1자리면 충분 (조사 평균치)
    if (t.metric === "rent") e.rentThousandWonPerM2[t.bldg] = val;
    else e.vacancyPct[t.bldg] = val;
  }
  console.log(`${t.metric}/${t.bldg}: ${latestRows.length}개 상권 (최신 ${latest})`);
}

// 위조 방지 sanity: 상권 수·값 범위가 상식 밖이면 파일을 쓰지 않고 죽는다
const all = [...districts.values()];
if (all.length < 200 || all.length > 500) throw new Error(`상권 수 이상: ${all.length}`);
for (const d of all) {
  for (const v of Object.values(d.rentThousandWonPerM2)) {
    if (v <= 0 || v > 500) throw new Error(`임대료 범위 밖: ${d.fullName} ${v}`);
  }
  for (const v of Object.values(d.vacancyPct)) {
    if (v < 0 || v > 100) throw new Error(`공실률 범위 밖: ${d.fullName} ${v}`);
  }
}

const out = {
  _source: "한국부동산원 상업용부동산 임대동향조사 (R-ONE Open API, 국가승인통계)",
  _sourceUrl: "https://www.reb.or.kr/r-one/",
  _quarter: latestQuarter,                       // "202602"
  _quarterLabel: latestQuarterLabel,             // "2026년 2분기"
  _fetchedAt: new Date().toISOString().slice(0, 10),
  _unitNote: "임대료=천원/㎡(월세 환산·1층 기준 평균), 공실률=%. 보증금·권리금 미포함.",
  districts: all.sort((a, b) => a.fullName.localeCompare(b.fullName, "ko")),
};

const target = new URL("../packages/shared/src/market/rone-market-rent.json", import.meta.url);
mkdirSync(dirname(target.pathname), { recursive: true });
writeFileSync(target, JSON.stringify(out, null, 1), "utf8");
console.log(`\n✅ ${out.districts.length}개 상권 → packages/shared/src/market/rone-market-rent.json (${out._quarterLabel})`);
