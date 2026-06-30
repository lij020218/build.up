//
//  BudgetInsightCard.tsx — 예산 인사이트 + 매칭 지원 프로그램 카드
//
//  웹 SSOT 의 budget-setup 단계에서 사용자의 시작 자본금 입력값을 받아:
//   1. 같은 업종(cluster) 평균과 비교 (descriptive, verdict 아님)
//   2. 차이가 있으면 운영자금 환산 (예: 2.7개월치)
//   3. 매칭 지원 프로그램 3-5건 추천 (always paired — 부족만 가리키지 않음)
//
//  디자인:
//   - 미드나잇 네이비 한 톤만 사용 (신호등 컬러 금지)
//   - 여백 중심, Apple-style 미니멀
//   - "부족" verdict 톤 회피 — 차분한 정보 제시
//

"use client";

import { useMemo, useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  computeBudgetInsight,
  CLUSTER_BUDGET_BENCHMARKS,
  getClusterForSubIndustry,
  getFranchiseBrandById,
  getMatchedProgramsV2,
  type ClusterId,
  type ProgramMatch,
  type StartupProgram,
} from "@foundone/shared";

export function BudgetInsightCard() {
  const d = useDashboardCtx();
  const { language, selectedBudget, selectedIndustryId, industryCategoryId, selectedFranchiseBrandId, startupType } = d;

  // ⚠️ 2026-06-30 사장님 신고: 프랜차이즈 선택 시 selectedIndustryId 가 비어있어(브랜드만 선택)
  //   "같은 업종 평균"이 세부업종(편의점 7,270) 대신 cluster(소매 17,000)로 떨어지던 버그.
  //   → 프랜차이즈면 브랜드의 specialtyIds/subIndustryIds 로 세부업종을 유도해 평균 비교에 사용.
  const effectiveSpecialtyId = useMemo<string | undefined>(() => {
    if (selectedIndustryId) return selectedIndustryId;
    if (startupType === "franchise" && selectedFranchiseBrandId) {
      const b = getFranchiseBrandById(selectedFranchiseBrandId);
      return b?.specialtyIds?.[0] ?? b?.subIndustryIds?.[0];
    }
    return undefined;
  }, [selectedIndustryId, startupType, selectedFranchiseBrandId]);

  const cluster: ClusterId | null = useMemo(
    () => getClusterForSubIndustry(effectiveSpecialtyId, industryCategoryId),
    [effectiveSpecialtyId, industryCategoryId],
  );

  // 사용자가 "확인" 을 눌러야 분석이 보임 — deliberate moment 로 만들기
  const [confirmed, setConfirmed] = useState(false);

  const ko = language === "ko";
  const userBudgetWon = selectedBudget ?? 0;
  const hasBudget = userBudgetWon > 0;

  // ⚠️ Hooks 는 early return *이전* 에 모두 호출되어야 함 (React rules of hooks).
  // confirmed=false → true 토글 시 hooks 개수가 달라지면 컴포넌트 crash → 사용자에게
  // "페이지 이동" 처럼 보이는 ErrorBoundary fallback 이 노출됨.
  const matches: ProgramMatch[] = useMemo(() => {
    if (!cluster) return [];
    return getMatchedProgramsV2({
      industryCategoryId,
      capital: userBudgetWon || undefined,
      businessStage: "pre-startup",
    }).slice(0, 4);
  }, [industryCategoryId, userBudgetWon, cluster]);

  // 이제 conditional return — 모든 hooks 호출 후
  if (!cluster || !CLUSTER_BUDGET_BENCHMARKS[cluster]) return null;

  if (!confirmed) {
    return (
      <ConfirmGate
        hasBudget={hasBudget}
        ko={ko}
        onConfirm={() => setConfirmed(true)}
      />
    );
  }

  // ⚠️ 2026-05-18: 프랜차이즈 선택한 사장님에겐 *그 브랜드 권장값* 을 1차 baseline 으로 사용.
  //   업종 평균과 비교한 모순 메시지 ("권장 7,000만으로 설정" → "업종 평균보다 부족") 회피.
  const franchiseRecommendedWon = (() => {
    if (startupType !== "franchise" || !selectedFranchiseBrandId) return undefined;
    const brand = getFranchiseBrandById(selectedFranchiseBrandId);
    // ⚠️ startupCostWon 은 필드명과 달리 *만원* 단위(예: CU 7,390 = 7,390만원). computeBudgetInsight
    //   는 원 단위를 기대(/10_000 → 만원)하므로 ×10_000 변환. 안 하면 7,390/10,000≈0.7→반올림 "1만원"
    //   으로 표시되던 버그(2026-06-23 사장님 신고).
    return brand?.startupCostWon != null ? brand.startupCostWon * 10_000 : undefined;
  })();
  // effectiveSpecialtyId(세부 업종, 프랜차이즈면 브랜드에서 유도) 전달 → 편의점 등 specialty 평균 우선.
  const insight = computeBudgetInsight(cluster, userBudgetWon, undefined, franchiseRecommendedWon, effectiveSpecialtyId);

  // 신호등 컬러 금지 — 미드나잇 네이비 한 톤
  const NAVY = "var(--primary, #1d3557)";
  const NAVY_MUTED = "rgba(29,53,87,0.62)";
  const NAVY_FAINT = "rgba(29,53,87,0.04)";
  const NAVY_LINE = "rgba(29,53,87,0.08)";

  return (
    <div
      style={{
        marginBottom: "18px",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.78)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,245,250,0.88) 100%)",
        boxShadow: "0 10px 30px rgba(17,17,17,0.04)",
        overflow: "hidden",
      }}
      className="bento-fade-in"
    >
      {/* ── 헤더 ── */}
      <div style={{ padding: "22px 24px 8px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: NAVY_MUTED,
            marginBottom: "8px",
          }}
        >
          {ko ? "시설 비용 분석 · 세부 업종 평균 비교" : "Setup cost vs sub-industry average"}
        </div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 680,
            letterSpacing: "-0.025em",
            color: "#0f172a",
            lineHeight: 1.35,
          }}
        >
          {insight.headlineKo}
        </div>
        <div
          style={{
            fontSize: "13px",
            color: NAVY_MUTED,
            marginTop: "4px",
            lineHeight: 1.5,
          }}
        >
          {insight.subtitleKo}
        </div>
      </div>

      {/* ── 비교 막대 ── */}
      <div style={{ padding: "16px 24px 4px" }}>
        <ComparisonBar
          userWan={insight.userWan}
          avgWan={insight.avgWan}
          p25Wan={insight.benchmark.p25Wan}
          p75Wan={insight.benchmark.p75Wan}
        />
      </div>

      {/* ── 매칭 프로그램 ── */}
      {matches.length > 0 && (
        <div
          style={{
            margin: "16px 24px 0",
            padding: "16px 0 0",
            borderTop: `1px solid ${NAVY_LINE}`,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: NAVY_MUTED,
              marginBottom: "10px",
            }}
          >
            {ko ? "지원 프로그램" : "Support Programs"}
          </div>
          <div
            style={{ fontSize: "13px", color: NAVY_MUTED, marginBottom: "12px" }}
          >
            {insight.programIntroKo}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {matches.map((m) => (
              <ProgramRow
                key={m.id}
                program={m}
                ko={ko}
                navy={NAVY}
                navyMuted={NAVY_MUTED}
                navyFaint={NAVY_FAINT}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 부연 컨텍스트 (자료의 한계·범위 안내) ── */}
      {insight.benchmark.noteKo && (
        <div
          style={{
            margin: "12px 24px 0",
            padding: "12px 14px",
            borderRadius: "12px",
            background: NAVY_FAINT,
            fontSize: "11.5px",
            lineHeight: 1.55,
            color: "rgba(15,23,42,0.72)",
          }}
        >
          {insight.benchmark.noteKo}
        </div>
      )}

      {/* ── 푸터 (출처) ── */}
      <div
        style={{
          padding: "14px 24px 18px",
          marginTop: "12px",
          borderTop: `1px solid ${NAVY_LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: NAVY_MUTED,
            lineHeight: 1.5,
          }}
        >
          {ko ? "출처: " : "Source: "}
          {insight.benchmark.source}
          {insight.benchmark.isEstimate && (
            <span
              style={{
                marginLeft: "6px",
                padding: "1px 6px",
                borderRadius: "4px",
                background: NAVY_FAINT,
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              {ko ? "추정치" : "estimate"}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: NAVY_MUTED,
            fontWeight: 500,
          }}
        >
          {insight.benchmark.yearReported}
        </div>
      </div>
    </div>
  );
}

// MARK: - Comparison Bar

function ComparisonBar({
  userWan,
  avgWan,
  p25Wan,
  p75Wan,
}: {
  userWan: number;
  avgWan: number;
  p25Wan: number;
  p75Wan: number;
}) {
  // 시각화 범위: [0 .. max(userWan, p75Wan * 1.1)]
  const maxWan = Math.max(userWan, p75Wan * 1.15, avgWan * 1.4);
  const pct = (n: number) => `${Math.min(100, (n / maxWan) * 100)}%`;

  const NAVY = "var(--primary, #1d3557)";

  return (
    <div style={{ position: "relative", paddingTop: "32px", paddingBottom: "28px" }}>
      {/* 평균 표시 (위) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: pct(avgWan),
          transform: "translateX(-50%)",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.05em",
          color: "rgba(29,53,87,0.55)",
          whiteSpace: "nowrap",
        }}
      >
세부 업종 평균 {avgWan.toLocaleString()}만
      </div>

      {/* 트랙 */}
      <div
        style={{
          position: "relative",
          height: "8px",
          borderRadius: "999px",
          background: "rgba(29,53,87,0.06)",
          overflow: "visible",
        }}
      >
        {/* p25-p75 분위 밴드 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: pct(p25Wan),
            right: `calc(100% - ${pct(p75Wan)})`,
            background: "rgba(29,53,87,0.12)",
            borderRadius: "999px",
          }}
        />
        {/* 평균 마커 (세로선) */}
        <div
          style={{
            position: "absolute",
            top: "-4px",
            bottom: "-4px",
            left: pct(avgWan),
            width: "2px",
            background: "rgba(29,53,87,0.45)",
            transform: "translateX(-1px)",
          }}
        />
        {/* 사용자 입력 마커 (큰 원) */}
        {userWan > 0 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: pct(userWan),
              transform: "translate(-50%, -50%)",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: NAVY,
              border: "3px solid #fff",
              boxShadow: "0 2px 8px rgba(29,53,87,0.35)",
            }}
          />
        )}
      </div>

      {/* 사용자 값 표시 (아래) */}
      {userWan > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: pct(userWan),
            transform: "translateX(-50%)",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: NAVY,
            whiteSpace: "nowrap",
          }}
        >
내 시설비 {userWan.toLocaleString()}만
        </div>
      )}
    </div>
  );
}

// MARK: - Program Row

function ProgramRow({
  program,
  ko,
  navy,
  navyMuted,
  navyFaint,
}: {
  program: StartupProgram;
  ko: boolean;
  navy: string;
  navyMuted: string;
  navyFaint: string;
}) {
  const name = program.name[ko ? "ko" : "en"];
  const organizer = program.organizer[ko ? "ko" : "en"];
  const benefit = program.benefit[ko ? "ko" : "en"];
  const target = program.target[ko ? "ko" : "en"];

  return (
    <a
      href={program.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        textDecoration: "none",
        padding: "14px 16px",
        borderRadius: "16px",
        background: navyFaint,
        border: "1px solid rgba(29,53,87,0.06)",
        color: "inherit",
        transition: "background 160ms, transform 160ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(29,53,87,0.07)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = navyFaint;
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
          gap: "8px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 650,
            color: "#0f172a",
            letterSpacing: "-0.01em",
            flex: 1,
          }}
        >
          {name}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{ flexShrink: 0, color: navy }}
        >
          <path
            d="M5 3L9 7L5 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div style={{ fontSize: "11px", color: navyMuted, marginBottom: "6px" }}>
        {organizer}
        {program.amount && (
          <>
            <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
            <span style={{ fontWeight: 600 }}>{program.amount}</span>
          </>
        )}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "rgba(15,23,42,0.72)",
          lineHeight: 1.5,
          marginBottom: "4px",
        }}
      >
        {benefit}
      </div>
      <div style={{ fontSize: "11px", color: navyMuted }}>
        {ko ? "자격: " : "Target: "}
        {target}
      </div>
    </a>
  );
}

// MARK: - Confirm Gate (확인 누르기 전)

function ConfirmGate({
  hasBudget,
  ko,
  onConfirm,
}: {
  hasBudget: boolean;
  ko: boolean;
  onConfirm: () => void;
}) {
  return (
    <div
      style={{
        marginBottom: "18px",
        borderRadius: "24px",
        border: "1px dashed rgba(29,53,87,0.18)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(245,245,250,0.55) 100%)",
        padding: "22px 24px",
        textAlign: "center",
      }}
    >
      {/* 아이콘 */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "rgba(29,53,87,0.07)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "12px",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2v3M10 15v3M2 10h3M15 10h3M4.5 4.5l2 2M13.5 13.5l2 2M4.5 15.5l2-2M13.5 6.5l2-2"
            stroke="rgba(29,53,87,0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        style={{
          fontSize: "15px",
          fontWeight: 650,
          letterSpacing: "-0.02em",
          color: "#0f172a",
          marginBottom: "6px",
        }}
      >
        {ko ? "예산 분석을 받아보세요" : "Get Your Budget Analysis"}
      </div>
      <div
        style={{
          fontSize: "12.5px",
          color: "rgba(29,53,87,0.62)",
          lineHeight: 1.55,
          marginBottom: "16px",
          maxWidth: "320px",
          margin: "0 auto 16px",
        }}
      >
        {ko
          ? "입력한 자본금이 같은 업종 평균과 어떻게 비교되는지, 부족하면 어떤 지원 프로그램을 받을 수 있는지 분석해드려요."
          : "See how your budget compares to industry averages, and which support programs you may qualify for if there's a shortfall."}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={!hasBudget}
        style={{
          padding: "11px 22px",
          borderRadius: "999px",
          border: "none",
          background: hasBudget
            ? "var(--primary, #1d3557)"
            : "rgba(29,53,87,0.12)",
          color: hasBudget ? "#fff" : "rgba(29,53,87,0.45)",
          fontSize: "13.5px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          cursor: hasBudget ? "pointer" : "not-allowed",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          transition: "transform 120ms, background 160ms",
        }}
        onMouseEnter={(e) => {
          if (hasBudget) e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          if (hasBudget) e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {ko ? "예산 확인하기" : "Analyze My Budget"}
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path
            d="M5 3l4 3.5L5 10"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {!hasBudget && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "rgba(29,53,87,0.45)",
          }}
        >
          {ko ? "먼저 시작 자본금을 입력해주세요" : "Enter your starting capital first"}
        </div>
      )}
    </div>
  );
}
