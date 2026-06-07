"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";

export function DeliveryPlatformCard() {
  const d = useDashboardCtx();
  const {
    language,
    businessCtx,
    deliveryPlatforms,
    monthlyDeliverySales,
    saveDeliveryPlatforms,
    saveMonthlyDeliverySales,
    handleDlvSave,
    handleDlvDelete,
    openDlvEdit,
    dlvFormOpen, setDlvFormOpen,
    dlvEditId, setDlvEditId,
    dlvName, setDlvName,
    dlvRate, setDlvRate,
    dlvAd, setDlvAd,
  } = d;

  if (!businessCtx.isDeliveryRelevant && !businessCtx.isOnlineStore) return null;

  const ko = language === "ko";
  const fmt = (n: number) => n >= 10000
    ? `${Math.round(n / 10000).toLocaleString()}만원`
    : `${Math.round(n).toLocaleString()}원`;

  const platformData = deliveryPlatforms.map(p => {
    const gross = (monthlyDeliverySales[p.id] ?? 0) * 10000;
    const commission = Math.round(gross * (p.commissionRate / 100));
    const adCost = p.adCostMonthly * 10000;
    const net = gross - commission - adCost;
    const realRate = gross > 0 ? ((gross - net) / gross) * 100 : 0;
    return { ...p, gross, commission, adCost, net, realRate };
  });
  const totalGross = platformData.reduce((s, p) => s + p.gross, 0);
  const totalNet = platformData.reduce((s, p) => s + p.net, 0);
  const avgLoss = totalGross > 0 ? ((totalGross - totalNet) / totalGross) * 100 : 0;

  const PLATFORM_PRESETS = businessCtx.isDeliveryRelevant
    ? [
        { name: ko ? "배달의민족" : "Baemin", commissionRate: 6.8, adCostMonthly: 8 },
        { name: ko ? "쿠팡이츠" : "Coupang Eats", commissionRate: 6.8, adCostMonthly: 0 },
        { name: ko ? "요기요" : "Yogiyo", commissionRate: 6.8, adCostMonthly: 5 },
        { name: ko ? "땡겨요" : "Ddangyo", commissionRate: 2.0, adCostMonthly: 0 },
      ]
    : [
        { name: ko ? "CJ대한통운" : "CJ Logistics", commissionRate: 0, adCostMonthly: 0 },
        { name: ko ? "한진택배" : "Hanjin", commissionRate: 0, adCostMonthly: 0 },
        { name: ko ? "롯데택배" : "Lotte", commissionRate: 0, adCostMonthly: 0 },
        { name: ko ? "우체국택배" : "Korea Post", commissionRate: 0, adCostMonthly: 0 },
      ];

  return (
    <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
      {/* 헤더 */}
      <div style={{ padding: "18px 22px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
            {businessCtx.isDeliveryRelevant
              ? (ko ? "배달 플랫폼 수수료 분석" : "Delivery Platform Fees")
              : (ko ? "배송 비용 분석" : "Shipping Cost Analysis")}
          </div>
          {platformData.length > 0 && totalGross > 0 && (
            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>
              {ko ? `실제 수수료 평균 ${avgLoss.toFixed(1)}% — 매출의 ${avgLoss.toFixed(1)}%가 플랫폼에 지급됨` : `Avg. ${avgLoss.toFixed(1)}% of revenue goes to platforms`}
            </div>
          )}
        </div>
        <button type="button"
          onClick={() => { setDlvFormOpen(true); setDlvEditId(null); setDlvName(""); setDlvRate(""); setDlvAd(""); }}
          style={{ fontSize: "13px", fontWeight: 600, color: "#007aff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
          {ko ? "+ 플랫폼 추가" : "+ Add platform"}
        </button>
      </div>

      {/* 요약 3-col (데이터 있을 때) */}
      {totalGross > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "0.5px solid rgba(0,0,0,0.08)", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
          {[
            { label: ko ? "배달 총 매출" : "Gross", value: fmt(totalGross), color: "inherit" },
            { label: ko ? "수수료+광고비" : "Fees+Ads", value: fmt(totalGross - totalNet), color: "#b64c4c" },
            { label: ko ? "실 순매출" : "Net revenue", value: fmt(totalNet), color: totalNet > 0 ? "#1d3557" : "#b64c4c" },
          ].map((col, idx) => (
            <div key={col.label} style={{ padding: "14px 12px", borderLeft: idx > 0 ? "0.5px solid rgba(0,0,0,0.08)" : "none" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "6px" }}>{col.label}</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: col.color, letterSpacing: "-0.4px" }}>{col.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 플랫폼 없을 때 */}
      {deliveryPlatforms.length === 0 ? (
        <div style={{ padding: "16px 22px 20px" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "12px" }}>
            {ko ? "배달 플랫폼별 수수료와 광고비를 입력하면 실제 남는 순매출을 계산합니다." : "Enter commission rates and ad costs per platform to see actual net revenue."}
          </div>
          {/* 프리셋 빠른 추가 */}
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>
            {ko ? "빠른 추가" : "Quick add"}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
            {PLATFORM_PRESETS.map(preset => (
              <button key={preset.name} type="button"
                onClick={() => {
                  const entry = { id: `dlv-${Date.now()}-${preset.name}`, ...preset };
                  saveDeliveryPlatforms([...deliveryPlatforms, entry]);
                }}
                style={{ fontSize: "12px", fontWeight: 600, padding: "7px 14px", borderRadius: "20px", border: "1px solid rgba(0,0,0,0.12)", background: "transparent", color: "var(--primary)", cursor: "pointer" }}>
                + {preset.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {platformData.map((p, idx) => (
            <div key={p.id} style={{ padding: "14px 22px", borderBottom: idx < platformData.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none" }}>
              {/* 플랫폼 이름 + 수수료 설정 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "var(--primary)", textAlign: "center" as const, lineHeight: 1.2 }}>
                    {p.name.slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--primary)" }}>{p.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                      {ko ? `수수료 ${p.commissionRate}% · 광고비 ${p.adCostMonthly}만원/월` : `${p.commissionRate}% commission · ₩${p.adCostMonthly}만 ads/mo`}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" onClick={() => openDlvEdit(p)} style={{ fontSize: "12px", color: "#007aff", background: "none", border: "none", cursor: "pointer" }}>{ko ? "수정" : "Edit"}</button>
                  <button type="button" onClick={() => handleDlvDelete(p.id)} style={{ fontSize: "12px", color: "#b64c4c", background: "none", border: "none", cursor: "pointer" }}>{ko ? "삭제" : "Del"}</button>
                </div>
              </div>
              {/* 이번 달 매출 입력 + 결과 */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" as const }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: "160px" }}>
                  <span style={{ fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap" as const }}>{ko ? "이달 매출" : "Month sales"}</span>
                  <input
                    type="text" inputMode="numeric"
                    placeholder="0"
                    aria-label={ko ? `${p.name} 이달 매출 (만원)` : `${p.name} monthly sales (10K KRW)`}
                    value={monthlyDeliverySales[p.id] ? String(monthlyDeliverySales[p.id]) : ""}
                    onChange={e => {
                      const v = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                      saveMonthlyDeliverySales({ ...monthlyDeliverySales, [p.id]: v });
                    }}
                    style={{ width: "80px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "8px", padding: "6px 10px", fontSize: "14px", outline: "none", textAlign: "right" as const }}
                  />
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "만원" : "만원"}</span>
                </div>
                {p.gross > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                    {[
                      { label: ko ? "수수료+광고" : "Fees", value: fmt(p.commission + p.adCost), color: "#b64c4c" },
                      { label: ko ? "실순매출" : "Net", value: fmt(p.net), color: p.net > 0 ? "#1d3557" : "#b64c4c" },
                      { label: ko ? "실질수수료율" : "Real rate", value: `${p.realRate.toFixed(1)}%`, color: p.realRate > 25 ? "#b64c4c" : p.realRate > 15 ? "#191970" : "var(--muted)" },
                    ].map(item => (
                      <div key={item.label} style={{ background: "rgba(0,0,0,0.03)", borderRadius: "8px", padding: "4px 10px" }}>
                        <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" as const }}>{item.label}</div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* 프리셋 빠른 추가 (기존 있을 때) */}
          {PLATFORM_PRESETS.filter(pr => !deliveryPlatforms.some(p => p.name === pr.name)).length > 0 && (
            <div style={{ padding: "10px 22px 14px", borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                {PLATFORM_PRESETS.filter(pr => !deliveryPlatforms.some(p => p.name === pr.name)).map(preset => (
                  <button key={preset.name} type="button"
                    onClick={() => {
                      const entry = { id: `dlv-${Date.now()}-${preset.name}`, ...preset };
                      saveDeliveryPlatforms([...deliveryPlatforms, entry]);
                    }}
                    style={{ fontSize: "11px", fontWeight: 600, padding: "5px 12px", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.10)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 플랫폼 추가/수정 폼 */}
      {dlvFormOpen && (
        <div style={{ padding: "18px 22px", borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "rgba(0,122,255,0.03)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#007aff", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
            {dlvEditId ? (ko ? "플랫폼 수정" : "Edit Platform") : (ko ? "플랫폼 추가" : "Add Platform")}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
            <input type="text" placeholder={ko ? "플랫폼명 (예: 배달의민족)" : "Platform name"} value={dlvName} onChange={e => setDlvName(e.target.value)}
              aria-label={ko ? "플랫폼명" : "Platform name"}
              style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "중개 수수료 (%)" : "Commission (%)"}</div>
                <input type="text" inputMode="decimal" placeholder="6.8" value={dlvRate} onChange={e => setDlvRate(e.target.value.replace(/[^0-9.]/g, ""))}
                  aria-label={ko ? "중개 수수료 (%)" : "Commission rate (%)"}
                  style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "5px" }}>{ko ? "월 광고비 (만원)" : "Monthly ads (만원)"}</div>
                <input type="text" inputMode="numeric" placeholder="0" value={dlvAd} onChange={e => setDlvAd(e.target.value.replace(/[^0-9]/g, ""))}
                  aria-label={ko ? "월 광고비 (만원)" : "Monthly ad spend (10K KRW)"}
                  style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "15px", outline: "none" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={handleDlvSave}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#007aff", color: "#fff", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                {dlvEditId ? (ko ? "수정 완료" : "Save") : (ko ? "추가" : "Add")}
              </button>
              <button type="button" onClick={() => { setDlvFormOpen(false); setDlvEditId(null); }}
                style={{ padding: "12px 20px", borderRadius: "12px", background: "rgba(0,0,0,0.06)", color: "var(--primary)", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                {ko ? "취소" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
