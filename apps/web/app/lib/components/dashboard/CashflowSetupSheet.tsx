"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Check, AlertCircle, Info, TrendingUp, Calendar, Wallet, Bell, Building2, RefreshCw, Sparkles } from "lucide-react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermStatus,
} from "../../services/notifications";
import {
  useCashflowStore,
  CHANNEL_PRESETS,
  type SalesChannelId,
  type FixedExpenseCategory,
  type FixedExpenseSchedule,
} from "../../stores/cashflow-store";
import { useProfileStore } from "../../stores/profile-store";
import { useOperationsStore } from "../../stores/operations-store";
import { sumActiveChannelRatios } from "../../services/cashflow-projection";
import { useBankBalance } from "../../hooks/useBankBalance";

type Props = {
  ko: boolean;
  onClose: () => void;
  /** 시트 마운트 시 자동 스크롤할 섹션 id (예: "fixed-expenses", "channels", "balance") */
  targetSection?: string;
};

/**
 * Cash-flow 설정 시트 — 미드나이트 블루 + 글래스모피즘 톤으로 재설계
 *  1. 통장 잔고
 *  2. 판매 채널 비율 (정확한 2025-Q1 수수료/정산주기 + ⓘ 툴팁)
 *  3. 월 고정비 캘린더
 *  4. 알림·옵션
 *
 * 입력 데이터는 Supabase 의 cashflow_settings JSONB 컬럼에 자동 저장됨
 * (usePersistence collectStoreData 가 매 변경마다 동기화).
 */
export function CashflowSetupSheet({ ko, onClose, targetSection }: Props) {
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
    applyIndustryDefaults,
  } = useCashflowStore();

  // 업종 컨텍스트 — 채널 믹스 초기값 추천 및 업종별 디폴트 적용용
  const industryCategoryId = useProfileStore((s) => s.selectedIndustryCategoryId);

  // 세무 설정 — VAT 적립률을 일반/간이 과세 따라 다르게 안내
  const vatType = useOperationsStore((s) => s.taxSettings.vatType);
  // 간이과세 평균 부가율 ≈ 3% (외식·소매 평균. 정확치는 업종별 차등이지만 단순화)
  const vatReserveRate = vatType === "simplified" ? 3 : 10;

  // 통장 자동 불러오기 — CODEF 사업자 통장 연동 잔고
  const bank = useBankBalance();

  const [auditOpen, setAuditOpen] = useState(false);

  const [balanceInput, setBalanceInput] = useState(
    currentBalance > 0 ? String(Math.round(currentBalance / 10000)) : ""
  );
  const [hoveredChannel, setHoveredChannel] = useState<SalesChannelId | null>(null);

  // SSR-safe portal mount: 첫 클라이언트 렌더 후에 portal 활성화
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // 알림 권한 상태 — 토글 ON 시 자동 요청
  const [permStatus, setPermStatus] = useState<NotificationPermStatus>("default");
  useEffect(() => { if (mounted) setPermStatus(getNotificationPermission()); }, [mounted]);

  // 권한 요청 핸들러 — notifyOnCrisis 또는 dailyMorningBriefing 토글 ON 시 호출
  const handleNotificationToggle = async (
    setter: (v: boolean) => void,
    nextValue: boolean,
  ) => {
    setter(nextValue);
    // OFF → ON 전환 시 권한이 default 면 요청
    if (nextValue && permStatus === "default") {
      const result = await requestNotificationPermission();
      setPermStatus(result);
    }
  };

  // body 스크롤 잠금 — 모달 열린 동안 뒤 스크롤 방지
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // targetSection 이 주어지면 시트 마운트 직후 해당 섹션으로 자동 스크롤 + halo
  useEffect(() => {
    if (!mounted || !targetSection) return;
    const el = document.querySelector<HTMLElement>(`[data-cfs-section="${targetSection}"]`);
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      const prevShadow = el.style.boxShadow;
      const prevTransition = el.style.transition;
      el.style.transition = "box-shadow 0.4s cubic-bezier(0.22,1,0.36,1)";
      el.style.boxShadow = "0 0 0 4px rgba(45,212,191,0.45), 0 12px 32px rgba(45,212,191,0.2)";
      window.setTimeout(() => {
        el.style.boxShadow = prevShadow;
        window.setTimeout(() => { el.style.transition = prevTransition; }, 400);
      }, 1400);
    }, 240);
    return () => window.clearTimeout(t);
  }, [mounted, targetSection]);

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
    "cash", "card", "baemin", "coupangeats", "yogiyo", "ttanggyeoyo",
    "naverpay", "kakaopay", "naverbooking", "smartstore", "coupangwing", "other",
  ];

  const handleSaveAndClose = () => {
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

  const channelRatioValid = channelSum >= 99 && channelSum <= 101;
  const canSave = !!balanceInput && channelRatioValid;

  // 월 고정비 합계 (활성만)
  const fixedTotal = fixedExpenses.filter((e) => e.isActive).reduce((s, e) => s + e.amount, 0);

  // SSR 가드 — 마운트 전에는 렌더 안 함 (createPortal 은 document.body 필요)
  if (!mounted) return null;

  const modalContent = (
    <>
      <style>{KEYFRAMES}</style>
      <div
        className="cfs-backdrop"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="cfs-panel" role="dialog" aria-modal="true">
          {/* ───────── Header ───────── */}
          <header className="cfs-header">
            <div className="cfs-header-left">
              <div className="cfs-header-icon-wrap">
                <Wallet size={16} color="#fff" strokeWidth={2.2} />
              </div>
              <div>
                <div className="cfs-header-eyebrow">{ko ? "현금흐름 설정" : "Cash-flow Setup"}</div>
                <div className="cfs-header-title">
                  {setupCompletedAt
                    ? ko ? "채널·고정비 수정" : "Edit channels & expenses"
                    : ko ? "2분 빠른 설정" : "2-minute quick setup"}
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="cfs-close" aria-label={ko ? "닫기" : "Close"}>
              <X size={16} strokeWidth={1.8} />
            </button>
          </header>

          {/* ───────── Body ───────── */}
          <div className="cfs-body">

            {/* ─── 1. 통장 잔고 ─── */}
            <section className="cfs-section">
              <SectionHeader
                num={1}
                Icon={Wallet}
                title={ko ? "현재 통장 잔고" : "Current bank balance"}
                desc={ko
                  ? "사업 계좌에 있는 실제 가용 현금이에요. 연동된 통장이 있으면 자동으로 불러올 수 있고, 직접 입력도 가능합니다."
                  : "Cash available in your business account. Auto-loaded from connected bank or enter manually."}
              />

              {/* 통장 자동 불러오기 배너 — 연동된 사업자 통장이 있을 때만 노출 */}
              {bank.connected && bank.accounts.length > 0 && (
                <div className="cfs-bank-banner">
                  <div className="cfs-bank-banner-head">
                    <div className="cfs-bank-banner-icon">
                      <Building2 size={14} strokeWidth={2.2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cfs-bank-banner-title">
                        {ko ? "연동된 사업자 통장 잔고" : "Linked business account balance"}
                        {bank.isStale && (
                          <span className="cfs-bank-stale-pill">
                            {ko ? "24h+ 경과" : "Stale"}
                          </span>
                        )}
                      </div>
                      <div className="cfs-bank-banner-amount">
                        {Math.round(bank.totalBalance / 10000).toLocaleString()}{ko ? "만원" : "× 10K"}
                        <span className="cfs-bank-banner-raw">
                          ({bank.totalBalance.toLocaleString()}{ko ? "원" : " KRW"})
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cfs-bank-refresh"
                      onClick={() => void bank.syncAndRefresh()}
                      disabled={bank.loading}
                      aria-label={ko ? "통장 동기화" : "Sync bank"}
                      title={ko ? "통장에서 다시 불러오기" : "Re-fetch from bank"}
                    >
                      <RefreshCw size={12} strokeWidth={2.2} className={bank.loading ? "cfs-spin" : ""} />
                    </button>
                  </div>

                  {/* 계좌별 분해 (2개 이상일 때만) */}
                  {bank.accounts.length > 1 && (
                    <ul className="cfs-bank-accounts">
                      {bank.accounts.map((a) => (
                        <li key={a.accountId}>
                          <span className="cfs-bank-acc-label">
                            {a.bankName ?? "—"} {a.accountNumberMask ?? ""}
                            {a.isPrimary && <span className="cfs-bank-primary-pill">{ko ? "주" : "Primary"}</span>}
                          </span>
                          <span className="cfs-bank-acc-amount">
                            {Math.round(a.balance / 10000).toLocaleString()}{ko ? "만원" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* 잔고 스냅샷 시점 안내 */}
                  {bank.asOf && (
                    <div className="cfs-bank-asof">
                      {ko ? "기준 시각" : "As of"}: {formatAsOf(bank.asOf, ko)}
                    </div>
                  )}

                  <div className="cfs-bank-actions">
                    <button
                      type="button"
                      className="cfs-bank-apply-btn"
                      onClick={() => setBalanceInput(String(Math.round(bank.totalBalance / 10000)))}
                      disabled={bank.totalBalance <= 0}
                    >
                      <Check size={12} strokeWidth={2.4} />
                      {ko ? "이 금액 사용하기" : "Use this amount"}
                    </button>
                    <span className="cfs-bank-hint">
                      {ko
                        ? "직접 다른 금액을 입력해도 됩니다 (예: 미연동 계좌 합산)"
                        : "You can override with a different amount"}
                    </span>
                  </div>
                </div>
              )}

              {/* 미연동 상태 안내 — 통장 연결 유도 */}
              {!bank.connected && !bank.loading && (
                <div className="cfs-bank-empty">
                  <Info size={12} strokeWidth={2.2} />
                  <span>
                    {ko
                      ? "사업자 통장을 연동하면 잔고가 자동으로 불러와집니다. 지금은 직접 입력해 주세요."
                      : "Link your business account to auto-load balance. For now, enter manually."}
                  </span>
                </div>
              )}

              <div className="cfs-balance-input-wrap">
                <input
                  type="text"
                  inputMode="numeric"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={ko ? "예: 300" : "e.g., 300"}
                  className="cfs-balance-input"
                />
                <span className="cfs-balance-unit">{ko ? "만원" : "× 10K KRW"}</span>
              </div>
              {balanceInput && (
                <div className="cfs-balance-preview">
                  = {parseInt(balanceInput, 10).toLocaleString()}만원 ({(parseInt(balanceInput, 10) * 10000).toLocaleString()}원)
                </div>
              )}
            </section>

            {/* ─── 2. 판매 채널 비율 ─── */}
            <section className="cfs-section">
              <SectionHeader
                num={2}
                Icon={TrendingUp}
                title={ko ? "판매 채널 비율" : "Sales channel mix"}
                desc={ko
                  ? "매출이 들어오는 경로를 비율로 입력하세요. 배민·쿠팡이츠 등은 정산이 늦고 수수료가 높아 현금흐름에 큰 영향을 줍니다."
                  : "Each channel has different fees and settlement timing — critical for cashflow."}
                rightSlot={
                  <span className={`cfs-sum-badge ${channelRatioValid ? "cfs-sum-ok" : "cfs-sum-bad"}`}>
                    {channelRatioValid
                      ? <Check size={12} strokeWidth={2.4} />
                      : <AlertCircle size={12} strokeWidth={2.2} />
                    }
                    {ko ? "합계" : "Sum"} {Math.round(channelSum)}%
                  </span>
                }
              />

              {/* 업종 추천 적용 — industryCategoryId 가 있을 때만 노출 */}
              {industryCategoryId && (
                <button
                  type="button"
                  className="cfs-industry-suggest-btn"
                  onClick={() => applyIndustryDefaults(industryCategoryId)}
                  title={ko ? "업종 평균 채널 믹스로 갈아끼우기" : "Apply industry-average channel mix"}
                >
                  <Sparkles size={11} strokeWidth={2.2} />
                  {ko
                    ? `${industryLabel(industryCategoryId, true)} 업종 평균값 적용`
                    : `Apply ${industryLabel(industryCategoryId, false)} avg`}
                </button>
              )}

              <div className="cfs-channel-list">
                {allChannelIds.map((id) => {
                  const existing = salesChannels.find((c) => c.id === id);
                  const preset = CHANNEL_PRESETS[id];
                  const isActive = existing?.isActive ?? false;
                  const ratio = existing?.salesRatio ?? 0;
                  const totalFee = preset.commissionRate + preset.paymentFeeRate;

                  return (
                    <div
                      key={id}
                      className={`cfs-channel-row ${isActive ? "cfs-channel-active" : ""}`}
                    >
                      <label className="cfs-channel-checkbox-wrap">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleChannel(id)}
                          className="cfs-checkbox"
                        />
                        <div className="cfs-channel-meta">
                          <div className="cfs-channel-name">
                            {preset.label[ko ? "ko" : "en"]}
                            {preset.rateNote && (
                              <button
                                type="button"
                                className="cfs-info-btn"
                                onMouseEnter={() => setHoveredChannel(id)}
                                onMouseLeave={() => setHoveredChannel(null)}
                                onClick={(e) => { e.preventDefault(); setHoveredChannel(hoveredChannel === id ? null : id); }}
                                aria-label={ko ? "수수료 상세" : "Fee details"}
                              >
                                <Info size={11} strokeWidth={1.5} />
                              </button>
                            )}
                          </div>
                          <div className="cfs-channel-detail">
                            <span className="cfs-channel-detail-pill">D+{preset.settlementDays}</span>
                            {totalFee > 0 && (
                              <span className="cfs-channel-detail-pill cfs-channel-fee-pill">
                                {ko ? "수수료" : "Fee"} {totalFee.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                      {isActive && (
                        <div className="cfs-channel-ratio-wrap">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={ratio}
                            onChange={(e) => updateChannelRatio(id, parseInt(e.target.value) || 0)}
                            className="cfs-ratio-input"
                          />
                          <span className="cfs-ratio-pct">%</span>
                        </div>
                      )}

                      {/* 수수료 상세 툴팁 */}
                      {hoveredChannel === id && preset.rateNote && (
                        <div className="cfs-tooltip">
                          {preset.rateNote[ko ? "ko" : "en"]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!channelRatioValid && (
                <div className="cfs-warn-box">
                  {ko
                    ? `채널 비율 합계는 100%가 되어야 해요. 현재 ${Math.round(channelSum)}%`
                    : `Channel ratios must sum to 100%. Current: ${Math.round(channelSum)}%`}
                </div>
              )}
            </section>

            {/* ─── 3. 월 고정비 ─── */}
            <section className="cfs-section" id="cfs-section-fixed-expenses" data-cfs-section="fixed-expenses">
              <SectionHeader
                num={3}
                Icon={Calendar}
                title={ko ? "월 고정비" : "Monthly fixed expenses"}
                desc={ko
                  ? "월세·급여·대출 이자 등 매월 정해진 날 나가는 돈을 등록하세요."
                  : "Rent, payroll, loan interest — anything that leaves on a set day."}
                rightSlot={
                  fixedExpenses.length > 0 ? (
                    <span className="cfs-total-pill">
                      {ko ? "월 합계" : "Monthly"} {Math.round(fixedTotal / 10000).toLocaleString()}만원
                    </span>
                  ) : null
                }
              />

              {fixedExpenses.length > 0 && (
                <div className="cfs-expense-list">
                  {fixedExpenses.map((e) => (
                    <div
                      key={e.id}
                      className={`cfs-expense-row ${e.isActive ? "" : "cfs-expense-inactive"}`}
                    >
                      <input
                        type="checkbox"
                        checked={e.isActive}
                        onChange={() => updateFixedExpense(e.id, { isActive: !e.isActive })}
                        className="cfs-checkbox"
                      />
                      <div className="cfs-expense-meta">
                        <div className="cfs-expense-label">{e.label}</div>
                        <div className="cfs-expense-detail">
                          {ko ? `매월 ${e.dayOfMonth}일` : `Day ${e.dayOfMonth}`} · {CATEGORY_LABEL[e.category][ko ? "ko" : "en"]}
                        </div>
                      </div>
                      <div className="cfs-expense-amount">
                        {Math.round(e.amount / 10000).toLocaleString()}만원
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFixedExpense(e.id)}
                        className="cfs-trash-btn"
                        aria-label={ko ? "삭제" : "Delete"}
                      >
                        <Trash2 size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 신규 고정비 입력 카드 */}
              <div className="cfs-add-expense-card">
                <div className="cfs-add-expense-title">
                  {ko ? "새 고정비 추가" : "Add new expense"}
                </div>
                <div className="cfs-add-expense-grid">
                  <input
                    type="text"
                    placeholder={ko ? "이름 (예: 월세)" : "Name (e.g., Rent)"}
                    value={newExpense.label}
                    onChange={(e) => setNewExpense({ ...newExpense, label: e.target.value })}
                    className="cfs-mini-input"
                  />
                  <input
                    type="number"
                    placeholder={ko ? "만원" : "×10k"}
                    min="0"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="cfs-mini-input"
                  />
                  <input
                    type="number"
                    placeholder={ko ? "일" : "Day"}
                    min="1"
                    max="31"
                    value={newExpense.dayOfMonth}
                    onChange={(e) => setNewExpense({ ...newExpense, dayOfMonth: e.target.value })}
                    className="cfs-mini-input"
                  />
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as FixedExpenseCategory })}
                    className="cfs-mini-input"
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
                  className={`cfs-add-btn ${newExpense.label.trim() && newExpense.amount ? "cfs-add-btn-active" : ""}`}
                >
                  <Plus size={14} strokeWidth={2.2} />
                  {ko ? "추가" : "Add"}
                </button>
              </div>
            </section>

            {/* ─── 4. 알림·옵션 ─── */}
            <section className="cfs-section">
              <SectionHeader
                num={4}
                Icon={Bell}
                title={ko ? "알림 및 옵션" : "Alerts & Options"}
                desc={ko ? "위기 감지 기간과 부가세 적립 등 운영 옵션" : "Crisis window & VAT reserve"}
              />
              {/* 권한 상태 안내 — denied 면 시스템 설정으로 가야함 */}
              {(notifyOnCrisis || dailyMorningBriefing) && permStatus === "denied" && (
                <div className="cfs-perm-warn">
                  <AlertCircle size={13} strokeWidth={2.2} />
                  <span>{ko
                    ? "브라우저가 알림을 차단했습니다. 주소창 좌측 자물쇠 → 알림 → 허용으로 변경하세요."
                    : "Browser blocked notifications. Click the lock icon in the URL bar → Notifications → Allow."}</span>
                </div>
              )}
              {(notifyOnCrisis || dailyMorningBriefing) && permStatus === "granted" && (
                <div className="cfs-perm-ok">
                  <Check size={13} strokeWidth={2.4} />
                  <span>{ko ? "알림 권한 허용됨 — 페이지가 열려있을 때 알림이 옵니다" : "Notifications allowed — fires when page is open"}</span>
                </div>
              )}
              {(notifyOnCrisis || dailyMorningBriefing) && permStatus === "unsupported" && (
                <div className="cfs-perm-warn">
                  <AlertCircle size={13} strokeWidth={2.2} />
                  <span>{ko ? "이 브라우저는 알림을 지원하지 않습니다" : "This browser does not support notifications"}</span>
                </div>
              )}

              <div className="cfs-options-list">
                <ToggleRow
                  label={ko ? "위기 경고" : "Crisis warning"}
                  desc={ko ? `${crisisThresholdDays}일 내 잔고가 마이너스로 갈 때 시스템 알림` : `System alert if balance goes negative within ${crisisThresholdDays} days`}
                  value={notifyOnCrisis}
                  onChange={(v) => handleNotificationToggle(setNotifyOnCrisis, v)}
                />
                <ToggleRow
                  label={ko ? "매일 아침 요약" : "Daily morning summary"}
                  desc={ko ? "매일 오전 8~11시 사이 어제 매출 + 오늘 잔고 요약 알림" : "Morning briefing 8-11am with yesterday's sales + today's balance"}
                  value={dailyMorningBriefing}
                  onChange={(v) => handleNotificationToggle(setDailyMorningBriefing, v)}
                />
                <ToggleRow
                  label={ko
                    ? `부가세 ${vatReserveRate}% 적립 (${vatType === "simplified" ? "간이과세 평균" : "일반과세"})`
                    : `VAT ${vatReserveRate}% reserve (${vatType === "simplified" ? "simplified avg" : "general"})`}
                  desc={ko
                    ? `입금액의 ${vatReserveRate}%를 세금 적립으로 미리 빼고 예측해요. 과세 유형은 '내 가게 → 세무 설정' 에서 변경 가능합니다.`
                    : `Exclude ${vatReserveRate}% of inflow as VAT reserve. Change type in 'My Store → Tax settings'.`}
                  value={vatReserveEnabled}
                  onChange={setVatReserveEnabled}
                />

                {/* 위기 임계일 슬라이더 */}
                <div className="cfs-slider-row">
                  <div className="cfs-slider-header">
                    <span className="cfs-slider-label">
                      {ko ? "위기 감지 기간" : "Crisis detection window"}
                    </span>
                    <span className="cfs-slider-value">
                      {crisisThresholdDays}{ko ? "일" : "d"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="14"
                    value={crisisThresholdDays}
                    onChange={(e) => setCrisisThresholdDays(parseInt(e.target.value))}
                    className="cfs-slider"
                  />
                  <div className="cfs-slider-desc">
                    {ko ? "이 기간 내 통장 마이너스 가능성 있으면 경고" : "Alert if balance may go negative within this window"}
                  </div>
                </div>
              </div>
            </section>

            {/* ─── 현금흐름 모델 점검 (audit) — 무엇이 반영되었고 무엇이 아직 빠졌는지 투명 공개 ─── */}
            <section className="cfs-section cfs-audit-section">
              <button
                type="button"
                className="cfs-audit-toggle"
                onClick={() => setAuditOpen(!auditOpen)}
                aria-expanded={auditOpen}
              >
                <span>{ko ? "📐 이 현금흐름 모델은 무엇을 반영하나요?" : "📐 What this cash-flow model covers"}</span>
                <span>{auditOpen ? "▴" : "▾"}</span>
              </button>
              {auditOpen && (
                <div className="cfs-audit-body">
                  <div className="cfs-audit-block">
                    <div className="cfs-audit-h">{ko ? "✓ 현재 반영되는 것" : "✓ Currently modeled"}</div>
                    <ul>
                      <li>{ko ? "통장 잔고 (CODEF 연동 또는 수동 입력)" : "Bank balance (CODEF or manual)"}</li>
                      <li>{ko ? "채널별 정산주기 (D+0~D+15) 와 수수료" : "Per-channel settlement timing (D+0~D+15) & fees"}</li>
                      <li>{ko ? "월 고정비 캘린더 (월세·급여·대출·공과금 등)" : "Monthly fixed-expense calendar"}</li>
                      <li>{ko ? `부가세 ${vatReserveRate}% 적립 (${vatType === "simplified" ? "간이" : "일반"} 과세 반영)` : `VAT ${vatReserveRate}% reserve (${vatType})`}</li>
                      <li>{ko ? "위기 감지 (잔고 < 0 도달 일수)" : "Crisis detection (days to negative)"}</li>
                    </ul>
                  </div>
                  <div className="cfs-audit-block cfs-audit-gaps">
                    <div className="cfs-audit-h">{ko ? "⚠ 아직 반영되지 않은 실무 개념" : "⚠ Real-world concepts not yet modeled"}</div>
                    <ul>
                      <li>
                        <b>{ko ? "외상 매입 (AP) 결제일" : "Accounts payable (AP)"}</b>
                        {" — "}
                        {ko ? "식자재·원자재 공급처 결제일 (보통 D+15~30). 지금은 *고정비 캘린더* 의 한 항목으로 직접 추가하시면 됩니다." : "Supplier payment terms. For now, add as a fixed expense."}
                      </li>
                      {industryCategoryId === "online-digital" || industryCategoryId === "ecommerce" ? (
                        <>
                          <li>
                            <b>{ko ? "PG 정산 보류" : "PG settlement reserve"}</b>
                            {" — "}
                            {ko ? "PG사가 분쟁/취소 대비 매출의 3~5% 보류. 13주 예측에 미반영 (보수적으로 -5% 마진 가정 권장)." : "PG firms hold 3-5% for disputes."}
                          </li>
                          <li>
                            <b>{ko ? "환불·반품률" : "Refund / return rate"}</b>
                            {" — "}
                            {ko ? "이커머스 평균 5~15%. 매출의 그만큼이 사실상 차감됩니다." : "5-15% avg for e-commerce."}
                          </li>
                        </>
                      ) : null}
                      {industryCategoryId === "startup-tech" || industryCategoryId === "saas" ? (
                        <li>
                          <b>{ko ? "Deferred revenue / 선수금" : "Deferred revenue"}</b>
                          {" — "}
                          {ko ? "연납 SaaS 는 입금 ≠ 인식 매출. 현금흐름 관점에선 잔고만 보면 충분하지만, 매출 인식 관점에선 분리 필요." : "Annual SaaS prepayments inflate cash, not recognized revenue."}
                        </li>
                      ) : null}
                      {industryCategoryId === "food" || industryCategoryId === "cafe-dessert" ? (
                        <li>
                          <b>{ko ? "재고 회전일 (DIO)" : "Inventory days (DIO)"}</b>
                          {" — "}
                          {ko ? "식자재가 매출로 전환되기까지 평균 3~7일. 현재 *재고 카드* 에서 따로 관리합니다." : "3-7 days food → revenue. Tracked in Inventory card."}
                        </li>
                      ) : null}
                      <li>
                        <b>{ko ? "비상금 (Emergency reserve)" : "Emergency reserve"}</b>
                        {" — "}
                        {ko ? "월 운영비의 1~3개월치 권장. 위기 감지 기간 슬라이더로 부분적으로 대체 중." : "1-3 months of opex recommended."}
                      </li>
                      <li>
                        <b>{ko ? "세금 (부가세 외)" : "Other taxes"}</b>
                        {" — "}
                        {ko ? "종합소득세(5월), 법인세(3월), 원천세(매월 10일). 큰 항목은 *고정비 캘린더* 에 미리 등록하세요." : "Income/corporate tax — add to fixed-expense calendar."}
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </section>

            {/* 하단 미니 안내 */}
            <div className="cfs-disclaimer">
              {ko
                ? "ⓘ 입력한 모든 정보는 사장님 계정에 안전하게 저장됩니다 (Supabase). 다른 기기에서도 동일하게 보입니다."
                : "ⓘ All settings are saved securely to your account (Supabase) and synced across devices."}
            </div>
          </div>

          {/* ───────── Footer ───────── */}
          <div className="cfs-footer">
            <button type="button" onClick={onClose} className="cfs-cancel-btn">
              {ko ? "취소" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              disabled={!canSave}
              className={`cfs-save-btn ${canSave ? "cfs-save-btn-active" : ""}`}
            >
              {setupCompletedAt ? (ko ? "저장" : "Save") : (ko ? "설정 완료" : "Finish setup")}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Portal — document.body 에 렌더해서 모든 stacking context (transform/filter/will-change) 탈출
  return createPortal(modalContent, document.body);
}

// ─── Sub-components ─────────────────────────────────────────────────

function SectionHeader({
  num, Icon, title, desc, rightSlot,
}: {
  num: number;
  Icon: typeof Wallet;
  title: string;
  desc: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <>
      <div className="cfs-section-header">
        <span className="cfs-section-num">{num}</span>
        <Icon size={14} strokeWidth={1.5} color="#191970" style={{ flexShrink: 0 }} />
        <span className="cfs-section-title">{title}</span>
        {rightSlot && <div className="cfs-section-right">{rightSlot}</div>}
      </div>
      <div className="cfs-section-desc">{desc}</div>
    </>
  );
}

function ToggleRow({
  label, desc, value, onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="cfs-toggle-row">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="cfs-checkbox"
      />
      <div className="cfs-toggle-meta">
        <div className="cfs-toggle-label">{label}</div>
        <div className="cfs-toggle-desc">{desc}</div>
      </div>
    </label>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

/** 업종 카테고리 ID → 사용자 표시명 (한국어/영어). 시트의 "○○ 업종 평균값 적용" 버튼용. */
function industryLabel(categoryId: string, ko: boolean): string {
  switch (categoryId) {
    case "food":            return ko ? "외식"          : "Restaurant";
    case "cafe-dessert":    return ko ? "카페·디저트"   : "Cafe/Dessert";
    case "retail":          return ko ? "소매"          : "Retail";
    case "beauty":          return ko ? "뷰티"          : "Beauty";
    case "pet":             return ko ? "펫"            : "Pet";
    case "health":          return ko ? "건강"          : "Health";
    case "online-digital":  return ko ? "온라인"        : "Online";
    case "ecommerce":       return ko ? "이커머스"      : "E-commerce";
    case "startup-tech":    return ko ? "스타트업"      : "Startup";
    case "saas":            return ko ? "SaaS"          : "SaaS";
    default:                return ko ? "일반"          : "General";
  }
}

/** ISO 시각 → 사람이 읽기 좋은 짧은 라벨. 예: "5월 11일 14:32" / "May 11, 14:32". */
function formatAsOf(iso: string, ko: boolean): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  if (ko) {
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

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

// ─── CSS (Glassmorphism + Midnight Blue tone) ─────────────────────
const KEYFRAMES = `
@keyframes cfsBackdropIn {
  from { opacity: 0; backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(28px) saturate(160%); -webkit-backdrop-filter: blur(28px) saturate(160%); }
}
@keyframes cfsPanelIn {
  from { opacity: 0; transform: scale(.94) translateY(8px); filter: blur(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}
@keyframes cfsTooltipIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

.cfs-backdrop {
  position: fixed; inset: 0; z-index: 210;
  display: flex; align-items: center; justify-content: center;
  /* 더 깊고 균일한 미드나이트 톤 + 강한 블러로 뒤 화면 정리 */
  background:
    radial-gradient(ellipse at center, rgba(10,25,41,0.55) 0%, rgba(10,25,41,0.7) 100%);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  animation: cfsBackdropIn .32s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: "Pretendard Variable", Pretendard, -apple-system, sans-serif;
  padding: 32px 16px;  /* 모달 주변 여유 — 패널이 화면 끝에 붙지 않게 */
}

.cfs-panel {
  width: 100%; max-width: 680px;
  height: min(720px, calc(100vh - 64px));   /* 위·아래 32px 여백 보장 */
  max-height: calc(100vh - 64px);
  /* 4면 모두 둥글게 — 정중앙 떠있는 모달 */
  border-radius: 28px;
  /* 솔리드 화이트 — 모달 안 컨텐츠 선명도 보장 (backdrop-filter 제거: 외부 backdrop 만으로 충분) */
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  /* 입체감 있는 그림자 — 떠있는 느낌 */
  box-shadow:
    0 0 0 1px rgba(10, 25, 41, 0.03),
    0 24px 80px rgba(10, 25, 41, 0.32),
    0 8px 24px rgba(10, 25, 41, 0.12);
  overflow: hidden;
  display: flex; flex-direction: column;
  animation: cfsPanelIn .42s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 모바일 — 좌우·상하 여백 최소화 */
@media (max-width: 520px) {
  .cfs-backdrop { padding: 12px; }
  .cfs-panel {
    border-radius: 24px;
    height: calc(100vh - 24px);
  }
}

/* ===== Header ===== */
.cfs-header {
  padding: 18px 22px 16px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 0.5px solid rgba(15, 23, 42, 0.06);
  background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
  flex-shrink: 0;
}
.cfs-header-left { display: flex; align-items: center; gap: 12px; }
.cfs-header-icon-wrap {
  width: 36px; height: 36px; border-radius: 11px;
  background: linear-gradient(135deg, #0a1929 0%, #191970 55%, #3b5c8c 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(10,25,41,0.35), inset 0 0.5px 0 rgba(255,255,255,0.22);
}
.cfs-header-eyebrow {
  font-size: 10.5px; font-weight: 700; color: #191970;
  letter-spacing: 0.08em; text-transform: uppercase;
  margin-bottom: 1px;
}
.cfs-header-title {
  font-size: 18px; font-weight: 700; color: #0f172a;
  letter-spacing: -0.025em;
}
.cfs-close {
  width: 36px; height: 36px; border-radius: 12px;
  background: rgba(15,23,42,0.04); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(15,23,42,0.5);
  transition: background .15s ease;
}
.cfs-close:hover { background: rgba(15,23,42,0.08); color: #0f172a; }

/* ===== Body ===== */
.cfs-body {
  overflow-y: auto; flex: 1;
  padding: 22px;
  background: #fafbfc;  /* 섹션 카드 대비를 위한 옅은 회색 배경 */
}
.cfs-body::-webkit-scrollbar { width: 8px; }
.cfs-body::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.1); border-radius: 4px; }

/* ===== Section ===== */
.cfs-section {
  padding: 18px 18px 18px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  margin-bottom: 14px;
  box-shadow: 0 1px 2px rgba(10,25,41,0.04);
}

.cfs-section-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 4px;
}
.cfs-section-num {
  width: 22px; height: 22px; border-radius: 7px;
  background: linear-gradient(135deg, #191970 0%, #2c4a7a 100%);
  color: #fff;
  font-size: 11px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 3px rgba(25,25,112,0.3);
  flex-shrink: 0;
}
.cfs-section-title {
  font-size: 14px; font-weight: 700; color: #0f172a;
  letter-spacing: -0.02em;
}
.cfs-section-right { margin-left: auto; }
.cfs-section-desc {
  font-size: 12px; color: rgba(15, 23, 42, 0.55);
  line-height: 1.55; margin-top: 4px; padding-left: 30px;
  letter-spacing: -0.005em;
}

/* ===== Sum badge ===== */
.cfs-sum-badge {
  font-size: 11px; font-weight: 700;
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 999px;
}
.cfs-sum-ok {
  background: rgba(34, 197, 94, 0.1); color: #15803d;
  border: 0.5px solid rgba(34, 197, 94, 0.25);
}
.cfs-sum-bad {
  background: rgba(220, 38, 38, 0.08); color: #b91c1c;
  border: 0.5px solid rgba(220, 38, 38, 0.22);
}

/* ===== Balance input ===== */
.cfs-balance-input-wrap {
  display: flex; align-items: center; gap: 8px;
  margin-top: 14px;
}
.cfs-balance-input {
  flex: 1;
  padding: 12px 14px; border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  font-size: 16px; font-weight: 600; color: #0f172a;
  background: #fff; outline: none;
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  transition: border-color .15s, box-shadow .15s;
}
.cfs-balance-input:focus {
  border-color: rgba(25,25,112, 0.45);
  box-shadow: 0 0 0 3px rgba(25,25,112, 0.08);
}
.cfs-balance-unit {
  font-size: 13px; color: rgba(15,23,42,0.5); font-weight: 650;
}
.cfs-balance-preview {
  margin-top: 8px;
  font-size: 12px; color: rgba(15,23,42,0.6);
  font-weight: 600; padding-left: 4px;
}

/* ===== Channel list ===== */
.cfs-channel-list {
  display: grid; gap: 6px; margin-top: 14px;
}
.cfs-channel-row {
  position: relative;
  padding: 12px 14px; border-radius: 12px;
  background: #f8f9fb;
  border: 1px solid rgba(15, 23, 42, 0.06);
  transition: background .15s, border-color .15s;
}
.cfs-channel-active {
  background: #eef3fa;
  border-color: rgba(25,25,112, 0.18);
}
.cfs-channel-checkbox-wrap {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer;
}
.cfs-channel-meta { flex: 1; min-width: 0; }
.cfs-channel-name {
  font-size: 13px; font-weight: 650; color: #0f172a;
  display: flex; align-items: center; gap: 5px;
  letter-spacing: -0.01em;
}
.cfs-channel-detail {
  display: flex; gap: 4px; margin-top: 4px;
}
.cfs-channel-detail-pill {
  font-size: 9.5px; font-weight: 700; padding: 2px 7px;
  border-radius: 999px; background: rgba(15, 23, 42, 0.05);
  color: rgba(15, 23, 42, 0.55);
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
}
.cfs-channel-fee-pill {
  background: rgba(220, 38, 38, 0.06);
  color: #b91c1c;
}
.cfs-info-btn {
  width: 16px; height: 16px; border-radius: 50%;
  border: none; background: rgba(25,25,112,0.08);
  cursor: pointer; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #191970;
  transition: background .15s;
}
.cfs-info-btn:hover { background: rgba(25,25,112,0.18); }
.cfs-channel-ratio-wrap {
  display: flex; align-items: center; gap: 4px; margin-left: 12px;
}
.cfs-ratio-input {
  width: 56px; padding: 5px 8px; border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  font-size: 13px; font-weight: 700; text-align: center;
  background: #fff;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  font-family: inherit;
  outline: none;
  transition: border-color .15s;
}
.cfs-ratio-input:focus { border-color: rgba(25,25,112,0.4); }
.cfs-ratio-pct {
  font-size: 12px; color: rgba(15,23,42,0.5); font-weight: 700;
}
.cfs-channel-checkbox-wrap input[type="checkbox"]::before {
  content: ""; display: block;
}
.cfs-checkbox {
  width: 16px; height: 16px;
  cursor: pointer; accent-color: #191970;
  flex-shrink: 0;
}

/* ===== Tooltip ===== */
.cfs-tooltip {
  position: absolute; left: 14px; right: 14px; bottom: calc(100% + 4px);
  padding: 10px 12px; border-radius: 10px;
  background: rgba(10, 25, 41, 0.95);
  backdrop-filter: blur(8px);
  color: #fff; font-size: 11.5px; line-height: 1.5;
  font-weight: 500; letter-spacing: -0.005em;
  box-shadow: 0 4px 16px rgba(10,25,41,0.3);
  z-index: 5;
  animation: cfsTooltipIn .18s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ===== Warn box ===== */
.cfs-warn-box {
  margin-top: 10px; padding: 10px 12px; border-radius: 10px;
  background: rgba(220, 38, 38, 0.05);
  border: 0.5px solid rgba(220, 38, 38, 0.18);
  font-size: 11.5px; color: #b91c1c; font-weight: 600;
}

/* ===== Total pill ===== */
.cfs-total-pill {
  font-size: 11px; font-weight: 700;
  padding: 4px 10px; border-radius: 999px;
  background: rgba(25,25,112, 0.08);
  color: #191970;
  border: 0.5px solid rgba(25,25,112, 0.18);
  font-variant-numeric: tabular-nums;
}

/* ===== Expense list ===== */
.cfs-expense-list { display: grid; gap: 6px; margin-top: 14px; }
.cfs-expense-row {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-radius: 12px;
  background: #fafbfc;
  border: 0.5px solid rgba(15, 23, 42, 0.06);
}
.cfs-expense-inactive { opacity: 0.45; background: #f4f6f8; }
.cfs-expense-meta { flex: 1; min-width: 0; }
.cfs-expense-label {
  font-size: 13px; font-weight: 650; color: #0f172a;
  letter-spacing: -0.01em;
}
.cfs-expense-detail {
  font-size: 11px; color: rgba(15,23,42,0.55);
  margin-top: 1px; font-weight: 500;
}
.cfs-expense-amount {
  font-size: 13.5px; font-weight: 700; color: #b91c1c;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.cfs-trash-btn {
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(220, 38, 38, 0.06); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #b91c1c;
  transition: background .15s;
  flex-shrink: 0;
}
.cfs-trash-btn:hover { background: rgba(220, 38, 38, 0.14); }

/* ===== Add expense card ===== */
.cfs-add-expense-card {
  margin-top: 14px;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(25,25,112, 0.04), rgba(44, 74, 122, 0.02));
  border: 1px dashed rgba(25,25,112, 0.22);
}
.cfs-add-expense-title {
  font-size: 12px; font-weight: 700; color: #191970;
  letter-spacing: -0.01em;
  margin-bottom: 10px;
}
.cfs-add-expense-grid {
  display: grid; grid-template-columns: 2fr 1fr 0.8fr 1fr; gap: 6px;
  margin-bottom: 10px;
}
.cfs-mini-input {
  padding: 8px 10px; border-radius: 9px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  font-size: 12.5px; font-weight: 500; color: #0f172a;
  background: #fff; outline: none;
  font-family: inherit;
  min-width: 0;
  transition: border-color .15s;
}
.cfs-mini-input:focus { border-color: rgba(25,25,112,0.4); }
.cfs-add-btn {
  width: 100%; padding: 9px; border-radius: 10px;
  border: none;
  background: rgba(15, 23, 42, 0.06);
  color: rgba(15, 23, 42, 0.4);
  font-size: 12.5px; font-weight: 700;
  cursor: not-allowed;
  display: flex; align-items: center; justify-content: center; gap: 5px;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: all .18s cubic-bezier(0.16, 1, 0.3, 1);
}
.cfs-add-btn-active {
  background: linear-gradient(135deg, #191970 0%, #2c4a7a 100%) !important;
  color: #fff !important;
  cursor: pointer !important;
  box-shadow: 0 2px 8px rgba(25,25,112,0.3), inset 0 0.5px 0 rgba(255,255,255,0.18);
}
.cfs-add-btn-active:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25,25,112,0.4); }

/* ===== Permission status banners ===== */
.cfs-perm-warn,
.cfs-perm-ok {
  display: flex; align-items: center; gap: 8px;
  margin-top: 12px; padding: 10px 12px; border-radius: 10px;
  font-size: 11.5px; font-weight: 600;
  letter-spacing: -0.005em; line-height: 1.45;
}
.cfs-perm-warn {
  background: rgba(220, 38, 38, 0.06);
  border: 0.5px solid rgba(220, 38, 38, 0.22);
  color: #b91c1c;
}
.cfs-perm-warn svg { flex-shrink: 0; }
.cfs-perm-ok {
  background: rgba(34, 197, 94, 0.07);
  border: 0.5px solid rgba(34, 197, 94, 0.22);
  color: #15803d;
}
.cfs-perm-ok svg { flex-shrink: 0; }

/* ===== Options list ===== */
.cfs-options-list { display: grid; gap: 8px; margin-top: 14px; }
.cfs-toggle-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 12px;
  background: #fafbfc;
  border: 0.5px solid rgba(15, 23, 42, 0.05);
  cursor: pointer;
  transition: background .15s;
}
.cfs-toggle-row:hover { background: #f4f6f8; }
.cfs-toggle-meta { flex: 1; }
.cfs-toggle-label {
  font-size: 13px; font-weight: 650; color: #0f172a;
  letter-spacing: -0.01em;
}
.cfs-toggle-desc {
  font-size: 11.5px; color: rgba(15,23,42,0.55);
  margin-top: 2px; font-weight: 500;
}

/* Slider row */
.cfs-slider-row {
  padding: 12px 14px; border-radius: 12px;
  background: #fafbfc;
  border: 0.5px solid rgba(15, 23, 42, 0.05);
}
.cfs-slider-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px;
}
.cfs-slider-label {
  font-size: 13px; font-weight: 650; color: #0f172a;
  letter-spacing: -0.01em;
}
.cfs-slider-value {
  font-size: 14px; font-weight: 700; color: #191970;
  font-variant-numeric: tabular-nums;
}
.cfs-slider {
  width: 100%; accent-color: #191970;
  cursor: pointer;
}
.cfs-slider-desc {
  font-size: 11px; color: rgba(15,23,42,0.5);
  margin-top: 4px; font-weight: 500;
}

/* Disclaimer */
.cfs-disclaimer {
  margin-top: 8px; padding: 12px 14px; border-radius: 12px;
  background: rgba(34, 197, 94, 0.04);
  border: 0.5px solid rgba(34, 197, 94, 0.18);
  font-size: 11.5px; color: #15803d;
  line-height: 1.55; font-weight: 500;
  letter-spacing: -0.005em;
}

/* ===== Footer ===== */
.cfs-footer {
  padding: 14px 22px;
  border-top: 0.5px solid rgba(15, 23, 42, 0.06);
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  display: flex; gap: 10px;
  flex-shrink: 0;
}
.cfs-cancel-btn {
  padding: 12px 22px; border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #fff;
  color: rgba(15, 23, 42, 0.6);
  font-size: 14px; font-weight: 650;
  cursor: pointer; font-family: inherit;
  letter-spacing: -0.01em;
  transition: background .15s;
}
.cfs-cancel-btn:hover { background: rgba(15,23,42,0.04); }
.cfs-save-btn {
  flex: 1;
  padding: 12px; border-radius: 12px;
  border: none;
  background: rgba(15, 23, 42, 0.06);
  color: rgba(15, 23, 42, 0.4);
  font-size: 14px; font-weight: 700;
  cursor: not-allowed; font-family: inherit;
  letter-spacing: -0.01em;
  transition: all .18s cubic-bezier(0.16, 1, 0.3, 1);
}
.cfs-save-btn-active {
  background: linear-gradient(135deg, #0a1929 0%, #191970 55%, #3b5c8c 100%) !important;
  color: #fff !important;
  cursor: pointer !important;
  box-shadow: 0 4px 14px rgba(10,25,41,0.35), inset 0 0.5px 0 rgba(255,255,255,0.22);
}
.cfs-save-btn-active:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(10,25,41,0.45); }
.cfs-save-btn-active:active { transform: translateY(0); }

/* ─── 통장 자동 불러오기 배너 ─────────────────────────────────────── */
.cfs-bank-banner {
  display: flex; flex-direction: column; gap: 10px;
  padding: 14px 16px;
  margin: 12px 0 14px;
  background: linear-gradient(135deg, rgba(25,25,112,0.04) 0%, rgba(99,102,241,0.05) 100%);
  border: 1px solid rgba(25,25,112,0.10);
  border-radius: 12px;
}
.cfs-bank-banner-head { display: flex; align-items: center; gap: 10px; }
.cfs-bank-banner-icon {
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(25,25,112,0.10); color: #191970;
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cfs-bank-banner-title {
  font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(25,25,112,0.72);
  display: inline-flex; align-items: center; gap: 6px;
}
.cfs-bank-banner-amount {
  font-size: 18px; font-weight: 750; color: #0f172a; letter-spacing: -0.015em;
  display: inline-flex; align-items: baseline; gap: 8px;
  margin-top: 2px;
}
.cfs-bank-banner-raw {
  font-size: 11.5px; font-weight: 500; color: rgba(15,23,42,0.45);
  letter-spacing: -0.005em;
}
.cfs-bank-stale-pill {
  padding: 1px 7px; border-radius: 999px;
  background: rgba(255,159,10,0.14); color: #b45309;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.02em;
}
.cfs-bank-refresh {
  width: 28px; height: 28px; border-radius: 8px;
  border: 1px solid rgba(25,25,112,0.15);
  background: #ffffff; color: #191970;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  transition: background .15s, transform .12s;
}
.cfs-bank-refresh:hover:not(:disabled) { background: rgba(25,25,112,0.06); transform: rotate(60deg); }
.cfs-bank-refresh:disabled { opacity: 0.5; cursor: wait; }
.cfs-spin { animation: cfsSpin 1s linear infinite; }
@keyframes cfsSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.cfs-bank-accounts {
  list-style: none; margin: 0; padding: 6px 8px;
  background: rgba(255,255,255,0.55);
  border-radius: 8px;
  display: flex; flex-direction: column; gap: 4px;
}
.cfs-bank-accounts li {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11.5px; color: rgba(15,23,42,0.62);
}
.cfs-bank-acc-label { display: inline-flex; align-items: center; gap: 6px; }
.cfs-bank-primary-pill {
  padding: 0 6px; border-radius: 999px;
  background: rgba(25,25,112,0.10); color: #191970;
  font-size: 9px; font-weight: 700; letter-spacing: 0.04em;
}
.cfs-bank-acc-amount { font-weight: 650; color: #0f172a; }
.cfs-bank-asof {
  font-size: 10.5px; color: rgba(15,23,42,0.4); letter-spacing: -0.005em;
}
.cfs-bank-actions {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.cfs-bank-apply-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 12px; border-radius: 8px; border: none;
  background: #191970; color: #fff;
  font-size: 11.5px; font-weight: 650; letter-spacing: -0.005em;
  cursor: pointer; font-family: inherit;
  transition: background .15s, transform .12s;
}
.cfs-bank-apply-btn:hover:not(:disabled) { background: #14145a; transform: translateY(-1px); }
.cfs-bank-apply-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.cfs-bank-hint { font-size: 10.5px; color: rgba(15,23,42,0.45); }

/* 미연동 안내 (small inline) */
.cfs-bank-empty {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 12px; margin: 8px 0 10px;
  background: rgba(15,23,42,0.03);
  border: 1px dashed rgba(15,23,42,0.10);
  border-radius: 8px;
  font-size: 11.5px; color: rgba(15,23,42,0.55);
  letter-spacing: -0.005em;
}

/* ─── 업종 추천 적용 버튼 ──────────────────────────────────────── */
.cfs-industry-suggest-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px; margin: 4px 0 12px;
  border-radius: 999px; border: 1px solid rgba(99,102,241,0.18);
  background: rgba(99,102,241,0.06); color: #4f46e5;
  font-size: 11.5px; font-weight: 650; letter-spacing: -0.005em;
  cursor: pointer; font-family: inherit;
  transition: background .15s, transform .12s;
}
.cfs-industry-suggest-btn:hover { background: rgba(99,102,241,0.12); transform: translateY(-1px); }

/* ─── 현금흐름 모델 점검 (audit) 패널 ──────────────────────────── */
.cfs-audit-section { margin-top: 8px; }
.cfs-audit-toggle {
  width: 100%;
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 14px;
  border-radius: 10px; border: 1px solid rgba(15,23,42,0.08);
  background: rgba(15,23,42,0.02);
  font-size: 12.5px; font-weight: 650; color: rgba(15,23,42,0.72);
  letter-spacing: -0.005em; font-family: inherit;
  cursor: pointer;
  transition: background .15s;
}
.cfs-audit-toggle:hover { background: rgba(15,23,42,0.04); }
.cfs-audit-body {
  margin-top: 10px;
  display: flex; flex-direction: column; gap: 14px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid rgba(15,23,42,0.06);
}
.cfs-audit-block .cfs-audit-h {
  font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(15,23,42,0.55);
  margin-bottom: 6px;
}
.cfs-audit-block ul {
  margin: 0; padding-left: 16px;
  display: flex; flex-direction: column; gap: 5px;
}
.cfs-audit-block li {
  font-size: 12px; line-height: 1.55; color: rgba(15,23,42,0.72);
  letter-spacing: -0.005em;
}
.cfs-audit-block li b { color: #0f172a; font-weight: 650; }
.cfs-audit-gaps li { color: rgba(15,23,42,0.62); }
`;
