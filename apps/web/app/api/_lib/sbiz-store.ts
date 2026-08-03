/**
 * sbiz-store.ts — 소상공인시장진흥공단 상가(상권)정보 API (국세청 원천, 일 10,000건)
 *
 * 용도: 상권 단계 경쟁밀도의 공식화 — 카카오 지도 카운트(간판 기준)를 소진공
 *  공식 업소 DB(사업자 기준·표준 업종분류) 카운트로 승격. 매칭 안 되는 업종은
 *  카카오 폴백 유지 (억지 매핑 = 남의 업종 경쟁 수 부착 = 위조).
 *
 * 업종 매핑 근거 (2026-08-03, smallUpjongList 1,255개 전수 덤프에서 실코드 확인):
 *  · 확인된 소분류(scls)가 있으면 그것 — 예: 치킨 I21006, 스터디카페 R10202(!),
 *    요가/필라테스 P10603(학원 분류!), 셀프빨래방 S20902.
 *  · 소분류가 너무 잘거나 복수 걸치면 중분류(mcls) — 예: 한식 I201, 학원 P106.
 *  · **공식 분류가 없는 업종은 매핑하지 않는다** — 왁싱·속눈썹 전용 코드 없음(피부관리실
 *    근사만 존재), 펫 미용/호텔/훈련·파티룸·연습실·공유오피스 코드 없음 → null 선언.
 *  · 온라인·스타트업 = 상가업소 개념 없음 → null 선언.
 *  가드 테스트가 70개 세부업종 전수를 "매핑 or 명시적 null" 로 강제한다.
 */

const BASE = "https://apis.data.go.kr/B553077/api/open/sdsc2";

type UpjongMap = { scls?: string[]; mcls?: string[] } | null;

/** 세부업종 → 상권업종 코드. null = 공식 분류 없음/무점포 (카카오 폴백·미표시) */
export const SBIZ_UPJONG_MAP: Record<string, UpjongMap> = {
  // ── food ──
  "korean-casual": { mcls: ["I201"] },
  "delivery-meals": { mcls: ["I210"] },                       // 배달 중심 간이 (치킨·분식·버거 포괄)
  "salad-healthy": { scls: ["I21005"] },                      // 토스트/샌드위치/샐러드
  "ramen-noodle": { scls: ["I20105", "I20303"] },             // 국수/칼국수 + 일식 면
  "chicken-burger": { scls: ["I21006", "I21004"] },           // 치킨 + 버거
  "western-pasta-brunch": { scls: ["I20402", "I20401"] },     // 파스타/스테이크 + 경양식
  // ── cafe-dessert ──
  "takeout-coffee": { scls: ["I21201"] },
  "specialty-coffee": { scls: ["I21201"] },
  "dessert-cafe": { scls: ["I21201"] },
  "bakery-studio": { scls: ["I21001"] },                      // 빵/도넛
  "icecream-bingsu": { scls: ["I21008"] },
  "self-serve-cafe": { scls: ["I21201"] },
  // ── retail ──
  "convenience-small": { scls: ["G20405"] },                  // 편의점
  "lifestyle-goods": { mcls: ["G212"] },                      // 기타 생활용품 소매
  "beauty-supplies": { scls: ["G21503"] },                    // 화장품 소매
  "fashion-accessories": { scls: ["G20907"] },                // 액세서리/잡화
  "health-food-store": { scls: ["G20508"] },                  // 건강보조식품
  "unmanned-retail": { scls: ["G20405", "G20499"] },          // 편의점 + 기타 종합소매 (무인 전용 분류 없음)
  // ── beauty ──
  "hair-salon": { scls: ["S20701"] },
  "nail-studio": { scls: ["S20703"] },
  "skin-care-room": { scls: ["S20702"] },
  "waxing-studio": { scls: ["S20702"] },                      // 전용 코드 없음 — 피부관리실이 최근접 공식 분류
  "eyelash-brow": { scls: ["S20702", "S20703"] },             // 전용 코드 없음 — 피부관리+네일 근사
  "makeup-bridal": { scls: ["S20701"] },                      // 전용 코드 없음 — 미용실 계열
  // ── fitness ──
  "pilates-studio": { scls: ["P10603"] },                     // 요가/필라테스 학원 (스포츠 아닌 학원 분류! 인적용역 P10604 는 프리랜서분 — 점포 아님, 제외)
  "yoga-studio": { scls: ["P10603"] },
  "pt-gym": { scls: ["R10307"] },                             // 헬스장
  "crossfit-box": { scls: ["R10307", "R10314"] },             // 헬스장 + 기타 스포츠시설
  "golf-studio": { scls: ["R10311"] },                        // 골프 연습장
  "unmanned-fitness": { scls: ["R10307"] },
  // ── education ──
  "study-room": { scls: ["R10202"] },                         // 독서실/스터디카페 (교육 아닌 R!)
  "small-study-room": { scls: ["R10202"] },
  "kids-academy": { mcls: ["P105", "P106"] },
  "adult-class": { mcls: ["P106"] },
  "language-academy": { scls: ["P10615"] },                   // 외국어학원 (인적용역 제외)
  "coding-class": { mcls: ["P106"] },
  // ── pet ──
  "pet-grooming": null,                                       // 공식 소분류 없음 (기타 개인서비스에 섞임)
  "pet-supplies": { scls: ["G22001"] },                       // 애완동물/용품 소매
  "pet-hotel": null,
  "pet-cafe": { scls: ["I21201"] },
  "pet-training-school": null,
  // ── living-service ──
  "laundry-service": { scls: ["S20901"] },
  "self-laundry": { scls: ["S20902"] },                       // 셀프 빨래방
  "cleaning-service": { scls: ["N10201"] },
  "repair-service": { mcls: ["S206"] },
  "print-copy": { mcls: ["C129"] },                           // 인쇄업 (소매 인쇄소가 이 분류로 등록됨)
  "device-repair": { scls: ["S20201"] },                      // 핸드폰/통신장비 수리
  // ── space ──
  "guesthouse": { scls: ["I10299", "I10103"] },               // 기타 숙박 + 펜션
  "study-cafe-space": { scls: ["R10202"] },
  "rental-studio": null,                                      // 공간대여 공식 분류 없음
  "party-room": null,
  "shared-office": null,
  "practice-room": null,
  // ── online-digital / startup-tech — 상가업소 개념 없음 ──
  "smart-store": null, "digital-products": null, "creator-service": null,
  "consignment-commerce": null, "newsletter-membership": null, "global-buying": null,
  "ai-application": null, "developer-tools": null, "b2b-saas": null,
  "fintech-startup": null, "healthtech-startup": null, "security-startup": null,
  "hardware-iot": null, "robotics-physical-ai": null, "semiconductor": null,
  "biotech-medtech": null, "climate-energy": null,
};

async function countOnce(params: string, apiKey: string): Promise<number | null> {
  try {
    const url = `${BASE}/storeListInRadius?serviceKey=${encodeURIComponent(apiKey)}&type=json&numOfRows=1&pageNo=1&${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const json = await res.json() as { header?: unknown; body?: { totalCount?: number; items?: unknown } };
    const n = json?.body?.totalCount;
    if (typeof n === "number" && n >= 0) return n;
    // 실측 (2026-08-03): 결과 0건이면 totalCount 필드가 생략된 채 정상 header 로 온다
    //  → header 존재 + totalCount 부재 = 0건. header 조차 없으면 진짜 오류 = null.
    if (json?.header) return 0;
    return null;
  } catch {
    return null;   // 오류 ≠ 0개 — null 로 구분 (0 위조 금지)
  }
}

export type SbizCounts = {
  /** 동종업종 공식 카운트 — 매핑 없거나 조회 실패면 null (카카오 폴백 신호) */
  sameUpjong: number | null;
  /** 반경 내 전체 업소 수 (상권 규모) — 실패 시 null */
  totalStores: number | null;
};

/**
 * 반경 내 공식 업소 카운트. 코드별 totalCount 합산 (서로 다른 분류라 중복 없음).
 *  호출량: 후보당 코드 수(≤2) + 전체 1 = ≤3건. 일 10,000 쿼터 대비 미미.
 */
export async function sbizCountsInRadius(
  subIndustryId: string,
  cx: number,
  cy: number,
  radius: number,
  apiKey: string,
): Promise<SbizCounts> {
  const mapping = SBIZ_UPJONG_MAP[subIndustryId] ?? null;
  const base = `radius=${radius}&cx=${cx}&cy=${cy}`;

  const totalP = countOnce(base, apiKey);

  let sameP: Promise<number | null> = Promise.resolve(null);
  if (mapping) {
    const codes: Array<["indsSclsCd" | "indsMclsCd", string]> = [
      ...(mapping.scls ?? []).map((c): ["indsSclsCd", string] => ["indsSclsCd", c]),
      ...(mapping.mcls ?? []).map((c): ["indsMclsCd", string] => ["indsMclsCd", c]),
    ];
    sameP = Promise.all(codes.map(([k, c]) => countOnce(`${base}&${k}=${c}`, apiKey))).then((arr) => {
      if (arr.some((v) => v === null)) return null;   // 일부 실패 = 합산 불가 — 부분합을 전체인 척 금지
      return (arr as number[]).reduce((s, v) => s + v, 0);
    });
  }

  const [totalStores, sameUpjong] = await Promise.all([totalP, sameP]);
  return { sameUpjong, totalStores };
}

// ─── 개폐업 추이 (스냅샷 축적) ─────────────────────────────────────────
//  API 에 개업일 필드가 없고 폐업 업소는 목록에서 사라진다 (2026-08-03 실측)
//  → 라이브 추이 계산은 불가능. 조회 시점 카운트를 축적해 시점 간 델타만 실측으로 말한다.
//  콜드스타트: 과거 스냅샷 없으면 추이 미표시 (지어내지 않는다).

import type { SupabaseClient } from "@supabase/supabase-js";

export function areaKeyFor(cx: number, cy: number, radius: number): string {
  return `${cx.toFixed(3)},${cy.toFixed(3)},r${radius}`;
}

export function upjongSigFor(subIndustryId: string): string | null {
  const m = SBIZ_UPJONG_MAP[subIndustryId] ?? null;
  if (!m) return null;
  const parts = [
    ...(m.scls ?? []).map((c) => `scls:${c}`),
    ...(m.mcls ?? []).map((c) => `mcls:${c}`),
  ];
  return parts.sort().join("+");
}

/** 오늘 스냅샷 기록 — fire-and-forget (실패해도 추천 흐름에 영향 없음). 같은 날 중복은 무시. */
export async function recordAreaSnapshot(
  admin: SupabaseClient,
  p: { areaKey: string; upjongSig: string; sameCount: number; totalCount: number | null },
): Promise<void> {
  try {
    const today = new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);   // KST
    await admin.from("market_area_snapshots").upsert(
      {
        area_key: p.areaKey,
        upjong_sig: p.upjongSig,
        snapshot_date: today,
        same_count: p.sameCount,
        ...(p.totalCount != null ? { total_count: p.totalCount } : {}),
      },
      { onConflict: "area_key,upjong_sig,snapshot_date", ignoreDuplicates: true },   // 첫 관측 보존
    );
  } catch {
    /* best-effort */
  }
}

export type AreaTrend = {
  daysAgo: number;
  sameDelta: number;
  totalDelta: number | null;
};

/**
 * 60일+ 이전 가장 최근 스냅샷과의 델타. 없으면 null (추이 미표시).
 *  60일 미만 비교는 분기 갱신 주기(원천 DB)보다 짧아 노이즈 — 말하지 않는 게 정직.
 */
export async function findAreaTrend(
  admin: SupabaseClient,
  p: { areaKey: string; upjongSig: string; currentSame: number; currentTotal: number | null },
): Promise<AreaTrend | null> {
  try {
    const cutoff = new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10);
    const { data, error } = await admin
      .from("market_area_snapshots")
      .select("snapshot_date, same_count, total_count")
      .eq("area_key", p.areaKey)
      .eq("upjong_sig", p.upjongSig)
      .lte("snapshot_date", cutoff)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const past = data as { snapshot_date: string; same_count: number; total_count: number | null };
    const daysAgo = Math.round((Date.now() - new Date(past.snapshot_date).getTime()) / 86_400_000);
    return {
      daysAgo,
      sameDelta: p.currentSame - past.same_count,
      totalDelta: p.currentTotal != null && past.total_count != null ? p.currentTotal - past.total_count : null,
    };
  } catch {
    return null;
  }
}

// ─── 프랜차이즈 반경 실측 (2026-08-03 사장님 스펙) ─────────────────────────
//  "선택한 상권에 같은 프랜차이즈 존재 현황 + 비슷한 업종 프랜차이즈 현황 → 상권 점수 반영"
//  같은 브랜드 반경 존재 = 영업지역 보호로 가맹 자체가 불가할 수 있는 결정 신호.
//  소진공 업소 목록(국세청 원천)의 상호명 매칭 — 지도 노출이 아닌 사업자 실측.

function normalizeBizName(name: string): string {
  return name.replace(/[\s()\-·.]/g, "").toLowerCase();
}

export type FranchisePresence = {
  /** 같은 브랜드 반경 내 개수 */
  sameBrand: number;
  /** 동종 주요 프랜차이즈 브랜드별 개수 (발견된 것만, 개수 내림차순) */
  peers: Array<{ name: string; count: number }>;
  /** 표본 한계 — 반경 동종 업소가 300개 초과라 첫 300개만 스캔한 경우 true */
  sampled: boolean;
};

/**
 * 반경 내 프랜차이즈 존재 실측. 동종 업종 필터(매핑 SSOT) 안에서 상호명 매칭 —
 *  전체 업소를 긁지 않아 호출 ≤3페이지. 매핑 없는 업종은 null (실측 불가 정직).
 */
export async function franchisePresenceInRadius(
  subIndustryId: string,
  brandName: string,
  peerBrandNames: string[],
  cx: number,
  cy: number,
  radius: number,
  apiKey: string,
): Promise<FranchisePresence | null> {
  const mapping = SBIZ_UPJONG_MAP[subIndustryId] ?? null;
  if (!mapping) return null;
  const codes: Array<["indsSclsCd" | "indsMclsCd", string]> = [
    ...(mapping.scls ?? []).map((c): ["indsSclsCd", string] => ["indsSclsCd", c]),
    ...(mapping.mcls ?? []).map((c): ["indsMclsCd", string] => ["indsMclsCd", c]),
  ];

  const names: string[] = [];
  let sampled = false;
  try {
    for (const [k, code] of codes) {
      for (let page = 1; page <= 3; page++) {
        const url = `${BASE}/storeListInRadius?serviceKey=${encodeURIComponent(apiKey)}&type=json&numOfRows=100&pageNo=${page}&radius=${radius}&cx=${cx}&cy=${cy}&${k}=${code}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
        if (!res.ok) return null;                       // 오류 = 실측 불가 (부분 결과 위장 금지)
        const json = await res.json() as { header?: unknown; body?: { totalCount?: number; items?: Array<{ bizesNm?: string }> } };
        const items = json?.body?.items ?? [];
        for (const it of items) if (it?.bizesNm) names.push(it.bizesNm);
        const total = json?.body?.totalCount ?? 0;
        if (total > 300) sampled = true;
        if (items.length < 100 || page * 100 >= total) break;
      }
    }
  } catch {
    return null;
  }

  const normalized = names.map(normalizeBizName);
  const countBrand = (brand: string): number => {
    const key = normalizeBizName(brand);
    if (key.length < 2) return 0;
    return normalized.filter((n) => n.includes(key)).length;
  };

  const peers = peerBrandNames
    .filter((n) => normalizeBizName(n) !== normalizeBizName(brandName))
    .map((n) => ({ name: n, count: countBrand(n) }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { sameBrand: countBrand(brandName), peers, sampled };
}
