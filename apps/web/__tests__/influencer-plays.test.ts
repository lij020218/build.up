import { describe, it, expect } from "vitest";
import {
  INFLUENCER_PLAYS,
  INFLUENCER_NOT_FIT,
  INFLUENCER_FEE_RANGES,
  FEE_SOURCES_KO,
  STORE_STRENGTH_LABEL,
  COLLAB_TYPE_LABEL,
  playsForIndustry,
  fillDmTemplate,
  fillQuery,
  tierForFollowers,
  type StoreStrength,
} from "../../../packages/shared/src/marketing/influencer-plays";

/**
 * 인플루언서 협업 플레이 SSOT 가드 (2026-07-31).
 *
 *  🔴 이 파일의 존재 이유 = 실측에서 발견한 함정 2개를 영구 차단:
 *   1. 업종명 단독 검색("부산 미용실") → 경쟁 업장들이 나옴 (인플루언서 아님)
 *   2. 비용·효과 과장 — "효과 보장" 같은 단정이 DM 문안에 섞이는 것
 */

// 발굴 쿼리에 반드시 하나는 들어가야 하는 역할·콘텐츠 어휘.
//  이 목록에 없는 새 어휘를 쓰려면 여기 추가 — "업종명만"으로는 절대 통과 못 하게.
const ROLE_WORDS = [
  "크리에이터", "인플루언서", "리뷰", "계정", "유튜버", "블로거",
  "모델", "먹방", "맛집", "핫플", "브이로그", "하울", "언박싱",
  "투어", "체험", "공구", "공동구매", "홈카페", "바리스타", "오운완",
  "추천", "후기", "살림", "육아", "초등맘",
];

// 실측에서 경쟁업체 함정이 확인된 업종명 단독 토큰 — 쿼리가 이것"만"으로 끝나면 안 됨
const TRAP_BARE_TERMS = ["미용실", "헬스장", "카페", "식당", "학원", "펫샵", "네일샵"];

const SUPPORTED_GROUPS = [
  "food", "cafe-dessert", "beauty", "fitness", "pet",
  "retail", "ecommerce", "education", "space", "living-service",
];

describe("커버리지 — 모든 대상 업종군에 플레이가 있다", () => {
  it("지원 업종군 전부 플레이 ≥1 (외식·카페·뷰티는 ≥2)", () => {
    for (const g of SUPPORTED_GROUPS) {
      const plays = playsForIndustry(g);
      expect(plays.length, `${g} 에 플레이 없음`).toBeGreaterThanOrEqual(1);
    }
    for (const g of ["food", "cafe-dessert", "beauty"]) {
      expect(playsForIndustry(g).length, `${g} 는 핵심 업종 — 2개 이상`).toBeGreaterThanOrEqual(2);
    }
  });

  it("비대상 업종은 이유+대안을 명시한다 (숨기기 금지)", () => {
    for (const key of ["online-digital", "startup-tech"]) {
      const nf = INFLUENCER_NOT_FIT[key];
      expect(nf, `${key} 비대상 선언 없음`).toBeTruthy();
      expect(nf.reasonKo.length).toBeGreaterThan(10);
      expect(nf.insteadKo.length).toBeGreaterThan(10);
    }
  });

  it("플레이 업종군 어휘가 지원 목록 안에 있다 (오타 방지)", () => {
    for (const p of INFLUENCER_PLAYS) {
      for (const g of p.industryGroups) {
        expect(SUPPORTED_GROUPS, `${p.id} 의 미등록 업종군 "${g}"`).toContain(g);
      }
    }
  });
});

describe("🔴 경쟁업체 함정 가드 — 업종명 단독 쿼리 금지", () => {
  it("모든 인스타 쿼리에 역할·콘텐츠 어휘가 최소 1개", () => {
    for (const p of INFLUENCER_PLAYS) {
      for (const q of p.instagramQueries) {
        const hasRole = ROLE_WORDS.some((w) => q.includes(w));
        expect(hasRole, `[${p.id}] 쿼리 "${q}" 에 역할 어휘 없음 — 경쟁업체가 검색된다`).toBe(true);
      }
    }
  });

  it("쿼리가 함정 업종명 단독으로 끝나지 않는다", () => {
    for (const p of INFLUENCER_PLAYS) {
      for (const q of [...p.instagramQueries, ...p.youtubeQueries]) {
        const bare = fillQuery(q, "").trim();
        expect(TRAP_BARE_TERMS, `[${p.id}] "${q}" 는 업종명 단독 검색`).not.toContain(bare);
      }
    }
  });

  it("region 치환 — 지역 없으면 토큰만 깨끗이 제거", () => {
    expect(fillQuery("{region} 맛집 리뷰 크리에이터", "부산")).toBe("부산 맛집 리뷰 크리에이터");
    expect(fillQuery("{region} 맛집 리뷰 크리에이터", "")).toBe("맛집 리뷰 크리에이터");
  });
});

describe("DM 문안 가드 — 과장·단정 금지", () => {
  it("모든 문안에 {가게명} 자리표시자 + 존댓말", () => {
    for (const p of INFLUENCER_PLAYS) {
      expect(p.dmTemplateKo, `[${p.id}] {가게명} 없음`).toContain("{가게명}");
      expect(p.dmTemplateKo.includes("요") || p.dmTemplateKo.includes("니다"), `[${p.id}] 존댓말 아님`).toBe(true);
    }
  });

  it("🔴 효과 보장·수익 단정 어휘 금지", () => {
    const banned = /보장|확실히|무조건|반드시 (매출|효과)|대박/;
    for (const p of INFLUENCER_PLAYS) {
      expect(banned.test(p.dmTemplateKo), `[${p.id}] 문안에 단정 어휘`).toBe(false);
    }
  });

  it("치환이 실제로 동작한다", () => {
    const filled = fillDmTemplate("안녕하세요 {지역} {가게명}입니다", "봄봄카페", "성수동");
    expect(filled).toBe("안녕하세요 성수동 봄봄카페입니다");
    // 빈 값이어도 자리표시자가 새지 않는다
    expect(fillDmTemplate("{가게명} {지역}", "", "")).not.toContain("{");
  });
});

describe("비용 — 2축 범위 + 출처 (단일 숫자 단정 금지)", () => {
  it("모든 등급에 협찬형·원고료형 두 축이 있다", () => {
    expect(INFLUENCER_FEE_RANGES.length).toBeGreaterThanOrEqual(4);
    for (const r of INFLUENCER_FEE_RANGES) {
      expect(r.barterKo.length, `${r.tier} 협찬형 없음`).toBeGreaterThan(3);
      expect(r.feedFeeKo).toMatch(/~/);   // 범위 표기 강제 — "50만" 단독 금지
      expect(r.reelsFeeKo).toMatch(/~/);
    }
  });

  it("출처 문구에 출처와 협의 단서가 있다", () => {
    expect(FEE_SOURCES_KO).toContain("출처");
    expect(FEE_SOURCES_KO).toContain("협의에 따라");
  });

  it("팔로워 → 등급 매핑이 시세표 tier 와 일치", () => {
    const tiers = INFLUENCER_FEE_RANGES.map((r) => r.tier);
    expect(tiers).toContain(tierForFollowers(5_000));    // nano
    expect(tiers).toContain(tierForFollowers(30_000));   // micro
    expect(tiers).toContain(tierForFollowers(70_000));   // mid
    expect(tiers).toContain(tierForFollowers(300_000));  // macro
    expect(tierForFollowers(9_999)).toBe("nano");
    expect(tierForFollowers(10_000)).toBe("micro");
  });
});

describe("강점 정렬 — 사장님 시나리오 그대로", () => {
  it("가성비 강점 외식 → 가성비 크리에이터 플레이가 맨 앞", () => {
    const plays = playsForIndustry("food", "value");
    expect(plays[0].id).toBe("food-value-creator");
  });

  it("비주얼 강점 카페 → 비주얼 초대가 맨 앞", () => {
    const plays = playsForIndustry("cafe-dessert", "visual");
    expect(plays[0].id).toBe("cafe-visual-invite");
  });

  it("강점 정렬은 제외가 아니다 — 목록 크기 동일", () => {
    expect(playsForIndustry("food", "value").length).toBe(playsForIndustry("food").length);
  });

  it("강점 라벨·협업 방식 라벨 전수 존재", () => {
    for (const k of Object.keys(STORE_STRENGTH_LABEL) as StoreStrength[]) {
      expect(STORE_STRENGTH_LABEL[k].ko.length).toBeGreaterThan(1);
    }
    for (const p of INFLUENCER_PLAYS) {
      expect(COLLAB_TYPE_LABEL[p.collabType], `[${p.id}] 협업 방식 라벨 없음`).toBeTruthy();
    }
  });

  it("뷰티 시술 모델 플레이 — 사장님이 말한 그 관행이 1순위로 존재", () => {
    const beauty = playsForIndustry("beauty");
    const model = beauty.find((p) => p.id === "beauty-model-play");
    expect(model).toBeTruthy();
    expect(model!.collabType).toBe("barter");           // 무료 시술이 대가
    expect(model!.practiceKo).toContain("관행");         // 근거 명시
    expect(model!.instagramQueries.join(" ")).toContain("머리모델");  // 지원자 풀 검색
  });
});
