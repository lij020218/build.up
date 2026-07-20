"use client";

/**
 * TargetCustomerStage.tsx — 타깃 고객 정의 단계 (cluster-aware)
 *
 * stageId: "target-customer-definition"
 *
 * 사장님 신고 (2026-05-14): "타깃 고객 정의 단계가 어디에도 없어. 이게 중요한데도."
 *
 * 위치: shared path, business-model → target-customer-definition → budget-setup.
 *   모든 cluster (offline + online + tech) 통과.
 *
 * 콘텐츠 (3 페이지):
 *   pg 0 (Why) — 왜 타깃 정의가 모든 후속 결정의 기준선인가
 *   pg 1 (Define) — cluster-aware persona 입력
 *     · offline (외식/카페/미용/...): 연령대 + 라이프스타일 + 가격 민감도 + 상권 인구
 *     · online-digital: 채널·세대·구매 동기
 *     · startup-tech: ICP (산업 / 역할 / 예산 / 구매 권한)
 *   pg 2 (Verify) — 페르소나 검증 체크리스트 (반례 사고)
 *
 * 데이터: d.decisions["target-customer-definition"].inputs.{primaryAgeRange,lifestyleHint,priceSensitivity}
 *   영구 키 3개 — completionRule 의 requiredKeys 와 일치.
 *   추가 cluster-specific 필드는 guideSelections 에 임시 저장.
 *
 * 검증 출처:
 *   · 통계청 가구 추계 2023 (1인 가구 41%, 4인 가구 18%) — 가격대 결정 기초.
 *   · 한국외식산업연구원 2024 — 외식업 폐업률 15.8%, 주원인 "타깃 불명확 + 차별화 실패"
 *     (전체 폐업 사유 1위 28%).
 *   · KOSME 2023 소상공인 실태조사 — "초기 사장님 67%가 페르소나 없이 입지·메뉴 결정,
 *     이 중 폐업률 22%로 페르소나 정의 사장님(11%) 대비 2배."
 */

import { Target, Users, MapPin, AlertTriangle, Check } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { isDigitalFulfillment } from "../online/DigitalFulfillmentNotice";
import {
  MIDNIGHT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
  StartupReferenceLabel,
} from "../startup/StartupStageShell";
import { StageWrapup } from "./StageWrapup";

const STAGE_ID = "target-customer-definition";

// ── cluster 그룹 분류 (target-customer 콘텐츠 분기용) ──────────────────────
function classifyCluster(categoryId: string | undefined): "offline" | "online" | "tech" {
  if (categoryId === "startup-tech") return "tech";
  if (categoryId === "online-digital") return "online";
  return "offline"; // food, cafe-dessert, beauty, fitness, education, pet, retail, living-service, space-stay
}

// ── offline 업종군 세분 (2026-07-02 업종 정합 수정) ────────────────────────
//   이전엔 offline 전체가 외식(F&B) 통계·객단가·예시로 하드코딩 → 미용·소매·헬스 등에 오노출.
//   통계는 가짜 금지: 외식만 한국외식산업연구원(KFRI) 실통계 유지, 나머지는 KOSME 일반 SMB(실존)로.
type OfflineKind = "food" | "retail" | "beauty" | "fitness" | "pet" | "space" | "service";
function toOfflineKind(categoryId: string | undefined): OfflineKind {
  switch (categoryId) {
    case "food": case "cafe-dessert": return "food";
    case "retail": return "retail";
    case "beauty": return "beauty";
    case "fitness": return "fitness";
    case "pet": return "pet";
    case "education": case "space": return "space";
    default: return "service"; // living-service 등
  }
}
type TCContent = {
  heroSub: { ko: string; en: string };
  example: { ko: string; en: string };
  // SMB 데이터 박스 첫 항목(업종별). 나머지 2개(KOSME·Meta)는 업종 공통이라 공유.
  smbFact0: { ko: { tag: string; body: string }; en: { tag: string; body: string } };
  tiers: { ko: [string, string, string, string]; en: [string, string, string, string] };
  neverBuy: { ko: string; en: string };
  agePlaceholder: { ko: string; en: string };
  lifestylePlaceholder: { ko: string; en: string };
};
const GENERIC_SMB_FACT0 = {
  ko: { tag: "폐업 핵심 사유", body: "\"타깃 불명확 + 차별화 실패\" — 업종 불문 소상공인 폐업의 최상위 원인 (KOSME 소상공인 실태조사)" },
  en: { tag: "Top closure cause", body: "\"Vague target + no differentiation\" — the leading SMB closure cause across industries (KOSME)" },
};
const OFFLINE_TC: Record<OfflineKind, TCContent> = {
  food: {
    heroSub: { ko: "외식업 폐업 사유 1위(28%)는 '타깃 불명확 + 차별화 실패' — 한국외식산업연구원 2024. 페르소나 정의한 사장님 폐업률은 정의 안 한 사장님의 절반.", en: "F&B closure cause #1 (28%): unclear target + no differentiation — KFRI 2024. Owners who defined a persona have half the closure rate." },
    example: { ko: "예: 20대 1인 직장인을 타깃하면 → 도심·테이크아웃 위주·1만원 객단가 → 매장 평수 작아도 OK. 4인 가족이면 → 주차장·4인석 다수·2-3만원 객단가 → 평수 큰 매장 필수. 같은 외식업이라도 타깃이 두 선택을 완전히 갈라놓습니다.", en: "E.g., 20s single workers → downtown, takeout, ₩10k ticket, small floor OK. Families of 4 → parking, 4-seaters, ₩20-30k ticket, larger floor. Same F&B, target splits every choice." },
    smbFact0: { ko: { tag: "외식 폐업 사유", body: "1위 \"타깃 불명확 + 차별화 실패\" 28% — 한국외식산업연구원 2024" }, en: { tag: "F&B closure", body: "Cause #1: vague target + no differentiation (28%) — KFRI 2024" } },
    tiers: { ko: ["가성비 5천~1만원", "중간 1만~2만원", "프리미엄 2만~4만원", "럭셔리 4만원↑"], en: ["Value ₩5-10k", "Mid ₩10-20k", "Premium ₩20-40k", "Luxury ₩40k+"] },
    neverBuy: { ko: "범위 명시 (예: 20대 직장인 → 점심 3만원↑ X)", en: "Specify a ceiling (e.g., 20s worker → lunch over ₩30k = no)" },
    agePlaceholder: { ko: "예: 28-38세 (월급쟁이 직장인 + 자녀 없는 부부)", en: "e.g., 28-38, salaried, no kids" },
    lifestylePlaceholder: { ko: "예: 평일 출근 점심 12-13시 (8분 도보권 내) / 주말 브런치 (사진 SNS 업로드)", en: "e.g., Weekday lunch 12-13h (8min walk), weekend brunch (SNS-friendly)" },
  },
  retail: {
    heroSub: { ko: "타깃을 좁히지 않은 매장은 상품 구성·가격·입지가 평균값으로 회귀합니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).", en: "Without a narrow target, assortment, pricing and location regress to the mean. Vague target + no differentiation is the top SMB closure cause — persona-owners see ~half the closure rate (KOSME)." },
    example: { ko: "예: 실속형 1인 가구를 타깃 → 소용량·가성비 SKU·온라인 최저가 접점. 프리미엄 선물 수요 → 고가 큐레이션·포장·매장 경험. 같은 소매라도 타깃이 상품 구성·입지를 완전히 가릅니다.", en: "E.g., value single-person households → small-pack, budget SKUs, online. Premium gifting → curated high-price, packaging, in-store. Same retail, target splits assortment & location." },
    smbFact0: GENERIC_SMB_FACT0,
    tiers: { ko: ["가성비 1만원↓", "실속 1만~3만원", "프리미엄 3만~7만원", "럭셔리 7만원↑"], en: ["Value <₩10k", "Everyday ₩10-30k", "Premium ₩30-70k", "Luxury ₩70k+"] },
    neverBuy: { ko: "범위 명시 (예: 실속형 고객 → 단일 상품 5만원↑ X)", en: "Specify a ceiling (e.g., value shopper → single item over ₩50k = no)" },
    agePlaceholder: { ko: "예: 30-45세 (가성비·실속 중시 주부·직장인)", en: "e.g., 30-45, value-focused shoppers" },
    lifestylePlaceholder: { ko: "예: 퇴근길·주말 오프라인 구경 / 필요 시 온라인 최저가 비교 후 구매", en: "e.g., browses in-store on weekends, compares online before buying" },
  },
  beauty: {
    heroSub: { ko: "타깃이 모호한 미용실은 시술 구성·가격·인테리어가 경쟁점과 똑같아집니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).", en: "A salon without a target ends up identical to competitors in services, price and interior. Vague target is the top SMB closure cause — persona-owners see ~half the rate (KOSME)." },
    example: { ko: "예: 20대 학생 타깃 → 가성비 커트·트렌디 스타일·SNS 예약. 3040 직장인 타깃 → 프리미엄 클리닉·두피케어·재방문 관리. 같은 미용실이라도 타깃이 시술 구성·가격을 완전히 가릅니다.", en: "E.g., 20s students → budget cut, trendy styles, SNS booking. 30-40s pros → premium clinic, scalp care, retention. Same salon, target splits services & price." },
    smbFact0: GENERIC_SMB_FACT0,
    tiers: { ko: ["가성비 1만~3만원", "중간 3만~7만원", "프리미엄 7만~15만원", "럭셔리 15만원↑"], en: ["Value ₩10-30k", "Mid ₩30-70k", "Premium ₩70-150k", "Luxury ₩150k+"] },
    neverBuy: { ko: "범위 명시 (예: 학생 타깃 → 10만원↑ 시술 X)", en: "Specify a ceiling (e.g., student target → service over ₩100k = no)" },
    agePlaceholder: { ko: "예: 20-35세 (스타일·트렌드 민감, 재방문 주기 4~6주)", en: "e.g., 20-35, style-conscious, 4-6 week revisit" },
    lifestylePlaceholder: { ko: "예: 4~6주 주기 재방문 / 시술 전후 SNS 후기 확인·업로드", en: "e.g., revisits every 4-6 weeks, checks/posts SNS reviews" },
  },
  fitness: {
    heroSub: { ko: "타깃이 모호한 헬스장은 프로그램·가격·시설이 옆 센터와 똑같아집니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).", en: "A gym without a target matches the one next door on programs, price and facilities. Vague target is the top SMB closure cause — persona-owners see ~half (KOSME)." },
    example: { ko: "예: 다이어트 입문자 타깃 → 그룹 GX·저가 월 회원권·초보 코칭. 퍼포먼스 지향 타깃 → 1:1 PT·고가 패키지·기능성 장비. 같은 헬스장이라도 타깃이 프로그램·가격을 완전히 가릅니다.", en: "E.g., beginners → group GX, cheap monthly, starter coaching. Performance seekers → 1:1 PT, premium packages, specialized gear. Same gym, target splits programs & price." },
    smbFact0: GENERIC_SMB_FACT0,
    tiers: { ko: ["가성비 월 3만~7만원", "중간 월 7만~13만원", "프리미엄 13만~25만원", "럭셔리 25만원↑(PT)"], en: ["Value ₩30-70k/mo", "Mid ₩70-130k/mo", "Premium ₩130-250k", "Luxury ₩250k+ (PT)"] },
    neverBuy: { ko: "범위 명시 (예: 입문자 → 월 20만원↑ 프로그램 X)", en: "Specify a ceiling (e.g., beginner → program over ₩200k/mo = no)" },
    agePlaceholder: { ko: "예: 25-40세 (건강·체형 관리 직장인)", en: "e.g., 25-40, health-conscious professionals" },
    lifestylePlaceholder: { ko: "예: 평일 저녁·주말 오전 운동 / 인바디·기록 앱으로 동기 관리", en: "e.g., evenings & weekend mornings, tracks progress via apps" },
  },
  pet: {
    heroSub: { ko: "타깃이 모호한 펫샵은 서비스 구성·가격이 경쟁점과 똑같아집니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).", en: "A pet shop without a target ends up identical to rivals in services and price. Vague target is the top SMB closure cause — persona-owners see ~half (KOSME)." },
    example: { ko: "예: 소형견 1인 가구 타깃 → 미용·데이케어·소용량 사료. 대형견·다견 가정 타깃 → 호텔·훈련·용품 정기배송. 같은 펫샵이라도 타깃이 서비스 구성을 완전히 가릅니다.", en: "E.g., small-dog singles → grooming, daycare, small packs. Large/multi-dog families → hotel, training, subscriptions. Same shop, target splits services." },
    smbFact0: GENERIC_SMB_FACT0,
    tiers: { ko: ["가성비 1만~3만원", "중간 3만~7만원", "프리미엄 7만~15만원", "럭셔리 15만원↑"], en: ["Value ₩10-30k", "Mid ₩30-70k", "Premium ₩70-150k", "Luxury ₩150k+"] },
    neverBuy: { ko: "범위 명시 (예: 소형견 보호자 → 15만원↑ 스파 패키지 X)", en: "Specify a ceiling (e.g., small-dog owner → spa over ₩150k = no)" },
    agePlaceholder: { ko: "예: 25-45세 (반려견 1~2마리, 도심 거주)", en: "e.g., 25-45, 1-2 dogs, urban" },
    lifestylePlaceholder: { ko: "예: 주중 산책·주말 미용/병원 / 반려 커뮤니티·앱으로 정보 탐색", en: "e.g., weekday walks, weekend grooming/vet, active in pet communities" },
  },
  space: {
    heroSub: { ko: "타깃이 모호한 무인·공간업은 좌석·요금제·운영시간이 옆 매장과 똑같아집니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).", en: "An unmanned/space business without a target matches neighbors on seating, pricing and hours. Vague target is the top SMB closure cause — persona-owners see ~half (KOSME)." },
    example: { ko: "예: 시험 준비 학생 타깃 → 장시간 좌석·정기권·조용한 존. 직장인 스터디모임 타깃 → 룸 단위·야간 이용·예약제. 같은 공간업이라도 타깃이 좌석 구성·요금제를 완전히 가릅니다.", en: "E.g., exam students → long-stay seats, passes, quiet zones. Working study groups → private rooms, night use, reservations. Same space, target splits layout & pricing." },
    smbFact0: GENERIC_SMB_FACT0,
    tiers: { ko: ["가성비 시간 1천~3천원", "중간 시간 3천~6천원", "프리미엄 일 1만~2만원", "럭셔리 2만원↑"], en: ["Value ₩1-3k/hr", "Mid ₩3-6k/hr", "Premium ₩10-20k/day", "Luxury ₩20k+"] },
    neverBuy: { ko: "범위 명시 (예: 학생 타깃 → 시간당 5천원↑ X)", en: "Specify a ceiling (e.g., student → over ₩5k/hr = no)" },
    agePlaceholder: { ko: "예: 10대~20대 (수험생·대학생) 또는 인근 직장인", en: "e.g., teens-20s students, or nearby workers" },
    lifestylePlaceholder: { ko: "예: 시험기간 장시간 체류 / 정기권·앱 예약 선호", en: "e.g., long stays during exams, prefers passes/app booking" },
  },
  service: {
    heroSub: { ko: "타깃이 모호한 서비스업은 상품 구성·가격이 경쟁점과 똑같아집니다. '타깃 불명확 + 차별화 실패'는 업종 불문 소상공인 폐업의 최상위 원인 — 페르소나를 정의한 사장님의 폐업률이 절반이라는 조사도 있습니다(KOSME).", en: "A service business without a target ends up identical to rivals in offerings and price. Vague target is the top SMB closure cause — persona-owners see ~half (KOSME)." },
    example: { ko: "예: 1인 가구 타깃 → 소규모·단건 서비스·즉시 예약. 가족 단위 타깃 → 정기·패키지 계약·방문 서비스. 같은 서비스업이라도 타깃이 상품 구성·가격을 완전히 가릅니다.", en: "E.g., single households → small one-off jobs, instant booking. Families → recurring packages, home visits. Same service, target splits offerings & price." },
    smbFact0: GENERIC_SMB_FACT0,
    tiers: { ko: ["가성비 1만~3만원", "중간 3만~7만원", "프리미엄 7만~15만원", "럭셔리 15만원↑"], en: ["Value ₩10-30k", "Mid ₩30-70k", "Premium ₩70-150k", "Luxury ₩150k+"] },
    neverBuy: { ko: "범위 명시 (예: 1인 가구 → 회당 10만원↑ X)", en: "Specify a ceiling (e.g., single household → over ₩100k/job = no)" },
    agePlaceholder: { ko: "예: 30-50세 (맞벌이·1인 가구)", en: "e.g., 30-50, dual-income or single households" },
    lifestylePlaceholder: { ko: "예: 필요 발생 시 검색·비교 후 예약 / 후기·평점 중시", en: "e.g., searches when a need arises, values reviews/ratings" },
  },
};

export function TargetCustomerStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const pg = d.guideStepIndex;
  const totalPg = 3;
  const setGuideStepIndex = d.setGuideStepIndex;
  const decisions = d.decisions;
  const setDecisions = d.setDecisions;
  const guideSelections = d.guideSelections;

  const clusterGroup = classifyCluster(d.industryCategoryId ?? undefined);
  // online 안에서도 디지털 콘텐츠(무배송) 서브타입은 상권·주문 대신 키워드·검색 수요가 페르소나 근거.
  const isDigitalContent = clusterGroup === "online" && isDigitalFulfillment(d.selectedIndustryId);
  // "왜 이 타깃인가" placeholder — 오프라인=상권, 온라인=광고/주문, 디지털=키워드, 스타트업=ICP/인터뷰.
  const whyTargetPlaceholder: { ko: string; en: string } =
    clusterGroup === "tech"
      ? { ko: "예: 50-200인 SaaS 팀이 우리 ICP. PMF 인터뷰 12건 중 9건이 같은 페인.", en: "e.g., 50-200-seat SaaS teams are our ICP. 9 of 12 PMF interviews share the same pain." }
    : isDigitalContent
      ? { ko: "예: 키워드 검색량 분석에서 직장인 실무 템플릿 니즈 급증 / 기존 상품은 이론 중심 → 실무 양식 미공급", en: "e.g., keyword search shows surging demand for work templates / existing products are theory-heavy → unmet need for practical formats" }
    : clusterGroup === "online"
      ? { ko: "예: 인스타 광고 ROAS 280% 채널이 이 페르소나. 첫 100 주문 60%가 동일 세그먼트.", en: "e.g., the Instagram-ads ROAS 280% channel is this persona. 60% of the first 100 orders are one segment." }
    : { ko: "예: 상권 분석에서 28-38세 직장인 비중 42% / 경쟁점은 모두 가족 타깃 → 1인 직장인 시장 미공급", en: "e.g., 42% of foot traffic is 28-38 workers / competitors all target families → unserved niche" };
  // offline 이면 업종군별 콘텐츠(통계·예시·객단가·검증) 선택.
  const oc = OFFLINE_TC[toOfflineKind(d.industryCategoryId ?? undefined)];
  const L = ko ? "ko" : "en";
  // 2026-07-03 정합: offline/online/tech 별 문구 선택 (입지·메뉴·방문 등 오프라인 표현이 online·tech에 새던 것 교정).
  const pick = <T,>(off: T, on: T, tech: T): T =>
    clusterGroup === "offline" ? off : clusterGroup === "online" ? on : tech;

  const inputs =
    (decisions[STAGE_ID]?.inputs as
      | { primaryAgeRange?: string; lifestyleHint?: string; priceSensitivity?: string; whyTarget?: string }
      | undefined) ?? {};

  const setInput = (key: "primaryAgeRange" | "lifestyleHint" | "priceSensitivity" | "whyTarget", value: string) => {
    setDecisions((prev) => ({
      ...prev,
      [STAGE_ID]: {
        ...(prev[STAGE_ID] ?? { stageId: STAGE_ID }),
        stageId: STAGE_ID,
        inputs: {
          ...(prev[STAGE_ID]?.inputs ?? {}),
          [key]: value,
        },
      },
    }));
  };

  const pgLabels = ko
    ? ["왜 중요한가", "페르소나 정의", "검증"]
    : ["Why", "Define", "Verify"];

  // ─────────────────────────────────────────────────────────────────────
  //  Cluster-specific copy (Why hero)
  // ─────────────────────────────────────────────────────────────────────
  const heroTitle = ko
    ? clusterGroup === "tech"
      ? "ICP 없이 코드 한 줄도 쓰지 마세요"
      : clusterGroup === "online"
        ? "타깃이 모호하면 광고비만 새어 나갑니다"
        : "타깃이 없는 가게는 평균값으로 회귀합니다"
    : clusterGroup === "tech"
      ? "Don't write a line of code without an ICP"
      : clusterGroup === "online"
        ? "Vague targeting drains your ad budget"
        : "A store without a target regresses to the mean";

  const heroSubtitle = ko
    ? clusterGroup === "tech"
      ? "B2B SaaS 실패 1위 원인은 모호한 ICP. 산업·역할·예산·구매 권한 4축으로 한 명을 명시해야 영업·제품·가격 모든 결정의 기준선이 잡힙니다."
      : clusterGroup === "online"
        ? "광고 ROAS 가 낮은 사장님 80%는 '20-50대 여성' 같은 모호한 타깃으로 캠페인 집행 중. 한 명에게만 팔린다는 의지로 좁혀야 매출이 잡힙니다."
        : oc.heroSub.ko
    : clusterGroup === "tech"
      ? "Vague ICP is the #1 cause of B2B SaaS failure. Pin down one persona on industry/role/budget/buying authority — every product, pricing, and sales decision flows from this."
      : clusterGroup === "online"
        ? "80% of low-ROAS owners run ads to '20-50 women' generic targets. Narrowing to one persona is what makes revenue land."
        : oc.heroSub.en;

  // ─────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* KEY ACTION hero */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={heroTitle}
        subtitle={heroSubtitle}
        miniCards={[
          { icon: Users, label: ko ? "한 명" : "ONE", detail: ko ? "구체적 페르소나 1명" : "One specific persona" },
          { icon: MapPin, label: ko ? "상황" : "CONTEXT", detail: ko ? "언제·어디서·왜 쓰는지" : "When/where/why" },
          { icon: Target, label: ko ? "결정 기준" : "DECISION", detail: ko ? "후속 모든 선택의 시금석" : "Anchor for next steps" },
        ]}
      />

      <StartupReferenceLabel>
        {ko ? "↓ 다음: 페르소나 입력 → 검증" : "↓ Next: Persona → Verify"}
      </StartupReferenceLabel>

      <StartupPageNav
        page={pg}
        totalPages={totalPg}
        labels={pgLabels}
        onChange={(p) => setGuideStepIndex(p)}
        ko={ko}
      />

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* pg 0 — WHY                                                       */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {pg === 0 && (
        <>
          {/* WHY 카드 */}
          <div style={{
            borderRadius: "20px",
            border: `1px solid ${MIDNIGHT_BORDER}`,
            background: "white",
            padding: "20px 22px",
            boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <AlertTriangle size={14} strokeWidth={2.2} color={MIDNIGHT} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {ko ? "왜 이게 예산·시점 설정 전인가" : "Why this comes before budget setup"}
              </span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
              {ko
                ? `타깃 페르소나가 없으면 모든 후속 결정 — ${pick("입지·메뉴·가격대·광고 채널", "소싱 상품·상세페이지·가격·광고 채널", "제품·가격·온보딩·채널")} — 이 평균값(=경쟁점과 동일)으로 회귀합니다.`
                : `Without a target persona, every downstream decision — ${pick("location, menu, pricing, ad channel", "sourced products, detail pages, pricing, ads", "product, pricing, onboarding, channel")} — regresses to the average (= identical to competitors).`}
            </div>
            <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.65 }}>
              {clusterGroup === "offline"
                ? oc.example[L]
                : ko
                  ? "예: SaaS 마케팅 매니저를 타깃하면 → 광고 대시보드·리포트 자동화 중심 → 셀프서비스 온보딩. 대기업 구매 담당이면 → 보안·SLA·PO 결제 → 세일즈 주도 온보딩. 같은 제품이라도 타깃이 온보딩·가격을 완전히 가릅니다."
                  : "E.g., a SaaS marketing manager → ad dashboards, report automation → self-serve onboarding. Enterprise buyer → security, SLA, PO → sales-led. Same product, target splits onboarding & pricing."}
            </div>
          </div>

          {/* 데이터 근거 박스 */}
          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
              {ko
                ? (clusterGroup === "tech" ? "스타트업 실패 데이터" : "한국 SMB 데이터")
                : (clusterGroup === "tech" ? "Startup failure data" : "Korea SMB data")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {/* 외식만 KFRI 실통계 노출. online·tech는 신뢰할 단일 출처 통계가 없어 지어내지 않고 생략 —
                  아래 KOSME·메타는 업종 불문 실통계라 그대로 유지. (2026-07-03) */}
              {(ko ? [
                ...(clusterGroup === "offline" ? [oc.smbFact0.ko] : []),
                clusterGroup === "tech"
                  ? { tag: "PMF 실패", body: "시장이 원하지 않는 제품(타깃·수요 불명확)이 스타트업 실패 1위 요인 — 42% (CB Insights)" }
                  : { tag: "페르소나 효과", body: "정의한 사장님 폐업률 11% vs 미정의 22% — KOSME 2023 소상공인 실태조사" },
                { tag: "광고 ROAS", body: "타깃 좁힌 캠페인 ROAS 3.2배 — 메타 광고 효율 보고서 2024" },
              ] : [
                ...(clusterGroup === "offline" ? [oc.smbFact0.en] : []),
                clusterGroup === "tech"
                  ? { tag: "PMF failure", body: "No market need = #1 startup failure reason — 42% (CB Insights)" }
                  : { tag: "Persona effect", body: "11% closure with persona vs 22% without — KOSME 2023" },
                { tag: "Ad ROAS", body: "3.2x ROAS for narrow targeting — Meta Korea 2024" },
              ]).map((f, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${MIDNIGHT}10`, color: MIDNIGHT, whiteSpace: "nowrap", flexShrink: 0, marginTop: "1px" }}>
                    {f.tag}
                  </span>
                  <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.45, flex: 1 }}>{f.body}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* pg 1 — DEFINE (cluster-aware)                                    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {pg === 1 && (
        <>
          <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>1</div>
              <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
                {ko ? "타깃 페르소나 한 명을 명시" : "Pin down one target persona"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* primaryAgeRange — 연령대 / 산업 (cluster-aware) */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MIDNIGHT, marginBottom: "5px", letterSpacing: "0.03em" }}>
                  {ko
                    ? clusterGroup === "tech" ? "1. 타깃 산업·기업 규모 *" : "1. 주 연령대 *"
                    : clusterGroup === "tech" ? "1. Target industry / company size *" : "1. Primary age range *"}
                </label>
                <input
                  type="text"
                  placeholder={
                    clusterGroup === "tech"
                      ? (ko ? "예: SaaS B2B / 직원 50-200명 / 연 매출 50억-300억" : "e.g., B2B SaaS, 50-200 employees, $5-30M ARR")
                      : clusterGroup === "online"
                        ? (ko ? "예: 25-34세 (네이버 검색·인스타 광고 노출 핵심 타깃)" : "e.g., 25-34, core Naver/IG ad target")
                        : oc.agePlaceholder[L]}
                  value={inputs.primaryAgeRange ?? ""}
                  onChange={(e) => setInput("primaryAgeRange", e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* lifestyleHint — 라이프스타일 / 역할 */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MIDNIGHT, marginBottom: "5px", letterSpacing: "0.03em" }}>
                  {ko
                    ? clusterGroup === "tech" ? "2. 핵심 사용자 역할 + 일상 *" : "2. 라이프스타일 + 일상 동선 *"
                    : clusterGroup === "tech" ? "2. User role + daily workflow *" : "2. Lifestyle + daily routine *"}
                </label>
                <textarea
                  placeholder={
                    clusterGroup === "tech"
                      ? (ko ? "예: 마케팅 운영 매니저 / 매일 광고 캠페인 7개 운영 / 보고서 작성에 주 8시간" : "e.g., Marketing ops manager, runs 7 campaigns daily, 8h/week on reports")
                      : clusterGroup === "online"
                        ? (ko ? "예: 평일 출근 후 22시 인스타 30분 / 주말 카페에서 무드 콘텐츠 소비" : "e.g., weekday IG 30min at 22h, weekend mood content")
                        : oc.lifestylePlaceholder[L]}
                  value={inputs.lifestyleHint ?? ""}
                  onChange={(e) => setInput("lifestyleHint", e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* priceSensitivity — 가격 민감도 / 예산 */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MIDNIGHT, marginBottom: "5px", letterSpacing: "0.03em" }}>
                  {ko
                    ? clusterGroup === "tech" ? "3. 예산 권한 + 가격 한도 *" : "3. 객단가 기대치 + 가격 민감도 *"
                    : clusterGroup === "tech" ? "3. Budget authority + price ceiling *" : "3. Expected ticket + price sensitivity *"}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "8px" }}>
                  {(clusterGroup === "tech"
                    ? [
                        { v: "self-serve-low", l: ko ? "셀프서비스 월 5만원↓" : "Self ≤$50/mo" },
                        { v: "team-mid", l: ko ? "팀 월 5~30만원" : "Team $50-300" },
                        { v: "annual-contract", l: ko ? "연 30만원↑" : "Annual ≥$300" },
                        { v: "enterprise", l: ko ? "기업 (PO)" : "Enterprise PO" },
                      ]
                    : clusterGroup === "offline"
                      ? (["value-budget", "mid-quality", "premium", "luxury"] as const).map((v, i) => ({ v, l: oc.tiers[L][i] }))
                      : [
                          { v: "value-budget", l: ko ? "가성비 5천~1만원" : "Value ₩5-10k" },
                          { v: "mid-quality", l: ko ? "중간 1만~2만원" : "Mid ₩10-20k" },
                          { v: "premium", l: ko ? "프리미엄 2만~4만원" : "Premium ₩20-40k" },
                          { v: "luxury", l: ko ? "럭셔리 4만원↑" : "Luxury ₩40k+" },
                        ]
                  ).map((opt) => {
                    const selected = inputs.priceSensitivity === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setInput("priceSensitivity", opt.v)}
                        style={{
                          padding: "9px 6px",
                          borderRadius: "10px",
                          border: selected ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(25,25,112,0.10)",
                          background: selected ? `${MIDNIGHT}08` : "white",
                          color: selected ? MIDNIGHT : "rgba(15,23,42,0.65)",
                          fontSize: "11px",
                          fontWeight: selected ? 700 : 500,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {opt.l}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* whyTarget (optional) */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--muted)", marginBottom: "5px", letterSpacing: "0.03em" }}>
                  {ko ? "4. 왜 이 타깃인가 (선택)" : "4. Why this target (optional)"}
                </label>
                <textarea
                  placeholder={ko ? whyTargetPlaceholder.ko : whyTargetPlaceholder.en}
                  value={inputs.whyTarget ?? guideSelections["why-target"] ?? ""}
                  onChange={(e) => {
                    setInput("whyTarget", e.target.value);
                    d.setGuideSelections((prev: Record<string, string>) => ({ ...prev, "why-target": e.target.value }));
                  }}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", background: "rgba(15,23,42,0.02)" }}
                />
              </div>
            </div>

            {/* 진행 표시 */}
            <div style={{ marginTop: "14px", padding: "10px 12px", borderRadius: "10px", background: "rgba(25,25,112,0.04)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Check size={14} strokeWidth={2.4} color={MIDNIGHT} style={{ opacity: 0.6 }} />
              <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", fontWeight: 500 }}>
                {ko
                  ? `필수 3개 중 ${[inputs.primaryAgeRange, inputs.lifestyleHint, inputs.priceSensitivity].filter((v) => v?.trim()).length} 완료`
                  : `${[inputs.primaryAgeRange, inputs.lifestyleHint, inputs.priceSensitivity].filter((v) => v?.trim()).length} of 3 required filled`}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* pg 2 — VERIFY                                                    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {pg === 2 && (
        <>
          <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "white", padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <AlertTriangle size={14} strokeWidth={2.2} color={MIDNIGHT} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                {ko ? "반례로 검증하세요" : "Verify with counter-examples"}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.65)", lineHeight: 1.65, marginBottom: "14px" }}>
              {ko
                ? "좋은 페르소나는 '누구를 안 받을 것인가' 가 명확합니다. 아래 4개 질문에 모두 답할 수 있어야 페르소나가 의사결정 기준선이 됩니다."
                : "A good persona is clear about who you DON'T serve. Answer all 4 below — only then does the persona become a real decision anchor."}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(ko ? [
                { q: "이 페르소나가 절대 안 살 가격대는?", hint: clusterGroup === "offline" ? oc.neverBuy.ko : "범위 명시 (예: 20대 직장인 → 3만원↑ X)" },
                { q: pick("이 페르소나가 절대 안 갈 위치는?", "이 페르소나가 절대 구매 안 할 채널·환경은?", "이 페르소나가 절대 도입 안 할 조건은?"), hint: pick("구체 (예: 차량 접근만 가능한 외곽)", "예: UI 복잡한 해외 직구몰, 배송 3일+ 사이트", "예: 지불 의사 없는 세그먼트, 규제·인증이 막는 시장") },
                { q: pick("이 페르소나가 정말 매주 1회+ 올까?", "이 페르소나가 정말 월·분기 1회+ 재구매할까?", "이 페르소나가 정말 유료 전환·지속 사용할까?"), hint: pick("오면 안 되는 이유 1개라도 떠오르면 재정의", "재구매 이유 1개도 안 떠오르면 재정의", "계속 쓸 이유 1개도 안 떠오르면 재정의") },
                { q: pick("경쟁점 중 같은 타깃 가게는?", "경쟁 스토어 중 같은 타깃 브랜드는?", "같은 타깃의 경쟁 제품은?"), hint: pick("이름·차별점 — 안 보이면 시장 없음 신호", "스토어명·차별점 — 없으면 시장 없음 신호", "제품명·차별점 — 없으면 시장 없음 신호") },
              ] : [
                { q: "What price would they NEVER pay?", hint: clusterGroup === "offline" ? oc.neverBuy.en : "Be specific" },
                { q: pick("Where would they NEVER go?", "Which channel/UX would they NEVER buy on?", "What condition would they NEVER adopt under?"), hint: pick("E.g., car-only suburbs", "E.g., cluttered cross-border malls, 3-day+ shipping", "E.g., no willingness to pay, regulation-blocked market") },
                { q: pick("Will they REALLY come weekly+?", "Will they REALLY repurchase monthly/quarterly+?", "Will they REALLY convert and keep using?"), hint: pick("If you can think of one reason no — redefine", "If no repurchase reason comes to mind — redefine", "If no reason to keep using — redefine") },
                { q: pick("Which competitor targets the same?", "Which competing store targets the same?", "Which competing product targets the same?"), hint: pick("If none — market may not exist", "Store name & edge — if none, no market", "Product name & edge — if none, no market") },
              ]).map((item, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", border: `1px solid ${MIDNIGHT_BORDER}`, background: `${MIDNIGHT}03` }}>
                  <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "3px" }}>{i + 1}. {item.q}</div>
                  <div style={{ fontSize: "11.5px", color: "var(--muted)", lineHeight: 1.4 }}>{item.hint}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 마무리는 마지막 페이지에만 — 앞 페이지 누출 금지 (StageContentRenderer 게이트와 동일 규율) */}
      {pg === totalPg - 1 && (
      <StageWrapup
        ko={ko}
        nextStageLabelKo={ko ? "예산·시점 설정" : "Budget setup"}
        doneItemsKo={[
          { label: pick("1. 주 연령대·산업 명시", "1. 주 연령대·산업 명시", "1. 타깃 산업·기업 규모"), detail: ko ? "한 명에게 팔린다는 의지로 좁혔는지 확인" : "Narrowed to one target?" },
          { label: pick("2. 라이프스타일·일상 동선", "2. 라이프스타일·구매 동기", "2. 핵심 역할·업무 워크플로우"), detail: ko ? pick("언제·어디서·왜 쓰는지 구체화", "언제·왜 구매하는지 구체화", "어떤 업무에서·왜 도입하는지 구체화") : pick("When/where/why used?", "When/why they buy?", "Which workflow, why adopt?") },
          { label: pick("3. 객단가·예산 한도", "3. 객단가·예산 한도", "3. 도입 예산·지불 의사"), detail: ko ? pick("안 살 가격대까지 명확", "안 살 가격대까지 명확", "안 낼 가격대까지 명확") : "Includes what they WON'T pay?" },
          { label: "4. 반례 검증", detail: ko ? "이 페르소나가 절대 안 할 행동 4개" : "4 things this persona never does" },
        ]}
        verifyItemsKo={[
          "'20-50대 여성' 같은 모호한 정의 X — 한 명의 구체 페르소나로 좁혔는가",
          pick("이 페르소나가 절대 안 갈 위치·안 살 가격대 명시했는가", "이 페르소나가 절대 이탈할 채널·안 살 가격대 명시했는가", "이 페르소나가 절대 도입 안 할 조건·안 낼 가격대 명시했는가"),
          pick("경쟁점 중 같은 페르소나 타깃 가게 1곳 이상 있는가 (없으면 시장 위험)", "경쟁 스토어 중 같은 페르소나 타깃 브랜드 1곳 이상 있는가 (없으면 시장 위험)", "같은 페르소나 타깃 경쟁 제품 1곳 이상 있는가 (없으면 시장 위험)"),
          pick("후속 결정 (입지·메뉴·가격·광고) 의 기준선이 될 수 있을 만큼 구체적인가", "후속 결정 (소싱 상품·상세페이지·가격·광고) 의 기준선이 될 수 있을 만큼 구체적인가", "후속 결정 (제품·가격·온보딩·채널) 의 기준선이 될 수 있을 만큼 구체적인가"),
          "주변 지인 의견이 아닌 실제 잠재 고객 5명+ 대화로 검증했는가",
        ]}
        nextSummaryKo={ko ? "타깃 페르소나 확정 → 예산·시점 설정 단계로 진입" : "Target persona locked → enter Budget setup"}
      />
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(25,25,112,0.12)",
  background: "rgba(255,255,255,0.95)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};
