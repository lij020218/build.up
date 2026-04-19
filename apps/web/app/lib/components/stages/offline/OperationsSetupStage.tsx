"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  CreditCard, ClipboardList, BarChart2, Bike, Lightbulb,
} from "lucide-react";

export function OperationsSetupStage() {
  const d = useDashboardCtx();
  const {
    language, industryCategoryId, opsStep, setOpsStep,
    opsSelections, setOpsSelections, opsPosChecks, setOpsPosChecks,
    taskMap,
  } = d;

                  type OpsDetail = { id: string; name: string; tagline: string; color: string; url: string; pros: string[]; cons: string[]; icon?: React.ReactNode };

                  const deliveryPlatforms: OpsDetail[] = [
                    {
                      id: "baemin", name: "배달의민족", color: "#00C73C", url: "https://ceo.baemin.com",
                      tagline: "국내 배달앱 점유율 1위 · 월 8,000만 건+",
                      pros: ["국내 점유율 약 60%, 가장 많은 주문량 확보 가능", "사장님 앱으로 메뉴·주문·정산 직관적 관리", "울트라콜·오픈리스트 등 다양한 광고 상품 제공"],
                      cons: ["중개 수수료 6.8% + 결제 수수료 별도", "광고비 경쟁이 치열해 초기 노출 비용 부담 가능"],
                    },
                    {
                      id: "coupangeats", name: "쿠팡이츠", color: "#E52222", url: "https://store.coupangeats.com",
                      tagline: "단건 배달 전문 · 빠른 배달 이미지",
                      pros: ["단건 배달로 배달 품질과 고객 만족도 업계 최고", "쿠팡 브랜드 신뢰도 연계, 신규 고객 유입 용이", "로켓배달 이미지로 속도 중시 고객층 흡수"],
                      cons: ["수수료 약 9.8%로 3사 중 가장 높은 편", "단건 구조라 라이더 확보가 불안정할 수 있음"],
                    },
                    {
                      id: "yogiyo", name: "요기요", color: "#FF5A00", url: "https://partner.yogiyo.co.kr",
                      tagline: "GS리테일 운영 · 요기패스 구독 차별화",
                      pros: ["요기패스 구독 고객에게 우선 노출 혜택", "입점 심사 속도가 비교적 빠른 편", "GS25·GS슈퍼마켓 오프라인 제휴 혜택 연계"],
                      cons: ["시장 점유율 하락 추세 (약 10~15%)", "배민·쿠팡이츠 대비 광고 효율 낮을 수 있음"],
                    },
                    {
                      id: "naver-order", name: "네이버 주문", color: "#03C75A", url: "https://new.smartplace.naver.com",
                      tagline: "스마트플레이스 연동 · 검색 노출 시너지",
                      pros: ["네이버 지도·검색 결과에 주문 버튼 자동 연동", "포장·예약 주문 수요에 강점", "중개 수수료 없음, 결제 수수료만 부담"],
                      cons: ["자체 배달망 없어 외부 라이더 서비스 별도 연동 필요", "배달 기능보다 포장·테이블 주문에 더 적합"],
                    },
                  ];

                  const posSystems: OpsDetail[] = [
                    {
                      id: "toss",  name: "토스페이먼츠", color: "#1A6CF6", url: "https://www.tosspayments.com",
                      tagline: "간편 설치 · 정산 D+1 · 스타트업 최다 선택",
                      pros: ["단말기 무료 제공, 설치·설정 30분 이내 완료", "정산이 다음날 입금(D+1)으로 현금 흐름 유리", "카드·간편결제(카카오·네이버·애플페이) 한 번에 처리", "대시보드에서 매출 통계·정산 내역 실시간 확인"],
                      cons: ["재고 관리·주방 디스플레이 등 고급 기능 없음", "배달앱 연동은 추가 솔루션 필요"],
                    },
                    {
                      id: "kis",   name: "KIS정보통신", color: "#1E3A8A", url: "https://www.kisinfo.co.kr",
                      tagline: "국내 POS 시장 1위 · 전국 A/S망",
                      pros: ["전국 방문 A/S망으로 고장 시 빠른 처리", "배달의민족·쿠팡이츠 주문 자동 수신 연동", "업종별 전용 모듈 (카페·음식점·소매 등)"],
                      cons: ["초기 구매 또는 렌탈 비용 발생 (월 3~8만원)", "UI가 구식, 익히는 데 시간 소요"],
                    },
                    {
                      id: "orderplace", name: "오더플레이스", color: "#00B85E", url: "https://www.orderplace.co.kr",
                      tagline: "F&B 특화 태블릿 POS · 배달앱 연동 강점",
                      pros: ["배달앱 3사(배민·쿠팡이츠·요기요) 주문 통합 수신", "테이블 관리·주방 디스플레이(KDS) 연동", "태블릿 기반으로 공간 유연성 높음"],
                      cons: ["월 구독료 발생 (약 3~5만원)", "소매·서비스업보다 F&B 업종에 특화"],
                    },
                    {
                      id: "smartro", name: "스마트로", color: "#FF6B2B", url: "https://www.smartro.co.kr",
                      tagline: "소규모 매장 특화 · 간단 카드 단말기",
                      pros: ["카드 단말기 위주로 초기 비용 최소화 가능", "VAN 수수료 기반, 별도 월정액 없음", "소규모 단일 업장에 최적화"],
                      cons: ["재고·메뉴 관리 등 POS 고급 기능 부족", "배달앱 연동·주방 디스플레이 없음"],
                    },
                    {
                      id: "ipos", name: "아임포스", color: "#7C3AED", url: "https://www.ipos.co.kr",
                      tagline: "태블릿 기반 저비용 POS · 통계 기능 포함",
                      pros: ["초기 비용 최소화, 태블릿 + 앱으로 즉시 시작", "배달앱 연동, 매출 통계, 재고 관리 기본 제공", "요금제가 다양해 규모에 맞게 선택 가능"],
                      cons: ["고급 기능(주방 디스플레이 등)은 유료 업그레이드", "대형 매장 멀티 단말 환경에는 비적합"],
                    },
                  ];

                  const posChecks: Array<{ id: string; label: string; detail: string; hint: string }> = [
                    { id: "menu-check",       label: "메뉴·상품 전체 등록 및 가격 확인",  detail: "옵션, 추가 금액, 품절 여부까지 전체 점검", hint: "POS에서 직접 주문 1건 넣어보며 흐름 확인" },
                    { id: "payment-check",    label: "카드 실결제 1건 테스트",            detail: "실제 카드로 결제 후 즉시 취소 처리",        hint: "취소 처리 안 하면 오픈 전 매출로 잡힘" },
                    { id: "receipt-check",    label: "영수증 출력 및 내용 확인",          detail: "사업자명, 사업자번호, 부가세 금액 정확한지", hint: "세금계산서 발행 시 이 정보가 기준이 됨" },
                    { id: "settlement-check", label: "일 마감·정산 시뮬레이션",          detail: "정산 금액 = 실 매출 합계인지 비교",          hint: "오픈 후 정산 오류 발생 시 수정 복잡함" },
                  ];

                  const snsChannels: OpsDetail[] = [
                    {
                      id: "instagram", name: "인스타그램 비즈니스", color: "#C13584", url: "https://business.instagram.com",
                      tagline: "비주얼 마케팅 핵심 · 팔로워 기반 단골화",
                      pros: ["F&B·뷰티·라이프 업종 SNS 마케팅 1위 채널", "릴스·스토리로 콘텐츠 비용 대비 바이럴 효과 탁월", "팔로워가 곧 단골 — 재방문율과 객단가에 직결"],
                      cons: ["지속적인 콘텐츠 업로드 없으면 알고리즘 노출 감소", "팔로워 0에서 시작, 성과 나오기까지 2~3개월 소요"],
                      icon: (
                        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <radialGradient id="ig-a" cx="0.35" cy="1.08" r="1.4" gradientUnits="objectBoundingBox">
                              <stop offset="0" stopColor="#FFD676"/>
                              <stop offset="0.25" stopColor="#F4A51C"/>
                              <stop offset="0.5" stopColor="#F15245"/>
                              <stop offset="0.75" stopColor="#D92E7F"/>
                              <stop offset="1" stopColor="#9B36B7"/>
                            </radialGradient>
                            <radialGradient id="ig-b" cx="0.15" cy="-0.08" r="0.6" gradientUnits="objectBoundingBox">
                              <stop offset="0" stopColor="#4168C9"/>
                              <stop offset="1" stopColor="#4168C9" stopOpacity="0"/>
                            </radialGradient>
                          </defs>
                          <rect width="42" height="42" fill="url(#ig-a)"/>
                          <rect width="42" height="42" fill="url(#ig-b)"/>
                          <rect x="8" y="8" width="26" height="26" rx="6" stroke="white" strokeWidth="2.5" fill="none"/>
                          <circle cx="21" cy="21" r="6.5" stroke="white" strokeWidth="2.5" fill="none"/>
                          <circle cx="29.5" cy="12.5" r="1.8" fill="white"/>
                        </svg>
                      ),
                    },
                    {
                      id: "naver-place", name: "네이버 플레이스", color: "#03C75A", url: "https://new.smartplace.naver.com",
                      tagline: "한국인 검색→방문 핵심 채널 · 리뷰 통합",
                      pros: ["'맛집 검색'의 80%가 네이버로, 미등록 시 검색 자체 불가", "예약·리뷰·메뉴·영업시간 한 곳에서 통합 관리", "스마트콜 연동으로 전화 발신 지역 분석 가능"],
                      cons: ["등록 후 검색 노출까지 최대 7일 소요 — 오픈 1주 전 등록 필수", "리뷰 관리 소홀 시 별점 하락이 방문율에 즉각 영향"],
                      icon: (
                        <svg width="42" height="42" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <rect width="24" height="24" fill="#03C75A"/>
                          <path d="M5 6H8.4L13.6 14V6H19V18H15.6L10.4 10V18H5V6Z" fill="white"/>
                        </svg>
                      ),
                    },
                    {
                      id: "kakao-channel", name: "카카오 채널", color: "#F9E000", url: "https://ch.kakao.com",
                      tagline: "카카오톡 직접 발송 · 카카오맵 연동",
                      pros: ["단골 고객에게 카카오톡 메시지 직접 발송 가능", "카카오맵 장소 노출, 예약·상담 채팅 기능 기본 제공", "채널 개설 자체는 무료"],
                      cons: ["친구(팔로워) 유치가 어렵고 초기 메시지 도달 제한", "메시지 발송 건당 비용 발생 (건당 약 15~30원)"],
                      icon: (
                        <svg width="42" height="42" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <rect width="24" height="24" fill="#FAE100"/>
                          <ellipse cx="12" cy="11.5" rx="7.5" ry="6" fill="#3C1E1E"/>
                          <polygon points="10,17 8,21.5 14,18.5" fill="#3C1E1E"/>
                        </svg>
                      ),
                    },
                    {
                      id: "google-business", name: "구글 비즈니스", color: "#4285F4", url: "https://business.google.com/ko",
                      tagline: "구글 검색·지도 노출 · 외국인 고객 필수",
                      pros: ["구글맵 노출로 외국인 관광객 접근성 업계 최고", "무료 운영, 리뷰·Q&A·예약·메시지 연동", "구글 검색 '내 주변 가게' 결과에 자동 노출"],
                      cons: ["국내 이용률은 네이버 대비 낮음 (내국인 검색 효과 제한)", "허위 리뷰 대응 절차가 복잡한 편"],
                      icon: (
                        <svg width="42" height="42" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <rect width="24" height="24" fill="white"/>
                          <path fill="#4285F4" d="M21.8 12.2c0-.72-.06-1.42-.18-2.09H12v3.95h5.47c-.24 1.27-.96 2.35-2.04 3.07v2.55h3.3c1.94-1.78 3.07-4.41 3.07-7.48z"/>
                          <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.3-2.56c-.9.6-2.05.95-3.31.95-2.54 0-4.7-1.71-5.47-4.02H3.13v2.64C4.76 19.89 8.18 22 12 22z"/>
                          <path fill="#FBBC05" d="M6.53 13.94c-.2-.6-.31-1.24-.31-1.94s.11-1.34.31-1.94V7.42H3.13A9.97 9.97 0 002 12c0 1.61.39 3.14 1.07 4.5l3.46-2.56z"/>
                          <path fill="#EA4335" d="M12 6.04c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.95 3.09 14.7 2 12 2 8.18 2 4.76 4.11 3.13 7.42l3.4 2.64C7.3 7.75 9.46 6.04 12 6.04z"/>
                        </svg>
                      ),
                    },
                  ];

                  const steps = [
                    { key: "delivery", title: language === "ko" ? "배달앱 입점 등록" : "Delivery App Registration",    subtitle: language === "ko" ? "첫 주문이 들어오는 채널을 오픈 전에 열어두세요. 심사에 2~5 영업일 소요됩니다." : "Open your order channels before launch. Approval takes 2–5 business days.", taskId: "delivery-app-registered" },
                    { key: "pos",      title: language === "ko" ? "POS 실거래 테스트" : "POS Live Test",              subtitle: language === "ko" ? "오픈 전날 완료 강력 권장. 실결제 테스트 후 반드시 즉시 취소 처리하세요." : "Strongly recommended the day before opening. Cancel the test transaction immediately.", taskId: "pos-live" },
                    { key: "sns",      title: language === "ko" ? "SNS·플레이스 채널 개설" : "SNS & Place Setup",     subtitle: language === "ko" ? "네이버 플레이스는 노출까지 최대 7일 — 지금 바로 등록하세요." : "Naver Place takes up to 7 days to appear in search — register now.", taskId: "sns-setup" },
                  ];

                  const currentOpsStep = steps[opsStep];
                  const tasks = taskMap["operations-setup"] ?? [];
                  const isTaskDone = (id: string) => tasks.find(t => t.taskId === id)?.status === "completed";

                  const renderDetail = (items: OpsDetail[], prefix: string) => (
                    <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                      {items.map((item, i) => {
                        const isSelected = !!opsSelections[`${prefix}-${item.id}`];
                        const isDark = item.color === "#F9E000";
                        return (
                          <div key={item.id}>
                            {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)" }} />}
                            {/* 메인 행 */}
                            <div
                              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "15px 20px 10px", cursor: "pointer", background: isSelected ? "rgba(0,122,255,0.04)" : "white", transition: "background 0.15s" }}
                              onClick={() => setOpsSelections(prev => ({ ...prev, [`${prefix}-${item.id}`]: !prev[`${prefix}-${item.id}`] }))}
                            >
                              <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: isSelected ? "rgb(0,122,255)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                                {isSelected && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                              {item.icon ? (
                                <div style={{ width: "42px", height: "42px", borderRadius: "12px", flexShrink: 0, overflow: "hidden", boxShadow: `0 3px 10px ${item.color}50` }}>
                                  {item.icon}
                                </div>
                              ) : (
                                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: item.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 3px 10px ${item.color}50` }}>
                                  <span style={{ fontSize: "18px", fontWeight: 800, color: isDark ? "rgba(0,0,0,0.7)" : "white" }}>{item.name.charAt(0)}</span>
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "15px", fontWeight: isSelected ? 650 : 590, color: isSelected ? "rgb(0,122,255)" : "var(--text)", letterSpacing: "-0.3px" }}>{item.name}</div>
                                <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", marginTop: "1px" }}>{item.tagline}</div>
                              </div>
                              <a href={item.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.35)", textDecoration: "none" }}>
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </a>
                            </div>
                            {/* 장단점 */}
                            <div style={{ padding: "0 20px 14px 78px" }}>
                              {item.pros.map((pro, pi) => (
                                <div key={pi} style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "4px" }}>
                                  <span style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, color: "rgb(34,167,73)", marginTop: "1px" }}>✓</span>
                                  <span style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.45 }}>{pro}</span>
                                </div>
                              ))}
                              {item.cons.map((con, ci) => (
                                <div key={ci} style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "4px" }}>
                                  <span style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, color: "rgb(210,120,0)", marginTop: "1px" }}>—</span>
                                  <span style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.42)", lineHeight: 1.45 }}>{con}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );

                  const renderPos = () => {
                    const checkedCount = posChecks.filter(c => opsPosChecks[c.id]).length;
                    const selectedPosSystem = posSystems.find(s => opsSelections[`pos-system-${s.id}`]);
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                        {/* ── POS란? ── */}
                        <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                          <div style={{ padding: "18px 20px 6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(88,86,214,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2.5" width="11" height="7.5" rx="1.5" stroke="rgb(88,86,214)" strokeWidth="1.3"/><path d="M4.5 10.5v1M9.5 10.5v1M3 11.5h8" stroke="rgb(88,86,214)" strokeWidth="1.3" strokeLinecap="round"/></svg>
                              </div>
                              <span style={{ fontSize: "13px", fontWeight: 680, color: "rgb(88,86,214)", letterSpacing: "-0.1px" }}>POS란?</span>
                            </div>
                            {([
                              { Icon: CreditCard,   color: "rgb(0,122,255)",   bg: "rgba(0,122,255,0.1)",   text: language === "ko" ? "결제 처리 — 카드·현금·간편결제를 한 단말에서 처리하고 자동 정산" : "Payment processing — card, cash, and mobile pay in one terminal" },
                              { Icon: ClipboardList, color: "rgb(255,149,0)",  bg: "rgba(255,149,0,0.1)",   text: language === "ko" ? "메뉴·재고 관리 — 상품 등록, 품절 처리, 재고 수량 추적" : "Menu & inventory management — item registration, sold-out, stock tracking" },
                              { Icon: BarChart2,    color: "rgb(52,199,89)",   bg: "rgba(52,199,89,0.12)",  text: language === "ko" ? "매출 통계 — 시간대별·메뉴별 매출, 일·월 정산 리포트 자동 생성" : "Sales analytics — hourly/item sales, daily/monthly settlement reports" },
                              { Icon: Bike,         color: "rgb(88,86,214)",   bg: "rgba(88,86,214,0.1)",   text: language === "ko" ? "배달앱 연동 — 배민·쿠팡이츠 주문이 POS로 자동 수신 (제품마다 다름)" : "Delivery integration — auto-receive Baemin/CoupangEats orders (varies by product)" },
                            ] as const).map(({ Icon, color, bg, text }, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "11px 0", borderTop: "0.5px solid rgba(0,0,0,0.07)" }}>
                                <div style={{ flexShrink: 0, width: "36px", height: "36px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Icon size={17} strokeWidth={1.6} color={color} />
                                </div>
                                <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)", lineHeight: 1.5 }}>{text}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ padding: "12px 20px", background: "rgba(88,86,214,0.04)", borderTop: "0.5px solid rgba(88,86,214,0.1)" }}>
                            <span style={{ fontSize: "12px", color: "rgba(88,86,214,0.75)", lineHeight: 1.5 }}>
                              {language === "ko" ? "업종에 따라 필요한 기능이 다릅니다. 아래에서 내 업종에 맞는 제품을 골라보세요." : "Different businesses need different features. Choose the right product below."}
                            </span>
                          </div>
                        </div>

                        {/* ── POS 시스템 선택 ── */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                              {language === "ko" ? "POS 시스템 선택" : "Choose a POS System"}
                            </span>
                            {selectedPosSystem && (
                              <span style={{ fontSize: "11px", fontWeight: 650, color: "rgb(0,122,255)", background: "rgba(0,122,255,0.1)", padding: "2px 9px", borderRadius: "100px" }}>
                                {selectedPosSystem.name} {language === "ko" ? "선택됨" : "selected"}
                              </span>
                            )}
                          </div>
                          {renderDetail(posSystems, "pos-system")}
                        </div>

                        {/* ── 실거래 테스트 체크리스트 ── */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 650, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                              {language === "ko" ? "실거래 테스트 체크리스트" : "Live Test Checklist"}
                            </span>
                            {checkedCount === posChecks.length
                              ? <span style={{ fontSize: "11px", fontWeight: 650, color: "rgb(34,167,73)", background: "rgba(52,199,89,0.12)", padding: "2px 9px", borderRadius: "100px" }}>✓ {language === "ko" ? "완료" : "Done"}</span>
                              : <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.35)" }}>{checkedCount} / {posChecks.length}</span>
                            }
                          </div>
                          <div style={{ height: "3px", borderRadius: "100px", background: "rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: "10px" }}>
                            <div style={{ height: "100%", width: `${(checkedCount / posChecks.length) * 100}%`, background: "rgb(52,199,89)", borderRadius: "100px", transition: "width 0.35s ease" }} />
                          </div>
                          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
                            {posChecks.map((check, i) => {
                              const checked = !!opsPosChecks[check.id];
                              return (
                                <div key={check.id}>
                                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "58px" }} />}
                                  <div
                                    style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: checked ? "rgba(52,199,89,0.03)" : "white", transition: "background 0.15s" }}
                                    onClick={() => setOpsPosChecks(prev => ({ ...prev, [check.id]: !prev[check.id] }))}
                                  >
                                    <div style={{ flexShrink: 0, marginTop: "2px", width: "22px", height: "22px", borderRadius: "7px", border: checked ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: checked ? "rgb(52,199,89)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                                      {checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: "15px", fontWeight: 500, color: checked ? "rgba(0,0,0,0.3)" : "var(--text)", textDecoration: checked ? "line-through" : "none", letterSpacing: "-0.2px", transition: "all 0.15s" }}>{check.label}</div>
                                      <div style={{ fontSize: "12.5px", color: checked ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.45)", marginTop: "3px", lineHeight: 1.45 }}>{check.detail}</div>
                                      {!checked && (
                                        <div style={{ fontSize: "11.5px", color: "rgba(180,100,0,0.85)", marginTop: "6px", padding: "5px 10px", borderRadius: "8px", background: "rgba(255,149,0,0.07)", lineHeight: 1.4, display: "flex", alignItems: "flex-start", gap: "6px" }}>
                                          <Lightbulb size={12} strokeWidth={1.5} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
                                          <span>{check.hint}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    );
                  };

                  return (
                    <div style={{ marginBottom: "20px" }}>
                      {/* 네비게이션 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                        <button
                          type="button"
                          style={{ fontSize: "14px", fontWeight: 580, color: opsStep === 0 ? "transparent" : "rgba(0,0,0,0.45)", background: "none", border: "none", cursor: opsStep === 0 ? "default" : "pointer", padding: "8px 4px", pointerEvents: opsStep === 0 ? "none" : "auto" }}
                          onClick={() => setOpsStep(s => s - 1)}
                        >← {language === "ko" ? "이전" : "Back"}</button>
                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} onClick={() => setOpsStep(i)} style={{ width: i === opsStep ? "20px" : "6px", height: "6px", borderRadius: "100px", background: i === opsStep ? "rgb(0,122,255)" : "rgba(17,17,17,0.15)", cursor: "pointer", transition: "width 0.2s ease" }} />
                          ))}
                        </div>
                        <button
                          type="button"
                          style={{ fontSize: "14px", fontWeight: 580, color: opsStep === 2 ? "transparent" : "rgba(0,0,0,0.45)", background: "none", border: "none", cursor: opsStep === 2 ? "default" : "pointer", padding: "8px 4px", pointerEvents: opsStep === 2 ? "none" : "auto" }}
                          onClick={() => setOpsStep(s => s + 1)}
                        >{language === "ko" ? "다음" : "Next"} →</button>
                      </div>

                      {/* 헤더 */}
                      <div style={{ marginBottom: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }}>
                          <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: isTaskDone(currentOpsStep.taskId) ? "rgba(52,199,89,0.14)" : "rgba(0,122,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {isTaskDone(currentOpsStep.taskId)
                              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4.5" stroke="rgb(34,167,73)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              : <span style={{ fontSize: "11px", fontWeight: 750, color: "rgb(0,122,255)", letterSpacing: "-0.5px" }}>0{opsStep + 1}</span>
                            }
                          </div>
                          <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 660, letterSpacing: "-0.5px", color: "var(--text)" }}>{currentOpsStep.title}</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(0,0,0,0.48)", lineHeight: 1.55, paddingLeft: "40px" }}>{currentOpsStep.subtitle}</p>
                      </div>

                      {/* 컨텐츠 */}
                      {opsStep === 0 && renderDetail(deliveryPlatforms, "delivery")}
                      {opsStep === 1 && renderPos()}
                      {opsStep === 2 && renderDetail(snsChannels, "sns")}

                    </div>
                  );

}
