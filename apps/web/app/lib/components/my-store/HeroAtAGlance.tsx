"use client";

/**
 * HeroAtAGlance — 페이지 최상단 명함.
 * 사진 + 상호 + 업종/세부업종/모델 + 위치 + 영업시간 + 운영 N일째 + 핵심 6숫자.
 *
 * 핵심 숫자는 산수만 (LLM 0):
 *  · 누적 매출 (since 사업 시작) = sum(dailyEntries.sales)
 *  · 잔고 = currentBalanceManualKrw (사장 입력) ?? cashflow-store.currentBalance
 *  · 런웨이 = 잔고 / 월 burn
 *  · 직원 수 = peopleDirectory.filter(employee).length
 *  · 거래처 수 = peopleDirectory.filter(vendor).length
 *  · 업종별 1지표 = (예) 단골 N · 메뉴 N · 상품 N
 */

import { MapPin, Clock, Building2 } from "lucide-react";
import { PALETTE } from "./styles";
import { StorePhotoUploader } from "./StorePhotoUploader";
import { SaveStatusBadge } from "./SaveStatusBadge";
import { DDayWidget, type DDayItem } from "./DDayWidget";

type HeroProps = {
  ko: boolean;
  storeName: string;
  mission?: string;
  shortDescription: string;
  categoryLabel: string;
  subIndustryLabel: string;
  businessModelLabel: string;
  addressRoad: string;
  addressDetail: string;
  openTime: string | null;
  closeTime: string | null;
  daysOperating: number | null;
  launchDate: string | null;
  storePhotos: Array<{ url: string; caption?: string }>;
  /** 핵심 숫자 6개 — 호출부에서 산수 끝낸 결과 */
  metrics: Array<{ label: string; value: string; tone?: "good" | "warn" | "bad" | "neutral" }>;
  /** 저장 상태 — Hero 우상단에 absolute 배치되어 카드 높이 영향 0 */
  saveStatus?: "idle" | "saving" | "saved" | "error";
  saveLastSavedAt?: string | null;
  saveError?: string | null;
  /** D-Day 위젯용 항목 — Hero 우상단에 함께 배치 */
  ddayItems?: DDayItem[];
};

export function HeroAtAGlance(p: HeroProps) {
  const ko = p.ko;
  // 사진은 StorePhotoUploader 가 내부에서 store 직접 구독 — props 통한 storePhotos 는 미사용

  return (
    <section style={{
      borderRadius: 24,
      overflow: "visible" as const, // 우상단 status pill 이 Hero 모서리 위로 살짝 떠도 잘리지 않게
      background: "linear-gradient(135deg, #F7F8FE 0%, #EEF0FB 50%, #E5E8F7 100%)",
      border: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
      boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 32px rgba(25,25,112,0.06)",
      position: "relative" as const,
    }}>
      {/* Ambient glow — overflow:hidden 영역 안에서만 잘리게 inner clip 박스 */}
      <div style={{ position: "absolute" as const, inset: 0, borderRadius: 24, overflow: "hidden" as const, pointerEvents: "none" as const }}>
        <div aria-hidden style={{
          position: "absolute" as const, top: -120, right: -100,
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(91,107,255,0.10) 0%, rgba(91,107,255,0) 70%)",
        }} />
      </div>

      {/* 우상단 status + D-Day — Hero 안의 absolute 영역 (카드 높이 영향 0) */}
      <div style={{
        position: "absolute" as const,
        top: 14,
        right: 14,
        display: "flex",
        alignItems: "center" as const,
        gap: 8,
        zIndex: 5,
        flexWrap: "wrap" as const,
        justifyContent: "flex-end" as const,
      }}>
        {p.ddayItems && p.ddayItems.length > 0 && <DDayWidget items={p.ddayItems} ko={ko} />}
        {p.saveStatus !== undefined && <SaveStatusBadge ko={ko} status={p.saveStatus} lastSavedAt={p.saveLastSavedAt ?? null} errorMessage={p.saveError ?? null} />}
      </div>

      <div style={{ display: "flex", gap: 0, flexWrap: "wrap" as const, alignItems: "stretch", position: "relative" as const, zIndex: 1 }}>
        {/* 사진 — 좌상단만 라운드. 좌하단은 메트릭 스트립이 차지하므로 sharp */}
        <div style={{
          flex: "0 0 280px",
          minWidth: 240,
          minHeight: 240,
          position: "relative" as const,
          overflow: "hidden" as const,
          borderTopLeftRadius: 24,
        }}>
          <StorePhotoUploader ko={ko} variant="hero" />
        </div>

        {/* 정보 */}
        <div style={{ flex: 1, minWidth: 280, padding: "26px 28px", display: "flex", flexDirection: "column" as const, gap: 12 }}>
          {/* eyebrow: 카테고리 ▸ 세부업종 ▸ 모델
              우상단 status/D-Day 영역 (≈200px) 과 겹치지 않도록 paddingRight 확보 + flex-wrap.
              긴 텍스트 (예: "음식점 ▸ 한식 (국밥·김밥…) ▸ DINE-IN-DELIVERY-RETAIL") 가 pill 영역 밑으로 들어가는 버그 수정. */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: PALETTE.MIDNIGHT, opacity: 0.7,
            letterSpacing: "0.08em", textTransform: "uppercase" as const,
            display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const,
            lineHeight: 1.55,
            paddingRight: 200, // ← 우상단 absolute pills 영역 회피
          }}>
            <Building2 size={11} strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <span>{p.categoryLabel}</span>
            {p.subIndustryLabel && <><span style={{ opacity: 0.4 }}>▸</span><span>{p.subIndustryLabel}</span></>}
            {p.businessModelLabel && <><span style={{ opacity: 0.4 }}>▸</span><span>{p.businessModelLabel}</span></>}
          </div>

          {/* 상호 + 한줄 소개 + 미션 */}
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: PALETTE.MIDNIGHT_DEEP, letterSpacing: "-0.03em", lineHeight: 1.2, margin: 0 }}>
              {p.storeName || (ko ? "내 가게" : "My Store")}
            </h1>
            {p.shortDescription && (
              <div style={{ fontSize: 14, color: PALETTE.MUTED, marginTop: 4, lineHeight: 1.5, fontWeight: 500 }}>
                {p.shortDescription}
              </div>
            )}
            {p.mission && (
              // ⚠️ 사이드 컬러 (borderLeft) 절대 추가 금지 — 사용자가 여러 번 강조한 톤 가이드.
              //    MISSION eyebrow + body 만으로 미션을 표현. 차분한 1px outline 만 사용.
              <div style={{
                marginTop: 10,
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(25,25,112,0.04)",
                border: `1px solid rgba(25,25,112,0.08)`,
                fontSize: 13,
                lineHeight: 1.55,
                color: PALETTE.MIDNIGHT_DEEP,
                fontWeight: 500,
                fontStyle: "italic" as const,
                letterSpacing: "-0.005em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden" as const,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, fontStyle: "normal" as const, color: PALETTE.MIDNIGHT, opacity: 0.65, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginRight: 6 }}>
                  {ko ? "MISSION" : "Mission"}
                </span>
                "{p.mission}"
              </div>
            )}
          </div>

          {/* 주소 + 영업시간 + 운영일수 */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "10px 16px", fontSize: 12.5, color: PALETTE.MUTED, fontWeight: 500 }}>
            {p.addressRoad && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <MapPin size={12} strokeWidth={1.5} />
                {p.addressRoad}
                {p.addressDetail && <span style={{ opacity: 0.65 }}> · {p.addressDetail}</span>}
              </span>
            )}
            {(p.openTime || p.closeTime) && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontVariantNumeric: "tabular-nums" as const }}>
                <Clock size={12} strokeWidth={1.5} />
                {p.openTime ?? "—"} – {p.closeTime ?? "—"}
              </span>
            )}
            {p.daysOperating !== null && p.daysOperating >= 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: PALETTE.MIDNIGHT, fontWeight: 700, fontVariantNumeric: "tabular-nums" as const }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: PALETTE.SUCCESS, boxShadow: `0 0 8px ${PALETTE.SUCCESS}` }} />
                {ko ? `운영 ${p.daysOperating}일째` : `Day ${p.daysOperating}`}
                {p.launchDate && <span style={{ color: PALETTE.HINT, fontWeight: 500 }}>· {p.launchDate}</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 핵심 숫자 스트립 — 카드 하단 모서리 라운드 명시 (Hero 가 overflow:visible) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(p.metrics.length, 6)}, minmax(0, 1fr))`,
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(8px)" as const,
        borderTop: `1px solid ${PALETTE.MIDNIGHT_BORDER}`,
        padding: "16px 24px",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        position: "relative" as const,
        zIndex: 1,
      }}>
        {p.metrics.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            flexDirection: "column" as const,
            gap: 3,
            padding: "0 12px",
            borderRight: i < p.metrics.length - 1 ? `1px solid ${PALETTE.MIDNIGHT_BORDER}` : "none",
            minWidth: 0,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: PALETTE.MIDNIGHT, opacity: 0.6, letterSpacing: "0.06em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
              {m.label}
            </span>
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              color: m.tone === "bad" ? PALETTE.DANGER : m.tone === "warn" ? PALETTE.WARN : m.tone === "good" ? PALETTE.SUCCESS : PALETTE.MIDNIGHT_DEEP,
              letterSpacing: "-0.025em",
              fontVariantNumeric: "tabular-nums" as const,
              lineHeight: 1.2,
              whiteSpace: "nowrap" as const,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
