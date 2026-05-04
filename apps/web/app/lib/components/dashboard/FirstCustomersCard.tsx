"use client";

import { useMemo, useState } from "react";
import { useMarketingStore, type PromoCode } from "../../stores/marketing-store";
import { getPlaybook } from "../../services/first-customers-playbook";

type Props = {
  ko: boolean;
  industryCategoryId: string;
  businessLaunched: boolean;
  businessLaunchedDate: string | null;
};

/**
 * 첫 100명 고객 확보 플레이북 카드.
 * - 업종별 3단계 (pre-open, launch, grow) 전술
 * - 체크리스트 + 진행률
 * - 쿠폰/초대코드 관리 (발급, 사용 추적, 활성/비활성)
 */
export function FirstCustomersCard({ ko, industryCategoryId, businessLaunched, businessLaunchedDate }: Props) {
  const playbook = useMemo(() => getPlaybook(industryCategoryId), [industryCategoryId]);
  const {
    playbookChecklist, togglePlaybookTactic,
    promoCodes, addPromoCode, removePromoCode, togglePromoActive, incrementPromoUsage,
    currentCustomerCount, setCurrentCustomerCount,
  } = useMarketingStore();

  const [activeTab, setActiveTab] = useState<"playbook" | "codes">("playbook");
  const [newCode, setNewCode] = useState({
    code: "",
    kind: "coupon" as "coupon" | "invite",
    discountType: "percent" as "percent" | "amount" | "free",
    discountValue: 10,
    description: "",
    usageLimit: 100,
  });

  // 체크리스트 진행률
  const checklistMap = useMemo(() => {
    const m = new Map<string, boolean>();
    playbookChecklist.forEach((x) => m.set(x.id, x.done));
    return m;
  }, [playbookChecklist]);

  const allTactics = playbook.phases.flatMap((p) => p.tactics);
  const completedCount = allTactics.filter((t) => checklistMap.get(t.id)).length;
  const totalCount = allTactics.length;
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;

  // 목표 대비 현재 고객 수 진행률
  const customerProgress = Math.min(currentCustomerCount / 100, 1);

  // D+N 일차 계산
  const daysSinceLaunch = businessLaunchedDate
    ? Math.max(0, Math.floor((Date.now() - new Date(businessLaunchedDate).getTime()) / 86400000))
    : -1;

  // 현재 단계 (고객 수 기반)
  const currentPhase = playbook.phases.find(
    (p) => currentCustomerCount >= p.customerRange.from && currentCustomerCount <= p.customerRange.to
  ) ?? playbook.phases[0];

  const handleAddCode = () => {
    if (!newCode.code.trim()) return;
    const code: PromoCode = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      code: newCode.code.trim().toUpperCase(),
      kind: newCode.kind,
      discountType: newCode.discountType,
      discountValue: newCode.discountValue,
      description: newCode.description,
      usageLimit: newCode.usageLimit,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    addPromoCode(code);
    setNewCode({ ...newCode, code: "", description: "" });
  };

  const formatDiscount = (c: PromoCode) => {
    if (c.discountType === "free") return ko ? "무료" : "Free";
    if (c.discountType === "percent") return `${c.discountValue}%`;
    return `${c.discountValue.toLocaleString()}원`;
  };

  return (
    <section style={card} className="bento-card" data-first-customers-card>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={eyebrow}>{ko ? "첫 고객 확보" : "First Customers"}</div>
          <div style={title}>{ko ? "100명까지의 여정" : "Path to 100 Customers"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", fontWeight: 650 }}>
            {ko ? "목표 일수" : "Target days"}
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#191970" }}>
            {playbook.targetDays}{ko ? "일" : "d"}
            {daysSinceLaunch >= 0 && (
              <span style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", marginLeft: "6px", fontWeight: 500 }}>
                / D+{daysSinceLaunch}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 고객 수 입력 + 진행률 */}
      <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(25,25,112,0.03)", border: "1px solid rgba(25,25,112,0.06)", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(15,23,42,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {ko ? "지금까지 확보한 고객" : "Customers so far"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setCurrentCustomerCount(Math.max(0, currentCustomerCount - 1))}
              style={stepBtn}
            >
              −
            </button>
            <input
              type="number"
              min="0"
              max="10000"
              value={currentCustomerCount}
              onChange={(e) => setCurrentCustomerCount(parseInt(e.target.value) || 0)}
              style={{ width: "64px", padding: "4px 8px", border: "1px solid rgba(15,23,42,0.1)", borderRadius: "8px", fontSize: "14px", fontWeight: 700, textAlign: "center" }}
            />
            <button
              type="button"
              onClick={() => setCurrentCustomerCount(currentCustomerCount + 1)}
              style={stepBtn}
            >
              +
            </button>
          </div>
        </div>
        <div style={{ height: "8px", background: "rgba(25,25,112,0.05)", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${customerProgress * 100}%`,
            background: customerProgress >= 1 ? "linear-gradient(90deg, #059669, #10b981)" : "linear-gradient(90deg, #191970, #457b9d)",
            transition: "width 0.4s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "11px", color: "rgba(15,23,42,0.5)" }}>
          <span>{currentCustomerCount} / 100 {ko ? "명" : "customers"}</span>
          <span style={{ color: "#191970", fontWeight: 650 }}>
            {ko ? "현재 단계:" : "Current phase:"} {currentPhase.name[ko ? "ko" : "en"]}
          </span>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "12px", padding: "3px", background: "rgba(25,25,112,0.04)", borderRadius: "10px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("playbook")}
          style={{
            ...tabBtn,
            ...(activeTab === "playbook" ? tabBtnActive : {}),
          }}
        >
          {ko ? `플레이북 ${completedCount}/${totalCount}` : `Playbook ${completedCount}/${totalCount}`}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("codes")}
          style={{
            ...tabBtn,
            ...(activeTab === "codes" ? tabBtnActive : {}),
          }}
        >
          {ko ? `쿠폰·초대 ${promoCodes.filter((c) => c.isActive).length}` : `Codes ${promoCodes.filter((c) => c.isActive).length}`}
        </button>
      </div>

      {activeTab === "playbook" && (
        <div>
          {/* 전체 진행률 바 */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(15,23,42,0.5)", marginBottom: "4px", fontWeight: 650 }}>
              <span>{ko ? "전체 진행률" : "Overall progress"}</span>
              <span>{Math.round(progressRatio * 100)}%</span>
            </div>
            <div style={{ height: "6px", background: "rgba(25,25,112,0.05)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressRatio * 100}%`, background: "#191970", transition: "width 0.4s ease" }} />
            </div>
          </div>

          {/* 단계별 전술 */}
          {playbook.phases.map((phase) => {
            const phaseTacticIds = phase.tactics.map((t) => t.id);
            const phaseDone = phaseTacticIds.filter((id) => checklistMap.get(id)).length;
            const isActive = phase.id === currentPhase.id;

            return (
              <div key={phase.id} style={{ marginBottom: "12px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: isActive ? "rgba(25,25,112,0.08)" : "rgba(25,25,112,0.025)",
                  border: `1px solid ${isActive ? "rgba(25,25,112,0.15)" : "rgba(25,25,112,0.04)"}`,
                }}>
                  <div style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 7px",
                    borderRadius: "6px",
                    background: isActive ? "#191970" : "rgba(15,23,42,0.1)",
                    color: isActive ? "#fff" : "rgba(15,23,42,0.6)",
                  }}>
                    {phase.customerRange.from}-{phase.customerRange.to}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 660, color: "#0f172a" }}>
                      {phase.name[ko ? "ko" : "en"]}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", marginTop: "1px" }}>
                      {phase.description[ko ? "ko" : "en"]}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: isActive ? "#191970" : "rgba(15,23,42,0.5)" }}>
                    {phaseDone}/{phaseTacticIds.length}
                  </div>
                </div>

                <div style={{ display: "grid", gap: "4px" }}>
                  {phase.tactics.map((tac) => {
                    const done = checklistMap.get(tac.id) ?? false;
                    return (
                      <label
                        key={tac.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          background: done ? "rgba(5,150,105,0.04)" : "rgba(255,255,255,0.6)",
                          border: `1px solid ${done ? "rgba(5,150,105,0.1)" : "rgba(25,25,112,0.04)"}`,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => togglePlaybookTactic(tac.id)}
                          style={{ marginTop: "2px", cursor: "pointer", accentColor: "#059669" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: "13px",
                            fontWeight: 620,
                            color: done ? "rgba(15,23,42,0.5)" : "#0f172a",
                            textDecoration: done ? "line-through" : "none",
                          }}>
                            {tac.title[ko ? "ko" : "en"]}
                            {tac.targetCount && (
                              <span style={{ fontSize: "11px", color: "#191970", marginLeft: "6px", fontWeight: 600 }}>
                                · +{tac.targetCount}{ko ? "명" : ""}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.55)", marginTop: "2px", lineHeight: 1.5 }}>
                            {tac.description[ko ? "ko" : "en"]}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "codes" && (
        <div>
          {/* 쿠폰 발급 폼 */}
          <div style={{ padding: "12px", borderRadius: "12px", background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.08)", marginBottom: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 660, color: "#191970", marginBottom: "8px" }}>
              {ko ? "새 코드 발급" : "Issue new code"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
              <input
                type="text"
                placeholder={ko ? "코드 (예: OPEN30)" : "Code (e.g., OPEN30)"}
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                style={fieldInput}
              />
              <select
                value={newCode.kind}
                onChange={(e) => setNewCode({ ...newCode, kind: e.target.value as "coupon" | "invite" })}
                style={fieldInput}
              >
                <option value="coupon">{ko ? "쿠폰" : "Coupon"}</option>
                <option value="invite">{ko ? "초대" : "Invite"}</option>
              </select>
              <select
                value={newCode.discountType}
                onChange={(e) => setNewCode({ ...newCode, discountType: e.target.value as "percent" | "amount" | "free" })}
                style={fieldInput}
              >
                <option value="percent">{ko ? "% 할인" : "% off"}</option>
                <option value="amount">{ko ? "원 할인" : "Amount off"}</option>
                <option value="free">{ko ? "무료" : "Free"}</option>
              </select>
              <input
                type="number"
                placeholder={ko ? "값" : "Value"}
                min="0"
                value={newCode.discountValue}
                onChange={(e) => setNewCode({ ...newCode, discountValue: parseInt(e.target.value) || 0 })}
                disabled={newCode.discountType === "free"}
                style={fieldInput}
              />
            </div>
            <input
              type="text"
              placeholder={ko ? "설명 (예: 오픈 기념 할인)" : "Description"}
              value={newCode.description}
              onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
              style={{ ...fieldInput, width: "100%", marginBottom: "6px" }}
            />
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="number"
                placeholder={ko ? "사용 한도 (0=무제한)" : "Limit (0=unlimited)"}
                min="0"
                value={newCode.usageLimit}
                onChange={(e) => setNewCode({ ...newCode, usageLimit: parseInt(e.target.value) || 0 })}
                style={{ ...fieldInput, flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddCode}
                disabled={!newCode.code.trim()}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: newCode.code.trim() ? "#191970" : "rgba(15,23,42,0.1)",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 650,
                  cursor: newCode.code.trim() ? "pointer" : "not-allowed",
                }}
              >
                {ko ? "발급" : "Issue"}
              </button>
            </div>
          </div>

          {/* 코드 리스트 */}
          {promoCodes.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", fontSize: "12px", color: "rgba(15,23,42,0.5)" }}>
              {ko ? "아직 발급한 쿠폰/초대코드가 없습니다." : "No codes issued yet."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: "6px" }}>
              {promoCodes.map((code) => (
                <div
                  key={code.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: code.isActive ? "rgba(255,255,255,0.7)" : "rgba(25,25,112,0.035)",
                    border: `1px solid ${code.isActive ? "rgba(25,25,112,0.05)" : "rgba(25,25,112,0.035)"}`,
                    opacity: code.isActive ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <code style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: code.kind === "invite" ? "#059669" : "#191970",
                        background: code.kind === "invite" ? "rgba(5,150,105,0.08)" : "rgba(25,25,112,0.08)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        letterSpacing: "0.04em",
                      }}>
                        {code.code}
                      </code>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: code.kind === "invite" ? "#059669" : "#191970",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}>
                        {code.kind === "invite" ? (ko ? "초대" : "Invite") : (ko ? "쿠폰" : "Coupon")}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 650, color: "#0f172a" }}>
                        {formatDiscount(code)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => incrementPromoUsage(code.id)}
                        title={ko ? "사용 카운트 +1" : "Increment usage"}
                        style={miniBtn}
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePromoActive(code.id)}
                        title={code.isActive ? (ko ? "비활성화" : "Deactivate") : (ko ? "활성화" : "Activate")}
                        style={miniBtn}
                      >
                        {code.isActive ? "⏸" : "▶"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removePromoCode(code.id)}
                        title={ko ? "삭제" : "Delete"}
                        style={{ ...miniBtn, color: "#dc2626" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {code.description && (
                    <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.55)", marginBottom: "4px" }}>
                      {code.description}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "rgba(15,23,42,0.5)" }}>
                    <span style={{ fontWeight: 650 }}>
                      {code.usageCount}{code.usageLimit > 0 ? ` / ${code.usageLimit}` : ""} {ko ? "사용" : "used"}
                    </span>
                    {code.usageLimit > 0 && (
                      <div style={{ flex: 1, height: "3px", background: "rgba(25,25,112,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min(100, (code.usageCount / code.usageLimit) * 100)}%`,
                          background: "#191970",
                        }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ─── Styles ─── */

const card: React.CSSProperties = {
  borderRadius: "24px",
  padding: "22px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.988), rgba(243,246,251,0.91))",
  border: "1px solid rgba(15, 23, 42, 0.048)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.84) inset, 0 18px 42px rgba(15, 23, 42, 0.038)",
};

const eyebrow: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 650,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.4)",
  marginBottom: "2px",
};

const title: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#0f172a",
  lineHeight: 1.1,
};

const tabBtn: React.CSSProperties = {
  flex: 1,
  padding: "8px",
  fontSize: "12px",
  fontWeight: 620,
  color: "rgba(15,23,42,0.55)",
  background: "transparent",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.15s",
};

const tabBtnActive: React.CSSProperties = {
  background: "#fff",
  color: "#0f172a",
  boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
};

const stepBtn: React.CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  border: "1px solid rgba(15,23,42,0.1)",
  background: "#fff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 700,
  color: "#191970",
};

const fieldInput: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(15,23,42,0.1)",
  fontSize: "12px",
  background: "#fff",
  fontFamily: "inherit",
};

const miniBtn: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "6px",
  border: "1px solid rgba(15,23,42,0.08)",
  background: "rgba(255,255,255,0.8)",
  fontSize: "11px",
  fontWeight: 650,
  cursor: "pointer",
  color: "rgba(15,23,42,0.6)",
  minWidth: "28px",
};
