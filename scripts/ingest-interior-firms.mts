/**
 * ingest-interior-firms.mts
 *
 * 국토부 전국인테리어업체표준데이터 CSV → Supabase interior_firms 적재.
 *  포털이 이 데이터셋을 CSV 파일로만 제공(오픈API 미등록 — 2026-08-04 확인)해 배치 적재한다.
 *  원본 갱신 연 1회(지자체 월 병합) — 분기 1회 재실행 권장.
 *
 * 사용법:
 *   1. https://www.data.go.kr/data/15129446/standard.do 에서 CSV 다운로드
 *   2. npx tsx scripts/ingest-interior-firms.mts <csv 경로>
 *
 * 필요 env (apps/web/.env.local 자동 탐색):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * 인코딩: data.go.kr 표준 CSV 는 CP949(EUC-KR)인 경우가 많다 — BOM/UTF-8 자동 감지 후
 *   아니면 iconv-lite 로 CP949 디코드.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import iconv from "iconv-lite";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("사용법: npx tsx scripts/ingest-interior-firms.mts <csv 경로>");
  process.exit(1);
}

function loadEnv(name: string): string {
  if (process.env[name]) return process.env[name]!;
  try {
    const env = readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8");
    const line = env.split("\n").find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
  } catch { /* ignore */ }
  throw new Error(`${name} not found (env or apps/web/.env.local)`);
}

// ── CSV 디코드 (UTF-8 BOM → UTF-8, 아니면 CP949 시도 후 한글 헤더 검증) ──
function decodeCsv(buf: Buffer): string {
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.subarray(3).toString("utf8");
  const utf8 = buf.toString("utf8");
  if (utf8.slice(0, 200).includes("업체명")) return utf8;
  const cp949 = iconv.decode(buf, "cp949");
  if (cp949.slice(0, 200).includes("업체명")) return cp949;
  throw new Error("CSV 인코딩 판별 실패 — 헤더에 '업체명'이 없습니다. 파일을 확인하세요.");
}

/** 따옴표·콤마 처리 CSV 파서 (표준데이터는 셀 내 콤마 존재) */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) { row.push(cell); if (row.some((c) => c.trim() !== "")) rows.push(row); }
  return rows;
}

const buf = readFileSync(csvPath);
const rows = parseCsv(decodeCsv(buf));
if (rows.length < 2) { console.error("CSV 에 데이터 행이 없습니다."); process.exit(1); }

// ── 헤더 매핑 — 표준데이터 한글 컬럼명 기준 (열 순서 변화에 견디게 이름으로 찾는다) ──
const header = rows[0].map((h) => h.trim());
const col = (name: string): number => header.findIndex((h) => h === name || h.includes(name));
const idx = {
  name: col("업체명"),
  sido: col("시도명"),
  sigungu: col("시군구명"),
  road: col("소재지도로명주소"),
  jibun: col("소재지지번주소"),
  phone: col("전화번호"),
  regYmd: col("등록일자"),
  regNo: col("등록번호"),
  rep: col("대표자명"),
  staff: col("총직원수"),
};
if (idx.name < 0 || idx.regNo < 0 || idx.sigungu < 0) {
  console.error(`필수 컬럼 누락 — 헤더: ${header.join(" | ")}`);
  process.exit(1);
}

const cell = (r: string[], i: number): string => (i >= 0 && typeof r[i] === "string" ? r[i].trim() : "");
type FirmRow = {
  reg_no: string; name: string; sido: string; sigungu: string;
  road_addr: string; jibun_addr: string; phone: string | null;
  rep_name: string | null; staff_cnt: number | null; reg_ymd: string | null;
};

// ⚠️ 적재 키 (2026-08-04 실측 교훈): 원본 등록번호는 지자체별 관리라 **공백 64%·중복·오염
//   ('실내건축공사업' 같은 값)** 이 실재 — PK 로 못 쓴다. 키 = 시군구|업체명|주소 (결정론,
//   진짜 중복 행만 접힌다). reg_no 컬럼(PK 슬롯)에는 이 키를 저장하고 원본 등록번호는
//   추적용으로 키에 포함될 뿐 별도 표시하지 않는다 (UI 는 등록번호를 안 쓴다).
const seen = new Set<string>();
const firms: FirmRow[] = [];
for (const r of rows.slice(1)) {
  const name = cell(r, idx.name);
  if (!name) continue;
  const sigungu = cell(r, idx.sigungu);
  const addr = cell(r, idx.jibun) || cell(r, idx.road);
  const key = [sigungu, name, addr].join("|");
  if (seen.has(key)) continue;
  seen.add(key);
  const ymdRaw = cell(r, idx.regYmd).replace(/[./]/g, "-");
  const staffRaw = Number(cell(r, idx.staff));
  firms.push({
    reg_no: key,
    name,
    sido: cell(r, idx.sido),
    sigungu,
    road_addr: cell(r, idx.road),
    jibun_addr: cell(r, idx.jibun),
    phone: cell(r, idx.phone) || null,
    rep_name: cell(r, idx.rep) || null,
    staff_cnt: Number.isFinite(staffRaw) && staffRaw > 0 ? Math.trunc(staffRaw) : null,
    reg_ymd: /^\d{4}-\d{2}-\d{2}$/.test(ymdRaw) ? ymdRaw : null,
  });
}
console.log(`파싱 완료: ${firms.length}개 업체 (원본 ${rows.length - 1}행, 완전 중복 행만 제외)`);

const supabase = createClient(loadEnv("NEXT_PUBLIC_SUPABASE_URL"), loadEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 전체 교체(full refresh) — 연 1회 배치라 기존 행 전부 삭제 후 재적재.
//   키 체계가 바뀌어도(과거: 등록번호 PK) 고아 행이 남지 않는다.
{
  const { error } = await supabase.from("interior_firms").delete().not("reg_no", "is", null);
  if (error) { console.error("기존 행 삭제 실패:", error.message); process.exit(1); }
  console.log("기존 행 전체 삭제 (full refresh)");
}

const BATCH = 1000;
let upserted = 0;
for (let i = 0; i < firms.length; i += BATCH) {
  const chunk = firms.slice(i, i + BATCH);
  const { error } = await supabase.from("interior_firms").upsert(chunk, { onConflict: "reg_no" });
  if (error) {
    console.error(`업서트 실패 (batch ${i / BATCH + 1}):`, error.message);
    process.exit(1);
  }
  upserted += chunk.length;
  console.log(`  … ${upserted}/${firms.length}`);
}

// 검산 — 시군구 상위 5곳 분포 출력 (적재가 진짜 됐는지 눈으로 확인)
const { count } = await supabase.from("interior_firms").select("*", { count: "exact", head: true });
console.log(`✅ 적재 완료. 테이블 총 ${count ?? "?"}행.`);
