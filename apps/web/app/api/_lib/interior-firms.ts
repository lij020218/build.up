/**
 * 전국인테리어업체표준데이터 (국토부) — 실명 등록 시공업체 조회 (2026-08-04).
 *
 *  건설산업기본법 시행령 §7 에 따른 실내건축공사업 *등록* 업체 — 업체명·주소·전화·등록일.
 *  데이터 경로: 포털이 CSV 파일로만 제공(오픈API·odcloud 미등록 — 2026-08-04 확인)
 *   → scripts/ingest-interior-firms.mts 로 Supabase interior_firms 에 배치 적재(분기 1회 권장),
 *     여기서는 시군구로 조회만 한다.
 *
 *  정직성 경계: "등록 확인" 이지 품질 보증이 아니다 — UI 는 반드시
 *  "국토부 등록 확인 · 복수 견적 필수" 라벨을 동반할 것. 제공 지자체 44곳 —
 *  미커버 지역·미적재 상태는 빈 결과가 정상이며 표시 안 함이 정직한 동작.
 */
import { createClient } from "@supabase/supabase-js";

export type InteriorFirm = {
  name: string;
  sido: string;
  sigungu: string;
  address: string;
  phone: string | null;
  registeredAt: string | null;
  staffCnt: number | null;
};

/**
 * 업체명 정규화 — 카카오 검색 결과와 등록 대장의 이름 교차 대조용.
 *  법인 표기·공백·괄호 부기를 제거해 "㈜한빛디자인" ↔ "한빛디자인(주)" 을 같게 본다.
 */
export function normalizeFirmName(name: string): string {
  return name
    .replace(/\(주\)|㈜|주식회사|\(유\)|유한회사/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/** 시도 축약 → 표준데이터 시도명 (동명 시군구 충돌 방지: 서울 강서구 ↔ 부산 강서구) */
const SIDO_FULL: Record<string, string> = {
  서울: "서울특별시", 부산: "부산광역시", 대구: "대구광역시", 인천: "인천광역시",
  광주: "광주광역시", 대전: "대전광역시", 울산: "울산광역시", 세종: "세종특별자치시",
  경기: "경기도", 강원: "강원특별자치도", 충북: "충청북도", 충남: "충청남도",
  전북: "전북특별자치도", 전남: "전라남도", 경북: "경상북도", 경남: "경상남도", 제주: "제주특별자치도",
};

/** 지역 텍스트에서 시도명(표준데이터 표기) 추출 — 없으면 null (필터 생략) */
export function extractSido(regionText: string | null | undefined): string | null {
  if (!regionText) return null;
  for (const t of regionText.trim().split(/\s+/)) {
    const short = t.replace(/(특별시|광역시|특별자치시|특별자치도|도|시)$/, "");
    if (SIDO_FULL[short]) return SIDO_FULL[short];
  }
  return null;
}

/**
 * 지역 텍스트("서울 강남구", "성남시 분당구", "강남구")에서 시군구 토큰 추출.
 * 못 찾으면 null — 호출부는 스킵(억지 매칭 금지).
 */
export function extractSigungu(regionText: string | null | undefined): string | null {
  if (!regionText) return null;
  const tokens = regionText.trim().split(/\s+/);
  // 뒤에서부터: "○○구"/"○○군" 우선, 다음 "○○시"(광역·특별시 제외)
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (/^[가-힣]+(구|군)$/.test(t)) return t;
  }
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (/^[가-힣]+시$/.test(t) && !/(특별시|광역시)$/.test(t) && t !== "서울시") return t;
  }
  return null;
}

/**
 * interior_firms 조회 — 규모·업력 기준 상위 N (2026-08-04 랭킹 개편).
 *  표준데이터엔 평점·실적이 없으므로 "최고" 를 지어내지 않는다 — 검증 가능한
 *  결정론 신호(직원 수 = 규모·실체, 등록일 오래됨 = 업력)로만 정렬하고
 *  UI 가 그 기준을 그대로 말한다. 테이블 미적재·미커버 지역이면 [].
 */
export async function fetchInteriorFirms(opts: {
  sigungu: string;
  /** 표준데이터 시도명 ("서울특별시") — 동명 시군구(강서구·중구 등) 충돌 방지. 없으면 전국 매칭 */
  sido?: string | null;
  limit?: number;
}): Promise<InteriorFirm[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anon) return [];
  try {
    const supabase = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
    // 여유 fetch 후 코드에서 점수 정렬 (직원수·업력 혼합은 SQL order 로 표현이 안 됨)
    let q = supabase
      .from("interior_firms")
      .select("name, sido, sigungu, road_addr, phone, reg_ymd, staff_cnt")
      .eq("sigungu", opts.sigungu);
    if (opts.sido) q = q.eq("sido", opts.sido);
    const { data, error } = await q.limit(60);
    if (error || !data) return [];
    const firms = data.map((r) => ({
      name: String(r.name ?? ""),
      sido: String(r.sido ?? ""),
      sigungu: String(r.sigungu ?? ""),
      address: String(r.road_addr ?? ""),
      phone: r.phone ? String(r.phone) : null,
      registeredAt: r.reg_ymd ? String(r.reg_ymd) : null,
      staffCnt: Number.isFinite(Number(r.staff_cnt)) && Number(r.staff_cnt) > 0 ? Number(r.staff_cnt) : null,
    })).filter((f) => f.name);
    // 점수 = 직원 수(상한 20) + 업력 년수(상한 15) — 결정론, 위조 없음.
    //  동점(지자체가 직원수·등록일을 안 채운 행이 많음 — 2026-08-04 실측)은 전화 보유 우선.
    const score = (f: InteriorFirm): number => {
      const staff = Math.min(20, f.staffCnt ?? 0);
      const years = f.registeredAt
        ? Math.min(15, Math.max(0, (Date.now() - Date.parse(f.registeredAt)) / (365 * 86_400_000)))
        : 0;
      return staff + years;
    };
    return firms
      .sort((a, b) => score(b) - score(a) || Number(!!b.phone) - Number(!!a.phone))
      .slice(0, opts.limit ?? 3);
  } catch {
    return []; // 조회 실패 — 로드맵 생성 자체를 막지 않는다
  }
}
