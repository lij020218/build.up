"use client";

import { useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { supabase } from "../../../../../lib/supabase";
import { getPermitsForCategory, getTotalPermitCost } from "@build-up/shared";

export function PermitCheckPanels() {
  const d = useDashboardCtx();
  const {
    language,
    industryCategoryId,
    livePermitInsights,
    setLivePermitInsights,
  } = d;

  const [expandedPermitId, setExpandedPermitId] = useState<string | null>(null);

  const ko = language === "ko";

  // ── Panel 1: Live competition/survival data ──

  const loadPermitInsights = async () => {
    if (livePermitInsights && !livePermitInsights.loading) return;
    setLivePermitInsights({ loading: true });
    try {
      const session = await supabase.auth.getSession();
      const tk = session.data.session?.access_token;
      const res = await fetch(`/api/data/permits?pageSize=500`, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} }).then(r => r.json()).catch(() => null);
      if (res?.data?.length) {
        const permits = res.data as Array<{ status: string; permitDate?: string; closureDate?: string }>;
        const operating = permits.filter(p => p.status === "operating").length;
        const closed = permits.filter(p => p.status === "closed").length;
        const total = operating + closed;
        const survivalRate = total > 0 ? Math.round((operating / total) * 100) : 0;
        setLivePermitInsights({ loading: false, data: { total, operating, closed, survivalRate } });
      } else {
        setLivePermitInsights({ loading: false });
      }
    } catch { setLivePermitInsights({ loading: false }); }
  };

  if (!livePermitInsights) void loadPermitInsights();

  // ── Panel 2: Permit checklist ──

  const permitSet = getPermitsForCategory(industryCategoryId);
  const totalCost = getTotalPermitCost(industryCategoryId);
  const priorityLabel = (p: string) => p === "required" ? (ko ? "필수" : "Required") : p === "conditional" ? (ko ? "조건부" : "Conditional") : (ko ? "권장" : "Recommended");
  const priorityColor = (p: string) => p === "required" ? "#dc2626" : p === "conditional" ? "#d97706" : "#6b7280";

  return (
    <>
      {/* ── Panel 1: 영업 현황 데이터 ── */}
      {(() => {
        if (!livePermitInsights || livePermitInsights.loading) {
          return (
            <div style={{ marginBottom: "16px", padding: "18px 20px", borderRadius: "20px", border: "1px solid rgba(234,88,12,0.08)", background: "linear-gradient(180deg, rgba(255,237,213,0.1) 0%, rgba(255,255,255,0.9) 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ea580c", animation: "bentoPulse 1.5s infinite" }} />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{ko ? "사업자 현황 데이터 조회 중..." : "Loading permit data..."}</span>
              </div>
            </div>
          );
        }

        if (!livePermitInsights.data) return null;
        const ins = livePermitInsights.data;
        const rateColor = ins.survivalRate >= 70 ? "#059669" : ins.survivalRate >= 50 ? "#d97706" : "#dc2626";

        return (
          <div style={{ marginBottom: "16px", borderRadius: "20px", border: `1px solid ${rateColor}15`, background: `linear-gradient(180deg, ${rateColor}06 0%, rgba(255,255,255,0.92) 100%)`, overflow: "hidden" }} className="bento-fade-in">
            <div style={{ padding: "18px 20px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: rateColor }} />
                <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? "영업 현황 데이터" : "Business Permit Status"}</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "지방행정인허가 데이터 기반" : "Based on LOCALDATA Permit API"}</div>
            </div>
            <div style={{ padding: "0 20px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "14px", borderRadius: "14px", background: `${rateColor}08` }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "전체 등록" : "Total"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{ins.total.toLocaleString()}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(5,150,105,0.06)" }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "영업 중" : "Active"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#059669" }}>{ins.operating.toLocaleString()}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(220,38,38,0.04)" }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "폐업" : "Closed"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#dc2626" }}>{ins.closed.toLocaleString()}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: `${rateColor}08` }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "생존율" : "Survival"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: rateColor }}>{ins.survivalRate}%</div>
                <div style={{ height: "4px", borderRadius: "2px", background: "rgba(0,0,0,0.06)", marginTop: "6px", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "2px", width: `${ins.survivalRate}%`, background: rateColor, transition: "width 0.6s ease" }} />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Panel 2: 인허가 업종별 체크리스트 카드 ── */}
      {permitSet && (
        <div style={{ marginBottom: "16px" }} className="bento-fade-in">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? `${permitSet.label.ko} 인허가 체크리스트` : `${permitSet.label.en} Permit Checklist`}</span>
            </div>
            {totalCost > 0 && (
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>
                {ko ? `예상 비용: 약 ${Math.round(totalCost / 10000).toLocaleString()}만원` : `Est. cost: ~₩${totalCost.toLocaleString()}`}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {permitSet.permits.map((permit: { id: string; name: { ko: string; en: string }; priority: string; agency: { ko: string; en: string }; costWon: number; costNote?: { ko: string; en: string }; duration: { ko: string; en: string }; applyUrl?: string; documents: Array<{ ko: string; en: string }>; steps: Array<{ ko: string; en: string }>; warnings?: Array<{ ko: string; en: string }> }, idx: number) => {
              const isExpanded = expandedPermitId === permit.id;
              return (
                <div key={permit.id} style={{ borderRadius: "16px", border: `1px solid ${isExpanded ? priorityColor(permit.priority) + "30" : "rgba(0,0,0,0.06)"}`, background: isExpanded ? `${priorityColor(permit.priority)}04` : "#fff", overflow: "hidden", transition: "all 0.2s ease" }}>
                  <button type="button" onClick={() => setExpandedPermitId(isExpanded ? null : permit.id)} style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${priorityColor(permit.priority)}15`, color: priorityColor(permit.priority), textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" as const }}>{priorityLabel(permit.priority)}</span>
                      <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.01em" }}>{ko ? permit.name.ko : permit.name.en}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? permit.duration.ko : permit.duration.en}</span>
                      <span style={{ fontSize: "12px", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px", marginBottom: "14px" }}>
                        <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                          <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>{ko ? "신청 기관" : "Agency"}</div>
                          <div style={{ fontSize: "13px", fontWeight: 550 }}>{ko ? permit.agency.ko : permit.agency.en}</div>
                        </div>
                        <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)" }}>
                          <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(0,0,0,0.4)", marginBottom: "2px" }}>{ko ? "비용" : "Cost"}</div>
                          <div style={{ fontSize: "13px", fontWeight: 550 }}>{permit.costWon === 0 ? (ko ? "무료" : "Free") : `${permit.costWon.toLocaleString()}원`}</div>
                          {permit.costNote && <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{ko ? permit.costNote.ko : permit.costNote.en}</div>}
                        </div>
                      </div>
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 650, marginBottom: "6px", color: "rgba(0,0,0,0.5)" }}>{ko ? "절차" : "Steps"}</div>
                        {permit.steps.map((step: { ko: string; en: string }, si: number) => (
                          <div key={si} style={{ display: "flex", gap: "8px", marginBottom: "4px", fontSize: "13px", lineHeight: 1.5 }}>
                            <span style={{ color: priorityColor(permit.priority), fontWeight: 700, minWidth: "16px" }}>{si + 1}.</span>
                            <span>{ko ? step.ko : step.en}</span>
                          </div>
                        ))}
                      </div>
                      {permit.documents.length > 0 && (
                        <div style={{ marginBottom: "12px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 650, marginBottom: "6px", color: "rgba(0,0,0,0.5)" }}>{ko ? "필요 서류" : "Documents"}</div>
                          {permit.documents.map((doc: { ko: string; en: string }, di: number) => (
                            <div key={di} style={{ fontSize: "13px", lineHeight: 1.6, paddingLeft: "12px" }}>• {ko ? doc.ko : doc.en}</div>
                          ))}
                        </div>
                      )}
                      {permit.warnings && permit.warnings.length > 0 && (
                        <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)" }}>
                          {permit.warnings.map((w: { ko: string; en: string }, wi: number) => (
                            <div key={wi} style={{ fontSize: "12px", color: "#dc2626", lineHeight: 1.5 }}>⚠ {ko ? w.ko : w.en}</div>
                          ))}
                        </div>
                      )}
                      {permit.applyUrl && (
                        <a href={permit.applyUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "12px", fontSize: "13px", fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
                          {ko ? "온라인 신청 바로가기 →" : "Apply Online →"}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
