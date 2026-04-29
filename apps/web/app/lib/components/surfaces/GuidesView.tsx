"use client";

import { useMemo, useState } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { useProfileStore } from "../../stores/profile-store";
import {
  getMatchedProgramsV2,
  getApplicationStatusLabel,
  getProgramCategoryLabel,
  getProgramCategoryColor,
  type StartupProgram,
  type ProgramCategory,
  type ApplicationStatus,
  type MatchCriteria,
} from "@build-up/shared";
import { ExternalLink, Award, Calendar, Building2, Target, Sparkles } from "lucide-react";
import { styles } from "../../styles";

/**
 * GuidesView — 펀딩 페이지
 *
 * 사용자의 업종·지역·창업 유형·자본금·사업 연차를 바탕으로
 * 정부 지원금 / VC 투자 / 민간기업 협업 / 액셀러레이터 / 대회를 매칭·정렬해서 보여준다.
 *
 * 재무 시뮬레이션(이전 가이드 탭 상단)은 로드맵 'Financial review' 단계로 이관됨.
 * 인허가·세무·대출 가이드는 로드맵 관련 단계(registration-setup, insurance-tax-setup, loan) 로 이관됨.
 */

type CategoryFilter = "all" | ProgramCategory;
type StatusFilter = "all" | ApplicationStatus;

export function GuidesView() {
  const d = useDashboardCtx();
  const {
    language,
    startupType,
    selectedBudget,
    preferredRegionInput,
    businessLaunched,
    industryCategoryId,
  } = d;
  const businessLaunchedDate = useProfileStore((s) => s.businessLaunchedDate);
  const ko = language === "ko";

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // ── 유저 프로필 → 매칭 기준으로 변환 ──
  const criteria: MatchCriteria = useMemo(() => {
    const businessYears = businessLaunchedDate
      ? Math.max(0, Math.floor((Date.now() - new Date(businessLaunchedDate).getTime()) / (365 * 86400000)))
      : 0;
    return {
      startupType,
      industryCategoryId,
      businessYears: businessLaunched ? businessYears : 0,
      region: preferredRegionInput || undefined,
      capital: selectedBudget ?? undefined,
      businessStage: businessLaunched ? (businessYears >= 3 ? "growth" : "early") : "pre-startup",
    };
  }, [startupType, industryCategoryId, businessLaunchedDate, businessLaunched, preferredRegionInput, selectedBudget]);

  const matchedAll = useMemo(() => getMatchedProgramsV2(criteria), [criteria]);

  // ── 필터 적용 ──
  const filtered = useMemo(() => {
    return matchedAll.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (statusFilter !== "all" && p.applicationStatus !== statusFilter) return false;
      return true;
    });
  }, [matchedAll, categoryFilter, statusFilter]);

  // ── 통계 ──
  const stats = useMemo(() => {
    const open = matchedAll.filter((p) => p.applicationStatus === "open").length;
    const upcoming = matchedAll.filter((p) => p.applicationStatus === "upcoming").length;
    const eligible = matchedAll.filter((p) => p.eligible && p.applicationStatus !== "closed").length;
    return { total: matchedAll.length, open, upcoming, eligible };
  }, [matchedAll]);

  const categoryOptions: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: ko ? "전체" : "All" },
    { id: "government", label: ko ? "정부" : "Gov" },
    { id: "local", label: ko ? "지자체" : "Local" },
    { id: "private", label: ko ? "민간·재단" : "Private" },
    { id: "corporate", label: ko ? "대기업" : "Corp" },
    { id: "competition", label: ko ? "대회" : "Contest" },
  ];

  const statusOptions: { id: StatusFilter; label: string }[] = [
    { id: "all", label: ko ? "전체" : "All" },
    { id: "open", label: ko ? "신청 가능" : "Open" },
    { id: "upcoming", label: ko ? "공고 예정" : "Upcoming" },
    { id: "closed", label: ko ? "마감" : "Closed" },
  ];

  return (
    <section style={styles.section}>
      {/* ── Header ── */}
      <div style={header}>
        <div style={eyebrow}>{ko ? "펀딩" : "Funding"}</div>
        <h2 style={title}>
          {ko ? "내 조건에 맞는 펀딩 기회" : "Funding matched to you"}
        </h2>
        <p style={subtitle}>
          {ko
            ? "정부 지원금 · VC 투자 · 민간기업 협업까지 한 곳에서. 업종·지역·창업 유형으로 자동 매칭하고, 신청 가능·마감 임박 순으로 정렬합니다."
            : "Government grants, VC funding, and corporate programs — all in one place. Auto-matched to your industry, region, and stage."}
        </p>
      </div>

      {/* ── Summary stats ── */}
      <div style={statsRow}>
        <StatBlock
          label={ko ? "전체" : "Total"}
          value={String(stats.total)}
          hint={ko ? "등록된 프로그램" : "Registered"}
          tone="neutral"
        />
        <StatBlock
          label={ko ? "신청 가능" : "Open"}
          value={String(stats.open)}
          hint={ko ? "지금 접수 중" : "Accepting now"}
          tone="success"
        />
        <StatBlock
          label={ko ? "공고 예정" : "Upcoming"}
          value={String(stats.upcoming)}
          hint={ko ? "일정 확인" : "Check schedule"}
          tone="warning"
        />
        <StatBlock
          label={ko ? "내게 적합" : "Eligible"}
          value={String(stats.eligible)}
          hint={ko ? "자격 조건 만족" : "You qualify"}
          tone="primary"
        />
      </div>

      {/* ── Filters ── */}
      <div style={filterSection}>
        <FilterGroup
          label={ko ? "분류" : "Category"}
          options={categoryOptions}
          active={categoryFilter}
          onChange={(v) => setCategoryFilter(v as CategoryFilter)}
        />
        <FilterGroup
          label={ko ? "상태" : "Status"}
          options={statusOptions}
          active={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
        />
      </div>

      {/* ── Program list ── */}
      {filtered.length === 0 ? (
        <div style={emptyBox}>
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>
            {ko
              ? "조건에 맞는 펀딩이 없습니다. 필터를 조정해보세요."
              : "No funding matches the current filters."}
          </div>
        </div>
      ) : (
        <div style={listGrid}>
          {filtered.map((program) => (
            <ProgramCard key={program.id} program={program} ko={ko} />
          ))}
        </div>
      )}

      {/* ── Footnote ── */}
      <div style={footnote}>
        {ko
          ? "데이터 기준: 2026년 · 실제 공고·마감은 각 기관 공식 사이트에서 최종 확인 부탁드립니다."
          : "Data as of 2026. Always verify dates and eligibility at each program's official page."}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

function StatBlock({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "neutral" | "success" | "warning" | "primary";
}) {
  const toneColor =
    tone === "success"
      ? "#34c759"
      : tone === "warning"
        ? "#ff9f0a"
        : tone === "primary"
          ? "#1d3557"
          : "var(--muted)";
  return (
    <div style={statBlock}>
      <div style={statLabel}>{label}</div>
      <div style={{ ...statValue, color: toneColor }}>{value}</div>
      <div style={statHint}>{hint}</div>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={filterLabel}>{label}</div>
      <div style={filterRow}>
        {options.map((opt) => {
          const isActive = opt.id === active;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              style={{
                ...chip,
                background: isActive ? "#1d3557" : "#fff",
                color: isActive ? "#fff" : "var(--text)",
                borderColor: isActive ? "#1d3557" : "rgba(0,0,0,0.12)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgramCard({
  program,
  ko,
}: {
  program: StartupProgram & { matchScore: number; eligible: boolean };
  ko: boolean;
}) {
  const lang = ko ? "ko" : "en";
  const statusInfo = getApplicationStatusLabel(program.applicationStatus, lang);
  const catLabel = getProgramCategoryLabel(program.category, lang);
  const catColor = getProgramCategoryColor(program.category);

  const handleOpen = () => {
    if (program.url) {
      window.open(program.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <article
      style={{
        ...programCard,
        opacity: program.eligible ? 1 : 0.72,
      }}
    >
      {/* Top: status badge + category badge + highlight */}
      <div style={cardTopRow}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span
            style={{
              ...badge,
              background: `${statusInfo.color}15`,
              color: statusInfo.color,
              fontWeight: 700,
            }}
          >
            {statusInfo.label}
          </span>
          <span
            style={{
              ...badge,
              background: `${catColor}12`,
              color: catColor,
            }}
          >
            {catLabel}
          </span>
          {program.highlight && (
            <span style={{ ...badge, background: "rgba(245,158,11,0.1)", color: "#b45309", display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <Sparkles size={10} strokeWidth={2.2} />
              {ko ? "추천" : "Featured"}
            </span>
          )}
        </div>
        {!program.eligible && (
          <div style={{ fontSize: "11px", color: "#ff3b30", fontWeight: 600 }}>
            {ko ? "자격 조건 확인 필요" : "Check eligibility"}
          </div>
        )}
      </div>

      {/* Name */}
      <h3 style={progName}>{program.name[lang]}</h3>

      {/* Organizer */}
      <div style={progMetaRow}>
        <Building2 size={12} strokeWidth={1.6} color="rgba(15,23,42,0.45)" />
        <span>{program.organizer[lang]}</span>
      </div>

      {/* Target */}
      <div style={progMetaRow}>
        <Target size={12} strokeWidth={1.6} color="rgba(15,23,42,0.45)" />
        <span style={{ fontWeight: 500 }}>{program.target[lang]}</span>
      </div>

      {/* Benefit */}
      <div style={benefitBox}>
        <div style={benefitLabel}>{ko ? "지원 내용" : "Benefit"}</div>
        <div style={benefitText}>{program.benefit[lang]}</div>
        {program.amount && (
          <div style={amountBox}>
            <Award size={13} strokeWidth={1.8} color="#1d3557" />
            <span style={amountText}>{program.amount}</span>
          </div>
        )}
      </div>

      {/* Season / deadline */}
      <div style={progMetaRow}>
        <Calendar size={12} strokeWidth={1.6} color="rgba(15,23,42,0.45)" />
        <span>{program.season[lang]}</span>
      </div>

      {/* Required docs */}
      {program.requiredDocs && program.requiredDocs.length > 0 && (
        <div style={docsRow}>
          <div style={docsLabel}>{ko ? "필요 서류" : "Required"}:</div>
          <div style={docsList}>
            {program.requiredDocs.map((doc) => doc[lang]).join(" · ")}
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={!program.url}
        style={{
          ...ctaButton,
          opacity: program.url ? 1 : 0.5,
          cursor: program.url ? "pointer" : "not-allowed",
        }}
      >
        {ko ? "공식 사이트에서 신청하기" : "Apply at official site"}
        <ExternalLink size={13} strokeWidth={1.8} />
      </button>
    </article>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════

const header: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  marginBottom: "20px",
};

const eyebrow: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 650,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--muted)",
};

const title: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "var(--text)",
  margin: 0,
};

const subtitle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.5,
  color: "var(--muted)",
  margin: 0,
  maxWidth: "640px",
};

const statsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
  marginBottom: "24px",
};

const statBlock: React.CSSProperties = {
  borderRadius: "14px",
  padding: "14px 16px",
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const statLabel: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
};

const statValue: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 700,
  letterSpacing: "-0.025em",
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1,
};

const statHint: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--muted)",
};

const filterSection: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  padding: "16px 18px",
  borderRadius: "14px",
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.06)",
  marginBottom: "18px",
};

const filterLabel: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
};

const filterRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
};

const chip: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  padding: "6px 14px",
  borderRadius: "9999px",
  border: "1px solid",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const listGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: "14px",
};

const programCard: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  padding: "18px 18px 16px",
  borderRadius: "18px",
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

const cardTopRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  flexWrap: "wrap",
};

const badge: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 600,
  padding: "3px 9px",
  borderRadius: "9999px",
  letterSpacing: "0.01em",
};

const progName: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "var(--text)",
  margin: "2px 0 2px",
  lineHeight: 1.3,
};

const progMetaRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "6px",
  fontSize: "12.5px",
  color: "var(--muted)",
  lineHeight: 1.45,
};

const benefitBox: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "12px 14px",
  borderRadius: "12px",
  background: "rgba(29,53,87,0.03)",
  border: "1px solid rgba(29,53,87,0.08)",
  marginTop: "4px",
};

const benefitLabel: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#1d3557",
  opacity: 0.7,
};

const benefitText: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: 1.45,
  color: "var(--text)",
};

const amountBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  marginTop: "2px",
};

const amountText: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#1d3557",
  letterSpacing: "-0.01em",
};

const docsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "6px",
  fontSize: "11.5px",
  color: "var(--muted)",
  lineHeight: 1.4,
};

const docsLabel: React.CSSProperties = {
  fontWeight: 600,
  flexShrink: 0,
};

const docsList: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const ctaButton: React.CSSProperties = {
  marginTop: "6px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  fontSize: "13px",
  fontWeight: 600,
  padding: "9px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(0,0,0,0.1)",
  background: "#fff",
  color: "#1d3557",
  transition: "all 0.15s ease",
};

const emptyBox: React.CSSProperties = {
  padding: "40px 20px",
  textAlign: "center",
  borderRadius: "14px",
  background: "rgba(0,0,0,0.02)",
  border: "1px dashed rgba(0,0,0,0.1)",
};

const footnote: React.CSSProperties = {
  marginTop: "20px",
  fontSize: "11.5px",
  color: "var(--muted)",
  textAlign: "center",
  lineHeight: 1.5,
};
