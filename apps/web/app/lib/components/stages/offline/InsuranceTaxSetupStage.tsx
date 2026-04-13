"use client";

import { useState } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function InsuranceTaxSetupStage() {
  const d = useDashboardCtx();
  const ko = d.language === "ko";
  const { industryCategoryId } = d;
  const [insuranceTaxPage, setInsuranceTaxPage] = useState(0);

  const totalPages = 3;
  const page = insuranceTaxPage;

  const accidentRateMap: Record<string, { rate: string; category: string }> = {
    "food": { rate: "0.8%", category: "도소매·음식·숙박업" },
    "cafe-dessert": { rate: "0.8%", category: "도소매·음식·숙박업" },
    "retail": { rate: "0.8%", category: "도소매·음식·숙박업" },
    "beauty": { rate: "0.6%", category: "전문·보건·교육·여가 서비스업" },
    "fitness": { rate: "0.6%", category: "전문·보건·교육·여가 서비스업" },
    "education": { rate: "0.6%", category: "전문·보건·교육·여가 서비스업" },
    "pet": { rate: "0.8%", category: "도소매·음식·숙박업" },
    "space": { rate: "0.8%", category: "도소매·음식·숙박업" },
    "living-service": { rate: "0.7%", category: "기타 서비스업" },
  };
  const accidentInfo = accidentRateMap[industryCategoryId] ?? { rate: "0.7%", category: "일반 서비스업" };

  const SFIcon = ({ children, bg }: { children: React.ReactNode; bg: string }) => (
    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </div>
  );

  const pageLabels = [
    ko ? "4대보험 가입" : "Insurance",
    ko ? "원천세 설정" : "Withholding",
    ko ? "급여 방식" : "Payroll",
  ];

  return (
    <div style={{ marginBottom: "14px" }} className="bento-fade-in">
      {/* 페이지 인디케이터 + 탭 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.45)" }}>
          {page + 1} / {totalPages}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {pageLabels.map((label, i) => (
            <button key={i} type="button" onClick={() => setInsuranceTaxPage(i)} style={{
              padding: "5px 12px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              background: page === i ? "#0561fc" : "rgba(5,97,252,0.06)",
              color: page === i ? "#fff" : "rgba(15,23,42,0.5)",
              transition: "all 0.2s ease",
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* PAGE 0: 4대보험 */}
      {page === 0 && (
      <div style={{ borderRadius: "16px", border: "1px solid rgba(5,97,252,0.06)", background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,244,255,0.5) 100%)", boxShadow: "0 21px 94px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <SFIcon bg="rgba(5,97,252,0.08)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0561fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            </SFIcon>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 650, color: "#0561fc", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 1</div>
              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "4대보험 가입 신고" : "4 Major Insurance Registration"}</div>
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
            {ko ? "직원 채용일로부터 14일 이내에 4대사회보험 정보연계센터에서 통합 신고해야 합니다." : "Register within 14 days of hiring at the 4 Social Insurance Portal."}
          </div>
        </div>
        {/* 요율표 */}
        <div style={{ padding: "0 22px 14px" }}>
          <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(5,97,252,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "rgba(5,97,252,0.04)", padding: "8px 12px", fontSize: "10px", fontWeight: 650, color: "rgba(15,23,42,0.45)", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
              <span>{ko ? "보험 종류" : "Insurance"}</span>
              <span style={{ textAlign: "right" as const }}>{ko ? "사업주 부담" : "Employer"}</span>
              <span style={{ textAlign: "right" as const }}>{ko ? "근로자 부담" : "Employee"}</span>
            </div>
            {[
              { name: ko ? "국민연금" : "Pension", emp: "4.75%", ee: "4.75%", note: ko ? "2026년 인상 (기존 4.5%)" : "2026 increase (was 4.5%)" },
              { name: ko ? "건강보험" : "Health", emp: "3.595%", ee: "3.595%", note: ko ? "장기요양보험 별도" : "Long-term care extra" },
              { name: ko ? "고용보험" : "Employment", emp: "0.9%+α", ee: "0.9%", note: ko ? "α=고용안정사업(규모별)" : "α=stability fund (by size)" },
              { name: ko ? "산재보험" : "Accident", emp: accidentInfo.rate, ee: "0%", note: ko ? accidentInfo.category : "Industry-specific" },
            ].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "10px 12px", borderTop: "1px solid rgba(5,97,252,0.04)", fontSize: "13px" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{row.name}</div>
                  <div style={{ fontSize: "10px", color: "rgba(15,23,42,0.4)", marginTop: "2px" }}>{row.note}</div>
                </div>
                <div style={{ textAlign: "right" as const, fontWeight: 650, color: "#dc2626" }}>{row.emp}</div>
                <div style={{ textAlign: "right" as const, color: "rgba(15,23,42,0.5)" }}>{row.ee}</div>
              </div>
            ))}
          </div>
        </div>
        {/* 신고 절차 */}
        <div style={{ padding: "0 22px 14px" }}>
          {(ko ? [
            { step: "4대사회보험 정보연계센터 회원가입", detail: "사업자등록번호 + 공동인증서 필요" },
            { step: "사업장 성립신고 (최초 1회)", detail: "사업 개시일·업종·근로자 수 입력" },
            { step: "근로자 취득신고 (직원당)", detail: "입사일·보수월액·주민번호 입력" },
          ] : [
            { step: "Register at 4insure.or.kr", detail: "Business reg number + certificate needed" },
            { step: "Business establishment report (once)", detail: "Start date, industry, worker count" },
            { step: "Worker acquisition report (per employee)", detail: "Start date, monthly salary, ID" },
          ]).map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#0561fc", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{s.step}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ margin: "0 22px 16px", display: "flex", gap: "8px" }}>
          <a href="https://www.4insure.or.kr" target="_blank" rel="noreferrer" style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "#0561fc", color: "#fff", fontSize: "13px", fontWeight: 650, textDecoration: "none", textAlign: "center" as const, boxShadow: "0 4px 14px rgba(5,97,252,0.25)" }}>
            {ko ? "4대보험 정보연계센터 →" : "4insure.or.kr →"}
          </a>
        </div>
      </div>
      )}

      {/* PAGE 1: 원천세 설정 */}
      {page === 1 && (
      <div style={{ borderRadius: "16px", border: "1px solid rgba(234,88,12,0.08)", background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,249,240,0.5) 100%)", boxShadow: "0 21px 94px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <SFIcon bg="rgba(234,88,12,0.08)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
            </SFIcon>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 650, color: "#ea580c", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 2</div>
              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "원천세 설정" : "Withholding Tax Setup"}</div>
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.6 }}>
            {ko ? "매월 급여 지급 시 근로소득 간이세액표에 따라 소득세를 원천징수하고, 다음 달 10일까지 홈택스에 신고·납부합니다." : "Withhold income tax per simplified tax table each payday. Report and pay via Hometax by the 10th of next month."}
          </div>
        </div>
        <div style={{ padding: "0 22px 14px" }}>
          {(ko ? [
            { step: "홈택스에서 간이세액표 조회", detail: "급여액 입력 → 원천징수 세액 자동 산출. 부양가족 수에 따라 차등" },
            { step: "매월 급여일에 원천징수", detail: "급여에서 소득세 + 지방소득세(소득세의 10%) 공제 후 지급" },
            { step: "다음 달 10일까지 홈택스 신고·납부", detail: "반기 납부 신청 시 7월·1월 연 2회로 간소화 가능 (상시근로자 20인 이하)" },
          ] : [
            { step: "Check simplified tax table on Hometax", detail: "Enter salary → auto-calculate withholding. Varies by dependents" },
            { step: "Withhold on each payday", detail: "Deduct income tax + local tax (10% of income tax) from salary" },
            { step: "Report by 10th of next month via Hometax", detail: "Semi-annual reporting available for ≤20 employees" },
          ]).map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ea580c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 620, color: "#0f172a" }}>{s.step}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.45)" }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ margin: "0 22px 16px", display: "flex", gap: "8px" }}>
          <a href="https://www.hometax.go.kr" target="_blank" rel="noreferrer" style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "#ea580c", color: "#fff", fontSize: "13px", fontWeight: 650, textDecoration: "none", textAlign: "center" as const, boxShadow: "0 4px 14px rgba(234,88,12,0.25)" }}>
            {ko ? "홈택스 간이세액표 →" : "Hometax Tax Table →"}
          </a>
        </div>
      </div>
      )}

      {/* PAGE 2: 급여 지급 방식 결정 */}
      {page === 2 && (
      <div style={{ borderRadius: "16px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,255,244,0.5) 100%)", boxShadow: "0 21px 94px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <SFIcon bg="rgba(5,150,105,0.08)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
            </SFIcon>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 650, color: "#059669", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step 3</div>
              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>{ko ? "급여 지급 방식 결정" : "Choose Payroll Method"}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "0 22px 16px", display: "grid", gap: "8px" }}>
          {(ko ? [
            { icon: "📊", title: "수기 관리 (엑셀)", desc: "직원 1~2명 시 가능. 예스폼 급여대장 양식 활용. 4대보험·세금 직접 계산.", cost: "무료", fit: "1~2명" },
            { icon: "🧑‍💼", title: "세무사 위임", desc: "월 수임료 10~30만원. 급여·4대보험·원천세 전부 대행. 가장 안전한 방법.", cost: "월 10~30만원", fit: "전 규모" },
            { icon: "💻", title: "급여 SaaS (flex, 알밤 등)", desc: "자동 급여 계산+명세서 발송+4대보험 연동. 직원 수 기반 과금.", cost: "월 0~5만원", fit: "3명+" },
          ] : [
            { icon: "📊", title: "Manual (Excel)", desc: "Viable for 1-2 employees. Use payroll templates. Calculate insurance/tax manually.", cost: "Free", fit: "1-2 staff" },
            { icon: "🧑‍💼", title: "Tax Advisor", desc: "10-30K/mo. Full payroll, insurance, tax handling. Safest option.", cost: "₩10-30K/mo", fit: "All sizes" },
            { icon: "💻", title: "Payroll SaaS (flex, Albam)", desc: "Auto payroll + payslip + insurance sync. Per-employee pricing.", cost: "₩0-50K/mo", fit: "3+ staff" },
          ]).map((item, i) => (
            <div key={i} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(5,150,105,0.06)", background: "rgba(5,150,105,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                <span style={{ fontSize: "14px", fontWeight: 650, color: "#0f172a" }}>{item.title}</span>
              </div>
              <div style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(15,23,42,0.55)", marginBottom: "6px", paddingLeft: "26px" }}>{item.desc}</div>
              <div style={{ display: "flex", gap: "8px", paddingLeft: "26px" }}>
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: "rgba(5,150,105,0.08)", color: "#059669", fontWeight: 600 }}>{item.cost}</span>
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: "rgba(15,23,42,0.04)", color: "rgba(15,23,42,0.5)", fontWeight: 600 }}>{ko ? "적합" : "Fit"}: {item.fit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* 두루누리 지원 안내 (page 0에서만) */}
      {page === 0 && (
      <div style={{ borderRadius: "12px", padding: "14px 16px", background: "rgba(5,97,252,0.04)", border: "1px solid rgba(5,97,252,0.08)", marginTop: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 650, color: "#0561fc", marginBottom: "4px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0561fc" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          {ko ? "두루누리 사회보험료 지원 (10인 미만 사업장)" : "Durunuri Insurance Support (Under 10 employees)"}
        </div>
        <div style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(15,23,42,0.55)" }}>
          {ko
            ? "월 보수 270만원 미만 신규 가입자의 고용보험·국민연금 보험료 80%를 국가가 최대 36개월 지원합니다. 4대보험 신고 시 '두루누리 지원' 체크만 하면 자동 적용됩니다."
            : "Government covers 80% of employment + pension insurance for new enrollees earning under 2.7M/mo. Up to 36 months. Just check 'Durunuri support' when filing."}
        </div>
        <a href="https://insurancesupport.or.kr" target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "6px", fontSize: "12px", fontWeight: 600, color: "#0561fc", textDecoration: "none" }}>
          {ko ? "두루누리 지원 확인 →" : "Check Durunuri eligibility →"}
        </a>
      </div>
      )}

      {/* 주의사항 (page 0에서만) */}
      {page === 0 && (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
        <div style={{ borderRadius: "12px", padding: "12px 14px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)", display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ marginTop: "1px", flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
          <div style={{ fontSize: "12px", color: "#dc2626", lineHeight: 1.6 }}>
            {ko ? "5인 미만 사업장도 4대보험 신고 의무. 1인 고용이라도 미신고 시 가산세 + 소급 납부." : "Even under 5 employees must register. Late filing = penalties + back-payment."}
          </div>
        </div>
        <div style={{ borderRadius: "12px", padding: "12px 14px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)", display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ marginTop: "1px", flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
          <div style={{ fontSize: "12px", color: "#dc2626", lineHeight: 1.6 }}>
            {ko ? "현금 급여 후 미신고는 세무조사 리스크. 국세청 카드 매출 분석(PCI)으로 추적 가능." : "Unreported cash salary = audit risk. NTS tracks via card sales analysis."}
          </div>
        </div>
      </div>
      )}

      {/* 페이지 네비게이션 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 0" }}>
        <button type="button" disabled={page === 0} onClick={() => setInsuranceTaxPage(p => p - 1)} style={{
          padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(5,97,252,0.1)",
          background: page === 0 ? "rgba(0,0,0,0.02)" : "white",
          color: page === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: page === 0 ? "default" : "pointer",
        }}>
          ← {ko ? "이전" : "Prev"}
        </button>
        <div style={{ display: "flex", gap: "6px" }}>
          {[0, 1, 2].map(i => (
            <div key={i} onClick={() => setInsuranceTaxPage(i)} style={{
              width: i === page ? "20px" : "8px", height: "8px", borderRadius: "100px",
              background: i === page ? "#0561fc" : "rgba(0,0,0,0.1)",
              cursor: "pointer", transition: "all 0.2s ease",
            }} />
          ))}
        </div>
        <button type="button" disabled={page === totalPages - 1} onClick={() => setInsuranceTaxPage(p => p + 1)} style={{
          padding: "10px 18px", borderRadius: "10px", border: "none",
          background: page === totalPages - 1 ? "rgba(0,0,0,0.02)" : "#0561fc",
          color: page === totalPages - 1 ? "rgba(0,0,0,0.2)" : "#fff",
          fontSize: "13px", fontWeight: 600, cursor: page === totalPages - 1 ? "default" : "pointer",
          boxShadow: page === totalPages - 1 ? "none" : "0 4px 14px rgba(5,97,252,0.25)",
        }}>
          {ko ? "다음" : "Next"} →
        </button>
      </div>
    </div>
  );
}
