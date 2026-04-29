"use client";

import { useState } from "react";
import { Building2, User, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
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

  // ── Intro 콘텐츠 (단계 의미·작업·실패 사례) ──
  //  사용자 피드백: 단계 설명이 부족해 "대체 뭘 하라는 건지" 모르겠다는 의견 → 제일 위에
  //  의미·작업 흐름·실패 사례 카드 3종을 명시적으로 노출.
  const categoryHints: Record<string, { building: string; person: string; facility: string; pitfall: string }> = {
    food: {
      building: "건축물대장 용도(근린생활시설), 정화조 용량, 환기·배기·분리 가스 라인",
      person: "식품위생교육 6시간 수료증, 보건증(건강진단결과서)",
      facility: "소방완비증명서(2층 이상 또는 100㎡↑), 가스시설 검사",
      pitfall: "정화조 용량이 부족해 영업신고가 거부 → 증축 1,000만원+ 또는 계약 해지",
    },
    cafe: {
      building: "건축물대장 용도(근린생활시설), 정화조 용량, 환기·배수",
      person: "휴게음식점 위생교육 3~6시간 수료증, 보건증",
      facility: "소방완비증명서(2층 이상 또는 100㎡↑)",
      pitfall: "휴게음식점 영업신고 누락 후 오픈 → 단속 시 영업정지 + 과태료",
    },
    beauty: {
      building: "건축물대장 용도, 환기·세면설비",
      person: "미용사 / 이용사 / 피부미용사 면허, 보건증",
      facility: "공중위생영업소 신고, 소독 설비 기준",
      pitfall: "미용사 면허 없이 영업 → 무자격 행위로 폐업 + 형사 처벌 위험",
    },
    retail: {
      building: "건축물대장 용도(근린생활시설/판매시설)",
      person: "(일반 소매는 면허 불요, 식품 판매 시 식품판매업 신고)",
      facility: "(일반 소매 무자격, 주류 판매 시 주류판매업 면허)",
      pitfall: "건강기능식품·주류 등 특수 품목을 신고 없이 판매 → 시정명령 + 영업정지",
    },
    fitness: {
      building: "건축물대장 용도, 천장 높이(필라테스/요가), 방음",
      person: "체육지도자 자격(생활스포츠지도사 등 — 운영자 본인 또는 강사 1명)",
      facility: "체육시설업 신고 + 배상책임보험 가입(필수)",
      pitfall: "체육시설업 미신고 운영 → 단속 시 즉시 폐쇄 + 보증금 손실",
    },
    education: {
      building: "건축물대장 용도(교육연구시설/근린생활), 면적별 정원 기준",
      person: "강사 자격증 + 성범죄 경력 조회서, 학원 설립자 결격사유",
      facility: "교육청 학원 등록 + 배상책임보험, 소방·CCTV·정수기 등 시설 기준",
      pitfall: "학원 등록 전 수강생 모집 → 무등록 학원 처벌 + 환불 분쟁",
    },
    pet: {
      building: "건축물대장 용도(근린생활), 소음·분뇨 처리",
      person: "동물보호법상 등록 영업자 — 반려동물취급자 자격(미용업 등)",
      facility: "동물관련영업 등록(시·군·구), 시설 면적·격리실 기준",
      pitfall: "동물관련영업 등록 누락 → 과태료 100~500만원 + 폐쇄명령",
    },
    living: {
      building: "건축물대장 용도, 폐수·소음 기준",
      person: "(업종별 상이 — 세탁업 신고, 청소업 등록 등)",
      facility: "관할 구청 신고/등록 — 정화조·폐수 처리 시설",
      pitfall: "특수 업종(세탁/청소) 신고 누락 → 영업정지 + 과태료",
    },
    space: {
      building: "건축물대장 용도(숙박시설은 별도), 객실/화장실 비율",
      person: "(공유숙박은 호스트 거주 요건 / 농어촌민박 신고 등)",
      facility: "숙박업 신고 + 소방·전기 안전 점검",
      pitfall: "주거용 건물에서 무허가 숙박 운영 → 형사 처벌 + 즉시 폐쇄",
    },
  };
  const hint = categoryHints[industryCategoryId] ?? categoryHints.food;

  // Apple-style 토큰 — 같은 surface 를 4 카드에 통일하되, 은은한 navy 워시 위에
  //  포인트 컬러로 미드나이트 블루(#191970) 를 아이콘·step·버튼에만 강하게 박는 전략.
  //  ACCENT (navy) = surface/border 톤, MIDNIGHT = 액션·포인트.
  const ACCENT = "#1d3557";
  const ACCENT_RGB = "29,53,87";
  const MIDNIGHT = "#191970";          // CSS MidnightBlue — 포인트 컬러
  const MIDNIGHT_RGB = "25,25,112";
  const surfaceCard = {
    marginBottom: "12px",
    padding: "28px 28px",
    borderRadius: "20px",
    // 흰 위에 navy 2% 정도 — 페이지 배경에서 카드가 살짝 시원해 보일 정도만.
    background: `linear-gradient(180deg, rgba(${ACCENT_RGB},0.018) 0%, rgba(255,255,255,0.96) 60%)`,
    border: `1px solid rgba(${ACCENT_RGB},0.10)`,
    boxShadow: `0 1px 2px rgba(${ACCENT_RGB},0.04)`,
  } as const;
  const eyebrow = {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: MIDNIGHT,
    textTransform: "uppercase" as const,
    marginBottom: "10px",
  } as const;
  const hairline = `1px solid rgba(${ACCENT_RGB},0.10)`;

  return (
    <>
      {/* ── Hero: 단계 의미 (typography-first) ── */}
      <section style={surfaceCard}>
        <div style={eyebrow}>{ko ? "사전 확인" : "Pre-check"}</div>
        <h2 style={{
          fontSize: "26px",
          fontWeight: 680,
          letterSpacing: "-0.035em",
          lineHeight: 1.18,
          color: "#0f172a",
          margin: "0 0 14px",
        }}>
          {ko
            ? "내 업종이 이 건물에서 가능한지 — 계약 전에 확인하세요."
            : "Confirm your category fits the building — before you sign."}
        </h2>
        <p style={{
          fontSize: "16px",
          lineHeight: 1.6,
          color: "rgba(0,0,0,0.62)",
          margin: 0,
        }}>
          {ko
            ? "임대 계약 후에야 「이 건물에선 영업 못 한다」가 드러나면 보증금 1,000~5,000만원이 즉시 묶입니다. 지금은 발급이 아닌 \"무엇이 필요한지\" 만 파악하는 30분짜리 단계입니다."
            : "If post-lease you discover the building can't host your business, your KRW 10–50M deposit is locked. This is a 30-minute pre-check to map what's required — not to apply yet."}
        </p>
      </section>

      {/* ── 3축 점검 (icon · label · body, 가벼운 3-column) ── */}
      <section style={surfaceCard}>
        <div style={eyebrow}>{ko ? "확인 항목 — 건물·사람·시설" : "Three Axes"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0", borderTop: hairline, borderBottom: hairline }}>
          {([
            { Icon: Building2, title: ko ? "건물" : "Building", desc: hint.building },
            { Icon: User, title: ko ? "사람" : "Person", desc: hint.person },
            { Icon: ShieldCheck, title: ko ? "시설" : "Facility", desc: hint.facility },
          ]).map((axis, i, arr) => (
            <div
              key={axis.title}
              style={{
                padding: "20px 18px",
                borderRight: i < arr.length - 1 ? hairline : "none",
              }}
            >
              {/* 미드나이트 블루 라운드 chip 안에 라인 아이콘 — 포인트 컬러를 명확히 */}
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: `linear-gradient(180deg, rgba(${MIDNIGHT_RGB},0.10) 0%, rgba(${MIDNIGHT_RGB},0.06) 100%)`,
                border: `1px solid rgba(${MIDNIGHT_RGB},0.16)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <axis.Icon size={18} strokeWidth={1.8} color={MIDNIGHT} />
              </div>
              <div style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#0f172a",
                marginTop: "10px",
                marginBottom: "6px",
                letterSpacing: "-0.01em",
              }}>
                {axis.title}
              </div>
              <div style={{
                fontSize: "13px",
                lineHeight: 1.55,
                color: "rgba(0,0,0,0.58)",
              }}>
                {axis.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4단계 작업 흐름 (midnight step circles + hairline divider) ── */}
      <section style={surfaceCard}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={eyebrow}>{ko ? "작업 흐름" : "Workflow"}</div>
          <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", fontVariantNumeric: "tabular-nums" }}>
            {ko ? "약 30분" : "~30 min"}
          </div>
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {[
            { time: "10분", text: ko ? "아래 패널의 인허가 카드를 모두 펼쳐 읽기 — 절차·비용·기관" : "Expand each permit card below — steps, cost, agency" },
            { time: "10분", text: ko ? "정부24 (gov24.go.kr) 에서 후보 건물 「건축물대장」 발급 — 용도·면적·정화조" : "Get building registry from gov24.go.kr — use code, area, septic" },
            { time: "10분", text: ko ? "체크리스트 5개 검토 — 모르는 항목은 관할 구청·세무서로 전화" : "Review the 5-item checklist — phone the agency on any unclear item" },
            { time: ko ? "다음" : "Next", text: ko ? "5개 확인 후 다음 단계 (상권·입지 비교) 로" : "After all 5 are confirmed, proceed to location comparison", isFinal: true },
          ].map((step, i, arr) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                padding: "16px 0",
                borderBottom: i < arr.length - 1 ? hairline : "none",
              }}
            >
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                // 진행 단계 = midnight hairline + midnight 텍스트, 마지막 단계 = filled midnight + glow.
                background: step.isFinal ? MIDNIGHT : "transparent",
                border: step.isFinal ? "none" : `1.5px solid rgba(${MIDNIGHT_RGB},0.32)`,
                color: step.isFinal ? "#fff" : MIDNIGHT,
                boxShadow: step.isFinal ? `0 4px 14px rgba(${MIDNIGHT_RGB},0.32)` : "none",
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: "-1px",
              }}>
                {step.isFinal ? <ArrowRight size={13} strokeWidth={2.2} /> : i + 1}
              </div>
              <div style={{ flex: 1, fontSize: "15px", lineHeight: 1.55, color: "#0f172a", letterSpacing: "-0.01em" }}>
                {step.text}
              </div>
              <div style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "rgba(0,0,0,0.45)",
                flexShrink: 0,
                paddingTop: "3px",
                fontVariantNumeric: "tabular-nums",
                minWidth: "36px",
                textAlign: "right" as const,
              }}>
                {step.time}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Pitfall — minimal alert (hairline + muted red text only) ── */}
      <section style={{
        marginBottom: "16px",
        padding: "16px 20px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(220,38,38,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <AlertTriangle size={18} strokeWidth={1.8} color="#dc2626" style={{ flexShrink: 0, marginTop: "1px" }} />
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#dc2626", letterSpacing: "0.02em", marginBottom: "4px" }}>
              {ko ? "이 카테고리의 흔한 실패" : "Common failure for this category"}
            </div>
            <div style={{ fontSize: "14px", lineHeight: 1.55, color: "rgba(0,0,0,0.78)" }}>{hint.pitfall}</div>
          </div>
        </div>
      </section>

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
