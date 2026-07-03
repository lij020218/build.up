"use client";

/**
 * VendorSetupStage — 세부업종(sub-industry)별 한국 실제 공급처·장비·POS·채널 데이터를
 * Apple-style midnight blue UI 로 즉시 보여주는 vendor_setup 단계 본 컴포넌트.
 *
 * 비-프랜차이즈 사용자만 사용 (프랜차이즈는 FranchiseSupplyPanel).
 *
 * 데이터: vendor-setup-data.ts (53개 sub-industry × 카테고리 베이스 폴백)
 *
 * UI 흐름:
 *   1) KEY ACTION 헤로 (왜 이 단계가 필요한지 + 미드나이트 블루 그라디언트)
 *   2) 공급처 (suppliers)
 *   3) 핵심 장비 (equipment)
 *   4) POS · 결제 (pos)
 *   5) 추가 채널 (channels) — 있으면
 *
 * 각 섹션: Apple grouped list 스타일 (rounded card · subtle border · primary/recommended/optional 배지)
 */

import { useMemo, useCallback } from "react";
import {
  Truck,
  Wrench,
  CreditCard,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { getVendorData, type VendorItem } from "./vendor-setup-data";
import { StageWrapup } from "../shared/StageWrapup";
import { MyIngredientsPlanCard } from "./MyIngredientsPlanCard";
import { InitialOrderPlanCard } from "./InitialOrderPlanCard";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.08)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.18)";

type Priority = NonNullable<VendorItem["priority"]>;
type BudgetTier = NonNullable<VendorItem["budgetTier"]>;

// 예산 단계 칩 — 사장님이 자기 예산대에 맞는 업체를 한눈에 구분. (신호등 컬러 회피: 민트·슬레이트·골드 사다리)
const BUDGET_BADGE: Record<BudgetTier, { label: string; bg: string; fg: string; border: string }> = {
  value: {
    label: "가성비",
    bg: "rgba(11,114,133,0.10)",
    fg: "#0b7285",
    border: "rgba(11,114,133,0.20)",
  },
  standard: {
    label: "표준",
    bg: "rgba(15,23,42,0.05)",
    fg: "rgba(15,23,42,0.58)",
    border: "rgba(15,23,42,0.12)",
  },
  premium: {
    label: "프리미엄",
    bg: "rgba(160,120,40,0.12)",
    fg: "#8a6516",
    border: "rgba(160,120,40,0.22)",
  },
};

const PRIORITY_BADGE: Record<Priority, { label: string; bg: string; fg: string; border: string }> = {
  primary: {
    label: "필수",
    bg: "rgba(25,25,112,0.10)",
    fg: MIDNIGHT,
    border: "rgba(25,25,112,0.25)",
  },
  recommended: {
    label: "권장",
    bg: "rgba(5,97,252,0.08)",
    fg: "#0561fc",
    border: "rgba(5,97,252,0.18)",
  },
  optional: {
    label: "선택",
    bg: "rgba(0,0,0,0.04)",
    fg: "rgba(15,23,42,0.60)",
    border: "rgba(0,0,0,0.08)",
  },
};

function VendorRow({
  item,
  selected,
  onToggle,
}: {
  item: VendorItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const priority = item.priority ?? "recommended";
  const badge = PRIORITY_BADGE[priority];
  const budget = item.budgetTier ? BUDGET_BADGE[item.budgetTier] : null;
  const hasUrl = !!item.url;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      style={{
        display: "flex",
        gap: "12px",
        padding: "14px 16px",
        alignItems: "flex-start",
        background: selected ? "rgba(25,25,112,0.04)" : "white",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = "rgba(25,25,112,0.025)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = selected ? "rgba(25,25,112,0.04)" : "white";
      }}
    >
      {/* Selection checkbox (Apple-style) */}
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "100px",
          border: `1.5px solid ${selected ? MIDNIGHT : "rgba(15,23,42,0.18)"}`,
          background: selected ? MIDNIGHT : "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "1px",
          flexShrink: 0,
          transition: "all 0.15s ease",
        }}
      >
        {selected && <Check size={13} strokeWidth={2.5} color="white" />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
          <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
            {item.name}
          </span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "10.5px",
              fontWeight: 700,
              background: badge.bg,
              color: badge.fg,
              border: `1px solid ${badge.border}`,
              letterSpacing: "0.02em",
            }}
          >
            {badge.label}
          </span>
          {budget && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "10.5px",
                fontWeight: 700,
                background: budget.bg,
                color: budget.fg,
                border: `1px solid ${budget.border}`,
                letterSpacing: "0.02em",
              }}
            >
              {budget.label}
            </span>
          )}
          {hasUrl && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ display: "inline-flex", alignItems: "center", color: "rgba(25,25,112,0.55)" }}
              aria-label="외부 링크 열기"
            >
              <ExternalLink size={13} strokeWidth={2.2} />
            </a>
          )}
        </div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.72)", lineHeight: 1.55 }}>
          {item.desc}
        </div>
        {item.priceRange && (
          <div
            style={{
              marginTop: "8px",
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 9px",
              borderRadius: "6px",
              background: "rgba(0,0,0,0.04)",
              fontSize: "11.5px",
              fontWeight: 600,
              color: "rgba(15,23,42,0.65)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {item.priceRange}
          </div>
        )}
      </div>
    </div>
  );
}

function VendorSection({
  icon: Icon,
  title,
  subtitle,
  items,
  step,
  selections,
  onToggle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  items: VendorItem[];
  step: 1 | 2 | 3;
  selections: Record<string, string>;
  onToggle: (step: 1 | 2 | 3, itemName: string) => void;
}) {
  if (!items || items.length === 0) return null;
  // 같은 step 안에서 이미 선택된 vendor name 셋 — VendorRow 의 토글 표시용.
  const selectedNames = new Set<string>();
  for (const [k, v] of Object.entries(selections)) {
    if (k.startsWith(`vendor-setup_s${step}_`) && v) selectedNames.add(v);
  }
  const selectedCount = selectedNames.size;
  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "0 4px" }}>
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: MIDNIGHT_SOFT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} strokeWidth={2.2} color={MIDNIGHT} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
            {title}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: "1px" }}>
            {subtitle}
          </div>
        </div>
        {selectedCount > 0 && (
          <span
            style={{
              padding: "3px 9px",
              borderRadius: "100px",
              fontSize: "11px",
              fontWeight: 700,
              background: MIDNIGHT,
              color: "white",
              letterSpacing: "0.02em",
            }}
          >
            {selectedCount} 선택됨
          </span>
        )}
      </div>

      {/* Apple grouped list */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: `1px solid ${MIDNIGHT_BORDER}`,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(25,25,112,0.04)",
        }}
      >
        {items.map((item, idx) => (
          <div key={`${item.name}-${idx}`}>
            <VendorRow
              item={item}
              selected={selectedNames.has(item.name)}
              onToggle={() => onToggle(step, item.name)}
            />
            {idx < items.length - 1 && (
              <div style={{ height: "1px", background: "rgba(0,0,0,0.05)", marginLeft: "36px" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VendorSetupStage() {
  const d = useDashboardCtx();
  const { selectedIndustryId, industryCategoryId, selectedSpecialtyId, vendorSelections, setVendorSelections, language } = d;

  // ─── 업종군 분기 (2026-07-02 업종 정합 감사) ───────────────────────────
  //   데이터(getVendorData)는 업종별인데 히어로·섹션명·팁·마무리 chrome 이 '식자재·가스·HACCP·폐기율' 외식 고정이던 문제.
  const isFood = industryCategoryId === "food" || industryCategoryId === "cafe-dessert";
  // 공급품 명칭 — 섹션·마무리 chrome 에서 '식자재' 대신 업종별 명사 사용.
  const supplyNoun =
    isFood ? "식자재"
    : industryCategoryId === "retail" ? "상품·재고"
    : industryCategoryId === "beauty" ? "미용 재료"
    : industryCategoryId === "fitness" ? "운동 용품"
    : industryCategoryId === "pet" ? "사료·용품"
    : (industryCategoryId === "education" || industryCategoryId === "space") ? "비품·소모품"
    : "자재·비품";

  const data = useMemo(
    () => getVendorData(selectedIndustryId ?? undefined, industryCategoryId ?? undefined, selectedSpecialtyId ?? undefined),
    [selectedIndustryId, industryCategoryId, selectedSpecialtyId],
  );

  // ── 토글 핸들러 ──────────────────────────────────────────────────
  //   키 스키마: `vendor-setup_s${step}_c${cursor}` (기존 useTaskAutoCompletion / onboarding 와 호환)
  //     · s1 = 공급처 (suppliers)
  //     · s2 = 장비 (equipment)
  //     · s3 = POS · 결제 (pos)
  //   다중 선택: 같은 step 안에서 여러 cursor 슬롯 사용. 토글 OFF 시 해당 슬롯 키를 제거.
  //   useTaskAutoCompletion 가 step 별로 "1개 이상 선택" 검사 → supplier-identified / equipment-planned / pos-selected
  //   task 자동 완료. 자동 저장 (Zustand persist + Supabase user_store_data.vendor_selections).
  const handleToggle = useCallback(
    (step: 1 | 2 | 3, itemName: string) => {
      const prefix = `vendor-setup_s${step}_`;
      const next = { ...vendorSelections };
      // 이미 선택돼 있으면 해제 — 해당 키 제거.
      const existingKey = Object.entries(next).find(([k, v]) => k.startsWith(prefix) && v === itemName)?.[0];
      if (existingKey) {
        delete next[existingKey];
        setVendorSelections(next);
        return;
      }
      // 새로 선택 — 비어있는 cursor 찾아 채우기.
      let cursor = 0;
      while (next[`${prefix}c${cursor}`] !== undefined) cursor += 1;
      next[`${prefix}c${cursor}`] = itemName;
      setVendorSelections(next);
    },
    [vendorSelections, setVendorSelections],
  );

  // sub-industry 라벨 — 폴백 시 카테고리 라벨
  const subLabel = useMemo(() => {
    const subMap: Record<string, string> = {
      "korean-casual": "한식 / 백반 / 캐주얼 식사",
      "delivery-meals": "배달 도시락 / 가정식",
      "salad-healthy": "샐러드 / 헬시 푸드",
      "ramen-noodle": "라면 / 면 요리",
      "chicken-burger": "치킨 / 버거",
      "western-pasta-brunch": "양식 / 파스타 / 브런치",
      "takeout-coffee": "테이크아웃 커피",
      "specialty-coffee": "스페셜티 커피",
      "dessert-cafe": "디저트 카페",
      "bakery-studio": "베이커리 / 제과 스튜디오",
      "icecream-bingsu": "아이스크림 / 빙수",
      "self-serve-cafe": "셀프 / 무인 카페",
      "hair-salon": "헤어 살롱",
      "nail-studio": "네일 스튜디오",
      "skin-care-room": "에스테틱 / 스킨케어",
      "waxing-studio": "왁싱 스튜디오",
      "eyelash-brow": "속눈썹 / 브로우",
      "makeup-bridal": "메이크업 / 브라이덜",
    };
    return subMap[selectedIndustryId ?? ""] ?? null;
  }, [selectedIndustryId]);

  return (
    <div className="bento-fade-in" style={{ marginBottom: "16px" }}>
      {/* ═══════════════════════════════════════════════════════════
          KEY ACTION HERO — Midnight gradient
          ═════════════════════════════════════════════════════════ */}
      <div
        style={{
          marginBottom: "20px",
          padding: "22px 22px 20px",
          borderRadius: "18px",
          background:
            "linear-gradient(135deg, #191970 0%, #2c2c8c 50%, #4a4ab8 100%)",
          color: "white",
          boxShadow: "0 8px 24px rgba(25,25,112,0.22)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", position: "relative", zIndex: 1 }}>
          <Sparkles size={15} strokeWidth={2.2} />
          <span style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.85 }}>
            KEY ACTION
          </span>
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.35, marginBottom: "8px", letterSpacing: "-0.015em", position: "relative", zIndex: 1 }}>
          {subLabel ? `${subLabel}에 맞는 공급처·장비를 지금 발주하세요` : "공급처·장비를 지금 발주하세요"}
        </div>
        <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.9, position: "relative", zIndex: 1 }}>
          개업 4–6주 전이 구매·계약의 골든타임입니다. 한국에서 검증된 도매처와 장비를
          <strong style={{ fontWeight: 700 }}> 견적 → 비교 → 선납 </strong>
          순서로 진행하세요.
        </div>

        {/* 미니 팁 카드 3개 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "16px", position: "relative", zIndex: 1 }}>
          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
              <Lightbulb size={11} strokeWidth={2.2} />
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em" }}>견적 3곳</span>
            </div>
            <div style={{ fontSize: "11px", lineHeight: 1.4, opacity: 0.92 }}>도매·중고·신품 모두 비교</div>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
              <ShieldCheck size={11} strokeWidth={2.2} />
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em" }}>인증 확인</span>
            </div>
            <div style={{ fontSize: "11px", lineHeight: 1.4, opacity: 0.92 }}>{isFood ? "가스·전기 KC 인증 필수" : "전기·주요장비 KC 인증 확인"}</div>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
              <CreditCard size={11} strokeWidth={2.2} />
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em" }}>POS 먼저</span>
            </div>
            <div style={{ fontSize: "11px", lineHeight: 1.4, opacity: 0.92 }}>개업일 1주 전 세팅 끝</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          공급처 (Suppliers)
          ═════════════════════════════════════════════════════════ */}
      <VendorSection
        icon={Truck}
        title={`공급처 · ${supplyNoun}`}
        subtitle={`${data.suppliers.length}개 — 사용할 곳을 탭해 선택 (다중 선택 가능)`}
        items={data.suppliers}
        step={1}
        selections={vendorSelections}
        onToggle={handleToggle}
      />

      {/* ═══════════════════════════════════════════════════════════
          장비 (Equipment)
          ═════════════════════════════════════════════════════════ */}
      <VendorSection
        icon={Wrench}
        title="핵심 장비 · 기기"
        subtitle={`${data.equipment.length}개 — 도입 예정 장비를 탭해 선택`}
        items={data.equipment}
        step={2}
        selections={vendorSelections}
        onToggle={handleToggle}
      />

      {/* ═══════════════════════════════════════════════════════════
          POS · 결제 (POS)
          ═════════════════════════════════════════════════════════ */}
      <VendorSection
        icon={CreditCard}
        title="POS · 결제 시스템"
        subtitle="사용할 POS 를 탭해 선택 — 1주일 전 세팅"
        items={data.pos}
        step={3}
        selections={vendorSelections}
        onToggle={handleToggle}
      />

      {/* ═══════════════════════════════════════════════════════════
          ⚠️ 다른 단계 안내 — 배달앱·SNS·네이버 플레이스 등록은
          이 단계가 아니라 14단계 "운영·마케팅 세팅" 에서 진행
          ═════════════════════════════════════════════════════════ */}
      <div
        style={{
          marginTop: "4px",
          marginBottom: "20px",
          padding: "16px 18px",
          borderRadius: "14px",
          background: "rgba(25,25,112,0.05)",
          border: `1px solid ${MIDNIGHT_BORDER}`,
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: MIDNIGHT_SOFT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ArrowRight size={16} strokeWidth={2.2} color={MIDNIGHT} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, marginBottom: "4px", letterSpacing: "-0.005em" }}>
            배달앱·SNS·네이버 플레이스 등록은 다음 단계에서
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(15,23,42,0.72)", lineHeight: 1.55 }}>
            네이버 플레이스·인스타그램·오픈마켓·예약 같은 <strong style={{ fontWeight: 700, color: MIDNIGHT }}>판매·노출 채널</strong>은{" "}
            <strong style={{ fontWeight: 700, color: MIDNIGHT }}>14단계 "운영·마케팅 세팅"</strong> 에서 진행합니다. 이 단계는
            <strong style={{ fontWeight: 700 }}> {supplyNoun}·장비·POS</strong>를 확정하는 공급망 단계입니다.
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          하단 가이드 노트
          ═════════════════════════════════════════════════════════ */}
      <div
        style={{
          marginTop: "8px",
          padding: "16px 18px",
          borderRadius: "14px",
          background: "rgba(25,25,112,0.04)",
          border: `1px dashed ${MIDNIGHT_BORDER}`,
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: 700, color: MIDNIGHT, marginBottom: "8px", letterSpacing: "0.02em" }}>
          체크리스트 — 이번 주 할 일
        </div>
        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", lineHeight: 1.7, color: "rgba(15,23,42,0.78)" }}>
          <li>필수(파란 점) 표시된 공급처·장비부터 견적 요청</li>
          <li>중고 가능 장비는 황학동온라인·번개장터에서 신품 50–70% 가격으로 비교</li>
          <li>POS는 토스플레이스 무료 단말 가능 — 가맹 신청 후 평균 2–3일 배송</li>
          <li>{isFood ? "식자재 정기 배송은 푸드팡·CJ프레시웨이 견적 비교, 첫 주는 소량 테스트" : `${supplyNoun} 정기 매입처 2~3곳 견적 비교, 첫 주는 소량 테스트 발주`}</li>
        </ul>
      </div>

      {/* ── 초기 발주 계획 — 사장님이 선택한 공급처별 원자재·수량 입력
              → operations-store.inventory 에 itemType="material" 로 자동 등록
              → InventoryOpsCard 즉시 표시. day-1 등록 수고 0. (2026-05-14 신규) ── */}
      <InitialOrderPlanCard ko={language === "ko"} />

      {/* ── 내 식자재·매입 원가 계획 — 재무 검토 단계의 ingredients 칸이 여기서 가져감 ── */}
      <MyIngredientsPlanCard ko={language === "ko"} />

      <StageWrapup
        ko={language === "ko"}
        nextStageLabelKo="사업자등록·인허가"
        doneItemsKo={[
          { label: "1. 공급처 결정", detail: `${supplyNoun}·장비·POS 등 카테고리별 1순위 업체 선정 + 견적서 보관` },
          { label: "2. 장비 발주 계획", detail: "신품·중고 비교 — 황학동온라인·번개장터 활용 50~70%대 가성비 확보" },
          { label: "3. POS·결제 셋업", detail: "토스플레이스·KIS·페이히어 비교 + 무료 단말 신청" },
          { label: "4. 첫 주 발주 일정", detail: `오픈 D-7 기준 ${supplyNoun} 소량 테스트 + 장비 시운전 일정 확정` },
          { label: "5. 월 원가 계획", detail: `공급처 견적 합산 → 월 ${supplyNoun}·매입 원가 추정. 「재무 검토」의 인건비 칸과 동일하게 사장이 직접 입력하는 값.` },
        ]}
        verifyItemsKo={[
          "사업자등록 전 — 거래 가능 여부 확인 (공급처 다수가 사업자번호 없으면 거래 불가, 견적도 비공식)",
          "POS·결제 — 가맹 수수료(평균 1.5~2.5%) + 단말기 임대료 + 부가세 신고 자동화 여부 확인",
          isFood
            ? "식자재 — 위생 인증(HACCP) + 검역증 수령 가능한 업체 선택, 무허가 도매상은 식약처 단속 대상"
            : `${supplyNoun} — 정식 세금계산서 발행 + 품질보증·정품 확인 가능한 업체 선택, 무허가 도매상은 분쟁·환불 리스크`,
          "장비 — 1년 이상 무상 A/S + 설치비·운반비 별도 견적 (계약 시 포함시키기)",
          "중고 장비 — 시운전 영상·구매 영수증·연식 5년 이내 3가지 모두 확보, 분쟁 시 증빙",
          isFood
            ? "재고 회전율 — 식자재는 3일 이내 회전 가능한 양만 첫 주 발주, 폐기율 5% 초과 시 재검토"
            : `재고 회전율 — ${supplyNoun}는 회전 가능한 양만 첫 주 발주, 과잉 재고·유통기한(해당 시) 관리`,
        ]}
        nextSummaryKo="공급처·장비·POS 확정 → 사업자등록·인허가 단계로 진입"
      />
    </div>
  );
}
