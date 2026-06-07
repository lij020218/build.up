"use client";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { StageWrapup } from "../shared/StageWrapup";
import { KeyActionHero } from "../shared/StageActionHero";

export function StoreSetupStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const opsSelections = d.opsSelections;

  // 이전 단계에서 선택한 플랫폼 확인
  const selectedPlatforms = Object.keys(opsSelections).filter(k => k.startsWith("platform-") && opsSelections[k]).map(k => k.replace("platform-", ""));

  return (
    <div style={{ display: "grid", gap: "14px", marginBottom: "16px" }}>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko
            ? "상세페이지·배송·반품 정책 — 첫 100주문 전에 모두 라이브"
            : "Detail pages, shipping, returns — all live before your first 100 orders",
          detail: ko
            ? "카테고리·배너·반품 정책 + 택배사 연동 + (자체몰) PG 연동 + CS 채널(카톡·톡톡) + 포장재 풀세트 실제 워크플로 테스트. 첫 주문 와서 막히면 리뷰가 망가진다."
            : "Categories, banners, return policy + courier integration + (own mall) PG + CS channels + packaging — test the real workflow. Getting stuck on order #1 wrecks your reviews.",
        }}
      />
      {/* 선택된 플랫폼 안내 */}
      {selectedPlatforms.length > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: "14px", background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.08)", display: "flex", gap: "8px", alignItems: "center" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#191970" strokeWidth="1.4"/><path d="M4.5 7l2 2 3-3" stroke="#191970" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#191970" }}>
            {ko ? `이전 단계에서 선택한 플랫폼: ${selectedPlatforms.length}개 — 아래에서 각 플랫폼의 세부 설정을 완료하세요` : `${selectedPlatforms.length} platforms selected — complete setup for each below`}
          </span>
        </div>
      )}
      {/* 플랫폼별 스토어 세팅 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "linear-gradient(180deg, rgba(25,25,112,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "플랫폼별 스토어 세팅" : "Platform Store Setup"}</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)" }}>{ko ? "각 플랫폼의 필수 설정 항목을 빠짐없이 완료하세요" : "Complete all required settings for each platform"}</div>
        </div>
        <div style={{ padding: "0 22px 16px", display: "grid", gap: "10px" }}>
          {[
            {
              name: ko ? "네이버 스마트스토어" : "Naver Smartstore",
              color: "#03C75A", url: "https://sell.smartstore.naver.com",
              steps: ko ? [
                "스마트스토어 센터 → 판매자 정보 등록 (사업자등록증 + 통신판매업 신고증)",
                "스토어 기본 설정: 스토어명, 로고, 대표 이미지, 소개글",
                "배송 템플릿 설정: 배송비 (무료/조건부/유료), 출고지, 반품지 주소",
                "교환/반품 정책 작성 (7일 이내 교환/반품, 왕복 택배비 5,000원 등)",
                "정산 계좌 등록 (법인/개인 계좌 + 세금계산서 발행 설정)",
                "쇼핑윈도 카테고리 신청 (의류, 식품 등 카테고리별 추가 심사 필요)",
              ] : [
                "Register seller info (business registration + telecom filing)",
                "Store basics: name, logo, cover image, description",
                "Shipping template: fee policy, warehouse address, return address",
                "Return/exchange policy (7 days, round-trip ₩5,000, etc.)",
                "Settlement account registration",
                "Shopping Window category application if needed",
              ],
            },
            {
              name: ko ? "쿠팡 마켓플레이스" : "Coupang Marketplace",
              color: "#1460F3", url: "https://wing.coupang.com",
              steps: ko ? [
                "WING 판매자 센터 가입 → 사업자 인증",
                "상품 등록: 카테고리 선택 → 필수 옵션 입력 (사이즈, 색상 등)",
                "로켓그로스 입점 검토 (월 55,000원 + 수수료 4~10.8%)",
                "배송 설정: 일반 배송 vs 로켓그로스 (쿠팡 물류센터 입고)",
                "로켓그로스 입고 시: 바코드 부착 → 쿠팡 물류센터 택배 발송",
                "정산 주기 확인: 구매확정 후 영업일 기준 정산 (보통 7~14일)",
              ] : [
                "Register on WING Seller Center",
                "Product listing: category → required options (size, color)",
                "Rocket Growth enrollment (₩55K/mo + 4~10.8% commission)",
                "Shipping: standard vs Rocket Growth (Coupang warehouse)",
                "Rocket Growth: barcode labeling → ship to Coupang warehouse",
                "Settlement cycle: ~7-14 business days after purchase confirmation",
              ],
            },
            {
              name: ko ? "11번가" : "11st",
              color: "#FF0000", url: "https://soffice.11st.co.kr",
              steps: ko ? [
                "셀러오피스 가입 → 신규 셀러 수수료 6% 혜택 (12개월)",
                "상품 등록: 카탈로그 매칭 (기존 상품) 또는 신규 등록",
                "배송 설정: 기본 배송비 + 도서산간 추가 배송비 설정",
                "SKT 멤버십 연동 설정 (T멤버십 적립/사용 활성화)",
                "아마존 글로벌셀링 연동 (해외 판매 시)",
              ] : [
                "Register on Seller Office → 6% new seller discount (12 months)",
                "Product listing: catalog matching or new registration",
                "Shipping config: base fee + island surcharge",
                "SKT membership integration",
                "Amazon global selling integration (for international)",
              ],
            },
          ].map(platform => (
            <div key={platform.name} style={{ borderRadius: "16px", border: `1px solid ${platform.color}10`, background: `${platform.color}02`, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: platform.name.includes("쿠팡") || platform.name.includes("Coupang") ? platform.color : `${platform.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 750, color: platform.name.includes("쿠팡") || platform.name.includes("Coupang") ? "#fff" : platform.color }}>{platform.name.charAt(0)}</span>
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: 660, color: "#0f172a" }}>{platform.name}</span>
                </div>
                <a href={platform.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ padding: "5px 12px", borderRadius: "8px", background: platform.color, color: "#fff", fontSize: "11px", fontWeight: 650, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                  {ko ? "바로가기" : "Go"} <svg width="10" height="10" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </div>
              <div style={{ padding: "0 16px 14px" }}>
                {platform.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "6px 0", borderBottom: i < platform.steps.length - 1 ? "1px solid rgba(0,0,0,0.03)" : "none" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: `${platform.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: platform.color, flexShrink: 0, marginTop: "1px" }}>{i + 1}</div>
                    <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 택배사 계약 가이드 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "linear-gradient(180deg, rgba(25,25,112,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "택배 계약 가이드" : "Courier Contract Guide"}</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)" }}>{ko ? "초기에는 우체국택배 → 물량 늘면 계약택배로 전환" : "Start with post office → switch to contract when volume grows"}</div>
        </div>
        <div style={{ padding: "0 22px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {[
            { name: ko ? "우체국택배 (시작)" : "Korea Post (start)", price: "2,700원~/건", color: "#004098", desc: ko ? "도서산간 추가 없음. 소량에 최적. 우체국 직접 접수" : "No island surcharge. Best for small volume", tag: ko ? "추천: 일 1-5건" : "Rec: 1-5/day", url: "https://parcel.epost.go.kr" },
            { name: "CJ대한통운", price: "1,850원~/건 (계약)", color: "#003C71", desc: ko ? "점유율 1위. D+1 배송. 편의점 접수. 물량 30건+/월 시 계약 가능" : "#1 courier. D+1. Convenience store pickup", tag: ko ? "추천: 일 5건+" : "Rec: 5+/day", url: "https://www.cjlogistics.com" },
            { name: ko ? "한진택배" : "Hanjin", price: "3,000원~/건 (계약)", color: "#FF6600", desc: ko ? "중대형 화물 강점. 전국 A/S망" : "Good for mid-large items", tag: ko ? "대형 상품" : "Large items", url: "https://www.hanjin.co.kr" },
            { name: ko ? "로젠택배" : "Logen", price: "3,000원~/건 (계약)", color: "#2B4C9B", desc: ko ? "계약 할인폭 큰 편. 온라인 접수 편리" : "Good contract discounts", tag: ko ? "가격 협상" : "Negotiate", url: "https://www.ilogen.com" },
          ].map(c => (
            <div key={c.name} style={{ padding: "12px 14px", borderRadius: "14px", border: `1px solid ${c.color}10`, background: `${c.color}03` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 660, color: "#0f172a" }}>{c.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 650, padding: "2px 6px", borderRadius: "4px", background: `${c.color}0a`, color: c.color }}>{c.tag}</span>
                  <a href={c.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ width: "22px", height: "22px", borderRadius: "6px", background: `${c.color}0a`, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                    <svg width="10" height="10" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke={c.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>
                </div>
              </div>
              <div style={{ fontSize: "15px", fontWeight: 740, color: c.color, marginBottom: "4px" }}>{c.price}</div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{c.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ margin: "0 22px 18px", padding: "12px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.04)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><circle cx="7" cy="7" r="6" stroke="#191970" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="#191970" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <span style={{ fontSize: "12px", color: "rgba(180,95,6,0.8)", lineHeight: 1.55 }}>
            {ko ? "택배비 협상 팁: 월 30건 이상이면 계약택배 요청 가능. CJ대한통운 1588-1255로 전화하여 '온라인 셀러 계약 택배' 문의하세요. 초기 단가 2,500~3,000원 가능." : "Negotiate tip: CJ Logistics offers contract rates at 30+ shipments/month. Call 1588-1255 for 'online seller contract'. Starting rate ₩2,500-3,000."}
          </span>
        </div>
      </div>

      {/* 필수 설정 체크리스트 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.08)", background: "linear-gradient(180deg, rgba(25,25,112,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", marginBottom: "10px" }}>{ko ? "오픈 전 필수 확인 사항" : "Pre-launch Checklist"}</div>
        <div style={{ display: "grid", gap: "6px" }}>
          {(ko ? [
            { item: "교환/반품 정책을 스토어에 등록했는가?", why: "미등록 시 고객 분쟁 + 플랫폼 패널티" },
            { item: "배송비 정책이 설정되었는가? (무료/조건부/유료)", why: "배송비 무료 설정 시 상품가에 포함해야 마진 유지" },
            { item: "정산 계좌가 등록되었는가?", why: "미등록 시 매출금 수령 불가" },
            { item: "사업자 정보가 정확히 입력되었는가?", why: "사업자등록증과 불일치 시 정산 보류" },
            { item: "테스트 주문을 해봤는가?", why: "실제 결제→배송→정산 전 과정 1회 테스트 필수" },
            { item: "고객 문의 응대 채널이 준비되었는가?", why: "채널톡/카카오톡 상담 연동. 24시간 내 응답이 판매자 등급에 영향" },
          ] : [
            { item: "Return/exchange policy registered?", why: "No policy = disputes + platform penalties" },
            { item: "Shipping fee policy set?", why: "Free shipping must be included in product price" },
            { item: "Settlement account registered?", why: "No account = cannot receive sales revenue" },
            { item: "Business info matches registration?", why: "Mismatch = settlement hold" },
            { item: "Test order completed?", why: "Test payment → shipping → settlement flow once" },
            { item: "Customer inquiry channel ready?", why: "Channel Talk/KakaoTalk. Response within 24h affects seller grade" },
          ]).map((check, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 10px", borderRadius: "10px", background: "rgba(25,25,112,0.02)" }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "1.5px solid rgba(25,25,112,0.3)", flexShrink: 0, marginTop: "1px" }} />
              <div>
                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{check.item}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", lineHeight: 1.4 }}>{check.why}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 통합 관리 솔루션 팁 */}
      <div style={{ borderRadius: "16px", padding: "16px 18px", background: "rgba(124,58,237,0.03)", border: "1px solid rgba(124,58,237,0.06)" }}>
        <div style={{ fontSize: "13px", fontWeight: 660, color: "#7c3aed", marginBottom: "6px" }}>{ko ? "멀티 플랫폼 운영 팁" : "Multi-platform Tip"}</div>
        <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
          {ko ? "2개 이상 플랫폼 동시 운영 시 재고·주문 통합 관리 솔루션을 사용하세요. 샵링커(shoplinker.co.kr), 올라(allra.co.kr), 셀러허브(sellerhub.co.kr) 등이 주문 수집 + 재고 연동 + 송장 일괄 처리를 지원합니다. 월 3~5만원으로 실수를 줄이고 시간을 절약할 수 있습니다." : "For 2+ platforms, use an order management solution like Shoplinker, Allra, or SellerHub. They sync inventory, collect orders, and batch process invoices. ₩30-50K/month saves time and reduces errors."}
        </div>
      </div>

      <StageWrapup
        ko={ko}
        nextStageLabelKo="온라인 마케팅"
        doneItemsKo={[
          { label: "1. 상품 페이지 작성", detail: "메인 이미지 + 상세 페이지 + 옵션·재고·가격 설정 — 검색 키워드 최적화" },
          { label: "2. 배송·반품 정책", detail: "기본 배송비 + 무료배송 조건 + 반품·교환 정책 명시" },
          { label: "3. CS·상담 채널", detail: "카톡 채널·이메일·전화 1개 이상 + 운영 시간·응답 기준 명시" },
          { label: "4. 통합 관리 솔루션", detail: "샵링커·올라·셀러허브 등 멀티 채널 통합 도입 검토" },
        ]}
        verifyItemsKo={[
          "상품 등록 — 상세페이지 효능·효과 표현 시 「의약품·의료기기 광고」 위반 위험, 표시광고법 사전 점검",
          "배송비 — 「조건부 무료배송」 표시 시 조건 명문화 필수, 「실비 청구」도 표시광고법 대상",
          "재고 동기화 — 멀티 플랫폼 운영 시 통합 솔루션 없으면 품절 분쟁 + 패널티 누적 위험",
          "CS 응답 — 7일 이내 청약철회 의무 + 환불 3영업일 이내 의무, 위반 시 분쟁조정 신청 가능",
          "리뷰 정책 — 자작·바이럴 리뷰 적발 시 표시광고법 + 플랫폼 영구정지, 진성 리뷰 유도 시스템",
          "택배사 계약 — CJ대한통운·롯데·한진 직계약 vs 대행 비교, 월 100건 이상 시 직계약 유리",
        ]}
        nextSummaryKo="상품·배송·CS·통합관리 셋업 완료 → 온라인 마케팅 단계로 진입"
      />
    </div>
  );
}
