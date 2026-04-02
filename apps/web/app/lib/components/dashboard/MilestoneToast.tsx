"use client";

import { useEffect, useState } from "react";

type Milestone = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
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
        <div style={iconCircle}>{milestone.icon}</div>
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
    {
      id: "first-entry",
      title: ko ? "첫 매출 기록!" : "First Sales Entry!",
      subtitle: ko ? "매일 기록하면 경영의 흐름이 보입니다" : "Daily logging reveals your business rhythm",
      icon: "🎯",
    },
    {
      id: "streak-7",
      title: ko ? "7일 연속 기록!" : "7-Day Streak!",
      subtitle: ko ? "주간 리포트가 해금되었습니다" : "Weekly report unlocked",
      icon: "🔥",
    },
    {
      id: "streak-30",
      title: ko ? "30일 연속 기록!" : "30-Day Streak!",
      subtitle: ko ? "습관이 형성되었습니다. 월간 트렌드 분석이 해금됩니다" : "Habit formed. Monthly trend analysis unlocked",
      icon: "⚡",
    },
    {
      id: "bep-reached",
      title: ko ? "손익분기 달성!" : "Break-Even Reached!",
      subtitle: ko ? "이번 달 매출이 비용을 넘었습니다" : "This month's revenue exceeded costs",
      icon: "📈",
    },
    {
      id: "health-80",
      title: ko ? "건강한 가게!" : "Healthy Business!",
      subtitle: ko ? "건강점수 80점 이상 — 이 구조를 유지하세요" : "Health score above 80 — maintain this structure",
      icon: "💚",
    },
    {
      id: "roadmap-complete",
      title: ko ? "로드맵 완주!" : "Roadmap Complete!",
      subtitle: ko ? "모든 준비를 마쳤습니다. 이제 운영에 집중하세요" : "All preparation done. Focus on operations now",
      icon: "🏁",
    },
  ];

  const conditions: Record<string, boolean> = {
    "first-entry": totalEntries >= 1,
    "streak-7": streak >= 7,
    "streak-30": streak >= 30,
    "bep-reached": bepProgress >= 100,
    "health-80": healthScore >= 80,
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
  background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(52,199,89,0.08))",
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
