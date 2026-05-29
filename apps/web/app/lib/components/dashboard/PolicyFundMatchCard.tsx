"use client";

/**
 * PolicyFundMatchCard — 사장님 프로필에 맞는 정책자금 자동 매칭.
 *
 *  ── 2026-05-11 통합 (사용자 지침) ──────────────────────────────
 *  "펀딩 페이지에서 추천되는 프로그램이 정책 자금 카드에도 똑같이 추천되게 하자."
 *
 *  → 데이터 SSOT 통합: getRecommendedPrograms (startup-programs.ts) 한 곳에서
 *     펀딩 페이지(GuidesView) 와 본 카드가 동일 매칭 점수·추천 결과 공유.
 *
 *  필터:
 *    · category === "government" (정부·SEMAS·소진공 류)
 *    · fundingType ∈ {cash, credit, grant} (equity·VC 제외)
 *    · 또는 policyFundSubCategory 가 설정된 SEMAS 통합 항목
 *  ─────────────────────────────────────────────────────────────
 *
 *  분기 / 노출 조건:
 *    - 항상 노출 (정책자금은 모든 사업자 잠재 수혜)
 *    - 매출 감소·런웨이 부족·폐업 검토 등 위기 시그널 있을 때 우선 노출
 *
 *  매칭 입력:
 *    - 기본: industryCategoryId / businessYears / age / monthlyAvgRevenue / runway
 *    - 사용자 추가 입력: NCB 신용점수 / 폐업 검토 여부 / 장애인 여부
 *
 *  디자인: Found.One 토큰. 위기 시그널 시 amber/rose, 평상시 sky.
 */

import { useMemo, useState } from "react";
import { Coins, ExternalLink, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import {
  getRecommendedPrograms,
  type MatchCriteria,
  type ProgramMatch,
} from "@foundone/shared";

const MIDNIGHT_DEEP = "#141C3D";
const MIDNIGHT_SOFT = "#5A6BAE";
const TEXT_BODY = "#1A1F36";
const TEXT_MUTED = "#6B7393";
const SURFACE_LAVENDER = "#F4F5FB";
const HAIRLINE = "rgba(30,42,85,0.08)";
const HAIRLINE_STRONG = "rgba(30,42,85,0.16)";
const SKY = "#3B5BBF";
const SKY_BG = "#EAF2FF";
const AMBER_BG = "#FFF6E5";
const AMBER_TEXT = "#8A5B11";
const ROSE_BG = "#FCEEF1";
const ROSE_TEXT = "#9F1A2D";

type Props = {
  ko: boolean;
  /**
   * 매칭 입력 — 펀딩 페이지의 MatchCriteria 와 동일 shape. 부분 데이터 OK.
   *  종전엔 PolicyFundMatchInput 이라는 별도 타입이었으나 SSOT 통합으로 MatchCriteria 사용.
   */
  input: MatchCriteria;
  /** 위기 시그널 (런웨이 6개월 미만 / 매출 감소 10%↑) — 카드 톤 변경 */
  isCrisis?: boolean;
  /** 현재 월 이자 부담 (원) — refinance 절감 미리보기 표시용 */
  currentMonthlyInterest?: number;
};

export function PolicyFundMatchCard({ ko, input, isCrisis = false, currentMonthlyInterest }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [extraInput, setExtraInput] = useState<{
    ncbScore?: number;
    consideringClosure?: boolean;
    isDisabledOwner?: boolean;
  }>({});

  // 펀딩 페이지와 동일 SSOT — getRecommendedPrograms (startup-programs.ts) 사용.
  //  필터: 정부 카테고리 + 정책자금 류 (cash/credit/grant) + policyFundSubCategory 보유.
  const matches: ProgramMatch[] = useMemo(() => {
    const criteria: MatchCriteria = { ...input, ...extraInput };
    // 추천 점수 기반 상위 N개 (eligibility + personalFit 통과한 것만)
    const recommended = getRecommendedPrograms(criteria, showAll ? 10 : 3, 0);
    // 정책자금 (정부 + 대출/보조/현금)만 필터
    return recommended.filter((p) => {
      if (p.category !== "government") return false;
      // 정책자금 세부 카테고리가 있으면 정책자금 — 그 외는 일반 정부 지원금
      if (p.policyFundSubCategory) return true;
      // 세부 카테고리 없어도 fundingType 이 정책자금 류면 포함
      return p.fundingType === "cash" || p.fundingType === "credit" || p.fundingType === "grant";
    });
  }, [input, extraInput, showAll]);

  if (matches.length === 0) return null;

  const topMatch = matches[0];
  const showCrisisTone = isCrisis
    || topMatch.policyFundSubCategory === "closure"
    || topMatch.policyFundSubCategory === "low-credit";

  return (
    <article style={section}>
      <header style={{ display: "grid", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "grid", gap: "4px", flex: 1, minWidth: 0 }}>
            <div style={eyebrow}>
              {ko ? "정책자금 자동 매칭" : "Policy Fund Auto-Match"}
            </div>
            <div style={title}>
              {showCrisisTone
                ? ko
                  ? "지금 신청 가능한 정책자금이 있습니다"
                  : "Eligible funds available now"
                : ko
                  ? "사장님께 맞는 정책자금"
                  : "Matched funds for you"}
            </div>
            <div style={{ fontSize: "12px", color: TEXT_MUTED, lineHeight: 1.55, marginTop: "2px" }}>
              {ko
                ? "2026 소상공인시장진흥공단 + 희망리턴패키지 매칭 — 1357 (소진공)·1533-0100 (소상공인)"
                : "Matched against 2026 SEMAS + Hope Return policies"}
            </div>
            {currentMonthlyInterest != null && currentMonthlyInterest > 0 && (() => {
              // FKI 한경협 2025 조사: 자영업자 평균 대출금리 8.4% → 정책자금(소진공 4.5%) 대환 시 약 46% 절감
              // 보수적 추정 — 실제 절감은 신용·기존 정책자금 수령 여부 등에 따라 다름
              const estimatedSavings = Math.round(currentMonthlyInterest * 0.464);
              if (estimatedSavings < 10000) return null;
              return (
                <div style={{
                  fontSize: "12px",
                  color: showCrisisTone ? ROSE_TEXT : SKY,
                  fontWeight: 600,
                  lineHeight: 1.55,
                  marginTop: "6px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: showCrisisTone ? ROSE_BG : SKY_BG,
                  border: `1px solid ${HAIRLINE}`,
                }}>
                  {ko
                    ? `현재 월 이자 ${formatWonShort(currentMonthlyInterest)} → 정책자금 4.5% 대환 시 월 약 ${formatWonShort(estimatedSavings)} 절감 추정 (8.4% 평균금리 기준, 자격·신용 확인 필요)`
                    : `Current monthly interest ${formatWonShort(currentMonthlyInterest)} → est. ${formatWonShort(estimatedSavings)}/mo savings at 4.5% policy rate (assumes 8.4% avg, eligibility varies)`}
                </div>
              );
            })()}
          </div>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: showCrisisTone ? ROSE_BG : SKY_BG,
              border: `1px solid ${HAIRLINE}`,
              minWidth: "100px",
              textAlign: "center" as const,
            }}
          >
            <Coins size={18} strokeWidth={2} color={showCrisisTone ? ROSE_TEXT : SKY} style={{ marginBottom: "2px" }} />
            <div style={{ fontSize: "10px", fontWeight: 700, color: MIDNIGHT_SOFT, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              {ko ? "매칭" : "Matched"}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: MIDNIGHT_DEEP, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {matches.length}
            </div>
          </div>
        </div>
      </header>

      {/* ── 매칭 보강 입력 (선택) — 사용자가 폐업·신용·장애 추가 입력하면 매칭 점수 정밀화 ── */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginTop: "4px" }}>
        <button
          type="button"
          onClick={() => setExtraInput((p) => ({ ...p, consideringClosure: !p.consideringClosure }))}
          style={{
            ...optionChip,
            background: extraInput.consideringClosure ? SKY_BG : "#fff",
            borderColor: extraInput.consideringClosure ? SKY : HAIRLINE_STRONG,
            color: extraInput.consideringClosure ? "#1F46A8" : MIDNIGHT_SOFT,
          }}
        >
          {ko ? "폐업 검토 중" : "Considering closure"}
        </button>
        <button
          type="button"
          onClick={() => setExtraInput((p) => ({ ...p, isDisabledOwner: !p.isDisabledOwner }))}
          style={{
            ...optionChip,
            background: extraInput.isDisabledOwner ? SKY_BG : "#fff",
            borderColor: extraInput.isDisabledOwner ? SKY : HAIRLINE_STRONG,
            color: extraInput.isDisabledOwner ? "#1F46A8" : MIDNIGHT_SOFT,
          }}
        >
          {ko ? "장애인 사장님" : "Disabled owner"}
        </button>
        <button
          type="button"
          onClick={() => {
            const v = window.prompt(ko ? "NCB 신용점수 (선택, 모르면 취소)" : "NCB score (optional)");
            const n = v ? parseInt(v, 10) : undefined;
            if (n && n > 0 && n <= 1000) setExtraInput((p) => ({ ...p, ncbScore: n }));
          }}
          style={{
            ...optionChip,
            background: extraInput.ncbScore != null ? SKY_BG : "#fff",
            borderColor: extraInput.ncbScore != null ? SKY : HAIRLINE_STRONG,
            color: extraInput.ncbScore != null ? "#1F46A8" : MIDNIGHT_SOFT,
          }}
        >
          {extraInput.ncbScore != null
            ? `NCB ${extraInput.ncbScore}`
            : ko ? "NCB 신용점수 입력" : "Enter NCB"}
        </button>
      </div>

      {/* ── 매칭 결과 — 펀딩 페이지와 동일 SSOT(getRecommendedPrograms) ── */}
      <div style={{ display: "grid", gap: "8px", marginTop: "6px" }}>
        {matches.map((match, i) => {
          const isOpen = expanded === match.id;
          const isPrimary = i === 0;
          // 정책자금 세부 카테고리별 톤
          const tone =
            match.policyFundSubCategory === "closure" ? "rose" :
            match.policyFundSubCategory === "low-credit" ? "amber" :
            match.policyFundSubCategory === "youth" ? "sky" :
            "default";
          const toneColor =
            tone === "rose" ? ROSE_TEXT :
            tone === "amber" ? AMBER_TEXT :
            tone === "sky" ? SKY :
            MIDNIGHT_DEEP;
          const toneBg =
            tone === "rose" ? ROSE_BG :
            tone === "amber" ? AMBER_BG :
            tone === "sky" ? SKY_BG :
            SURFACE_LAVENDER;
          const lang = ko ? "ko" : "en";
          const topReason = match.matchReasons?.[0];
          const restReasons = match.matchReasons?.slice(1) ?? [];
          return (
            <div
              key={match.id}
              style={{
                ...matchCard,
                border: isPrimary ? `1.5px solid ${HAIRLINE_STRONG}` : `1px solid ${HAIRLINE}`,
                background: isPrimary ? toneBg : "#fff",
              }}
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : match.id)}
                style={matchHeader}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    {isPrimary && <Sparkles size={11} strokeWidth={2.5} color={toneColor} />}
                    <span style={{ fontSize: "10px", fontWeight: 700, color: toneColor, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                      {ko ? `${Math.round(match.personalFitScore)}점 매칭` : `${Math.round(match.personalFitScore)}% match`}
                    </span>
                  </div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: MIDNIGHT_DEEP, letterSpacing: "-0.01em" }}>
                    {match.name[lang]}
                  </div>
                  {topReason && (
                    <div style={{ fontSize: "11.5px", color: TEXT_BODY, lineHeight: 1.55, marginTop: "3px" }}>
                      {topReason[lang]}
                    </div>
                  )}
                </div>
                {isOpen ? <ChevronUp size={14} color={MIDNIGHT_SOFT} /> : <ChevronDown size={14} color={MIDNIGHT_SOFT} />}
              </button>
              {isOpen && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderTop: `1px solid ${HAIRLINE}`,
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: TEXT_BODY, lineHeight: 1.55 }}>
                    {match.benefit[lang]}
                  </div>
                  {/* loanDetails 가 있을 때만 한도·금리·상환 specs 표시 (SEMAS 정책자금 류) */}
                  {match.loanDetails && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {match.loanDetails.limitWon != null && (
                        <Spec
                          label={ko ? "한도" : "Limit"}
                          value={formatWonShort(match.loanDetails.limitWon)}
                        />
                      )}
                      {match.loanDetails.interestRatePctMin != null && (
                        <Spec
                          label={ko ? "금리" : "Rate"}
                          value={
                            match.loanDetails.interestRatePctMin === 0 && match.loanDetails.termMonths === 0
                              ? (ko ? "보조금 (상환 X)" : "Grant (no repay)")
                              : match.loanDetails.interestRatePctMax
                                ? `${match.loanDetails.interestRatePctMin}–${match.loanDetails.interestRatePctMax}%`
                                : `${match.loanDetails.interestRatePctMin}%`
                          }
                        />
                      )}
                      {match.loanDetails.termMonths != null && match.loanDetails.termMonths > 0 && (
                        <Spec
                          label={ko ? "상환 기간" : "Term"}
                          value={`${Math.round(match.loanDetails.termMonths / 12)}${ko ? "년" : "yr"}`}
                        />
                      )}
                    </div>
                  )}
                  {/* loanDetails 가 없으면 amount 문자열 (예: "최대 9억원 R&D + 5억원 사업화") 보여줌 */}
                  {!match.loanDetails && match.amount && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                      <Spec label={ko ? "지원 금액" : "Amount"} value={match.amount} />
                    </div>
                  )}
                  {/* 추가 매칭 사유 — UI 노이즈 방지로 3개까지만 */}
                  {restReasons.length > 0 && (
                    <div style={{ fontSize: "11px", color: TEXT_MUTED, lineHeight: 1.55 }}>
                      • {restReasons.slice(0, 3).map((r) => r[lang]).join("\n• ")}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    <a
                      href={match.url}
                      target="_blank"
                      rel="noreferrer"
                      style={primaryBtn}
                    >
                      {ko ? "신청 페이지 열기" : "Apply"}
                      <ExternalLink size={11} strokeWidth={2} style={{ marginLeft: "4px" }} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 더 보기 / 접기 */}
      {!showAll && matches.length === 3 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{
            background: "none",
            border: "none",
            color: SKY,
            fontSize: "11.5px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "4px 0",
            textAlign: "left" as const,
          }}
        >
          {ko ? "더 많은 자금 보기 →" : "See more programs →"}
        </button>
      )}

      {/* 안내 footer */}
      <div
        style={{
          fontSize: "10.5px",
          color: TEXT_MUTED,
          lineHeight: 1.55,
          paddingTop: "8px",
          borderTop: `1px solid ${HAIRLINE}`,
        }}
      >
        {ko
          ? "정책 변경 시 차이가 있을 수 있어요. 신청 전 소진공 1357 (또는 소상공인 1533-0100)에 한 번 확인하시면 안전합니다."
          : "Policies change. Verify with SEMAS (1357) before applying."}
      </div>
    </article>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: "8px", background: SURFACE_LAVENDER }}>
      <div style={{ fontSize: "10px", fontWeight: 700, color: MIDNIGHT_SOFT, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT_DEEP, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}

function formatWonShort(won: number): string {
  if (won === 0) return "0원";
  if (won >= 100_000_000) return `${(won / 100_000_000).toFixed(1)}억`;
  if (won >= 10_000_000) return `${Math.round(won / 10_000_000)}천만`;
  if (won >= 10_000) return `${Math.round(won / 10_000).toLocaleString()}만`;
  return `${won.toLocaleString()}원`;
}

// ─── styles ────────────────────────────────────────────────────────

const section: React.CSSProperties = {
  padding: "22px 24px",
  background: "#fff",
  border: `1px solid ${HAIRLINE}`,
  borderRadius: "16px",
  boxShadow: "0 1px 2px rgba(30,42,85,0.03), 0 8px 28px rgba(30,42,85,0.04)",
  display: "grid",
  gap: "14px",
  fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
};

const eyebrow: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SKY,
};

const title: React.CSSProperties = {
  fontSize: "19px",
  fontWeight: 700,
  letterSpacing: "-0.025em",
  color: MIDNIGHT_DEEP,
};

const optionChip: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  padding: "6px 11px",
  borderRadius: "999px",
  border: "1px solid",
  cursor: "pointer",
  transition: "all 120ms ease",
};

const matchCard: React.CSSProperties = {
  borderRadius: "12px",
  overflow: "hidden",
};

const matchHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  width: "100%",
  padding: "12px 14px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  font: "inherit",
  textAlign: "left" as const,
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontSize: "12px",
  fontWeight: 650,
  padding: "8px 14px",
  borderRadius: "8px",
  background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)",
  color: "#fff",
  textDecoration: "none",
  letterSpacing: "-0.01em",
  boxShadow: "0 2px 8px rgba(30,42,85,0.18)",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontSize: "12px",
  fontWeight: 600,
  padding: "8px 12px",
  borderRadius: "8px",
  border: `1px solid ${HAIRLINE_STRONG}`,
  background: "#fff",
  color: MIDNIGHT_DEEP,
  textDecoration: "none",
};
