"use client";

import { useState } from "react";
import { Clock, Users, Wrench, Megaphone, X, ChevronRight } from "lucide-react";
import { useTimeLogStore } from "../../stores/time-log-store";
import { getKstDate } from "../../utils/business-day";

type Props = {
  ko: boolean;
};

/**
 * Time Log 저녁 체크인 (30초 입력).
 *
 * MorningBriefing 내부의 조건부 섹션.
 * 저녁 17시 이후 + 오늘 미입력 + 이번 세션에 닫지 않은 경우만 표시.
 *
 * UX 원칙 (스트레스 최소화):
 * - 슬라이더 3개만 (합계 100% 강제 X, 합계가 100 초과하면 자동 조정)
 * - 기본 30/30/30 → 나머지 10은 "기타"로 자동 처리
 * - 우측 X로 오늘만 닫기
 * - 작게 접힌 형태, 펼치면 슬라이더
 */
export function TimeLogCheckIn({ ko }: Props) {
  const addEntry = useTimeLogStore((s) => s.addEntry);
  const dismissTodayPrompt = useTimeLogStore((s) => s.dismissTodayPrompt);

  const [expanded, setExpanded] = useState(false);
  const [customer, setCustomer] = useState(30);
  const [operations, setOperations] = useState(30);
  const [marketing, setMarketing] = useState(30);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const other = Math.max(0, 100 - customer - operations - marketing);

  // 합계가 100 초과하면 비례 감소
  const adjust = (next: number, setter: (n: number) => void, self: number) => {
    const otherSum = customer + operations + marketing - self;
    if (otherSum + next > 100) {
      setter(Math.max(0, 100 - otherSum));
    } else {
      setter(Math.max(0, Math.min(100, next)));
    }
  };

  const handleSubmit = () => {
    setSubmitting(true);
    const today = getKstDate(new Date());
    addEntry({
      date: today,
      customerPct: customer,
      operationsPct: operations,
      marketingPct: marketing,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setTimeout(() => setSubmitting(false), 300);
  };

  if (!expanded) {
    return (
      <div
        style={{
          margin: "12px 22px 0",
          padding: "12px 14px",
          borderRadius: "12px",
          background: "linear-gradient(180deg, rgba(25,25,112,0.03) 0%, rgba(255,255,255,0.5) 100%)",
          border: "1px solid rgba(25,25,112,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: "rgba(25,25,112,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Clock size={15} strokeWidth={1.5} color="#191970" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "12.5px", fontWeight: 650, color: "#0f172a", letterSpacing: "-0.01em" }}>
            {ko ? "오늘 시간 체크인" : "Today's time check-in"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
            {ko ? "30초 · 어디에 시간을 썼나요?" : "30s · Where did your time go?"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(25,25,112,0.2)",
            background: "rgba(25,25,112,0.05)",
            fontSize: "11.5px",
            fontWeight: 650,
            color: "#191970",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontFamily: "inherit",
          }}
        >
          {ko ? "체크인" : "Check in"}
          <ChevronRight size={12} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={dismissTodayPrompt}
          aria-label={ko ? "닫기" : "Close"}
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
          }}
        >
          <X size={13} strokeWidth={1.8} />
        </button>
      </div>
    );
  }

  // 펼침 상태 — 3 슬라이더
  if (submitting) {
    return (
      <div
        style={{
          margin: "12px 22px 0",
          padding: "14px",
          borderRadius: "12px",
          background: "rgba(25,25,112,0.05)",
          border: "1px solid rgba(25,25,112,0.12)",
          textAlign: "center" as const,
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: 650, color: "#1d3557" }}>
          {ko ? "✓ 오늘 체크인 완료" : "✓ Checked in"}
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
          {ko ? "7일 쌓이면 주간 시간 패턴을 알려드려요." : "Weekly pattern unlocks after 7 days."}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: "12px 22px 0",
        padding: "16px 18px",
        borderRadius: "14px",
        background: "linear-gradient(180deg, rgba(25,25,112,0.03) 0%, rgba(255,255,255,0.85) 100%)",
        border: "1px solid rgba(25,25,112,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={15} strokeWidth={1.5} color="#191970" />
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
            {ko ? "오늘 시간 체크인" : "Today's time check-in"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
          }}
          aria-label={ko ? "접기" : "Collapse"}
        >
          <X size={13} strokeWidth={1.8} />
        </button>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        <SliderRow
          Icon={Users}
          color="#191970"
          labelKo="고객 응대"
          labelEn="Customer"
          value={customer}
          onChange={(v) => adjust(v, setCustomer, customer)}
        />
        <SliderRow
          Icon={Wrench}
          color="#191970"
          labelKo="운영·관리"
          labelEn="Operations"
          value={operations}
          onChange={(v) => adjust(v, setOperations, operations)}
        />
        <SliderRow
          Icon={Megaphone}
          color="#7c3aed"
          labelKo="마케팅·성장"
          labelEn="Marketing"
          value={marketing}
          onChange={(v) => adjust(v, setMarketing, marketing)}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", padding: "8px 10px", borderRadius: "8px", background: "rgba(25,25,112,0.035)" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)" }}>
          {ko ? "기타 (자동)" : "Other (auto)"}
        </span>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(15,23,42,0.6)", fontVariantNumeric: "tabular-nums" }}>
          {other}%
        </span>
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={ko ? "한 줄 메모 (선택) — 예: 오후에 세무사 미팅" : "Optional note — e.g., CPA meeting in afternoon"}
        style={{
          marginTop: "10px",
          width: "100%",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid rgba(15,23,42,0.08)",
          background: "#fff",
          fontSize: "12px",
          outline: "none",
          fontFamily: "inherit",
        }}
      />

      <button
        type="button"
        onClick={handleSubmit}
        style={{
          marginTop: "12px",
          width: "100%",
          padding: "10px",
          borderRadius: "10px",
          border: "none",
          background: "linear-gradient(135deg, #1E2A55 0%, #2C4F80 100%)",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 660,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 2px 8px rgba(30,42,85,0.18)",
        }}
      >
        {ko ? "저장" : "Save"}
      </button>
    </div>
  );
}

function SliderRow({
  Icon,
  color,
  labelKo,
  labelEn,
  value,
  onChange,
}: {
  Icon: typeof Clock;
  color: string;
  labelKo: string;
  labelEn: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Icon size={13} strokeWidth={1.5} color={color} />
          <span style={{ fontSize: "12px", fontWeight: 620, color: "#0f172a" }}>{labelKo} · {labelEn}</span>
        </div>
        <span style={{ fontSize: "12px", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          width: "100%",
          height: "4px",
          cursor: "pointer",
          accentColor: color,
        }}
      />
    </div>
  );
}
