"use client";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { StageWrapup } from "../shared/StageWrapup";

export function PlatformSetupStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const opsSelections = d.opsSelections;
  const setOpsSelections = d.setOpsSelections;

  type PlatItem = { id: string; name: string; desc: string; color: string; url: string; fee: string; mau: string; pros: string[]; cons: string[] };
  const platforms: PlatItem[] = [
    { id: "smartstore", name: ko ? "네이버 스마트스토어" : "Naver Smartstore", desc: ko ? "쇼핑 검색 1위 · 결제수수료 최저" : "#1 shopping search · Lowest fee", color: "#03C75A", url: "https://sell.smartstore.naver.com", fee: ko ? "주문 1.98~3.74% + 판매 0.91~2.73%" : "Order 1.98~3.74% + Sale 0.91~2.73%", mau: "536만", pros: ko ? ["네이버 검색 노출 최강", "결제 수수료 최저 수준", "쇼핑라이브 가능", "스마트스토어 센터 무료"] : ["Best Naver search", "Lowest fees", "Shopping Live"], cons: ko ? ["광고 없이 초기 노출 어려움", "경쟁 셀러 매우 많음"] : ["Hard initial exposure", "Many competitors"] },
    { id: "coupang-mp", name: ko ? "쿠팡 마켓플레이스" : "Coupang Marketplace", desc: ko ? "이커머스 MAU 1위 · 로켓그로스" : "#1 ecommerce MAU · Rocket Growth", color: "#1460F3", url: "https://wing.coupang.com", fee: ko ? "4~10.8% + 월 55,000원" : "4~10.8% + ₩55K/mo", mau: "3,339만", pros: ko ? ["최대 트래픽 (MAU 3,339만)", "로켓그로스 풀필먼트", "와우 멤버십 노출 우선"] : ["Most traffic", "Rocket Growth", "Wow priority"], cons: ko ? ["월 정액비 55,000원", "가격 경쟁 심화", "수수료 높은 편"] : ["₩55K monthly", "Price competition", "Higher fees"] },
    { id: "kakao-store", name: ko ? "카카오톡 스토어" : "KakaoTalk Store", desc: ko ? "카톡 4,700만 사용자 · 선물하기" : "47M KakaoTalk · Gifting", color: "#F9E000", url: "https://store.kakaotalk.com", fee: ko ? "3.3~10% (경로별), 선물하기 ~15%" : "3.3~10%, Gifting ~15%", mau: "4,700만", pros: ko ? ["카톡 메시지 직접 마케팅", "선물하기 입점 가능", "간편결제 연동"] : ["Direct KakaoTalk marketing", "Gift feature"], cons: ko ? ["선물하기 수수료 ~15%", "자체 검색 유입 약함"] : ["~15% gift fee", "Weak organic search"] },
    { id: "elevenst", name: ko ? "11번가" : "11st", desc: ko ? "신규 셀러 12개월 수수료 6%로 할인" : "New seller 6% for 12 months", color: "#FF0000", url: "https://soffice.11st.co.kr", fee: ko ? "7~13% (카테고리별), 신규 6%" : "7~13%, new seller 6%", mau: "893만", pros: ko ? ["신규 12개월 수수료 할인", "SKT 멤버십 연계", "아마존 글로벌 연동"] : ["12-month discount", "SKT members"], cons: ko ? ["트래픽 감소 추세", "수수료 높은 편"] : ["Declining traffic", "Higher fees"] },
    { id: "gmarket", name: ko ? "G마켓/옥션" : "G-Market/Auction", desc: ko ? "묶음배송 · 해외판매 연동" : "Bundle shipping · Global selling", color: "#00A34F", url: "https://www.gmarket.co.kr", fee: ko ? "4~15% (평균 9%)" : "4~15% (avg 9%)", mau: "706만+296만", pros: ko ? ["묶음 배송 시스템", "해외 판매 eBay 연동", "광고 효율 양호"] : ["Bundle shipping", "eBay global"], cons: ko ? ["트래픽 감소 추세", "수수료 높은 편"] : ["Declining traffic"] },
  ];

  const selectedCount = platforms.filter(p => opsSelections[`platform-${p.id}`]).length;

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.38)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
          {ko ? "판매 플랫폼 비교 · 선택" : "Compare & Select Platforms"}
        </span>
        {selectedCount > 0 && (
          <span style={{ fontSize: "11px", fontWeight: 600, color: "rgb(0,122,255)", background: "rgba(0,122,255,0.1)", padding: "2px 8px", borderRadius: "100px" }}>
            {selectedCount}{ko ? "개 선택" : " selected"}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gap: "10px" }}>
        {platforms.map((item) => {
          const selKey = `platform-${item.id}`;
          const isSelected = !!opsSelections[selKey];
          return (
            <div key={item.id}
              style={{
                background: isSelected ? `${item.color}06` : "white",
                borderRadius: "18px", overflow: "hidden", cursor: "pointer",
                border: isSelected ? `1.5px solid ${item.color}30` : "1px solid rgba(0,0,0,0.06)",
                boxShadow: isSelected ? `0 0 0 3px ${item.color}08` : "0 1px 4px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease",
              }}
              onClick={() => setOpsSelections((prev: Record<string, boolean>) => ({ ...prev, [selKey]: !prev[selKey] }))}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px" }}>
                <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.15)", background: isSelected ? item.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                  {isSelected && <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: item.id === "coupang-mp" || item.id === "coupangeats" ? item.color : `${item.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: item.id === "elevenst" ? "15px" : "17px", fontWeight: 750, color: item.id === "coupang-mp" || item.id === "coupangeats" ? "#fff" : item.color }}>{item.id === "elevenst" ? "11" : item.name.charAt(0)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "15px", fontWeight: isSelected ? 660 : 600, color: isSelected ? item.color : "var(--text)", letterSpacing: "-0.02em" }}>{item.name}</span>
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "6px", background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)" }}>MAU {item.mau}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45 }}>{item.desc}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px", padding: "3px 10px", borderRadius: "8px", background: `${item.color}0a`, fontSize: "11px", fontWeight: 620, color: item.color }}>
                    {ko ? "수수료" : "Fee"}: {item.fee}
                  </div>
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "50%", background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.35)", textDecoration: "none" }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </div>
              {isSelected && (
                <div style={{ padding: "0 18px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }} className="bento-fade-in">
                  <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(5,150,105,0.04)" }}>
                    <div style={{ fontSize: "10px", fontWeight: 650, color: "#059669", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>{ko ? "장점" : "Pros"}</div>
                    {item.pros.map((p, pi) => (
                      <div key={pi} style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5, display: "flex", gap: "4px" }}>
                        <span style={{ color: "#059669", flexShrink: 0 }}>+</span> {p}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(220,38,38,0.03)" }}>
                    <div style={{ fontSize: "10px", fontWeight: 650, color: "#dc2626", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>{ko ? "주의" : "Cons"}</div>
                    {item.cons.map((c, ci) => (
                      <div key={ci} style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5, display: "flex", gap: "4px" }}>
                        <span style={{ color: "#dc2626", flexShrink: 0 }}>-</span> {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "12px", background: "rgba(0,122,255,0.06)", marginTop: "10px" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="7" cy="7" r="6" stroke="rgb(0,122,255)" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="rgb(0,122,255)" strokeWidth="1.4" strokeLinecap="round"/></svg>
        <span style={{ fontSize: "12px", color: "rgba(0,80,200,0.75)", lineHeight: 1.5 }}>
          {ko ? "스마트스토어는 수수료가 가장 낮아 필수입니다. 쿠팡은 트래픽이 가장 크지만 월 정액비가 있어 매출이 안정된 후 추가하세요." : "Smartstore is essential due to lowest fees. Add Coupang after sales stabilize due to monthly fee."}
        </span>
      </div>

      {/* 개설 순서 가이드 */}
      <div style={{ marginTop: "20px", padding: "18px", borderRadius: "16px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: "13px", fontWeight: 650, color: "#0f172a", marginBottom: "10px" }}>{ko ? "추천 개설 순서" : "Recommended Setup Order"}</div>
        {[
          { step: "1", text: ko ? "네이버 스마트스토어 개설 (사업자등록증 필요, 당일~1일 심사)" : "Open Naver Smartstore (business registration needed, 0~1 day review)" },
          { step: "2", text: ko ? "인스타그램 비즈니스 + 네이버 플레이스 등록 (무료, 즉시)" : "Register Instagram Business + Naver Place (free, instant)" },
          { step: "3", text: ko ? "매출 안정 후 쿠팡 마켓플레이스 추가 (월 55,000원 정액비)" : "Add Coupang Marketplace after stable sales (₩55K/month)" },
          { step: "4", text: ko ? "카카오톡 스토어 · 11번가 등 추가 채널 확장" : "Expand to KakaoTalk Store, 11st, etc." },
        ].map((s) => (
          <div key={s.step} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
            <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)", lineHeight: 1.5 }}>{s.text}</div>
          </div>
        ))}
      </div>

      <StageWrapup
        ko={ko}
        nextStageLabelKo="온라인 사업자등록"
        doneItemsKo={[
          { label: "1. 판매 플랫폼 비교", detail: "스마트스토어·쿠팡·카카오·11번가 4축 수수료·MAU 비교" },
          { label: "2. 1차 플랫폼 결정", detail: "스마트스토어 우선 + 매출 안정 후 쿠팡 추가 순서 권장" },
          { label: "3. 멀티 채널 전략", detail: "2개 이상 운영 시 샵링커·올라 등 통합 솔루션 미리 검토" },
          { label: "4. 수수료·정산 시뮬", detail: "결제 수수료 + 카테고리 판매수수료 + 광고비 합산 마진 시뮬" },
        ]}
        verifyItemsKo={[
          "사업자등록 + 통신판매업 신고 사전 확인 — 스마트스토어 외 모든 플랫폼은 통신판매업 신고증 필수",
          "스마트스토어 — 일반과세자/간이과세자별 수수료 차이 + 매월 정산일·세금계산서 발급 일정",
          "쿠팡 — 월 정액비 55,000원 + 로켓그로스 입점 시 별도 수수료, 첫 매출 전 부담 인식",
          "오픈마켓 약관 — 분쟁 시 「플랫폼 책임 면책」 조항 다수, 사진·증빙 자체 보관 필수",
          "PG사 별도 — 일부 플랫폼은 자체 PG 강제, 통합 PG(이니시스·KG이니시스 등) 비교",
          "광고비 — 네이버 검색광고·쿠팡 광고 모두 ROAS 200% 이상 못 맞추면 적자, 단가 시뮬 필수",
        ]}
        nextSummaryKo="플랫폼 선택·개설 순서 확정 → 온라인 사업자등록·통신판매 신고 단계로 진입"
      />
    </div>
  );
}
