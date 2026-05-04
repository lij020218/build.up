"use client";

import { Lightbulb, Award, Percent, Building, AlertTriangle } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { ModePathCard } from "./ModePathCard";
import {
  MIDNIGHT,
  MIDNIGHT_SOFT,
  MIDNIGHT_BORDER,
  StartupKeyActionHero,
  StartupPageNav,
  StartupReferenceLabel,
} from "./StartupStageShell";
import { StageWrapup } from "../shared/StageWrapup";

export function VentureCertificationStage() {
  const d = useDashboardCtx();
  const language = d.language;
  const ko = language === "ko";
  const { guideStepIndex, setGuideStepIndex, guideSelections, setGuideSelections } = d;
  const pg = guideStepIndex;
  const selectedVentureType = (guideSelections["venture-cert-type"] as string | undefined) ?? null;
  const selectVentureType = (type: string) => {
    setGuideSelections((prev: Record<string, string>) => ({ ...prev, "venture-cert-type": type }));
  };
  const totalPg = 4;
  const pgLabels = ko
    ? ["왜 중요한가", "1. 인증 유형", "2. 혜택 상세", "3. 신청·활용"]
    : ["Why", "1. Cert Types", "2. Benefits", "3. Apply & Use"];

  const progCard = (p: { name: string; amount: string; detail: string; color: string; url: string }) => (
    <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", borderRadius: "12px",
      border: `1px solid ${p.color}12`, background: `${p.color}03`, textDecoration: "none", color: "inherit",
    }}>
      <div style={{ padding: "3px 8px", borderRadius: "6px", background: `${p.color}0a`, fontSize: "11px", fontWeight: 700, color: p.color, whiteSpace: "nowrap" as const, flexShrink: 0 }}>{p.amount}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "1px" }}>{p.name}</div>
        <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{p.detail}</div>
      </div>
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}><path d="M3 11L11 3M11 3H6M11 3V8" stroke="rgba(15,23,42,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </a>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* KEY ACTION 미드나이트 hero (최상단) */}
      <StartupKeyActionHero
        eyebrow="KEY ACTION"
        title={ko ? "벤처인증 하나로 수천만원 절세 + 지원사업 자격" : "One cert: tens of millions saved + program access"}
        subtitle={
          ko
            ? "법인세 50% 감면(5년) + 취득세 75% 감면 + 스톡옵션 비과세(연 2억) + TIPS·창업패키지 우대. 마감을 놓치면 1년을 기다려야 합니다."
            : "50% tax cut (5yr) + 75% acquisition tax cut + tax-free stock options (₩200M/yr) + TIPS/package priority. Miss deadlines and wait a year."
        }
        miniCards={[
          { icon: Award, label: ko ? "3가지 유형" : "3 Types", detail: ko ? "투자/R&D/혁신" : "Invest/R&D/Innov" },
          { icon: Percent, label: ko ? "법인세 50%" : "50% Tax", detail: ko ? "5년 감면" : "5 years cut" },
          { icon: Building, label: ko ? "지원사업" : "Programs", detail: ko ? "TIPS·예창패" : "TIPS+pkg" },
        ]}
      />

      <StartupReferenceLabel>
        {ko ? "↓ 심화 참고 — 벤처기업 유형·정부지원·세제 혜택" : "↓ Reference — venture cert types, govt programs, tax benefits"}
      </StartupReferenceLabel>

      {/* 페이지 네비 */}
      <StartupPageNav
        page={pg}
        totalPages={totalPg}
        labels={pgLabels}
        onChange={(p) => setGuideStepIndex(p)}
        ko={ko}
      />

      {/* PAGE 0 — WHY + 모드별 경로 카드 */}
      {pg === 0 && (
      <>
      <ModePathCard stageId="venture-certification" />
      <div style={{ borderRadius: "20px", border: `1px solid ${MIDNIGHT_BORDER}`, background: "white", padding: "20px 22px", boxShadow: "0 1px 3px rgba(25,25,112,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <AlertTriangle size={14} strokeWidth={2.2} color={MIDNIGHT} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "왜 이 단계가 중요한가" : "Why this matters"}</span>
        </div>
        <div style={{ fontSize: "15px", fontWeight: 680, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
          {ko ? "벤처인증 하나로 수천만원의 세금과 기회를 절약합니다." : "One certification saves millions in tax and unlocks opportunities."}
        </div>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
          {ko ? "벤처기업 인증을 받으면 법인세/소득세 50% 감면(5년), 취득세 75% 감면, 스톡옵션 비과세(연 2억), 정부 지원사업 우선 선발 등 핵심 혜택을 받습니다. 인증 없이 같은 비용을 직접 부담하면 초기 자본이 빠르게 소진됩니다. 정부 지원사업은 마감이 정해져 있어, 놓치면 1년을 기다려야 합니다." : "Venture certification gives you 50% tax reduction (5yr), 75% acquisition tax cut, tax-free stock options (₩200M/yr), and priority for government programs. Missing deadlines means waiting a full year."}
        </div>
      </div>
      <div style={{ display: "grid", gap: "6px" }}>
        {(ko ? [
          { num: 1, title: "인증 유형 확인", desc: "벤처투자 / 연구개발 / 혁신성장 — 우리 회사에 맞는 유형 선택" },
          { num: 2, title: "혜택 상세", desc: "세금 감면, 스톡옵션, 투자자 소득공제 등 구체적 금액" },
          { num: 3, title: "정부 지원사업 매칭", desc: "TIPS, 예비창업패키지, 초기창업패키지 등 신청 일정" },
        ] : [
          { num: 1, title: "Check Certification Type", desc: "Investment / R&D / Innovation Growth — find your fit" },
          { num: 2, title: "Detailed Benefits", desc: "Tax cuts, stock options, investor deductions" },
          { num: 3, title: "Government Program Match", desc: "TIPS, Pre-startup, Early-stage package deadlines" },
        ]).map(s => (
          <div key={s.num} onClick={() => setGuideStepIndex(s.num)} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 14px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}`, cursor: "pointer" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 640, color: "#0f172a" }}>{s.title}</div>
              <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.4 }}>{s.desc}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><path d="M5 3l4 4-4 4" stroke="rgba(0,0,0,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        ))}
      </div>
      </>
      )}

      {/* PAGE 1 — 인증 유형 선택 */}
      {pg === 1 && (() => {
        const types = ko ? [
          { id: "investment", type: "벤처투자유형", who: "VC · 액셀러레이터 등 적격 투자기관에서 투자받은 기업", reqs: ["적격 투자기관에서 5,000만원 이상 투자 실적", "자본금 대비 투자 금액 10% 이상"], fast: "가장 빠름 — 투자 실적만 증명하면 됨", color: MIDNIGHT, timing: "처리: 약 20일", cost: "수수료 없음" },
          { id: "rnd", type: "연구개발유형", who: "기술 R&D에 집중하는 기업 (기업부설연구소 보유)", reqs: ["기업부설연구소 또는 연구개발전담부서 보유", "직전 4분기 R&D비 5,000만원 이상 + 매출의 5~10%", "사업성 평가 우수 판정"], fast: "연구소 필수 — 설립에 2~4주 소요", color: MIDNIGHT, timing: "처리: 약 30~45일", cost: "연구소 설립비 50~100만원" },
          { id: "innovation", type: "혁신성장유형", who: "기술성 + 사업성 모두 우수한 고성장 기업", reqs: ["기술성 평가 우수 (기술보증기금 등)", "사업성 평가 우수"], fast: "가장 범용적 — 연구소 없어도 가능", color: MIDNIGHT, timing: "처리: 약 30~45일", cost: "수수료 없음" },
        ] : [
          { id: "investment", type: "Investment Type", who: "Companies funded by qualified investors (VC, accelerator)", reqs: ["₩50M+ investment from qualified institutions", "Investment ≥ 10% of capital"], fast: "Fastest — just prove investment", color: MIDNIGHT, timing: "~20 days", cost: "Free" },
          { id: "rnd", type: "R&D Type", who: "Tech companies with R&D labs", reqs: ["Own R&D lab or department", "Last 4Q R&D spend ₩50M+ and 5-10% of revenue", "Business viability assessment pass"], fast: "Lab required — 2-4wk to set up", color: MIDNIGHT, timing: "~30-45 days", cost: "Lab setup ₩500K-1M" },
          { id: "innovation", type: "Innovation Growth", who: "High-growth companies with tech + business excellence", reqs: ["Technology assessment pass (KIBO etc.)", "Business viability assessment pass"], fast: "Most versatile — no lab needed", color: MIDNIGHT, timing: "~30-45 days", cost: "Free" },
        ];
        return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.5)", marginBottom: "2px" }}>
          {ko ? "우리 회사에 맞는 인증 유형을 선택하세요. 선택 결과는 자동 저장됩니다." : "Choose the certification type that fits your company. Selection is auto-saved."}
        </div>
        {types.map(t => {
          const selected = selectedVentureType === t.id;
          return (
          <button key={t.id} type="button" onClick={() => selectVentureType(t.id)} style={{
            borderRadius: "16px",
            border: selected ? `2px solid ${t.color}` : `1px solid ${t.color}15`,
            background: selected ? `${t.color}08` : `${t.color}02`,
            overflow: "hidden", cursor: "pointer", textAlign: "left" as const,
            transition: "all 0.2s ease",
          }}>
            <div style={{ padding: "16px 18px 10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                border: selected ? `6px solid ${t.color}` : "2px solid rgba(0,0,0,0.15)",
                transition: "all 0.2s ease",
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: selected ? t.color : "#0f172a", marginBottom: "4px" }}>{t.type}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5 }}>{t.who}</div>
              </div>
            </div>
            <div style={{ padding: "0 18px 12px", display: "grid", gap: "3px" }}>
              {t.reqs.map(r => (
                <div key={r} style={{ display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.45 }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: t.color, flexShrink: 0, marginTop: "5px" }} />
                  <span>{r}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "8px 18px 14px", background: `${t.color}05`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: t.color }}>{t.fast}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: `${t.color}10`, color: t.color }}>{t.timing}</span>
                <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.04)", color: "rgba(15,23,42,0.5)" }}>{t.cost}</span>
              </div>
            </div>
          </button>
          );
        })}

        {selectedVentureType && (
        <div style={{ padding: "10px 14px", borderRadius: "12px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}` }}>
          <div style={{ fontSize: "12px", fontWeight: 640, color: MIDNIGHT }}>
            ✓ {ko
              ? `${types.find(t => t.id === selectedVentureType)?.type} 선택됨 — 아래 링크에서 신청하세요`
              : `${types.find(t => t.id === selectedVentureType)?.type} selected — apply via the link below`}
          </div>
        </div>
        )}

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          <a href="https://smes.go.kr/venturein" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 14px", borderRadius: "8px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}`, fontSize: "12px", fontWeight: 600, color: MIDNIGHT, textDecoration: "none" }}>
            {ko ? "벤처확인 신청 바로가기" : "Apply for Venture Cert"} ↗
          </a>
          <a href="https://www.kibo.or.kr" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 14px", borderRadius: "8px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", fontSize: "12px", fontWeight: 600, color: "rgba(15,23,42,0.5)", textDecoration: "none" }}>
            {ko ? "기술보증기금" : "KIBO"} ↗
          </a>
        </div>

        <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(15,23,42,0.02)", fontSize: "12px", color: "rgba(15,23,42,0.5)", lineHeight: 1.5 }}>
          {ko ? "유효기간: 3년 (재인증 필요). 인증 후 세금 감면은 최초 소득 발생 과세연도부터 5년간 적용됩니다." : "Valid: 3 years (renewal required). Tax benefits apply for 5 years from first taxable income."}
        </div>
      </div>
        );
      })()}

      {/* PAGE 2 — 혜택 상세 */}
      {pg === 2 && (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {(ko ? [
          { title: "법인세 · 소득세 50% 감면", detail: "벤처 인증 후 최초 소득 발생 과세연도부터 5년간 50% 감면. 창업 3년 이내 인증 시 적용.", tag: "5년간" },
          { title: "취득세 75% 감면", detail: "인증일로부터 4년 이내 사업용 부동산 취득 시 적용. 청년 창업 벤처는 5년.", tag: "부동산" },
          { title: "재산세 면제 → 50% 경감", detail: "사업용 부동산: 인증 후 3년간 면제, 이후 2년간 50% 경감.", tag: "5년간" },
          { title: "스톡옵션 비과세 연 2억원", detail: "2023년 이후 행사분: 연 2억원, 기업당 누적 5억원까지 비과세. 행사이익 5년 분할 납부 또는 양도 시 일괄 납부 선택 가능.", tag: "핵심" },
          { title: "개인투자자 소득공제", detail: "벤처 직접 투자 시: 3,000만원 이하 100%, 3,000~5,000만원 70%, 5,000만원 초과 30% 소득공제. 투자 유치에 강력한 인센티브.", tag: "투자 유치" },
          { title: "병역특례 · 정책자금 우대", detail: "병역 지정업체 신청 자격, 정책자금 우대 금리, 기술신용보증 우대.", tag: "추가" },
        ] : [
          { title: "50% Corporate/Income Tax Cut", detail: "5 years from first taxable income after certification. Must certify within 3yr of founding.", tag: "5 years" },
          { title: "75% Acquisition Tax Cut", detail: "Business real estate acquired within 4yr of certification. 5yr for youth founders.", tag: "Real estate" },
          { title: "Property Tax Exemption → 50%", detail: "Business property: 3yr exempt, then 2yr at 50% reduction.", tag: "5 years" },
          { title: "Stock Option Tax-Free ₩200M/yr", detail: "Post-2023: ₩200M/yr, ₩500M cumulative per company. 5yr installment or defer to disposal.", tag: "Key" },
          { title: "Investor Tax Deduction", detail: "Direct investment: 100% for ≤₩30M, 70% for ₩30-50M, 30% for >₩50M income deduction.", tag: "Fundraising" },
          { title: "Military Exemption + Policy Funds", detail: "Military service designation eligibility, preferred rates on policy funds.", tag: "Extra" },
        ]).map(b => (
          <div key={b.title} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "12px 14px", borderRadius: "12px", border: `1px solid ${MIDNIGHT_BORDER}`, background: "white" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: MIDNIGHT_SOFT, color: MIDNIGHT, whiteSpace: "nowrap" as const, flexShrink: 0, marginTop: "2px" }}>{b.tag}</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 640, color: "#0f172a", marginBottom: "2px" }}>{b.title}</div>
              <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.5)", lineHeight: 1.45 }}>{b.detail}</div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* PAGE 3 — 신청 절차 + 인증 후 활용 (정부 지원사업은 이전 단계 '런웨이·투자' 에서 다룸) */}
      {pg === 3 && (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* 신청 절차 */}
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
            {ko ? "벤처인증 신청 절차 (벤처인 venture.or.kr)" : "Venture cert application steps"}
          </div>
          <div style={{ display: "grid", gap: "8px" }}>
            {(ko ? [
              { num: 1, title: "벤처인 회원가입 + 사업자 정보 등록", detail: "venture.or.kr → 사업자등록증·법인등기부등본·주주명부 업로드. 5-10분." },
              { num: 2, title: "유형 선택 (3가지 중 1)", detail: "① 투자유치형 (VC 5천만+ 투자 받음) / ② 연구개발형 (R&D 비중 5%+ 또는 기업부설연구소) / ③ 혁신성장형 (기술성+사업성 평가 통과)." },
              { num: 3, title: "필요 서류 준비 + 온라인 신청", detail: "재무제표·사업계획서·R&D 증빙·투자 계약서 등. 유형별 서류 다름." },
              { num: 4, title: "심사 (30일 이내) → 인증서 발급", detail: "심사기간 30일. 통과 시 벤처기업 확인서 즉시 발급. 거절 시 사유 확인 후 보완 재신청." },
              { num: 5, title: "유효기간 3년 + 재신청", detail: "3년마다 재신청 필요. 인증 요건 (R&D 비중·투자 등) 지속 충족해야 함." },
            ] : [
              { num: 1, title: "Sign up at venture.or.kr", detail: "Upload biz registration, legal entity docs." },
              { num: 2, title: "Pick type (3 options)", detail: "Investment / R&D / Innovation Growth." },
              { num: 3, title: "Prepare docs + apply online", detail: "Financials, biz plan, R&D evidence." },
              { num: 4, title: "Review within 30 days", detail: "Issue certificate or rejection." },
              { num: 5, title: "Valid 3 years", detail: "Renew every 3 years." },
            ]).map((s) => (
              <div key={s.num} style={{ display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "12px", background: "white", border: `1px solid ${MIDNIGHT_BORDER}` }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: MIDNIGHT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>{s.title}</div>
                  <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.65)", lineHeight: 1.55 }}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 인증 후 활용 (세제·옵션풀·병역) */}
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
            {ko ? "인증 후 즉시 활용 — 세제·옵션풀·병역특례" : "Activate immediately"}
          </div>
          <div style={{ display: "grid", gap: "8px" }}>
            {(ko ? [
              { title: "법인세 5년 50% 감면 신청", detail: "관할 세무서 → 벤처기업 확인서 제출. 인증일 속한 사업연도부터 5년간 자동 적용." },
              { title: "스톡옵션 비과세 (연 2억·누적 5억)", detail: "임직원 스톡옵션 부여 시 비과세 한도 적용. 2027.12.31 까지 부여분에 한정. ZUZU·Carta 로 캡테이블 관리." },
              { title: "옵션풀 50% 한도 발행", detail: "벤처기업은 자본금의 50% 까지 옵션풀 가능 (일반 10% 대비 5배). 시리즈A 협상 전 충분히 확보." },
              { title: "병역특례 (전문연구요원·산업기능요원)", detail: "이공계 석·박사 또는 학사 + R&D 인력. 핵심 인재 36개월 확보. 병무청 신청." },
              { title: "취득세·재산세 감면 (75%)", detail: "사업용 부동산 취득 시 취득세 75% 감면 (창업 후 4년 이내 취득 시)." },
            ] : [
              { title: "5-yr 50% corp tax cut", detail: "Apply at tax office with cert." },
              { title: "Tax-free stock options", detail: "₩200M/yr, ₩500M total until 2027.12.31." },
              { title: "50% option pool cap", detail: "vs 10% standard. Use ZUZU/Carta." },
              { title: "Military service exemption", detail: "Specialized researcher / industrial." },
              { title: "75% acquisition tax cut", detail: "On business real estate, within 4 years." },
            ]).map((s, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}` }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, marginBottom: "3px" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.55 }}>{s.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 외부 링크 */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
          <a href="https://www.venture.or.kr" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}`, fontSize: "12px", fontWeight: 600, color: MIDNIGHT, textDecoration: "none" }}>벤처인 (신청 사이트) ↗</a>
          <a href="https://www.smes.go.kr/venturein/" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}`, fontSize: "12px", fontWeight: 600, color: MIDNIGHT, textDecoration: "none" }}>중기부 벤처기업 안내 ↗</a>
          <a href="https://zuzu.network" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", background: MIDNIGHT_SOFT, border: `1px solid ${MIDNIGHT_BORDER}`, fontSize: "12px", fontWeight: 600, color: MIDNIGHT, textDecoration: "none" }}>ZUZU (캡테이블·옵션풀) ↗</a>
        </div>

        {/* 이전 단계 안내 */}
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.025)", fontSize: "12px", color: "rgba(15,23,42,0.7)", lineHeight: 1.55, display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <Lightbulb size={13} strokeWidth={1.5} color={MIDNIGHT} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>{ko ? "정부 지원사업 (TIPS·예비창업·초기창업·바우처 등) 매칭은 이전 '런웨이·투자 준비' 단계의 'Page 2 추천 프로그램' 에서 모드별로 다뤘습니다. 인증 받으면 그 프로그램 신청 시 가산점·우대 금리 자동 적용됩니다." : "Government program matching is covered in the previous 'Runway & Fundraising' stage. Venture cert gives bonus points when applying."}</span>
        </div>
      </div>
      )}

      <StageWrapup
        ko={ko}
        nextStageLabelKo="사업자등록"
        doneItemsKo={[
          { label: "1. 벤처 유형 결정", detail: "벤처투자유형·연구개발유형·혁신성장유형 비교 후 선택" },
          { label: "2. 자격 요건 점검", detail: "투자 유치액·R&D 비율·매출·인력 등 유형별 요건 충족 확인" },
          { label: "3. 신청 서류 준비", detail: "사업계획서·재무제표·R&D 증빙·연구원 명단 등 사전 준비" },
          { label: "4. 인증 신청·발급", detail: "벤처기업종합관리시스템(SMTECH) 신청 + 평균 1~2개월 발급" },
        ]}
        verifyItemsKo={[
          "벤처투자유형 — 「벤처투자조합 5천만원 이상」 투자 받아야 자격, 단순 엔젤 X",
          "연구개발유형 — 매출 대비 R&D 비율 5% 이상 + 연구개발전담부서 보유 의무",
          "혁신성장유형 — 평가 점수 70점 이상, 평가 항목 사전 확인 후 보완",
          "법인전환 — 개인사업자는 인증 불가, 법인 전환 후 신청 (전환 후 6개월 매출 자료 필요)",
          "갱신 — 벤처 인증은 3년, 갱신 시 자격 재충족 의무 (미충족 시 인증 취소)",
          "혜택 활용 — 세제 감면·정부지원금 가산점·인재 채용 우대 등 자동 적용 X, 별도 신청 필요",
        ]}
        nextSummaryKo="벤처 유형·요건·신청 완료 → 사업자등록 단계로 진입 (또는 다음 정부지원 신청)"
      />
    </div>
  );
}
