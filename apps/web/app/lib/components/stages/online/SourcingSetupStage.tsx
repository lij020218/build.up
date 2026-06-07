"use client";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { StageWrapup } from "../shared/StageWrapup";
import { KeyActionHero } from "../shared/StageActionHero";

export function SourcingSetupStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";

  const sourcingMethods = [
    { name: ko ? "국내 도매" : "Domestic Wholesale", capital: ko ? "50~300만원" : "₩500K~3M", color: "#191970", pros: ko ? "빠른 배송, 소량 가능" : "Fast shipping, small MOQ", cons: ko ? "마진 낮음, 경쟁 심함" : "Low margin, high competition", platforms: "도매꾹, 온채널, 도매매" },
    { name: ko ? "해외 직구 (중국)" : "China Import", capital: ko ? "100~500만원" : "₩1M~5M", color: "#191970", pros: ko ? "원가 최저, 다양한 상품" : "Lowest cost, wide selection", cons: ko ? "배송 2-4주, 품질 관리 어려움" : "2-4 week shipping, QC hard", platforms: "1688.com, 알리바바" },
    { name: ko ? "OEM/ODM 제작" : "OEM/ODM", capital: ko ? "500~3,000만원" : "₩5M~30M", color: "#7c3aed", pros: ko ? "브랜드 구축 가능, 차별화" : "Brand building, differentiation", cons: ko ? "초기 투자 큼, MOQ 높음" : "High initial cost, high MOQ", platforms: "캐파(CAPA), 바로발주" },
    { name: ko ? "위탁판매" : "Consignment", capital: ko ? "0~50만원" : "₩0~500K", color: "#1d3557", pros: ko ? "재고 부담 없음, 초기 비용 최소" : "No inventory risk, minimal cost", cons: ko ? "마진 10-20%, 품질 통제 불가" : "10-20% margin, no QC", platforms: "도매리스트, 셀러나우" },
  ];

  return (
    <div style={{ display: "grid", gap: "14px", marginBottom: "16px" }}>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko
            ? "KC 인증·상표권 — 소싱 전 확인, 소싱 후엔 늦습니다"
            : "KC certification & trademark — check before sourcing, not after",
          detail: ko
            ? "전자제품·아동용품은 KC 인증 필수, 미인증 판매는 즉시 게시중지·과태료. 상표권 검색은 키프리스(KIPRIS)에서 무료, 5분이면 미리 충돌 피한다."
            : "Electronics and kids' goods require KC certification — selling uncertified means instant takedown and fines. Trademark search is free on KIPRIS; 5 minutes avoids a conflict.",
        }}
      />
      {/* 소싱 방법 비교 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "linear-gradient(180deg, rgba(25,25,112,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "소싱 방법 비교" : "Sourcing Methods"}</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)" }}>{ko ? "예산과 목표에 맞는 방법을 선택하세요" : "Choose based on your budget and goals"}</div>
        </div>
        <div style={{ padding: "0 22px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {sourcingMethods.map(m => (
            <div key={m.name} style={{ padding: "14px", borderRadius: "14px", border: `1px solid ${m.color}10`, background: `${m.color}03` }}>
              <div style={{ fontSize: "14px", fontWeight: 660, color: m.color, marginBottom: "4px" }}>{m.name}</div>
              <div style={{ fontSize: "12px", fontWeight: 650, color: "#0f172a", marginBottom: "6px" }}>{ko ? "초기 자본" : "Capital"}: {m.capital}</div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4, marginBottom: "4px" }}>
                <span style={{ color: "#1d3557" }}>+</span> {m.pros}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4, marginBottom: "6px" }}>
                <span style={{ color: "#b64c4c" }}>−</span> {m.cons}
              </div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(15,23,42,0.35)" }}>{m.platforms}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 상세페이지 작성 가이드 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "상세페이지 구성 순서" : "Detail Page Structure"}</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)" }}>{ko ? "전환율을 높이는 검증된 구성" : "Proven structure for higher conversion"}</div>
        </div>
        <div style={{ padding: "0 22px 16px" }}>
          {(ko ? [
            { step: "1", title: "히어로 이미지", detail: "배경 제거한 깔끔한 메인 컷. 3초 안에 매력 전달", color: "#b64c4c" },
            { step: "2", title: "고객 불안 해소", detail: "교환/반품 정책, 인증 마크, 리뷰 수 강조", color: "#191970" },
            { step: "3", title: "상세 스펙 표", detail: "소재, 사이즈, 중량 — 표로 정리. 비교가 쉬워야 구매", color: "#191970" },
            { step: "4", title: "라이프스타일 컷", detail: "실사용 장면. '내가 쓰면 이렇게 되겠구나' 상상 유도", color: "#1d3557" },
            { step: "5", title: "리뷰/후기 섹션", detail: "구매자 97.2%가 리뷰 확인. 포토 리뷰가 전환율 3배", color: "#7c3aed" },
            { step: "6", title: "배송/CS 안내", detail: "배송 소요일, 교환/반품 절차, 고객센터 연락처", color: "#6366f1" },
          ] : [
            { step: "1", title: "Hero Image", detail: "Clean main shot. Convey appeal in 3 seconds", color: "#b64c4c" },
            { step: "2", title: "Trust Signals", detail: "Return policy, certifications, review count", color: "#191970" },
            { step: "3", title: "Spec Table", detail: "Material, size, weight in a table format", color: "#191970" },
            { step: "4", title: "Lifestyle Shot", detail: "Real usage scenes. Help buyer imagine", color: "#1d3557" },
            { step: "5", title: "Reviews", detail: "97.2% check reviews. Photo reviews 3x conversion", color: "#7c3aed" },
            { step: "6", title: "Shipping/CS", detail: "Delivery time, return process, contact", color: "#6366f1" },
          ]).map(s => (
            <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "8px 0", borderBottom: s.step !== "6" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
        {/* AI 도구 추천 */}
        <div style={{ margin: "0 22px 18px", padding: "12px 14px", borderRadius: "12px", background: "rgba(124,58,237,0.04)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><circle cx="7" cy="7" r="6" stroke="#7c3aed" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <span style={{ fontSize: "12px", color: "rgba(124,58,237,0.8)", lineHeight: 1.55 }}>
            {ko ? "AI 상세페이지 도구: 망고보드 AI 디자이너 (mangoboard.net), 미리캔버스 (miricanvas.com), Canva AI. 상품 사진만 넣으면 상세페이지를 자동 생성합니다." : "AI detail page tools: Mangoboard AI, Miricanvas, Canva AI — auto-generate from product photos."}
          </span>
        </div>
      </div>

      {/* 상품 촬영 팁 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "linear-gradient(180deg, rgba(25,25,112,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "18px 22px" }}>
        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", marginBottom: "8px" }}>{ko ? "상품 촬영 — 스마트폰으로 충분합니다" : "Product Photos — Smartphone is enough"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {[
            { label: ko ? "필수 장비" : "Essential", items: ko ? "스마트폰 + 삼각대(1만원) + 화이트 배경지(5천원)" : "Phone + tripod + white backdrop" },
            { label: ko ? "조명" : "Lighting", items: ko ? "자연광 최고. 창가에서 촬영. 흐린 날이 최적 (그림자 없음)" : "Natural light best. Overcast = no shadows" },
            { label: ko ? "각도" : "Angles", items: ko ? "정면 + 45도 + 위에서 + 사용 중 최소 4컷" : "Front + 45° + top + in-use, min 4 shots" },
            { label: ko ? "후보정" : "Editing", items: ko ? "배경 제거: remove.bg (무료). 보정: Lightroom 무료" : "BG remove: remove.bg. Edit: Lightroom free" },
          ].map(t => (
            <div key={t.label} style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(25,25,112,0.03)" }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "#1d3557", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "3px" }}>{t.label}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.4 }}>{t.items}</div>
            </div>
          ))}
        </div>
      </div>

      <StageWrapup
        ko={ko}
        nextStageLabelKo="스토어 셋업"
        doneItemsKo={[
          { label: "1. 소싱 방식 결정", detail: "국내도매·중국직구·자체제작·OEM·드롭배송 등 5축 비교 후 결정" },
          { label: "2. 1차 공급처 검증", detail: "샘플 주문 + 품질·납기·CS 응답 3축 직접 테스트 후 채택" },
          { label: "3. 마진 계산", detail: "원가 + 부가세 + 배송비 + 플랫폼 수수료 + 광고비 → 마진 30% 이상 확보" },
          { label: "4. 재고·물류 모델", detail: "직접 배송 vs 풀필먼트(쿠팡 로켓그로스·품고·셀러허브) 비교" },
        ]}
        verifyItemsKo={[
          "중국 직구 — 200달러 초과 시 통관 부담, KC 인증 의무 카테고리(전자제품·유아용품 등) 사전 확인",
          "위탁판매·드롭배송 — 공급처 결품 시 본인 책임, CS 분쟁 시 자체 환불 의무 발생",
          "OEM 제작 — MOQ(최소주문량) 보통 500~3000개, 자본·재고 회전 부담 인식",
          "원산지 표시 — 「Made in China」 누락 시 표시광고법 위반, 모든 상품 의무 표시",
          "지식재산 — 캐릭터·로고·디자인 무단 도용 시 상표·디자인권 침해, 시작 전 검색 필수",
          "수입 통관 — 식품·화장품·의료기기는 별도 수입신고 + KC·KFDA·식약처 승인 필수",
        ]}
        nextSummaryKo="소싱·공급처 검증 완료 → 스토어 셋업(상품 등록·배송·CS) 단계로 진입"
      />
    </div>
  );
}
