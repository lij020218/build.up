"use client";

/**
 * 세금 화면 — 세금 계산·세액공제·신고 일정을 한곳에 (2026-07-22 사장님 지시 신설).
 *
 *  3섹션:
 *   ① 세금 계산 — 과세유형(간이/일반) + 부가세 예상(범위) + 종소세 개념·구간 (tax-estimate SSOT)
 *   ② 세액공제·감면 — 내 세부업종이 받을 수 있는 것 (tax-credits SSOT: 공통 4종 + 업종특화)
 *   ③ 신고 일정 — 부가세·종소세·원천세 (tax-calendar SSOT / TaxCalendarCard 재사용)
 *
 *  ⚠️ 전 섹션 정직성: 계산은 "예상 간이치·범위", 공제는 "자격·근거"까지만.
 *      최종 세액·자격은 홈택스·세무사 — 각 섹션에 확인 경로 병기 (세금은 오차=신뢰붕괴).
 */

import { useMemo } from "react";
import {
  classifyTaxType, estimateVat, guideIncomeTax,
  COMMON_TAX_BENEFITS, getSpecialtyTaxMapping, isReductionSurfaced,
  type EligibilityLevel,
} from "@foundone/shared";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { getKstMonthKey } from "../../utils/business-day";
import TaxCalendarCard from "../TaxCalendarCard";

const MIDNIGHT = "#191970";
const MIDNIGHT_DEEP = "#10104a";
const DANGER = "#b64c4c";

const won = (n: number) => {
  if (!isFinite(n) || n <= 0) return "0원";
  const man = Math.round(n / 10_000);
  if (man >= 10_000) return `${(man / 10_000).toFixed(man % 10_000 === 0 ? 0 : 1)}억원`;
  return `${man.toLocaleString()}만원`;
};

const HOMETAX = "https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3";

// 자격 배지 색·라벨
function levelMeta(level: EligibilityLevel): { label: string; bg: string; color: string } {
  switch (level) {
    case "eligible": return { label: "대상", bg: "rgba(25,25,112,0.09)", color: MIDNIGHT };
    case "likely": return { label: "가능성 높음", bg: "rgba(25,25,112,0.06)", color: MIDNIGHT };
    default: return { label: "확인 필요", bg: "rgba(182,76,76,0.08)", color: DANGER };
  }
}

const card: React.CSSProperties = {
  background: "white", borderRadius: 16, border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04)", padding: "18px 20px",
};
const sectionLabel: React.CSSProperties = {
  fontSize: 13, fontWeight: 750, color: "rgba(15,23,42,0.55)", letterSpacing: "0.01em", padding: "2px 2px 0",
};
const disclaimer: React.CSSProperties = {
  fontSize: 11, color: "rgba(15,23,42,0.5)", lineHeight: 1.5, marginTop: 8,
};

export function TaxSurface() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const categoryId = d.industryCategoryId || null;
  const specialtyId = d.selectedIndustryId || null;
  const curMonth = getKstMonthKey();

  // ── 연매출 추정 — 이번 달 매출 × 12 (기록 있을 때), 없으면 0 ──
  const annualRevenueWon = useMemo(() => {
    const entries = (d.dailyEntries ?? []) as Array<{ date: string; sales: number }>;
    const mtd = entries.filter((e) => e.date?.startsWith?.(curMonth)).reduce((s, e) => s + (e.sales ?? 0), 0);
    if (mtd > 0) {
      const day = new Date().getDate();
      return Math.round((mtd / day) * 365); // 이번 달 일평균 × 365
    }
    // MTD 없으면 최근 전체 기록 일평균 × 365
    if (entries.length > 0) {
      const total = entries.reduce((s, e) => s + (e.sales ?? 0), 0);
      return Math.round((total / entries.length) * 365);
    }
    return 0;
  }, [d.dailyEntries, curMonth]);

  const hasEmployees = ((d.employees ?? []) as unknown[]).length > 0;

  // ── ① 계산 ──
  const taxType = useMemo(() => classifyTaxType(annualRevenueWon), [annualRevenueWon]);
  const vat = useMemo(
    () => estimateVat(annualRevenueWon, categoryId, taxType.simplifiedEligible),
    [annualRevenueWon, categoryId, taxType.simplifiedEligible],
  );
  const incomeTax = useMemo(() => guideIncomeTax(annualRevenueWon), [annualRevenueWon]);

  // ── ② 세액공제 ──
  const mapping = useMemo(() => getSpecialtyTaxMapping(specialtyId, categoryId), [specialtyId, categoryId]);
  const startupOpen = mapping && isReductionSurfaced(mapping.startupReduction);
  const specialOpen = mapping && isReductionSurfaced(mapping.specialReduction);

  // ── ③ 일정 ──
  const hasData = annualRevenueWon > 0;

  return (
    <main style={{ width: "min(1080px, calc(100vw - 32px))", margin: "0 auto", padding: "24px 0 80px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.65, letterSpacing: "0.12em" }}>TAX</div>
        <h1 style={{ fontSize: 26, fontWeight: 750, letterSpacing: "-0.025em", color: "#0f172a", margin: 0 }}>
          {ko ? "내 세금" : "My Tax"}
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55, margin: 0, maxWidth: 620 }}>
          {ko
            ? "과세유형·부가세 예상, 내 업종이 받을 수 있는 세액공제, 신고 일정을 한곳에. 모든 값은 예상치예요 — 정확한 세액은 홈택스·세무사로 확정하세요."
            : "Tax type, estimated VAT, credits for your industry, and filing dates — all estimates; confirm with Hometax."}
        </p>
      </header>

      {/* ━━━ ① 세금 계산 ━━━ */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={sectionLabel}>{ko ? "세금 계산 (예상)" : "Estimate"}</div>

        {/* 과세유형 */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14.5, fontWeight: 750, color: MIDNIGHT_DEEP }}>{ko ? "과세유형" : "Tax type"}</span>
            {annualRevenueWon > 0 && (
              <span style={{
                padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                background: taxType.simplifiedEligible ? "rgba(25,25,112,0.08)" : "rgba(182,76,76,0.08)",
                color: taxType.simplifiedEligible ? MIDNIGHT : DANGER,
              }}>{taxType.simplifiedEligible ? "간이과세 가능" : "일반과세"}</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "rgba(15,23,42,0.75)", lineHeight: 1.55 }}>{taxType.noteKo}</div>
        </div>

        {/* 부가세 + 종소세 2열 */}
        <div className="dash-2col" style={{ display: "grid", gap: 10 }}>
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(25,25,112,0.62)", marginBottom: 4 }}>{ko ? "예상 연 부가세" : "Est. annual VAT"}</div>
            {annualRevenueWon > 0 ? (
              <>
                <div style={{ fontSize: 24, fontWeight: 750, color: MIDNIGHT_DEEP, letterSpacing: "-0.02em" }}>
                  {won(vat.lowWon)} ~ {won(vat.highWon)}
                </div>
                <div style={disclaimer}>{vat.noteKo}</div>
              </>
            ) : <div style={{ fontSize: 13, color: "var(--muted)" }}>{ko ? "매출을 기록하면 계산돼요." : "Log sales to estimate."}</div>}
          </div>
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(25,25,112,0.62)", marginBottom: 4 }}>{ko ? "종합소득세 구간" : "Income tax bracket"}</div>
            {incomeTax.marginalBracketPct != null ? (
              <>
                <div style={{ fontSize: 24, fontWeight: 750, color: MIDNIGHT_DEEP, letterSpacing: "-0.02em" }}>
                  {ko ? `약 ${incomeTax.marginalBracketPct}% 구간` : `~${incomeTax.marginalBracketPct}%`}
                </div>
                <div style={disclaimer}>{incomeTax.noteKo}</div>
              </>
            ) : <div style={{ fontSize: 13, color: "var(--muted)" }}>{incomeTax.noteKo}</div>}
          </div>
        </div>

        <a href={HOMETAX} target="_blank" rel="noopener noreferrer" style={{
          alignSelf: "flex-start", fontSize: 12, fontWeight: 700, color: MIDNIGHT,
          textDecoration: "none", padding: "6px 2px",
        }}>{ko ? "홈택스에서 정확히 계산하기 →" : "Calculate on Hometax →"}</a>
      </div>

      {/* ━━━ ② 세액공제·감면 ━━━ */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={sectionLabel}>{ko ? "내가 받을 수 있는 세액공제·감면" : "Credits for your business"}</div>

        {/* 공통 4종 — 전 업종 */}
        <div style={{ display: "grid", gap: 8 }}>
          {COMMON_TAX_BENEFITS.map((b) => (
            <div key={b.id} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 750, color: MIDNIGHT_DEEP }}>{b.titleKo}</span>
                <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: "rgba(25,25,112,0.07)", color: MIDNIGHT }}>{ko ? "대상" : "Eligible"}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.72)", lineHeight: 1.5 }}>{b.summaryKo}</div>
              <div style={{ fontSize: 11, color: "rgba(15,23,42,0.5)", marginTop: 4 }}>
                {ko ? "근거" : "Basis"}: {b.basis}{b.sunset ? ` · ${b.sunset}까지` : ""}
              </div>
            </div>
          ))}
        </div>

        {/* 업종특화 감면 — eligible/likely 만 노출, check/excluded 는 확인 안내 */}
        {mapping && (startupOpen || specialOpen) && (
          <>
            {startupOpen && (
              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 750, color: MIDNIGHT_DEEP }}>{ko ? "창업중소기업 세액감면" : "Startup SME reduction"}</span>
                  {(() => { const m = levelMeta(mapping.startupReduction); return <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: m.bg, color: m.color }}>{m.label}</span>; })()}
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.72)", lineHeight: 1.5 }}>
                  {ko ? "창업 후 5년 이내 소득·법인세 감면 (지역별 25~100%, 감면 한도 5억)." : "5-year startup reduction."}
                </div>
                <div style={{ fontSize: 11, color: "rgba(15,23,42,0.5)", marginTop: 4 }}>{mapping.note}</div>
              </div>
            )}
            {specialOpen && (
              <div style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 750, color: MIDNIGHT_DEEP }}>{ko ? "중소기업 특별세액감면" : "SME special reduction"}</span>
                  {(() => { const m = levelMeta(mapping.specialReduction); return <span style={{ padding: "2px 9px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: m.bg, color: m.color }}>{m.label}</span>; })()}
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.72)", lineHeight: 1.5 }}>
                  {ko ? "규모·지역별 5~30% 감면 (한도 1억, 2028년까지)." : "5–30% reduction by size/region."}
                </div>
                <div style={{ fontSize: 11, color: "rgba(15,23,42,0.5)", marginTop: 4 }}>{mapping.note}</div>
              </div>
            )}
          </>
        )}

        {/* 애매·해당없음 안내 */}
        {mapping && !startupOpen && !specialOpen && (
          <div style={{ ...card, background: "rgba(247,248,254,0.7)" }}>
            <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>
              {ko
                ? "업종특화 감면(창업·특별세액감면)은 사업자등록 업종코드에 따라 대상 여부가 갈려요. 위 공통 공제부터 챙기고, 감면 대상 여부는 세무사·홈택스로 확인하세요."
                : "Industry-specific reductions depend on your business code — check with a tax professional."}
            </div>
          </div>
        )}

        <div style={disclaimer}>
          {ko
            ? "※ 자격·감면율은 조세특례제한법·국세청 기준 안내예요. 실제 적용 세액과 중복적용 여부는 홈택스·세무사로 확정하세요."
            : "Eligibility per Restriction of Special Taxation Act — confirm actual amounts with a professional."}
        </div>
      </div>

      {/* ━━━ ③ 신고 일정 ━━━ */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={sectionLabel}>{ko ? "신고 일정" : "Filing schedule"}</div>
        <TaxCalendarCard
          isSimplified={taxType.simplifiedEligible}
          hasEmployees={hasEmployees}
          language={d.language}
        />
        {!hasData && (
          <div style={disclaimer}>
            {ko ? "매출·직원 정보를 기록하면 일정이 내 상황에 맞게 표시돼요." : "Log sales & staff to personalize."}
          </div>
        )}
      </div>
    </main>
  );
}
