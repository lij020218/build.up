"use client";

/**
 * CostManagementCard — 내 가게 (analytics) 비용 관리 카드.
 *
 * 두 시스템을 한 카드에서 관리:
 *   1. finance-store.monthlyCosts — PL/도넛 카드용 8개 카테고리 평균 (월간)
 *   2. cashflow-store.fixedExpenses — 14일 잔고 예측용 D-day 캘린더
 *
 * 디자인: my-store/styles.ts PALETTE 토큰 (미드나이트 + 1px outline + hairline divider)
 *
 * 대시보드의 CostCompositionDonutCard footer "내 가게에서 수정" 링크의 도착지.
 * data-cost-management 셀렉터로 scroll anchor 제공.
 */

import { useEffect, useState } from "react";
import { Plus, Trash2, Wallet, Calendar, Pencil, Check, X } from "lucide-react";
import { useFinanceStore, type MonthlyCosts } from "../../stores/finance-store";
import { useCashflowStore, type FixedExpenseCategory } from "../../stores/cashflow-store";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import {
  PALETTE,
  editBtnStyle,
  saveBtnStyle,
  cancelBtnStyle,
  readonlyValueStyle,
  readonlySuffixStyle,
} from "./styles";

const CATEGORY_LABELS: Record<FixedExpenseCategory, { ko: string; en: string }> = {
  rent: { ko: "월세", en: "Rent" },
  payroll: { ko: "급여", en: "Payroll" },
  loan: { ko: "대출 이자", en: "Loan" },
  utilities: { ko: "공과금", en: "Utilities" },
  supplies: { ko: "비품·소모품", en: "Supplies" },
  insurance: { ko: "보험", en: "Insurance" },
  subscription: { ko: "구독료", en: "Subscription" },
  other: { ko: "기타", en: "Other" },
};

type Props = {
  ko: boolean;
  expenseFields?: Array<{ fieldKey: string; label: { ko: string; en: string } }>;
};

const MONTHLY_COST_KEYS: Array<keyof MonthlyCosts> = [
  "ingredients", "labor", "rent", "utilities", "sga", "marketing", "interest", "other",
];

const DEFAULT_LABELS: Record<keyof MonthlyCosts, { ko: string; en: string }> = {
  ingredients: { ko: "재료비", en: "Materials" },
  labor: { ko: "인건비", en: "Labor" },
  rent: { ko: "임대료", en: "Rent" },
  utilities: { ko: "공과금", en: "Utilities" },
  sga: { ko: "판관비", en: "SG&A" },
  marketing: { ko: "마케팅비", en: "Marketing" },
  interest: { ko: "이자", en: "Interest" },
  other: { ko: "기타", en: "Other" },
};

export function CostManagementCard({ ko, expenseFields }: Props) {
  const monthlyCosts = useFinanceStore((s) => s.monthlyCosts);
  const setMonthlyCosts = useFinanceStore((s) => s.setMonthlyCosts);

  const fixedExpenses = useCashflowStore((s) => s.fixedExpenses);
  const addFixedExpense = useCashflowStore((s) => s.addFixedExpense);
  const updateFixedExpense = useCashflowStore((s) => s.updateFixedExpense);
  const removeFixedExpense = useCashflowStore((s) => s.removeFixedExpense);

  // 서버 저장: useDashboardCtx 의 flushStoreDataImmediate 사용 (1초 debounce 없는 즉시 저장)
  const d = useDashboardCtx();
  const flushStoreDataImmediate = d.flushStoreDataImmediate;

  // ── 월 평균 비용: 수정/저장 모드 ──
  // 기본 = 읽기 전용 (값만 표시). 수정 클릭 → draft 로 편집 → 저장 시 store + 서버 반영.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MonthlyCosts>(monthlyCosts);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // 외부에서 monthlyCosts 가 바뀌면 (다른 화면에서 수정·서버 reload) draft 동기화
  useEffect(() => {
    if (!editing) setDraft(monthlyCosts);
  }, [monthlyCosts, editing]);

  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDay, setNewDay] = useState("1");
  const [newCategory, setNewCategory] = useState<FixedExpenseCategory>("rent");

  const labelFor = (key: keyof MonthlyCosts) => {
    const dyn = expenseFields?.find((f) => f.fieldKey === key)?.label;
    return dyn ?? DEFAULT_LABELS[key];
  };

  const updateDraftCost = (key: keyof MonthlyCosts, raw: string) => {
    const num = Number(raw.replace(/[^0-9]/g, "")) || 0;
    // 만원 단위 입력 → 원 단위 저장
    setDraft((prev) => ({ ...prev, [key]: num * 10000 }));
  };

  const handleEdit = () => {
    setDraft(monthlyCosts);
    setSaveStatus("idle");
    setSaveError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(monthlyCosts);
    setEditing(false);
    setSaveStatus("idle");
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    setSaveError(null);
    try {
      // 1. 로컬 store 반영 (즉시 UI 업데이트)
      setMonthlyCosts(draft);
      // 2. 서버 즉시 저장 (debounce 없음). 실패 시 throw.
      await flushStoreDataImmediate();
      setSaveStatus("saved");
      setEditing(false);
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : (ko ? "저장에 실패했습니다." : "Save failed."));
    }
  };

  const totalMonthly = MONTHLY_COST_KEYS.reduce((s, k) => s + ((editing ? draft : monthlyCosts)[k] ?? 0), 0);
  const totalFixed = fixedExpenses
    .filter((e) => e.isActive)
    .reduce((s, e) => s + e.amount, 0);

  const handleAddFixed = () => {
    const amt = Number(newAmount.replace(/[^0-9]/g, ""));
    const day = Number(newDay);
    if (!newName.trim() || !amt || amt <= 0 || !day || day < 1 || day > 31) return;
    addFixedExpense({
      id: `fx-${Date.now()}`,
      label: newName.trim(),
      amount: amt * 10000,
      dayOfMonth: Math.min(31, Math.max(1, day)),
      category: newCategory,
      isActive: true,
    });
    setNewName("");
    setNewAmount("");
    setNewDay("1");
  };

  return (
    <section
      data-cost-management
      style={{
        borderRadius: 20,
        background: "white",
        border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
        boxShadow: "0 1px 3px rgba(25,25,112,0.03), 0 12px 28px -16px rgba(25,25,112,0.12)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: `1px solid ${PALETTE.HAIRLINE}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: PALETTE.MIDNIGHT_8,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Wallet size={16} strokeWidth={1.5} color={PALETTE.MIDNIGHT} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 17, fontWeight: 700,
            color: PALETTE.MIDNIGHT_DEEP, letterSpacing: "-0.02em", lineHeight: 1.3,
          }}>
            {ko ? "비용 관리" : "Cost management"}
          </div>
          <div style={{
            fontSize: 12.5, color: PALETTE.MUTED,
            marginTop: 3, lineHeight: 1.45,
          }}>
            {ko
              ? "월 평균 비용과 매달 정해진 날 나가는 고정 지출을 한 곳에서 관리합니다."
              : "Manage monthly average costs and fixed-day recurring expenses in one place."}
          </div>
        </div>
      </div>

      {/* Section 1: 월 평균 비용 (8 categories) — 수정/저장 모드 */}
      <div style={{ padding: "18px 24px 14px" }}>
        <div style={subSectionHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={subSectionLabel}>{ko ? "월 평균 비용" : "Monthly average"}</div>
            <div style={subSectionTotal}>
              {ko ? "합계" : "Total"} {Math.round(totalMonthly / 10000).toLocaleString()}
              {ko ? "만원" : "K"}
            </div>
          </div>
          {/* 수정 / 저장·취소 버튼 */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {saveStatus === "saved" && (
              <span style={{ fontSize: 11.5, color: "#15803d", fontWeight: 600 }}>
                {ko ? "✓ 저장됨" : "✓ Saved"}
              </span>
            )}
            {saveStatus === "error" && saveError && (
              <span style={{ fontSize: 11, color: "#b42334", fontWeight: 600 }}>
                ⚠ {saveError}
              </span>
            )}
            {!editing ? (
              <button type="button" onClick={handleEdit} style={editBtnStyle}>
                <Pencil size={12} strokeWidth={2} />
                <span>{ko ? "수정" : "Edit"}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saveStatus === "saving"}
                  style={cancelBtnStyle}
                >
                  <X size={12} strokeWidth={2} />
                  <span>{ko ? "취소" : "Cancel"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveStatus === "saving"}
                  style={{
                    ...saveBtnStyle,
                    opacity: saveStatus === "saving" ? 0.6 : 1,
                    cursor: saveStatus === "saving" ? "wait" : "pointer",
                  }}
                >
                  <Check size={12} strokeWidth={2} />
                  <span>
                    {saveStatus === "saving"
                      ? ko ? "저장 중…" : "Saving…"
                      : ko ? "저장" : "Save"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
          marginTop: 12,
        }}>
          {MONTHLY_COST_KEYS.map((key) => {
            const label = labelFor(key);
            const source = editing ? draft : monthlyCosts;
            const value = source[key] ?? 0;
            const display = value > 0 ? String(Math.round(value / 10000)) : "";
            return (
              <label key={key} style={fieldRow}>
                <span style={fieldLabel}>{ko ? label.ko : label.en}</span>
                {editing ? (
                  <div style={inputWrap}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={display}
                      onChange={(e) => updateDraftCost(key, e.target.value)}
                      placeholder="0"
                      style={inputStyle}
                      autoFocus={key === MONTHLY_COST_KEYS[0]}
                    />
                    <span style={inputSuffix}>{ko ? "만원" : "K"}</span>
                  </div>
                ) : (
                  <div style={readonlyValueStyle}>
                    <span style={{ color: value > 0 ? PALETTE.MIDNIGHT_DEEP : PALETTE.HINT }}>
                      {value > 0 ? Math.round(value / 10000).toLocaleString() : "—"}
                    </span>
                    <span style={readonlySuffixStyle}>{ko ? "만원" : "K"}</span>
                  </div>
                )}
              </label>
            );
          })}
        </div>
        <div style={hintLine}>
          {ko
            ? "평균값은 손익 카드·비용 구조 도넛·AI 코칭의 진단 기준입니다."
            : "Averages drive your P&L card, cost donut, and AI coaching benchmarks."}
        </div>
      </div>

      <div style={{ height: 1, background: PALETTE.HAIRLINE }} />

      {/* Section 2: 고정 지출 D-day */}
      <div style={{ padding: "18px 24px 22px" }}>
        <div style={subSectionHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={13} strokeWidth={1.5} color={PALETTE.MIDNIGHT} />
            <div style={subSectionLabel}>{ko ? "고정 지출 D-day" : "Fixed schedule"}</div>
          </div>
          {fixedExpenses.length > 0 && (
            <div style={subSectionTotal}>
              {ko ? "월 합계" : "Monthly"} {Math.round(totalFixed / 10000).toLocaleString()}{ko ? "만원" : "K"}
            </div>
          )}
        </div>

        {fixedExpenses.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {fixedExpenses.map((fe) => (
              <div
                key={fe.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto auto",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: fe.isActive ? PALETTE.SUBTLE : "rgba(15,23,42,0.02)",
                  border: `1px solid ${PALETTE.HAIRLINE}`,
                  opacity: fe.isActive ? 1 : 0.55,
                }}
              >
                <input
                  type="checkbox"
                  checked={fe.isActive}
                  onChange={() => updateFixedExpense(fe.id, { isActive: !fe.isActive })}
                  style={{ accentColor: PALETTE.MIDNIGHT, width: 16, height: 16 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13.5, fontWeight: 600, color: PALETTE.INK,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {fe.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: PALETTE.MUTED, marginTop: 2 }}>
                    {ko ? CATEGORY_LABELS[fe.category].ko : CATEGORY_LABELS[fe.category].en}
                  </div>
                </div>
                <div style={dayBadge}>매월 {fe.dayOfMonth}일</div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: PALETTE.MIDNIGHT_DEEP,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {Math.round(fe.amount / 10000).toLocaleString()}{ko ? "만원" : "K"}
                </div>
                <button
                  type="button"
                  onClick={() => removeFixedExpense(fe.id)}
                  style={iconBtn}
                  aria-label={ko ? "삭제" : "Delete"}
                >
                  <Trash2 size={13} strokeWidth={1.5} color={PALETTE.MUTED} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            fontSize: 12.5, color: PALETTE.MUTED, lineHeight: 1.55,
            marginTop: 10,
          }}>
            {ko
              ? "월세·급여·대출이자처럼 매달 정해진 날 나가는 비용을 등록하면 14일 잔고 예측에 자동 반영됩니다."
              : "Add rent, payroll, loan interest — anything that leaves on a set day. Auto-flows into 14-day forecast."}
          </div>
        )}

        {/* Add new */}
        <div style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 12,
          background: PALETTE.MIDNIGHT_4,
          border: `1px dashed ${PALETTE.MIDNIGHT_BORDER}`,
          display: "grid",
          gridTemplateColumns: "1fr 110px 80px 110px auto",
          gap: 8,
          alignItems: "center",
        }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={ko ? "항목 이름 (예: 가게 월세)" : "Name (e.g. Store rent)"}
            style={inputStyle}
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as FixedExpenseCategory)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {(Object.keys(CATEGORY_LABELS) as FixedExpenseCategory[]).map((c) => (
              <option key={c} value={c}>{ko ? CATEGORY_LABELS[c].ko : CATEGORY_LABELS[c].en}</option>
            ))}
          </select>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              inputMode="numeric"
              value={newDay}
              onChange={(e) => setNewDay(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
              placeholder="1"
              style={inputStyle}
            />
            <span style={{ ...inputSuffix, fontSize: 11 }}>{ko ? "일" : "d"}</span>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              inputMode="numeric"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              style={inputStyle}
            />
            <span style={inputSuffix}>{ko ? "만원" : "K"}</span>
          </div>
          <button
            type="button"
            onClick={handleAddFixed}
            disabled={!newName.trim() || !Number(newAmount)}
            style={{
              ...addBtn,
              opacity: !newName.trim() || !Number(newAmount) ? 0.4 : 1,
              cursor: !newName.trim() || !Number(newAmount) ? "not-allowed" : "pointer",
            }}
          >
            <Plus size={13} strokeWidth={2} />
            <span>{ko ? "추가" : "Add"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

const subSectionHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const subSectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: PALETTE.MIDNIGHT,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
};

const subSectionTotal: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: PALETTE.MIDNIGHT_DEEP,
  fontVariantNumeric: "tabular-nums",
  padding: "3px 10px",
  borderRadius: 999,
  background: PALETTE.MIDNIGHT_6,
};

const fieldRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(80px, 90px) 1fr",
  alignItems: "center",
  gap: 10,
};

const fieldLabel: React.CSSProperties = {
  fontSize: 12.5,
  color: PALETTE.MUTED,
  fontWeight: 500,
};

const inputWrap: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 13,
  padding: "8px 36px 8px 12px",
  borderRadius: 8,
  border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
  background: "white",
  color: PALETTE.INK,
  outline: "none",
  fontFamily: "inherit",
  fontVariantNumeric: "tabular-nums",
  boxSizing: "border-box" as const,
};

const inputSuffix: React.CSSProperties = {
  position: "absolute",
  right: 10,
  fontSize: 11,
  color: PALETTE.HINT,
  pointerEvents: "none",
  fontWeight: 600,
};

const hintLine: React.CSSProperties = {
  fontSize: 11.5,
  color: PALETTE.HINT,
  lineHeight: 1.5,
  marginTop: 12,
};

const dayBadge: React.CSSProperties = {
  fontSize: 11,
  color: PALETTE.MIDNIGHT,
  fontWeight: 600,
  padding: "3px 8px",
  borderRadius: 999,
  background: PALETTE.MIDNIGHT_6,
  whiteSpace: "nowrap",
};

const iconBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.15s ease",
};

const addBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "8px 14px",
  borderRadius: 9,
  background: PALETTE.MIDNIGHT,
  color: "white",
  border: "none",
  fontSize: 12.5,
  fontWeight: 700,
  fontFamily: "inherit",
  letterSpacing: "-0.005em",
  whiteSpace: "nowrap",
};

