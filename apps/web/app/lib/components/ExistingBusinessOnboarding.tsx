"use client";

/**
 * ExistingBusinessOnboarding — 기존 운영 사업자 온보딩 (5화면 + 첫 진단, 2026-07-28 개편)
 *
 * ─────────────────────────────────────────────────────────────────
 * 화면 구성 (7단계 → 5화면: 목업 아티팩트 field-audit-v3 확정안)
 * ─────────────────────────────────────────────────────────────────
 *  ① 업종        — 검색 + 카테고리/세부업종, 선택 즉시 "열리는 도구" 미리보기
 *  ② 가게 한 장  — 상호·사업자번호(국세청 자동조회)·운영형태·개업연월·주소·영업시간
 *  ③ 가게 스냅샷 — 운영 방식(사업 모델)·월매출 구간(스킵 가능)·함께 일하는 사람
 *  ④ 채널        — 배달/마켓/툴스택·SNS·POS (업종 분기)
 *  ⑤ 첫 진단     — 벤치마크(공식 출처)·이번 주 미션(프리페치)·세금 D-day·연동 안내
 *
 * 업종 분기 SSOT: resolveOnboardingProfile (packages/shared/onboarding-profile.ts)
 *  — SaaS 에 프랜차이즈·영업시간·배달 질문 금지, 용어(가게/회사) 분기. 가드 테스트 있음.
 *
 * 정직성 규칙:
 *  - 벤치마크는 compareBandToBenchmark 3단(위/겹침/아래)까지만 — 평균값이라 분위 주장 금지
 *  - 국세청 배지는 API 가 실제 반환하는 것(과세유형·영업상태)만 — 개업일은 직접 선택
 *  - 미션은 ③ 진입 시 백그라운드 프리페치(생성 ~40초) — 미완이면 "생성 중" 정직 표기
 *
 * 온보딩에서 뺀 것(대시보드 세팅 미션으로 이관): 월 고정비·초기 투자금·세무 처리 방식.
 * 삭제: 보유 인허가(소비처 0곳 죽은 수집 — 2026-07-28 전수 대조).
 */

import { useEffect, useRef, useState } from "react";
import {
  starterIndustryCategories,
  starterIndustryOptions,
  getStarterBusinessModelOptions,
  localizeStarterIndustryCategory,
  localizeRecommendationItem,
  getFranchiseBrandsForCategory,
  resolveOnboardingProfile,
  resolveOfferingKind,
  REVENUE_BANDS,
  compareBandToBenchmark,
  REVENUE_BENCHMARK_SOURCE,
  buildTaxCalendar,
} from "@foundone/shared";
import { supabase } from "../../../lib/supabase";
import { styles } from "../styles";
import { DaumPostcodeModal } from "./onboarding/DaumPostcodeModal";

export type OnboardingResult = {
  industryId: string;
  industryCategoryId: string;
  storeName: string;
  businessModelId: string;
  startupType: "independent" | "franchise";
  franchiseBrandId: string | null;
  preferredRegion: string;
  vatType: "general" | "simplified";
  hasEmployees: boolean;
  cpaDecision: "cpa" | "self";
  launchDate: string;
  monthlyCosts: { ingredients: number; labor: number; rent: number; utilities: number; other: number };
  capital: number;
  deliveryPlatforms: string[];
  snsChannels: string[];
  businessOpenTime: string;
  businessCloseTime: string;
  weeklyHolidays: string[];
  bizRegistrationNumber: string;
  posId: string;
  addressRoad: string;
  obtainedPermits: Array<{ id: string; name: string }>;
  /** (2026-07-28 신설) 월매출 구간 — 벤치마크 비교 전용, 정밀 계산 사용 금지 */
  revenueBandId?: string | null;
  /** (2026-07-28 신설) 함께 일하는 사람 구간 — solo/family/staff1_2/staff3plus */
  employeesBand?: string | null;
};

type Props = {
  language: "ko" | "en";
  onComplete: (result: OnboardingResult) => void;
  onBack: () => void;
};

const TOTAL_STEPS = 5;

/** 미션 프리페치 상태 — 생성 ~40초라 ③ 진입 시 미리 시작 */
type MissionPrefetch =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; mission: string; timeLabel: string | null }
  | { status: "error" };

/** 국세청 조회 상태 */
type BizLookup =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; taxTypeLabel: string; isActive: boolean; isSimplified: boolean | null }
  | { status: "error" };

const EMPLOYEES_BANDS = [
  { id: "solo", ko: "혼자", en: "Solo" },
  { id: "family", ko: "가족과", en: "With family" },
  { id: "staff1_2", ko: "직원 1~2명", en: "1–2 staff" },
  { id: "staff3plus", ko: "직원 3명 이상", en: "3+ staff" },
] as const;

/** 업종 선택 미리보기 — 실제로 열리는 도구만 (offering-kinds·profile 기반, 과장 금지) */
function previewTools(categoryId: string, ko: boolean): string[] {
  const tools: string[] = [];
  const kind = resolveOfferingKind(null, categoryId);
  const kindLabel: Record<string, string> = {
    "menu-bom": ko ? "메뉴·원가 관리" : "Menu & cost",
    "stocked-goods": ko ? "상품·재고 관리" : "Products & stock",
    "service-menu": ko ? "시술·서비스 메뉴 관리" : "Service menu",
    "membership": ko ? "이용권·회원 관리" : "Memberships",
    "space-booking": ko ? "공간·이용권 관리" : "Space & passes",
  };
  if (kindLabel[kind]) tools.push(kindLabel[kind]);
  const profile = resolveOnboardingProfile(categoryId);
  if (profile.revenueSyncCta === "pos") tools.push(ko ? "매출 자동 연동" : "POS revenue sync");
  if (profile.revenueSyncCta === "ecommerce-csv") tools.push(ko ? "판매내역 업로드 분석" : "Sales CSV analysis");
  if (profile.revenueSyncCta === "saas-metrics") tools.push(ko ? "지표(GA4·웹훅) 연동" : "Metrics (GA4·webhook)");
  if (compareBandToBenchmark(categoryId, "800-1500")) tools.push(ko ? "업종 벤치마크" : "Industry benchmark");
  if (categoryId === "food" || categoryId === "cafe-dessert") tools.push(ko ? "배달 수수료 분석" : "Delivery fee analysis");
  return tools.slice(0, 3);
}

export function ExistingBusinessOnboarding({ language, onComplete, onBack }: Props) {
  const ko = language === "ko";
  const [step, setStep] = useState(1);

  // ① 업종
  const [categoryId, setCategoryId] = useState("food");
  const [industryId, setIndustryId] = useState<string | undefined>();
  const [industryQuery, setIndustryQuery] = useState("");

  // ② 가게 한 장
  const [storeName, setStoreName] = useState("");
  const [bizRegistrationNumber, setBizRegistrationNumber] = useState("");
  const [bizLookup, setBizLookup] = useState<BizLookup>({ status: "idle" });
  const [startupType, setStartupType] = useState<"independent" | "franchise">("independent");
  const [franchiseBrandId, setFranchiseBrandId] = useState<string | null>(null);
  const [vatType, setVatType] = useState<"general" | "simplified">("general");
  const [vatKnown, setVatKnown] = useState<boolean>(false); // 국세청 조회 or 직접 선택 시 true
  const nowYear = new Date().getFullYear();
  const [launchYear, setLaunchYear] = useState<number | null>(null);
  const [launchMonth, setLaunchMonth] = useState<number | null>(null);
  const [addressRoad, setAddressRoad] = useState("");
  const [showPostcode, setShowPostcode] = useState(false);
  const [businessOpenTime, setBusinessOpenTime] = useState("09:00");
  const [businessCloseTime, setBusinessCloseTime] = useState("21:00");
  const [weeklyHolidays, setWeeklyHolidays] = useState<string[]>([]);

  // ③ 가게 스냅샷
  const [businessModelId, setBusinessModelId] = useState<string | undefined>();
  const [revenueBandId, setRevenueBandId] = useState<string | null>(null);
  const [employeesBand, setEmployeesBand] = useState<string | null>(null);

  // ④ 채널 (기존 로직 유지 — deliveryPlatforms 는 온라인이면 마켓, 스타트업이면 툴스택 겸용)
  const [deliveryPlatforms, setDeliveryPlatforms] = useState<string[]>([]);
  const [courierServices, setCourierServices] = useState<string[]>([]);
  const [snsChannels, setSnsChannels] = useState<string[]>([]);
  const [posId, setPosId] = useState("");

  // ⑤ 진단 — 미션 프리페치
  const [mission, setMission] = useState<MissionPrefetch>({ status: "idle" });
  const missionFiredRef = useRef(false);

  const profile = resolveOnboardingProfile(categoryId);
  const place = ko ? profile.placeNoun.ko : profile.placeNoun.en;
  const isDeliveryBiz = categoryId === "food" || categoryId === "cafe-dessert";
  const isOnlineBiz = categoryId === "online-digital";
  const isStartupBiz = categoryId === "startup-tech";

  // ── 미션 프리페치: ③ 진입(업종·상호·지역 확보) 시 1회 백그라운드 시작 (생성 ~40초 흡수) ──
  useEffect(() => {
    if (step < 3 || missionFiredRef.current || !industryId) return;
    missionFiredRef.current = true;
    setMission({ status: "loading" });
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) { setMission({ status: "error" }); return; }
        const res = await fetch("/api/ai/marketing/cases", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            storeName: storeName.trim() || undefined,
            subIndustryId: industryId,
            industryCategoryId: categoryId,
            region: addressRoad.trim() || undefined,
            language,
          }),
        });
        if (!res.ok) { setMission({ status: "error" }); return; }
        const json = await res.json();
        const first = Array.isArray(json.plays) ? json.plays[0] : null;
        if (first && (first.mission || first.title)) {
          setMission({ status: "ready", mission: first.mission ?? first.title, timeLabel: first.timeLabel ?? null });
        } else {
          setMission({ status: "error" });
        }
      } catch {
        setMission({ status: "error" });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, industryId]);

  // ── 국세청 상태조회 (서버 라우트 경유 — 키는 서버 전용) ──
  const lookupBizStatus = async () => {
    const num = bizRegistrationNumber.replace(/[^\d]/g, "");
    if (num.length !== 10 || bizLookup.status === "loading") return;
    setBizLookup({ status: "loading" });
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/data/business/status", {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ businessNumbers: [num] }),
      });
      if (!res.ok) { setBizLookup({ status: "error" }); return; }
      const json = await res.json();
      const item = json?.data?.[0];
      if (!item || !item.taxType) { setBizLookup({ status: "error" }); return; }
      // tax_type 예: "부가가치세 일반과세자" / "부가가치세 간이과세자" / "면세사업자"
      const label: string = item.taxType;
      const simplified = label.includes("간이") ? true : label.includes("일반") ? false : null;
      if (simplified !== null) { setVatType(simplified ? "simplified" : "general"); setVatKnown(true); }
      setBizLookup({
        status: "done",
        taxTypeLabel: label.replace("부가가치세 ", ""),
        isActive: item.operatingStatus ? item.operatingStatus === "active" : true,
        isSimplified: simplified,
      });
    } catch {
      setBizLookup({ status: "error" });
    }
  };

  const canNext = (): boolean => {
    if (step === 1) return Boolean(industryId);
    if (step === 2) {
      if (!storeName.trim()) return false;
      if (!launchYear || !launchMonth) return false;
      if (profile.asks.address === "required" && !addressRoad.trim()) return false;
      return true;
    }
    if (step === 3) return Boolean(businessModelId) && Boolean(employeesBand);
    return true;
  };

  const launchDate = launchYear && launchMonth
    ? `${launchYear}-${String(launchMonth).padStart(2, "0")}-01`
    : "";

  /** 주소에서 지역 요약(시·구·동 앞 2~3토큰) — 미션 지역 주입·preferredRegion 용 */
  const regionFromAddress = (addr: string): string => addr.trim().split(/\s+/).slice(0, 3).join(" ");

  const handleComplete = () => {
    if (!industryId || !businessModelId) return;
    onComplete({
      industryId,
      industryCategoryId: categoryId,
      storeName: storeName.trim(),
      businessModelId,
      preferredRegion: regionFromAddress(addressRoad),
      startupType: profile.asks.franchise ? startupType : "independent",
      franchiseBrandId: profile.asks.franchise ? franchiseBrandId : null,
      vatType,
      hasEmployees: employeesBand === "staff1_2" || employeesBand === "staff3plus",
      // 세무 처리 방식은 온보딩에서 묻지 않음 — 기본 self, 세금 탭에서 변경 (질문 이관)
      cpaDecision: "self",
      launchDate,
      // 고정비·투자금은 대시보드 세팅 미션으로 이관 — 0 은 "미입력"이며 handler 가 스킵
      monthlyCosts: { ingredients: 0, labor: 0, rent: 0, utilities: 0, other: 0 },
      capital: 0,
      deliveryPlatforms,
      snsChannels,
      businessOpenTime: profile.asks.businessHours ? businessOpenTime : "",
      businessCloseTime: profile.asks.businessHours ? businessCloseTime : "",
      weeklyHolidays: profile.asks.businessHours ? weeklyHolidays : [],
      bizRegistrationNumber: bizRegistrationNumber.trim(),
      posId,
      addressRoad: addressRoad.trim(),
      obtainedPermits: [], // 소비처 0곳 죽은 수집 — 삭제 (2026-07-28 전수 대조)
      revenueBandId,
      employeesBand,
    });
  };

  const [showValidation, setShowValidation] = useState(false);
  const next = () => {
    if (canNext()) { setShowValidation(false); setStep((s) => Math.min(s + 1, TOTAL_STEPS)); }
    else { setShowValidation(true); }
  };
  const prev = () => { setShowValidation(false); setStep((s) => Math.max(s - 1, 1)); };

  // ── 공용 스타일 ──
  //   배경 = OnboardingChoiceScreen 과 동일한 앰비언트 글로우 (같은 흐름의 연속 화면 —
  //   선택 화면에서 넘어올 때 배경이 뚝 바뀌면 안 됨. DESIGN_LANGUAGE.md 캔버스 규격)
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh", background: "transparent", position: "relative" as const,
    display: "flex", flexDirection: "column", alignItems: "center", padding: "0 24px",
  };
  const containerStyle: React.CSSProperties = {
    maxWidth: "560px", width: "100%",
    marginTop: "clamp(40px, 8vh, 96px)", marginBottom: "80px",
  };
  // ── 디자인 언어 정합 (DESIGN_LANGUAGE.md — 4-surface 헤더·대시보드 카드 셸 실측 규격) ──
  const eyebrowStyle: React.CSSProperties = {
    fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase" as const, color: "#191970", opacity: 0.65, marginBottom: "8px",
  };
  const titleStyle: React.CSSProperties = {
    fontSize: "26px", fontWeight: 750, letterSpacing: "-0.025em",
    lineHeight: 1.25, color: "#0f172a", marginBottom: "8px",
  };
  const subtitleStyle: React.CSSProperties = {
    fontSize: "14px", lineHeight: 1.6, color: "var(--muted)", marginBottom: "28px",
  };
  const cardStyle: React.CSSProperties = {
    borderRadius: "20px", border: "1px solid rgba(25,25,112,0.10)",
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 32px rgba(25,25,112,0.06)",
    padding: "20px",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "13px", fontWeight: 600, color: "var(--muted)", marginBottom: "8px", letterSpacing: "0.02em",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: "14px", border: "1px solid rgba(17,17,17,0.08)",
    background: "#fff", padding: "14px 16px", fontSize: "16px", color: "var(--text)",
    outline: "none", boxSizing: "border-box" as const,
  };
  const chipStyle = (selected: boolean): React.CSSProperties => ({
    borderRadius: "999px",
    border: selected ? "1.5px solid rgba(29,53,87,0.3)" : "1.5px solid transparent",
    background: selected ? "rgba(29,53,87,0.07)" : "rgba(0,0,0,0.04)",
    color: selected ? "var(--primary)" : "var(--muted)",
    padding: "10px 18px", fontSize: "15px", fontWeight: selected ? 600 : 500,
    cursor: "pointer", transition: "all 0.15s ease",
    boxShadow: selected ? "0 2px 8px rgba(17,17,17,0.06)" : "none",
  });
  const choiceCardStyle = (selected: boolean): React.CSSProperties => ({
    borderRadius: "16px",
    border: selected ? "1.5px solid rgba(29,53,87,0.30)" : "1px solid rgba(25,25,112,0.10)",
    background: selected ? "rgba(29,53,87,0.06)" : "rgba(255,255,255,0.9)",
    boxShadow: selected
      ? "0 0 0 4px rgba(29,53,87,0.07)"
      : "0 1px 0 rgba(255,255,255,0.6) inset, 0 4px 14px rgba(25,25,112,0.05)",
    padding: "14px 16px", cursor: "pointer", transition: "all 0.15s ease", textAlign: "left" as const,
  });
  const footerStyle: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px", gap: "12px",
  };
  const primaryBtnStyle: React.CSSProperties = {
    ...styles.primaryButton, padding: "14px 28px", fontSize: "16px", opacity: canNext() ? 1 : 0.4,
  };
  const secondaryBtnStyle: React.CSSProperties = { ...styles.button, padding: "14px 20px", fontSize: "15px" };
  const verifiedBadge: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "5px",
    background: "rgba(29,53,87,0.08)", color: "var(--primary)", fontSize: "12px", fontWeight: 700,
    borderRadius: "999px", padding: "5px 12px",
  };
  const helperStyle: React.CSSProperties = { fontSize: "12px", color: "var(--muted)", marginTop: "6px" };
  const previewStripStyle: React.CSSProperties = {
    marginTop: "18px", background: "rgba(25,25,112,0.05)", borderRadius: "14px",
    padding: "12px 14px", fontSize: "13px", color: "var(--primary)", fontWeight: 600, lineHeight: 1.55,
  };

  const toggleRow = (items: { id: string; label: string }[], selected: string[], toggle: (id: string) => void) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
      {items.map((item) => (
        <button key={item.id} type="button" style={chipStyle(selected.includes(item.id))} onClick={() => toggle(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  );
  const toggleList = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  // 업종 검색: 검색어가 있으면 카테고리 무시하고 전체에서 제목 매칭
  const query = industryQuery.trim().toLowerCase();
  const searchedOptions = query
    ? starterIndustryOptions.filter((o) =>
        localizeRecommendationItem(o, language).title.toLowerCase().includes(query))
    : null;

  // === RENDER ===
  return (
    <div style={pageStyle}>
      {/* Ambient depth — OnboardingChoiceScreen 과 동일한 미드나잇 hue */}
      <div aria-hidden style={{
        position: "absolute" as const, top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: "min(90%, 1200px)", height: "60vh",
        background: "radial-gradient(ellipse at center, rgba(91,107,255,0.08) 0%, rgba(91,107,255,0) 60%)",
        pointerEvents: "none" as const,
      }} />
      <div aria-hidden style={{
        position: "absolute" as const, bottom: "-30%", right: "-10%",
        width: "60vh", height: "60vh",
        background: "radial-gradient(circle, rgba(25,25,112,0.06) 0%, rgba(25,25,112,0) 60%)",
        pointerEvents: "none" as const,
      }} />
      <DaumPostcodeModal
        open={showPostcode}
        onClose={() => setShowPostcode(false)}
        onSelect={(addr) => setAddressRoad(addr)}
      />
      <div style={{ ...containerStyle, position: "relative" as const, zIndex: 1 }}>
        {/* 진행 표시 — "N/5 · 약 3분": 점 대신 남은 부담을 알려주는 정보형 (목업 확정안) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <button type="button" onClick={step === 1 ? onBack : prev} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "14px", cursor: "pointer", padding: 0 }}>
            ← {step === 1 ? (ko ? "처음으로" : "Back") : (ko ? "이전" : "Prev")}
          </button>
          <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--primary)", background: "rgba(29,53,87,0.07)", padding: "5px 12px", borderRadius: "999px" }}>
            {step >= TOTAL_STEPS ? (ko ? "완료" : "Done") : `${step} / ${TOTAL_STEPS} · ${ko ? "약 3분" : "~3 min"}`}
          </span>
        </div>
        <div style={{ height: "3px", background: "rgba(29,53,87,0.10)", borderRadius: "2px", marginBottom: "28px", overflow: "hidden" }}>
          <div style={{ width: `${(step / TOTAL_STEPS) * 100}%`, height: "100%", background: "var(--primary)", borderRadius: "2px", transition: "width 0.3s ease" }} />
        </div>

        {/* ① 업종 */}
        {step === 1 && (
          <>
            <div style={eyebrowStyle}>STEP 1 / 5</div>
            <div style={titleStyle}>{ko ? "어떤 사업을 운영하세요?" : "What business do you run?"}</div>
            <div style={subtitleStyle}>
              {ko ? "업종에 맞는 관리 도구가 준비됩니다." : "We prepare tools that fit your industry."}
            </div>
            <input
              style={{ ...inputStyle, marginBottom: "18px" }}
              value={industryQuery}
              onChange={(e) => setIndustryQuery(e.target.value)}
              placeholder={ko ? "🔍 업종 검색 (예: 미용실, 빨래방, SaaS)" : "🔍 Search industry"}
            />
            {searchedOptions ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                {searchedOptions.slice(0, 12).map((raw) => {
                  const opt = localizeRecommendationItem(raw, language);
                  return (
                    <button
                      key={raw.id}
                      type="button"
                      style={choiceCardStyle(industryId === raw.id)}
                      onClick={() => {
                        setIndustryId(raw.id);
                        if (raw.meta?.categoryId) setCategoryId(String(raw.meta.categoryId));
                      }}
                    >
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{opt.title}</div>
                    </button>
                  );
                })}
                {searchedOptions.length === 0 && (
                  <div style={{ gridColumn: "1 / -1", color: "var(--muted)", fontSize: "14px", padding: "12px 4px" }}>
                    {ko ? "검색 결과가 없어요 — 아래 카테고리에서 골라주세요." : "No results — pick from categories below."}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                  {starterIndustryCategories.map((raw) => {
                    const cat = localizeStarterIndustryCategory(raw, language);
                    return (
                      <button
                        key={raw.id}
                        type="button"
                        style={chipStyle(categoryId === raw.id)}
                        onClick={() => { setCategoryId(raw.id); setIndustryId(undefined); }}
                      >
                        {cat.title}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                  {starterIndustryOptions
                    .filter((o) => o.meta?.categoryId === categoryId)
                    .slice(0, 6)
                    .map((raw) => {
                      const opt = localizeRecommendationItem(raw, language);
                      return (
                        <button
                          key={raw.id}
                          type="button"
                          style={choiceCardStyle(industryId === raw.id)}
                          onClick={() => setIndustryId(raw.id)}
                        >
                          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{opt.title}</div>
                        </button>
                      );
                    })}
                </div>
              </>
            )}
            {industryId && (
              <div style={previewStripStyle}>
                {ko
                  ? `선택하면 열려요 — ${previewTools(categoryId, ko).join(" · ") || "업종 맞춤 도구"}`
                  : `Unlocks — ${previewTools(categoryId, ko).join(" · ")}`}
              </div>
            )}
          </>
        )}

        {/* ② 가게 한 장 */}
        {step === 2 && (
          <>
            <div style={eyebrowStyle}>STEP 2 / 5</div>
            <div style={titleStyle}>{ko ? `${place} 정보를 알려주세요` : `Tell us about your ${place}`}</div>
            <div style={subtitleStyle}>
              {ko ? "사업자번호를 넣으면 세무 정보는 자동으로 채워요." : "Enter your business number and we auto-fill tax info."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={labelStyle}>
                  {ko ? "사업자등록번호 " : "Business registration number "}
                  <span style={{ fontWeight: 500, opacity: 0.7 }}>{ko ? "(선택)" : "(optional)"}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={bizRegistrationNumber}
                    onChange={(e) => { setBizRegistrationNumber(e.target.value); if (bizLookup.status !== "idle") setBizLookup({ status: "idle" }); }}
                    placeholder="123-45-67890"
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    onClick={() => void lookupBizStatus()}
                    disabled={bizLookup.status === "loading"}
                    style={{
                      ...styles.primaryButton, padding: "0 16px", fontSize: "13.5px", whiteSpace: "nowrap",
                      opacity: bizRegistrationNumber.replace(/[^\d]/g, "").length === 10 ? 1 : 0.4,
                    }}
                  >
                    {bizLookup.status === "loading" ? (ko ? "조회 중..." : "Checking...") : (ko ? "국세청에서 불러오기" : "Fetch from NTS")}
                  </button>
                </div>
                {bizLookup.status === "done" && (
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                    <span style={verifiedBadge}>✓ {bizLookup.taxTypeLabel} · {bizLookup.isActive ? (ko ? "계속사업자" : "Active") : (ko ? "휴·폐업 상태" : "Inactive")} — {ko ? "국세청 확인" : "NTS verified"}</span>
                  </div>
                )}
                {bizLookup.status === "error" && (
                  <div style={helperStyle}>{ko ? "조회에 실패했어요 — 아래에서 과세유형만 직접 선택하면 됩니다." : "Lookup failed — pick your VAT type below."}</div>
                )}
                {bizLookup.status === "idle" && (
                  <div style={helperStyle}>{ko ? "안 넣어도 계속할 수 있어요 — 과세유형만 직접 선택하면 됩니다." : "You can skip this — just pick your VAT type below."}</div>
                )}
              </div>

              {/* 과세유형 — 국세청 조회 성공 시 자동, 아니면 직접 (모르겠어요 허용) */}
              {bizLookup.status !== "done" && (
                <div>
                  <div style={labelStyle}>{ko ? "부가세 유형" : "VAT type"}</div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button type="button" style={chipStyle(vatKnown && vatType === "general")} onClick={() => { setVatType("general"); setVatKnown(true); }}>
                      {ko ? "일반과세자" : "General"}
                    </button>
                    <button type="button" style={chipStyle(vatKnown && vatType === "simplified")} onClick={() => { setVatType("simplified"); setVatKnown(true); }}>
                      {ko ? "간이과세자" : "Simplified"}
                    </button>
                    <button type="button" style={chipStyle(!vatKnown)} onClick={() => { setVatType("general"); setVatKnown(false); }}>
                      {ko ? "모르겠어요" : "Not sure"}
                    </button>
                  </div>
                  {!vatKnown && (
                    <div style={helperStyle}>
                      {ko ? "일단 일반과세 기준으로 안내하고, 세금 탭에서 확인 후 바꿀 수 있어요." : "We'll assume general VAT — you can change it in the Tax tab."}
                    </div>
                  )}
                </div>
              )}

              <div>
                <div style={labelStyle}>{ko ? `${place} 이름` : `${place} name`}</div>
                <input
                  style={{ ...inputStyle, ...(showValidation && !storeName.trim() ? { borderColor: "#b64c4c", boxShadow: "0 0 0 3px rgba(182,76,76,0.1)" } : {}) }}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder={ko ? (isStartupBiz ? "예: 파운드원" : "예: 성수 한잔") : "e.g. Seongsu Coffee Lab"}
                />
                {showValidation && !storeName.trim() && (
                  <div style={{ fontSize: "12px", color: "#b64c4c", marginTop: "6px" }}>
                    {ko ? "이름을 입력해주세요" : "Please enter a name"}
                  </div>
                )}
              </div>

              {/* 운영 형태 — 가맹 모델이 실존하는 업종만 (SaaS·온라인엔 질문 자체가 없음) */}
              {profile.asks.franchise && (
                <div>
                  <div style={labelStyle}>{ko ? "운영 형태" : "Ownership"}</div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {(["independent", "franchise"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        style={chipStyle(startupType === t)}
                        onClick={() => { setStartupType(t); setFranchiseBrandId(null); }}
                      >
                        {t === "independent" ? (ko ? "독립 매장" : "Independent") : (ko ? "프랜차이즈 가맹점" : "Franchise")}
                      </button>
                    ))}
                  </div>
                  {startupType === "franchise" && (
                    <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                      {getFranchiseBrandsForCategory(categoryId).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          style={chipStyle(franchiseBrandId === b.id)}
                          onClick={() => {
                            setFranchiseBrandId(b.id);
                            if (!storeName.trim()) setStoreName(b.name[language]);
                          }}
                        >
                          {b.name[language]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <div style={labelStyle}>{ko ? "개업 시기" : "Opened"}</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    style={{ ...inputStyle, flex: 1, ...(showValidation && !launchYear ? { borderColor: "#b64c4c" } : {}) }}
                    value={launchYear ?? ""}
                    onChange={(e) => setLaunchYear(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">{ko ? "연도" : "Year"}</option>
                    {Array.from({ length: 30 }, (_, i) => nowYear - i).map((y) => (
                      <option key={y} value={y}>{y}{ko ? "년" : ""}</option>
                    ))}
                  </select>
                  <select
                    style={{ ...inputStyle, flex: 1, ...(showValidation && !launchMonth ? { borderColor: "#b64c4c" } : {}) }}
                    value={launchMonth ?? ""}
                    onChange={(e) => setLaunchMonth(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">{ko ? "월" : "Month"}</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{m}{ko ? "월" : ""}</option>
                    ))}
                  </select>
                </div>
                <div style={helperStyle}>
                  {ko ? "국세청 조회는 과세유형·영업상태만 제공해요 — 개업 시기는 직접 선택합니다." : "NTS lookup gives VAT type only — pick your opening date."}
                </div>
              </div>

              <div>
                <div style={labelStyle}>
                  {ko ? "주소" : "Address"}
                  {profile.asks.address === "optional" && <span style={{ fontWeight: 500, opacity: 0.7 }}> {ko ? "(선택 — 지역 혜택·지원사업 안내용)" : "(optional)"}</span>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    style={{ ...inputStyle, flex: 1, ...(showValidation && profile.asks.address === "required" && !addressRoad.trim() ? { borderColor: "#b64c4c", boxShadow: "0 0 0 3px rgba(182,76,76,0.1)" } : {}) }}
                    value={addressRoad}
                    onChange={(e) => setAddressRoad(e.target.value)}
                    placeholder={ko ? "도로명 주소 (예: 서울 성동구 연무장길 00)" : "Street address"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPostcode(true)}
                    style={{ ...styles.primaryButton, padding: "0 16px", fontSize: "13.5px", whiteSpace: "nowrap" }}
                  >
                    {ko ? "주소 검색" : "Search"}
                  </button>
                </div>
                {showValidation && profile.asks.address === "required" && !addressRoad.trim() && (
                  <div style={{ fontSize: "12px", color: "#b64c4c", marginTop: "6px" }}>
                    {ko ? "주소를 입력해주세요 — 상권·지역 맞춤에 쓰여요" : "Please enter an address"}
                  </div>
                )}
              </div>

              {/* 영업시간·휴무 — 물리 영업장 업종만 */}
              {profile.asks.businessHours && (
                <>
                  <div>
                    <div style={labelStyle}>{ko ? "영업 시간" : "Operating hours"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <input type="time" style={{ ...inputStyle, flex: 1 }} value={businessOpenTime} onChange={(e) => setBusinessOpenTime(e.target.value)} />
                      <span style={{ color: "var(--muted)", fontWeight: 500 }}>~</span>
                      <input type="time" style={{ ...inputStyle, flex: 1 }} value={businessCloseTime} onChange={(e) => setBusinessCloseTime(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <div style={labelStyle}>{ko ? "정기 휴무일 (복수 선택)" : "Regular closing days"}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {(ko ? ["월", "화", "수", "목", "금", "토", "일"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]).map((label, i) => {
                        const id = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"][i];
                        return (
                          <button key={id} type="button" style={chipStyle(weeklyHolidays.includes(id))} onClick={() => setWeeklyHolidays((prev) => toggleList(prev, id))}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ③ 가게 스냅샷 */}
        {step === 3 && (
          <>
            <div style={eyebrowStyle}>STEP 3 / 5</div>
            <div style={titleStyle}>{ko ? `${place}를 조금 더 알려주세요` : "A bit more detail"}</div>
            <div style={subtitleStyle}>
              {ko ? "매출은 업종 평균 비교에만 쓰여요 · 언제든 수정할 수 있어요" : "Revenue is used only for benchmarks · editable anytime"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <div style={labelStyle}>{ko ? "운영 방식" : "Operating model"}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {getStarterBusinessModelOptions(categoryId).map((raw) => {
                    const opt = localizeRecommendationItem(raw, language);
                    return (
                      <button key={raw.id} type="button" style={chipStyle(businessModelId === raw.id)} onClick={() => setBusinessModelId(raw.id)}>
                        {opt.title}
                      </button>
                    );
                  })}
                </div>
                {showValidation && !businessModelId && (
                  <div style={{ fontSize: "12px", color: "#b64c4c", marginTop: "6px" }}>{ko ? "운영 방식을 선택해주세요" : "Please select"}</div>
                )}
              </div>

              <div>
                <div style={labelStyle}>
                  {ko ? profile.revenueLabel.ko : profile.revenueLabel.en}
                  <span style={{ fontWeight: 500, opacity: 0.7 }}> {ko ? "(대략적인 구간이면 충분해요)" : "(rough band is enough)"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {REVENUE_BANDS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      style={choiceCardStyle(revenueBandId === b.id)}
                      onClick={() => setRevenueBandId(revenueBandId === b.id ? null : b.id)}
                    >
                      <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text)" }}>{ko ? b.label.ko : b.label.en}</div>
                    </button>
                  ))}
                </div>
                <div style={helperStyle}>
                  {ko ? "업종 평균과 비교하는 데만 쓰여요 · 건너뛰어도 됩니다" : "Used only for industry comparison · skippable"}
                </div>
              </div>

              <div>
                <div style={labelStyle}>{ko ? profile.teamLabel.ko : profile.teamLabel.en}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {EMPLOYEES_BANDS.map((b) => (
                    <button key={b.id} type="button" style={chipStyle(employeesBand === b.id)} onClick={() => setEmployeesBand(b.id)}>
                      {/* "family" 라벨은 업종 분기 — 오프라인 "가족과" / 스타트업 "공동창업자와" (id 동일) */}
                      {b.id === "family" ? (ko ? profile.secondBandLabel.ko : profile.secondBandLabel.en) : ko ? b.ko : b.en}
                    </button>
                  ))}
                </div>
                {showValidation && !employeesBand && (
                  <div style={{ fontSize: "12px", color: "#b64c4c", marginTop: "6px" }}>{ko ? "선택해주세요 — 세금 일정 안내에 쓰여요" : "Please select"}</div>
                )}
              </div>

              {launchYear && launchMonth && (
                <div>
                  <div style={labelStyle}>{ko ? "운영 기간" : "Operating for"}</div>
                  <span style={verifiedBadge}>
                    ✓ {(() => {
                      const months = Math.max(0, (nowYear - launchYear) * 12 + (new Date().getMonth() + 1 - launchMonth));
                      const y = Math.floor(months / 12); const m = months % 12;
                      return ko ? `${y > 0 ? `${y}년 ` : ""}${m}개월 — 개업 시기 기준 자동 계산` : `${y}y ${m}m — auto from opening date`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ④ 채널 (기존 업종 분기 유지) */}
        {step === 4 && (
          <>
            <div style={eyebrowStyle}>STEP 4 / 5</div>
            <div style={titleStyle}>{ko ? "지금 쓰는 채널을 알려주세요" : "Which channels do you use?"}</div>
            <div style={subtitleStyle}>
              {ko ? "수수료 분석과 마케팅 미션이 채널에 맞춰집니다." : "Fee analysis and marketing missions adapt to your channels."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {isDeliveryBiz && (
                <div>
                  <div style={labelStyle}>{ko ? "배달 플랫폼" : "Delivery platforms"}</div>
                  {toggleRow(
                    [
                      { id: "baemin", label: ko ? "배달의민족" : "Baemin" },
                      { id: "coupangeats", label: ko ? "쿠팡이츠" : "Coupang Eats" },
                      { id: "yogiyo", label: ko ? "요기요" : "Yogiyo" },
                      { id: "ddangyo", label: ko ? "땡겨요" : "Ddangyo" },
                      { id: "naver-order", label: ko ? "네이버 주문" : "Naver Order" },
                    ],
                    deliveryPlatforms,
                    (id) => setDeliveryPlatforms((prev) => toggleList(prev, id)),
                  )}
                </div>
              )}
              {isOnlineBiz && (
                <>
                  <div>
                    <div style={labelStyle}>{ko ? "판매 플랫폼" : "Sales platforms"}</div>
                    {toggleRow(
                      [
                        { id: "smartstore", label: ko ? "스마트스토어" : "Smart Store" },
                        { id: "coupang", label: ko ? "쿠팡" : "Coupang" },
                        { id: "gmarket", label: ko ? "G마켓" : "Gmarket" },
                        { id: "29cm", label: "29CM" },
                        { id: "kakao", label: ko ? "카카오쇼핑" : "Kakao Shopping" },
                      ],
                      deliveryPlatforms,
                      (id) => setDeliveryPlatforms((prev) => toggleList(prev, id)),
                    )}
                  </div>
                  <div>
                    <div style={labelStyle}>{ko ? "택배사" : "Courier"}</div>
                    {toggleRow(
                      [
                        { id: "cj", label: ko ? "CJ대한통운" : "CJ Logistics" },
                        { id: "hanjin", label: ko ? "한진택배" : "Hanjin" },
                        { id: "lotte", label: ko ? "롯데택배" : "Lotte" },
                        { id: "epost", label: ko ? "우체국택배" : "Korea Post" },
                        { id: "logen", label: ko ? "로젠택배" : "Logen" },
                      ],
                      courierServices,
                      (id) => setCourierServices((prev) => toggleList(prev, id)),
                    )}
                  </div>
                </>
              )}
              {isStartupBiz && (
                <>
                  <div>
                    <div style={labelStyle}>{ko ? "핵심 운영 도구" : "Core operating stack"}</div>
                    {toggleRow(
                      [
                        { id: "stripe", label: "Stripe" },
                        { id: "hubspot", label: "HubSpot" },
                        { id: "mixpanel", label: "Mixpanel" },
                        { id: "sentry", label: "Sentry" },
                        { id: "linear", label: "Linear" },
                      ],
                      deliveryPlatforms,
                      (id) => setDeliveryPlatforms((prev) => toggleList(prev, id)),
                    )}
                  </div>
                  <div>
                    <div style={labelStyle}>{ko ? "영업·배포 채널" : "Launch channels"}</div>
                    {toggleRow(
                      [
                        { id: "producthunt", label: "Product Hunt" },
                        { id: "linkedin", label: "LinkedIn" },
                        { id: "github", label: "GitHub" },
                        { id: "communities", label: ko ? "커뮤니티" : "Communities" },
                        { id: "founder-outbound", label: ko ? "창업자 아웃바운드" : "Founder outbound" },
                      ],
                      courierServices,
                      (id) => setCourierServices((prev) => toggleList(prev, id)),
                    )}
                  </div>
                </>
              )}
              {!isDeliveryBiz && !isOnlineBiz && !isStartupBiz && ["retail", "pet", "living-service"].includes(categoryId) && (
                <div>
                  <div style={labelStyle}>{ko ? "택배사 (이용 시)" : "Courier (if any)"}</div>
                  {toggleRow(
                    [
                      { id: "cj", label: ko ? "CJ대한통운" : "CJ Logistics" },
                      { id: "hanjin", label: ko ? "한진택배" : "Hanjin" },
                      { id: "lotte", label: ko ? "롯데택배" : "Lotte" },
                      { id: "epost", label: ko ? "우체국택배" : "Korea Post" },
                    ],
                    courierServices,
                    (id) => setCourierServices((prev) => toggleList(prev, id)),
                  )}
                </div>
              )}
              <div>
                <div style={labelStyle}>{ko ? "SNS · 온라인 채널" : "SNS channels"}</div>
                {toggleRow(
                  isStartupBiz
                    ? [
                        { id: "linkedin-co", label: ko ? "링크드인" : "LinkedIn" },
                        { id: "twitter", label: "X (Twitter)" },
                        { id: "blog", label: ko ? "기술 블로그" : "Blog" },
                        { id: "youtube", label: ko ? "유튜브" : "YouTube" },
                      ]
                    : [
                        { id: "instagram", label: ko ? "인스타그램" : "Instagram" },
                        { id: "naver-place", label: ko ? "네이버 플레이스" : "Naver Place" },
                        { id: "youtube", label: ko ? "유튜브" : "YouTube" },
                        { id: "blog", label: ko ? "블로그" : "Blog" },
                        { id: "tiktok", label: ko ? "틱톡" : "TikTok" },
                      ],
                  snsChannels,
                  (id) => setSnsChannels((prev) => toggleList(prev, id)),
                )}
              </div>
              {/* POS — 오프라인(POS 연동 CTA 업종)만 */}
              {profile.revenueSyncCta === "pos" && (
                <div>
                  <div style={labelStyle}>POS</div>
                  {toggleRow(
                    [
                      { id: "tossplace", label: ko ? "토스 플레이스" : "Toss Place" },
                      { id: "posbank", label: ko ? "포스뱅크" : "POSBank" },
                      { id: "other", label: ko ? "기타" : "Other" },
                      { id: "none", label: ko ? "POS 없음" : "No POS" },
                    ],
                    posId ? [posId] : [],
                    (id) => setPosId(posId === id ? "" : id),
                  )}
                  {posId === "tossplace" && (
                    <div style={previewStripStyle}>
                      {ko ? "토스 플레이스를 쓰시네요 — 다음 화면에서 매출을 자동으로 불러올 수 있어요" : "Toss Place detected — you can auto-sync revenue next."}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ⑤ 첫 진단 — 입력만으로 만든 실데이터 카드. 여기서 [시작하기]가 저장·전환 트리거 */}
        {step === 5 && (() => {
          const benchmarkResult = compareBandToBenchmark(categoryId, revenueBandId);
          const band = REVENUE_BANDS.find((b) => b.id === revenueBandId);
          const tax = buildTaxCalendar({
        isSimplified: vatType === "simplified",
        hasEmployees: employeesBand === "staff1_2" || employeesBand === "staff3plus",
          });
          const diagCard: React.CSSProperties = { ...cardStyle, borderRadius: "18px", padding: "18px 20px", marginBottom: "12px" };
          const diagK: React.CSSProperties = { fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", color: "#191970", opacity: 0.65, textTransform: "uppercase", marginBottom: "6px" };
          const diagV: React.CSSProperties = { fontSize: "15px", fontWeight: 700, lineHeight: 1.5, color: "var(--text)" };
          const diagFine: React.CSSProperties = { fontSize: "11.5px", color: "var(--muted)", marginTop: "6px", lineHeight: 1.5 };
          const positionText = benchmarkResult
            ? benchmarkResult.position === "above"
              ? (ko ? "업종 평균보다 높은 구간이에요" : "Above the industry average")
              : benchmarkResult.position === "below"
                ? (ko ? "업종 평균보다 낮은 구간이에요" : "Below the industry average")
                : (ko ? "업종 평균과 겹치는 구간이에요" : "Overlaps the industry average")
            : null;
          return (
            <>
              <div style={eyebrowStyle}>FIRST REPORT</div>
              <div style={titleStyle}>
                {ko ? `${storeName.trim() || place} ${profile.ownerTitle.ko}, 첫 진단이 나왔어요` : "Your first diagnosis is ready"}
              </div>
              <div style={subtitleStyle}>
                {ko ? "방금 입력하신 정보만으로 만든 리포트입니다." : "Built only from what you just entered."}
              </div>

              {/* 벤치마크 — 데이터 있는 업종 + 구간 입력 시에만 (빈 카드·위조 금지) */}
              {benchmarkResult && band ? (
                <div style={diagCard}>
                  <div style={diagK}>{ko ? `${benchmarkResult.benchmark.kstatIndustry} 벤치마크` : "Industry benchmark"}</div>
                  <div style={diagV}>{positionText}</div>
                  <div style={diagFine}>
                    {ko
                      ? `사장님 구간 ${band.label.ko} vs 업종 평균 월 약 ${benchmarkResult.benchmark.monthlyRevenueManwon.toLocaleString()}만원 (연매출 기준 환산) · 출처: ${REVENUE_BENCHMARK_SOURCE.publisher} ${REVENUE_BENCHMARK_SOURCE.name} · 매출을 연동하면 실측 비교로 바뀝니다`
                      : `Your band ${band.label.en} vs industry avg ≈ ₩${benchmarkResult.benchmark.monthlyRevenueManwon.toLocaleString()}0K/mo · Source: ${REVENUE_BENCHMARK_SOURCE.name}`}
                  </div>
                </div>
              ) : compareBandToBenchmark(categoryId, "800-1500") ? (
                <div style={diagCard}>
                  <div style={diagK}>{ko ? "업종 벤치마크" : "Industry benchmark"}</div>
                  <div style={diagV}>{ko ? "매출 구간을 입력하면 업종 평균과 비교해 드려요" : "Enter a revenue band to compare"}</div>
                  <button type="button" onClick={() => setStep(3)} style={{ ...styles.button, marginTop: "10px", padding: "8px 14px", fontSize: "13px" }}>
                    {ko ? "10초 입력하기" : "Take 10 seconds"}
                  </button>
                </div>
              ) : null}

              {/* 이번 주 미션 — 프리페치 상태 정직 표기 */}
              <div style={diagCard}>
                <div style={diagK}>{ko ? "이번 주 마케팅 미션" : "This week's mission"}</div>
                {mission.status === "ready" ? (
                  <>
                    <div style={diagV}>{mission.mission}</div>
                    <div style={diagFine}>
                      {mission.timeLabel ? `${mission.timeLabel} · ` : ""}
                      {ko ? "마케팅 탭에서 실제 사례·실행물과 함께 확인하세요" : "See full playbook in the Marketing tab"}
                    </div>
                  </>
                ) : mission.status === "loading" ? (
                  <>
                    <div style={diagV}>{ko ? "사장님 업종의 실제 사례를 찾는 중이에요..." : "Finding real cases for your industry..."}</div>
                    <div style={diagFine}>{ko ? "약 40초 걸려요 — 먼저 아래를 둘러보셔도 됩니다. 완성되면 마케팅 탭에 있어요." : "~40s — it will be in the Marketing tab."}</div>
                  </>
                ) : (
                  <>
                    <div style={diagV}>{ko ? "이번 주 미션은 대시보드의 마케팅 탭에서 준비돼요" : "Your weekly mission will be ready in the Marketing tab"}</div>
                  </>
                )}
              </div>

              {/* 세금 D-day — 실제 세금 캘린더 SSOT */}
              {tax.next && (
                <div style={diagCard}>
                  <div style={diagK}>{ko ? "다가오는 세금" : "Next tax deadline"}</div>
                  <div style={diagV}>{tax.next.summary}</div>
                  <div style={diagFine}>
                    {!vatKnown && bizLookup.status !== "done"
                      ? (ko ? "일반과세 기준 안내 — 세금 탭에서 과세유형 확인 후 정확해집니다" : "Assuming general VAT — confirm in Tax tab")
                      : (ko ? "세금 탭에서 전체 일정·예상 세액을 확인하세요" : "See the full calendar in the Tax tab")}
                  </div>
                </div>
              )}

              {/* 매출 연동 안내 — 업종별 CTA (이 화면의 유일한 강조 카드) */}
              <div style={{ ...diagCard, background: "linear-gradient(180deg, #1d2b7a 0%, #0d0d4d 100%)", border: "none", boxShadow: "0 6px 18px rgba(25,25,112,0.28), 0 1px 0 rgba(255,255,255,0.12) inset" }}>
                <div style={{ ...diagK, color: "rgba(255,255,255,0.6)" }}>
                  {profile.revenueSyncCta === "pos" ? (ko ? "매출 자동 연동" : "Revenue sync")
                    : profile.revenueSyncCta === "ecommerce-csv" ? (ko ? "판매내역 분석" : "Sales analysis")
                    : (ko ? "지표 연동" : "Metrics sync")}
                </div>
                <div style={{ ...diagV, color: "#fff" }}>
                  {profile.revenueSyncCta === "pos"
                    ? (ko ? `${posId === "tossplace" ? "토스 플레이스" : "POS"} 매출을 자동으로 불러올 수 있어요` : "Auto-import your POS revenue")
                    : profile.revenueSyncCta === "ecommerce-csv"
                      ? (ko ? "판매내역 파일을 올리면 매출 분석이 시작돼요" : "Upload sales CSV to start analysis")
                      : (ko ? "GA4·웹훅으로 지표를 자동 수집할 수 있어요" : "Auto-collect metrics via GA4 & webhooks")}
                </div>
                <div style={{ ...diagFine, color: "rgba(255,255,255,0.6)" }}>
                  {ko ? "1분이면 됩니다 — 연동하면 위 진단이 실측으로 바뀝니다." : "Takes 1 min — diagnostics switch to real data."}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // 완료 후 홈 마운트 시 내 정보 → 데이터 연결 카드로 자동 이동 (starter-stage-demo 가 소비)
                    try { window.sessionStorage.setItem("buildup:open-data-connect", "1"); } catch { /* storage 불가 시 안내 문구로 충분 */ }
                    handleComplete();
                  }}
                  style={{
                    marginTop: "12px", width: "100%", padding: "12px 0", borderRadius: "11px",
                    border: "none", background: "#fff", color: "var(--primary)",
                    fontSize: "13.5px", fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {ko ? "지금 연동하러 가기 →" : "Connect now →"}
                </button>
              </div>
            </>
          );
        })()}

        {/* Footer */}
        <div style={footerStyle}>
          <span />
          {step < TOTAL_STEPS ? (
            <button type="button" style={primaryBtnStyle} onClick={next}>
              {ko ? "다음" : "Next"}
            </button>
          ) : (
            <button type="button" style={{ ...styles.primaryButton, padding: "14px 28px", fontSize: "16px" }} onClick={handleComplete}>
              {ko ? "대시보드로 시작하기 →" : "Start dashboard →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
