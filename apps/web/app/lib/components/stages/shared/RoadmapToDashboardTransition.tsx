"use client";

/**
 * RoadmapToDashboardTransition — 로드맵 마지막 → 운영 대시보드 자연 전환.
 *
 *  ── 왜 만들었나 (2026-05-13) ──────────────────────────────────────────
 *  Found.One 의 가장 큰 자산 = 48 단계 풀 사이클 로드맵 (한국 진공 카테고리, 업종별 15~23단계 노출) +
 *  11 업종 운영 대시보드. 사장님이 *로드맵 끝낸 후* 운영 대시보드를 *자연스럽게*
 *  매일 사용하도록 하는 *funnel* 의 마지막 카드.
 *
 *  ── 위치 ────────────────────────────────────────────────────────────
 *  · FirstMonthCheckStage 끝 (개업 후 첫 달 점검 — 사장님 기본 path 마지막)
 *  · PreLaunchFinalStage 끝 (선출시·D-Day path)
 *  · 다른 path 마지막 단계도 동일 컴포넌트 재사용
 *
 *  ── UX 원칙 ────────────────────────────────────────────────────────
 *  · 축하 (사장님이 *완주* 했음을 인지)
 *  · 가치 명시 (운영 대시보드가 매일 어떻게 도와줄지 4가지)
 *  · 큰 CTA — 클릭 1번으로 운영 대시보드 진입
 *  · 사장님이 "내 일이 끝난 게 아니라 *진짜 시작*" 임을 느끼게
 *  ────────────────────────────────────────────────────────────────────
 */

import type { DashboardHook } from "../../../useDashboard";
import { Sparkles, ArrowRight, BarChart3, Wallet, Target, TrendingUp } from "lucide-react";

const MIDNIGHT = "#191970";

type Props = {
  d: DashboardHook;
  ko: boolean;
};

export function RoadmapToDashboardTransition({ d, ko }: Props) {
  const handleEnter = () => {
    // 사장님이 *완주* 했다는 인지 — businessLaunched 가 이미 true 면 OperationalDashboard 자동 표시.
    // false 면 setBusinessLaunched(true) 호출 (단, 사장님이 의도적으로 안 launch 한 경우 보존 — 여기선 false 그대로).
    d.navigateToSurface("home");
  };

  return (
    <article style={cardStyle}>
      {/* 축하 헤더 */}
      <header style={headerStyle}>
        <span style={iconBadge}>
          <Sparkles size={18} strokeWidth={2.2} />
        </span>
        <div>
          <div style={eyebrow}>
            {ko ? "로드맵 완주" : "Roadmap Complete"}
          </div>
          <h2 style={titleStyle}>
            {ko ? "사장님, 진짜 시작입니다" : "The real start, now."}
          </h2>
        </div>
      </header>

      <p style={bodyStyle}>
        {ko
          ? "여기까지 함께 와주셔서 감사합니다. 창업 준비부터 첫 달 점검까지 — 사장님의 사업이 본격 운영 단계에 진입했습니다. 이제부터는 *매일 5분* 으로 사장님 사업 건강 상태를 봅니다."
          : "Thank you for following the roadmap. Your business is now in full operation mode. From here on, just 5 minutes a day to track your business health."}
      </p>

      {/* 가치 4가지 — 운영 대시보드가 매일 무엇을 보여주는지 */}
      <div style={valueGrid}>
        <ValueRow
          icon={<BarChart3 size={16} strokeWidth={2.2} />}
          title={ko ? "매일 5분: 매출·현금흐름·재고" : "Daily 5min: revenue, cash, inventory"}
          desc={ko
            ? "사장님 첫 화면 = 오늘 매출·런웨이·BEP 한눈에"
            : "Today's revenue, runway, BEP at a glance"}
        />
        <ValueRow
          icon={<Sparkles size={16} strokeWidth={2.2} />}
          title={ko ? "AI 운영 코치" : "AI Ops Coach"}
          desc={ko
            ? "11 업종 임계값 자동 분석 → 오늘 가장 중요한 행동 1개"
            : "Industry thresholds + today's single action"}
        />
        <ValueRow
          icon={<Target size={16} strokeWidth={2.2} />}
          title={ko ? "업종 맞춤 KPI" : "Industry KPIs"}
          desc={ko
            ? "외식 prime cost / 뷰티 노쇼 / 피트니스 회원 retention 등"
            : "Prime cost / no-show / member retention by industry"}
        />
        <ValueRow
          icon={<TrendingUp size={16} strokeWidth={2.2} />}
          title={ko ? "30일 누적 학습" : "30-day pattern learning"}
          desc={ko
            ? "사장님의 의사결정 패턴 자동 기록 → 메타 인사이트"
            : "Auto-track your decision patterns → meta-insights"}
        />
      </div>

      {/* 큰 CTA */}
      <button
        type="button"
        onClick={handleEnter}
        style={ctaStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(25,25,112,0.32)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(25,25,112,0.24)";
        }}
      >
        <span>{ko ? "운영 대시보드 들어가기" : "Enter Operations Dashboard"}</span>
        <ArrowRight size={18} strokeWidth={2.4} />
      </button>

      <div style={footerStyle}>
        <Wallet size={11} strokeWidth={1.8} style={{ color: MIDNIGHT, opacity: 0.5, marginRight: 6 }} />
        {ko
          ? "한국 폐업률 100만 시대 — 운영 코치가 매일 사장님과 함께합니다"
          : "Korean closure rate 100M+/yr — daily coach with you"}
      </div>
    </article>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────

function ValueRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={valueRowStyle}>
      <span style={valueIcon}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={valueTitle}>{title}</div>
        <div style={valueDesc}>{desc}</div>
      </div>
    </div>
  );
}

// ─── styles ──────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: `linear-gradient(180deg, white 0%, rgba(25,25,112,0.02) 100%)`,
  borderRadius: 24,
  border: `1px solid ${MIDNIGHT}20`,
  boxShadow: "0 4px 16px rgba(25,25,112,0.08), 0 24px 60px -32px rgba(25,25,112,0.20)",
  padding: "28px 32px",
  display: "flex",
  flexDirection: "column" as const,
  gap: 20,
  marginTop: 24,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
};

const iconBadge: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.85) 100%)`,
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 6px 18px rgba(25,25,112,0.32)",
  flexShrink: 0,
};

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.7,
  letterSpacing: "0.10em",
  textTransform: "uppercase" as const,
  marginBottom: 4,
};

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.025em",
  lineHeight: 1.25,
  margin: 0,
};

const bodyStyle: React.CSSProperties = {
  fontSize: 14,
  color: "rgba(15,23,42,0.7)",
  lineHeight: 1.6,
  margin: 0,
};

const valueGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
};

const valueRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 12,
  background: "white",
  border: "1px solid rgba(25,25,112,0.08)",
};

const valueIcon: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  background: `${MIDNIGHT}10`,
  color: MIDNIGHT,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const valueTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.005em",
  lineHeight: 1.4,
  marginBottom: 2,
};

const valueDesc: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(15,23,42,0.6)",
  lineHeight: 1.5,
};

const ctaStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "16px 24px",
  borderRadius: 14,
  border: "none",
  background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`,
  color: "white",
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: "-0.01em",
  cursor: "pointer",
  boxShadow: "0 4px 16px rgba(25,25,112,0.24)",
  transition: "all 0.18s ease",
  marginTop: 4,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: 11,
  color: "var(--muted)",
  lineHeight: 1.5,
  padding: "8px 12px",
  borderRadius: 9,
  background: "rgba(15,23,42,0.03)",
  border: "1px solid rgba(15,23,42,0.06)",
};
