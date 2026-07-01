"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  ShieldCheck, AlertTriangle, Lightbulb,
  CreditCard, ClipboardList, PackageCheck, Sparkles, Users,
  Bug, BellRing, Megaphone, Calendar, Star, Truck, MessageSquare,
  CheckCircle2, XCircle, Target, Wrench, ScrollText, Clock, Reply, ShieldAlert, ExternalLink, PlayCircle, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { StageWrapup } from "../shared/StageWrapup";
import { resolveSpecialtyKeyAction } from "@foundone/shared";

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
  const { language, industryCategoryId, selectedIndustryId, guideStepIndex, setGuideStepIndex } = d;
  const ko = language === "ko";
  // 특수업종 KEY ACTION (specialty → category) — 있으면 페이지 기본 히어로보다 우선(업종 정확).
  const specialtyKA = resolveSpecialtyKeyAction("pre-launch-final", selectedIndustryId ?? undefined, industryCategoryId ?? undefined);
  const isStartup = industryCategoryId === "startup-tech";
  const isOnline = industryCategoryId === "online-digital";
  // 2026-06-30 사장님 신고: 미용실인데 '조리대 살균·직원 위생복' 등 음식 전용 점검이 뜸.
  //   오프라인을 업종군으로 분기 — food(음식·카페) / retail(소매) / service(미용·피트니스·반려·교육·생활).
  const offlineKind: "food" | "retail" | "beauty" | "fitness" | "pet" | "space" | "service" =
    industryCategoryId === "food" || industryCategoryId === "cafe-dessert" ? "food"
    : industryCategoryId === "retail" ? "retail"
    : industryCategoryId === "beauty" ? "beauty"
    : industryCategoryId === "fitness" ? "fitness"
    : industryCategoryId === "pet" ? "pet"
    // 무인·셀프 공간(스터디카페·독서실·파티룸·연습실·공유오피스) + 교육(학원·교습소)
    : industryCategoryId === "education" || industryCategoryId === "space" ? "space"
    : "service";
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
            { label: "위생 점검 적발 시 시정명령·과태료 리스크 — 냉장 온도·온도계 필수", text: "오픈 직전 냉장 0-10℃ / 냉동 -18℃ 이하 확인 + 온도계 부착. 위생취급기준 위반은 1차 시정명령·과태료, 반복 적발 시 영업정지로 가중. 위생 점검은 첫 달에 가장 자주 옴." },
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
  type CheckItem = { item: string; priority: string; required: boolean; how?: string };
  const checklist: CheckItem[] = isStartup
    ? (ko ? [
        { item: "프로덕션 환경 배포 + 도메인 연결 + SSL 인증서 확인", priority: "필수", required: true, how: "Vercel·Cloudflare에서 도메인 add → DNS A/CNAME 적용 → SSL 자동 발급 확인 (curl -I https://)" },
        { item: "Sentry 에러 모니터링 + Slack 알림 실제 트리거 테스트", priority: "필수", required: true, how: "코드에 throw new Error('test-' + Date.now()) 1줄 → Slack 채널에 메시지 도착 확인 → 즉시 제거" },
        { item: "결제 플로우 라이브 키로 100원 1건 결제 + 환불 완주", priority: "필수", required: true, how: "Toss/Stripe 라이브 키로 본인 카드 100원 결제 → 웹훅 수신 → 자동 환불 → 영수증 메일 도착" },
        { item: "랜딩 페이지: 헤드라인·CTA·OG 이미지 모바일 미리보기", priority: "필수", required: true, how: "metatags.io에서 OG 이미지 검증 + 카카오톡·X·LinkedIn 미리보기 1번씩 확인" },
        { item: "이용약관 + 개인정보처리방침 + 사업자 정보 풋터 표시", priority: "법적 필수", required: true, how: "PIPA 2025: 데이터 이동권 export API + 동의 분리 (마케팅·필수) + 외국 사업자면 국내대리인 지정" },
        { item: "404·500 페이지 + 로딩 상태 + 에러 fallback UI", priority: "필수", required: true, how: "next.config 에 not-found.tsx + error.tsx + loading.tsx 3종 작성. 댓글에 깨진 화면 캡처 = 치명적." },
        { item: "robots.txt + sitemap.xml + Google Search Console 등록", priority: "필수", required: true, how: "next-sitemap 패키지 → 빌드 시 자동 생성 → GSC에 sitemap 제출 → 색인 요청" },
        { item: "Status 페이지 (Better Stack / Instatus) + RSS 피드", priority: "필수", required: true, how: "Better Stack 무료 → 6개 모니터 등록 (web/api/db/auth/payment/cdn) → status.{domain} 서브도메인 연결" },
        { item: "Posthog/GA4 이벤트 트래킹 — 핵심 5개 이벤트 작동 확인", priority: "필수", required: true, how: "signup·activate·core_action·retain·pay 5개 이벤트 실제 발생시켜 대시보드에 도착 확인" },
        { item: "환불·취소 정책 명시 + 자동화 스크립트 준비", priority: "법적 필수", required: true, how: "결제 화면 + 풋터 + 메일 푸터 3곳에 정책 명시. 취소 사유별 응답 템플릿 3종 준비." },
        { item: "고객 지원 인박스 — Crisp/Intercom + 24시간 응답 SLA", priority: "필수", required: true, how: "Crisp 무료 2석 → 자동응답 + 영업시간 표시 + 슬랙 연결로 노티 받기" },
        { item: "백업·롤백 플랜 — Vercel 이전 배포로 1-click 롤백 검증", priority: "필수", required: true, how: "Vercel 대시보드 → 'Promote to Production' 1번 연습. DB 마이그 dry-run + rollback 스크립트 준비." },
        { item: "로드 테스트 — 50 RPS 5분 견디는지 확인", priority: "권장", required: false, how: "k6 / Artillery로 핵심 endpoint 50RPS × 5분 실행. p95 < 1초 목표." },
        { item: "모바일 반응형 + 주요 브라우저 (Chrome·Safari·Edge) 크로스 테스트", priority: "권장", required: false, how: "BrowserStack 무료 트라이얼 또는 실제 기기 3종 (iPhone·갤럭시·Mac Safari)" },
        { item: "PH 페이지 초안 — 태그라인 60자 + 스크린샷 5장 + 데모 GIF", priority: "권장", required: false, how: "태그라인은 'X for Y' 패턴 권장. 첫 스크린샷이 가장 중요 — 핵심 가치 1개만." },
        { item: "Show HN 초안 — 제목 'Show HN: Product – use case' + 본문 (기술·솔직)", priority: "권장", required: false, how: "PH +8h 게시. 마케팅 톤 X, 트레이드오프·미완성 부분 솔직히 인정." },
      ] : [
        { item: "Production deploy + domain + SSL verified", priority: "Required", required: true, how: "Vercel/Cloudflare DNS → SSL auto-issue (curl -I https://)" },
        { item: "Sentry + Slack alarm triggered with real error", priority: "Required", required: true, how: "throw new Error('test-' + Date.now()) → confirm Slack message → remove" },
        { item: "Live payment: 100 KRW charge + refund completed", priority: "Required", required: true, how: "Live key → real card → webhook → auto-refund → email receipt" },
        { item: "Landing: headline, CTA, OG image mobile-preview", priority: "Required", required: true, how: "metatags.io + Kakao/X/LinkedIn previews" },
        { item: "Legal: Terms, Privacy, biz info footer (PIPA 2025)", priority: "Legal", required: true, how: "Data portability export API + granular consent + KR rep if non-KR" },
        { item: "404/500 + loading + error fallback UI", priority: "Required", required: true, how: "not-found.tsx + error.tsx + loading.tsx" },
        { item: "robots.txt + sitemap.xml + GSC registered", priority: "Required", required: true, how: "next-sitemap → submit to GSC" },
        { item: "Status page (Better Stack/Instatus) + RSS", priority: "Required", required: true, how: "6 monitors: web/api/db/auth/payment/cdn" },
        { item: "Posthog/GA4 — 5 core events firing", priority: "Required", required: true, how: "signup/activate/core_action/retain/pay verified live" },
        { item: "Refund/cancel policy + automation", priority: "Legal", required: true, how: "Visible at checkout + footer + email. 3 reply templates by reason." },
        { item: "Support inbox — Crisp/Intercom + 24h SLA", priority: "Required", required: true, how: "Crisp 2 free seats + auto-reply + Slack notify" },
        { item: "Backup/rollback — Vercel 1-click verified", priority: "Required", required: true, how: "Promote-to-production drill + DB migration dry-run" },
        { item: "Load test — 50 RPS × 5 min", priority: "Recommended", required: false, how: "k6/Artillery, p95 < 1s" },
        { item: "Mobile responsive + cross-browser", priority: "Recommended", required: false, how: "BrowserStack or 3 real devices" },
        { item: "PH page draft — 60-char tagline + 5 screenshots + GIF", priority: "Recommended", required: false, how: "'X for Y' pattern. First screenshot = core value." },
        { item: "Show HN draft — 'Show HN: Product – use case' (honest)", priority: "Recommended", required: false, how: "Post +8h after PH. Be candid about trade-offs." },
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
      : (ko
        ? (offlineKind === "food" ? [
            { item: "카드 단말기 실제 결제·취소·영수증 출력 1사이클 테스트", priority: "필수", required: true },
            { item: "Wi-Fi 안정성 + 백업 핫스팟 자동전환 확인", priority: "필수", required: true },
            { item: "POS 메뉴·가격 등록 + 테스트 주문 5건 처리", priority: "필수", required: true },
            { item: "초도 식자재·소모품 발주 입고 + 유통기한 라벨링", priority: "필수", required: true },
            { item: "위생 점검: 냉장고 0~10℃ / 냉동 -18℃ + 조리대 살균 + 직원 위생복", priority: "필수", required: true },
            { item: "전기·가스·수도·환기 시스템 사업자 명의 + 작동 확인", priority: "필수", required: true },
            { item: "간판·메뉴판·가격표 설치 완료", priority: "권장", required: false },
            { item: "네이버 플레이스 등록 + 사진 5장+ + 카카오맵 정보 수정", priority: "권장", required: false },
          ] : offlineKind === "retail" ? [
            { item: "카드 단말기 실제 결제·취소·영수증 출력 1사이클 테스트", priority: "필수", required: true },
            { item: "Wi-Fi 안정성 + 백업 핫스팟 + 바코드 스캐너 작동 확인", priority: "필수", required: true },
            { item: "POS·상품 바코드·가격 등록 + 테스트 결제 5건 처리", priority: "필수", required: true },
            { item: "초도 상품 입고·검수 + 진열·가격표 부착 완료", priority: "필수", required: true },
            { item: "매장 청결·진열 상태·도난방지 태그·CCTV 점검", priority: "필수", required: true },
            { item: "진열대·집기·조명 + 전기·냉난방 사업자 명의·작동 확인", priority: "필수", required: true },
            { item: "간판·가격표·반품/교환 안내문 설치 완료", priority: "권장", required: false },
            { item: "네이버 플레이스 등록 + 사진 5장+ + 카카오맵 정보 수정", priority: "권장", required: false },
          ] : offlineKind === "beauty" ? [
            { item: "카드 단말기 실제 결제·취소·영수증 출력 1사이클 테스트", priority: "필수", required: true },
            { item: "예약 시스템(네이버 예약·전화) + Wi-Fi·백업 확인", priority: "필수", required: true },
            { item: "POS·시술/이용권 가격 등록 + 테스트 결제 처리", priority: "필수", required: true },
            { item: "시술재료·소모품·린넨·1회용품 초도 입고", priority: "필수", required: true },
            { item: "위생 점검: 기구 소독·살균기 + 1회용품 + 환기·손 세정·매장 청결", priority: "필수", required: true },
            { item: "시술/운동/케어 기기 시운전 + 전기·수도·냉난방 작동 확인", priority: "필수", required: true },
            { item: "간판·시술 메뉴/이용권 안내판·가격표 설치 완료", priority: "권장", required: false },
            { item: "네이버 플레이스 등록 + 사진 5장+ + 카카오맵 정보 수정", priority: "권장", required: false },
          ] : offlineKind === "fitness" ? [
            { item: "카드 단말기 + 회원권 정기결제(CMS·빌링) 실제 결제·취소 테스트", priority: "필수", required: true },
            { item: "출입 시스템(회원증·앱·키오스크) + Wi-Fi·백업 확인", priority: "필수", required: true },
            { item: "회원관리(락커·PT·이용권) 시스템 등록 + 테스트 결제", priority: "필수", required: true },
            { item: "운동기구·소모품(수건·소독제·매트) 초도 세팅 + 수량 확인", priority: "필수", required: true },
            { item: "안전 점검: 기구 볼트·케이블·비상정지 + 응급키트 + 환기·CO₂", priority: "필수", required: true },
            { item: "샤워·락커·냉난방 설비 작동 + 배상책임보험 가입 확인", priority: "필수", required: true },
            { item: "간판·이용안내·요금표·환불규정 게시 완료", priority: "권장", required: false },
            { item: "네이버 플레이스 등록 + 사진 5장+ + 카카오맵 정보 수정", priority: "권장", required: false },
          ] : offlineKind === "pet" ? [
            { item: "카드 단말기 실제 결제·취소·영수증 출력 1사이클 테스트", priority: "필수", required: true },
            { item: "예약(네이버·전화)·차트 시스템 + Wi-Fi·백업 확인", priority: "필수", required: true },
            { item: "POS·미용/호텔/유치원 이용권 등록 + 테스트 결제", priority: "필수", required: true },
            { item: "미용·위생 소모품(소독제·타월·배변패드) 초도 입고", priority: "필수", required: true },
            { item: "위생·안전: 케이지·미용대 소독 + CCTV(동물위탁관리 30일 보관) + 환기·냄새", priority: "필수", required: true },
            { item: "냉난방·급배수 + 동물 탈출방지·격리 공간 작동 확인", priority: "필수", required: true },
            { item: "간판·서비스 안내·요금표 설치 완료", priority: "권장", required: false },
            { item: "네이버 플레이스 등록 + 사진 5장+ + 카카오맵 정보 수정", priority: "권장", required: false },
          ] : offlineKind === "space" ? [
            { item: "무인 1사이클: 키오스크·앱 결제 → 좌석/룸 발권 → 출입 → 이용권 연장 끊김 점검", priority: "필수", required: true },
            { item: "출입 통제(도어락·앱·좌석발권) + Wi-Fi·백업 + 원격 제어 확인", priority: "필수", required: true },
            { item: "좌석/룸 예약·정산 시스템 등록 + 테스트 결제 5건", priority: "필수", required: true },
            { item: "비품·소모품(음료·프린터 용지·청소용품) 초도 입고", priority: "필수", required: true },
            { item: "안전: 소방(피난통로·소화기·유도등) + 전열교환기 환기(CO₂) + CCTV·비상벨", priority: "필수", required: true },
            { item: "냉난방·조명 자동/예약 제어 + 무인 시간대 원격 모니터링", priority: "필수", required: true },
            { item: "간판·이용안내·요금표·환불규정 게시 완료", priority: "권장", required: false },
            { item: "네이버 플레이스 등록 + 사진 5장+ + 카카오맵 정보 수정", priority: "권장", required: false },
          ] : [
            { item: "카드 단말기 실제 결제·취소·영수증 출력 1사이클 테스트", priority: "필수", required: true },
            { item: "접수·예약(네이버·전화) 시스템 + Wi-Fi·백업 확인", priority: "필수", required: true },
            { item: "POS·서비스 항목·요금 등록 + 테스트 결제", priority: "필수", required: true },
            { item: "작업 자재·소모품 초도 입고 + 장비 점검", priority: "필수", required: true },
            { item: "안전·위생: 작업 공간·장비 소독 + 환기 + 보호장비", priority: "필수", required: true },
            { item: "전기·수도·냉난방 사업자 명의 + 작동 확인", priority: "필수", required: true },
            { item: "간판·서비스 안내·요금표 설치 완료", priority: "권장", required: false },
            { item: "네이버 플레이스 등록 + 사진 5장+ + 카카오맵 정보 수정", priority: "권장", required: false },
          ])
        : (offlineKind === "food" ? [
            { item: "Card terminal: real charge, cancel, receipt cycle", priority: "Required", required: true },
            { item: "Wi-Fi + auto-failover hotspot confirmed", priority: "Required", required: true },
            { item: "POS menu/price + 5 test orders processed", priority: "Required", required: true },
            { item: "Initial ingredients/supplies + expiry labels", priority: "Required", required: true },
            { item: "Hygiene: 0-10℃ fridge / -18℃ freezer + sanitized + uniforms", priority: "Required", required: true },
            { item: "Utilities under business name + working", priority: "Required", required: true },
            { item: "Signage + menu board + price list", priority: "Recommended", required: false },
            { item: "Naver Place register + 5+ photos + KakaoMap update", priority: "Recommended", required: false },
          ] : offlineKind === "retail" ? [
            { item: "Card terminal: real charge, cancel, receipt cycle", priority: "Required", required: true },
            { item: "Wi-Fi + failover hotspot + barcode scanner working", priority: "Required", required: true },
            { item: "POS + product barcodes/prices + 5 test sales", priority: "Required", required: true },
            { item: "Initial stock received/inspected + displayed + price tags", priority: "Required", required: true },
            { item: "Store cleanliness + display state + anti-theft tags/CCTV", priority: "Required", required: true },
            { item: "Shelving/fixtures/lighting + power/HVAC under biz name", priority: "Required", required: true },
            { item: "Signage + price tags + return/exchange notice", priority: "Recommended", required: false },
            { item: "Naver Place register + 5+ photos + KakaoMap update", priority: "Recommended", required: false },
          ] : offlineKind === "beauty" ? [
            { item: "Card terminal: real charge, cancel, receipt cycle", priority: "Required", required: true },
            { item: "Booking system (Naver/phone) + Wi-Fi + backup", priority: "Required", required: true },
            { item: "POS + service/pass prices + test payment", priority: "Required", required: true },
            { item: "Service materials/supplies/linens/disposables stocked", priority: "Required", required: true },
            { item: "Hygiene: tool sterilizer + disposables + ventilation + hand-wash", priority: "Required", required: true },
            { item: "Treatment/fitness/care equipment trial + power/water/HVAC", priority: "Required", required: true },
            { item: "Signage + service/pass menu board + price list", priority: "Recommended", required: false },
            { item: "Naver Place register + 5+ photos + KakaoMap update", priority: "Recommended", required: false },
          ] : offlineKind === "fitness" ? [
            { item: "Card terminal + membership recurring billing (CMS) charge/cancel test", priority: "Required", required: true },
            { item: "Access system (member card/app/kiosk) + Wi-Fi + backup", priority: "Required", required: true },
            { item: "Membership (locker/PT/pass) system + test payment", priority: "Required", required: true },
            { item: "Equipment + supplies (towels/sanitizer/mats) staged + counted", priority: "Required", required: true },
            { item: "Safety: bolts/cables/emergency-stop + first-aid + ventilation/CO₂", priority: "Required", required: true },
            { item: "Shower/locker/HVAC working + liability insurance confirmed", priority: "Required", required: true },
            { item: "Signage + usage/price/refund policy posted", priority: "Recommended", required: false },
            { item: "Naver Place register + 5+ photos + KakaoMap update", priority: "Recommended", required: false },
          ] : offlineKind === "pet" ? [
            { item: "Card terminal: real charge, cancel, receipt cycle", priority: "Required", required: true },
            { item: "Booking (Naver/phone) + chart system + Wi-Fi + backup", priority: "Required", required: true },
            { item: "POS + grooming/hotel/daycare passes + test payment", priority: "Required", required: true },
            { item: "Grooming/hygiene supplies (sanitizer/towels/pads) stocked", priority: "Required", required: true },
            { item: "Hygiene/safety: cage/table sanitized + CCTV (30-day retention) + ventilation/odor", priority: "Required", required: true },
            { item: "HVAC/plumbing + escape-proof/isolation areas working", priority: "Required", required: true },
            { item: "Signage + service/price list", priority: "Recommended", required: false },
            { item: "Naver Place register + 5+ photos + KakaoMap update", priority: "Recommended", required: false },
          ] : offlineKind === "space" ? [
            { item: "Unmanned cycle: kiosk/app pay → seat/room issue → entry → extend, no breaks", priority: "Required", required: true },
            { item: "Access control (door lock/app/seat) + Wi-Fi + backup + remote control", priority: "Required", required: true },
            { item: "Seat/room booking + settlement system + 5 test payments", priority: "Required", required: true },
            { item: "Supplies (drinks/printer paper/cleaning) stocked", priority: "Required", required: true },
            { item: "Safety: fire (exit route/extinguisher/exit sign) + HRV ventilation (CO₂) + CCTV/panic button", priority: "Required", required: true },
            { item: "HVAC/lighting auto/scheduled + remote monitoring for unmanned hours", priority: "Required", required: true },
            { item: "Signage + usage/price/refund policy posted", priority: "Recommended", required: false },
            { item: "Naver Place register + 5+ photos + KakaoMap update", priority: "Recommended", required: false },
          ] : [
            { item: "Card terminal: real charge, cancel, receipt cycle", priority: "Required", required: true },
            { item: "Intake/booking (Naver/phone) + Wi-Fi + backup", priority: "Required", required: true },
            { item: "POS + service items/prices + test payment", priority: "Required", required: true },
            { item: "Work materials/supplies stocked + equipment checked", priority: "Required", required: true },
            { item: "Safety/hygiene: workspace/equipment sanitized + ventilation + PPE", priority: "Required", required: true },
            { item: "Power/water/HVAC under business name + working", priority: "Required", required: true },
            { item: "Signage + service/price list", priority: "Recommended", required: false },
            { item: "Naver Place register + 5+ photos + KakaoMap update", priority: "Recommended", required: false },
          ]));

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
      : (ko ? (offlineKind === "food" ? [
          { role: "입구·안내", task: "고객 맞이, 웨이팅 관리, 자리 안내. 첫인상이 곧 첫 리뷰", icon: Users },
          { role: "주문·카운터", task: "POS 주문 접수, 카드·QR 결제, 포장·테이크아웃 대응", icon: CreditCard },
          { role: "주방·제조", task: "조리/음료 제조, 플레이팅, 품질 관리. 첫 메뉴의 맛이 곧 생존", icon: Sparkles },
          { role: "서빙·후처리", task: "서빙, 테이블 정리, 재고 보충, 쓰레기 처리", icon: ClipboardList },
          { role: "비상 대응", task: "단말기 오류 → 모바일 결제, Wi-Fi 끊김 → 핫스팟, 식자재 소진 → 긴급 발주", icon: AlertTriangle },
        ] : offlineKind === "retail" ? [
          { role: "입구·안내", task: "고객 맞이, 매장 동선 안내, 첫인상 관리", icon: Users },
          { role: "계산·POS", task: "바코드 스캔, 카드·QR 결제, 포장", icon: CreditCard },
          { role: "진열·재고", task: "상품 보충, 진열 정리, 유통기한·재고 확인", icon: ClipboardList },
          { role: "고객 응대", task: "상품 문의·추천, 교환·환불 응대", icon: MessageSquare },
          { role: "비상 대응", task: "단말기 오류 → 모바일 결제, 도난 방지, 재고 소진 → 긴급 발주", icon: AlertTriangle },
        ] : offlineKind === "beauty" ? [
          { role: "안내·예약", task: "고객 맞이, 예약 확인, 대기 관리", icon: Users },
          { role: "카운터·결제", task: "접수, 카드·이용권 결제, 다음 예약 잡기", icon: CreditCard },
          { role: "시술·케어", task: "시술 진행, 위생·소독, 품질 관리", icon: Sparkles },
          { role: "준비·마감", task: "린넨·기구 준비·소독, 재료 보충, 청소", icon: ClipboardList },
          { role: "비상 대응", task: "단말기 오류 → 모바일 결제, 예약 중복 → 조정, 재료 소진 → 긴급 발주", icon: AlertTriangle },
        ] : offlineKind === "fitness" ? [
          { role: "안내·등록", task: "회원 맞이, 상담·등록, 이용권·락커 배정", icon: Users },
          { role: "카운터·결제", task: "회원권·PT 결제, 정기결제 관리", icon: CreditCard },
          { role: "지도·안전", task: "기구 사용법 안내, 운동 지도, 안전 관리", icon: Sparkles },
          { role: "시설·위생", task: "기구 소독, 수건·매트 관리, 락커·샤워 점검", icon: ClipboardList },
          { role: "비상 대응", task: "부상·안전사고 응급 대응, 기구 고장 처리", icon: AlertTriangle },
        ] : offlineKind === "pet" ? [
          { role: "안내·접수", task: "보호자 맞이, 예약·차트 확인, 반려동물 상태 체크", icon: Users },
          { role: "카운터·결제", task: "서비스 접수, 결제, 다음 예약", icon: CreditCard },
          { role: "미용·케어", task: "미용·목욕·케어 진행, 동물 안전·진정", icon: Sparkles },
          { role: "위생·안전", task: "케이지·미용대 소독, 배변 처리, 탈출 방지", icon: ClipboardList },
          { role: "비상 대응", task: "동물 부상·이상 시 대응, 보호자 즉시 연락", icon: AlertTriangle },
        ] : offlineKind === "space" ? [
          { role: "원격 모니터링", task: "무인 매장이면 CCTV·좌석 점유·결제 현황 실시간 확인", icon: BellRing },
          { role: "무인 결제·발권", task: "키오스크·앱 결제 → 좌석/룸 발권 정상 작동 확인", icon: CreditCard },
          { role: "출입·보안", task: "도어락·출입 로그·비상벨 점검", icon: AlertTriangle },
          { role: "청결·비품", task: "순회 청소, 음료·용지 보충, 쓰레기 처리", icon: ClipboardList },
          { role: "원격 대응", task: "결제·출입 오류 원격 조치, 소음·분쟁 CS 응대", icon: MessageSquare },
        ] : [
          { role: "안내·접수", task: "고객 맞이, 접수·예약 확인", icon: Users },
          { role: "카운터·결제", task: "서비스 접수, 결제, 다음 예약", icon: CreditCard },
          { role: "작업·서비스", task: "서비스 진행, 품질 관리", icon: Sparkles },
          { role: "준비·정리", task: "자재·장비 준비, 작업 공간 정리·위생", icon: ClipboardList },
          { role: "비상 대응", task: "단말기 오류 → 모바일 결제, 장비 고장, 자재 소진 → 긴급 발주", icon: AlertTriangle },
        ])
        : (offlineKind === "food" ? [
          { role: "Door/Floor", task: "Welcome, manage wait, seat. First impression = first review", icon: Users },
          { role: "Counter/POS", task: "Take orders, card/QR pay, takeout", icon: CreditCard },
          { role: "Kitchen/Prep", task: "Cook/brew, plate, quality. Taste = survival", icon: Sparkles },
          { role: "Serve/Clean", task: "Serve, clear, restock, waste", icon: ClipboardList },
          { role: "Emergency", task: "Terminal fail → mobile pay, Wi-Fi → hotspot, stockout → emergency order", icon: AlertTriangle },
        ] : offlineKind === "retail" ? [
          { role: "Floor/Greet", task: "Welcome, guide flow, manage first impression", icon: Users },
          { role: "Checkout/POS", task: "Barcode scan, card/QR pay, bagging", icon: CreditCard },
          { role: "Stock/Display", task: "Restock, tidy displays, check expiry/counts", icon: ClipboardList },
          { role: "Customer", task: "Product Q&A/recommend, exchange/refund", icon: MessageSquare },
          { role: "Emergency", task: "Terminal fail → mobile pay, theft prevention, stockout → reorder", icon: AlertTriangle },
        ] : offlineKind === "beauty" ? [
          { role: "Greet/Booking", task: "Welcome, confirm bookings, manage wait", icon: Users },
          { role: "Counter/Pay", task: "Intake, card/pass pay, rebook", icon: CreditCard },
          { role: "Service/Care", task: "Perform service, hygiene/sterilize, quality", icon: Sparkles },
          { role: "Prep/Close", task: "Linen/tool prep+sterilize, restock, clean", icon: ClipboardList },
          { role: "Emergency", task: "Terminal fail → mobile pay, double-booking → adjust, stockout → reorder", icon: AlertTriangle },
        ] : offlineKind === "fitness" ? [
          { role: "Greet/Sign-up", task: "Welcome, consult/enroll, assign pass/locker", icon: Users },
          { role: "Counter/Pay", task: "Membership/PT pay, recurring billing", icon: CreditCard },
          { role: "Coach/Safety", task: "Equipment guidance, coaching, safety", icon: Sparkles },
          { role: "Facility/Hygiene", task: "Sanitize equipment, towels/mats, locker/shower", icon: ClipboardList },
          { role: "Emergency", task: "Injury/accident first-aid, equipment breakdown", icon: AlertTriangle },
        ] : offlineKind === "pet" ? [
          { role: "Greet/Intake", task: "Welcome owner, confirm booking/chart, check pet", icon: Users },
          { role: "Counter/Pay", task: "Service intake, pay, rebook", icon: CreditCard },
          { role: "Groom/Care", task: "Grooming/bath/care, animal safety/calming", icon: Sparkles },
          { role: "Hygiene/Safety", task: "Cage/table sanitize, waste, escape prevention", icon: ClipboardList },
          { role: "Emergency", task: "Pet injury/abnormality response, contact owner", icon: AlertTriangle },
        ] : offlineKind === "space" ? [
          { role: "Remote monitor", task: "Unmanned: watch CCTV/seat occupancy/payments live", icon: BellRing },
          { role: "Unmanned pay", task: "Kiosk/app pay → seat/room issuing works", icon: CreditCard },
          { role: "Access/Security", task: "Door lock/access logs/panic button check", icon: AlertTriangle },
          { role: "Clean/Supply", task: "Rounds cleaning, drink/paper restock, waste", icon: ClipboardList },
          { role: "Remote CS", task: "Remote fix pay/access errors, noise/dispute CS", icon: MessageSquare },
        ] : [
          { role: "Greet/Intake", task: "Welcome, intake/confirm booking", icon: Users },
          { role: "Counter/Pay", task: "Service intake, pay, rebook", icon: CreditCard },
          { role: "Service", task: "Perform service, quality control", icon: Sparkles },
          { role: "Prep/Clean", task: "Prep materials/equipment, tidy/hygiene", icon: ClipboardList },
          { role: "Emergency", task: "Terminal fail → mobile pay, equipment breakdown, material stockout", icon: AlertTriangle },
        ]));

  // ─── Page 3 타임라인 ───
  type TimelineItem = { when: string; what: string; channel: string };
  const timeline: TimelineItem[] = isStartup
    ? (ko ? [
        { when: "D-28", what: "베타 모집 시작 — 인터뷰 했던 잠재 고객 50명 reach. PH 페이지 초안 작성", channel: "DM · 이메일" },
        { when: "D-21", what: "핵심 플로우 안정화 + 베타 사용자 5명 인터뷰 + 빌드인퍼블릭 시작", channel: "Discord · X" },
        { when: "D-14", what: "베타 5~10명 활성 + PH 페이지 등록 (예약은 D-7) + Show HN 초안", channel: "비공개 · PH 임시" },
        { when: "D-10", what: "트위터/LinkedIn 빌드인퍼블릭 본격화 — 매일 1포스트 (제품 진행 + 학습)", channel: "X · LinkedIn" },
        { when: "D-7",  what: "PH 예약 게시 + 랜딩 공개 + 메일링 알림 + 핵심 supporter 200명 DM 1차", channel: "PH · 이메일 · DM" },
        { when: "D-5",  what: "데모 영상 90초 완성 + X 스레드 초안 5개 + LinkedIn 비즈니스 앵글 포스트", channel: "X · LinkedIn · YouTube" },
        { when: "D-3",  what: "SNS 티저 + 인플루언서 5명 reach + 메일링 D-Day 안내 예약 발송", channel: "X · 인플루언서" },
        { when: "D-1",  what: "최종 배포 + 모니터링 트리거 테스트 + 캐시 워밍 + 팀 역할 확정 + 일찍 취침", channel: "내부" },
        { when: "D-Day",what: "12:01 PT 게시 → +2분 메이커 AMA → +1h 트위터 스레드 → +8h Show HN 게시", channel: "전 채널" },
        { when: "D+1",  what: "감사 메시지 (개인 DM 200건+) + 핫픽스 + PH 결과 회고 트윗", channel: "사용자 · X" },
        { when: "D+3",  what: "두 번째 콘텐츠 웨이브 — '론칭에서 배운 것' 블로그 글 + 코호트 분석", channel: "블로그 · X" },
        { when: "D+7",  what: "지표 리뷰: DAU·D+7 retention 25-35% 목표·전환·이탈 → 다음 1주 액션", channel: "내부 · 메일" },
        { when: "D+14", what: "코호트 정착 — D+14 retention 18-25% 확인. 미달 시 핵심 가치 재정의", channel: "내부" },
      ] : [
        { when: "D-28", what: "Beta recruit — DM 50 interviewed leads. Draft PH page", channel: "DM · Email" },
        { when: "D-21", what: "Core flow stabilized + 5 beta interviews + build-in-public starts", channel: "Discord · X" },
        { when: "D-14", what: "5-10 active beta + PH page registered (schedule at D-7) + Show HN draft", channel: "Private · PH" },
        { when: "D-10", what: "X/LinkedIn build-in-public daily (progress + learnings)", channel: "X · LinkedIn" },
        { when: "D-7",  what: "PH scheduled + landing live + mailing notify + DM top-200 supporters", channel: "PH · Email · DM" },
        { when: "D-5",  what: "90s demo video + 5 X-thread drafts + LinkedIn business angle", channel: "X · LinkedIn · YT" },
        { when: "D-3",  what: "Social teasers + reach 5 influencers + schedule mailing D-day blast", channel: "X · Influencer" },
        { when: "D-1",  what: "Final deploy + alarm tests + cache warm + team roles + sleep early", channel: "Internal" },
        { when: "D-Day",what: "12:01 PT post → +2min maker AMA → +1h X thread → +8h Show HN", channel: "All" },
        { when: "D+1",  what: "Personal thank-you DMs (200+) + hotfix + PH retro tweet", channel: "Users · X" },
        { when: "D+3",  what: "Second content wave — 'lessons from launch' blog + cohort analysis", channel: "Blog · X" },
        { when: "D+7",  what: "Metrics review: DAU · D+7 retention 25-35% target · drop-off", channel: "Internal · Email" },
        { when: "D+14", what: "Cohort plateau — verify D+14 retention 18-25%. Below = pivot core value", channel: "Internal" },
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
      : (ko ? (offlineKind === "food" ? [
          { when: "D-14", what: "매장 공사·세팅 비하인드 사진/영상 누적 (스토리 7개+)", channel: "인스타 릴스" },
          { when: "D-7", what: "메뉴 소개 + 오픈 날짜 공지 + 첫 방문 할인 이벤트", channel: "인스타 · 카카오" },
          { when: "D-3", what: "네이버 플레이스 등록 + 사진 5장+ + 카카오맵 정보 수정", channel: "네이버 · 카카오" },
          { when: "D-1", what: "직원 1시간 모의 운영 + 비상 연락 체계 + 재고 최종 점검", channel: "내부" },
          { when: "D-Day", what: "오픈 + 라이브 스토리 + 영수증 리뷰 이벤트 + 첫 고객 응대 집중", channel: "전 채널" },
          { when: "D+1", what: "첫날 매출·고객 피드백 정리 + 개선점 즉시 기록", channel: "내부" },
          { when: "D+7", what: "첫 주 매출 분석 + 리뷰 3개 확보 후 배달앱 광고 시작", channel: "배민 · 인스타" },
        ] : [
          { when: "D-14", what: "매장 세팅·준비 과정 비하인드 사진/영상 누적 (스토리 7개+)", channel: "인스타 릴스" },
          { when: "D-7", what: "핵심 상품·서비스 소개 + 오픈 날짜 공지 + 첫 방문 할인 이벤트", channel: "인스타 · 카카오" },
          { when: "D-3", what: "네이버 플레이스 등록 + 사진 5장+ + 카카오맵 정보 수정", channel: "네이버 · 카카오" },
          { when: "D-1", what: "1시간 모의 운영(무인이면 셀프 1사이클) + 비상 연락 체계 + 재고·설비 최종 점검", channel: "내부" },
          { when: "D-Day", what: "오픈 + 라이브 스토리 + 리뷰 이벤트 + 첫 고객 응대 집중", channel: "전 채널" },
          { when: "D+1", what: "첫날 매출·고객 피드백 정리 + 개선점 즉시 기록", channel: "내부" },
          { when: "D+7", what: "첫 주 매출 분석 + 리뷰 3개 확보 후 유료 광고 시작 (네이버·인스타 등 업종 채널)", channel: "네이버 · 인스타" },
        ])
        : (offlineKind === "food" ? [
          { when: "D-14", what: "Behind-the-scenes setup photos/reels (7+ stories)", channel: "Instagram Reels" },
          { when: "D-7", what: "Menu reveal + opening date + first-visit discount", channel: "Instagram · Kakao" },
          { when: "D-3", what: "Naver Place registered (5+ photos) + KakaoMap update", channel: "Naver · Kakao" },
          { when: "D-1", what: "1-hour staff dry run + emergency contacts + inventory check", channel: "Internal" },
          { when: "D-Day", what: "Open + live stories + receipt review event + customer focus", channel: "All" },
          { when: "D+1", what: "Day 1 revenue + feedback + improvement notes", channel: "Internal" },
          { when: "D+7", what: "Week 1 analysis + delivery ads after 3 reviews", channel: "Baemin · Instagram" },
        ] : [
          { when: "D-14", what: "Behind-the-scenes setup photos/reels (7+ stories)", channel: "Instagram Reels" },
          { when: "D-7", what: "Key product/service reveal + opening date + first-visit discount", channel: "Instagram · Kakao" },
          { when: "D-3", what: "Naver Place registered (5+ photos) + KakaoMap update", channel: "Naver · Kakao" },
          { when: "D-1", what: "1-hour dry run (self cycle if unmanned) + emergency contacts + inventory/equipment check", channel: "Internal" },
          { when: "D-Day", what: "Open + live stories + review event + customer focus", channel: "All" },
          { when: "D+1", what: "Day 1 revenue + feedback + improvement notes", channel: "Internal" },
          { when: "D+7", what: "Week 1 analysis + paid ads after 3 reviews (Naver/Instagram)", channel: "Naver · Instagram" },
        ]));

  // ─── Page 0 추가: 성공/실패 케이스 + 북극성 지표 ───
  type CaseItem = { kind: "win" | "fail"; title: string; body: string };
  const cases: CaseItem[] = isStartup
    ? (ko ? [
        { kind: "win",  title: "Cal.com (PH 2022 #1)", body: "베타 100명 6주 전부터 모집 → 12:01 PT 화 게시 → 메이커 첫 댓글에 GIF + 5분마다 응답 → first-hour 350+ upvote. 이후 시리즈 A 유치." },
        { kind: "win",  title: "Linear (Show HN 1위)", body: "기술 정직성 + 공동창업자 직접 응답. '뭐가 안 되는지' 솔직히 인정. 마케팅 톤 0% — HN 본질에 충실." },
        { kind: "fail", title: "AI 앱 X (실패)",       body: "waitlist 0명 + 23시 KST 게시 (PT 06시) + 메이커 댓글 6시간 늦음 → 25위 + 사용자 0명. 6주 준비 없이 '게시만'한 결과." },
      ] : [
        { kind: "win",  title: "Cal.com (PH 2022 #1)", body: "100 beta over 6 wks → 12:01 PT Tue → maker GIF first comment + 5-min replies → 350+ first-hour upvotes → Series A." },
        { kind: "win",  title: "Linear (Show HN #1)",   body: "Technical honesty + co-founder direct replies. Admitted what's missing. Zero marketing tone — true to HN." },
        { kind: "fail", title: "Anonymous AI app",       body: "Zero waitlist + 11pm KST post (06:00 PT) + maker silent 6h → rank 25 + 0 users. 6-week prep skipped = failure." },
      ])
    : isOnline
      ? (ko ? [
          { kind: "win",  title: "신규 셀러 A (오픈 1주 ★4.9)", body: "오픈 전 자기 주문 1번 완주 + 포토리뷰 카드 동봉 + 톡톡 12시간 내 응답. 첫 30주문 모두 발송 사고 0건." },
          { kind: "fail", title: "셀러 B (오픈 3일 ★2.8)",     body: "재고 1개 동시 주문 2건 → 강제 환불 + 부정 리뷰 → 노출 패널티. 시스템 수량 미동기화 한 번이 6개월 영향." },
        ] : [
          { kind: "win",  title: "Seller A (★4.9 in week 1)", body: "Self-order dry run + review card + 12h TalkTalk reply. Zero incidents on first 30 orders." },
          { kind: "fail", title: "Seller B (★2.8 in 3 days)",  body: "1 stock + 2 orders = forced refund + bad review + ranking penalty. One sync miss = 6mo impact." },
        ])
      : (ko ? [
          { kind: "win",  title: "카페 X (오픈 첫 주 리뷰 12)",  body: "POS 1시간 모의운영 + 영수증 리뷰 이벤트 + 인스타 D-7부터 매일 1콘텐츠. 첫 주말 만석." },
          { kind: "fail", title: "식당 Y (오픈 첫날 ★1점 3건)",  body: "단말기 점검 미실행 → 첫 손님 카드 결제 실패 → 부정 리뷰 → 네이버 노출 6주간 회복 불가." },
        ] : [
          { kind: "win",  title: "Cafe X (12 reviews wk1)",     body: "POS 1h dry run + receipt review event + daily Insta from D-7 → full house first weekend." },
          { kind: "fail", title: "Resto Y (3× 1-star day 1)",   body: "Skipped terminal check → first card fail → bad reviews → 6 weeks to recover Naver visibility." },
        ]);

  // ─── 북극성 지표 (3개) ───
  type MetricItem = { label: string; value: string; subline: string };
  const northStarMetrics: MetricItem[] = isStartup
    ? (ko ? [
        { label: "First-hour upvote",    value: "200+",     subline: "PH 페이지 노출 시작 임계값. 미달이면 1위 거의 불가" },
        { label: "메이커 첫 댓글 지연",   value: "<5분",     subline: "12:01 PT +2분에 핀 고정. 5분 늦으면 알고리즘 가중 ↓" },
        { label: "D+7 retention",        value: "25~35%",   subline: "이하면 제품 핵심 가치 재정의 — PH 1위보다 retention이 사업 결정" },
      ] : [
        { label: "First-hour upvote",    value: "200+",     subline: "PH visibility threshold. Below = #1 nearly impossible" },
        { label: "Maker comment latency",value: "<5 min",   subline: "Pinned at 12:01 PT +2min. >5min = algo weight drops" },
        { label: "D+7 retention",        value: "25-35%",   subline: "Below = redefine core value. Retention beats PH #1 for survival" },
      ])
    : isOnline
      ? (ko ? [
          { label: "첫 24시간 주문 처리", value: "100%",     subline: "발송 사고 1건이면 ★ 회복에 30일 — 모의 1번이 광고 30만원보다 효과" },
          { label: "톡톡 1차 응답",      value: "<12시간",  subline: "2025.4부터 강화. 미응답률 5%↑면 노출 제한" },
          { label: "첫 30일 진성 리뷰",   value: "30개+",    subline: "포토리뷰 적립 200원·텍스트 50원. 가짜 리뷰는 AI 적발 = 영구 정지" },
        ] : [
          { label: "First 24h fulfillment",value: "100%",     subline: "1 ship failure = 30 days to recover stars" },
          { label: "TalkTalk first reply", value: "<12h",     subline: "2025.4 enforcement. >5% miss rate = ranking penalty" },
          { label: "Genuine reviews 30d",  value: "30+",      subline: "Photo review 200₩, text 50₩ rewards. AI detects fakes." },
        ])
      : (ko ? [
          { label: "오픈 첫 주 사고",     value: "0건",       subline: "단말기·Wi-Fi·POS — 1번 모의 = 첫 주 사고 0순위" },
          { label: "첫 30일 영수증 리뷰", value: "30개+",     subline: "위치+영수증+실명 인증. 답글 100% 24시간 내가 재방문 신호" },
          { label: "재방문 시그널",       value: "저장·전화·길찾기", subline: "2025.5 알고리즘 — '실제 방문 가능성'이 노출 가중" },
        ] : [
          { label: "First-week incidents",   value: "0",            subline: "Terminal/Wi-Fi/POS — 1h dry run = #1 prevention" },
          { label: "Receipt reviews 30d",    value: "30+",          subline: "GPS+receipt+name verified. 100% replies <24h = revisit signal" },
          { label: "Revisit signals",        value: "save·call·route", subline: "2025.5 algo weights visit-likelihood over raw counts" },
        ]);

  // ─── Page 2 추가: D-Day 시간대별 운영 (Pacific Time 기준) ───
  type ScheduleItem = { time: string; localKst: string; what: string };
  const dayOfSchedule: ScheduleItem[] = isStartup
    ? (ko ? [
        { time: "T-8h",  localKst: "21:00 KST 전날", what: "Pre-flight: Sentry green · Vercel deploy lock · Status 페이지 live · 지원 인박스 점검" },
        { time: "T-5m",  localKst: "04:55 KST",      what: "캐시 워밍 (홈·랜딩·핵심 API 1회씩 호출) + Slack on-call standby + 노트북 충전 100%" },
        { time: "T+0",   localKst: "05:01 KST",      what: "12:01 PT 자동 게시 → URL 확인 → 핵심 supporter 채널에 공유" },
        { time: "T+2m",  localKst: "05:03 KST",      what: "메이커 첫 댓글 게시 + 핀 고정 (이름·문제·3-4 benefits·GIF·CTA·revenue model)" },
        { time: "T+5~60m", localKst: "05:06~06:00",  what: "모든 댓글 5분 내 응답 — 알림 cadence가 알고리즘 입력. 첫 시간이 ranking 결정" },
        { time: "T+1h",  localKst: "06:00 KST",      what: "트위터 스레드 + LinkedIn 포스트 + 핵심 supporter 200+ DM 1차 wave" },
        { time: "T+4h",  localKst: "09:00 KST",      what: "아시아 wake-up wave — 한국·일본·싱가포르 supporter 동원 + LinkedIn 비즈니스 앵글" },
        { time: "T+8h",  localKst: "13:00 KST",      what: "US East Coast wake-up + Show HN 크로스포스트 (제목·본문 다시 작성, 마케팅 톤 X)" },
        { time: "T+12h", localKst: "17:00 KST",      what: "Twitter Space 15분 AMA 진행 + Hunt URL 핀 + Discord live Q&A" },
        { time: "T+18h", localKst: "23:00 KST",      what: "유럽 last call + thank-you 포스트 + 첫날 첫 사용자 인터뷰 1건" },
        { time: "T+23h", localKst: "04:00 KST D+1",  what: "11:59 PM PT — 24h 사이클 종료. 최종 순위 기록 + 팀 사진 + 데이터 백업" },
      ] : [
        { time: "T-8h",  localKst: "—",  what: "Pre-flight: Sentry green, deploy locked, status page live, support inbox staffed" },
        { time: "T-5m",  localKst: "—",  what: "Cache warm (home/landing/core API), Slack on-call, devices charged" },
        { time: "T+0",   localKst: "—",  what: "12:01 AM PT — verify URL live → share to core supporter channels" },
        { time: "T+2m",  localKst: "—",  what: "Maker first comment posted + pinned (name·problem·3-4 benefits·GIF·CTA·revenue model)" },
        { time: "T+5~60m", localKst: "—", what: "Reply within 5 min to every comment — notification cadence feeds the algo" },
        { time: "T+1h",  localKst: "—",  what: "X thread + LinkedIn post + DM core 200+ supporters wave 1" },
        { time: "T+4h",  localKst: "—",  what: "Asia wake-up — KR/JP/SG supporters + LinkedIn business angle" },
        { time: "T+8h",  localKst: "—",  what: "US East wake-up + Show HN cross-post (rewrite title + body, no marketing tone)" },
        { time: "T+12h", localKst: "—",  what: "15-min Twitter Space AMA + pin Hunt URL + Discord live Q&A" },
        { time: "T+18h", localKst: "—",  what: "Europe last call + thank-you + 1 first-user interview" },
        { time: "T+23h", localKst: "—",  what: "11:59 PM PT cycle close — record rank, team photo, data backup" },
      ])
    : [];

  // ─── 메이커 댓글 5종 템플릿 (짧고 솔직한 톤) ───
  type ReplyTemplate = { kind: string; korean: string; english: string };
  const replyTemplates: ReplyTemplate[] = isStartup ? [
    { kind: ko ? "환영 (일반 upvoter)" : "Welcome",   korean: "Thanks {이름} — 의미 있어요. 무엇이 여기로 이끌었나요?",                                                  english: "Thanks {name} — means a lot. Curious: what brought you here today?" },
    { kind: ko ? "기능 요청" : "Feature request",      korean: "좋은 지적이에요. 큐에 추가했고 여기서 추적 중 {링크}. 단기적으로 {대안}이 도움될까요?",                  english: "Great call. Adding to our queue — tracking it here {link}. Would {alt} solve it short-term?" },
    { kind: ko ? "버그 신고" : "Bug report",          korean: "죄송합니다 — 우리 책임입니다. DM으로 계정 이메일 + 재현 단계 보내주실래요? 오늘 수정 목표.",            english: "Sorry — that's on us. Can you DM your account email + steps? Aiming to ship a fix today." },
    { kind: ko ? "칭찬" : "Praise",                    korean: "감사합니다. 팀이 봅니다. 더 날카롭게 만들려면 1가지를 빼야 한다면 무엇일까요?",                       english: "Appreciate it. The team will see this. What's one thing you'd remove to make it sharper?" },
    { kind: ko ? "비판자" : "Critic",                  korean: "정당한 지적입니다. {반복}이 맞아요. 트레이드오프는 {이유}였습니다. 바꿀 의향 있어요 — 어떻게 만드시겠어요?", english: "Fair point. You're right that {restate}. Trade-off was {reason}. Open to changing it — what would you ship instead?" },
  ] : [];

  // ─── 응급 시나리오 5종 ───
  type EmergencyItem = { trigger: string; playbook: string };
  const emergencies: EmergencyItem[] = isStartup
    ? (ko ? [
        { trigger: "서버 다운 / 5xx 폭주",       playbook: "① Vercel·Cloudflare 상태 페이지 확인 ② 직전 배포로 1-click 롤백 ③ Status 페이지 'Investigating' ④ PH 댓글에 정중 공지 ⑤ 5분 단위 업데이트" },
        { trigger: "DB 잠김 / connection pool 만료", playbook: "① Supabase 콘솔 → DB stats ② idle connection kill (pg_stat_activity) ③ pool size 일시 증가 ④ slow query 분리 ⑤ 정상화 후 root cause 트윗" },
        { trigger: "결제 실패 / 웹훅 미전달",    playbook: "① Toss/Stripe 대시보드 → 웹훅 로그 ② 라이브 키 검증 ③ 환불 자동화 작동 ④ 영향 받은 사용자 개별 사과 + 크레딧" },
        { trigger: "댓글 폭주 / 알림 한계",      playbook: "우선순위: 버그 > 기능 요청 > 칭찬. 5분 룰 깨면 일부 알림 음소거. 솔로면 칭찬은 'thanks 🙏' 짧게, 버그·기능은 풀응답" },
        { trigger: "부정 리뷰 / 트롤",          playbook: "① 24시간 내 정중 응답 ② 구체적 사실 기반 ③ 절대 삭제·차단 X ④ 감정적 대응 X ⑤ 정당한 비판이면 공개 사과 + 수정 약속" },
      ] : [
        { trigger: "Server down / 5xx spike",      playbook: "① Check Vercel·CF status ② 1-click rollback to prev deploy ③ Status page 'Investigating' ④ PH comment notice ⑤ Update every 5 min" },
        { trigger: "DB lock / pool exhausted",     playbook: "① Supabase console → DB stats ② Kill idle connections ③ Temp increase pool size ④ Isolate slow queries ⑤ Tweet root cause after recovery" },
        { trigger: "Payment fail / webhook miss",  playbook: "① Toss/Stripe dashboard → webhook logs ② Verify live keys ③ Confirm refund automation ④ Apologize to affected users + credits" },
        { trigger: "Comment flood / alert overload", playbook: "Priority: bugs > features > praise. Mute some alerts if 5-min rule breaks. Solo? Short 'thanks 🙏' for praise; full reply for bugs/features" },
        { trigger: "Negative review / troll",       playbook: "① Reply within 24h politely ② Stick to facts ③ Never delete/block ④ No emotion ⑤ If valid, public apology + fix promise" },
      ])
    : [];

  // ─── 필수 스택 (2026 검증 가격) ───
  type StackItem = { name: string; cost: string; purpose: string; url: string };
  const stack: StackItem[] = isStartup
    ? (ko ? [
        { name: "Sentry (Team)",      cost: "$26/mo",   purpose: "에러 모니터링 + Slack 알림. 코드 1줄로 트리거 검증.",     url: "https://sentry.io/pricing/" },
        { name: "Vercel Pro",         cost: "$20/seat", purpose: "Next.js 배포·프리뷰·1-click 롤백. 1TB 후 $0.15/GB.",     url: "https://vercel.com/pricing" },
        { name: "Supabase Pro",       cost: "$25/mo",   purpose: "Postgres + Auth + Storage. RLS 활성화 필수.",            url: "https://supabase.com/pricing" },
        { name: "Better Stack",       cost: "무료~$20", purpose: "상태 페이지 + uptime 모니터링. status.{domain} 연결.",   url: "https://betterstack.com/" },
        { name: "PostHog (Cloud)",    cost: "1M event 무료", purpose: "이벤트 분석 + 펀널. signup·activate·retain·pay 5종.", url: "https://posthog.com/pricing" },
        { name: "Crisp Chat",         cost: "2석 무료",  purpose: "고객 지원 인박스 + Slack 알림. 24시간 응답 SLA.",         url: "https://crisp.chat/" },
        { name: "Cloudflare Pages",   cost: "무료",      purpose: "CDN + DDoS 방어. <10k MAU 충분.",                        url: "https://pages.cloudflare.com/" },
      ] : [
        { name: "Sentry (Team)",     cost: "$26/mo",   purpose: "Error monitoring + Slack alerts. Verify with one error.", url: "https://sentry.io/pricing/" },
        { name: "Vercel Pro",        cost: "$20/seat", purpose: "Deploy + previews + 1-click rollback. $0.15/GB after 1TB.", url: "https://vercel.com/pricing" },
        { name: "Supabase Pro",      cost: "$25/mo",   purpose: "Postgres + Auth + Storage. RLS mandatory.",                url: "https://supabase.com/pricing" },
        { name: "Better Stack",      cost: "Free~$20", purpose: "Status page + uptime monitor. status.{domain}.",            url: "https://betterstack.com/" },
        { name: "PostHog Cloud",     cost: "1M free",  purpose: "Events + funnels. signup·activate·retain·pay.",            url: "https://posthog.com/pricing" },
        { name: "Crisp Chat",        cost: "2 free",   purpose: "Support inbox + Slack notify. 24h SLA.",                  url: "https://crisp.chat/" },
        { name: "Cloudflare Pages",  cost: "Free",     purpose: "CDN + DDoS shield. <10k MAU sufficient.",                   url: "https://pages.cloudflare.com/" },
      ])
    : [];

  // ─── PIPA 2025 법적 필수 ───
  type LegalItem = { title: string; deadline: string; detail: string };
  const legalRequirements: LegalItem[] = isStartup
    ? (ko ? [
        { title: "데이터 이동권 (data portability)",  deadline: "2025.3.13 시행",   detail: "사용자가 자기 데이터를 머신리더블 형식으로 export 할 수 있어야 함 — API 또는 다운로드 버튼 제공" },
        { title: "외국 사업자 국내대리인 지정",       deadline: "2025.10.2 시행",   detail: "한국 사용자 대상 외국 법인은 국내 대리인 지정·등록 의무. 미지정 시 과태료." },
        { title: "동의 분리 의무",                    deadline: "2024.9~ 진행 중",  detail: "필수 수집·마케팅·제3자 제공 동의를 절대 묶음 처리 X. 항목별 별도 체크박스" },
        { title: "AI 자동의사결정 투명성",            deadline: "2025~ 진행 중",    detail: "AI 프로파일링 사용 시 로직 공개 + cross-border 데이터 이전 명시 + 거부권 안내" },
        { title: "이용약관 + 개인정보처리방침 + 풋터", deadline: "오픈 즉시 필수",   detail: "사업자 정보 (상호·대표·주소·사업자번호·통신판매업) + 환불 정책 + 문의처 표시" },
      ] : [
        { title: "Data portability",            deadline: "Mar 13, 2025", detail: "Users must export their data in machine-readable format — API or download" },
        { title: "Domestic representative",     deadline: "Oct 2, 2025",  detail: "Foreign businesses serving KR users must appoint and register a KR representative" },
        { title: "Granular consent",            deadline: "Sept 2024+",   detail: "Never bundle required·marketing·3rd-party consent — separate checkboxes per item" },
        { title: "AI decision transparency",    deadline: "2025+",        detail: "Disclose profiling logic + cross-border transfer + opt-out path for AI decisions" },
        { title: "Terms + Privacy + Footer",    deadline: "Day 1",        detail: "Business info (name·CEO·address·biz number·e-commerce permit) + refund policy + contact" },
      ])
    : [];

  // ─── 페이지별 "오늘 할 일" 액션 플랜 (3가지 명령형) ───
  type ActionStep = { verb: string; detail: string; time: string };
  const pageActionPlan: Record<number, ActionStep[]> = isStartup
    ? (ko ? {
        0: [
          { verb: "베타 사용자 10명 명단 작성",       detail: "인터뷰했던·관심 보였던 사람·트위터 follower 중 10명 추려 노션·스프레드시트에 정리", time: "30분" },
          { verb: "D-Day 날짜 확정 (화·수, 12:01 PT)", detail: "오늘부터 4~6주 후 화요일 또는 수요일 선택 → 캘린더에 'PH Launch — D-Day' 등록",       time: "5분" },
          { verb: "6주 캘린더 등록",                  detail: "Page 3의 D-28~D+14 13개 알림을 그대로 캘린더에 복사 — 매일 1행동 자동화",                 time: "20분" },
        ],
        1: [
          { verb: "Sentry 연결 + 실제 에러 트리거",   detail: "코드에 throw new Error('test-' + Date.now()) 1줄 → Slack 채널에 메시지 도착 확인 → 즉시 제거", time: "1시간" },
          { verb: "Toss 라이브 키로 100원 결제+환불", detail: "본인 카드로 100원 결제 → 웹훅 수신 → 자동 환불 → 영수증 메일 도착까지 완주",                 time: "30분" },
          { verb: "법적 풋터 + PIPA 동의 분리",       detail: "사업자 정보 + 환불 정책 + 풋터 게시 + 마케팅·필수 동의 별도 체크박스",                          time: "1시간" },
        ],
        2: [
          { verb: "댓글 템플릿 5종 노션에 저장",      detail: "환영·기능 요청·버그·칭찬·비판자 5종 (페이지 하단 참고). D-Day에 5분 룰 지키려면 사전 준비 필수", time: "10분" },
          { verb: "D-Day 시간대별 알람 11개 등록",    detail: "T-8h부터 T+23h까지 11개 슬롯을 캘린더에 분 단위로 등록 (KST 환산 사용)",                       time: "15분" },
          { verb: "응급 시나리오 5종 멘탈 리허설",    detail: "서버 다운·DB 잠김·결제 실패·댓글 폭주·부정 리뷰 — 각 1번씩 'D-Day에 발생하면 어떻게 할지' 시뮬", time: "15분" },
        ],
        3: [
          { verb: "캘린더에 13개 알림 등록 (D-28~D+14)", detail: "Page 3의 13개 항목을 그대로 캘린더 알림으로 등록. 매일 알람 받으면 즉흥 결정 안 함",       time: "20분" },
          { verb: "PH 예약 등록 (D-7에 publish)",       detail: "producthunt.com/posts/new → product 정보·태그라인·5 스크린샷·GIF 업로드 → '예약' 클릭",     time: "1시간" },
          { verb: "D-Day 봉인 — 다른 일정 잡지 않기",   detail: "D-Day 24시간 + D-1·D+1 각 4시간 블록 캘린더 잠금. 미팅·약속 일체 X",                          time: "5분" },
        ],
      } : {
        0: [
          { verb: "List 10 beta users",              detail: "Pull from interviews / Twitter followers / waitlist into Notion or sheet",                          time: "30 min" },
          { verb: "Lock D-Day (Tue/Wed 12:01 PT)",   detail: "Pick a Tue/Wed 4-6 weeks out → calendar entry 'PH Launch — D-Day'",                                time: "5 min" },
          { verb: "Register 6-week calendar",         detail: "Copy Page 3's D-28~D+14 13 alarms into your calendar — auto-pilot daily action",                  time: "20 min" },
        ],
        1: [
          { verb: "Wire Sentry + trigger real error", detail: "throw new Error('test-' + Date.now()) → confirm Slack message → remove",                          time: "1 hr" },
          { verb: "Live 100 KRW charge + refund",     detail: "Real card charge → webhook → auto-refund → email receipt — full cycle",                          time: "30 min" },
          { verb: "Legal footer + PIPA granular consent", detail: "Business info + refund policy + footer + marketing-vs-required checkbox split",              time: "1 hr" },
        ],
        2: [
          { verb: "Save 5 reply templates to Notion", detail: "Welcome·Feature·Bug·Praise·Critic (see below). 5-min reply rule needs pre-saved templates",     time: "10 min" },
          { verb: "Calendar D-Day 11 time-slots",     detail: "T-8h to T+23h slots in your calendar (use KST conversion provided)",                              time: "15 min" },
          { verb: "Dry-run 5 emergencies mentally",   detail: "Server down·DB lock·Payment fail·Comment flood·Negative review — visualize each",                  time: "15 min" },
        ],
        3: [
          { verb: "Register all 13 alarms (D-28~D+14)", detail: "Copy each timeline row as a calendar alarm. Daily alarm = no improvisation",                  time: "20 min" },
          { verb: "Schedule PH (publish at D-7)",       detail: "producthunt.com/posts/new → product info, tagline, 5 screenshots, GIF → click 'schedule'",     time: "1 hr" },
          { verb: "Lock D-Day calendar — no meetings",  detail: "Block 24h on D-Day + 4h each on D-1 and D+1. No meetings, no errands",                          time: "5 min" },
        ],
      })
    : isOnline
      ? (ko ? {
          0: [
            { verb: "오픈 D-Day 날짜 확정",              detail: "재고 입고·발송 시스템 점검 완료 후 일자 — 오늘부터 1~2주 후 평일 권장",                       time: "10분" },
            { verb: "자기 주문 시뮬 1번 완주",            detail: "본인 계정으로 실제 주문 → 포장 → 송장 → 발송 → 배송 도착까지 한 번 끝까지",                  time: "1시간" },
            { verb: "톡톡·카카오톡 채널 12시간 SLA 설정",  detail: "자동응답 + 영업외 시간 안내 + Slack 푸시 연결",                                                time: "30분" },
          ],
          1: [
            { verb: "재고 시스템 ↔ 실재고 일치 확인",       detail: "보수적 등록 — 재고 1개면 '품절 임박' 표시. 동시 주문 환불 사고 1순위",                       time: "30분" },
            { verb: "박스·완충재·송장 라벨지 5묶음 백업",  detail: "라벨 프린터 잉크 + 박스 4종 사이즈 + 완충재 충분량 — 첫 주 수요량 ×3",                       time: "1시간" },
            { verb: "환불·교환 응답 템플릿 5종 작성",      detail: "단순 변심·하자·배송 지연·오배송·CS 미응답 5종을 미리 작성해 톡톡 빠른답장에 등록",          time: "30분" },
          ],
          2: [
            { verb: "주문 알림 푸시 ON + 30분 룰 고정",    detail: "스마트폰·PC 양쪽 알림 + 매일 아침 첫 일과로 설정",                                               time: "10분" },
            { verb: "분쟁 대비 포장 사진 자동화",          detail: "포장 직후 사진 1장 → '주문번호' 폴더에 저장하는 워크플로 고정",                                  time: "15분" },
            { verb: "택배사 집하 시간 사전 확정",          detail: "CJ대한통운 14~16시 권장. 첫 주는 매일 같은 시간 픽업",                                            time: "10분" },
          ],
          3: [
            { verb: "D-7 첫 구매 쿠폰 + 알림받기 발행",     detail: "5~10% 쿠폰 (이상 X). 알림받기 100명 사전 모집",                                                time: "30분" },
            { verb: "인스타 D-7부터 매일 1콘텐츠 예약",     detail: "릴스 7개를 미리 만들어 예약 — 즉흥 콘텐츠는 망함",                                              time: "2시간" },
            { verb: "D+7 광고 시작 알림 등록",              detail: "리뷰 3개+ 누적 후 시작이 정답. 광고 시작 알림을 D+7 캘린더에 등록",                            time: "5분" },
          ],
        } : {
          0: [
            { verb: "Lock open D-Day",                   detail: "After inventory + ship system ready — pick a weekday 1-2 weeks out",                            time: "10 min" },
            { verb: "Run one self-order full cycle",     detail: "Your own order → pack → label → ship → arrive — full E2E",                                     time: "1 hr" },
            { verb: "TalkTalk/Kakao 12h SLA setup",       detail: "Auto-reply + after-hours notice + Slack push",                                                  time: "30 min" },
          ],
          1: [
            { verb: "Sync stock system ↔ real stock",     detail: "Be conservative. 1 unit? Mark 'low'. Concurrent-order refunds = #1 incident",                  time: "30 min" },
            { verb: "Boxes·wrap·5 spare label rolls",     detail: "Printer ink + 4 box sizes + ample wrap. First-week demand × 3",                                time: "1 hr" },
            { verb: "5 refund/exchange templates",        detail: "Cancel·defect·late·wrong-item·CS-miss — pre-write into TalkTalk quick-replies",               time: "30 min" },
          ],
          2: [
            { verb: "Push alerts ON + 30-min rule",       detail: "Phone + PC notifications + daily morning routine",                                              time: "10 min" },
            { verb: "Automate packing-photo workflow",    detail: "Photo right after pack → save into 'order#' folder",                                            time: "15 min" },
            { verb: "Lock courier pickup time",           detail: "CJ Logistics 2-4pm typical. Same pickup time first week",                                       time: "10 min" },
          ],
          3: [
            { verb: "D-7 first-buy coupon + alerts",      detail: "5-10% coupon (no more). 100 alert subscribers ahead",                                          time: "30 min" },
            { verb: "Schedule daily Instagram from D-7",  detail: "Pre-make 7 Reels and schedule — improv = fail",                                                time: "2 hrs" },
            { verb: "Calendar 'start ads' for D+7",       detail: "After 3+ reviews. Set calendar reminder",                                                       time: "5 min" },
          ],
        })
      : (ko ? {
          0: [
            { verb: "오픈 D-Day 날짜 확정",                detail: "위생교육 수료 + 단말기 입고 + 식자재 첫 발주 받은 후 — 평일 오픈 권장 (사고 대응 여유)",          time: "10분" },
            { verb: "단말기·POS·Wi-Fi 4중 점검 일정",       detail: "오픈 D-1 오전에 1시간 블록 — 모든 결제 수단 실제 1번씩 작동 확인",                              time: "10분" },
            { verb: "직원·1인 운영 1시간 모의 일정",        detail: "오픈 D-1 오후에 1시간 블록 — 주문→제조→서빙→정산 1사이클 끝까지",                              time: "10분" },
          ],
          1: [
            { verb: "냉장 0~10℃ / 냉동 -18℃ + 온도계 부착", detail: "식약처 점검 첫 달 가장 자주 — 매일 오픈 직전 사진 1장 기록 습관",                                time: "20분" },
            { verb: "전기·가스·수도 사업자 명의 변경 확인",  detail: "고지서 3종 모두 사업자 명의로 — 누락 시 첫날 가게 멈춤",                                          time: "30분" },
            { verb: "비상 결제·통신 백업 1개씩 확보",        detail: "단말기 다운 → 토스/카카오 QR / Wi-Fi 끊김 → 핫스팟 자동전환 / 식자재 → 긴급 발주처",            time: "30분" },
          ],
          2: [
            { verb: "직원 모의 운영 1시간 실행",             detail: "오픈 D-1 오후 — 가상 손님 + 동시 2테이블 + 따상황 3종 (배달·재료부족·카드오류)",                  time: "1시간" },
            { verb: "비상 연락처 카운터 부착",                detail: "단말기 헬프데스크·Wi-Fi 헬프·식자재 긴급발주·세무사·노무사 — 5종 라미네이트",                  time: "20분" },
            { verb: "오픈 첫 손님 응대 표준 동선 결정",        detail: "환영말·메뉴 안내·결제·영수증·배웅 — 멘트 5개 미리 입에 붙이기",                                  time: "15분" },
          ],
          3: [
            { verb: "네이버 플레이스 등록 + 사진 5장+",       detail: "외관 1·내부 2·메뉴 2 — 첫 사진이 검색 노출 결정. 인공조명 X, 자연광",                            time: "1시간" },
            { verb: "인스타 D-7부터 매일 1콘텐츠 예약",       detail: "오픈 비하인드 7개 릴 미리 촬영·예약 — D-Day 라이브 스토리 1개 추가",                              time: "2시간" },
            { verb: "영수증 리뷰 이벤트 안내문 인쇄",          detail: "테이블·카운터 부착 — 음료 1잔 / 사이드 무료 등 가벼운 인센티브로 첫 30일 30개 목표",            time: "30분" },
          ],
        } : {
          0: [
            { verb: "Lock open D-Day",                   detail: "After hygiene cert + terminal arrival + first ingredient order — weekday open recommended",       time: "10 min" },
            { verb: "Schedule terminal/POS/Wi-Fi 4-check", detail: "1h block on D-1 morning — test every payment method live",                                     time: "10 min" },
            { verb: "Schedule 1h dry run",                detail: "1h block on D-1 afternoon — order→prep→serve→settle full cycle",                               time: "10 min" },
          ],
          1: [
            { verb: "Fridge 0-10℃ / Freezer -18℃ + meter", detail: "MFDS month-1 inspection. Daily pre-open photo log habit",                                     time: "20 min" },
            { verb: "Utilities under business name",       detail: "All 3 bills (electricity/gas/water) in biz name — miss = day-1 shutdown",                       time: "30 min" },
            { verb: "Backup 1× payment + 1× internet",     detail: "Terminal down → Toss/Kakao QR / Wi-Fi out → hotspot / Stockout → emergency supplier",          time: "30 min" },
          ],
          2: [
            { verb: "Run 1h staff dry run",                detail: "D-1 PM — virtual customer + 2 simultaneous tables + 3 emergency role-plays",                    time: "1 hr" },
            { verb: "Post emergency contacts at counter",  detail: "Terminal helpdesk·Wi-Fi·supplier·CPA·HR — 5 cards laminated",                                  time: "20 min" },
            { verb: "Standardize first-customer flow",     detail: "Welcome·menu·pay·receipt·send-off — 5 phrases memorized",                                       time: "15 min" },
          ],
          3: [
            { verb: "Naver Place + 5+ photos",             detail: "1 exterior, 2 interior, 2 menu — first photo drives search rank. No flash, natural light",      time: "1 hr" },
            { verb: "Schedule daily Instagram from D-7",   detail: "7 BTS reels pre-shot + scheduled. Add 1 live story on D-Day",                                  time: "2 hrs" },
            { verb: "Print receipt-review event flyer",     detail: "Table + counter posted. Light incentive (free drink) → goal 30 reviews in 30 days",            time: "30 min" },
          ],
        });

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
    const ka = specialtyKA ?? keyActions[pg];
    if (!ka) return null;
    const bullets = specialtyKA?.bullets;
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
          {bullets && bullets.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "9px" }}>
              {bullets.map((b, i) => (
                <div key={i} style={{ display: "flex", gap: "7px", fontSize: "12.5px", lineHeight: 1.45, opacity: 0.95 }}>
                  <CheckCircle2 size={14} strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 1, opacity: 0.85 }} />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── "이 단계에서 할 일" 액션 플랜 카드 ───
  const TodayActionCard = () => {
    const steps = pageActionPlan[pg] ?? [];
    if (steps.length === 0) return null;
    return (
      <div style={{
        background: "white",
        borderRadius: "18px",
        border: "2px solid rgba(25,25,112,0.18)",
        boxShadow: "0 4px 16px rgba(25,25,112,0.08)",
        padding: "16px 18px",
        marginBottom: "16px",
        position: "relative",
      }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "rgba(25,25,112,0.1)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: MIDNIGHT,
          }}>
            <PlayCircle size={18} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: MIDNIGHT, opacity: 0.7 }}>
              {ko ? "이 단계에서 할 일 — 이 3가지부터" : "In this stage — Start with these 3"}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)", marginTop: "2px" }}>
              {ko ? "지금 페이지를 닫지 말고 바로 실행하세요" : "Don't close this page — do them now"}
            </div>
          </div>
        </div>

        {/* 3-step list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: "flex", gap: "12px", alignItems: "flex-start",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "rgba(25,25,112,0.03)",
              border: "1px solid rgba(25,25,112,0.08)",
            }}>
              {/* 번호 */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: MIDNIGHT,
                color: "white",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 800,
                flexShrink: 0,
                boxShadow: "0 2px 6px rgba(25,25,112,0.25)",
              }}>
                {i + 1}
              </div>
              {/* 내용 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" as const, marginBottom: "4px" }}>
                  <span style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
                    {s.verb}
                  </span>
                  <span style={{
                    fontSize: "11px", fontWeight: 700,
                    padding: "2px 8px", borderRadius: "999px",
                    background: "rgba(25,25,112,0.08)",
                    color: MIDNIGHT,
                    letterSpacing: "0.02em",
                    display: "inline-flex", alignItems: "center", gap: "3px",
                    fontVariantNumeric: "tabular-nums" as const,
                  }}>
                    <Clock size={10} strokeWidth={2.4} />
                    {s.time}
                  </span>
                </div>
                <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55 }}>
                  {s.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 푸터 안내 */}
        <div style={{
          marginTop: "12px",
          fontSize: "11.5px", fontWeight: 600, color: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", gap: "6px",
          letterSpacing: "0.01em",
        }}>
          <ArrowRight size={11} strokeWidth={2.4} />
          {ko ? "끝나면 아래 자료를 참고하면서 디테일을 채우세요" : "Done? Use the reference below to fill in details"}
        </div>
      </div>
    );
  };

  // ─── 섹션 구분 헤더 (참고 자료 시작점) ───
  const ReferenceSeparator = ({ label }: { label: string }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      margin: "18px 0 4px",
    }}>
      <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }} />
      <span style={{
        fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.4)",
        letterSpacing: "0.12em", textTransform: "uppercase" as const,
      }}>{label}</span>
      <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }} />
    </div>
  );

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
            background: "rgba(182,76,76,0.04)", border: "1px solid rgba(182,76,76,0.14)",
          }}>
            <AlertTriangle size={18} strokeWidth={2} style={{ color: "#b64c4c", flexShrink: 0, marginTop: "1px" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#b64c4c", marginBottom: "3px", letterSpacing: "-0.01em" }}>{trap.label}</div>
              <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(180,28,28,0.85)" }}>{trap.text}</div>
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

      {/* ── 오늘 할 일 액션 플랜 (모든 페이지 공통, 가장 위) ── */}
      <TodayActionCard />

      {/* ── Page 0: 왜 ── */}
      {pg === 0 && (
        <>
          <ReferenceSeparator label={ko ? "왜 — 배경 자료" : "Why — Reference"} />
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

          {/* 성공 vs 실패 케이스 */}
          {cases.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <div style={sectionLabel}>{ko ? "성공 vs 실패 케이스" : "Wins vs Fails"}</div>
              <div style={{ display: "grid", gap: "8px" }}>
                {cases.map((c) => (
                  <div key={c.title} style={{
                    display: "flex", gap: "10px", alignItems: "flex-start",
                    padding: "13px 15px", borderRadius: "14px",
                    background: c.kind === "win" ? "rgba(29,53,87,0.06)" : "rgba(182,76,76,0.05)",
                    border: c.kind === "win" ? "1px solid rgba(29,53,87,0.18)" : "1px solid rgba(182,76,76,0.14)",
                  }}>
                    {c.kind === "win"
                      ? <CheckCircle2 size={18} strokeWidth={2.2} style={{ color: "rgb(29,53,87)", flexShrink: 0, marginTop: "1px" }} />
                      : <XCircle size={18} strokeWidth={2.2} style={{ color: "#b64c4c", flexShrink: 0, marginTop: "1px" }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: c.kind === "win" ? "rgb(34,127,53)" : "#b64c4c", marginBottom: "3px", letterSpacing: "-0.01em" }}>{c.title}</div>
                      <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(0,0,0,0.6)" }}>{c.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 북극성 지표 */}
          {northStarMetrics.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={sectionLabel}>{ko ? "북극성 지표 (이걸 매일 본다)" : "North Star Metrics"}</div>
              <div style={{
                background: "white", borderRadius: "16px",
                border: "1px solid rgba(25,25,112,0.12)", overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}>
                {northStarMetrics.map((m, i) => (
                  <div key={m.label}>
                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                    <div style={{ display: "flex", gap: "14px", alignItems: "center", padding: "14px 16px" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "rgba(25,25,112,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        color: MIDNIGHT,
                      }}>
                        <Target size={17} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.55)", letterSpacing: "0.02em" }}>{m.label}</div>
                        <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.55)", marginTop: "3px", lineHeight: 1.45 }}>{m.subline}</div>
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" as const, flexShrink: 0 }}>
                        {m.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TrapsCard />
        </>
      )}

      {/* ── Page 1: 점검 체크리스트 ── */}
      {pg === 1 && (
        <>
          <ReferenceSeparator label={ko ? "전체 점검 리스트" : "Full Checklist"} />
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
                      background: row.required ? "rgba(180,28,28,0.08)" : "rgba(25,25,112,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      color: row.required ? "#b64c4c" : MIDNIGHT,
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
                        color: row.required ? "#b64c4c" : MIDNIGHT,
                        marginTop: "4px",
                        letterSpacing: "0.04em",
                      }}>
                        {row.priority}
                      </div>
                      {row.how && (
                        <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55, marginTop: "6px", paddingTop: "6px", borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
                          <span style={{ fontWeight: 700, color: MIDNIGHT }}>{ko ? "어떻게: " : "How: "}</span>
                          {row.how}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 필수 스택 (스타트업 전용) */}
          {stack.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={sectionLabel}>{ko ? "필수 스택 — 검증된 2026 가격" : "Required Stack — Verified 2026 Pricing"}</div>
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                {stack.map((s, i) => (
                  <div key={s.name}>
                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "rgba(25,25,112,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        color: MIDNIGHT,
                      }}>
                        <Wrench size={17} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" as const }}>
                          <a href={s.url} target="_blank" rel="noopener noreferrer" style={{
                            fontSize: "14.5px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "-0.01em",
                            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px",
                          }}>
                            {s.name}
                            <ExternalLink size={11} strokeWidth={2.2} />
                          </a>
                          <span style={{
                            fontSize: "11.5px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
                            background: "rgba(25,25,112,0.08)", color: MIDNIGHT, letterSpacing: "0.02em",
                          }}>{s.cost}</span>
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55, marginTop: "4px" }}>{s.purpose}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PIPA 2025 법적 필수 */}
          {legalRequirements.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={sectionLabel}>{ko ? "법적 필수 — PIPA 2025 + 표시 의무" : "Legal Required — PIPA 2025 + Disclosure"}</div>
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                {legalRequirements.map((l, i) => (
                  <div key={l.title}>
                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "rgba(180,28,28,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        color: "#b64c4c",
                      }}>
                        <ScrollText size={17} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>{l.title}</span>
                          <span style={{
                            fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
                            background: "rgba(180,28,28,0.08)", color: "#b64c4c", letterSpacing: "0.02em",
                          }}>{l.deadline}</span>
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55, marginTop: "4px" }}>{l.detail}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TrapsCard />
        </>
      )}

      {/* ── Page 2: 역할 / 실행 ── */}
      {pg === 2 && (
        <>
          <ReferenceSeparator label={ko ? "당일 운영 매뉴얼" : "Day-of Manual"} />
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

          {/* D-Day 시간대별 운영 (스타트업 전용) */}
          {dayOfSchedule.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={sectionLabel}>{ko ? "D-Day 시간대별 운영 (PT 기준)" : "D-Day Hour-by-Hour (PT)"}</div>
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                {dayOfSchedule.map((s, i) => {
                  const isLaunchTime = s.time === "T+0";
                  return (
                    <div key={s.time + i}>
                      {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "76px" }} />}
                      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                        <div style={{
                          width: 60, minHeight: 36, borderRadius: 10,
                          background: isLaunchTime ? MIDNIGHT : "rgba(25,25,112,0.08)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          color: isLaunchTime ? "#fff" : MIDNIGHT,
                          padding: "5px 4px",
                          boxShadow: isLaunchTime ? "0 2px 6px rgba(25,25,112,0.22)" : "none",
                        }}>
                          <Clock size={12} strokeWidth={2.2} style={{ opacity: 0.7, marginBottom: "1px" }} />
                          <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "-0.01em" }}>{s.time}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", lineHeight: 1.5 }}>{s.what}</div>
                          {s.localKst && s.localKst !== "—" && (
                            <div style={{ fontSize: "11px", fontWeight: 600, color: MIDNIGHT, opacity: 0.65, marginTop: "3px", letterSpacing: "0.02em" }}>
                              {s.localKst}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 메이커 댓글 5종 템플릿 */}
          {replyTemplates.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={sectionLabel}>{ko ? "메이커 댓글 5종 템플릿 (짧고 솔직한 톤)" : "5 Maker Reply Templates"}</div>
              <div style={{ display: "grid", gap: "8px" }}>
                {replyTemplates.map((t) => (
                  <div key={t.kind} style={{
                    background: "white", borderRadius: "14px",
                    border: "1px solid rgba(25,25,112,0.12)",
                    padding: "12px 14px",
                    boxShadow: "0 1px 2px rgba(17,17,17,0.02)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <Reply size={14} strokeWidth={2.2} style={{ color: MIDNIGHT }} />
                      <span style={{ fontSize: "12px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "0.02em" }}>{t.kind}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.55, fontStyle: "italic" }}>
                      &ldquo;{ko ? t.korean : t.english}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 응급 시나리오 5종 */}
          {emergencies.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={sectionLabel}>{ko ? "응급 시나리오 5종 — 미리 준비하면 무사" : "5 Emergency Playbooks"}</div>
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                {emergencies.map((e, i) => (
                  <div key={e.trigger}>
                    {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "rgba(182,76,76,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        color: "#b64c4c",
                      }}>
                        <ShieldAlert size={17} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#b64c4c", letterSpacing: "-0.01em", marginBottom: "5px" }}>
                          {e.trigger}
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.65)", lineHeight: 1.6 }}>{e.playbook}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TrapsCard />
        </>
      )}

      {/* ── Page 3: 타임라인 ── */}
      {pg === 3 && (
        <>
          <ReferenceSeparator label={ko ? "캘린더에 등록할 13개 알림" : "13 Calendar Alarms"} />
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

      {/* ── 2026-05-12: 오프라인 사장님 — 오픈 후 첫 30일 운영 플레이북 ──
          startup-tech 와 동일 깊이로 보강. offline 사장님 (음식·카페·뷰티·소매 등)
          그랜드 오픈 후 무엇 할지 막막함 해소. */}
      {!isStartup && !isOnline && pg === totalPg - 1 && (
        <div style={{ marginTop: 18, padding: "20px 22px", borderRadius: 18, background: "linear-gradient(180deg, rgba(25,25,112,0.06) 0%, rgba(255,255,255,0.96) 100%)", border: "1px solid rgba(25,25,112,0.22)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#191970", opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6 }}>
            ⚡ 오픈 후 첫 30일 — 가장 중요한 30일
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 6 }}>
            그랜드 오픈은 끝이 아니라 시작 — 첫 30일이 단골 비율을 결정
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(15,23,42,0.6)", lineHeight: 1.6, marginBottom: 14 }}>
            한국 외식업 폐업률 15.8% (2026) — 절반 이상이 첫 6개월 내. 첫 30일 단골화 실패가 핵심 원인. 매일 1개 액션으로 단골 비율 30%+ 만들기.
          </div>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {[
              {
                week: "Week 1",
                focus: "단골 만들기 + 운영 안정화",
                actions: [
                  "신규 손님 100% 1:1 인사 (테이블·계산대 마다 본인 손으로)",
                  "재방문 트리거 1개 — 첫 방문 시 「다음 방문 5천원 할인 쿠폰」 OR 단골 카드",
                  "메뉴 매출 추적 시작 (POS) — 상위 5/하위 5 메뉴 식별",
                  "직원 일일 미팅 (5분) — 어제 문제 + 오늘 우선순위",
                  "POS·VAN·배달앱 결제 100% 정상 확인 (매일)",
                  "리뷰 3개 목표 (네이버 플레이스·인스타·카카오맵)",
                ],
              },
              {
                week: "Week 2",
                focus: "메뉴·서비스 검증 + 평일 가동률",
                actions: [
                  "고객 인터뷰 5명 (3분, 「오늘 만족도 + 다시 올지」 질문)",
                  "평일·주말 매출 비율 분석 — 평일 < 주말 50% 면 평일 한정 메뉴 도입",
                  "낭비 메뉴 (저마진+저인기) 식별 + 단종 결정",
                  "원가율 첫 점검 — 식재료비 영수증 전체 합산 ÷ 매출",
                  "직원 1-on-1 (15분 × 인원수) — 이슈·개선안 청취",
                  "SNS 콘텐츠 2-3개/주 — 시그니처 메뉴·일상 비하인드 (인스타·네이버)",
                ],
              },
              {
                week: "Week 3",
                focus: "재방문률 측정 + 마케팅 채널 시작",
                actions: [
                  "재방문률 첫 측정 (POS 충성고객 추적 또는 단골카드) — 목표 30%+",
                  "재방문률 미달 → 메뉴·서비스 점검 (성장 마케팅 X)",
                  "네이버 플레이스 광고 ON (재방문률 30%+ 이상일 때만) — 일 1만원부터",
                  "배달앱 광고 ON (음식점만) — 노출 위주 + ROAS 추적",
                  "인플루언서 1명 협업 시도 (지역 micro 1만 팔로워급, 메뉴 시식)",
                  "고정비 한 달 결산 — 임대료 / 인건비 / 공과금 매출 대비 %",
                ],
              },
              {
                week: "Week 4",
                focus: "정량 분석 + 다음 30일 결정",
                actions: [
                  "30일 종합: 매출 / 원가율 / 재방문률 / 영업이익률",
                  "벤치마크 비교 — 운영 대시보드 / 첫 달 점검 카드에서 업종별 KPI 비교",
                  "위험 신호 (재료비 40%+ OR 재방문 < 30%) 발견 시 → 첫 달 점검 회복 플레이북",
                  "건강 신호 잡혔으면 → 단골 캠페인 강화 (재방문 60%+ 목표)",
                  "Month 2 OKR 1개 + 측정 가능 지표 (예: 「재방문 35%」 OR 「영업이익 +5%p」)",
                  "지원사업 신청 검토 — 매출 부진 시 재도전특별자금 (소진공)",
                ],
              },
            ].map((w) => (
              <div key={w.week} style={{ padding: "12px 14px", borderRadius: 12, background: "white", border: "1px solid rgba(25,25,112,0.10)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "#191970", color: "#fff" }}>
                    {w.week}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{w.focus}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(15,23,42,0.7)", lineHeight: 1.65 }}>
                  {w.actions.map((a, j) => (
                    <li key={j}>{a}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11.5, color: "rgba(15,23,42,0.6)", marginTop: 14, lineHeight: 1.55, padding: "10px 12px", borderRadius: 10, background: "rgba(25,25,112,0.05)", border: "1px solid rgba(25,25,112,0.18)" }}>
            💡 <strong>30일 분기점</strong>: 재방문률 30%+ 잡혔으면 → 본격 마케팅 / 미달이면 → 메뉴·서비스·입지 재점검 (3-6개월 안에 결정). 한국 음식업 데이터: 단골 비율 40%+ 매장이 5년 생존율 80%+, 단골 비율 20% 미만은 첫 1년 폐업 위험.
          </div>
        </div>
      )}

      {pg === totalPg - 1 && (
      <StageWrapup
        ko={ko}
        nextStageLabelKo="첫 달 점검"
        doneItemsKo={[
          { label: "1. 오픈 D-7 점검", detail: "POS·메뉴판·재고·인력·SNS·블로그 사전 모두 라이브 가능 상태 확인" },
          { label: "2. 그랜드오픈 이벤트", detail: "오픈 데이 첫 손님 우대·시그니처 메뉴 시연·SNS 인증 이벤트" },
          { label: "3. 진성 리뷰 3개 확보", detail: "첫 주 네이버 플레이스·인스타·블로그 진성 리뷰 3개 목표" },
          { label: "4. D+7 데이터 수집", detail: "재방문률·평점·문의·주문량 4개 지표 매일 모니터링" },
        ]}
        verifyItemsKo={[
          "그랜드오픈 광고 — 「최저가」「업계 1위」 표현 위반 시 표시광고법, 객관 근거 없으면 즉시 수정",
          "이벤트 경품 — 5만원 초과 경품은 제세공과금(기타소득 22%) 원천징수 의무, 누락 시 가산세",
          "광고 협찬 — 인플루언서 「유료광고」 표시 의무 (#광고 #협찬), 미표시 시 공정위 과징금",
          "리뷰 정책 — 자작·바이럴·가족 리뷰 적발 시 플랫폼 영구정지, 진성 리뷰 유도만",
          "음식점 — 식약처 「위생 등급제」 자율 신청 권장, 광고에 등급 표시 시 신뢰감 + 단속 제외",
          "스타트업 — Product Hunt 출시 시 GDPR·개인정보 처리방침·이용약관 사전 게시 (해외 트래픽 대응)",
        ]}
        nextSummaryKo="오픈·그랜드오픈·D+7 시뮬 완료 → 첫 달 점검(매출·재고·CS) 단계로 진입"
      />
      )}
    </div>
  );
}
