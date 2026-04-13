"use client";

import {
  contractCheckpoints,
  formatFranchiseCost,
  getFranchiseBrandById,
} from "@build-up/shared";
import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function FranchiseApplicationStage() {
  const d = useDashboardCtx();
  const {
    language,
    selectedFranchiseBrandId,
  } = d;

  const ko = language === "ko";

  /* ── Brand selected: detailed guide ── */
  if (selectedFranchiseBrandId) {
    const fb = getFranchiseBrandById(selectedFranchiseBrandId);
    if (!fb) return null;
    return (
      <div style={{ display: "grid", gap: "16px", marginBottom: "20px" }}>
        {/* Brand header card */}
        <div style={{
          borderRadius: "28px",
          border: "1px solid rgba(255,255,255,0.78)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
          boxShadow: "0 12px 28px rgba(17,17,17,0.04)",
          padding: "24px",
          display: "grid",
          gap: "14px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "linear-gradient(135deg, var(--primary), rgba(117,163,255,0.9))",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "18px", fontWeight: 700
            }}>
              {fb.name.ko.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em" }}>{fb.name[language]}</div>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                {ko ? "가맹 절차를 단계별로 진행하세요" : "Complete the franchise process step by step"}
              </div>
            </div>
          </div>
          {fb.franchiseUrl && (
            <a href={fb.franchiseUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "12px 18px", borderRadius: "999px", background: "var(--primary)", color: "#fff", fontSize: "14px", fontWeight: 600, textDecoration: "none", width: "fit-content" }}>
              {ko ? `${fb.name.ko} 가맹 상담 바로가기 →` : `${fb.name.en} Franchise Inquiry →`}
            </a>
          )}
          <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", gap: "16px", flexWrap: "wrap" as const }}>
            <span>{ko ? `창업비용 ${formatFranchiseCost(fb.startupCostWon)}원` : `Startup ${formatFranchiseCost(fb.startupCostWon)}`}</span>
            <span>{ko ? `가맹비 ${formatFranchiseCost(fb.franchiseFee)}원` : `Fee ${formatFranchiseCost(fb.franchiseFee)}`}</span>
            <span>{ko ? `로열티 ${fb.monthlyRoyalty > 0 ? fb.monthlyRoyalty + "만/월" : "없음"}` : `Royalty ${fb.monthlyRoyalty > 0 ? fb.monthlyRoyalty + "K/mo" : "None"}`}</span>
          </div>
        </div>

        {/* Contract checkpoints */}
        <div style={{
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.78)",
          background: "rgba(255,255,255,0.86)",
          boxShadow: "0 8px 20px rgba(17,17,17,0.03)",
          overflow: "hidden"
        }}>
          <div style={{ padding: "18px 22px 14px" }}>
            <div style={{ fontSize: "16px", fontWeight: 650, letterSpacing: "-0.02em", marginBottom: "4px" }}>
              {ko ? "계약 전 필수 확인 포인트" : "Pre-Contract Must-Check Points"}
            </div>
            <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
              {ko
                ? "정보공개서와 계약서에서 아래 항목들을 꼼꼼히 확인하세요. 빨간색은 반드시, 주황색은 중요, 회색은 참고 사항입니다."
                : "Carefully check these items in the disclosure and contract. Red = must, orange = important, gray = reference."}
            </div>
          </div>
          <div style={{ padding: "0 22px 18px", display: "grid", gap: "8px" }}>
            {contractCheckpoints.map((cp) => {
              const dotColor = cp.riskLevel === "critical" ? "#ff3b30" : cp.riskLevel === "important" ? "#ff9f0a" : "var(--muted)";
              return (
                <div key={cp.id} style={{
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: `1px solid ${cp.riskLevel === "critical" ? "rgba(255,59,48,0.12)" : "var(--border)"}`,
                  background: cp.riskLevel === "critical" ? "rgba(255,59,48,0.03)" : "rgba(255,255,255,0.6)",
                  display: "grid",
                  gap: "4px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: dotColor, flexShrink: 0 }} />
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{cp.title[language]}</span>
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--muted)", paddingLeft: "16px" }}>
                    {cp.description[language]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Useful links */}
        <div style={{
          borderRadius: "20px",
          border: "1px solid var(--border)",
          background: "rgba(255,255,255,0.7)",
          padding: "18px 22px",
          display: "grid",
          gap: "10px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: 600 }}>
            {ko ? "유용한 링크" : "Useful Links"}
          </div>
          {[
            { label: ko ? "공정거래위원회 정보공개서 조회" : "KFTC Disclosure Lookup", url: "https://franchise.ftc.go.kr" },
            { label: ko ? "가맹사업법 안내 (생활법령)" : "Franchise Act Guide", url: "https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=647" },
            { label: ko ? "분쟁조정 신청 (한국프랜차이즈산업협회)" : "Dispute Mediation (KFA)", url: "https://www.ikfa.or.kr/" },
            { label: ko ? "표준가맹계약서 양식 (공정위)" : "Standard Contract Form (FTC)", url: "https://www.ftc.go.kr/www/cop/bbs/selectBoardList.do?key=203&bbsId=BBSMSTR_000000002321" },
          ].map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)", textDecoration: "none", color: "inherit", fontSize: "13px" }}>
              <span style={{ fontWeight: 500 }}>{link.label}</span>
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>↗</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  /* ── No brand selected: general franchise guide ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* 가맹 절차 개요 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(8,145,178,0.1)", background: "linear-gradient(180deg, rgba(8,145,178,0.03) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "프랜차이즈 가맹 절차" : "Franchise Application Process"}</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>{ko ? "위에서 브랜드를 선택하면 맞춤 가이드가 표시됩니다. 아래는 일반적인 가맹 절차입니다." : "Select a brand above for a customized guide. Below is the general franchise process."}</div>
        </div>
        <div style={{ padding: "0 22px 16px" }}>
          {(ko ? [
            { step: "1", title: "가맹 상담 신청", detail: "본사 홈페이지 또는 전화로 상담 예약. 사업 경험·자본금·희망 지역 전달", time: "1~2주" },
            { step: "2", title: "정보공개서 수령·검토", detail: "가맹본부가 법적 의무로 제공. 가맹점 수·폐업률·영업이익·분쟁 이력 확인", time: "14일 숙려" },
            { step: "3", title: "기존 가맹점 방문", detail: "정보공개서에 있는 가맹점 3곳 이상 방문. 실제 매출·본사 지원 만족도 질문", time: "1주" },
            { step: "4", title: "가맹계약 체결", detail: "가맹비·교육비·인테리어비·로열티 조건 확인. 중도 해지 조건 반드시 확인", time: "1일" },
            { step: "5", title: "본사 교육 이수", detail: "조리법·운영 매뉴얼·POS·위생 교육. 보통 2~4주 소요", time: "2~4주" },
          ] : [
            { step: "1", title: "Request consultation", detail: "Via HQ website or phone. Share experience, capital, preferred area", time: "1-2wk" },
            { step: "2", title: "Review disclosure document", detail: "Legally required. Check store count, closure rate, profit, disputes", time: "14 days" },
            { step: "3", title: "Visit existing franchisees", detail: "Visit 3+ stores listed in disclosure. Ask about real revenue and HQ support", time: "1wk" },
            { step: "4", title: "Sign franchise agreement", detail: "Check fees, royalty, interior costs, early termination conditions", time: "1 day" },
            { step: "5", title: "Complete HQ training", detail: "Recipes, operations, POS, hygiene training. Usually 2-4 weeks", time: "2-4wk" },
          ]).map(s => (
            <div key={s.step} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 0", borderBottom: s.step !== "5" ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#0891b2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 620, color: "#0f172a", marginBottom: "2px" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.45)", lineHeight: 1.4 }}>{s.detail}</div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(8,145,178,0.08)", color: "#0891b2", whiteSpace: "nowrap" as const, flexShrink: 0 }}>{s.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 정보공개서 읽는 법 */}
      <div style={{ borderRadius: "20px", border: "1px solid rgba(220,38,38,0.08)", background: "linear-gradient(180deg, rgba(220,38,38,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "4px" }}>{ko ? "정보공개서 핵심 체크포인트" : "Disclosure Document Key Checks"}</div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", lineHeight: 1.6 }}>{ko ? "계약 전 반드시 확인해야 할 항목입니다. 정보공개서를 꼼꼼히 읽지 않아 분쟁이 발생하는 사례가 매우 많습니다." : "Must-check items before signing. Many disputes arise from not reading the disclosure carefully."}</div>
        </div>
        <div style={{ padding: "0 22px 16px", display: "grid", gap: "6px" }}>
          {(ko ? [
            { severity: "필수", color: "#dc2626", title: "최근 3년 가맹점 개·폐업 수", detail: "폐업률 30% 이상이면 위험 신호. 신규 가맹 대비 폐업 비율 확인" },
            { severity: "필수", color: "#dc2626", title: "가맹점 평균 영업이익", detail: "본사 제공 수치가 아닌 실제 가맹점에서 확인. 본사 수치와 차이가 크면 주의" },
            { severity: "필수", color: "#dc2626", title: "가맹비·교육비·보증금 반환 조건", detail: "해지 시 반환 불가 금액과 위약금 확인. 중도 해지 위약금이 총 투자비의 50% 넘으면 주의" },
            { severity: "주의", color: "#d97706", title: "영업지역 보장 범위", detail: "독점 지역이 있는지, 반경 몇 미터인지, 온라인 판매 포함인지 확인" },
            { severity: "주의", color: "#d97706", title: "필수 구매 물품 비율", detail: "본사에서만 사야 하는 식자재·소모품 비율. 70% 이상이면 원가 부담 주의" },
          ] : [
            { severity: "Must", color: "#dc2626", title: "3-year store open/close count", detail: "30%+ closure rate = danger. Compare new vs closed ratio" },
            { severity: "Must", color: "#dc2626", title: "Average franchisee profit", detail: "Verify with actual stores, not HQ numbers" },
            { severity: "Must", color: "#dc2626", title: "Fee/deposit refund conditions", detail: "Check non-refundable amounts and penalty fees" },
            { severity: "Note", color: "#d97706", title: "Territory protection", detail: "Exclusive zone? Radius? Does it include online?" },
            { severity: "Note", color: "#d97706", title: "Required purchase ratio", detail: "HQ-only ingredients/supplies ratio. 70%+ = high cost risk" },
          ]).map(item => (
            <div key={item.title} style={{ padding: "10px 14px", borderRadius: "12px", border: `1px solid ${item.color}12`, background: `${item.color}03` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <span style={{ fontSize: "9px", fontWeight: 650, padding: "1px 6px", borderRadius: "4px", background: `${item.color}12`, color: item.color }}>{item.severity}</span>
                <span style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a" }}>{item.title}</span>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4, paddingLeft: "2px" }}>{item.detail}</div>
            </div>
          ))}
        </div>
        <div style={{ margin: "0 22px 16px" }}>
          <a href="https://franchise.ftc.go.kr" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px", borderRadius: "12px", background: "#0891b2", color: "#fff", fontSize: "14px", fontWeight: 650, textDecoration: "none" }}>
            {ko ? "공정거래위원회 정보공개서 조회" : "FTC Disclosure Lookup"} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
