"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  getFranchiseBrandById,
  getFranchiseSupplyInfo,
  getSupplyTypeColor,
  getSupplyTypeLabel,
  type SupplyType,
} from "@build-up/shared";
import { Search, Building2, Info, AlertCircle } from "lucide-react";

const MIDNIGHT = "#191970"; // CSS MidnightBlue — 서비스 메인 포인트 컬러 (PermitCheck/ContractReview 와 통일)

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
  const counts = {
    "hq-exclusive": grouped["hq-exclusive"].length,
    "hq-designated": grouped["hq-designated"].length,
    "free-purchase": grouped["free-purchase"].length,
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
      <div style={{ padding: "18px 22px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${MIDNIGHT}, rgba(25,25,112,0.7))`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700, boxShadow: "0 2px 6px rgba(25,25,112,0.25)" }}>
            {fb.name.ko.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em" }}>
              {ko ? `${fb.name.ko} 공급 구조` : `${fb.name.en} Supply Structure`}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              {ko ? "본사 공급 vs 자유 구매 항목 안내" : "HQ supply vs free purchase guide"}
            </div>
          </div>
        </div>

        {/* ── 카운트 배지 (한눈에 본사 의존도 파악) ── */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          {(["hq-exclusive", "hq-designated", "free-purchase"] as SupplyType[]).map((type) => {
            const c = counts[type];
            if (c === 0) return null;
            const color = getSupplyTypeColor(type);
            return (
              <span key={type} style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 9px",
                borderRadius: "999px",
                background: `${color}10`,
                color,
                letterSpacing: "-0.01em",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: 3, background: color, display: "inline-block" }} />
                {getSupplyTypeLabel(type, language)} {c}
              </span>
            );
          })}
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
              <div key={idx} style={{ padding: "10px 12px", borderRadius: "12px", background: `${color}06`, border: `1px solid ${color}15`, marginBottom: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px", letterSpacing: "-0.01em" }}>{item.category[language]}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.55 }}>
                  {item.items.map(i => i[language]).join(" · ")}
                </div>
                {item.note && (
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "5px",
                    fontSize: "11.5px",
                    color,
                    marginTop: "6px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: `${color}08`,
                    lineHeight: 1.5,
                  }}>
                    <Info size={12} strokeWidth={2} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{item.note[language]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {/* ── 정보공개서·출처 안내 (정확성 보장) ── */}
      <div style={{ padding: "12px 22px 16px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "10px" }}>
          <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: "2px", color: "rgba(0,0,0,0.5)" }} />
          <div>
            {ko ? (
              <>
                <strong style={{ color: "rgba(0,0,0,0.7)" }}>본 데이터는 가이드용입니다.</strong> 실제 필수품목·권장품목·공급가는 본사 정보공개서에 따라 다를 수 있습니다. 계약 전 반드시 정보공개서를 직접 확인하세요. <strong style={{ color: "#dc2626" }}>브랜드 로고가 인쇄된 일회용품·포장재는 거의 모두 본사 공급</strong>이며 외부 매입이 금지됩니다.
              </>
            ) : (
              <>
                <strong style={{ color: "rgba(0,0,0,0.7)" }}>This is a guide only.</strong> Actual mandatory/recommended items and supply prices follow the official franchise disclosure. Verify the disclosure before signing. <strong style={{ color: "#dc2626" }}>Branded disposables and packaging are almost always HQ-supplied</strong> with external purchase prohibited.
              </>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginTop: "6px" }}>
          <a
            href="https://franchise.ftc.go.kr/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              padding: "6px 12px 6px 10px",
              borderRadius: "999px",
              background: MIDNIGHT,
              color: "#ffffff",
              textDecoration: "none",
              letterSpacing: "-0.01em",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 1px 3px rgba(25,25,112,0.25)",
            }}
          >
            <Search size={12} strokeWidth={2.4} />
            {ko ? "공정위 정보공개서 조회" : "FTC Franchise Disclosure"}
          </a>
          {fb.franchiseUrl && (
            <a
              href={fb.franchiseUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                padding: "6px 12px 6px 10px",
                borderRadius: "999px",
                background: "rgba(25,25,112,0.08)",
                color: MIDNIGHT,
                textDecoration: "none",
                letterSpacing: "-0.01em",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                border: "1px solid rgba(25,25,112,0.18)",
              }}
            >
              <Building2 size={12} strokeWidth={2.2} />
              {ko ? `${fb.name.ko} 공식 가맹` : `${fb.name.en} Official`}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
