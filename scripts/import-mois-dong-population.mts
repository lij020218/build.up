/**
 * import-mois-dong-population.mts — 행안부 전국 행정동 성/연령 주민등록 인구 → 배후인구 SSOT.
 *
 * 원천: data.go.kr 15097972 "행정안전부_지역별(행정동) 성별 연령별 주민등록 인구수" (월간 CSV, 무료·무키)
 * 실행 (월 1회 권장 — 부동산원·공정위와 같은 배치 패턴):
 *   npx tsx scripts/import-mois-dong-population.mts [csv경로]
 *   (경로 생략 시 data.go.kr 에서 직접 다운로드)
 *
 * 법정동↔행정동 함정 (이 파일의 존재 이유):
 *   카카오 Local 의 동명은 **법정동**("망원동"), 이 통계는 **행정동**("망원제1동·제2동").
 *   → 행정동명을 정규화("망원제1동"→"망원동", "둔산2동"→"둔산동")해 같은 시군구 안에서
 *     합산한다. 산출물 라벨은 "행정동 합산" — 법정동 정밀값인 척하지 않는다.
 *
 * 산출: apps/web/app/api/_lib/dong-population.json (서버 전용 — shared index 로 export 금지:
 *   ~수백 KB 라 클라이언트 번들에 새면 안 됨. iOS 는 서버 meta 로 값만 받는다.)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const DOWNLOAD_URL = "https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000003669440&fileDetailSn=1";
const TMP = "/tmp/mois-dong-pop.csv";

let csvPath = process.argv[2];
if (!csvPath) {
  console.log("다운로드 중…");
  execSync(`curl -sL -m 180 -o ${TMP} "${DOWNLOAD_URL}"`);
  csvPath = TMP;
}
if (!existsSync(csvPath)) throw new Error(`CSV 없음: ${csvPath}`);

// MOIS CSV 는 CP949 — utf8 로 읽으면 한글 헤더가 깨져 조용히 0건이 된다
const buf = readFileSync(csvPath);
let text: string;
try {
  text = new TextDecoder("euc-kr").decode(buf);
} catch {
  text = buf.toString("utf8");
}
if (!text.includes("행정기관코드")) {
  // 이미 UTF-8 로 제공되는 달도 있음 — 헤더로 판별
  text = buf.toString("utf8");
  if (!text.includes("행정기관코드")) throw new Error("헤더 인식 실패 — 인코딩/스키마 변경 여부 확인 필요");
}

const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
const header = lines[0]!.split(",");
const col = (name: string) => {
  const i = header.indexOf(name);
  if (i < 0) throw new Error(`컬럼 없음: ${name} — 스키마 변경, 스크립트 갱신 필요`);
  return i;
};

const iYm = col("기준연월");
const iSido = col("시도명");
const iSgg = col("시군구명");
const iDong = col("읍면동명");
const iTotal = col("계");

// 연령 밴드 컬럼 인덱스 사전 계산: "N세남자"/"N세여자" (+ "100세이상남자/여자")
const ageCols: Array<{ idx: number; age: number }> = [];
for (let i = 0; i < header.length; i++) {
  const m = /^(\d+)세(?:이상)?(남자|여자)$/.exec(header[i]!.trim());
  if (m) ageCols.push({ idx: i, age: Number(m[1]) });
}
if (ageCols.length < 100) throw new Error(`연령 컬럼 ${ageCols.length}개 — 스키마 확인 필요`);

/** 행정동명 → 법정동 근사 키: "망원제1동"→"망원동", "둔산2동"→"둔산동", "종로1.2.3.4가동" 은 유지 */
function normalizeDong(name: string): string {
  return name
    .replace(/제?\d+동$/, "동")     // 망원제1동·둔산2동 → 망원동·둔산동
    .replace(/·/g, ".")
    .trim();
}

type Agg = {
  sido: string; sigungu: string; dong: string; ym: string;
  total: number;
  // 연령 밴드 (남+여 합): 10대(10-19)/20대/30대/40대/50대/60+
  bands: [number, number, number, number, number, number];
  /** 합산에 들어간 행정동 수 — 1이면 그대로, 2+면 "N개 행정동 합산" 라벨 근거 */
  adminDongCount: number;
};

const map = new Map<string, Agg>();
let rows = 0;

for (let li = 1; li < lines.length; li++) {
  const parts = lines[li]!.split(",");
  if (parts.length < header.length - 2) continue;
  const dongRaw = (parts[iDong] ?? "").trim();
  if (!dongRaw) continue;   // 시도·시군구 소계 행 제외
  rows++;

  const sido = (parts[iSido] ?? "").trim();
  const sgg = (parts[iSgg] ?? "").trim();
  const key = `${sido}|${sgg}|${normalizeDong(dongRaw)}`;

  const bands: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
  for (const { idx, age } of ageCols) {
    const v = Number((parts[idx] ?? "0").replace(/[^\d]/g, "")) || 0;
    if (age < 10) continue;
    else if (age < 20) bands[0] += v;
    else if (age < 30) bands[1] += v;
    else if (age < 40) bands[2] += v;
    else if (age < 50) bands[3] += v;
    else if (age < 60) bands[4] += v;
    else bands[5] += v;
  }
  const total = Number((parts[iTotal] ?? "0").replace(/[^\d]/g, "")) || 0;

  const prev = map.get(key);
  if (prev) {
    prev.total += total;
    for (let b = 0; b < 6; b++) prev.bands[b] += bands[b];
    prev.adminDongCount++;
  } else {
    map.set(key, {
      sido, sigungu: sgg, dong: normalizeDong(dongRaw),
      ym: (parts[iYm] ?? "").trim(),
      total, bands, adminDongCount: 1,
    });
  }
}

const all = [...map.values()];

// ── 위조 방지 sanity — 범위 밖이면 파일을 쓰지 않고 죽는다 ──
if (all.length < 2_000 || all.length > 6_000) throw new Error(`동 수 이상: ${all.length}`);
const sumPop = all.reduce((s, a) => s + a.total, 0);
if (sumPop < 45_000_000 || sumPop > 55_000_000) throw new Error(`전국 인구 합 이상: ${sumPop.toLocaleString()}`);
// 기준연월 표기가 달마다 다름 ("202606" 또는 "2026-06-30") — YYYYMM 로 정규화
const ymRaw = all[0]!.ym;
const ymMatch = /^(\d{4})-?(\d{2})/.exec(ymRaw);
if (!ymMatch) throw new Error(`기준연월 형식 이상: ${ymRaw}`);
const ym = `${ymMatch[1]}${ymMatch[2]}`;

const out = {
  _source: "행정안전부 주민등록 인구통계 (data.go.kr 15097972, 국가승인통계)",
  _ym: ym,                                       // "202606"
  _note: "행정동을 법정동 근사로 정규화·합산. 거주(주민등록) 인구 — 유동인구 아님.",
  _fetchedAt: new Date().toISOString().slice(0, 10),
  dongs: all.sort((a, b) => a.sido.localeCompare(b.sido, "ko") || a.dong.localeCompare(b.dong, "ko")),
};

const target = new URL("../apps/web/app/api/_lib/dong-population.json", import.meta.url);
writeFileSync(target, JSON.stringify(out), "utf8");
console.log(`✅ 행정동 원본 ${rows.toLocaleString()}행 → 정규화 ${all.length.toLocaleString()}개 동 (기준 ${ym}, 전국 합 ${sumPop.toLocaleString()}명)`);
console.log(`   → apps/web/app/api/_lib/dong-population.json`);
