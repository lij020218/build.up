"use client";

import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  CreditCard, ClipboardList, BarChart2, Bike, Lightbulb,
  ShieldCheck, AlertTriangle, ExternalLink, Calendar,
  MessageSquare, Star, TrendingUp,
} from "lucide-react";

const MIDNIGHT = "#191970"; // 서비스 메인 포인트 컬러 (PermitCheck/ContractReview/Hiring 과 통일)

export function OperationsSetupStage() {
  const d = useDashboardCtx();
  const {
    language, opsStep, setOpsStep,
    opsSelections, setOpsSelections, opsPosChecks, setOpsPosChecks,
    taskMap,
  } = d;
  const ko = language === "ko";

  type OpsDetail = { id: string; name: string; tagline: string; color: string; url: string; pros: string[]; cons: string[]; icon?: React.ReactNode };
  type Trap = { label: string; text: string };
  type KeyAction = { title: string; detail: string };

  // ─────────────────────────────────────────────────────────────
  // 데이터 — 2026년 4월 기준 검증
  //   · 배달앱: 차등 수수료제 (배민·쿠팡 7.8%/6.8%/2.0%, 요기요 4.7~9.7%)
  //   · POS: 토스플레이스 단말기 무료 + 프로그램 무료 (월정액 0원~)
  //   · SNS: 네이버 플레이스 '실질 상호작용' 지수 → 첫 주 리뷰·전화·길찾기 폭발 필요
  // ─────────────────────────────────────────────────────────────

  const deliveryPlatforms: OpsDetail[] = [
    {
      id: "baemin", name: "배달의민족", color: "#00C73C", url: "https://ceo.baemin.com",
      tagline: "국내 점유율 1위 · 차등 수수료 2026 (7.8/6.8/2.0%)",
      pros: ["국내 점유율 약 60% — 가장 많은 주문량 확보", "사장님 앱으로 메뉴·주문·정산 직관적 관리", "울트라콜·오픈리스트 광고로 노출 확대"],
      cons: ["배민배달 vs 가게배달 정산 체계 달라 복잡", "광고비 경쟁 치열 — 초기 노출 비용 부담"],
    },
    {
      id: "coupangeats", name: "쿠팡이츠", color: "#E52222", url: "https://store.coupangeats.com",
      tagline: "단건 배달 전문 · 차등 7.8/6.8/2.0% + 쿠팡 신뢰도",
      pros: ["단건 배달 — 배달 품질·고객 만족도 업계 최고", "쿠팡 브랜드 신뢰도 연계로 신규 고객 유입", "와우 회원 우선 노출 — 충성 고객 확보"],
      cons: ["배달 단가가 다소 높아 점주 부담 ↑", "단건 구조라 라이더 확보 불안정 시간대 있음"],
    },
    {
      id: "yogiyo", name: "요기요", color: "#FF5A00", url: "https://partner.yogiyo.co.kr",
      tagline: "GS리테일 운영 · 차등 4.7~9.7% · 요기패스 구독",
      pros: ["요기패스 구독 고객에게 우선 노출", "특정 프로모션 기간 수수료 감면 이벤트 多", "GS25·GS슈퍼 오프라인 제휴 혜택 연계"],
      cons: ["시장 점유율 하락세 (약 10~15%)", "광고 효율 배민·쿠팡이츠 대비 낮음"],
    },
    {
      id: "naver-order", name: "네이버 주문", color: "#03C75A", url: "https://new.smartplace.naver.com",
      tagline: "스마트플레이스 연동 · 중개 수수료 0% (결제 수수료만)",
      pros: ["네이버 지도·검색에 주문 버튼 자동 노출", "중개 수수료 없음 — 결제 수수료만 부담", "포장·예약·테이블 주문 통합 관리"],
      cons: ["자체 배달망 X — 외부 라이더 별도 연동 필요", "배달 기능보다 포장·테이블 주문에 적합"],
    },
  ];

  const posSystems: OpsDetail[] = [
    {
      id: "toss",  name: "토스플레이스", color: "#1A6CF6", url: "https://tossplace.com",
      tagline: "단말기·프로그램 모두 무료 · D+1 정산 · 신규 점주 1순위",
      pros: ["프로그램 + 단말기 무료, 월정액 0원", "정산 다음날 입금(D+1) — 현금 흐름 유리", "카드·카카오·네이버·애플페이 한 번에", "주문·결제·고객·배달·예약·키오스크 모드 통합"],
      cons: ["주방 디스플레이(KDS) 등 일부 고급 기능 부재", "단말기 무상 지원이라 약정·해지 조건 사전 확인"],
    },
    {
      id: "kis",   name: "KIS정보통신", color: "#1E3A8A", url: "https://www.kisinfo.co.kr",
      tagline: "국내 POS 시장 1위 · 전국 방문 A/S망",
      pros: ["전국 방문 A/S — 고장 시 빠른 처리", "배민·쿠팡이츠 주문 자동 수신 연동", "업종별 전용 모듈 (카페·음식점·소매)"],
      cons: ["초기 구매·렌탈 비용 (월 3~8만원)", "UI 구식 — 익히는 데 시간 소요"],
    },
    {
      id: "orderplace", name: "오더플레이스", color: "#00B85E", url: "https://www.orderplace.co.kr",
      tagline: "F&B 특화 태블릿 POS · 배달앱 3사 통합 수신",
      pros: ["배민·쿠팡이츠·요기요 주문 통합 수신", "테이블·주방 디스플레이(KDS) 연동", "태블릿 기반 — 공간 유연성 ↑"],
      cons: ["월 구독료 발생 (약 3~5만원)", "F&B 특화 — 소매·서비스업 부적합"],
    },
    {
      id: "smartro", name: "스마트로", color: "#FF6B2B", url: "https://www.smartro.co.kr",
      tagline: "소규모 매장 · 카드 단말기 위주 · 월정액 X",
      pros: ["카드 단말기 중심 — 초기 비용 최소화", "VAN 수수료 기반 — 별도 월정액 X", "단일 업장 운영에 최적"],
      cons: ["재고·메뉴 관리 등 POS 기능 제한적", "배달앱 연동·KDS 없음"],
    },
    {
      id: "ipos", name: "아임포스", color: "#7C3AED", url: "https://www.ipos.co.kr",
      tagline: "태블릿 + 앱 · 통계·재고 기본 제공",
      pros: ["초기 비용 ↓ — 태블릿 + 앱으로 즉시 시작", "배달앱 연동·매출 통계·재고 관리 기본", "요금제 다양 — 규모에 맞게 선택"],
      cons: ["주방 디스플레이 등 고급 기능 유료 업그레이드", "대형 매장 멀티 단말 환경 부적합"],
    },
  ];

  const posChecks: Array<{ id: string; label: string; detail: string; hint: string }> = [
    { id: "menu-check",       label: "메뉴·상품 전체 등록 및 가격 확인",  detail: "옵션·추가 금액·품절 여부까지 점검",  hint: "POS에서 직접 주문 1건 넣어보며 흐름 확인" },
    { id: "payment-check",    label: "카드 실결제 1건 테스트",            detail: "실 카드 결제 후 즉시 취소 처리",      hint: "취소 안 하면 오픈 전 매출로 잡힘" },
    { id: "receipt-check",    label: "영수증 출력 및 내용 확인",          detail: "사업자명·번호·부가세 정확한지",       hint: "세금계산서 발행 시 이 정보가 기준" },
    { id: "settlement-check", label: "일 마감·정산 시뮬레이션",          detail: "정산 금액 = 실 매출 합계인지 비교",   hint: "오픈 후 정산 오류 발생 시 수정 복잡" },
  ];

  const snsChannels: OpsDetail[] = [
    {
      id: "naver-place", name: "네이버 플레이스", color: "#03C75A", url: "https://new.smartplace.naver.com",
      tagline: "필수 1순위 · 검색→방문 80% · 등록 후 노출 최대 7일",
      pros: ["'맛집 검색'의 80%가 네이버 — 미등록 시 검색 자체 불가", "예약·리뷰·메뉴·영업시간 통합 관리", "스마트콜 — 전화 발신 지역 분석 + 발신 광고"],
      cons: ["등록 후 검색 노출까지 최대 7일 — 오픈 1주 전 등록 필수", "리뷰 관리 소홀 시 별점 하락 → 방문율 즉각 영향"],
      icon: (
        <svg width="42" height="42" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" fill="#03C75A"/>
          <path d="M5 6H8.4L13.6 14V6H19V18H15.6L10.4 10V18H5V6Z" fill="white"/>
        </svg>
      ),
    },
    {
      id: "instagram", name: "인스타그램 비즈니스", color: "#C13584", url: "https://business.instagram.com",
      tagline: "비주얼 1순위 · 팔로워 = 단골 · F&B/뷰티/라이프 핵심",
      pros: ["F&B·뷰티·라이프 SNS 마케팅 1위 채널", "릴스·스토리 — 콘텐츠 비용 대비 바이럴 효과 ↑", "팔로워가 곧 단골 — 재방문율·객단가 직결"],
      cons: ["콘텐츠 업로드 없으면 알고리즘 노출 감소", "팔로워 0에서 시작 — 성과까지 2~3개월"],
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
      id: "kakao-channel", name: "카카오 채널", color: "#F9E000", url: "https://ch.kakao.com",
      tagline: "단골 직접 발송 · 카카오맵 연동 · 재방문 채널 1순위",
      pros: ["단골 고객에게 카카오톡 메시지 직접 발송", "카카오맵 장소 노출 + 예약·상담 채팅 기본", "채널 개설 무료 — 챗봇 무료"],
      cons: ["친구(팔로워) 유치 어렵고 초기 메시지 도달 제한", "발송 건당 비용 (15~30원/건)"],
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
      tagline: "구글맵 노출 · 외국인 관광객 필수 · 무료",
      pros: ["구글맵 노출 — 외국인 관광객 접근성 업계 최고", "무료 운영 + 리뷰·Q&A·예약·메시지", "구글 검색 '내 주변' 자동 노출"],
      cons: ["국내 이용률 네이버 대비 낮음", "허위 리뷰 대응 절차 복잡"],
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

  // ─── 카드 가맹점 등록 — VAN 사 ───
  const vanProviders: OpsDetail[] = [
    {
      id: "nice", name: "NICE정보통신", color: "#0F4C81", url: "https://www.nicevan.co.kr",
      tagline: "국내 1위 VAN · 업종 무관 안정적",
      pros: ["국내 시장 점유율 1위 — 모든 카드사·간편결제 자동 연계", "전국 A/S망, 사고·장애 대응 빠름", "사업자등록증·통장사본·신분증만 있으면 신청"],
      cons: ["VAN 수수료(건당 약 100~150원)는 카드 수수료와 별개", "단말기 임대·구매 옵션별 비용 차이 큼"],
    },
    {
      id: "kis", name: "KIS정보통신", color: "#1E3A8A", url: "https://www.kisvan.co.kr",
      tagline: "Semplus 통합 매출·정산·VAT 신고 지원",
      pros: ["Semplus 인터넷 서비스 — 매출·카드사·입금·미수금·VAT 신고 통합", "POS 시장 1위 KIS와 같은 회사 — 단말기 연동 매끄러움", "전국 가맹점 영업·관리망 강력"],
      cons: ["UI가 다소 구식, 익히는 데 시간 소요", "월정액 옵션은 별도 약정"],
    },
    {
      id: "smartro", name: "스마트로(SMARTRO)", color: "#FF6B2B", url: "https://www.smartro.co.kr",
      tagline: "14개 지사·328개 대리점 · 전국 방문 A/S",
      pros: ["전국 14개 지사 + 328개 대리점 — 지방 매장도 빠른 대응", "고객 중심 영업·고품질 사후 관리 강점", "온라인·오프라인 결제 모두 지원"],
      cons: ["네임밸류는 NICE·KIS보다 낮음", "지역별 대리점 품질 편차 있을 수 있음"],
    },
    {
      id: "kicc", name: "KICC(한국정보통신)", color: "#2563EB", url: "https://www.kicc.co.kr",
      tagline: "키오스크·POS 연동 강점 · 오케이포스 등 호환",
      pros: ["오케이포스·신규 키오스크 솔루션과 연동 매끄러움", "결제 속도 빠르고 단말기 안정성 ↑", "외식·소매·서비스업 모두 커버"],
      cons: ["지방 일부 지역 A/S망 NICE·스마트로 대비 약함", "초기 단말기 비용 옵션별 차이"],
    },
    {
      id: "ksnet", name: "KSNET", color: "#7C3AED", url: "https://www.ksnet.co.kr",
      tagline: "외국인 카드·글로벌 결제 강점",
      pros: ["Visa·Master·UnionPay·JCB·AMEX 글로벌 결제 강력", "외국인 관광객 매장(명동·홍대·강남)에 유리", "온라인 PG와 통합 운영 가능"],
      cons: ["국내 일반 매장에는 NICE/KIS가 더 일반적", "정산 주기·수수료 사전 확인 필수"],
    },
  ];

  // ─── 매장 배경음악 저작권 ───
  const musicLicenseOptions: OpsDetail[] = [
    {
      id: "komca-direct", name: "직접 신고 (KOMCA + KOSCAP + KAFOC)", color: "#0F766E", url: "https://www.komca.or.kr",
      tagline: "월 4천원~ · 가장 저렴 · 3개 단체 개별 신고",
      pros: ["50㎡ 커피전문점 기준 월 약 4,000원 — 가장 저렴", "한국음악저작권협회(KOMCA) + 음반산업협회(KOSCAP) + 음반제작자협회(KAFOC) 3곳 신고", "오랜 운영 매장의 정통 방식"],
      cons: ["3개 단체 각각 신고·납부 — 절차 복잡", "음원 직접 보유·재생 필요 (CD/MP3 등)", "유튜브·스포티파이 등 개인용 스트리밍은 사용 불가"],
    },
    {
      id: "shopcast", name: "샵캐스트(ShopCast)", color: "#1A6CF6", url: "https://www.shopcast.co.kr",
      tagline: "월 9천원~ · 자동 정산 · 광고 음악 X",
      pros: ["저작권료 자동 정산 — 별도 KOMCA 신고 불필요", "수만 곡 큐레이션, 업종·시간대별 플레이리스트 추천", "광고 끼어들지 않는 매장 전용 음악 서비스"],
      cons: ["월정액 9천원~ (직접 신고보다 다소 비쌈)", "자체 큐레이션 의존 — 곡 선택 자유도 ↓"],
    },
    {
      id: "melon-biz", name: "멜론 비즈(Melon Biz)", color: "#00CD3C", url: "https://www.melonbiz.com",
      tagline: "멜론 음원 + 매장 라이센스 통합",
      pros: ["멜론 최신 차트 음원 합법적 매장 사용", "다양한 매장 카테고리 플레이리스트", "월정액 약 9천원~ · 자동 저작권 처리"],
      cons: ["월정액 의무 — 작은 매장에는 부담", "매장 외 가정용·개인용 사용은 별도"],
    },
    {
      id: "free-music", name: "프리뮤직 (AI/저작권 무료 음원)", color: "#7C3AED", url: "https://freemusic.co.kr",
      tagline: "AI 음악만 사용 — 공연권료 면제",
      pros: ["KOMCA에 등록되지 않은 AI 음악은 공연권료 징수 대상 X (2025 기준)", "월정액 무료~소액", "법적 분쟁 리스크 0"],
      cons: ["인기곡·차트곡 사용 불가 — 매장 분위기 영향", "AI 음악 품질·다양성 일반 음원 대비 제한적"],
    },
  ];

  // ─── 브랜드 자산 (간판·메뉴판·로고) ───
  const designPlatforms: OpsDetail[] = [
    {
      id: "kmong", name: "크몽(Kmong)", color: "#3D7EFF", url: "https://kmong.com",
      tagline: "31,307개 디자인 서비스 · 5천원~80만원 · 일괄 의뢰",
      pros: ["로고·메뉴판·간판·명함 한 디자이너에게 일괄 의뢰 가능", "가격대 다양 — 5,000원부터 시작, 평균 5~30만원", "리뷰·포트폴리오 공개로 검증된 전문가 선택 가능"],
      cons: ["저가 디자이너 시안 품질 편차 큼 — 포트폴리오 필수 확인", "협업·미팅보다 비대면 진행이 일반적"],
    },
    {
      id: "loud", name: "라우드소싱", color: "#FF3B6B", url: "https://www.loud.kr",
      tagline: "콘테스트 형식 · 의뢰 1번에 2~30개 시안",
      pros: ["1번 의뢰로 2~30명 디자이너의 시안 동시 수령", "마음에 드는 시안 선택 후 디자이너와 작업 마감", "유사 사례·후기 풍부 (만족도 98.7%)"],
      cons: ["1건당 평균 50~200만원 — 크몽 대비 비쌈", "콘테스트 진행 기간 7~14일 소요"],
    },
    {
      id: "soomgo", name: "숨고", color: "#0F766E", url: "https://soomgo.com",
      tagline: "로컬 디자이너 매칭 · 평균 15만원 · 미팅 가능",
      pros: ["거주 지역 디자이너와 직접 만남·미팅 가능", "평균 거래가 15만원 (5만~30만원 범위)", "간판 시공·인테리어 디자이너와 동시 매칭 유리"],
      cons: ["견적 다수 비교는 필요 — 첫 견적이 합리적이라는 보장 X", "실력 편차 — 포트폴리오 사전 확인 필수"],
    },
    {
      id: "miricanvas", name: "미리캔버스/Canva", color: "#7C3AED", url: "https://www.miricanvas.com",
      tagline: "셀프 디자인 · 무료~월 6천원 · 시간 투입 필요",
      pros: ["로고·메뉴판·간판 시안 셀프 제작 (수십만 템플릿)", "무료 플랜 + 프로 월 6,000원~", "수정·재사용 무한 — 시즌 변경 시 빠르게 대응"],
      cons: ["디자인 시간 투입 多 (1~2주)", "독창성 ↓ — 다른 매장과 비슷할 수 있음"],
    },
  ];

  // ─── KEY ACTIONS (이 단계에서 꼭 할 일) ───
  const keyActions: Record<number, KeyAction> = {
    0: ko
      ? { title: "오픈 1주 전, 배민·쿠팡이츠 입점 신청 동시 접수", detail: "심사에 2~5 영업일 소요 — 늦으면 첫날 배달 채널이 막힙니다. 통신판매업 신고증·영업신고증 미리 PDF로 준비하세요." }
      : { title: "Apply to Baemin & CoupangEats 1 week before opening", detail: "Approval takes 2-5 business days. Prepare e-commerce registration & business permit PDFs in advance." },
    1: ko
      ? { title: "오픈 전날 카드 1건 실결제 테스트 후 즉시 취소", detail: "실결제로 영수증·정산·세금계산서 데이터 흐름까지 확인. 취소 안 하면 오픈 전 매출로 잡혀 회계가 꼬입니다." }
      : { title: "Run 1 real-card test the day before opening — cancel immediately", detail: "Verify receipt, settlement, and invoice data flow. Skipping cancel = books out of sync." },
    2: ko
      ? { title: "지금 바로 네이버 플레이스 등록 — 검색 노출까지 최대 7일", detail: "한국인 매장 검색의 80%가 네이버. 등록 늦으면 첫 주 신규 손님이 0명일 수 있습니다." }
      : { title: "Register Naver Place NOW — up to 7 days to appear in search", detail: "80% of Korean place searches use Naver. Late registration = 0 new customers in week 1." },
    3: ko
      ? { title: "사업자등록 직후 VAN사 1곳에 가맹점 등록 신청 — 카드 결제까지 약 1주", detail: "VAN사 1곳에 신청하면 모든 카드사·간편결제(카카오·네이버·애플페이) 자동 연계. 토스플레이스 등 통합 솔루션 사용 시 별도 VAN 신청 불필요." }
      : { title: "Apply to one VAN provider right after business registration — ~1 week to card-ready", detail: "One VAN application covers all card networks + simple-pay. Toss Place includes VAN — no separate application needed." },
    4: ko
      ? { title: "50㎡(15평) 이상이면 음악 저작권 의무 — 미가입은 형사처벌 리스크", detail: "위반 시 손해배상 + 최대 5년 이하 징역 또는 5천만원 이하 벌금. 작은 매장은 직접 신고(월 4천원~), 큰 매장은 매장음악서비스(월 9천원~) 추천." }
      : { title: "Stores ≥50㎡ must license background music — non-compliance = criminal risk", detail: "Violations: damages + up to 5y imprisonment or 50M KRW fine. Small stores: direct filing (4K KRW/mo). Larger: store music service (9K KRW/mo)." },
    5: ko
      ? { title: "오픈 2주 전, 간판·메뉴판·로고를 한 디자이너에게 일괄 의뢰", detail: "톤 일관성을 위해 한 디자이너에게 묶어서 발주. 납품 시 AI/EPS 벡터 원본 파일 필수 — JPG만 받으면 간판·인쇄에서 품질 문제 발생." }
      : { title: "Order signage, menu, logo from ONE designer 2 weeks before opening", detail: "Consistent tone requires one source. Always require AI/EPS vector files — JPG-only causes print/signage quality issues." },
  };

  // ─── 트랩 (실수 패턴) ───
  const traps: Record<number, Trap[]> = {
    0: ko ? [
      { label: "차등 수수료(2026)에 속지 마세요 — 배달비·결제수수료·VAT 합산이 진짜", text: "표면 수수료 2.0~7.8% 외에 배달비 +200~500원 인상 + 결제수수료 3% + VAT 10% — 총 매출의 25~30% 플랫폼에 지급될 수 있습니다." },
      { label: "광고비 = 한 번 쓰면 멈추기 어려움", text: "울트라콜·우선노출은 매출의 5~15% 추가 비용. 첫 달 매출 검증 전엔 최소 단가로 시작하세요." },
    ] : [
      { label: "Tiered fees (2026) hide the real cost", text: "On top of 2.0-7.8% fee: +200-500 KRW delivery fee, +3% payment, +10% VAT — total can hit 25-30% of revenue." },
      { label: "Ad spend is hard to stop once started", text: "Ultracall/priority listings cost 5-15% of sales. Start at minimum until first-month numbers prove out." },
    ],
    1: ko ? [
      { label: "'무료 단말기'에 약정·위약금 숨어있음", text: "토스플레이스도 약정 조건이 있음 (보통 12개월). 해지 시 위약금·반납 의무 사전 확인 필수." },
      { label: "배달앱 연동은 POS 별로 다름", text: "토스플레이스는 배달앱 연동에 추가 솔루션 필요. KIS·오더플레이스는 직접 수신. 배달 비중 높으면 연동 우선 검토." },
    ] : [
      { label: "'Free terminal' often hides a contract", text: "Even Toss Place usually has a 12-month minimum. Confirm cancellation fees and return policy upfront." },
      { label: "Delivery integration varies by POS", text: "Toss needs an extra add-on. KIS/OrderPlace receive natively. Prioritize integration if delivery share is high." },
    ],
    2: ko ? [
      { label: "첫 주 리뷰 1~2개로 시작하면 별점 폭락 위험", text: "초기 손님 중 악성 리뷰어가 1명만 와도 평균 별점 직격. 지인 5명 이상 영수증 리뷰부터 깔아두세요." },
      { label: "네이버 플레이스 = '실제 상호작용' 지수가 핵심", text: "단순 등록만으론 노출 안 됨. 첫 주에 전화·길찾기·저장 클릭이 폭증해야 상위 노출. 지인에게 부탁해서 클릭 발생시키세요." },
    ] : [
      { label: "Starting with 1-2 reviews risks rating crash", text: "One bad-faith review in week 1 destroys your average. Pre-load 5+ receipt reviews from acquaintances." },
      { label: "Naver Place ranks by 'real interactions'", text: "Just listing isn't enough. Calls, directions, and saves in week 1 drive ranking. Ask friends to interact." },
    ],
    3: ko ? [
      { label: "토스플레이스 등 통합 솔루션 사용 시 VAN 별도 신청 X", text: "통합 결제 솔루션은 VAN 가입까지 포함. 중복 가입 시 단말기 2대 부담 + 정산 분리됨. 사용 중인 POS의 VAN 포함 여부 먼저 확인." },
      { label: "VAN 수수료는 카드 수수료와 별개", text: "건당 약 100~150원 별도. 객단가 낮은 매장(분식·테이크아웃)은 누적 부담 큼. 단말기 임대 vs 구매 옵션도 사전 비교 필수." },
    ] : [
      { label: "Skip separate VAN if using Toss Place etc.", text: "Integrated solutions include VAN. Double-signup means 2 terminals + split settlement. Check existing POS first." },
      { label: "VAN fee is separate from card fee", text: "~100-150 KRW per transaction. Low-ticket stores (snacks/take-out) accumulate heavy. Compare lease vs buy upfront." },
    ],
    4: ko ? [
      { label: "유튜브·스포티파이로 매장 음악 X — 적발 시 손해배상", text: "개인용 스트리밍 서비스 약관은 '비상업적 사용'만 허용. 매장에서 사용하면 저작권법 위반 — 적발 사례 많음." },
      { label: "50㎡ 미만은 의무 X — 작은 매장은 면제", text: "2018.8.23부터 50㎡(약 15평) 미만 소규모 영업장은 공연권료 납부 대상 제외. 면적 기준 정확히 확인하세요." },
    ] : [
      { label: "YouTube/Spotify for store music = illegal", text: "Personal streaming TOS only allow 'non-commercial use'. Using in store violates copyright law — frequent enforcement." },
      { label: "Stores under 50㎡ are exempt", text: "Since Aug 23, 2018, stores under 50㎡ are exempt from public performance fees. Verify your floor area." },
    ],
    5: ko ? [
      { label: "JPG만 받으면 간판·인쇄 품질 문제 발생", text: "납품 시 반드시 AI/EPS 벡터 원본 파일 받기. JPG만 있으면 확대 시 픽셀 깨짐 — 간판·메뉴판 인쇄 시 다시 의뢰 필요." },
      { label: "간판 디자인 ≠ 간판 제작", text: "디자이너는 시안만 만들고, 실제 간판 시공은 별도 업체. 디자이너에게 '간판 제작 가능' 확인하거나, 간판 시공업체 별도 섭외 필요." },
    ] : [
      { label: "JPG-only files cause sign/print issues", text: "Always require AI/EPS vector source files. JPG pixelates when scaled — re-order needed for signage/menus." },
      { label: "Sign DESIGN ≠ sign FABRICATION", text: "Designers make artwork; physical signage is a separate vendor. Confirm both or hire two." },
    ],
  };

  const steps = [
    { key: "delivery", title: ko ? "배달앱 입점 등록" : "Delivery App Registration",    subtitle: ko ? "첫 주문이 들어오는 채널을 오픈 전에 열어두세요." : "Open your order channels before launch.", taskId: "delivery-app-registered" },
    { key: "pos",      title: ko ? "POS 실거래 테스트" : "POS Live Test",              subtitle: ko ? "오픈 전날 실결제로 데이터 흐름까지 확인하세요." : "Verify real-card flow the day before opening.", taskId: "pos-live" },
    { key: "sns",      title: ko ? "SNS·플레이스 + 런칭 캠페인" : "SNS & Launch Campaign",     subtitle: ko ? "단순 등록을 넘어 첫 주 캠페인까지 — 리뷰·전화·길찾기를 폭발시키세요." : "Beyond registration — week-1 campaign for reviews and traffic.", taskId: "sns-setup" },
    { key: "van",      title: ko ? "카드 가맹점 등록 (VAN)" : "Card Merchant Registration (VAN)",  subtitle: ko ? "VAN사 1곳에 신청하면 모든 카드·간편결제 자동 연계. 약 1주 소요." : "One VAN application covers all card networks. ~1 week.", taskId: "card-merchant-registered" },
    { key: "music",    title: ko ? "매장 배경음악 저작권" : "Background Music License",  subtitle: ko ? "50㎡(15평) 이상 매장 의무. 미가입 시 형사처벌까지 가능합니다." : "Mandatory for stores ≥50㎡. Non-compliance carries criminal risk.", taskId: "music-license-registered" },
    { key: "brand",    title: ko ? "브랜드 자산 (간판·메뉴판·로고)" : "Brand Assets (Signage, Menu, Logo)",  subtitle: ko ? "한 디자이너에게 일괄 의뢰해 톤 일관성 확보 — 오픈 2주 전 발주." : "Order from one designer for tonal consistency — 2 weeks before opening.", taskId: "brand-identity-offline" },
  ];

  const currentOpsStep = steps[opsStep];
  const currentKeyAction = keyActions[opsStep];
  const currentTraps = traps[opsStep] ?? [];
  const tasks = taskMap["operations-setup"] ?? [];
  const isTaskDone = (id: string) => tasks.find(t => t.taskId === id)?.status === "completed";

  const sectionLabel: React.CSSProperties = {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "rgba(0,0,0,0.45)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "10px",
  };

  // ─── 키 액션 히어로 카드 ───
  const KeyActionCard = () => (
    <div style={{
      display: "flex", gap: "14px", alignItems: "flex-start",
      padding: "16px 18px", borderRadius: "16px",
      background: `linear-gradient(135deg, ${MIDNIGHT} 0%, rgba(25,25,112,0.92) 100%)`,
      color: "#fff",
      marginBottom: "20px",
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
          {currentKeyAction.title}
        </div>
        <div style={{ fontSize: "13.5px", lineHeight: 1.55, opacity: 0.92 }}>
          {currentKeyAction.detail}
        </div>
      </div>
    </div>
  );

  // ─── 트랩 카드 ───
  const TrapsCard = () => (
    currentTraps.length === 0 ? null : (
      <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
        {currentTraps.map((trap) => (
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
    )
  );

  // ─── 플랫폼/채널 리스트 (배달·POS·SNS 공통) ───
  const renderDetail = (items: OpsDetail[], prefix: string) => (
    <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
      {items.map((item, i) => {
        const isSelected = !!opsSelections[`${prefix}-${item.id}`];
        const isDark = item.color === "#F9E000";
        return (
          <div key={item.id}>
            {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)" }} />}
            <div
              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "15px 20px 10px", cursor: "pointer", background: isSelected ? "rgba(25,25,112,0.04)" : "white", transition: "background 0.15s" }}
              onClick={() => setOpsSelections(prev => ({ ...prev, [`${prefix}-${item.id}`]: !prev[`${prefix}-${item.id}`] }))}
            >
              <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: isSelected ? MIDNIGHT : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
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
                <div style={{ fontSize: "15px", fontWeight: isSelected ? 650 : 590, color: isSelected ? MIDNIGHT : "var(--text)", letterSpacing: "-0.3px" }}>{item.name}</div>
                <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.5)", marginTop: "2px", lineHeight: 1.4 }}>{item.tagline}</div>
              </div>
              <a href={item.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "50%", background: "rgba(25,25,112,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: MIDNIGHT, textDecoration: "none" }}>
                <ExternalLink size={14} strokeWidth={2} />
              </a>
            </div>
            {/* 장단점 */}
            <div style={{ padding: "0 20px 14px 78px" }}>
              {item.pros.map((pro, pi) => (
                <div key={pi} style={{ display: "flex", alignItems: "flex-start", gap: "7px", marginBottom: "5px" }}>
                  <span style={{ flexShrink: 0, fontSize: "12px", fontWeight: 800, color: MIDNIGHT, marginTop: "1px" }}>+</span>
                  <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.62)", lineHeight: 1.5 }}>{pro}</span>
                </div>
              ))}
              {item.cons.map((con, ci) => (
                <div key={ci} style={{ display: "flex", alignItems: "flex-start", gap: "7px", marginBottom: "5px" }}>
                  <span style={{ flexShrink: 0, fontSize: "12px", fontWeight: 800, color: "rgba(184,48,32,0.7)", marginTop: "1px" }}>−</span>
                  <span style={{ fontSize: "13px", color: "rgba(0,0,0,0.45)", lineHeight: 1.5 }}>{con}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ─── POS란? + 시스템 선택 + 실거래 체크 ───
  const renderPos = () => {
    const checkedCount = posChecks.filter(c => opsPosChecks[c.id]).length;
    const selectedPosSystem = posSystems.find(s => opsSelections[`pos-system-${s.id}`]);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

        {/* ── POS란? — 미드나이트 톤으로 통일 ── */}
        <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "16px 20px 6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(25,25,112,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CreditCard size={14} strokeWidth={2} color={MIDNIGHT} />
              </div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "-0.1px" }}>{ko ? "POS란?" : "What is a POS?"}</span>
            </div>
            {([
              { Icon: CreditCard,    text: ko ? "결제 처리 — 카드·현금·간편결제를 한 단말에서 처리하고 자동 정산" : "Payment processing" },
              { Icon: ClipboardList, text: ko ? "메뉴·재고 관리 — 상품 등록, 품절 처리, 재고 추적" : "Menu & inventory management" },
              { Icon: BarChart2,     text: ko ? "매출 통계 — 시간대별·메뉴별 매출, 일·월 정산 리포트 자동" : "Sales analytics" },
              { Icon: Bike,          text: ko ? "배달앱 연동 — 배민·쿠팡이츠 주문 자동 수신 (제품마다 다름)" : "Delivery integration" },
            ] as const).map(({ Icon, text }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "11px 0", borderTop: "0.5px solid rgba(0,0,0,0.07)" }}>
                <div style={{ flexShrink: 0, width: "36px", height: "36px", borderRadius: "10px", background: "rgba(25,25,112,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={17} strokeWidth={1.8} color={MIDNIGHT} />
                </div>
                <span style={{ fontSize: "13.5px", color: "rgba(0,0,0,0.7)", lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "11px 20px", background: "rgba(25,25,112,0.04)", borderTop: "0.5px solid rgba(25,25,112,0.1)" }}>
            <span style={{ fontSize: "12.5px", color: MIDNIGHT, opacity: 0.78, lineHeight: 1.5 }}>
              {ko ? "업종에 따라 필요한 기능이 다릅니다. 아래에서 내 업종에 맞는 제품을 골라보세요." : "Choose the right product for your business below."}
            </span>
          </div>
        </div>

        {/* ── POS 시스템 선택 ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={sectionLabel}>{ko ? "POS 시스템 선택" : "Choose a POS System"}</span>
            {selectedPosSystem && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", background: MIDNIGHT, padding: "3px 10px", borderRadius: "100px", marginLeft: "auto", marginBottom: "10px" }}>
                {selectedPosSystem.name} {ko ? "선택됨" : "selected"}
              </span>
            )}
          </div>
          {renderDetail(posSystems, "pos-system")}
        </div>

        {/* ── 실거래 체크리스트 ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={sectionLabel}>{ko ? "실거래 테스트 체크리스트" : "Live Test Checklist"}</span>
            {checkedCount === posChecks.length
              ? <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", background: MIDNIGHT, padding: "3px 10px", borderRadius: "100px", marginLeft: "auto", marginBottom: "10px" }}>✓ {ko ? "완료" : "Done"}</span>
              : <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginLeft: "auto", marginBottom: "10px" }}>{checkedCount} / {posChecks.length}</span>
            }
          </div>
          <div style={{ height: "3px", borderRadius: "100px", background: "rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ height: "100%", width: `${(checkedCount / posChecks.length) * 100}%`, background: MIDNIGHT, borderRadius: "100px", transition: "width 0.35s ease" }} />
          </div>
          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
            {posChecks.map((check, i) => {
              const checked = !!opsPosChecks[check.id];
              return (
                <div key={check.id}>
                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "58px" }} />}
                  <div
                    style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 20px", cursor: "pointer", background: checked ? "rgba(25,25,112,0.03)" : "white", transition: "background 0.15s" }}
                    onClick={() => setOpsPosChecks(prev => ({ ...prev, [check.id]: !prev[check.id] }))}
                  >
                    <div style={{ flexShrink: 0, marginTop: "2px", width: "22px", height: "22px", borderRadius: "7px", border: checked ? "none" : "1.5px solid rgba(0,0,0,0.2)", background: checked ? MIDNIGHT : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                      {checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: checked ? "rgba(0,0,0,0.32)" : "var(--text)", textDecoration: checked ? "line-through" : "none", letterSpacing: "-0.2px", transition: "all 0.15s" }}>{check.label}</div>
                      <div style={{ fontSize: "13px", color: checked ? "rgba(0,0,0,0.26)" : "rgba(0,0,0,0.55)", marginTop: "3px", lineHeight: 1.5 }}>{check.detail}</div>
                      {!checked && (
                        <div style={{ fontSize: "12px", color: MIDNIGHT, opacity: 0.85, marginTop: "7px", padding: "6px 10px", borderRadius: "8px", background: "rgba(25,25,112,0.06)", lineHeight: 1.45, display: "flex", alignItems: "flex-start", gap: "6px" }}>
                          <Lightbulb size={12} strokeWidth={2} style={{ flexShrink: 0, marginTop: "2px", color: MIDNIGHT }} />
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

  // ─── 런칭 첫 주 캠페인 (Step 3 끝에 추가) ───
  const launchCampaign: { day: string; Icon: React.ElementType; title: string; detail: string }[] = ko ? [
    { day: "D-7~D-1", Icon: Calendar, title: "오픈 1주 전", detail: "네이버 플레이스·인스타·카카오 채널 모두 등록 완료. 인스타 첫 게시물 3개 + 릴스 1개 미리 업로드." },
    { day: "D-day", Icon: Star, title: "오픈 당일", detail: "방문 지인 5명 이상 영수증 인증 → 네이버 영수증 리뷰 부탁 (별점 4점 이상). 인스타 스토리에 매장 사진 + 위치 태그." },
    { day: "D+1~D+3", Icon: MessageSquare, title: "오픈 직후 3일", detail: "지인·가족에게 부탁: '내 가게'를 네이버에서 검색 → 전화 클릭 + 길찾기 + 즐겨찾기. '실질 상호작용' 지수 폭발이 첫 노출 결정." },
    { day: "D+7", Icon: TrendingUp, title: "1주 차 점검", detail: "리뷰 5개 이상 / 인스타 게시물 3개 이상 / 카카오 채널 친구 30명 이상 — 미달 시 가까운 지인 추가 푸시." },
  ] : [
    { day: "D-7~D-1", Icon: Calendar, title: "1 week before", detail: "Register Naver Place, Instagram, KakaoTalk Channel. Pre-upload 3 Instagram posts + 1 reel." },
    { day: "D-day", Icon: Star, title: "Opening day", detail: "Get 5+ acquaintances to leave receipt-verified Naver reviews (4+ stars). Post Instagram stories with location tag." },
    { day: "D+1~D+3", Icon: MessageSquare, title: "First 3 days", detail: "Ask family/friends to search your store on Naver → tap phone, get directions, save. 'Real interaction' index drives early ranking." },
    { day: "D+7", Icon: TrendingUp, title: "Week 1 checkpoint", detail: "5+ reviews / 3+ Instagram posts / 30+ Kakao Channel friends — push acquaintances if behind." },
  ];

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* 네비게이션 — 6단계 도트 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        <button
          type="button"
          style={{ fontSize: "14px", fontWeight: 580, color: opsStep === 0 ? "transparent" : "rgba(0,0,0,0.45)", background: "none", border: "none", cursor: opsStep === 0 ? "default" : "pointer", padding: "8px 4px", pointerEvents: opsStep === 0 ? "none" : "auto" }}
          onClick={() => setOpsStep(s => s - 1)}
        >← {ko ? "이전" : "Back"}</button>
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} onClick={() => setOpsStep(i)} style={{ width: i === opsStep ? "20px" : "6px", height: "6px", borderRadius: "100px", background: i === opsStep ? MIDNIGHT : "rgba(17,17,17,0.15)", cursor: "pointer", transition: "width 0.2s ease" }} />
          ))}
        </div>
        <button
          type="button"
          style={{ fontSize: "14px", fontWeight: 580, color: opsStep === 5 ? "transparent" : "rgba(0,0,0,0.45)", background: "none", border: "none", cursor: opsStep === 5 ? "default" : "pointer", padding: "8px 4px", pointerEvents: opsStep === 5 ? "none" : "auto" }}
          onClick={() => setOpsStep(s => s + 1)}
        >{ko ? "다음" : "Next"} →</button>
      </div>

      {/* 진행도 표시 — 6 step 명확히 보이도록 */}
      <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.4)", marginBottom: "10px", letterSpacing: "0.04em", fontWeight: 600 }}>
        {ko ? `${opsStep + 1} / ${steps.length} 단계` : `Step ${opsStep + 1} / ${steps.length}`}
      </div>

      {/* 헤더 */}
      <div style={{ marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: isTaskDone(currentOpsStep.taskId) ? "rgba(25,25,112,0.14)" : "rgba(25,25,112,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {isTaskDone(currentOpsStep.taskId)
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4.5" stroke={MIDNIGHT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <span style={{ fontSize: "11px", fontWeight: 800, color: MIDNIGHT, letterSpacing: "-0.5px" }}>0{opsStep + 1}</span>
            }
          </div>
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)" }}>{currentOpsStep.title}</h3>
        </div>
        <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55, paddingLeft: "40px" }}>{currentOpsStep.subtitle}</p>
      </div>

      {/* ── KEY ACTION 히어로 카드 (모든 step 공통) ── */}
      <KeyActionCard />

      {/* 컨텐츠 */}
      {opsStep === 0 && (
        <>
          <div style={sectionLabel}>{ko ? "배달앱 플랫폼 — 클릭하면 입점 신청 페이지로 이동" : "Delivery platforms — tap to apply"}</div>
          {renderDetail(deliveryPlatforms, "delivery")}
          <div style={{ marginTop: "16px" }}>
            <TrapsCard />
          </div>
        </>
      )}
      {opsStep === 1 && (
        <>
          {renderPos()}
          <div style={{ marginTop: "16px" }}>
            <TrapsCard />
          </div>
        </>
      )}
      {opsStep === 3 && (
        <>
          <div style={sectionLabel}>{ko ? "VAN 사 — 클릭하면 가맹점 등록 페이지로 이동" : "VAN providers — tap to register"}</div>
          {renderDetail(vanProviders, "van")}
          <div style={{ marginTop: "14px", fontSize: "12.5px", color: MIDNIGHT, opacity: 0.85, lineHeight: 1.55, padding: "10px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.06)" }}>
            {ko
              ? "💡 단말기 임대(월 1~3만원) vs 구매(20~50만원) — 1년 이상 운영 예정이면 구매가 유리합니다. VAN 수수료(건당 100~150원)와 카드 수수료(2.5~3%)는 별개로 계산하세요."
              : "💡 Lease (10-30K KRW/mo) vs buy (200-500K) — buy if running 1y+. VAN fee (~100-150 KRW/tx) is separate from card fee (2.5-3%)."}
          </div>
          <div style={{ marginTop: "16px" }}>
            <TrapsCard />
          </div>
        </>
      )}
      {opsStep === 4 && (
        <>
          <div style={sectionLabel}>{ko ? "음악 저작권 옵션 — 매장 규모·편의성 비교" : "Music license options"}</div>
          {renderDetail(musicLicenseOptions, "music")}
          <div style={{ marginTop: "14px", fontSize: "12.5px", color: MIDNIGHT, opacity: 0.85, lineHeight: 1.55, padding: "10px 14px", borderRadius: "12px", background: "rgba(25,25,112,0.06)" }}>
            {ko
              ? "💡 50㎡(15평) 미만 매장은 면제. 신청·납부는 사업자등록 직후 처리하면 추후 누락 리스크 0. 직접 신고가 어려우면 매장음악서비스(샵캐스트·멜론비즈)로 시작하세요."
              : "💡 Stores under 50㎡ are exempt. File right after business registration to avoid gaps. Use a music service (ShopCast/Melon Biz) if direct filing feels complex."}
          </div>
          <div style={{ marginTop: "16px" }}>
            <TrapsCard />
          </div>
        </>
      )}
      {opsStep === 5 && (
        <>
          <div style={sectionLabel}>{ko ? "필수 브랜드 자산 (4종)" : "Required brand assets (4)"}</div>
          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
            {([
              { label: ko ? "외부 간판" : "External signage", detail: ko ? "조명 LED 채널 사인 또는 평판 사인 · 약 80~300만원" : "LED channel sign or flat sign · 800K-3M KRW" },
              { label: ko ? "메뉴판" : "Menu board",          detail: ko ? "인쇄 5~30만원 · 디지털 메뉴 보드 80~150만원" : "Print 50-300K · Digital board 800K-1.5M KRW" },
              { label: ko ? "로고 (간판·메뉴판·포장재 통일)" : "Logo (unify across signage/menu/packaging)", detail: ko ? "5천원~80만원 (크몽), 50~200만원 (라우드소싱)" : "5K-800K (Kmong) / 500K-2M (Loud)" },
              { label: ko ? "명함·스티커·영수증 푸터" : "Business cards, stickers, receipt footer", detail: ko ? "디자인 + 인쇄 합 5~15만원" : "Design + print 50-150K KRW" },
            ] as const).map((asset, i) => (
              <div key={asset.label}>
                {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 18px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(25,25,112,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "13px", fontWeight: 800, color: MIDNIGHT }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "3px" }}>{asset.label}</div>
                    <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.55)", lineHeight: 1.55 }}>{asset.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={sectionLabel}>{ko ? "디자인 의뢰 플랫폼" : "Design platforms"}</div>
          {renderDetail(designPlatforms, "design")}

          <div style={{ marginTop: "16px" }}>
            <TrapsCard />
          </div>
        </>
      )}
      {opsStep === 2 && (
        <>
          <div style={sectionLabel}>{ko ? "필수 채널 — 우선순위 순" : "Channels — by priority"}</div>
          {renderDetail(snsChannels, "sns")}

          {/* ── 런칭 첫 주 마케팅 캠페인 (NEW) ── */}
          <div style={{ marginTop: "20px" }}>
            <div style={sectionLabel}>{ko ? "런칭 첫 주 마케팅 캠페인" : "Week-1 Launch Campaign"}</div>
            <div style={{
              fontSize: "12.5px", color: MIDNIGHT, opacity: 0.85, lineHeight: 1.55,
              padding: "10px 14px", borderRadius: "12px",
              background: "rgba(25,25,112,0.06)",
              marginBottom: "10px",
            }}>
              {ko
                ? "💡 네이버 플레이스는 단순 등록만으로는 노출이 안 됩니다. 첫 주에 '실질 상호작용'(전화·길찾기·저장·리뷰)을 폭발시켜야 상위 노출 기준선을 넘습니다."
                : "💡 Just registering Naver Place isn't enough — week-1 'real interactions' (calls, directions, saves, reviews) drive your initial ranking."}
            </div>
            <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
              {launchCampaign.map((step, idx) => {
                const Icon = step.Icon;
                return (
                  <div key={step.day}>
                    {idx > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", marginLeft: "60px" }} />}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 18px" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 11,
                        background: MIDNIGHT,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, color: "#fff",
                        boxShadow: "0 2px 6px rgba(25,25,112,0.22)",
                      }}>
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px", flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, background: "rgba(25,25,112,0.08)", padding: "2px 8px", borderRadius: "999px", letterSpacing: "0.02em" }}>
                            {step.day}
                          </span>
                          <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
                            {step.title}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55 }}>
                          {step.detail}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <TrapsCard />
          </div>
        </>
      )}

    </div>
  );

}
