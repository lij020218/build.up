"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  ShieldCheck, AlertTriangle, Lightbulb,
  CreditCard, ClipboardList, PackageCheck, Sparkles, Users,
  Bug, BellRing, Megaphone, Calendar, Star, Truck, MessageSquare,
  type LucideIcon,
} from "lucide-react";

const MIDNIGHT = "#191970";

/**
 * 개업/오픈/론칭 최종 준비 단계.
 *
 * 다른 단계(TaxGuide·LoanGuide·HiringSetup)와 동일한 패턴:
 *   1. KEY ACTION 미드나이트 그라디언트 히어로 ("이 단계에서 꼭 할 일")
 *   2. 트랩 카드 — 빨강 AlertTriangle (실제 실패 사례)
 *   3. Apple 그룹드 리스트 — 페이지별 체크리스트·역할·타임라인
 *
 * 검증 출처 (다중 교차):
 *   - 네이버 플레이스 2026 알고리즘 — i-boss, 파인애드, 스토어아트
 *   - 스마트스토어 첫 주문 — waveorenda, editor-log
 *   - Product Hunt 2026 — getlaunchlist, vibrantsnap, smollaunch, openhunts
 *   - 음식점 그랜드오픈 — Lark·Toss Place·찾기쉬운 생활법령정보
 *   - 외식업 인력 트렌드 2026 — 아시아경제·서울경제 (작년 46.5% 인력 감축)
 */
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
      ? (ko ? ["왜 중요한가", "오픈 전 점검", "첫 주문 대비", "홍보 타임라인"] : ["Why", "Pre-check", "First Orders", "Marketing"])
      : (ko ? ["왜 중요한가", "오픈 전 점검", "오픈 당일 운영", "홍보 타임라인"] : ["Why", "Pre-check", "Opening Day", "Marketing"]);

  // ─── KEY ACTION (페이지별 "이 단계에서 꼭 할 일") ───
  const keyActions: Record<number, { title: string; detail: string }> = isStartup
    ? {
        0: ko
          ? { title: "론칭은 1일 이벤트가 아니라 6주 프로젝트 — 지금부터 베타 사용자 10명 확보", detail: "Product Hunt #1 팀의 공통점: 4-6주 전 시작, 200+ first-hour supporters 사전 확보, 12:01 PT 화/수 게시. 2026 알고리즘은 업보트 수보다 댓글·체류 시간 가중." }
          : { title: "Launch is a 6-week project — secure 10 beta users now", detail: "PH #1 teams start 4-6 weeks ahead, queue 200+ first-hour supporters, post Tue/Wed 12:01 PT. 2026 algorithm rewards comments and time-on-page over raw upvotes." },
        1: ko
          ? { title: "Sentry + Slack 알람을 실제 에러로 1번 트리거 — '연결만' 끝내지 말고 '경보가 정말 울리는지' 확인", detail: "프로덕션 배포 + 도메인 + SSL + 결제 실제 1건 성공 + 모든 모니터링 alarm 실제 트리거 테스트. 론칭 후 첫 30분이 가장 위험합니다." }
          : { title: "Trigger one real error to verify Sentry + Slack alarms fire", detail: "Don't just connect — confirm the alert actually rings. First 30 min after launch is highest risk." },
        2: ko
          ? { title: "역할 분담 = 버그 1명 / CS 1명 / 마케팅 1명 — 솔로면 우선순위만 명확히", detail: "Product Hunt 12:01 PT 게시 → 메이커 코멘트 1번째 댓글로 'Ask Me Anything' → 인터뷰했던 고객 10명에게 개인 메시지. 업보트 부탁 X, '솔직한 피드백' 부탁 O." }
          : { title: "Roles = bugs / CS / marketing. If solo, priority order only", detail: "Post at 12:01 PT → maker comment as first reply (AMA) → personal DMs to 10 interviewed users. Don't ask for upvotes — ask for honest feedback." },
        3: ko
          ? { title: "D-7부터 매일 1개 행동 — 캘린더에 미리 등록하고 시작", detail: "D-7 PH 예약 + 메일링 알림 / D-3 SNS 티저 + 데모 영상 / D-1 최종 배포 + 모니터링 / D-Day 06시 PT 게시 / D+1 핫픽스 + 감사 메시지 / D+7 첫 주 지표 리뷰." }
          : { title: "One action per day starting D-7", detail: "D-7 PH schedule + mailing / D-3 SNS teaser + demo / D-1 final deploy / D-Day post 12:01 PT / D+1 hotfix + thanks / D+7 metrics review." },
      }
    : isOnline
      ? {
          0: ko
            ? { title: "첫 주문 처리 1번 모의 시뮬레이션 — 박스·완충재·송장 전부 준비", detail: "스마트스토어 발송기한 (오늘출발 = 결제 당일 또는 +1영업일) 미준수 시 구매자 즉시 환불. 첫 리뷰 3개가 노출 순위 좌우. 실제 주문→포장→사진→발송까지 1번 끝까지 돌려보세요." }
            : { title: "Run one full order simulation — boxes, wrap, label all ready", detail: "Smartstore shipping deadline missed = instant refund on customer request. First 3 reviews drive rank. Walk through one order end-to-end." },
          1: ko
            ? { title: "재고 시스템 실수량 vs 표시수량 일치 확인 — 품절·중복판매 방지", detail: "스토어 카테고리·반품정책 최종 확인 + 카카오톡 채널/네이버 톡톡 CS 오픈 + 택배사 집하 시간 사전 확정. 2026 수수료 약 6.6%, 정산 3-4일." }
            : { title: "Sync real stock with displayed count — prevent oversell", detail: "Categories, return policy, KakaoTalk/Naver TalkTalk CS, courier pickup confirmed. Fees ~6.6%, settlement 3-4 days." },
          2: ko
            ? { title: "주문 알림 즉시 확인 → 30분 내 발송 처리 워크플로 고정", detail: "구매자 취소 요청 → 발송 미처리 시 즉시 환불 + 부정 리뷰. 알림 OFF 절대 금지. 송장번호 입력 시 오타 = 추적 불가 = 분쟁. 포장 사진 1장씩 보관." }
            : { title: "Lock the alert→ship-within-30min workflow", detail: "Buyer-cancel + unshipped = instant refund + bad review. Tracking typos = dispute. Save one packing photo per order." },
          3: ko
            ? { title: "오픈 7일 전부터 인스타 릴스 매일 1개 — 카운트다운 노출 누적", detail: "D-7 첫 구매 쿠폰 + 오픈 예약 / D-3 릴스 언박싱 / D-1 최종 점검 / D-Day SNS 공유 + 첫 리뷰 요청 / D+7 데이터 분석 + 네이버 쇼핑광고 시작." }
            : { title: "One Instagram Reel per day from D-7 — countdown momentum", detail: "D-7 coupon + reservation / D-3 unboxing reels / D-1 final check / D-Day share + ask review / D+7 ads start." },
        }
      : {
          0: ko
            ? { title: "첫 손님이 카드를 내미는 순간을 1번 리허설 — POS·단말기·Wi-Fi·영수증 한 번에", detail: "2026 네이버 플레이스 알고리즘은 리뷰 수보다 클릭·전화·길찾기·체류 시간 가중. 첫 3개 리뷰가 향후 노출을 결정. 외식업 46.5%가 인력 감축한 시기 — 1인 운영이라면 동선 리허설이 더 중요." }
            : { title: "Rehearse the very first card payment — POS, terminal, Wi-Fi, receipt all at once", detail: "Naver Place 2026 weights clicks, calls, dwell time over raw review counts. First 3 reviews lock future ranking." },
          1: ko
            ? { title: "카드 단말기·POS·Wi-Fi 백업 핫스팟까지 4중 점검 — 가장 흔한 오픈 사고 1순위", detail: "단말기 결제·취소·영수증 출력 실제 테스트 + Wi-Fi 끊김 시 핫스팟 자동전환 확인 + 냉장고 온도 + 식자재 입고. 신규 매장 오픈 직후 첫 주에 가장 자주 일어나는 사고는 결제 실패와 인터넷 끊김." }
            : { title: "Card / POS / Wi-Fi / backup hotspot — 4-layer pre-check", detail: "Real charge, cancel, receipt test + auto-failover hotspot + fridge temp + ingredients in. Payment fail + internet drop are the #1 first-week incidents." },
          2: ko
            ? { title: "직원 모의 운영 1시간 — 주문→제조→서빙→정산 한 사이클", detail: "1인 운영이면 더 중요. 첫 러시(rush)에 손이 꼬이면 첫 리뷰가 1점이 됩니다. 비상 시나리오: 단말기 다운→현금, Wi-Fi 끊김→핫스팟, 식자재 소진→긴급 발주 연락처 미리 확보." }
            : { title: "1-hour staff dry run — order→prep→serve→settle one cycle", detail: "Even more critical solo. A jammed first rush = 1-star review. Emergencies: terminal down→cash, Wi-Fi out→hotspot, stockout→supplier on speed-dial." },
          3: ko
            ? { title: "네이버 플레이스 등록 + 오픈 7일 전부터 인스타 1일 1콘텐츠 — '실제 방문 가능성' 시그널 누적", detail: "2026 알고리즘은 등록만으로는 안 뜸. 검색→클릭→전화→길찾기→저장→재방문 흐름이 누적되어야 노출. 첫 주는 영수증 리뷰 이벤트 (할인 쿠폰)로 진성 리뷰 3개를 가장 빨리 만드는 게 핵심." }
            : { title: "Naver Place + one Instagram post/day from D-7", detail: "2026 algorithm needs search→click→call→route→save→revisit signals. First-week receipt-review event is fastest path to 3 genuine reviews." },
        };

  // ─── 트랩 (페이지별 빨강 경고) ───
  const traps: Record<number, { label: string; text: string }[]> = isStartup
    ? {
        0: ko ? [
          { label: "Product Hunt 재론칭 불가 + Hacker News 중복 게시 = 밴", text: "한 번에 제대로 해야 합니다. 베타 사용자 10명 미만, 모니터링 미작동 상태 론칭은 첫 사용자를 영구히 잃는 길." },
          { label: "업보트 수만 노리면 2026 알고리즘에 묻힘", text: "PH는 댓글·체류 시간·신규 사용자 유입을 가중. 업보트만 모은 제품은 2026년 들어 1위가 거의 안 나옴." },
        ] : [
          { label: "PH re-launch blocked + HN duplicate ban", text: "One shot. Skip beta users or monitoring = lose first users forever." },
          { label: "Upvote-only chasing buried in 2026", text: "PH weights comments + dwell time + new users. Upvote-only rarely hits #1 anymore." },
        ],
        1: ko ? [
          { label: "Sentry '연결됨'과 '실제 알람 울림'은 다름", text: "토큰만 넣고 끝내는 팀이 60%. 일부러 throw new Error 1번 던져서 Slack 채널에 정말 메시지 떠야 안전." },
          { label: "결제 테스트 결제 = 실서비스 결제 ≠ Stripe test mode", text: "라이브 키로 100원 결제 1번 + 환불까지 완주. 테스트 모드만 통과하면 라이브 키 누락·웹훅 미설정으로 첫 결제 실패." },
        ] : [
          { label: "'Sentry connected' ≠ 'alarm actually rings'", text: "60% of teams stop at token install. Throw a real error and verify Slack message arrives." },
          { label: "Stripe test mode ≠ live payment", text: "Run one 100 KRW live charge + refund. Test mode hides live-key/webhook gaps." },
        ],
        2: ko ? [
          { label: "솔로 운영 + 동시 다발 이슈 = 침몰", text: "버그 + CS + 마케팅 동시에 오면 우선순위는 버그 → CS → 마케팅. 마케팅을 먼저 잡으면 사용자가 영구 이탈." },
          { label: "PH 댓글 늦은 응대 = 알고리즘 패널티", text: "메이커가 첫 1시간 댓글에 대답 안 하면 PH가 자동으로 노출 낮춤. 첫 시간만큼은 댓글 전담." },
        ] : [
          { label: "Solo + concurrent fires = sinking", text: "Order: bugs → CS → marketing. Marketing first = users gone forever." },
          { label: "Slow PH comment replies = algo penalty", text: "Maker silent in first hour = ranking drops. First hour: dedicated to replies." },
        ],
        3: ko ? [
          { label: "D-Day 1일짜리로 보면 100% 실패", text: "Winning teams는 6주 프로젝트로 본다. D-14 베타, D-7 예약, D-3 콘텐츠, D-1 모니터링, D-Day 실행, D+7 분석 — 누락 시 결과 차이 큼." },
          { label: "감사 메시지 D+1 안 보내면 재방문 0", text: "PH 1위라도 D+7 retention 5% 미만이면 죽은 론칭. D+1 개인 thank-you DM은 retention 2-3배 차이." },
        ] : [
          { label: "Treat D-Day as 1 day = guaranteed failure", text: "Winners run a 6-week timeline. Skipping any phase = measurable drop." },
          { label: "No D+1 thank-you = 0 retention", text: "Even PH #1 dies if D+7 retention <5%. Personal D+1 DMs 2-3× retention." },
        ],
      }
    : isOnline
      ? {
          0: ko ? [
            { label: "첫 주문 처리 실패 = 즉시 1점 리뷰 + 노출 패널티", text: "박스 부족·송장 프린터 고장은 신규 셀러 가장 흔한 사고. 모의 1번이 30만원 광고비보다 효과적." },
            { label: "초기 리뷰 3개가 향후 6개월 노출 결정", text: "스마트스토어는 초기 평점이 카테고리 노출에 큰 가중. 첫 3건은 정말 정성을 들여 처리해야 함." },
          ] : [
            { label: "First-order fail = 1-star + ranking penalty", text: "Out-of-boxes / dead label printer is the #1 new-seller incident. One dry run beats 300K KRW in ads." },
            { label: "First 3 reviews lock 6-month visibility", text: "Smartstore weights early ratings heavily." },
          ],
          1: ko ? [
            { label: "표시 재고 ≠ 실 재고 = 자동 환불 + 패널티", text: "재고 1개인데 동시 주문 2건 받으면 1건은 즉시 환불 + 노출 점수 하락. 재고는 보수적으로." },
            { label: "발송기한 누락 = 구매자 취소 시 즉시 환불 (이의제기 불가)", text: "오늘출발 상품은 결제 +1영업일 내 발송. 한 번 놓치면 클레임 누적되어 ★ 회복 어려움." },
          ] : [
            { label: "Displayed stock ≠ real stock", text: "1 in stock + 2 simultaneous orders = instant refund + score drop. Be conservative." },
            { label: "Missed shipping deadline = no-dispute refund", text: "Same-day items ship within +1 business day. One miss = lasting rating damage." },
          ],
          2: ko ? [
            { label: "주소 오기입 / 송장 오타 = 분쟁 시 셀러 책임", text: "고객 주소를 자동 복붙하지 말고 1번 더 확인. 포장 사진 1장은 분쟁의 결정적 증거." },
            { label: "CS 알림 OFF / 답변 24시간 지연 = 환불 의무", text: "스마트스토어 CS 응답 SLA를 운영 정책에 사전 등록 + 야간 자동응답 메시지 설정." },
          ] : [
            { label: "Address typo = seller-side dispute loss", text: "Don't blind-paste. One packing photo = decisive evidence." },
            { label: "CS off / 24h delayed reply = mandatory refund", text: "Pre-set CS SLA in store policy + after-hours auto-reply." },
          ],
          3: ko ? [
            { label: "광고만 돌리면 ROAS 100% 미만으로 적자", text: "오픈 첫 주 광고는 콘텐츠(릴스·블로그) 누적 후 시작. 콘텐츠 0개에서 광고 = 돈 태우기." },
            { label: "쿠폰 남발하면 본가 매출 회복 불가", text: "오픈 첫 구매 5-10% 쿠폰까지만. 30% 이상 쿠폰은 신규고객만 데려오고 그들이 다시 안 옴." },
          ] : [
            { label: "Ads-only = ROAS <100%", text: "Build content first (Reels, blog), then ads. Ads on zero content = burn." },
            { label: "Heavy coupons = no recovery on full price", text: "5-10% open coupon max. 30%+ attracts deal-only buyers who never return." },
          ],
        }
      : {
          0: ko ? [
            { label: "첫 손님 카드 결제 실패 = 즉시 부정 후기 1순위", text: "카드 단말기·Wi-Fi·POS는 오픈 첫 주 사고 1위. 실제 결제 + 영수증 + 취소까지 1번 모두 돌려보세요." },
            { label: "네이버 플레이스 등록만 하고 끝 = 노출 안 됨", text: "2026 알고리즘은 '실제 방문 가능성' 시그널을 본다. 등록 + 사진 5장 + 영수증 리뷰 3건 + 첫 주 운영 안정성이 함께 와야 노출 시작." },
          ] : [
            { label: "First card payment fail = top complaint", text: "Terminal/Wi-Fi/POS = #1 first-week incident. Run one full charge + receipt + cancel cycle." },
            { label: "Naver Place register-only = invisible", text: "2026 needs visit-likelihood signals. Register + 5 photos + 3 receipt reviews + stable first week to start ranking." },
          ],
          1: ko ? [
            { label: "냉장고 온도 1번 미점검 = 식약처 적발 + 영업정지", text: "오픈 직전 냉장 0-10℃ / 냉동 -18℃ 이하 확인 + 온도계 부착. 식약처 점검은 첫 달에 가장 자주 옴." },
            { label: "전기·가스 계약 누락 시 첫날 가게 멈춤", text: "한국전력 + 가스공사 사용량 신고와 별개로 사업자명 변경 누락 흔함. 오픈 1주 전 모든 고지서를 사업자 명의로 확인." },
          ] : [
            { label: "Skipped fridge temp check = MFDS shutdown", text: "Confirm 0-10℃ / -18℃ + thermometer. Inspectors visit most often in month 1." },
            { label: "Utility contract not in business name = day-1 shutdown", text: "KEPCO + Gas. Confirm all bills under business name 1 week ahead." },
          ],
          2: ko ? [
            { label: "직원 리허설 안 하면 첫 러시에 동선 꼬임 → 1점 리뷰", text: "주문→제조→서빙→정산 1사이클을 사전 1시간 모의운영. 1인 운영이면 더 절실." },
            { label: "단말기 다운 시 현금만 받으면 손님 이탈", text: "비상용 모바일 결제 (토스·카카오·삼성페이 QR) 백업 1개는 반드시. 카드만 의존 = 첫날 매출 절반 손실." },
          ] : [
            { label: "No staff rehearsal = jammed first rush = 1-star", text: "Run one 1-hour dry cycle. Even more crucial solo." },
            { label: "Cash-only fallback = customer walk-out", text: "Backup mobile pay (Toss/Kakao/Samsung QR) mandatory. Card-only dependency = half-day revenue loss." },
          ],
          3: ko ? [
            { label: "오픈 첫날 SNS 0건 = 노출 신호 0", text: "D-7부터 매일 1개 (스토리·릴스·포스트) 누적 노출. D-Day 라이브 스토리 + 영수증 이벤트는 첫 리뷰 3개를 가장 빠르게 만드는 정석." },
            { label: "배달앱 광고 첫날부터 = ROAS -50%", text: "배민·쿠팡이츠 광고는 D+7 이후, 오프라인 리뷰 3개+ 쌓인 다음 시작이 정답. 첫날부터 광고는 인지도 0인 매장에 고비용." },
          ] : [
            { label: "Day-1 zero SNS posts = zero signals", text: "Daily 1 piece from D-7. Day-1 live story + receipt event = fastest path to first 3 reviews." },
            { label: "Day-1 delivery ads = ROAS -50%", text: "Start Baemin/Coupang Eats ads after D+7 with 3+ reviews. Day-1 ads on a no-awareness store = burn." },
          ],
        };

  // ─── Page 1 체크리스트 ───
  type CheckItem = { item: string; priority: string; required: boolean };
  const checklist: CheckItem[] = isStartup
    ? (ko ? [
        { item: "프로덕션 환경 배포 + 도메인 연결 + SSL 인증서 확인", priority: "필수", required: true },
        { item: "Sentry 에러 모니터링 + Slack 알림 실제 트리거 테스트", priority: "필수", required: true },
        { item: "결제 플로우 라이브 키로 100원 1건 결제 + 환불 완주", priority: "필수", required: true },
        { item: "랜딩 페이지: 헤드라인·CTA·OG 이미지 모바일 미리보기", priority: "필수", required: true },
        { item: "이용약관 + 개인정보처리방침 + 사업자 정보 풋터 표시", priority: "법적 필수", required: true },
        { item: "Google Analytics / Mixpanel 이벤트 트래킹 작동 확인", priority: "권장", required: false },
        { item: "모바일 반응형 + 주요 브라우저 (Chrome·Safari·Edge) 크로스 테스트", priority: "권장", required: false },
        { item: "고객 피드백 채널 오픈 (Discord / 카카오 / 이메일)", priority: "권장", required: false },
      ] : [
        { item: "Production deploy + domain + SSL verified", priority: "Required", required: true },
        { item: "Sentry + Slack alarm triggered with real error", priority: "Required", required: true },
        { item: "Live payment: 100 KRW charge + refund completed", priority: "Required", required: true },
        { item: "Landing: headline, CTA, OG image mobile-preview", priority: "Required", required: true },
        { item: "Legal: Terms, Privacy, biz info footer", priority: "Legal", required: true },
        { item: "Analytics events firing", priority: "Recommended", required: false },
        { item: "Mobile responsive + cross-browser (Chrome/Safari/Edge)", priority: "Recommended", required: false },
        { item: "Feedback channel open (Discord/Kakao/email)", priority: "Recommended", required: false },
      ])
    : isOnline
      ? (ko ? [
          { item: "스토어 카테고리·배너·반품정책 최종 확인", priority: "필수", required: true },
          { item: "실제 주문 → 포장 → 송장출력 → 발송까지 1번 완주 (자기 주문)", priority: "필수", required: true },
          { item: "포장재 충분 확보: 박스·완충재·테이프·송장 프린터 (라벨지 5묶음 백업)", priority: "필수", required: true },
          { item: "반품·교환·환불 시나리오 시뮬레이션 + 응답 템플릿 5종", priority: "필수", required: true },
          { item: "CS 채널 오픈: 카카오톡 채널 / 네이버 톡톡 + 야간 자동응답", priority: "필수", required: true },
          { item: "초도 재고 입고 완료 + 시스템 수량 일치 확인 (보수적으로 등록)", priority: "필수", required: true },
          { item: "택배사 집하 시간·장소 확정 (지정업체 우선)", priority: "권장", required: false },
          { item: "상세 페이지 모바일 미리보기 + 4초 첫인상 점검", priority: "권장", required: false },
        ] : [
          { item: "Store categories, banners, return policy finalized", priority: "Required", required: true },
          { item: "Self-order full cycle: order → pack → label → ship", priority: "Required", required: true },
          { item: "Packaging supplies (5 spare label rolls)", priority: "Required", required: true },
          { item: "Return/exchange/refund scenarios + 5 reply templates", priority: "Required", required: true },
          { item: "CS channel open + after-hours auto-reply", priority: "Required", required: true },
          { item: "Inventory received + system count synced (conservative)", priority: "Required", required: true },
          { item: "Courier pickup time/location set", priority: "Recommended", required: false },
          { item: "Mobile detail-page preview + 4-sec first-impression test", priority: "Recommended", required: false },
        ])
      : (ko ? [
          { item: "카드 단말기 실제 결제·취소·영수증 출력 1사이클 테스트", priority: "필수", required: true },
          { item: "Wi-Fi 안정성 + 백업 핫스팟 자동전환 확인", priority: "필수", required: true },
          { item: "POS 메뉴·가격 등록 + 테스트 주문 5건 처리", priority: "필수", required: true },
          { item: "초도 재고·식재료 발주 입고 + 유통기한 라벨링", priority: "필수", required: true },
          { item: "위생 점검: 냉장고 0~10℃ / 냉동 -18℃ + 조리대 살균 + 직원 위생복", priority: "필수", required: true },
          { item: "전기·가스·수도·환기 시스템 사업자 명의 + 작동 확인", priority: "필수", required: true },
          { item: "간판·메뉴판·가격표 설치 완료", priority: "권장", required: false },
          { item: "네이버 플레이스 등록 + 사진 5장+ + 카카오맵 정보 수정", priority: "권장", required: false },
        ] : [
          { item: "Card terminal: real charge, cancel, receipt cycle", priority: "Required", required: true },
          { item: "Wi-Fi + auto-failover hotspot confirmed", priority: "Required", required: true },
          { item: "POS menu/price + 5 test orders processed", priority: "Required", required: true },
          { item: "Initial inventory + expiry labels", priority: "Required", required: true },
          { item: "Hygiene: 0-10℃ fridge / -18℃ freezer + sanitized + uniforms", priority: "Required", required: true },
          { item: "Utilities under business name + working", priority: "Required", required: true },
          { item: "Signage + menu board + price list", priority: "Recommended", required: false },
          { item: "Naver Place register + 5+ photos + KakaoMap update", priority: "Recommended", required: false },
        ]);

  // ─── Page 2 역할/실행 ───
  type RoleItem = { role: string; task: string; icon: LucideIcon };
  const roles: RoleItem[] = isStartup
    ? (ko ? [
        { role: "Product Hunt", task: "12:01 PT (한국 17:01) 화·수 게시. 태그라인 + 스크린샷 5장 + 메이커 첫 댓글로 'AMA' 시작", icon: Megaphone },
        { role: "Hacker News", task: "Show HN 게시글. 기술적 차별점 중심. 솔직한 톤 (마케팅 톤은 다운보트)", icon: ClipboardList },
        { role: "직접 초대", task: "인터뷰했던 고객 10명에게 개인 메시지 — '드디어 만들었습니다, 솔직한 피드백 부탁'", icon: Users },
        { role: "커뮤니티", task: "Discord/카카오 채널 오픈 공지 + 초기 피드백 전담 채널 + 24시간 모니터링", icon: MessageSquare },
        { role: "실시간 대응", task: "버그 1명 + CS 1명 + 마케팅 1명 (솔로면 우선순위: 버그 > CS > 마케팅)", icon: Bug },
      ] : [
        { role: "Product Hunt", task: "Tue/Wed 12:01 PT post. Tagline + 5 screenshots + maker AMA reply", icon: Megaphone },
        { role: "Hacker News", task: "Show HN: technical differentiation. Honest tone (marketing = downvotes)", icon: ClipboardList },
        { role: "Direct", task: "DM 10 interviewed customers — 'finally shipped, honest feedback'", icon: Users },
        { role: "Community", task: "Discord/Kakao open + dedicated feedback channel + 24h monitoring", icon: MessageSquare },
        { role: "Live ops", task: "Bug + CS + marketing roles (solo priority: bugs > CS > marketing)", icon: Bug },
      ])
    : isOnline
      ? (ko ? [
          { role: "주문 확인", task: "푸시 알림 즉시 확인 → 주문 상세 검토 → 재고 차감 (30분 내)", icon: BellRing },
          { role: "포장", task: "상품 검수 → 완충재 포장 → 송장 부착 → 포장 사진 1장 보관 (분쟁 대비)", icon: PackageCheck },
          { role: "발송", task: "택배 집하 시간 전 마감 → 발송 처리 + 송장번호 입력 (오타 1번 더 확인)", icon: Truck },
          { role: "CS 대응", task: "배송 문의·교환·환불 5종 템플릿. 24시간 내 1차 응답이 환불 의무 회피", icon: MessageSquare },
          { role: "재고 체크", task: "당일 판매량 기록 → 부족 상품 재발주 → 시스템 수량 보수적 업데이트", icon: ClipboardList },
        ] : [
          { role: "Order check", task: "Push alert → review → deduct stock (within 30 min)", icon: BellRing },
          { role: "Packing", task: "Inspect → wrap → label → save 1 photo per order (dispute proof)", icon: PackageCheck },
          { role: "Shipping", task: "Complete before pickup → enter tracking (double-check)", icon: Truck },
          { role: "CS", task: "5 reply templates. <24h first reply avoids mandatory refund", icon: MessageSquare },
          { role: "Inventory", task: "Daily sales log → reorder lows → conservative count update", icon: ClipboardList },
        ])
      : (ko ? [
          { role: "입구·안내", task: "고객 맞이, 웨이팅 관리, 자리 안내. 첫인상이 곧 첫 리뷰", icon: Users },
          { role: "주문·카운터", task: "POS 주문 접수, 카드·QR 결제, 포장·테이크아웃 대응", icon: CreditCard },
          { role: "주방·제조", task: "조리/음료 제조, 플레이팅, 품질 관리. 첫 메뉴의 맛이 곧 생존", icon: Sparkles },
          { role: "서빙·후처리", task: "서빙, 테이블 정리, 재고 보충, 쓰레기 처리", icon: ClipboardList },
          { role: "비상 대응", task: "단말기 오류 → 모바일 결제, Wi-Fi 끊김 → 핫스팟, 식자재 소진 → 긴급 발주", icon: AlertTriangle },
        ] : [
          { role: "Door/Floor", task: "Welcome, manage wait, seat. First impression = first review", icon: Users },
          { role: "Counter/POS", task: "Take orders, card/QR pay, takeout", icon: CreditCard },
          { role: "Kitchen/Prep", task: "Cook/brew, plate, quality. Taste = survival", icon: Sparkles },
          { role: "Serve/Clean", task: "Serve, clear, restock, waste", icon: ClipboardList },
          { role: "Emergency", task: "Terminal fail → mobile pay, Wi-Fi → hotspot, stockout → emergency order", icon: AlertTriangle },
        ]);

  // ─── Page 3 타임라인 ───
  type TimelineItem = { when: string; what: string; channel: string };
  const timeline: TimelineItem[] = isStartup
    ? (ko ? [
        { when: "D-14", what: "베타 사용자 5~10명 초대 → 핵심 플로우 테스트 + 피드백 수집", channel: "비공개" },
        { when: "D-7", what: "Product Hunt 예약 등록 + 랜딩 공개 + 메일링 리스트 알림", channel: "PH · 이메일" },
        { when: "D-3", what: "SNS 티저 게시 + 데모 영상 90초 완성", channel: "X · LinkedIn" },
        { when: "D-1", what: "최종 배포 + 모니터링 트리거 테스트 + 팀 역할 확정", channel: "내부" },
        { when: "D-Day", what: "12:01 PT 게시 + 메이커 AMA + 200+ first-hour 동원 + 인터뷰 고객 DM", channel: "전 채널" },
        { when: "D+1", what: "감사 메시지 + 핫픽스 + 첫날 피드백 정리", channel: "사용자 + 내부" },
        { when: "D+7", what: "지표 리뷰: DAU·전환·이탈 → 다음 1주 액션 플랜", channel: "내부" },
      ] : [
        { when: "D-14", what: "Invite 5-10 beta users → core flow test + feedback", channel: "Private" },
        { when: "D-7", what: "PH schedule + landing publish + mailing notify", channel: "PH · Email" },
        { when: "D-3", what: "Social teasers + 90s demo video", channel: "X · LinkedIn" },
        { when: "D-1", what: "Final deploy + alarm tests + team roles confirmed", channel: "Internal" },
        { when: "D-Day", what: "12:01 PT post + maker AMA + 200+ first-hour + DMs", channel: "All" },
        { when: "D+1", what: "Thank-yous + hot fixes + Day 1 feedback review", channel: "Users + Internal" },
        { when: "D+7", what: "Metrics review: DAU/conv/drop-off → next-week plan", channel: "Internal" },
      ])
    : isOnline
      ? (ko ? [
          { when: "D-7", what: "스토어 오픈 예약 설정 + 첫 구매 5-10% 쿠폰 생성 + 오픈 알림 등록", channel: "스마트스토어" },
          { when: "D-3", what: "인스타 릴스 상품 언박싱 + 오픈 카운트다운 일 1콘텐츠", channel: "인스타그램" },
          { when: "D-1", what: "최종 재고·포장재·송장 프린터 점검 + 자기 주문 1건 시뮬", channel: "내부" },
          { when: "D-Day", what: "스토어 오픈 + SNS 라이브 + 첫 주문 30분 내 처리 + 리뷰 요청", channel: "전 채널" },
          { when: "D+1", what: "첫날 주문·매출·문의 정리 + 상세페이지 미세 수정", channel: "내부" },
          { when: "D+7", what: "첫 주 데이터 분석 + 네이버 쇼핑 광고 시작 (콘텐츠 누적 후)", channel: "광고" },
        ] : [
          { when: "D-7", what: "Reservation set + 5-10% open coupon + alerts scheduled", channel: "Smartstore" },
          { when: "D-3", what: "Daily Instagram Reels unboxing + countdown", channel: "Instagram" },
          { when: "D-1", what: "Final inventory/packaging/printer check + self-order sim", channel: "Internal" },
          { when: "D-Day", what: "Store open + SNS live + first orders <30 min + review request", channel: "All" },
          { when: "D+1", what: "Day 1 orders/revenue/inquiries review + listing edits", channel: "Internal" },
          { when: "D+7", what: "Week 1 data + start Naver Shopping ads (content first)", channel: "Ads" },
        ])
      : (ko ? [
          { when: "D-14", what: "매장 공사·세팅 비하인드 사진/영상 누적 (스토리 7개+)", channel: "인스타 릴스" },
          { when: "D-7", what: "메뉴 소개 + 오픈 날짜 공지 + 첫 방문 할인 이벤트", channel: "인스타 · 카카오" },
          { when: "D-3", what: "네이버 플레이스 등록 + 사진 5장+ + 카카오맵 정보 수정", channel: "네이버 · 카카오" },
          { when: "D-1", what: "직원 1시간 모의 운영 + 비상 연락 체계 + 재고 최종 점검", channel: "내부" },
          { when: "D-Day", what: "오픈 + 라이브 스토리 + 영수증 리뷰 이벤트 + 첫 고객 응대 집중", channel: "전 채널" },
          { when: "D+1", what: "첫날 매출·고객 피드백 정리 + 개선점 즉시 기록", channel: "내부" },
          { when: "D+7", what: "첫 주 매출 분석 + 리뷰 3개 확보 후 배달앱 광고 시작", channel: "배민 · 인스타" },
        ] : [
          { when: "D-14", what: "Behind-the-scenes setup photos/reels (7+ stories)", channel: "Instagram Reels" },
          { when: "D-7", what: "Menu reveal + opening date + first-visit discount", channel: "Instagram · Kakao" },
          { when: "D-3", what: "Naver Place registered (5+ photos) + KakaoMap update", channel: "Naver · Kakao" },
          { when: "D-1", what: "1-hour staff dry run + emergency contacts + inventory check", channel: "Internal" },
          { when: "D-Day", what: "Open + live stories + receipt review event + customer focus", channel: "All" },
          { when: "D+1", what: "Day 1 revenue + feedback + improvement notes", channel: "Internal" },
          { when: "D+7", what: "Week 1 analysis + delivery ads after 3 reviews", channel: "Baemin · Instagram" },
        ]);

  // ─── 디자인 토큰 ───
  const sectionLabel: React.CSSProperties = {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "rgba(0,0,0,0.45)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "10px",
  };

  // ─── KEY ACTION 히어로 ───
  const KeyActionCard = () => {
    const ka = keyActions[pg];
    if (!ka) return null;
    return (
      <div style={{
        display: "flex", gap: "14px", alignItems: "flex-start",
        padding: "16px 18px", borderRadius: "16px",
        background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`,
        color: "#fff",
        marginBottom: "18px",
        boxShadow: "0 6px 20px rgba(25,25,112,0.28)",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
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
            {ka.title}
          </div>
          <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.92 }}>
            {ka.detail}
          </div>
        </div>
      </div>
    );
  };

  // ─── 트랩 카드 ───
  const TrapsCard = () => {
    const ts = traps[pg] ?? [];
    if (ts.length === 0) return null;
    return (
      <div style={{ display: "grid", gap: "8px", marginTop: "16px" }}>
        {ts.map((trap) => (
          <div key={trap.label} style={{
            display: "flex", gap: "10px", alignItems: "flex-start",
            padding: "13px 15px", borderRadius: "14px",
            background: "rgba(220,60,30,0.06)", border: "1px solid rgba(200,60,30,0.16)",
          }}>
            <AlertTriangle size={18} strokeWidth={2} style={{ color: "#b83020", flexShrink: 0, marginTop: "1px" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#b83020", marginBottom: "3px", letterSpacing: "-0.01em" }}>{trap.label}</div>
              <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(184,48,32,0.85)" }}>{trap.text}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "14px" }}>
      {/* ── 페이지 네비 — 미드나이트 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "8px" }}>
        <button type="button" disabled={pg === 0} onClick={() => setGuideStepIndex((p: number) => p - 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(25,25,112,0.1)",
          background: pg === 0 ? "rgba(0,0,0,0.02)" : "white", color: pg === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: pg === 0 ? "default" : "pointer",
        }}>← {ko ? "이전" : "Prev"}</button>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const, justifyContent: "center" }}>
          {pgLabels.map((l, i) => (
            <button key={i} type="button" onClick={() => setGuideStepIndex(i)} style={{
              padding: "5px 12px", borderRadius: "999px", fontSize: "11.5px", fontWeight: i === pg ? 700 : 500,
              background: i === pg ? MIDNIGHT : "transparent", color: i === pg ? "#fff" : "rgba(15,23,42,0.45)",
              border: i === pg ? "none" : "1px solid rgba(25,25,112,0.1)", cursor: "pointer",
              letterSpacing: "-0.01em",
              boxShadow: i === pg ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
              transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>
        <button type="button" disabled={pg === totalPg - 1} onClick={() => setGuideStepIndex((p: number) => p + 1)} style={{
          padding: "8px 16px", borderRadius: "10px", border: "none",
          background: pg === totalPg - 1 ? "rgba(0,0,0,0.02)" : MIDNIGHT,
          color: pg === totalPg - 1 ? "rgba(0,0,0,0.2)" : "#fff",
          fontSize: "13px", fontWeight: 600, cursor: pg === totalPg - 1 ? "default" : "pointer",
          boxShadow: pg === totalPg - 1 ? "none" : "0 4px 14px rgba(25,25,112,0.25)",
        }}>{ko ? "다음" : "Next"} →</button>
      </div>

      {/* ── 페이지 헤더 ── */}
      <div>
        <div style={{ fontSize: "11.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "4px" }}>
          {ko ? `${pg + 1}단계 / ${totalPg}` : `Step ${pg + 1} / ${totalPg}`}
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.3 }}>
          {pgLabels[pg]}
        </div>
      </div>

      {/* ── KEY ACTION 히어로 (모든 페이지 공통) ── */}
      <KeyActionCard />

      {/* ── Page 0: 왜 ── */}
      {pg === 0 && (
        <>
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", padding: "16px 18px", marginBottom: "16px" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "10px" }}>
              {isStartup
                ? (ko ? "론칭 당일 준비 수준이 초기 견인력(Traction)을 결정합니다" : "Launch-day prep determines initial traction")
                : isOnline
                  ? (ko ? "첫 주문 처리 실패는 리뷰 악화와 플랫폼 노출 패널티로 이어집니다" : "First-order failure = bad reviews + ranking penalty")
                  : (ko ? "오픈 당일 준비 부족은 첫 고객 경험을 망가뜨리고, 리뷰로 영원히 남습니다" : "Poor opening-day prep ruins first impressions — and stays as reviews")}
            </div>
            <div style={{ fontSize: "13.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.65 }}>
              {isStartup
                ? (ko ? "★ 2026 Product Hunt 알고리즘은 업보트 수보다 댓글·체류 시간·신규 사용자 유입을 가중. 1위 팀 공통점: 4-6주 전 시작 / 200+ first-hour supporters / 12:01 PT 화·수 게시 / 메이커 AMA로 첫 댓글 자체 점화. 한 번에 제대로, 재론칭 불가." : "★ 2026 PH algo weights comments + dwell time + new users over upvotes. #1 teams: 4-6 weeks ahead, 200+ first-hour, Tue/Wed 12:01 PT, maker AMA. One shot, no re-launch.")
                : isOnline
                  ? (ko ? "★ 스마트스토어 발송기한 누락 시 구매자 취소 요청만으로 즉시 환불. 초기 리뷰 3개가 카테고리 노출 가중. 수수료 약 6.6%, 정산 3-4일. 첫 주 광고는 콘텐츠 누적 후 — 콘텐츠 0개 광고는 ROAS 100% 미만." : "★ Missed Smartstore deadline = instant refund on buyer request. First 3 reviews drive ranking. ~6.6% fee, 3-4 day settlement. Ads only after content built up.")
                  : (ko ? "★ 2026 네이버 플레이스 알고리즘은 등록만으로는 노출 안 됨. 검색→클릭→전화→길찾기→저장→재방문 시그널이 누적되어야 시작. 단말기·Wi-Fi·POS는 첫 주 사고 1순위. 외식업 46.5%가 인력 감축한 시기 — 1인 운영이라면 동선 리허설이 더 절실." : "★ 2026 Naver Place algo needs visit-likelihood signals — register-only is invisible. Terminal/Wi-Fi/POS = #1 first-week incidents. With 46.5% of restaurants cutting staff, solo flow rehearsal matters more.")}
            </div>
          </div>

          <TrapsCard />
        </>
      )}

      {/* ── Page 1: 점검 체크리스트 ── */}
      {pg === 1 && (
        <>
          <div>
            <div style={sectionLabel}>
              {isStartup ? (ko ? "론칭 전 최종 점검" : "Pre-Launch Checklist")
                : isOnline ? (ko ? "오픈 전 최종 점검" : "Pre-Open Checklist")
                : (ko ? "오픈 전 최종 점검" : "Pre-Open Checklist")}
            </div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {checklist.map((row, i) => (
                <div key={row.item}>
                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: row.required ? "rgba(184,48,32,0.08)" : "rgba(25,25,112,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      color: row.required ? "#b83020" : MIDNIGHT,
                      fontSize: "11px", fontWeight: 800, letterSpacing: "-0.01em",
                    }}>
                      {row.priority.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", lineHeight: 1.45 }}>
                        {row.item}
                      </div>
                      <div style={{
                        fontSize: "11.5px", fontWeight: 700,
                        color: row.required ? "#b83020" : MIDNIGHT,
                        marginTop: "4px",
                        letterSpacing: "0.04em",
                      }}>
                        {row.priority}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <TrapsCard />
        </>
      )}

      {/* ── Page 2: 역할 / 실행 ── */}
      {pg === 2 && (
        <>
          <div>
            <div style={sectionLabel}>
              {isStartup ? (ko ? "론칭 당일 역할 분담" : "Launch-Day Roles")
                : isOnline ? (ko ? "첫 주문 처리 흐름" : "First-Order Flow")
                : (ko ? "오픈 당일 역할 배분" : "Opening-Day Roles")}
            </div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {roles.map((row, i) => {
                const Icon = row.icon;
                return (
                  <div key={row.role}>
                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "rgba(25,25,112,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        color: MIDNIGHT,
                      }}>
                        <Icon size={17} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "3px" }}>
                          {row.role}
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55 }}>
                          {row.task}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isStartup && (
            <div style={{
              marginTop: "12px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "rgba(25,25,112,0.04)",
              border: "1px solid rgba(25,25,112,0.1)",
              fontSize: "12.5px",
              color: MIDNIGHT,
              lineHeight: 1.55,
              fontWeight: 600,
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}>
              <Lightbulb size={15} strokeWidth={2} style={{ flexShrink: 0, marginTop: "1px", color: MIDNIGHT }} />
              <span>
                {isOnline
                  ? (ko ? "1인 셀러라면 알림 즉시 확인 → 30분 내 발송 + CS 24시간 1차 응답을 기본 SLA로 잡으세요. 한 번 흐트러지면 ★ 회복이 가장 어렵습니다." : "Solo seller: lock 30-min ship + 24h first-CS-reply as your SLA. Rating recovery is hardest after one slip.")
                  : (ko ? "1인 운영이라면 주문→제조→서빙→정산 한 사이클을 사전 1시간 모의운영하세요. 첫 러시(rush)가 가장 힘듭니다." : "If solo, run a 1-hour dry cycle of order→prep→serve→settle. The first rush is hardest.")}
              </span>
            </div>
          )}

          <TrapsCard />
        </>
      )}

      {/* ── Page 3: 타임라인 ── */}
      {pg === 3 && (
        <>
          <div>
            <div style={sectionLabel}>
              {isStartup ? (ko ? "론칭 2주 타임라인" : "2-Week Launch Timeline")
                : (ko ? "오픈 홍보 타임라인" : "Opening Marketing Timeline")}
            </div>
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              {timeline.map((row, i) => {
                const isDDay = row.when === "D-Day";
                return (
                  <div key={row.when}>
                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "76px" }} />}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                      <div style={{
                        width: 52, height: 36, borderRadius: 10,
                        background: isDDay ? MIDNIGHT : "rgba(25,25,112,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        color: isDDay ? "#fff" : MIDNIGHT,
                        fontSize: "12px", fontWeight: 800, letterSpacing: "-0.01em",
                        boxShadow: isDDay ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
                      }}>
                        {row.when}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", lineHeight: 1.5 }}>
                          {row.what}
                        </div>
                        <div style={{
                          fontSize: "11.5px", fontWeight: 600, color: "rgba(0,0,0,0.42)",
                          marginTop: "4px", letterSpacing: "0.02em",
                          display: "flex", alignItems: "center", gap: "6px",
                        }}>
                          <Calendar size={11} strokeWidth={2.2} />
                          {row.channel}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            marginTop: "12px",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "rgba(25,25,112,0.04)",
            border: "1px solid rgba(25,25,112,0.1)",
            fontSize: "12.5px",
            color: MIDNIGHT,
            lineHeight: 1.55,
            fontWeight: 600,
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
          }}>
            <Star size={15} strokeWidth={2} style={{ flexShrink: 0, marginTop: "1px", color: MIDNIGHT }} />
            <span>
              {isStartup
                ? (ko ? "북극성 지표: D+7 retention (재방문률 5% 미만이면 재정의 필요). PH 1위보다 retention이 사업 생존을 결정합니다." : "North Star: D+7 retention (re-define product if <5%). Retention beats PH #1 for survival.")
                : isOnline
                  ? (ko ? "북극성 지표: 첫 주 진성 리뷰 3개 + 재구매율. 광고는 콘텐츠 누적 D+7 이후. 쿠폰은 5-10%까지만." : "North Star: 3 genuine reviews + repeat rate. Ads after D+7 with content. Coupons capped at 5-10%.")
                  : (ko ? "북극성 지표: 첫 주 진성 리뷰 3개 + 재방문 시그널 (네이버 플레이스 저장·전화·길찾기). 배달앱 광고는 D+7 후." : "North Star: 3 genuine reviews + revisit signals (Place save/call/route). Delivery ads after D+7.")}
            </span>
          </div>

          <TrapsCard />
        </>
      )}
    </div>
  );
}
