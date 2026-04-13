"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";

export function HiringSetupStage() {
  const d = useDashboardCtx();
  const { language, guideStepIndex, setGuideStepIndex } = d;
  const ko = language === "ko";
  const totalSlides = 4;
  const isOverview = guideStepIndex === 0;

  const secLabel: React.CSSProperties = { fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "6px" };
  const dot: React.CSSProperties = { width: "5px", height: "5px", borderRadius: "50%", background: "rgba(0,0,0,0.25)", flexShrink: 0, marginTop: "6px" };
  type HItem = { text: string; sub?: string };
  type HSec = { label: string; items: HItem[] };
  type HTrap = { label: string; text: string };
  type HLink = { text: string; href: string; icon?: string; color?: string; desc?: string };
  type HStep = { headline: string; sections: HSec[]; traps: HTrap[]; links: HLink[] };

  const steps: HStep[] = [
    {
      headline: ko ? "채용 계획 & 공고" : "Staffing plan & job posting",
      sections: [
        { label: ko ? "인력 필요 여부 판단" : "Assess staffing needs", items: ko ? [
          { text: "혼자 가능한 업무량인지 먼저 계산", sub: "피크 타임(점심·저녁) 기준 손님 수 × 처리 시간으로 인원 추정" },
          { text: "알바 vs 정직원 기준", sub: "주 15시간 미만 → 단기 알바 / 15시간 이상 → 주휴수당 발생 / 40시간 → 정직원 고려" },
          { text: "초기 권장: 1~2명 알바로 시작", sub: "오픈 초기는 매출 예측이 불확실 — 파트타임으로 유연하게 시작" },
        ] : [
          { text: "Calculate your own capacity first", sub: "Peak-time customers x processing time = estimated headcount" },
          { text: "Part-time vs full-time criteria", sub: "Under 15h/week -> short-term / 15h+ -> weekly holiday pay kicks in / 40h -> consider full-time" },
          { text: "Recommendation: start with 1-2 part-timers", sub: "Revenue is unpredictable early -- stay flexible" },
        ]},
        { label: ko ? "채용 공고 플랫폼" : "Where to post", items: ko ? [
          { text: "알바몬 — 단기·파트타임 전문, 소상공인 무료 공고", sub: "지역·시간대·업종 필터 / 24시간 내 지원자 다수" },
          { text: "알바천국 — 소규모 매장 최다 이용", sub: "음식점·카페 등록 많음 / 스마트폰 간편 등록 / 네이버 검색 연동" },
          { text: "당근마켓 '동네 알바' — 지역 주민 즉시 매칭", sub: "무료 / 출퇴근 거리 짧은 알바 선호 시 유리" },
          { text: "사람인 — 정직원 채용 시 활용", sub: "이력서 기반 / 경력직·장기 고용에 적합" },
        ] : [
          { text: "Albamon -- part-time specialist", sub: "Free for small owners / Applicants within 24h" },
          { text: "Albachunguk -- most used by small stores", sub: "Popular for restaurants & cafes / Easy mobile posting" },
          { text: "Karrot 'Local Jobs' -- instant local match", sub: "Free / Best for short-commute hires" },
          { text: "Saramin -- best for full-time hiring", sub: "Resume-based / Suitable for experienced, long-term hires" },
        ]},
      ],
      traps: ko ? [
        { label: "공고에 '최저시급 적용'만 쓰면 지원자가 없다", text: "시급·근무 시간·요일·식사 제공 여부를 구체적으로 써야 지원률이 3배 이상 높아집니다." },
        { label: "오픈 직전 채용은 위험", text: "교육·적응 기간 없이 오픈 당일부터 일하면 실수가 많습니다. 최소 1~2주 전 채용 권장." },
      ] : [
        { label: "Vague wage listings kill applicants", text: "Specify hourly rate, schedule, days, meals -- response rates triple with clear details." },
        { label: "Last-minute hiring before opening is risky", text: "No training before opening day = errors and high turnover. Hire at least 1-2 weeks early." },
      ],
      links: ko ? [
        { text: "알바몬", href: "https://www.albamon.com", icon: "알", color: "#ff6b35", desc: "단기·파트타임 전문, 소상공인 무료 공고" },
        { text: "알바천국", href: "https://www.alba.co.kr", icon: "천", color: "#ff3b6b", desc: "소규모 매장 최다 이용, 스마트폰 간편 등록" },
        { text: "당근 동네알바", href: "https://www.daangn.com", icon: "당", color: "#ff6f00", desc: "지역 주민 즉시 매칭, 무료" },
        { text: "사람인", href: "https://www.saramin.co.kr", icon: "사", color: "#3d7eff", desc: "정직원 채용 시 활용, 이력서 기반" },
      ] : [
        { text: "Albamon", href: "https://www.albamon.com", icon: "알", color: "#ff6b35", desc: "Part-time specialist, free for small owners" },
        { text: "Albachunguk", href: "https://www.alba.co.kr", icon: "천", color: "#ff3b6b", desc: "Most used by small stores, easy mobile posting" },
        { text: "Karrot Local Jobs", href: "https://www.daangn.com", icon: "당", color: "#ff6f00", desc: "Instant local match, free" },
        { text: "Saramin", href: "https://www.saramin.co.kr", icon: "사", color: "#3d7eff", desc: "Best for full-time hiring, resume-based" },
      ],
    },
    {
      headline: ko ? "근로계약서 & 시급 책정" : "Employment contract & wages",
      sections: [
        { label: ko ? "근로계약서 필수 기재 항목" : "Mandatory contract items", items: ko ? [
          { text: "임금 — 시급 또는 월급, 지급일, 지급 방법 명시", sub: "구두 약속 금지 / 미명시 시 법적 분쟁 위험" },
          { text: "근무 시간·요일 (시작~종료 시각, 휴게 시간 포함)", sub: "4시간 이상 근무 → 30분 이상 휴게 의무 / 8시간 이상 → 1시간 이상" },
          { text: "업무 내용·근무 장소·계약 기간 (기간제 vs 무기 구분)", sub: "무기 계약은 해고 절차가 더 엄격 — 신중히 결정" },
          { text: "계약서 2부 작성 → 1부는 반드시 직원에게 교부", sub: "미교부 시 500만원 이하 과태료 발생" },
        ] : [
          { text: "Wages -- hourly/monthly rate, payment date and method", sub: "No verbal-only agreements / Unspecified payment date = legal risk" },
          { text: "Work hours and days (start-end time, break time)", sub: "4h+ shift -> 30 min break / 8h+ -> 1 hour break" },
          { text: "Job scope, workplace, contract term (fixed vs indefinite)", sub: "Indefinite contracts require stricter dismissal procedures" },
          { text: "Two copies -- one must be given to the employee", sub: "Failing to provide = fine up to 5M KRW" },
        ]},
        { label: ko ? "2026년 시급 기준" : "2026 wage reference", items: ko ? [
          { text: "최저시급 10,030원 (2026년 기준)", sub: "주 40시간 × 4.35주 = 월 209시간 → 월 2,096,270원 이상" },
          { text: "수습기간 90% 감액 적용 조건", sub: "1년 이상 계약 + 수습 3개월 이내에만 가능 / 단순 노무직 제외" },
          { text: "주휴수당: 주 15시간 이상 개근 시 1일치 임금 추가 지급", sub: "예: 10,030원 × 8시간 = 주휴수당 80,240원 / 포함 여부 계약서에 명시" },
        ] : [
          { text: "Minimum wage: 10,030 KRW/hour (2026)", sub: "40h/week x 4.35 weeks = 209h/month -> >= 2,096,270 KRW/month" },
          { text: "Probation reduction to 90% only if:", sub: "Contract is 1y+ AND within first 3 months / Excludes simple manual tasks" },
          { text: "Weekly holiday pay: 1 extra day's wage if worked 15h+/week", sub: "10,030 x 8h = 80,240 KRW / State clearly if included in hourly rate" },
        ]},
      ],
      traps: ko ? [
        { label: "수습기간 10% 깎으면 무조건 합법 아님", text: "1년 미만 계약이거나 단순 반복 업무(청소·접시닦기 등)에는 감액 적용 불가. 잘못 적용 시 차액 소급 지급 + 과태료." },
        { label: "주휴수당 모르는 사장님이 많음", text: "주 15시간 이상 알바에게 주휴수당 미지급 시 임금 체불로 노동청 신고 대상." },
      ] : [
        { label: "Probation wage cut isn't always legal", text: "Only valid for 1y+ contracts, not simple manual tasks. Wrong application = back-pay + fine." },
        { label: "Many owners overlook weekly holiday pay", text: "Skipping it for 15h+ workers = wage theft. Clarify in the contract." },
      ],
      links: ko ? [
        { text: "고용노동부 표준계약서", href: "https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20201200455", icon: "고", color: "#34c759", desc: "공식 근로계약서 무료 다운로드" },
        { text: "최저임금위원회", href: "https://www.minimumwage.go.kr", icon: "최", color: "#30b0c7", desc: "2026년 최저임금 10,030원 · 모의 계산기" },
        { text: "노동OK", href: "https://www.nodongok.com", icon: "노", color: "#af52de", desc: "노동부 공식 무료 노무 상담 포털" },
      ] : [
        { text: "MOL Standard Contract", href: "https://www.moel.go.kr", icon: "고", color: "#34c759", desc: "Official template, free download" },
        { text: "Minimum Wage Commission", href: "https://www.minimumwage.go.kr", icon: "최", color: "#30b0c7", desc: "2026 minimum wage 10,030 KRW - simulator" },
        { text: "NodongOK", href: "https://www.nodongok.com", icon: "노", color: "#af52de", desc: "Official free labor consulting portal" },
      ],
    },
    {
      headline: ko ? "4대보험 & 원천세" : "Social insurance & payroll tax",
      sections: [
        { label: ko ? "4대보험 신고 절차" : "Social insurance filing", items: ko ? [
          { text: "국민연금·건강보험 — 채용일로부터 14일 이내 취득 신고", sub: "국민건강보험공단 EDI 또는 4insure.or.kr 통합 신고 / 사업주·근로자 각 50% 부담" },
          { text: "고용보험·산재보험 — 근로복지공단에 신고", sub: "고용보험: 사업주+근로자 공동 부담 / 산재보험: 사업주 100% 부담" },
          { text: "월 보험료 개략 (월급 2,096,270원 기준)", sub: "국민연금 약 94,300원 + 건강보험 약 74,700원 + 고용보험 약 18,900원 = 사업주 부담 합계 약 19만원" },
          { text: "4대보험 정보연계센터에서 한 번에 통합 신고 가능", sub: "www.4insure.or.kr / 최초 신고 후 변경도 동일 경로" },
        ] : [
          { text: "Pension & Health Insurance -- report within 14 days of hire", sub: "File at nhis.or.kr or 4insure.or.kr / Employer and employee each pay 50%" },
          { text: "Employment & Workers' Comp -- file with KWCWS", sub: "Employment: shared / Workers' comp: 100% employer burden" },
          { text: "Monthly premium estimate (2,096,270 KRW base)", sub: "Pension ~94K + Health ~75K + Employment ~19K = employer share ~190K" },
          { text: "Integrated filing at 4insure.or.kr", sub: "File all 4 at once / Same portal for changes" },
        ]},
        { label: ko ? "원천세 (급여 세금 처리)" : "Payroll tax withholding", items: ko ? [
          { text: "근로소득 원천세: 매월 급여 지급 시 세액 공제 후 지급", sub: "국세청 간이세액표 기준 / 다음 달 10일까지 홈택스 납부 의무" },
          { text: "일용직 알바: 일당 150,000원 이하 비과세 (2026년 기준)", sub: "15만원 초과분에만 세금 / 3개월 이상 고용 시 일용직 아님 → 근로소득세 적용" },
          { text: "연말정산: 다음 해 2월 근로자 대신 처리 의무", sub: "소규모 사업자도 예외 없음 / 세무사 선임 시 대부분 위임 가능" },
        ] : [
          { text: "Withhold income tax from each paycheck", sub: "Based on NTS simplified tax table / Pay via Hometax by 10th of following month" },
          { text: "Daily workers: tax-exempt if daily wage <= 150,000 KRW", sub: "3+ months = no longer 'daily' -> income tax applies" },
          { text: "Year-end settlement: reconcile in February on employees' behalf", sub: "No exceptions for small businesses / CPA handles this if you have one" },
        ]},
      ],
      traps: ko ? [
        { label: "5인 미만 사업장도 4대보험 의무", text: "1인 고용 시에도 신고 의무가 있습니다. 위반 시 소급 납부 + 가산세가 붙습니다." },
        { label: "현금 급여 후 신고 누락은 세무조사 리스크", text: "국세청 카드 매출 분석(PCI)으로 비용 처리 여부 추적 가능. 미신고 시 나중에 더 큰 문제가 생깁니다." },
      ] : [
        { label: "Social insurance mandatory even for 1 employee", text: "Required from the very first hire. Violations = back payment + penalties." },
        { label: "Cash wages without reporting = audit risk", text: "NTS tracks unreported labor costs via PCI analysis." },
      ],
      links: ko ? [
        { text: "4대보험 정보연계센터", href: "https://www.4insure.or.kr", icon: "4대", color: "#007aff", desc: "국민연금·건강보험·고용·산재 통합 신고" },
        { text: "홈택스", href: "https://www.hometax.go.kr", icon: "홈", color: "#5856d6", desc: "원천세 신고·납부, 사업자 등록 확인" },
        { text: "국민건강보험공단", href: "https://www.nhis.or.kr", icon: "건", color: "#ff9f0a", desc: "직원 보험료 조회·납부" },
      ] : [
        { text: "Social Insurance Portal", href: "https://www.4insure.or.kr", icon: "4대", color: "#007aff", desc: "File all 4 social insurances at once" },
        { text: "Hometax", href: "https://www.hometax.go.kr", icon: "홈", color: "#5856d6", desc: "Withholding tax filing and business registration" },
        { text: "NHIS", href: "https://www.nhis.or.kr", icon: "건", color: "#ff9f0a", desc: "Employee premium lookup and payment" },
      ],
    },
  ];

  const currentStep = isOverview ? null : steps[guideStepIndex - 1];

  return (
    <div style={styles.guideCard}>
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
              background: i === guideStepIndex ? "var(--primary)" : "rgba(17,17,17,0.15)",
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
              : "This is where first-time owners make the most mistakes. Where to find staff, how to write contracts, how to handle insurance -- solve it all here."}
          </p>
        </>
      ) : currentStep ? (
        <>
          <div style={styles.guideOverline}>{ko ? `${guideStepIndex}단계` : `Step ${guideStepIndex}`}</div>
          <div style={styles.guideHeadline}>{currentStep.headline}</div>
          {/* sections */}
          <div style={{ display: "grid", gap: "14px" }}>
            {currentStep.sections.map((sec) => (
              <div key={sec.label} style={{ display: "grid", gap: "10px" }}>
                <div style={secLabel}>{sec.label}</div>
                <div style={{ display: "grid", gap: "7px" }}>
                  {sec.items.map((item) => (
                    <div key={item.text} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <div style={dot} />
                      <div>
                        <div style={{ fontSize: "13px", lineHeight: 1.5, fontWeight: 500 }}>{item.text}</div>
                        {item.sub && <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)", marginTop: "1px" }}>{item.sub}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* traps */}
          {currentStep.traps.length > 0 && (
            <div style={{ display: "grid", gap: "6px", marginTop: "4px" }}>
              {currentStep.traps.map((trap) => (
                <div key={trap.label} style={{ padding: "11px 13px", borderRadius: "13px", background: "rgba(220,60,30,0.05)", border: "1px solid rgba(200,60,30,0.13)" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#b83020", marginBottom: "3px" }}>⚠ {trap.label}</div>
                  <div style={{ fontSize: "12px", lineHeight: 1.6, color: "var(--muted)" }}>{trap.text}</div>
                </div>
              ))}
            </div>
          )}
          {/* links */}
          {currentStep.links.length > 0 && (
            <div style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.09)", overflow: "hidden", background: "#fff", marginTop: "4px" }}>
              {currentStep.links.map((link, idx) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 14px",
                    borderBottom: idx < currentStep.links.length - 1 ? "0.5px solid rgba(0,0,0,0.08)" : "none",
                    textDecoration: "none", color: "inherit", background: "transparent",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,0,0,0.025)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                >
                  {link.icon && (
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "9px",
                      background: link.color ?? "#007aff", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: link.icon.length > 1 ? "10px" : "14px",
                      fontWeight: 700, color: "#fff",
                      letterSpacing: link.icon.length > 1 ? "-0.5px" : "0",
                    }}>
                      {link.icon}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--primary)", marginBottom: "1px" }}>{link.text}</div>
                    {link.desc && <div style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{link.desc}</div>}
                  </div>
                  <div style={{ fontSize: "16px", color: "rgba(0,0,0,0.2)", flexShrink: 0 }}>›</div>
                </a>
              ))}
            </div>
          )}
        </>
      ) : null}

      {/* 카드 네비 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 0" }}>
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
              background: i === guideStepIndex ? "#0561fc" : "rgba(0,0,0,0.1)",
              cursor: "pointer", transition: "all 0.2s ease",
            }} />
          ))}
        </div>
        <button type="button" disabled={guideStepIndex >= totalSlides - 1} onClick={() => setGuideStepIndex((i: number) => Math.min(totalSlides - 1, i + 1))} style={{
          padding: "10px 18px", borderRadius: "10px", border: "none",
          background: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.02)" : "#0561fc",
          color: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.2)" : "#fff",
          fontSize: "13px", fontWeight: 600, cursor: guideStepIndex >= totalSlides - 1 ? "default" : "pointer",
          boxShadow: guideStepIndex >= totalSlides - 1 ? "none" : "0 4px 14px rgba(5,97,252,0.25)",
        }}>
          {ko ? "다음" : "Next"} →
        </button>
      </div>
    </div>
  );
}
