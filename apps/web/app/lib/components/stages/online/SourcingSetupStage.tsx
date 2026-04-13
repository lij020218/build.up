"use client";
import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function SourcingSetupStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";

  const sourcingMethods = [
    { name: ko ? "국내 도매" : "Domestic Wholesale", capital: ko ? "50~300만원" : "₩500K~3M", color: "#2563eb", pros: ko ? "빠른 배송, 소량 가능" : "Fast shipping, small MOQ", cons: ko ? "마진 낮음, 경쟁 심함" : "Low margin, high competition", platforms: "도매꾹, 온채널, 도매매" },
    { name: ko ? "해외 직구 (중국)" : "China Import", capital: ko ? "100~500만원" : "₩1M~5M", color: "#d97706", pros: ko ? "원가 최저, 다양한 상품" : "Lowest cost, wide selection", cons: ko ? "배송 2-4주, 품질 관리 어려움" : "2-4 week shipping, QC hard", platforms: "1688.com, 알리바바" },
    { name: ko ? "OEM/ODM 제작" : "OEM/ODM", capital: ko ? "500~3,000만원" : "₩5M~30M", color: "#7c3aed", pros: ko ? "브랜드 구축 가능, 차별화" : "Brand building, differentiation", cons: ko ? "초기 투자 큼, MOQ 높음" : "High initial cost, high MOQ", platforms: "캐파(CAPA), 바로발주" },
    { name: ko ? "위탁판매" : "Consignment", capital: ko ? "0~50만원" : "₩0~500K", color: "#059669", pros: ko ? "재고 부담 없음, 초기 비용 최소" : "No inventory risk, minimal cost", cons: ko ? "마진 10-20%, 품질 통제 불가" : "10-20% margin, no QC", platforms: "도매리스트, 셀러나우" },
  ];

  return (
    <div style={{ display: "grid", gap: "14px", marginBottom: "16px" }}>
      {/* 소싱 방법 비교 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
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
                <span style={{ color: "#059669" }}>+</span> {m.pros}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4, marginBottom: "6px" }}>
                <span style={{ color: "#dc2626" }}>−</span> {m.cons}
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
            { step: "1", title: "히어로 이미지", detail: "배경 제거한 깔끔한 메인 컷. 3초 안에 매력 전달", color: "#dc2626" },
            { step: "2", title: "고객 불안 해소", detail: "교환/반품 정책, 인증 마크, 리뷰 수 강조", color: "#d97706" },
            { step: "3", title: "상세 스펙 표", detail: "소재, 사이즈, 중량 — 표로 정리. 비교가 쉬워야 구매", color: "#2563eb" },
            { step: "4", title: "라이프스타일 컷", detail: "실사용 장면. '내가 쓰면 이렇게 되겠구나' 상상 유도", color: "#059669" },
            { step: "5", title: "리뷰/후기 섹션", detail: "구매자 97.2%가 리뷰 확인. 포토 리뷰가 전환율 3배", color: "#7c3aed" },
            { step: "6", title: "배송/CS 안내", detail: "배송 소요일, 교환/반품 절차, 고객센터 연락처", color: "#6366f1" },
          ] : [
            { step: "1", title: "Hero Image", detail: "Clean main shot. Convey appeal in 3 seconds", color: "#dc2626" },
            { step: "2", title: "Trust Signals", detail: "Return policy, certifications, review count", color: "#d97706" },
            { step: "3", title: "Spec Table", detail: "Material, size, weight in a table format", color: "#2563eb" },
            { step: "4", title: "Lifestyle Shot", detail: "Real usage scenes. Help buyer imagine", color: "#059669" },
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
      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "18px 22px" }}>
        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", marginBottom: "8px" }}>{ko ? "상품 촬영 — 스마트폰으로 충분합니다" : "Product Photos — Smartphone is enough"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {[
            { label: ko ? "필수 장비" : "Essential", items: ko ? "스마트폰 + 삼각대(1만원) + 화이트 배경지(5천원)" : "Phone + tripod + white backdrop" },
            { label: ko ? "조명" : "Lighting", items: ko ? "자연광 최고. 창가에서 촬영. 흐린 날이 최적 (그림자 없음)" : "Natural light best. Overcast = no shadows" },
            { label: ko ? "각도" : "Angles", items: ko ? "정면 + 45도 + 위에서 + 사용 중 최소 4컷" : "Front + 45° + top + in-use, min 4 shots" },
            { label: ko ? "후보정" : "Editing", items: ko ? "배경 제거: remove.bg (무료). 보정: Lightroom 무료" : "BG remove: remove.bg. Edit: Lightroom free" },
          ].map(t => (
            <div key={t.label} style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(5,150,105,0.03)" }}>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "#059669", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "3px" }}>{t.label}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.4 }}>{t.items}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
