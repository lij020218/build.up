"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import {
  ChevronRight, AlertTriangle, Clock, FileText, Banknote,
  ShieldCheck, ClipboardList, Building2, ExternalLink,
  type LucideIcon,
} from "lucide-react";

const MIDNIGHT = "#191970"; // 서비스 메인 포인트 컬러

export function HiringSetupStage() {
  const d = useDashboardCtx();
  const { language, guideStepIndex, setGuideStepIndex } = d;
  const ko = language === "ko";
  const totalSlides = 4;
  const isOverview = guideStepIndex === 0;

  // ─────────────────────────────────────────────────────────────
  // 데이터 구조: 각 step 마다
  //   · keyAction: "이 단계에서 꼭 할 일" — 가장 중요한 단 1가지 액션 (히어로 카드)
  //   · sections:  세부 항목 (3~5개로 압축)
  //   · traps:     실수 패턴 (빨강 경고)
  //   · links:     공식 사이트
  // ─────────────────────────────────────────────────────────────
  // HItem: href + brandIcon + brandColor 가 있으면 클릭 가능한 외부 링크 행으로 렌더링됨
  type HItem = {
    icon: LucideIcon;
    text: string;
    sub?: string;
    href?: string;
    brandIcon?: string;
    brandColor?: string;
  };
  type HSec = { label: string; items: HItem[] };
  type HTrap = { label: string; text: string };
  type HLink = { text: string; href: string; icon?: string; color?: string; desc?: string };
  type HKey = { title: string; detail: string };
  type HStep = { headline: string; keyAction: HKey; sections: HSec[]; traps: HTrap[]; links: HLink[] };

  const steps: HStep[] = [
    {
      headline: ko ? "채용 계획 & 공고" : "Staffing plan & job posting",
      keyAction: ko
        ? { title: "오픈 1~2주 전, 알바몬·알바천국에 공고 등록", detail: "시급·근무 시간·요일·식사 제공 여부를 구체적으로 써야 지원률이 3배 이상 높아집니다." }
        : { title: "Post on Albamon/Albachunguk 1-2 weeks before opening", detail: "Specify wage, hours, days, meals — clear listings get 3× more applicants." },
      sections: [
        { label: ko ? "인력 필요 여부 판단" : "Assess staffing needs", items: ko ? [
          { icon: Clock, text: "혼자 가능한 업무량인지 먼저 계산", sub: "피크 타임(점심·저녁) 손님 수 × 처리 시간으로 인원 추정" },
          { icon: ClipboardList, text: "알바 vs 정직원 기준", sub: "주 15시간 미만 → 단기 알바 / 15시간 이상 → 주휴수당 발생 / 40시간 → 정직원" },
          { icon: ShieldCheck, text: "초기 권장: 1~2명 알바로 시작", sub: "오픈 초기 매출 예측 불확실 — 파트타임으로 유연하게" },
        ] : [
          { icon: Clock, text: "Calculate your own capacity first", sub: "Peak-time customers × processing time = estimated headcount" },
          { icon: ClipboardList, text: "Part-time vs full-time criteria", sub: "<15h → short-term / 15h+ → weekly holiday pay / 40h → full-time" },
          { icon: ShieldCheck, text: "Start with 1-2 part-timers", sub: "Stay flexible while revenue is unpredictable" },
        ]},
        { label: ko ? "채용 공고 플랫폼 — 클릭하면 바로 이동" : "Where to post — tap to open", items: ko ? [
          { icon: Building2, text: "알바몬", sub: "단기·파트타임 전문, 소상공인 무료 공고 · 24시간 내 지원자 다수",
            href: "https://www.albamon.com", brandIcon: "알", brandColor: MIDNIGHT },
          { icon: Building2, text: "알바천국", sub: "소규모 매장 최다 이용 · 음식점·카페 등록 多 · 네이버 검색 연동",
            href: "https://www.alba.co.kr", brandIcon: "천", brandColor: MIDNIGHT },
          { icon: Building2, text: "당근 동네알바", sub: "지역 주민 즉시 매칭 · 무료 · 출퇴근 거리 짧은 알바 선호 시 유리",
            href: "https://www.daangn.com", brandIcon: "당", brandColor: MIDNIGHT },
          { icon: Building2, text: "사람인", sub: "정직원 채용용 · 이력서 기반 · 경력직·장기 고용에 적합",
            href: "https://www.saramin.co.kr", brandIcon: "사", brandColor: MIDNIGHT },
        ] : [
          { icon: Building2, text: "Albamon", sub: "Part-time specialist, free for small owners · applicants within 24h",
            href: "https://www.albamon.com", brandIcon: "A", brandColor: MIDNIGHT },
          { icon: Building2, text: "Albachunguk", sub: "Most used by small stores · popular for restaurants & cafes",
            href: "https://www.alba.co.kr", brandIcon: "C", brandColor: MIDNIGHT },
          { icon: Building2, text: "Karrot Local Jobs", sub: "Instant local match, free · best for short-commute hires",
            href: "https://www.daangn.com", brandIcon: "K", brandColor: MIDNIGHT },
          { icon: Building2, text: "Saramin", sub: "Best for full-time hiring · resume-based · experienced talent",
            href: "https://www.saramin.co.kr", brandIcon: "S", brandColor: MIDNIGHT },
        ]},
      ],
      traps: ko ? [
        { label: "공고에 '최저시급' 만 쓰면 지원자 없음", text: "시급·근무 시간·요일·식사 제공 여부를 구체적으로 써야 지원률 3배 ↑" },
        { label: "오픈 직전 채용은 위험", text: "교육·적응 기간 없이 오픈 당일 투입 = 실수 폭발. 최소 1~2주 전 채용 필수." },
      ] : [
        { label: "Vague wage listings kill applicants", text: "Specify rate, schedule, days, meals — response rates triple." },
        { label: "Last-minute hiring before opening is risky", text: "Hire at least 1-2 weeks early for training." },
      ],
      // ─ 상단 "채용 공고 플랫폼" 섹션과 동일하므로 하단 별도 링크 섹션 제거 ─
      links: [],
    },
    {
      headline: ko ? "근로계약서 & 시급 책정" : "Employment contract & wages",
      keyAction: ko
        ? { title: "근로계약서 2부 작성 → 1부 반드시 직원에게 교부", detail: "미교부 시 500만원 이하 과태료. 시급·근무시간·휴게시간·계약기간 4가지는 반드시 명시." }
        : { title: "Draft 2 copies of the contract — give 1 to the employee", detail: "Failing to provide = up to 5M KRW fine. Must specify: wage, hours, breaks, term." },
      sections: [
        { label: ko ? "근로계약서 필수 기재 항목" : "Mandatory contract items", items: ko ? [
          { icon: Banknote, text: "임금 — 시급/월급, 지급일, 지급 방법", sub: "구두 약속 금지 / 미명시 시 법적 분쟁 위험" },
          { icon: Clock, text: "근무 시간·요일 + 휴게 시간", sub: "4시간 이상 → 30분 휴게 의무 / 8시간 이상 → 1시간" },
          { icon: FileText, text: "업무·근무지·계약 기간", sub: "기간제 vs 무기 — 무기 계약은 해고 절차 더 엄격" },
          { icon: ClipboardList, text: "계약서 2부 → 1부 직원에게 교부", sub: "미교부 시 500만원 이하 과태료" },
        ] : [
          { icon: Banknote, text: "Wages — rate, payday, method", sub: "No verbal-only / unspecified payday = legal risk" },
          { icon: Clock, text: "Work hours + break time", sub: "4h+ → 30min / 8h+ → 1hr break required" },
          { icon: FileText, text: "Job, workplace, contract term", sub: "Fixed vs indefinite — indefinite has stricter dismissal rules" },
          { icon: ClipboardList, text: "2 copies — give 1 to employee", sub: "Otherwise fine up to 5M KRW" },
        ]},
        { label: ko ? "2026년 시급 기준" : "2026 wage reference", items: ko ? [
          { icon: Banknote, text: "최저시급 10,030원 (2026)", sub: "주 40시간 × 4.35주 = 월 209시간 → 월 209만원 이상" },
          { icon: Clock, text: "수습 90% 감액 — 조건 엄격", sub: "1년 이상 계약 + 수습 3개월 이내만 / 단순 노무직 제외" },
          { icon: ShieldCheck, text: "주휴수당: 주 15시간↑ 개근 시 1일치 추가", sub: "예: 10,030원 × 8h = 80,240원 / 포함 여부 계약서 명시" },
        ] : [
          { icon: Banknote, text: "Min wage: 10,030 KRW/h (2026)", sub: "40h × 4.35w = 209h → ≥2,096,270 KRW/mo" },
          { icon: Clock, text: "Probation 90% only if strict", sub: "1y+ contract & first 3 months / excludes manual labor" },
          { icon: ShieldCheck, text: "Weekly holiday pay for 15h+/wk", sub: "10,030 × 8h = 80,240 / clarify in contract" },
        ]},
      ],
      traps: ko ? [
        { label: "수습 10% 깎기, 무조건 합법 아님", text: "1년 미만 계약·단순 반복 업무는 적용 불가. 잘못하면 차액 소급 + 과태료." },
        { label: "주휴수당 모르면 임금 체불", text: "주 15시간 이상 알바에게 미지급 시 노동청 신고 대상." },
      ] : [
        { label: "Probation cut isn't always legal", text: "Only 1y+ contracts, not manual labor. Wrong = back-pay + fine." },
        { label: "Skipping weekly holiday pay = wage theft", text: "Required for 15h+/week workers." },
      ],
      links: ko ? [
        { text: "고용노동부 표준계약서", href: "https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20201200455", icon: "고", color: MIDNIGHT, desc: "공식 근로계약서 무료 다운로드" },
        { text: "최저임금위원회", href: "https://www.minimumwage.go.kr", icon: "최", color: MIDNIGHT, desc: "2026년 최저임금 10,030원 · 모의 계산기" },
        { text: "노동OK", href: "https://www.nodongok.com", icon: "노", color: MIDNIGHT, desc: "노동부 공식 무료 노무 상담 포털" },
      ] : [
        { text: "MOL Standard Contract", href: "https://www.moel.go.kr", icon: "고", color: MIDNIGHT, desc: "Official template, free download" },
        { text: "Minimum Wage Commission", href: "https://www.minimumwage.go.kr", icon: "최", color: MIDNIGHT, desc: "2026 minimum 10,030 KRW · simulator" },
        { text: "NodongOK", href: "https://www.nodongok.com", icon: "노", color: MIDNIGHT, desc: "Official free labor consulting portal" },
      ],
    },
    {
      headline: ko ? "4대보험 & 원천세" : "Social insurance & payroll tax",
      keyAction: ko
        ? { title: "채용 14일 이내 4insure.or.kr 에서 4대보험 통합 신고", detail: "한 사이트에서 국민연금·건강·고용·산재 한 번에 신고. 늦으면 소급 납부 + 가산세." }
        : { title: "File all 4 social insurances within 14 days at 4insure.or.kr", detail: "One site for pension, health, employment, workers comp. Late = back-payment + penalties." },
      sections: [
        { label: ko ? "4대보험 신고 절차" : "Social insurance filing", items: ko ? [
          { icon: Clock, text: "채용 14일 이내 통합 신고", sub: "4insure.or.kr 에서 국민연금·건강·고용·산재 한 번에" },
          { icon: Banknote, text: "사업주 부담 월 약 19만원 (월급 209만원 기준)", sub: "국민연금 9.4만 + 건강 7.5만 + 고용 1.9만 + 산재(전액 사업주)" },
          { icon: ShieldCheck, text: "산재보험은 사업주 100% 부담", sub: "나머지 3종은 사업주·근로자 50:50 분담" },
        ] : [
          { icon: Clock, text: "File within 14 days of hire", sub: "4insure.or.kr — all 4 insurances at once" },
          { icon: Banknote, text: "Employer share ~190K/mo (base 2.09M)", sub: "Pension 94K + Health 75K + Employment 19K + Workers comp" },
          { icon: ShieldCheck, text: "Workers comp = 100% employer", sub: "Other 3 split 50:50 employer/employee" },
        ]},
        { label: ko ? "원천세 (급여 세금 처리)" : "Payroll tax withholding", items: ko ? [
          { icon: Banknote, text: "매월 급여 지급 시 세액 공제 후 지급", sub: "국세청 간이세액표 기준 / 다음 달 10일까지 홈택스 납부" },
          { icon: Clock, text: "일용직 알바 일당 15만원 이하 비과세", sub: "초과분에만 세금 / 3개월 이상 고용 시 일용직 아님" },
          { icon: FileText, text: "연말정산 — 다음 해 2월 사업주 의무", sub: "소규모 사업자도 예외 X / 세무사 위임 가능" },
        ] : [
          { icon: Banknote, text: "Withhold from each paycheck", sub: "NTS table-based / pay via Hometax by 10th of next month" },
          { icon: Clock, text: "Daily wage ≤150K = tax-exempt", sub: "Tax only above / 3+ months hire ≠ daily worker" },
          { icon: FileText, text: "Year-end settlement: Feb (employer)", sub: "No exception for small biz / CPA can handle" },
        ]},
      ],
      traps: ko ? [
        { label: "5인 미만 사업장도 4대보험 의무", text: "1인 고용 시에도 신고 의무. 위반 시 소급 납부 + 가산세." },
        { label: "현금 급여 후 신고 누락 = 세무조사", text: "국세청 카드 매출 분석(PCI)으로 추적 가능. 미신고 시 더 큰 문제." },
      ] : [
        { label: "Mandatory even for 1 employee", text: "Required from first hire. Violations = back-pay + penalties." },
        { label: "Cash wages without reporting = audit", text: "NTS PCI analysis tracks unreported labor costs." },
      ],
      links: ko ? [
        { text: "4대보험 정보연계센터", href: "https://www.4insure.or.kr", icon: "4대", color: MIDNIGHT, desc: "국민연금·건강·고용·산재 통합 신고" },
        { text: "홈택스", href: "https://www.hometax.go.kr", icon: "홈", color: MIDNIGHT, desc: "원천세 신고·납부, 사업자 등록 확인" },
        { text: "국민건강보험공단", href: "https://www.nhis.or.kr", icon: "건", color: MIDNIGHT, desc: "직원 보험료 조회·납부" },
      ] : [
        { text: "Social Insurance Portal", href: "https://www.4insure.or.kr", icon: "4대", color: MIDNIGHT, desc: "File all 4 social insurances at once" },
        { text: "Hometax", href: "https://www.hometax.go.kr", icon: "홈", color: MIDNIGHT, desc: "Withholding tax filing" },
        { text: "NHIS", href: "https://www.nhis.or.kr", icon: "건", color: MIDNIGHT, desc: "Employee premium lookup and payment" },
      ],
    },
  ];

  const currentStep = isOverview ? null : steps[guideStepIndex - 1];

  // ── 새 디자인 토큰 (Apple-style, 큰 폰트 + 미드나이트 액센트) ──
  const sectionLabel: React.CSSProperties = {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "rgba(0,0,0,0.45)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "10px",
  };

  return (
    <div style={styles.guideCard}>
      {/* 카드 네비 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "12px 0" }}>
        <button type="button" disabled={guideStepIndex === 0} onClick={() => setGuideStepIndex((i: number) => Math.max(0, i - 1))} style={{
          padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(5,97,252,0.1)",
          background: guideStepIndex === 0 ? "rgba(0,0,0,0.02)" : "white",
          color: guideStepIndex === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: guideStepIndex === 0 ? "default" : "pointer",
        }}>
          ← {ko ? "이전" : "Prev"}
        </button>
        <div style={{ display: "flex", gap: "6px" }}>
          {Array.from({ length: totalSlides }, (_, i) => (
            <div key={i} onClick={() => setGuideStepIndex(i)} style={{
              width: i === guideStepIndex ? "20px" : "8px", height: "8px", borderRadius: "100px",
              background: i === guideStepIndex ? MIDNIGHT : "rgba(0,0,0,0.1)",
              cursor: "pointer", transition: "all 0.2s ease",
            }} />
          ))}
        </div>
        <button type="button" disabled={guideStepIndex >= totalSlides - 1} onClick={() => setGuideStepIndex((i: number) => Math.min(totalSlides - 1, i + 1))} style={{
          padding: "10px 18px", borderRadius: "10px", border: "none",
          background: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.02)" : MIDNIGHT,
          color: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.2)" : "#fff",
          fontSize: "13px", fontWeight: 600, cursor: guideStepIndex >= totalSlides - 1 ? "default" : "pointer",
          boxShadow: guideStepIndex >= totalSlides - 1 ? "none" : "0 4px 14px rgba(25,25,112,0.25)",
        }}>
          {ko ? "다음" : "Next"} →
        </button>
      </div>

      {/* 페이저 */}
      <div style={styles.guidePager}>
        <span style={styles.guidePagerLabel}>
          {isOverview ? (ko ? "개요" : "Overview") : `${guideStepIndex} / ${steps.length}`}
        </span>
        <div style={styles.guideDots}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div key={i} onClick={() => setGuideStepIndex(i)} style={{
              width: i === guideStepIndex ? "20px" : "6px",
              height: "6px", borderRadius: "100px",
              background: i === guideStepIndex ? MIDNIGHT : "rgba(17,17,17,0.15)",
              cursor: "pointer", transition: "width 0.2s ease",
            }} />
          ))}
        </div>
      </div>

      {isOverview ? (
        <>
          <div style={styles.guideOverline}>{ko ? "이 단계에서 할 일" : "What to do in this stage"}</div>
          <div style={styles.guideHeadline}>{ko ? "직원·알바 채용부터 법적 절차까지" : "From hiring to legal compliance"}</div>
          <p style={styles.guideBody}>
            {ko
              ? "처음 직원을 뽑는 사장님들이 가장 많이 실수하는 단계입니다. 어디서 구하는지, 계약서는 어떻게 쓰는지, 4대보험은 어떻게 처리하는지 — 모든 것을 이 단계에서 해결하세요."
              : "This is where first-time owners make the most mistakes. Where to find staff, how to write contracts, how to handle insurance — solve it all here."}
          </p>
        </>
      ) : currentStep ? (
        <>
          <div style={styles.guideOverline}>{ko ? `${guideStepIndex}단계` : `Step ${guideStepIndex}`}</div>
          <div style={styles.guideHeadline}>{currentStep.headline}</div>

          {/* ── 🎯 KEY ACTION 히어로 카드 (이 단계에서 꼭 할 일) ── */}
          <div style={{
            display: "flex",
            gap: "14px",
            alignItems: "flex-start",
            padding: "16px 18px",
            borderRadius: "16px",
            background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`,
            color: "#fff",
            marginBottom: "22px",
            boxShadow: "0 6px 20px rgba(25,25,112,0.28)",
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              backdropFilter: "blur(8px)",
            }}>
              <ShieldCheck size={20} strokeWidth={2.2} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, opacity: 0.7, marginBottom: "4px" }}>
                {ko ? "이 단계에서 꼭 할 일" : "Do this in this stage"}
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: "5px" }}>
                {currentStep.keyAction.title}
              </div>
              <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.92 }}>
                {currentStep.keyAction.detail}
              </div>
            </div>
          </div>

          {/* sections — 큰 폰트 + 아이콘 + 카드 그룹 */}
          <div style={{ display: "grid", gap: "20px", marginBottom: "20px" }}>
            {currentStep.sections.map((sec) => (
              <div key={sec.label}>
                <div style={sectionLabel}>{sec.label}</div>
                <div style={{
                  background: "white",
                  borderRadius: "16px",
                  border: "1px solid rgba(0,0,0,0.06)",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}>
                  {sec.items.map((item, idx) => {
                    const Icon = item.icon;
                    const isLink = !!item.href;
                    const InnerContent = (
                      <>
                        {/* 아이콘 — 브랜드 색이 있으면 브랜드 컬러 + 한글자, 없으면 미드나이트 lucide */}
                        {item.brandIcon ? (
                          <div style={{
                            width: 40, height: 40, borderRadius: 11,
                            background: item.brandColor ?? MIDNIGHT,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            color: "#fff",
                            fontSize: item.brandIcon.length > 1 ? "13px" : "15px",
                            fontWeight: 700,
                            letterSpacing: item.brandIcon.length > 1 ? "-0.5px" : "0",
                            boxShadow: "0 2px 6px rgba(25,25,112,0.22)",
                          }}>
                            {item.brandIcon}
                          </div>
                        ) : (
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: "rgba(25,25,112,0.08)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            color: MIDNIGHT,
                          }}>
                            <Icon size={18} strokeWidth={2} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "15px", lineHeight: 1.45, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "3px" }}>
                            {item.text}
                          </div>
                          {item.sub && (
                            <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(0,0,0,0.55)" }}>
                              {item.sub}
                            </div>
                          )}
                        </div>
                        {isLink && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                            <ExternalLink size={13} strokeWidth={2} style={{ color: "rgba(0,0,0,0.25)" }} />
                            <ChevronRight size={16} strokeWidth={2} style={{ color: "rgba(0,0,0,0.25)" }} />
                          </div>
                        )}
                      </>
                    );
                    return (
                      <div key={item.text}>
                        {idx > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                        {isLink ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex", gap: "14px", alignItems: "center",
                              padding: "14px 16px",
                              textDecoration: "none", color: "inherit",
                              background: "transparent", transition: "background 0.12s",
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,0,0,0.025)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                          >
                            {InnerContent}
                          </a>
                        ) : (
                          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                            {InnerContent}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* traps — 빨강 경고 (글자 크기 ↑) */}
          {currentStep.traps.length > 0 && (
            <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
              {currentStep.traps.map((trap) => (
                <div key={trap.label} style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  padding: "13px 15px",
                  borderRadius: "14px",
                  background: "rgba(220,60,30,0.06)",
                  border: "1px solid rgba(200,60,30,0.16)",
                }}>
                  <AlertTriangle size={18} strokeWidth={2} style={{ color: "#b83020", flexShrink: 0, marginTop: "1px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#b83020", marginBottom: "3px", letterSpacing: "-0.01em" }}>{trap.label}</div>
                    <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(184,48,32,0.85)" }}>{trap.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* links — 카드 통일 */}
          {currentStep.links.length > 0 && (
            <div>
              <div style={sectionLabel}>{ko ? "공식 사이트" : "Official sites"}</div>
              <div style={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                {currentStep.links.map((link, idx) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: "14px",
                      padding: "13px 16px",
                      borderBottom: idx < currentStep.links.length - 1 ? "0.5px solid rgba(0,0,0,0.07)" : "none",
                      textDecoration: "none", color: "inherit", background: "transparent",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,0,0,0.025)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                  >
                    {link.icon && (
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "10px",
                        background: link.color ?? MIDNIGHT, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: link.icon.length > 1 ? "11px" : "15px",
                        fontWeight: 700, color: "#fff",
                        letterSpacing: link.icon.length > 1 ? "-0.5px" : "0",
                        boxShadow: "0 2px 6px rgba(25,25,112,0.22)",
                      }}>
                        {link.icon}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "2px", letterSpacing: "-0.01em" }}>{link.text}</div>
                      {link.desc && <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{link.desc}</div>}
                    </div>
                    <ChevronRight size={16} strokeWidth={2} style={{ color: "rgba(0,0,0,0.25)", flexShrink: 0 }} />
                    <ExternalLink size={12} strokeWidth={2} style={{ color: "rgba(0,0,0,0.2)", flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

    </div>
  );
}
