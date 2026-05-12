"use client";

/**
 * CoachingHistoryCard — 14일 코칭 누적 일지 (사장님 lock-in moat).
 *
 *  ── 왜 만들었나 (2026-05-12) ──────────────────────────────────────────
 *  자체 평가: "AI 데일리 브리프" 자체는 commodity. 진짜 moat 는 *누적 history*.
 *
 *  사장님이 매일 받은 신호 + 액션 + 결과 의 시간선 보여줌 →
 *  ① 패턴 인식 ("나는 critical 신호 때 60% 행동했네")
 *  ② 전환비용 ("이거 떠나면 1년치 코칭 일지 잃음")
 *  ③ 자기 효능감 (체크박스 마크 = 작은 성취감)
 *
 *  ── UX 원칙 ─────────────────────────────────────────────────────
 *  · 시간선: 최근 14일 (역순)
 *  · 각 entry: 날짜·신호 헤드라인·"했음" 체크박스·메모 옵션
 *  · 비어 있는 날은 표시 X (FounderBrief 가 안 켜진 날)
 *  · 헤더 통계: 누적 일수·액션 비율·critical 신호 수
 *  ────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from "react";
import { History, CheckCircle2, Circle, Flame, Target } from "lucide-react";
import { getHistory, getStats, markActionTaken, pruneOld, type CoachingEntry } from "../../coaching-history";

const MIDNIGHT = "#191970";

type Props = { ko: boolean };

export function CoachingHistoryCard({ ko }: Props) {
  const [entries, setEntries] = useState<CoachingEntry[]>([]);
  const [stats, setStats] = useState({ totalDays: 0, actionsTaken: 0, criticalSignals: 0, takenRate: 0 });
  const [tick, setTick] = useState(0);

  // 매 mount + tick 시 localStorage 다시 읽음
  useEffect(() => {
    pruneOld();
    setEntries(getHistory(14));
    setStats(getStats(14));
  }, [tick]);

  const handleToggle = useCallback((entry: CoachingEntry) => {
    const currentTaken = entry.response?.taken === true;
    markActionTaken(entry.date, entry.brief, !currentTaken);
    setTick((t) => t + 1);
  }, []);

  // 데이터 없으면 안내 카드만
  if (entries.length === 0) {
    return (
      <article style={cardStyle}>
        <header>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={iconBadgeStyle}>
              <History size={14} strokeWidth={2.2} />
            </span>
            <div style={labelStyle}>
              {ko ? "코칭 누적 일지 (14일)" : "Coaching History (14d)"}
            </div>
          </div>
          <div style={titleStyle}>
            {ko ? "매일 받는 신호와 사장님 대응을 누적합니다" : "Track daily signals and your responses"}
          </div>
        </header>
        <div style={{
          padding: "14px 16px", borderRadius: 12,
          background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.06)",
          fontSize: 12.5, color: "rgba(15,23,42,0.65)", lineHeight: 1.55,
        }}>
          {ko
            ? "매일 「AI 운영 코치 데일리 브리프」 가 노출될 때 가장 중요한 신호 1개가 자동 기록됩니다. 14일 누적되면 사장님 의사결정 패턴이 보입니다."
            : "Each day's top signal is auto-recorded when the AI Brief shows. Patterns emerge after 14 days."}
        </div>
      </article>
    );
  }

  return (
    <article style={cardStyle}>
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={iconBadgeStyle}>
            <History size={14} strokeWidth={2.2} />
          </span>
          <div style={labelStyle}>
            {ko ? "코칭 누적 일지 (14일)" : "Coaching History (14d)"}
          </div>
        </div>
        <div style={titleStyle}>
          {ko
            ? `${stats.totalDays}일 누적 · 액션 ${stats.takenRate}% · critical ${stats.criticalSignals}회`
            : `${stats.totalDays} days · ${stats.takenRate}% action rate · ${stats.criticalSignals} critical`}
        </div>
      </header>

      {/* 누적 통계 칩 3개 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
        <StatChip
          icon={<Target size={12} strokeWidth={2.2} />}
          label={ko ? "기록 일수" : "Days logged"}
          value={`${stats.totalDays}일`}
        />
        <StatChip
          icon={<CheckCircle2 size={12} strokeWidth={2.2} />}
          label={ko ? "액션 완료" : "Actions"}
          value={`${stats.actionsTaken}회 (${stats.takenRate}%)`}
          color="#059669"
        />
        {stats.criticalSignals > 0 && (
          <StatChip
            icon={<Flame size={12} strokeWidth={2.2} />}
            label={ko ? "위험 신호" : "Critical"}
            value={`${stats.criticalSignals}회`}
            color="#b91c1c"
          />
        )}
      </div>

      {/* 시간선 — 최근 14일 entry */}
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {entries.slice(0, 10).map((e) => (
          <HistoryRow key={`${e.date}-${e.brief}`} entry={e} ko={ko} onToggle={() => handleToggle(e)} />
        ))}
        {entries.length > 10 && (
          <div style={{
            fontSize: 11, color: "rgba(15,23,42,0.5)", textAlign: "center" as const, paddingTop: 4,
          }}>
            {ko ? `+${entries.length - 10}일 더 (전체 14일)` : `+${entries.length - 10} more days`}
          </div>
        )}
      </div>

      <div style={{
        display: "flex", alignItems: "flex-start", gap: 8,
        padding: "10px 12px", borderRadius: 10,
        background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.10)",
        fontSize: 11, color: "rgba(15,23,42,0.6)", lineHeight: 1.5,
      }}>
        <span style={{ flexShrink: 0, color: MIDNIGHT, opacity: 0.6, marginTop: 1, fontSize: 14, lineHeight: 1 }}>💡</span>
        <span style={{ flex: 1 }}>
          {ko
            ? "사장님의 의사결정 패턴이 30일 누적되면 다음 분기 AI 가 \"평소보다 critical 신호 대응 느림\" 같은 메타 인사이트 제공 예정."
            : "Once 30 days accumulate, AI will surface meta-insights like \"slower on critical signals than usual.\""}
        </span>
      </div>
    </article>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────

function HistoryRow({ entry, ko, onToggle }: { entry: CoachingEntry; ko: boolean; onToggle: () => void }) {
  const taken = entry.response?.taken === true;
  const kindColor = {
    critical: "#b91c1c",
    important: "#b45309",
    notable: MIDNIGHT,
    good: "#059669",
  }[entry.signal.kind];
  const date = formatDate(entry.date, ko);
  const briefLabel = entry.brief === "startup"
    ? (ko ? "스타트업" : "Startup")
    : (ko ? "운영" : "Ops");

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 12px", borderRadius: 10,
      background: taken ? "rgba(5,150,105,0.04)" : "white",
      border: `1px solid ${taken ? "rgba(5,150,105,0.15)" : "rgba(15,23,42,0.08)"}`,
      transition: "all 0.15s",
    }}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={ko ? (taken ? "완료 해제" : "완료 표시") : (taken ? "Mark as not done" : "Mark as done")}
        style={{
          flexShrink: 0,
          width: 24, height: 24, borderRadius: 6,
          background: "transparent", border: "none", cursor: "pointer",
          color: taken ? "#059669" : "rgba(15,23,42,0.35)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {taken ? <CheckCircle2 size={20} strokeWidth={2.2} /> : <Circle size={20} strokeWidth={2} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 2,
          fontSize: 10.5, color: "rgba(15,23,42,0.55)", fontWeight: 600, letterSpacing: "0.02em",
        }}>
          <span>{date}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{
            padding: "1px 6px", borderRadius: 4,
            background: `${kindColor}15`, color: kindColor, fontSize: 9.5, fontWeight: 700,
            textTransform: "uppercase" as const,
          }}>
            {entry.signal.kind}
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{briefLabel}</span>
        </div>
        <div style={{
          fontSize: 12.5, fontWeight: 600, color: taken ? "rgba(15,23,42,0.55)" : "#0f172a",
          lineHeight: 1.4, textDecoration: taken ? "line-through" : "none",
        }}>
          {entry.signal.headline}
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  const c = color ?? MIDNIGHT;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 10px", borderRadius: 8,
      background: `${c}10`, border: `1px solid ${c}25`,
      fontSize: 11.5, color: c, fontWeight: 600,
    }}>
      <span style={{ display: "inline-flex" }}>{icon}</span>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function formatDate(date: string, ko: boolean): string {
  // YYYY-MM-DD → "5/12 (월)" 형식
  const d = new Date(date + "T00:00:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  if (ko) {
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    return `${month}/${day} (${weekday})`;
  } else {
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    return `${month}/${day} ${weekday}`;
  }
}

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 20,
  border: "1px solid rgba(25,25,112,0.10)",
  boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
  padding: "22px 24px",
  display: "flex",
  flexDirection: "column" as const,
  gap: 14,
};

const iconBadgeStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.85) 100%)`,
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(25,25,112,0.25)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MIDNIGHT,
  opacity: 0.75,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

const titleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.015em",
  lineHeight: 1.4,
};
