"use client";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { StoreNameInput } from "../shared/StoreNameInput";
import { StageWrapup } from "../shared/StageWrapup";
import { KeyActionHero } from "../shared/StageActionHero";

// 세부업종별 홈택스 업종코드 (국세청 6자리 기준경비율 코드 — 2026-07-10 공식 검증).
//   ⚠️ 종전 47911은 통계청 표준산업분류(KSIC)라 홈택스 입력 코드가 아님 → 525101로 교정.
//   smart-store·위탁판매=525101 / 구매대행=525105(대행 수수료업) / 전자책=221100+525101 병기 /
//   크리에이터=940306(면세·무시설) vs 921505(과세·시설), 매출 8천만원↑는 921505.
const INDUSTRY_CODE_STEP_KO: Record<string, { step: string; detail: string }> = {
  "smart-store": { step: "업종코드 입력: 전자상거래 소매업 (525101)", detail: "오픈마켓·스마트스토어 입점 셀러의 기본 업종코드" },
  "consignment-commerce": { step: "업종코드 입력: 전자상거래 소매업 (525101)", detail: "위탁판매도 내 명의로 판매·CS하면 소매업 — 판매자·구매자 연결만 하는 순수 중개는 소매중개업(525102)" },
  "global-buying": { step: "업종코드 입력: 해외직구대행업 (525105)", detail: "재화 판매가 아닌 구매대행 서비스 — 대행 수수료 기준 과세라 세금 구조가 다름" },
  "digital-products": { step: "업종코드 입력: 서적출판업(전자책·전자출판, 221100) + 전자상거래 소매업(525101) 병기", detail: "전자책·디지털 콘텐츠는 출판업 코드에 온라인 판매 겸업 코드를 함께 등록" },
  "creator-service": { step: "업종코드 입력: 1인미디어콘텐츠창작자(940306) 또는 미디어콘텐츠창작업(921505)", detail: "무시설·1인=940306(면세) / 시설·인력 보유=921505(과세) — 연매출 8천만원 이상이면 921505" },
  "newsletter-membership": { step: "업종코드 입력: 1인미디어콘텐츠창작자(940306) 등 콘텐츠 창작 계열", detail: "유료 뉴스레터·멤버십은 콘텐츠 창작 계열 — 홈택스 업종코드 조회 후 세무서 최종 확인 권장" },
};
const INDUSTRY_CODE_STEP_FALLBACK_KO = { step: "업종코드 입력: 전자상거래 소매업 (525101)", detail: "온라인 판매의 기본 업종코드 — 홈택스 업종코드 조회에서 확인" };

export function OnlineRegistrationStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const regPage = d.regPage;
  const setRegPage = d.setRegPage;
  const industryCodeStep = INDUSTRY_CODE_STEP_KO[d.selectedIndustryId ?? ""] ?? INDUSTRY_CODE_STEP_FALLBACK_KO;

  const pages = [
    // ── 페이지 0: 사업자등록 ──
    () => (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(25,25,112,0.1)", background: "linear-gradient(180deg, rgba(25,25,112,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        {/* 헤더 */}
        <div style={{ padding: "24px 24px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "rgba(25,25,112,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#191970" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 650, color: "#191970", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 1 / 2</div>
              <div style={{ fontSize: "20px", fontWeight: 720, letterSpacing: "-0.03em", color: "#0f172a" }}>{ko ? "사업자등록" : "Business Registration"}</div>
            </div>
          </div>
          <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.65 }}>
            {ko ? "사업자등록증은 모든 상거래의 출발점입니다. 스마트스토어·쿠팡 등 판매 플랫폼 입점, 세금계산서 발급, 사업용 통장 개설에 반드시 필요합니다." : "Business registration is the starting point for all commerce — required for platform onboarding, invoicing, and business banking."}
          </div>
        </div>

        {/* 상호명 입력 — 사업자등록 + 스마트스토어/쿠팡 입점에서 동일하게 사용 */}
        <div style={{ padding: "0 24px 16px" }}>
          <StoreNameInput
            label={ko ? "상호명 (사업자등록 + 스토어 명칭)" : "Store name (registration + storefront)"}
            placeholder={ko ? "예: 별빛 셀렉트, 모던 디지털" : "e.g. Stellar Select, Modern Digital"}
            helperText={ko
              ? "사업자등록증·스마트스토어·쿠팡·통신판매업 신고서까지 모두 동일한 이름으로 사용됩니다. 등록 후 변경하면 플랫폼 노출이 끊길 수 있어 신중히 결정하세요."
              : "Used identically across registration, Smartstore, Coupang, and telecom filing. Changing later may disrupt platform listings."}
          />
        </div>

        {/* 어디서 + 바로가기 */}
        <div style={{ margin: "0 24px 16px", padding: "14px 16px", borderRadius: "14px", background: "rgba(25,25,112,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "2px" }}>{ko ? "신청 장소" : "Where"}</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{ko ? "관할 세무서 또는 홈택스" : "Tax office or Hometax"}</div>
          </div>
          <a href="https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&menuCd=index3" target="_blank" rel="noreferrer" style={{ padding: "8px 16px", borderRadius: "10px", background: "#191970", color: "#fff", fontSize: "13px", fontWeight: 650, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            {ko ? "홈택스 바로가기" : "Go to Hometax"} <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>

        {/* 준비물 체크리스트 */}
        <div style={{ padding: "0 24px 16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "준비물" : "Required Documents"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {(ko ? [
              { item: "신분증 (주민등록증/운전면허)", required: true },
              { item: "임대차계약서 (자택이면 불필요)", required: false },
              { item: "사업계획서 (간단히 1장)", required: false },
              { item: "통장 사본 (환급용)", required: true },
            ] : [
              { item: "Government ID", required: true },
              { item: "Lease contract (not needed if home)", required: false },
              { item: "Business plan (simple 1 page)", required: false },
              { item: "Bank account copy (for refund)", required: true },
            ]).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px", borderRadius: "10px", background: "rgba(25,25,112,0.03)" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: item.required ? "#191970" : "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {item.required && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.4 }}>{item.item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 절차 */}
        <div style={{ padding: "0 24px 16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "신청 절차" : "Process"}</div>
          {(ko ? [
            { step: "홈택스 접속 → 로그인 (공동인증서)", detail: "공동인증서가 없으면 세무서 방문도 가능합니다" },
            { step: "신청/제출 → 사업자등록 신청 클릭", detail: "개인사업자 선택 (법인 아님)" },
            { step: industryCodeStep.step, detail: industryCodeStep.detail },
            { step: "사업장 주소 입력", detail: "자택도 가능 — 전입세대열람원으로 대체" },
            { step: "제출 후 즉일~3영업일 내 발급", detail: "문자로 발급 알림이 옵니다" },
          ] : [
            { step: "Log into Hometax (certificate required)", detail: "Visit tax office if no certificate" },
            { step: "Apply → Business Registration", detail: "Select sole proprietor (not corporation)" },
            { step: "Industry code: 525101 (e-commerce retail) — varies by sub-industry", detail: "Digital content/creator businesses use different codes (221100 / 940306)" },
            { step: "Enter business address", detail: "Home address allowed" },
            { step: "Submit — issued in 0~3 business days", detail: "SMS notification when ready" },
          ]).map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#191970", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a", marginBottom: "2px" }}>{s.step}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 과세 유형 비교 */}
        <div style={{ padding: "0 24px 16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "간이과세 vs 일반과세" : "Tax Type Comparison"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(25,25,112,0.04)", border: "1px solid rgba(25,25,112,0.1)" }}>
              <div style={{ fontSize: "14px", fontWeight: 680, color: "#1d3557", marginBottom: "6px" }}>{ko ? "간이과세자" : "Simplified"}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                {ko ? "연매출 1억 400만원 미만 시 선택 가능. 부가세 납부 면제(4,800만원 미만) 또는 감면(업종별 1.5~4%). 세금계산서 발급 불가(4,800만원 미만)." : "Available under ₩104M annual. VAT payment exempt (<₩48M) or reduced (1.5-4%). Cannot issue tax invoices under ₩48M."}
              </div>
              <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: 600, color: "#1d3557", padding: "3px 8px", borderRadius: "6px", background: "rgba(25,25,112,0.08)", display: "inline-block" }}>{ko ? "초기 창업자 추천" : "Recommended for starters"}</div>
            </div>
            <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(25,25,112,0.03)", border: "1px solid rgba(25,25,112,0.08)" }}>
              <div style={{ fontSize: "14px", fontWeight: 680, color: "#191970", marginBottom: "6px" }}>{ko ? "일반과세자" : "Standard"}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                {ko ? "연매출 1억 400만원 이상 또는 B2B 거래 시. 부가세 10% 납부. 세금계산서 발급 가능. 매입세액 공제 가능." : "₩104M annual or more, or B2B. 10% VAT. Can issue tax invoices. Input tax deductible."}
              </div>
              <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: 600, color: "#191970", padding: "3px 8px", borderRadius: "6px", background: "rgba(25,25,112,0.06)", display: "inline-block" }}>{ko ? "B2B · 고매출 시" : "For B2B / high revenue"}</div>
            </div>
          </div>
        </div>

        {/* 팁 */}
        <div style={{ margin: "0 24px 20px", padding: "12px 16px", borderRadius: "12px", background: "rgba(25,25,112,0.04)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><circle cx="7" cy="7" r="6" stroke="#191970" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="#191970" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <span style={{ fontSize: "12px", color: "rgba(25,25,112,0.8)", lineHeight: 1.55 }}>
            {ko ? "자택 사업자도 가능합니다. 임대차계약서 없이 전입세대열람원(주민센터 발급)으로 대체할 수 있습니다. 처리기간은 보통 당일~1일입니다." : "Home-based business is possible. Resident registration document from community center substitutes lease. Usually processed same day."}
          </span>
        </div>
      </div>
    ),

    // ── 페이지 1: 통신판매업 신고 ──
    () => (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.1)", background: "linear-gradient(180deg, rgba(124,58,237,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        {/* 헤더 */}
        <div style={{ padding: "24px 24px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 650, color: "#7c3aed", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 2 / 2</div>
              <div style={{ fontSize: "20px", fontWeight: 720, letterSpacing: "-0.03em", color: "#0f172a" }}>{ko ? "통신판매업 신고" : "Telecom Sales Filing"}</div>
            </div>
          </div>
          {/* 필수 행정 순서 안내 */}
          <div style={{ margin: "0 24px 12px", padding: "12px 16px", borderRadius: "12px", background: "rgba(25,25,112,0.06)", border: "1px solid rgba(25,25,112,0.12)" }}>
            <div style={{ fontSize: "12px", fontWeight: 680, color: "#191970", marginBottom: "4px" }}>
              {ko ? "⚠ 필수 행정 순서 (반드시 이 순서대로)" : "⚠ Required Admin Sequence (follow this order)"}
            </div>
            <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.6)", lineHeight: 1.6 }}>
              {ko
                ? "① 사업자등록 → ② 사업용 통장 개설 → ③ 에스크로(구매안전서비스) 가입 → ④ 통신판매업 신고"
                : "① Business registration → ② Business bank account → ③ Escrow service → ④ Telecom sales filing"}
            </div>
          </div>
          <div style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.65 }}>
            {ko ? "온라인으로 상품을 판매하려면 통신판매업 신고가 법적 의무입니다. 미신고 시 과태료 최대 1,000만원이며, 네이버 스마트스토어·쿠팡 입점 시 신고번호를 요구합니다." : "Legally required for all online sales. Up to ₩10M fine if unfiled. Smartstore and Coupang require the filing number."}
          </div>
        </div>

        {/* 경고 */}
        <div style={{ margin: "0 24px 16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(182,76,76,0.04)", border: "1px solid rgba(182,76,76,0.08)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b64c4c" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: "1px" }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#b64c4c", lineHeight: 1.5 }}>
            {ko ? "미신고 시 과태료 최대 1,000만원. 사업자등록 후 반드시 진행하세요." : "Fine up to ₩10M if unfiled. Must complete after business registration."}
          </span>
        </div>

        {/* 어디서 + 바로가기 */}
        <div style={{ margin: "0 24px 16px", padding: "14px 16px", borderRadius: "14px", background: "rgba(124,58,237,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "2px" }}>{ko ? "신청 장소" : "Where"}</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{ko ? "관할 구청 또는 정부24" : "District office or Gov24"}</div>
          </div>
          <a href="https://www.gov.kr" target="_blank" rel="noreferrer" style={{ padding: "8px 16px", borderRadius: "10px", background: "#7c3aed", color: "#fff", fontSize: "13px", fontWeight: 650, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            {ko ? "정부24 바로가기" : "Go to Gov24"} <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>

        {/* 준비물 */}
        <div style={{ padding: "0 24px 16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "준비물" : "Required Documents"}</div>
          <div style={{ display: "grid", gap: "6px" }}>
            {(ko ? [
              { item: "사업자등록증 사본", detail: "1단계에서 발급받은 것", required: true },
              { item: "신분증", detail: "주민등록증 또는 운전면허증", required: true },
              { item: "구매안전서비스(에스크로) 가입증명", detail: "PG사 가입 시 자동 발급", required: true },
            ] : [
              { item: "Business registration copy", detail: "From Step 1", required: true },
              { item: "Government ID", detail: "Resident ID or driver's license", required: true },
              { item: "Escrow service certificate", detail: "Auto-issued from PG provider", required: true },
            ]).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(124,58,237,0.03)" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#7c3aed"/><path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{item.item}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 구매안전서비스 설명 */}
        <div style={{ margin: "0 24px 16px", padding: "16px", borderRadius: "14px", background: "rgba(124,58,237,0.03)", border: "1px solid rgba(124,58,237,0.06)" }}>
          <div style={{ fontSize: "13px", fontWeight: 680, color: "#7c3aed", marginBottom: "6px" }}>{ko ? "구매안전서비스(에스크로)란?" : "What is escrow service?"}</div>
          <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
            {ko ? "소비자가 결제한 금액을 판매자에게 바로 전달하지 않고, 제3자(PG사)가 보관했다가 상품 수령 확인 후 정산하는 시스템입니다. 통신판매업 신고 시 필수이며, 아래 PG사 중 하나에 가입하면 자동 발급됩니다." : "A system where payment is held by a third party (PG) until the buyer confirms receipt. Required for telecom filing. Auto-issued when signing up with a PG provider below."}
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" as const }}>
            {["토스페이먼츠", "KG이니시스", "NHN KCP", "네이버페이 (스마트스토어 자동)"].map(pg => (
              <span key={pg} style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px", background: "rgba(124,58,237,0.06)", color: "#7c3aed" }}>{pg}</span>
            ))}
          </div>
        </div>

        {/* 절차 */}
        <div style={{ padding: "0 24px 16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" }}>{ko ? "신고 절차" : "Filing Process"}</div>
          {(ko ? [
            { step: "정부24 접속 → '통신판매업 신고' 검색", detail: "공동인증서 로그인 필요" },
            { step: "신고서 작성 → 사업자 정보 입력", detail: "사업자등록증의 정보와 일치해야 합니다" },
            { step: "구매안전서비스 가입증명 첨부", detail: "PG사에서 발급받은 PDF 업로드" },
            { step: "제출 → 즉일~5영업일 내 처리", detail: "신고번호가 문자로 발송됩니다" },
            { step: "신고번호를 판매 플랫폼에 입력", detail: "스마트스토어·쿠팡 설정에서 등록" },
          ] : [
            { step: "Go to Gov24 → Search 'telecom sales filing'", detail: "Certificate login required" },
            { step: "Fill form → Enter business info", detail: "Must match business registration" },
            { step: "Attach escrow certificate", detail: "Upload PDF from PG provider" },
            { step: "Submit → Processed in 0~5 business days", detail: "Filing number sent via SMS" },
            { step: "Enter filing number in sales platforms", detail: "Register in Smartstore/Coupang settings" },
          ]).map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a", marginBottom: "2px" }}>{s.step}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 비용 */}
        <div style={{ margin: "0 24px 16px", display: "flex", gap: "8px" }}>
          <div style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(25,25,112,0.04)", textAlign: "center" as const }}>
            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, marginBottom: "4px" }}>{ko ? "신고 수수료" : "Filing Fee"}</div>
            <div style={{ fontSize: "18px", fontWeight: 740, color: "#1d3557" }}>{ko ? "무료" : "Free"}</div>
          </div>
          <div style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(25,25,112,0.04)", textAlign: "center" as const }}>
            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, marginBottom: "4px" }}>{ko ? "등록면허세" : "License Tax"}</div>
            <div style={{ fontSize: "18px", fontWeight: 740, color: "#191970" }}>~40,500{ko ? "원" : "₩"}</div>
            <div style={{ fontSize: "10px", color: "rgba(0,0,0,0.35)" }}>{ko ? "구청별 상이" : "Varies"}</div>
          </div>
          <div style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(25,25,112,0.04)", textAlign: "center" as const }}>
            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, marginBottom: "4px" }}>{ko ? "처리기간" : "Processing"}</div>
            <div style={{ fontSize: "18px", fontWeight: 740, color: "#191970" }}>1~5{ko ? "일" : "d"}</div>
          </div>
        </div>

        {/* 팁 */}
        <div style={{ margin: "0 24px 20px", padding: "12px 16px", borderRadius: "12px", background: "rgba(124,58,237,0.04)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><circle cx="7" cy="7" r="6" stroke="#7c3aed" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="#7c3aed" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <span style={{ fontSize: "12px", color: "rgba(124,58,237,0.8)", lineHeight: 1.55 }}>
            {ko ? "네이버 스마트스토어 가입 시 구매안전서비스가 자동 연동되는 경우가 많습니다. 별도 PG 가입 전에 스마트스토어 센터에서 확인하세요." : "Escrow is often auto-linked when joining Naver Smartstore. Check Smartstore Center before signing up with a separate PG."}
          </span>
        </div>
      </div>
    ),
  ];

  return (
    <div style={{ marginBottom: "16px" }}>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko
            ? "사업자등록 + 통신판매업 + 에스크로 — 3종 모두 통신판매업 신고 전 필요"
            : "Business reg + e-commerce license + escrow — all three before the e-commerce filing",
          detail: ko
            ? "사업자등록 → 사업용 통장·구매안전서비스(에스크로) 가입 → 지자체 통신판매업 신고 순서. 에스크로 없이 통신판매업 신고는 불가."
            : "Business registration → business bank account & escrow (purchase-safety service) → local e-commerce filing. No escrow means no e-commerce license.",
        }}
      />
      {/* 페이지 네비게이션 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <button type="button" onClick={() => setRegPage(0)} disabled={regPage === 0}
          style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.06)", background: regPage === 0 ? "rgba(0,0,0,0.02)" : "white", color: regPage === 0 ? "rgba(0,0,0,0.2)" : "#0f172a", fontSize: "13px", fontWeight: 600, cursor: regPage === 0 ? "default" : "pointer" }}>
          ← {ko ? "사업자등록" : "Registration"}
        </button>
        <div style={{ display: "flex", gap: "6px" }}>
          {[0, 1].map(i => (
            <div key={i} onClick={() => setRegPage(i)} style={{ width: i === regPage ? "20px" : "8px", height: "8px", borderRadius: "100px", background: i === regPage ? "#1d3557" : "rgba(0,0,0,0.1)", cursor: "pointer", transition: "all 0.2s ease" }} />
          ))}
        </div>
        <button type="button" onClick={() => setRegPage(1)} disabled={regPage === 1}
          style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.06)", background: regPage === 1 ? "rgba(0,0,0,0.02)" : "white", color: regPage === 1 ? "rgba(0,0,0,0.2)" : "#0f172a", fontSize: "13px", fontWeight: 600, cursor: regPage === 1 ? "default" : "pointer" }}>
          {ko ? "통신판매 신고" : "Telecom Filing"} →
        </button>
      </div>
      {pages[regPage]()}

      {/* 마무리는 마지막 페이지에만 — 앞 페이지 누출 금지 (iOS 셸 게이트와 동일 규율) */}
      {regPage === pages.length - 1 && (
      <StageWrapup
        ko={ko}
        nextStageLabelKo="사업자등록 & 금융 세팅"
        doneItemsKo={[
          { label: "1. 사업자등록 신청", detail: "홈택스 온라인 신청 — 업태·종목은 위 가이드의 세부 업종별 업종코드 기준 + 임대차 없는 경우 자택 주소 가능" },
          { label: "2. 통신판매업 신고", detail: "관할 구청 또는 정부24 — 사업자등록증·구매안전서비스 이용 확인증 필요, 1~3일 발급" },
          { label: "3. 구매안전서비스(에스크로) 확보", detail: "마켓플레이스(스마트스토어·쿠팡)는 플랫폼 구매안전서비스 이용확인증 / 자사몰은 PG사(토스페이먼츠·KG이니시스 등) 계약" },
          { label: "4. 스토어 기본 셋업", detail: "스토어명 중복 검색 + 사업자 판매자 등록·통장 연동 + 자사몰 시 도메인·로고 등록" },
        ]}
        verifyItemsKo={[
          "사업자등록 — 자택 주소 가능(임대차계약서 없으면 전입세대열람원으로 대체). 전월세 거주지는 임대인 동의·전대 가능 여부 사전 확인",
          "통신판매업 신고 — 미신고 영업 시 1년 이하 징역 또는 1천만원 이하 벌금 (전자상거래법)",
          "구매안전서비스 — 결제 5만원 이상 거래는 에스크로 또는 보증서 의무, 위반 시 시정 명령",
          "표시·광고 — 「최저가」「1위」 등 비교 광고는 객관적 근거 필수, 위반 시 표시광고법 과징금",
          "청약철회 — 7일 이내 무조건 청약철회 의무 (예외: 맞춤제작·식품·디지털콘텐츠), 약관 명시 필수",
          "개인정보 처리방침 — 개인정보보호법 의무 게시 + 수집·이용·제공·파기 4항목 명문화",
        ]}
        nextSummaryKo="사업자등록·통신판매 신고 완료 → 사업자등록 & 금융 세팅(사업용 통장·세무 대리) 단계로 진입"
      />
      )}
    </div>
  );
}
