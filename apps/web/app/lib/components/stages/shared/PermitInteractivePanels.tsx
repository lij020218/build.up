"use client";

/**
 * PermitInteractivePanels — permit-check 단계의 인터랙티브/표시 위젯(웹).
 *
 * StageContentRenderer 가 ref/kind 로 매핑해 렌더한다(플랫폼별 유일 비공유점):
 *  - LiveDataPanel    → interactive ref="liveData"  : 영업 현황·생존율 라이브 데이터(API)
 *  - PermitCardsPanel  → interactive ref="permitCards": 업종별 인허가 체크리스트 카드
 *  - AxisChecklistWidget → section kind="axisChecklist": 3축(건물·사람·시설) 직접 점검 체크리스트
 *
 * 원본: offline/PermitCheckPanels.tsx (SSOT 전환으로 분해·이전). 시각·동작 1:1 보존.
 */

import { useState } from "react";
import { Building2, Users, ShieldCheck, type LucideIcon } from "lucide-react";
import type { CategoryContent } from "@foundone/shared";
import { getPermitsForCategory, getTotalPermitCost } from "@foundone/shared";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { supabase } from "../../../../../lib/supabase";
import { MIDNIGHT, MIDNIGHT_SOFT, MIDNIGHT_BORDER } from "../startup/StartupStageShell";

const AXIS_ICONS: Record<string, LucideIcon> = {
  building: Building2,
  users: Users,
  person: Users,
  shieldCheck: ShieldCheck,
  facility: ShieldCheck,
};

/* ── 영업 현황·생존율 라이브 데이터 (interactive ref="liveData") ── */

export function LiveDataPanel({ ko }: { ko: boolean }) {
  const d = useDashboardCtx();
  const { livePermitInsights, setLivePermitInsights } = d;

  const loadPermitInsights = async () => {
    if (livePermitInsights && !livePermitInsights.loading) return;
    setLivePermitInsights({ loading: true });
    try {
      const session = await supabase.auth.getSession();
      const tk = session.data.session?.access_token;
      const res = await fetch(`/api/data/permits?pageSize=500`, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} })
        .then((r) => r.json())
        .catch(() => null);
      if (res?.data?.length) {
        const permits = res.data as Array<{ status: string }>;
        const operating = permits.filter((p) => p.status === "operating").length;
        const closed = permits.filter((p) => p.status === "closed").length;
        const total = operating + closed;
        const survivalRate = total > 0 ? Math.round((operating / total) * 100) : 0;
        setLivePermitInsights({ loading: false, data: { total, operating, closed, survivalRate } });
      } else {
        setLivePermitInsights({ loading: false });
      }
    } catch {
      setLivePermitInsights({ loading: false });
    }
  };

  if (!livePermitInsights) void loadPermitInsights();

  if (!livePermitInsights || livePermitInsights.loading) {
    return (
      <div style={{ marginBottom: "16px", padding: "18px 20px", borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "linear-gradient(180deg, rgba(255,237,213,0.1) 0%, rgba(255,255,255,0.9) 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#191970", animation: "bentoPulse 1.5s infinite" }} />
          <span style={{ fontSize: "14px", fontWeight: 600 }}>{ko ? "사업자 현황 데이터 조회 중..." : "Loading permit data..."}</span>
        </div>
      </div>
    );
  }

  if (!livePermitInsights.data) return null;
  const ins = livePermitInsights.data;
  const rateColor = ins.survivalRate >= 70 ? "#1d3557" : ins.survivalRate >= 50 ? "#191970" : "#b64c4c";

  return (
    <div style={{ marginBottom: "16px", borderRadius: "20px", border: `1px solid ${rateColor}15`, background: `linear-gradient(180deg, ${rateColor}06 0%, rgba(255,255,255,0.92) 100%)`, overflow: "hidden" }} className="bento-fade-in">
      <div style={{ padding: "18px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: rateColor }} />
          <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? "영업 현황 데이터" : "Business Permit Status"}</span>
        </div>
        <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "지방행정인허가 데이터 기반" : "Based on LOCALDATA Permit API"}</div>
      </div>
      <div style={{ padding: "0 20px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
        <div style={{ padding: "14px", borderRadius: "14px", background: `${rateColor}08` }}>
          <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "전체 등록" : "Total"}</div>
          <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{ins.total.toLocaleString()}</div>
        </div>
        <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(25,25,112,0.06)" }}>
          <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "영업 중" : "Active"}</div>
          <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#1d3557" }}>{ins.operating.toLocaleString()}</div>
        </div>
        <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(182,76,76,0.04)" }}>
          <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "폐업" : "Closed"}</div>
          <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#b64c4c" }}>{ins.closed.toLocaleString()}</div>
        </div>
        <div style={{ padding: "14px", borderRadius: "14px", background: `${rateColor}08` }}>
          <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "생존율" : "Survival"}</div>
          <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: rateColor }}>{ins.survivalRate}%</div>
          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(0,0,0,0.06)", marginTop: "6px", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: "2px", width: `${ins.survivalRate}%`, background: rateColor, transition: "width 0.6s ease" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 업종별 인허가 체크리스트 카드 (interactive ref="permitCards") ── */

export function PermitCardsPanel({ catId, ko }: { catId: string; ko: boolean }) {
  const [expandedPermitId, setExpandedPermitId] = useState<string | null>(null);
  const permitSet = getPermitsForCategory(catId);
  const totalCost = getTotalPermitCost(catId);
  if (!permitSet) return null;

  const priorityLabel = (p: string) => (p === "required" ? (ko ? "필수" : "Required") : p === "conditional" ? (ko ? "조건부" : "Conditional") : (ko ? "권장" : "Recommended"));
  const priorityColor = (p: string) => (p === "required" ? "#b64c4c" : p === "conditional" ? "#191970" : "#6b7280");

  return (
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
        {permitSet.permits.map((permit) => {
          const isExpanded = expandedPermitId === permit.id;
          return (
            <div key={permit.id} style={{ borderRadius: "16px", border: `1px solid ${isExpanded ? priorityColor(permit.priority) + "30" : "rgba(0,0,0,0.06)"}`, background: isExpanded ? `${priorityColor(permit.priority)}04` : "#fff", overflow: "hidden", transition: "all 0.2s ease" }}>
              <button type="button" onClick={() => setExpandedPermitId(isExpanded ? null : permit.id)} style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${priorityColor(permit.priority)}15`, color: priorityColor(permit.priority), textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{priorityLabel(permit.priority)}</span>
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
                    {permit.steps.map((step, si) => (
                      <div key={si} style={{ display: "flex", gap: "8px", marginBottom: "4px", fontSize: "13px", lineHeight: 1.5 }}>
                        <span style={{ color: priorityColor(permit.priority), fontWeight: 700, minWidth: "16px" }}>{si + 1}.</span>
                        <span>{ko ? step.ko : step.en}</span>
                      </div>
                    ))}
                  </div>
                  {permit.documents.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 650, marginBottom: "6px", color: "rgba(0,0,0,0.5)" }}>{ko ? "필요 서류" : "Documents"}</div>
                      {permit.documents.map((doc, di) => (
                        <div key={di} style={{ fontSize: "13px", lineHeight: 1.6, paddingLeft: "12px" }}>• {ko ? doc.ko : doc.en}</div>
                      ))}
                    </div>
                  )}
                  {permit.warnings && permit.warnings.length > 0 && (
                    <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(182,76,76,0.04)", border: "1px solid rgba(182,76,76,0.08)" }}>
                      {permit.warnings.map((w, wi) => (
                        <div key={wi} style={{ fontSize: "12px", color: "#b64c4c", lineHeight: 1.5 }}>⚠ {ko ? w.ko : w.en}</div>
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
  );
}

/* ── 3축 직접 점검 체크리스트 (section kind="axisChecklist") ──
 *  웹은 표시·자가 점검용(게이팅은 단계 footer taskMap). iOS는 게이팅에도 사용.
 *  행은 byCategory[cat].workSteps[axis].tasks 에서 읽어 web↔iOS 동일 항목. */

export function AxisChecklistWidget({
  eyebrow,
  subtitle,
  axes,
  cat,
}: {
  eyebrow: string;
  subtitle?: string;
  axes: Array<{ axis: string; icon: string; title: string }>;
  cat: CategoryContent;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const allTaskIds = axes.flatMap((a) => (cat.workSteps?.[a.axis]?.tasks ?? []).map((t) => t.id));
  const doneCount = allTaskIds.filter((id) => checked.has(id)).length;
  const total = allTaskIds.length;
  const allPassed = total > 0 && doneCount === total;

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ padding: "16px 18px", borderRadius: "14px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>{eyebrow}</div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: allPassed ? "#2f8f4e" : "#0f172a" }}>{doneCount}/{total} 확인 완료</div>
        {subtitle && <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55, marginTop: "4px" }}>{subtitle}</div>}
      </div>

      {axes.map((a) => {
        const rows = cat.workSteps?.[a.axis]?.tasks ?? [];
        const passed = rows.length > 0 && rows.every((r) => checked.has(r.id));
        const Icon = AXIS_ICONS[a.icon] ?? AXIS_ICONS[a.axis] ?? ShieldCheck;
        return (
          <div key={a.axis}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", padding: "0 2px" }}>
              <Icon size={15} strokeWidth={2.2} color={passed ? "#2f8f4e" : MIDNIGHT} />
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#1d3557" }}>{a.title}</div>
              <div style={{ flex: 1 }} />
              {passed && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="9" fill="#2f8f4e" /><path d="M4.5 9.2L7.5 12L13 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </div>
            <div style={{ background: "white", borderRadius: "14px", border: `1px solid ${MIDNIGHT_BORDER}`, overflow: "hidden" }}>
              {rows.map((r, i) => {
                const isDone = checked.has(r.id);
                return (
                  <div key={r.id}>
                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "48px" }} />}
                    <button type="button" onClick={() => toggle(r.id)} style={{ display: "flex", gap: "12px", alignItems: "flex-start", width: "100%", textAlign: "left", padding: "13px 16px", background: isDone ? "rgba(48,168,78,0.04)" : "transparent", border: "none", cursor: "pointer" }}>
                      <div style={{ flexShrink: 0, marginTop: "1px", width: 22, height: 22, borderRadius: 7, border: isDone ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: isDone ? "#2f8f4e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isDone && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: isDone ? "rgba(0,0,0,0.4)" : "#0f172a", lineHeight: 1.45 }}>{r.title}</div>
                        <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.55, marginTop: "3px" }}>{r.detail}</div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
