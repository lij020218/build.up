"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function FirstMonthCheckStage() {
  const d = useDashboardCtx();
  const { language, industryCategoryId, monthlyCosts } = d;

                  const isStartupBiz = industryCategoryId === "startup-tech" || d.industryCategoryId === "startup-tech";
                  const s = { display: "flex", flexDirection: "column" as const, gap: "6px" };
                  const card = { background: "rgba(0,0,0,0.03)", borderRadius: "14px", padding: "14px 16px" };
                  const secTitle = { fontSize: "12px", fontWeight: 700 as const, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" };
                  const tag = (c: string) => ({ display: "inline-block" as const, fontSize: "11px", fontWeight: 600 as const, padding: "2px 8px", borderRadius: "20px", background: `${c}18`, color: c });

                  const fixedCosts = (monthlyCosts as { rent: number; labor: number; utilities: number }).rent
                    + (monthlyCosts as { rent: number; labor: number; utilities: number }).labor
                    + (monthlyCosts as { rent: number; labor: number; utilities: number }).utilities;
                  const emergencyTarget = fixedCosts > 0 ? fixedCosts * 1.5 : null;
                  const fmt = (n: number) => `${Math.round(n / 10000).toLocaleString()}만원`;

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "8px" }}>

                      {/* ── 비상금 / 런웨이 ── */}
                      <div style={s}>
                        <div style={secTitle}>{isStartupBiz ? (language === "ko" ? "런웨이 확인" : "Runway check") : (language === "ko" ? "비상금 목표 계산" : "Emergency reserve target")}</div>
                        {emergencyTarget ? (
                          <div style={{ ...card, background: "rgba(52,199,89,0.06)", border: "0.5px solid rgba(52,199,89,0.25)" }}>
                            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>
                              {language === "ko" ? "분석 결과 (입력된 월 고정비 기준)" : "Based on your monthly fixed costs"}
                            </div>
                            <div style={{ fontSize: "22px", fontWeight: 700, color: "#34c759", marginBottom: "4px" }}>
                              {fmt(emergencyTarget)}
                            </div>
                            <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5 }}>
                              {language === "ko"
                                ? isStartupBiz
                                  ? `월 번레이트(서버+인건비+도구) × 1.5개월 = 최소 비상금`
                                  : `임대료(${fmt((monthlyCosts as {rent:number}).rent)}) + 인건비(${fmt((monthlyCosts as {labor:number}).labor)}) + 공과금(${fmt((monthlyCosts as {utilities:number}).utilities)}) × 1.5배`
                                : `Monthly costs × 1.5`}
                            </div>
                          </div>
                        ) : (
                          <div style={card}>
                            <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                              {language === "ko"
                                ? isStartupBiz
                                  ? "운영 대시보드에서 월 비용을 입력하면 런웨이를 자동 계산합니다. 최소 6개월 런웨이 확보 권장."
                                  : "내 가게 현황 화면에서 월 비용을 입력하면 비상금 목표액을 자동으로 계산해드립니다."
                                : "Enter monthly costs to auto-calculate reserve target."}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── KPI 추적 도구 ── */}
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? (isStartupBiz ? "핵심 지표 추적 도구" : "현금흐름 기록 도구 선택") : "Tracking tool"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {(isStartupBiz ? (language === "ko" ? [
                            { name: "build.up 운영 대시보드", desc: "일별 매출 + KPI 자동 분석 + AI 모닝 브리핑", badge: "지금 바로", color: "#007aff" },
                            { name: "Mixpanel / PostHog", desc: "이벤트 기반 사용자 행동 분석. 퍼널 + 리텐션 추적", badge: "필수", color: "#7c3aed" },
                            { name: "Notion / Google Sheets", desc: "주간 리뷰 기록 + 실험 로그 + OKR 관리", badge: "주간 리뷰", color: "#ff9f0a" },
                          ] : [
                            { name: "build.up Dashboard", desc: "Daily KPI + AI briefing + automated analysis", badge: "Start now", color: "#007aff" },
                            { name: "Mixpanel / PostHog", desc: "Event-based user behavior analytics. Funnel + retention", badge: "Essential", color: "#7c3aed" },
                            { name: "Notion / Sheets", desc: "Weekly review log + experiment tracking + OKR", badge: "Weekly", color: "#ff9f0a" },
                          ]) : (language === "ko" ? [
                            { name: "캐시노트 (CashNote)", desc: "카드사·POS 연동 자동 집계 · 일별 매출 무료 확인 · 소상공인 1위 앱", badge: "가장 쉬움", color: "#34c759" },
                            { name: "build.up 내 가게 현황", desc: "이 앱에서 바로 기록 · 일별 매출 + 비용 구조 + KPI 자동 분석", badge: "지금 바로", color: "#007aff" },
                            { name: "엑셀·구글 스프레드시트", desc: "자유도 최고 · 직접 수식 관리 · 별도 학습 필요", badge: "고급 사용자", color: "#ff9f0a" },
                          ] : [
                            { name: "CashNote", desc: "Auto-sync with card/POS · free daily sales · #1 app", badge: "Easiest", color: "#34c759" },
                            { name: "build.up My Store", desc: "Record here · daily sales + cost + KPI", badge: "Start now", color: "#007aff" },
                            { name: "Excel / Sheets", desc: "Max flexibility · custom formulas", badge: "Power", color: "#ff9f0a" },
                          ])).map((t) => (
                            <div key={t.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }}>
                              <div style={{ flex: 1, marginRight: "8px" }}>
                                <div style={{ fontSize: "13px", fontWeight: 600 }}>{t.name}</div>
                                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{t.desc}</div>
                              </div>
                              <span style={tag(t.color)}>{t.badge}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── 첫 달 핵심 원칙 ── */}
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? (isStartupBiz ? "론칭 첫 달 — 생존 원칙" : "개업 첫 달 — 가장 중요한 것들") : "First month priorities"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {(isStartupBiz ? (language === "ko" ? [
                            { title: "매일 핵심 지표 확인", desc: "DAU, 가입 전환율, 핵심 액션 완료율. 하루라도 빠지면 트렌드를 놓칩니다." },
                            { title: "첫 2주 내 사용자 10명과 직접 대화", desc: "왜 가입했는지, 뭐가 불편한지, 계속 쓸 건지. 이 대화가 PMF의 단서입니다." },
                            { title: "D7 리텐션 20% 이상인지 확인", desc: "첫 주에 돌아오지 않으면 성장은 무의미합니다. 제품 개선에 집중하세요." },
                            { title: "주간 실험 1개씩 반드시 실행", desc: "가설 → 실행 → 측정 → 학습. 매주 하나의 실험이 성장의 엔진입니다." },
                            { title: "번레이트를 매주 체크", desc: "현금이 0이 되면 게임 오버. 런웨이가 6개월 미만이면 즉시 대응하세요." },
                          ] : [
                            { title: "Check key metrics daily", desc: "DAU, signup rate, core action rate. Missing a day means missing trends." },
                            { title: "Talk to 10 users in first 2 weeks", desc: "Why they signed up, what's frustrating, will they stay. This is the PMF clue." },
                            { title: "Verify D7 retention ≥ 20%", desc: "If users don't return in week 1, growth is meaningless. Focus on product." },
                            { title: "Run 1 experiment per week", desc: "Hypothesis → Execute → Measure → Learn. Weekly experiments drive growth." },
                            { title: "Check burn rate weekly", desc: "Cash at zero = game over. Under 6mo runway = act immediately." },
                          ]) : (language === "ko" ? [
                            { title: "매일 매출·비용 기록", desc: "감이 아닌 숫자로 판단해야 합니다. 하루라도 빠지면 데이터가 끊깁니다." },
                            { title: "고객 피드백 첫 2주 내 수집", desc: "불만 고객은 말하지 않고 떠납니다. 설문지·리뷰 요청을 적극 활용하세요." },
                            { title: "원가율을 주 단위로 점검", desc: "식재료 낭비·도난·비율 오류가 생기는 건 항상 초반입니다." },
                            { title: "네이버 플레이스 리뷰 관리", desc: "초기 리뷰 10개가 검색 노출을 결정합니다. 방문 고객에게 리뷰 요청하세요." },
                            { title: "적자여도 3개월은 지켜봐라", desc: "오픈 초기 적자는 정상입니다. 단, 매주 숫자가 개선되고 있어야 합니다." },
                          ] : [
                            { title: "Record sales + costs daily", desc: "Data over gut feeling. Missing a day breaks tracking." },
                            { title: "Collect feedback in 2 weeks", desc: "Unhappy customers leave silently. Actively request reviews." },
                            { title: "Check cost ratio weekly", desc: "Waste and errors always appear early." },
                            { title: "Manage Naver Place reviews", desc: "First 10 reviews determine search visibility." },
                            { title: "A loss in month 1 is normal", desc: "But numbers must improve week by week." },
                          ])).map((item) => (
                            <div key={item.title} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)", alignItems: "flex-start" }}>
                              <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(0,0,0,0.3)", flexShrink: 0, marginTop: "7px" }} />
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>{item.title}</div>
                                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{item.desc}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );

}
