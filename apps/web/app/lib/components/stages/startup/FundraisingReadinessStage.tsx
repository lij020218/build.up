"use client";

/**
 * FundraisingReadinessStage — 런웨이·투자 준비 (Stage 12)
 *
 * 2026-04 전면 재설계:
 *   • 4페이지 페이지네이션 (스크롤 길이 1/4 단축)
 *   • Page 0: 왜·런웨이 진단 (WHY)
 *   • Page 1: 부트스트랩 vs 투자 결정 (HOW + PATH)
 *   • Page 2: 모드별 70+ 검증 프로그램 (PATH·구체)
 *   • Page 3: 투자자 만나기 + AI 사업계획서 (실행)
 *
 * 검증 출처 (2026-04 영어·한국어 양쪽):
 *   • 18+ months runway 표준 (wearepresta.com 2026 capital efficiency)
 *   • Net Burn < 2x Net New ARR (seedscope.ai)
 *   • TIPS 2026: 운영사 추천 + R&D 최대 5억, 10% 환수만
 *   • 한국 액셀러레이터 (SparkLabs·Primer·Bluepoint·MashupAngels)
 *   • Default Alive vs Default Dead (Paul Graham, 2026 투자 표준)
 *   • Solo founder 52% exited without external funding (2026)
 */

import { useState } from "react";
import {
  Lightbulb, ExternalLink, HelpCircle, DollarSign, Trophy,
  AlertTriangle, Target, Sparkles, FileText, Calculator,
} from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { supabase } from "../../../../../lib/supabase";
import {
  getProgramsForMode,
  RECOMMENDED_PROGRAM_COUNT_BY_MODE,
  type FundingProgram,
  type OperatingMode,
} from "@build-up/shared";
import {
  MIDNIGHT,
  MIDNIGHT_SOFT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
} from "./StartupStageShell";
import type { LucideIcon } from "lucide-react";
import { StageWrapup } from "../shared/StageWrapup";

export function FundraisingReadinessStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";

  const {
    decisions, industryCategoryId, selectedIndustryId, startupType,
    selectedBusinessModelId, selectedBudget, savedFinanceSnapshot,
    guideSelections,
    bpLoading, setBpLoading, bpSections, setBpSections, bpSummary, setBpSummary,
    bpError, setBpError,
    startupOperatingMode, setStartupOperatingMode,
  } = d;

  // ── 페이지네이션 (4페이지) ──
  const rawPg = d.guideStepIndex;
  const pg = (typeof rawPg === "number" && rawPg >= 0 && rawPg <= 3) ? rawPg : 0;
  const totalPg = 4;
  const pgLabels = ko
    ? ["왜·런웨이 진단", "부트스트랩 vs 투자", "추천 프로그램", "AI 사업계획서"]
    : ["Why & Runway", "Bootstrap vs VC", "Programs", "AI Plan"];

  // ── 모드 + 클러스터 → 검증된 자금 프로그램 ──
  const isDeeptechSub = ["robotics-physical-ai", "biotech-medtech", "semiconductor", "climate-energy", "hardware-iot"]
    .includes(selectedIndustryId ?? "");
  const recommendedPrograms: FundingProgram[] = getProgramsForMode(startupOperatingMode, {
    isDeeptech: isDeeptechSub,
    limit: RECOMMENDED_PROGRAM_COUNT_BY_MODE[startupOperatingMode],
  });

  const modeLabels: Record<OperatingMode, { ko: string; en: string }> = {
    indie: { ko: "1인 인디", en: "Solo indie" },
    bootstrap: { ko: "부트스트랩", en: "Bootstrapped" },
    seed: { ko: "시드 단계", en: "Seed-funded" },
    seriesA: { ko: "시리즈A 이상", en: "Series A+" },
  };

  const categoryLabels: Record<string, { ko: string; en: string }> = {
    "government-grant": { ko: "정부 보조금", en: "Govt Grant" },
    "policy-loan": { ko: "정책 융자", en: "Policy Loan" },
    "matching-fund": { ko: "매칭 펀드", en: "Matching" },
    "vc-investment": { ko: "VC 투자", en: "VC" },
    "accelerator": { ko: "액셀러레이터", en: "Accelerator" },
    "crowdfunding": { ko: "크라우드펀딩", en: "Crowdfunding" },
    "competition": { ko: "공모전·대회", en: "Competition" },
    "facility-support": { ko: "공간·컨설팅", en: "Facility" },
    "deeptech": { ko: "딥테크 특화", en: "Deeptech" },
  };

  // ── 사업계획서: decisions에서 복원 ──
  const savedBp = (decisions["fundraising-readiness"] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
  const hasSavedBp = !!(savedBp?.bpSections);
  if (hasSavedBp && !bpSections && !bpLoading) {
    setBpSections(savedBp.bpSections as Array<{ title: string; content: string }>);
    setBpSummary((savedBp.bpSummary as string) ?? null);
  }

  // ── 사업계획서 생성 ──
  const generatePlanFR = async () => {
    setBpLoading(true);
    setBpError(null);
    try {
      const loc = decisions["location-candidates"];
      const sfInputs = (decisions["startup-foundation"] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
      const geInputs = (decisions["growth-engine"] as Record<string, unknown>)?.inputs as Record<string, unknown> | undefined;
      const body = {
        industry: industryCategoryId,
        subIndustry: selectedIndustryId ?? "",
        startupType: startupType ?? "independent",
        businessModel: selectedBusinessModelId ?? "",
        capital: selectedBudget ?? 0,
        targetOpenDate: decisions["budget-setup"]?.inputs?.targetOpenDate ?? "",
        location: loc?.selectedPrimaryOptionId ?? "",
        bepRevenue: savedFinanceSnapshot?.breakEvenRevenue,
        runway: savedFinanceSnapshot?.survivabilityMonths,
        riskLevel: savedFinanceSnapshot?.riskLevel,
        language: d.language,
        purpose: "govt-support" as const,
        problemStatement: sfInputs?.problemStatement as string | undefined,
        teamStructure: sfInputs?.teamStructure as string | undefined,
        northStarType: geInputs?.northStarType as string | undefined,
        northStarMetricName: geInputs?.northStarMetricName as string | undefined,
        targetCustomer: guideSelections["interview-target"] || undefined,
      };
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error(ko ? "로그인이 필요합니다" : "Login required");
      const res = await fetch("/api/ai/business-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBpSections(data.sections);
      setBpSummary(data.summary);
      const prev = decisions["fundraising-readiness"] ?? { stageId: "fundraising-readiness" };
      const prevInputs = (prev as Record<string, unknown>).inputs as Record<string, unknown> ?? {};
      d.setDecisions({
        ...decisions,
        "fundraising-readiness": {
          ...prev,
          stageId: "fundraising-readiness",
          inputs: { ...prevInputs, bpSections: data.sections, bpSummary: data.summary, bpSavedAt: new Date().toISOString() },
        } as typeof prev,
      });
    } catch (err) {
      setBpError(err instanceof Error ? err.message : "Failed");
    }
    setBpLoading(false);
  };

  return (
    <div className="bento-fade-in" style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={ko ? "투자가 정말 필요한가? 런웨이 18개월 + Default Alive 가 표준" : "Is investment really needed? 18-month runway + Default Alive"}
        subtitle={
          ko ? (
            <>
              2026 투자 표준: <strong style={{ fontWeight: 700 }}>런웨이 18+개월</strong>, <strong style={{ fontWeight: 700 }}>Net Burn &lt; 2x Net New ARR</strong>, Default Alive (자체 매출로 생존). 솔로 파운더 52%가 외부 투자 없이 엑싯. 투자는 가속 도구일 뿐 — 매출이 답일 수도 있습니다.
            </>
          ) : (
            <>
              2026 standard: <strong>18+ months runway</strong>, <strong>Net Burn &lt; 2x Net New ARR</strong>, Default Alive. 52% of solo founders exited without VC.
            </>
          )
        }
        miniCards={[
          { icon: HelpCircle, label: ko ? "PATH A" : "PATH A", detail: ko ? "부트스트랩" : "Bootstrap" },
          { icon: DollarSign, label: ko ? "PATH B" : "PATH B", detail: ko ? "정부지원·VC" : "Grant·VC" },
          { icon: Trophy, label: ko ? "70+ 프로그램" : "70+ progs", detail: ko ? "모드별 매칭" : "Mode-matched" },
        ]}
      />

      <StartupPageNav
        page={pg}
        totalPages={totalPg}
        labels={pgLabels}
        onChange={(p) => d.setGuideStepIndex(p)}
        ko={ko}
      />

      {/* ═════════════ PAGE 0 — 왜 + 런웨이 자가 진단 ═════════════ */}
      {pg === 0 && (
        <>
          <Section icon={Lightbulb} title={ko ? "왜 런웨이·투자 준비 단계가 중요한가" : "Why this stage matters"}>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                {(ko ? [
                  {
                    accent: "#dc2626",
                    title: "Default Dead vs Default Alive — 2026 투자 표준",
                    body: "Paul Graham 의 분류. \"Default Dead\" = 현재 매출 추세 + 현금으로 죽음 → 외부 투자 없이는 생존 불가. \"Default Alive\" = 자체 매출로 생존 가능 → 투자는 가속 옵션. 2026 투자자는 Default Alive 만 선호 — 폭발적 성장 아니면 Default Dead 거의 펀딩 안 받음.",
                  },
                  {
                    accent: MIDNIGHT,
                    title: "런웨이 18+개월 = 절대 표준 (12개월은 너무 짧음)",
                    body: "현재 현금 ÷ 월 burn rate = 런웨이. 12개월 = 시리즈A 라운드 9-12개월 걸리니 자금 끊기 직전에 협상 = 협상력 0. 18개월 = 6개월 안전 마진 + 9-12개월 라운드 + 다음 6개월 가속.",
                  },
                  {
                    accent: "#0561fc",
                    title: "Net Burn < 2x Net New ARR (capital efficiency)",
                    body: "월 신규 ARR 1억 추가 시 = 월 burn 2억 이내. 이 비율 못 맞추면 \"비효율적 성장\" 으로 시리즈A·B 거절. 이건 SaaS 표준이며 한국 VC 도 점점 중시.",
                  },
                  {
                    accent: "#059669",
                    title: "솔로 파운더 52%는 투자 없이 엑싯 (2026)",
                    body: "Marc Lou·Pieter Levels 처럼 부트스트랩으로 $1M+ ARR 가능. 투자는 강제 아님. \"빠른 성장 시장\" 이거나 \"네트워크 효과\" 가 핵심일 때만 진짜 필요.",
                  },
                ] : [
                  { accent: "#dc2626", title: "Default Dead vs Default Alive", body: "Paul Graham. 2026 VCs only fund Default Alive." },
                  { accent: MIDNIGHT, title: "18+ month runway = standard", body: "12mo too short — Series A takes 9-12mo." },
                  { accent: "#0561fc", title: "Net Burn < 2x Net New ARR", body: "Standard SaaS metric." },
                  { accent: "#059669", title: "52% solo founders exit no VC", body: "Marc Lou, Pieter Levels: $1M+ bootstrapped." },
                ]).map((item, idx, arr) => (
                  <div key={idx}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "100px", background: item.accent, marginTop: "8px", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: "4px" }}>{item.title}</div>
                        <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>{item.body}</div>
                      </div>
                    </div>
                    {idx < arr.length - 1 && <div style={{ height: "1px", background: "rgba(0,0,0,0.05)", marginLeft: "18px", marginTop: "10px" }} />}
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* 런웨이 자가 진단 */}
          <Section icon={Calculator} title={ko ? "런웨이 자가 진단 — 3가지 숫자만 알면 됨" : "Runway self-check"}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              {(ko ? [
                {
                  label: "1. 현재 통장 잔고", hint: "사업용·개인 합산. 정확한 숫자 (약 X천만 X)",
                  ex: "예: 5,000만원",
                },
                {
                  label: "2. 월 고정비용 (BURN RATE)", hint: "서버·도구·인건비·생활비 모두 포함. 빠짐없이 계산.",
                  ex: "예: 600만원/월 (인건비 400 + 도구 100 + 생활비 100)",
                },
                {
                  label: "3. 런웨이 = 잔고 ÷ 월 비용", hint: "예 5,000만 ÷ 600만 = 약 8개월. 6개월 미만 = 즉시 행동 필요. 18개월 미만 = 라운드 시작.",
                  ex: "예: 5,000 ÷ 600 = 8.3개월 (위험)",
                },
              ] : [
                { label: "1. Current cash", hint: "Personal + business combined", ex: "e.g., $50K" },
                { label: "2. Monthly burn", hint: "All-in: salary + tools + living", ex: "e.g., $6K/mo" },
                { label: "3. Runway = cash ÷ burn", hint: "<6 mo = act now. <18 mo = start round.", ex: "8.3 months (danger)" },
              ]).map((q, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, marginBottom: "4px" }}>{q.label}</div>
                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.55, marginBottom: "4px" }}>{q.hint}</div>
                  <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.5)", fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>{q.ex}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* 모드별 한 줄 권장 */}
          <Section icon={Target} title={ko ? "본인 모드에 맞는 한 줄 권장" : "By your mode"}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              {(ko ? [
                { mode: "indie", title: "1인 인디", line: "투자 X. 정부 보조금 (예비창업패키지 1억) + 매출이 답. 부트스트랩으로 $1M ARR 가능." },
                { mode: "bootstrap", title: "부트스트랩", line: "정부지원 (TIPS·R&D) 우선 + 매출. 투자는 PMF 입증 후 시리즈A 만 검토." },
                { mode: "seed", title: "시드 단계", line: "1-2억 시드 라운드 + TIPS 매칭으로 R&D 5억까지. 18-24개월 안에 시리즈A 마일스톤." },
                { mode: "seriesA", title: "시리즈A 이상", line: "30-100억 시리즈A. ARR $1M+ + 18+개월 런웨이 + Net Burn < 2x ARR 표준." },
              ] : [
                { mode: "indie", title: "Solo Indie", line: "No VC. Govt grant + revenue." },
                { mode: "bootstrap", title: "Bootstrap", line: "Govt + revenue. VC only post-PMF." },
                { mode: "seed", title: "Seed", line: "1-2억 + TIPS 5억. 18-24mo to Series A." },
                { mode: "seriesA", title: "Series A+", line: "30-100억. ARR $1M+ + 18mo runway." },
              ]).map((m) => {
                const active = startupOperatingMode === m.mode;
                return (
                  <div key={m.mode} style={{
                    padding: "12px 14px", borderRadius: "12px",
                    background: active ? MIDNIGHT_SOFT : "white",
                    border: `1px solid ${active ? MIDNIGHT : MIDNIGHT_BORDER}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{
                        fontSize: "10.5px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px",
                        background: active ? MIDNIGHT : "rgba(0,0,0,0.05)",
                        color: active ? "#fff" : "rgba(15,23,42,0.55)",
                      }}>
                        {m.title}
                      </span>
                      {active && <span style={{ fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT }}>← 본인 모드</span>}
                    </div>
                    <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.6 }}>{m.line}</div>
                  </div>
                );
              })}
            </div>
          </Section>
        </>
      )}

      {/* ═════════════ PAGE 1 — 부트스트랩 vs 투자 의사결정 ═════════════ */}
      {pg === 1 && (
        <>
          <Section icon={HelpCircle} title={ko ? "PATH A — 투자 없이 시작 (Bootstrap)" : "PATH A — Bootstrap"}>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.65, marginBottom: "12px" }}>
                {ko
                  ? "고객이 돈을 내는 순간부터 자유. 지분 희석 X, 이사회 승인 X, 본인 속도. Marc Lou ($70K/월), Pieter Levels ($3M+/년) 모두 부트스트랩."
                  : "Free from day-1 of customer payments. Marc Lou, Pieter Levels both bootstrap."}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.45)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>이 경로 선택 조건</div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.7, marginBottom: "10px" }}>
                {(ko ? [
                  "고객이 돈을 낼 의사 명확 (PMF 입증 또는 빠른 검증 가능)",
                  "B2B SaaS·정보 상품·콘텐츠 비즈니스 (낮은 초기 비용)",
                  "5-15명 팀이 적정 규모 (대규모 영업 X)",
                  "지분 100% 보유 + 본인 결정권 우선",
                ] : [
                  "Clear customer WTP",
                  "Low initial cost biz model",
                  "5-15 person team OK",
                  "Want 100% equity + control",
                ]).map((t, i) => <li key={i}>{t}</li>)}
              </ul>
              <div style={{ padding: "10px 12px", borderRadius: "10px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}` }}>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT, marginBottom: "2px" }}>다음 액션</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>
                  ① 정부 보조금·공모전 (Page 2) — 비희석 자금<br />
                  ② 첫 유료 고객 10명 (Stage 9 launch_gtm 참고)<br />
                  ③ 월 매출 → 월 비용 커버 시점까지 단축
                </div>
              </div>
            </div>
          </Section>

          <Section icon={DollarSign} title={ko ? "PATH B — 투자 유치 (Fundraise)" : "PATH B — Raise Investment"}>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.65, marginBottom: "12px" }}>
                {ko
                  ? "시장을 빠르게 선점해야 할 때. \"승자독식\" 시장, 네트워크 효과 핵심, 큰 R&D 비용. Peter Thiel: \"CEO 연봉 15만 달러 넘으면 정치인이 시작.\""
                  : "When market needs fast capture — winner-takes-all, network effects, high R&D."}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.45)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>투자 유치 전 5가지 준비</div>
              {(ko ? [
                { num: 1, title: "런웨이 모델링 (3가지 시나리오)", detail: "Best/Base/Worst. 각 시나리오에서 18+개월 유지하는 burn rate 도출. Excel·Notion·Causal 활용." },
                { num: 2, title: "다음 마일스톤 정의 + 자금 사용 계획", detail: "투자금으로 달성할 구체적 목표 (ARR $1M, 사용자 10K, PMF Sean Ellis 40%+). 각 단계별 자금 배분 명시." },
                { num: 3, title: "투자 필요성 정당화 (Default Alive 검증)", detail: "이 돈이 없으면 정말 못 하는 건지? 느려질 뿐인지? VC 가 묻는 가장 첫 질문. 명확한 답이 없으면 투자 안 받는 게 좋음." },
                { num: 4, title: "투자자 스토리라인 (10장 피치덱)", detail: "문제 → 솔루션 → 시장 (TAM/SAM/SOM) → 견인력 → 비즈니스 모델 → 팀 → 재무 → 자금 사용 → 마일스톤 → Ask." },
                { num: 5, title: "법인 설립 + Cap table 정리", detail: "투자자는 개인사업자 X 법인만. SAFE·CB 또는 우선주 결정. Cap table 깔끔히 (벤처기업 인증 + 옵션풀 사전 확보)." },
              ] : [
                { num: 1, title: "Runway model (3 scenarios)", detail: "Best/Base/Worst. 18+ months in all." },
                { num: 2, title: "Next milestone + use of funds", detail: "ARR $1M, 10K users, PMF 40%+." },
                { num: 3, title: "Justify need (Default Alive check)", detail: "Can't do without money? Or just slower?" },
                { num: 4, title: "Investor storyline (10-slide deck)", detail: "Problem→Solution→Market→Traction→Model→Team→Financial→Use→Milestone→Ask." },
                { num: 5, title: "Incorporate + clean cap table", detail: "Corp only. SAFE/CB/preferred. Venture cert + option pool." },
              ]).map((s) => (
                <div key={s.num} style={{ display: "flex", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: MIDNIGHT_SOFT, marginBottom: "6px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>{s.title}</div>
                    <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 의사결정 매트릭스 */}
          <Section icon={Sparkles} title={ko ? "결정 매트릭스 — 본인 상황 체크" : "Decision matrix"}>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(5,150,105,0.04)", border: "1px solid rgba(5,150,105,0.2)" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#059669", marginBottom: "6px" }}>Bootstrap 권장 ✓</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.65 }}>
                    {(ko ? [
                      "솔로 또는 1-3명 팀",
                      "B2B SaaS·정보 상품",
                      "고객이 즉시 돈 낼 의사 있음",
                      "한국 시장 위주",
                      "지분 100% 유지 원함",
                    ] : ["Solo or 1-3 team", "B2B SaaS", "Immediate WTP", "Korea focus", "Want 100% equity"]).map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: "10px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT}30` }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: MIDNIGHT, marginBottom: "6px" }}>VC 투자 권장 ✓</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.65 }}>
                    {(ko ? [
                      "승자독식·네트워크 효과 시장",
                      "큰 초기 R&D (딥테크·바이오)",
                      "글로벌 동시 진출 필요",
                      "공동창업자 2-5명 + 채용 필요",
                      "PMF 입증 후 가속이 핵심",
                    ] : ["Winner-takes-all", "Heavy R&D upfront", "Global simultaneous", "Multiple co-founders + hires", "Post-PMF acceleration"]).map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* ═════════════ PAGE 2 — 모드별 70+ 검증 프로그램 ═════════════ */}
      {pg === 2 && (
        <>
          <Section icon={Trophy} title={ko ? `${modeLabels[startupOperatingMode].ko} — ${recommendedPrograms.length}개 검증 프로그램` : `${modeLabels[startupOperatingMode].en} — ${recommendedPrograms.length} verified programs`}>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, marginBottom: "12px" }}>
                {ko
                  ? "1인 인디든 시리즈A 팀이든 모두 자금이 필요. 적합한 자금원이 다를 뿐 — 본인 모드에 맞는 검증된 프로그램만 표시. 모드 변경하려면 예산 설정 단계로."
                  : "Every founder needs funding — different sources by stage."}
              </div>

              {/* 모드 비교 토글 */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginBottom: "14px" }}>
                {(["indie", "bootstrap", "seed", "seriesA"] as OperatingMode[]).map((m) => {
                  const active = startupOperatingMode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setStartupOperatingMode(m)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: active ? 700 : 600,
                        background: active ? MIDNIGHT : "transparent",
                        color: active ? "#fff" : "rgba(15,23,42,0.55)",
                        border: active ? "none" : `1px solid ${MIDNIGHT_BORDER}`,
                        cursor: "pointer",
                        boxShadow: active ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
                      }}
                    >
                      {ko ? modeLabels[m].ko : modeLabels[m].en}
                    </button>
                  );
                })}
              </div>

              {/* 프로그램 카드 그리드 */}
              <div style={{ display: "grid", gap: "10px" }}>
                {recommendedPrograms.map((p) => {
                  const cLabel = ko ? (categoryLabels[p.category]?.ko ?? p.category) : (categoryLabels[p.category]?.en ?? p.category);
                  return (
                    <a
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: "white",
                        border: `1px solid ${MIDNIGHT_BORDER}`,
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{
                            display: "inline-block",
                            padding: "2px 8px", borderRadius: "5px",
                            background: MIDNIGHT_SOFT, color: MIDNIGHT,
                            fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.04em",
                            marginBottom: "5px",
                          }}>{cLabel}</span>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{p.name}</div>
                          <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", marginTop: "2px" }}>{p.organizer}</div>
                        </div>
                        <div style={{
                          padding: "4px 10px", borderRadius: "8px",
                          background: MIDNIGHT, color: "#fff",
                          fontSize: "11.5px", fontWeight: 700, whiteSpace: "nowrap" as const, flexShrink: 0,
                        }}>{p.amount}</div>
                      </div>
                      <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55, marginBottom: "6px" }}>{p.summary}</div>
                      {p.eligibility && (
                        <div style={{ padding: "6px 10px", borderRadius: "8px", background: "rgba(0,0,0,0.025)", fontSize: "11.5px", color: "rgba(15,23,42,0.6)", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700 }}>{ko ? "자격: " : "Eligibility: "}</span>{p.eligibility}
                        </div>
                      )}
                      {p.deadlineNote && (
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "5px", fontSize: "11.5px", color: MIDNIGHT, fontWeight: 700 }}>
                          <AlertTriangle size={11} strokeWidth={2.4} />
                          {p.deadlineNote}
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "4px", marginTop: "8px", fontSize: "11px", color: MIDNIGHT, fontWeight: 600 }}>
                        {ko ? "공식 페이지" : "Official page"}
                        <ExternalLink size={11} strokeWidth={2.2} />
                      </div>
                    </a>
                  );
                })}
              </div>

              {recommendedPrograms.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center" as const, fontSize: "12.5px", color: "rgba(15,23,42,0.5)" }}>
                  {ko ? "이 모드 매칭 프로그램 X — 다른 모드 시도" : "No matches — try another mode"}
                </div>
              )}
            </div>
          </Section>
        </>
      )}

      {/* ═════════════ PAGE 3 — 투자자 만나기 + AI 사업계획서 ═════════════ */}
      {pg === 3 && (
        <>
          <Section icon={Target} title={ko ? "투자자를 만나는 5가지 현실 방법" : "5 realistic ways to meet investors"}>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.6, marginBottom: "8px" }}>
                {ko ? "콜드 이메일 답변율 < 2%. 아래 방법이 10배 효과적." : "Cold email <2% response. These work 10x better."}
              </div>
              {(ko ? [
                { num: 1, title: "TIPS 운영사를 먼저 공략", detail: "TIPS 149개 운영사가 직접 투자. jointips.or.kr에서 우리 분야 운영사 찾고 포트폴리오 확인. 운영사 1억+ 선투자 → 정부 5억 매칭. 가장 현실적인 첫 투자.", url: "https://www.jointips.or.kr" },
                { num: 2, title: "액셀러레이터 데모데이 지원", detail: "SparkLabs·프라이머·블루포인트·매쉬업엔젤스. 3-6개월 프로그램 후 데모데이에서 VC 앞 피칭. 콜드 대비 10배. 선발율 3-5%, 여러 곳 동시 지원.", url: "https://www.k-startup.go.kr" },
                { num: 3, title: "스타트업 행사에서 직접", detail: "넥스트라이즈·비론치·스타트업위크엔드·코리아핀테크위크. 30초 엘리베이터 피치 + 명함 대신 1페이지 요약 건네기.", url: "https://nextrise.kr" },
                { num: 4, title: "따뜻한 소개 만들기", detail: "LinkedIn 에서 타겟 VC 의 포트폴리오 대표 찾고 공통 지인 통해 소개. \"OOO 대표 소개로 연락\" 이 콜드보다 10배. 액셀러레이터·멘토 활용.", url: "https://www.linkedin.com" },
                { num: 5, title: "피칭 전 4가지 필수 준비", detail: "① 10장 피치덱 ② 재무 모델 (3년·burn·runway) ③ 제품 데모 (작동 MVP) ④ 고객 증거 (유저·매출·후기). 이 4개 없으면 미팅 잡혀도 의미 X.", url: "" },
              ] : [
                { num: 1, title: "Target TIPS operators first", detail: "149 operators direct invest.", url: "https://www.jointips.or.kr" },
                { num: 2, title: "Apply to accelerator demo days", detail: "SparkLabs, Primer, Bluepoint.", url: "https://www.k-startup.go.kr" },
                { num: 3, title: "Meet at startup events", detail: "NextRise, beLAUNCH.", url: "https://nextrise.kr" },
                { num: 4, title: "Get warm intros", detail: "10x more effective than cold.", url: "https://www.linkedin.com" },
                { num: 5, title: "4 things before any meeting", detail: "Deck, model, demo, evidence.", url: "" },
              ]).map((s) => (
                <div key={s.num} style={{ display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "3px" }}>{s.title}</div>
                    <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55, marginBottom: s.url ? "6px" : 0 }}>{s.detail}</div>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 600, color: MIDNIGHT, textDecoration: "none" }}>
                        {ko ? "공식 페이지" : "Official"} <ExternalLink size={11} strokeWidth={2.2} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* AI 사업계획서 생성 */}
          <Section icon={FileText} title={ko ? "AI 사업계획서 자동 생성 — 정부지원사업용" : "AI Business Plan Generator"}>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.7)", lineHeight: 1.6, marginBottom: "12px" }}>
                {ko
                  ? "이전 단계 (문제 정의·팀·고객 발견·성장 엔진) 의 입력 + 본인 모드를 기반으로 AI 가 한국 정부 지원사업 (예비창업·초기창업·TIPS) 표준 양식의 사업계획서를 자동 생성. 검토 후 그대로 제출 가능."
                  : "AI generates Korean government grant-ready business plan from your prior inputs."}
              </div>

              {!bpSections && !bpLoading && (
                <button
                  type="button"
                  onClick={generatePlanFR}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: MIDNIGHT,
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(25,25,112,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Sparkles size={14} strokeWidth={2.4} />
                  {ko ? "AI 사업계획서 생성하기" : "Generate Business Plan"}
                </button>
              )}

              {bpLoading && (
                <div style={{ padding: "30px", textAlign: "center" as const, fontSize: "12.5px", color: MIDNIGHT, background: MIDNIGHT_SOFT, borderRadius: "12px" }}>
                  {ko ? "AI 가 사업계획서 생성 중... (10-30초)" : "Generating... (10-30s)"}
                </div>
              )}

              {bpError && (
                <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)", fontSize: "12px", color: "#dc2626", marginTop: "10px" }}>
                  {ko ? "오류: " : "Error: "}{bpError}
                </div>
              )}

              {bpSections && bpSections.length > 0 && (
                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                  {bpSummary && (
                    <div style={{ padding: "12px 14px", borderRadius: "10px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}` }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, marginBottom: "4px", letterSpacing: "0.06em" }}>요약</div>
                      <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.78)", lineHeight: 1.6 }}>{bpSummary}</div>
                    </div>
                  )}
                  {bpSections.map((sec, i) => (
                    <details key={i} style={{ padding: "12px 14px", borderRadius: "10px", border: `1px solid ${MIDNIGHT_BORDER}`, background: "white" }}>
                      <summary style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, cursor: "pointer", listStyle: "none" }}>
                        <span style={{ marginRight: "6px" }}>{i + 1}.</span>{sec.title}
                      </summary>
                      <div style={{ marginTop: "8px", fontSize: "12.5px", color: "rgba(15,23,42,0.78)", lineHeight: 1.7, whiteSpace: "pre-wrap" as const }}>
                        {sec.content}
                      </div>
                    </details>
                  ))}
                  <button
                    type="button"
                    onClick={generatePlanFR}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: "white",
                      color: MIDNIGHT,
                      fontSize: "12px",
                      fontWeight: 600,
                      border: `1px solid ${MIDNIGHT_BORDER}`,
                      cursor: "pointer",
                    }}
                  >
                    {ko ? "다시 생성하기" : "Regenerate"}
                  </button>
                </div>
              )}
            </div>
          </Section>
        </>
      )}

      <StageWrapup
        ko={ko}
        nextStageLabelKo="벤처 인증"
        doneItemsKo={[
          { label: "1. 캡테이블·런웨이 정리", detail: "지분 구조 + 옵션 풀 + 18개월 런웨이 + 마일스톤" },
          { label: "2. 펀딩 라운드 결정", detail: "TIPS·시드·시리즈 A 비교 + 정부지원금 매칭" },
          { label: "3. 데크·재무 모델", detail: "10~15페이지 데크 + 5년 재무 모델 + 시나리오 3종" },
          { label: "4. 투자자 매칭·미팅", detail: "VC·엔젤 매칭 + 1차 미팅 + 듀딜 자료 사전 준비" },
        ]}
        verifyItemsKo={[
          "캡테이블 — 공동창업자 vesting 미설정 시 투자 거절 1순위, 1년 cliff + 4년 vesting 표준",
          "정부지원금 — TIPS·예비창업·초기창업 등 신청 후 입금까지 평균 4~12주, 일정 역산",
          "런웨이 — 18개월 미만이면 fundraising에 집중, 12개월 미만이면 위기",
          "데크 — 「Big Idea + Team + Traction」 3축 명확, 모호한 사업 모델은 즉시 거절",
          "텀시트 — Liquidation Preference·Anti-dilution·Drag-along 등 핵심 조항 변호사 검토",
          "정관 — 우선주·전환사채·전환우선주 사전 정의, 미정의 시 투자 단계에서 재작성 비용",
        ]}
        nextSummaryKo="캡테이블·런웨이·데크·투자자 매칭 완료 → 벤처 인증 단계로 진입"
      />
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "0 4px" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: MIDNIGHT_SOFT, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} strokeWidth={2.2} color={MIDNIGHT} />
        </div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</div>
      </div>
      <div style={{ background: "white", borderRadius: "14px", border: `1px solid ${MIDNIGHT_BORDER}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(25,25,112,0.04)" }}>
        {children}
      </div>
    </div>
  );
}
