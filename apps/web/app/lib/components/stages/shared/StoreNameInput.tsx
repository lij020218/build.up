"use client";

/**
 * StoreNameInput — 상호명(가게/회사 이름) 입력 + Supabase 즉시 동기화 컴포넌트.
 *
 * 모든 업종 path의 사업자등록 관련 단계에서 공유:
 *  · 오프라인 path: RegistrationSetupStage(10) + BizRegistrationPanel(17)
 *  · 온라인-디지털 path: OnlineRegistrationStage
 *  · 스타트업 path: CompanySetupStage(7)
 *
 * 동작:
 *  1) 사용자 타이핑 → setStoreName 즉시 (Zustand persist 가 localStorage 동기화)
 *  2) 600ms debounce 후 flushStoreDataImmediate 호출 → Supabase user_store_data.store_name 저장
 *  3) UI에 saving / saved / error 상태 표시 (persistStatus 기반)
 *  4) 빈 값으로 만들면 빈 문자열도 저장 (사용자 의도 반영)
 *
 * 거짓 기능 금지 — 모든 분기에서 실제 저장 로직 보장.
 */

import { useEffect, useRef, useState } from "react";
import { Building2, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";

const MIDNIGHT = "#191970";
const MIDNIGHT_DEEP = "#0f0f4a";

type Props = {
  /** 단계별 톤에 맞춘 라벨 — "상호명" / "법인명" / "스토어명" 등 (기본: "상호명") */
  label?: string;
  /** placeholder — 업종 별 예시 (기본: 가게 예시) */
  placeholder?: string;
  /** 위에 표시될 안내 문구 */
  helperText?: string;
  /** 변경 후 추가 사이드 이펙트 (예: 다른 store 동기화) */
  onAfterChange?: (v: string) => void;
};

export function StoreNameInput({
  label,
  placeholder,
  helperText,
  onAfterChange,
}: Props) {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const { storeName, setStoreName, flushStoreDataImmediate, persistStatus } = d;

  // 로컬 입력 상태 — 즉시 반영, debounce로 Supabase flush
  const [local, setLocal] = useState<string>(storeName ?? "");
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 마지막으로 Supabase에 flush한 값 — 중복 호출 방지
  const lastFlushed = useRef<string>(storeName ?? "");

  // 외부 (다른 컴포넌트·로드 시) 동기화
  useEffect(() => {
    if ((storeName ?? "") !== local) setLocal(storeName ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeName]);

  // 언마운트 시 잔여 타이머 정리
  useEffect(() => () => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
  }, []);

  const handleChange = (v: string) => {
    setLocal(v);
    setStoreName(v); // Zustand 즉시 반영 → persist 미들웨어가 localStorage 동기화
    onAfterChange?.(v);
    // 600ms debounce → Supabase flushStoreDataImmediate (실제 동기화)
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      if (v === lastFlushed.current) return;
      lastFlushed.current = v;
      flushStoreDataImmediate?.().catch((err: unknown) => {
        console.error("[StoreNameInput] flushStoreDataImmediate failed:", err);
      });
    }, 600);
  };

  const trimmed = local.trim();
  const hasValue = trimmed.length > 0;
  const status = persistStatus ?? "idle";
  const showSaving = status === "saving" && hasValue;
  const showSaved = status === "saved" && hasValue;
  const showError = status === "error";

  const fieldLabel = label ?? (ko ? "상호명 (사업자등록증에 적힐 이름)" : "Store name (as on registration)");
  const ph = placeholder ?? (ko ? "예: 온도 카페, 홍길동 상점" : "e.g. Happy Café, Sunrise Studio");
  const helper = helperText ?? (ko
    ? "사업자등록증·간판·안내판·SNS·세금계산서까지 모두 동일한 이름으로 사용됩니다. 입력하면 자동 저장됩니다."
    : "Used across registration, signage, social, and invoices. Auto-saves as you type.");

  return (
    <div style={card}>
      <div style={labelRow}>
        <Building2 size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: MIDNIGHT, opacity: 0.7, flexShrink: 0 }} />
        <span style={labelText}>{fieldLabel}</span>
        {showSaving && (
          <span style={{ ...statusPill, color: MIDNIGHT, background: "rgba(25,25,112,0.08)" }}>
            <Loader2 size={11} strokeWidth={1.5} strokeLinecap="round" className="store-name-spin" />
            {ko ? "저장 중" : "Saving"}
          </span>
        )}
        {showSaved && (
          <span style={{ ...statusPill, color: "#1d3557", background: "rgba(29,53,87,0.10)" }}>
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
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={ph}
        maxLength={60}
        style={{
          ...inputStyle,
          borderColor: hasValue ? MIDNIGHT : "rgba(25,25,112,0.18)",
          boxShadow: hasValue ? "0 0 0 3px rgba(25,25,112,0.06)" : "none",
        }}
      />
      {hasValue && (
        <div style={confirmRow}>
          <CheckCircle2 size={13} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: MIDNIGHT, flexShrink: 0 }} />
          <span style={confirmText}>
            {ko ? <>현재 상호명: <strong style={{ color: MIDNIGHT_DEEP, fontWeight: 700 }}>{trimmed}</strong></>
                : <>Current name: <strong style={{ color: MIDNIGHT_DEEP, fontWeight: 700 }}>{trimmed}</strong></>}
          </span>
        </div>
      )}
      {/* spinner 애니메이션 (전역 CSS 의존 회피용 inline keyframes) */}
      <style jsx>{`
        :global(.store-name-spin) {
          animation: store-name-rotate 0.8s linear infinite;
        }
        @keyframes store-name-rotate {
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
  gap: "10px",
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
  color: "var(--muted)",
  lineHeight: 1.55,
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(25,25,112,0.18)",
  fontSize: "15px",
  fontWeight: 600,
  color: MIDNIGHT_DEEP,
  background: "white",
  outline: "none",
  transition: "border-color 0.18s ease, box-shadow 0.18s ease",
  fontFamily: "inherit",
  letterSpacing: "-0.005em",
};

const confirmRow: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12.5px",
  fontWeight: 600,
  color: MIDNIGHT,
};

const confirmText: React.CSSProperties = {
  letterSpacing: "-0.005em",
};
