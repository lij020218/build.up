/**
 * build-franchise-regional.mts — 프랜차이즈 시도별 분포 SSOT (공정위 신형 가족, 2026-08-03)
 *
 * 원칙 (사장님 결정 — "두 데이터 혼동 금지"):
 *  지역 수치는 **신형 가족(목록 15125467 + 지역별 15125490)만으로** 만든다.
 *  전국수도 같은 가족의 시도합으로 — 구형 15110241 수치와 한 화면에 병기 금지.
 *
 * 흐름: 목록(브랜드명↔관리번호, 11,683) + 지역별(관리번호→시도 분포, 179k행)
 *  → 우리 1,633개 브랜드에 정규화 이름 매칭 → franchise-regional.json (서버 전용).
 *
 * 매칭 정직성: 동명 브랜드 다수(다른 본부)면 매칭 포기 (남의 분포 부착 금지).
 * 실행: 연 1회 (기준년도 갱신 시). cd apps/web && npx tsx ../../scripts/build-franchise-regional.mts
 */
import { readFileSync, writeFileSync } from "node:fs";

const YR = process.argv[2] ?? "2024";
const env = Object.fromEntries(readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8")
  .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
  .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const KEY = encodeURIComponent(env.KFTC_API_KEY as string);

async function fetchAll(service: string, op: string, extra = ""): Promise<Array<Record<string, unknown>>> {
  const rows: Array<Record<string, unknown>> = [];
  let page = 1, total = Infinity;
  while (rows.length < total && page <= 250) {
    const url = `https://apis.data.go.kr/1130000/${service}/${op}?serviceKey=${KEY}&pageNo=${page}&numOfRows=1000&resultType=json&jngBizCrtraYr=${YR}${extra}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`${service} HTTP ${res.status} p${page}`);
    const json = await res.json() as { totalCount?: number; items?: Array<Record<string, unknown>> };
    total = Number(json.totalCount ?? 0);
    const items = json.items ?? [];
    rows.push(...items);
    if (items.length === 0) break;
    page++;
  }
  return rows;
}

function normalizeName(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/\([^)]*\)/g, "").replace(/[\s()\-·.&]/g, "").toLowerCase();
}

/**
 * 수동 별칭 — 공정위 정보공개서 표기가 우리 표기와 다른 **확신 브랜드만** (2026-08-03 후보 전수 대조).
 *  확신 기준: 같은 회사·같은 브랜드의 공식 등록명 (예: 메가커피=메가엠지씨커피, 59쌀피자=오구쌀피자).
 *  불확실(포메인RED·워시엔조이 멤버스·야마하 타운센터 등 변형/서브브랜드 의심)은 넣지 않는다 — 남의 분포 부착 금지.
 */
const MANUAL_MNNO: Record<string, string> = {
  "bhc": "BRD_20080100655",              // 비에이치씨(BHC)
  "60gye-chicken": "BRD_20151039",       // 60계
  "hosik-chicken": "BRD_20080600014",    // 호식이두마리치킨
  "puradak": "BRD_20150218",             // 푸라닭
  "lotteria": "BRD_20080100155",
  "kfc-korea": "BRD_20240175",           // KFC(케이에프씨)
  "hongkong-banjum": "BRD_20080100210",  // 홍콩반점0410
  "hansot-lunchbox": "BRD_20080100308",  // 한솥
  "kimgane": "BRD_20080100109",
  "bonjuk-bibimbap": "BRD_20141221",     // 본죽&비빔밥
  "yeokjeon-udon": "BRD_20120100352",    // 역전우동0410
  "yupdduk": "BRD_20130100283",          // 불닭발땡초동대문엽기떡볶이
  "dookki": "BRD_20150385",              // 두끼
  "myungrang-hotdog": "BRD_20161137",    // 명랑시대쌀핫도그 (운영사 공식 등록명)
  "mega-coffee": "BRD_20160628",         // 메가엠지씨커피
  "hollys": "BRD_20080100199",           // 할리스
  "dunkin": "BRD_20080500016",           // 던킨/던킨도너츠
  "cu": "BRD_20080100020",               // 씨유(CU)
  "gs25": "BRD_20080100032",             // 지에스25(GS25)
  "lian-hair": "BRD_20080100743",        // 리안
  "golfzon-park": "BRD_20160489",        // 골프존파크(GOLFZON PARK)
  "jungsang": "BRD_20080100659",         // JLS정상어학원
  "toz-study": "BRD_20090100228",        // 토즈(TOZ)
  "seldog24-study": "BRD_20200560",      // 셀독24스터디카페
  "seven-star-coin": "BRD_20161144",     // 세븐스타 코인노래연습장
  "59-rice-pizza": "BRD_20090100089",    // 오구쌀피자
  "gobongmin-kimbap": "BRD_20110300059", // 고봉민김밥人
  "tenpercent-coffee": "BRD_20180244",   // 텐퍼센트스페셜티커피
  "gymboree": "BRD_20080100494",         // 짐보리플레이앤뮤직
};

// ── ① 목록: brandMnno ↔ 브랜드명 ──
console.log("목록 수집 중…");
const listing = await fetchAll("FftcBrandRlsInfo2_Service", "getBrandinfo");
console.log(`목록 ${listing.length.toLocaleString()}개 브랜드`);

// ── ② 지역별: brandMnno → 시도 분포 ──
console.log("지역별 수집 중… (179k행, ~3분)");
const regional = await fetchAll("FftcBrandFrcsDropInfo3_Service", "getbrandFrcsDmsstus2");
console.log(`지역별 ${regional.length.toLocaleString()}행`);

// 함정 실증 (2026-08-03 메가커피 원시행 대조):
//  ① areaNm="전체" 행이 시도 행과 공존 — 합산하면 전 브랜드 2배 (5,362=2,681×2 사고)
//  ② frcsCnt=가맹점만 — 상권 내 "매장 수"는 allFrcsDmsCnt(가맹+직영)가 정직 (메가 서울 639→665)
//  ③ jngBizCrtraYr=2024여도 실 데이터는 acntgYr=2023 회계연도 — 라벨은 acntgYr로
const byMnno = new Map<string, { total: number; areas: Record<string, number>; acntgYr: string }>();
for (const r of regional) {
  const k = String(r.brandMnno ?? "");
  if (!k) continue;
  const area = String(r.areaNm ?? "").trim();
  if (!area || area === "전체") continue;               // "전체" 행은 검산에만 쓰고 합산 제외
  const e = byMnno.get(k) ?? { total: 0, areas: {}, acntgYr: "" };
  const n = Number(r.allFrcsDmsCnt ?? 0);               // 가맹+직영
  e.total += n;
  e.areas[area] = (e.areas[area] ?? 0) + n;
  const yr = String(r.acntgYr ?? "");
  if (yr) e.acntgYr = e.acntgYr && e.acntgYr !== yr ? "mixed" : yr;
  byMnno.set(k, e);
}

// ── ③ 이름 → mnno 인덱스 (동명 다수 = 매칭 금지 대상) ──
const nameIndex = new Map<string, Set<string>>();
for (const b of listing) {
  const key = normalizeName(String(b.brandNm ?? ""));
  if (key.length < 2) continue;
  const set = nameIndex.get(key) ?? new Set<string>();
  set.add(String(b.brandMnno)); // Set — 목록에 같은 mnno 중복 행 존재 (가짜 동명충돌 방지)
  nameIndex.set(key, set);
}

// ── ④ 우리 1,633개 매칭 ──
const curated = JSON.parse(readFileSync(new URL("../packages/shared/src/franchise-brands.json", import.meta.url), "utf8"));
const kftc = JSON.parse(readFileSync(new URL("../packages/shared/src/franchise-brands-kftc.json", import.meta.url), "utf8"));
const ours: Array<{ id: string; nameKo: string }> = [...curated, ...kftc].map((b: { id: string; name: { ko: string } }) => ({ id: b.id, nameKo: b.name.ko }));

const out: Record<string, { mnno: string; total: number; areas: Record<string, number>; acntgYr: string }> = {};
let matched = 0, ambiguous = 0, noRegional = 0, notFound = 0;
for (const b of ours) {
  let mnno: string | null = MANUAL_MNNO[b.id] ?? null;   // 수동 별칭 우선 (확신 개명 브랜드)
  if (!mnno) {
    const mnnos = [...(nameIndex.get(normalizeName(b.nameKo)) ?? [])];
    if (mnnos.length === 0) { notFound++; continue; }
    if (mnnos.length > 1) { ambiguous++; continue; }      // 동명 본부 다수 — 남의 분포 부착 금지
    mnno = mnnos[0]!;
  }
  const reg = byMnno.get(mnno);
  if (!reg || reg.total <= 0) { noRegional++; continue; }
  out[b.id] = { mnno, total: reg.total, areas: reg.areas, acntgYr: reg.acntgYr };
  matched++;
}
console.log(`매칭 ${matched}/${ours.length} (동명충돌 ${ambiguous} · 지역데이터없음 ${noRegional} · 목록에없음 ${notFound})`);

// ── sanity — 범위 밖이면 파일 안 쓰고 사망 ──
if (matched < 800) throw new Error(`매칭률 이상: ${matched}/${ours.length}`);
const mega = ours.find((b) => b.id === "mega-coffee");
if (mega && out[mega.id]) {
  const m = out[mega.id]!;
  console.log(`검증 — 메가커피: 전국 ${m.total.toLocaleString()} · 대전 ${m.areas["대전"] ?? 0} · 서울 ${m.areas["서울"] ?? 0} · 회계연도 ${m.acntgYr}`);
  // 원시행 실증 대조 (allFrcsDmsCnt, "전체" 제외): 전국 2,709 · 대전 67 · 서울 665
  if (m.total !== 2709 || m.areas["서울"] !== 665) throw new Error("메가커피 검산 불일치 — 합산 로직 회귀");
}

const payload = {
  _source: "공정거래위원회 가맹사업정보 (목록 15125467 + 지역별 15125490 — 단일 가족, 정보공개서 기준)",
  _yr: YR,
  _yrNote: "jngBizCrtraYr(등록기준)=" + YR + " — 표시 라벨은 브랜드별 acntgYr(회계연도) 사용",
  _fetchedAt: new Date().toISOString().slice(0, 10),
  _note: "전국수 = 같은 가족의 시도합. 구형 15110241 수치와 병기 금지 (집계 기준 상이 실증 2026-08-03).",
  brands: out,
};
writeFileSync(new URL("../apps/web/app/api/_lib/franchise-regional.json", import.meta.url), JSON.stringify(payload), "utf8");
console.log(`✅ franchise-regional.json — ${matched}개 브랜드 시도별 분포 (${YR})`);
