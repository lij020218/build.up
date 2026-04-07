"use client";

import { useState } from "react";
import {
  starterIndustryCategories,
  starterIndustryOptions,
  getStarterBusinessModelOptions,
  localizeStarterIndustryCategory,
  localizeRecommendationItem,
  franchiseBrands,
  getFranchiseBrandsForCategory,
  getIndustryCategoryIdByOptionId,
  type StarterIndustryCategory,
} from "@build-up/shared";
import { styles } from "../styles";

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
};

type Props = {
  language: "ko" | "en";
  onComplete: (result: OnboardingResult) => void;
  onBack: () => void;
};

const TOTAL_STEPS = 6;

export function ExistingBusinessOnboarding({ language, onComplete, onBack }: Props) {
  const ko = language === "ko";
  const [step, setStep] = useState(1);

  // Step 1: Industry
  const [categoryId, setCategoryId] = useState("food");
  const [industryId, setIndustryId] = useState<string | undefined>();

  // Step 2: Store info
  const [storeName, setStoreName] = useState("");
  const [businessModelId, setBusinessModelId] = useState<string | undefined>();
  const [startupType, setStartupType] = useState<"independent" | "franchise">("independent");
  const [franchiseBrandId, setFranchiseBrandId] = useState<string | null>(null);
  const [preferredRegion, setPreferredRegion] = useState("");

  const isDeliveryBiz = categoryId === "food" || categoryId === "cafe-dessert";
  const isOnlineBiz = categoryId === "online-digital";
  const isStartupBiz = categoryId === "startup-tech";
  const businessTypeOptions: Array<"independent" | "franchise"> = isStartupBiz
    ? ["independent"]
    : ["independent", "franchise"];

  // Step 3: Tax & admin
  const [vatType, setVatType] = useState<"general" | "simplified">("general");
  const [hasEmployees, setHasEmployees] = useState(false);
  const [cpaDecision, setCpaDecision] = useState<"cpa" | "self">("self");
  const [launchDate, setLaunchDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Step 4: Monthly costs
  const [costIngredients, setCostIngredients] = useState("");
  const [costLabor, setCostLabor] = useState("");
  const [costRent, setCostRent] = useState("");
  const [costUtilities, setCostUtilities] = useState("");
  const [costOther, setCostOther] = useState("");
  const [capitalText, setCapitalText] = useState("");

  // Step 5: Channels
  const [deliveryPlatforms, setDeliveryPlatforms] = useState<string[]>([]);
  const [courierServices, setCourierServices] = useState<string[]>([]);
  const [snsChannels, setSnsChannels] = useState<string[]>([]);

  const parseManwon = (v: string): number => {
    const cleaned = v.replace(/\s/g, "").replace(/원$/, "");
    let total = 0;
    const eokMatch = cleaned.match(/([\d.]+)\s*억/);
    if (eokMatch) total += parseFloat(eokMatch[1]) * 100_000_000;
    const cheonmanMatch = cleaned.match(/([\d.]+)\s*천만/);
    if (cheonmanMatch) { total += parseFloat(cheonmanMatch[1]) * 10_000_000; }
    else { const manMatch = cleaned.match(/([\d.]+)\s*만/); if (manMatch) total += parseFloat(manMatch[1]) * 10_000; }
    if (total === 0) { const digits = cleaned.replace(/[^\d]/g, ""); return (parseInt(digits, 10) || 0) * 10_000; }
    return total;
  };
  const canNext = (): boolean => {
    if (step === 1) return Boolean(industryId);
    if (step === 2) return Boolean(storeName.trim()) && Boolean(businessModelId);
    if (step === 3) return Boolean(launchDate);
    if (step === 4) return Boolean(costRent);
    return true;
  };

  const handleComplete = () => {
    if (!industryId || !businessModelId) return;
    onComplete({
      industryId,
      industryCategoryId: categoryId,
      storeName: storeName.trim(),
      businessModelId,
      preferredRegion: preferredRegion.trim(),
      startupType,
      franchiseBrandId,
      vatType,
      hasEmployees,
      cpaDecision,
      launchDate,
      monthlyCosts: {
        ingredients: parseManwon(costIngredients),
        labor: parseManwon(costLabor),
        rent: parseManwon(costRent),
        utilities: parseManwon(costUtilities),
        other: parseManwon(costOther),
      },
      capital: parseManwon(capitalText),
      deliveryPlatforms,
      snsChannels,
    });
  };

  const [showValidation, setShowValidation] = useState(false);
  const next = () => {
    if (canNext()) { setShowValidation(false); setStep((s) => Math.min(s + 1, TOTAL_STEPS)); }
    else { setShowValidation(true); }
  };
  const prev = () => { setShowValidation(false); setStep((s) => Math.max(s - 1, 1)); };

  // Shared styles
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, rgba(29,53,87,0.08), transparent 32%), #f7f6f3",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 24px",
  };
  const containerStyle: React.CSSProperties = {
    maxWidth: "640px",
    width: "100%",
    marginTop: "clamp(48px, 10vh, 120px)",
    marginBottom: "80px",
  };
  const eyebrowStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "var(--muted)",
    marginBottom: "12px",
  };
  const titleStyle: React.CSSProperties = {
    fontSize: "clamp(28px, 5vw, 40px)",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    color: "var(--text)",
    marginBottom: "12px",
  };
  const subtitleStyle: React.CSSProperties = {
    fontSize: "17px",
    lineHeight: 1.6,
    color: "var(--muted)",
    marginBottom: "36px",
  };
  const progressStyle: React.CSSProperties = {
    display: "flex",
    gap: "6px",
    marginBottom: "32px",
  };
  const dotStyle = (active: boolean): React.CSSProperties => ({
    width: active ? "28px" : "8px",
    height: "8px",
    borderRadius: "4px",
    background: active ? "var(--primary)" : "rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
  });
  const cardStyle: React.CSSProperties = {
    borderRadius: "24px",
    border: "1px solid rgba(255,255,255,0.78)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.8) 100%)",
    boxShadow: "0 12px 28px rgba(17,17,17,0.05)",
    backdropFilter: "blur(16px)",
    padding: "28px",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--muted)",
    marginBottom: "8px",
    letterSpacing: "0.02em",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: "14px",
    border: "1px solid rgba(17,17,17,0.08)",
    background: "#fff",
    padding: "14px 16px",
    fontSize: "16px",
    color: "var(--text)",
    outline: "none",
    boxSizing: "border-box" as const,
  };
  const chipStyle = (selected: boolean): React.CSSProperties => ({
    borderRadius: "999px",
    border: selected ? "1.5px solid rgba(29,53,87,0.3)" : "1.5px solid transparent",
    background: selected ? "rgba(29,53,87,0.07)" : "rgba(0,0,0,0.04)",
    color: selected ? "var(--primary)" : "var(--muted)",
    padding: "10px 18px",
    fontSize: "15px",
    fontWeight: selected ? 600 : 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: selected ? "0 2px 8px rgba(17,17,17,0.06)" : "none",
  });
  const choiceCardStyle = (selected: boolean): React.CSSProperties => ({
    borderRadius: "20px",
    border: selected ? "1px solid rgba(29,53,87,0.22)" : "1px solid rgba(17,17,17,0.06)",
    background: selected
      ? "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)"
      : "rgba(255,255,255,0.7)",
    boxShadow: selected
      ? "0 0 0 4px rgba(29,53,87,0.07), 0 12px 24px rgba(17,17,17,0.05)"
      : "0 4px 12px rgba(17,17,17,0.03)",
    padding: "20px 24px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left" as const,
  });
  const footerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "32px",
    gap: "12px",
  };
  const primaryBtnStyle: React.CSSProperties = {
    ...styles.primaryButton,
    padding: "14px 28px",
    fontSize: "16px",
    opacity: canNext() ? 1 : 0.4,
  };
  const secondaryBtnStyle: React.CSSProperties = {
    ...styles.button,
    padding: "14px 20px",
    fontSize: "15px",
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

  // === RENDER ===
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Progress dots */}
        <div style={progressStyle}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} style={dotStyle(i + 1 === step)} />
          ))}
        </div>

        {/* Step 1: Industry */}
        {step === 1 && (
          <>
            <div style={eyebrowStyle}>{ko ? "1단계" : "Step 1"}</div>
            <div style={titleStyle}>{ko ? "어떤 사업을 운영하고 계신가요?" : "What business do you run?"}</div>
            <div style={subtitleStyle}>
              {ko
                ? "업종을 선택하면 맞춤형 관리 도구가 활성화됩니다."
                : "Select your industry to activate tailored management tools."}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
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
                      <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>{opt.title}</div>
                    </button>
                  );
                })}
            </div>
          </>
        )}

        {/* Step 2: Store info */}
        {step === 2 && (
          <>
            <div style={eyebrowStyle}>{ko ? "2단계" : "Step 2"}</div>
            <div style={titleStyle}>{ko ? "가게 정보를 알려주세요" : "Tell us about your store"}</div>
            <div style={subtitleStyle}>
              {ko ? "홈 대시보드에 표시됩니다." : "This will appear on your home dashboard."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <div style={labelStyle}>{ko ? "가게 이름" : "Store name"}</div>
                <input
                  style={{ ...inputStyle, ...(showValidation && !storeName.trim() ? { borderColor: "#ff3b30", boxShadow: "0 0 0 3px rgba(255,59,48,0.1)" } : {}) }}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder={ko ? "예: 성수 커피랩" : "e.g. Seongsu Coffee Lab"}
                />
                {showValidation && !storeName.trim() && (
                  <div style={{ fontSize: "12px", color: "#ff3b30", marginTop: "6px" }}>
                    {ko ? "가게 이름을 입력해주세요" : "Please enter a store name"}
                  </div>
                )}
              </div>
              <div>
                <div style={labelStyle}>{ko ? "사업 유형" : "Business type"}</div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {businessTypeOptions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      style={chipStyle(startupType === t)}
                      onClick={() => { setStartupType(t); setFranchiseBrandId(null); }}
                    >
                      {t === "independent" ? (ko ? "독립 창업" : "Independent") : (ko ? "프랜차이즈" : "Franchise")}
                    </button>
                  ))}
                </div>
              </div>
              {startupType === "franchise" && (
                <div>
                  <div style={labelStyle}>{ko ? "프랜차이즈 브랜드" : "Franchise brand"}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
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
                </div>
              )}
              <div>
                <div style={labelStyle}>{ko ? "사업 모델" : "Business model"}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {getStarterBusinessModelOptions(categoryId).map((raw) => {
                    const opt = localizeRecommendationItem(raw, language);
                    return (
                      <button
                        key={raw.id}
                        type="button"
                        style={chipStyle(businessModelId === raw.id)}
                        onClick={() => setBusinessModelId(raw.id)}
                      >
                        {opt.title}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={labelStyle}>{ko ? "가게 위치 (상권·지역)" : "Store location"}</div>
                <input
                  style={inputStyle}
                  value={preferredRegion}
                  onChange={(e) => setPreferredRegion(e.target.value)}
                  placeholder={ko
                    ? (isStartupBiz
                        ? "예: 판교, 강남, 성수, 원격"
                        : isOnlineBiz
                          ? "예: 서울 구로 (사무실/창고 지역)"
                          : "예: 서울 성수동, 부산 전포동")
                    : (isStartupBiz
                        ? "e.g. Pangyo, Gangnam, Seongsu, remote"
                        : isOnlineBiz
                          ? "e.g. Seoul Guro (office/warehouse area)"
                          : "e.g. Seongsu, Seoul")}
                />
              </div>
            </div>
          </>
        )}

        {/* Step 3: Tax & admin */}
        {step === 3 && (
          <>
            <div style={eyebrowStyle}>{ko ? "3단계" : "Step 3"}</div>
            <div style={titleStyle}>{ko ? "세무·행정 설정" : "Tax & admin settings"}</div>
            <div style={subtitleStyle}>
              {ko
                ? "세금 달력과 알림이 이 정보를 기반으로 작동합니다."
                : "Tax calendar and alerts are powered by this information."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <div style={labelStyle}>{ko ? "부가세 유형" : "VAT type"}</div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" style={chipStyle(vatType === "general")} onClick={() => setVatType("general")}>
                    {ko ? "일반과세자" : "General"}
                  </button>
                  <button type="button" style={chipStyle(vatType === "simplified")} onClick={() => setVatType("simplified")}>
                    {ko ? "간이과세자" : "Simplified"}
                  </button>
                </div>
              </div>
              <div>
                <div style={labelStyle}>{ko ? "직원 유무" : "Employees"}</div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" style={chipStyle(hasEmployees)} onClick={() => setHasEmployees(true)}>
                    {ko ? "있음" : "Yes"}
                  </button>
                  <button type="button" style={chipStyle(!hasEmployees)} onClick={() => setHasEmployees(false)}>
                    {ko ? "없음" : "No"}
                  </button>
                </div>
              </div>
              <div>
                <div style={labelStyle}>{ko ? "세무 처리 방식" : "Tax filing"}</div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" style={chipStyle(cpaDecision === "cpa")} onClick={() => setCpaDecision("cpa")}>
                    {ko ? "세무사 위임" : "CPA"}
                  </button>
                  <button type="button" style={chipStyle(cpaDecision === "self")} onClick={() => setCpaDecision("self")}>
                    {ko ? "직접 처리" : "Self-file"}
                  </button>
                </div>
              </div>
              <div>
                <div style={labelStyle}>{ko ? "개업일" : "Opening date"}</div>
                <input
                  type="date"
                  style={inputStyle}
                  value={launchDate}
                  onChange={(e) => setLaunchDate(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* Step 4: Monthly costs */}
        {step === 4 && (() => {
          const totalCost = parseManwon(costIngredients) + parseManwon(costLabor) + parseManwon(costRent) + parseManwon(costUtilities) + parseManwon(costOther);
          const rentNum = parseManwon(costRent);
          const ingNum = parseManwon(costIngredients);
          const labNum = parseManwon(costLabor);
          return (
            <>
              <div style={eyebrowStyle}>{ko ? "4단계" : "Step 4"}</div>
              <div style={titleStyle}>{ko ? "매달 비용 구조" : "Monthly cost structure"}</div>
              <div style={subtitleStyle}>
                {ko
                  ? "대략적인 금액이면 충분합니다. 나중에 수정할 수 있어요."
                  : "Rough estimates are fine. You can adjust later."}
              </div>
              <div style={cardStyle}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {[
                    { label: ko ? "재료비 (만원)" : "COGS (만원)", value: costIngredients, set: setCostIngredients, placeholder: "150" },
                    { label: ko ? "인건비 (만원)" : "Labor (만원)", value: costLabor, set: setCostLabor, placeholder: "200" },
                    { label: ko ? "월세 (만원)" : "Rent (만원)", value: costRent, set: setCostRent, placeholder: "120" },
                    { label: ko ? "공과금 (만원)" : "Utilities (만원)", value: costUtilities, set: setCostUtilities, placeholder: "30" },
                    { label: ko ? "기타 (만원)" : "Other (만원)", value: costOther, set: setCostOther, placeholder: "20" },
                    { label: ko ? "초기 투자 자본금 (만원)" : "Capital (만원)", value: capitalText, set: setCapitalText, placeholder: "5000" },
                  ].map((field) => (
                    <div key={field.label}>
                      <div style={{ ...labelStyle, marginBottom: "6px" }}>{field.label}</div>
                      <input
                        style={{ ...inputStyle, fontSize: "15px" }}
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        placeholder={field.placeholder}
                        inputMode="numeric"
                      />
                    </div>
                  ))}
                </div>
                {totalCost > 0 && (
                  <div style={{
                    marginTop: "20px",
                    padding: "16px",
                    borderRadius: "16px",
                    background: "rgba(29,53,87,0.04)",
                    display: "flex",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "2px" }}>{ko ? "월 고정비" : "Monthly fixed"}</div>
                      <div style={{ fontSize: "18px", fontWeight: 650, color: "var(--text)" }}>{Math.round(totalCost / 10000).toLocaleString()}{ko ? "만원" : "만원"}</div>
                    </div>
                    {ingNum > 0 && (
                      <div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "2px" }}>{ko ? "재료비 비중" : "COGS ratio"}</div>
                        <div style={{ fontSize: "18px", fontWeight: 650, color: ingNum / totalCost > 0.4 ? "#ff3b30" : ingNum / totalCost > 0.35 ? "#ff9f0a" : "#34c759" }}>
                          {totalCost > 0 ? ((ingNum / totalCost) * 100).toFixed(0) : 0}%
                        </div>
                      </div>
                    )}
                    {labNum > 0 && (
                      <div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "2px" }}>{ko ? "인건비 비중" : "Labor ratio"}</div>
                        <div style={{ fontSize: "18px", fontWeight: 650, color: labNum / totalCost > 0.35 ? "#ff3b30" : labNum / totalCost > 0.3 ? "#ff9f0a" : "#34c759" }}>
                          {totalCost > 0 ? ((labNum / totalCost) * 100).toFixed(0) : 0}%
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* Step 5: Channels */}
        {step === 5 && (
          <>
            <div style={eyebrowStyle}>{ko ? "5단계" : "Step 5"}</div>
            <div style={titleStyle}>{ko ? "운영 채널" : "Operating channels"}</div>
            <div style={subtitleStyle}>
              {ko
                ? "현재 사용 중인 플랫폼을 선택하세요. 수수료 분석이 활성화됩니다."
                : "Select the platforms you currently use. Fee analysis will be enabled."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* 배달 업종: 배달 앱 */}
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
                    (id) => setDeliveryPlatforms((prev) => toggleList(prev, id))
                  )}
                </div>
              )}
              {/* 온라인 업종: 마켓플레이스 + 택배사 */}
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
                      (id) => setDeliveryPlatforms((prev) => toggleList(prev, id))
                    )}
                  </div>
                  <div>
                    <div style={labelStyle}>{ko ? "택배사" : "Courier service"}</div>
                    {toggleRow(
                      [
                        { id: "cj", label: ko ? "CJ대한통운" : "CJ Logistics" },
                        { id: "hanjin", label: ko ? "한진택배" : "Hanjin" },
                        { id: "lotte", label: ko ? "롯데택배" : "Lotte" },
                        { id: "epost", label: ko ? "우체국택배" : "Korea Post" },
                        { id: "logen", label: ko ? "로젠택배" : "Logen" },
                      ],
                      courierServices,
                      (id) => setCourierServices((prev) => toggleList(prev, id))
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
                      (id) => setDeliveryPlatforms((prev) => toggleList(prev, id))
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
                      (id) => setCourierServices((prev) => toggleList(prev, id))
                    )}
                  </div>
                </>
              )}
              {/* 소매·펫 등 배송 필요 업종: 택배사 */}
              {!isDeliveryBiz && !isOnlineBiz && !isStartupBiz && ["retail", "pet", "living-service"].includes(categoryId) && (
                <div>
                  <div style={labelStyle}>{ko ? "택배사" : "Courier service"}</div>
                  {toggleRow(
                    [
                      { id: "cj", label: ko ? "CJ대한통운" : "CJ Logistics" },
                      { id: "hanjin", label: ko ? "한진택배" : "Hanjin" },
                      { id: "lotte", label: ko ? "롯데택배" : "Lotte" },
                      { id: "epost", label: ko ? "우체국택배" : "Korea Post" },
                    ],
                    deliveryPlatforms,
                    (id) => setDeliveryPlatforms((prev) => toggleList(prev, id))
                  )}
                </div>
              )}
              <div>
                <div style={labelStyle}>{ko ? "SNS 채널" : "SNS channels"}</div>
                {toggleRow(
                  [
                    { id: "instagram", label: ko ? "인스타그램" : "Instagram" },
                    { id: "naver-place", label: ko ? "네이버 플레이스" : "Naver Place" },
                    { id: "kakao-channel", label: ko ? "카카오채널" : "Kakao Channel" },
                    { id: "google-business", label: ko ? "구글 비즈니스" : "Google Business" },
                  ],
                  snsChannels,
                  (id) => setSnsChannels((prev) => toggleList(prev, id))
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 6: Complete */}
        {step === 6 && (() => {
          const cat = localizeStarterIndustryCategory(
            starterIndustryCategories.find((c) => c.id === categoryId) ?? starterIndustryCategories[0],
            language
          );
          const totalCost = parseManwon(costIngredients) + parseManwon(costLabor) + parseManwon(costRent) + parseManwon(costUtilities) + parseManwon(costOther);
          return (
            <>
              <div style={eyebrowStyle}>{ko ? "준비 완료" : "All set"}</div>
              <div style={titleStyle}>{ko ? "대시보드가 준비되었습니다" : "Your dashboard is ready"}</div>
              <div style={subtitleStyle}>
                {ko
                  ? "매일 매출을 입력하면 더 정확한 분석을 받을 수 있어요."
                  : "Enter daily sales for more accurate analytics."}
              </div>
              <div style={cardStyle}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {[
                    { label: ko ? "가게" : "Store", value: storeName || "—" },
                    { label: ko ? "업종" : "Industry", value: cat.title },
                    { label: ko ? "유형" : "Type", value: startupType === "franchise" ? (ko ? "프랜차이즈" : "Franchise") : (ko ? "독립 창업" : "Independent") },
                    { label: ko ? "부가세" : "VAT", value: vatType === "general" ? (ko ? "일반과세" : "General") : (ko ? "간이과세" : "Simplified") },
                    { label: ko ? "세무 처리" : "Tax filing", value: cpaDecision === "cpa" ? (ko ? "세무사 위임" : "CPA") : (ko ? "직접 처리" : "Self-file") },
                    { label: ko ? "월 고정비" : "Monthly costs", value: totalCost > 0 ? `${Math.round(totalCost / 10000).toLocaleString()}${ko ? "만원" : "만원"}` : "—" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "2px" }}>{item.label}</div>
                      <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "20px", padding: "14px 16px", borderRadius: "14px", background: "rgba(29,53,87,0.04)", fontSize: "14px", lineHeight: 1.6, color: "var(--muted)" }}>
                  {ko
                    ? "✓ 세금 달력 · 알림 · P&L 분석 · 원가율 진단 · 생존 진단 · 지원사업 매칭이 활성화됩니다."
                    : "✓ Tax calendar, alerts, P&L, cost health, survival check, and program matching are now active."}
                </div>
              </div>
            </>
          );
        })()}

        {/* Footer */}
        <div style={footerStyle}>
          {step === 1 ? (
            <button type="button" style={secondaryBtnStyle} onClick={onBack}>
              {ko ? "← 돌아가기" : "← Back"}
            </button>
          ) : (
            <button type="button" style={secondaryBtnStyle} onClick={prev}>
              {ko ? "← 이전" : "← Back"}
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button type="button" style={primaryBtnStyle} onClick={next} disabled={!canNext()}>
              {ko ? "다음" : "Next"}
            </button>
          ) : (
            <button type="button" style={{ ...primaryBtnStyle, opacity: 1 }} onClick={handleComplete}>
              {ko ? "내 가게 대시보드로" : "Go to my dashboard"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
