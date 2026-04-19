"use client";

import { useMemo, useState } from "react";
import { X, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import {
  useCashflowStore,
  CHANNEL_PRESETS,
  type SalesChannelId,
  type FixedExpenseCategory,
  type FixedExpenseSchedule,
} from "../../stores/cashflow-store";
import { sumActiveChannelRatios } from "../../services/cashflow-projection";

type Props = {
  ko: boolean;
  onClose: () => void;
};

/**
 * Cash-flow 설정 시트.
 * - 현재 통장 잔고 입력
 * - 판매 채널 비율 (합 100%)
 * - 월 고정비 캘린더 CRUD
 * - 알림 설정
 */
export function CashflowSetupSheet({ ko, onClose }: Props) {
  const {
    currentBalance,
    setCurrentBalance,
    salesChannels,
    updateChannelRatio,
    toggleChannel,
    fixedExpenses,
    addFixedExpense,
    updateFixedExpense,
    removeFixedExpense,
    crisisThresholdDays,
    setCrisisThresholdDays,
    notifyOnCrisis,
    setNotifyOnCrisis,
    dailyMorningBriefing,
    setDailyMorningBriefing,
    vatReserveEnabled,
    setVatReserveEnabled,
    markSetupCompleted,
    setupCompletedAt,
  } = useCashflowStore();

  const [balanceInput, setBalanceInput] = useState(
    currentBalance > 0 ? String(Math.round(currentBalance / 10000)) : ""
  );

  const [newExpense, setNewExpense] = useState<{
    label: string;
    amount: string;
    dayOfMonth: string;
    category: FixedExpenseCategory;
  }>({
    label: "",
    amount: "",
    dayOfMonth: "25",
    category: "rent",
  });

  const channelSum = useMemo(() => sumActiveChannelRatios(salesChannels), [salesChannels]);
  const allChannelIds: SalesChannelId[] = [
    "cash", "card", "baemin", "coupangeats", "yogiyo", "naverpay",
    "kakaopay", "naverbooking", "smartstore", "coupangwing", "other",
  ];

  const handleSaveAndClose = () => {
    // balance 먼저 저장
    if (balanceInput) {
      const won = parseInt(balanceInput, 10) * 10000;
      if (!isNaN(won) && won >= 0) {
        setCurrentBalance(won);
      }
    }
    if (!setupCompletedAt) {
      markSetupCompleted();
    }
    onClose();
  };

  const handleAddExpense = () => {
    const amount = parseInt(newExpense.amount, 10) * 10000;
    const day = parseInt(newExpense.dayOfMonth, 10);
    if (!newExpense.label.trim() || isNaN(amount) || amount <= 0 || isNaN(day) || day < 1 || day > 31) {
      return;
    }
    const expense: FixedExpenseSchedule = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: newExpense.label.trim(),
      amount,
      dayOfMonth: day,
      category: newExpense.category,
      isActive: true,
    };
    addFixedExpense(expense);
    setNewExpense({ label: "", amount: "", dayOfMonth: "25", category: "rent" });
  };

  const channelRatioValid = channelSum >= 99 && channelSum <= 101; // 오차 허용
  const canSave = !!balanceInput && channelRatioValid;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 210,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(15,23,42,0.4)",
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "92vh",
          borderRadius: "28px 28px 0 0",
          background: "#fff",
          boxShadow: "0 -10px 60px rgba(15,23,42,0.2)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 헤더 */}
        <div style={headerBar}>
          <div>
            <div style={eyebrow}>{ko ? "현금흐름 설정" : "Cash-flow Setup"}</div>
            <div style={title}>
              {setupCompletedAt
                ? ko ? "채널·고정비 수정" : "Edit channels & expenses"
                : ko ? "2분 빠른 설정" : "2-minute quick setup"}
            </div>
          </div>
          <button type="button" onClick={onClose} style={closeBtn} aria-label={ko ? "닫기" : "Close"}>
            <X size={18} strokeWidth={1.8} color="rgba(15,23,42,0.5)" />
          </button>
        </div>

        {/* 본문 */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px" }}>
          {/* 1. 현재 통장 잔고 */}
          <section style={sectionBox}>
            <div style={sectionTitle}>
              <span style={sectionNum}>1</span>
              {ko ? "현재 통장 잔고" : "Current bank balance"}
            </div>
            <div style={sectionDesc}>
              {ko
                ? "사업 계좌에 있는 실제 가용 현금을 입력하세요. 매주 한 번 업데이트를 권장해요."
                : "Enter cash available in your business account. Update weekly for best accuracy."}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "10px" }}>
              <input
                type="text"
                inputMode="numeric"
                value={balanceInput}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, "");
                  setBalanceInput(digits);
                }}
                placeholder={ko ? "예: 300 (만원 단위)" : "e.g., 3000000 (KRW)"}
                style={fieldInput}
              />
              <span style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", fontWeight: 650 }}>
                {ko ? "만원" : "× 10,000 KRW"}
              </span>
            </div>
            {balanceInput && (
              <div style={{ marginTop: "6px", fontSize: "12px", color: "rgba(15,23,42,0.55)" }}>
                = {parseInt(balanceInput, 10).toLocaleString()}만원 ({(parseInt(balanceInput, 10) * 10000).toLocaleString()}원)
              </div>
            )}
          </section>

          {/* 2. 판매 채널 비율 */}
          <section style={sectionBox}>
            <div style={sectionTitle}>
              <span style={sectionNum}>2</span>
              {ko ? "판매 채널 비율" : "Sales channel mix"}
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "11px",
                  fontWeight: 650,
                  color: channelRatioValid ? "#059669" : "#b91c1c",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {channelRatioValid ? <Check size={12} strokeWidth={2.2} /> : <AlertCircle size={12} strokeWidth={2} />}
                {ko ? "합계" : "Sum"} {Math.round(channelSum)}%
              </span>
            </div>
            <div style={sectionDesc}>
              {ko
                ? "매출이 어떤 경로로 들어오는지 비율로 입력하세요. 배민·쿠팡이츠는 수수료·정산주기가 다릅니다."
                : "What % comes from each channel? Each has different fees and settlement timing."}
            </div>

            <div style={{ display: "grid", gap: "6px", marginTop: "12px" }}>
              {allChannelIds.map((id) => {
                const existing = salesChannels.find((c) => c.id === id);
                const preset = CHANNEL_PRESETS[id];
                const isActive = existing?.isActive ?? false;
                const ratio = existing?.salesRatio ?? 0;

                return (
                  <div key={id} style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: isActive ? "rgba(37,99,235,0.04)" : "rgba(15,23,42,0.02)",
                    border: `1px solid ${isActive ? "rgba(37,99,235,0.1)" : "rgba(15,23,42,0.04)"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleChannel(id)}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#2563eb" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>
                          {preset.label[ko ? "ko" : "en"]}
                        </div>
                        <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.5)", marginTop: "1px" }}>
                          D+{preset.settlementDays}
                          {(preset.commissionRate + preset.paymentFeeRate) > 0 && (
                            <> · {ko ? "수수료" : "Fee"} {(preset.commissionRate + preset.paymentFeeRate).toFixed(1)}%</>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={ratio}
                            onChange={(e) => updateChannelRatio(id, parseInt(e.target.value) || 0)}
                            style={{
                              width: "56px",
                              padding: "4px 6px",
                              borderRadius: "6px",
                              border: "1px solid rgba(15,23,42,0.1)",
                              fontSize: "13px",
                              fontWeight: 650,
                              textAlign: "center" as const,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          />
                          <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", fontWeight: 650 }}>%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!channelRatioValid && (
              <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "8px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.1)", fontSize: "11px", color: "#b91c1c" }}>
                {ko
                  ? `채널 비율 합계는 100%가 되어야 해요. 현재 ${Math.round(channelSum)}%`
                  : `Channel ratios must sum to 100%. Current: ${Math.round(channelSum)}%`}
              </div>
            )}
          </section>

          {/* 3. 월 고정비 */}
          <section style={sectionBox}>
            <div style={sectionTitle}>
              <span style={sectionNum}>3</span>
              {ko ? "월 고정비" : "Monthly fixed expenses"}
            </div>
            <div style={sectionDesc}>
              {ko
                ? "월세·급여·대출 이자 등 매월 정해진 날 나가는 돈을 등록하세요."
                : "Register rent, payroll, loan interest — anything that leaves on a set day each month."}
            </div>

            {/* 기존 고정비 리스트 */}
            {fixedExpenses.length > 0 && (
              <div style={{ display: "grid", gap: "6px", marginTop: "10px" }}>
                {fixedExpenses.map((e) => (
                  <div key={e.id} style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: e.isActive ? "rgba(255,255,255,0.8)" : "rgba(15,23,42,0.03)",
                    border: `1px solid ${e.isActive ? "rgba(15,23,42,0.06)" : "rgba(15,23,42,0.02)"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    opacity: e.isActive ? 1 : 0.5,
                  }}>
                    <input
                      type="checkbox"
                      checked={e.isActive}
                      onChange={() => updateFixedExpense(e.id, { isActive: !e.isActive })}
                      style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#2563eb" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{e.label}</div>
                      <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.55)", marginTop: "1px" }}>
                        {ko ? `매월 ${e.dayOfMonth}일` : `Day ${e.dayOfMonth}`} · {CATEGORY_LABEL[e.category][ko ? "ko" : "en"]}
                      </div>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#b91c1c", fontVariantNumeric: "tabular-nums" }}>
                      {Math.round(e.amount / 10000).toLocaleString()}만원
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFixedExpense(e.id)}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "rgba(220,38,38,0.06)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-label={ko ? "삭제" : "Delete"}
                    >
                      <Trash2 size={14} strokeWidth={1.6} color="#b91c1c" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 새 고정비 추가 폼 */}
            <div style={{ marginTop: "12px", padding: "12px", borderRadius: "12px", background: "rgba(37,99,235,0.04)", border: "1px dashed rgba(37,99,235,0.2)" }}>
              <div style={{ fontSize: "12px", fontWeight: 650, color: "#1d3557", marginBottom: "8px" }}>
                {ko ? "새 고정비 추가" : "Add new expense"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.8fr 0.8fr", gap: "6px", marginBottom: "8px" }}>
                <input
                  type="text"
                  placeholder={ko ? "예: 월세, A직원 급여" : "e.g., Rent, Staff A wage"}
                  value={newExpense.label}
                  onChange={(e) => setNewExpense({ ...newExpense, label: e.target.value })}
                  style={fieldInputSmall}
                />
                <input
                  type="number"
                  placeholder={ko ? "금액 (만원)" : "Amt (×10k)"}
                  min="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  style={fieldInputSmall}
                />
                <input
                  type="number"
                  placeholder={ko ? "몇일" : "Day"}
                  min="1"
                  max="31"
                  value={newExpense.dayOfMonth}
                  onChange={(e) => setNewExpense({ ...newExpense, dayOfMonth: e.target.value })}
                  style={fieldInputSmall}
                />
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as FixedExpenseCategory })}
                  style={fieldInputSmall}
                >
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v[ko ? "ko" : "en"]}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddExpense}
                disabled={!newExpense.label.trim() || !newExpense.amount}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  background: newExpense.label.trim() && newExpense.amount ? "#2563eb" : "rgba(15,23,42,0.08)",
                  color: newExpense.label.trim() && newExpense.amount ? "#fff" : "rgba(15,23,42,0.4)",
                  fontSize: "12px",
                  fontWeight: 650,
                  cursor: newExpense.label.trim() && newExpense.amount ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <Plus size={14} strokeWidth={2} />
                {ko ? "추가" : "Add"}
              </button>
            </div>
          </section>

          {/* 4. 알림 및 고급 옵션 */}
          <section style={sectionBox}>
            <div style={sectionTitle}>
              <span style={sectionNum}>4</span>
              {ko ? "알림 및 옵션" : "Alerts & Options"}
            </div>
            <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
              <ToggleRow
                label={ko ? "위기 경고 푸시" : "Crisis warning push"}
                desc={ko ? `${crisisThresholdDays}일 내 잔고가 마이너스로 갈 때 알림` : `Alert when balance goes negative within ${crisisThresholdDays} days`}
                value={notifyOnCrisis}
                onChange={setNotifyOnCrisis}
              />
              <ToggleRow
                label={ko ? "매일 아침 요약" : "Daily morning summary"}
                desc={ko ? "매일 오전 8시 통장 현황 요약" : "Balance snapshot every morning at 8am"}
                value={dailyMorningBriefing}
                onChange={setDailyMorningBriefing}
              />
              <ToggleRow
                label={ko ? "부가세 10% 적립" : "VAT 10% reserve"}
                desc={ko ? "입금액의 10%를 세금 적립으로 미리 제외하고 표시" : "Exclude 10% of inflow as VAT reserve"}
                value={vatReserveEnabled}
                onChange={setVatReserveEnabled}
              />

              {/* 위기 임계일 조정 */}
              <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(15,23,42,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>
                    {ko ? "위기 감지 기간" : "Crisis detection window"}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>
                    {crisisThresholdDays}{ko ? "일" : "d"}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={crisisThresholdDays}
                  onChange={(e) => setCrisisThresholdDays(parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />
                <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.5)", marginTop: "2px" }}>
                  {ko ? "이 기간 내 통장 마이너스 가능성 있으면 경고" : "Alert if balance may go negative within this window"}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 하단 저장 버튼 */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(15,23,42,0.05)", display: "flex", gap: "8px" }}>
          <button type="button" onClick={onClose} style={cancelBtn}>
            {ko ? "취소" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            disabled={!canSave}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: canSave ? "#2563eb" : "rgba(15,23,42,0.08)",
              color: canSave ? "#fff" : "rgba(15,23,42,0.4)",
              fontSize: "14px",
              fontWeight: 650,
              cursor: canSave ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}
          >
            {setupCompletedAt ? (ko ? "저장" : "Save") : (ko ? "설정 완료" : "Finish setup")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponents ───

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{
      padding: "10px 12px",
      borderRadius: "10px",
      background: "rgba(15,23,42,0.02)",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
    }}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#2563eb", flexShrink: 0 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{label}</div>
        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.55)", marginTop: "1px" }}>{desc}</div>
      </div>
    </label>
  );
}

// ─── Constants ───

const CATEGORY_LABEL: Record<FixedExpenseCategory, { ko: string; en: string }> = {
  rent: { ko: "월세", en: "Rent" },
  payroll: { ko: "급여", en: "Payroll" },
  loan: { ko: "대출 이자", en: "Loan interest" },
  utilities: { ko: "공과금", en: "Utilities" },
  supplies: { ko: "정기 재료비", en: "Supplies" },
  insurance: { ko: "보험", en: "Insurance" },
  subscription: { ko: "구독료", en: "Subscription" },
  other: { ko: "기타", en: "Other" },
};

// ─── Styles ───

const headerBar: React.CSSProperties = {
  padding: "18px 20px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid rgba(15,23,42,0.05)",
};

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.4)",
};

const title: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#0f172a",
  marginTop: "2px",
};

const closeBtn: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: "rgba(15,23,42,0.04)",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionBox: React.CSSProperties = {
  padding: "16px",
  borderRadius: "16px",
  background: "#fff",
  border: "1px solid rgba(15,23,42,0.05)",
  marginBottom: "14px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#0f172a",
  letterSpacing: "-0.02em",
  marginBottom: "4px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const sectionNum: React.CSSProperties = {
  width: "22px",
  height: "22px",
  borderRadius: "6px",
  background: "#2563eb",
  color: "#fff",
  fontSize: "11px",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionDesc: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(15,23,42,0.55)",
  lineHeight: 1.55,
  marginTop: "2px",
};

const fieldInput: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(15,23,42,0.1)",
  fontSize: "14px",
  fontFamily: "inherit",
  background: "#fff",
};

const fieldInputSmall: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: "6px",
  border: "1px solid rgba(15,23,42,0.1)",
  fontSize: "12px",
  fontFamily: "inherit",
  background: "#fff",
  minWidth: 0,
};

const cancelBtn: React.CSSProperties = {
  padding: "12px 20px",
  borderRadius: "12px",
  border: "1px solid rgba(15,23,42,0.1)",
  background: "#fff",
  color: "rgba(15,23,42,0.6)",
  fontSize: "14px",
  fontWeight: 620,
  cursor: "pointer",
  fontFamily: "inherit",
};
