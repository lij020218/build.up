"use client";

import { Lightbulb } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";

export function PreLaunchFinalStage() {
  const d = useDashboardCtx();
  const { language, industryCategoryId, guideStepIndex, setGuideStepIndex } = d;
  const ko = language === "ko";
  const isStartup = industryCategoryId === "startup-tech";
  const isOnline = industryCategoryId === "online-digital";
  const pg = guideStepIndex;
  const totalPg = 4;

  const pgLabels = isStartup
    ? (ko ? ["왜 중요한가", "론칭 전 점검", "론칭 당일 실행", "2주 타임라인"] : ["Why", "Pre-check", "Launch Day", "Timeline"])
    : isOnline
      ? (ko ? ["왜 중요한가", "오픈 전 점검", "첫 주문 대비", "홍보 전략"] : ["Why", "Pre-check", "First Orders", "Marketing"])
      : (ko ? ["왜 중요한가", "오픈 전 점검", "오픈 당일 운영", "홍보 전략"] : ["Why", "Pre-check", "Opening Day", "Marketing"]);

  const linkStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "4px",
    fontSize: "12px", fontWeight: 600, textDecoration: "none",
    padding: "5px 12px", borderRadius: "8px",
  };
  const cardStyle: React.CSSProperties = { padding: "12px 14px", borderRadius: "12px" };
  const dotEl = <span style={{ flexShrink: 0, marginTop: "6px", width: "5px", height: "5px", borderRadius: "50%", display: "inline-block" }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* ── 페이지 네비 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex((p: number) => p - 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
        }}>← {ko ? "이전" : "Prev"}</button>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
          {pgLabels.map((l, i) => (
            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
              padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: i === pg ? 700 : 500,
              background: i === pg ? "#dc2626" : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.4)",
              border: "none", cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>
        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex((p: number) => p + 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(29,53,87,0.08)",
          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : "white", color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
        }}>{ko ? "다음" : "Next"} →</button>
      </div>

      {/* ══════════ Page 0: 왜 중요한가 ══════════ */}
      {pg === 0 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(220,38,38,0.08)", background: "linear-gradient(180deg, rgba(220,38,38,0.02) 0%, rgba(255,255,255,0.98) 100%)", overflow: "hidden" }}>
        <div style={{ padding: "20px 22px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ko ? "가장 중요한 단계" : "Most critical stage"}</span>
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, marginBottom: "8px" }}>
            {isStartup
              ? (ko ? "론칭 당일의 준비 수준이 초기 견인력(Traction)을 결정합니다." : "Launch day prep determines your initial traction.")
              : isOnline
                ? (ko ? "첫 주문 처리 실패는 리뷰 악화와 플랫폼 패널티로 이어집니다." : "Failed first orders lead to bad reviews and platform penalties.")
                : (ko ? "오픈 당일 준비 부족은 첫 고객 경험을 망가뜨리고, 리뷰로 남습니다." : "Poor opening-day prep ruins first impressions — and stays as reviews.")}
          </div>
          <div style={{ fontSize: "13px", color: "rgba(15,23,42,0.55)", lineHeight: 1.65 }}>
            {isStartup
              ? (ko ? "Product Hunt 1위 달성 팀의 공통점: 론칭 1개월 전부터 준비, 베타 사용자 10명 이상 확보, 모든 모니터링 실시간 작동. 론칭은 코드 배포가 아니라 '이벤트 운영'입니다. 실시간 대응 체계가 없으면 첫 사용자를 영구히 잃습니다." : "PH #1 teams share: prep starts 1 month before, 10+ beta users secured, all monitoring live. Launch is event management, not deployment.")
              : isOnline
                ? (ko ? "첫 주문이 들어왔는데 택배 박스가 없거나 송장 프린터가 안 되면? 첫 리뷰가 1점이 됩니다. 실제로 주문→포장→발송 워크플로를 테스트하고, 반품·교환 시나리오까지 시뮬레이션하세요." : "No boxes when the first order arrives? That's a 1-star review. Test the full order→pack→ship workflow, including returns.")
                : (ko ? "카드 단말기가 안 되는데 첫 손님이 카드로 결제하려 한다면? 직원이 역할을 모르면? 실제 결제·주문·서빙을 사전 리허설하세요. 가장 당황스러운 사고는 카드 단말기와 Wi-Fi 끊김입니다." : "Card terminal down when the first customer tries to pay? Run full payment, order, and serving rehearsals. The most common disaster: card terminals and Wi-Fi outages.")}
          </div>
        </div>
        <div style={{ padding: "0 22px 18px" }}>
          <div style={{ padding: "10px 14px", borderRadius: "12px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.08)" }}>
            <div style={{ fontSize: "12px", fontWeight: 650, color: "#dc2626" }}>
              {isStartup
                ? (ko ? "⚠ 론칭 실패 후 재론칭은 Product Hunt에서 불가. Hacker News는 중복 게시하면 밴. 한 번에 제대로 해야 합니다." : "⚠ Re-launch is not allowed on Product Hunt. HN bans duplicate posts. You get one shot.")
                : isOnline
                  ? (ko ? "⚠ 네이버 스마트스토어 초기 리뷰 3개가 이후 노출 순위를 결정합니다. 첫 고객 경험이 곧 생존입니다." : "⚠ First 3 Naver reviews determine future search ranking. First customer experience = survival.")
                  : (ko ? "⚠ 네이버 플레이스 초기 리뷰 3개가 이후 노출 순위를 결정합니다. 첫 고객 경험이 곧 생존입니다." : "⚠ First 3 Naver Place reviews determine future ranking. First impression = survival.")}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ══════════ Page 1: 론칭/오픈 전 최종 점검 ══════════ */}
      {pg === 1 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(37,99,235,0.08)", background: "linear-gradient(180deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
          {isStartup ? (ko ? "론칭 전 최종 점검" : "Pre-Launch Checklist") : (ko ? "오픈 전 최종 점검" : "Pre-Opening Checklist")}
        </div>
        <div style={{ display: "grid", gap: "6px" }}>
          {(isStartup ? (ko ? [
            { item: "프로덕션 환경 배포 + 도메인 연결 완료", priority: "필수", color: "#dc2626" },
            { item: "Sentry 에러 모니터링 + Slack 알림 실제 작동 확인", priority: "필수", color: "#dc2626" },
            { item: "결제 플로우 실제 테스트 결제 성공 (Stripe/토스페이먼츠)", priority: "필수", color: "#dc2626" },
            { item: "랜딩 페이지: 헤드라인·CTA·OG 이미지 최종 확인", priority: "필수", color: "#dc2626" },
            { item: "이용약관 + 개인정보처리방침 + 사업자 정보 표시", priority: "법적 필수", color: "#dc2626" },
            { item: "Google Analytics / Mixpanel 이벤트 트래킹 작동 확인", priority: "권장", color: "#d97706" },
            { item: "모바일 반응형 + 주요 브라우저 크로스 테스트", priority: "권장", color: "#d97706" },
            { item: "고객 피드백 채널 오픈 (Discord/카카오/이메일)", priority: "권장", color: "#d97706" },
          ] : [
            { item: "Production deploy + domain connected", priority: "Required", color: "#dc2626" },
            { item: "Error monitoring (Sentry) + Slack alerts verified", priority: "Required", color: "#dc2626" },
            { item: "Payment flow test success (Stripe/Toss)", priority: "Required", color: "#dc2626" },
            { item: "Landing: headline, CTA, OG image final check", priority: "Required", color: "#dc2626" },
            { item: "Legal: Terms, Privacy Policy, business info", priority: "Legal", color: "#dc2626" },
            { item: "Analytics event tracking verified", priority: "Recommended", color: "#d97706" },
            { item: "Mobile responsive + cross-browser test", priority: "Recommended", color: "#d97706" },
            { item: "Feedback channel open (Discord/email)", priority: "Recommended", color: "#d97706" },
          ]) : isOnline ? (ko ? [
            { item: "스토어 카테고리·배너·반품정책 최종 확인", priority: "필수", color: "#dc2626" },
            { item: "실제 주문→포장→송장출력→발송 워크플로 테스트", priority: "필수", color: "#dc2626" },
            { item: "포장재 충분히 확보 (박스·완충재·테이프·송장 프린터)", priority: "필수", color: "#dc2626" },
            { item: "반품·교환·환불 시나리오 시뮬레이션", priority: "필수", color: "#dc2626" },
            { item: "CS 채널 오픈 (카카오톡 채널/네이버 톡톡)", priority: "필수", color: "#dc2626" },
            { item: "상세 페이지 모바일 미리보기 최종 확인", priority: "권장", color: "#d97706" },
            { item: "초도 재고 입고 완료 + 재고 수량 시스템 등록", priority: "권장", color: "#d97706" },
            { item: "택배사 집하 시간·장소 확인", priority: "권장", color: "#d97706" },
          ] : [
            { item: "Store categories, banners, return policy finalized", priority: "Required", color: "#dc2626" },
            { item: "Full order→pack→label→ship workflow tested", priority: "Required", color: "#dc2626" },
            { item: "Packaging supplies secured (boxes, wrap, tape, printer)", priority: "Required", color: "#dc2626" },
            { item: "Return/exchange/refund scenarios simulated", priority: "Required", color: "#dc2626" },
            { item: "CS channel open (KakaoTalk/Naver TalkTalk)", priority: "Required", color: "#dc2626" },
            { item: "Product page mobile preview confirmed", priority: "Recommended", color: "#d97706" },
            { item: "Initial inventory received + registered", priority: "Recommended", color: "#d97706" },
            { item: "Courier pickup time/location confirmed", priority: "Recommended", color: "#d97706" },
          ]) : (ko ? [
            { item: "카드 단말기 실제 결제·취소·영수증 출력 테스트", priority: "필수", color: "#dc2626" },
            { item: "Wi-Fi + 인터넷 안정성 확인 (백업 핫스팟 준비)", priority: "필수", color: "#dc2626" },
            { item: "POS 메뉴·가격 등록 + 테스트 주문 처리", priority: "필수", color: "#dc2626" },
            { item: "초도 재고·식재료 발주 및 입고 완료", priority: "필수", color: "#dc2626" },
            { item: "위생 점검: 냉장고 온도·조리대 살균·직원 위생복", priority: "필수", color: "#dc2626" },
            { item: "전기·가스·수도·환기 시스템 최종 작동 확인", priority: "필수", color: "#dc2626" },
            { item: "간판·메뉴판·가격표 설치 완료", priority: "권장", color: "#d97706" },
            { item: "네이버 플레이스 등록 + 카카오맵 정보 수정", priority: "권장", color: "#d97706" },
          ] : [
            { item: "Card terminal: real payment, cancel, receipt test", priority: "Required", color: "#dc2626" },
            { item: "Wi-Fi stability (backup hotspot ready)", priority: "Required", color: "#dc2626" },
            { item: "POS menu/pricing + test order processing", priority: "Required", color: "#dc2626" },
            { item: "First inventory/ingredient order received", priority: "Required", color: "#dc2626" },
            { item: "Hygiene: fridge temp, sanitized surfaces, uniforms", priority: "Required", color: "#dc2626" },
            { item: "Utilities: electric, gas, water, ventilation checked", priority: "Required", color: "#dc2626" },
            { item: "Signage, menu board, price list installed", priority: "Recommended", color: "#d97706" },
            { item: "Naver Place + KakaoMap listing registered", priority: "Recommended", color: "#d97706" },
          ])).map(({ item, priority, color }) => (
            <div key={item} style={{ display: "flex", gap: "10px", alignItems: "flex-start", ...cardStyle, background: `${color}03`, border: `1px solid ${color}08` }}>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${color}10`, color, flexShrink: 0, marginTop: "2px" }}>{priority}</span>
              <span style={{ fontSize: "13px", color: "#0f172a", lineHeight: 1.5, fontWeight: 500 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ══════════ Page 2: 당일 실행 / 첫 주문 대비 ══════════ */}
      {pg === 2 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(5,150,105,0.08)", background: "linear-gradient(180deg, rgba(5,150,105,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
          {isStartup ? (ko ? "론칭 당일 실행 계획" : "Launch Day Execution") : isOnline ? (ko ? "첫 주문 대비" : "First Order Prep") : (ko ? "오픈 당일 역할 배분" : "Opening Day Roles")}
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {(isStartup ? (ko ? [
            { role: "Product Hunt", task: "론칭 데이 포스트. 태그라인 + 스크린샷 5장 + 메이커 코멘트. 태평양 시간 00:01에 게시", color: "#ff6154" },
            { role: "Hacker News", task: "Show HN 게시글. 기술적 차별점 중심. 솔직한 톤 필수 (마케팅 톤은 다운보트)", color: "#ff9f0a" },
            { role: "직접 초대", task: "인터뷰했던 고객 10명에게 개인 메시지 — '드디어 만들었습니다'", color: "#007aff" },
            { role: "커뮤니티", task: "Discord/카카오 채널 오픈 공지 + 초기 피드백 전담 채널 생성", color: "#5865F2" },
            { role: "실시간 대응", task: "버그 대응 1명 + 고객 응대 1명 + 마케팅 1명 역할 분담 (솔로면 우선순위: 버그>고객>마케팅)", color: "#dc2626" },
          ] : [
            { role: "Product Hunt", task: "Launch post at 00:01 PT. Tagline + 5 screenshots + maker comment", color: "#ff6154" },
            { role: "Hacker News", task: "Show HN: technical differentiation. Honest tone (marketing = downvotes)", color: "#ff9f0a" },
            { role: "Direct", task: "Personal message to 10 interviewed customers", color: "#007aff" },
            { role: "Community", task: "Discord/Kakao open + dedicated feedback channel", color: "#5865F2" },
            { role: "Live ops", task: "Bug fix + CS + marketing role split (solo priority: bugs>CS>marketing)", color: "#dc2626" },
          ]) : isOnline ? (ko ? [
            { role: "주문 확인", task: "알림 즉시 확인 → 주문 상세 검토 → 재고 차감", color: "#007aff" },
            { role: "포장", task: "상품 검수 → 완충재 포장 → 송장 부착 → 사진 촬영 (분쟁 대비)", color: "#34c759" },
            { role: "발송", task: "택배 집하 시간 전 마감 → 발송 처리 + 운송장 번호 입력", color: "#ff9f0a" },
            { role: "CS 대응", task: "배송 문의·교환·환불 시나리오별 답변 템플릿 준비", color: "#af52de" },
            { role: "재고 체크", task: "당일 판매량 기록 → 부족 상품 재발주 → 재고 수량 업데이트", color: "#dc2626" },
          ] : [
            { role: "Order check", task: "Immediate notification → review details → deduct inventory", color: "#007aff" },
            { role: "Packing", task: "Inspect → wrap → label → photo (for disputes)", color: "#34c759" },
            { role: "Shipping", task: "Complete before pickup deadline → enter tracking", color: "#ff9f0a" },
            { role: "CS", task: "Prepare response templates for shipping/exchange/refund", color: "#af52de" },
            { role: "Inventory", task: "Record daily sales → reorder low items → update counts", color: "#dc2626" },
          ]) : (ko ? [
            { role: "입구·안내", task: "고객 맞이, 웨이팅 관리, 자리 안내. 첫인상이 리뷰가 됩니다", color: "#007aff" },
            { role: "주문·카운터", task: "POS 주문 접수, 결제 처리, 포장·테이크아웃 대응", color: "#34c759" },
            { role: "주방·제조", task: "조리/음료 제조, 플레이팅, 품질 관리. 첫 메뉴의 맛이 곧 생존", color: "#ff9f0a" },
            { role: "서빙·후처리", task: "서빙, 테이블 정리, 재고 보충, 쓰레기 처리", color: "#af52de" },
            { role: "비상 대응", task: "카드 단말기 오류 시 현금 대응, Wi-Fi 끊김 시 핫스팟, 식재료 소진 시 긴급 발주", color: "#dc2626" },
          ] : [
            { role: "Door/Floor", task: "Welcome, manage wait, seat. First impression = review", color: "#007aff" },
            { role: "Counter/POS", task: "Take orders, process payments, handle takeout", color: "#34c759" },
            { role: "Kitchen/Prep", task: "Cook/brew, plate, quality check. Taste = survival", color: "#ff9f0a" },
            { role: "Serve/Clean", task: "Serve, clear, restock, waste disposal", color: "#af52de" },
            { role: "Emergency", task: "Card terminal fail → cash backup, Wi-Fi down → hotspot, stock out → emergency order", color: "#dc2626" },
          ])).map(r => (
            <div key={r.role} style={{ display: "flex", gap: "10px", ...cardStyle, background: `${r.color}03`, border: `1px solid ${r.color}08`, alignItems: "flex-start" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", background: `${r.color}10`, color: r.color, flexShrink: 0, whiteSpace: "nowrap" as const }}>{r.role}</span>
              <span style={{ fontSize: "13px", color: "rgba(15,23,42,0.65)", lineHeight: 1.5, fontWeight: 500 }}>{r.task}</span>
            </div>
          ))}
        </div>
        {!isStartup && (
          <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "10px", background: "rgba(220,38,38,0.04)", fontSize: "12px", color: "#dc2626", lineHeight: 1.5, fontWeight: 500, display: "flex", alignItems: "flex-start", gap: "6px" }}>
            <Lightbulb size={13} strokeWidth={1.5} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
            <span>{ko ? "1인 운영이라면 주문→제조→서빙 순서를 사전 리허설하세요. 첫 러시(rush)가 가장 힘듭니다." : "If solo, rehearse the order→prep→serve sequence. The first rush is the hardest."}</span>
          </div>
        )}
      </div>
      )}

      {/* ══════════ Page 3: 타임라인 / 홍보 전략 ══════════ */}
      {pg === 3 && (
      <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.08)", background: "linear-gradient(180deg, rgba(124,58,237,0.02) 0%, rgba(255,255,255,0.98) 100%)", padding: "20px 22px" }}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
          {isStartup ? (ko ? "론칭 2주 타임라인" : "2-Week Launch Timeline") : (ko ? "오픈 홍보 타임라인" : "Opening Marketing Timeline")}
        </div>
        <div style={{ display: "grid", gap: "6px" }}>
          {(isStartup ? (ko ? [
            { when: "D-14", what: "베타 사용자 5~10명 초대 → 핵심 플로우 테스트 + 피드백 수집", channel: "비공개" },
            { when: "D-7", what: "Product Hunt 예약 등록 + 랜딩 페이지 공개 + 메일링 리스트 알림", channel: "PH · 이메일" },
            { when: "D-3", what: "소셜 미디어 티저 게시 + 동영상 데모 제작 완료", channel: "X · LinkedIn" },
            { when: "D-1", what: "최종 배포 + 모든 모니터링 확인 + 팀 역할 분담 확정", channel: "내부" },
            { when: "D-Day", what: "론칭! PH·HN 게시 + SNS 전 채널 공유 + 첫 사용자 실시간 대응", channel: "전 채널" },
            { when: "D+1", what: "첫날 피드백 정리 + 긴급 버그 패치 + 감사 메시지 발송", channel: "내부 + 사용자" },
            { when: "D+7", what: "첫 주 지표 리뷰: DAU, 전환율, 이탈 구간 파악 → 액션 플랜", channel: "내부" },
          ] : [
            { when: "D-14", what: "Invite 5-10 beta users → test core flow + collect feedback", channel: "Private" },
            { when: "D-7", what: "Schedule PH + publish landing + notify mailing list", channel: "PH · Email" },
            { when: "D-3", what: "Social media teasers + demo video ready", channel: "X · LinkedIn" },
            { when: "D-1", what: "Final deploy + all monitoring + team roles confirmed", channel: "Internal" },
            { when: "D-Day", what: "Launch! PH + HN + all social + real-time user support", channel: "All" },
            { when: "D+1", what: "Day 1 feedback + hot fixes + thank you messages", channel: "Internal + Users" },
            { when: "D+7", what: "Week 1 review: DAU, conversion, drop-off → action plan", channel: "Internal" },
          ]) : isOnline ? (ko ? [
            { when: "D-7", what: "스토어 오픈 예약 설정 + 첫 구매 쿠폰 생성", channel: "스마트스토어" },
            { when: "D-3", what: "인스타 릴스 상품 언박싱 + 오픈 카운트다운", channel: "인스타그램" },
            { when: "D-1", what: "최종 재고·포장·송장 확인 + 오픈 알림 예약", channel: "내부" },
            { when: "D-Day", what: "스토어 오픈! SNS 공유 + 첫 주문 즉시 처리 + 리뷰 요청", channel: "전 채널" },
            { when: "D+1", what: "첫 날 주문·매출·반품 정리 + 상세페이지 수정", channel: "내부" },
            { when: "D+7", what: "첫 주 판매 데이터 분석 + 광고 시작 (네이버 쇼핑)", channel: "광고" },
          ] : [
            { when: "D-7", what: "Store open reservation + first purchase coupon", channel: "Smartstore" },
            { when: "D-3", what: "Instagram Reels unboxing + countdown", channel: "Instagram" },
            { when: "D-1", what: "Final inventory, packaging, label check + schedule alerts", channel: "Internal" },
            { when: "D-Day", what: "Store open! Share + process first orders + request reviews", channel: "All" },
            { when: "D+1", what: "Day 1 orders/revenue/returns review + listing edits", channel: "Internal" },
            { when: "D+7", what: "Week 1 sales analysis + start ads (Naver Shopping)", channel: "Ads" },
          ]) : (ko ? [
            { when: "D-14", what: "매장 공사·세팅 과정 사진/영상 (behind the scenes)", channel: "인스타 릴스" },
            { when: "D-7", what: "메뉴 소개 + 오픈 날짜 공지 + 이벤트 (첫 방문 할인 등)", channel: "인스타 · 카카오" },
            { when: "D-3", what: "네이버 플레이스 등록 완료 + 카카오맵 정보 수정", channel: "네이버·카카오" },
            { when: "D-1", what: "직원 최종 리허설 + 비상 연락 체계 확인 + 재고 최종 점검", channel: "내부" },
            { when: "D-Day", what: "오픈! 라이브 스토리 + 영수증 이벤트 + 첫 고객 리뷰 요청", channel: "전 채널" },
            { when: "D+1", what: "첫날 매출·고객 피드백 정리 + 개선점 기록", channel: "내부" },
            { when: "D+7", what: "첫 주 매출 분석 + 배달앱 광고 시작 + 리뷰 관리", channel: "배민·인스타" },
          ] : [
            { when: "D-14", what: "Behind-the-scenes setup photos/videos", channel: "Instagram Reels" },
            { when: "D-7", what: "Menu reveal + opening date + event (first-visit discount)", channel: "Instagram · Kakao" },
            { when: "D-3", what: "Naver Place registered + KakaoMap info updated", channel: "Naver · Kakao" },
            { when: "D-1", what: "Staff final rehearsal + emergency contacts + inventory check", channel: "Internal" },
            { when: "D-Day", what: "Open! Live stories + receipt event + request first reviews", channel: "All" },
            { when: "D+1", what: "Day 1 revenue + feedback review + improvement notes", channel: "Internal" },
            { when: "D+7", what: "Week 1 analysis + delivery app ads + review management", channel: "Delivery · Instagram" },
          ])).map(row => (
            <div key={row.when} style={{ display: "flex", gap: "10px", ...cardStyle, background: "rgba(124,58,237,0.02)", border: "1px solid rgba(124,58,237,0.05)" }}>
              <div style={{ flexShrink: 0, fontSize: "12px", fontWeight: 700, color: row.when === "D-Day" ? "#dc2626" : "#7c3aed", width: "40px", paddingTop: "2px" }}>{row.when}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 550, color: "#0f172a", lineHeight: 1.5 }}>{row.what}</div>
                <div style={{ fontSize: "11px", color: "rgba(15,23,42,0.4)", marginTop: "2px" }}>{row.channel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
