"use client";

/**
 * FoodSafetyComplianceCard — 식약처 위생점검 대비 카드.
 *
 * **분기**: industryCategoryId 가 "food" 또는 "cafe-dessert" 일 때만 렌더.
 *           외식·카페가 아닌 업종은 null 반환 (시각 부담 X).
 *
 * 사장님 가치:
 *   1. 위생점검 두려움 해소 — 22개 항목을 빈도(매일/주/월/서류)별로 분류
 *   2. 자가 점수 → 위생등급 시뮬 (매우우수 90+ / 우수 85+ / 좋음 80+)
 *   3. 만료 임박 서류 알림 (위생교육·보건증)
 *   4. 위반 시 처분 명시 → 경각심
 *
 * 데이터:
 *   - 정적 체크리스트 (food-safety-checklist.ts, 식약처 매뉴얼)
 *   - 사장님 점검 상태 → localStorage (간단·빠름. 추후 cross-device sync 시 DB)
 *
 * 디자인: Found.One 토큰 (lavender-mist + 미드나잇 네이비 + cream amber 경고).
 */

import { useMemo, useState } from "react";
import { useDashboardCtx } from "../../contexts/DashboardContext";
import { useStoreInfoStore } from "../../stores/store-info-store";
import { AlertCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import {
  filterByCategory,
  CATEGORY_LABELS,
  GRADE_LABELS,
  calculateFoodSafetyGrade,
  type FoodSafetyCheckItem,
  type FoodSafetyCheckCategory,
} from "@foundone/shared";

const MIDNIGHT_DEEP = "#141C3D";
const MIDNIGHT_SOFT = "#5A6BAE";
const TEXT_BODY = "#1A1F36";
const TEXT_MUTED = "#6B7393";
const SURFACE_LAVENDER = "#F4F5FB";
const HAIRLINE = "rgba(30,42,85,0.08)";
const HAIRLINE_STRONG = "rgba(30,42,85,0.16)";
const SKY = "#3B5BBF";
const AMBER_BG = "#FFF6E5";
const AMBER_TEXT = "#8A5B11";
const ROSE_TEXT = "#9F1A2D";

type CheckState = {
  itemId: string;
  checkedAt: string;            // ISO date
};

type StorageShape = {
  v: 1;
  checks: CheckState[];
};

const STORAGE_KEY = "buildup:food-safety-checks:v1";

// 빈도별 만료 기간(일) — 마지막 체크 후 이 기간 지나면 다시 점검 필요
const EXPIRY_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  biannual: 180,
  annual: 365,
};

function loadChecks(): CheckState[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StorageShape;
    if (parsed.v !== 1 || !Array.isArray(parsed.checks)) return [];
    return parsed.checks;
  } catch {
    return [];
  }
}

function saveChecks(checks: CheckState[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, checks } as StorageShape));
  } catch {
    /* quota — ignore */
  }
}

function isItemFresh(item: FoodSafetyCheckItem, check: CheckState | undefined): boolean {
  if (!check) return false;
  const days = EXPIRY_DAYS[item.frequency] ?? 30;
  const checkedAt = new Date(check.checkedAt).getTime();
  return Date.now() - checkedAt < days * 24 * 60 * 60 * 1000;
}

function daysSinceCheck(check: CheckState | undefined): number {
  if (!check) return Infinity;
  const checkedAt = new Date(check.checkedAt).getTime();
  return Math.floor((Date.now() - checkedAt) / (24 * 60 * 60 * 1000));
}

export function FoodSafetyComplianceCard({
  ko,
  industryCategoryId,
}: {
  ko: boolean;
  industryCategoryId?: string | null;
}) {
  const items = useMemo(() => filterByCategory(industryCategoryId), [industryCategoryId]);

  const [expandedCategory, setExpandedCategory] = useState<FoodSafetyCheckCategory | null>("daily");

  // 점검 상태는 storeInfo.industrySpecifics["foodSafetyChecks"] 에 저장 → user_store_data 로 동기화
  //   (기기 간 공유). 종전엔 localStorage 전용이라 A기기 점검이 B기기서 안 보였음.
  //   서버에 값이 아직 없으면 기존 로컬 데이터로 폴백하고, 토글 시 서버로 이전된다.
  const dctx = useDashboardCtx();
  const setIndustrySpecific = useStoreInfoStore((s) => s.setIndustrySpecific);
  const storeChecks = useStoreInfoStore((s) => s.industrySpecifics["foodSafetyChecks"] as CheckState[] | undefined);
  const [localFallback] = useState<CheckState[]>(() => loadChecks());
  const checks = storeChecks ?? localFallback;

  const checksByItem = useMemo(() => {
    const map = new Map<string, CheckState>();
    for (const c of checks) map.set(c.itemId, c);
    return map;
  }, [checks]);

  const score = useMemo(() => {
    let earned = 0;
    let total = 0;
    for (const item of items) {
      total += item.weight;
      const c = checksByItem.get(item.id);
      if (isItemFresh(item, c)) earned += item.weight;
    }
    return total > 0 ? Math.round((earned / total) * 100) : 0;
  }, [items, checksByItem]);

  const grade = calculateFoodSafetyGrade(score);
  const gradeMeta = GRADE_LABELS[grade];

  // 카테고리별 그룹핑
  const byCategory = useMemo(() => {
    const groups: Record<FoodSafetyCheckCategory, FoodSafetyCheckItem[]> = {
      documents: [],
      daily: [],
      weekly: [],
      monthly: [],
      facility: [],
    };
    for (const item of items) groups[item.category].push(item);
    return groups;
  }, [items]);

  // 만료 임박 (서류 위주) 알림
  const expiringSoon = useMemo(() => {
    return items
      .filter((item) => {
        if (item.frequency !== "annual" && item.frequency !== "biannual") return false;
        const c = checksByItem.get(item.id);
        if (!c) return true;
        const days = daysSinceCheck(c);
        const limit = EXPIRY_DAYS[item.frequency];
        return days > limit - 30;     // 30일 이내 만료
      })
      .slice(0, 3);
  }, [items, checksByItem]);

  // 미점검 + 빈도 만료 (오늘·이번 주 위험 항목)
  const overdue = useMemo(() => {
    return items.filter((item) => {
      if (item.frequency === "annual" || item.frequency === "biannual") return false;
      const c = checksByItem.get(item.id);
      return !isItemFresh(item, c);
    });
  }, [items, checksByItem]);

  // 해당 업종에 점검 항목이 없으면 카드 미표시.
  //   ⚠️ 모든 훅 뒤로 이동 — rules-of-hooks. 위 훅들은 빈 items 에도 안전(빈 배열 순회).
  if (items.length === 0) return null;

  function toggleCheck(itemId: string) {
    const existing = checksByItem.get(itemId);
    let next: CheckState[];
    if (existing && isItemFresh(items.find((i) => i.id === itemId)!, existing)) {
      // 다시 누르면 해제 (오늘 점검한 것만)
      next = checks.filter((c) => c.itemId !== itemId);
    } else {
      next = [...checks.filter((c) => c.itemId !== itemId), { itemId, checkedAt: new Date().toISOString() }];
    }
    // 서버 동기화(industrySpecifics → user_store_data, 기기 간 공유) + 로컬 캐시 백업(오프라인·구버전 호환).
    setIndustrySpecific("foodSafetyChecks", next);
    saveChecks(next);
    void dctx.flushStoreDataImmediate?.();
  }

  function toggleCategory(cat: FoodSafetyCheckCategory) {
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  }

  return (
    <article style={section}>
      <header style={header}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "grid", gap: "4px", flex: 1, minWidth: 0 }}>
            <div style={eyebrow}>{ko ? "위생점검 대비" : "Food Safety Compliance"}</div>
            <div style={title}>
              {ko ? "단속 나와도 자신 있게" : "Inspection-ready"}
            </div>
            <div style={{ fontSize: "12px", color: TEXT_MUTED, lineHeight: 1.55, marginTop: "2px" }}>
              {ko
                ? "식약처 위생등급제 매뉴얼 기준 22개 항목을 빈도별로 점검합니다."
                : "22 items aligned with KFDA hygiene-grade manual."}
            </div>
          </div>
          {/* 점수 + 등급 배지 */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: SURFACE_LAVENDER,
              border: `1px solid ${HAIRLINE}`,
              minWidth: "120px",
              textAlign: "center" as const,
            }}
          >
            <div style={{ fontSize: "10px", fontWeight: 700, color: MIDNIGHT_SOFT, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              {ko ? "현재 점수" : "Score"}
            </div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: gradeMeta.color,
                letterSpacing: "-0.03em",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
              }}
            >
              {score}
            </div>
            <div style={{ fontSize: "10.5px", fontWeight: 700, color: gradeMeta.color, marginTop: "2px" }}>
              {ko ? gradeMeta.ko.split(" ")[0] : gradeMeta.en.split(" ")[0]}
            </div>
          </div>
        </div>
      </header>

      {/* 만료 임박 알림 (서류) */}
      {expiringSoon.length > 0 && (
        <div style={alertBox}>
          <AlertCircle size={14} strokeWidth={2} color={AMBER_TEXT} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "11.5px", color: AMBER_TEXT, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, marginBottom: "2px" }}>
              {ko ? "만료 임박 서류" : "Expiring soon"}
            </div>
            <div>{expiringSoon.map((i) => (ko ? i.labelKo : i.labelEn)).join(" · ")}</div>
          </div>
        </div>
      )}

      {/* 오늘 미점검 항목 (즉시 액션 가능) */}
      {overdue.length > 0 && (
        <div style={overdueBox}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT_SOFT, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "6px" }}>
            {ko ? `오늘 점검 필요 (${overdue.length}개)` : `Pending today (${overdue.length})`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
            {overdue.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleCheck(item.id)}
                style={pendingChip}
              >
                {ko ? item.labelKo : item.labelEn}
              </button>
            ))}
            {overdue.length > 5 && (
              <span style={{ fontSize: "11px", color: TEXT_MUTED, alignSelf: "center" as const }}>
                +{overdue.length - 5}{ko ? "개" : ""}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 카테고리별 아코디언 */}
      <div style={{ display: "grid", gap: "8px", marginTop: "4px" }}>
        {(Object.keys(byCategory) as FoodSafetyCheckCategory[]).map((cat) => {
          const catItems = byCategory[cat];
          if (catItems.length === 0) return null;
          const isOpen = expandedCategory === cat;
          const catScore = catItems.reduce((s, item) => {
            const c = checksByItem.get(item.id);
            return s + (isItemFresh(item, c) ? item.weight : 0);
          }, 0);
          const catTotal = catItems.reduce((s, item) => s + item.weight, 0);
          const catPct = catTotal > 0 ? Math.round((catScore / catTotal) * 100) : 0;
          return (
            <div key={cat} style={catGroup}>
              <button type="button" onClick={() => toggleCategory(cat)} style={catHeader}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT_DEEP }}>
                    {ko ? CATEGORY_LABELS[cat].ko : CATEGORY_LABELS[cat].en}
                  </span>
                  <span style={{ fontSize: "10.5px", color: MIDNIGHT_SOFT, fontWeight: 600 }}>
                    {catItems.length}{ko ? "개" : ""} · {catPct}%
                  </span>
                </span>
                {isOpen ? <ChevronUp size={14} color={MIDNIGHT_SOFT} /> : <ChevronDown size={14} color={MIDNIGHT_SOFT} />}
              </button>
              {isOpen && (
                <div style={{ display: "grid", gap: "6px", padding: "8px 12px 12px" }}>
                  {catItems.map((item) => {
                    const c = checksByItem.get(item.id);
                    const fresh = isItemFresh(item, c);
                    const days = daysSinceCheck(c);
                    return (
                      <div key={item.id} style={itemRow}>
                        <button
                          type="button"
                          onClick={() => toggleCheck(item.id)}
                          style={{
                            ...checkbox,
                            background: fresh ? SKY : "transparent",
                            borderColor: fresh ? SKY : HAIRLINE_STRONG,
                          }}
                          aria-pressed={fresh}
                        >
                          {fresh && <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>✓</span>}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12.5px", fontWeight: 600, color: fresh ? TEXT_MUTED : TEXT_BODY, textDecoration: fresh ? "line-through" : "none" }}>
                            {ko ? item.labelKo : item.labelEn}
                          </div>
                          <div style={{ fontSize: "10.5px", color: TEXT_MUTED, lineHeight: 1.5, marginTop: "1px" }}>
                            {ko ? item.rationaleKo : item.rationaleEn}
                          </div>
                          {item.penaltyKo && (
                            <div style={{ fontSize: "10px", color: ROSE_TEXT, marginTop: "2px", fontWeight: 600 }}>
                              {ko ? `⚠ 처분: ${item.penaltyKo}` : `⚠ ${item.penaltyKo}`}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: "10px", color: TEXT_MUTED, fontWeight: 600, whiteSpace: "nowrap" as const, alignSelf: "center" as const }}>
                          {fresh
                            ? days === 0
                              ? (ko ? "오늘" : "today")
                              : `${days}${ko ? "일 전" : "d"}`
                            : c
                              ? <span style={{ color: ROSE_TEXT }}>{ko ? "재점검" : "due"}</span>
                              : (ko ? "미점검" : "—")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 외부 링크 — 2026-06-27 fix: 기존 boardDetail 딥링크가 ntctxt_no 누락 + 식품제조가공업용
          매뉴얼로 연결돼 음식점/카페와 무관한 엉뚱한 페이지로 갔다(사장님 신고). 식품안전나라
          위생등급제 섹션(음식점 대상, 검증된 공식)으로 교체하고 라벨도 도착지에 맞게 정직하게. */}
      <a
        href="https://www.foodsafetykorea.go.kr/portal/fooddanger/foodSafetyInfo/hgledgList.do?menu_grp=MENU_NEW02&menu_no=4436"
        target="_blank"
        rel="noreferrer"
        style={externalLink}
      >
        <ExternalLink size={11} strokeWidth={2} />
        {ko ? "식약처 음식점 위생등급제 (식품안전나라)" : "KFDA Restaurant Hygiene Rating (official)"}
      </a>
    </article>
  );
}

// ─── styles ────────────────────────────────────────────────────────

const section: React.CSSProperties = {
  padding: "22px 24px",
  background: "#fff",
  border: `1px solid ${HAIRLINE}`,
  borderRadius: "16px",
  boxShadow: "0 1px 2px rgba(30,42,85,0.03), 0 8px 28px rgba(30,42,85,0.04)",
  display: "grid",
  gap: "14px",
  fontFamily: "Pretendard Variable, Pretendard, -apple-system, sans-serif",
};

const header: React.CSSProperties = { display: "grid", gap: "4px" };

const eyebrow: React.CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SKY,
};

const title: React.CSSProperties = {
  fontSize: "19px",
  fontWeight: 700,
  letterSpacing: "-0.025em",
  color: MIDNIGHT_DEEP,
};

const alertBox: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: AMBER_BG,
  border: "1px solid rgba(214,145,33,0.25)",
};

const overdueBox: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: SURFACE_LAVENDER,
  border: `1px solid ${HAIRLINE}`,
};

const pendingChip: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  padding: "5px 10px",
  borderRadius: "999px",
  border: `1px solid ${HAIRLINE_STRONG}`,
  background: "#fff",
  color: MIDNIGHT_DEEP,
  cursor: "pointer",
  transition: "all 120ms ease",
};

const catGroup: React.CSSProperties = {
  border: `1px solid ${HAIRLINE}`,
  borderRadius: "10px",
  background: "#fff",
  overflow: "hidden",
};

const catHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  padding: "10px 14px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  font: "inherit",
  textAlign: "left" as const,
};

const itemRow: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  padding: "8px 0",
  borderBottom: `1px dashed ${HAIRLINE}`,
};

const checkbox: React.CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "6px",
  border: "1.5px solid",
  background: "transparent",
  cursor: "pointer",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 120ms ease",
  marginTop: "1px",
};

const externalLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  fontSize: "11px",
  fontWeight: 600,
  color: SKY,
  textDecoration: "none",
  padding: "8px 0",
};
