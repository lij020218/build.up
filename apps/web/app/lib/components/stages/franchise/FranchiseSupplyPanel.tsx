"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  getFranchiseBrandById,
  getFranchiseSupplyInfo,
  getSupplyTypeColor,
  getSupplyTypeLabel,
  type SupplyType,
} from "@build-up/shared";

export function FranchiseSupplyPanel() {
  const d = useDashboardCtx();
  const { language, selectedFranchiseBrandId } = d;

  if (!selectedFranchiseBrandId) return null;
  const fb = getFranchiseBrandById(selectedFranchiseBrandId);
  if (!fb) return null;
  const ko = language === "ko";
  const supplyItems = getFranchiseSupplyInfo(fb);
  const grouped: Record<SupplyType, typeof supplyItems> = {
    "hq-exclusive": supplyItems.filter(s => s.type === "hq-exclusive"),
    "hq-designated": supplyItems.filter(s => s.type === "hq-designated"),
    "free-purchase": supplyItems.filter(s => s.type === "free-purchase")
  };

  return (
    <div style={{
      marginBottom: "18px",
      borderRadius: "24px",
      border: "1px solid rgba(255,255,255,0.78)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
      boxShadow: "0 8px 20px rgba(17,17,17,0.03)",
      overflow: "hidden"
    }}>
      <div style={{ padding: "18px 22px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, var(--primary), rgba(117,163,255,0.9))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700 }}>
            {fb.name.ko.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em" }}>
              {ko ? `${fb.name.ko} 공급 구조` : `${fb.name.en} Supply Structure`}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              {ko ? "본사 공급 vs 자유 구매 항목 안내" : "HQ supply vs free purchase guide"}
            </div>
          </div>
        </div>
      </div>

      {(["hq-exclusive", "hq-designated", "free-purchase"] as SupplyType[]).map((type) => {
        const group = grouped[type];
        if (group.length === 0) return null;
        const color = getSupplyTypeColor(type);
        return (
          <div key={type} style={{ padding: "0 22px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color }}>{getSupplyTypeLabel(type, language)}</span>
            </div>
            {group.map((item, idx) => (
              <div key={idx} style={{ padding: "8px 12px", borderRadius: "12px", background: `${color}06`, border: `1px solid ${color}15`, marginBottom: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "3px" }}>{item.category[language]}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                  {item.items.map(i => i[language]).join(" · ")}
                </div>
                {item.note && <div style={{ fontSize: "11px", color, marginTop: "3px" }}>{item.note[language]}</div>}
              </div>
            ))}
          </div>
        );
      })}

      <div style={{ padding: "10px 22px 16px", fontSize: "12px", color: "var(--muted)", borderTop: "1px solid var(--border)" }}>
        {ko
          ? "※ 자유 구매 항목만 아래 공급업체 가이드에서 직접 선택할 수 있습니다."
          : "※ Only free-purchase items can be selected from the supplier guide below."}
      </div>
    </div>
  );
}
