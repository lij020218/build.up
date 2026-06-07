"use client";

/**
 * BudgetFundingMatchCard — 예산 단계에서 사용자 선택 (업종·자본금·창업 형태) 기준으로
 *  79개 정부/민간 지원 프로그램 풀에서 매칭된 상위 4개를 표시.
 *
 *  iOS SSOT: apps/ios/Sources/FoundOneFeatures/Roadmap/Stages/BudgetSetupStageView.swift
 *  데이터 SSOT: packages/shared/src/startup-programs.ts (getMatchedProgramsV2)
 *
 *  목적:
 *   사장님이 예산 단계에서 "자본금이 부족하다" 고 느낄 때, 같은 화면에서 즉시
 *   "예비창업패키지 1억", "TIPS 5억", "소상공인 정책자금 5천만원" 같은 보완 방안을
 *   본다. 별도 펀딩 탭 이동 없이 의사결정 가능.
 *
 *  ⚠️ 2026-05-25 신규 — iOS 와 동시 출시.
 */

import { useMemo, useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { useProfileStore } from "../../../stores/profile-store";
import { ageFromBirthYear } from "../../dashboard/OwnerProfileChips";
import {
  getMatchedProgramsV2,
  getApplicationStatusLabel,
  getProgramCategoryColor,
  getProgramCategoryLabel,
  type MatchCriteria,
  type ProgramMatch,
} from "@foundone/shared";

export function BudgetFundingMatchCard() {
  const d = useDashboardCtx();
  const {
    language,
    industryCategoryId,
    startupType,
    selectedBudget,
  } = d;
  // 사장님 프로필 보강 (로컬 영속) — 청년/시니어/신용취약/폐업/장애 정책자금 매칭에 반영.
  const ownerBirthYear = useProfileStore((s) => s.ownerBirthYear);
  const ownerNcbScore = useProfileStore((s) => s.ownerNcbScore);
  const ownerConsideringClosure = useProfileStore((s) => s.ownerConsideringClosure);
  const ownerIsDisabledOwner = useProfileStore((s) => s.ownerIsDisabledOwner);

  const ko = language === "ko";
  const [showAll, setShowAll] = useState(false);

  // 자본금 기반 단계 추정
  const businessStage: MatchCriteria["businessStage"] = (() => {
    if (!selectedBudget || selectedBudget < 30_000_000) return "pre-startup";
    if (selectedBudget < 100_000_000) return "early";
    return "growth";
  })();

  const matched: ProgramMatch[] = useMemo(() => {
    const criteria: MatchCriteria = {
      startupType: startupType || undefined,
      industryCategoryId: industryCategoryId || "food",
      capital: selectedBudget,
      businessStage,
      age: ageFromBirthYear(ownerBirthYear),
      ncbScore: ownerNcbScore,
      consideringClosure: ownerConsideringClosure,
      isDisabledOwner: ownerIsDisabledOwner,
    };
    const all = getMatchedProgramsV2(criteria);
    // 자격 충족 + 마감 안 된 것 우선, 개인화 점수 내림차순
    return all
      .filter((p) => p.applicationStatus !== "closed")
      .sort((a, b) => {
        if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
        return b.personalFitScore - a.personalFitScore;
      })
      .slice(0, 20);
  }, [industryCategoryId, startupType, selectedBudget, businessStage, ownerBirthYear, ownerNcbScore, ownerConsideringClosure, ownerIsDisabledOwner]);

  if (matched.length === 0) {
    return null;
  }

  const visible = showAll ? matched : matched.slice(0, 4);
  const eligibleCount = matched.filter((p) => p.eligible).length;

  const categoryNoun = (() => {
    switch (industryCategoryId) {
      case "food": return ko ? "음식점" : "food";
      case "cafe-dessert": return ko ? "카페·디저트" : "cafe & dessert";
      case "retail": return ko ? "소매" : "retail";
      case "beauty": return ko ? "미용" : "beauty";
      case "fitness": return ko ? "피트니스" : "fitness";
      case "education": return ko ? "교육" : "education";
      case "pet": return ko ? "반려동물" : "pet";
      case "living-service": return ko ? "생활서비스" : "living service";
      case "space": return ko ? "공간 임대" : "space rental";
      case "online-digital": return ko ? "온라인·디지털" : "online & digital";
      case "startup-tech": return ko ? "스타트업 테크" : "startup-tech";
      default: return ko ? "이" : "this";
    }
  })();

  const subtitle = (() => {
    const budgetLabel = selectedBudget && selectedBudget > 0
      ? `${ko ? "자본 " : "capital "}${formatWonShort(selectedBudget, ko)}`
      : ko ? "자본 미입력" : "no capital set";
    if (eligibleCount > 0) {
      return ko
        ? `${categoryNoun} 업종 · ${budgetLabel} 기준 — 자격 충족 ${eligibleCount}건. 자본금 부족분을 정책자금으로 보완하세요.`
        : `${categoryNoun} · ${budgetLabel} — ${eligibleCount} eligible. Use these to bridge any capital gap.`;
    }
    return ko
      ? `${categoryNoun} 업종 기준 — 자본금·업력 정보를 더 입력하면 맞춤 매칭이 정확해집니다.`
      : `${categoryNoun} — fine-tune criteria for better matching.`;
  })();

  return (
    <div
      style={{
        margin: "16px 0",
        borderRadius: "20px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
        border: "1px solid rgba(25,25,112,0.08)",
        boxShadow: "0 4px 12px rgba(17,17,17,0.04)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "18px 20px 14px" }}>
        <div style={{
          fontSize: 11,
          fontWeight: 800,
          color: "rgba(25,25,112,0.65)",
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
          marginBottom: 4,
        }}>
          {ko ? "예산이 부족하신가요? 정부 지원·정책자금 매칭" : "Need more capital? Match government programs"}
        </div>
        <div style={{
          fontSize: 12.5,
          color: "rgba(15,23,42,0.55)",
          lineHeight: 1.55,
        }}>
          {subtitle}
        </div>
      </div>

      <div style={{ padding: "0 12px 12px", display: "grid", gap: "8px" }}>
        {visible.map((prog) => (
          <FundingMiniRow key={prog.id} program={prog} language={language} />
        ))}
      </div>

      {matched.length > 4 && (
        <div style={{ padding: "0 12px 14px" }}>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: 12,
              border: "none",
              background: "rgba(25,25,112,0.08)",
              color: "#191970",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "-0.005em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {showAll
              ? (ko ? "접기" : "Collapse")
              : (ko ? `전체 ${matched.length}개 보기 →` : `Show all ${matched.length} →`)}
          </button>
        </div>
      )}
    </div>
  );
}

// ── compact card row ──

function FundingMiniRow({ program, language }: { program: ProgramMatch; language: "ko" | "en" }) {
  const ko = language === "ko";
  const pick = (loc: { ko: string; en: string }) => (ko ? loc.ko : loc.en);

  const statusInfo = getApplicationStatusLabel(program.applicationStatus, language);
  const dDayLabel = (() => {
    if (program.applicationStatus !== "open") return null;
    if (program.daysUntilDeadline == null) return null;
    const d = program.daysUntilDeadline;
    if (d <= 0) return null;
    return `D-${d}`;
  })();
  const dDayColor = (program.daysUntilDeadline ?? 999) <= 7 ? "#b64c4c" : "#191970";

  const categoryColor = getProgramCategoryColor(program.category);
  const categoryLabel = getProgramCategoryLabel(program.category, language);

  const topReason = [...program.matchReasons].sort((a, b) => b.weight - a.weight)[0];

  return (
    <a
      href={program.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        padding: "12px 14px",
        borderRadius: 14,
        background: "rgba(25,25,112,0.04)",
        border: "1px solid rgba(25,25,112,0.08)",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(25,25,112,0.07)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(25,25,112,0.04)"; }}
    >
      {/* badge row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6, alignItems: "center" }}>
        <Badge label={categoryLabel} color={categoryColor} />
        {program.eligible && <Badge label={ko ? "자격 충족" : "Eligible"} color="#1d3557" />}
        {dDayLabel
          ? <Badge label={dDayLabel} color={dDayColor} />
          : <Badge label={statusInfo.label} color={statusInfo.color} />}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "rgba(15,23,42,0.4)" }}>↗</div>
      </div>

      {/* title */}
      <div style={{
        fontSize: 14,
        fontWeight: 800,
        color: "#0f172a",
        letterSpacing: "-0.01em",
        marginBottom: 4,
        lineHeight: 1.35,
      }}>
        {pick(program.name)}
      </div>

      {/* organizer · amount */}
      <div style={{
        fontSize: 11,
        color: "rgba(15,23,42,0.55)",
        marginBottom: 4,
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "center",
      }}>
        <span>{pick(program.organizer)}</span>
        {program.amount && (
          <>
            <span style={{ color: "rgba(15,23,42,0.25)" }}>·</span>
            <span style={{ fontWeight: 700, color: "#191970" }}>{program.amount}</span>
          </>
        )}
      </div>

      {/* benefit */}
      <div style={{
        fontSize: 12,
        color: "rgba(15,23,42,0.6)",
        lineHeight: 1.45,
        marginBottom: 6,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical" as const,
        overflow: "hidden",
      }}>
        {pick(program.benefit)}
      </div>

      {/* top match reason */}
      {topReason && (
        <div style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: "rgba(25,25,112,0.85)",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          <span>✨</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pick(topReason)}
          </span>
        </div>
      )}
    </a>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      color,
      padding: "2px 7px",
      borderRadius: 999,
      background: `${color}1f`,  // 12% opacity hex
      letterSpacing: "-0.005em",
    }}>
      {label}
    </span>
  );
}

function formatWonShort(won: number, ko: boolean): string {
  if (won >= 100_000_000) {
    const eok = won / 100_000_000;
    return Number.isInteger(eok)
      ? `${eok}${ko ? "억원" : "₩100M"}`
      : `${eok.toFixed(1)}${ko ? "억원" : "₩100M"}`;
  }
  const man = Math.round(won / 10_000);
  return ko ? `${man.toLocaleString()}만원` : `₩${(man * 10_000).toLocaleString()}`;
}
