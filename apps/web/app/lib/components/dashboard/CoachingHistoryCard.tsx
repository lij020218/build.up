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
import { History, CheckCircle2, Circle, Flame, Target, Brain, Cloud, CloudOff } from "lucide-react";
import { getHistory, getStats, hydrateFromSupabase, markActionTaken, pruneOld, type CoachingEntry } from "../../coaching-history";

const MIDNIGHT = "#191970";

type Props = { ko: boolean };

type Meta30d = {
  days_30: number;
  critical_taken_rate: number | null;
  weekend_days: number;
  weekend_actions: number;
  most_common_kind: string | null;
  recent_critical_7d: number;
};

export function CoachingHistoryCard({ ko }: Props) {
  const [entries, setEntries] = useState<CoachingEntry[]>([]);
  const [stats, setStats] = useState({ totalDays: 0, actionsTaken: 0, criticalSignals: 0, takenRate: 0 });
  const [meta30d, setMeta30d] = useState<Meta30d | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "offline">("idle");
  const [tick, setTick] = useState(0);

  // 매 mount + tick 시 localStorage 다시 읽음
  useEffect(() => {
    pruneOld();
    setEntries(getHistory(14));
    setStats(getStats(14));
  }, [tick]);

  // mount 시 1번 Supabase 에서 다른 디바이스 데이터 hydrate + meta30d 가져오기
  useEffect(() => {
    let cancelled = false;
    setSyncStatus("syncing");
    hydrateFromSupabase()
      .then((res) => {
        if (cancelled) return;
        setMeta30d(res.meta30d);
        // localStorage 가 hydrate 안에서 업데이트됨 → 다시 읽기
        setEntries(getHistory(14));
        setStats(getStats(14));
        setSyncStatus(res.stats14d != null || res.meta30d != null ? "synced" : "offline");
      })
      .catch(() => {
        if (cancelled) return;
        setSyncStatus("offline");
      });
    return () => { cancelled = true; };
  }, []);

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

      {/* 30일+ 누적 시 메타 인사이트 노출 (Supabase v_coaching_meta_30d view) */}
      {meta30d && meta30d.days_30 >= 14 && (
        <MetaInsightsBlock meta={meta30d} ko={ko} />
      )}

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        padding: "10px 12px", borderRadius: 10,
        background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.10)",
        fontSize: 11, color: "rgba(15,23,42,0.6)", lineHeight: 1.5,
      }}>
        <span style={{ flex: 1 }}>
          {meta30d && meta30d.days_30 >= 14
            ? (ko
                ? `30일 누적 — AI 메타 인사이트 활성화 (서버 영구 보관)`
                : `30 days accumulated — AI meta-insights active (server-backed)`)
            : (ko
                ? "30일 누적 시 AI 메타 인사이트 자동 활성화 — 사장님 의사결정 패턴 분석"
                : "AI meta-insights auto-activate at 30 days of data")}
        </span>
        <SyncBadge status={syncStatus} ko={ko} />
      </div>
    </article>
  );
}

function MetaInsightsBlock({ meta, ko }: { meta: Meta30d; ko: boolean }) {
  // v1 rule-based 메타 인사이트 — 30일 누적 데이터 분석
  const insights: { icon: React.ReactNode; text: string; tone: "critical" | "important" | "good" }[] = [];

  // critical 신호 대응률 분석
  if (meta.critical_taken_rate != null) {
    const rate = meta.critical_taken_rate;
    if (rate < 40) {
      insights.push({
        icon: <Flame size={14} strokeWidth={2.2} />,
        text: ko
          ? `Critical 신호 대응률 ${rate}% — 60% 이상 권장. 폐업 위험 신호 무시 패턴.`
          : `Critical response ${rate}% — recommend 60%+. Risk-ignoring pattern.`,
        tone: "critical",
      });
    } else if (rate >= 70) {
      insights.push({
        icon: <CheckCircle2 size={14} strokeWidth={2.2} />,
        text: ko
          ? `Critical 신호 대응률 ${rate}% — 한국 SMB 상위 20% 수준.`
          : `Critical response ${rate}% — top 20% KR SMB.`,
        tone: "good",
      });
    }
  }

  // 주말 대응 패턴
  if (meta.weekend_days > 0) {
    const weekendRate = Math.round((meta.weekend_actions / meta.weekend_days) * 100);
    if (weekendRate < 30 && meta.weekend_days >= 4) {
      insights.push({
        icon: <Target size={14} strokeWidth={2.2} />,
        text: ko
          ? `주말 대응 ${weekendRate}% — 주중보다 크게 낮음. 주말 자동화 검토.`
          : `Weekend action ${weekendRate}% — much lower than weekdays.`,
        tone: "important",
      });
    }
  }

  // 최근 7일 critical 연속
  if (meta.recent_critical_7d >= 4) {
    insights.push({
      icon: <Flame size={14} strokeWidth={2.2} />,
      text: ko
        ? `최근 7일 critical ${meta.recent_critical_7d}회 — 사업 상태 악화 추세. 펀딩·재도전특별자금 검토.`
        : `${meta.recent_critical_7d} critical in last 7d — deteriorating. Consider funding.`,
      tone: "critical",
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: <Brain size={14} strokeWidth={2.2} />,
      text: ko
        ? `${meta.days_30}일 누적 — 의사결정 패턴 정상 범위. 다음 분기 더 정밀한 AI 분석 활성화.`
        : `${meta.days_30}d accumulated — normal pattern. Deeper AI analysis next quarter.`,
      tone: "good",
    });
  }

  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.85,
        letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <Brain size={12} strokeWidth={2.2} />
        {ko ? `AI 메타 인사이트 · ${meta.days_30}일 누적` : `AI Meta-Insights · ${meta.days_30}d`}
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
        {insights.map((i, idx) => {
          const c = { critical: "#b91c1c", important: "#b45309", good: "#059669" }[i.tone];
          return (
            <div key={idx} style={{
              display: "flex", alignItems: "flex-start", gap: 9,
              padding: "9px 12px", borderRadius: 9,
              background: `${c}08`, border: `1px solid ${c}25`,
              fontSize: 12, color: "#0f172a", lineHeight: 1.5,
            }}>
              <span style={{ flexShrink: 0, color: c, marginTop: 1 }}>{i.icon}</span>
              <span style={{ flex: 1 }}>{i.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SyncBadge({ status, ko }: { status: "idle" | "syncing" | "synced" | "offline"; ko: boolean }) {
  if (status === "idle") return null;
  const cfg = {
    syncing: { icon: <Cloud size={11} />, text: ko ? "동기화 중" : "Syncing", color: "rgba(15,23,42,0.55)" },
    synced: { icon: <Cloud size={11} />, text: ko ? "서버 저장됨" : "Server-backed", color: "#059669" },
    offline: { icon: <CloudOff size={11} />, text: ko ? "로컬만 (로그인 필요)" : "Local only", color: "#b45309" },
  }[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10.5, color: cfg.color, fontWeight: 600,
      padding: "2px 8px", borderRadius: 6,
      background: `${cfg.color}10`,
    }}>
      {cfg.icon}
      {cfg.text}
    </span>
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
