"use client";

/**
 * DigitalFulfillmentNotice — 디지털 상품·창작자 서비스용 소싱/스토어 안내 (2026-07-02 업종 정합 감사)
 *
 *  배경: online-digital 로드맵은 카테고리로 라우팅돼 digital-products·creator-service 등
 *        무배송 서브타입도 sourcing-setup(중국소싱·KC)·store-setup(택배·포장) 단계를 받았다.
 *        물리 상품 전제라 부적합 → 디지털 서브타입이면 SW 게이팅과 동일하게 안내로 대체.
 *
 *  디지털(무배송) 서브타입 SSOT: starter-data.ts online-digital 하위.
 */

import { DIGITAL_ONLINE_SUBTYPES as SHARED_DIGITAL_SUBTYPES, isDigitalOnlineSubtype } from "@foundone/shared";

const MIDNIGHT = "#191970";

/** 물리 배송이 없는 디지털·창작자 온라인 서브타입 — SSOT는 packages/shared/src/digital-subtypes.ts (재수출). */
export const DIGITAL_ONLINE_SUBTYPES = new Set<string>(SHARED_DIGITAL_SUBTYPES);

export function isDigitalFulfillment(selectedIndustryId: string | null | undefined): boolean {
  return isDigitalOnlineSubtype(selectedIndustryId);
}

type NoticeContent = { title: string; subtitle: string; items: { label: string; detail: string }[] };

const CONTENT: Record<"sourcing" | "store", { ko: NoticeContent; en: NoticeContent }> = {
  sourcing: {
    ko: {
      title: "디지털 상품은 '재고 소싱'이 없습니다",
      subtitle: "중국 직구·도매 매입·KC 인증·통관은 물리 상품 이야기입니다. 디지털 상품·창작자 서비스는 '무엇을 만들고 어떻게 자동 전달하느냐'가 소싱을 대신합니다.",
      items: [
        { label: "원본·라이선스 준비", detail: "판매할 파일·템플릿·강의·에셋의 원본과 사용 라이선스(폰트·이미지·음원 등 2차 저작권) 확보" },
        { label: "제작 파이프라인", detail: "기획 → 제작 → 검수 → 업데이트 주기 정의. 창작자 서비스는 콘텐츠·컨설팅 포맷과 산출물 표준화" },
        { label: "자동 전달 구조", detail: "다운로드 링크·이메일 자동발송·회원 영역 등 결제 즉시 전달되는 구조. 재고 개념 대신 '무한 복제 + 버전 관리'" },
        { label: "품질·업데이트 정책", detail: "무료 업데이트 범위·문의 대응·환불(디지털 청약철회 예외) 기준을 사전에 명문화" },
      ],
    },
    en: {
      title: "Digital products have no inventory sourcing",
      subtitle: "China import, wholesale, KC certification, customs are for physical goods. For digital/creator businesses, 'what you make and how it auto-delivers' replaces sourcing.",
      items: [
        { label: "Masters & licensing", detail: "Secure source files/templates/assets and usage licenses (fonts, images, audio)." },
        { label: "Production pipeline", detail: "Define plan → build → QA → update cadence; standardize creator deliverables." },
        { label: "Auto-delivery", detail: "Download links, email automation, member area — instant delivery on payment." },
        { label: "Quality & update policy", detail: "Spell out update scope, support, and refund (digital withdrawal exceptions)." },
      ],
    },
  },
  store: {
    ko: {
      title: "디지털 상품은 '택배·포장'이 없습니다",
      subtitle: "택배사 계약·포장재·로켓그로스 입고는 물리 상품 이야기입니다. 디지털 판매의 '스토어 세팅'은 자동 전달·결제·구독·약관입니다.",
      items: [
        { label: "판매 채널 세팅", detail: "자체몰(파일 자동전달)·크몽·클래스101·스티비·서브스택 등 디지털 상품에 맞는 채널 선택" },
        { label: "결제·구독 연동", detail: "PG(일회성) + 정기결제(구독) 연동. 뉴스레터·멤버십은 구독 해지·환불 흐름까지 점검" },
        { label: "라이선스·이용약관", detail: "상업/개인 사용 범위, 재판매 금지 등 라이선스 고지 + 디지털콘텐츠 환불 예외 약관 게시" },
        { label: "전달 자동화 테스트", detail: "결제 → 자동 다운로드/접근 권한 부여까지 본인 계정으로 1건 테스트. 실패 시 첫 구매 이탈" },
      ],
    },
    en: {
      title: "Digital products have no shipping/packaging",
      subtitle: "Courier contracts, packaging, fulfillment centers are for physical goods. Digital store setup is auto-delivery, payments, subscriptions, and terms.",
      items: [
        { label: "Sales channels", detail: "Own site (auto file delivery), Kmong, Class101, Stibee, Substack — channels for digital goods." },
        { label: "Payments & subscriptions", detail: "PG (one-time) + recurring billing; check cancel/refund flows for memberships." },
        { label: "Licensing & terms", detail: "State commercial/personal scope, no-resale, and digital-content refund exceptions." },
        { label: "Delivery automation test", detail: "Run one real purchase → auto download/access grant. Failure = first-buyer churn." },
      ],
    },
  },
};

export function DigitalFulfillmentNotice({ stage, ko }: { stage: "sourcing" | "store"; ko: boolean }) {
  const c = ko ? CONTENT[stage].ko : CONTENT[stage].en;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ padding: "22px 22px 20px", borderRadius: "18px", background: `linear-gradient(135deg, ${MIDNIGHT} 0%, #2c2c8c 50%, #4a4ab8 100%)`, color: "white", boxShadow: "0 8px 24px rgba(25,25,112,0.22)" }}>
        <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.85, marginBottom: "10px" }}>
          {ko ? "디지털 상품 트랙" : "Digital product track"}
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.35, marginBottom: "8px", letterSpacing: "-0.015em" }}>{c.title}</div>
        <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.9 }}>{c.subtitle}</div>
      </div>

      <div style={{ background: "white", borderRadius: "14px", border: "1px solid rgba(25,25,112,0.18)", overflow: "hidden", boxShadow: "0 1px 3px rgba(25,25,112,0.04)" }}>
        {c.items.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", padding: "14px 16px", alignItems: "flex-start", borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.07)" : "none" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "100px", background: MIDNIGHT, marginTop: "6px", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "14.5px", fontWeight: 700, color: "#0f172a", marginBottom: "3px" }}>{it.label}</div>
              <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>{it.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
