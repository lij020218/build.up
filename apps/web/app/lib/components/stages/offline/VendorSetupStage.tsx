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

import { useMemo } from "react";
import {
  Truck,
  Wrench,
  CreditCard,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { getVendorData, type VendorItem } from "./vendor-setup-data";

const MIDNIGHT = "#191970";
const MIDNIGHT_SOFT = "rgba(25,25,112,0.08)";
const MIDNIGHT_BORDER = "rgba(25,25,112,0.18)";

type Priority = NonNullable<VendorItem["priority"]>;

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

function VendorRow({ item }: { item: VendorItem }) {
  const priority = item.priority ?? "recommended";
  const badge = PRIORITY_BADGE[priority];
  const hasUrl = !!item.url;

  const rowContent = (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "14px 16px",
        alignItems: "flex-start",
        background: "white",
        cursor: hasUrl ? "pointer" : "default",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (hasUrl) (e.currentTarget as HTMLElement).style.background = "rgba(25,25,112,0.025)";
      }}
      onMouseLeave={(e) => {
        if (hasUrl) (e.currentTarget as HTMLElement).style.background = "white";
      }}
    >
      {/* Priority dot */}
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "100px",
          background: badge.fg,
          marginTop: "7px",
          flexShrink: 0,
        }}
      />

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
          {hasUrl && (
            <ExternalLink size={13} strokeWidth={2.2} color="rgba(25,25,112,0.55)" />
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

  if (hasUrl) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        {rowContent}
      </a>
    );
  }
  return rowContent;
}

function VendorSection({
  icon: Icon,
  title,
  subtitle,
  items,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  items: VendorItem[];
}) {
  if (!items || items.length === 0) return null;
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
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
            {title}
          </div>
          <div style={{ fontSize: "11.5px", color: "rgba(15,23,42,0.55)", marginTop: "1px" }}>
            {subtitle}
          </div>
        </div>
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
            <VendorRow item={item} />
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
  const { selectedIndustryId, industryCategoryId, selectedSpecialtyId } = d;

  const data = useMemo(
    () => getVendorData(selectedIndustryId ?? undefined, industryCategoryId ?? undefined, selectedSpecialtyId ?? undefined),
    [selectedIndustryId, industryCategoryId, selectedSpecialtyId],
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
            <div style={{ fontSize: "11px", lineHeight: 1.4, opacity: 0.92 }}>가스·전기 KC 인증 필수</div>
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
        title="공급처 · 식자재 · 원자재"
        subtitle={`${data.suppliers.length}개 검증된 한국 도매·정기납품 채널`}
        items={data.suppliers}
      />

      {/* ═══════════════════════════════════════════════════════════
          장비 (Equipment)
          ═════════════════════════════════════════════════════════ */}
      <VendorSection
        icon={Wrench}
        title="핵심 장비 · 기기"
        subtitle={`${data.equipment.length}개 (신품·중고·렌탈 옵션 포함 가격대 기재)`}
        items={data.equipment}
      />

      {/* ═══════════════════════════════════════════════════════════
          POS · 결제 (POS)
          ═════════════════════════════════════════════════════════ */}
      <VendorSection
        icon={CreditCard}
        title="POS · 결제 시스템"
        subtitle="가맹점 점유율과 수수료를 비교해 1주일 전 세팅"
        items={data.pos}
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
            배민·쿠팡이츠·요기요·네이버 플레이스·인스타그램 같은 <strong style={{ fontWeight: 700, color: MIDNIGHT }}>판매·노출 채널</strong>은{" "}
            <strong style={{ fontWeight: 700, color: MIDNIGHT }}>14단계 "운영·마케팅 세팅"</strong> 에서 진행합니다. 이 단계는
            <strong style={{ fontWeight: 700 }}> 식자재·장비·POS</strong>를 확정하는 공급망 단계입니다.
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
          <li>식자재 정기 배송은 푸드팡·CJ프레시웨이 견적 비교, 첫 주는 소량 테스트</li>
        </ul>
      </div>
    </div>
  );
}
