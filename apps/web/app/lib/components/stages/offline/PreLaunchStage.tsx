"use client";

import { Lightbulb } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function PreLaunchStage() {
  const d = useDashboardCtx();
  const {
    language, industryCategoryId, softOpenStep, setSoftOpenStep,
    softOpenChecks, setSoftOpenChecks, softOpenPricing, setSoftOpenPricing,
    softOpenSkips, setSoftOpenSkips,
  } = d;

                  const catLabel: Record<string, string> = {
                    food: "식당", "cafe-dessert": "카페", beauty: "뷰티샵",
                    retail: "리테일 매장", fitness: "피트니스", "online-digital": "온라인몰",
                  };
                  const bizLabel = catLabel[industryCategoryId] ?? "매장";

                  const guestTypes = [
                    { id: "guest-family",     label: "가족 / 친한 지인",                  desc: "솔직한 피드백의 최고 소스 — 창피함 없이 날카롭게 말해줄 사람 우선" },
                    { id: "guest-neighbor",   label: "동네 주민 / 이웃",                  desc: "잠재 단골 고객 — 오픈 후에도 가장 자주 올 수 있는 사람들" },
                    { id: "guest-influencer", label: "인스타 팔로워 / 마이크로 인플루언서", desc: "SNS 바이럴 효과 — 팔로워 1,000~10,000명 수준 권장" },
                    { id: "guest-peer",       label: "업계 지인 / 블로거",                desc: "전문적 관점의 날카로운 피드백 — 개업 전 마지막 검증" },
                  ];

                  const pricingOptions = [
                    { id: "free",     label: "무료 제공",    badge: "인상 최대화",  desc: "최고의 첫인상. 재료비만 부담하되 솔직한 피드백을 최대로 확보.",       tip: "예상 인원 × 원가로 예산 책정" },
                    { id: "discount", label: "30–50% 할인",  badge: "균형적 선택",  desc: "결제 흐름·POS까지 실 테스트 가능. 부담 없이 많은 인원 초대.",         tip: "수수료·포인트 적립 포함 전체 결제 흐름 검증" },
                    { id: "full",     label: "정가 운영",    badge: "실전 그대로",  desc: "할인·이벤트를 아껴뒀다 본오픈에 사용. 실수익 구조 그대로 테스트.",     tip: "사은품·경품은 본오픈용으로 보류" },
                  ];

                  const industryDayChecks: Record<string, { id: string; label: string; detail: string }[]> = {
                    food: [
                      { id: "day-inventory",    label: "식재료·재고 수량 확인 (예상 인원 1.5배)",  detail: "핵심 재료 부족 없도록 여유분 확보" },
                      { id: "day-order-timing", label: "주문 → 서빙 소요 시간 기록",               detail: "목표 시간 대비 지연 구간 파악" },
                      { id: "day-delivery",     label: "배달앱 주문 수신 & 처리 테스트",           detail: "배민·쿠팡이츠 연동 상태 확인" },
                    ],
                    "cafe-dessert": [
                      { id: "day-inventory",    label: "식재료·원두·재료 수량 확인 (1.5배 여유분)", detail: "시그니처 메뉴 소재 부족 없도록" },
                      { id: "day-order-timing", label: "주문 → 제조 → 픽업 소요 시간 기록",        detail: "피크 타임 가상 시나리오로 테스트" },
                      { id: "day-display",      label: "디저트·음료 디스플레이 & 조명 확인",        detail: "인스타 촬영 욕구를 자극하는 구도 연출" },
                    ],
                    beauty: [
                      { id: "day-booking-system", label: "네이버·카카오 예약 시스템 정상 작동 확인", detail: "예약→확정→알림 문자 전체 흐름 테스트" },
                      { id: "day-no-show",        label: "노쇼 방지 예치금·알림 시스템 테스트",     detail: "예약금 자동 수령 및 확인 메시지 발송 여부" },
                      { id: "day-service-time",   label: "시술 시간 vs 예약 간격 검증",             detail: "실제 시술 소요 → 다음 예약과 간격이 충분한지 확인" },
                    ],
                    retail: [
                      { id: "day-display",        label: "상품 진열·동선 최종 점검",              detail: "주력 상품이 눈에 잘 띄는 위치에 배치됐는지 확인" },
                      { id: "day-inventory",      label: "재고 수량·진열 일치 여부 확인",         detail: "품절 상품 진열 금지, 인기 예상 상품 충분히 확보" },
                      { id: "day-checkout-test",  label: "결제·영수증·포장재 준비 확인",          detail: "봉투·테이프·영수증 용지 충분한지 확인" },
                    ],
                    fitness: [
                      { id: "day-equipment", label: "운동 기구·시설 안전 점검",             detail: "모든 기구 작동 확인, 파손·안전 위험 요소 제거" },
                      { id: "day-crm",       label: "회원 관리·예약 시스템(CRM) 테스트",    detail: "출입 통제·락커 배정·수업 예약 흐름 전체 테스트" },
                      { id: "day-class",     label: "시범 클래스·PT 체험 진행 준비",        detail: "수업 흐름·강사 지도 품질 사전 검증" },
                    ],
                    "online-digital": [
                      { id: "day-checkout-online", label: "결제 → 주문 완료 흐름 전체 테스트",   detail: "카드·간편결제 실 결제 후 취소로 검증" },
                      { id: "day-cs",              label: "CS 채널(채팅·전화) 응답 속도 테스트", detail: "문의 접수 → 응답까지 목표 시간 내 처리 가능한지 확인" },
                      { id: "day-fulfillment",     label: "주문 → 포장 → 발송 처리 흐름 확인", detail: "운송장 출력, 포장 속도, 배송 추적 연동 테스트" },
                    ],
                  };

                  const universalDayChecks = [
                    { id: "day-cleanliness",    label: "매장·시설 청결 & 위생 최종 점검",      detail: "바닥·테이블·화장실·쓰레기통 모두 점검, 소독" },
                    { id: "day-staff-briefing", label: "직원 역할 배분 & 브리핑",              detail: "포지션·응대 멘트·비상 대응 방법 공유" },
                    { id: "day-pos",            label: "POS & 결제 단말기 정상 작동 확인",     detail: "카드·현금·간편결제(카카오·네이버·토스) 테스트 결제 후 즉시 취소" },
                    { id: "day-ambiance",       label: "조명·음악·온도·향기 설정",             detail: "원하는 브랜드 분위기 연출, 손님 입장 전 최종 확인" },
                    { id: "day-observation",    label: "운영 중 병목 & 손님 반응 관찰",        detail: "표정·대화·남기는 것·오래 머무는 곳 실시간 기록" },
                    { id: "day-payment",        label: "결제 오류·지연 여부 체크",             detail: "영수증 출력, 결제 완료 문자 발송 여부 확인" },
                    { id: "day-feedback-card",  label: "피드백 카드 수거 & 정리",              detail: "무기명 가능 → 솔직한 의견 유도" },
                    { id: "day-debrief",        label: "직원 회의 진행",                       detail: "잘된 점 3가지 + 개선점 3가지 모두 발언하게 하기" },
                    { id: "day-settlement",     label: "일 마감 & 정산 확인",                  detail: "실 매출과 POS 금액 일치 여부, 정산 오류 체크" },
                    { id: "day-sns",            label: "SNS 콘텐츠 촬영 & 업로드",            detail: "당일 감성 콘텐츠 → 인스타·네이버 포스팅" },
                  ];
                  const extraDayChecks = industryDayChecks[industryCategoryId] ?? [];
                  const allDayChecks = [...extraDayChecks, ...universalDayChecks];

                  const industryFeedback: Record<string, { id: string; label: string }[]> = {
                    food:           [{ id: "feedback-taste", label: "맛·음식 품질 피드백 수집" },          { id: "feedback-menu",       label: "메뉴 다양성·구성 피드백 수집" }],
                    "cafe-dessert": [{ id: "feedback-taste", label: "맛·음료 & 디저트 품질 피드백 수집" }, { id: "feedback-menu",       label: "메뉴·시즌 구성 피드백 수집" }],
                    beauty:         [{ id: "feedback-quality", label: "시술 퀄리티·기술력 피드백 수집" },  { id: "feedback-booking",    label: "예약·대기·동선 편의성 피드백 수집" }],
                    retail:         [{ id: "feedback-product", label: "상품 구성·품질 피드백 수집" },       { id: "feedback-display",    label: "진열·동선 편의성 피드백 수집" }],
                    fitness:        [{ id: "feedback-facility", label: "시설·기구 만족도 피드백 수집" },    { id: "feedback-instructor", label: "강사·PT 품질 피드백 수집" }],
                    "online-digital": [{ id: "feedback-ux", label: "구매 흐름·UI/UX 피드백 수집" },         { id: "feedback-product",    label: "상품 설명·사진 품질 피드백 수집" }],
                  };
                  const allFeedbackItems = [
                    ...(industryFeedback[industryCategoryId] ?? []),
                    { id: "feedback-service",  label: "서비스 속도·친절도 피드백 수집" },
                    { id: "feedback-price",    label: "가격 만족도 피드백 수집" },
                    { id: "feedback-ambiance", label: "공간·분위기·인테리어 피드백 수집" },
                  ];

                  const coreImproveLabel: Record<string, string> = {
                    food: "메뉴·레시피", "cafe-dessert": "메뉴·레시피", beauty: "시술·서비스",
                    retail: "상품 구성·진열", fitness: "프로그램·시설", "online-digital": "상품·UX",
                  };
                  const improvementItems = [
                    { id: "improve-core",    label: `피드백 기반 ${coreImproveLabel[industryCategoryId] ?? "핵심 서비스"} 개선 완료`,  detail: "피드백에서 반복 언급된 항목 최우선 개선" },
                    { id: "improve-service", label: "서비스 흐름 & 직원 동선 재배치 완료",                                              detail: "병목 구간 제거, 담당 역할 재조정" },
                    { id: "improve-staff",   label: "약점 파악 기반 직원 재교육 완료",                                                  detail: "미숙한 부분 집중 훈련, 응대 스크립트 보완" },
                  ];

                  const grandOpeningItems = [
                    { id: "final-naver",     label: "네이버 플레이스 오픈 포스팅 예약",       detail: "사진·메뉴·영업시간 최신화 후 오픈 당일 발행 예약" },
                    { id: "final-instagram", label: "인스타그램 그랜드 오픈 콘텐츠 예약",     detail: "릴스·카드뉴스 오픈 당일 자동 업로드 설정" },
                    { id: "final-kakao",     label: "카카오 채널 오픈 알림 발송",             detail: "팔로워 전체 메시지 — 소프트오픈 때 모은 DB 활용" },
                    { id: "final-event",     label: "오픈 기념 이벤트 준비 완료",             detail: "할인·사은품·스탬프·팔로우 이벤트 중 1가지 이상" },
                  ];

                  const softSteps = [
                    { title: "손님 초대 & 행사 기획",      subtitle: `${bizLabel} 소프트오픈에 누구를 초대하고 어떤 방식으로 진행할지 결정합니다` },
                    { title: "당일 운영 체크리스트",        subtitle: `${bizLabel} 운영의 모든 요소를 실전 그대로 점검합니다` },
                    { title: "피드백 분석 & 본오픈 준비",   subtitle: "수집된 피드백으로 개선하고, 본오픈을 완벽히 준비합니다" },
                  ];
                  const curSoftStep = softSteps[softOpenStep];

                  const renderCheckRow = (id: string, label: string, detail: string, accent = "rgb(0,122,255)") => {
                    const checked = !!softOpenChecks[id];
                    return (
                      <div key={id} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: checked ? `${accent}0A` : "white", transition: "background 0.15s" }}
                        onClick={() => setSoftOpenChecks(prev => ({ ...prev, [id]: !prev[id] }))}
                      >
                        <div style={{ flexShrink: 0, marginTop: "2px", width: "22px", height: "22px", borderRadius: "7px", border: checked ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: checked ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                          {checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14.5px", fontWeight: 500, color: checked ? "rgba(0,0,0,0.3)" : "var(--text)", textDecoration: checked ? "line-through" : "none", lineHeight: 1.4, letterSpacing: "-0.2px", transition: "all 0.15s" }}>{label}</div>
                          {detail && !checked && <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", marginTop: "3px", lineHeight: 1.45 }}>{detail}</div>}
                        </div>
                      </div>
                    );
                  };

                  const renderSection = (title: string, items: { id: string; label: string; detail: string }[], accent = "rgb(0,122,255)") => (
                    <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                      <div style={{ padding: "14px 20px 6px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{title}</div>
                      </div>
                      {items.map((item, i) => (
                        <div key={item.id}>
                          {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "56px" }} />}
                          {renderCheckRow(item.id, item.label, item.detail, accent)}
                        </div>
                      ))}
                    </div>
                  );

                  return (
                    <div style={{ marginBottom: "20px" }}>
                      {/* 네비게이션 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                        <button type="button"
                          style={{ fontSize: "14px", fontWeight: 580, color: softOpenStep === 0 ? "transparent" : "rgba(0,0,0,0.45)", background: "none", border: "none", cursor: softOpenStep === 0 ? "default" : "pointer", padding: "8px 4px", pointerEvents: softOpenStep === 0 ? "none" : "auto" }}
                          onClick={() => setSoftOpenStep(s => s - 1)}
                        >← {language === "ko" ? "이전" : "Back"}</button>
                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} onClick={() => setSoftOpenStep(i)} style={{ width: i === softOpenStep ? "20px" : "6px", height: "6px", borderRadius: "100px", background: i === softOpenStep ? "rgb(0,122,255)" : "rgba(17,17,17,0.15)", cursor: "pointer", transition: "width 0.2s ease" }} />
                          ))}
                        </div>
                        <button type="button"
                          style={{ fontSize: "14px", fontWeight: 580, color: softOpenStep === 2 ? "transparent" : "rgba(0,0,0,0.45)", background: "none", border: "none", cursor: softOpenStep === 2 ? "default" : "pointer", padding: "8px 4px", pointerEvents: softOpenStep === 2 ? "none" : "auto" }}
                          onClick={() => setSoftOpenStep(s => s + 1)}
                        >{language === "ko" ? "다음" : "Next"} →</button>
                      </div>

                      {/* 헤더 */}
                      <div style={{ marginBottom: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }}>
                          <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: "rgba(0,122,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: "11px", fontWeight: 750, color: "rgb(0,122,255)", letterSpacing: "-0.5px" }}>0{softOpenStep + 1}</span>
                          </div>
                          <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 660, letterSpacing: "-0.5px", color: "var(--text)" }}>{curSoftStep.title}</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(0,0,0,0.48)", lineHeight: 1.55, paddingLeft: "40px" }}>{curSoftStep.subtitle}</p>
                      </div>

                      {/* ── Step 0: 손님 초대 & 행사 기획 ── */}
                      {softOpenStep === 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          {/* 초대 대상 */}
                          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                            <div style={{ padding: "14px 20px 6px" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>초대 대상 선택</div>
                            </div>
                            {guestTypes.map((g, i) => {
                              const selected = !!softOpenChecks[g.id];
                              return (
                                <div key={g.id}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)" }} />}
                                  <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 20px", cursor: "pointer", background: selected ? "rgba(0,122,255,0.04)" : "white", transition: "background 0.15s" }}
                                    onClick={() => setSoftOpenChecks(prev => ({ ...prev, [g.id]: !prev[g.id] }))}
                                  >
                                    <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", border: selected ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: selected ? "rgb(0,122,255)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                                      {selected && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: "15px", fontWeight: selected ? 640 : 560, color: selected ? "rgb(0,122,255)" : "var(--text)", letterSpacing: "-0.3px" }}>{g.label}</div>
                                      <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", marginTop: "1px", lineHeight: 1.45 }}>{g.desc}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div style={{ padding: "10px 20px 14px" }}>
                              <div style={{ fontSize: "12px", color: "rgba(0,80,200,0.75)", lineHeight: 1.5, padding: "8px 12px", borderRadius: "10px", background: "rgba(0,122,255,0.06)", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                                <Lightbulb size={13} strokeWidth={1.5} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
                                <span>적정 인원: 예상 하루 고객의 50–70% 수준. 너무 많으면 운영 혼선, 너무 적으면 피드백 데이터 부족</span>
                              </div>
                            </div>
                          </div>

                          {/* 가격 전략 */}
                          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                            <div style={{ padding: "14px 20px 6px" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>가격 전략</div>
                            </div>
                            {pricingOptions.map((opt, i) => {
                              const sel = softOpenPricing === opt.id;
                              return (
                                <div key={opt.id}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)" }} />}
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: sel ? "rgba(0,122,255,0.04)" : "white", transition: "background 0.15s" }}
                                    onClick={() => setSoftOpenPricing(sel ? "" : opt.id)}
                                  >
                                    <div style={{ flexShrink: 0, marginTop: "3px", width: "20px", height: "20px", borderRadius: "50%", border: sel ? "6px solid rgb(0,122,255)" : "1.5px solid rgba(0,0,0,0.25)", transition: "all 0.2s" }} />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                                        <span style={{ fontSize: "15px", fontWeight: sel ? 650 : 560, color: sel ? "rgb(0,122,255)" : "var(--text)", letterSpacing: "-0.3px" }}>{opt.label}</span>
                                        <span style={{ fontSize: "11px", fontWeight: 650, color: sel ? "rgb(0,122,255)" : "rgba(0,0,0,0.4)", background: sel ? "rgba(0,122,255,0.1)" : "rgba(0,0,0,0.06)", padding: "2px 8px", borderRadius: "100px" }}>{opt.badge}</span>
                                      </div>
                                      <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.5)", lineHeight: 1.45 }}>{opt.desc}</div>
                                      {sel && (
                                        <div style={{ fontSize: "12px", color: "rgba(0,80,200,0.75)", marginTop: "6px", padding: "6px 10px", borderRadius: "8px", background: "rgba(0,122,255,0.07)", lineHeight: 1.45, display: "flex", alignItems: "flex-start", gap: "6px" }}>
                                          <Lightbulb size={12} strokeWidth={1.5} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
                                          <span>{opt.tip}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* 피드백 설계 가이드 — Apple style */}
                          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                            {/* 헤더 */}
                            <div style={{ padding: "20px 20px 16px" }}>
                              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>Feedback Design</div>
                              <div style={{ fontSize: "17px", fontWeight: 660, color: "var(--text)", letterSpacing: "-0.4px", lineHeight: 1.25 }}>피드백 설계 가이드</div>
                              <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", marginTop: "4px", lineHeight: 1.5 }}>소프트 오픈 전 피드백 폼을 설계해두면 본오픈 개선에 직접 활용할 수 있습니다.</div>
                            </div>

                            <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />

                            {/* 무엇을 물어볼까 */}
                            <div style={{ padding: "18px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                    <rect x="2" y="3" width="12" height="1.4" rx="0.7" fill="rgba(0,0,0,0.55)"/>
                                    <rect x="2" y="7.3" width="9" height="1.4" rx="0.7" fill="rgba(0,0,0,0.55)"/>
                                    <rect x="2" y="11.6" width="10.5" height="1.4" rx="0.7" fill="rgba(0,0,0,0.55)"/>
                                  </svg>
                                  <span style={{ fontSize: "15px", fontWeight: 640, color: "var(--text)", letterSpacing: "-0.3px" }}>무엇을 물어볼까</span>
                                </div>
                                <span style={{ fontSize: "11.5px", fontWeight: 500, color: "rgba(0,0,0,0.35)" }}>5–7개 권장</span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                                {[
                                  { label: (() => { const m: Record<string, string> = { food: "맛·간·양", "cafe-dessert": "맛·음료 퀄리티·당도", beauty: "시술 결과·지속력", retail: "상품 퀄리티·구색", fitness: "수업 강도·강사", "online-digital": "상품 정보·UX" }; return m[industryCategoryId] ?? "핵심 품질"; })(), desc: "업종 핵심 항목", highlight: true },
                                  { label: "서비스·응대 속도", desc: "친절도, 처리 시간" },
                                  { label: "가격 적정성", desc: "품질 대비 체감 가치" },
                                  { label: "공간·분위기", desc: "청결, 동선, 조명, 온도" },
                                  { label: "재방문 의향 (1–5점)", desc: "가장 정직한 종합 지표" },
                                  { label: "좋았던 점 / 아쉬운 점", desc: "주관식 1–2개" },
                                ].map((item, i, arr) => (
                                  <div key={i}>
                                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", margin: "0 0 0 0" }} />}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: item.highlight ? "rgb(0,122,255)" : "rgba(0,0,0,0.2)", flexShrink: 0 }} />
                                        <span style={{ fontSize: "14px", fontWeight: item.highlight ? 600 : 450, color: item.highlight ? "var(--text)" : "rgba(0,0,0,0.75)", letterSpacing: "-0.2px" }}>{item.label}</span>
                                      </div>
                                      <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.38)", letterSpacing: "-0.1px", textAlign: "right" as const, maxWidth: "120px" }}>{item.desc}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />

                            {/* 어떻게 수집할까 */}
                            <div style={{ padding: "18px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                  <path d="M8 2v7.5M5 7l3 3 3-3" stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M3 11.5v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                <span style={{ fontSize: "15px", fontWeight: 640, color: "var(--text)", letterSpacing: "-0.3px" }}>어떻게 수집할까</span>
                              </div>
                              {[
                                { method: "QR 코드 + 카카오폼", tip: "테이블·영수증에 부착. 익명 응답률 최고", badge: "추천" },
                                { method: "종이 피드백 카드", tip: "QR 어색한 손님층 병행 사용" },
                                { method: "퇴장 시 구두 인터뷰", tip: "'가장 아쉬운 점 한 가지만' 단문 질문" },
                              ].map((item, i) => (
                                <div key={i}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)" }} />}
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <span style={{ fontSize: "14px", fontWeight: 450, color: "rgba(0,0,0,0.75)", letterSpacing: "-0.2px" }}>{item.method}</span>
                                      {item.badge && (
                                        <span style={{ fontSize: "10.5px", fontWeight: 600, color: "rgb(0,122,255)", background: "rgba(0,122,255,0.08)", padding: "2px 8px", borderRadius: "100px", letterSpacing: "0" }}>{item.badge}</span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.38)", textAlign: "right" as const, maxWidth: "130px", lineHeight: 1.4 }}>{item.tip}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "0 20px" }} />

                            {/* 어떻게 정리할까 */}
                            <div style={{ padding: "18px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                  <rect x="2" y="9" width="3" height="5" rx="1" fill="rgba(0,0,0,0.55)"/>
                                  <rect x="6.5" y="6" width="3" height="8" rx="1" fill="rgba(0,0,0,0.55)"/>
                                  <rect x="11" y="3" width="3" height="11" rx="1" fill="rgba(0,0,0,0.55)"/>
                                </svg>
                                <span style={{ fontSize: "15px", fontWeight: 640, color: "var(--text)", letterSpacing: "-0.3px" }}>어떻게 정리할까</span>
                              </div>
                              {[
                                { num: "1", label: "항목별 평균 점수", desc: "재방문 3점 미만 → 최우선 개선" },
                                { num: "2", label: "반복 키워드 추출", desc: "주관식 2회 이상 언급 묶기" },
                                { num: "3", label: "즉시 · 1개월 · 장기 분류", desc: "본오픈 전 / 운영 중 / 다음 시즌" },
                              ].map((item, i) => (
                                <div key={i}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)" }} />}
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                      <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(0,0,0,0.25)", width: "14px", textAlign: "center" as const, flexShrink: 0 }}>{item.num}</span>
                                      <span style={{ fontSize: "14px", fontWeight: 450, color: "rgba(0,0,0,0.75)", letterSpacing: "-0.2px" }}>{item.label}</span>
                                    </div>
                                    <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.38)", textAlign: "right" as const, maxWidth: "130px", lineHeight: 1.4 }}>{item.desc}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 사전 준비 */}
                          {renderSection("사전 준비", [
                            { id: "prep-feedback-form", label: "피드백 카드 또는 QR 폼 제작 완료",  detail: "5–7가지 항목으로 간결하게. 무기명으로 솔직한 답변 유도" },
                            { id: "prep-invite-sent",   label: "초대장 발송 완료",                  detail: "날짜·주소·혜택(무료/할인) 명시. 카카오·인스타 DM 활용" },
                            { id: "prep-sns-plan",      label: "당일 SNS 콘텐츠 촬영 계획 수립",   detail: "오픈 전 매장 컷·준비 과정·첫 손님 맞이 순간 등 사전 계획" },
                          ])}
                        </div>
                      )}

                      {/* ── Step 1: 당일 운영 체크리스트 ── */}
                      {softOpenStep === 1 && (() => {
                        const pre  = allDayChecks.slice(0, extraDayChecks.length + 4); // industry + cleanliness/briefing/pos/ambiance
                        const mid  = allDayChecks.filter(c => ["day-observation", "day-payment"].includes(c.id));
                        const post = allDayChecks.filter(c => ["day-feedback-card", "day-debrief", "day-settlement", "day-sns"].includes(c.id));
                        const preItems  = [...extraDayChecks, universalDayChecks[0], universalDayChecks[1], universalDayChecks[2], universalDayChecks[3]];
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {renderSection("오픈 전 준비", preItems)}
                            {renderSection("운영 중 관찰", [universalDayChecks[4], universalDayChecks[5]], "rgb(255,149,0)")}
                            {renderSection("마감 후 정리", [universalDayChecks[6], universalDayChecks[7], universalDayChecks[8], universalDayChecks[9]], "rgb(52,199,89)")}
                          </div>
                        );
                      })()}

                      {/* ── Step 2: 피드백 분석 & 본오픈 준비 ── */}
                      {softOpenStep === 2 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          {renderSection("피드백 수집 확인", allFeedbackItems.map(f => ({ ...f, detail: "" })), "rgb(0,122,255)")}
                          {renderSection("개선 사항 반영", improvementItems, "rgb(255,149,0)")}
                          {/* 본오픈 마케팅 준비 — 건너뜀 옵션 포함 */}
                          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                            <div style={{ padding: "14px 20px 6px" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.35)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>본오픈 마케팅 준비</div>
                            </div>
                            {grandOpeningItems.map((item, i) => {
                              const checked = !!softOpenChecks[item.id];
                              const skipped = !!softOpenSkips[item.id];
                              const accent = "rgb(52,199,89)";
                              return (
                                <div key={item.id}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "56px" }} />}
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", background: skipped ? "rgba(0,0,0,0.02)" : checked ? `${accent}0A` : "white", transition: "background 0.15s" }}>
                                    {/* 체크박스 */}
                                    <div
                                      style={{ flexShrink: 0, marginTop: "2px", width: "22px", height: "22px", borderRadius: "7px", border: checked ? "none" : skipped ? "1.5px solid rgba(0,0,0,0.12)" : "1.5px solid rgba(0,0,0,0.2)", background: checked ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: skipped ? "default" : "pointer", opacity: skipped ? 0.35 : 1 }}
                                      onClick={() => { if (!skipped) setSoftOpenChecks(prev => ({ ...prev, [item.id]: !prev[item.id] })); }}
                                    >
                                      {checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    {/* 텍스트 */}
                                    <div
                                      style={{ flex: 1, cursor: skipped ? "default" : "pointer" }}
                                      onClick={() => { if (!skipped) setSoftOpenChecks(prev => ({ ...prev, [item.id]: !prev[item.id] })); }}
                                    >
                                      <div style={{ fontSize: "14.5px", fontWeight: 500, color: skipped ? "rgba(0,0,0,0.25)" : checked ? "rgba(0,0,0,0.3)" : "var(--text)", textDecoration: checked || skipped ? "line-through" : "none", lineHeight: 1.4, letterSpacing: "-0.2px", transition: "all 0.15s" }}>{item.label}</div>
                                      {item.detail && !checked && !skipped && <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.42)", marginTop: "3px", lineHeight: 1.45 }}>{item.detail}</div>}
                                    </div>
                                    {/* 건너뜀 버튼 */}
                                    {!checked && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSoftOpenSkips(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                                          if (softOpenChecks[item.id]) setSoftOpenChecks(prev => ({ ...prev, [item.id]: false }));
                                        }}
                                        style={{ flexShrink: 0, fontSize: "11.5px", fontWeight: 600, color: skipped ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.28)", background: skipped ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.05)", border: "none", borderRadius: "8px", padding: "4px 9px", cursor: "pointer", whiteSpace: "nowrap" as const, marginTop: "1px", transition: "all 0.15s" }}
                                      >
                                        {skipped ? "취소" : "건너뜀"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  );

}
