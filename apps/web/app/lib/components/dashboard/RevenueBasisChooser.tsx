"use client";

/**
 * RevenueBasisChooser — 매출 카드(ActivitySnapshotCard) 안에 인라인으로 펼쳐지는 "매출 집계 기준" 선택 패널.
 *   별도 카드가 아니라 매출 카드의 "자동 N곳" 배지를 탭하면 열리는 패널.
 *
 * 의회 검증 설계: 같은 카드매출이 여러 채널(PortOne/TossPlace ↔ CODEF 슈퍼셋)에 겹쳐
 *   이중계상될 수 있어, 사장님이 "어느 경로로 집계할지" 선택 → cashflow-store.revenueBasis 저장.
 *   - 카드 라디오: 겹침(cardOverlap)일 때만.  - 현금 토글: 팝빌 연결 시.
 */
import { useState } from "react";
import { Info } from "lucide-react";
import { useCashflowStore, type RevenueBasis } from "../../stores/cashflow-store";
import type { UnifiedRevenueSources } from "../../hooks/useUnifiedRevenue";

const MIDNIGHT = "#191970";
const INK = "#1d3557";

export function RevenueBasisChooser({
  ko,
  sources,
  basis,
  cardOverlap,
  onClose,
  onSaved,
}: {
  ko: boolean;
  sources: UnifiedRevenueSources;
  basis: RevenueBasis;
  cardOverlap: boolean;
  onClose: () => void;
  /** 저장 직후 호출 — 즉시 서버 영속화(flushStoreDataImmediate)용. */
  onSaved?: () => void;
}) {
  const setRevenueBasis = useCashflowStore((s) => s.setRevenueBasis);
  const [draft, setDraft] = useState<RevenueBasis>(basis);

  const save = () => {
    setRevenueBasis(draft);   // Zustand 동기 업데이트 → 아래 onSaved 의 flush 가 새 값을 읽음
    onSaved?.();              // 서버 즉시 저장 (5초 autosave 대기·stale 스냅샷 방지)
    onClose();
  };

  return (
    <div style={panel}>
      <div style={panelHead}>
        <span style={panelTitle}>{ko ? "매출 집계 기준" : "Revenue basis"}</span>
        <button type="button" onClick={onClose} style={closeBtn} aria-label={ko ? "닫기" : "Close"}>✕</button>
      </div>

      {cardOverlap && (
        <>
          <div style={infoLine}>
            <Info size={13} strokeWidth={2} color={MIDNIGHT} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              {ko
                ? "같은 카드매출이 여러 곳에 잡혀요. 한 기준만 집계해 중복을 막아요."
                : "The same card sales appear in multiple sources. Pick one to avoid double-counting."}
            </span>
          </div>
          <RadioCard
            selected={draft.card === "individual"}
            title={ko ? "채널별 실시간" : "Per channel (real-time)"}
            desc={ko ? "포트원(온라인)·토스플레이스(매장)를 각각 실시간 합산" : "Sum PortOne (online) + TossPlace (in-store) live"}
            onClick={() => setDraft((d) => ({ ...d, card: "individual" }))}
          />
          <RadioCard
            selected={draft.card === "codef"}
            title={ko ? "카드사 통합 (여신협회)" : "Card networks (CODEF)"}
            desc={ko ? "모든 카드매출을 빠짐없이 — 배달앱·타사 단말 포함 (하루 정도 지연)" : "All card sales incl. delivery/other terminals (~1 day lag)"}
            onClick={() => setDraft((d) => ({ ...d, card: "codef" }))}
          />
        </>
      )}

      {sources.popbill && (
        <div style={toggleRow}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#16181d" }}>
              {ko ? "현금영수증을 현금매출로 합산" : "Count cash receipts as cash sales"}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, lineHeight: 1.45 }}>
              {ko ? "카드결제에도 현금영수증을 끊는다면 끄세요 (중복 방지)" : "Turn off if you issue cash receipts for card payments too"}
            </div>
          </div>
          <Switch on={draft.countCashReceipt} onToggle={() => setDraft((d) => ({ ...d, countCashReceipt: !d.countCashReceipt }))} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button type="button" onClick={save} style={saveBtn}>{ko ? "저장" : "Save"}</button>
        <button type="button" onClick={onClose} style={cancelBtn}>{ko ? "취소" : "Cancel"}</button>
      </div>
    </div>
  );
}

function RadioCard({ selected, title, desc, onClick }: { selected: boolean; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      style={{
        display: "flex", alignItems: "flex-start", gap: 11, width: "100%", textAlign: "left",
        padding: "11px 12px", marginTop: 8, borderRadius: 11,
        border: selected ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(0,0,0,0.10)",
        background: selected ? "rgba(25,25,112,0.04)" : "rgba(255,255,255,0.7)",
        cursor: "pointer", transition: "border-color .15s, background .15s",
      }}
    >
      <span
        style={{
          flexShrink: 0, width: 17, height: 17, marginTop: 1, borderRadius: "50%",
          border: selected ? `5px solid ${MIDNIGHT}` : "1.5px solid rgba(0,0,0,0.28)",
          background: "#fff", transition: "border .15s",
        }}
      />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: selected ? INK : "#16181d", letterSpacing: "-0.01em" }}>{title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.45 }}>{desc}</span>
      </span>
    </button>
  );
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} onClick={onToggle}
      style={{
        flexShrink: 0, width: 38, height: 23, borderRadius: 999, border: "none", padding: 0, cursor: "pointer",
        background: on ? MIDNIGHT : "rgba(0,0,0,0.18)", position: "relative", transition: "background .18s",
      }}
    >
      <span style={{ position: "absolute", top: 2.5, left: on ? 17.5 : 2.5, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left .18s" }} />
    </button>
  );
}

const panel: React.CSSProperties = {
  borderRadius: 12,
  border: "0.5px solid rgba(25,25,112,0.16)",
  background: "rgba(25,25,112,0.025)",
  padding: 13,
  marginBottom: 16,
};
const panelHead: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between" };
const panelTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" };
const closeBtn: React.CSSProperties = { background: "transparent", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", padding: 2, lineHeight: 1 };
const infoLine: React.CSSProperties = {
  display: "flex", gap: 7, alignItems: "flex-start", fontSize: 11.5, lineHeight: 1.5, color: INK,
  background: "rgba(25,25,112,0.05)", border: "0.5px solid rgba(25,25,112,0.14)", borderRadius: 9, padding: "8px 10px", marginTop: 10,
};
const toggleRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)" };
const saveBtn: React.CSSProperties = { flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1d3557,#2c4f80)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const cancelBtn: React.CSSProperties = { padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" };
