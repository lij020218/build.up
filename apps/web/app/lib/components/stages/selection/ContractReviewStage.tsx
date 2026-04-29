"use client";

import { useRef, useState } from "react";
import { Building2, FileSignature, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  getContractAnalysisHints,
  getContractTaskDetail,
} from "../../../helpers";

// ── Apple-style 토큰 — permit-check 와 결 통일 ──────────────────
const ACCENT_RGB = "29,53,87";
const MIDNIGHT = "#191970";
const MIDNIGHT_RGB = "25,25,112";
const surfaceCard = {
  marginBottom: "12px",
  padding: "28px 28px",
  borderRadius: "20px",
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

export function ContractReviewStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    industryCategoryId,
    isDigitalCategory,
    contractTasks,
    activeContractTask,
    activeContractTaskDetail,
    setSelectedContractTaskId,
    effectiveContractAnalysis,
    contractSubChecks, setContractSubChecks,
    contractText,
    setContractText,
    contractAnalysisStatus,
    handleContractAnalysis,
    contractAnalysisError,
    prevTraversedStage,
    setViewingStageId,
    handleContractTaskToggle,
    handleContractContinue,
    resetDemo,
  } = d;

  const contractRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);

  const canCompleteContractStep = contractTasks.every((task) => task.status === "completed");
  const ko = language === "ko";

  // ── 카테고리별 함정 (intro pitfall card) ───────────────────────
  const categoryPitfalls: Record<string, string> = {
    food: ko
      ? "정화조 용량 확인 누락 → 영업신고 거부 → 정화조 증축 1,000만원+ 또는 계약 해지"
      : "Missing septic check → permit denied → ₩10M+ tank expansion or contract termination",
    cafe: ko
      ? "급배수·전기 용량 미확인 후 계약 → 인테리어 단계에서 추가 공사 500~2,000만원"
      : "Signing without verifying water/electrical → ₩5–20M extra work during interior",
    beauty: ko
      ? "전기 용량 부족 → 헤어드라이기·왁싱기·관리기 동시 사용 시 차단 → 영업 중단"
      : "Insufficient electrical → simultaneous use of dryers/wax/devices trips breakers → service halt",
    fitness: ko
      ? "층고·방음 부족 사전 확인 누락 → 입주 후 민원·소음 분쟁 + 방음 공사 1,000만원+"
      : "Missing ceiling/sound check → noise complaints + ₩10M+ soundproofing post move-in",
    education: ko
      ? "건축물 용도 '교육연구시설' 아니면 학원 등록 거부 → 보증금 회수 어려움"
      : "If use code isn't 'educational research facility,' academy registration is denied",
    pet: ko
      ? "주거지 인접 시 소음·분뇨 민원 → 계약 해지 또는 영업시간 제한"
      : "Adjacent residential complaints → contract termination or limited hours",
    "online-digital": ko
      ? "주거 임대차 계약에서 사업자 등록 금지 조항 누락 시 분쟁 → 사업자 주소 사용 불가"
      : "Missing business-use clause in residential lease → can't use as business address",
    "living-service": ko
      ? "폐수·소음 기준 미확인 후 입주 → 단속 시 영업정지 + 시설 보강 비용"
      : "Wastewater/noise non-compliance → operations halted + facility upgrades",
    space: ko
      ? "건축물 용도 불일치 (숙박업·근린생활) → 영업허가 거부 → 보증금 묶임"
      : "Use-code mismatch (lodging/neighborhood) → permit denial → deposit locked",
  };
  const pitfall = categoryPitfalls[industryCategoryId] ?? categoryPitfalls.food;

  return (
    <>
      {/* ── Hero: 단계 의미 ───────────────────────────────────── */}
      <section style={surfaceCard}>
        <div style={eyebrow}>{ko ? "계약 전 검토" : "Pre-Contract Review"}</div>
        <h2 style={{
          fontSize: "26px", fontWeight: 680, letterSpacing: "-0.035em",
          lineHeight: 1.18, color: "#0f172a", margin: "0 0 14px",
        }}>
          {ko
            ? "계약서 한 번 사인하면 보증금이 묶입니다. 그 전 30분이 가장 비싼 30분입니다."
            : "Once you sign, your deposit is locked. The 30 minutes before are the most expensive 30 minutes."}
        </h2>
        <p style={{ fontSize: "16px", lineHeight: 1.6, color: "rgba(0,0,0,0.62)", margin: 0 }}>
          {ko
            ? "이 단계는 임대차 계약 직전에 「건물·계약·보증금 보호」 3축을 점검하는 곳입니다. 인허가 단계에서 확인한 요건이 실제로 이 건물에서 충족되는지, 계약서 특약에 보호 장치가 들어가는지 확인합니다."
            : "Right before signing the lease, audit 3 axes: building, contract clauses, deposit protection. Confirm permit requirements actually match this building and that protections are written into special clauses."}
        </p>
      </section>

      {/* ── 3축 점검 ──────────────────────────────────────────── */}
      <section style={surfaceCard}>
        <div style={eyebrow}>{ko ? "점검할 3축 — 건물·계약·보호" : "Three axes — Building, Contract, Protection"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0", borderTop: hairline, borderBottom: hairline }}>
          {([
            {
              Icon: Building2,
              title: ko ? "건물" : "Building",
              desc: ko
                ? "건축물대장 용도 일치, 정화조·전기·급배수 용량, 시설 상태 — 영업 가능 여부의 물리적 조건"
                : "Use code match, septic/electrical/water capacity, facility state — physical fitness for operation",
            },
            {
              Icon: FileSignature,
              title: ko ? "계약" : "Contract",
              desc: ko
                ? "임대료 인상 상한 (5%), 계약갱신요구권 (10년), 권리금·원상복구 범위, 업종변경 조항"
                : "Rent cap (5%), renewal right (10y), key money/restoration scope, business-type clauses",
            },
            {
              Icon: ShieldCheck,
              title: ko ? "보호 장치" : "Protection",
              desc: ko
                ? "확정일자 (당일), 등기부등본 근저당 확인, 환산보증금 한도, 영상 기록"
                : "Same-day certified date, deed register check, converted-deposit cap, video record",
            },
          ]).map((axis, i, arr) => (
            <div
              key={axis.title}
              style={{ padding: "20px 18px", borderRight: i < arr.length - 1 ? hairline : "none" }}
            >
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: `linear-gradient(180deg, rgba(${MIDNIGHT_RGB},0.10) 0%, rgba(${MIDNIGHT_RGB},0.06) 100%)`,
                border: `1px solid rgba(${MIDNIGHT_RGB},0.16)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <axis.Icon size={18} strokeWidth={1.8} color={MIDNIGHT} />
              </div>
              <div style={{
                fontSize: "13px", fontWeight: 600, color: "#0f172a",
                marginTop: "10px", marginBottom: "6px", letterSpacing: "-0.01em",
              }}>
                {axis.title}
              </div>
              <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(0,0,0,0.58)" }}>
                {axis.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4단계 작업 흐름 ───────────────────────────────────── */}
      <section style={surfaceCard}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={eyebrow}>{ko ? "작업 흐름" : "Workflow"}</div>
          <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", fontVariantNumeric: "tabular-nums" }}>
            {ko ? "약 90분" : "~90 min"}
          </div>
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {[
            { time: "20분", text: ko ? "건축물대장·등기부등본 발급 — 정부24 / 인터넷등기소. 용도·근저당·정화조 확인" : "Get building registry + deed register from gov.kr — verify use code, mortgages, septic" },
            { time: "30분", text: ko ? "현장 방문 — 시설·설비·소음·동선·환기를 직접 점검 + 영상으로 전체 기록" : "Site visit — inspect facilities/noise/flow/ventilation in person + film entire space" },
            { time: "25분", text: ko ? "계약서 특약 협상 — 임대료 인상 상한, 원상복구 범위, 권리금, 업종변경 명시" : "Negotiate special clauses — rent cap, restoration scope, key money, business-type" },
            { time: ko ? "다음" : "Next", text: ko ? "확정일자 받고 → 다음 단계 (인테리어 발주) 로" : "Get certified date → proceed to interior setup", isFinal: true },
          ].map((step, i, arr) => (
            <li
              key={i}
              style={{
                display: "flex", alignItems: "flex-start", gap: "16px",
                padding: "16px 0",
                borderBottom: i < arr.length - 1 ? hairline : "none",
              }}
            >
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: step.isFinal ? MIDNIGHT : "transparent",
                border: step.isFinal ? "none" : `1.5px solid rgba(${MIDNIGHT_RGB},0.32)`,
                color: step.isFinal ? "#fff" : MIDNIGHT,
                boxShadow: step.isFinal ? `0 4px 14px rgba(${MIDNIGHT_RGB},0.32)` : "none",
                fontSize: "12px", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: "-1px",
              }}>
                {step.isFinal ? <ArrowRight size={13} strokeWidth={2.2} /> : i + 1}
              </div>
              <div style={{ flex: 1, fontSize: "15px", lineHeight: 1.55, color: "#0f172a", letterSpacing: "-0.01em" }}>
                {step.text}
              </div>
              <div style={{
                fontSize: "12px", fontWeight: 500, color: "rgba(0,0,0,0.45)",
                flexShrink: 0, paddingTop: "3px", fontVariantNumeric: "tabular-nums",
                minWidth: "36px", textAlign: "right" as const,
              }}>
                {step.time}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Pitfall ──────────────────────────────────────────── */}
      <section style={{
        marginBottom: "16px", padding: "16px 20px", borderRadius: "16px",
        background: "rgba(255,255,255,0.96)", border: "1px solid rgba(220,38,38,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <AlertTriangle size={18} strokeWidth={1.8} color="#dc2626" style={{ flexShrink: 0, marginTop: "1px" }} />
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#dc2626", letterSpacing: "0.02em", marginBottom: "4px" }}>
              {ko ? "이 카테고리의 흔한 실패" : "Common failure for this category"}
            </div>
            <div style={{ fontSize: "14px", lineHeight: 1.55, color: "rgba(0,0,0,0.78)" }}>{pitfall}</div>
          </div>
        </div>
      </section>

      <div style={styles.helper}>
        {isDigitalCategory
          ? ko
            ? "운영 공간, 보관, 택배, 공급 접근성처럼 온라인 판매의 실제 실행 조건을 먼저 점검합니다."
            : "Review workspace, storage, shipping, and sourcing conditions before scaling online operations."
          : copy.home.contractHelp}
      </div>
      <div style={styles.budgetLabel}>
        {ko ? `필수 확인 항목 ${contractTasks.length}개` : `${contractTasks.length} required items`}
      </div>

      {/* ── Accordion 체크리스트 — PermitCheckPanels 와 동일 결 ──
          각 task 가 클릭 시 펼쳐지며 summary / checklist / traps / actions / questions 를 inline 표시.
          이전 구현 (카드 그리드 + 별도 detail 패널) 을 단일 흐름으로 정리해 다른 단계와 일관성 확보. */}
      <div
        ref={contractRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "16px",
          ...(shakeWarning ? { outline: "2px solid #dc2626", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}),
        }}
      >
        {contractTasks.map((task) => {
          const completed = task.status === "completed";
          const expanded = activeContractTask?.taskId === task.taskId;
          const detail = getContractTaskDetail(task.taskId, language, industryCategoryId);
          const analysisHints = getContractAnalysisHints(
            effectiveContractAnalysis,
            task.taskId,
            industryCategoryId,
            language,
          );
          return (
            <div
              key={task.taskId}
              style={{
                borderRadius: "16px",
                border: expanded
                  ? `1px solid rgba(${MIDNIGHT_RGB},0.22)`
                  : completed
                    ? "1px solid rgba(34,139,34,0.20)"
                    : `1px solid rgba(${ACCENT_RGB},0.08)`,
                background: expanded
                  ? `linear-gradient(180deg, rgba(${MIDNIGHT_RGB},0.025) 0%, rgba(255,255,255,0.97) 60%)`
                  : completed
                    ? "linear-gradient(180deg, rgba(52,199,89,0.04) 0%, rgba(255,255,255,0.96) 100%)"
                    : "rgba(255,255,255,0.94)",
                overflow: "hidden",
                transition: "all 0.2s ease",
                boxShadow: expanded ? `0 4px 14px rgba(${MIDNIGHT_RGB},0.06)` : "none",
              }}
            >
              {/* Header — 두 개의 분리된 클릭 영역
                  - 동그라미: task 완료 토글
                  - 나머지 (제목/뱃지/시간/chevron): 펼치기/접기 */}
              <div style={{
                width: "100%",
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                {/* ① Status circle — 클릭 시 task 완료 토글 */}
                <button
                  type="button"
                  aria-label={completed
                    ? (ko ? "확인 완료 해제" : "Mark not done")
                    : (ko ? "확인 완료" : "Mark done")}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContractTaskToggle(task.taskId);
                  }}
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    border: completed ? "none" : "1.5px solid rgba(0,0,0,0.22)",
                    background: completed ? "#34c759" : "transparent",
                    boxShadow: completed ? "0 2px 6px rgba(52,199,89,0.28)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!completed) {
                      e.currentTarget.style.borderColor = "#34c759";
                      e.currentTarget.style.background = "rgba(52,199,89,0.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!completed) {
                      e.currentTarget.style.borderColor = "rgba(0,0,0,0.22)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {completed ? (
                    <svg width="13" height="10" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </button>

                {/* ② 펼치기/접기 영역 (제목 + 뱃지 + 시간 + chevron) */}
                <button
                  type="button"
                  onClick={() => setSelectedContractTaskId(expanded ? undefined : task.taskId)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: 0,
                    minWidth: 0,
                  }}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", minWidth: 0 }}>
                    <span style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: completed ? "rgba(0,0,0,0.45)" : "#0f172a",
                      letterSpacing: "-0.01em",
                      textDecoration: completed ? "line-through" : "none",
                    }}>
                      {detail.title}
                    </span>
                    {task.required && !completed ? (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(220,38,38,0.10)",
                        color: "#dc2626",
                        letterSpacing: "0.04em",
                      }}>
                        {ko ? "필수" : "REQUIRED"}
                      </span>
                    ) : null}
                    {analysisHints.length > 0 ? (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(200,150,0,0.12)",
                        color: "#9a6a00",
                        letterSpacing: "0.04em",
                      }}>
                        {ko ? `AI 주의 ${analysisHints.length}` : `AI ${analysisHints.length}`}
                      </span>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", fontVariantNumeric: "tabular-nums" }}>
                      {completed ? (ko ? "완료" : "Done") : `${task.estimatedMinutes ?? "-"}${ko ? "분" : "m"}`}
                    </span>
                    <span style={{
                      fontSize: "12px",
                      color: "rgba(0,0,0,0.4)",
                      transform: expanded ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s",
                    }}>
                      ▾
                    </span>
                  </div>
                </button>
              </div>

              {/* Body — 펼쳐진 상태에서만 */}
              {expanded ? (
                <div style={{
                  padding: "0 18px 18px",
                  borderTop: hairline,
                  display: "grid",
                  gap: "16px",
                  paddingTop: "16px",
                  marginTop: "0",
                }}>
                  {/* Summary */}
                  {detail.summary ? (
                    <div style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(0,0,0,0.7)" }}>
                      {detail.summary}
                    </div>
                  ) : null}

                  {/* AI hints */}
                  {analysisHints.length > 0 ? (
                    <div style={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,200,50,0.08)",
                      border: "1px solid rgba(200,150,0,0.16)",
                    }}>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                        color: "#9a6a00",
                        marginBottom: "6px",
                      }}>
                        {ko ? "AI가 먼저 보라고 한 이유" : "Why AI flagged this"}
                      </div>
                      {analysisHints.map((item: string) => (
                        <div key={item} style={{ fontSize: "13px", lineHeight: 1.6, color: "#6f4d00" }}>• {item}</div>
                      ))}
                    </div>
                  ) : null}

                  {/* Checklist — 각 항목 클릭 가능 + 체크 상태 영구 저장 */}
                  {detail.checklist.length > 0 ? (() => {
                    const checkedCount = detail.checklist.filter((_, i) => contractSubChecks[`${task.taskId}:${i}`]).length;
                    const allChecked = checkedCount === detail.checklist.length;
                    return (
                      <div>
                        <div style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase" as const,
                            color: "rgba(0,0,0,0.5)",
                          }}>
                            {ko ? "확인할 항목" : "Checklist"}
                          </div>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: allChecked ? "#34c759" : "rgba(0,0,0,0.45)",
                            fontVariantNumeric: "tabular-nums",
                          }}>
                            {checkedCount} / {detail.checklist.length}
                          </div>
                        </div>
                        <div style={{ display: "grid", gap: "4px" }}>
                          {detail.checklist.map((item, i) => {
                            const key = `${task.taskId}:${i}`;
                            const checked = !!contractSubChecks[key];
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setContractSubChecks((prev) => ({ ...prev, [key]: !prev[key] }))}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "10px",
                                  padding: "8px 10px",
                                  borderRadius: "10px",
                                  background: checked ? "rgba(52,199,89,0.06)" : "transparent",
                                  border: "1px solid transparent",
                                  cursor: "pointer",
                                  textAlign: "left" as const,
                                  width: "100%",
                                  transition: "background 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  if (!checked) e.currentTarget.style.background = `rgba(${MIDNIGHT_RGB},0.04)`;
                                }}
                                onMouseLeave={(e) => {
                                  if (!checked) e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <div style={{
                                  width: "18px", height: "18px",
                                  borderRadius: "5px",
                                  border: checked ? "none" : `1.5px solid rgba(${MIDNIGHT_RGB},0.30)`,
                                  background: checked ? "#34c759" : "rgba(255,255,255,0.7)",
                                  flexShrink: 0, marginTop: "1px",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  transition: "all 0.15s ease",
                                }}>
                                  {checked ? (
                                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  ) : null}
                                </div>
                                <div style={{
                                  fontSize: "14px",
                                  lineHeight: 1.55,
                                  color: checked ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.78)",
                                  textDecoration: checked ? "line-through" : "none",
                                  transition: "color 0.15s ease",
                                }}>
                                  {item}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })() : null}

                  {/* Traps */}
                  {detail.traps.length > 0 ? (
                    <div>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                        color: "rgba(0,0,0,0.5)",
                        marginBottom: "8px",
                      }}>
                        {ko ? "흔한 함정" : "Common pitfalls"}
                      </div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {detail.traps.map((trap) => (
                          <div key={trap.label} style={{
                            padding: "12px 14px",
                            borderRadius: "12px",
                            background: "rgba(220,38,38,0.04)",
                            border: "1px solid rgba(220,38,38,0.14)",
                          }}>
                            <div style={{ fontSize: "13px", fontWeight: 620, color: "#b83020", marginBottom: "4px" }}>
                              ⚠ {trap.label}
                            </div>
                            <div style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(0,0,0,0.65)" }}>{trap.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Actions */}
                  {detail.actions.length > 0 ? (
                    <div>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                        color: "rgba(0,0,0,0.5)",
                        marginBottom: "8px",
                      }}>
                        {ko ? "지금 할 행동" : "Action steps"}
                      </div>
                      <div style={{ display: "grid", gap: "6px" }}>
                        {detail.actions.map((action) => (
                          action.href ? (
                            <a
                              key={action.label}
                              href={action.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px",
                                lineHeight: 1.5,
                                color: MIDNIGHT,
                                textDecoration: "none",
                                fontWeight: 550,
                              }}
                            >
                              <span style={{ flexShrink: 0, opacity: 0.7 }}>↗</span>
                              <span>{action.label}</span>
                            </a>
                          ) : (
                            <div key={action.label} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <span style={{ fontSize: "14px", color: "rgba(0,0,0,0.4)", flexShrink: 0, marginTop: "1px" }}>→</span>
                              <div style={{ fontSize: "14px", lineHeight: 1.5, color: "rgba(0,0,0,0.78)" }}>{action.label}</div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Questions */}
                  {detail.questions.length > 0 ? (
                    <div>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase" as const,
                        color: "rgba(0,0,0,0.5)",
                        marginBottom: "8px",
                      }}>
                        {ko ? "건물주·중개사에게 물어볼 것" : "Ask the landlord / agent"}
                      </div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {detail.questions.map((q) => (
                          <div key={q} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                            <div style={{ fontSize: "12px", color: MIDNIGHT, flexShrink: 0, marginTop: "2px", fontWeight: 700 }}>Q</div>
                            <div style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(0,0,0,0.78)", fontStyle: "italic" }}>{q}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Complete toggle */}
                  <button
                    type="button"
                    style={completed ? styles.button : styles.primaryButton}
                    onClick={() => handleContractTaskToggle(task.taskId)}
                  >
                    {completed
                      ? ko ? "다시 확인하기로 표시" : "Mark as not reviewed"
                      : ko ? "이 항목 확인 완료" : "Mark this item reviewed"}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={styles.inlinePanel}>
        <div style={styles.inlinePanelHeader}>
          <div style={styles.budgetLabel}>{language === "ko" ? "계약서 조항 분석" : "Contract clause analysis"}</div>
          <div style={styles.helper}>
            {language === "ko"
              ? "상가 임대차 계약서 원문을 붙여넣으면 위험 조항, 누락 항목, 특이 조건을 먼저 짚어드립니다."
              : "Paste the lease text to flag risky clauses, missing items, and unusual terms before signing."}
          </div>
        </div>
        <div style={styles.aiHelper}>
          {language === "ko"
            ? "법률 자문이 아닌 1차 위험 점검입니다. 긴 계약서는 핵심 조항 중심으로 나눠 검토하는 편이 안전합니다."
            : "This is a first-pass risk review, not legal advice. Review long leases in smaller key-clause sections."}
        </div>
        <textarea
          value={contractText}
          onChange={(event) => setContractText(event.target.value)}
          placeholder={
            language === "ko"
              ? "임대차 계약서 원문을 붙여넣어 보세요. 예: 임대료, 원상복구, 권리금, 해지 조항..."
              : "Paste the lease text here. Focus on rent, restoration, key money, termination, and renewal clauses."
          }
          style={{ ...styles.textarea, ...styles.aiTextarea }}
        />
        <div style={styles.aiHelper}>
          {language === "ko"
            ? "최소 100자 이상, 10,000자 이하의 텍스트를 권장합니다."
            : "Use at least 100 characters and keep the text under 10,000 characters."}
        </div>
        <div style={styles.stageInlineActions}>
          <button
            type="button"
            style={{ ...styles.button, ...(contractText.trim() ? styles.surfaceNavButtonSelected : {}) }}
            onClick={handleContractAnalysis}
            disabled={!contractText.trim() || contractAnalysisStatus === "loading"}
          >
            {contractAnalysisStatus === "loading"
              ? language === "ko"
                ? "분석 중..."
                : "Analyzing..."
              : language === "ko"
                ? "계약서 분석하기"
                : "Analyze contract"}
          </button>
        </div>
        {contractAnalysisError ? <div style={styles.warningText}>{contractAnalysisError}</div> : null}
        {effectiveContractAnalysis ? (
          <div style={{ ...styles.inlinePanel, ...styles.aiInlinePanel }}>
            <div style={styles.inlinePanelMetaRow}>
              <div style={styles.budgetLabel}>
                {language === "ko" ? "AI 해석 · 계약서 원문 기반" : "AI interpretation · grounded in contract text"}
              </div>
              <div style={styles.confidenceBadge}>
                {language === "ko"
                  ? effectiveContractAnalysis.riskLevel === "critical"
                    ? "위험 높음"
                    : effectiveContractAnalysis.riskLevel === "high"
                      ? "주의 필요"
                      : effectiveContractAnalysis.riskLevel === "medium"
                        ? "검토 권장"
                        : "기본 확인"
                  : effectiveContractAnalysis.riskLevel}
              </div>
            </div>
            <div style={styles.inlinePanelHeader}>
              <div style={styles.budgetLabel}>{language === "ko" ? "한 줄 요약" : "Summary"}</div>
              <div style={styles.optionTitle}>{effectiveContractAnalysis.summary}</div>
            </div>
            {effectiveContractAnalysis.flaggedClauses.length > 0 ? (
              <>
                <div style={styles.budgetLabel}>{language === "ko" ? "위험 조항" : "Flagged clauses"}</div>
                {effectiveContractAnalysis.flaggedClauses.slice(0, 3).map((clause) => (
                  <div key={`${clause.excerpt}-${clause.issue}`} style={styles.budgetPanel}>
                    <div style={styles.optionSummary}>{clause.excerpt}</div>
                    <div style={clause.severity === "danger" ? styles.criticalText : styles.warningText}>
                      {clause.issue}
                    </div>
                  </div>
                ))}
              </>
            ) : null}
            {effectiveContractAnalysis.missingItems.length > 0 ? (
              <>
                <div style={styles.budgetLabel}>{language === "ko" ? "누락 확인 항목" : "Missing checks"}</div>
                {effectiveContractAnalysis.missingItems.slice(0, 3).map((item) => (
                  <div key={item} style={styles.aiHelper}>• {item}</div>
                ))}
              </>
            ) : null}
            {effectiveContractAnalysis.unusualTerms.length > 0 ? (
              <>
                <div style={styles.budgetLabel}>{language === "ko" ? "특이 조건" : "Unusual terms"}</div>
                {effectiveContractAnalysis.unusualTerms.slice(0, 3).map((item) => (
                  <div key={item} style={styles.aiHelper}>• {item}</div>
                ))}
              </>
            ) : null}
            <div style={styles.budgetLabel}>{language === "ko" ? "다음 행동" : "Next actions"}</div>
            {effectiveContractAnalysis.nextActions.slice(0, 3).map((item) => (
              <div key={item} style={styles.aiHelper}>• {item}</div>
            ))}
          </div>
        ) : null}
      </div>

      <div style={styles.stageFooter}>
        {prevTraversedStage ? (
          <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
            {language === "ko" ? "← 이전 단계" : "← Back"}
          </button>
        ) : null}
        <button
          type="button"
          style={{
            ...styles.primaryButton,
            opacity: canCompleteContractStep ? 1 : 0.45
          }}
          onClick={() => {
            if (!canCompleteContractStep) {
              setShakeWarning(true);
              contractRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            handleContractContinue();
          }}
        >
          {canCompleteContractStep
            ? copy.home.completeContractReview
            : (language === "ko" ? "↑ 항목을 모두 확인하세요" : "↑ Complete all checklist items")}
        </button>
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}
