"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck, MessageSquare, Sparkles, Package, Camera,
  ChevronDown, ChevronUp, RotateCcw, type LucideIcon,
} from "lucide-react";

const MIDNIGHT = "#191970";

type RitualItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  detail: string;
};

type Props = {
  ko: boolean;
  industryCategoryId: string;
  selectedIndustryId?: string;
  startupType?: "franchise" | "independent" | "undecided";
};

/**
 * Daily Ops Ritual — 매일 아침 운영 리추얼.
 *
 * 사용자가 매일 30초~2분 안에 끝낼 수 있는 핵심 점검:
 *   1. 어제 매출·리뷰·결산 확인
 *   2. 오늘 재고·청결 점검
 *   3. SNS·콘텐츠 1건
 *   4. sub-industry 맞춤 핵심 점검 1~2건
 *
 * State:
 *   - localStorage key: daily-ops-{YYYY-MM-DD}-{itemId} = "1"
 *   - 자정 지나면 자동 리셋 (오늘 날짜 기준 키만 읽음)
 */
export function DailyOpsRitualCard({ ko, industryCategoryId, selectedIndustryId, startupType }: Props) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);

  // ─── 매일 핵심 리추얼 (모든 사용자 공통) ───
  const universalRituals: RitualItem[] = [
    {
      id: "yesterday-sales",
      icon: ClipboardCheck,
      label: ko ? "어제 매출·POS 마감 확인" : "Check yesterday's sales & POS close",
      detail: ko ? "POS 정산 vs 실제 입금 일치 여부 + 어제 결제 오류 점검" : "Verify POS reconciliation + check for payment errors",
    },
    {
      id: "yesterday-reviews",
      icon: MessageSquare,
      label: ko ? "어제 올라온 리뷰 확인·답변" : "Read & reply to yesterday's reviews",
      detail: ko ? "네이버 플레이스 + 인스타 댓글 + 카카오 채널 — 답변 없는 것 1건이라도" : "Naver Place + Instagram + KakaoTalk — at least one reply",
    },
    {
      id: "cleanliness-open",
      icon: Sparkles,
      label: ko ? "매장 청결 상태 확인 (오픈 전)" : "Check store cleanliness (pre-open)",
      detail: ko ? "어제 마감 청소 OK? 화장실·바닥·테이블·쓰레기통 점검" : "Closing clean OK? Restroom, floor, tables, bins",
    },
    {
      id: "inventory-stock",
      icon: Package,
      label: ko ? "오늘 재고·핵심 품목 점검" : "Check today's stock & key items",
      detail: ko ? "어제 부족했던 것? 시그니처 메뉴 재료 충분한가?" : "What ran short yesterday? Signature menu items stocked?",
    },
    {
      id: "sns-today",
      icon: Camera,
      label: ko ? "오늘 SNS 콘텐츠 1건" : "Post 1 social content today",
      detail: ko ? "인스타 스토리·릴스 · 네이버 플레이스 사진 1장 — 알고리즘 노출 유지" : "Instagram story/reel · Naver Place photo — keep algorithm visibility",
    },
  ];

  // ─── Sub-industry 별 정밀 점검 (가장 중요 1~2개만) ───
  const subIndustryRituals: Record<string, RitualItem[]> = {
    // ── 카페·디저트 ──
    "icecream-bingsu": [
      { id: "freezer-temp",   icon: Package, label: ko ? "냉동고 -18°C 이하 유지 확인" : "Verify freezer ≤ -18°C", detail: ko ? "식약처 기준 + 리스테리아균 방지" : "MFDS standard + Listeria prevention" },
    ],
    "takeout-coffee": [
      { id: "machine-clean",  icon: Sparkles, label: ko ? "에스프레소 머신 백플러시·청소" : "Espresso machine backflush", detail: ko ? "피크타임 전 머신 물 교체·포타필터 청소" : "Pre-peak: water change + portafilter clean" },
      { id: "cup-stock",      icon: Package, label: ko ? "일회용 컵·홀더 피크 1.5배 재고" : "Cups/sleeves at 1.5× peak", detail: ko ? "테이크아웃 비중 80%+ — 부족 시 매출 직접 손실" : "Stockout = direct sales loss" },
    ],
    "specialty-coffee": [
      { id: "grinder-cal",    icon: Sparkles, label: ko ? "그라인더 분쇄도 캘리브레이션" : "Grinder calibration", detail: ko ? "날씨·습도 따라 미세 조정 — 추출 25~30초" : "Adjust by weather/humidity — extract 25-30s" },
      { id: "bean-fresh",     icon: Package, label: ko ? "원두 신선도 (로스팅 후 14일 이내)" : "Bean freshness (≤14 days from roast)", detail: ko ? "오래된 원두 폐기·교체" : "Discard/replace old beans" },
    ],
    "dessert-cafe": [
      { id: "showcase-temp",  icon: Package, label: ko ? "디저트 쇼케이스 4°C 이하 유지" : "Dessert showcase ≤ 4°C", detail: ko ? "케이크·생크림 변질 방지" : "Prevent cake/cream spoilage" },
      { id: "discard-yesterday", icon: ClipboardCheck, label: ko ? "전날 진열 디저트 폐기 확인" : "Discard yesterday's display", detail: ko ? "당일 폐기 원칙 — 변질 시 별점 폭락" : "Same-day rule — spoilage = rating crash" },
    ],
    "bakery-studio": [
      { id: "discard-yesterday", icon: ClipboardCheck, label: ko ? "전날 빵 폐기 + 알레르기 표시 점검" : "Discard yesterday's bread + allergen labels", detail: ko ? "당일 폐기 의무 + 계란·우유·견과 표시" : "Same-day required + allergen labels" },
      { id: "fermenter-temp", icon: Sparkles, label: ko ? "발효기 26~28°C 점검" : "Proofer 26-28°C check", detail: ko ? "HACCP 기준 — 빵 품질 일관성 핵심" : "HACCP — quality consistency" },
    ],
    "self-serve-cafe": [
      { id: "remote-monitor", icon: ClipboardCheck, label: ko ? "원격 키오스크·CCTV 작동 확인" : "Remote kiosk/CCTV check", detail: ko ? "무인 매장 핵심 — 미작동 시 매출 0" : "Unmanned core — failure = zero revenue" },
      { id: "supplies-low",   icon: Package, label: ko ? "자동 머신 원두·우유·시럽 잔량" : "Auto-machine supplies", detail: ko ? "원격 모니터링 + 1~2회 직접 보충" : "Remote monitor + 1-2× refill visits" },
    ],

    // ── 외식 ──
    "ramen-noodle": [
      { id: "broth-fresh",    icon: Package, label: ko ? "사골·잡뼈 육수 신선도 (당일 끓인 것)" : "Broth freshness (today's stock)", detail: ko ? "한식·국밥 핵심 자산 — 전날 육수 폐기 또는 재가열" : "Korean soup core asset — discard or reheat" },
      { id: "rice-warm",      icon: Sparkles, label: ko ? "밥솥·보온고 60°C 이상 유지" : "Rice/warmer ≥ 60°C", detail: ko ? "60°C 미만 시 식중독균 증식" : "Below 60°C = bacterial growth" },
    ],
    "korean-casual": [
      { id: "banchan-fresh",  icon: ClipboardCheck, label: ko ? "반찬 신선도 점검 (3시간 단위 폐기)" : "Banchan freshness (3hr discard)", detail: ko ? "변질 반찬 1번이면 단골 영원히 잃음" : "One spoiled side = lost regular forever" },
      { id: "kimchi-stock",   icon: Package, label: ko ? "김치냉장고 5종 정렬·잔량" : "Kimchi fridge 5 types + stock", detail: ko ? "백반집 표준 — 김치 다양성이 만족도 직결" : "Banchan diversity drives satisfaction" },
    ],
    "chicken-burger": [
      { id: "fryoil-acid",    icon: Sparkles, label: ko ? "튀김유 산가 측정 (3.0 이하)" : "Fry oil acid value (≤3.0)", detail: ko ? "식약처 의무 — 일 1~2회 측정. 초과 시 즉시 교체" : "MFDS mandatory — measure 1-2×/day" },
      { id: "chicken-temp",   icon: Package, label: ko ? "닭고기 보관 온도 2°C 이하 (HACCP)" : "Chicken storage ≤ 2°C (HACCP)", detail: ko ? "콜드체인 점검 + 매장 냉장고 온도" : "Cold chain + fridge temp" },
    ],
    "delivery-meals": [
      { id: "package-stock",  icon: Package, label: ko ? "배달 포장재 피크 1.5배 재고" : "Delivery packaging at 1.5× peak", detail: ko ? "국물 누설 방지 용기·뚜껑 — 부족 시 영업 중단" : "Leak-proof containers — stockout = stop service" },
      { id: "app-receive",    icon: ClipboardCheck, label: ko ? "배달앱 3사 주문 수신 점검" : "Check 3-app order reception", detail: ko ? "POS·태블릿 연동 — 미수신 = 매출 누락" : "POS/tablet sync — missing = lost revenue" },
    ],
    "salad-healthy": [
      { id: "veg-fresh",      icon: Package, label: ko ? "신선 채소·과일 입고 일자 확인" : "Fresh produce delivery date", detail: ko ? "샐러드 = 신선도 = 가격. 시들면 즉시 폐기" : "Salad = freshness = price. Discard wilted" },
      { id: "discard-prep",   icon: ClipboardCheck, label: ko ? "전날 자른 채소 폐기" : "Discard yesterday's prep", detail: ko ? "원가 통제 + 신선도 유지 핵심" : "Cost control + freshness" },
    ],
    "western-pasta-brunch": [
      { id: "cheese-temp",    icon: Package, label: ko ? "치즈·생크림 4°C 이하 유지" : "Cheese/cream ≤ 4°C", detail: ko ? "유제품 변질 = 식중독 + 클레임" : "Dairy spoilage = food poisoning + claims" },
    ],

    // ── 뷰티 ──
    "hair-salon": [
      { id: "tool-uv",        icon: Sparkles, label: ko ? "시술 도구 자외선 살균기 작동 확인" : "UV sterilizer working", detail: ko ? "공중위생관리법 의무 — 미작동 시 영업 정지 가능" : "Required by hygiene law" },
      { id: "towel-fresh",    icon: ClipboardCheck, label: ko ? "수건·가운 매번 세탁/일회용 점검" : "Towels/gowns clean check", detail: ko ? "교차 감염 방지" : "Prevent cross-infection" },
    ],
    "nail-studio": [
      { id: "autoclave",      icon: Sparkles, label: ko ? "네일 도구 멸균 (오토클레이브/UV)" : "Nail tool sterilization", detail: ko ? "공중위생관리법 의무 — 푸셔·니퍼 멸균" : "Mandatory by law — pusher/nipper sterile" },
    ],
    "skin-care-room": [
      { id: "bed-sterile",    icon: Sparkles, label: ko ? "관리 베드·시트 멸균 (매 고객)" : "Bed/sheet sterile (per client)", detail: ko ? "공중위생관리법 — 매 고객 교체" : "Hygiene law — per-client change" },
      { id: "product-expiry", icon: Package, label: ko ? "화장품·앰플 유효기간 확인" : "Cosmetic/ampoule expiry", detail: ko ? "유효기간 지난 제품 = 피부 트러블 + 클레임" : "Expired = skin issues + claims" },
    ],
    "waxing-studio": [
      { id: "wax-temp",       icon: Sparkles, label: ko ? "왁스 온도 38~50°C 유지" : "Wax temp 38-50°C", detail: ko ? "온도 미달 = 시술 어려움 / 초과 = 화상" : "Below = hard / above = burn risk" },
    ],
    "eyelash-brow": [
      { id: "glue-fresh",     icon: Package, label: ko ? "글루 신선도·온도(20~24°C) 확인" : "Glue freshness/temp (20-24°C)", detail: ko ? "변질 시 접착력 ↓ + 알레르기 위험" : "Spoiled = weak adhesion + allergy" },
    ],
    "makeup-bridal": [
      { id: "brush-clean",    icon: Sparkles, label: ko ? "브러시·스폰지 매 고객 알코올 세척" : "Brush/sponge alcohol clean per client", detail: ko ? "교차 감염 방지" : "Prevent cross-contamination" },
    ],

    // ── 피트니스 ──
    "yoga-studio": [
      { id: "mat-clean",      icon: Sparkles, label: ko ? "매트·기구 알코올 소독 (매 회원 후)" : "Mat/equipment alcohol clean", detail: ko ? "위생 1순위 — 회원 만족도 직결" : "#1 hygiene driver" },
      { id: "aed-check",      icon: ClipboardCheck, label: ko ? "AED·구급함 작동 확인" : "AED/first-aid check", detail: ko ? "다중이용시설 의무" : "Required public facility" },
    ],
    "pilates-studio": [
      { id: "reformer-spring",icon: Sparkles, label: ko ? "리포머 스프링·케이블 안전 점검" : "Reformer spring/cable safety", detail: ko ? "스프링 마모 = 부상 위험" : "Worn spring = injury risk" },
      { id: "mat-clean",      icon: Sparkles, label: ko ? "매트·체어·바렐 알코올 소독" : "Mat/chair/barrel alcohol clean", detail: ko ? "필라테스 = 피부 직접 접촉" : "Direct skin contact" },
    ],
    "pt-gym": [
      { id: "equipment-safe", icon: ClipboardCheck, label: ko ? "기구 볼트·케이블 안전 점검" : "Equipment bolt/cable safety", detail: ko ? "사고 시 무한 책임 — 1일 1회 점검" : "Liability — daily check" },
      { id: "aed-check",      icon: ClipboardCheck, label: ko ? "AED·구급함 약품 유효기간" : "AED + first-aid expiry", detail: ko ? "심정지 골든타임 4분" : "Cardiac golden 4 mins" },
    ],
    "crossfit-box": [
      { id: "bar-collar",     icon: ClipboardCheck, label: ko ? "바벨·콜라(잠금) 점검" : "Barbell collar lock check", detail: ko ? "콜라 누락 시 무게판 이탈 → 발목 부상" : "Missing = plate slip → ankle injury" },
    ],
    "golf-studio": [
      { id: "sensor-cal",     icon: Sparkles, label: ko ? "스크린·센서 캘리브레이션 (1샷 테스트)" : "Sensor calibration (1-shot test)", detail: ko ? "센서 오차 = 회원 신뢰 폭락" : "Sensor drift = trust crash" },
    ],
    "unmanned-fitness": [
      { id: "remote-monitor", icon: ClipboardCheck, label: ko ? "CCTV·키카드·키오스크 작동" : "CCTV/keycard/kiosk working", detail: ko ? "무인 운영 핵심 인프라" : "Unmanned core infra" },
    ],

    // ── 펫 ──
    "pet-supplies": [
      { id: "animal-health",  icon: ClipboardCheck, label: ko ? "매장 동물 건강 점검 (식욕·배변)" : "Store animal health (appetite/stool)", detail: ko ? "이상 시 즉시 동물병원" : "Issue = vet immediately" },
      { id: "vent-deodor",    icon: Sparkles, label: ko ? "환기·탈취 시스템 작동" : "Ventilation/deodorizer", detail: ko ? "냄새 = 1순위 불만 요인" : "Odor = #1 complaint" },
    ],
    "pet-cafe": [
      { id: "animal-health",  icon: ClipboardCheck, label: ko ? "거주 동물 컨디션 + 백신 기록" : "Resident animals + vaccine records", detail: ko ? "펫카페 신뢰도 핵심" : "Pet cafe trust core" },
      { id: "vent-deodor",    icon: Sparkles, label: ko ? "환기·탈취 작동 (시간당 환기량)" : "Ventilation (air changes/hr)", detail: ko ? "냄새 = 펫카페 1순위 불만" : "Odor = pet cafe #1 complaint" },
    ],
    "pet-grooming": [
      { id: "blade-clean",    icon: Sparkles, label: ko ? "블레이드 알코올 소독 + 오일링" : "Blade alcohol + oiling", detail: ko ? "교차 감염 방지 + 수명 연장" : "Prevent cross-infection + life" },
    ],
    "pet-hotel": [
      { id: "animal-checkin", icon: ClipboardCheck, label: ko ? "입실 동물 건강·식이 기록 확인" : "Check-in health/diet records", detail: ko ? "다른 동물 감염 방지" : "Prevent transmission" },
    ],
    "pet-training-school": [
      { id: "trainer-prep",   icon: ClipboardCheck, label: ko ? "트레이너 출근·교육 자료 준비" : "Trainer arrival + materials", detail: ko ? "행동 교정 = 일관성 핵심" : "Consistency is key" },
    ],
    "pet-walking-visit": [
      { id: "route-confirm",  icon: ClipboardCheck, label: ko ? "당일 방문 루트·시간 확정" : "Today's route/time confirm", detail: ko ? "방문형 = 시간 약속 = 신뢰" : "Visit-type = punctual = trust" },
    ],

    // ── 교육 ──
    "kids-academy": [
      { id: "fire-equip",     icon: ClipboardCheck, label: ko ? "방염·소화기·비상등 작동" : "Fire equipment check", detail: ko ? "어린이 안전 = 1순위. 미달 시 영업 정지" : "Kids safety = #1. Failure = shutdown" },
      { id: "instructor",     icon: ClipboardCheck, label: ko ? "강사 출근·수업 자료 준비" : "Instructor + materials", detail: ko ? "결근 = 학부모 신뢰 폭락" : "Absence = parent trust crash" },
    ],
    "adult-class": [
      { id: "tools-prep",     icon: ClipboardCheck, label: ko ? "수업 재료·도구 사전 세팅" : "Class materials pre-setup", detail: ko ? "성인 클래스 = 시간 효율 민감" : "Adult class = time-efficient" },
    ],
    "language-academy": [
      { id: "instructor",     icon: ClipboardCheck, label: ko ? "원어민·내국인 강사 출근 확인" : "Native/local instructor arrival", detail: ko ? "결강 시 환불 사유" : "Absence = refund trigger" },
    ],
    "coding-class": [
      { id: "pc-test",        icon: ClipboardCheck, label: ko ? "전 PC·인터넷 작동 확인" : "All PC/internet working", detail: ko ? "코딩 핵심 인프라 — 1대 고장 = 1명 수업 X" : "Coding core infra" },
    ],
    "small-study-room": [
      { id: "prep-mat",       icon: ClipboardCheck, label: ko ? "교재·과제·진도표 준비" : "Material/homework/progress", detail: ko ? "1:1·소수 정예 = 개인 맞춤 진도" : "1:1 = personalized progress" },
    ],
    "study-room": [
      { id: "equipment",      icon: ClipboardCheck, label: ko ? "프로젝터·전자칠판 작동" : "Projector/board working", detail: ko ? "장비 미작동 = 환불 사유" : "Failure = refund trigger" },
    ],
    "study-cafe-space": [
      { id: "kiosk-remote",   icon: ClipboardCheck, label: ko ? "무인 키오스크·QR 출입 작동" : "Kiosk/QR entry working", detail: ko ? "스터디카페 매출 핵심 인프라" : "Core infra" },
      { id: "cleanliness",    icon: Sparkles, label: ko ? "좌석·룸 청소 (1일 1~2회 직접)" : "Seat/room clean (1-2× daily)", detail: ko ? "청결 = 재방문률 결정" : "Cleanliness = retention" },
    ],

    // ── 소매 ──
    "convenience-small": [
      { id: "stock-key",      icon: Package, label: ko ? "주력 상품 결품 점검 (생수·라면 등)" : "Top SKU stockout check", detail: ko ? "결품 = 단골 즉시 이탈" : "Stockout = regulars leave" },
      { id: "expiry",         icon: ClipboardCheck, label: ko ? "유통기한 임박 상품 할인 처리" : "Near-expiry markdown", detail: ko ? "유효기간 지나면 식약처 적발 + 과태료" : "Expired = MFDS fine" },
    ],
    "lifestyle-goods": [
      { id: "display-curate", icon: Sparkles, label: ko ? "큐레이션 진열 정렬·신상 푸시" : "Curation + new item push", detail: ko ? "라이프스타일 = 발견 경험 = 재방문" : "Lifestyle = discovery = return" },
    ],
    "beauty-supplies": [
      { id: "tester-clean",   icon: Sparkles, label: ko ? "테스터 위생·재고 알코올 소독" : "Tester hygiene + alcohol clean", detail: ko ? "더러운 테스터 = 매장 신뢰 폭락" : "Dirty tester = trust crash" },
      { id: "product-expiry", icon: Package, label: ko ? "화장품 유효기간·개봉일 점검" : "Cosmetic expiry/open date", detail: ko ? "유효기간 지난 제품 적발 시 처벌" : "Expired = penalty" },
    ],
    "fashion-accessories": [
      { id: "display-rotate", icon: Sparkles, label: ko ? "윈도 디스플레이·마네킹 변경" : "Window display refresh", detail: ko ? "패션 매장 = 진열 변화 = 발길" : "Fashion = display change = traffic" },
      { id: "ig-content",     icon: Camera, label: ko ? "OOTD·신상 인스타 콘텐츠" : "OOTD/new arrival on Instagram", detail: ko ? "패션 = 인스타 = 유입" : "Fashion = Instagram = traffic" },
    ],
    "health-food-store": [
      { id: "product-expiry", icon: Package, label: ko ? "건강식품 유통기한·로트 점검" : "Health food expiry/lot check", detail: ko ? "유통기한 지난 제품 = 영업 중단 리스크" : "Expired = shutdown risk" },
    ],
    "unmanned-retail": [
      { id: "remote-monitor", icon: ClipboardCheck, label: ko ? "CCTV·키오스크·결제 작동 확인" : "CCTV/kiosk/payment working", detail: ko ? "무인 매장 도난 빈번 — 보안 핵심" : "Unmanned theft frequent" },
    ],

    // ── 생활/공간 ──
    "self-laundry": [
      { id: "machine-test",   icon: ClipboardCheck, label: ko ? "전 세탁기·건조기 작동 점검" : "All washer/dryer working", detail: ko ? "1대 고장 = 매출 즉시 손실" : "1 failure = immediate loss" },
      { id: "filter-clean",   icon: Sparkles, label: ko ? "건조기 먼지 필터 청소 (화재 방지)" : "Dryer lint filter clean", detail: ko ? "1일 1회 — 미청소 시 화재 위험" : "Daily — fire risk" },
    ],
    "laundry-service": [
      { id: "tag-system",     icon: ClipboardCheck, label: ko ? "고객 태그·라벨 누락 점검" : "Customer tag/label check", detail: ko ? "분실 = 무한 책임" : "Loss = unlimited liability" },
    ],
    "cleaning-service": [
      { id: "staff-schedule", icon: ClipboardCheck, label: ko ? "청소 인력 배정·도구 차량별 확인" : "Cleaner schedule + vehicle tools", detail: ko ? "방문 시간 = 신뢰 + 도구 부족 = 시간 낭비" : "Punctuality + tools" },
    ],
    "repair-service": [
      { id: "parts-stock",    icon: Package, label: ko ? "주요 부품·소모품 재고 확인" : "Key parts/supplies stock", detail: ko ? "결품 시 고객 대기 → 클레임" : "Stockout = wait → claim" },
    ],
    "print-copy": [
      { id: "toner-stock",    icon: Package, label: ko ? "토너·잉크·용지 피크 1.5배 재고" : "Toner/ink/paper at 1.5× peak", detail: ko ? "시험·과제 시즌 결품 = 매출 직격" : "Exam season stockout = direct loss" },
    ],
    "device-repair": [
      { id: "parts-stock",    icon: Package, label: ko ? "iPhone·갤럭시 액정·배터리 재고" : "iPhone/Galaxy LCD/battery stock", detail: ko ? "인기 모델 부품 사전 보유" : "Pre-stock popular models" },
    ],
    "rental-studio": [
      { id: "prev-clean",     icon: Sparkles, label: ko ? "이전 사용자 사용 후 청소·점검" : "Post-prior-use clean", detail: ko ? "예약 사이 청소 + 분실물 확인" : "Inter-booking clean + lost items" },
    ],
    "party-room": [
      { id: "prev-clean",     icon: Sparkles, label: ko ? "이전 행사 후 청소·소독" : "Post-event clean", detail: ko ? "다음 고객 즉시 입실 가능 상태" : "Ready for next guest" },
      { id: "noise",          icon: ClipboardCheck, label: ko ? "방음·소음 측정·이웃 민원 점검" : "Soundproof/noise check", detail: ko ? "파티룸 1순위 리스크" : "#1 risk" },
    ],
    "shared-office": [
      { id: "internet",       icon: ClipboardCheck, label: ko ? "Wi-Fi·인터넷·복합기 작동" : "Wi-Fi/internet/printer", detail: ko ? "다운 시 회원 즉시 환불·해지" : "Down = instant refund/cancel" },
    ],
    "practice-room": [
      { id: "equipment",      icon: ClipboardCheck, label: ko ? "악기·앰프·스피커 작동 점검" : "Instrument/amp/speaker check", detail: ko ? "장비 미작동 = 환불" : "Failure = refund" },
    ],
  };

  // ─── 카테고리 폴백 (sub-industry 없을 때) ───
  const categoryRituals: Record<string, RitualItem[]> = {
    food:           [{ id: "ingredient-fresh", icon: Package, label: ko ? "식재료 신선도·유통기한 점검" : "Ingredient freshness/expiry", detail: ko ? "신선도 = 별점 = 매출" : "Freshness = stars = sales" }],
    "cafe-dessert": [{ id: "machine-clean", icon: Sparkles, label: ko ? "에스프레소 머신·진열대 청소" : "Espresso machine/display clean", detail: ko ? "음료 품질 + 위생" : "Quality + hygiene" }],
    beauty:         [{ id: "tool-sterile", icon: Sparkles, label: ko ? "시술 도구 멸균·소독 확인" : "Tool sterilization", detail: ko ? "공중위생관리법 의무" : "Required by law" }],
    fitness:        [{ id: "equipment-safe", icon: ClipboardCheck, label: ko ? "운동 기구 안전 점검" : "Equipment safety check", detail: ko ? "사고 시 무한 책임" : "Liability" }],
    education:      [{ id: "instructor", icon: ClipboardCheck, label: ko ? "강사 출근·수업 자료 점검" : "Instructor + materials", detail: ko ? "결근 = 학부모 신뢰 직격" : "Absence = trust impact" }],
    pet:            [{ id: "vent-deodor", icon: Sparkles, label: ko ? "환기·탈취 시스템 작동" : "Ventilation/deodorizer", detail: ko ? "냄새 = 1순위 불만" : "Odor = #1 complaint" }],
    retail:         [{ id: "stock-key", icon: Package, label: ko ? "주력 상품 결품 점검" : "Top SKU stockout check", detail: ko ? "결품 = 즉시 매출 손실" : "Stockout = immediate loss" }],
    "living-service": [{ id: "machine-test", icon: ClipboardCheck, label: ko ? "기기·시설 작동 점검" : "Equipment/facility check", detail: ko ? "고장 = 매출 직접 손실" : "Failure = direct loss" }],
    space:          [{ id: "prev-clean", icon: Sparkles, label: ko ? "이전 사용자 후 청소·점검" : "Post-prior-use clean", detail: ko ? "다음 고객 첫인상" : "Next guest first impression" }],
  };

  // ─── 운영 형태별 추가 ───
  const ownershipExtra: RitualItem[] = startupType === "franchise" ? [
    { id: "hq-erp-sync", icon: ClipboardCheck, label: ko ? "본사 ERP 매출 동기화 확인" : "HQ ERP sales sync", detail: ko ? "동기화 실패 시 본사 점검 시야 사라짐" : "Sync fail = HQ blind" },
  ] : startupType === "independent" ? [
    { id: "self-log", icon: ClipboardCheck, label: ko ? "매출·고객 일지 직접 기록" : "Self-log sales/customers", detail: ko ? "프랜차이즈 ERP 없으니 사장님이 직접" : "No HQ ERP — owner logs" },
  ] : [];

  // ─── 최종 리스트 합성 ───
  const subItems: RitualItem[] = (selectedIndustryId ? subIndustryRituals[selectedIndustryId] : undefined)
    ?? categoryRituals[industryCategoryId]
    ?? [];
  const allItems: RitualItem[] = [...universalRituals, ...subItems, ...ownershipExtra];

  // ─── localStorage 동기화 (오늘 날짜 기준) ───
  useEffect(() => {
    if (typeof window === "undefined") return;
    const next: Record<string, boolean> = {};
    allItems.forEach((item) => {
      const key = `daily-ops-${today}-${item.id}`;
      if (window.localStorage.getItem(key) === "1") next[item.id] = true;
    });
    setChecks(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, selectedIndustryId, industryCategoryId, startupType]);

  const toggle = (id: string) => {
    const key = `daily-ops-${today}-${id}`;
    setChecks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (typeof window !== "undefined") {
        if (next[id]) window.localStorage.setItem(key, "1");
        else window.localStorage.removeItem(key);
      }
      return next;
    });
  };

  const resetToday = () => {
    if (typeof window === "undefined") return;
    allItems.forEach((item) => window.localStorage.removeItem(`daily-ops-${today}-${item.id}`));
    setChecks({});
  };

  const checkedCount = Object.values(checks).filter(Boolean).length;
  const total = allItems.length;
  const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
  const allDone = checkedCount === total && total > 0;

  return (
    <section
      style={{
        borderRadius: "20px",
        background: "white",
        border: "1px solid rgba(25,25,112,0.08)",
        boxShadow: "0 2px 16px rgba(25,25,112,0.04)",
        overflow: "hidden",
      }}
      className="bento-card"
    >
      {/* 헤더 */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", cursor: "pointer" }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: allDone ? "rgba(34,167,73,0.12)" : "rgba(25,25,112,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          color: allDone ? "rgb(34,167,73)" : MIDNIGHT,
        }}>
          <ClipboardCheck size={20} strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
            <span style={{ fontSize: "15.5px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
              {ko ? "오늘의 운영 리추얼" : "Today's Ops Ritual"}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", background: allDone ? "rgb(34,167,73)" : MIDNIGHT, padding: "3px 9px", borderRadius: "999px", letterSpacing: "-0.01em" }}>
              {checkedCount} / {total}
            </span>
          </div>
          <div style={{ fontSize: "12.5px", color: "rgba(0,0,0,0.5)", marginTop: "2px" }}>
            {allDone
              ? (ko ? "✓ 오늘 운영 점검 완료 — 수고하셨어요" : "✓ Today's ops ritual done — well done")
              : (ko ? "재고·청결·어제 리뷰 등 — 자정에 자동 리셋" : "Inventory · cleanliness · yesterday's reviews — resets at midnight")}
          </div>
        </div>
        {checkedCount > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); resetToday(); }}
            style={{
              fontSize: "11.5px", fontWeight: 600, color: "rgba(0,0,0,0.5)",
              background: "rgba(25,25,112,0.04)", border: "none", borderRadius: "8px",
              padding: "5px 9px", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "4px",
              flexShrink: 0,
            }}
            aria-label={ko ? "오늘 점검 초기화" : "Reset today"}
          >
            <RotateCcw size={11} strokeWidth={1.5} />
            {ko ? "리셋" : "Reset"}
          </button>
        )}
        <div style={{ flexShrink: 0, color: "rgba(0,0,0,0.35)" }}>
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </div>

      {/* 진행 바 */}
      <div style={{ height: "3px", background: "rgba(0,0,0,0.05)", margin: "0 20px" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: allDone ? "rgb(34,167,73)" : MIDNIGHT,
          borderRadius: "100px",
          transition: "width 0.35s ease, background 0.2s",
        }} />
      </div>

      {/* 항목 목록 */}
      {!collapsed && (
        <div style={{ padding: "10px 0 14px" }}>
          {allItems.map((item, idx) => {
            const checked = !!checks[item.id];
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {idx > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.06)", marginLeft: "60px" }} />}
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "14px",
                    padding: "12px 20px",
                    width: "100%",
                    textAlign: "left" as const,
                    background: checked ? "rgba(25,25,112,0.03)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  {/* 체크박스 */}
                  <div style={{
                    flexShrink: 0, marginTop: "2px",
                    width: 22, height: 22, borderRadius: 7,
                    border: checked ? "none" : "1.5px solid rgba(0,0,0,0.2)",
                    background: checked ? MIDNIGHT : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}>
                    {checked && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {/* 아이콘 */}
                  <div style={{
                    flexShrink: 0,
                    width: 28, height: 28, borderRadius: 8,
                    background: "rgba(25,25,112,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: MIDNIGHT,
                  }}>
                    <Icon size={14} strokeWidth={1.5} />
                  </div>
                  {/* 텍스트 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "14px", fontWeight: 600,
                      color: checked ? "rgba(0,0,0,0.32)" : "var(--text)",
                      textDecoration: checked ? "line-through" : "none",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.45,
                      transition: "all 0.15s",
                    }}>
                      {item.label}
                    </div>
                    {!checked && (
                      <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", lineHeight: 1.5, marginTop: "2px" }}>
                        {item.detail}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
