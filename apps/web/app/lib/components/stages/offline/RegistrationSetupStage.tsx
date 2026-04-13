"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function RegistrationSetupStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* 사업자등록 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.1)", background: "linear-gradient(180deg, rgba(37,99,235,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 650, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 1</div>
              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "사업자등록" : "Business Registration"}</div>
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
            {ko ? "세무서 또는 홈택스에서 사업자등록증을 발급받아야 합니다. 매장 임대차계약 완료 후 진행하세요." : "Get your business registration certificate from the tax office or Hometax. Proceed after signing your lease."}
          </div>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "12px", background: "rgba(37,99,235,0.04)", marginBottom: "10px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{ko ? "신청 장소" : "Where"}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{ko ? "관할 세무서 또는 홈택스" : "Tax office or Hometax"}</div>
            </div>
            <a href="https://www.hometax.go.kr" target="_blank" rel="noreferrer" style={{ padding: "6px 14px", borderRadius: "8px", background: "#2563eb", color: "#fff", fontSize: "12px", fontWeight: 650, textDecoration: "none" }}>
              {ko ? "홈택스" : "Hometax"} ↗
            </a>
          </div>
          {(ko ? [
            { step: "홈택스 접속 → 사업자등록 신청", detail: "공동인증서 로그인 필요. 없으면 세무서 방문" },
            { step: "업종코드 입력 (업종별 코드 확인)", detail: "음식: 522111, 카페: 522220, 미용: 961101 등" },
            { step: "사업장 주소 = 임대차계약서 주소", detail: "계약서 사본 첨부 필수" },
            { step: "과세유형 선택 (간이/일반)", detail: "매출 8,000만원 이하 예상 시 간이과세 추천" },
            { step: "제출 → 즉일~3영업일 발급", detail: "등록증 수령 후 사업용 통장 개설" },
          ] : [
            { step: "Log into Hometax → Apply", detail: "Certificate login required" },
            { step: "Enter industry code", detail: "Food: 522111, Cafe: 522220, Beauty: 961101" },
            { step: "Business address = lease address", detail: "Attach lease copy" },
            { step: "Choose tax type (simplified/standard)", detail: "Simplified if expected revenue under 80M" },
            { step: "Submit → Issued in 0-3 days", detail: "Open business account after" },
          ]).map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{s.step}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ margin: "0 22px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(5,150,105,0.04)", textAlign: "center" as const }}>
            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "비용" : "Cost"}</div>
            <div style={{ fontSize: "16px", fontWeight: 740, color: "#059669" }}>{ko ? "무료" : "Free"}</div>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(37,99,235,0.04)", textAlign: "center" as const }}>
            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "소요기간" : "Duration"}</div>
            <div style={{ fontSize: "16px", fontWeight: 740, color: "#2563eb" }}>1~3{ko ? "일" : "d"}</div>
          </div>
        </div>
        {/* 바로가기 링크 */}
        <div style={{ margin: "0 22px 16px", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          {[
            { label: ko ? "홈택스 사업자등록" : "HomeTax Register", url: "https://www.hometax.go.kr", color: "#2563eb" },
            { label: ko ? "정부24 사업자등록" : "Gov24 Register", url: "https://www.gov.kr/portal/service/serviceInfo/PTR000050466", color: "#059669" },
            { label: ko ? "업종코드 조회" : "Industry Codes", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2444&cntntsId=7777", color: "#7c3aed" },
            { label: ko ? "간이과세 기준 확인" : "Tax Type Guide", url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272", color: "#d97706" },
          ].map(link => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px",
              borderRadius: "8px", background: `${link.color}06`, border: `1px solid ${link.color}12`,
              fontSize: "12px", fontWeight: 600, color: link.color, textDecoration: "none",
            }}>
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>

      {/* 영업허가/신고 실행 */}
      <div style={{ borderRadius: "16px", border: "1px solid rgba(234,88,12,0.1)", background: "linear-gradient(180deg, rgba(234,88,12,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(234,88,12,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="1.6" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 650, color: "#ea580c", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 2</div>
              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "영업허가 · 신고" : "Business Permit Filing"}</div>
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
            {ko ? "사업자등록 완료 후, 업종에 맞는 영업허가 또는 영업신고를 관할 구청에 접수합니다." : "After business registration, file the appropriate permit or notification at your district office."}
          </div>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "12px", background: "rgba(234,88,12,0.04)", marginBottom: "10px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{ko ? "신청 장소" : "Where"}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{ko ? "관할 구청 위생과 또는 정부24" : "District Office or Gov24"}</div>
            </div>
            <a href="https://www.gov.kr" target="_blank" rel="noreferrer" style={{ padding: "6px 14px", borderRadius: "8px", background: "#ea580c", color: "#fff", fontSize: "12px", fontWeight: 650, textDecoration: "none" }}>
              {ko ? "정부24" : "Gov24"} ↗
            </a>
          </div>
          {(ko ? [
            { step: "위생교육 이수 완료 확인", detail: "음식점: 한국외식업중앙회 / 카페: 한국휴게음식업중앙회 온라인 교육 (26,000원)" },
            { step: "건강진단결과서(보건증) 발급", detail: "관할 보건소 방문. 약 12,000원. 유효기간 1년" },
            { step: "영업신고서 작성 + 서류 첨부", detail: "위생교육 수료증 + 보건증 + 임대차계약서 + 평면도" },
            { step: "구청 위생과 접수 또는 정부24 온라인", detail: "현장 점검 후 영업신고증 발급 (7~14일)" },
          ] : [
            { step: "Confirm hygiene training completed", detail: "Restaurant: KFIA / Cafe: KCRA online course ($26K)" },
            { step: "Get health certificate", detail: "Visit local health center. ~$12K. Valid 1 year" },
            { step: "Fill business report + attach docs", detail: "Training cert + health cert + lease + floor plan" },
            { step: "Submit to district office or Gov24", detail: "On-site inspection -> certificate issued (7-14 days)" },
          ]).map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ea580c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{s.step}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ margin: "0 22px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(234,88,12,0.04)", textAlign: "center" as const }}>
            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "비용" : "Cost"}</div>
            <div style={{ fontSize: "16px", fontWeight: 740, color: "#ea580c" }}>~{ko ? "6.6만원" : "₩66K"}</div>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(234,88,12,0.04)", textAlign: "center" as const }}>
            <div style={{ fontSize: "10px", fontWeight: 650, color: "rgba(0,0,0,0.35)" }}>{ko ? "소요기간" : "Duration"}</div>
            <div style={{ fontSize: "16px", fontWeight: 740, color: "#ea580c" }}>7~14{ko ? "일" : "d"}</div>
          </div>
        </div>
        <div style={{ margin: "0 22px 10px", padding: "10px 14px", borderRadius: "10px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)" }}>
          <div style={{ fontSize: "12px", color: "#dc2626", lineHeight: 1.5 }}>
            {ko ? "⚠ 주방과 객석이 벽·칸막이로 구분되어야 합니다. 건물 용도가 '근린생활시설'인지 사전 확인 필수!" : "⚠ Kitchen and dining must be separated. Verify building use is 'neighborhood facility'!"}
          </div>
        </div>
        {/* 바로가기 링크 */}
        <div style={{ margin: "0 22px 16px", display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          {[
            { label: ko ? "정부24 영업신고" : "Gov24 Permit", url: "https://www.gov.kr", color: "#ea580c" },
            { label: ko ? "위생교육 신청" : "Hygiene Training", url: "https://www.kfoodedu.or.kr", color: "#0891b2" },
            { label: ko ? "보건증 발급 안내" : "Health Certificate", url: "https://www.g-health.kr", color: "#059669" },
            { label: ko ? "건축물대장 열람" : "Building Register", url: "https://www.eais.go.kr", color: "#7c3aed" },
          ].map(link => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px",
              borderRadius: "8px", background: `${link.color}06`, border: `1px solid ${link.color}12`,
              fontSize: "12px", fontWeight: 600, color: link.color, textDecoration: "none",
            }}>
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
