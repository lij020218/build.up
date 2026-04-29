"use client";

import { Lightbulb } from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { AIFeedbackFormGenerator } from "./AIFeedbackFormGenerator";

const MIDNIGHT = "#191970"; // 서비스 메인 포인트 컬러

export function PreLaunchStage() {
  const d = useDashboardCtx();
  const {
    language, industryCategoryId, selectedIndustryId, startupType, storeName,
    softOpenStep, setSoftOpenStep,
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

                  // ─────────────────────────────────────────────────────────────
                  // 카테고리 레벨 일일 점검 (sub-industry 데이터 없을 때 폴백)
                  // ─────────────────────────────────────────────────────────────
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

                  // ─────────────────────────────────────────────────────────────
                  // SUB-INDUSTRY 별 일일 점검 (정밀 데이터)
                  // 식약처·공중위생관리법·HACCP 가이드라인 기반 + 업계 운영 노하우 검증
                  // ─────────────────────────────────────────────────────────────
                  const subIndustryDayChecks: Record<string, { id: string; label: string; detail: string }[]> = {
                    // ── 카페·디저트 ──
                    "icecream-bingsu": [
                      { id: "day-freezer-temp",   label: "냉동고 온도 -18°C 이하 유지 확인 (식약처 기준)", detail: "리스테리아균은 저온에서도 생존 — 해동·재냉동 반복 시 식중독 리스크. 온도계 배터리·작동 점검 필수" },
                      { id: "day-icemachine",     label: "빙삭기·아이스크림 디스펜서 위생 점검", detail: "전날 마감 후 분리 청소 → 당일 재조립 위생 상태 확인. 잔여 시럽·과일 제거" },
                      { id: "day-toppings",       label: "시즌 토핑(과일·시럽·견과) 신선도 확인", detail: "과일은 당일 입고분 사용 권장. 시럽 개봉일 라벨 확인" },
                      { id: "day-roomtemp",       label: "매장 실내 온도 24°C 이하 유지", detail: "여름철 매장 온도 ↑ → 디저트 품질 저하. 에어컨·서큘레이터 작동 확인" },
                      { id: "day-display",        label: "포토존·디스플레이 조명 점검", detail: "인스타·SNS 바이럴 핵심 — 조명 각도·디저트 정렬·소품 배치" },
                    ],
                    "takeout-coffee": [
                      { id: "day-machine-water",  label: "에스프레소 머신 물 교체·청결 (3시간 간격)", detail: "보일러 물 정체 시 추출 맛 변질 — 피크타임 전 반드시 새 물" },
                      { id: "day-cup-stock",      label: "일회용 컵·홀더·캐리어 재고 확인 (피크 1.5배)", detail: "테이크아웃 비중 80%+ 매장 — 컵 부족 시 매출 직접 손실" },
                      { id: "day-syrup",          label: "시럽·파우더·우유 잔량 점검", detail: "피크타임 중간 교체 = 줄 길이 폭증. 사전 보충 필수" },
                      { id: "day-pos-speed",      label: "POS·키오스크 결제 속도 점검", detail: "회전율 매장은 결제 1건 5초 ↑ 시 줄 길이 누적. 통신 상태 확인" },
                      { id: "day-queue",          label: "피크타임 대기열·동선 점검", detail: "주문→픽업 동선 정리, 줄 표시 테이프 확인" },
                    ],
                    "specialty-coffee": [
                      { id: "day-grinder-cal",    label: "그라인더 분쇄도 캘리브레이션", detail: "날씨·습도에 따라 매일 미세 조정 필수 — 추출 시간 25~30초 기준" },
                      { id: "day-bean-fresh",     label: "원두 신선도 확인 (로스팅 후 14일 이내)", detail: "원두 산패율 부적절 보관 시 25% 증가 — 밀폐 용기·서늘한 곳 보관" },
                      { id: "day-extraction",     label: "추출 시간·수율 측정·기록", detail: "에스프레소 1샷 25~30초, 추출량 25~30g 기준 — 표준 벗어나면 재캘리브레이션" },
                      { id: "day-machine-clean",  label: "머신 백플러시·포타필터 청소", detail: "피크 후 또는 1일 1회 — 미실시 시 산패 커피 잔류" },
                      { id: "day-cup-warm",       label: "잔 예열·세팅 상태 확인", detail: "예열 안 된 잔 = 음료 온도 ↓ → 커피 풍미 손상" },
                    ],
                    "dessert-cafe": [
                      { id: "day-showcase-temp",  label: "디저트 쇼케이스 온도 4°C 이하 유지", detail: "케이크·생크림 5°C 초과 시 변질 가능. 온도계 점검" },
                      { id: "day-dessert-life",   label: "디저트 유효 시간 확인 (당일 폐기 원칙)", detail: "전날 진열품 폐기 — 변질 시 식중독 + 별점 폭락 리스크" },
                      { id: "day-display",        label: "쇼케이스 디스플레이 정렬·조명 점검", detail: "비주얼 = 매출 직결 — SNS 인증샷 구도 점검" },
                      { id: "day-allergen",       label: "알레르기 표시 확인 (계란·우유·견과)", detail: "표시 의무 — 누락 시 법적 분쟁 + 사고 시 책임" },
                      { id: "day-seasonal-push",  label: "시즌 메뉴 푸시·POP 부착", detail: "신메뉴는 매대 가장 좋은 위치 — 시즌 매출 핵심" },
                    ],
                    "bakery-studio": [
                      { id: "day-fermenter",      label: "발효기·오븐 온도 점검 (HACCP 기준)", detail: "발효기 26~28°C, 오븐 예열 표준 온도 — 표준 벗어나면 빵 품질 ↓" },
                      { id: "day-dough-time",     label: "반죽·발효·굽기 단계별 시간 기록", detail: "표준 레시피 시간 준수 — 일관성이 단골 고객 확보의 핵심" },
                      { id: "day-bread-discard", label: "전날 진열 빵 폐기 (당일 폐기 원칙)", detail: "위생법상 의무 — 미폐기 시 점검 적발·과태료" },
                      { id: "day-cross-contam", label: "반죽기·작업대 교차오염 방지 점검", detail: "글루텐 알레르기 등 — 도구 분리·세척 표준 준수" },
                      { id: "day-allergen",       label: "알레르기 정보 표시·진열 확인", detail: "계란·우유·견과·밀 — 모든 빵에 표시 의무" },
                    ],
                    "self-serve-cafe": [
                      { id: "day-kiosk-remote",   label: "원격 키오스크·결제 단말 작동 확인", detail: "무인 매장 핵심 인프라 — 미작동 시 매출 0. 원격 제어 시스템 점검" },
                      { id: "day-cctv-record",    label: "CCTV 24시간 정상 녹화 확인", detail: "도난·기물 파손 대응 + 보험 청구 근거 — 저장 용량·해상도 점검" },
                      { id: "day-auto-machine",   label: "자동 머신 원두·우유·시럽 잔량", detail: "원격 모니터링 + 1일 1~2회 직접 보충 방문" },
                      { id: "day-cleanliness",    label: "셀프 청소 / 정기 방문 청소", detail: "1일 1~2회 직접 방문 청소 — 무인이라도 청결은 사장 책임" },
                      { id: "day-security",       label: "도난·기물 파손 점검", detail: "전날 야간 CCTV 빠르게 검토 — 이상 시 즉시 대응" },
                    ],

                    // ── 외식·식당 ──
                    "ramen-noodle": [
                      { id: "day-broth-fresh",    label: "사골·잡뼈 육수 신선도 확인 (당일 끓인 것)", detail: "한식·국밥 핵심 자산. 전날 육수는 폐기 또는 재가열 후 신선도 검증" },
                      { id: "day-rice-warm",      label: "밥솥·보온고 온도 60°C 이상 유지", detail: "60°C 미만 시 식중독균 증식. 점심 회전율 핵심 — 양·온도 동시 점검" },
                      { id: "day-kimchi-temp",    label: "김치냉장고 온도 1~5°C 유지", detail: "깍두기·열무·배추 보관 표준 온도. 발효 통제 — 너무 시면 폐기" },
                      { id: "day-bowl-clean",     label: "뚝배기 세척·잔열 제거 확인", detail: "잔열 있는 뚝배기 재사용 시 화상·변형. 세척 후 식힘 시간 확보" },
                      { id: "day-seasoning",      label: "양념·다대기·새우젓 잔량 확인", detail: "한식 간 핵심 — 떨어지면 맛 변질. 사전 보충 필수" },
                    ],
                    "korean-casual": [
                      { id: "day-banchan-fresh",  label: "반찬 신선도 점검 (3시간 단위 폐기)", detail: "한식 백반 핵심. 변질 반찬 1번이면 단골 영원히 잃음" },
                      { id: "day-kimchi-stock",   label: "김치냉장고 5종 이상 정렬·잔량 확인", detail: "백반집 표준 — 김치 종류 다양성이 만족도 직결" },
                      { id: "day-fresh-meat",     label: "주재료(생선·고기) 신선도 일자별 정렬", detail: "FIFO 원칙 — 입고 일자 라벨 + 오래된 것 먼저 사용" },
                      { id: "day-dishwasher",     label: "식기세척기 헹굼 온도 80°C 이상", detail: "식약처 기준 — 미달 시 살균 부족, 점검 적발 가능" },
                      { id: "day-selfbar",        label: "셀프바 위생 (집게·국자 30분 단위 교체)", detail: "교차 오염 방지 — 손 닿는 도구 자주 교체" },
                    ],
                    "chicken-burger": [
                      { id: "day-fryoil-acid",    label: "튀김유 산가 측정 (3.0 이하 유지) — 식약처 의무", detail: "산가 3.0 초과 시 변질 — 즉시 교체. 일 1~2회 측정 권장" },
                      { id: "day-fryoil-change", label: "튀김유 교체 주기 확인 (3일 또는 산가 초과 시)", detail: "산가·이물질 기준 — 늦으면 식중독 + 식약처 적발" },
                      { id: "day-chicken-temp",   label: "닭고기 보관 온도 2°C 이하 (HACCP)", detail: "도계장→배송→매장 전 단계 콜드체인 점검 + 매장 냉장고 온도" },
                      { id: "day-tools-sterilize",label: "조리기구 열탕 소독 (교차오염 방지) — 식약처", detail: "한 번 사용한 도구 열탕 소독 — 도마·집게·튀김 망 분리" },
                      { id: "day-delivery-sla",   label: "배달앱 주문 처리 속도 (SLA 25분)", detail: "25분 초과 시 알람 → 별점·재주문 영향. POS 알림 점검" },
                    ],
                    "delivery-meals": [
                      { id: "day-package-stock",  label: "배달 포장재 재고 확인 (피크 1.5배)", detail: "국물 누설 방지 용기·뚜껑·실링 — 부족 시 영업 중단" },
                      { id: "day-app-receive",    label: "배달앱 3사(배민·쿠팡이츠·요기요) 주문 수신 확인", detail: "POS 또는 태블릿 연동 점검 — 미수신 = 매출 누락" },
                      { id: "day-rider-station",  label: "라이더 픽업 동선·구역 정리", detail: "복수 라이더 동시 도착 시 충돌 방지 — 구역 라벨" },
                      { id: "day-temp-keep",      label: "보온백·아이스팩 준비", detail: "음식 도착 온도가 별점 결정 요소" },
                    ],
                    "salad-healthy": [
                      { id: "day-veg-fresh",     label: "신선 채소·과일 입고 일자 확인 (당일 또는 1일 이내)", detail: "샐러드는 신선도가 곧 가격. 시들거나 변색된 잎채소 즉시 폐기" },
                      { id: "day-prep-cold",     label: "저온 전처리 작업 (15°C 이하 작업대)", detail: "샐러드 전용 작업대 온도 — 미생물 증식 방지" },
                      { id: "day-dressing",      label: "드레싱·소스 유효기간·교차오염 점검", detail: "오픈 후 3일 이내 사용 원칙. 도구 분리(견과·해산물 알레르기)" },
                      { id: "day-discard",       label: "전날 자른 채소 폐기 점검", detail: "샐러드 가게 폐기율 핵심 — 원가 통제 + 신선도 유지" },
                      { id: "day-package-eco",   label: "친환경 포장재 재고 확인", detail: "건강식 고객은 친환경 포장 민감 — PLA·종이 용기 잔량" },
                    ],
                    "western-pasta-brunch": [
                      { id: "day-pasta-stock",   label: "생면·건면·소스 재고 확인 (피크 1.5배)", detail: "피크 점심 시간 끊기면 회전율 즉시 손실" },
                      { id: "day-cheese-temp",   label: "치즈·생크림 냉장 4°C 이하 유지", detail: "유제품 변질 = 식중독 + 클레임. 일일 온도 확인" },
                      { id: "day-brunch-prep",   label: "브런치 식자재(계란·베이컨·아보카도) 신선도", detail: "브런치 메뉴 = 비주얼 = SNS. 변색·유효기간 엄격 관리" },
                      { id: "day-plating",       label: "플레이팅 표준·접시 세팅 점검", detail: "양식·브런치 비주얼이 객단가 결정 — 표준 사진 준수" },
                      { id: "day-table-setting", label: "테이블 세팅·매트·커트러리 점검", detail: "다이닝 분위기 핵심 — 더러운 커트러리는 즉시 클레임" },
                    ],

                    // ── 뷰티 ──
                    "hair-salon": [
                      { id: "day-tool-uv",        label: "시술 도구 자외선 살균기 작동 확인 — 공중위생관리법", detail: "가위·빗·롤 — 자외선 살균기 의무. 미작동 시 영업 정지 가능" },
                      { id: "day-hand-hygiene",   label: "시술 전후 손 위생·알코올 소독", detail: "공중위생관리법 — 시술 전후 손 세정·소독 의무" },
                      { id: "day-towel-fresh",    label: "수건·가운 매번 세탁 또는 일회용", detail: "교차 감염 방지 — 사용한 수건 재사용 금지" },
                      { id: "day-shampoo-clean",  label: "샴푸대 위생 점검·배수구 청소", detail: "물기·머리카락 누적 시 위생·악취 문제" },
                      { id: "day-booking",        label: "네이버·카카오 예약 시스템 점검", detail: "예약 → 확정 → 알림 전체 흐름 테스트" },
                    ],
                    "nail-studio": [
                      { id: "day-autoclave",      label: "네일 도구 멸균(오토클레이브 또는 자외선 살균기)", detail: "공중위생관리법 — 푸셔·니퍼 등 피부 접촉 도구 의무 멸균" },
                      { id: "day-disposable",     label: "큐티클 푸셔·일회용품 매 고객 폐기", detail: "교차 감염 방지 — 일회용은 절대 재사용 금지" },
                      { id: "day-alcohol-stock",  label: "알코올·세정제 잔량 확인", detail: "시술 사이 도구 소독 필수 — 부족하면 위생 위반" },
                      { id: "day-polish-expiry",  label: "매니큐어·젤 유효기간 확인", detail: "유효기간 지난 제품 사용 시 알레르기·피부 반응" },
                      { id: "day-booking",        label: "예약 시스템 확인", detail: "네이버·카카오 예약 흐름 점검" },
                    ],
                    "skin-care-room": [
                      { id: "day-bed-sterile",    label: "관리 베드·시트 멸균 (매 고객)", detail: "공중위생관리법 — 시트·수건 매 고객 교체" },
                      { id: "day-product-expiry", label: "화장품·앰플 유효기간 확인", detail: "유효기간 지난 제품 = 피부 트러블 + 클레임" },
                      { id: "day-machine-test",   label: "관리 기기(LED·고주파 등) 작동 확인", detail: "기기 오류 시 시술 효과 ↓ + 안전 사고" },
                      { id: "day-hand-hygiene",   label: "손 위생·라텍스 장갑 준비", detail: "시술 전 손 세정 + 매 고객 장갑 교체" },
                      { id: "day-booking",        label: "예약 시스템·노쇼 방지", detail: "예치금 자동 수령 시스템 점검" },
                    ],
                    "waxing-studio": [
                      { id: "day-wax-temp",       label: "왁스·슈가 페이스트 온도 확인 (38~50°C)", detail: "온도 미달 시 시술 어려움, 초과 시 화상 위험" },
                      { id: "day-spatula",        label: "왁싱 스패출러 매 회 폐기 (더블 디핑 금지)", detail: "교차감염 방지 — 한 번 쓴 막대기 재사용 절대 금지" },
                      { id: "day-bed-cover",      label: "베드 커버·일회용 시트 매 고객 교체", detail: "프라이버시 + 위생 — 신뢰 핵심 요소" },
                      { id: "day-skin-prep",      label: "고객 피부 사전 점검 (멍·상처·알레르기)", detail: "선크림·각질 제거 후 24시간 내 시술 금지 — 사고 방지" },
                      { id: "day-booking",        label: "예약·시술 간격 점검 (15분 버퍼)", detail: "왁싱 후 진정 시간 확보 — 다음 고객과 겹치지 않게" },
                    ],
                    "eyelash-brow": [
                      { id: "day-glue-fresh",     label: "속눈썹 글루 신선도·온도(20~24°C) 확인", detail: "글루 변질 시 접착력 ↓ + 알레르기 위험. 개봉 1개월 이내 사용" },
                      { id: "day-tweezer",        label: "핀셋·도구 자외선 살균 + 알코올 소독", detail: "공중위생관리법 — 매 고객 멸균 의무" },
                      { id: "day-patch-test",     label: "신규 고객 패치 테스트 기록 확인", detail: "글루·염색약 알레르기 — 사전 패치 테스트 24시간 후 시술" },
                      { id: "day-bed-cover",      label: "시술 베드 시트·아이패치 일회용 교체", detail: "눈 부위 위생 = 안전. 매 고객 새 시트" },
                      { id: "day-fan-vent",       label: "환기·서큘레이터 작동 (글루 냄새)", detail: "에틸시아노아크릴레이트 휘발 — 환기 부족 시 두통·시술자 건강 영향" },
                    ],
                    "makeup-bridal": [
                      { id: "day-brush-clean",    label: "브러시·스폰지 매 고객 알코올 세척", detail: "교차감염 방지 — 메이크업 도구는 매 회 청소" },
                      { id: "day-product-test",   label: "화장품 유효기간·개봉 후 사용기간 확인", detail: "마스카라·립스틱 6~12개월 / 파운데이션 12개월" },
                      { id: "day-event-schedule", label: "당일 행사 일정·이동 동선 확인", detail: "출장 메이크업 — 시간 지연 시 신부 일정 전체 영향" },
                      { id: "day-skin-test",      label: "신부 피부 상태·알레르기 사전 확인", detail: "결혼식 당일 트러블 = 사진·기억 영향. 사전 트라이얼 필수" },
                      { id: "day-emergency-kit",  label: "응급 키트(반창고·진정제·여분 화장품) 준비", detail: "긴급 보수용 — 립스틱 번짐·파데 들뜸 즉시 대응" },
                    ],

                    // ── 피트니스 ──
                    "yoga-studio": [
                      { id: "day-mat-clean",      label: "매트·기구 알코올 소독 (매 회원 후)", detail: "코로나 이후 위생 1순위 — 회원 만족도 직결" },
                      { id: "day-equipment-safe", label: "리포머·기구 안전 점검 (볼트·스프링)", detail: "스프링·케이블 마모 시 사고 위험 — 1주 1회 정밀 점검" },
                      { id: "day-temp-humid",     label: "실내 온도·습도 (22~25°C, 50~60%)", detail: "요가·필라테스 최적 환경. 너무 차거나 더우면 부상 위험" },
                      { id: "day-class-roster",   label: "수업 시간표·예약 확인", detail: "강사 변경·휴강 사전 공지 — 회원 신뢰" },
                      { id: "day-aed",            label: "AED·구급함 위치·작동 확인", detail: "다중이용시설 의무 — 위치·배터리·약품 유효기간" },
                    ],
                    "pilates-studio": [
                      { id: "day-reformer-spring", label: "리포머 스프링·케이블 안전 점검", detail: "스프링 마모 시 강한 반동 → 부상. 1일 시작 전 모든 리포머 점검" },
                      { id: "day-mat-clean",       label: "매트·체어·바렐 매 회원 알코올 소독", detail: "필라테스 = 피부 직접 접촉 — 위생 1순위" },
                      { id: "day-class-balance",   label: "수업별 정원·강사 매칭 확인 (1:6 권장)", detail: "강사 1명당 회원 6명 초과 시 자세 교정 품질 ↓" },
                      { id: "day-temp-humid",      label: "실내 온도 22~24°C·습도 50~60%", detail: "근육 부상 방지 + 매트 미끄럼 방지 최적 조건" },
                      { id: "day-aed",             label: "AED·구급함·응급 매뉴얼 확인", detail: "다중이용시설 의무. 강사 응급 처치 교육 이수 확인" },
                    ],
                    "pt-gym": [
                      { id: "day-equipment-safe", label: "프리웨이트·머신 볼트·케이블 점검", detail: "고하중 기구 사고 시 무한 책임. 1일 1회 점검 일지 권장" },
                      { id: "day-pt-schedule",    label: "PT 트레이너 출근·세션 일정 확인", detail: "PT 노쇼 = 환불·고소 리스크. 30분 전 확정 알림 발송" },
                      { id: "day-locker",         label: "락커룸·샤워실 청결 + 비품(샴푸·드라이기) 점검", detail: "PT 회원 만족도 = 락커룸 품질로 80% 결정" },
                      { id: "day-aed",            label: "AED·구급함 작동·약품 유효기간", detail: "심정지 골든타임 4분. 다중이용시설 의무" },
                      { id: "day-air-vent",       label: "환기·에어컨 작동 (땀 냄새)", detail: "환기 부족 시 별점 폭락. 시간당 환기량 점검" },
                    ],
                    "crossfit-box": [
                      { id: "day-bar-collar",     label: "바벨·콜라(잠금) 상태 점검", detail: "콜라 누락 시 무게판 이탈 → 발목 부상. 1일 시작 전 모든 바벨 점검" },
                      { id: "day-flooring",       label: "고무 플로어링 패드 균열·들뜸 점검", detail: "올림픽 리프팅 충격 흡수 — 갈라진 매트는 즉시 교체" },
                      { id: "day-coach-prep",     label: "코치 워밍업·WOD(Workout of the Day) 준비", detail: "그룹 클래스 핵심 — 코치 사전 시연 + 부상 예방 동작 강조" },
                      { id: "day-noise",          label: "소음 측정·이웃 민원 사전 점검", detail: "크로스핏 소음 분쟁 빈번 — 매트·시간대 조절. 점심·저녁 피크 주의" },
                      { id: "day-aed",            label: "AED·구급함·외상 키트 점검", detail: "고강도 운동 — 부상 빈도 일반 헬스장보다 ↑" },
                    ],
                    "golf-studio": [
                      { id: "day-screen-cal",     label: "스크린·센서 캘리브레이션 (탄도·거리 정확도)", detail: "센서 오차 시 회원 신뢰 폭락. 1일 시작 전 1샷 테스트" },
                      { id: "day-mat-tee",        label: "타석 매트·티 마모 점검", detail: "타격감·부상 직결. 매트 교체 주기 6개월 ~ 1년" },
                      { id: "day-club-rental",    label: "대여 클럽·장갑 위생·정렬", detail: "땀 자국·체취 = 즉각 클레임. 매일 알코올 소독" },
                      { id: "day-projector",      label: "프로젝터·디스플레이 화질 확인", detail: "어두운 룸 → 프로젝터 핵심. 색감·초점 점검" },
                      { id: "day-booking",        label: "예약 시스템·시간 단위 룸 가동률 점검", detail: "스크린골프 = 시간당 단가 모델. 예약 누락 = 매출 직격" },
                    ],
                    "unmanned-fitness": [
                      { id: "day-cctv-record",    label: "CCTV 24시간 녹화·해상도 점검", detail: "무인 운영 핵심 — 사고·도난 대응. 클라우드 백업 확인" },
                      { id: "day-access-control", label: "키카드·QR·지문 출입 시스템 작동", detail: "비회원 무단 사용 방지. 미작동 시 매출 손실 + 보험 청구 어려움" },
                      { id: "day-equipment-remote",label: "원격 모니터링·기구 작동 점검", detail: "1일 1~2회 직접 방문 점검 + 원격 알림 시스템" },
                      { id: "day-aed",            label: "AED·구급함 + 비상 호출 버튼 작동", detail: "무인 = 응급 대응 늦음. 비상 호출 119 자동 연결 시스템 필수" },
                      { id: "day-cleanliness",    label: "기구·매트 위생 — 1일 1회 직접 청소", detail: "무인이라도 청결은 사장 책임. 회원 항의 1순위" },
                    ],

                    // ── 펫 ──
                    "pet-supplies": [
                      { id: "day-animal-health",  label: "매장 동물 건강 점검 (식욕·배변·활동)", detail: "전시 동물 매일 컨디션 체크 — 이상 시 즉시 동물병원" },
                      { id: "day-cage-clean",     label: "케이지·매트 위생 (배변 즉시 청소)", detail: "냄새·위생이 매장 인상 결정 — 청소 빈도 ↑" },
                      { id: "day-food-expiry",    label: "사료·간식 유효기간 점검", detail: "선입선출 + 유효기간 라벨. 만료 임박 할인 처리" },
                      { id: "day-vent-deodor",    label: "환기·탈취 시스템 작동 (냄새 1순위)", detail: "고객 재방문 결정 요인 1위 — 향기·환기 동시 관리" },
                      { id: "day-grooming-tool",  label: "그루밍 도구 소독 (블레이드·드라이어)", detail: "교차 감염 방지 — 블레이드 알코올·자외선 소독" },
                    ],
                    "pet-cafe": [
                      { id: "day-animal-health",  label: "거주 동물 컨디션 + 백신·수의사 기록 확인", detail: "펫카페 동물 건강이 매장 신뢰도 핵심" },
                      { id: "day-vent-deodor",    label: "환기·탈취 시스템 작동", detail: "냄새 = 펫카페 1순위 불만. 시간당 환기 횟수 점검" },
                      { id: "day-floor-clean",    label: "바닥·소파 청소 (배변·털)", detail: "고객 옷에 털 묻으면 클레임 — 청소 빈도 ↑" },
                      { id: "day-water-bowl",     label: "동물 식수·간식 잔량 점검", detail: "동물 탈수 방지 + 위생 — 1시간 단위 보충" },
                      { id: "day-customer-rules", label: "이용 규칙 안내 비치 확인", detail: "안 만지기·먹이 금지 등 — 사고 예방 표시" },
                    ],

                    // ── 교육 ──
                    "kids-academy": [
                      { id: "day-fire-equip",     label: "방염·소화기·비상등 작동 확인 (다중이용시설)", detail: "어린이 안전 = 학원 운영 절대 우선순위. 미달 시 영업 정지" },
                      { id: "day-instructor",     label: "강사 출근·수업 자료 준비 확인", detail: "강사 결근 = 학부모 신뢰 폭락. 백업 강사 사전 확보" },
                      { id: "day-student-list",   label: "출결·픽업 리스트 점검", detail: "어린이 픽업은 보호자 본인 확인 — 사고 예방" },
                      { id: "day-clean-toys",     label: "교구·책상·바닥 청소 (감염병 예방)", detail: "어린이 감염병 빠르게 확산 — 매일 알코올 소독" },
                      { id: "day-emergency",      label: "응급 연락망·구급상자 점검", detail: "응급 상황 시 즉시 학부모 연락 가능 상태" },
                    ],
                    "adult-class": [
                      { id: "day-tools-prep",     label: "수업 재료·도구 사전 세팅", detail: "성인 클래스 = 시간 효율 민감. 미리 세팅으로 수업 즉시 시작" },
                      { id: "day-instructor",     label: "강사 출근·수업 자료 점검", detail: "결강 = 환불 + 클레임. 사전 확정 + 백업 안내" },
                      { id: "day-booking",        label: "예약·결제 시스템 점검", detail: "취미 클래스 = 단가 ↓ 빈도 ↓ — 노쇼 시 손실 큼. 예치금 시스템" },
                      { id: "day-photo-spot",     label: "수업 결과물 포토존 점검", detail: "취미 클래스 = SNS 인증 기반 마케팅. 포토존 정돈" },
                      { id: "day-allergen",       label: "쿠킹·플라워 등 알레르기 안내", detail: "재료 알레르기 사전 확인 — 사고 예방" },
                    ],
                    "language-academy": [
                      { id: "day-instructor",     label: "원어민·내국인 강사 출근 확인", detail: "원어민 결강 시 환불 사유. 30분 전 확정 알림" },
                      { id: "day-equipment",      label: "프로젝터·이어폰·녹음 장비 작동", detail: "리스닝·스피킹 수업 핵심 장비 — 미작동 시 수업 진행 불가" },
                      { id: "day-textbook",       label: "교재·시험지·과제물 준비 확인", detail: "교재 누락 시 수업 직접 영향. 진도표 확인" },
                      { id: "day-fire-equip",     label: "방염·비상등·소화기 작동 (다중이용시설)", detail: "법적 의무 — 학원은 어른 대상이라도 안전 시설 필수" },
                      { id: "day-attendance",     label: "출결 시스템 + 학부모(미성년) 알림", detail: "성적 + 출결 = 재등록 결정. 자동 알림 시스템" },
                    ],
                    "coding-class": [
                      { id: "day-pc-test",        label: "전 PC·노트북 부팅·인터넷 작동 확인", detail: "코딩 수업 핵심 인프라. 1대 고장 = 1명 수업 못 함" },
                      { id: "day-software",       label: "필수 소프트웨어 설치·라이센스 확인", detail: "VS Code·Scratch·Python — 업데이트로 작동 안 할 때 多" },
                      { id: "day-curriculum",     label: "당일 커리큘럼·예제 코드 점검", detail: "강사 사전 테스트로 오류 방지 — 수업 중 디버깅 시 시간 손실" },
                      { id: "day-monitor",        label: "모니터·키보드·마우스 위생 알코올 소독", detail: "어린이 코딩 클래스 = 감염병 빠른 확산. 매일 소독" },
                      { id: "day-emergency",      label: "응급 연락망·픽업 리스트", detail: "어린이 대상이면 보호자 본인 확인 + 응급 연락" },
                    ],
                    "small-study-room": [
                      { id: "day-prep-mat",       label: "교재·과제·진도표 준비", detail: "1:1·소수 정예 = 개인 맞춤. 학생별 진도 카드 사전 준비" },
                      { id: "day-clean-desk",     label: "책상·의자 알코올 소독", detail: "공용 공부방 = 위생 민감. 매일 청소 필수" },
                      { id: "day-noise",          label: "주변 소음·이웃 민원 점검", detail: "주거 혼합 상권 공부방 = 소음 민원 빈번. 사전 양해" },
                      { id: "day-attendance",     label: "출결·학부모 알림 시스템", detail: "소규모 = 학부모 만족도 직격. 도착·귀가 자동 알림" },
                      { id: "day-fire-equip",     label: "비상등·소화기·환기 점검", detail: "다중이용시설 의무 — 작은 규모라도 안전 필수" },
                    ],
                    "study-room": [
                      { id: "day-cleanliness",    label: "스터디룸 청소 (책상·의자·화이트보드)", detail: "사용 시간 사이 청소 — 다음 고객 첫인상" },
                      { id: "day-equipment",      label: "프로젝터·전자칠판·HDMI 케이블 작동", detail: "장비 미작동 = 환불 사유. 매일 1회 작동 테스트" },
                      { id: "day-booking",        label: "예약 시스템·결제 점검", detail: "이중 예약 방지 — 시스템 동기화 확인" },
                      { id: "day-fire-equip",     label: "비상등·소화기 작동 확인", detail: "다중이용시설 의무" },
                    ],
                    "study-cafe-space": [
                      { id: "day-kiosk-remote",   label: "무인 키오스크·QR 출입 시스템 작동", detail: "스터디카페 매출 핵심 인프라 — 원격 점검" },
                      { id: "day-cctv-record",    label: "CCTV 24시간 녹화 + 저장 용량 확인", detail: "도난·기물 파손·소음 분쟁 대응" },
                      { id: "day-cleanliness",    label: "좌석·룸 청소 (1일 1~2회 직접 방문)", detail: "스터디카페 1순위 불만 — 청소가 재방문률 결정" },
                      { id: "day-beverage-stock", label: "음료 디스펜서·정수기 잔량 확인", detail: "셀프 음료가 차별점 — 떨어지면 컴플레인" },
                      { id: "day-fire-equip",     label: "비상등·소화기 작동 확인 (다중이용시설)", detail: "법적 의무. 무인 매장은 더욱 사전 점검 필수" },
                    ],

                    // ── 반려동물 (펫 추가) ──
                    "pet-grooming": [
                      { id: "day-blade-clean",    label: "그루밍 블레이드·이발기 알코올 소독 + 오일링", detail: "교차 감염 방지 + 블레이드 수명 연장. 매 시술 후 소독" },
                      { id: "day-bath-temp",      label: "목욕 워터 온도 30~35°C 유지", detail: "동물 화상 방지. 너무 차거나 뜨거우면 스트레스·피부 문제" },
                      { id: "day-dryer",          label: "강력 드라이어 + 환기 작동", detail: "K9-III 등 강풍 드라이어. 작동 점검 + 털 흩날림 환기" },
                      { id: "day-pet-info",       label: "예약 동물 건강 상태·백신 기록 확인", detail: "심장사상충·피부병 사전 확인 — 시술 중 사고 예방" },
                      { id: "day-stylist",        label: "그루머·미용사 출근·기술 수준 매칭", detail: "강아지 종별 미용 난이도 다름. 사전 배정 확인" },
                    ],
                    "pet-hotel": [
                      { id: "day-animal-checkin", label: "입실 동물 건강 상태·식이 기록 확인", detail: "백신 증명서·건강 상태 점검 — 다른 동물 감염 방지" },
                      { id: "day-room-clean",     label: "객실·매트·식기 매일 살균 청소", detail: "여러 동물 사용 → 위생이 신뢰 핵심. 펫호텔 별점 1순위" },
                      { id: "day-feeding",        label: "사료·간식 개별 보관·시간표 점검", detail: "고객별 사료 다름 — 잘못 급여 시 알레르기·소화 문제" },
                      { id: "day-walk-schedule",  label: "산책·놀이 시간표 (보호자 약속)", detail: "데이케어 계약 준수 — CCTV 보호자 공유로 신뢰 ↑" },
                      { id: "day-emergency-vet",  label: "응급 동물병원 연락처·이동 차량 확인", detail: "응급 시 골든타임. 24시간 동물병원 사전 등록" },
                    ],
                    "pet-training-school": [
                      { id: "day-trainer",        label: "트레이너 출근·교육 자료 준비", detail: "행동 교정 = 일관성 핵심. 트레이너별 교육 방식 통일" },
                      { id: "day-equipment",      label: "리드줄·하네스·간식 보상 점검", detail: "교육 도구 점검 — 망가진 리드줄 = 사고 위험" },
                      { id: "day-floor-safe",     label: "교육장 바닥 미끄럼·안전 점검", detail: "활동성 큰 강아지 — 미끄러운 바닥 시 부상" },
                      { id: "day-class-roster",   label: "클래스별 동물·견종·성향 매칭", detail: "공격성·소형 vs 대형 분리. 사고 예방" },
                      { id: "day-emergency-vet",  label: "응급 연락망·구급 키트", detail: "교육 중 사고 시 즉시 대응" },
                    ],
                    "pet-walking-visit": [
                      { id: "day-route",          label: "당일 방문·산책 루트·시간 확정", detail: "방문형 = 시간 약속 = 신뢰. 지도 사전 점검" },
                      { id: "day-key-access",     label: "고객 집 출입 키·도어락 정보 확인", detail: "키 분실 = 신뢰 폭락. 디지털 도어락 비밀번호 보안 관리" },
                      { id: "day-pet-info",       label: "동물별 식이·약·특이사항 메모", detail: "노령견 약 시간·알레르기·아토피 — 매번 재확인" },
                      { id: "day-photo-report",   label: "보호자에게 사진·영상 보고 준비", detail: "방문 인증 사진이 차별점 — 카카오톡 자동 전송" },
                      { id: "day-emergency",      label: "응급 동물병원·보호자 연락처 확인", detail: "이상 발견 시 즉시 보호자 + 수의사 동시 연락" },
                    ],

                    // ── 소매 ──
                    "convenience-small": [
                      { id: "day-stock-replenish", label: "주력 상품 재고 보충 (생수·라면·담배)", detail: "편의형 매장 = 결품 = 단골 즉시 이탈. 자동 발주 점검" },
                      { id: "day-expiry",          label: "유통기한 임박 상품 점검·할인 처리", detail: "유효기간 지난 식품 진열 = 식약처 적발 + 과태료" },
                      { id: "day-cigarette",       label: "담배·주류 진열·신분증 확인 매뉴얼", detail: "미성년자 판매 적발 시 영업 정지. 알람 시스템 점검" },
                      { id: "day-cctv-record",     label: "CCTV·도난 방지 게이트 작동", detail: "편의형 매장 도난 빈번 — 보안 시스템 점검" },
                      { id: "day-pos-speed",       label: "POS 결제 속도·바코드 스캐너 점검", detail: "회전율 매장 = 결제 속도가 핵심" },
                    ],
                    "lifestyle-goods": [
                      { id: "day-display-curate",  label: "큐레이션 디스플레이 정렬·신상품 푸시", detail: "라이프스타일 = 발견 경험. 매일 진열 변화 → 재방문 유도" },
                      { id: "day-photo-spot",      label: "포토존·인스타 구도 점검", detail: "SNS 공유가 매출 직결 — 조명·소품·태그 안내" },
                      { id: "day-stock-rotation",  label: "재고 회전·판매 부진 상품 위치 변경", detail: "회전 느린 재고 = 자금 묶임. 위치 변경으로 가시성 ↑" },
                      { id: "day-package",         label: "선물 포장재·리본 재고 확인", detail: "라이프스타일 = 선물 수요 多. 포장 부족 시 매출 손실" },
                      { id: "day-music-light",     label: "매장 음악·조명·향기 설정", detail: "라이프스타일 매장 = 분위기 = 체류 시간 = 객단가" },
                    ],
                    "beauty-supplies": [
                      { id: "day-tester",          label: "테스터 위생·재고 점검 (매일 알코올 소독)", detail: "테스터 위생 = 매장 신뢰. 더러운 테스터 = 즉각 별점 폭락" },
                      { id: "day-product-expiry",  label: "화장품 유효기간·개봉일 라벨 점검", detail: "유통기한 지난 제품 = 식약처·소비자보호원 신고 대상" },
                      { id: "day-staff-knowledge", label: "직원 신상품·성분 지식 브리핑", detail: "뷰티 매장 = 추천 능력 = 매출. 매일 신상 학습" },
                      { id: "day-stock-bestseller",label: "베스트셀러 재고 우선 확보", detail: "결품 1번이면 단골 즉시 다른 매장으로. 자동 발주 점검" },
                      { id: "day-display",         label: "조명·진열대 정렬 (화장품 색감 주의)", detail: "조명 색온도가 화장품 색감 좌우 — 5000K 주광색 권장" },
                    ],
                    "fashion-accessories": [
                      { id: "day-display-rotate",  label: "윈도 디스플레이·마네킹 정렬 변경", detail: "패션 매장 = 진열 변화가 발길. 주 1회 → 매일 마이너 변경" },
                      { id: "day-stock-trend",     label: "트렌드 상품·신상 진열 점검", detail: "트렌드 노후화 = 재고 자산 가치 ↓. 핫 시즌 신상품 즉시 진열" },
                      { id: "day-tag-price",       label: "가격표·할인 태그·POP 정확성 점검", detail: "가격 오류 = 클레임. 할인 종료 후 태그 즉시 교체" },
                      { id: "day-mirror",          label: "거울·피팅룸 청결·조명 점검", detail: "피팅룸 = 구매 결정 공간. 조명 어두우면 객단가 ↓" },
                      { id: "day-ig-content",      label: "인스타 OOTD·신상 콘텐츠 촬영", detail: "패션 = 인스타 = 유입. 매일 1게시물 권장" },
                    ],
                    "health-food-store": [
                      { id: "day-product-expiry",  label: "건강식품 유통기한·로트번호 점검", detail: "건강식품 = 신뢰. 유통기한 지난 제품 적발 시 영업 중단" },
                      { id: "day-temp-storage",    label: "냉장·실온 보관 기준 준수 점검", detail: "프로바이오틱스·콜드 압착 오일 = 냉장 필수. 변질 시 전량 폐기" },
                      { id: "day-staff-knowledge", label: "직원 제품 효능·성분·복용법 학습", detail: "건강식품 = 상담 매출. 잘못된 정보 = 식약처 신고 위험" },
                      { id: "day-allergen",        label: "알레르기·복용 주의사항 표시", detail: "견과·갑각류·임산부 주의 등 표시 의무. 미표시 시 사고 책임" },
                      { id: "day-cert-display",    label: "건강기능식품 인증 마크 게시", detail: "식약처 인증 마크 매장 노출 — 신뢰 ↑" },
                    ],
                    "unmanned-retail": [
                      { id: "day-cctv-record",     label: "CCTV 24시간 녹화·해상도 점검", detail: "무인 매장 도난 빈번 — 클라우드 백업 + 화질 확인" },
                      { id: "day-stock-restock",   label: "1일 1~2회 직접 방문 재고 보충", detail: "무인이라도 재고 보충은 사람. 인기 상품 우선" },
                      { id: "day-payment-kiosk",   label: "무인 키오스크·결제 시스템 작동", detail: "결제 오류 = 매출 0. 원격 모니터링 + 알림" },
                      { id: "day-cleanliness",     label: "매장 청결 (먼지·쓰레기·바닥)", detail: "무인 매장 청결 = 첫인상 = 재방문" },
                      { id: "day-anti-theft",      label: "도난 방지 게이트·전자 태그 작동", detail: "EAS 시스템 점검 — 도난율 직접 영향" },
                    ],

                    // ── 공간/숙박 ──
                    "rental-studio": [
                      { id: "day-prev-clean",      label: "이전 사용자 사용 후 청소·점검", detail: "예약 시간 사이 청소 + 분실물 확인. 다음 고객 첫인상" },
                      { id: "day-equipment",       label: "조명·배경지·삼각대·렌탈 장비 점검", detail: "촬영 스튜디오 = 장비 작동 = 환불 방지" },
                      { id: "day-booking",         label: "예약 시스템·시간 단위 가동률 확인", detail: "이중 예약 방지 — 시스템 동기화. 시간 단위 매출 모델" },
                      { id: "day-noise",           label: "주변 소음·이웃 민원 점검", detail: "주거 혼합 상권 스튜디오 = 민원 빈번. 시간대별 사용 규칙" },
                      { id: "day-fire-equip",      label: "비상등·소화기 작동 (다중이용시설)", detail: "법적 의무. 사진·영상 촬영 시 화재 위험 인지" },
                    ],
                    "party-room": [
                      { id: "day-prev-clean",      label: "이전 행사 후 청소·소독 (음식·음료 잔여물)", detail: "파티룸 = 청소가 거의 전부. 다음 고객 즉시 입실 가능 상태" },
                      { id: "day-equipment",       label: "스피커·노래방 기기·조명·에어컨 작동", detail: "파티 분위기 = 장비. 미작동 = 환불 + 별점 폭락" },
                      { id: "day-noise",           label: "방음·소음 측정·이웃 민원 사전 양해", detail: "파티룸 1순위 리스크. 시간대 제한·소음 게이지 설치" },
                      { id: "day-amenity",         label: "일회용 컵·접시·종이타올 재고", detail: "파티 = 일회용품 폭증. 부족 시 즉각 클레임" },
                      { id: "day-fire-equip",      label: "비상등·소화기·환기 작동 (다중이용시설)", detail: "법적 의무. 음주·불꽃 사용 가능성 — 소방 점검" },
                    ],
                    "shared-office": [
                      { id: "day-internet",        label: "Wi-Fi·인터넷·복합기 작동", detail: "공유오피스 = 인프라. 다운 시 회원 즉시 환불·해지" },
                      { id: "day-meeting-room",    label: "회의실 예약 시스템·장비(빔·HDMI) 점검", detail: "회의실 = 추가 매출원. 예약 충돌·장비 오류 = 클레임" },
                      { id: "day-cleanliness",     label: "공용 공간(주방·라운지·화장실) 청소", detail: "회원 만족도 결정 — 청소 빈도 = 재계약률" },
                      { id: "day-coffee-snack",    label: "커피·간식·생수 재고 확인", detail: "공유오피스 어메니티 — 떨어지면 즉각 불만" },
                      { id: "day-access-control",  label: "출입 통제(키카드·QR) 작동 확인", detail: "비회원 무단 출입 방지 + 보안" },
                    ],
                    "practice-room": [
                      { id: "day-equipment",       label: "악기·앰프·스피커·마이크 작동 점검", detail: "연습실 = 장비. 미작동 = 환불. 매일 1회 모든 룸 테스트" },
                      { id: "day-soundproof",      label: "방음·이웃 민원 점검", detail: "연주 소음 = 민원 빈번. 방음재 마감 점검" },
                      { id: "day-cleanliness",     label: "룸 청소·악기 알코올 소독 (입·손 접촉)", detail: "관악기·마이크 = 침 묻음. 매 회 소독 = 위생 핵심" },
                      { id: "day-booking",         label: "예약 시스템·시간 단위 가동률 점검", detail: "시간당 단가 모델 — 예약 누락 = 매출 직격" },
                      { id: "day-fire-equip",      label: "비상등·소화기 작동 (다중이용시설)", detail: "법적 의무. 전기 장비 多 → 화재 점검 필수" },
                    ],

                    // ── 생활서비스 ──
                    "self-laundry": [
                      { id: "day-machine-test",   label: "전 세탁기·건조기 작동 점검", detail: "세탁기 1대 고장 = 매출 즉시 손실. 1일 1회 작동 테스트" },
                      { id: "day-detergent",      label: "세제·유연제 자동 공급 잔량", detail: "셀프 세탁 핵심 — 떨어지면 즉시 컴플레인" },
                      { id: "day-cctv-record",    label: "CCTV 녹화 + 도난 방지 점검", detail: "무인 매장 보안 핵심" },
                      { id: "day-cleanliness",    label: "매장 청결 (먼지·세제 가루)", detail: "건조기 먼지 화재 위험 — 필터 청소 1일 1회" },
                      { id: "day-payment",        label: "무인 결제 키오스크·QR 작동", detail: "결제 미작동 = 매출 0" },
                    ],
                    "laundry-service": [
                      { id: "day-receive-list",    label: "당일 접수·픽업·배송 일정 확인", detail: "세탁편의점 = 시간 약속. 늦으면 신뢰 직격" },
                      { id: "day-tag-system",      label: "고객 태그·라벨 누락 점검", detail: "세탁물 분실 = 무한 책임. 태그 시스템 점검" },
                      { id: "day-stain-record",    label: "특수 얼룩·소재 사전 기록", detail: "사전 안내로 책임 분담 — 사고 방지" },
                      { id: "day-equipment",       label: "다림기·드라이클리닝 머신 작동", detail: "기기 고장 = 마감 지연 = 클레임. 매일 점검" },
                      { id: "day-pickup-route",    label: "수거·배송 라이더 동선·시간", detail: "동네 세탁 = 픽업 정시성 = 단골 유지" },
                    ],
                    "cleaning-service": [
                      { id: "day-staff-schedule",  label: "청소 인력 배정·스케줄 확인", detail: "방문 시간 = 신뢰. 인력 배정 사전 확정" },
                      { id: "day-supply-stock",    label: "청소 도구·세제 재고 확인 (차량별)", detail: "현장 도착 후 도구 부족 = 시간 낭비. 차량별 점검" },
                      { id: "day-customer-info",   label: "고객 집·사무실 특이사항 사전 학습", detail: "반려동물·알레르기·귀중품 위치 — 사고 방지" },
                      { id: "day-photo-report",    label: "Before/After 사진 보고 시스템", detail: "방문형 청소 = 사진 = 재계약. 자동 카톡 전송" },
                      { id: "day-emergency",       label: "고객 응대 매뉴얼·민원 대응 핫라인", detail: "현장 분쟁 시 즉시 본부 연결 — 1차 대응 매뉴얼" },
                    ],
                    "repair-service": [
                      { id: "day-parts-stock",     label: "주요 부품·소모품 재고 확인", detail: "수리 = 부품. 결품 시 고객 대기 → 클레임" },
                      { id: "day-tool-check",      label: "공구·측정 기기 작동 점검", detail: "전동 공구·테스터 — 미작동 시 수리 불가" },
                      { id: "day-quote-record",    label: "견적서·수리 이력 디지털화", detail: "수리 분쟁 시 증거. 사진 + 견적서 자동 저장" },
                      { id: "day-warranty",        label: "보증 기간·반품 정책 명시", detail: "수리 후 재발 시 무한 책임 방지. 보증 조건 사전 명시" },
                      { id: "day-safety",          label: "전기·가스 안전 점검 (작업 위험성)", detail: "수리 작업 화재·감전 위험 — 보호 장비 + 보험 점검" },
                    ],
                    "print-copy": [
                      { id: "day-toner",           label: "토너·잉크·용지 재고 확인 (피크 1.5배)", detail: "시험 시즌·과제 시즌 = 결품 시 매출 직격. 사전 보충" },
                      { id: "day-machine-test",   label: "복합기·코팅·제본 기계 작동 테스트", detail: "고장 = 매출 0. 매일 시험 출력으로 점검" },
                      { id: "day-file-format",     label: "파일 호환성·USB 보안 점검", detail: "다양한 포맷 지원 + 바이러스 차단 — 고객 USB 감염 사고 방지" },
                      { id: "day-package-stock",   label: "택배·문서 발송 박스·테이프 재고", detail: "택배 결합 매장 — 박스 부족 시 즉각 매출 손실" },
                      { id: "day-payment",         label: "POS·간편결제·계좌이체 작동", detail: "학생·직장인 = 빠른 결제 요구. 미작동 시 이탈" },
                    ],
                    "device-repair": [
                      { id: "day-parts-stock",     label: "iPhone·갤럭시 액정·배터리 재고 확인", detail: "휴대폰 수리 = 부품 ROM. 인기 모델 사전 보유" },
                      { id: "day-tool-precision",  label: "정밀 공구·열풍기·현미경 작동 점검", detail: "정밀 수리 도구 — 1일 1회 점검. 마모 시 수리 정확도 ↓" },
                      { id: "day-data-backup",     label: "고객 기기 데이터 백업·동의서 점검", detail: "수리 중 데이터 손실 = 분쟁. 사전 동의서 + 백업 절차" },
                      { id: "day-warranty",        label: "수리 보증 조건·반품 정책 명시", detail: "보증 분쟁 빈번 — 보증 기간·범위 사전 안내" },
                      { id: "day-cctv",            label: "수리 CCTV 녹화·작업 영상 보관", detail: "분실·고장 분쟁 시 증거. 작업 카메라 점검" },
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

                  // ─────────────────────────────────────────────────────────────
                  // 운영 형태별 추가 점검 (프랜차이즈 vs 개인)
                  // ─────────────────────────────────────────────────────────────
                  const franchiseExtraChecks = [
                    { id: "day-hq-erp-sync",    label: "본사 ERP·POS 매출 자동 동기화 확인", detail: "프랜차이즈 ERP는 매출·재고·발주를 본사 시스템에 자동 보고. 동기화 실패 시 본사 점검 시야 사라짐" },
                    { id: "day-hq-order",       label: "본사 발주 시스템 자동 발주 트리거 점검", detail: "재고 임계치 도달 시 자동 발주. 트리거 실패 시 익일 운영 차질 — 수기 확인 백업" },
                    { id: "day-hq-brand-std",   label: "본사 브랜드 표준 준수 점검", detail: "브랜드 컵·간판·매장 음악·유니폼 — 본사 Quality Audit 대비. 위반 시 시정 명령" },
                    { id: "day-hq-recipe",      label: "본사 표준 레시피 준수 (그램·시간 표준)", detail: "프랜차이즈 핵심 — 매장 간 일관성. 레시피 표 비치·확인" },
                  ];

                  const independentExtraChecks = [
                    { id: "day-self-log",       label: "매출·고객 일지 직접 기록", detail: "프랜차이즈 ERP 없으니 사장님이 직접 — 캐시노트·수기. 데이터 누적이 운영 개선의 시작" },
                    { id: "day-regular-crm",    label: "단골 고객 이름·취향 기록 (셀프 CRM)", detail: "개인 매장의 무기 — 단골 1명 = 고정 매출. 노트·앱 활용해 매일 정리" },
                    { id: "day-competitor",     label: "주변 경쟁점 동향 점검 (메뉴·가격·이벤트)", detail: "본사 마케팅 없으니 사장님이 직접 시장 모니터링. 주 1회 → 일 1회 빠른 반응" },
                    { id: "day-owner-rest",     label: "사장님 본인 휴식·식사 시간 확보", detail: "번아웃이 개인 매장 폐점 1순위 원인. 30분 식사 + 짧은 휴식 의식적으로 확보" },
                  ];

                  // ─── Sub-industry > category fallback ───
                  const subData = selectedIndustryId ? subIndustryDayChecks[selectedIndustryId] : undefined;
                  const extraDayChecks = subData ?? industryDayChecks[industryCategoryId] ?? [];
                  const ownershipExtras = startupType === "franchise" ? franchiseExtraChecks
                    : startupType === "independent" ? independentExtraChecks
                    : [];
                  const allDayChecks = [...extraDayChecks, ...universalDayChecks, ...ownershipExtras];
                  const usingSubIndustry = !!subData;
                  const ownershipLabel = startupType === "franchise" ? "프랜차이즈"
                    : startupType === "independent" ? "개인 운영"
                    : null;

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

                          {/* AI 피드백 폼 생성기 — sub-industry·운영형태 맞춤 질문지 자동 설계 */}
                          <AIFeedbackFormGenerator
                            language={language}
                            industryCategoryId={industryCategoryId}
                            selectedIndustryId={selectedIndustryId}
                            startupType={startupType}
                            storeName={storeName}
                          />

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
                        const preItems  = [...extraDayChecks, universalDayChecks[0], universalDayChecks[1], universalDayChecks[2], universalDayChecks[3]];
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* ── Sub-industry / 운영 형태 맞춤 배지 ── */}
                            {(usingSubIndustry || ownershipLabel) && (
                              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginBottom: "-4px" }}>
                                {usingSubIndustry && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "#fff", background: MIDNIGHT, padding: "4px 10px", borderRadius: "999px", letterSpacing: "-0.01em", boxShadow: "0 1px 3px rgba(25,25,112,0.25)" }}>
                                    ✓ {language === "ko" ? "업종 맞춤 (정밀)" : "Sub-industry (precise)"}
                                  </span>
                                )}
                                {ownershipLabel && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: MIDNIGHT, background: "rgba(25,25,112,0.1)", padding: "4px 10px", borderRadius: "999px", letterSpacing: "-0.01em", border: "1px solid rgba(25,25,112,0.18)" }}>
                                    {language === "ko" ? `운영 형태: ${ownershipLabel}` : `Ownership: ${ownershipLabel}`}
                                  </span>
                                )}
                              </div>
                            )}

                            {renderSection("오픈 전 준비", preItems, MIDNIGHT)}
                            {renderSection("운영 중 관찰", [universalDayChecks[4], universalDayChecks[5]], "rgb(255,149,0)")}
                            {renderSection("마감 후 정리", [universalDayChecks[6], universalDayChecks[7], universalDayChecks[8], universalDayChecks[9]], "rgb(52,199,89)")}

                            {/* 운영 형태 추가 점검 — 프랜차이즈 vs 개인 */}
                            {ownershipExtras.length > 0 && renderSection(
                              startupType === "franchise" ? "본사 연계 점검 (프랜차이즈 전용)" : "사장님 셀프 점검 (개인 매장 전용)",
                              ownershipExtras,
                              MIDNIGHT
                            )}
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
