"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowLeft, Building2, ShieldCheck, Tv, MapPin, Wallet, Truck,
  Home, Clock, Users, Umbrella, Stamp, Landmark, Lightbulb, Target,
} from "lucide-react";
import type { RoadmapGenerationResult } from "@foundone/ai";
import {
  buildOwnerActions,
  buildAiDoneList,
  bankLabel,
  ownerActionTrackFor,
  type OwnerAction,
} from "@foundone/shared";
import { FloatingInspiration } from "./FloatingInspiration";

// ── 미드나이트 톤 일관 — 로드맵 단계 카드 디자인과 통일 ──
const STAGE_CARD = {
  background: "white",
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04), 0 12px 28px -16px rgba(25,25,112,0.12)",
  borderRadius: 18,
  padding: "20px 22px",
} as const;
const STAGE_ICON_BOX: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 11,
  background: "rgba(25,25,112,0.08)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
};
const STAGE_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--muted)",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
};
const STAGE_VALUE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.015em",
  marginTop: 3,
};
const STAGE_SUB: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--muted)",
  marginTop: 2,
  fontWeight: 500,
  lineHeight: 1.5,
};

/**
 * 분업 선언 — "AI가 어려운 건 해결했고, 사장님이 직접 하실 일은 이것뿐" (2026-08-03).
 *  사용자 요구 원문이 이 컴포넌트의 스펙이다: "AI가 어려운 건 해결해주고
 *  내가 해야 할 부분만 남겨주면 좋겠다." 목록은 owner-actions SSOT(결정론)에서.
 */
export function DivisionOfLabor({ result, ko }: { result: RoadmapGenerationResult; ko: boolean }) {
  const track = ownerActionTrackFor(result.parsed.industryCategoryId);
  const taxLabel = result.legal?.taxType === "simplified" ? "간이과세"
    : result.legal?.taxType === "standard" ? "일반과세"
    : result.legal?.taxType === "corporation" ? "법인" : undefined;
  const ownerActions: OwnerAction[] = buildOwnerActions({
    track,
    startupType: result.parsed.startupType,
    permitsDetailed: result.legal?.permitsDetailed,
    recommendedBankLabel: bankLabel(result.moneyInfra?.recommendedBank),
    taxTypeLabel: taxLabel,
  });
  const aiDone = buildAiDoneList({
    hasIndustryMatch: true,
    budgetAllocated: (result.budgetAllocation?.total ?? 0) > 0,
    permitCount: (result.legal?.permitsDetailed ?? result.recommendations.permits ?? []).length,
    supplierCount: (result.recommendations.suppliers ?? []).length + (result.recommendations.interiorVendors ?? []).length,
    channelCount: (result.recommendations.operationalChannels ?? []).length,
    hasTaxType: !!result.legal?.taxType,
    hasInsurance: (result.insurance ?? []).length > 0,
    hasMenuOrProducts: !!(result.industrySpecific && (
      (result.industrySpecific.menu ?? []).length > 0 ||
      (result.industrySpecific.services ?? []).length > 0 ||
      (result.industrySpecific.products ?? []).length > 0 ||
      (result.industrySpecific.memberships ?? []).length > 0
    )),
  });
  if (ownerActions.length === 0) return null;

  return (
    <div style={{ marginBottom: 18, borderRadius: 18, border: "1px solid rgba(25,25,112,0.14)", overflow: "hidden" }}>
      {/* 히어로 — 분업 선언 한 문장 */}
      <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #191970 0%, #0f0f4a 100%)" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>
          {ko ? "역할 분담" : "Division of labor"}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "white", letterSpacing: "-0.015em", lineHeight: 1.45 }}>
          {ko
            ? <>복잡한 정리는 AI가 끝냈어요. 사장님이 직접 하실 일은 <span style={{ borderBottom: "2px solid rgba(255,255,255,0.45)" }}>{ownerActions.length}가지</span>뿐이에요.</>
            : <>The AI handled the complex part. Only {ownerActions.length} things need you in person.</>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", background: "white" }}>
        {/* 왼쪽 — AI가 끝낸 것 */}
        <div style={{ padding: "18px 20px", borderRight: "1px solid rgba(25,25,112,0.08)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "rgba(15,23,42,0.45)", marginBottom: 10 }}>
            {ko ? "AI가 끝낸 것" : "Done by AI"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
            {aiDone.map((d) => (
              <div key={d} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12.5, color: "rgba(15,23,42,0.72)", lineHeight: 1.5 }}>
                <span style={{ color: "#191970", fontWeight: 700, flexShrink: 0 }}>✓</span>{d}
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽 — 사장님만 할 수 있는 일 */}
        <div style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "#191970", marginBottom: 10 }}>
            {ko ? "사장님만 할 수 있는 일" : "Only you can do"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {ownerActions.map((a, i) => (
              <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: 999, background: "rgba(25,25,112,0.08)", color: "#191970", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 650, color: "#0f172a", lineHeight: 1.4 }}>
                    {a.title}
                    {(a.estimate || a.cost) && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(15,23,42,0.45)", marginLeft: 6 }}>
                        {[a.estimate, a.cost].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(15,23,42,0.55)", lineHeight: 1.5, marginTop: 2 }}>
                    <span style={{ color: "#191970", fontWeight: 600 }}>{ko ? "준비됨: " : "Ready: "}</span>{a.aiPrepared}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 11.5, color: "rgba(15,23,42,0.45)", lineHeight: 1.5 }}>
            {ko ? "각 항목은 로드맵의 해당 단계에서 자세히 안내돼요. 소요·비용은 관공서 고지 기준의 대략치입니다." : "Each item is guided in its roadmap stage."}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 리뷰 카드 빌딩 블록 (main 컴포넌트보다 먼저 정의 — Fast Refresh 안전) ───
type StageCardProps = {
  icon: typeof Building2;
  label: string;
  hint?: string;
  compact?: boolean;
  children: React.ReactNode;
};

function StageCard({ icon: Icon, label, hint, compact, children }: StageCardProps) {
  return (
    <div style={{
      ...STAGE_CARD,
      padding: compact ? "18px 20px" : STAGE_CARD.padding,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={STAGE_ICON_BOX}>
          <Icon size={18} strokeWidth={1.5} color="#191970" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={STAGE_LABEL}>{label}</div>
          {hint && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3, fontWeight: 500, lineHeight: 1.45 }}>{hint}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={STAGE_LABEL}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 3, letterSpacing: "-0.01em", lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}

function InfraTile({ label, value, reason }: { label: string; value: string; reason: string }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(25,25,112,0.05)", border: "1px solid rgba(25,25,112,0.10)" }}>
      <div style={STAGE_LABEL}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#191970", marginTop: 3, letterSpacing: "-0.01em" }}>{value}</div>
      {reason && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, lineHeight: 1.45 }}>{reason}</div>}
    </div>
  );
}

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

// 예산(budgetAllocation)은 *만원 단위* — fmt(원 단위)로 포맷하면 4,000만원→"4,000원", 합 15,000만원→"1만원" 으로 깨진다.
const fmtBudget = (manwon: number) => {
  if (!isFinite(manwon) || isNaN(manwon)) return "—";
  const v = Math.round(Math.abs(manwon));
  if (v >= 10000) {
    const eok = Math.floor(v / 10000);
    const rest = v % 10000;
    return rest > 0 ? `${eok}억 ${rest.toLocaleString()}만원` : `${eok}억원`;
  }
  return `${v.toLocaleString()}만원`;
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

  // 사업 아이디어 텍스트로 업종 유형 추론
  const ideaLower = ideaText.toLowerCase();
  const isLikelyTech = /앱|app|saas|ai |플랫폼|platform|소프트웨어|software|api|웹서비스|스타트업|startup|개발/.test(ideaLower);
  const isLikelyOnline = /온라인|쇼핑몰|스마트스토어|쿠팡|이커머스|e-commerce|online|store|마켓|커머스/.test(ideaLower);

  // ⚠️ 각 step 은 실제 AI 가 RoadmapGenerationResult 에 채우는 필드와 1:1 매칭.
  //    오프라인/온라인/스타트업 별로 흐름이 달라서 step 라벨도 다르게.
  //    순서: ① 컨셉·업종 매칭 → ② 시장/상권 → ③ 예산·월비용 → ④ 정체성·팀 → ⑤ 법무·세무·보험
  //    → ⑥ 공급업체·인테리어 (DB 풀 매칭) → ⑦ 운영 채널·자금 인프라 → ⑧ 정부지원 → ⑨ 타임라인·리스크
  const genSteps = ko
    ? (isLikelyTech
      ? [
          "사업 컨셉 정리 + 업종 매칭",
          "시장 규모 + 경쟁 환경 분석",
          "예산 배분 + 인건비 추정",
          "법인 설립 요건 + 4대보험",
          "개발 인프라·툴 선정 (AWS·GitHub 등)",
          "정부지원·VC 적합도 (TIPS·예창패)",
          "GTM 전략 + 채용 계획",
          "타임라인 + 리스크 분석",
        ]
      : isLikelyOnline
      ? [
          "사업 컨셉 정리 + 업종 매칭",
          "시장 트렌드 + 카테고리 분석",
          "예산 배분 + 월 운영비 추정",
          "사업자등록·통신판매업 절차",
          "상품 소싱·물류 파트너 추천",
          "판매 플랫폼 + 결제 PG 선정",
          "권장 보험 + 자금 인프라",
          "정부지원사업 + 타임라인 + 리스크",
        ]
      : [
          "사업 컨셉 정리 + 업종 매칭",
          "상권 데이터 분석 (점수·등급)",
          "예산 배분 + 월비용 추정",
          "법무·세무 + 인허가 확인",
          "공급업체 추천 (서비스 풀에서)",
          "인테리어 시공·자재·컨셉 선정",
          "운영 채널 + 자금 인프라",
          "정부지원사업 + 타임라인 + 리스크",
        ])
    : (isLikelyTech
      ? [
          "Concept + industry match",
          "Market sizing + competition",
          "Budget + payroll estimate",
          "Incorporation + 4-insurance",
          "Dev infra + tools (AWS · GitHub)",
          "Funding fit (TIPS · pre-startup)",
          "GTM strategy + hiring plan",
          "Timeline + risks",
        ]
      : isLikelyOnline
      ? [
          "Concept + industry match",
          "Market trends + category",
          "Budget + monthly costs",
          "Registration + e-commerce permits",
          "Sourcing + logistics partners",
          "Sales platform + payment PG",
          "Insurance + money infra",
          "Funding + timeline + risks",
        ]
      : [
          "Concept + industry match",
          "Market analysis (score · grade)",
          "Budget + monthly costs",
          "Legal · tax + permits",
          "Suppliers (from verified pool)",
          "Interior contractors · materials · concept",
          "Channels + money infra",
          "Funding + timeline + risks",
        ]);

  // ── API 호출 ──
  const handleGenerate = async () => {
    setStep("generating");
    setGenProgress(0);
    setError(null);

    // 실제 API 시간에 맞춘 점진적 진행 표시
    // Pass 1 (~30s) + Pass 2 (~20s) → 총 30~70s.
    // 초반 step 은 1.5~2.5s, 후반은 5~7s 로 점차 느리게 — 마지막 step("리스크 분석…") 은 API 응답까지 holding.
    const stepDelays = [1500, 2000, 2500, 3500, 5000, 6000, 7000]; // 총 ~27.5s, 마지막 step 은 API 대기
    let stepIdx = 0;
    let cancelled = false;
    const advanceStep = () => {
      if (cancelled || stepIdx >= genSteps.length - 1) return;
      stepIdx++;
      setGenProgress(stepIdx);
      if (stepIdx < genSteps.length - 1 && stepDelays[stepIdx]) {
        setTimeout(advanceStep, stepDelays[stepIdx]);
      }
    };
    setTimeout(advanceStep, stepDelays[0]);

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
      cancelled = true;
      // API 응답 후 남은 단계 빠르게 완료
      const quickFinish = () => {
        setGenProgress((prev) => {
          if (prev >= genSteps.length) return prev;
          setTimeout(quickFinish, 200);
          return prev + 1;
        });
      };
      quickFinish();

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "생성 실패");
      }

      const data: RoadmapGenerationResult = await res.json();
      setResult(data);
      setStep("review");
    } catch (err) {
      cancelled = true;
      setGenProgress(0);
      setError(err instanceof Error ? err.message : String(err));
      setStep("idea"); // 이전 입력(ideaText, budget, region, storeName)은 state에 보존됨
    }
  };

  // ── Step: 아이디어 입력 ──
  if (step === "idea") {
    return (
      <main style={shell}>
        <FloatingInspiration />
        <motion.div
          style={card}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <button type="button" onClick={onBack} style={backBtn}>
            <ArrowLeft size={13} strokeWidth={1.5} /> {ko ? "뒤로" : "Back"}
          </button>

          <div style={header}>
            <div style={eyebrow}>
              <Sparkles size={11} strokeWidth={1.5} />
              Found.One AI
            </div>
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
            <div style={{ marginTop: "12px", padding: "14px 16px", borderRadius: "14px", background: "rgba(180,35,24,0.05)", border: "1px solid rgba(180,35,24,0.1)" }}>
              <div style={{ fontSize: "14px", fontWeight: 650, color: "#b64c4c", marginBottom: "6px" }}>
                {ko ? "생성에 실패했습니다" : "Generation failed"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5, marginBottom: "10px" }}>
                {error ?? (ko ? "AI 분석 요청이 많아 지연되고 있습니다." : "AI analysis is experiencing high demand.")}
                <br />{ko ? "아래 버튼을 눌러 다시 시도해 주세요. 입력하신 내용은 모두 보존됩니다." : "Please retry — your inputs are preserved."}
              </div>
              <button
                type="button"
                onClick={() => { setError(null); handleGenerate(); }}
                style={{
                  padding: "10px 20px", borderRadius: "10px", border: "none",
                  background: "#b64c4c", color: "#fff", fontSize: "13px", fontWeight: 650,
                  cursor: "pointer", width: "100%",
                }}
              >
                {ko ? "다시 시도하기" : "Retry"}
              </button>
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
        </motion.div>
      </main>
    );
  }

  // ── Step: 예산 입력 ──
  if (step === "budget") {
    return (
      <main style={shell}>
        <FloatingInspiration />
        <motion.div style={card}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <button type="button" onClick={() => setStep("idea")} style={backBtn}>
            <ArrowLeft size={13} strokeWidth={1.5} /> {ko ? "뒤로" : "Back"}
          </button>
          <div style={header}>
            <div style={eyebrow}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M8 9.5c0-1.1 1.8-2 4-2s4 .9 4 2-1.8 2-4 2-4 .9-4 2 1.8 2 4 2 4-.9 4-2" /></svg>
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
                style={{ ...optionBtn, borderColor: budget === opt.value ? "#191970" : "rgba(25,25,112,0.10)", background: budget === opt.value ? "rgba(25,25,112,0.04)" : "rgba(255,255,255,0.8)" }}>
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>{ko ? "또는" : "or"}</span>
            <input type="text" inputMode="numeric" value={budgetText}
              onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setBudgetText(v); setBudget(v ? Number(v) * 10000 : null); }}
              placeholder={ko ? "직접 입력 (만원)" : "Enter amount (만원)"}
              style={inputStyle} />
          </div>

          <button type="button" onClick={() => { if (!budget) setBudget(50000000); setStep("region"); }}
            style={{ ...primaryBtn, marginTop: "24px" }}>
            {ko ? "다음" : "Continue"}
          </button>
        </motion.div>
      </main>
    );
  }

  // ── Step: 상권 입력 ──
  if (step === "region") {
    return (
      <main style={shell}>
        <FloatingInspiration />
        <motion.div style={card}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <button type="button" onClick={() => setStep("budget")} style={backBtn}>
            <ArrowLeft size={13} strokeWidth={1.5} /> {ko ? "뒤로" : "Back"}
          </button>
          <div style={header}>
            <div style={eyebrow}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {ko ? "3단계: 상권" : "Step 3: Location"}
            </div>
            <h1 style={title}>{ko ? "희망 지역이 있으신가요?" : "Do you have a preferred location?"}</h1>
            <p style={subtitle}>{ko ? "시/도까지 함께 적어주세요 — 한국부동산원 실측 상권 데이터(임대료) 매칭이 정확해집니다. 없으면 건너뛰어도 됩니다." : "Include the province/city for accurate market-data matching. Optional."}</p>
          </div>

          <input type="text" value={region} onChange={(e) => setRegion(e.target.value)}
            placeholder={ko ? "예: 대전 둔산동, 서울 마포구 망원동" : "e.g., Daejeon Dunsan, Seoul Mangwon"}
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
        </motion.div>
      </main>
    );
  }

  // ── Step: 상호명 입력 ──
  if (step === "storeName") {
    return (
      <main style={shell}>
        <FloatingInspiration />
        <motion.div style={card}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <button type="button" onClick={() => setStep("region")} style={backBtn}>
            <ArrowLeft size={13} strokeWidth={1.5} /> {ko ? "뒤로" : "Back"}
          </button>
          <div style={header}>
            <div style={eyebrow}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
        </motion.div>
      </main>
    );
  }

  // ── Step: 생성 중 ──
  if (step === "generating") {
    return (
      <main style={shell}>
        <FloatingInspiration />
        <motion.div style={{ ...card, textAlign: "center" as const }}
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999, background: "rgba(25,25,112,0.10)", color: "#191970", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: 18 }}>
            <Sparkles size={11} strokeWidth={1.5} />
            {ko ? "AI 생성 중" : "AI generating"}
          </div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#1e1a3e", marginBottom: "6px", letterSpacing: "-0.025em" }}>
            {ko ? "로드맵을 구성하고 있습니다" : "Building your roadmap"}
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(30,26,62,0.5)", fontWeight: 500, marginBottom: "22px" }}>
            {ko ? "보통 30초~1분 걸려요 — 화면을 닫지 마세요" : "Usually takes 30s–1min — keep this open"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px", textAlign: "left" as const }}>
            {genSteps.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: i < genProgress
                    ? "linear-gradient(135deg, #191970, #191970)"
                    : i === genProgress
                      ? "linear-gradient(135deg, #5b6bff, #191970)"
                      : "rgba(25,25,112,0.08)",
                  boxShadow: i === genProgress ? "0 0 0 4px rgba(25,25,112,0.16)" : "none",
                  transition: "all 0.3s ease",
                }}>
                  {i < genProgress ? (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : i === genProgress ? (
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />
                  ) : null}
                </div>
                <span style={{ fontSize: "14px", fontWeight: i <= genProgress ? 600 : 500, color: i <= genProgress ? "#1e1a3e" : "rgba(30,26,62,0.32)", letterSpacing: "-0.005em" }}>
                  {s}{i === genProgress ? "..." : i < genProgress ? (ko ? " 완료" : " Done") : ""}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    );
  }

  // ── Step: 리뷰 ──
  if (step === "review" && result) {
    const ba = result.budgetAllocation;
    const totalBudget = ba.total ?? (ba.deposit + ba.interior + ba.equipment + ba.workingCapital);

    // 예산 비율 계산
    const budgetItems = [
      { label: ko ? "보증금" : "Deposit", value: ba.deposit, color: "#3b82f6" },
      { label: ko ? "인테리어" : "Interior", value: ba.interior, color: "#8b5cf6" },
      { label: ko ? "설비" : "Equipment", value: ba.equipment, color: "#06b6d4" },
      { label: ko ? "운전자금" : "Working", value: ba.workingCapital, color: "#1d3557" },
    ].filter(b => b.value > 0);

    return (
      <main style={{ ...shell, alignItems: "flex-start", paddingTop: "48px" }}>
        <div style={{ width: "100%", maxWidth: "820px" }}>
          {/* 헤더 */}
          <div style={{ textAlign: "center" as const, marginBottom: "20px" }}>
            <div style={{ ...eyebrow, justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#191970" strokeWidth="2"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6z" /></svg>
              Found.One AI
            </div>
            <h1 style={{ ...title, fontSize: "clamp(26px, 4vw, 34px)", textAlign: "center" as const }}>{ko ? "로드맵 초안이 완성되었습니다" : "Your roadmap is ready"}</h1>
            <p style={{ ...subtitle, textAlign: "center" as const }}>{storeName ? `${storeName} · ` : ""}{result.parsed.industryLabel} · {result.parsed.preferredRegion || (ko ? "지역 미정" : "Location TBD")} · {fmtBudget(totalBudget)}</p>
          </div>

          {/* ⭐ 사업 컨셉 hero 박스 — 사용자 아이디어를 정제한 2-3줄 정의 */}
          {result.conceptSummary && (
            <div style={{
              marginBottom: "20px",
              padding: "22px 26px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, rgba(25,25,112,0.04) 0%, rgba(59,125,221,0.04) 100%)",
              border: "1px solid rgba(25,25,112,0.08)",
              display: "flex", flexDirection: "column" as const, gap: "10px",
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase" as const, color: "#191970",
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#191970" strokeWidth="1.4" fill="rgba(25,25,112,0.10)" />
                  <circle cx="6" cy="6" r="2" fill="#191970" />
                </svg>
                {ko ? "이 사업은" : "Concept"}
              </div>
              <p style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 550,
                lineHeight: 1.65,
                color: "#0f172a",
                letterSpacing: "-0.012em",
                whiteSpace: "pre-wrap" as const,
              }}>
                {result.conceptSummary}
              </p>
              {/* 핵심 태그 — 업종/타입/상권 */}
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginTop: "4px" }}>
                <span style={conceptTagStyle("#191970")}>{result.parsed.industryLabel}</span>
                <span style={conceptTagStyle("#3b7ddd")}>
                  {result.parsed.startupType === "franchise" ? (ko ? "프랜차이즈" : "Franchise") : (ko ? "독립 창업" : "Independent")}
                </span>
                {result.parsed.preferredRegion && (
                  <span style={conceptTagStyle("#191970")}>📍 {result.parsed.preferredRegion}</span>
                )}
                <span style={conceptTagStyle("#1d3557")}>{fmtBudget(totalBudget)}</span>
              </div>
            </div>
          )}

          {/* ⭐ 분업 선언 — "AI가 해결한 것 vs 사장님이 하실 일" (2026-08-03 핵심 약속) */}
          <DivisionOfLabor result={result} ko={ko} />

          {/* ⭐ 업종 매칭 검증 카드 — AI 가 어떤 업종으로 매칭했는지 + 신뢰도 + 차선책 */}
          {(() => {
            const conf = (result.parsed as { matchingConfidence?: number }).matchingConfidence ?? 50;
            const reason = (result.parsed as { matchingReason?: string }).matchingReason ?? "";
            const alts = (result.parsed as { alternativeSubIndustries?: Array<{ id: string; reason: string }> }).alternativeSubIndustries ?? [];
            const isLowConf = conf < 60;
            const tone = isLowConf ? { bg: "rgba(25,25,112,0.06)", border: "rgba(25,25,112,0.20)", accent: "#191970" }
                                    : { bg: "rgba(25,25,112,0.04)", border: "rgba(25,25,112,0.10)", accent: "#191970" };
            return (
              <div style={{
                marginBottom: "18px",
                padding: "18px 22px",
                borderRadius: "16px",
                background: tone.bg,
                border: `1px solid ${tone.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: tone.accent }}>
                    {isLowConf ? (ko ? "업종 매칭 — 확인 필요" : "Industry Match — Please Confirm") : (ko ? "업종 매칭" : "Industry Match")}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: tone.accent, fontVariantNumeric: "tabular-nums" as const, padding: "3px 9px", borderRadius: 999, background: "white", border: `1px solid ${tone.border}` }}>
                    {ko ? `신뢰도 ${conf}/100` : `Confidence ${conf}/100`}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.01em" }}>
                  {result.parsed.industryLabel} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>({result.parsed.subIndustryId})</span>
                </div>
                {reason && (
                  <div style={{ fontSize: 13, color: "rgba(15,23,42,0.65)", lineHeight: 1.6, fontWeight: 500, marginBottom: alts.length > 0 ? 12 : 0 }}>
                    {reason}
                  </div>
                )}
                {alts.length > 0 && (
                  <div style={{ borderTop: `1px solid ${tone.border}`, paddingTop: 10, marginTop: 10 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
                      {ko ? "차선책 (이게 더 맞으면 알려주세요)" : "Alternatives"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                      {alts.map((a) => (
                        <div key={a.id} style={{ fontSize: 12, color: "rgba(15,23,42,0.65)", lineHeight: 1.5 }}>
                          <strong style={{ color: "#0f172a", fontWeight: 600 }}>{a.id}</strong> · {a.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ─── 카드 레이아웃 — 미드나이트 단일 톤 (서비스 톤 일관) ─── */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>

            {/* 매장 정체성 — identity */}
            {(result.identity?.suggestedStoreName || result.identity?.mission || result.identity?.targetCustomer) && (
              <StageCard icon={Target} label={ko ? "매장 정체성" : "Identity"}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {result.identity.suggestedStoreName && (
                    <KeyValue label={ko ? "추천 상호" : "Store name"} value={result.identity.suggestedStoreName} />
                  )}
                  {result.identity.targetCustomer && (
                    <KeyValue label={ko ? "타겟 고객" : "Target"} value={result.identity.targetCustomer} />
                  )}
                </div>
                {result.identity.mission && (
                  <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(25,25,112,0.04)", borderLeft: "3px solid #191970" }}>
                    <div style={{ ...STAGE_LABEL, marginBottom: 4 }}>{ko ? "미션" : "Mission"}</div>
                    <div style={{ fontSize: 13.5, color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>"{result.identity.mission}"</div>
                  </div>
                )}
                {(result.identity.businessOpenTime || result.identity.businessCloseTime) && (
                  <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "rgba(15,23,42,0.6)", fontWeight: 600 }}>
                    <Clock size={13} strokeWidth={1.5} color="#191970" />
                    <span>{ko ? "영업시간" : "Hours"}: {result.identity.businessOpenTime || "—"} ~ {result.identity.businessCloseTime || "—"}</span>
                  </div>
                )}
              </StageCard>
            )}

            {/* 업종 + 인허가 + 운영 채널 — 3열 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <StageCard icon={Building2} label={ko ? "업종" : "Industry"} compact>
                <div style={STAGE_VALUE}>{result.parsed.industryLabel}</div>
                <div style={STAGE_SUB}>
                  {result.parsed.startupType === "franchise" ? (ko ? "프랜차이즈" : "Franchise") : (ko ? "독립 창업" : "Independent")}
                </div>
              </StageCard>

              <StageCard icon={Stamp} label={ko ? "필수 인허가" : "Permits"} compact>
                {result.legal?.permitsDetailed && result.legal.permitsDetailed.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, marginTop: 4 }}>
                    {result.legal.permitsDetailed.slice(0, 4).map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: "rgba(25,25,112,0.08)", color: "#191970" }}>{p.kind}</span>
                        <span style={{ fontSize: 12.5, color: "#0f172a", fontWeight: 500 }}>{p.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 4, marginTop: 4 }}>
                    {result.recommendations.permits.map((p, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: "#0f172a", fontWeight: 500 }}>· {p}</div>
                    ))}
                  </div>
                )}
              </StageCard>

              <StageCard icon={Tv} label={ko ? "운영 채널 미리보기" : "Channels preview"} compact>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const, marginTop: 4 }}>
                  {(() => {
                    const tags = result.recommendations.operationalChannels && result.recommendations.operationalChannels.length > 0
                      ? result.recommendations.operationalChannels.map(ch => ch.nameKo)
                      : [...result.recommendations.deliveryPlatforms, ...result.recommendations.snsChannels];
                    return tags.slice(0, 6).map((ch, i) => (
                      <span key={i} style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: "rgba(25,25,112,0.06)", color: "#191970", letterSpacing: "-0.005em" }}>{ch}</span>
                    ));
                  })()}
                </div>
                {result.recommendations.operationalChannels && result.recommendations.operationalChannels.length > 6 && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>+{result.recommendations.operationalChannels.length - 6} {ko ? "더" : "more"}</div>
                )}
              </StageCard>
            </div>

            {/* 직원 추천 — team */}
            {result.team && result.team.roles?.length > 0 && (
              <StageCard icon={Users} label={ko ? `직원 구성 — 초기 ${result.team.initialSize}명` : `Team — ${result.team.initialSize} people`}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {result.team.roles.map((r, i) => (
                    <div key={i} style={{ padding: "10px 12px", borderRadius: 12, background: r.timing === "now" ? "rgba(25,25,112,0.05)" : "rgba(15,23,42,0.03)", border: `1px solid ${r.timing === "now" ? "rgba(25,25,112,0.10)" : "rgba(15,23,42,0.06)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{r.role}</span>
                        <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: r.timing === "now" ? "#191970" : "rgba(15,23,42,0.10)", color: r.timing === "now" ? "white" : "rgba(15,23,42,0.6)" }}>
                          {r.timing === "now" ? (ko ? "즉시" : "Now") : (ko ? "확장 시" : "Later")}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.45 }}>{r.reason}</div>
                    </div>
                  ))}
                </div>
                {result.legal?.fourInsuranceRequired && (
                  <div style={{ marginTop: 10, fontSize: 11.5, color: "#191970", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <ShieldCheck size={12} strokeWidth={1.5} />
                    {ko ? "직원 1명+ 채용 시 4대보험 사업장 성립 의무" : "Mandatory 4-insurance establishment when hiring"}
                  </div>
                )}
              </StageCard>
            )}

            {/* 상권 분석 — marketAnalysis
                grade "N/A" = 실측 전용 모드 (2026-08-03): 점수·등급·게이지를 그리지 않는다.
                종전엔 LLM 이 서울 8개 하드코딩을 근거로 전국 점수를 지어냈다 — 서버가 이제
                한국부동산원 실측(임대료)만 내려주고 나머지 축은 빈 값이다. */}
            <StageCard icon={MapPin} label={ko ? "상권 분석" : "Market Analysis"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={STAGE_VALUE}>{result.parsed.preferredRegion || "—"}</div>
                {result.marketAnalysis.grade !== "N/A" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 800, lineHeight: 1, padding: "5px 12px", borderRadius: 10,
                      background: "rgba(25,25,112,0.08)", color: "#191970",
                    }}>{result.marketAnalysis.grade}</div>
                    <span style={{ fontSize: 18, fontWeight: 750, color: "#0f172a", fontVariantNumeric: "tabular-nums" as const }}>
                      {result.marketAnalysis.score}<span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)" }}>/100</span>
                    </span>
                  </div>
                )}
                {result.marketAnalysis.grade === "N/A" && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "rgba(25,25,112,0.06)", color: "#191970", letterSpacing: "0.03em" }}>
                    {ko ? "실측 기준 · 한국부동산원" : "Measured · REB"}
                  </span>
                )}
              </div>
              {result.marketAnalysis.grade !== "N/A" && (
                <div style={{ height: 5, borderRadius: 3, background: "rgba(25,25,112,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${result.marketAnalysis.score}%`, background: "linear-gradient(90deg, #191970 0%, #5b6bff 100%)", transition: "width 0.4s ease" }} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
                {[
                  { label: ko ? "유동인구" : "Traffic", value: result.marketAnalysis.footTraffic },
                  { label: ko ? "경쟁 밀도" : "Competition", value: result.marketAnalysis.competition },
                  { label: ko ? "임대료" : "Rent", value: result.marketAnalysis.rentLevel },
                  { label: ko ? "타겟 적합도" : "Target fit", value: result.marketAnalysis.targetFit },
                ].filter(m => m.value).map((m, i) => (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(25,25,112,0.04)" }}>
                    <div style={{ ...STAGE_LABEL, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.4, fontWeight: 500 }}>{m.value}</div>
                  </div>
                ))}
              </div>
              {result.marketAnalysis.summary && (
                <div style={{ marginTop: 10, fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.55, padding: "10px 12px", borderRadius: 12, background: "rgba(25,25,112,0.03)", borderLeft: "3px solid rgba(25,25,112,0.25)" }}>
                  {result.marketAnalysis.summary}
                </div>
              )}
            </StageCard>

            {/* 예산 배분 — budgetAllocation */}
            <StageCard icon={Wallet} label={ko ? "예산 배분" : "Budget allocation"}>
              <div style={{ ...STAGE_VALUE, marginBottom: 12, fontVariantNumeric: "tabular-nums" as const }}>{fmtBudget(totalBudget)}</div>
              <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: "rgba(25,25,112,0.04)" }}>
                {budgetItems.map((b, i) => {
                  // midnight 톤 단일 — 명도 단계만 다르게
                  const shades = ["#191970", "#3a3aa0", "#5b6bff", "#8b94ff"];
                  return (
                    <div key={b.label} style={{ width: `${totalBudget > 0 ? (b.value / totalBudget) * 100 : 0}%`, background: shades[i % shades.length], transition: "width 0.4s ease" }} />
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" as const }}>
                {budgetItems.map((b, i) => {
                  const shades = ["#191970", "#3a3aa0", "#5b6bff", "#8b94ff"];
                  return (
                    <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: shades[i % shades.length] }} />
                      <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>{b.label}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums" as const }}>{fmtBudget(b.value)}</span>
                    </div>
                  );
                })}
              </div>
            </StageCard>

            {/* 자금 인프라 — moneyInfra */}
            {result.moneyInfra && (
              <StageCard icon={Landmark} label={ko ? "자금 인프라" : "Money infra"}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <InfraTile label={ko ? "사업용 통장" : "Bank"} value={result.moneyInfra.recommendedBank.toUpperCase()} reason={result.moneyInfra.recommendedBankReason} />
                  <InfraTile label={ko ? "POS·결제" : "POS"} value={result.moneyInfra.recommendedPos.toUpperCase()} reason={result.moneyInfra.recommendedPosReason} />
                  <InfraTile
                    label={ko ? "세무 처리" : "Tax"}
                    value={result.moneyInfra.cpaDecision === "self" ? (ko ? "셀프 신고" : "Self") : result.moneyInfra.cpaDecision === "cpa" ? (ko ? "세무사 위임" : "CPA") : (ko ? "혼합 (월 셀프 + 연 컨설팅)" : "Hybrid")}
                    reason={result.moneyInfra.cpaReason}
                  />
                </div>
                {result.legal?.taxType && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "rgba(15,23,42,0.6)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ ...STAGE_LABEL }}>{ko ? "과세 유형" : "Tax type"}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#191970" }}>
                      {result.legal.taxType === "simplified" ? (ko ? "간이과세" : "Simplified") : result.legal.taxType === "standard" ? (ko ? "일반과세" : "Standard") : (ko ? "법인" : "Corporation")}
                    </span>
                    {result.legal.industryCode && <span style={{ fontSize: 11.5, color: "var(--muted)" }}>· {ko ? "업종코드" : "Code"} {result.legal.industryCode}</span>}
                  </div>
                )}
              </StageCard>
            )}

            {/* ⭐ 운영 채널 — operationalChannels (Pass 2 AI 가 풀에서 선택) */}
            {result.recommendations.operationalChannels && result.recommendations.operationalChannels.length > 0 && (
              <StageCard
                icon={Tv}
                label={ko ? `운영 채널 — 주력 ${result.recommendations.operationalChannels.filter(c => c.priority === 1).length} · 보조 ${result.recommendations.operationalChannels.filter(c => c.priority === 2).length}` : `Channels`}
                hint={ko ? "Found.One 등록 채널에서 사장님의 업종·예산에 맞춰 AI 가 선택" : "AI selected from registered channels"}
              >
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  {result.recommendations.operationalChannels.map((ch) => (
                    <div key={ch.id} style={{ padding: "12px 14px", borderRadius: 14, background: ch.priority === 1 ? "rgba(25,25,112,0.05)" : "rgba(15,23,42,0.03)", border: `1px solid ${ch.priority === 1 ? "rgba(25,25,112,0.10)" : "rgba(15,23,42,0.06)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: ch.priority === 1 ? "#191970" : "rgba(25,25,112,0.10)", color: ch.priority === 1 ? "white" : "#191970" }}>
                            {ch.priority === 1 ? (ko ? "주력" : "Primary") : (ko ? "보조" : "Secondary")}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{ch.nameKo}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--muted)" }}>· {ch.typeLabelKo}</span>
                        </div>
                        {ch.commissionRate > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#191970", fontVariantNumeric: "tabular-nums" as const }}>
                            {ko ? "수수료 " : "Fee "}{ch.commissionRate}%
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>{ch.reason}</div>
                    </div>
                  ))}
                </div>
              </StageCard>
            )}

            {/* ⭐ 추천 공급업체 — 항상 표시 (Pass 2 AI 또는 DB 풀 또는 universalFallback) */}
            <StageCard
              icon={Truck}
              label={ko ? `추천 공급업체 · ${result.recommendations.suppliers.length}곳` : `Suppliers · ${result.recommendations.suppliers.length}`}
              hint={
                result.recommendations.suppliers.length === 0
                  ? (ko ? "⚠️ 추천 데이터 매칭 실패. 다시 생성을 눌러주세요." : "No matches. Regenerate.")
                  : result.recommendations.suppliers.some(s => s.id)
                    ? (ko ? "Found.One 등록 검증 업체에서 사장님 상황에 맞춰 AI 가 선택. 풀에 없는 가상 업체 0%." : "AI selected from verified DB pool.")
                    : (ko ? "AI 일반 추천 (DB 풀 매칭 데이터 부족)" : "AI general recommendation")
              }
            >
              {result.recommendations.suppliers.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  {result.recommendations.suppliers.map((s, i) => (
                    <div key={s.id ?? i} style={{ padding: "12px 14px", borderRadius: 14, background: "white", border: "1px solid rgba(25,25,112,0.10)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        {s.category && <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "rgba(25,25,112,0.08)", color: "#191970", letterSpacing: "0.04em" }}>{s.category}</span>}
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", flex: 1 }}>{s.name}</span>
                        {s.id && <span title={ko ? "DB 풀 검증" : "DB-verified"} style={{ display: "inline-flex", alignItems: "center" }}><ShieldCheck size={12} strokeWidth={1.8} color="#191970" /></span>}
                      </div>
                      {s.reason && <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>{s.reason}</div>}
                      {s.priceRange && <div style={{ fontSize: 11, fontWeight: 700, color: "#191970", marginTop: 3 }}>{s.priceRange}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(25,25,112,0.06)", border: "1px solid rgba(25,25,112,0.20)", color: "#191970", fontSize: 13, fontWeight: 600, lineHeight: 1.55 }}>
                  {ko
                    ? "공급업체 매칭에 실패했습니다. 아래 \"다시 생성\" 버튼으로 재시도해 주세요."
                    : "Supplier matching failed. Please regenerate."}
                </div>
              )}
            </StageCard>

            {/* ⭐ 디자인 컨셉 — selectedConcept (Pass 2 AI 가 interior_design_guides 풀에서 1개 선택) */}
            {result.recommendations.selectedConcept && (
              <StageCard
                icon={Lightbulb}
                label={ko ? "디자인 컨셉 — 선택됨" : "Design concept — selected"}
                hint={ko ? "Found.One 등록 컨셉 풀에서 AI 가 사장님 상황에 맞춰 선택" : "AI selected from concept pool"}
              >
                <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(25,25,112,0.05)", border: "1px solid rgba(25,25,112,0.10)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.015em" }}>{result.recommendations.selectedConcept.nameKo}</div>
                    {result.recommendations.selectedConcept.costRangeKo && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#191970" }}>{result.recommendations.selectedConcept.costRangeKo}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.65)", lineHeight: 1.55, marginBottom: 10 }}>{result.recommendations.selectedConcept.descriptionKo}</div>
                  <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(25,25,112,0.04)", borderLeft: "3px solid #191970", fontSize: 12, color: "#0f172a", lineHeight: 1.55, fontWeight: 500, marginBottom: (result.recommendations.selectedConcept.pros.length > 0 || result.recommendations.selectedConcept.cons.length > 0) ? 10 : 0 }}>
                    <span style={{ fontWeight: 700, marginRight: 4 }}>{ko ? "왜 이 컨셉?" : "Why?"}</span>
                    {result.recommendations.selectedConcept.reason}
                  </div>
                  {(result.recommendations.selectedConcept.pros.length > 0 || result.recommendations.selectedConcept.cons.length > 0) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {result.recommendations.selectedConcept.pros.length > 0 && (
                        <div>
                          <div style={{ ...STAGE_LABEL, marginBottom: 4, color: "#191970" }}>{ko ? "장점" : "Pros"}</div>
                          {result.recommendations.selectedConcept.pros.slice(0, 3).map((p, i) => (
                            <div key={i} style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.45, marginBottom: 2 }}>· {p}</div>
                          ))}
                        </div>
                      )}
                      {result.recommendations.selectedConcept.cons.length > 0 && (
                        <div>
                          <div style={{ ...STAGE_LABEL, marginBottom: 4 }}>{ko ? "주의" : "Cons"}</div>
                          {result.recommendations.selectedConcept.cons.slice(0, 3).map((c, i) => (
                            <div key={i} style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.45, marginBottom: 2 }}>· {c}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </StageCard>
            )}

            {/* ⭐ 인테리어 시공 업체 — vendor_recommendations.vendor_type='interior' 에서 선택 */}
            {result.recommendations.interiorVendors && result.recommendations.interiorVendors.length > 0 && (
              <StageCard
                icon={Home}
                label={ko ? `인테리어 시공 업체 · ${result.recommendations.interiorVendors.length}곳` : `Interior contractors · ${result.recommendations.interiorVendors.length}`}
                hint={ko ? "Found.One 등록 시공 업체 풀에서 사장님 컨셉·예산에 맞춰 선정" : "From verified contractor pool"}
              >
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  {result.recommendations.interiorVendors.map((v) => (
                    <div key={v.id} style={{ padding: "12px 14px", borderRadius: 14, background: "white", border: "1px solid rgba(25,25,112,0.10)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "rgba(25,25,112,0.08)", color: "#191970", letterSpacing: "0.04em" }}>
                          {ko ? "인테리어 시공" : "Contractor"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", flex: 1 }}>{v.title}</span>
                        <span title={ko ? "DB 풀 검증" : "DB-verified"} style={{ display: "inline-flex", alignItems: "center" }}>
                          <ShieldCheck size={12} strokeWidth={1.8} color="#191970" />
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.5, marginBottom: v.checkItems.length > 0 ? 6 : 0 }}>{v.description}</div>
                      {v.checkItems.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 6 }}>
                          {v.checkItems.slice(0, 4).map((c, i) => (
                            <span key={i} style={{ fontSize: 10.5, color: "var(--muted)", padding: "2px 8px", borderRadius: 999, background: "rgba(15,23,42,0.04)" }}>· {c}</span>
                          ))}
                        </div>
                      )}
                      {v.reason && <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.45, paddingTop: 6, borderTop: "1px dashed rgba(25,25,112,0.10)" }}>· {v.reason}</div>}
                    </div>
                  ))}
                </div>
              </StageCard>
            )}

            {/* ⭐ 인테리어 자재 — Pass 2 AI 가 interior_design_guides DB 풀에서 선택 */}
            {result.recommendations.interior.length > 0 && (
              <StageCard
                icon={Home}
                label={ko ? `인테리어 자재 · ${result.recommendations.interior.length}건` : `Interior materials · ${result.recommendations.interior.length}`}
                hint={
                  result.recommendations.interior.some(i => i.id)
                    ? (ko ? "Found.One 등록 자재에서 컨셉·예산에 맞춰 AI 가 선택" : "AI picked from material pool")
                    : (ko ? "AI 일반 추천 (DB 풀 매칭 데이터 부족)" : "AI general recommendation")
                }
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {result.recommendations.interior.map((it, i) => (
                    <div key={it.id ?? i} style={{ padding: "11px 13px", borderRadius: 14, background: "white", border: "1px solid rgba(25,25,112,0.10)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", flex: 1 }}>{it.item}</span>
                        {it.id && <span title={ko ? "DB 풀 검증" : "DB-verified"} style={{ display: "inline-flex", alignItems: "center" }}><ShieldCheck size={11} strokeWidth={1.8} color="#191970" /></span>}
                      </div>
                      {it.vendor && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1, lineHeight: 1.5 }}>{it.vendor}</div>}
                      {it.estimatedCost && <div style={{ fontSize: 11.5, fontWeight: 700, color: "#191970", marginTop: 4 }}>{it.estimatedCost}</div>}
                      {it.reason && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, lineHeight: 1.45, paddingTop: 6, borderTop: "1px dashed rgba(25,25,112,0.10)" }}>· {it.reason}</div>}
                    </div>
                  ))}
                </div>
              </StageCard>
            )}

            {/* 권장 보험 — insurance */}
            {result.insurance && result.insurance.length > 0 && (
              <StageCard icon={Umbrella} label={ko ? "권장 보험" : "Insurance"}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {result.insurance.map((ins, i) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 14, background: ins.required ? "rgba(25,25,112,0.05)" : "rgba(15,23,42,0.03)", border: `1px solid ${ins.required ? "rgba(25,25,112,0.10)" : "rgba(15,23,42,0.06)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{ins.name}</div>
                        {ins.required && <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "#191970", color: "white" }}>{ko ? "의무" : "Required"}</span>}
                      </div>
                      {ins.reason && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.45 }}>{ins.reason}</div>}
                      {ins.annualPremiumEstimate > 0 && <div style={{ fontSize: 11.5, fontWeight: 700, color: "#191970", marginTop: 3 }}>{ko ? "연 약 " : "~"}{fmt(ins.annualPremiumEstimate)}</div>}
                    </div>
                  ))}
                </div>
              </StageCard>
            )}

            {/* 정부지원사업 — fundingPrograms */}
            {result.fundingPrograms && result.fundingPrograms.length > 0 && (
              <StageCard icon={Lightbulb} label={ko ? "정부지원·창업 프로그램 (적합도순)" : "Funding programs (by fit)"}>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  {[...result.fundingPrograms].sort((a, b) => b.fitScore - a.fitScore).map((fp, i) => (
                    <div key={i} style={{ padding: "12px 14px", borderRadius: 14, background: "white", border: "1px solid rgba(25,25,112,0.10)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{fp.name}</div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#191970" }}>· {fp.amount}</span>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: fp.fitScore >= 80 ? "#191970" : "rgba(25,25,112,0.10)", color: fp.fitScore >= 80 ? "white" : "#191970", fontVariantNumeric: "tabular-nums" as const }}>
                          {ko ? "적합도 " : "Fit "}{fp.fitScore}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.45 }}>{fp.eligibility}</div>
                      {fp.deadline && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>· {fp.deadline}</div>}
                    </div>
                  ))}
                </div>
              </StageCard>
            )}

            {/* 업종 특화 — industrySpecific */}
            {result.industrySpecific && (() => {
              const is = result.industrySpecific!;
              const items: Array<{ label: string; rows: Array<{ name: string; meta: string }> }> = [];
              if (is.menu && is.menu.length > 0) items.push({ label: ko ? "시그니처 메뉴" : "Menu", rows: is.menu.map(m => ({ name: m.name, meta: `${fmt(m.price)} · ${m.reason}` })) });
              if (is.services && is.services.length > 0) items.push({ label: ko ? "시술 메뉴" : "Services", rows: is.services.map(s => ({ name: s.name, meta: `${s.durationMin}분 · ${fmt(s.price)}` })) });
              if (is.memberships && is.memberships.length > 0) items.push({ label: ko ? "회원권" : "Memberships", rows: is.memberships.map(m => ({ name: m.name, meta: `${m.durationMonths}개월 · ${fmt(m.price)}` })) });
              if (is.products && is.products.length > 0) items.push({ label: ko ? "주력 상품" : "Products", rows: is.products.map(p => ({ name: p.name, meta: `${ko ? "마진 " : "Margin "}${p.targetMargin}% · ${p.reason}` })) });
              if (is.coreAssets && is.coreAssets.length > 0) items.push({ label: ko ? "핵심 자산·장비" : "Core assets", rows: is.coreAssets.map(a => ({ name: a.name, meta: `${fmt(a.estimatedCost)} · ${a.priority === "must" ? (ko ? "필수" : "Must") : (ko ? "선택" : "Nice")}` })) });
              if (items.length === 0) return null;
              return (
                <StageCard icon={Lightbulb} label={ko ? "업종 특화 — 메뉴·시술·상품·핵심자산" : "Industry-specific"}>
                  {items.map((blk, i) => (
                    <div key={i} style={{ marginBottom: i < items.length - 1 ? 12 : 0 }}>
                      <div style={{ ...STAGE_LABEL, marginBottom: 6 }}>{blk.label}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {blk.rows.map((r, j) => (
                          <div key={j} style={{ padding: "9px 12px", borderRadius: 12, background: "rgba(25,25,112,0.04)" }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{r.name}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, lineHeight: 1.45 }}>{r.meta}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </StageCard>
              );
            })()}

            {/* 타임라인 — timeline */}
            <StageCard icon={Clock} label={ko ? `타임라인 — 총 ${result.timeline.totalWeeks}주` : `Timeline — ${result.timeline.totalWeeks} weeks`}>
              <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                {result.timeline.phases.map((p, i) => {
                  const pct = result.timeline.totalWeeks > 0 ? (p.weeks / result.timeline.totalWeeks) * 100 : 0;
                  // midnight 명도 단계 — 시작은 짙고 끝으로 갈수록 밝게
                  const shades = ["#191970", "#2a2a8b", "#3b3ba6", "#5b6bff", "#8b94ff", "#b5bcff"];
                  return (
                    <div key={i} style={{ width: `${pct}%`, display: "flex", flexDirection: "column" as const, alignItems: "center", minWidth: 40 }}>
                      <div style={{ width: "100%", height: 8, borderRadius: i === 0 ? "4px 0 0 4px" : i === result.timeline.phases.length - 1 ? "0 4px 4px 0" : "0", background: shades[i % shades.length] }} />
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", marginTop: 6, textAlign: "center" as const, lineHeight: 1.2 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{p.weeks}{ko ? "주" : "w"}</div>
                    </div>
                  );
                })}
              </div>
            </StageCard>
          </div>

          {/* 리스크 — midnight tone */}
          {result.risks.length > 0 && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {result.risks.map((r, i) => (
                <div key={i} style={{ padding: "14px 16px", borderRadius: 16, background: "rgba(25,25,112,0.03)", border: "1px solid rgba(25,25,112,0.10)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: r.level === "high" ? "#191970" : "rgba(25,25,112,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <ShieldCheck size={12} strokeWidth={1.8} color={r.level === "high" ? "white" : "#191970"} />
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{r.description}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: r.level === "high" ? "#191970" : "rgba(25,25,112,0.10)", color: r.level === "high" ? "white" : "#191970", letterSpacing: "0.04em" }}>
                      {r.level === "high" ? (ko ? "높음" : "HIGH") : r.level === "medium" ? (ko ? "중간" : "MED") : (ko ? "낮음" : "LOW")}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", paddingLeft: 30, lineHeight: 1.5 }}>{ko ? "대응: " : "Action: "}{r.mitigation}</div>
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
/**
 * Midnight Blue palette — 서비스 전체 톤과 일관 (#191970 시그니처).
 * Apple SF tone + 미드나이트 단색 강조. (이전 라벤더·오키드 페탈은 FloatingInspiration 의 ambient 영역에서만 유지)
 */
const MIDNIGHT = "#191970";          // 메인 미드나이트 (CTA 배경·강조)
const MIDNIGHT_DEEP = "#0f0f4a";      // 더 깊은 미드나이트 (그라디언트·텍스트)
const MIDNIGHT_GLOW = "rgba(25,25,112,0.20)";
const MIDNIGHT_BG = "#fafbff";        // 카드 베이스 (살짝 푸른빛이 도는 흰색)
const MIDNIGHT_TINT = "rgba(25,25,112,0.08)"; // 호버 / 액센트
const MIDNIGHT_BORDER = "rgba(25,25,112,0.12)";
const HAIRLINE = "rgba(25,25,112,0.08)";
const INK = "#0f172a";                // 차분한 다크 잉크
const MUTED = "rgba(15,23,42,0.55)";
const HINT = "rgba(15,23,42,0.40)";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 24px",
  background: "transparent",
  position: "relative" as const, // FloatingInspiration absolute 위치 기준
  overflow: "hidden" as const,    // 떠다니는 항목이 화면 밖으로 흘러도 스크롤바 안 생기게
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "600px",
  padding: "40px 36px",
  borderRadius: "28px",
  background: `linear-gradient(180deg, ${MIDNIGHT_BG} 0%, #ffffff 100%)`,
  border: `1px solid ${MIDNIGHT_BORDER}`,
  boxShadow: `0 1px 3px ${MIDNIGHT_GLOW}, 0 24px 60px -16px ${MIDNIGHT_GLOW}, 0 1px 0 rgba(255,255,255,0.9) inset`,
  backdropFilter: "blur(20px)",
  position: "relative",
  zIndex: 1,
};

const header: React.CSSProperties = { marginBottom: "26px" };

const eyebrow: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "5px 11px",
  borderRadius: "999px",
  background: MIDNIGHT_TINT,
  fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em",
  textTransform: "uppercase", color: MIDNIGHT_DEEP,
  marginBottom: "16px",
};

const title: React.CSSProperties = {
  fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, letterSpacing: "-0.035em",
  color: INK, margin: "0 0 10px", lineHeight: 1.2,
};

const subtitle: React.CSSProperties = {
  fontSize: "14.5px", color: MUTED, lineHeight: 1.6, margin: 0, fontWeight: 500,
};

const backBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "5px",
  fontSize: "13px", fontWeight: 600, color: MIDNIGHT_DEEP,
  background: "transparent", border: "none", cursor: "pointer",
  padding: "0 0 18px",
  transition: "opacity 0.15s ease",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: "18px",
  border: `1px solid ${MIDNIGHT_BORDER}`,
  fontSize: "15px",
  lineHeight: 1.65,
  resize: "none",
  outline: "none",
  background: "#ffffff",
  boxSizing: "border-box",
  minHeight: "140px",
  color: INK,
  fontWeight: 500,
  transition: "border-color 0.18s ease, box-shadow 0.18s ease",
  fontFamily: "inherit",
};

const chipBtn: React.CSSProperties = {
  fontSize: "12.5px",
  fontWeight: 600,
  padding: "7px 14px",
  borderRadius: "999px",
  border: `1px solid ${MIDNIGHT_BORDER}`,
  background: "white",
  cursor: "pointer",
  color: MIDNIGHT_DEEP,
  transition: "background 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
  fontFamily: "inherit",
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "15px 20px",
  borderRadius: "14px",
  border: "none",
  background: `linear-gradient(135deg, ${MIDNIGHT} 0%, ${MIDNIGHT_DEEP} 100%)`,
  color: "white",
  fontSize: "15px",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  cursor: "pointer",
  transition: "opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease",
  boxShadow: `0 6px 20px ${MIDNIGHT_GLOW}, 0 1px 0 rgba(255,255,255,0.20) inset`,
  fontFamily: "inherit",
};

const secondaryBtn: React.CSSProperties = {
  padding: "14px 20px", borderRadius: "14px",
  border: `1px solid ${MIDNIGHT_BORDER}`, background: "white",
  color: MIDNIGHT_DEEP, fontSize: "14px", fontWeight: 700, cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 0.15s ease",
};

const optionBtn: React.CSSProperties = {
  padding: "16px",
  borderRadius: "14px",
  border: `1.5px solid ${HAIRLINE}`,
  background: "white",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
  color: INK,
  textAlign: "center",
  transition: "all 0.15s ease",
  fontFamily: "inherit",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "13px 16px",
  borderRadius: "12px",
  border: `1px solid ${MIDNIGHT_BORDER}`,
  fontSize: "14.5px",
  outline: "none",
  background: "white",
  boxSizing: "border-box",
  color: INK,
  fontFamily: "inherit",
  transition: "border-color 0.18s ease, box-shadow 0.18s ease",
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
  textTransform: "uppercase", color: "var(--muted)", marginBottom: "4px",
};

const rvValue: React.CSSProperties = {
  fontSize: "18px", fontWeight: 720, color: "#0f172a", lineHeight: 1.3,
};

const rvSub: React.CSSProperties = {
  fontSize: "13px", color: "var(--muted)", marginTop: "2px",
};

/** 사업 컨셉 hero 박스의 핵심 태그 — 업종/타입/상권/예산 */
const conceptTagStyle = (color: string): React.CSSProperties => ({
  fontSize: "11.5px",
  fontWeight: 650,
  padding: "4px 10px",
  borderRadius: "999px",
  background: `${color}10`,
  color,
  border: `1px solid ${color}20`,
  letterSpacing: "-0.005em",
  whiteSpace: "nowrap",
});
