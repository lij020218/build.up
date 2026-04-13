"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function PreLaunchFinalStage() {
  const d = useDashboardCtx();
  const { language, industryCategoryId } = d;

                  const isStartupBiz = industryCategoryId === "startup-tech" || d.industryCategoryId === "startup-tech";
                  const isOnlineBiz = industryCategoryId === "online-digital" || d.industryCategoryId === "online-digital";
                  const s = { display: "flex", flexDirection: "column" as const, gap: "6px" };
                  const card = { background: "rgba(0,0,0,0.03)", borderRadius: "14px", padding: "14px 16px" };
                  const secTitle = { fontSize: "12px", fontWeight: 700 as const, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" };
                  const tag = (c: string) => ({ display: "inline-block" as const, fontSize: "11px", fontWeight: 600 as const, padding: "2px 8px", borderRadius: "20px", background: `${c}18`, color: c });
                  const infoR = { display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "13px", lineHeight: 1.5 as const, color: "rgba(0,0,0,0.7)" };
                  const dot = <span style={{ flexShrink: 0, marginTop: "6px", width: "4px", height: "4px", borderRadius: "50%", background: "rgba(0,0,0,0.25)", display: "inline-block" }} />;

                  if (isStartupBiz) return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "8px" }}>
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "론칭 전 최종 점검" : "Pre-launch final checklist"}</div>
                        <div style={card}>
                          {(language === "ko" ? [
                            "프로덕션 환경 배포 + 도메인 연결 완료",
                            "Sentry 에러 모니터링 + Slack 알림 실제 작동 확인",
                            "결제 플로우 테스트 결제 성공 (Stripe 테스트 모드)",
                            "랜딩 페이지 헤드라인·CTA·OG 이미지 최종 확인",
                            "법적 필수 페이지: 이용약관, 개인정보처리방침, 사업자 정보 표시",
                          ] : [
                            "Deploy to production + domain connected",
                            "Sentry error monitoring + Slack alerts verified",
                            "Payment flow test payment success (Stripe test mode)",
                            "Landing page headline, CTA, OG image final check",
                            "Legal pages: Terms of Service, Privacy Policy, business info disclosure",
                          ]).map(p => <div key={p} style={{ ...infoR, marginBottom: "4px" }}>{dot}<span>{p}</span></div>)}
                        </div>
                      </div>
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "론칭 당일 실행 계획" : "Launch day execution"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {(language === "ko" ? [
                            { role: "Product Hunt", task: "론칭 데이 포스트 예약. 태그라인 + 스크린샷 + 메이커 코멘트 준비", color: "#ff6154" },
                            { role: "Hacker News", task: "Show HN 게시글 작성. 기술적 차별점 중심 서술", color: "#ff9f0a" },
                            { role: "직접 초대", task: "인터뷰했던 고객 10명에게 개인 메시지로 론칭 알림", color: "#007aff" },
                            { role: "커뮤니티", task: "Discord/카카오 채널 오픈 공지 + 초기 사용자 피드백 채널", color: "#5865F2" },
                          ] : [
                            { role: "Product Hunt", task: "Schedule launch post. Tagline + screenshots + maker comment", color: "#ff6154" },
                            { role: "Hacker News", task: "Show HN post. Focus on technical differentiation", color: "#ff9f0a" },
                            { role: "Direct outreach", task: "Message 10 interviewed customers personally about launch", color: "#007aff" },
                            { role: "Community", task: "Discord/Kakao channel open announcement + feedback channel", color: "#5865F2" },
                          ]).map(r => (
                            <div key={r.role} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)", alignItems: "flex-start" }}>
                              <span style={tag(r.color)}>{r.role}</span>
                              <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.65)", lineHeight: 1.4, paddingTop: "2px" }}>{r.task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "론칭 전 2주 타임라인" : "2-week pre-launch timeline"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {(language === "ko" ? [
                            { when: "D-14", what: "베타 사용자 5~10명 초대 → 핵심 플로우 테스트 + 피드백 수집", platform: "비공개" },
                            { when: "D-7", what: "Product Hunt 예약 등록 + 랜딩 페이지 공개 + 메일링 리스트 알림", platform: "PH·이메일" },
                            { when: "D-1", what: "최종 배포 + 모든 모니터링 확인 + 팀 역할 분담 (응답·버그 대응)", platform: "내부" },
                            { when: "D-Day", what: "론칭! PH·HN 게시 + SNS 전 채널 공유 + 첫 사용자 실시간 대응", platform: "전 채널" },
                          ] : [
                            { when: "D-14", what: "Invite 5-10 beta users → test core flow + collect feedback", platform: "Private" },
                            { when: "D-7", what: "Schedule PH + publish landing page + notify mailing list", platform: "PH · Email" },
                            { when: "D-1", what: "Final deploy + verify all monitoring + assign team roles", platform: "Internal" },
                            { when: "D-Day", what: "Launch! PH + HN + all social channels + real-time user support", platform: "All" },
                          ]).map(row => (
                            <div key={row.when} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }}>
                              <div style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, color: "#ff9f0a", width: "42px", paddingTop: "2px" }}>{row.when}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>{row.what}</div>
                                <div style={{ fontSize: "11px", color: "var(--muted)" }}>{row.platform}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );

                  /* ── 오프라인/온라인 기존 콘텐츠 ── */
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "8px" }}>

                      {/* ── 초도 발주 전략 ── */}
                      {!isOnlineBiz && <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "초도 발주 & 재고 전략" : "First inventory order strategy"}</div>
                        <div style={card}>
                          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                            {language === "ko" ? "얼마나 주문할까?" : "How much to order?"}
                          </div>
                          {(language === "ko" ? [
                            "오픈 첫 2주 예상 매출의 60~70% 수준으로 발주하세요.",
                            "신선 식재료(채소·육류·유제품)는 3~5일치 이하로 제한하세요.",
                            "포장재·소모품은 1개월치 여유 있게 확보하세요.",
                            "첫 주문 후 실제 소진율을 보고 다음 발주량을 조정하세요.",
                            "재고 손실 허용 마진: 매출의 5~8% 이내로 설정하세요.",
                          ] : [
                            "Order 60–70% of estimated first 2-week sales.",
                            "Cap fresh ingredients (produce, meat, dairy) at 3–5 days supply.",
                            "Stock 1 month of packaging and consumables.",
                            "Adjust next order based on actual turnover from week 1.",
                            "Set waste/loss budget at 5–8% of expected sales.",
                          ]).map((p) => <div key={p} style={{ ...infoR, marginBottom: "4px" }}>{dot}<span>{p}</span></div>)}
                        </div>
                      </div>}

                      {/* ── 오픈 당일 역할 배분 ── */}
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "오픈 당일 역할 배분" : "Opening day roles"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {(language === "ko" ? [
                            { role: "입구·홀 안내", task: "고객 맞이, 웨이팅 관리, 주문 안내", color: "#007aff" },
                            { role: "주문·카운터", task: "POS 결제, 주문 확인, 포장 대응", color: "#34c759" },
                            { role: "주방·제조", task: "음식/음료 제조, 플레이팅, 품질 관리", color: "#ff9f0a" },
                            { role: "서빙·후처리", task: "서빙, 테이블 정리, 재고 보충", color: "#af52de" },
                          ] : [
                            { role: "Door / Floor", task: "Welcome guests, manage wait, seat direction", color: "#007aff" },
                            { role: "Counter / POS", task: "Take orders, process payments, handle packaging", color: "#34c759" },
                            { role: "Kitchen / Prep", task: "Food/drink prep, plating, quality check", color: "#ff9f0a" },
                            { role: "Serving / Cleanup", task: "Serve, clear tables, restock supplies", color: "#af52de" },
                          ]).map((r) => (
                            <div key={r.role} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)", alignItems: "flex-start" }}>
                              <span style={tag(r.color)}>{r.role}</span>
                              <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.65)", lineHeight: 1.4, paddingTop: "2px" }}>{r.task}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", padding: "2px" }}>
                          {language === "ko" ? "1인 운영이라면 주문→제조→서빙 순서를 미리 연습하세요. 첫 러시(rush)가 가장 힘듭니다." : "If running solo, rehearse the order→prep→serve sequence. The first rush is the hardest."}
                        </div>
                      </div>

                      {/* ── SNS 오픈 예고 전략 ── */}
                      <div style={s}>
                        <div style={secTitle}>{language === "ko" ? "SNS 오픈 예고 전략" : "SNS teaser strategy"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {(language === "ko" ? [
                            { when: "오픈 2주 전", what: "매장 공사·세팅 과정 사진/영상 (behind the scenes)", platform: "인스타 릴스" },
                            { when: "오픈 1주 전", what: "메뉴 소개 + 오픈 날짜 공지 + 이벤트(첫 방문 할인 등)", platform: "인스타·카카오" },
                            { when: "오픈 당일", what: "라이브 스토리 + 영수증 이벤트 + 네이버 플레이스 등록 완료", platform: "전 채널" },
                          ] : [
                            { when: "2 weeks before", what: "Behind-the-scenes setup & construction photos/videos", platform: "Instagram Reels" },
                            { when: "1 week before", what: "Menu reveal + opening date + opening event (discount, etc.)", platform: "Instagram · KakaoTalk" },
                            { when: "Opening day", what: "Live stories + receipt event + Naver Place registration complete", platform: "All channels" },
                          ]).map((row) => (
                            <div key={row.when} style={{ display: "flex", gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "rgba(0,0,0,0.03)" }}>
                              <div style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, color: "#ff9f0a", width: "70px", paddingTop: "2px" }}>{row.when}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>{row.what}</div>
                                <div style={{ fontSize: "11px", color: "var(--muted)" }}>{row.platform}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );

}
