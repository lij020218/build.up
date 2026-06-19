"use client";

import { Home, Landmark, Shield, ClipboardList } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { styles } from "../../styles";
import { SURFACE_HREFS, VENDOR_URL_MAP } from "../../constants";
import { useRef, useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import {
  formatKRW, localizeRecommendationItem,
  getMatchedProgramsV2,
  getApplicationStatusLabel, getMatchedHighlights,
  getProgramCategoryColor, getProgramCategoryLabel,
} from "@foundone/shared";

// ── 10 extracted card components ──
import { AiCoachCard } from "./analytics/AiCoachCard";
import { DailySalesInputCard } from "./analytics/DailySalesInputCard";
import { WeeklySummaryCard } from "./analytics/WeeklySummaryCard";
import { LaunchRoadmapCard } from "./analytics/LaunchRoadmapCard";
import { MonthlyPLCard } from "./analytics/MonthlyPLCard";
import { InventoryManagementCard } from "./analytics/InventoryManagementCard";
import { StaffLaborCard } from "./analytics/StaffLaborCard";
import { DeliveryPlatformCard } from "./analytics/DeliveryPlatformCard";
import { ProductPerformanceCard } from "./analytics/ProductPerformanceCard";
import { MemberManagementCard } from "./analytics/MemberManagementCard";
import { BusinessPlanCard } from "./analytics/BusinessPlanCard";

export function AnalyticsSurface() {
  const d = useDashboardCtx();
  const {
    language, dailyEntries, monthlyCosts, inventory, setInventory, invForm, setInvForm,
    employees, setEmployees, fixedExpenses, setFixedExpenses,
    deliveryPlatforms, setDeliveryPlatforms, monthlyDeliverySales, setMonthlyDeliverySales,
    products, setProducts, unifiedProducts, setUnifiedProducts, serviceMenuItems, setServiceMenuItems,
    members, setMembers, taxSettings, setTaxSettings, costHistory,
    businessLaunched, storeName, setStoreName, businessCtx, industryCategoryId,
    handleAddDailyEntry, handleSaveMonthlyCosts,
    saveInventory, handleInvSave, handleInvQty, handleInvDelete, openInvEdit, handleInvWaste, handleMarkOrdered,
    emptyInvForm, saveEmployees, handleEmpSave, handleEmpDelete, openEmpEdit,
    saveFixedExpenses, handleFexpSave, handleFexpDelete, openFexpEdit,
    saveDeliveryPlatforms, saveMonthlyDeliverySales, handleDlvSave, handleDlvDelete, openDlvEdit,
    saveProducts, handleProdSave, handleProdDelete, handleProdSoldChange, openProdEdit,
    saveUnifiedProducts, saveServiceMenuItems, saveTaxSettings,
    costIngredientsText, setCostIngredientsText, costLaborText, setCostLaborText,
    costRentText, setCostRentText, costUtilitiesText, setCostUtilitiesText, costOtherText, setCostOtherText,
    userRole, resetDemo, navigateToSurface,
    selectedStoreIndex, setSelectedStoreIndex, decisions, setDecisions, profile, startupType,
    selectedIndustryId, preferredRegion, showMonthlyCostPrompt, setShowMonthlyCostPrompt,
    cpaDecision, setCpaDecision, onlinePlatformSales, setOnlinePlatformSales,
    onlineSelectedPlatforms, setOnlineSelectedPlatforms, onlineSelectedCourier, setOnlineSelectedCourier,
    onlineMonthlyParcels, setOnlineMonthlyParcels, router, copy,
    fexpFormOpen, setFexpFormOpen, fexpEditId, setFexpEditId, fexpName, setFexpName,
    fexpAmount, setFexpAmount, fexpDueDay, setFexpDueDay, fexpCategory, setFexpCategory,
    businessHealthScore, flushStoreData, persistenceReady,
    roadmap, completedCount, pathTotalStages, correctedProgressPercent,
    currentStage, localizedCurrentStage,
    softOpenChecks, softOpenSkips, softOpenPricing, setSoftOpenPricing,
    opsSelections, setOpsSelections, vendorSelections, vendorCustomInputs,
    selectedBudget,
    savedFinanceSnapshot, selectedIndustryCategoryId, selectedFranchiseBrandId,
    aiActions, aiActionsLoading, fetchAiActions,
    isDigitalCategory, showFinancePanel, setShowFinancePanel,
  } = d;
  const ko = language === "ko";
  const aiLoadedRef = useRef(false);

  // AI 코치 자동 로드 (렌더링 중 setState 방지 — useEffect에서 1회만)
  useEffect(() => {
    if (!aiLoadedRef.current && !aiActions && !aiActionsLoading && storeName && businessLaunched) {
      aiLoadedRef.current = true;
      const timer = setTimeout(() => fetchAiActions(), 500);
      return () => clearTimeout(timer);
    }
  }, [aiActions, aiActionsLoading, storeName, businessLaunched]);


        // ── Derived metrics (kept for KPI bar + remaining inline cards) ──
        const currentMonth = new Date().toISOString().slice(0, 7);
        type DE = { date: string; sales: number; customers: number };
        const monthEntries = (dailyEntries as DE[]).filter((e) => e.date.startsWith(currentMonth));
        const totalSales = monthEntries.reduce((s, e) => s + e.sales, 0);
        const totalCustomers = monthEntries.reduce((s, e) => s + e.customers, 0);
        const workingDays = monthEntries.length;
        const { ingredients, labor, rent, utilities, sga, marketing, other, interest } = monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number };
        const totalCosts = (ingredients ?? 0) + (labor ?? 0) + (rent ?? 0) + (utilities ?? 0) + (sga ?? 0) + (marketing ?? 0) + (other ?? 0) + (interest ?? 0);
        const netProfit = totalSales - totalCosts;
        const bepProgress = totalCosts > 0 ? Math.min(100, (totalSales / totalCosts) * 100) : 0;

        const fmt = (n: number) => n >= 10000
          ? `${Math.round(n / 10000).toLocaleString()}만원`
          : `${Math.round(n).toLocaleString()}원`;

        const inputStyle = {
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "15px",
          outline: "none",
          background: "rgba(255,255,255,0.8)",
          width: "100%",
          boxSizing: "border-box" as const
        };

        // ── 가게 카드 목록 뷰 ──
        if (selectedStoreIndex === null) {
          // 업종 라벨 — 3단 fallback: 세부업종 → profile 세부업종 → selectedIndustryId → 11 대분류
          const industryId = decisions["industry-selection"]?.selectedPrimaryOptionId
            ?? profile?.subIndustryId
            ?? selectedIndustryId;
          const CATEGORY_LABELS_KO: Record<string, string> = {
            food: "외식업", "cafe-dessert": "카페·디저트", retail: "소매",
            beauty: "뷰티", pet: "펫", fitness: "피트니스", education: "교육",
            space: "공유공간", "online-digital": "온라인", "startup-tech": "스타트업",
            "living-service": "생활서비스",
          };
          const CATEGORY_LABELS_EN: Record<string, string> = {
            food: "Restaurant", "cafe-dessert": "Cafe & Dessert", retail: "Retail",
            beauty: "Beauty", pet: "Pet", fitness: "Fitness", education: "Education",
            space: "Space & Stay", "online-digital": "Online & Digital",
            "startup-tech": "Tech Startup", "living-service": "Living Service",
          };
          const industryLabel = industryId
            ? localizeRecommendationItem({ id: industryId, title: industryId }, language).title
            : industryCategoryId
              ? (ko ? (CATEGORY_LABELS_KO[industryCategoryId] ?? industryCategoryId) : (CATEGORY_LABELS_EN[industryCategoryId] ?? industryCategoryId))
              : null;

          // 진행률 — path-filtered completedCount 사용 (운영 대시보드와 일관)
          // businessLaunched면 항상 100% (오픈한 순간 준비 완료로 간주)
          const progressPct = businessLaunched
            ? 100
            : pathTotalStages > 0 ? Math.min(100, Math.round((completedCount / pathTotalStages) * 100)) : 0;

          return (
            <section style={styles.section}>
              <div style={styles.sectionTitle} role="heading" aria-level={2}>{ko ? "내 가게" : "My Stores"}</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>

                {/* ── 현재 가게 카드 ── */}
                <button
                  type="button"
                  onClick={() => setSelectedStoreIndex(0)}
                  aria-label={ko ? "현재 가게 선택" : "Select current store"}
                  style={{
                    display: "block", width: "100%", textAlign: "left" as const,
                    background: "#fff", borderRadius: "18px",
                    border: "1px solid rgba(0,0,0,0.10)",
                    padding: "22px 22px 20px", cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                >
                  {/* 상단: 상호명 + 상태 뱃지 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div style={{ fontSize: "21px", fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                      {storeName || (ko ? "내 가게" : "My Store")}
                    </div>
                    <div style={{
                      fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px",
                      background: businessLaunched ? "rgba(52,199,89,0.10)" : "rgba(0,0,0,0.05)",
                      color: businessLaunched ? "#248a3d" : "var(--muted)",
                      flexShrink: 0, marginLeft: "10px",
                    }}>
                      {businessLaunched ? (ko ? "운영 중" : "Open") : (ko ? "준비 중" : "Preparing")}
                    </div>
                  </div>

                  {/* 업종 레이블 */}
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "20px", letterSpacing: "0.01em" }}>
                    {industryLabel ?? (ko ? "업종 미설정" : "Industry not set")}
                  </div>

                  {/* 진행률 + 단계/상태 표시 */}
                  <div style={{ height: "3px", borderRadius: "2px", background: "rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{
                      height: "100%", borderRadius: "2px",
                      background: progressPct >= 100 ? "#1d3557" : "#3b5c8c",
                      width: `${progressPct}%`, transition: "width 0.4s ease",
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                      {businessLaunched
                        ? (ko ? "로드맵 완료 · 운영 중" : "Roadmap done · Operating")
                        : (ko ? `${completedCount}/${pathTotalStages} 단계` : `${completedCount} of ${pathTotalStages} stages`)}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#3b5c8c" }}>
                      {ko ? "자세히 보기" : "View details"} ›
                    </span>
                  </div>
                </button>

                {/* ── 가게 추가 (준비 중) ── */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "18px 22px",
                  background: "rgba(0,0,0,0.02)", borderRadius: "18px",
                  border: "1px dashed rgba(0,0,0,0.13)",
                }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    border: "1.5px dashed rgba(0,0,0,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", fontWeight: 300, color: "rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}>+</div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(0,0,0,0.25)", marginBottom: "2px" }}>
                      {ko ? "가게 추가" : "Add a store"}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 500, color: "rgba(0,0,0,0.18)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                      {ko ? "곧 지원 예정" : "Coming soon"}
                    </div>
                  </div>
                </div>

              </div>
            </section>
          );
        }


  return (
    <>
            <section style={styles.section}>
              {/* ── 뒤로가기 ── */}
              <button
                type="button"
                onClick={() => setSelectedStoreIndex(null)}
                aria-label={language === "ko" ? "내 가게 목록으로 돌아가기" : "Back to My Stores"}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "15px", fontWeight: 400, color: "#3b5c8c",
                  padding: "0", marginBottom: "20px",
                }}
              >
                ‹ {language === "ko" ? "내 가게" : "My Stores"}
              </button>
              {/* ── 상단: 가게명 + 상태 + KPI 한눈에 ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, letterSpacing: "-0.03em" }}>
                    {storeName || (language === "ko" ? "내 가게" : "My Store")}
                  </div>
                  <div style={{
                    fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px",
                    background: businessLaunched ? "rgba(52,199,89,0.10)" : "rgba(0,0,0,0.05)",
                    color: businessLaunched ? "#248a3d" : "var(--muted)",
                  }}>
                    {businessLaunched ? (language === "ko" ? "운영 중" : "Open") : (language === "ko" ? "준비 중" : "Preparing")}
                  </div>
                </div>
              </div>

              {/* ── KPI 요약 바 (매출 / 비용 / 순이익 / BEP) ── */}
              {totalSales > 0 && (
                <div className="card-grid-responsive" style={{
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px",
                  marginBottom: "8px",
                }}>
                  {[
                    { label: language === "ko" ? "이달 매출" : "Revenue", value: fmt(totalSales), color: "#1d3557" },
                    { label: language === "ko" ? "총 비용" : "Costs", value: fmt(totalCosts), color: "#5b616e" },
                    { label: language === "ko" ? "순이익" : "Net Profit", value: `${netProfit >= 0 ? "+" : ""}${fmt(netProfit)}`, color: netProfit >= 0 ? "#1d3557" : "#b64c4c" },
                    { label: language === "ko" ? "손익분기" : "BEP", value: `${bepProgress.toFixed(0)}%`, color: bepProgress >= 100 ? "#1d3557" : bepProgress >= 70 ? "#191970" : "#b64c4c" },
                  ].map((kpi) => (
                    <div key={kpi.label} style={{
                      padding: "14px 16px", borderRadius: "18px",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78))",
                      border: "1px solid rgba(17,17,17,0.06)",
                      backdropFilter: "blur(12px)",
                    }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.04em", marginBottom: "4px" }}>{kpi.label}</div>
                      <div style={{ fontSize: "20px", fontWeight: 720, color: kpi.color, letterSpacing: "-0.03em" }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── AI 오늘 할 일 카드 ── */}
              <AiCoachCard />

              {/* ── 월 비용 확인 프롬프트 ── */}
              {showMonthlyCostPrompt && (() => {
                const lastSnap = costHistory.length > 0 ? (costHistory as { month: string; ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number }[]).sort((a, b) => b.month.localeCompare(a.month))[0] : null;
                return (
                  <article style={{ ...styles.card, padding: "18px 22px", background: "linear-gradient(135deg, rgba(59,92,140,0.04), rgba(52,199,89,0.04))", border: "1px solid rgba(59,92,140,0.12)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                          {ko ? "지난달 비용을 확인해주세요" : "Review last month's costs"}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                          {ko ? "비용 추세를 정확히 추적하려면 매달 업데이트가 필요합니다." : "Monthly updates are needed for accurate cost trend tracking."}
                        </div>
                      </div>
                      <button type="button" onClick={() => setShowMonthlyCostPrompt(false)}
                        aria-label={ko ? "비용 확인 닫기" : "Dismiss cost prompt"}
                        style={{ fontSize: "13px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0 }}>✕</button>
                    </div>
                    {lastSnap && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" as const }}>
                        <button type="button" onClick={() => {
                          setCostIngredientsText(String(Math.round(lastSnap.ingredients / 10000)));
                          setCostLaborText(String(Math.round(lastSnap.labor / 10000)));
                          setCostRentText(String(Math.round(lastSnap.rent / 10000)));
                          setCostUtilitiesText(String(Math.round(lastSnap.utilities / 10000)));
                          setCostOtherText(String(Math.round(lastSnap.other / 10000)));
                          handleSaveMonthlyCosts();
                          setShowMonthlyCostPrompt(false);
                        }}
                          style={{ ...styles.primaryButton, fontSize: "13px", padding: "10px 18px" }}>
                          {ko ? "지난달과 동일" : "Same as last month"}
                        </button>
                        <button type="button" onClick={() => {
                          setCostIngredientsText(String(Math.round(lastSnap.ingredients / 10000)));
                          setCostLaborText(String(Math.round(lastSnap.labor / 10000)));
                          setCostRentText(String(Math.round(lastSnap.rent / 10000)));
                          setCostUtilitiesText(String(Math.round(lastSnap.utilities / 10000)));
                          setCostOtherText(String(Math.round(lastSnap.other / 10000)));
                          setShowMonthlyCostPrompt(false);
                          navigateToSurface("analytics");
                        }}
                          style={{ ...styles.button, fontSize: "13px", padding: "10px 18px" }}>
                          {ko ? "수정하기" : "Edit costs"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })()}

              {/* ── 매출 현황 + 입력 통합 카드 ── */}
              <DailySalesInputCard />

              {/* ── 주간 매출 요약 ── */}
              <WeeklySummaryCard />

              {/* ── 2컬럼 레이아웃 ── */}
              <div className="card-grid-responsive" style={{ display: "grid", gridTemplateColumns: "minmax(0, 340px) minmax(0, 1fr)", gap: "16px", alignItems: "stretch" }}>

              {/* ════ LEFT COLUMN ════ */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>

              {/* ── 사업 프로필 대시보드 ── */}
              <LaunchRoadmapCard />

              {/* ── 펀딩·대출 정보 카드 ── */}
              {(() => {
                const allMatched = getMatchedProgramsV2({ startupType, industryCategoryId: selectedIndustryCategoryId });
                const programs = allMatched.filter(p => p.eligible).slice(0, 10);
                const highlights = getMatchedHighlights(startupType);
                if (programs.length === 0) return null;
                return (
                  <article style={{
                    ...styles.card, padding: "0", overflow: "hidden" as const,
                    border: "1px solid rgba(29,53,87,0.06)",
                    background: "linear-gradient(160deg, rgba(240,244,255,0.6) 0%, rgba(255,255,255,0.95) 100%)",
                  }}>
                    <div style={{ padding: "18px 20px 14px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "4px" }}>
                        {ko ? "펀딩" : "Funding"}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                        {ko ? "내 사업에 맞는 프로그램" : "Programs matched to your business"}
                      </div>
                    </div>
                    {highlights.length > 0 && (
                      <div style={{ padding: "0 20px 10px", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                        {highlights.slice(0, 2).map(h => (
                          <div key={h.id} style={{
                            fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px",
                            background: "rgba(29,53,87,0.06)", color: "var(--primary)",
                          }}>
                            {h.highlight ? (ko ? h.name.ko : h.name.en) : (ko ? h.name.ko : h.name.en)}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column" as const, gap: "1px", overflow: "hidden" as const }}>
                      {programs.map(prog => {
                        const catColor = getProgramCategoryColor(prog.category);
                        const catLabel = getProgramCategoryLabel(prog.category, language);
                        return (
                          <a key={prog.id} href={prog.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              padding: "10px 10px", borderRadius: "10px",
                              textDecoration: "none", color: "inherit",
                              transition: "background 0.15s",
                              overflow: "hidden" as const,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <div style={{ display: "flex", flexDirection: "column" as const, gap: "2px", flexShrink: 0 }}>
                              <div style={{
                                padding: "2px 7px", borderRadius: "5px", fontSize: "9px", fontWeight: 700,
                                background: `${catColor}14`, color: catColor,
                                letterSpacing: "0.02em",
                              }}>
                                {catLabel}
                              </div>
                              {prog.applicationStatus && (() => {
                                const st = getApplicationStatusLabel(prog.applicationStatus, language);
                                return (
                                  <div style={{ padding: "2px 7px", borderRadius: "5px", fontSize: "9px", fontWeight: 700, background: `${st.color}14`, color: st.color, letterSpacing: "0.02em", textAlign: "center" as const }}>
                                    {st.label}
                                  </div>
                                );
                              })()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                {ko ? prog.name.ko : prog.name.en}
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                {ko ? prog.benefit.ko : prog.benefit.en}
                              </div>
                              {prog.requiredDocs && prog.requiredDocs.length > 0 && (
                                <div style={{ fontSize: "10px", color: "rgba(59,92,140,0.7)", marginTop: "2px" }}>
                                  {ko ? "서류: " : "Docs: "}{prog.requiredDocs.map(d => ko ? d.ko : d.en).join(" · ")}
                                </div>
                              )}
                            </div>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0, color: "rgba(0,0,0,0.2)" }}>
                              <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </a>
                        );
                      })}
                    </div>
                    <div style={{ padding: "0 20px 14px" }}>
                      <button type="button" onClick={() => navigateToSurface("guides")}
                        style={{ fontSize: "12px", fontWeight: 600, color: "#3b5c8c", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        {ko ? "전체 펀딩 보기 →" : "View all funding →"}
                      </button>
                    </div>
                  </article>
                );
              })()}

              </div>{/* END LEFT COLUMN */}

              {/* ════ RIGHT COLUMN ════ */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "14px" }}>

              {/* ── 이달 손익 히어로 카드 ── */}
              <MonthlyPLCard />

              {/* ── 재고/소모품 현황 ── */}
              <InventoryManagementCard />

              {/* ── 직원 인건비 계산기 ── */}
              <StaffLaborCard />

              {/* ── 배달/배송 플랫폼 수수료 분석 ── */}
              <DeliveryPlatformCard />

              {/* ── 온라인 플랫폼 수수료 + 택배사 (online-digital only) ── */}
              {businessCtx.isOnlineStore && (() => {
                const fmtO = (n: number) => n >= 10000
                  ? `${Math.round(n / 10000).toLocaleString()}만원`
                  : `${Math.round(n).toLocaleString()}원`;

                // 플랫폼 수수료 데이터 (2026 기준)
                const platforms = [
                  { id: "smartstore", name: ko ? "스마트스토어" : "SmartStore", rate: 2.0, adBase: 0, note: ko ? "결제 수수료 별도" : "+payment fee" },
                  { id: "coupang", name: ko ? "쿠팡 로켓그로스" : "Coupang", rate: 10.8, adBase: 0, note: ko ? "카테고리별 4~15%" : "4–15% by category" },
                  { id: "gmarket", name: ko ? "G마켓/옥션" : "G마켓", rate: 9.0, adBase: 0, note: ko ? "일반 판매 기준" : "standard seller" },
                  { id: "29cm", name: "29CM", rate: 12.0, adBase: 0, note: ko ? "패션/라이프스타일" : "fashion/lifestyle" },
                  { id: "kakao", name: ko ? "카카오쇼핑" : "Kakao Shopping", rate: 5.5, adBase: 0, note: ko ? "톡스토어 기준" : "Talk Store" },
                ];
                const couriers = [
                  { id: "cj", name: ko ? "CJ대한통운" : "CJ Logistics", base: 3000, perKg: 500, note: ko ? "2.5kg 기준 3,000원" : "3,000₩ up to 2.5kg" },
                  { id: "hanjin", name: ko ? "한진택배" : "Hanjin", base: 3000, perKg: 500, note: ko ? "기본 3,000원~" : "from 3,000₩" },
                  { id: "lotte", name: ko ? "롯데택배" : "Lotte", base: 3500, perKg: 500, note: ko ? "기본 3,500원~" : "from 3,500₩" },
                  { id: "post", name: ko ? "우체국택배" : "Korea Post", base: 4000, perKg: 600, note: ko ? "일반소포 기준" : "standard parcel" },
                ];

                const selectedPlatform = onlineSelectedPlatforms[0] ?? "";
                const setSelectedPlatform = (id: string) => setOnlineSelectedPlatforms([id]);
                const monthlySales = onlinePlatformSales[selectedPlatform] ?? "";
                const setMonthlySales = (val: string) =>
                  setOnlinePlatformSales({ ...onlinePlatformSales, [selectedPlatform]: val });
                const selectedCourier = onlineSelectedCourier;
                const setSelectedCourier = setOnlineSelectedCourier;
                const monthlyParcels = onlineMonthlyParcels;
                const setMonthlyParcels = setOnlineMonthlyParcels;

                const parcelCount = parseInt(monthlyParcels) || 0;
                const courier = couriers.find(c => c.id === selectedCourier) ?? couriers[0];
                const totalShipping = parcelCount * courier.base;

                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
                    {/* 헤더 */}
                    <div style={{ padding: "18px 22px 14px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                        {ko ? "온라인 채널 비용 분석" : "Online Channel Costs"}
                      </div>
                    </div>

                    {/* 플랫폼 선택 */}
                    <div style={{ padding: "14px 22px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)" }}>{ko ? "판매 플랫폼" : "Sales Platform"}</div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                        {platforms.map(p => {
                          const active = selectedPlatform === p.id;
                          return (
                            <button key={p.id} type="button" onClick={() => setSelectedPlatform(p.id)}
                              style={{ fontSize: "12px", fontWeight: active ? 700 : 500, padding: "6px 14px", borderRadius: "12px", border: active ? "1px solid #3b5c8c" : "1px solid rgba(0,0,0,0.10)", background: active ? "rgba(59,92,140,0.08)" : "transparent", color: active ? "#3b5c8c" : "var(--muted)", cursor: "pointer" }}>
                              {p.name}
                            </button>
                          );
                        })}
                      </div>
                      {selectedPlatform && (() => {
                        const p = platforms.find(x => x.id === selectedPlatform);
                        if (!p) return null;
                        const sales = parseInt(monthlySales) || 0;
                        const fee = Math.round(sales * 10000 * p.rate / 100);
                        return (
                          <div style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)", marginTop: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                              <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "수수료율" : "Fee rate"}</span>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: "#3b5c8c" }}>{p.rate}%</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <input type="text" inputMode="numeric" value={monthlySales}
                                onChange={(e) => setMonthlySales(e.target.value.replace(/[^0-9]/g, ""))}
                                placeholder={ko ? "월 매출 (만원)" : "Monthly sales (10K)"}
                                style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "8px 12px", fontSize: "14px", outline: "none", background: "rgba(255,255,255,0.9)", flex: 1, boxSizing: "border-box" as const }} />
                              <div style={{ fontSize: "13px", fontWeight: 600, color: sales > 0 ? "#b64c4c" : "var(--muted)", flexShrink: 0 }}>
                                {sales > 0 ? `−${fmtO(fee)}` : "—"}
                              </div>
                            </div>
                            {p.note && <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>{p.note}</div>}
                          </div>
                        );
                      })()}
                    </div>

                    {/* 택배사 선택 */}
                    <div style={{ padding: "0 22px 16px", display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)" }}>{ko ? "택배사" : "Courier"}</div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                        {couriers.map(c => {
                          const active = selectedCourier === c.id;
                          return (
                            <button key={c.id} type="button" onClick={() => setSelectedCourier(c.id)}
                              style={{ fontSize: "12px", fontWeight: active ? 700 : 500, padding: "6px 14px", borderRadius: "12px", border: active ? "1px solid #3b5c8c" : "1px solid rgba(0,0,0,0.10)", background: active ? "rgba(59,92,140,0.08)" : "transparent", color: active ? "#3b5c8c" : "var(--muted)", cursor: "pointer" }}>
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="text" inputMode="numeric" value={monthlyParcels}
                          onChange={(e) => setMonthlyParcels(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder={ko ? "월 택배 건수" : "Monthly parcels"}
                          style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "8px 12px", fontSize: "14px", outline: "none", background: "rgba(255,255,255,0.9)", flex: 1, boxSizing: "border-box" as const }} />
                        <div style={{ fontSize: "13px", fontWeight: 600, color: parcelCount > 0 ? "#b64c4c" : "var(--muted)", flexShrink: 0 }}>
                          {parcelCount > 0 ? `−${fmtO(totalShipping)}` : "—"}
                        </div>
                      </div>
                      {parcelCount > 0 && (
                        <div style={{ fontSize: "11px", color: "var(--muted)", padding: "4px 0" }}>
                          {ko ? `건당 ${courier.base.toLocaleString()}원 × ${parcelCount}건` : `${courier.base.toLocaleString()}₩ × ${parcelCount}`}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })()}

              {/* ── 메뉴 · 상품 관리 ── */}
              <ProductPerformanceCard />

              {/* ── 수강생 · 회원 관리 ── */}
              <MemberManagementCard />

              {/* ── AI 사업계획서 ── */}
              <BusinessPlanCard />

              {/* 매출 입력은 상단 7일 차트 카드에 통합됨 */}

              {/* ── 세금 · 납부 D-day 캘린더 ── */}
              {(() => {
                const now = new Date();
                const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const diffDays = (d: Date) => {
                  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                  return Math.round((target - todayMs) / 86400000);
                };
                const year = now.getFullYear();
                const month = now.getMonth();

                const vatType = (taxSettings?.vatType as string) ?? "simplified";
                const hasEmployees = taxSettings?.hasEmployees ?? false;

                // 부가세 확정 신고일 (간이: 1월 25일, 일반: 1·7월 25일)
                const nextVatMonth = vatType === "general"
                  ? (month < 6 ? 6 : 12)
                  : (month < 0 ? 0 : 12);
                const vatDate = new Date(nextVatMonth >= 12 ? year + 1 : year, nextVatMonth >= 12 ? 0 : nextVatMonth, 25);
                const vatSub = vatType === "general"
                  ? (ko ? "일반과세자 — 1·7월 25일" : "General VAT — Jan & Jul 25")
                  : (ko ? "간이과세자 — 매년 1월 25일" : "Simplified VAT — Jan 25");
                const vatProvisionalDate = new Date(month < 3 ? year : month < 9 ? year : year + 1, month < 3 ? 3 : month < 9 ? 9 : 3, 25);

                // 종합소득세
                const incomeTaxDate = new Date(month < 4 ? year : year + 1, 4, 31);

                // 원천세 (직원이 있는 경우)
                const withholdingDate = new Date(year, month + 1, 10);
                if (withholdingDate.getTime() < todayMs) withholdingDate.setMonth(withholdingDate.getMonth() + 1);

                // 4대보험 (직원)
                const insuranceDate = new Date(year, month + 1, 10);
                if (insuranceDate.getTime() < todayMs) insuranceDate.setMonth(insuranceDate.getMonth() + 1);

                // 산재보험료 정산
                const industrialDate = new Date(month < 2 ? year : year + 1, 2, 31);

                const allEvents = [
                  ...(hasEmployees ? [
                    { label: ko ? "원천세 납부" : "Withholding tax", sub: ko ? "매월 10일" : "Monthly 10th", date: withholdingDate, icon: "원", color: "#3b5c8c", alwaysShow: false, url: "https://www.hometax.go.kr", urlLabel: ko ? "홈택스 신고" : "File on HomeTax" },
                    { label: ko ? "4대보험료 납부" : "Social insurance", sub: ko ? "매월 10일" : "Monthly 10th", date: insuranceDate, icon: "4", color: "#1d3557", alwaysShow: false, url: "https://www.4insure.or.kr", urlLabel: ko ? "4대보험 포털" : "4 Insurance" },
                  ] : []),
                  { label: ko ? "부가세 확정신고" : "VAT filing", sub: vatSub, date: vatDate, icon: "부", color: "#191970", alwaysShow: true, url: "https://www.hometax.go.kr", urlLabel: ko ? "홈택스 신고" : "File on HomeTax" },
                  ...(vatType === "general" ? [
                    { label: ko ? "부가세 예정신고" : "VAT provisional", sub: ko ? "일반과세자 — 4·10월 25일" : "General VAT — Apr & Oct 25", date: vatProvisionalDate, icon: "예", color: "#ff6b00", alwaysShow: false, url: "https://www.hometax.go.kr", urlLabel: ko ? "홈택스 신고" : "File on HomeTax" },
                  ] : []),
                  { label: ko ? "종합소득세" : "Income tax", sub: ko ? "매년 5월 31일" : "May 31 annually", date: incomeTaxDate, icon: "소", color: "#af52de", alwaysShow: true, url: "https://www.hometax.go.kr", urlLabel: ko ? "홈택스 신고" : "File on HomeTax" },
                  { label: ko ? "산재보험료 정산" : "Industrial accident ins.", sub: ko ? "매년 3월 31일" : "March 31 annually", date: industrialDate, icon: "산", color: "#5856d6", alwaysShow: false, url: "https://www.comwel.or.kr", urlLabel: ko ? "근로복지공단" : "COMWEL" },
                ].sort((a, b) => diffDays(a.date) - diffDays(b.date));

                const urgencyColor = (d: Date) => {
                  const n = diffDays(d);
                  return n < 0 ? "rgba(0,0,0,0.25)" : n <= 7 ? "#b64c4c" : n <= 30 ? "#191970" : "var(--muted)";
                };
                const dLabel = (d: Date) => {
                  const n = diffDays(d);
                  if (n === 0) return ko ? "오늘" : "Today";
                  if (n < 0) return ko ? `${Math.abs(n)}일 전` : `${Math.abs(n)}d ago`;
                  return `D-${n}`;
                };
                const dateLabel = (d: Date) =>
                  d.toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric" });

                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0", flex: 1 }}>
                    {/* 헤더 + 사업자 유형 설정 */}
                    <div style={{ padding: "18px 22px 14px", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "12px" }}>
                        {ko ? "세금 · 납부 일정" : "Tax Calendar"}
                      </div>
                      {/* 설정 토글 2행 */}
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                        {/* 과세 유형 */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)" }}>{ko ? "과세 유형" : "VAT type"}</span>
                          <div style={{ display: "flex", gap: "4px" }} role="radiogroup" aria-label={ko ? "과세 유형" : "VAT type"}>
                            {(["general", "simplified"] as const).map(type => {
                              const active = vatType === type;
                              const label = ko ? (type === "general" ? "일반과세자" : "간이과세자") : (type === "general" ? "General" : "Simplified");
                              return (
                                <button key={type} type="button"
                                  role="radio" aria-checked={active}
                                  onClick={() => saveTaxSettings({ ...taxSettings, vatType: type })}
                                  style={{ fontSize: "11px", fontWeight: 600, padding: "5px 12px", borderRadius: "16px", border: `1px solid ${active ? "#3b5c8c" : "rgba(0,0,0,0.12)"}`, background: active ? "rgba(59,92,140,0.10)" : "transparent", color: active ? "#3b5c8c" : "var(--muted)", cursor: "pointer" }}>
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {/* 직원 유무 */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)" }}>{ko ? "직원 유무" : "Employees"}</span>
                          <div style={{ display: "flex", gap: "4px" }} role="radiogroup" aria-label={ko ? "직원 유무" : "Has employees"}>
                            {([true, false] as const).map(v => {
                              const active = hasEmployees === v;
                              const label = ko ? (v ? "있음" : "없음") : (v ? "Yes" : "No");
                              return (
                                <button key={String(v)} type="button"
                                  role="radio" aria-checked={active}
                                  onClick={() => saveTaxSettings({ ...taxSettings, hasEmployees: v })}
                                  style={{ fontSize: "11px", fontWeight: 600, padding: "5px 12px", borderRadius: "16px", border: `1px solid ${active ? "#3b5c8c" : "rgba(0,0,0,0.12)"}`, background: active ? "rgba(59,92,140,0.10)" : "transparent", color: active ? "#3b5c8c" : "var(--muted)", cursor: "pointer" }}>
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* 세금 이벤트 목록 */}
                    {allEvents.map((ev, idx) => {
                      const days = diffDays(ev.date);
                      const isUrgent = days >= 0 && days <= 14;
                      return (
                      <div key={`${ev.label}-${idx}`} style={{
                        display: "flex", alignItems: "center", gap: "14px", padding: "13px 22px",
                        borderBottom: idx < allEvents.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
                        opacity: days < 0 ? 0.45 : 1,
                        background: isUrgent ? `${ev.color}06` : "transparent",
                      }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: ev.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff" }}>
                          {ev.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>{ev.label}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>{ev.sub}</div>
                          {isUrgent && ev.url && (
                            <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{
                              display: "inline-flex", alignItems: "center", gap: "3px", marginTop: "4px",
                              fontSize: "11px", fontWeight: 600, color: ev.color, textDecoration: "none"
                            }}>
                              {ev.urlLabel} ↗
                            </a>
                          )}
                        </div>
                        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: urgencyColor(ev.date), letterSpacing: "-0.2px" }}>
                            {dLabel(ev.date)}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
                            {dateLabel(ev.date)}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                    {/* 유용한 링크 */}
                    <div style={{ padding: "12px 22px 16px", borderTop: "0.5px solid rgba(0,0,0,0.06)", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                      {[
                        { label: ko ? "홈택스" : "HomeTax", url: "https://www.hometax.go.kr", color: "#5856d6" },
                        { label: ko ? "4대보험 포털" : "4 Insurance", url: "https://www.4insure.or.kr", color: "#1d3557" },
                        { label: ko ? "근로복지공단" : "COMWEL", url: "https://www.comwel.or.kr", color: "#3b5c8c" },
                        { label: ko ? "캐시노트" : "CashNote", url: "https://cashnote.kr", color: "#191970" },
                      ].map(link => (
                        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px",
                          borderRadius: "999px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)",
                          fontSize: "11px", fontWeight: 600, color: link.color, textDecoration: "none"
                        }}>
                          {link.label} ↗
                        </a>
                      ))}
                    </div>
                  </article>
                );
              })()}
              {/* ── 이번 달 비용 (통합: 변동비 + 고정비 + 고정 지출 D-day) ── */}
              {(() => {
                const now = new Date();
                const today = now.getDate();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const fmtD = (n: number) => n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}만원` : `${Math.round(n).toLocaleString()}원`;
                const catIcon: Record<string, LucideIcon> = { rent: Home, loan: Landmark, insurance: Shield, other: ClipboardList };
                const catColor: Record<string, string> = { rent: "#7c3aed", loan: "#6366f1", insurance: "#0891b2", other: "#64748b" };
                const catLabel: Record<string, { ko: string; en: string }> = {
                  rent: { ko: "임대료", en: "Rent" }, loan: { ko: "대출", en: "Loan" },
                  insurance: { ko: "보험", en: "Insurance" }, other: { ko: "기타", en: "Other" },
                };

                type FixedExpense = { id: string; name: string; amount: number; dueDay: number; category: string };

                return (
                  <article style={{ ...styles.card, padding: "0", overflow: "hidden" as const, gap: "0" }}>
                    {/* 헤더 + 합계 */}
                    <div style={{ padding: "18px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                        {ko ? "이번 달 비용" : "Monthly Costs"}
                      </div>
                      {totalCosts > 0 && (
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{fmtD(totalCosts)}</div>
                      )}
                    </div>

                    {/* 비용 구조 시각화 바 */}
                    {totalCosts > 0 && (
                      <div style={{ padding: "0 22px 14px" }}>
                        {/* 스택 바 */}
                        <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "10px" }}>
                          {[
                            { value: ingredients, color: "#3a5f8a" },
                            { value: labor, color: "#1d3557" },
                            { value: rent, color: "#191970" },
                            { value: utilities, color: "#6e8fb8" },
                            { value: sga ?? 0, color: "#8a7fb0" },
                            { value: marketing ?? 0, color: "#b07da6" },
                            { value: other, color: "#8e8e93" },
                            { value: interest ?? 0, color: "#b64c4c" },
                          ].filter(r => r.value > 0).map((r, i) => (
                            <div key={i} style={{ width: `${(r.value / totalCosts) * 100}%`, background: r.color, minWidth: "2px" }} />
                          ))}
                        </div>
                        {/* 범례 */}
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px 14px" }}>
                          {[
                            { label: ko ? "재료비" : "COGS", value: ingredients, color: "#3a5f8a" },
                            { label: ko ? "인건비" : "Labor", value: labor, color: "#1d3557" },
                            { label: ko ? "임대료" : "Rent", value: rent, color: "#191970" },
                            { label: ko ? "공과금" : "Util.", value: utilities, color: "#6e8fb8" },
                            { label: ko ? "운영비" : "SGA", value: sga ?? 0, color: "#8a7fb0" },
                            { label: ko ? "마케팅" : "Mktg.", value: marketing ?? 0, color: "#b07da6" },
                            { label: ko ? "기타" : "Other", value: other, color: "#8e8e93" },
                            { label: ko ? "이자" : "Interest", value: interest ?? 0, color: "#b64c4c" },
                          ].filter(r => r.value > 0).map(r => (
                            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "2px", background: r.color }} />
                              <span style={{ fontSize: "11px", color: "var(--muted)" }}>{r.label}</span>
                              <span style={{ fontSize: "11px", fontWeight: 600 }}>{fmtD(r.value)}</span>
                              <span style={{ fontSize: "10px", color: "var(--muted)" }}>({((r.value / totalCosts) * 100).toFixed(0)}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 비용 추세 (2개월 이상 이력) */}
                    {costHistory.length >= 2 && (() => {
                      const sorted = [...(costHistory as { month: string; ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number }[])].sort((a, b) => a.month.localeCompare(b.month)).slice(-3);
                      const totals = sorted.map(s => (s.ingredients ?? 0) + (s.labor ?? 0) + (s.rent ?? 0) + (s.utilities ?? 0) + (s.sga ?? 0) + (s.marketing ?? 0) + (s.other ?? 0) + (s.interest ?? 0));
                      const maxT = Math.max(...totals, 1);
                      const latest = sorted[sorted.length - 1];
                      const prevT = totals[totals.length - 2];
                      const latestT = totals[totals.length - 1];
                      const changePct = prevT > 0 ? Math.round((latestT - prevT) / prevT * 100) : 0;
                      const monthlyRev = (dailyEntries as { sales: number }[]).reduce((s, e) => s + e.sales, 0);
                      const ingRatio = monthlyRev > 0 ? Math.round(latest.ingredients / monthlyRev * 100) : 0;
                      const labRatio = monthlyRev > 0 ? Math.round(latest.labor / monthlyRev * 100) : 0;
                      return (
                        <div style={{ padding: "14px 22px", borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "10px" }}>
                            {ko ? "비용 추세" : "Cost Trend"}
                            {changePct !== 0 && (
                              <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 700, color: changePct > 0 ? "#b64c4c" : "#1d3557" }}>
                                {changePct > 0 ? "↑" : "↓"} {Math.abs(changePct)}%
                              </span>
                            )}
                          </div>
                          {/* 미니 바 차트 */}
                          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "40px", marginBottom: "10px" }}>
                            {sorted.map((s, i) => {
                              const h = Math.max(4, (totals[i] / maxT) * 36);
                              const isLatest = i === sorted.length - 1;
                              return (
                                <div key={s.month} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "3px" }}>
                                  <div style={{ fontSize: "9px", fontWeight: 600, color: isLatest ? "var(--text)" : "var(--muted)" }}>
                                    {fmtD(totals[i])}
                                  </div>
                                  <div style={{ width: "100%", height: `${h}px`, borderRadius: "4px", background: isLatest ? "#3b5c8c" : "rgba(59,92,140,0.15)" }} />
                                  <div style={{ fontSize: "9px", color: "var(--muted)" }}>{s.month.slice(5)}{ko ? "월" : ""}</div>
                                </div>
                              );
                            })}
                          </div>
                          {/* 원가율 경고 */}
                          {monthlyRev > 0 && (ingRatio > 35 || labRatio > 30) && (
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                              {ingRatio > 35 && (
                                <div style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px", background: "rgba(182,76,76,0.08)", color: "#b64c4c" }}>
                                  {ko ? `재료비율 ${ingRatio}% — 35% 초과` : `COGS ${ingRatio}% — over 35%`}
                                </div>
                              )}
                              {labRatio > 30 && (
                                <div style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px", background: "rgba(255,149,0,0.08)", color: "#191970" }}>
                                  {ko ? `인건비율 ${labRatio}% — 30% 초과` : `Labor ${labRatio}% — over 30%`}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 구분선 */}
                    {totalCosts > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)" }} />}

                    {/* 비용 입력 필드 (업종별 동적 레이블) */}
                    <div style={{ padding: "0 22px 16px", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                      {(() => {
                        const textMap: Record<string, string> = { ingredients: costIngredientsText ?? "", labor: costLaborText ?? "", rent: costRentText ?? "", utilities: costUtilitiesText ?? "", other: costOtherText ?? "" };
                        const setMap: Record<string, (v: string) => void> = { ingredients: setCostIngredientsText, labor: setCostLaborText, rent: setCostRentText, utilities: setCostUtilitiesText, other: setCostOtherText };
                        return (businessCtx.expenseFields ?? [
                          { fieldKey: "ingredients", label: { ko: "재료비", en: "Ingredients" }, placeholder: "120", description: { ko: "", en: "" } },
                          { fieldKey: "labor", label: { ko: "인건비", en: "Labor" }, placeholder: "200", description: { ko: "", en: "" } },
                          { fieldKey: "rent", label: { ko: "임대료", en: "Rent" }, placeholder: "80", description: { ko: "", en: "" } },
                          { fieldKey: "utilities", label: { ko: "공과금", en: "Utilities" }, placeholder: "20", description: { ko: "", en: "" } },
                          { fieldKey: "other", label: { ko: "기타", en: "Other" }, placeholder: "15", description: { ko: "", en: "" } },
                        ]).map((field) => ({
                          label: field.label[language] ?? field.label.ko,
                          val: textMap[field.fieldKey] ?? "",
                          set: setMap[field.fieldKey] ?? (() => {}),
                          ph: field.placeholder,
                          desc: field.description?.[language] ?? "",
                        }));
                      })().map((row) => (
                        <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ fontSize: "13px", color: "var(--muted)", width: "80px", flexShrink: 0 }}>{row.label}</div>
                          <input type="text" inputMode="numeric" value={row.val}
                            onChange={(e) => row.set(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder={row.ph}
                            style={inputStyle} />
                        </div>
                      ))}
                      <button type="button" style={{ ...styles.primaryButton, marginTop: "4px" }} onClick={handleSaveMonthlyCosts}>
                        {ko ? "비용 저장" : "Save costs"}
                      </button>
                    </div>

                    {/* 구분선 + 고정 지출 D-day */}
                    <div style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)", padding: "14px 22px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                          {ko ? "고정 지출 납부일" : "Fixed expense due dates"}
                        </div>
                        <button type="button" onClick={() => { setFexpFormOpen(true); setFexpEditId(null); setFexpName(""); setFexpAmount(""); setFexpDueDay(""); setFexpCategory("other"); }}
                          style={{ fontSize: "12px", fontWeight: 600, color: "#3b5c8c", background: "none", border: "none", cursor: "pointer" }}>
                          {ko ? "+ 항목 추가" : "+ Add"}
                        </button>
                      </div>

                      {fixedExpenses.length === 0 ? (
                        <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                          {ko ? "대출이자, 보험료 등 매달 고정 지출을 등록하면 납부일 D-day를 추적합니다." : "Add recurring expenses like loans and insurance to track due dates."}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                          {(fixedExpenses as FixedExpense[]).map(fe => {
                            const effectiveDay = Math.min(fe.dueDay, daysInMonth);
                            const dLeft = effectiveDay >= today ? effectiveDay - today : daysInMonth - today + fe.dueDay;
                            const urgent = dLeft <= 3;
                            return (
                              <div key={fe.id} style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                padding: "8px 10px", borderRadius: "10px",
                                background: urgent ? "rgba(182,76,76,0.04)" : "rgba(0,0,0,0.02)",
                              }}>
                                {(() => {
                                  const CatIcon = catIcon[fe.category] ?? ClipboardList;
                                  return <CatIcon size={16} strokeWidth={1.5} color={catColor[fe.category] ?? "#64748b"} />;
                                })()}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{fe.name}</div>
                                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                                    {ko ? `매월 ${fe.dueDay}일` : `Due ${fe.dueDay}th`} · {fmtD(fe.amount)}
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                                  <div style={{ fontSize: "14px", fontWeight: 700, color: urgent ? "#b64c4c" : dLeft <= 7 ? "#191970" : "var(--text)" }}>
                                    D-{dLeft}
                                  </div>
                                </div>
                                <button type="button" onClick={() => handleFexpDelete(fe.id)}
                                  aria-label={ko ? `${fe.name} 삭제` : `Delete ${fe.name}`}
                                  style={{ fontSize: "11px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "2px", flexShrink: 0 }}>✕</button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 고정 지출 추가 폼 */}
                      {fexpFormOpen && (
                        <div style={{ marginTop: "10px", padding: "12px", borderRadius: "12px", background: "rgba(59,92,140,0.03)", border: "1px solid rgba(59,92,140,0.08)" }}>
                          <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                            <input type="text" placeholder={ko ? "항목명 (예: 대출이자)" : "Name"} value={fexpName} onChange={e => setFexpName(e.target.value)}
                              aria-label={ko ? "고정 지출 항목명" : "Fixed expense name"}
                              style={{ ...inputStyle, fontSize: "14px" }} />
                            <div style={{ display: "flex", gap: "8px" }}>
                              <input type="text" inputMode="numeric" placeholder={ko ? "금액 (만원)" : "Amount"} value={fexpAmount} onChange={e => setFexpAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                aria-label={ko ? "금액 (만원)" : "Amount (10K KRW)"}
                                style={{ ...inputStyle, flex: 1, fontSize: "14px" }} />
                              <input type="text" inputMode="numeric" placeholder={ko ? "납부일 (1~31)" : "Due day"} value={fexpDueDay} onChange={e => setFexpDueDay(e.target.value.replace(/[^0-9]/g, ""))}
                                aria-label={ko ? "납부일 (1~31)" : "Due day (1-31)"}
                                style={{ ...inputStyle, flex: 1, fontSize: "14px" }} />
                            </div>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {(["rent", "loan", "insurance", "other"] as const).map(cat => {
                                const CatIcon = catIcon[cat];
                                return (
                                  <button key={cat} type="button" onClick={() => setFexpCategory(cat)}
                                    style={{ fontSize: "11px", fontWeight: fexpCategory === cat ? 600 : 500, padding: "4px 10px", borderRadius: "8px", border: fexpCategory === cat ? "1px solid var(--primary)" : "1px solid var(--border)", background: fexpCategory === cat ? "rgba(29,53,87,0.06)" : "transparent", color: fexpCategory === cat ? "var(--primary)" : "var(--muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <CatIcon size={12} strokeWidth={1.5} />
                                    {catLabel[cat][language]}
                                  </button>
                                );
                              })}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button type="button" onClick={handleFexpSave} style={{ ...styles.primaryButton, flex: 1, fontSize: "13px" }}>
                                {ko ? "추가" : "Add"}
                              </button>
                              <button type="button" onClick={() => setFexpFormOpen(false)}
                                style={{ ...styles.button, flex: 0, fontSize: "13px", padding: "10px 16px" }}>
                                {ko ? "취소" : "Cancel"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })()}
              </div>{/* END RIGHT COLUMN */}
              </div>{/* END 2-col grid */}
            </section>

            {/* ── 폐업/전환 안내 ── */}
            {businessLaunched && (() => {
              const isDanger = businessHealthScore === "danger";
              const isCaution = businessHealthScore === "caution";
              const mc = monthlyCosts as { ingredients: number; labor: number; rent: number; utilities: number; sga: number; marketing: number; other: number; interest: number };
              const monthlyRent = mc.rent;
              const empCount = (employees as { id: string }[]).length;

              // 폐업 비용 추정
              const remainingLease = monthlyRent * 3;
              const severance = empCount > 0 ? empCount * 2000000 : 0;
              const interiorLoss = (selectedBudget ?? 0) * 0.3;
              const taxSettlement = 500000;
              const totalClosureCost = remainingLease + severance + interiorLoss + taxSettlement;
              const fmtC = (n: number) => n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}만원` : `${Math.round(n).toLocaleString()}원`;

              return (
                <section style={{ ...styles.section, marginTop: "32px" }}>
                  {/* 위기 경고 배너 (danger/caution 시) */}
                  {(isDanger || isCaution) && (
                    <article style={{
                      ...styles.card, padding: "18px 22px", marginBottom: "14px",
                      background: isDanger ? "rgba(182,76,76,0.04)" : "rgba(255,149,0,0.04)",
                      border: `1px solid ${isDanger ? "rgba(182,76,76,0.15)" : "rgba(255,149,0,0.15)"}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isDanger ? "rgba(182,76,76,0.12)" : "rgba(255,149,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M7 1L13 12H1L7 1Z" fill={isDanger ? "#b64c4c" : "#191970"} />
                            <rect x="6.25" y="5" width="1.5" height="3.5" rx="0.75" fill="white" />
                            <circle cx="7" cy="10" r="0.85" fill="white" />
                          </svg>
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: isDanger ? "#b64c4c" : "#191970" }}>
                          {isDanger ? (ko ? "사업 위기 감지" : "Business crisis detected") : (ko ? "주의 필요" : "Attention needed")}
                        </div>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                        {isDanger
                          ? (ko ? "순이익 적자가 지속되고 원가율이 위험 수준입니다. 비용 구조 재검토 또는 사업 전환을 고려해야 할 시점입니다." : "Persistent net loss with dangerous cost ratio. Consider cost restructuring or business pivot.")
                          : (ko ? "비용이 증가 추세이거나 순이익이 마이너스입니다. 지금 조치하면 위기를 예방할 수 있습니다." : "Costs trending up or net profit negative. Act now to prevent crisis.")}
                      </div>
                    </article>
                  )}

                  {/* 폐업 비용 계산기 + 지원 안내 */}
                  <article style={{
                    borderRadius: "20px",
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.6)",
                    padding: "0",
                    overflow: "hidden" as const,
                  }}>
                    <div style={{ padding: "18px 22px 14px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted)" }}>
                        {ko ? "사업 전환 · 폐업 안내" : "Business Transition & Closure"}
                      </div>
                      <div style={{ fontSize: "12px", lineHeight: 1.6, color: "var(--muted)", marginTop: "4px" }}>
                        {ko
                          ? "어려운 결정이 필요한 순간에도 Found.One이 함께합니다."
                          : "Found.One is with you even in difficult decisions."}
                      </div>
                    </div>

                    {/* 폐업 비용 추정 (데이터가 있을 때만) */}
                    {(monthlyRent > 0 || empCount > 0 || (selectedBudget ?? 0) > 0) && (
                      <div style={{ padding: "0 22px 16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "10px" }}>
                          {ko ? "폐업 시 예상 비용" : "Estimated closure costs"}
                        </div>
                        <div className="card-grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          {[
                            { label: ko ? "잔여 임대료 (3개월)" : "Remaining lease (3mo)", value: remainingLease },
                            ...(empCount > 0 ? [{ label: ko ? `퇴직금 (${empCount}명)` : `Severance (${empCount})`, value: severance }] : []),
                            ...(interiorLoss > 0 ? [{ label: ko ? "인테리어 감가" : "Interior depreciation", value: interiorLoss }] : []),
                            { label: ko ? "세금 정산" : "Tax settlement", value: taxSettlement },
                          ].map(item => (
                            <div key={item.label} style={{ background: "rgba(0,0,0,0.03)", borderRadius: "10px", padding: "10px 12px" }}>
                              <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "3px" }}>{item.label}</div>
                              <div style={{ fontSize: "14px", fontWeight: 600 }}>{fmtC(item.value)}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(182,76,76,0.04)", textAlign: "center" as const }}>
                          <div style={{ fontSize: "10px", color: "#b64c4c", marginBottom: "2px" }}>{ko ? "예상 총 폐업 비용" : "Est. total closure cost"}</div>
                          <div style={{ fontSize: "18px", fontWeight: 700, color: "#b64c4c" }}>{fmtC(totalClosureCost)}</div>
                        </div>
                      </div>
                    )}

                    <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)" }} />

                    {/* 지원 링크 */}
                    <div style={{ padding: "14px 22px 18px", display: "grid", gap: "6px" }}>
                      {[
                        { label: ko ? "폐업 절차 안내 (국세청)" : "Closure procedures (NTS)", desc: ko ? "사업자 폐업 신고, 부가세 확정신고, 폐업 세금 정리" : "Business closure filing, VAT final return, tax settlement", url: "https://www.hometax.go.kr" },
                        { label: ko ? "희망리턴패키지 (소진공)" : "Hope Return Package (SEMAS)", desc: ko ? "폐업 후 재창업 최대 2,000만원 + 점포 철거비 600만원 지원" : "Re-startup up to 20M + store demolition 6M KRW support", url: "https://www.semas.or.kr" },
                        { label: ko ? "고용보험 실업급여 (사업주)" : "Employment insurance (business owner)", desc: ko ? "사업주 고용보험 임의가입 시 폐업 후 실업급여 수급 가능" : "Business owner unemployment benefits if voluntarily insured", url: "https://www.ei.go.kr" },
                      ].map((item, idx) => (
                        <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" style={{
                          display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px",
                          borderRadius: "12px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.7)",
                          textDecoration: "none", color: "inherit"
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>{item.label}</div>
                            <div style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.4 }}>{item.desc}</div>
                          </div>
                          <span style={{ fontSize: "12px", color: "var(--primary)", flexShrink: 0 }}>↗</span>
                        </a>
                      ))}
                    </div>
                  </article>
                </section>
              );
            })()}
    </>
  );
}
