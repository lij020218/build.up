"use client";

import { useState } from "react";
import type { RoadmapGenerationResult } from "@build-up/ai";

type Step = "idea" | "budget" | "region" | "storeName" | "generating" | "review" | "complete";

type Props = {
  language: "ko" | "en";
  onComplete: (result: RoadmapGenerationResult, storeName: string) => void;
  onBack: () => void;
};

const fmt = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return "—";
  const abs = Math.abs(Math.round(n));
  if (abs >= 10000) return `${Math.floor(abs / 10000).toLocaleString()}만원`;
  return `${abs.toLocaleString()}원`;
};

export default function AIRoadmapWizard({ language, onComplete, onBack }: Props) {
  const ko = language === "ko";
  const [step, setStep] = useState<Step>("idea");
  const [ideaText, setIdeaText] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [budgetText, setBudgetText] = useState("");
  const [region, setRegion] = useState("");
  const [storeName, setStoreName] = useState("");
  const [teamSize, setTeamSize] = useState<number | null>(null);
  const [result, setResult] = useState<RoadmapGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [genProgress, setGenProgress] = useState(0);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const genSteps = ko
    ? ["업종 분석", "상권 데이터 조회", "예산 배분 계산", "인테리어 설계", "필수 인허가 확인", "공급업체 추천", "운영 채널 설정", "리스크 분석"]
    : ["Industry analysis", "Market data", "Budget allocation", "Interior planning", "Permits check", "Supplier matching", "Channel setup", "Risk analysis"];

  // ── API 호출 ──
  const handleGenerate = async () => {
    setStep("generating");
    setGenProgress(0);
    setError(null);

    // 체크마크 애니메이션
    const interval = setInterval(() => {
      setGenProgress((prev) => {
        if (prev >= genSteps.length - 1) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 2000);

    try {
      const { supabase } = await import("../../../lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/ai/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({
          ideaText,
          budget: budget ?? undefined,
          region: region || undefined,
          storeName: storeName || undefined,
          teamSize: teamSize ?? undefined,
          language,
        }),
      });
      clearInterval(interval);
      setGenProgress(genSteps.length);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "생성 실패");
      }

      const data: RoadmapGenerationResult = await res.json();
      setResult(data);
      setStep("review");
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : String(err));
      setStep("idea");
    }
  };

  // ── Step: 아이디어 입력 ──
  if (step === "idea") {
    return (
      <main style={shell}>
        <div style={card}>
          <button type="button" onClick={onBack} style={backBtn}>
            ← {ko ? "뒤로" : "Back"}
          </button>

          <div style={header}>
            <div style={eyebrow}>build.up AI</div>
            <h1 style={title}>{ko ? "어떤 사업을 시작하고 싶으세요?" : "What business do you want to start?"}</h1>
            <p style={subtitle}>
              {ko ? "자유롭게 설명해주세요. 한 줄이든 긴 설명이든 괜찮습니다. AI가 분석해서 맞춤 로드맵을 만들어드립니다." : "Describe your idea freely. AI will analyze it and build a custom roadmap."}
            </p>
          </div>

          <textarea
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder={ko ? "예: 강남역 근처에서 건강한 샐러드와 포케를 전문으로 하는 가게를 열고 싶어요. 배달과 매장 운영을 병행하면서, 직장인 점심 수요를 공략하고 싶습니다..." : "e.g., I want to open a salad bar near Gangnam station..."}
            style={textareaStyle}
            rows={5}
          />

          {/* 예시 칩 */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
            {[
              ko ? "마포구에서 1인 카페 창업" : "Solo cafe in Mapo",
              ko ? "온라인 반려동물 용품 쇼핑몰" : "Online pet supplies store",
              ko ? "AI 기반 B2B SaaS 스타트업" : "AI B2B SaaS startup",
            ].map((ex) => (
              <button key={ex} type="button" onClick={() => setIdeaText(ex)} style={chipBtn}>
                {ex}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "12px", background: "rgba(180,35,24,0.06)", fontSize: "13px", color: "#b42318" }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep("budget")}
            disabled={ideaText.trim().length < 5}
            style={{ ...primaryBtn, marginTop: "20px", opacity: ideaText.trim().length < 5 ? 0.35 : 1 }}
          >
            {ko ? "다음" : "Continue"}
          </button>
        </div>
      </main>
    );
  }

  // ── Step: 예산 입력 ──
  if (step === "budget") {
    return (
      <main style={shell}>
        <div style={card}>
          <button type="button" onClick={() => setStep("idea")} style={backBtn}>
            ← {ko ? "뒤로" : "Back"}
          </button>
          <div style={header}>
            <div style={eyebrow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M8 9.5c0-1.1 1.8-2 4-2s4 .9 4 2-1.8 2-4 2-4 .9-4 2 1.8 2 4 2 4-.9 4-2" /></svg>
              {ko ? "2단계: 예산" : "Step 2: Budget"}
            </div>
            <h1 style={title}>{ko ? "예상 창업 자금은 얼마인가요?" : "What's your estimated budget?"}</h1>
            <p style={subtitle}>{ko ? "대략적인 금액이면 충분합니다" : "A rough estimate is fine"}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: ko ? "3천만원 이하" : "Under 30M", value: 30000000 },
              { label: ko ? "3-5천만원" : "30-50M", value: 50000000 },
              { label: ko ? "5천-1억" : "50M-100M", value: 100000000 },
              { label: ko ? "1억 이상" : "Over 100M", value: 150000000 },
            ].map((opt) => (
              <button key={opt.value} type="button" onClick={() => { setBudget(opt.value); setBudgetText(String(Math.round(opt.value / 10000))); }}
                style={{ ...optionBtn, borderColor: budget === opt.value ? "#7c3aed" : "rgba(99,61,225,0.1)", background: budget === opt.value ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.8)" }}>
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px" }}>
            <span style={{ fontSize: "13px", color: "rgba(15,23,42,0.4)" }}>{ko ? "또는" : "or"}</span>
            <input type="text" inputMode="numeric" value={budgetText}
              onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setBudgetText(v); setBudget(v ? Number(v) * 10000 : null); }}
              placeholder={ko ? "직접 입력 (만원)" : "Enter amount (만원)"}
              style={inputStyle} />
          </div>

          <button type="button" onClick={() => { if (!budget) setBudget(50000000); setStep("region"); }}
            style={{ ...primaryBtn, marginTop: "24px" }}>
            {ko ? "다음" : "Continue"}
          </button>
        </div>
      </main>
    );
  }

  // ── Step: 상권 입력 ──
  if (step === "region") {
    return (
      <main style={shell}>
        <div style={card}>
          <button type="button" onClick={() => setStep("budget")} style={backBtn}>
            ← {ko ? "뒤로" : "Back"}
          </button>
          <div style={header}>
            <div style={eyebrow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {ko ? "3단계: 상권" : "Step 3: Location"}
            </div>
            <h1 style={title}>{ko ? "희망 지역이 있으신가요?" : "Do you have a preferred location?"}</h1>
            <p style={subtitle}>{ko ? "구/동 수준이면 충분합니다. 없으면 AI가 추천합니다." : "District level is enough. AI will recommend if blank."}</p>
          </div>

          <input type="text" value={region} onChange={(e) => setRegion(e.target.value)}
            placeholder={ko ? "예: 강남구 역삼동, 마포구 망원동" : "e.g., Gangnam Yeoksam, Mapo Mangwon"}
            style={inputStyle} />

          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button type="button" onClick={() => setStep("storeName")}
              style={{ ...primaryBtn, flex: 1 }}>
              {ko ? "다음" : "Continue"}
            </button>
            <button type="button" onClick={() => { setRegion(""); setStep("storeName"); }}
              style={{ ...secondaryBtn, whiteSpace: "nowrap" as const }}>
              {ko ? "건너뛰기" : "Skip"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Step: 상호명 입력 ──
  if (step === "storeName") {
    return (
      <main style={shell}>
        <div style={card}>
          <button type="button" onClick={() => setStep("region")} style={backBtn}>
            ← {ko ? "뒤로" : "Back"}
          </button>
          <div style={header}>
            <div style={eyebrow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
              </svg>
              {ko ? "4단계: 상호명" : "Step 4: Store Name"}
            </div>
            <h1 style={title}>{ko ? "상호명을 정하셨나요?" : "Have you decided on a name?"}</h1>
            <p style={subtitle}>{ko ? "없으면 나중에 정해도 됩니다. AI가 업종에 맞는 이름을 제안할 수도 있어요." : "You can decide later. AI can suggest a name based on your business type."}</p>
          </div>

          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder={ko ? "예: 그린보울, 맑은샐러드, Fresh Lab" : "e.g., Green Bowl, Fresh Lab"}
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button type="button" onClick={handleGenerate}
              style={{ ...primaryBtn, flex: 1 }}>
              {ko ? "로드맵 생성하기" : "Generate Roadmap"}
            </button>
            <button type="button" onClick={() => { setStoreName(""); handleGenerate(); }}
              style={{ ...secondaryBtn, whiteSpace: "nowrap" as const }}>
              {ko ? "건너뛰기" : "Skip"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Step: 생성 중 ──
  if (step === "generating") {
    return (
      <main style={shell}>
        <div style={{ ...card, textAlign: "center" as const }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginBottom: "24px" }}>
            {ko ? "로드맵을 구성하고 있습니다" : "Building your roadmap"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px", textAlign: "left" as const }}>
            {genSteps.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: i < genProgress ? "#177245" : i === genProgress ? "#2563eb" : "rgba(15,23,42,0.06)",
                  transition: "all 0.3s ease",
                }}>
                  {i < genProgress ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : i === genProgress ? (
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />
                  ) : null}
                </div>
                <span style={{ fontSize: "14px", fontWeight: i <= genProgress ? 600 : 400, color: i <= genProgress ? "#0f172a" : "rgba(15,23,42,0.3)" }}>
                  {s}{i === genProgress ? "..." : i < genProgress ? (ko ? " 완료" : " Done") : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── Step: 리뷰 ──
  if (step === "review" && result) {
    const ba = result.budgetAllocation;
    const totalBudget = ba.total || (ba.deposit + ba.interior + ba.equipment + ba.workingCapital);

    // 예산 비율 계산
    const budgetItems = [
      { label: ko ? "보증금" : "Deposit", value: ba.deposit, color: "#3b82f6" },
      { label: ko ? "인테리어" : "Interior", value: ba.interior, color: "#8b5cf6" },
      { label: ko ? "설비" : "Equipment", value: ba.equipment, color: "#06b6d4" },
      { label: ko ? "운전자금" : "Working", value: ba.workingCapital, color: "#10b981" },
    ].filter(b => b.value > 0);

    return (
      <main style={{ ...shell, alignItems: "flex-start", paddingTop: "48px" }}>
        <div style={{ width: "100%", maxWidth: "820px" }}>
          {/* 헤더 */}
          <div style={{ textAlign: "center" as const, marginBottom: "36px" }}>
            <div style={{ ...eyebrow, justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6z" /></svg>
              build.up AI
            </div>
            <h1 style={{ ...title, fontSize: "clamp(26px, 4vw, 34px)", textAlign: "center" as const }}>{ko ? "로드맵 초안이 완성되었습니다" : "Your roadmap is ready"}</h1>
            <p style={{ ...subtitle, textAlign: "center" as const }}>{storeName ? `${storeName} · ` : ""}{result.parsed.industryLabel} · {result.parsed.preferredRegion || (ko ? "지역 미정" : "Location TBD")} · {fmt(totalBudget)}</p>
          </div>

          {/* 카드 레이아웃 */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>

            {/* Row 1: 업종 + 인허가 + 운영 채널 — 3열 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              {/* 업종 */}
              <div style={rvCard}>
                <div style={rvIconWrap("#e0edff", "#3b7ddd")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b7ddd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21V8l9-5 9 5v13" /><path d="M9 21v-6h6v6" />
                  </svg>
                </div>
                <div style={rvLabel}>{ko ? "업종" : "Industry"}</div>
                <div style={{ ...rvValue, fontSize: "16px" }}>{result.parsed.industryLabel}</div>
                <div style={rvSub}>{result.parsed.startupType === "franchise" ? (ko ? "프랜차이즈" : "Franchise") : (ko ? "독립 창업" : "Independent")}</div>
              </div>
              {/* 인허가 */}
              <div style={rvCard}>
                <div style={rvIconWrap("#dbeafe", "#2563eb")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" />
                  </svg>
                </div>
                <div style={rvLabel}>{ko ? "필수 인허가" : "Permits"}</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "4px", marginTop: "6px" }}>
                  {result.recommendations.permits.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#2563eb" strokeWidth="1" fill="rgba(37,99,235,0.08)" /><path d="M3.5 6l2 2 3-3.5" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span style={{ fontSize: "12px", color: "#0f172a" }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* 운영 채널 */}
              <div style={rvCard}>
                <div style={rvIconWrap("#fce7f3", "#db2777")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                  </svg>
                </div>
                <div style={rvLabel}>{ko ? "운영 채널" : "Channels"}</div>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" as const, marginTop: "6px" }}>
                  {[...result.recommendations.deliveryPlatforms, ...result.recommendations.snsChannels].map((ch, i) => (
                    <span key={i} style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "999px", background: "rgba(219,39,119,0.06)", color: "#db2777" }}>{ch}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: 상권 분석 — 전체 너비 */}
            <div style={rvCard}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={rvIconWrap("#fef3c7", "#d97706")}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <div style={rvLabel}>{ko ? "상권 분석" : "Market Analysis"}</div>
                    <div style={{ ...rvValue, fontSize: "16px" }}>{result.parsed.preferredRegion || "—"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    fontSize: "14px", fontWeight: 800, lineHeight: 1,
                    padding: "5px 12px", borderRadius: "10px",
                    background: result.marketAnalysis.grade === "S" ? "#fef3c7" : result.marketAnalysis.grade === "A" ? "#d1fae5" : result.marketAnalysis.grade === "B" ? "#dbeafe" : result.marketAnalysis.grade === "C" ? "#fef3c7" : "#fee2e2",
                    color: result.marketAnalysis.grade === "S" ? "#92400e" : result.marketAnalysis.grade === "A" ? "#065f46" : result.marketAnalysis.grade === "B" ? "#1e40af" : result.marketAnalysis.grade === "C" ? "#92400e" : "#991b1b",
                  }}>{result.marketAnalysis.grade}</div>
                  <span style={{ fontSize: "18px", fontWeight: 750, color: result.marketAnalysis.score >= 75 ? "#059669" : result.marketAnalysis.score >= 50 ? "#d97706" : "#dc2626" }}>{result.marketAnalysis.score}<span style={{ fontSize: "12px", fontWeight: 500, color: "rgba(15,23,42,0.35)" }}>/100</span></span>
                </div>
              </div>
              {/* 점수 바 */}
              <div style={{ height: "5px", borderRadius: "3px", background: "rgba(15,23,42,0.06)", overflow: "hidden", marginTop: "14px" }}>
                <div style={{ height: "100%", borderRadius: "3px", width: `${result.marketAnalysis.score}%`, background: result.marketAnalysis.score >= 75 ? "#059669" : result.marketAnalysis.score >= 50 ? "#d97706" : "#dc2626", transition: "width 0.4s ease" }} />
              </div>
              {/* 세부 지표 — 4열 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginTop: "12px" }}>
                {[
                  { label: ko ? "유동인구" : "Foot traffic", value: result.marketAnalysis.footTraffic },
                  { label: ko ? "경쟁 밀도" : "Competition", value: result.marketAnalysis.competition },
                  { label: ko ? "임대료" : "Rent level", value: result.marketAnalysis.rentLevel },
                  { label: ko ? "타겟 적합도" : "Target fit", value: result.marketAnalysis.targetFit },
                ].filter(m => m.value).map((m, i) => (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(217,119,6,0.04)" }}>
                    <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(15,23,42,0.4)", marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{m.label}</div>
                    <div style={{ fontSize: "12px", color: "#0f172a", lineHeight: 1.4 }}>{m.value}</div>
                  </div>
                ))}
              </div>
              {result.marketAnalysis.summary && (
                <div style={{ marginTop: "10px", fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.5, padding: "10px 12px", borderRadius: "12px", background: "rgba(217,119,6,0.03)", borderLeft: "3px solid rgba(217,119,6,0.25)" }}>
                  {result.marketAnalysis.summary}
                </div>
              )}
            </div>

            {/* Row 3: 예산 배분 — 전체 너비 */}
            <div style={rvCard}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={rvIconWrap("#ede9fe", "#7c3aed")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v12M8 9.5c0-1.1 1.8-2 4-2s4 .9 4 2-1.8 2-4 2-4 .9-4 2 1.8 2 4 2 4-.9 4-2" />
                  </svg>
                </div>
                <div>
                  <div style={rvLabel}>{ko ? "예산 배분" : "Budget"}</div>
                  <div style={{ fontSize: "16px", fontWeight: 720, color: "#0f172a" }}>{fmt(totalBudget)}</div>
                </div>
              </div>
              <div style={{ display: "flex", height: "10px", borderRadius: "5px", overflow: "hidden" }}>
                {budgetItems.map(b => (
                  <div key={b.label} style={{ width: `${totalBudget > 0 ? (b.value / totalBudget) * 100 : 0}%`, background: b.color, transition: "width 0.4s ease" }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: "16px", marginTop: "10px", flexWrap: "wrap" as const }}>
                {budgetItems.map(b => (
                  <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: b.color }} />
                    <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)" }}>{b.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a" }}>{fmt(b.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 4: 공급업체 — 전체 너비 */}
            <div style={rvCard}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={rvIconWrap("#d1fae5", "#059669")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><path d="M3.3 7L12 12l8.7-5M12 22V12" />
                  </svg>
                </div>
                <div style={rvLabel}>{ko ? "추천 공급업체" : "Suppliers"} · {result.recommendations.suppliers.length}{ko ? "곳" : ""}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {result.recommendations.suppliers.map((s, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: "14px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a" }}>{s.name}</div>
                      {s.category && <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: "rgba(5,150,105,0.08)", color: "#059669", whiteSpace: "nowrap" as const }}>{s.category}</span>}
                    </div>
                    {s.reason && <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", marginTop: "4px", lineHeight: 1.4 }}>{s.reason}</div>}
                    {s.priceRange && <div style={{ fontSize: "11px", fontWeight: 600, color: "#059669", marginTop: "3px" }}>{s.priceRange}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Row 5: 인테리어 — 전체 너비 */}
            {result.recommendations.interior.length > 0 && (
              <div style={rvCard}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={rvIconWrap("#fef9c3", "#a16207")}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" />
                    </svg>
                  </div>
                  <div style={rvLabel}>{ko ? "인테리어 · 집기 · 장비" : "Interior · Fixtures · Equipment"}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {result.recommendations.interior.map((it, i) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: "14px", background: "rgba(161,98,7,0.04)", border: "1px solid rgba(161,98,7,0.08)" }}>
                      <div style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a" }}>{it.item}</div>
                      <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", marginTop: "2px" }}>{it.vendor}</div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#a16207", marginTop: "2px" }}>{it.estimatedCost}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Row 6: 타임라인 — 전체 너비 */}
            <div style={rvCard}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={rvIconWrap("#e0e7ff", "#4f46e5")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div style={rvLabel}>{ko ? "타임라인" : "Timeline"} · {result.timeline.totalWeeks}{ko ? "주" : " weeks"}</div>
              </div>
              {/* 타임라인 바 */}
              <div style={{ display: "flex", gap: "2px", marginTop: "12px" }}>
                {result.timeline.phases.map((p, i) => {
                  const pct = result.timeline.totalWeeks > 0 ? (p.weeks / result.timeline.totalWeeks) * 100 : 0;
                  const colors = ["#4f46e5", "#7c3aed", "#2563eb", "#0891b2", "#059669", "#d97706"];
                  return (
                    <div key={i} style={{ width: `${pct}%`, display: "flex", flexDirection: "column" as const, alignItems: "center", minWidth: "40px" }}>
                      <div style={{ width: "100%", height: "8px", borderRadius: i === 0 ? "4px 0 0 4px" : i === result.timeline.phases.length - 1 ? "0 4px 4px 0" : "0", background: colors[i % colors.length] }} />
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.5)", marginTop: "6px", textAlign: "center" as const, lineHeight: 1.2 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.35)" }}>{p.weeks}{ko ? "주" : "w"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 리스크 */}
          {result.risks.length > 0 && (
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              {result.risks.map((r, i) => (
                <div key={i} style={{ padding: "16px 18px", borderRadius: "20px", background: r.level === "high" ? "rgba(220,38,38,0.04)" : "rgba(245,158,11,0.04)", border: `1px solid ${r.level === "high" ? "rgba(220,38,38,0.08)" : "rgba(245,158,11,0.08)"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={r.level === "high" ? "#dc2626" : "#f59e0b"} strokeWidth="2" strokeLinecap="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4M12 17h.01" />
                    </svg>
                    <span style={{ fontSize: "14px", fontWeight: 650, color: r.level === "high" ? "#dc2626" : "#b45309" }}>{r.description}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", paddingLeft: "24px", lineHeight: 1.5 }}>{ko ? "대응: " : "Action: "}{r.mitigation}</div>
                </div>
              ))}
            </div>
          )}

          {/* 버튼 */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", justifyContent: "center" }}>
            <button type="button" onClick={() => onComplete(result, storeName)} style={{ ...primaryBtn, maxWidth: "320px" }}>
              {ko ? "이대로 진행하기" : "Proceed with this plan"}
            </button>
            <button type="button" onClick={() => { setStep("idea"); setResult(null); }} style={secondaryBtn}>
              {ko ? "다시 생성" : "Regenerate"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Step: 완료 ──
  return (
    <main style={shell}>
      <div style={{ ...card, textAlign: "center" as const }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>✨</div>
        <h1 style={title}>{ko ? "로드맵 완성!" : "Roadmap Complete!"}</h1>
        <p style={subtitle}>{ko ? "대시보드에서 경영을 시작하세요" : "Start managing from your dashboard"}</p>
      </div>
    </main>
  );
}

/* ─── Styles ─── */

const shell: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background: "var(--bg, #f7f6f3)",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "580px",
  padding: "44px 40px",
  borderRadius: "32px",
  background: "linear-gradient(160deg, rgba(247,244,255,0.9) 0%, rgba(255,255,255,0.98) 50%, rgba(255,255,255,1) 100%)",
  border: "1px solid rgba(99,61,225,0.06)",
  boxShadow: "0 12px 48px rgba(99,61,225,0.06), 0 1px 0 rgba(255,255,255,0.8) inset",
  backdropFilter: "blur(16px)",
};

const header: React.CSSProperties = { marginBottom: "28px" };

const eyebrow: React.CSSProperties = {
  fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em",
  textTransform: "uppercase", color: "#7c3aed", marginBottom: "14px",
  display: "flex", alignItems: "center", gap: "8px",
};

const title: React.CSSProperties = {
  fontSize: "clamp(24px, 4vw, 30px)", fontWeight: 750, letterSpacing: "-0.04em",
  color: "#0f172a", margin: "0 0 10px", lineHeight: 1.1,
};

const subtitle: React.CSSProperties = {
  fontSize: "15px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6, margin: 0,
};

const backBtn: React.CSSProperties = {
  fontSize: "14px", fontWeight: 600, color: "#7c3aed",
  background: "none", border: "none", cursor: "pointer",
  padding: "0 0 20px", display: "flex", alignItems: "center", gap: "4px",
};

const textareaStyle: React.CSSProperties = {
  width: "100%", padding: "18px 20px", borderRadius: "20px",
  border: "1.5px solid rgba(99,61,225,0.12)", fontSize: "16px",
  lineHeight: 1.65, resize: "none", outline: "none",
  background: "rgba(255,255,255,0.8)", boxSizing: "border-box",
  minHeight: "140px",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

const chipBtn: React.CSSProperties = {
  fontSize: "13px", fontWeight: 550, padding: "8px 16px",
  borderRadius: "999px", border: "1px solid rgba(99,61,225,0.1)",
  background: "rgba(255,255,255,0.9)", cursor: "pointer", color: "#7c3aed",
  transition: "background 0.15s ease, border-color 0.15s ease",
};

const primaryBtn: React.CSSProperties = {
  width: "100%", padding: "17px", borderRadius: "16px",
  border: "none",
  background: "linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%)",
  color: "#fff", fontSize: "16px", fontWeight: 660, cursor: "pointer",
  transition: "opacity 0.15s ease, transform 0.15s ease",
  boxShadow: "0 4px 16px rgba(99,61,225,0.2)",
};

const secondaryBtn: React.CSSProperties = {
  padding: "16px 24px", borderRadius: "14px",
  border: "1px solid rgba(15,23,42,0.08)", background: "#fff",
  color: "#0f172a", fontSize: "16px", fontWeight: 650, cursor: "pointer",
};

const optionBtn: React.CSSProperties = {
  padding: "16px", borderRadius: "14px",
  border: "2px solid", background: "#fff",
  cursor: "pointer", fontSize: "14px", fontWeight: 600,
  textAlign: "center", transition: "all 0.15s ease",
};

const inputStyle: React.CSSProperties = {
  flex: 1, padding: "12px 16px", borderRadius: "12px",
  border: "1.5px solid rgba(15,23,42,0.1)", fontSize: "15px",
  outline: "none", background: "#fff", boxSizing: "border-box",
};

const rvCard: React.CSSProperties = {
  padding: "24px", borderRadius: "24px",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(15,23,42,0.05)",
  boxShadow: "0 2px 12px rgba(15,23,42,0.04)",
};

const rvIconWrap = (bg: string, _stroke: string): React.CSSProperties => ({
  width: "40px", height: "40px", borderRadius: "12px",
  display: "flex", alignItems: "center", justifyContent: "center",
  background: bg, marginBottom: "12px",
});

const rvLabel: React.CSSProperties = {
  fontSize: "12px", fontWeight: 650, letterSpacing: "0.06em",
  textTransform: "uppercase", color: "rgba(15,23,42,0.4)", marginBottom: "4px",
};

const rvValue: React.CSSProperties = {
  fontSize: "18px", fontWeight: 720, color: "#0f172a", lineHeight: 1.3,
};

const rvSub: React.CSSProperties = {
  fontSize: "13px", color: "rgba(15,23,42,0.45)", marginTop: "2px",
};
