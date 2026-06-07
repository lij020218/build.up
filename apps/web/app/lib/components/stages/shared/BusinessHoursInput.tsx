"use client";

/**
 * BusinessHoursInput — 영업 시작/종료 시각 입력 + Supabase 즉시 동기화.
 *
 * 사용:
 *  · BusinessModelSelectionStage (오프라인 path) — 초기 온보딩
 *  · 내 정보 / 매장 설정 페이지 — 운영 중 수정
 *
 * 일자 컷오프 (utils/business-day.ts) 가 closeTime + 30분을 분기점으로 사용.
 * 24h 영업이거나 온라인·스타트업이면 입력 생략 (props.skip 으로 노출 차단).
 *
 * 거짓 기능 금지 — 실제로 Zustand + Supabase 동기화.
 */

import { useEffect, useRef, useState } from "react";
import { Clock, CheckCircle2, Loader2, AlertCircle, Sun, Moon } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";

const MIDNIGHT = "#191970";
const MIDNIGHT_DEEP = "#0f0f4a";

type Props = {
  /** 카드 헤더 라벨 (기본: "영업 시간") */
  label?: string;
  /** 보조 설명 */
  helperText?: string;
  /** 24h 영업 옵션 노출 (기본 true) */
  allow24h?: boolean;
};

const PRESETS: Array<{ label: string; open: string; close: string }> = [
  { label: "카페·식당 표준", open: "09:00", close: "22:00" },
  { label: "이른 영업", open: "07:00", close: "20:00" },
  { label: "심야 (바·포차)", open: "18:00", close: "01:00" },
  { label: "필라테스·헬스", open: "06:00", close: "23:00" },
];

export function BusinessHoursInput({
  label,
  helperText,
  allow24h = true,
}: Props) {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const {
    businessOpenTime, setBusinessOpenTime,
    businessCloseTime, setBusinessCloseTime,
    flushStoreDataImmediate, persistStatus,
  } = d;

  const [open, setOpen] = useState<string>(businessOpenTime ?? "");
  const [close, setClose] = useState<string>(businessCloseTime ?? "");
  const [is24h, setIs24h] = useState<boolean>(
    !!(businessOpenTime === null && businessCloseTime === null && d.businessLaunched)
  );
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOpen(businessOpenTime ?? "");
    setClose(businessCloseTime ?? "");
  }, [businessOpenTime, businessCloseTime]);

  useEffect(() => () => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
  }, []);

  const flush = () => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      flushStoreDataImmediate?.().catch((err: unknown) => {
        console.error("[BusinessHoursInput] flushStoreDataImmediate failed:", err);
      });
    }, 600);
  };

  // ⚠️ 2026-05-18: type="time" 은 Safari macOS 에서 native picker 만 띄우고 키보드 직접 입력
  //   불가. 사장님이 "12:30 적힌 채 안 바뀜" 으로 인식. type="text" 로 바꾸고 자동 포맷:
  //   "9" → "9", "93" → "93", "930" → "9:30", "0930" → "9:30", "0900" → "09:00".
  //   백스페이스·삭제 자유, 콜론 자동 삽입. 4자리 입력 시 HH:MM 정규화.
  const formatTimeInput = (raw: string): string => {
    // 숫자만 추출, 4자리 제한
    const digits = raw.replace(/[^\d]/g, "").slice(0, 4);
    if (digits.length === 0) return "";
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, digits.length - 2)}:${digits.slice(-2)}`;
  };
  const isValidTime = (v: string): boolean => {
    const m = v.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return false;
    const h = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    return h >= 0 && h <= 23 && mm >= 0 && mm <= 59;
  };
  const updateOpen = (raw: string) => {
    const formatted = formatTimeInput(raw);
    setOpen(formatted);
    setBusinessOpenTime(isValidTime(formatted) ? formatted : null);
    setIs24h(false);
    if (isValidTime(formatted)) flush();
  };
  const updateClose = (raw: string) => {
    const formatted = formatTimeInput(raw);
    setClose(formatted);
    setBusinessCloseTime(isValidTime(formatted) ? formatted : null);
    setIs24h(false);
    if (isValidTime(formatted)) flush();
  };

  const set24h = () => {
    setIs24h(true);
    setOpen("");
    setClose("");
    setBusinessOpenTime(null);
    setBusinessCloseTime(null);
    flush();
  };

  const applyPreset = (p: { open: string; close: string }) => {
    setOpen(p.open);
    setClose(p.close);
    setBusinessOpenTime(p.open);
    setBusinessCloseTime(p.close);
    setIs24h(false);
    flush();
  };

  const status = persistStatus ?? "idle";
  const hasValid = !is24h && /^\d{1,2}:\d{2}$/.test(open) && /^\d{1,2}:\d{2}$/.test(close);
  const showSaving = status === "saving" && (hasValid || is24h);
  const showSaved = status === "saved" && (hasValid || is24h);
  const showError = status === "error";

  // 컷오프 미리보기 — closeTime + 30 min
  const previewCutoff = (() => {
    if (is24h) return ko ? "자정 KST 자동 계산" : "Midnight KST auto";
    if (!hasValid) return null;
    const [h, m] = close.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    const total = (h * 60 + m + 30) % (24 * 60);
    const ph = Math.floor(total / 60);
    const pm = total % 60;
    const fmt = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${fmt(ph)}:${fmt(pm)}`;
  })();

  const fieldLabel = label ?? (ko ? "영업 시간" : "Operating hours");
  const helper = helperText ?? (ko
    ? "사장님이 입력한 마감 시각의 30분 뒤가 '오늘'과 '내일'의 분기점이 됩니다. 자정 넘게 영업하시는 가게도 같은 영업일로 잡힙니다."
    : "Today/tomorrow rolls over 30 min after your close time. Late-night shifts stay in the same business day.");

  return (
    <div style={card}>
      <div style={labelRow}>
        <Clock size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: MIDNIGHT, opacity: 0.7, flexShrink: 0 }} />
        <span style={labelText}>{fieldLabel}</span>
        {showSaving && (
          <span style={{ ...statusPill, color: MIDNIGHT, background: "rgba(25,25,112,0.08)" }}>
            <Loader2 size={11} strokeWidth={1.5} strokeLinecap="round" className="bizhrs-spin" />
            {ko ? "저장 중" : "Saving"}
          </span>
        )}
        {showSaved && (
          <span style={{ ...statusPill, color: "#1d3557", background: "rgba(52,199,89,0.10)" }}>
            <CheckCircle2 size={11} strokeWidth={1.5} strokeLinecap="round" />
            {ko ? "저장됨" : "Saved"}
          </span>
        )}
        {showError && (
          <span style={{ ...statusPill, color: "#b32419", background: "rgba(182,76,76,0.10)" }}>
            <AlertCircle size={11} strokeWidth={1.5} strokeLinecap="round" />
            {ko ? "저장 실패" : "Save failed"}
          </span>
        )}
      </div>
      <div style={helperStyle}>{helper}</div>

      {/* Time inputs */}
      <div style={{ display: "flex", gap: "10px", alignItems: "stretch", flexWrap: "wrap" }}>
        <div style={timeField}>
          <div style={timeLabel}>
            <Sun size={11} strokeWidth={1.5} strokeLinecap="round" style={{ color: MIDNIGHT, opacity: 0.6 }} />
            {ko ? "영업 시작" : "Open"}
          </div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="09:00"
            value={open}
            onChange={(e) => updateOpen(e.target.value)}
            disabled={is24h}
            maxLength={5}
            aria-label={ko ? "영업 시작 시각 (HH:MM)" : "Open time (HH:MM)"}
            style={{ ...timeInputStyle, opacity: is24h ? 0.4 : 1 }}
          />
        </div>
        <div style={dashStyle}>~</div>
        <div style={timeField}>
          <div style={timeLabel}>
            <Moon size={11} strokeWidth={1.5} strokeLinecap="round" style={{ color: MIDNIGHT, opacity: 0.6 }} />
            {ko ? "영업 종료" : "Close"}
          </div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="22:00"
            value={close}
            onChange={(e) => updateClose(e.target.value)}
            disabled={is24h}
            maxLength={5}
            aria-label={ko ? "영업 종료 시각 (HH:MM)" : "Close time (HH:MM)"}
            style={{ ...timeInputStyle, opacity: is24h ? 0.4 : 1 }}
          />
        </div>
      </div>

      {/* Presets */}
      {!is24h && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              style={presetChip(open === p.open && close === p.close)}
            >
              {p.label} <span style={{ opacity: 0.6 }}>{p.open}–{p.close}</span>
            </button>
          ))}
        </div>
      )}

      {/* 24h toggle */}
      {allow24h && (
        <button type="button" onClick={() => (is24h ? null : set24h())} style={toggle24h(is24h)}>
          {is24h ? (ko ? "✓ 24시간 영업 (자정 기준 일자)" : "✓ 24h business (midnight cutoff)") : (ko ? "또는 24시간 영업으로 설정" : "Or mark as 24h business")}
        </button>
      )}

      {/* Cutoff 미리보기 */}
      {previewCutoff && (
        <div style={cutoffBanner}>
          <CheckCircle2 size={13} strokeWidth={1.5} strokeLinecap="round" style={{ color: MIDNIGHT, flexShrink: 0 }} />
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: MIDNIGHT_DEEP }}>
            {is24h
              ? (ko ? <>일자 분기점: <strong>{previewCutoff}</strong></> : <>Day cutoff: <strong>{previewCutoff}</strong></>)
              : (ko ? <>일자 분기점: 매일 <strong style={{ color: MIDNIGHT }}>{previewCutoff} KST</strong> (마감 30분 뒤)</> : <>Daily cutoff: <strong style={{ color: MIDNIGHT }}>{previewCutoff} KST</strong> (30 min after close)</>)}
          </span>
        </div>
      )}

      <style jsx>{`
        :global(.bizhrs-spin) {
          animation: bizhrs-rotate 0.8s linear infinite;
        }
        @keyframes bizhrs-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  background: "white",
  borderRadius: "16px",
  border: "1px solid rgba(25,25,112,0.08)",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};
const labelRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};
const labelText: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: MIDNIGHT_DEEP,
  letterSpacing: "-0.01em",
};
const statusPill: React.CSSProperties = {
  marginLeft: "auto",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "10.5px",
  fontWeight: 700,
  padding: "3px 9px",
  borderRadius: "999px",
  letterSpacing: "0.01em",
  whiteSpace: "nowrap",
};
const helperStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(15,23,42,0.55)",
  lineHeight: 1.55,
  fontWeight: 500,
};
const timeField: React.CSSProperties = {
  flex: 1,
  minWidth: 110,
  display: "flex",
  flexDirection: "column",
  gap: "5px",
};
const timeLabel: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "10.5px",
  fontWeight: 700,
  color: "#191970",
  opacity: 0.7,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};
const timeInputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(25,25,112,0.18)",
  fontSize: "15px",
  fontWeight: 700,
  color: MIDNIGHT_DEEP,
  fontVariantNumeric: "tabular-nums",
  background: "white",
  outline: "none",
  fontFamily: "inherit",
};
const dashStyle: React.CSSProperties = {
  alignSelf: "center",
  fontSize: "16px",
  color: "rgba(25,25,112,0.35)",
  fontWeight: 700,
  paddingTop: "20px",
};
const presetChip = (active: boolean): React.CSSProperties => ({
  fontSize: "11px",
  fontWeight: 600,
  padding: "6px 11px",
  borderRadius: "999px",
  border: active ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(25,25,112,0.12)",
  background: active ? "rgba(25,25,112,0.08)" : "white",
  color: active ? MIDNIGHT_DEEP : "rgba(15,23,42,0.65)",
  cursor: "pointer",
  letterSpacing: "-0.005em",
  fontFamily: "inherit",
});
const toggle24h = (active: boolean): React.CSSProperties => ({
  fontSize: "11.5px",
  fontWeight: 700,
  padding: "8px 12px",
  borderRadius: "10px",
  border: active ? `1.5px solid ${MIDNIGHT}` : "1px dashed rgba(25,25,112,0.22)",
  background: active ? "rgba(25,25,112,0.06)" : "transparent",
  color: active ? MIDNIGHT_DEEP : "rgba(15,23,42,0.55)",
  cursor: active ? "default" : "pointer",
  textAlign: "left",
  fontFamily: "inherit",
});
const cutoffBanner: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 12px",
  borderRadius: "10px",
  background: "rgba(25,25,112,0.04)",
  border: "1px solid rgba(25,25,112,0.08)",
  letterSpacing: "-0.005em",
};
