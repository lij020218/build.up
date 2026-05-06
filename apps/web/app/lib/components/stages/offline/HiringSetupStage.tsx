"use client";

import { useState } from "react";
import { Users, FileSignature, ShieldCheck, ExternalLink, ChevronRight, Calculator, Check } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { HiringCostCalculator } from "../../knowledge/HiringCostCalculator";
import { MyHiringPlanCard } from "./MyHiringPlanCard";
import {
  KeyActionHero,
  StageTabNav,
  StageOverview,
  WorkStep,
} from "../shared/StageActionHero";

const MIDNIGHT = "#191970";

/**
 * HiringSetupStage — ContractReviewStage 와 동일한 흐름 패턴으로 통일.
 *
 * 흐름:
 *   1. KEY ACTION HERO — 사용자에게 "이 단계에서 꼭 할 일" 한 문장
 *   2. 페이지 탭: 개요 → 1.공고 → 2.계약서 → 3.보험·세금 → 4.첫달 → 체크리스트
 *   3. 각 작업 페이지는 WorkStep — 한 번에 한 작업의 왜·어떻게·주의·유리한 길
 *   4. 마지막 페이지에 공식 사이트 링크 모음 (외부 링크 클릭 가능)
 *
 * 사용자 피드백: contract-review 와 같은 결로 흐름·UI 통일.
 */
export function HiringSetupStage() {
  const d = useDashboardCtx();
  const { language, industryCategoryId } = d;
  const ko = language === "ko";

  const [pageIdx, setPageIdx] = useState(0);

  const pageLabels = ko
    ? ["개요", "1. 공고", "2. 계약서", "3. 보험·세금", "4. 첫 달", "마무리"]
    : ["Overview", "1. Posting", "2. Contract", "3. Insurance & Tax", "4. Month 1", "Wrap-up"];

  // ── 카테고리별 「사장님 상황」 권장 (각 작업 페이지 favorable 으로 주입) ──
  const myHiring: Record<string, { context: string; recommendation: string; rationale: string }> = ko ? {
    food: {
      context: "음식점 / F&B",
      recommendation: "초기엔 알바몬·당근으로 알바 1~2명, 정직원은 매출 3개월 검증 후",
      rationale: "F&B는 매출 변동 큼. 정직원 무리하게 뽑으면 인건비가 매출의 40%↑로 폭증. 알바 → 우수 알바 정직원 전환이 안전.",
    },
    "cafe-dessert": {
      context: "카페 / 디저트",
      recommendation: "오픈 1~2주 전 알바천국 + 당근으로 평일·주말 분리 채용",
      rationale: "카페는 시간대 편차 큼. 평일 오전·오후 / 주말 풀타임으로 시급 분산 채용 시 인건비 효율 ↑",
    },
    beauty: {
      context: "미용·뷰티",
      recommendation: "디자이너·관리사는 사람인·잡코리아, 보조는 알바몬",
      rationale: "면허·경력 검증이 필요한 직군은 이력서 기반 플랫폼이 정확. 보조 인력은 단기 알바로 충분.",
    },
    fitness: {
      context: "필라테스·요가·PT",
      recommendation: "강사는 트레이너스 / 잡플래닛 + 자격증 사전 검증",
      rationale: "지도자 자격증·경력이 매출 직결. 일반 알바몬보다 트레이너 전문 플랫폼이 채용 품질 ↑",
    },
    education: {
      context: "학원",
      recommendation: "강사는 사람인·강사인, 행정 보조는 알바몬",
      rationale: "강사는 경력·과목 매칭이 핵심 — 전문 플랫폼. 행정·청소·셔틀 보조는 단기 알바로 분리.",
    },
    pet: {
      context: "펫",
      recommendation: "미용사는 펫업 + 자격증 검증, 일반 보조는 당근",
      rationale: "반려동물 미용사·훈련사는 자격이 매출 직결. 펫 전문 플랫폼에서 검증된 인력 채용.",
    },
    "online-digital": {
      context: "온라인·디지털",
      recommendation: "포장·배송 보조는 당근·알바천국, 운영 도우미는 사람인",
      rationale: "택배·재고 작업은 인근 거주자가 효율적 — 동네 알바. 마케팅·CS 등 사무 보조는 사람인.",
    },
    "living-service": {
      context: "세탁·청소·수리",
      recommendation: "기술자는 사람인 + 면허 검증, 보조는 알바천국",
      rationale: "기술 인력은 자격·경력 검증 필요. 보조는 단기 알바로 시작해 적성 본 후 정직원 전환.",
    },
    space: {
      context: "공간 임대",
      recommendation: "관리·청소 인력은 당근·알바천국으로 단기 채용",
      rationale: "공간 임대는 상주 인력 적음. 청소·관리 단기 알바로 운영 비용 최소화.",
    },
  } : {
    food: { context: "F&B", recommendation: "Albamon/Karrot for 1-2 PT first, FT after 3-month sales check", rationale: "Volatile sales — premature FT pushes labor to 40%+ of revenue." },
    "cafe-dessert": { context: "Cafe/Dessert", recommendation: "Split weekday/weekend on Albachunguk + Karrot 1-2w pre-open", rationale: "Cafes have steep time-of-day variance. Time-split hiring optimizes cost." },
    beauty: { context: "Beauty", recommendation: "Saramin/JobKorea for stylists; Albamon for assistants", rationale: "License/experience-critical roles need resume-based platforms." },
    fitness: { context: "Fitness/PT", recommendation: "Trainers via Trainers + cert verification", rationale: "Cert/experience drives revenue — specialty platforms beat general boards." },
    education: { context: "Academy", recommendation: "Saramin/Gangsain for instructors; Albamon for ops", rationale: "Instructor matching is core. Split admin to short-term hires." },
    pet: { context: "Pet", recommendation: "Petup for groomers (cert-verified); Karrot for assistants", rationale: "Specialist certs drive revenue." },
    "online-digital": { context: "Online", recommendation: "Karrot for shipping helpers; Saramin for ops support", rationale: "Local helpers for fulfillment efficiency." },
    "living-service": { context: "Cleaning/Repair", recommendation: "Saramin for techs (license-verified); Albachunguk for assistants", rationale: "License-driven roles need verification." },
    space: { context: "Space rental", recommendation: "Karrot/Albachunguk for cleaning/management PT", rationale: "Minimal staffing — short-term hires only." },
  };
  const myFavorable = myHiring[industryCategoryId] ?? myHiring.food;

  // ── 인라인 링크 카드 (각 작업 페이지 안에서 즉시 클릭 가능) ──────────────
  type LinkCard = { label: string; desc: string; href: string; brand?: string };
  const InlineLinks = ({ title, links }: { title: string; links: LinkCard[] }) => (
    <div style={{
      background: "white",
      borderRadius: 16,
      border: "1px solid rgba(25,25,112,0.08)",
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      padding: "16px 18px",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(25,25,112,0.08)" }}>
        {links.map((link, idx) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px",
              borderBottom: idx < links.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
              textDecoration: "none", color: "inherit", background: "transparent",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(25,25,112,0.025)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
          >
            {link.brand && (
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: MIDNIGHT, color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                fontSize: link.brand.length > 1 ? 11 : 14,
                fontWeight: 700,
                letterSpacing: link.brand.length > 1 ? "-0.5px" : "0",
                boxShadow: "0 2px 6px rgba(25,25,112,0.22)",
              }}>
                {link.brand}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", marginBottom: 2 }}>
                {link.label}
              </div>
              <div style={{ fontSize: 12, color: "rgba(15,23,42,0.55)", lineHeight: 1.45 }}>
                {link.desc}
              </div>
            </div>
            <ExternalLink size={13} strokeWidth={2} style={{ color: "rgba(0,0,0,0.3)", flexShrink: 0 }} />
            <ChevronRight size={16} strokeWidth={2} style={{ color: "rgba(0,0,0,0.3)", flexShrink: 0 }} />
          </a>
        ))}
      </div>
    </div>
  );

  // 페이지 1 — 공고 플랫폼 5종
  const postingLinks: LinkCard[] = ko ? [
    { label: "알바몬", desc: "단기·파트타임 1순위 · 소상공인 무료 공고 · 24h 내 지원자 다수", href: "https://www.albamon.com", brand: "알" },
    { label: "알바천국", desc: "음식점·카페 표준 · 네이버 검색 연동 · 인근 거주자 매칭", href: "https://www.alba.co.kr", brand: "천" },
    { label: "당근 동네알바", desc: "지역 주민 즉시 매칭 · 무료 · 출퇴근 거리 짧은 알바", href: "https://www.daangn.com", brand: "당" },
    { label: "사람인", desc: "정직원·경력직 채용 · 이력서 기반 · 디자이너·강사·기술자", href: "https://www.saramin.co.kr", brand: "사" },
    { label: "잡코리아", desc: "정직원 채용 + 경력 매칭 · 면허·자격증 검증", href: "https://www.jobkorea.co.kr", brand: "잡" },
  ] : [
    { label: "Albamon", desc: "PT specialist · free for small biz · applicants in 24h", href: "https://www.albamon.com", brand: "A" },
    { label: "Albachunguk", desc: "F&B/Cafe standard · Naver-linked · local match", href: "https://www.alba.co.kr", brand: "C" },
    { label: "Karrot Local Jobs", desc: "Instant local match · free · short commute", href: "https://www.daangn.com", brand: "K" },
    { label: "Saramin", desc: "FT hires · resume-based · designers/instructors/techs", href: "https://www.saramin.co.kr", brand: "S" },
    { label: "JobKorea", desc: "FT hires + experienced talent · cert verification", href: "https://www.jobkorea.co.kr", brand: "J" },
  ];

  // 페이지 2 — 계약서·임금 사이트 3종
  const contractLinks: LinkCard[] = ko ? [
    { label: "고용노동부 표준 근로계약서", desc: "공식 근로계약서 무료 다운로드 (정규·기간제·단시간)", href: "https://www.moel.go.kr/policy/policydata/list.do", brand: "고용" },
    { label: "최저임금위원회", desc: "2026년 최저임금 10,030원 · 모의 계산기", href: "https://www.minimumwage.go.kr", brand: "최임" },
    { label: "노동OK", desc: "노동부 공식 무료 노무 상담 포털", href: "https://www.nodongok.com", brand: "노동" },
  ] : [
    { label: "MOEL Standard Contract", desc: "Official employment contract template (PT/FT/contract)", href: "https://www.moel.go.kr/policy/policydata/list.do", brand: "MOEL" },
    { label: "Minimum Wage Commission", desc: "2026 KRW 10,030/h · simulator", href: "https://www.minimumwage.go.kr", brand: "MW" },
    { label: "NodongOK", desc: "Free official labor consulting portal", href: "https://www.nodongok.com", brand: "NK" },
  ];

  // 페이지 3 — 보험·세금 사이트 4종
  const insuranceLinks: LinkCard[] = ko ? [
    { label: "4대보험 정보연계센터", desc: "국민연금·건강·고용·산재 통합 신고 (필수, 채용 14일 이내)", href: "https://www.4insure.or.kr", brand: "4대" },
    { label: "홈택스", desc: "원천세 매월 신고·납부, 사업자등록·연말정산", href: "https://www.hometax.go.kr", brand: "홈" },
    { label: "국민건강보험공단", desc: "직원 보험료 조회·납부", href: "https://www.nhis.or.kr", brand: "건강" },
    { label: "근로복지공단", desc: "산재·고용보험 가입·신고 (사업주 부담)", href: "https://www.kcomwel.or.kr", brand: "근로" },
  ] : [
    { label: "Social Insurance Portal", desc: "All 4 insurances at once (within 14 days of hire)", href: "https://www.4insure.or.kr", brand: "4-IN" },
    { label: "Hometax", desc: "Monthly payroll tax filing, biz reg, year-end", href: "https://www.hometax.go.kr", brand: "HT" },
    { label: "NHIS", desc: "Employee health premium lookup/payment", href: "https://www.nhis.or.kr", brand: "NH" },
    { label: "KCOMWEL", desc: "Workers comp / employment insurance (employer)", href: "https://www.kcomwel.or.kr", brand: "KC" },
  ];

  // ── 공식 사이트 (체크리스트 페이지 — 외부 링크) ──────────────────────────
  const officialLinks: Array<{ label: string; desc: string; href: string; cat: string }> = ko ? [
    { cat: "공고", label: "알바몬", desc: "단기·파트타임 1순위 · 소상공인 무료 공고", href: "https://www.albamon.com" },
    { cat: "공고", label: "알바천국", desc: "음식점·카페 표준 · 네이버 검색 연동", href: "https://www.alba.co.kr" },
    { cat: "공고", label: "당근 동네알바", desc: "지역 주민 즉시 매칭 · 무료", href: "https://www.daangn.com" },
    { cat: "공고", label: "사람인", desc: "정직원·경력직 채용 · 이력서 기반", href: "https://www.saramin.co.kr" },
    { cat: "공고", label: "잡코리아", desc: "정직원 채용 + 경력 매칭", href: "https://www.jobkorea.co.kr" },
    { cat: "계약서", label: "고용노동부 표준계약서", desc: "공식 근로계약서 무료 다운로드", href: "https://www.moel.go.kr/policy/policydata/list.do" },
    { cat: "계약서", label: "최저임금위원회", desc: "2026년 최저임금 10,030원 · 모의 계산기", href: "https://www.minimumwage.go.kr" },
    { cat: "계약서", label: "노동OK", desc: "노동부 공식 무료 노무 상담 포털", href: "https://www.nodongok.com" },
    { cat: "보험·세금", label: "4대보험 정보연계센터", desc: "국민연금·건강·고용·산재 통합 신고", href: "https://www.4insure.or.kr" },
    { cat: "보험·세금", label: "홈택스", desc: "원천세 신고·납부, 사업자 등록 확인", href: "https://www.hometax.go.kr" },
    { cat: "보험·세금", label: "국민건강보험공단", desc: "직원 보험료 조회·납부", href: "https://www.nhis.or.kr" },
    { cat: "보험·세금", label: "근로복지공단", desc: "산재·고용보험 가입·신고", href: "https://www.kcomwel.or.kr" },
  ] : [
    { cat: "Posting", label: "Albamon", desc: "PT specialist · free for small biz", href: "https://www.albamon.com" },
    { cat: "Posting", label: "Albachunguk", desc: "F&B/Cafe standard · Naver-linked", href: "https://www.alba.co.kr" },
    { cat: "Posting", label: "Karrot Local Jobs", desc: "Instant local match · free", href: "https://www.daangn.com" },
    { cat: "Posting", label: "Saramin", desc: "FT hires · resume-based", href: "https://www.saramin.co.kr" },
    { cat: "Posting", label: "JobKorea", desc: "FT hires + experienced talent", href: "https://www.jobkorea.co.kr" },
    { cat: "Contract", label: "MOEL Standard Contract", desc: "Official template free", href: "https://www.moel.go.kr/policy/policydata/list.do" },
    { cat: "Contract", label: "Minimum Wage Commission", desc: "2026 KRW 10,030/h · simulator", href: "https://www.minimumwage.go.kr" },
    { cat: "Contract", label: "NodongOK", desc: "Free labor consulting", href: "https://www.nodongok.com" },
    { cat: "Insurance/Tax", label: "Social Insurance Portal", desc: "All 4 insurances at once", href: "https://www.4insure.or.kr" },
    { cat: "Insurance/Tax", label: "Hometax", desc: "Withholding tax filing", href: "https://www.hometax.go.kr" },
    { cat: "Insurance/Tax", label: "NHIS", desc: "Employee premium lookup", href: "https://www.nhis.or.kr" },
    { cat: "Insurance/Tax", label: "KCOMWEL", desc: "Workers comp / employment insurance", href: "https://www.kcomwel.or.kr" },
  ];

  return (
    <>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko
            ? "첫 직원 채용 60분 — 근로계약서 + 4대보험 + 원천세 3축 점검"
            : "60 min for first hire — contract + 4-insurance + payroll tax",
          detail: ko
            ? "공고 → 면접 → 계약서 2부 + 1부 교부 → 14일 이내 4대보험 통합 신고 → 매월 원천세. 빠뜨리면 과태료 + 임금 체불 신고 + 세무조사 리스크."
            : "Post → Interview → 2-copy contract → 4-insurance within 14d → Monthly tax. Skip = fines + wage-theft claim + audit.",
        }}
        pillars={[
          { icon: <Users size={12} strokeWidth={1.5} />, label: ko ? "공고" : "Posting", meta: ko ? "알바몬·당근·사람인" : "Albamon · Karrot" },
          { icon: <FileSignature size={12} strokeWidth={1.5} />, label: ko ? "계약" : "Contract", meta: ko ? "2부 + 1부 교부" : "2 copies, give 1" },
          { icon: <ShieldCheck size={12} strokeWidth={1.5} />, label: ko ? "보험·세금" : "Insurance/Tax", meta: ko ? "14일 + 월 10일" : "D+14, then 10th" },
        ]}
      />

      {/* ── 내 채용 계획 입력 — 재무 검토 단계의 인건비 산식이 여기서 가져감 ── */}
      <MyHiringPlanCard ko={ko} />

      <StageTabNav
        ko={ko}
        pageIndex={pageIdx}
        pageLabels={pageLabels}
        onPrev={() => setPageIdx(p => Math.max(0, p - 1))}
        onNext={() => setPageIdx(p => Math.min(pageLabels.length - 1, p + 1))}
        onJump={setPageIdx}
      />

      {/* ── 페이지 0: 단계 개요 ───────────────────────────────────────── */}
      {pageIdx === 0 && (
        <StageOverview
          ko={ko}
          headline={ko
            ? "첫 직원 채용 60분이 인건비 리스크 1년치를 결정합니다"
            : "60 min for first hire decides a year of labor risk"}
          why={ko
            ? "근로계약서 미교부·4대보험 미신고·원천세 누락 — 셋 다 노동청 신고 + 세무조사 사유. 사인 전·신고 전에 모든 항목을 표준에 맞춰야 분쟁·과태료를 막습니다. 알바 1명도 정직원과 동일한 법적 절차 적용."
            : "Missing contract / unfiled insurance / withheld tax — each is grounds for labor complaint + audit. Lock everything to standard before signing/filing. Same legal stack applies to a single PT hire."}
          stat={{
            value: ko ? "₩1,500만" : "₩15M",
            label: ko ? "위반 1건당 평균 과태료·체불 합계" : "avg fine + back-pay per violation",
          }}
          workOutline={[
            { stepLabel: ko ? "1. 공고" : "1. Posting", title: ko ? "알바몬·당근에 구체 공고 등록 (시급·시간·식사)" : "Post on Albamon/Karrot", time: ko ? "30분" : "30m" },
            { stepLabel: ko ? "2. 계약서" : "2. Contract", title: ko ? "표준 근로계약서 2부 + 1부 교부 (필수 4항목)" : "Standard contract, 2 copies", time: ko ? "20분" : "20m" },
            { stepLabel: ko ? "3. 보험·세금" : "3. Insurance/Tax", title: ko ? "14일 이내 4대보험 통합 신고 + 매월 원천세" : "4-insurance D+14 + monthly tax", time: ko ? "30분" : "30m" },
            { stepLabel: ko ? "4. 첫 달" : "4. Month 1", title: ko ? "주휴수당·연장수당 정확히 + 급여명세서 교부" : "Holiday/OT pay + payslip", time: ko ? "월 30분" : "30m/mo" },
            { stepLabel: ko ? "체크리스트" : "Checklist", title: ko ? "공식 사이트 바로가기 + 자주 빠뜨리는 항목 점검" : "Official sites + common-miss check" },
          ]}
          outcome={ko
            ? "근로계약서·4대보험·원천세 3축이 법적 표준에 맞춰 셋업됩니다. 노동청 분쟁·세무조사·임금 체불 리스크가 사라진 상태로 다음 단계 (운영·마케팅 준비) 진입."
            : "Contract / insurance / tax — all 3 locked to legal standard. Move to next stage (ops/marketing) without labor or audit risk."}
          nextStage={ko ? "운영·마케팅 준비 (operations-setup)" : "Operations & Marketing"}
        />
      )}

      {/* ── 페이지 1: 채용 공고 ──────────────────────────────────────── */}
      {pageIdx === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <WorkStep
            ko={ko}
            stepLabel={ko ? "1. 채용 공고" : "1. Job posting"}
            time={ko ? "30분" : "30m"}
            headline={ko ? "오픈 1~2주 전 공고 — 시급·시간·요일·식사 구체적으로 명시" : "Post 1-2 weeks pre-open — specify wage/hours/days/meals"}
            why={ko
              ? "공고에 「최저시급」 만 쓰면 지원자 0명. 「시급 10,500원, 평일 11-17시, 식사 제공」 처럼 구체적으로 쓰면 지원률 3배 ↑. 오픈 직전 채용은 교육·적응 시간 부족으로 실수 폭발."
              : "Vague listings get zero. Specific wage/hours/meals tripple response. Last-minute hires lack training time."}
            how={[
              { title: ko ? "알바몬 (단기·PT 1순위) — 24시간 내 지원자 다수" : "Albamon — top PT board, applicants in 24h", detail: ko ? "albamon.com → 무료 공고 등록 → 시급·시간·요일·식사 4항목 구체화. 음식점·카페 표준 채널." : "Free posting · specify 4 fields. Standard for F&B." },
              { title: ko ? "알바천국 (음식점·카페 표준) — 네이버 검색 연동" : "Albachunguk — F&B standard · Naver-linked", detail: ko ? "alba.co.kr → 등록. 네이버 「○○ 알바」 검색 시 노출 → 가까운 거주자 매칭." : "alba.co.kr → posted listings show up in Naver search." },
              { title: ko ? "당근 동네알바 — 무료 + 출퇴근 거리 짧은 알바" : "Karrot Local Jobs — free + short commute", detail: ko ? "daangn.com → 동네 인증 → 「알바」 채널 등록. 인근 거주자 직접 매칭." : "daangn.com → neighborhood verify → post in 'jobs'. Best for proximity." },
              { title: ko ? "정직원·경력직은 사람인·잡코리아" : "Saramin / JobKorea for FT/experienced", detail: ko ? "이력서 기반. 면허·경력 매칭이 매출 직결인 직군 (디자이너·강사·기술자) 에 적합." : "Resume-based. Best for license/experience-driven roles." },
            ]}
            watchouts={ko ? [
              { label: "공고에 「최저시급」 만 쓰면 지원자 없음", text: "시급·근무 시간·요일·식사 제공 여부를 구체적으로 써야 지원률 3배 ↑. 「쉬운 일」 같은 모호한 표현 금지." },
              { label: "오픈 직전 채용은 위험", text: "교육·적응 기간 없이 오픈 당일 투입 = 실수 폭발. 최소 1~2주 전 채용 필수." },
              { label: "면접에서 「최저시급보다 적게」 협상 시 위법", text: "2026 최저시급 10,030원. 어떤 형태로도 미달 시 임금 체불 신고 대상." },
            ] : [
              { label: "Vague listings = no applicants", text: "Specify rate/hours/days/meals — response triples." },
              { label: "Last-minute hire is risky", text: "No training time = day-1 mistakes. Hire 1-2 weeks early." },
              { label: "Below-minimum-wage is illegal", text: "2026 KRW 10,030/h. Below = wage-theft claim." },
            ]}
            favorable={myFavorable}
          />
          <InlineLinks title={ko ? "공고 플랫폼 — 클릭하면 바로 이동" : "Posting platforms — tap to open"} links={postingLinks} />
        </div>
      )}

      {/* ── 페이지 2: 근로계약서 + 채용 비용 계산기 ─────────────────── */}
      {pageIdx === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <WorkStep
            ko={ko}
            stepLabel={ko ? "2. 근로계약서" : "2. Employment contract"}
            time={ko ? "20분" : "20m"}
            headline={ko ? "계약서 2부 작성 → 1부 반드시 직원 교부 (필수 4항목)" : "2 copies — give 1 to employee · 4 mandatory fields"}
            why={ko
              ? "계약서 미교부는 500만원 이하 과태료 + 임금 체불 신고 사유. 구두 약속은 분쟁 시 100% 사장님 불리. 표준 양식 사용이 가장 안전."
              : "Failure to provide = up to KRW 5M fine + wage-theft claim. Verbal-only loses 100% in dispute. Standard form is safest."}
            how={[
              { title: ko ? "고용노동부 표준 근로계약서 다운 (무료)" : "Download MOEL standard contract (free)", detail: ko ? "moel.go.kr → 「근로계약서」 검색 → 표준 양식 PDF. 임시·기간제·정규직 양식 분리." : "moel.go.kr → search 'employment contract' → standard PDF. Separate for PT/FT." },
              { title: ko ? "필수 4항목 명시 — 임금·시간·휴게·계약기간" : "4 mandatory fields — wage/hours/break/term", detail: ko ? "① 임금 (시급/월급, 지급일, 지급방법) ② 근무 시간·요일 + 휴게 (4h↑ 30분 / 8h↑ 1시간) ③ 업무·근무지 ④ 계약기간 (기간제 vs 무기)." : "① Wage rate, payday, method ② Hours/days + breaks (30m at 4h+, 1h at 8h+) ③ Job/place ④ Term." },
              { title: ko ? "2026 최저시급 10,030원 기준 수치 검증" : "Verify against 2026 min wage 10,030 KRW/h", detail: ko ? "월 209시간(주 40h × 4.35주) × 10,030원 = 2,096,270원. 주휴수당 별도. minimumwage.go.kr 모의 계산기로 확인." : "209h × KRW 10,030 = 2,096,270/mo. Holiday pay separate. Use simulator at minimumwage.go.kr." },
              { title: ko ? "2부 인쇄 → 양측 서명 → 1부 직원 교부" : "Print 2, sign both, give 1 to employee", detail: ko ? "교부 영수증 받아두면 분쟁 시 증거. 메일로 PDF 전송도 합법 (수신 확인 보존)." : "Get receipt — evidence in dispute. PDF email also legal (keep receipt)." },
            ]}
            watchouts={ko ? [
              { label: "계약서 미교부 시 500만원 이하 과태료", text: "「나중에 줄게」 = 즉시 신고 사유. 사인 후 그 자리에서 1부 교부 필수." },
              { label: "수습 90% 감액은 조건 엄격", text: "1년 이상 계약 + 수습 3개월 이내만. 단순 노무직 (배달·청소·서빙) 은 적용 X. 잘못 적용 시 차액 소급 + 과태료." },
              { label: "주휴수당 모르면 임금 체불", text: "주 15시간↑ 개근 시 1일치(시급 × 8시간) 추가. 계약서에 「주휴수당 포함/별도」 명시 필수." },
            ] : [
              { label: "Non-issuance = fine up to KRW 5M", text: "'Later' = immediate complaint. Issue 1 copy on-the-spot." },
              { label: "Probation 90% rules are strict", text: "1y+ contract & first 3m only. Excludes manual labor. Mistakes = back-pay + fines." },
              { label: "Skipping holiday pay = wage theft", text: "15h+/week earns 1-day pay (rate × 8h). State 'incl./excl.' explicitly in contract." },
            ]}
            favorable={myFavorable}
          />

          {/* ── 채용 비용 계산기 — 시급·시간 결정 직후 사업주 부담 시뮬 ── */}
          <div style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid rgba(25,25,112,0.08)",
            boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
            padding: "20px 22px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{
                width: 22, height: 22, borderRadius: 7,
                background: "rgba(25,25,112,0.08)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: MIDNIGHT,
              }}>
                <Calculator size={13} strokeWidth={1.6} />
              </span>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                {ko ? "실제 사업주 부담 — 시뮬레이션" : "Real employer cost — simulator"}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.6, marginBottom: 14 }}>
              {ko
                ? "시급·근무시간을 입력하면 시급 외에 4대보험·퇴직금까지 포함한 「실제 월 부담」 이 자동 계산됩니다. 계약서 사인 전 정확한 인건비 인지가 첫 달 자금 계획의 핵심입니다."
                : "Enter wage/hours to see total monthly cost incl. 4-insurance and severance. Know real labor cost before signing — critical for month-1 cash plan."}
            </div>
            <HiringCostCalculator ko={ko} industryCategoryId={industryCategoryId} />
          </div>
          <InlineLinks title={ko ? "계약서·임금 공식 사이트 — 클릭하면 바로 이동" : "Contract & wage official sites — tap to open"} links={contractLinks} />
        </div>
      )}

      {/* ── 페이지 3: 4대보험 + 원천세 ───────────────────────────────── */}
      {pageIdx === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <WorkStep
            ko={ko}
            stepLabel={ko ? "3. 4대보험 + 원천세" : "3. Insurance + payroll tax"}
            time={ko ? "30분" : "30m"}
            headline={ko ? "채용 14일 이내 4insure.or.kr 통합 신고 + 매월 10일 원천세" : "File at 4insure.or.kr within D+14 + payroll tax by 10th of each month"}
            why={ko
              ? "5인 미만 사업장도 4대보험 의무. 1인 고용부터 의무. 미신고는 소급 납부 + 가산세. 원천세 누락은 세무조사 사유. 한 번에 셋업하면 매월 자동."
              : "Mandatory from first hire (no 5-person threshold). Skipping = back-pay + penalties + audit risk. Set once, automate monthly."}
            how={[
              { title: ko ? "4insure.or.kr 통합 신고 (D+14 이내)" : "4insure.or.kr unified filing (within D+14)", detail: ko ? "국민연금·건강·고용·산재 한 사이트. 사업자등록증·근로계약서·통장사본 PDF 업로드. 평균 30분." : "All 4 insurances one site. Upload biz reg/contract/passbook. ~30 minutes." },
              { title: ko ? "사업주 부담 월 약 19만원 (월급 209만원 기준)" : "Employer share ~190K/mo (base 2.09M)", detail: ko ? "국민연금 9.4만 (사업주 50%) + 건강 7.5만 (50%) + 고용 1.9만 (50%) + 산재 (사업주 100%). 자동이체 신청 권장." : "Pension 94K + Health 75K + Empl 19K (50/50) + Workers Comp (100% employer). Use auto-debit." },
              { title: ko ? "홈택스에서 매월 원천세 신고·납부 (다음달 10일까지)" : "Hometax monthly payroll tax (by 10th of next month)", detail: ko ? "hometax.go.kr → 「원천세」 메뉴 → 간이세액표 자동 계산 → 신고 → 자동이체. 누락 시 가산세 10%↑." : "hometax.go.kr → 'Withholding' → auto-calc by table → file → auto-debit. Late = 10%+ penalty." },
              { title: ko ? "연말정산 — 다음 해 2월 사업주 의무" : "Year-end settlement — Feb (employer duty)", detail: ko ? "직원 1명도 의무. 세무사 위임 가능 (월 5~15만원). 직접 처리 시 홈택스 자동 정산 메뉴 사용." : "Even with 1 employee. Outsource to CPA (50-150K/mo) or use Hometax auto-settle." },
            ]}
            watchouts={ko ? [
              { label: "1인 고용도 4대보험 의무", text: "5인 미만이라도 의무. 위반 시 소급 납부 + 가산세 + 노동청 신고 위험. 채용 즉시 신고가 안전." },
              { label: "현금 급여 + 미신고 = 세무조사", text: "국세청 PCI 분석 (카드 매출 vs 신고 인건비) 으로 자동 추적. 미신고 시 추징 + 과태료 폭증." },
              { label: "산재보험은 사업주 100% 부담 (별도 계산)", text: "나머지 3종은 50:50 분담. 산재만 전액 사업주 — 업종별 요율 0.7~5.6% 다름. 음식점 약 1%." },
            ] : [
              { label: "1 employee = mandatory", text: "No 5-person exemption. Late = back-pay + penalty + complaint risk." },
              { label: "Cash + unreported = audit", text: "PCI tracks card revenue vs reported labor. Heavy back-pay + penalties." },
              { label: "Workers comp = 100% employer", text: "Other 3 split 50:50. Rate varies 0.7-5.6% by industry. F&B ~1%." },
            ]}
            favorable={myFavorable}
          />
          <InlineLinks title={ko ? "보험·세금 공식 사이트 — 클릭하면 바로 이동" : "Insurance & tax official sites — tap to open"} links={insuranceLinks} />
        </div>
      )}

      {/* ── 페이지 4: 첫 달 운영 ─────────────────────────────────────── */}
      {pageIdx === 4 && (
        <WorkStep
          ko={ko}
          stepLabel={ko ? "4. 첫 달 운영" : "4. Month 1 operations"}
          time={ko ? "월 30분" : "30m/mo"}
          headline={ko ? "주휴수당·연장수당 정확히 계산 + 급여명세서 의무 교부" : "Calc holiday/OT pay correctly + issue payslip (mandatory)"}
          why={ko
            ? "급여명세서 미교부는 2021년부터 과태료 대상 (500만원 이하). 주휴수당·연장수당 계산 실수가 가장 흔한 임금 체불 신고 사유. 세무사·급여 SaaS 사용 시 자동."
            : "Payslip non-issuance is fineable (up to KRW 5M, since 2021). Holiday/OT miscalc is the #1 wage-theft claim. CPA or payroll SaaS automates."}
          how={[
            { title: ko ? "주휴수당 — 주 15h↑ 개근 시 시급 × 8h 추가" : "Weekly holiday — rate × 8h for 15h+/wk perfect attendance", detail: ko ? "예: 시급 10,030원, 주 30시간 근무 → 30 × 10,030 + (10,030 × 8) = 380,140원. 결근 1일이라도 주휴수당 X." : "e.g., 30h/wk × 10,030 + 8h × 10,030 = 380,140 KRW/wk. Any absence = no holiday pay that week." },
            { title: ko ? "연장수당 — 주 40h 또는 1일 8h 초과 시 1.5배" : "OT — 1.5× over 40h/wk or 8h/day", detail: ko ? "5인 이상 사업장만 의무. 5인 미만은 일반 임금. 야간(22~06시)·휴일 연장은 추가 가산 검토." : "Mandatory at 5+ employees. Under 5 = regular rate. Night (22-06) / holiday OT additional." },
            { title: ko ? "급여명세서 의무 교부 — PDF 또는 종이" : "Payslip — PDF or paper (mandatory)", detail: ko ? "임금·근무시간·공제 내역·실수령액 명시. 카카오톡 전송도 합법 (수신 확인). 미교부 500만원 이하 과태료." : "Wage / hours / deductions / net. KakaoTalk delivery legal (with read receipt). Up to KRW 5M fine if missing." },
            { title: ko ? "급여 자동화 — 세무사 또는 급여 SaaS" : "Automate — CPA or payroll SaaS", detail: ko ? "세무사: 월 5~15만원 (4대보험·원천세·연말정산 포함). SaaS: 자비스·페이워크·로보스 (월 1~5만원). 직원 3명↑면 자동화 권장." : "CPA: 50-150K/mo (incl. all filings). SaaS: Jarvis / Paywork / Robos (10-50K/mo). 3+ employees → automate." },
          ]}
          watchouts={ko ? [
            { label: "급여명세서 미교부 = 500만원 이하 과태료", text: "2021.11 시행. 카톡·이메일 전송도 합법 — 단, 수신 확인 보존 필수. 매달 빠뜨리지 말고 자동 발송 셋업." },
            { label: "주휴수당 「포함된 시급」 협상은 불법", text: "「시급에 주휴수당 포함」 같은 조항은 무효. 시급은 시급, 주휴는 주휴 별도 표기 필수. 위반 시 차액 + 가산금." },
            { label: "5인 미만이라도 야간·휴일 근무는 가산 권장", text: "5인 미만은 법적 가산 의무 X 이지만, 야간(22-06시)·일요일 근무는 1.5배 가산 합의가 노동 분쟁 예방." },
          ] : [
            { label: "Missing payslip = fine up to KRW 5M", text: "Since Nov 2021. KakaoTalk/email legal but keep read receipt. Automate monthly." },
            { label: "'Holiday pay included in rate' = void", text: "Show rate and holiday pay separately. Bundling = back-pay + interest." },
            { label: "Add OT premium even under 5 employees", text: "Not legally mandatory but voluntary 1.5× for night/Sun prevents disputes." },
          ]}
          favorable={myFavorable}
        />
      )}

      {/* ── 페이지 5: 마무리 — 한 일 + 다음 단계 전 주의 ──────────── */}
      {pageIdx === 5 && (
        <div style={{
          background: "white",
          borderRadius: 16,
          border: "1px solid rgba(25,25,112,0.08)",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7,
              letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 4,
            }}>
              {ko ? "마무리" : "Wrap-up"}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.4 }}>
              {ko ? "이 단계에서 한 일 + 다음 단계 전 반드시 확인" : "What you did + must-verify before next stage"}
            </div>
          </div>

          {/* 이 단계에서 한 일 */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: MIDNIGHT, opacity: 0.7,
              letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10,
            }}>
              {ko ? "이 단계에서 한 일" : "What you did"}
            </div>
            <ol style={{
              margin: 0, padding: 0, listStyle: "none",
              border: "1px solid rgba(25,25,112,0.10)", borderRadius: 12, overflow: "hidden",
            }}>
              {(ko ? [
                { label: "1. 채용 공고 등록", detail: "알바몬·알바천국·당근·사람인 — 시급·시간·요일·식사 4항목 구체화" },
                { label: "2. 근로계약서 작성·교부", detail: "표준 양식 2부 + 1부 직원 교부 + 4항목(임금·시간·휴게·기간) 명시 + 채용 비용 시뮬" },
                { label: "3. 4대보험 + 원천세 셋업", detail: "4insure.or.kr 통합 신고(D+14) + 홈택스 매월 10일 원천세 + 자동이체" },
                { label: "4. 첫 달 운영 표준 셋업", detail: "주휴수당·연장수당 정확 계산 + 급여명세서 자동 발송 + (선택) CPA·SaaS 자동화" },
              ] : [
                { label: "1. Posted jobs", detail: "Albamon/Albachunguk/Karrot/Saramin — wage/hours/days/meals" },
                { label: "2. Contract signed & delivered", detail: "Standard form, 2 copies + 1 to employee, 4 fields, cost sim" },
                { label: "3. 4-insurance + payroll tax", detail: "4insure.or.kr (D+14) + Hometax monthly 10th + auto-debit" },
                { label: "4. Month-1 ops standard", detail: "Holiday/OT calc + auto payslip + optional CPA/SaaS" },
              ]).map((item, i) => (
                <li key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "12px 14px",
                  borderTop: i === 0 ? "none" : "0.5px solid rgba(25,25,112,0.10)",
                  background: "rgba(25,25,112,0.025)",
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 7,
                    background: MIDNIGHT, color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.55, marginTop: 3 }}>
                      {item.detail}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* 다음 단계 진입 전 반드시 확인 */}
          <div style={{
            padding: "14px 16px", borderRadius: 12,
            background: "rgba(220,38,38,0.04)",
            border: "1px solid rgba(220,38,38,0.14)",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#dc2626",
              letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8,
            }}>
              {ko ? "다음 단계(운영·마케팅 준비) 전 반드시 확인" : "Verify before ops/marketing"}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {(ko ? [
                "근로계약서 1부 직원 교부 영수증·수신 확인 — 미교부 500만원 이하 과태료",
                "주휴수당 「포함된 시급」 X — 시급·주휴수당 별도 표기 (위반 시 차액·가산금)",
                "4대보험 채용 14일 이내 신고 완료 — 5인 미만도 의무, 1인 고용부터 적용",
                "원천세 매월 10일까지 홈택스 자동 납부 셋업 — 누락 시 가산세 10%↑",
                "급여명세서 카톡·메일 자동 발송 셋업 — 2021.11~ 미교부 500만원 이하 과태료",
                "산재보험 사업주 100% 부담 별도 계산 — 업종별 요율 0.7~5.6%",
              ] : [
                "Confirm contract copy delivery receipt — fine up to KRW 5M if missing",
                "Show wage and holiday pay separately — 'bundled' = back-pay + interest",
                "4-insurance filed within 14 days — mandatory from 1 employee",
                "Payroll tax auto-debit by 10th monthly — late = 10%+ penalty",
                "Auto payslip via KakaoTalk/email — fineable since Nov 2021",
                "Workers comp 100% employer separate — rate 0.7-5.6% by industry",
              ]).map((item, i) => (
                <li key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, marginTop: 7, width: 5, height: 5, borderRadius: "50%", background: "#dc2626" }} />
                  <span style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.6, fontWeight: 500 }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 다음 단계 안내 */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "13px 15px", borderRadius: 12,
            background: "linear-gradient(180deg, rgba(5,150,105,0.05) 0%, rgba(5,150,105,0.02) 100%)",
            border: "1px solid rgba(5,150,105,0.16)",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: "rgba(5,150,105,0.12)", color: "#059669",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Check size={14} strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 2 }}>
                {ko ? "이 단계가 끝나면" : "When done"}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.005em", lineHeight: 1.4 }}>
                {ko
                  ? "근로계약·4대보험·원천세 3축 셋업 완료 → 운영·마케팅 준비 진입"
                  : "Contract / insurance / tax 3-axis locked → enter ops & marketing"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
