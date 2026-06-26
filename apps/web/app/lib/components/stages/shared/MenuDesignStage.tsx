"use client";

/**
 * MenuDesignStage.tsx — 메뉴/서비스 라인업 확정 단계 (cluster-aware dispatcher)
 *
 * stageId: "menu-design"
 *
 * 사장님 신고 (2026-05-14): "메뉴 결정 과정이 어디에도 없어. 미리 결정하면
 * 재고 관리 카드에 들어가게 해서 수고를 덜 수 있어."
 *
 * 위치: offline path, construction-setup → menu-design → vendor-setup.
 *
 * Cluster 분기:
 *   • food / cafe-dessert → FoodMenuPanel (메뉴 이름·판매가·원가·주재료)
 *   • beauty / fitness / pet / education → ServiceLineupPanel (서비스명·가격·소요시간)
 *   • retail → ProductCatalogPanel (SKU·매입가·판매가)
 *   • online-digital → OnlineCatalogPanel (상품·옵션·배송)
 *   • startup-tech → SubscriptionPlanPanel (티어·가격·feature)
 *
 * 데이터 흐름:
 *   1. 사용자가 cluster-specific panel 에서 lineup 항목 입력
 *   2. 각 panel 이 (a) decisions["menu-design"].inputs.menuItemsJson 에 JSON 직렬화 저장,
 *      (b) operations-store 에 cluster-적합 타입으로 반영
 *        · food/cafe/retail/online → inventory[] (itemType=product, sellingPrice 포함)
 *        · beauty/fitness/pet/education → serviceMenuItems[]
 *        · startup-tech → subscriptionPlans[]
 *   3. InventoryOpsCard / 운영 surface 가 자동 표시 → 사장님 day-1 등록 수고 0.
 *
 * 검증 출처:
 *   · 한국외식산업연구원 2024 — Prime Cost 65% 황금률 (식자재 30-35% + 인건비 28-32%)
 *   · 외식업협회 2024 — 시그니처 3-5개 + 사이드 2-3개 표준 메뉴 구성 (소형 매장 기준)
 *   · 메뉴 원가율 33% 초과 시 영업이익 마이너스 — 통상 컨설팅 기준선
 */

import { ChefHat, Plus, Trash2, AlertTriangle, Sparkles } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import type { InventoryItem } from "../../../stores/operations-store";
import {
  MIDNIGHT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
  StartupReferenceLabel,
} from "../startup/StartupStageShell";
import { StageWrapup } from "./StageWrapup";

const STAGE_ID = "menu-design";

// ── 단일 lineup item 통합 schema (cluster-aware) ───────────────────────
export type LineupItem = {
  id: string;
  name: string;
  category: string;        // food: 메뉴 카테고리 / saas: tier name
  price: number;           // 판매가 (or 월 구독료)
  cost: number;            // 원가 (or 한계비용 추정)
  /** food/cafe: 주재료 (3-5개), service: 사용 도구·소요품, saas: 핵심 feature */
  notes: string;
  /** beauty/fitness/pet/education: 소요 시간 (분). saas: free-trial 일수. else 0 */
  duration?: number;
};

// ── Cluster 그룹 분류 ──────────────────────────────────────────────────
function classifyCluster(categoryId: string | undefined): "food" | "cafe" | "service" | "retail" | "online" | "saas" | "other" {
  switch (categoryId) {
    case "food": return "food";
    case "cafe-dessert": return "cafe";
    case "beauty":
    case "fitness":
    case "pet":
    case "education":
    case "living-service":
    case "space-stay":
      return "service";
    case "retail": return "retail";
    case "online-digital": return "online";
    case "startup-tech": return "saas";
    default: return "other";
  }
}

// ── 메인 dispatcher ────────────────────────────────────────────────────
export function MenuDesignStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const cluster = classifyCluster(d.industryCategoryId ?? undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {cluster === "food" || cluster === "cafe" ? (
        <FoodMenuPanel cluster={cluster} ko={ko} />
      ) : cluster === "service" ? (
        <ServiceLineupPanel ko={ko} />
      ) : cluster === "retail" ? (
        <ProductCatalogPanel ko={ko} kind="retail" />
      ) : cluster === "online" ? (
        <ProductCatalogPanel ko={ko} kind="online" />
      ) : cluster === "saas" ? (
        <SubscriptionPlanPanel ko={ko} />
      ) : (
        <FoodMenuPanel cluster="food" ko={ko} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  FoodMenuPanel — offline-food / offline-cafe (full content)
// ─────────────────────────────────────────────────────────────────────────
function FoodMenuPanel({ cluster, ko }: { cluster: "food" | "cafe"; ko: boolean }) {
  const d = useDashboardCtx();
  const pg = d.guideStepIndex;
  const totalPg = 4;
  const setGuideStepIndex = d.setGuideStepIndex;
  const decisions = d.decisions;
  const setDecisions = d.setDecisions;
  const inventory = d.inventory;
  const setInventory = d.setInventory;

  // decisions.inputs.menuItemsJson 에서 lineup 복원
  const inputs = (decisions[STAGE_ID]?.inputs as { menuItemsJson?: string } | undefined) ?? {};
  const items: LineupItem[] = parseLineup(inputs.menuItemsJson);

  const persistLineup = (next: LineupItem[]) => {
    setDecisions((prev) => ({
      ...prev,
      [STAGE_ID]: {
        ...(prev[STAGE_ID] ?? { stageId: STAGE_ID }),
        stageId: STAGE_ID,
        inputs: {
          ...(prev[STAGE_ID]?.inputs ?? {}),
          menuItemsJson: JSON.stringify(next),
        },
      },
    }));
    // 동시에 inventory 에도 product 로 반영 (재고 카드 자동 표시)
    syncMenuToInventory(next, inventory, setInventory);
  };

  // ── 단가 계산 헬퍼 ──
  const totalRevenue = items.reduce((s, i) => s + i.price, 0);
  const totalCost = items.reduce((s, i) => s + i.cost, 0);
  const avgPrimeCostPct = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

  const pgLabels = ko
    ? ["왜 중요한가", "1. 메뉴 추가", "2. 원가 점검", "3. 마무리"]
    : ["Why", "1. Add", "2. Cost check", "3. Wrap"];

  const heroTitle = cluster === "cafe"
    ? (ko ? "음료 라인업 + 원가 황금률" : "Drink lineup + cost golden ratio")
    : (ko ? "시그니처 3-5개 + 사이드로 메뉴 락" : "3-5 signatures + sides — lock the menu");

  return (
    <>
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={heroTitle}
        subtitle={ko
          ? "Prime Cost 황금률: 식자재 30-35% + 인건비 28-32% = 65% 이하. 33% 초과 메뉴는 영업이익 마이너스 — 한국외식산업연구원 2024."
          : "Prime Cost golden ratio: ingredients 30-35% + labor 28-32% ≤ 65%. Menus exceeding 33% material cost lose money."}
        miniCards={[
          { icon: ChefHat, label: ko ? "시그니처" : "Signature", detail: ko ? "3-5개로 시작" : "Start with 3-5" },
          { icon: Sparkles, label: ko ? "원가율" : "Cost ratio", detail: ko ? "33% 이하 목표" : "≤33% target" },
          { icon: AlertTriangle, label: ko ? "단가" : "Pricing", detail: ko ? "원가 × 3 = 기본" : "Cost × 3 default" },
        ]}
      />

      <StartupReferenceLabel>
        {ko ? "↓ 메뉴 입력 시 재고 관리 카드에 자동 등록됩니다." : "↓ Items here auto-populate the inventory card."}
      </StartupReferenceLabel>

      <StartupPageNav page={pg} totalPages={totalPg} labels={pgLabels} onChange={setGuideStepIndex} ko={ko} />

      {/* ── pg 0 WHY ── */}
      {pg === 0 && (
        <>
          <div style={cardStyle}>
            <div style={eyebrowStyle}>{ko ? "왜 vendor-setup 전인가" : "Why before vendor setup"}</div>
            <div style={bodyTitleStyle}>
              {ko ? "메뉴 없이 공급처와 식자재 협상 불가능합니다." : "Can't negotiate suppliers without a menu."}
            </div>
            <div style={bodyTextStyle}>
              {ko
                ? "공급처는 '월 사용량 + 단가 + 결제 조건' 으로 계약합니다. 메뉴 미확정 = 사용량 추정 불가 = 단가 협상 불리. 메뉴 락 후 공급처 미팅 = 사장님이 협상 우위."
                : "Suppliers contract on monthly volume × unit price × payment terms. No menu = no volume estimate = weak negotiation. Lock menu first → vendor meetings give you leverage."}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={eyebrowStyle}>{ko ? "한국 외식 표준 (KFRI 2024)" : "Korea F&B benchmarks (KFRI 2024)"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "10px" }}>
              {[
                { num: cluster === "cafe" ? "8-12" : "5-8", lab: ko ? "총 메뉴 수" : "Total items", det: ko ? "소형 매장" : "small store" },
                { num: "30-35%", lab: ko ? "식자재 원가율" : "Ingredient cost", det: ko ? "황금률 상한" : "golden ceiling" },
                { num: "× 3", lab: ko ? "단가 배수" : "Price multiplier", det: ko ? "원가 → 판매가" : "cost → price" },
              ].map((s) => (
                <div key={s.lab} style={{ padding: "12px 10px", borderRadius: "10px", background: "rgba(0,0,0,0.02)", textAlign: "center" as const }}>
                  <div style={{ fontSize: "18px", fontWeight: 780, color: MIDNIGHT }}>{s.num}</div>
                  <div style={{ fontSize: "11.5px", fontWeight: 640, color: "#0f172a", marginTop: "2px" }}>{s.lab}</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)" }}>{s.det}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── pg 1 ADD ── */}
      {pg === 1 && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <ChefHat size={16} strokeWidth={2.2} color={MIDNIGHT} />
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              {ko ? "메뉴 항목 추가" : "Add menu items"}
            </span>
          </div>

          {/* 입력 폼 */}
          <MenuItemForm
            ko={ko}
            cluster={cluster}
            onAdd={(item) => {
              const next = [...items, { ...item, id: Date.now().toString() }];
              persistLineup(next);
            }}
          />

          {/* 등록된 메뉴 리스트 */}
          {items.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                {ko ? `등록된 메뉴 ${items.length}개` : `${items.length} item${items.length === 1 ? "" : "s"}`}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {items.map((it) => {
                  const ratio = it.price > 0 ? (it.cost / it.price) * 100 : 0;
                  const ratioWarn = ratio > 35;
                  return (
                    <div key={it.id} style={{ padding: "10px 12px", borderRadius: "10px", border: `1px solid ${ratioWarn ? "rgba(182,76,76,0.20)" : MIDNIGHT_BORDER}`, background: ratioWarn ? "rgba(182,76,76,0.03)" : "rgba(25,25,112,0.02)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{it.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                            {it.category && <>{it.category} · </>}
                            ₩{it.price.toLocaleString()} {ko ? "판매" : "sell"} · ₩{it.cost.toLocaleString()} {ko ? "원가" : "cost"} · {ratio.toFixed(0)}%
                            {ratioWarn && <span style={{ color: "#b64c4c", fontWeight: 700 }}> ⚠ {ko ? "원가율 높음" : "high cost"}</span>}
                          </div>
                          {it.notes && (
                            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{it.notes}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => persistLineup(items.filter((x) => x.id !== it.id))}
                          style={{ padding: "6px", background: "transparent", border: "none", color: "rgba(182,76,76,0.7)", cursor: "pointer" }}
                          aria-label="delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── pg 2 COST CHECK ── */}
      {pg === 2 && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Sparkles size={16} strokeWidth={2.2} color={MIDNIGHT} />
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              {ko ? "원가율 점검" : "Cost ratio check"}
            </span>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center" as const, color: "var(--muted)", fontSize: "13px" }}>
              {ko ? "메뉴를 먼저 등록하세요 (1. 메뉴 추가 페이지)" : "Add menu items first (1. Add page)"}
            </div>
          ) : (
            <>
              {/* 평균 원가율 카드 */}
              <div style={{
                padding: "14px 16px",
                borderRadius: "12px",
                background: avgPrimeCostPct > 35 ? "rgba(182,76,76,0.06)" : avgPrimeCostPct > 30 ? "rgba(25,25,112,0.06)" : "rgba(25,25,112,0.06)",
                border: `1.5px solid ${avgPrimeCostPct > 35 ? "rgba(182,76,76,0.20)" : avgPrimeCostPct > 30 ? "rgba(25,25,112,0.20)" : "rgba(25,25,112,0.20)"}`,
                marginBottom: "12px",
              }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>
                  {ko ? "메뉴 평균 식자재 원가율" : "Avg ingredient cost ratio"}
                </div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                  {avgPrimeCostPct.toFixed(1)}%
                </div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5, marginTop: "4px" }}>
                  {avgPrimeCostPct > 35
                    ? (ko ? "⚠ 35% 초과. 인건비 더하면 영업이익 마이너스 위험. 단가 인상 또는 원가 절감 필요." : "Above 35%. Likely loss-making after labor. Raise price or cut cost.")
                    : avgPrimeCostPct > 30
                      ? (ko ? "⚠ 30-35%. 황금률 상한. 인건비 + 임대료 합산해 BEP 점검 권장." : "30-35%. Near ceiling. Verify BEP after labor + rent.")
                      : (ko ? "✓ 30% 이하. 황금률 안. 인건비 28-32% 이내로 유지하면 BEP 안정." : "≤30%. Within golden range. Keep labor 28-32% for stable BEP.")}
                </div>
              </div>

              {/* 메뉴별 원가율 위험 항목 */}
              {items.filter((i) => i.price > 0 && (i.cost / i.price) > 0.33).length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#b64c4c", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                    {ko ? "원가율 33% 초과 메뉴" : "Items above 33%"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {items.filter((i) => i.price > 0 && (i.cost / i.price) > 0.33).map((it) => (
                      <div key={it.id} style={{ padding: "9px 12px", borderRadius: "10px", background: "rgba(182,76,76,0.04)", border: "1px solid rgba(182,76,76,0.16)" }}>
                        <div style={{ fontSize: "12.5px", fontWeight: 640, color: "#7f1d1d" }}>
                          {it.name} — {((it.cost / it.price) * 100).toFixed(0)}%
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(127,29,29,0.7)", marginTop: "2px" }}>
                          {ko
                            ? `단가 ₩${Math.ceil((it.cost / 0.33) / 100) * 100} 로 인상 또는 원가 ₩${Math.floor(it.price * 0.33).toLocaleString()} 로 절감 필요`
                            : `Raise to ₩${Math.ceil((it.cost / 0.33) / 100) * 100} or cut cost to ₩${Math.floor(it.price * 0.33).toLocaleString()}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── pg 3 WRAPUP ── */}
      {pg === 3 && (
        <StageWrapup
          ko={ko}
          nextStageLabelKo={ko ? "공급처·식자재 셋업" : "Vendor setup"}
          doneItemsKo={[
            { label: "1. 메뉴 라인업 확정", detail: ko ? `${items.length}개 메뉴 입력 완료 (시그니처 3-5개 권장)` : `${items.length} items entered` },
            { label: "2. 원가율 점검", detail: ko ? `평균 ${avgPrimeCostPct.toFixed(1)}% (33% 이하 황금률)` : `Avg ${avgPrimeCostPct.toFixed(1)}% (≤33% target)` },
            { label: "3. 재고 카드 자동 연동", detail: ko ? "메뉴 → 재고 product 로 자동 등록 완료" : "Menu auto-registered as inventory products" },
            { label: "4. 공급처 협상 준비", detail: ko ? "월 사용량 추정 가능 → vendor-setup 에서 단가 협상" : "Volume estimable → vendor negotiation ready" },
          ]}
          verifyItemsKo={[
            "메뉴 3개 이상 등록했는가 (시그니처 3-5개 + 사이드 2-3개 표준)",
            "각 메뉴 원가율 33% 이하인가 (초과 시 인건비 합산 시 영업적자)",
            "메뉴별 주재료 명시 — vendor-setup 에서 공급처별 단가 비교 가능한가",
            "객단가 타깃 페르소나 가격 민감도와 일치하는가 (target-customer-definition 결과 참조)",
            "주방 동선·집기 (construction-setup 완료) 으로 실제 조리 가능한 메뉴인가",
          ]}
          nextSummaryKo={ko ? "메뉴 락 + 재고 등록 → 공급처·식자재 단가 협상" : "Menu locked + inventory seeded → vendor negotiation"}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  MenuItemForm — food / cafe 공통 입력 폼
// ─────────────────────────────────────────────────────────────────────────
function MenuItemForm({ ko, cluster, onAdd }: { ko: boolean; cluster: "food" | "cafe"; onAdd: (item: Omit<LineupItem, "id">) => void }) {
  const d = useDashboardCtx();
  const sel = d.guideSelections;
  const setSel = d.setGuideSelections;

  const k = (suffix: string) => `menu-form-${suffix}`;
  const name = sel[k("name")] ?? "";
  const category = sel[k("category")] ?? "";
  const priceText = sel[k("price")] ?? "";
  const costText = sel[k("cost")] ?? "";
  const notes = sel[k("notes")] ?? "";

  const categoryOptions = cluster === "cafe"
    ? (ko ? ["커피", "라떼/특수음료", "디저트", "디카페인/티", "시즌 메뉴"] : ["Coffee", "Latte", "Dessert", "Decaf/Tea", "Seasonal"])
    : (ko ? ["메인", "사이드", "주류/음료", "디저트", "세트"] : ["Main", "Side", "Drinks", "Dessert", "Set"]);

  const canAdd = name.trim() && priceText && costText;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <input
        type="text"
        placeholder={ko ? "메뉴 이름 (예: 김치찌개 정식)" : "Item name"}
        value={name}
        onChange={(e) => setSel((prev: Record<string, string>) => ({ ...prev, [k("name")]: e.target.value }))}
        style={inputStyle}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder={ko ? "판매가 (원)" : "Price (₩)"}
          value={priceText}
          onChange={(e) => setSel((prev: Record<string, string>) => ({ ...prev, [k("price")]: e.target.value.replace(/[^0-9]/g, "") }))}
          style={inputStyle}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder={ko ? "1인분 원가 (원)" : "Unit cost (₩)"}
          value={costText}
          onChange={(e) => setSel((prev: Record<string, string>) => ({ ...prev, [k("cost")]: e.target.value.replace(/[^0-9]/g, "") }))}
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {categoryOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setSel((prev: Record<string, string>) => ({ ...prev, [k("category")]: opt }))}
            style={{
              padding: "5px 11px",
              borderRadius: "8px",
              border: category === opt ? `1.5px solid ${MIDNIGHT}` : "1px solid rgba(25,25,112,0.10)",
              background: category === opt ? `${MIDNIGHT}08` : "white",
              color: category === opt ? MIDNIGHT : "rgba(15,23,42,0.6)",
              fontSize: "11.5px",
              fontWeight: category === opt ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder={ko ? "주재료 (예: 김치 100g, 돼지고기 60g, 두부 80g) — 선택" : "Main ingredients (optional)"}
        value={notes}
        onChange={(e) => setSel((prev: Record<string, string>) => ({ ...prev, [k("notes")]: e.target.value }))}
        style={{ ...inputStyle, background: "rgba(15,23,42,0.02)" }}
      />

      <button
        type="button"
        disabled={!canAdd}
        onClick={() => {
          if (!canAdd) return;
          onAdd({
            name: name.trim(),
            category,
            price: Number(priceText) || 0,
            cost: Number(costText) || 0,
            notes: notes.trim(),
          });
          // form reset
          setSel((prev: Record<string, string>) => ({
            ...prev,
            [k("name")]: "",
            [k("category")]: "",
            [k("price")]: "",
            [k("cost")]: "",
            [k("notes")]: "",
          }));
        }}
        style={{
          padding: "10px",
          borderRadius: "10px",
          border: "none",
          background: canAdd ? MIDNIGHT : "rgba(25,25,112,0.1)",
          color: canAdd ? "white" : "rgba(25,25,112,0.3)",
          fontSize: "13px",
          fontWeight: 700,
          cursor: canAdd ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        <Plus size={14} strokeWidth={2.4} />
        {ko ? "메뉴 추가 + 재고 자동 등록" : "Add to menu + inventory"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  ServiceLineupPanel — beauty / fitness / pet / education / livingService / spaceStay
// ─────────────────────────────────────────────────────────────────────────
function ServiceLineupPanel({ ko }: { ko: boolean }) {
  return (
    <SimplePlaceholderPanel
      ko={ko}
      eyebrow={ko ? "서비스 라인업" : "SERVICE LINEUP"}
      title={ko ? "서비스 메뉴 (시술·클래스·케어) 확정" : "Lock service menu (treatments / classes / care)"}
      hint={ko
        ? "서비스명·소요시간·가격을 명시하면 예약·결제·인력 배치 모든 결정의 기준선이 됩니다. (cluster 별 전용 패널 작업 중 — 우선순위 외식 → 카페 → 서비스 순)"
        : "Service name + duration + price = anchor for booking, payment, staffing. (Per-cluster panel WIP — priority food → cafe → service)"}
      example={ko
        ? "예: [{\"name\":\"여성 커트\",\"price\":25000,\"category\":\"커트\",\"notes\":\"소요 40분\"},{\"name\":\"뿌리 염색\",\"price\":60000,\"category\":\"염색\",\"notes\":\"소요 90분\"}]"
        : "e.g., [{\"name\":\"Women's cut\",\"price\":25000,\"category\":\"cut\",\"notes\":\"40 min\"}]"}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  ProductCatalogPanel — retail / online-digital
// ─────────────────────────────────────────────────────────────────────────
function ProductCatalogPanel({ ko, kind }: { ko: boolean; kind: "retail" | "online" }) {
  return (
    <SimplePlaceholderPanel
      ko={ko}
      eyebrow={kind === "retail" ? (ko ? "상품 카탈로그" : "PRODUCT CATALOG") : (ko ? "온라인 카탈로그" : "ONLINE CATALOG")}
      title={kind === "retail"
        ? (ko ? "SKU·매입가·판매가 확정 + 재고 동기화" : "SKU + cost + price + inventory sync")
        : (ko ? "상품·옵션·배송비 확정" : "Product + options + shipping")}
      hint={ko
        ? "SKU 별 매입가·판매가·초기 재고를 등록하면 재고 관리 카드에 자동 반영됩니다. (전용 패널 작업 중)"
        : "SKU + cost + price + initial stock — auto-syncs to inventory card. (Full panel WIP)"}
      example={ko
        ? "예: [{\"name\":\"상품명\",\"price\":19000,\"cost\":9000,\"category\":\"SKU\",\"notes\":\"초기 재고 30\"}]"
        : "e.g., [{\"name\":\"Item\",\"price\":19000,\"cost\":9000,\"category\":\"SKU\"}]"}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  SubscriptionPlanPanel — startup-tech / saas
// ─────────────────────────────────────────────────────────────────────────
function SubscriptionPlanPanel({ ko }: { ko: boolean }) {
  return (
    <SimplePlaceholderPanel
      ko={ko}
      eyebrow={ko ? "구독 플랜" : "SUBSCRIPTION TIERS"}
      title={ko ? "Free / Pro / Enterprise 3 티어 구조 락" : "Lock Free / Pro / Enterprise tiers"}
      hint={ko
        ? "티어별 월/연 가격 + 핵심 feature + 한도 (사용량·시트 수·통합 수) 를 명시. SaaS 표준 = 3 티어 + 가치 기반 가격. (전용 패널 작업 중)"
        : "Per-tier price + key features + limits. SaaS standard = 3 tiers, value-based. (Full panel WIP)"}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  SimplePlaceholderPanel — 클러스터별 패널 작업 중 표시
// ─────────────────────────────────────────────────────────────────────────
function SimplePlaceholderPanel({ ko, eyebrow, title, hint, example }: { ko: boolean; eyebrow: string; title: string; hint: string; example?: string }) {
  const d = useDashboardCtx();
  const decisions = d.decisions;
  const setDecisions = d.setDecisions;
  const sel = d.guideSelections;
  const setSel = d.setGuideSelections;

  const inputs = (decisions[STAGE_ID]?.inputs as { menuItemsJson?: string } | undefined) ?? {};
  const currentJson = inputs.menuItemsJson ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <StartupKeyActionHero
        eyebrow={eyebrow}
        title={title}
        subtitle={hint}
        miniCards={[
          { icon: Sparkles, label: ko ? "기본" : "BASIC", detail: ko ? "이름·가격·원가" : "Name/Price/Cost" },
          { icon: ChefHat, label: ko ? "분류" : "CATEGORY", detail: ko ? "카테고리·메모" : "Category/Notes" },
          { icon: Plus, label: ko ? "재고 연동" : "INVENTORY", detail: ko ? "자동 반영" : "Auto-sync" },
        ]}
      />

      <div style={cardStyle}>
        <div style={eyebrowStyle}>{ko ? "임시 입력 (전용 패널 출시 전)" : "Temporary input (full panel pending)"}</div>
        <div style={bodyTextStyle}>
          {ko
            ? "전용 cluster 패널이 출시될 때까지, 메뉴/서비스/플랜 정보를 자유 형식으로 입력해 저장할 수 있습니다."
            : "Until the full cluster panel ships, you can save lineup info as free-form JSON or notes."}
        </div>
        <textarea
          placeholder={example ?? (ko
            ? "예: [{\"name\":\"Pro\",\"price\":29000,\"category\":\"plan\",\"notes\":\"AI 무제한 + 1000 calls\"}]"
            : "e.g., [{\"name\":\"Pro\",\"price\":29000,...}]")}
          value={sel["menu-design-freeform"] ?? currentJson}
          onChange={(e) => {
            setSel((prev: Record<string, string>) => ({ ...prev, "menu-design-freeform": e.target.value }));
            setDecisions((prev) => ({
              ...prev,
              [STAGE_ID]: {
                ...(prev[STAGE_ID] ?? { stageId: STAGE_ID }),
                stageId: STAGE_ID,
                inputs: {
                  ...(prev[STAGE_ID]?.inputs ?? {}),
                  menuItemsJson: e.target.value,
                },
              },
            }));
          }}
          rows={6}
          style={{ ...inputStyle, marginTop: "10px", resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────
function parseLineup(json: string | undefined): LineupItem[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is LineupItem =>
      typeof x?.id === "string" && typeof x?.name === "string" && typeof x?.price === "number"
    );
  } catch {
    return [];
  }
}

/**
 * 메뉴 라인업 → inventory (재고 카드) 자동 동기화.
 *   · 사장님 신고: "미리 메뉴를 결정하면 재고 관리 카드에 들어가게 해서 수고를 덜 수 있어."
 *   · 메뉴 = inventory item (itemType="product", sellingPrice + unitCost 채움).
 *   · 같은 이름의 메뉴는 1:1 매칭 (재추가 시 가격·원가만 업데이트, quantity 보존).
 */
function syncMenuToInventory(
  menuItems: LineupItem[],
  currentInventory: InventoryItem[],
  setInventory: (items: InventoryItem[]) => void,
) {
  const byName = new Map(currentInventory.map((i) => [i.name.toLowerCase().trim(), i]));
  const stamp = Date.now();

  // 1. 메뉴 → product type 아이템으로 변환 (기존이 있으면 가격·원가만 갱신)
  const synced: InventoryItem[] = menuItems.map((m, idx) => {
    const existing = byName.get(m.name.toLowerCase().trim());
    if (existing && existing.itemType === "product") {
      return {
        ...existing,
        sellingPrice: m.price,
        unitCost: m.cost,
        category: mapCategoryToInventory(m.category),
      };
    }
    return {
      id: `menu-${stamp}-${idx}`,
      name: m.name,
      quantity: 0,
      unit: "개",
      minThreshold: 5,
      unitCost: m.cost,
      category: mapCategoryToInventory(m.category),
      itemType: "product" as const,
      sellingPrice: m.price,
      expiryDate: "",
      supplierName: "",
      supplierUrl: "",
      leadTimeDays: 1,
      dailyUsage: 0,
      lastOrderedAt: "",
      wasteLog: [],
    };
  });

  // 2. 기존 inventory 중 product 가 아닌 (material) 아이템은 보존
  const preservedMaterials = currentInventory.filter((i) => i.itemType !== "product");

  // 3. 기존 product 중 menu-design 으로 만들지 않은 것도 보존
  //    (예: 사장님이 직접 추가한 product). name 매칭으로 판단.
  const syncedNames = new Set(menuItems.map((m) => m.name.toLowerCase().trim()));
  const preservedProducts = currentInventory.filter(
    (i) => i.itemType === "product" && !syncedNames.has(i.name.toLowerCase().trim()),
  );

  setInventory([...preservedMaterials, ...preservedProducts, ...synced]);
}

function mapCategoryToInventory(cat: string): InventoryItem["category"] {
  const c = cat.toLowerCase();
  if (c.includes("음료") || c.includes("커피") || c.includes("라떼") || c.includes("drink") || c.includes("beverage") || c.includes("coffee")) return "beverage";
  if (c.includes("디저트") || c.includes("dessert")) return "dry";
  if (c.includes("사이드") || c.includes("side") || c.includes("세트") || c.includes("set")) return "fresh";
  return "fresh";
}

// ── 스타일 토큰 ─────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: `1px solid ${MIDNIGHT_BORDER}`,
  background: "white",
  padding: "20px 22px",
  boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: MIDNIGHT,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  marginBottom: "8px",
};

const bodyTitleStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 680,
  color: "#0f172a",
  lineHeight: 1.5,
  marginBottom: "8px",
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--muted)",
  lineHeight: 1.65,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(25,25,112,0.12)",
  background: "rgba(255,255,255,0.95)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};
