"use client";

import { useRef, useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  buildMarketScoreNarrative,
  buildRecommendedMarkets,
  evaluateDirectMarket,
  formatMarketMetaValue,
  getFranchiseBrandById,
  getFreshnessPresentation,
  loadBestMarketSignal,
  localizeRecommendationItem,
} from "@build-up/shared";
import { LocationMapPanel } from "../../LocationMapPanel";
import { supabase } from "../../../../../lib/supabase";

export function LocationCandidatesStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    // Industry
    industryCategoryId,
    selectedIndustryId,
    isDigitalCategory,
    // Startup type / franchise
    startupType,
    selectedFranchiseBrandId,
    nearbyFranchiseStores, setNearbyFranchiseStores,
    nearbyFranchiseLoading, setNearbyFranchiseLoading,
    // Location
    locationOptions,
    selectedLocationId, setSelectedLocationId,
    canCompleteLocationStep, handleLocationContinue,
    preferredRegionInput, setPreferredRegionInput,
    locationMode, setLocationMode,
    setRecommendedMarkets,
    customMarketName, setCustomMarketName,
    customMarketReason, setCustomMarketReason,
    manualMarketEvaluation, setManualMarketEvaluation,
    manualAlternative, setManualAlternative,
    activeLocationCandidates, finalSelectedMarket,
    locationRegionLabel, locationHelpText,
    locationRecommendedLabel, locationDirectLabel,
    locationInputPlaceholder,
    customLocationLabel,
    customLocationPlaceholder, customLocationReasonPlaceholder,
    scoreLocationLabel, selectedLocationDetailLabel,
    locationMapReady, setLocationMapReady,
    selectedBudget,
    // Competitor search
    competitorResults, setCompetitorResults,
    competitorLoading, setCompetitorLoading,
    // Live market insights
    liveMarketInsights, setLiveMarketInsights,
    // Navigation
    prevTraversedStage, setViewingStageId,
    // Reset
    resetDemo,
  } = d;

  const locationRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);

  return (
    <>
      <div style={styles.helper}>{locationHelpText}</div>

      {/* ── Franchise nearby store search ── */}
      {startupType === "franchise" && selectedFranchiseBrandId && (() => {
        const fb = getFranchiseBrandById(selectedFranchiseBrandId);
        if (!fb) return null;
        const ko = language === "ko";
        const density = fb.storeCount > 2000 ? "high" : fb.storeCount > 500 ? "medium" : "low";
        const densityColor = density === "high" ? "#ff3b30" : density === "medium" ? "#ff9f0a" : "#34c759";
        const densityLabel = density === "high"
          ? (ko ? "매우 높음" : "Very High")
          : density === "medium"
            ? (ko ? "보통" : "Medium")
            : (ko ? "낮음" : "Low");

        const searchNearby = () => {
          if (!preferredRegionInput.trim()) return;
          const w = window as unknown as Record<string, unknown>;
          type KPlace = { place_name: string; road_address_name: string; address_name: string; phone: string; place_url: string };
          type KPagination = { totalCount: number };
          const kakao = w.kakao as { maps?: { load?: (cb: () => void) => void; services?: { Places: new () => { keywordSearch: (q: string, cb: (d: KPlace[], s: string, p: KPagination) => void) => void }; Status: { OK: string; ZERO_RESULT: string; ERROR: string } } } } | undefined;
          if (!kakao?.maps) return;
          setNearbyFranchiseLoading(true);
          setNearbyFranchiseStores(null);
          const run = () => {
            const svc = kakao!.maps!.services;
            if (!svc) return;
            const ps = new svc.Places();
            const query = `${fb.name.ko} ${preferredRegionInput.trim()}`;
            ps.keywordSearch(query, (data: KPlace[], status: string, pagination: KPagination) => {
              if (status === svc.Status.OK) {
                setNearbyFranchiseStores({
                  totalCount: pagination.totalCount,
                  places: data.map((d) => ({
                    name: d.place_name,
                    address: d.road_address_name || d.address_name,
                    phone: d.phone,
                    url: d.place_url
                  }))
                });
              } else {
                setNearbyFranchiseStores({ totalCount: 0, places: [] });
              }
              setNearbyFranchiseLoading(false);
            });
          };
          if (kakao.maps.load) {
            kakao.maps.load(run);
          } else {
            run();
          }
        };

        return (
          <div style={{
            marginBottom: "16px",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.82)",
            overflow: "hidden"
          }}>
            {/* header */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em" }}>
                  {ko ? `${fb.name.ko} 주변 매장 검색` : `${fb.name.en} Nearby Store Search`}
                </div>
                <div style={{
                  fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "8px",
                  background: `${densityColor}12`, color: densityColor
                }}>
                  {ko ? `전국 ${fb.storeCount.toLocaleString()}개` : `${fb.storeCount.toLocaleString()} nationwide`} · {densityLabel}
                </div>
              </div>
              <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--muted)" }}>
                {ko
                  ? "희망 지역 근처에 같은 브랜드 매장이 있는지 확인하세요. 반경 내 동일 브랜드가 많으면 매출이 분산됩니다."
                  : "Check if the same brand already exists near your target area. Too many nearby stores will split revenue."}
              </div>
            </div>

            {/* search action */}
            <div style={{ padding: "14px 20px", display: "flex", gap: "8px", alignItems: "center", borderBottom: nearbyFranchiseStores ? "1px solid var(--border)" : "none" }}>
              <button
                type="button"
                onClick={searchNearby}
                disabled={!preferredRegionInput.trim() || nearbyFranchiseLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: preferredRegionInput.trim() ? "var(--primary)" : "rgba(0,0,0,0.06)",
                  color: preferredRegionInput.trim() ? "#fff" : "var(--muted)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: preferredRegionInput.trim() ? "pointer" : "default",
                  opacity: nearbyFranchiseLoading ? 0.6 : 1
                }}
              >
                {nearbyFranchiseLoading
                  ? (ko ? "검색 중..." : "Searching...")
                  : preferredRegionInput.trim()
                    ? (ko ? `"${preferredRegionInput.trim()}" 근처 ${fb.name.ko} 검색` : `Search ${fb.name.en} near "${preferredRegionInput.trim()}"`)
                    : (ko ? "아래에서 희망 지역을 먼저 입력하세요" : "Enter your preferred region below first")}
              </button>
            </div>

            {/* results */}
            {nearbyFranchiseStores && (
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 16,
                    background: nearbyFranchiseStores.totalCount === 0 ? "#34c75918" : nearbyFranchiseStores.totalCount <= 3 ? "#ff9f0a18" : "#ff3b3018",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: 700,
                    color: nearbyFranchiseStores.totalCount === 0 ? "#34c759" : nearbyFranchiseStores.totalCount <= 3 ? "#ff9f0a" : "#ff3b30"
                  }}>
                    {nearbyFranchiseStores.totalCount}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>
                      {nearbyFranchiseStores.totalCount === 0
                        ? (ko ? "주변에 동일 브랜드가 없습니다" : "No same-brand stores nearby")
                        : (ko ? `주변에 ${fb.name.ko} ${nearbyFranchiseStores.totalCount}개 발견` : `${nearbyFranchiseStores.totalCount} ${fb.name.en} stores found nearby`)}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {nearbyFranchiseStores.totalCount === 0
                        ? (ko ? "해당 지역은 출점 가능성이 높습니다" : "This area has good potential for a new store")
                        : nearbyFranchiseStores.totalCount <= 3
                          ? (ko ? "경쟁이 있지만 진입 가능합니다" : "Some competition but entry is viable")
                          : (ko ? "이미 포화 상태입니다. 다른 지역을 고려하세요" : "Already saturated. Consider a different area")}
                    </div>
                  </div>
                </div>

                {nearbyFranchiseStores.places.length > 0 && (
                  <div style={{ display: "grid", gap: "6px" }}>
                    {nearbyFranchiseStores.places.slice(0, 8).map((place, pi) => (
                      <a
                        key={pi}
                        href={place.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "12px",
                          background: "rgba(0,0,0,0.02)",
                          border: "1px solid var(--border)",
                          textDecoration: "none",
                          color: "inherit",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{
                          width: 24, height: 24, borderRadius: 8,
                          background: "var(--primary)",
                          color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: 700, flexShrink: 0
                        }}>
                          {pi + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.address}</div>
                        </div>
                        {place.phone && <div style={{ fontSize: "11px", color: "var(--muted)", flexShrink: 0 }}>{place.phone}</div>}
                        <span style={{ fontSize: "12px", color: "var(--primary)", flexShrink: 0 }}>↗</span>
                      </a>
                    ))}
                  </div>
                )}

                {nearbyFranchiseStores.totalCount > 8 && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>
                    {ko ? `외 ${nearbyFranchiseStores.totalCount - 8}개 매장 더 있음` : `${nearbyFranchiseStores.totalCount - 8} more stores`}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 독립 창업자 동종업체 검색 ── */}
      {startupType !== "franchise" && (() => {
        const ko = language === "ko";
        const categoryKeywords: Record<string, string> = {
          "cafe-dessert": "카페",
          "food": industryCategoryId === "food" ? (selectedIndustryId === "chicken-burger" ? "치킨" : selectedIndustryId === "ramen-noodle" ? "국밥 면류" : selectedIndustryId === "korean-casual" ? "한식" : "음식점") : "음식점",
          "retail": "편의점 소매점",
          "beauty": selectedIndustryId === "hair-salon" ? "미용실" : selectedIndustryId === "nail-studio" ? "네일" : "뷰티",
          "fitness": "헬스장 피트니스",
          "education": "학원",
          "pet": "펫샵 애견",
          "living-service": "세탁소",
          "space": "스터디카페",
        };
        const keyword = categoryKeywords[industryCategoryId] ?? "가게";
        // competitorResults / competitorLoading — hoisted to component top

        const searchCompetitors = () => {
          if (!preferredRegionInput.trim()) return;
          /* eslint-disable @typescript-eslint/no-explicit-any */
          const w = window as any;
          const kakao = w.kakao;
          if (!kakao?.maps?.services) return;
          setCompetitorLoading(true);
          setCompetitorResults(null);
          const run = () => {
            const ps = new kakao.maps.services.Places();
            const query = `${keyword} ${preferredRegionInput.trim()}`;
            ps.keywordSearch(query, (data: any[], status: string, pagination: any) => {
              if (status === kakao.maps.services.Status.OK) {
                setCompetitorResults({
                  totalCount: pagination.totalCount,
                  places: data.map((d: any) => ({
                    name: d.place_name, address: d.road_address_name || d.address_name,
                    phone: d.phone || "", url: d.place_url || ""
                  }))
                });
              } else {
                setCompetitorResults({ totalCount: 0, places: [] });
              }
              setCompetitorLoading(false);
            }, { size: 10 });
          };
          if (kakao.maps.load) { kakao.maps.load(run); } else { run(); }
          /* eslint-enable @typescript-eslint/no-explicit-any */
        };

        return (
          <div style={{
            marginBottom: "16px", borderRadius: "20px",
            border: "1px solid var(--border)", background: "rgba(255,255,255,0.82)", overflow: "hidden"
          }}>
            <div style={{ padding: "18px 20px", borderBottom: competitorResults ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                {ko ? "주변 경쟁 업체 분석" : "Nearby Competition Analysis"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5, marginBottom: "12px" }}>
                {ko ? "희망 지역에 같은 업종이 얼마나 있는지 확인하세요. 경쟁이 과하면 차별화 전략이 필요합니다." : "Check how many competitors exist in your target area."}
              </div>
              <button
                type="button"
                onClick={searchCompetitors}
                disabled={!preferredRegionInput.trim() || competitorLoading}
                style={{
                  padding: "10px 18px", borderRadius: "12px", border: "none",
                  background: preferredRegionInput.trim() ? "var(--primary)" : "rgba(0,0,0,0.06)",
                  color: preferredRegionInput.trim() ? "#fff" : "var(--muted)",
                  fontSize: "13px", fontWeight: 600, cursor: preferredRegionInput.trim() ? "pointer" : "default",
                  opacity: competitorLoading ? 0.6 : 1
                }}
              >
                {competitorLoading
                  ? (ko ? "검색 중..." : "Searching...")
                  : preferredRegionInput.trim()
                    ? (ko ? `"${preferredRegionInput.trim()}" 주변 ${keyword} 검색` : `Search ${keyword} near "${preferredRegionInput.trim()}"`)
                    : (ko ? "아래에서 지역을 먼저 입력하세요" : "Enter region below first")}
              </button>
            </div>

            {competitorResults && (
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 16,
                    background: competitorResults.totalCount <= 5 ? "#34c75918" : competitorResults.totalCount <= 15 ? "#ff9f0a18" : "#ff3b3018",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: 700,
                    color: competitorResults.totalCount <= 5 ? "#34c759" : competitorResults.totalCount <= 15 ? "#ff9f0a" : "#ff3b30"
                  }}>
                    {competitorResults.totalCount}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>
                      {competitorResults.totalCount === 0
                        ? (ko ? "주변에 동종 업체가 없습니다" : "No competitors nearby")
                        : (ko ? `주변에 ${keyword} ${competitorResults.totalCount}곳 발견` : `${competitorResults.totalCount} ${keyword} found nearby`)}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {competitorResults.totalCount === 0
                        ? (ko ? "블루오션 지역입니다" : "Blue ocean area")
                        : competitorResults.totalCount <= 5
                          ? (ko ? "경쟁이 적어 진입하기 좋습니다" : "Low competition, good entry")
                          : competitorResults.totalCount <= 15
                            ? (ko ? "보통 수준의 경쟁입니다. 차별화 전략이 필요합니다" : "Medium competition. Differentiation needed")
                            : (ko ? "경쟁이 매우 치열합니다. 강력한 차별점이 필요합니다" : "Very competitive. Strong differentiation required")}
                    </div>
                  </div>
                </div>

                {competitorResults.places.length > 0 && (
                  <div style={{ display: "grid", gap: "6px" }}>
                    {competitorResults.places.slice(0, 5).map((place, pi) => (
                      <a key={pi} href={place.url} target="_blank" rel="noopener noreferrer" style={{
                        display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                        borderRadius: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)",
                        textDecoration: "none", color: "inherit"
                      }}>
                        <div style={{ width: 24, height: 24, borderRadius: 8, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{pi + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.address}</div>
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--primary)", flexShrink: 0 }}>↗</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── 라이브 상권 인사이트 패널 ── */}
      {preferredRegionInput.trim() && (() => {
        const ko = language === "ko";

        const loadMarketInsights = async () => {
          if (liveMarketInsights && !liveMarketInsights.loading) return;
          setLiveMarketInsights({ loading: true });
          try {
            const session = await supabase.auth.getSession();
            const tk = session.data.session?.access_token;
            const parts = preferredRegionInput.trim().replace(/\s+/g, " ").split(" ");
            let sido = parts[0] ?? "";
            if (sido === "서울") sido = "서울특별시";
            else if (sido === "부산") sido = "부산광역시";
            else if (sido === "경기") sido = "경기도";
            else if (sido === "인천") sido = "인천광역시";
            else if (sido === "대구") sido = "대구광역시";
            else if (sido === "대전") sido = "대전광역시";
            const sigungu = parts[1] ?? "";

            const popRes = sido
              ? await fetch(`/api/data/population?sido=${encodeURIComponent(sido)}&sigungu=${encodeURIComponent(sigungu)}`, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} }).then(r => r.json()).catch(() => null)
              : null;

            const result: typeof liveMarketInsights = { loading: false };
            if (popRes?.data?.length) {
              const popArr = popRes.data as Array<{ totalPopulation: number; householdCount: number; malePopulation: number; femalePopulation: number }>;
              result.population = {
                total: popArr.reduce((s, p) => s + p.totalPopulation, 0),
                households: popArr.reduce((s, p) => s + p.householdCount, 0),
                male: popArr.reduce((s, p) => s + p.malePopulation, 0),
                female: popArr.reduce((s, p) => s + p.femalePopulation, 0),
              };
            }
            setLiveMarketInsights(result);
          } catch {
            setLiveMarketInsights({ loading: false });
          }
        };

        if (!liveMarketInsights) void loadMarketInsights();

        if (!liveMarketInsights || liveMarketInsights.loading) {
          return (
            <div style={{ marginBottom: "16px", padding: "18px 20px", borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(219,234,254,0.12) 0%, rgba(255,255,255,0.9) 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", animation: "bentoPulse 1.5s infinite" }} />
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{ko ? "상권 데이터 조회 중..." : "Loading market data..."}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "12px" }}>
                {[0, 1, 2].map(i => <div key={i} style={{ height: "52px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }} />)}
              </div>
            </div>
          );
        }

        if (!liveMarketInsights.population) return null;
        const pop = liveMarketInsights.population;
        const femaleRatio = pop.total > 0 ? Math.round((pop.female / pop.total) * 100) : 50;

        return (
          <div style={{ marginBottom: "16px", borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(219,234,254,0.12) 0%, rgba(255,255,255,0.92) 100%)", overflow: "hidden" }} className="bento-fade-in">
            <div style={{ padding: "18px 20px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} />
                <span style={{ fontSize: "15px", fontWeight: 650, letterSpacing: "-0.02em" }}>{ko ? "상권 인구 데이터" : "Market Demographics"}</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>{ko ? "행정안전부 인구통계 API" : "MOIS Population API"}</div>
            </div>
            <div style={{ padding: "0 20px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.04)" }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "총 인구" : "Population"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{pop.total.toLocaleString()}</div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "명" : "people"}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.04)" }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "세대 수" : "Households"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{pop.households.toLocaleString()}</div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{ko ? "세대" : "units"}</div>
              </div>
              <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(37,99,235,0.04)" }}>
                <div style={{ fontSize: "10px", fontWeight: 650, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "rgba(0,0,0,0.4)", marginBottom: "4px" }}>{ko ? "여성 비율" : "Female %"}</div>
                <div style={{ fontSize: "20px", fontWeight: 740, letterSpacing: "-0.04em", color: "#0f172a" }}>{femaleRatio}%</div>
                <div style={{ display: "flex", gap: "2px", marginTop: "6px" }}>
                  <div style={{ flex: femaleRatio, height: "4px", borderRadius: "2px", background: "#ec4899" }} />
                  <div style={{ flex: 100 - femaleRatio, height: "4px", borderRadius: "2px", background: "#3b82f6" }} />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={styles.inlinePanel}>
        <div style={styles.inlinePanelHeader}>
          <div style={styles.budgetLabel}>
            {locationRegionLabel}
          </div>
          <div style={styles.helper}>
            {locationHelpText}
          </div>
        </div>
        <input
          type="text"
          value={preferredRegionInput}
          onChange={(event) => { setPreferredRegionInput(event.target.value); setLocationMapReady(false); }}
          placeholder={locationInputPlaceholder}
          style={styles.textInput}
        />
        <div style={styles.segmentedRow}>
          <button
            type="button"
            disabled={!preferredRegionInput.trim()}
            style={{
              ...styles.button,
              ...(locationMapReady && locationMode === "recommended"
                ? styles.buttonSelected
                : preferredRegionInput.trim()
                  ? { background: "var(--primary)", color: "#fff", border: "1px solid var(--primary)", fontWeight: 600 }
                  : { opacity: 0.45 })
            }}
            onClick={() => {
              setLocationMode("recommended");
              setLocationMapReady(true);
              setManualMarketEvaluation(null);
              setManualAlternative(null);
            }}
          >
            {locationRecommendedLabel}
          </button>
          <button
            type="button"
            style={{
              ...styles.button,
              ...(locationMode === "direct" && !locationMapReady ? styles.buttonSelected : {})
            }}
            onClick={() => {
              setLocationMode("direct");
              setLocationMapReady(false);
              setSelectedLocationId(undefined);
            }}
          >
            {locationDirectLabel}
          </button>
        </div>
      </div>

      {locationMapReady && locationMode === "recommended" ? (
        <>
        {/* ── Kakao Map + Location Cards (Apple-style) ── */}
        {locationMapReady && (
          <LocationMapPanel
            candidates={activeLocationCandidates}
            selectedId={selectedLocationId}
            onSelect={(id) => setSelectedLocationId(id)}
            language={language}
            region={preferredRegionInput}
          />
        )}
        <div ref={locationRef} style={{ display: "grid", gap: "10px", ...(shakeWarning ? { outline: "2px solid #dc2626", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}) }}>
          {activeLocationCandidates.map((item) => {
            const selected = selectedLocationId === item.id;
            const freshness = getFreshnessPresentation(item.freshness);
            const scoreColor = (item.score ?? 0) >= 85 ? "#34c759" : (item.score ?? 0) >= 70 ? "#007aff" : "#ff9f0a";
            return (
              <button
                key={item.id}
                type="button"
                style={{
                  display: "grid",
                  gap: "8px",
                  padding: "16px 18px",
                  borderRadius: "16px",
                  border: selected ? "2px solid var(--primary)" : "1px solid var(--border)",
                  background: selected ? "rgba(29,53,87,0.04)" : "rgba(255,255,255,0.82)",
                  boxShadow: selected ? "0 0 0 4px rgba(29,53,87,0.06)" : "0 1px 4px rgba(0,0,0,0.03)",
                  cursor: freshness.isSelectable ? "pointer" : "default",
                  textAlign: "left" as const,
                  opacity: freshness.isSelectable ? 1 : 0.5,
                  transition: "all 0.2s ease"
                }}
                onClick={() => { if (freshness.isSelectable) setSelectedLocationId(item.id); }}
                disabled={!freshness.isSelectable}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em" }}>{item.title}</div>
                    {item.meta?.districtName && (
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{String(item.meta.districtName)}</div>
                    )}
                  </div>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: `${scoreColor}14`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: scoreColor }}>{item.score ?? "-"}</span>
                  </div>
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--muted)" }}>{item.summary}</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                  {[
                    { label: language === "ko" ? "임대료" : "Rent", value: formatMarketMetaValue("rentBand", item.meta?.rentBand, language) },
                    { label: language === "ko" ? "경쟁도" : "Competition", value: formatMarketMetaValue("competitionLevel", item.meta?.competitionLevel, language) },
                    { label: language === "ko" ? "적합도" : "Fit", value: formatMarketMetaValue("customerFit", item.meta?.customerFit, language) }
                  ].map((chip) => (
                    <span key={chip.label} style={{
                      fontSize: "11px", fontWeight: 500,
                      padding: "4px 10px", borderRadius: "8px",
                      background: selected ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.03)",
                      border: "1px solid var(--border)",
                      color: "var(--muted)"
                    }}>
                      {chip.label} {chip.value}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        </>
      ) : (
        <>
          <div style={styles.inlinePanel}>
            <div style={styles.inlinePanelHeader}>
              <div style={styles.budgetLabel}>
                {customLocationLabel}
              </div>
            </div>
            <input
              type="text"
              value={customMarketName}
              onChange={(event) => setCustomMarketName(event.target.value)}
              placeholder={customLocationPlaceholder}
              style={styles.textInput}
            />
            <textarea
              value={customMarketReason}
              onChange={(event) => setCustomMarketReason(event.target.value)}
              placeholder={customLocationReasonPlaceholder}
              style={styles.textarea}
            />
            <div style={styles.stageInlineActions}>
              <button
                type="button"
                style={{
                  ...styles.button,
                  opacity: customMarketName.trim() ? 1 : 0.45
                }}
                disabled={!customMarketName.trim()}
                onClick={async () => {
                  const signal = await loadBestMarketSignal(supabase, {
                    regionQuery: preferredRegionInput,
                    marketQuery: customMarketName,
                    categoryId: industryCategoryId
                  }).catch(() => null);
                  const result = evaluateDirectMarket({
                    region: preferredRegionInput,
                    marketName: customMarketName,
                    categoryId: industryCategoryId,
                    capital: selectedBudget,
                    candidates: locationOptions,
                    signal
                  });
                  const evaluation = localizeRecommendationItem(result.evaluation, language);
                  const alternative = result.alternative
                    ? localizeRecommendationItem(result.alternative, language)
                    : null;
                  setManualMarketEvaluation(evaluation);
                  setManualAlternative(alternative);
                  setSelectedLocationId(undefined);
                }}
              >
                {scoreLocationLabel}
              </button>
            </div>
          </div>

          {manualMarketEvaluation ? (
            <div style={styles.inlinePanel}>
              <div style={styles.budgetLabel}>
                {language === "ko" ? "평가 결과" : "Evaluation"}
              </div>
              <div style={styles.recommendationTop}>
                <div style={styles.optionTitle}>{manualMarketEvaluation.title}</div>
                <div style={styles.scoreBadge}>
                  {language === "ko" ? `점수 ${manualMarketEvaluation.score ?? "-"}` : `Score ${manualMarketEvaluation.score ?? "-"}`}
                </div>
              </div>
              {manualMarketEvaluation.meta?.districtName ? (
                <div style={styles.freshnessText}>
                  {String(manualMarketEvaluation.meta.districtName)}
                </div>
              ) : null}
              <div style={styles.optionSummary}>{manualMarketEvaluation.summary}</div>
              <div style={styles.helper}>
                {language === "ko"
                  ? "이 상권으로 진행할지, build.up이 한 번 더 제안하는 대안을 볼지 선택하세요."
                  : "Choose whether to keep this market or review one suggested alternative."}
              </div>
              <div style={styles.stageInlineActions}>
                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={() => setSelectedLocationId(manualMarketEvaluation.id)}
                >
                  {language === "ko" ? "내가 고른 상권 유지" : "Keep my market"}
                </button>
                {manualAlternative ? (
                  <button
                    type="button"
                    style={styles.button}
                    onClick={() => {
                      setLocationMode("recommended");
                      setRecommendedMarkets(
                        buildRecommendedMarkets({
                          region: preferredRegionInput || customMarketName,
                          categoryId: industryCategoryId,
                          capital: selectedBudget,
                          candidates: locationOptions
                        }).map((item) => localizeRecommendationItem(item, language))
                      );
                      setSelectedLocationId(manualAlternative.id);
                    }}
                  >
                    {language === "ko" ? "추천 대안 보기" : "View suggested alternative"}
                  </button>
                ) : null}
              </div>
              {manualAlternative ? (
                <div style={styles.inlinePanel}>
                  <div style={styles.budgetLabel}>
                    {language === "ko" ? "이런 곳은 어떠세요?" : "How about this instead?"}
                  </div>
                  <div style={styles.recommendationTop}>
                    <div style={styles.optionTitle}>{manualAlternative.title}</div>
                    <div style={styles.scoreBadge}>
                      {language === "ko" ? `점수 ${manualAlternative.score ?? "-"}` : `Score ${manualAlternative.score ?? "-"}`}
                    </div>
                  </div>
                  <div style={styles.optionSummary}>{manualAlternative.summary}</div>
                  <div style={styles.helper}>
                    {language === "ko"
                      ? "원래 고른 상권도 계속 유지할 수 있습니다."
                      : "You can still keep your original market choice."}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {finalSelectedMarket ? (
        <div style={styles.inlinePanel}>
          <div style={styles.inlinePanelHeader}>
            <div style={styles.budgetLabel}>
              {selectedLocationDetailLabel}
            </div>
          </div>
          <div style={styles.recommendationTop}>
            <div style={styles.optionTitle}>{finalSelectedMarket.title}</div>
            <div style={styles.scoreBadge}>
              {language === "ko" ? `점수 ${finalSelectedMarket.score ?? "-"}` : `Score ${finalSelectedMarket.score ?? "-"}`}
            </div>
          </div>
          {finalSelectedMarket.meta?.districtName ? (
            <div style={styles.freshnessText}>
              {String(finalSelectedMarket.meta.districtName)}
            </div>
          ) : null}
          <div style={styles.optionSummary}>{finalSelectedMarket.summary}</div>
          <div style={styles.helper}>
            {buildMarketScoreNarrative(finalSelectedMarket, language)}
          </div>
          <div style={styles.budgetLabel}>
            {language === "ko" ? "왜 괜찮은가" : "Why this works"}
          </div>
          {finalSelectedMarket.reasons?.slice(0, 2).map((reason) => (
            <div key={reason} style={styles.helper}>
              {reason}
            </div>
          ))}
          <div style={styles.budgetLabel}>
            {language === "ko" ? "주의할 점" : "Watch-outs"}
          </div>
          {finalSelectedMarket.warnings?.slice(0, 1).map((warning) => (
            <div key={warning} style={styles.warningText}>
              {warning}
            </div>
          ))}
        </div>
      ) : null}

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
            opacity: canCompleteLocationStep ? 1 : 0.45
          }}
          onClick={() => {
            if (!canCompleteLocationStep) {
              setShakeWarning(true);
              locationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            handleLocationContinue();
          }}
        >
          {canCompleteLocationStep
            ? (isDigitalCategory
                ? language === "ko"
                  ? "이 거점으로 운영 준비 시작"
                  : "Use this base and continue"
                : copy.home.selectMarketAndContinue)
            : (language === "ko" ? "↑ 상권을 선택하세요" : "↑ Select a market")}
        </button>
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}
