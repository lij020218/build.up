"use client";

import { useEffect, useState } from "react";
import { Target, Flame, Trophy, Gem, TrendingUp, Crown, ShieldCheck, Percent, Flag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Milestone = {
  id: string;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  iconColor: string;
};

type Props = {
  milestone: Milestone | null;
  onDismiss: () => void;
};

export function MilestoneToast({ milestone, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (milestone) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 400);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [milestone, onDismiss]);

  if (!milestone) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "-20px"})`,
        opacity: visible ? 1 : 0,
        transition: "all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
        zIndex: 300,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div style={toast}>
        <div style={iconCircle}>
          <milestone.Icon size={22} strokeWidth={1.5} color={milestone.iconColor} />
        </div>
        <div>
          <div style={toastTitle}>{milestone.title}</div>
          <div style={toastSub}>{milestone.subtitle}</div>
        </div>
        <button type="button" onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }} style={dismissBtn}>✕</button>
      </div>
    </div>
  );
}

/* ── Check milestones and return the first unachieved one ── */

export function checkMilestones(opts: {
  streak: number;
  totalEntries: number;
  bepProgress: number;
  healthScore: number;
  completedStages: number;
  dismissed: Set<string>;
  ko: boolean;
}): Milestone | null {
  const { streak, totalEntries, bepProgress, healthScore, completedStages, dismissed, ko } = opts;

  const milestones: Milestone[] = [
    // ── 기록 습관 ──
    {
      id: "first-entry",
      title: ko ? "첫 매출 기록!" : "First Sales Entry!",
      subtitle: ko ? "매일 기록하면 경영의 흐름이 보입니다" : "Daily logging reveals your business rhythm",
      Icon: Target,
      iconColor: "#191970",
    },
    {
      id: "streak-7",
      title: ko ? "7일 연속 기록!" : "7-Day Streak!",
      subtitle: ko ? "주간 리포트가 해금되었습니다" : "Weekly report unlocked",
      Icon: Flame,
      iconColor: "#191970",
    },
    {
      id: "streak-30",
      title: ko ? "30일 연속 기록!" : "30-Day Streak!",
      subtitle: ko ? "월간 트렌드 분석이 해금됩니다" : "Monthly trend analysis unlocked",
      Icon: Trophy,
      iconColor: "#191970",
    },
    {
      id: "streak-90",
      title: ko ? "90일 연속 기록!" : "90-Day Streak!",
      subtitle: ko ? "AI 연간 경영 리포트가 해금됩니다" : "AI annual business report unlocked",
      Icon: Gem,
      iconColor: "#1d3557",
    },
    // ── 수익 성과 ──
    {
      id: "bep-reached",
      title: ko ? "손익분기 달성!" : "Break-Even Reached!",
      subtitle: ko ? "이번 달 매출이 비용을 넘었습니다" : "This month's revenue exceeded costs",
      Icon: TrendingUp,
      iconColor: "#7c3aed",
    },
    {
      id: "first-profit-month",
      title: ko ? "첫 흑자 달성!" : "First Profitable Month!",
      subtitle: ko ? "축하합니다! 수익 구조가 작동하고 있습니다" : "Congratulations! Your revenue structure is working",
      Icon: Crown,
      iconColor: "#db2777",
    },
    // ── 건강 점수 ──
    {
      id: "health-80",
      title: ko ? "건강한 가게!" : "Healthy Business!",
      subtitle: ko ? "건강점수 80점 이상 — 이 구조를 유지하세요" : "Health score above 80 — maintain this structure",
      Icon: ShieldCheck,
      iconColor: "#1d3557",
    },
    // ── 비용 효율 ──
    {
      id: "cost-efficient",
      title: ko ? "비용 효율 달성!" : "Cost Efficiency!",
      subtitle: ko ? "원가율이 업종 평균보다 낮습니다" : "Your cost ratio is below industry average",
      Icon: Percent,
      iconColor: "#0891b2",
    },
    // ── 로드맵 ──
    {
      id: "roadmap-complete",
      title: ko ? "로드맵 완주!" : "Roadmap Complete!",
      subtitle: ko ? "모든 준비를 마쳤습니다. 이제 운영에 집중하세요" : "All preparation done. Focus on operations now",
      Icon: Flag,
      iconColor: "#191970",
    },
  ];

  const conditions: Record<string, boolean> = {
    "first-entry": totalEntries >= 1,
    "streak-7": streak >= 7,
    "streak-30": streak >= 30,
    "streak-90": streak >= 90,
    "bep-reached": bepProgress >= 100,
    "first-profit-month": bepProgress >= 100 && totalEntries >= 20,
    "health-80": healthScore >= 80,
    "cost-efficient": healthScore >= 65 && totalEntries >= 14,
    "roadmap-complete": completedStages >= 10,
  };

  for (const m of milestones) {
    if (conditions[m.id] && !dismissed.has(m.id)) return m;
  }
  return null;
}

/* ─── Styles ─── */

const toast: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "16px 20px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.98)",
  border: "1px solid rgba(15,23,42,0.08)",
  boxShadow: "0 16px 48px rgba(15,23,42,0.14), 0 0 0 1px rgba(15,23,42,0.04)",
  backdropFilter: "blur(20px)",
  minWidth: "320px",
};

const iconCircle: React.CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, rgba(25,25,112,0.08), rgba(52,199,89,0.08))",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  flexShrink: 0,
};

const toastTitle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 720,
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const toastSub: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(15,23,42,0.55)",
  marginTop: "2px",
  lineHeight: 1.4,
};

const dismissBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  color: "rgba(15,23,42,0.3)",
  padding: "4px",
  flexShrink: 0,
};
