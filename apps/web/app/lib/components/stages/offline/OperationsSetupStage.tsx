"use client";

import { useState, useEffect } from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import {
  CreditCard, ClipboardList, BarChart2, Bike, Lightbulb,
  ShieldCheck, AlertTriangle, ExternalLink, Calendar,
  MessageSquare, Star, TrendingUp, Target, ListChecks,
  Workflow, AlertCircle, ChevronRight, ChevronDown, ChevronLeft,
  Cog, Megaphone, Check, ArrowRight, Sparkles,
} from "lucide-react";
import { StageWrapup } from "../shared/StageWrapup";
import { getOpsChannels, getOpsChannelLabel } from "@foundone/shared";

const MIDNIGHT = "#191970"; // 서비스 메인 포인트 컬러 (PermitCheck/ContractReview/Hiring 과 통일)

export function OperationsSetupStage() {
  const d = useDashboardCtx();
  const {
    language, opsStep, setOpsStep,
    opsSelections, setOpsSelections, opsPosChecks, setOpsPosChecks,
    taskMap, industryCategoryId, selectedIndustryId,
  } = d;
  const ko = language === "ko";
  // 채널 섹션 라벨 (세부업종 우선 → 큰 분류: 배달 플랫폼/마켓플레이스/배달·부가 채널/...)
  const channelSectionLabel = getOpsChannelLabel(industryCategoryId, selectedIndustryId);

  type OpsDetail = { id: string; name: string; tagline: string; color: string; url: string; pros: string[]; cons: string[]; icon?: React.ReactNode };
  type Trap = { label: string; text: string };
  type KeyAction = { title: string; detail: string };
  type WhyItem = { headline: string; impact?: string; metric?: string };
  type HowStep = { day: string; title: string; detail?: string };
  type WhatItem = { label: string; note?: string };

  // ─────────────────────────────────────────────────────────────
  // 데이터 — 2026년 4월 기준 검증
  //   · 배달앱: 차등 수수료제 (배민·쿠팡 7.8%/6.8%/2.0%, 요기요 4.7~9.7%)
  //   · POS: 토스플레이스 단말기 무료 + 프로그램 무료 (월정액 0원~)
  //   · SNS: 네이버 플레이스 '실질 상호작용' 지수 → 첫 주 리뷰·전화·길찾기 폭발 필요
  // ─────────────────────────────────────────────────────────────

  // 채널(배달/예약/마켓플레이스/런칭) — 공유 SSOT(operations-channels) 에서 업종별 로드.
  //   ⚠️ 2026-06-02: 이전엔 음식점 채널을 전 업종에 고정 노출(콘텐츠 버그) + iOS 와 id 불일치.
  //   이제 웹·iOS 가 동일 카탈로그·동일 ops_selections 시맨틱 id(delivery-<id>) 를 공유.
  const deliveryPlatforms: OpsDetail[] = getOpsChannels(industryCategoryId, selectedIndustryId);

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
      id: "google-business", name: "구글 비즈니스", color: "#4285F4", url: "https://business.google.com/kr/business-profile/",
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

  // ─── WHY (왜 이 단계가 중요한가 — 안 하면 어떻게 되나) ───
  const whyMatters: Record<number, WhyItem[]> = {
    0: ko ? [
      { headline: "첫 달 매출의 30~50%가 배달앱에서 발생", impact: "F&B 신규 매장 평균: 배달 비중 30~50%, 카페·디저트도 점차 상승. 입점 늦으면 그만큼 첫 달 매출이 비어버립니다.", metric: "지연 1주 = 평균 매출 300~800만원 손실" },
      { headline: "심사 2~5 영업일 + 메뉴 등록 1~2일 = 최소 1주", impact: "오픈일 맞춰 신청하면 첫 주는 배달 없이 운영. 워크인만으로는 손익분기 도달 어려움.", metric: "동시 신청 시 D-7 신청이 골든타임" },
      { headline: "광고 없이 신규 노출 ≈ 0", impact: "배민·쿠팡이츠 모두 알고리즘이 신규 매장에 노출 가중치 X. 첫 주 노출 폭발 = 광고비 + 5~10건 초기 리뷰 셋업.", metric: "초기 광고 예산: 매출 5~15% 권장" },
    ] : [
      { headline: "Delivery is 30-50% of revenue in month 1", impact: "Late onboarding = direct loss of week-1 sales.", metric: "1 week delay ≈ 3-8M KRW lost" },
      { headline: "Approval 2-5 BD + menu setup 1-2d = ~1 week", impact: "Apply at D-7 to be live by opening." },
      { headline: "No ads = ~0 organic exposure", impact: "Algorithms don't favor new stores. Reviews + small ad budget required week 1." },
    ],
    1: ko ? [
      { headline: "POS 미세팅 = 오픈 첫날 결제 거절", impact: "메뉴 미등록·카드 미연동 시 손님 앞에서 결제 실패. 신뢰 회복은 수개월 소요.", metric: "온보딩 영상 후기: 첫날 결제 오류 매장 평균 별점 -0.4점" },
      { headline: "정산·세금계산서 데이터가 한 단말에서 시작", impact: "오픈 후 매출 정산·VAT 신고 자동화는 POS 데이터 정확성에 의존. 초기 미스 = 분기말 정정 작업 폭증.", metric: "사장님 평균 월 4시간 정산 정정에 소비" },
      { headline: "배달앱 자동 수신 여부에 따라 운영 부담 -50%", impact: "POS가 배민·쿠팡이츠 주문을 자동 수신 안 하면 손으로 옮겨 적기. 점심 피크 시 누락·지연 발생." },
    ] : [
      { headline: "Unconfigured POS = day-1 payment failures", impact: "Lost trust takes months to rebuild." },
      { headline: "Settlement & VAT data depends on POS accuracy", impact: "Early errors snowball into quarterly cleanup." },
      { headline: "Native delivery integration cuts operational burden by ~50%" },
    ],
    2: ko ? [
      { headline: "한국 음식점 검색의 80%가 네이버", impact: "미등록 시 검색 자체가 안 됨. 인스타로 보고 와도 위치 확인은 네이버 — 길찾기·전화 모두 막힘.", metric: "네이버 미등록 매장 첫 주 신규 방문 평균 -60%" },
      { headline: "등록 후 검색 노출까지 최대 7일", impact: "오픈 1주 전 등록이 안전선. 당일 등록 시 첫 주 노출 0회 가능.", metric: "D-7 등록 권장" },
      { headline: "'실질 상호작용' 지수가 상위 노출 결정", impact: "단순 등록만으론 노출 X. 첫 주 전화 클릭·길찾기·저장이 폭발해야 알고리즘이 인지. 지인 동원이 합리적.", metric: "1주차 상호작용 50건 = 상위 노출 진입선" },
    ] : [
      { headline: "80% of Korean place searches use Naver", impact: "No listing = invisible. Even Instagram visits check Naver for directions." },
      { headline: "Up to 7 days to appear in search", impact: "Register 1 week before opening." },
      { headline: "'Real interactions' drive ranking", impact: "Calls, directions, saves in week 1 = ranking trigger." },
    ],
    3: ko ? [
      { headline: "VAN 가입 없이 카드 결제 = 0건", impact: "사업자등록 후 즉시 신청 안 하면 오픈 후 현금만 받게 됨. 신청 → 활성화 약 7일.", metric: "사업자등록 후 D+0 신청이 골든타임" },
      { headline: "통합 솔루션(토스플레이스 등) 사용 시 별도 신청 불필요", impact: "이미 VAN 포함된 솔루션 쓰는데 또 신청하면 단말기 2대 + 정산 분리 → 회계 복잡도 폭증." },
      { headline: "VAN 수수료는 카드 수수료와 별개", impact: "건당 100~150원 추가. 객단가 5천원 매장은 매출의 2~3% 추가 부담." },
    ] : [
      { headline: "No VAN = zero card sales", impact: "Apply right after business registration; activation ~7 days." },
      { headline: "Skip VAN if integrated solution covers it", impact: "Double signup = split settlement + duplicate terminals." },
      { headline: "VAN fee is separate from card fee", impact: "100-150 KRW/tx adds up on low-ticket stores." },
    ],
    4: ko ? [
      { headline: "50㎡ 이상 미가입 시 형사처벌 + 손해배상", impact: "공연권법 위반 — 손해배상 + 최대 5년 이하 징역 또는 5천만원 이하 벌금. 단속 사례 빈번.", metric: "1년 미가입 누적 손해배상 평균 100~300만원" },
      { headline: "유튜브·스포티파이 매장 사용 = 명백한 위반", impact: "개인 약관은 비상업적 사용만 허용. 매장 사용은 적발 시 변명 불가." },
      { headline: "사업자등록 직후 처리 = 누락 리스크 0", impact: "오픈 후 처리하려다 잊어버리는 케이스가 가장 많음. 등록 직후 일괄 처리가 최선.", metric: "월 4천원~9천원 (선택지에 따라)" },
    ] : [
      { headline: "Stores ≥50㎡ face criminal penalties if unlicensed", impact: "Damages + up to 5y prison or 50M KRW fine. Enforcement is active." },
      { headline: "YouTube/Spotify in store = clear violation", impact: "Personal TOS forbid commercial use." },
      { headline: "Handle right after business registration", impact: "Most common miss is post-opening procrastination." },
    ],
    5: ko ? [
      { headline: "간판 시공 5~7일 + 디자인 7~14일 = 최소 3주 리드타임", impact: "발주 늦으면 오픈일 미뤄짐. 인테리어 완료 직후 간판이 없으면 '있는 것 같은데 없는 매장'.", metric: "오픈 D-21 디자이너 견적 시작 권장" },
      { headline: "톤 일관성이 첫인상의 70%", impact: "간판·메뉴판·로고가 디자이너 따로면 손님이 '저렴해 보인다'고 느낌. 한 디자이너에게 일괄 의뢰가 정답." },
      { headline: "JPG만 받으면 인쇄·간판에서 깨짐 발생", impact: "확대 시 픽셀 깨짐 → 간판·메뉴판 재의뢰. 평균 30~80만원 추가 비용.", metric: "AI/EPS 벡터 원본 파일 요청 필수" },
    ] : [
      { headline: "Sign fab 5-7d + design 7-14d = ~3 week lead", impact: "Late order delays opening day." },
      { headline: "Tonal consistency drives 70% of first impression", impact: "Order sign/menu/logo from one designer." },
      { headline: "JPG-only files break at print scale", impact: "Always require AI/EPS vector source." },
    ],
  };

  // ─── HOW (어떻게 진행하는가 — D-day 기준 단계별 절차) ───
  const howFlow: Record<number, HowStep[]> = {
    0: ko ? [
      { day: "D-14", title: "필요 서류 PDF 준비", detail: "통신판매업 신고증, 영업신고증, 사업자등록증, 통장사본 — 모바일에 PDF로 저장해두면 신청 시 즉시 첨부 가능." },
      { day: "D-10", title: "메뉴 사진 촬영 + 가격표 확정", detail: "정사각 1080×1080 권장. 자연광에서 촬영 후 보정. 메뉴별 옵션·추가 금액·품절 처리 정책 정리." },
      { day: "D-7", title: "배민 + 쿠팡이츠 + 요기요 동시 신청", detail: "한 번에 3사 모두 신청. 심사 2~5 BD 소요라 동시 진행이 가장 빠름. 광고는 D-1까지 보류." },
      { day: "D-3", title: "메뉴·사진·영업시간 등록 + 운영 시뮬", detail: "심사 통과 후 즉시 메뉴 등록. 사장님 앱으로 가짜 주문 1건 받아 흐름 확인." },
      { day: "D-Day", title: "라이브 + 첫 주문 케어", detail: "광고는 매출 5~10% 예산으로 시작. 첫 10건은 손편지·서비스 등으로 리뷰 부탁." },
    ] : [
      { day: "D-14", title: "Prepare PDFs", detail: "Telecom sales filing, business license, biz registration, bank passbook." },
      { day: "D-10", title: "Menu photos + price list", detail: "1080x1080, natural light. Define options/sold-out flow." },
      { day: "D-7", title: "Apply Baemin + CoupangEats + Yogiyo same day", detail: "All three in parallel; approval 2-5 BD." },
      { day: "D-3", title: "Register menu/photos + dry-run", detail: "Place a fake order via partner app." },
      { day: "D-Day", title: "Go live + first-order care", detail: "Ads at 5-10% of sales. Hand-write notes for first 10 reviews." },
    ],
    1: ko ? [
      { day: "D-14", title: "POS 견적 3사 비교", detail: "토스플레이스(무료) vs KIS·오더플레이스(월정액) — 배달 비중·예산·매장 규모로 결정." },
      { day: "D-10", title: "계약 + 단말기 주문", detail: "토스플레이스는 신청 후 약 2~3일 배송. 약정·해지 위약금 조건 사전 확인." },
      { day: "D-7", title: "단말기 수령 + 메뉴·옵션 등록", detail: "전 메뉴 + 옵션 + 가격 + 품절 정책 + 영수증 정보(상호·사업자번호) 입력." },
      { day: "D-3", title: "배달앱 연동 + 카드 결제 테스트", detail: "배민·쿠팡이츠 주문 자동 수신 확인. 카드 1건 실결제 후 즉시 취소." },
      { day: "D-1", title: "정산 시뮬레이션 + 영수증 검증", detail: "일 마감 정산 = 실 매출 합계인지 비교. 영수증에 사업자번호·부가세 정확한지 확인." },
    ] : [
      { day: "D-14", title: "Compare 3 POS quotes" },
      { day: "D-10", title: "Sign + order terminal", detail: "Confirm contract terms upfront." },
      { day: "D-7", title: "Receive + register menu/options" },
      { day: "D-3", title: "Delivery integration + 1 real card test" },
      { day: "D-1", title: "Settlement dry-run + receipt check" },
    ],
    2: ko ? [
      { day: "D-14", title: "매장 사진 촬영 (외관·내부·메뉴 5장 이상)", detail: "낮 자연광 필수. 외관·간판·메뉴 클로즈업·매장 분위기 4종을 기본으로." },
      { day: "D-10", title: "네이버 플레이스 등록", detail: "사업자등록증·영업신고증 PDF 첨부. 영업시간·전화·메뉴·가격·주차정보 모두 입력." },
      { day: "D-7", title: "인스타 비즈니스 + 카카오 채널 개설", detail: "프로필·하이라이트 셋업. 첫 게시물 3개 + 릴스 1개 미리 업로드 (예약 가능)." },
      { day: "D-3", title: "구글 비즈니스 등록 + 콘텐츠 예약", detail: "외국인 관광객 매장이면 필수. 이후 1주일치 인스타 게시물 예약 발행." },
      { day: "D-Day", title: "지인 5명 영수증 리뷰 + 인스타 라이브", detail: "별점 4점 이상. 인스타 스토리에 위치 태그 + 매장 사진." },
      { day: "D+3", title: "지인 10명에게 검색 → 길찾기·전화 클릭 부탁", detail: "'실질 상호작용' 폭발 = 알고리즘 상위 노출 트리거." },
    ] : [
      { day: "D-14", title: "Photograph store (5+ shots)" },
      { day: "D-10", title: "Register Naver Place" },
      { day: "D-7", title: "Open Instagram Business + Kakao Channel" },
      { day: "D-3", title: "Google Business + scheduled content" },
      { day: "D-Day", title: "5 receipt reviews + Instagram Live" },
      { day: "D+3", title: "Ask 10 friends to search/call/get-directions" },
    ],
    3: ko ? [
      { day: "D-14", title: "사업자등록증·통장·영업신고증 준비", detail: "VAN사 신청서에 첨부. 사업자등록 후 즉시 신청이 골든타임." },
      { day: "D-12", title: "VAN사 1곳 가맹점 등록 신청", detail: "NICE·KIS·스마트로·KICC 중 1곳. 통합 POS(토스플레이스 등) 사용 중이면 별도 신청 불필요." },
      { day: "D-7", title: "단말기 수령 (임대 vs 구매 결정)", detail: "1년 이상 운영 예정이면 구매(20~50만원)가 유리. 단기·이전 가능성이 있으면 임대(월 1~3만원)." },
      { day: "D-3", title: "카드사·간편결제 연계 확인", detail: "VISA·MC·국내 카드사·카카오·네이버·애플페이가 단말기에 모두 표시되는지." },
      { day: "D-1", title: "실결제 1건 + 정산 흐름 확인", detail: "결제 → 영수증 → VAN 정산 → 통장 입금까지 한 사이클 점검." },
    ] : [
      { day: "D-14", title: "Prepare biz docs" },
      { day: "D-12", title: "Apply to one VAN provider" },
      { day: "D-7", title: "Decide lease vs buy" },
      { day: "D-3", title: "Verify all card networks + simple-pay" },
      { day: "D-1", title: "1 real transaction + settlement check" },
    ],
    4: ko ? [
      { day: "D-14", title: "영업장 면적 측정", detail: "건축물대장 또는 임대차 계약서 기준. 50㎡(15.1평) 미만이면 의무 X." },
      { day: "D-10", title: "옵션 비교 (직접 신고 vs 매장음악서비스)", detail: "직접 신고: 월 4천원~ (3개 단체 별도). 샵캐스트·멜론비즈: 월 9천원~ 통합." },
      { day: "D-7", title: "신청·납부 + 영수증 보관", detail: "사업자등록 후 1개월 이내 처리 권장. 단속 시 영수증 제시." },
      { day: "D-Day", title: "라이브 음원 시작", detail: "유튜브·스포티파이 사용 금지. 매장음악서비스 또는 자체 보유 음원만 재생." },
    ] : [
      { day: "D-14", title: "Measure floor area", detail: "Under 50㎡ = exempt." },
      { day: "D-10", title: "Compare direct filing vs music service" },
      { day: "D-7", title: "Apply + pay + keep receipt" },
      { day: "D-Day", title: "Use only licensed sources" },
    ],
    5: ko ? [
      { day: "D-21", title: "디자이너 견적 3곳 (크몽·라우드·숨고)", detail: "포트폴리오·후기 확인 후 1명 선택. 로고·간판·메뉴판·명함 일괄 의뢰." },
      { day: "D-14", title: "1차 시안 수령 + 피드백", detail: "톤·컬러·폰트 일치 확인. 간판은 LED 채널 vs 평판 사인 결정." },
      { day: "D-10", title: "최종 시안 확정 + 벡터 원본 수령", detail: "AI/EPS 파일 필수. JPG만 받으면 간판·인쇄에서 픽셀 깨짐 발생." },
      { day: "D-7", title: "간판 시공업체 발주 + 메뉴판 인쇄", detail: "디자이너 ≠ 시공. 시공업체 별도 섭외 (또는 디자이너에게 시공 가능 여부 확인)." },
      { day: "D-3", title: "간판 설치 + 메뉴판·명함 매장 비치", detail: "전기 연결·조명 점검. 메뉴판은 라미네이팅 또는 아크릴 거치." },
    ] : [
      { day: "D-21", title: "Get 3 designer quotes" },
      { day: "D-14", title: "Receive draft + feedback" },
      { day: "D-10", title: "Finalize + receive vector source" },
      { day: "D-7", title: "Order sign fab + print menus" },
      { day: "D-3", title: "Install sign + place menus/cards" },
    ],
  };

  // ─── WHAT (사전 준비물 — 무엇을 챙겨야 하는가) ───
  const whatNeeded: Record<number, WhatItem[]> = {
    0: ko ? [
      { label: "통신판매업 신고증 PDF", note: "지자체 발급, 사업자등록 후 1개월 이내 신고" },
      { label: "영업신고증 PDF", note: "F&B 매장은 식품접객업 영업신고" },
      { label: "사업자등록증 PDF" },
      { label: "통장사본 PDF (사업용 통장)" },
      { label: "메뉴 사진 (메뉴별 1080×1080 정사각)", note: "최소 10장. 자연광 추천" },
      { label: "메뉴 가격표·옵션 정책", note: "기본·옵션·추가 금액 + 품절 처리" },
      { label: "영업시간 + 휴무일 + 주문 가능 시간" },
    ] : [
      { label: "E-commerce filing PDF" },
      { label: "Business permit PDF" },
      { label: "Biz registration PDF" },
      { label: "Bank passbook PDF" },
      { label: "Menu photos 1080x1080" },
      { label: "Price list + options policy" },
      { label: "Hours + holidays + order window" },
    ],
    1: ko ? [
      { label: "사업자등록증" },
      { label: "통장사본 (정산 입금용)" },
      { label: "영업신고증" },
      { label: "메뉴·가격·옵션 전체 목록", note: "POS 등록용 — 엑셀 또는 메모로 사전 정리" },
      { label: "영수증 정보 (상호·사업자번호·전화)" },
      { label: "배달앱 연동 필요 여부 결정", note: "배달 비중 30%↑ 매장은 자동 수신 POS 우선" },
    ] : [
      { label: "Biz registration" },
      { label: "Bank passbook" },
      { label: "Business permit" },
      { label: "Full menu/price/options" },
      { label: "Receipt info" },
      { label: "Delivery integration decision" },
    ],
    2: ko ? [
      { label: "매장 사진 5장 이상", note: "외관·내부·메뉴·간판·분위기" },
      { label: "사업자등록증·영업신고증 PDF" },
      { label: "영업시간·전화·주차·휴무" },
      { label: "메뉴 + 가격 (대표 메뉴 5~10개)" },
      { label: "위치 좌표 (네이버 플레이스 자동 검색)" },
      { label: "인스타 첫 게시물 3개 + 릴스 1개 (사전 준비)" },
      { label: "지인 10명 동원 명단 (D+3 상호작용 폭발용)" },
    ] : [
      { label: "5+ store photos" },
      { label: "Biz registration / permit PDFs" },
      { label: "Hours / phone / parking / off-days" },
      { label: "Menu + prices (5-10 highlights)" },
      { label: "Location coordinates" },
      { label: "3 IG posts + 1 reel ready" },
      { label: "10 friends to drive interactions" },
    ],
    3: ko ? [
      { label: "사업자등록증" },
      { label: "통장사본" },
      { label: "신분증 (대표자)" },
      { label: "영업신고증" },
      { label: "현재 사용 POS의 VAN 포함 여부 확인", note: "토스플레이스 등은 별도 신청 불필요" },
      { label: "단말기 임대 vs 구매 결정", note: "운영 기간으로 결정" },
    ] : [
      { label: "Biz registration" },
      { label: "Bank passbook" },
      { label: "ID (representative)" },
      { label: "Business permit" },
      { label: "Confirm if current POS includes VAN" },
      { label: "Lease vs buy decision" },
    ],
    4: ko ? [
      { label: "영업장 면적 (㎡)", note: "건축물대장 또는 임대차 계약서" },
      { label: "사업자등록증" },
      { label: "매장 카테고리 (커피·음식점·뷰티 등)" },
      { label: "납부 옵션 결정", note: "직접 신고(저렴) vs 매장음악서비스(편의)" },
    ] : [
      { label: "Floor area (㎡)" },
      { label: "Biz registration" },
      { label: "Store category" },
      { label: "Payment option choice" },
    ],
    5: ko ? [
      { label: "매장 컨셉 정리 (1~2 문장)", note: "디자이너에게 톤 전달용" },
      { label: "선호 색상 톤 + 폰트 방향" },
      { label: "사용 위치 정리 (간판·메뉴판·명함·포장재 등)" },
      { label: "간판 종류 결정", note: "LED 채널 vs 평판 vs 입체 — 예산·인테리어와 맞춤" },
      { label: "벡터 원본 (AI/EPS) 요구사항 명시" },
      { label: "참고 매장 사진 3~5장", note: "Pinterest·인스타에서 톤 비슷한 매장" },
    ] : [
      { label: "Concept summary (1-2 sentences)" },
      { label: "Color tone + font direction" },
      { label: "Asset usage list" },
      { label: "Sign type decision" },
      { label: "Demand AI/EPS vector source" },
      { label: "3-5 reference photos" },
    ],
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

  // ─── steps 의 subtitle = "이 step 이 다른 단계와 어떻게 연결되는지" (서비스 흐름의 일부) ───
  //   사용자가 사업 시작 흐름을 따라가면서 "이전에 끝낸 것이 여기서 어떻게 쓰이는지" 자연스럽게 이해.
  const steps = [
    { key: "delivery", title: ko ? `${channelSectionLabel} 입점·등록` : "Channel Registration",    subtitle: ko ? "사업자등록·통신판매업 신고가 끝났으니 이제 첫 주문 채널을 엽니다. 메뉴 사진은 인테리어 단계에서 찍어둔 매장 사진과 함께 등록." : "Now that biz registration is done, open the order channels.", taskId: "delivery-app-registered" },
    { key: "pos",      title: ko ? "POS 실거래 테스트" : "POS Live Test",              subtitle: ko ? "공급처·메뉴·가격이 확정됐으니 결제 흐름의 중심을 만듭니다. 사업자등록증·통장사본을 준비해두세요." : "Suppliers and prices are set — now build your payment hub.", taskId: "pos-live" },
    { key: "sns",      title: ko ? "SNS·플레이스 + 런칭 캠페인" : "SNS & Launch Campaign",     subtitle: ko ? "매장 사진과 브랜드 톤이 준비됐으니 손님이 찾아올 길을 만듭니다. 등록만으로는 부족 — 첫 주 상호작용까지." : "Photos and brand tone ready — now make customers find you.", taskId: "sns-setup" },
    { key: "van",      title: ko ? "카드 가맹점 등록 (VAN)" : "Card Merchant Registration (VAN)",  subtitle: ko ? "POS 결정이 끝났다면 VAN 한 곳만 신청. 카드·간편결제가 모두 자동 연계됩니다." : "POS decided — now apply to one VAN to enable all cards.", taskId: "card-merchant-registered" },
    { key: "music",    title: ko ? "매장 배경음악 저작권" : "Background Music License",  subtitle: ko ? "인테리어 단계에서 확정된 매장 면적이 50㎡(15평) 이상이면 등록 의무. 사업자등록 직후 한 번에 끝내세요." : "If your store ≥50㎡ (set in interior stage), licensing is required.", taskId: "music-license-registered" },
    { key: "brand",    title: ko ? "브랜드 자산 (간판·메뉴판·로고)" : "Brand Assets (Signage, Menu, Logo)",  subtitle: ko ? "인테리어 단계의 컨셉을 그대로 이어 간판·메뉴판·로고를 한 디자이너에게 일괄 의뢰 — 톤이 통일돼야 손님이 '제대로 된 매장'이라고 느낍니다." : "Carry the interior concept — order all assets from one designer.", taskId: "brand-identity-offline" },
  ];

  const currentOpsStep = steps[opsStep];
  const currentKeyAction = keyActions[opsStep];
  const currentTraps = traps[opsStep] ?? [];
  const currentWhy = whyMatters[opsStep] ?? [];
  const currentHow = howFlow[opsStep] ?? [];
  const currentWhat = whatNeeded[opsStep] ?? [];
  const tasks = taskMap["operations-setup"] ?? [];
  const isTaskDone = (id: string) => tasks.find(t => t.taskId === id)?.status === "completed";

  // ─── 2-Track 분리 (밀도 감소 — 운영 인프라 vs 마케팅·브랜드) ───
  //   운영 트랙: 0(배달앱·실은 인프라 측면) / 1(POS) / 3(VAN) / 4(음악) — 영업 가능 인프라
  //   마케팅 트랙: 2(SNS·플레이스) / 5(브랜드 자산) — 노출과 첫인상
  const operationsStepIds: number[] = [0, 1, 3, 4];
  const marketingStepIds: number[] = [2, 5];
  const trackOf = (idx: number): "operations" | "marketing" =>
    operationsStepIds.includes(idx) ? "operations" : "marketing";
  const [activeTrack, setActiveTrack] = useState<"operations" | "marketing">(trackOf(opsStep));
  // opsStep 이 외부에서 바뀌면(흐름도 클릭 등) 자동으로 해당 트랙 전환.
  useEffect(() => { setActiveTrack(trackOf(opsStep)); }, [opsStep]);
  const currentTrackStepIds: number[] = activeTrack === "operations" ? operationsStepIds : marketingStepIds;

  // ─── 상세 카드 점진적 공개 (collapsible — 기본은 닫힘) ───
  const [expandedSection, setExpandedSection] = useState<"why" | "how" | "what" | null>(null);
  // step / track 전환 시 상세는 자동으로 닫음 (밀도 감소 핵심).
  useEffect(() => { setExpandedSection(null); }, [opsStep, activeTrack]);

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

  // ─── 접기/펼치기 헤더 (collapsible 공통) ───
  const SectionToggle = ({
    icon: Icon, label, hint, sectionId, count,
  }: {
    icon: React.ElementType; label: string; hint?: string;
    sectionId: "why" | "how" | "what"; count?: number;
  }) => {
    const open = expandedSection === sectionId;
    return (
      <button
        type="button"
        onClick={() => setExpandedSection(open ? null : sectionId)}
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          width: "100%", padding: "12px 14px",
          background: "white", borderRadius: "14px",
          border: "0.5px solid rgba(0,0,0,0.08)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          cursor: "pointer",
          textAlign: "left" as const,
          transition: "all 0.15s",
        }}
      >
        <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "rgba(25,25,112,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} strokeWidth={2.2} color={MIDNIGHT} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "-0.01em" }}>
            {label}
          </div>
          {hint && (
            <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.5)", marginTop: "1px", lineHeight: 1.4 }}>
              {hint}
            </div>
          )}
        </div>
        {typeof count === "number" && count > 0 && (
          <span style={{ fontSize: "11px", fontWeight: 700, color: MIDNIGHT, background: "rgba(25,25,112,0.08)", padding: "2px 8px", borderRadius: "999px", letterSpacing: "0.02em" }}>
            {count}
          </span>
        )}
        <ChevronDown
          size={16} strokeWidth={2.2}
          style={{ color: "rgba(0,0,0,0.4)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
      </button>
    );
  };

  // ─── WHY 카드 (왜 이 단계가 중요한가) — collapsible ───
  const WhyCard = () => (
    currentWhy.length === 0 ? null : (
      <div style={{ marginBottom: "10px" }}>
        <SectionToggle
          icon={Target}
          label={ko ? "왜 이 단계가 중요한가" : "Why this matters"}
          hint={ko ? "놓치면 어떤 손실이 발생하는지" : "What you lose by skipping"}
          sectionId="why"
          count={currentWhy.length}
        />
        {expandedSection !== "why" ? null : (
        <div style={{ marginTop: "8px", background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
          {currentWhy.map((why, i) => (
            <div key={why.headline}>
              {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", marginLeft: "44px" }} />}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "14px 16px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(25,25,112,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px", fontWeight: 800, color: MIDNIGHT }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "5px", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
                    {why.headline}
                  </div>
                  {why.impact && (
                    <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.62)", lineHeight: 1.55, marginBottom: why.metric ? "6px" : 0 }}>
                      {why.impact}
                    </div>
                  )}
                  {why.metric && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 9px", borderRadius: "6px", background: "rgba(25,25,112,0.07)", fontSize: "11.5px", fontWeight: 600, color: MIDNIGHT, fontVariantNumeric: "tabular-nums" }}>
                      <AlertCircle size={11} strokeWidth={2.2} />
                      {why.metric}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    )
  );

  // ─── HOW 카드 (D-day 기준 단계별 절차) — collapsible ───
  const HowCard = () => (
    currentHow.length === 0 ? null : (
      <div style={{ marginBottom: "10px" }}>
        <SectionToggle
          icon={Workflow}
          label={ko ? "어떻게 진행하나" : "How to execute"}
          hint={ko ? "오픈일 기준 권장 일정 (예시 — 본인 일정에 맞춰 조정)" : "Suggested timeline by opening date"}
          sectionId="how"
          count={currentHow.length}
        />
        {expandedSection !== "how" ? null : (
        <div style={{ marginTop: "8px", background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
          {currentHow.map((step, i) => (
            <div key={step.day} style={{ position: "relative" }}>
              {i > 0 && <div style={{ position: "absolute", top: 0, bottom: "50%", left: "29px", width: "1px", background: "rgba(25,25,112,0.18)" }} />}
              {i < currentHow.length - 1 && <div style={{ position: "absolute", top: "50%", bottom: 0, left: "29px", width: "1px", background: "rgba(25,25,112,0.18)" }} />}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "14px 16px", position: "relative" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: MIDNIGHT, marginLeft: "10px", flexShrink: 0, marginTop: "2px", border: "3px solid white", boxShadow: "0 0 0 1px rgba(25,25,112,0.18)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", padding: "2px 9px", borderRadius: "999px", background: "rgba(25,25,112,0.08)", fontSize: "11px", fontWeight: 700, color: MIDNIGHT, marginBottom: "4px", letterSpacing: "0.02em", fontVariantNumeric: "tabular-nums" }}>
                    {step.day}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "3px", letterSpacing: "-0.01em" }}>
                    {step.title}
                  </div>
                  {step.detail && (
                    <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55 }}>
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    )
  );

  // ─── WHAT 카드 (사전 준비물) — collapsible ───
  const WhatCard = () => (
    currentWhat.length === 0 ? null : (
      <div style={{ marginBottom: "16px" }}>
        <SectionToggle
          icon={ListChecks}
          label={ko ? "무엇을 준비하나" : "What to prepare"}
          hint={ko ? "사전에 챙겨야 할 서류·정보·결정" : "Documents, info, decisions"}
          sectionId="what"
          count={currentWhat.length}
        />
        {expandedSection !== "what" ? null : (
        <div style={{ marginTop: "8px", background: "white", borderRadius: "16px", padding: "14px 16px", boxShadow: "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
          {currentWhat.map((item, i) => (
            <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: "9px", padding: "7px 0", borderTop: i > 0 ? "0.5px solid rgba(0,0,0,0.05)" : "none" }}>
              <ChevronRight size={14} strokeWidth={2.4} style={{ color: MIDNIGHT, marginTop: "2px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", lineHeight: 1.45, letterSpacing: "-0.01em" }}>
                  {item.label}
                </div>
                {item.note && (
                  <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", marginTop: "2px", lineHeight: 1.5 }}>
                    {item.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    )
  );

  // ─── 사업 시작 여정 카드 (이전 → 현재 → 다음 — 우리 서비스 전체 흐름의 위치) ───
  //   사용자가 "이 단계가 왜 지금 나오는지", "끝나면 무엇이 시작되는지" 자연스럽게 이해.
  //   기존 14단계 starter-data.ts 흐름의 12~14단계 위치임.
  const JourneyContextCard = () => {
    const previous = ko ? [
      "사업자등록·통신판매업 신고",
      "공급처·POS·장비 결정",
      "직원 채용·근로계약·4대보험",
    ] : [
      "Biz registration · e-commerce filing",
      "Suppliers · POS · equipment",
      "Hiring · contracts · 4-insurance",
    ];
    return (
      <div style={{
        marginBottom: "20px",
        padding: "16px 18px",
        borderRadius: "16px",
        background: `linear-gradient(135deg, rgba(25,25,112,0.06) 0%, rgba(25,25,112,0.02) 100%)`,
        border: "0.5px solid rgba(25,25,112,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <Sparkles size={14} strokeWidth={2.2} color={MIDNIGHT} />
          <span style={{ fontSize: "11px", fontWeight: 800, color: MIDNIGHT, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            {ko ? "사업 시작 여정" : "Your launch journey"}
          </span>
          <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginLeft: "auto", fontWeight: 600 }}>
            {ko ? "12 / 14 단계" : "Step 12 / 14"}
          </span>
        </div>
        <div style={{ fontSize: "15.5px", fontWeight: 700, color: "var(--text)", lineHeight: 1.45, letterSpacing: "-0.015em", marginBottom: "10px" }}>
          {ko
            ? "지금까지 만든 것을 손님이 만나는 채널과 운영 인프라로 연결합니다"
            : "Connect what you built into operations and customer-facing channels"}
        </div>
        {/* 3-step horizontal flow: 이전 / 현재 / 다음 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", alignItems: "stretch", gap: "8px", marginTop: "12px" }}>
          {/* 이전 */}
          <div style={{ background: "white", borderRadius: "12px", padding: "11px 12px", border: "0.5px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(25,25,112,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={9} strokeWidth={3} color={MIDNIGHT} />
              </div>
              <span style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.5)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                {ko ? "끝낸 것" : "Done"}
              </span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {previous.map((p) => (
                <li key={p} style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.62)", lineHeight: 1.45, marginBottom: "2px" }}>
                  · {p}
                </li>
              ))}
            </ul>
          </div>
          <ArrowRight size={16} strokeWidth={2.2} style={{ color: MIDNIGHT, alignSelf: "center", flexShrink: 0 }} />
          {/* 현재 */}
          <div style={{
            background: MIDNIGHT,
            borderRadius: "12px", padding: "11px 12px",
            color: "white",
            boxShadow: "0 4px 14px rgba(25,25,112,0.22)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />
              </div>
              <span style={{ fontSize: "10.5px", fontWeight: 700, opacity: 0.85, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                {ko ? "지금 단계" : "Now"}
              </span>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.4, letterSpacing: "-0.01em", marginBottom: "3px" }}>
              {ko ? "운영·마케팅 준비" : "Operations & Marketing"}
            </div>
            <div style={{ fontSize: "11px", opacity: 0.85, lineHeight: 1.45 }}>
              {ko
                ? "운영 인프라 4 + 마케팅·브랜드 2"
                : "4 ops + 2 marketing"}
            </div>
          </div>
          <ArrowRight size={16} strokeWidth={2.2} style={{ color: "rgba(0,0,0,0.3)", alignSelf: "center", flexShrink: 0 }} />
          {/* 다음 */}
          <div style={{ background: "white", borderRadius: "12px", padding: "11px 12px", border: "0.5px dashed rgba(25,25,112,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(25,25,112,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star size={9} strokeWidth={2.5} color={MIDNIGHT} />
              </div>
              <span style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(0,0,0,0.5)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                {ko ? "다음" : "Next"}
              </span>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", lineHeight: 1.4, letterSpacing: "-0.01em", marginBottom: "3px" }}>
              {ko ? "소프트 오픈" : "Soft Open"}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.55)", lineHeight: 1.45 }}>
              {ko
                ? "지인 초대 → 운영 시뮬 → 본 오픈"
                : "Invite friends → dry-run → launch"}
            </div>
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", marginTop: "12px", lineHeight: 1.55, padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.6)" }}>
          {ko
            ? "💡 이 단계가 끝나면 손님이 매장을 찾을 수 있고, 들어왔을 때 모든 것이 작동합니다. 그 다음은 소프트 오픈으로 운영을 검증하는 단계입니다."
            : "💡 After this stage: customers can find you, and everything works when they arrive. Next: soft open to validate operations."}
        </div>
      </div>
    );
  };

  // ─── 단계 흐름도 (전체 6 step의 시간선·의존성 — 트랙별 필터링) ───
  const StageFlowOverview = () => {
    const allFlow: { step: number; label: string; window: string; depends?: string }[] = ko ? [
      { step: 0, label: "배달앱 입점", window: "D-7 신청 → D-3 메뉴 등록", depends: "통신판매업·영업신고증 필요" },
      { step: 3, label: "VAN (카드)", window: "사업자등록 직후 → D-3 활성화", depends: "POS 결정 후" },
      { step: 1, label: "POS 세팅", window: "D-14 견적 → D-1 실결제", depends: "VAN 결정과 동기화" },
      { step: 5, label: "브랜드 자산", window: "D-21 발주 → D-3 설치", depends: "최장 리드타임 — 가장 먼저" },
      { step: 4, label: "음악 저작권", window: "사업자등록 직후", depends: "50㎡ 이상 의무" },
      { step: 2, label: "SNS·플레이스", window: "D-10 등록 → D+3 상호작용 폭발", depends: "사진·콘텐츠 사전 준비" },
    ] : [
      { step: 0, label: "Delivery apps", window: "D-7 apply → D-3 menu" },
      { step: 3, label: "VAN (cards)", window: "Right after biz reg → D-3" },
      { step: 1, label: "POS setup", window: "D-14 quote → D-1 test" },
      { step: 5, label: "Brand assets", window: "D-21 order → D-3 install" },
      { step: 4, label: "Music license", window: "Right after biz reg" },
      { step: 2, label: "SNS & Place", window: "D-10 register → D+3 push" },
    ];
    // 트랙별 필터링 — 한 화면에 6개 다 보이지 않도록.
    const flow = allFlow.filter((f) => currentTrackStepIds.includes(f.step));
    return (
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "rgba(25,25,112,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={14} strokeWidth={2.2} color={MIDNIGHT} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: MIDNIGHT, letterSpacing: "-0.1px" }}>
            {activeTrack === "operations"
              ? (ko ? "운영 인프라 흐름 — 영업 가능 상태 만들기" : "Operations flow — get ready to sell")
              : (ko ? "마케팅 흐름 — 손님이 찾아오게 만들기" : "Marketing flow — get found")}
          </span>
        </div>
        <div style={{ background: "white", borderRadius: "16px", padding: "14px 6px", boxShadow: "0 2px 16px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.06)" }}>
          {flow.map((f) => {
            const active = f.step === opsStep;
            return (
              <button
                key={f.step}
                type="button"
                onClick={() => setOpsStep(f.step)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  width: "100%", padding: "10px 14px", borderRadius: "10px",
                  background: active ? "rgba(25,25,112,0.06)" : "transparent",
                  border: "none", cursor: "pointer",
                  textAlign: "left" as const,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.025)"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: active ? MIDNIGHT : "rgba(25,25,112,0.10)",
                  color: active ? "white" : MIDNIGHT,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: "11px", fontWeight: 800,
                  marginTop: "2px",
                }}>
                  {f.step + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: active ? MIDNIGHT : "var(--text)", letterSpacing: "-0.01em" }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.55)", marginTop: "2px", fontVariantNumeric: "tabular-nums" }}>
                    {f.window}
                  </div>
                  {f.depends && (
                    <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)", marginTop: "2px", fontStyle: "italic" }}>
                      {f.depends}
                    </div>
                  )}
                </div>
                <ChevronRight size={14} strokeWidth={2} style={{ color: active ? MIDNIGHT : "rgba(0,0,0,0.3)", marginTop: "5px", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── 트랩 카드 ───
  const TrapsCard = () => (
    currentTraps.length === 0 ? null : (
      <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
        {currentTraps.map((trap) => (
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
                  <span style={{ flexShrink: 0, fontSize: "12px", fontWeight: 800, color: "rgba(180,28,28,0.7)", marginTop: "1px" }}>−</span>
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

  // ─── Step Bridge: 이 step 이 어디서 데이터 받고 어디로 흐르는지 (서비스 흐름 가시화) ───
  type StepBridge = { from: string; to: string };
  const stepBridges: Record<number, StepBridge> = ko ? {
    0: { from: "사업자등록증 · 통신판매업 신고증 · 메뉴 사진", to: "오픈 첫날부터 배민·쿠팡이츠 주문 수신 가능" },
    1: { from: "사업자등록증 · 통장 · 메뉴 가격(공급처 단가 반영)", to: "결제·정산·세금계산서 자동 흐름의 중심" },
    2: { from: "매장 사진 · 브랜드 톤(인테리어 단계)", to: "검색·SNS에서 손님이 매장을 찾는 첫 접점" },
    3: { from: "사업자등록증 · 통장 · POS 결정", to: "카드·간편결제 모두 연결된 결제 단말" },
    4: { from: "매장 면적(인테리어 단계 확정)", to: "법적 리스크 없이 매장 음악 재생" },
    5: { from: "매장 컨셉 · 색상 톤(인테리어 단계)", to: "오픈 D-3 간판·메뉴판·로고 톤 통일 완료" },
  } : {
    0: { from: "Biz reg · e-commerce filing · menu photos", to: "Receive orders from day 1" },
    1: { from: "Biz reg · bank · menu prices", to: "Central payment/settlement hub" },
    2: { from: "Store photos · brand tone", to: "First touchpoint for customers" },
    3: { from: "Biz reg · bank · POS choice", to: "All-in-one card terminal" },
    4: { from: "Floor area (from interior stage)", to: "Play store music legally" },
    5: { from: "Interior concept & tone", to: "Unified brand assets installed by D-3" },
  };
  const currentBridge = stepBridges[opsStep];

  // 트랙 안에서의 step 인덱스 (네비 도트 + 진행도 표시용)
  const idxInTrack = currentTrackStepIds.indexOf(opsStep);
  const goPrev = () => { if (idxInTrack > 0) setOpsStep(currentTrackStepIds[idxInTrack - 1]); };
  const goNext = () => { if (idxInTrack < currentTrackStepIds.length - 1) setOpsStep(currentTrackStepIds[idxInTrack + 1]); };
  const switchTrack = (track: "operations" | "marketing") => {
    if (track === activeTrack) return;
    setActiveTrack(track);
    const firstStep = (track === "operations" ? operationsStepIds : marketingStepIds)[0];
    setOpsStep(firstStep);
  };

  // ─── Step 한 줄 가이드 (accordion 카드 헤더에 표시) ───
  const stepOneLineGuide: Record<number, string> = ko ? {
    0: "어디 입점할지 1~3곳 선택 → 동시 신청 (심사 2~5일)",
    1: "POS 1곳 선택 → 메뉴 등록 → 카드 1건 실결제로 흐름 검증",
    2: "필수 채널 등록 후 첫 주 '실질 상호작용' 폭발이 핵심",
    3: "VAN 1곳에 신청 (통합 POS 사용 시 스킵 가능)",
    4: "면적 50㎡ 이상이면 의무 — 직접 신고 vs 매장음악서비스",
    5: "한 디자이너에게 일괄 의뢰 — 톤 통일 + 벡터 원본 필수",
  } : {
    0: "Pick 1-3 platforms → apply simultaneously",
    1: "Pick 1 POS → register menu → 1 real-card test",
    2: "List in must-have channels, then drive week-1 interactions",
    3: "Apply to 1 VAN (skip if integrated POS)",
    4: "Required if ≥50㎡ — direct file vs music service",
    5: "One designer, all assets, vector source required",
  };

  // ─── 트랙별 step 진행 카운트 (accordion 헤더 배지) ───
  const stepProgress = (sid: number): { done: number; total: number } | null => {
    if (sid === 0) {
      const total = deliveryPlatforms.length;
      const done = deliveryPlatforms.filter(p => opsSelections[`delivery-${p.id}`]).length;
      return { done, total };
    }
    if (sid === 1) {
      const done = posSystems.filter(p => opsSelections[`pos-system-${p.id}`]).length;
      return { done: done > 0 ? 1 : 0, total: 1 };
    }
    if (sid === 2) {
      const total = snsChannels.length;
      const done = snsChannels.filter(p => opsSelections[`sns-${p.id}`]).length;
      return { done, total };
    }
    if (sid === 3) {
      const done = vanProviders.filter(p => opsSelections[`van-${p.id}`]).length;
      return { done: done > 0 ? 1 : 0, total: 1 };
    }
    if (sid === 4) {
      const done = musicLicenseOptions.filter(p => opsSelections[`music-${p.id}`]).length;
      return { done: done > 0 ? 1 : 0, total: 1 };
    }
    if (sid === 5) {
      const done = designPlatforms.filter(p => opsSelections[`design-${p.id}`]).length;
      return { done: done > 0 ? 1 : 0, total: 1 };
    }
    return null;
  };

  // ─── 펼친 step 의 컨텐츠 렌더링 ───
  const renderStepBody = (sid: number) => {
    const traps_ = traps[sid] ?? [];
    const body = (() => {
      if (sid === 0) return <>{renderDetail(deliveryPlatforms, "delivery")}</>;
      if (sid === 1) return renderPos();
      if (sid === 2) return <>{renderDetail(snsChannels, "sns")}</>;
      if (sid === 3) return <>{renderDetail(vanProviders, "van")}</>;
      if (sid === 4) return <>{renderDetail(musicLicenseOptions, "music")}</>;
      if (sid === 5) return <>{renderDetail(designPlatforms, "design")}</>;
      return null;
    })();
    return (
      <div style={{ padding: "0 14px 14px" }}>
        {body}
        {traps_.length > 0 && (
          <div style={{ marginTop: "12px", display: "grid", gap: "6px" }}>
            {traps_.map((trap) => (
              <div key={trap.label} style={{
                display: "flex", gap: "9px", alignItems: "flex-start",
                padding: "10px 12px", borderRadius: "10px",
                background: "rgba(182,76,76,0.05)", border: "0.5px solid rgba(182,76,76,0.14)",
              }}>
                <AlertTriangle size={14} strokeWidth={2.2} style={{ color: "#b64c4c", flexShrink: 0, marginTop: "1px" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#b64c4c", marginBottom: "2px", letterSpacing: "-0.005em" }}>{trap.label}</div>
                  <div style={{ fontSize: "12px", lineHeight: 1.5, color: "rgba(180,28,28,0.8)" }}>{trap.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* ── 트랙 토글 (운영 인프라 / 마케팅·브랜드) — 밀도 분리의 핵심 ── */}
      <div
        role="tablist"
        style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px",
          padding: "5px",
          background: "rgba(25,25,112,0.06)", borderRadius: "14px",
          marginBottom: "18px",
        }}
      >
        {([
          { id: "operations" as const, Icon: Cog,       label: ko ? "운영 인프라" : "Operations",  hint: ko ? "POS · 카드 · 배달 · 음악" : "POS · Cards · Delivery · Music", count: operationsStepIds.length },
          { id: "marketing" as const,  Icon: Megaphone, label: ko ? "마케팅·브랜드" : "Marketing",  hint: ko ? "SNS · 플레이스 · 간판" : "SNS · Place · Signage", count: marketingStepIds.length },
        ]).map(({ id, Icon, label, hint, count }) => {
          const active = activeTrack === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchTrack(id)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "10px",
                background: active ? "white" : "transparent",
                border: "none",
                boxShadow: active ? "0 2px 8px rgba(25,25,112,0.10)" : "none",
                cursor: "pointer",
                textAlign: "left" as const,
                transition: "all 0.18s",
              }}
            >
              <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: active ? MIDNIGHT : "rgba(25,25,112,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={15} strokeWidth={2.2} color={active ? "white" : MIDNIGHT} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: active ? MIDNIGHT : "rgba(0,0,0,0.65)", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: "6px" }}>
                  {label}
                  <span style={{ fontSize: "10.5px", fontWeight: 700, color: active ? "white" : MIDNIGHT, background: active ? MIDNIGHT : "rgba(25,25,112,0.10)", padding: "1px 7px", borderRadius: "999px" }}>
                    {count}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "rgba(0,0,0,0.5)", marginTop: "1px", lineHeight: 1.35, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {hint}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 트랙 라벨 + 진행 ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", paddingLeft: "2px" }}>
        <span style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.45)", letterSpacing: "0.04em", fontWeight: 600 }}>
          {activeTrack === "operations"
            ? (ko ? "운영 인프라 — 영업 가능 상태" : "Operations — get ready to sell")
            : (ko ? "마케팅·브랜드 — 손님이 찾아오게" : "Marketing — get found")}
        </span>
        <span style={{ fontSize: "11px", marginLeft: "auto", color: MIDNIGHT, fontWeight: 700, background: "rgba(25,25,112,0.08)", padding: "2px 8px", borderRadius: "999px" }}>
          {idxInTrack + 1} / {currentTrackStepIds.length}
        </span>
      </div>

      {/* ── 페이지네이션 (이전 ◁ · 도트 · 다음 ▷) ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <button
          type="button"
          aria-label={ko ? "이전" : "Previous"}
          onClick={goPrev}
          disabled={idxInTrack <= 0}
          style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: idxInTrack <= 0 ? "transparent" : "rgba(25,25,112,0.06)",
            border: "0.5px solid rgba(25,25,112,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: idxInTrack <= 0 ? "default" : "pointer",
            opacity: idxInTrack <= 0 ? 0.3 : 1,
            color: MIDNIGHT,
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.2} />
        </button>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {currentTrackStepIds.map((sid, ti) => {
            const active = sid === opsStep;
            const sdone = isTaskDone(steps[sid].taskId);
            return (
              <button
                key={sid}
                type="button"
                onClick={() => setOpsStep(sid)}
                aria-label={`Step ${ti + 1}: ${steps[sid].title}`}
                style={{
                  width: active ? "24px" : "8px", height: "8px", borderRadius: "100px",
                  background: active ? MIDNIGHT : sdone ? "rgba(25,25,112,0.45)" : "rgba(17,17,17,0.15)",
                  cursor: "pointer", border: "none", padding: 0,
                  transition: "width 0.2s ease",
                }}
              />
            );
          })}
        </div>
        <button
          type="button"
          aria-label={ko ? "다음" : "Next"}
          onClick={goNext}
          disabled={idxInTrack >= currentTrackStepIds.length - 1}
          style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: idxInTrack >= currentTrackStepIds.length - 1 ? "transparent" : "rgba(25,25,112,0.06)",
            border: "0.5px solid rgba(25,25,112,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: idxInTrack >= currentTrackStepIds.length - 1 ? "default" : "pointer",
            opacity: idxInTrack >= currentTrackStepIds.length - 1 ? 0.3 : 1,
            color: MIDNIGHT,
          }}
        >
          <ChevronRight size={16} strokeWidth={2.2} />
        </button>
      </div>

      {/* ── 현재 step 헤더 (단일 페이지) ── */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "9px",
            background: isTaskDone(currentOpsStep.taskId) ? MIDNIGHT : "rgba(25,25,112,0.08)",
            color: isTaskDone(currentOpsStep.taskId) ? "white" : MIDNIGHT,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            fontSize: "12px", fontWeight: 800, letterSpacing: "-0.3px",
          }}>
            {isTaskDone(currentOpsStep.taskId) ? <Check size={14} strokeWidth={3} /> : `0${idxInTrack + 1}`}
          </div>
          <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 700, letterSpacing: "-0.4px", color: "var(--text)" }}>{currentOpsStep.title}</h3>
          {(() => {
            const prog = stepProgress(opsStep);
            if (!prog || prog.done === 0) return null;
            return (
              <span style={{ marginLeft: "auto", fontSize: "10.5px", fontWeight: 700, color: MIDNIGHT, background: "rgba(25,25,112,0.08)", padding: "2px 8px", borderRadius: "999px", fontVariantNumeric: "tabular-nums" }}>
                {prog.total === 1 ? "✓ 선택됨" : `${prog.done}곳`}
              </span>
            );
          })()}
        </div>
        {stepOneLineGuide[opsStep] && (
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(0,0,0,0.6)", lineHeight: 1.55, paddingLeft: "40px" }}>
            {stepOneLineGuide[opsStep]}
          </p>
        )}
      </div>

      {/* ── 핵심 한 줄 (KEY ACTION) ── */}
      {currentKeyAction && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "9px", padding: "11px 13px", borderRadius: "12px", background: "rgba(25,25,112,0.05)", border: "0.5px solid rgba(25,25,112,0.12)", marginBottom: "14px" }}>
          <Sparkles size={14} strokeWidth={2.2} style={{ color: MIDNIGHT, marginTop: "1px", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "12.5px", fontWeight: 700, color: MIDNIGHT, lineHeight: 1.45, letterSpacing: "-0.005em", marginBottom: "2px" }}>
              {currentKeyAction.title}
            </div>
            <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.65)", lineHeight: 1.5 }}>
              {currentKeyAction.detail}
            </div>
          </div>
        </div>
      )}

      {/* ── 선택 카드 (현재 step 만) ── */}
      <div style={{ marginBottom: "14px" }}>
        {(() => {
          if (opsStep === 0) return renderDetail(deliveryPlatforms, "delivery");
          if (opsStep === 1) return renderPos();
          if (opsStep === 2) return renderDetail(snsChannels, "sns");
          if (opsStep === 3) return renderDetail(vanProviders, "van");
          if (opsStep === 4) return renderDetail(musicLicenseOptions, "music");
          if (opsStep === 5) return renderDetail(designPlatforms, "design");
          return null;
        })()}
      </div>

      {/* ── 트랩 (작게, 마지막에) ── */}
      {currentTraps.length > 0 && (
        <div style={{ display: "grid", gap: "6px", marginBottom: "16px" }}>
          {currentTraps.map((trap) => (
            <div key={trap.label} style={{
              display: "flex", gap: "9px", alignItems: "flex-start",
              padding: "10px 12px", borderRadius: "10px",
              background: "rgba(182,76,76,0.05)", border: "0.5px solid rgba(182,76,76,0.14)",
            }}>
              <AlertTriangle size={14} strokeWidth={2.2} style={{ color: "#b64c4c", flexShrink: 0, marginTop: "1px" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#b64c4c", marginBottom: "2px", letterSpacing: "-0.005em" }}>{trap.label}</div>
                <div style={{ fontSize: "12px", lineHeight: 1.5, color: "rgba(180,28,28,0.8)" }}>{trap.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 하단 페이지네이션 (이전 / 다음 step CTA) ── */}
      <div style={{ display: "grid", gridTemplateColumns: idxInTrack > 0 ? "1fr 1fr" : "1fr", gap: "8px", marginTop: "8px" }}>
        {idxInTrack > 0 && (
          <button
            type="button"
            onClick={goPrev}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              padding: "11px 14px", borderRadius: "11px",
              background: "white", border: "0.5px solid rgba(0,0,0,0.10)",
              color: "rgba(0,0,0,0.65)", fontSize: "12.5px", fontWeight: 700,
              cursor: "pointer", letterSpacing: "-0.005em",
            }}
          >
            <ChevronLeft size={13} strokeWidth={2.2} />
            {ko ? `이전: ${steps[currentTrackStepIds[idxInTrack - 1]].title}` : `Prev: ${steps[currentTrackStepIds[idxInTrack - 1]].title}`}
          </button>
        )}
        {idxInTrack < currentTrackStepIds.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              padding: "11px 14px", borderRadius: "11px",
              background: MIDNIGHT, border: "none",
              color: "white", fontSize: "12.5px", fontWeight: 700,
              cursor: "pointer", letterSpacing: "-0.005em",
              boxShadow: "0 2px 10px rgba(25,25,112,0.22)",
            }}
          >
            {ko ? `다음: ${steps[currentTrackStepIds[idxInTrack + 1]].title}` : `Next: ${steps[currentTrackStepIds[idxInTrack + 1]].title}`}
            <ChevronRight size={13} strokeWidth={2.2} />
          </button>
        ) : (
          activeTrack === "operations" ? (
            <button
              type="button"
              onClick={() => switchTrack("marketing")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "11px 14px", borderRadius: "11px",
                background: MIDNIGHT, border: "none",
                color: "white", fontSize: "12.5px", fontWeight: 700,
                cursor: "pointer", letterSpacing: "-0.005em",
                boxShadow: "0 2px 10px rgba(25,25,112,0.22)",
              }}
            >
              {ko ? "마케팅·브랜드 트랙으로 →" : "Go to Marketing →"}
            </button>
          ) : null
        )}
      </div>

      {/* ── 법정 의무 신고 (2026-05-25 audit 추가) ──
            현금영수증 가맹점 가입 (부가가치세법 32조의2) + 옥외 간판 신고 (옥외광고물법 5조).
            이전 운영 단계에 누락 → 미가입/미신고 시 가산세·과태료. iOS SSOT 와 동시 출시. */}
      <div style={{
        marginTop: "20px",
        padding: "18px 20px",
        borderRadius: "16px",
        background: "linear-gradient(180deg, rgba(182,76,76,0.04) 0%, rgba(182,76,76,0.02) 100%)",
        border: "1px solid rgba(182,76,76,0.18)",
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#b64c4c",
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
          marginBottom: 4,
        }}>
          {ko ? "법정 의무 신고 — 깜빡 누락 시 과태료·가산세" : "Mandatory Legal Filings"}
        </div>
        <div style={{
          fontSize: 12.5,
          color: "rgba(15,23,42,0.6)",
          marginBottom: 14,
          lineHeight: 1.55,
        }}>
          {ko
            ? "음식점·소매업은 사업자등록과 별도로 아래 2건의 법정 신고 의무가 있습니다. 운영 단계에서 사장님이 자주 놓치는 항목 — 미신고/미가입 시 가산세 또는 과태료."
            : "Two more legal filings beyond business registration. Often missed — penalties apply if skipped."}
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          {/* 현금영수증 가맹점 가입 */}
          <div style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "white",
            border: "1px solid rgba(182,76,76,0.12)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: "#b64c4c",
                padding: "2px 7px", borderRadius: 999,
                background: "rgba(182,76,76,0.12)",
              }}>{ko ? "법적 의무" : "Mandatory"}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                {ko ? "현금영수증 의무발급 가맹점 가입" : "Cash Receipt Mandatory Issuance Registration"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.55 }}>
              {ko
                ? "부가가치세법 32조의2 — 음식점·소매업 등 의무발급 업종. 10만원 이상 현금 거래 시 의무 발급. 홈택스에서 신청 또는 사업자등록 시 동시 신청. 미가입 시 미발급 거래액의 20% 가산세."
                : "VAT Act §32-2. ₩100K+ cash transactions require receipts. Apply via Hometax. 20% penalty if not registered."}
            </div>
          </div>

          {/* 옥외 간판 신고 */}
          <div style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "white",
            border: "1px solid rgba(182,76,76,0.12)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: "#b64c4c",
                padding: "2px 7px", borderRadius: 999,
                background: "rgba(182,76,76,0.12)",
              }}>{ko ? "법적 의무" : "Mandatory"}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                {ko ? "옥외 간판 신고 (구청 광고물 신고)" : "Outdoor Signage Filing (district office)"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)", lineHeight: 1.55 }}>
              {ko
                ? "옥외광고물법 5조 — 벽면·돌출·입식 간판 모두 신고 대상. 관할 구청 디자인정책과 / 옥외광고물 담당. 미신고 시 자진철거 명령 + 과태료 (크기·위치별 최대 500만원)."
                : "Outdoor Ad Act §5. All wall/projection/standing signs require filing at district office. Up to ₩5M fine for non-compliance."}
            </div>
          </div>
        </div>
      </div>

      <StageWrapup
        ko={ko}
        nextStageLabelKo="프리오픈·본 오픈 준비"
        doneItemsKo={[
          { label: "1. POS·결제·주문 시스템 연동", detail: "토스플레이스/배민·쿠팡이츠 연동 + 키오스크·테이블 오더 셋업" },
          { label: "2. 표준 운영 매뉴얼", detail: "오픈·중간·마감 체크리스트 + 위생·재고·민원 대응 SOP" },
          { label: "3. 마케팅·브랜드 채널", detail: "네이버 플레이스·카카오 채널·인스타 3축 + 리뷰 응대 룰" },
          { label: "4. 손익 모니터링 셋업", detail: "일별 매출·재료비·인건비 자동 기록 + 손익분기 추적" },
        ]}
        verifyItemsKo={[
          "POS — 카드 수수료(평균 1.5~2.5%) + 정산일(평균 3영업일) 사전 인지, 현금 흐름 시뮬",
          "배달 플랫폼 — 수수료(배민 6.8%·쿠팡이츠 9.8% + 결제 수수료) 매출 분리 회계 셋업",
          "위생교육 매년 갱신 — 식품접객업 영업자·종업원 모두 대상, 미이수 시 행정처분 + 영업정지",
          "민원 대응 — 식약처·소비자원 신고 24시간 내 대응 룰 + 사진·영상 증빙 자동 보관 시스템",
          "원산지 표시 — 농수산물 원산지 표시법 위반 시 1억원 이하 과징금, 전 메뉴 표시 의무",
          "리뷰·SNS — 광고성 리뷰(가족·지인) 식별 시 처분 가능, 진성 리뷰 유도 시스템 우선",
        ]}
        nextSummaryKo="POS·SOP·마케팅·손익 4축 셋업 완료 → 프리오픈·본 오픈 준비 단계로 진입"
      />
    </div>
  );

}
