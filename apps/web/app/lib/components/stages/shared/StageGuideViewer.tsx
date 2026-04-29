"use client";

import React from "react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import type { LucideIcon } from "lucide-react";
import {
  Cpu, Package, Coffee, Droplets, Waves, Leaf, Flame, Layers,
  Sparkles, Zap, Scissors, Shield, Dumbbell, Heart, Box, BookOpen,
  AlignLeft, Sprout, Star, Store, Monitor, RefreshCw, PanelLeft, Home, Wine,
} from "lucide-react";
import { VENDOR_URL_MAP } from "../../../constants";

export function StageGuideViewer() {
  const {
    language,
    currentStage,
    stageGuideContent,
    guideStepIndex, setGuideStepIndex,
    guideSelections, setGuideSelections,
    vendorSelections, setVendorSelections,
    vendorCustomInputs, setVendorCustomInputs,
    opsSelections, setOpsSelections,
    opsPosChecks, setOpsPosChecks,
    industryCategoryId,
    selectedIndustryId,
    isDigitalCategory,
    businessCtx,
  } = useDashboardCtx();

  if (!stageGuideContent) return null;

  const steps = stageGuideContent.steps;
  const totalSlides = 1 + steps.length;
  const isOverview = guideStepIndex === 0;
  const currentStep = isOverview ? null : steps[guideStepIndex - 1];

  const vendorEl: React.ReactNode = currentStage.code !== "vendor_setup" || guideStepIndex === 0 ? null : (() => {
    type SupplierItem = { name: string; desc: string; tier: "premium" | "standard" | "budget" };
    type SupplyCategory = { icon: LucideIcon; label: string; items: SupplierItem[] };
    const step3Supplies: SupplyCategory[] = [
      { icon: Cpu, label: language === "ko" ? "세금계산서·경비 관리 도구" : "Invoice & Expense Tools", items: [
        { name: "홈택스(Hometax)", desc: "국세청 공식 전자 세금계산서 발행 · 무료", tier: "budget" },
        { name: "비즈플레이(Bizplay)", desc: "세금계산서 + 경비·카드 지출 통합 관리", tier: "standard" },
        { name: "캐시노트(CashNote)", desc: "소상공인 매출·경비 자동 분류 무료 앱", tier: "budget" },
      ]},
    ];
    const step4Supplies: SupplyCategory[] = [
      { icon: Package, label: language === "ko" ? "B2B 발주 플랫폼" : "B2B Order Platforms", items: [
        { name: "마켓컬리 비즈(Kurly Biz)", desc: "식품·소모품 새벽배송 B2B · 소규모 최적", tier: "standard" },
        { name: "쿠팡 비즈니스", desc: "다품목 발주·로켓배송 · 최저가 비교 가능", tier: "standard" },
        { name: "aT 한국농수산식품유통공사", desc: "공공 식품 원자재 B2B 조달 포털", tier: "standard" },
      ]},
    ];
    const stepDataMap: Record<string, { [step: number]: SupplyCategory[] }> = {
      "cafe-dessert": {
        1: [
          { icon: Coffee, label: language === "ko" ? "원두 공급처" : "Coffee Beans",
            items: [
              { name: "커피빈코리아 B2B", desc: "납품 점유율 국내 1위 · 에스프레소·드립 통합 공급", tier: "standard" },
              { name: "빈브라더스", desc: "스페셜티 원두 전문 · 서울 트렌디 카페 선호", tier: "premium" },
              { name: "테라로사", desc: "스페셜티 선구자 · 대용량 B2B · 프리미엄 포지셔닝", tier: "premium" },
            ],
          },
          { icon: Droplets, label: language === "ko" ? "시럽·소스" : "Syrups & Sauces",
            items: [
              { name: "모닌(Monin)", desc: "150종+ SKU · 전 세계 카페 기준 시럽", tier: "standard" },
              { name: "1883 루아(Routin)", desc: "프랑스산 고급 시럽 · 고가 카페 포지셔닝", tier: "premium" },
              { name: "토라니(Torani)", desc: "가성비 최고 · 대중 시럽 시장 강세", tier: "budget" },
            ],
          },
          { icon: Waves, label: language === "ko" ? "유제품·대체유" : "Dairy & Alternatives",
            items: [
              { name: "서울우유 업소용", desc: "국내 점유율 1위 · 안정적 납품 · 월납 계좌이체", tier: "standard" },
              { name: "매일유업 바리스타", desc: "스팀 발포 최적화 전용 우유", tier: "standard" },
              { name: "오틀리(Oatly)", desc: "대체유 국내 1위 · 비건 수요 필수 대응", tier: "standard" },
            ],
          },
        ],
        2: [
          { icon: Package, label: language === "ko" ? "포장재" : "Packaging",
            items: [
              { name: "하나팩", desc: "종이컵·테이크아웃박스 국내 최대 유통", tier: "standard" },
              { name: "현진팩", desc: "친환경 FSC 포장재 전문 · 2025 트렌드 대응", tier: "standard" },
              { name: "페이퍼갱", desc: "개성 있는 포장 디자인 · 소량 주문 가능", tier: "standard" },
            ],
          },
          { icon: Droplets, label: language === "ko" ? "위생·청소 소모품" : "Hygiene & Cleaning",
            items: [
              { name: "아성다이소 기업구매", desc: "위생 소모품 최저가 · 오프라인·온라인 통합", tier: "budget" },
              { name: "유한킴벌리 B2B", desc: "키친타올·위생장갑 업소용 대용량 공급", tier: "standard" },
              { name: "3M 업소용", desc: "수세미·청소용품 전문 · 내구성 업계 최고", tier: "standard" },
            ],
          },
        ],
      },
      "food": {
        1: [
          { icon: Leaf, label: language === "ko" ? "신선 식재료" : "Fresh Ingredients",
            items: [
              { name: "CJ프레시웨이", desc: "식자재 유통 국내 1위 · 중소 음식점 B2B 가능", tier: "standard" },
              { name: "마켓컬리 비즈", desc: "소규모 식당 최적 · 새벽배송 · 신선도 최고", tier: "standard" },
              { name: "아워홈 식자재", desc: "전국 물류망 · 냉동·냉장 통합 공급", tier: "standard" },
            ],
          },
          { icon: Flame, label: language === "ko" ? "양념·소스" : "Seasonings & Sauces",
            items: [
              { name: "대상 청정원 업소용", desc: "소스 국내 1위 · B2B 전용 대용량 라인", tier: "standard" },
              { name: "샘표 기업용", desc: "간장·된장 원조 · 전통 발효 소스 라인업", tier: "standard" },
              { name: "오뚜기 업소용", desc: "마요네즈·케첩·드레싱 압도적 점유율", tier: "budget" },
            ],
          },
          { icon: Layers, label: language === "ko" ? "건식재료·곡물" : "Dry Goods & Grains",
            items: [
              { name: "대한제분(곰표)", desc: "대용량 밀가루 · 전국 배송 · B2B 전용 포장", tier: "budget" },
              { name: "농협 직거래", desc: "산지 직납 프리미엄 쌀·잡곡 · 이천·진상 등", tier: "standard" },
              { name: "CJ제일제당 B2B", desc: "설탕·전분·쌀가루 등 건식 소재 통합 소싱", tier: "standard" },
            ],
          },
        ],
        2: [
          { icon: Package, label: language === "ko" ? "배달 포장재" : "Delivery Packaging",
            items: [
              { name: "하나팩", desc: "배달 용기·봉투 국내 최대 유통", tier: "standard" },
              { name: "원팩(Wonpak)", desc: "1회용 용기·포장 전문 · 배달 전용 라인 강점", tier: "standard" },
              { name: "현진팩", desc: "친환경 배달 포장재 · 소량 주문 가능", tier: "standard" },
            ],
          },
          { icon: Shield, label: language === "ko" ? "주방 위생 소모품" : "Kitchen Hygiene",
            items: [
              { name: "유한킴벌리 B2B", desc: "행주·장갑·주방 위생 업소용 대용량", tier: "standard" },
              { name: "아성다이소 기업구매", desc: "소모품 비용 최적화 · 다양한 품목 일괄 조달", tier: "budget" },
              { name: "유한양행 업소용", desc: "주방 세정·살균 전문 · HACCP 대응 가능", tier: "standard" },
            ],
          },
        ],
      },
      "beauty": {
        1: [
          { icon: Sparkles, label: language === "ko" ? "헤어 시술 약품" : "Hair Treatment Products",
            items: [
              { name: "아모레퍼시픽 프로(에이모스)", desc: "미용실 납품 국내 1위 · A/S·교육 지원 최대", tier: "standard" },
              { name: "로레알 프로(케라스타즈·레드켄)", desc: "글로벌 헤어 1위 · 프리미엄 포지셔닝 필수", tier: "premium" },
              { name: "웰라 코리아(Wella)", desc: "컬러 약품 글로벌 1위 · 중고가 균형 제품군", tier: "standard" },
            ],
          },
          { icon: Zap, label: language === "ko" ? "전문 도구·기기" : "Professional Tools",
            items: [
              { name: "파나소닉 업소용", desc: "드라이어 국내 점유율 1위 · 긴 A/S 보증", tier: "standard" },
              { name: "다이슨 프로(Dyson Pro)", desc: "2025 트렌드 선두 · SNS 노출 효과 탁월", tier: "premium" },
              { name: "GHD 코리아", desc: "아이론·드라이어 프리미엄 전문 · 살롱 브랜딩 강화", tier: "premium" },
            ],
          },
        ],
        2: [
          { icon: Scissors, label: language === "ko" ? "소모품·부자재" : "Consumables & Supplies",
            items: [
              { name: "지에이치 전문부자재", desc: "국내 미용 소모품 최대 유통 · 알파미 계열", tier: "budget" },
              { name: "리갈(Regal)", desc: "케이프·포일·장갑 전문 · 대량 구매 할인", tier: "budget" },
              { name: "코스모프로페셔널", desc: "미용 소모품 B2B 플랫폼 · 통합 관리", tier: "standard" },
            ],
          },
          { icon: Shield, label: language === "ko" ? "위생·살균 소모품" : "Hygiene & Sterilization",
            items: [
              { name: "유한킴벌리 업소용", desc: "타올·위생 소모품 업소 대용량 · 정기배송", tier: "standard" },
              { name: "보령헬스케어", desc: "미용업 전용 소독제·살균제 · 피부과 수준 제품", tier: "premium" },
              { name: "아성다이소 기업구매", desc: "소독 소모품 최저가 · 다품목 일괄 조달", tier: "budget" },
            ],
          },
        ],
      },
      "fitness": {
        1: [
          { icon: Dumbbell, label: language === "ko" ? "운동 장비" : "Exercise Equipment",
            items: [
              { name: "라이프피트니스(Life Fitness)", desc: "글로벌 1위 · 국내 대형 헬스장 표준 브랜드", tier: "premium" },
              { name: "테크노짐(Technogym)", desc: "이탈리아 명품 장비 · 강남 프리미엄 PT샵 선호", tier: "premium" },
              { name: "오딘피트니스", desc: "국내 가성비 1위 · 소규모 헬스장·스튜디오 최적", tier: "budget" },
            ],
          },
          { icon: Heart, label: language === "ko" ? "스튜디오 소도구" : "Studio Equipment",
            items: [
              { name: "발렉스(Valeo)", desc: "요가·필라테스 소도구 글로벌 표준 브랜드", tier: "standard" },
              { name: "리복 프로(Reebok Pro)", desc: "스튜디오 전용 소도구 전문 라인", tier: "standard" },
              { name: "하펜 스포츠", desc: "국내 필라테스 기구 전문 유통", tier: "budget" },
            ],
          },
        ],
        2: [
          { icon: Box, label: language === "ko" ? "운영 소모품" : "Operations & Consumables",
            items: [
              { name: "케이진 스포츠", desc: "타월·운동 소모품 B2B 전문", tier: "budget" },
              { name: "유한킴벌리 업소용", desc: "타올·위생 소모품 업소 대용량 · 정기배송", tier: "standard" },
              { name: "마이단백질(MyProtein) B2B", desc: "보충제 리셀 아이템 · 추가 수익원 확보", tier: "standard" },
            ],
          },
          { icon: Shield, label: language === "ko" ? "위생·청소 용품" : "Hygiene & Cleaning",
            items: [
              { name: "3M 업소용", desc: "소독·청소용품 전문 · 내구성 업계 최고", tier: "standard" },
              { name: "쿠팡 비즈", desc: "소독·위생 소모품 최저가 통합", tier: "budget" },
              { name: "아성다이소 기업구매", desc: "소모품 비용 최적화 · 다양한 품목 일괄 조달", tier: "budget" },
            ],
          },
        ],
      },
      "education": {
        1: [
          { icon: BookOpen, label: language === "ko" ? "교재·학습 자료" : "Textbooks & Materials",
            items: [
              { name: "천재교육 B2B", desc: "국내 최대 교재 출판 · 학원 직납 서비스", tier: "standard" },
              { name: "비상교육", desc: "교과서·문제집 전문 · 강사용 교재 직납 가능", tier: "standard" },
              { name: "메가스터디 교육", desc: "온·오프라인 연계 학습 자료 · 프리미엄 라인", tier: "premium" },
            ],
          },
          { icon: Home, label: language === "ko" ? "학원 집기·가구" : "Furniture & Fixtures",
            items: [
              { name: "퍼시스(Persis)", desc: "학원 가구 국내 1위 · 학생 의자·책상 전문", tier: "premium" },
              { name: "리바트(Livart) 에듀", desc: "아동·청소년 전용 가구 · 안전 인증 우수", tier: "standard" },
              { name: "코아스(Koas)", desc: "가성비 학원 집기 · 빠른 납품 가능", tier: "budget" },
            ],
          },
        ],
        2: [
          { icon: AlignLeft, label: language === "ko" ? "문구·소모품" : "Stationery & Supplies",
            items: [
              { name: "모나미 B2B", desc: "국내 문구 1위 · 대량 주문·배송 가능", tier: "budget" },
              { name: "교보문고 교육자료", desc: "부교재·참고서 도매 공급 · 전국 배송", tier: "standard" },
              { name: "아성다이소 기업구매", desc: "소모품 비용 최적화 · 품목 다양성 최고", tier: "budget" },
            ],
          },
          { icon: Shield, label: language === "ko" ? "위생·청소 소모품" : "Hygiene & Cleaning",
            items: [
              { name: "유한킴벌리 B2B", desc: "키친타올·위생장갑 업소용 대용량 공급", tier: "standard" },
              { name: "3M 업소용", desc: "청소용품 전문 · 오래 사용해도 안전한 소재", tier: "standard" },
              { name: "쿠팡 비즈", desc: "위생 소모품 최저가 · 당일 배송 가능", tier: "budget" },
            ],
          },
        ],
      },
      "pet": {
        1: [
          { icon: Sprout, label: language === "ko" ? "사료·간식" : "Pet Food & Treats",
            items: [
              { name: "로얄캐닌(Royal Canin) B2B", desc: "수의사 추천 1위 · 프리미엄 브랜드 신뢰도 최고", tier: "premium" },
              { name: "힐스(Hill's) 코리아", desc: "처방식·기능식 전문 · 의료 라인 포지셔닝", tier: "premium" },
              { name: "퓨리나(Purina) B2B", desc: "대중 점유율 1위 · 가성비 통합 제품군", tier: "standard" },
            ],
          },
          { icon: Scissors, label: language === "ko" ? "그루밍 제품" : "Grooming Products",
            items: [
              { name: "크리스탈 펫", desc: "국내 그루밍 제품 1위 유통 · B2B 전용 라인", tier: "standard" },
              { name: "바이오그룸(Biogroom)", desc: "미국산 살롱 전용 그루밍 · 프리미엄 포지셔닝", tier: "premium" },
              { name: "아이러브펫", desc: "가성비 그루밍 소모품 · 소량·대량 모두 가능", tier: "budget" },
            ],
          },
        ],
        2: [
          { icon: Star, label: language === "ko" ? "펫 용품" : "Pet Supplies",
            items: [
              { name: "리치펫(Richpet)", desc: "국내 펫 용품 종합 1위 · 다품목 B2B", tier: "standard" },
              { name: "슈가버블", desc: "프리미엄 펫 케어 · 감성 소비층 타겟", tier: "premium" },
              { name: "쿠팡 펫 비즈", desc: "소모품 최저가 통합 조달 · 빠른 배송", tier: "budget" },
            ],
          },
          { icon: Shield, label: language === "ko" ? "위생·소독 소모품" : "Hygiene & Disinfection",
            items: [
              { name: "비오킬(Biokil) 코리아", desc: "펫 전용 살균·소독제 · 안전 성분 인증", tier: "standard" },
              { name: "아성다이소 기업구매", desc: "펫 위생 소모품 최저가 일괄 조달", tier: "budget" },
              { name: "그린톤(Greenton)", desc: "천연 원료 펫 위생 용품 · 알레르기 대응", tier: "premium" },
            ],
          },
        ],
      },
      "retail": {
        1: [
          { icon: Store, label: language === "ko" ? "상품 소싱" : "Merchandise Sourcing",
            items: [
              { name: "온채널(OnChannel)", desc: "국내 최대 도매 B2B 플랫폼 · 품목 최다", tier: "standard" },
              { name: "동대문 패션타운", desc: "의류·잡화 최대 소싱처 · 직납 협상 가능", tier: "budget" },
              { name: "무역협회(KITA) B2B", desc: "해외 직수입 연결 · 원산지 다변화", tier: "standard" },
            ],
          },
          { icon: Monitor, label: language === "ko" ? "POS·결제 시스템" : "POS & Payments",
            items: [
              { name: "KIS정보통신", desc: "POS 국내 1위 · 카드 단말·포스 통합", tier: "standard" },
              { name: "토스페이먼츠", desc: "간편결제 최신 솔루션 · 수수료 낮고 연동 쉬움", tier: "standard" },
              { name: "스마트로(Smartro)", desc: "소형 매장 특화 POS · 간단한 설치", tier: "budget" },
            ],
          },
        ],
        2: [
          { icon: Package, label: language === "ko" ? "포장재" : "Packaging",
            items: [
              { name: "하나팩", desc: "쇼핑백·포장박스 국내 최대 · 인쇄 주문 가능", tier: "standard" },
              { name: "한국포장(KPK)", desc: "브랜딩 포장재 전문 · 커스텀 인쇄 특화", tier: "premium" },
              { name: "페이퍼갱", desc: "친환경 포장 전문 · 소량 커스텀 주문 가능", tier: "standard" },
            ],
          },
          { icon: Layers, label: language === "ko" ? "영수증·POS 소모품" : "Receipt & POS Supplies",
            items: [
              { name: "KIS정보통신 소모품", desc: "영수증 용지·POS 소모품 공식 공급", tier: "standard" },
              { name: "아성다이소 기업구매", desc: "사무 소모품 최저가 · 다양한 품목", tier: "budget" },
              { name: "쿠팡 비즈", desc: "POS·영수증·쇼핑백 소모품 통합 조달", tier: "budget" },
            ],
          },
        ],
      },
      "living-service": {
        1: [
          { icon: RefreshCw, label: language === "ko" ? "세탁 기기" : "Laundry Equipment",
            items: [
              { name: "LG전자 클로이 B2B", desc: "업소용 세탁기 국내 1위 · A/S 전국 망", tier: "premium" },
              { name: "삼성전자 업소용", desc: "드럼세탁기 안정적 공급 · A/S 우수", tier: "standard" },
              { name: "일렉트로룩스(Electrolux)", desc: "유럽 업소용 세탁 브랜드 · 내구성 탁월", tier: "standard" },
            ],
          },
          { icon: Droplets, label: language === "ko" ? "세제·소모품" : "Detergents & Supplies",
            items: [
              { name: "P&G 업소용(타이드·다우니)", desc: "글로벌 세탁 브랜드 1위 · 대용량 공급", tier: "standard" },
              { name: "애경 B2B(퍼실)", desc: "국내 2위 · 대용량 경쟁력 있는 가격", tier: "budget" },
              { name: "에코버(Ecover) 코리아", desc: "친환경 세제 · 프리미엄 서비스 포지셔닝", tier: "premium" },
            ],
          },
        ],
        2: [
          { icon: Package, label: language === "ko" ? "포장재 (세탁물 보호)" : "Laundry Packaging",
            items: [
              { name: "삼성포장", desc: "세탁 비닐백·옷걸이 업소용 최대 공급", tier: "standard" },
              { name: "아성다이소 기업구매", desc: "세탁 소모품 최저가 일괄 조달", tier: "budget" },
              { name: "쿠팡 비즈", desc: "비닐봉지·옷걸이·비닐커버 최저가 통합 배송", tier: "budget" },
            ],
          },
          { icon: Cpu, label: language === "ko" ? "운영·결제 시스템" : "Operations & POS",
            items: [
              { name: "KIS정보통신 POS", desc: "국내 POS 1위 · 매출·재고 통합 관리", tier: "standard" },
              { name: "워드빌(Wordville)", desc: "세탁물 관리 전용 솔루션 · 업종 특화", tier: "standard" },
              { name: "나이스페이(Nicepay)", desc: "모바일·키오스크 결제 연동 솔루션", tier: "standard" },
            ],
          },
        ],
      },
      "space": {
        1: [
          { icon: PanelLeft, label: language === "ko" ? "좌석 집기·가구" : "Seating & Furniture",
            items: [
              { name: "퍼시스(Persis)", desc: "독서실 책상 전문 국내 1위 · 맞춤 제작 가능", tier: "premium" },
              { name: "시디즈(Sidiz)", desc: "인체공학 의자 전문 · 장시간 착석 최적화", tier: "standard" },
              { name: "코아스(Koas)", desc: "가성비 독서실·사무 가구 · 빠른 납품", tier: "budget" },
            ],
          },
          { icon: Monitor, label: language === "ko" ? "운영·입장 시스템" : "Operations System",
            items: [
              { name: "타임키퍼(TimeKeeper)", desc: "스터디카페 전용 키오스크·예약 시스템", tier: "standard" },
              { name: "스마트인", desc: "스터디카페 운영 솔루션 · 전국 다수 적용", tier: "standard" },
              { name: "스터디유(StudyU)", desc: "입장 관리·좌석 예약 앱 · 저비용 시작", tier: "budget" },
            ],
          },
        ],
        2: [
          { icon: Coffee, label: language === "ko" ? "음료·간식 자판기" : "Vending & Beverages",
            items: [
              { name: "롯데네슬레 자판기", desc: "스터디카페 음료 공급 표준 · 무상 설치", tier: "standard" },
              { name: "동서식품 B2B", desc: "커피·음료 자판기 연계 · 가성비 최고", tier: "budget" },
              { name: "네스프레소 프로", desc: "캡슐커피 프리미엄 옵션 · 고급 인상 효과", tier: "premium" },
            ],
          },
          { icon: Shield, label: language === "ko" ? "위생·청소 소모품" : "Hygiene & Cleaning",
            items: [
              { name: "유한킴벌리 B2B", desc: "화장실·공용공간 위생용품 업소용 공급", tier: "standard" },
              { name: "아성다이소 기업구매", desc: "청소 소모품 최저가 · 다양한 품목 일괄", tier: "budget" },
              { name: "쿠팡 비즈", desc: "위생·청소 소모품 통합 조달 · 빠른 배송", tier: "budget" },
            ],
          },
        ],
      },
    };
    const industryStepData = stepDataMap[industryCategoryId] ?? stepDataMap["food"];

    // ── 운영 장비·기계 (vendor-setup 전용 — construction-setup의 인테리어/설비/가구와 명확히 분리) ──
    //  · construction-setup: 마감재·건축 설비·매장 가구·조명·사이니지 (건물에 부착·고정되는 것)
    //  · vendor-setup:        원자재·식자재·소모품 + 본 섹션의 운영 장비·기계 (들고 다니거나 교체 가능한 기기)
    type EquipmentItem = { name: string; desc: string; tier: "premium" | "standard" | "budget" };
    type EquipmentCategory = { icon: LucideIcon; label: string; items: EquipmentItem[] };
    const equipmentByCategory: Record<string, EquipmentCategory[]> = {
      "cafe-dessert": [
        { icon: Coffee, label: language === "ko" ? "에스프레소·추출 장비" : "Espresso Equipment", items: [
          { name: "라마르조코 리네아 미니", desc: "스페셜티 카페 표준 · 약 700~900만원 · 안정적 추출", tier: "premium" },
          { name: "라심발리 M26 / M100", desc: "중·대형 카페 다용도 · 약 400~700만원 · A/S 강함", tier: "standard" },
          { name: "ECM Synchronika", desc: "1그룹 소형 카페 · 약 350~450만원 · 가성비 프리미엄", tier: "standard" },
        ]},
        { icon: RefreshCw, label: language === "ko" ? "그라인더·블렌더" : "Grinders & Blenders", items: [
          { name: "메저 코니컬 EK / 메저 필립스 (Mahlkönig)", desc: "스페셜티 에스프레소용 · 약 200~400만원", tier: "premium" },
          { name: "마조 마이저(Mazzer Major)", desc: "전국 카페 표준 그라인더 · 약 100~150만원", tier: "standard" },
          { name: "바이타믹스(Vitamix) The Quiet One", desc: "프라페·스무디용 정음 블렌더 · 약 150~200만원", tier: "premium" },
        ]},
        { icon: Sparkles, label: language === "ko" ? "냉장·진열·제빙" : "Refrigeration & Ice", items: [
          { name: "호시자키 IM-65 제빙기", desc: "큐브얼음 일 65kg · 카페 표준 · 약 250~350만원", tier: "premium" },
          { name: "유니맥스 디저트 쇼케이스", desc: "케이크·디저트 진열 · 약 150~250만원", tier: "standard" },
          { name: "캐리어 카페냉장고 1200L", desc: "원두·우유 보관 대형 냉장고 · 약 80~150만원", tier: "standard" },
        ]},
        { icon: Box, label: language === "ko" ? "POS·키오스크·결제" : "POS & Kiosks", items: [
          { name: "토스플레이스 키오스크", desc: "카드·페이 통합 · 월 0원~ · 카페 80%+ 사용", tier: "budget" },
          { name: "포스뱅크 / 포스링크", desc: "카페 전용 POS · 단말기 100~200만원", tier: "standard" },
          { name: "오케이포스(OKPOS)", desc: "프랜차이즈 표준 · 본부 매출 연동", tier: "standard" },
        ]},
      ],
      "food": [
        { icon: Flame, label: language === "ko" ? "주방 화구·튀김기" : "Stoves & Fryers", items: [
          { name: "린나이 상업용 가스레인지", desc: "2~6구 · 약 80~250만원 · 한식·분식 표준", tier: "standard" },
          { name: "헨켈만(Henkelman) 진공포장기", desc: "수비드·저장식 · 약 200~400만원", tier: "premium" },
          { name: "유니맥스 튀김기 18L 듀얼", desc: "치킨·돈가스 매장 · 약 80~150만원", tier: "standard" },
        ]},
        { icon: Layers, label: language === "ko" ? "오븐·그릴·샐러맨더" : "Ovens & Grills", items: [
          { name: "라치오날 컴비오븐 6단", desc: "수비드·로스팅 통합 · 약 1,500~2,500만원", tier: "premium" },
          { name: "유니맥스 가스 컨벡션 오븐", desc: "베이커리·피자 · 약 250~500만원", tier: "standard" },
          { name: "린나이 샐러맨더", desc: "치즈 토핑·돈가스 마무리 · 약 80~150만원", tier: "standard" },
        ]},
        { icon: Sparkles, label: language === "ko" ? "냉장·냉동·작업대" : "Refrigeration & Prep", items: [
          { name: "유니맥스 워크인 냉장고", desc: "대용량 식자재 보관 · 약 400~800만원", tier: "standard" },
          { name: "그랜드우성 4도어 냉장고", desc: "주방 표준 · 약 200~350만원", tier: "standard" },
          { name: "에버레스트 작업대 냉장고", desc: "바트형 토핑 보관 · 약 150~250만원", tier: "standard" },
        ]},
        { icon: Box, label: language === "ko" ? "POS·주문·배달 통합" : "POS & Order Systems", items: [
          { name: "토스플레이스 + 배민·쿠팡 연동", desc: "주문·결제·배달 통합 키오스크", tier: "budget" },
          { name: "오케이포스(OKPOS)", desc: "프랜차이즈 표준 POS · 매출 통합", tier: "standard" },
          { name: "캐시노트 매출관리", desc: "POS 수기 입력 가능 · 무료", tier: "budget" },
        ]},
      ],
      "beauty": [
        { icon: Zap, label: language === "ko" ? "헤어 시술 장비" : "Hair Equipment", items: [
          { name: "다이슨 슈퍼소닉 프로", desc: "프리미엄 살롱 표준 · 약 50~70만원/대", tier: "premium" },
          { name: "파나소닉 EH-NA98 업소용", desc: "보급형 살롱 표준 · 약 15~30만원/대", tier: "standard" },
          { name: "바비리스 프로 매직기·고데기", desc: "스타일링 기본 도구 · 약 8~20만원/대", tier: "standard" },
        ]},
        { icon: Heart, label: language === "ko" ? "피부·네일·왁싱 기기" : "Skin · Nail · Waxing", items: [
          { name: "LED 마스크 전용기 (셀리턴)", desc: "피부 시술 · 약 200~400만원", tier: "premium" },
          { name: "전동 네일드릴·자외선 램프 세트", desc: "네일샵 표준 · 약 30~80만원", tier: "standard" },
          { name: "왁싱 워머·슈가링 페이스트 워머", desc: "왁싱샵 필수 · 약 20~50만원", tier: "standard" },
        ]},
        { icon: Box, label: language === "ko" ? "POS·예약 시스템" : "POS & Booking", items: [
          { name: "헤어인덱스 / 셀럽시스템", desc: "미용실 전용 예약·CRM · 월 5~10만원", tier: "standard" },
          { name: "네이버 예약·카카오톡 채널", desc: "예약 1순위 채널 · 무료", tier: "budget" },
          { name: "토스플레이스 결제 단말기", desc: "카드·페이 통합 · 월 0원~", tier: "budget" },
        ]},
      ],
      "fitness": [
        { icon: Dumbbell, label: language === "ko" ? "유산소·웨이트 머신" : "Cardio & Strength", items: [
          { name: "Life Fitness / Hammer Strength", desc: "글로벌 1위 · 대당 300~600만원 · 프리미엄 짐", tier: "premium" },
          { name: "테크노짐 엑사이트 라인", desc: "디자인+기능 균형 · 대당 250~500만원", tier: "premium" },
          { name: "한솔 / 인티엠 국산 머신", desc: "보급형 · 대당 100~200만원 · 가성비", tier: "standard" },
        ]},
        { icon: Sparkles, label: language === "ko" ? "필라테스·요가 기구" : "Pilates & Yoga", items: [
          { name: "발란스드바디 리포머", desc: "필라테스 정통 브랜드 · 약 400~600만원", tier: "premium" },
          { name: "스토트 필라테스 V2 맥스", desc: "공인 강사 표준 · 약 350~500만원", tier: "premium" },
          { name: "국산 리포머 (PMA·하트만)", desc: "보급형 · 약 150~250만원/대", tier: "standard" },
        ]},
        { icon: Heart, label: language === "ko" ? "측정·체크인 시스템" : "Measurement & Check-in", items: [
          { name: "인바디 770 / 270", desc: "체성분 분석 표준 · 약 700~1,800만원", tier: "premium" },
          { name: "스마트짐(SmartGym) 출입·CRM", desc: "키카드·앱 출입 · 약 200~400만원 초기설치", tier: "standard" },
          { name: "토스플레이스 회원권 결제", desc: "정기결제·카드 통합 · 월 0원~", tier: "budget" },
        ]},
      ],
      "education": [
        { icon: Monitor, label: language === "ko" ? "강의실 디스플레이·전자칠판" : "Classroom Displays", items: [
          { name: "삼성 Flip 65/75인치", desc: "전자칠판 표준 · 약 400~600만원", tier: "premium" },
          { name: "LG 시네빔 4K 프로젝터", desc: "보급 학원 · 약 150~300만원", tier: "standard" },
          { name: "에듀팩 화이트보드 + 빔", desc: "최저비용 셋업 · 약 50~100만원", tier: "budget" },
        ]},
        { icon: Cpu, label: language === "ko" ? "수업 운영·온라인 도구" : "Class Management", items: [
          { name: "클라썸(Classum) / 클래스팅", desc: "수업·과제·소통 통합 LMS · 무료~월 5만", tier: "budget" },
          { name: "줌(Zoom) Education", desc: "라이브·하이브리드 수업 · 월 2~5만/계정", tier: "standard" },
          { name: "에듀비(Eduby) 출결·문자", desc: "학원 출결 자동화 · 월 5~10만", tier: "standard" },
        ]},
        { icon: PanelLeft, label: language === "ko" ? "교재·도서 디지털화" : "Materials & Library", items: [
          { name: "EBS·메가스터디 교재 라이센스", desc: "외부 교재 도입 · 학원별 견적", tier: "standard" },
          { name: "구몬·아이스크림 디지털 학습", desc: "B2B 라이센스 · 학생당 월 단가", tier: "standard" },
          { name: "캠스캐너+자체 교재", desc: "디지털화 직접 운영 · 무료~월 1만", tier: "budget" },
        ]},
      ],
      "pet": [
        { icon: Scissors, label: language === "ko" ? "그루밍 장비" : "Grooming Equipment", items: [
          { name: "오스터(Oster) 클리퍼·블레이드", desc: "프리미엄 그루밍 표준 · 약 30~80만원/세트", tier: "premium" },
          { name: "안디스(Andis) 펄스 ZR2", desc: "전문 그루머 1순위 · 약 25~40만원", tier: "premium" },
          { name: "코디(Codi) 국산 클리퍼", desc: "보급형 · 약 5~15만원/세트", tier: "standard" },
        ]},
        { icon: Sparkles, label: language === "ko" ? "목욕·드라이 시설" : "Bath & Dry", items: [
          { name: "K9-III 강력 드라이어", desc: "전문 펫샵 표준 · 약 200~350만원", tier: "premium" },
          { name: "PetMaster 자동 욕조", desc: "온도·수량 조절 · 약 150~300만원", tier: "standard" },
          { name: "스탠드 드라이어 스탠드형", desc: "보급형 · 약 50~100만원", tier: "budget" },
        ]},
        { icon: Box, label: language === "ko" ? "POS·예약·CRM" : "POS & Booking", items: [
          { name: "펫프렌즈 비즈 / 펫닥터 SaaS", desc: "펫샵·동물병원 전용 · 월 5~15만", tier: "standard" },
          { name: "네이버 예약·카카오톡 채널", desc: "예약 1순위 · 무료", tier: "budget" },
          { name: "토스플레이스 결제 단말기", desc: "카드·페이 통합", tier: "budget" },
        ]},
      ],
      "retail": [
        { icon: Box, label: language === "ko" ? "POS·바코드·재고" : "POS & Inventory", items: [
          { name: "오케이포스 / 포스뱅크", desc: "리테일 표준 POS · 단말기 150~300만원", tier: "standard" },
          { name: "토스플레이스 + 셀러문스마트", desc: "POS·재고·온라인 통합 · 월 0~5만", tier: "budget" },
          { name: "스마트스토어 사장님센터(픽업)", desc: "온·오프 통합 재고 · 무료", tier: "budget" },
        ]},
        { icon: AlignLeft, label: language === "ko" ? "보안·고객 카운터" : "Security & Counters", items: [
          { name: "Sensormatic EAS 게이트", desc: "도난 방지 게이트 · 약 200~400만원", tier: "premium" },
          { name: "한화비전 IP CCTV 4채널 세트", desc: "매장 표준 보안 · 약 80~150만원", tier: "standard" },
          { name: "기본 NVR 세트(아이피타임 등)", desc: "최저 비용 · 약 30~60만원", tier: "budget" },
        ]},
      ],
      "living-service": [
        { icon: Droplets, label: language === "ko" ? "상업용 세탁기·건조기" : "Commercial Laundry", items: [
          { name: "지르바우(Girbau) 상업용", desc: "프리미엄 코인세탁 · 대당 500~800만원", tier: "premium" },
          { name: "엘렉트로룩스 프로페셔널", desc: "프랜차이즈 표준 · 대당 350~600만원", tier: "standard" },
          { name: "LG 상업용 트롬 / 휘센", desc: "보급형 · 대당 200~400만원", tier: "standard" },
        ]},
        { icon: Sparkles, label: language === "ko" ? "다림질·드라이클리닝" : "Press & Dry-clean", items: [
          { name: "유니맥스 / 마이크로테크 다림기", desc: "스팀 다림 · 약 80~150만원", tier: "standard" },
          { name: "상업용 드라이클리닝 머신", desc: "친환경 모델 · 약 1,500~3,000만원", tier: "premium" },
          { name: "보급형 핸드 스팀러 + 프레스", desc: "소형 매장 · 약 30~80만원", tier: "budget" },
        ]},
        { icon: Box, label: language === "ko" ? "무인 운영·결제" : "Self-service & Payment", items: [
          { name: "코인워시365 무인 키오스크", desc: "24시 무인 운영 · 약 300~500만원", tier: "standard" },
          { name: "토스플레이스 + 카카오페이", desc: "QR·카드 무인 결제", tier: "budget" },
          { name: "한화비전 CCTV + 출입 보안", desc: "무인 매장 필수 · 약 80~150만원", tier: "standard" },
        ]},
      ],
      "space": [
        { icon: Box, label: language === "ko" ? "무인 키오스크·출입 시스템" : "Self-service & Access", items: [
          { name: "스마트키오스크(SmartKiosk)", desc: "스터디카페 무인 결제·예약 · 약 250~400만원", tier: "standard" },
          { name: "탑존 / 코웨이 출입카드 시스템", desc: "키카드·QR 출입 · 약 100~200만원", tier: "standard" },
          { name: "토스플레이스 + 카카오페이", desc: "QR·카드 무인 결제 · 월 0원~", tier: "budget" },
        ]},
        { icon: Coffee, label: language === "ko" ? "음료·간식 디스펜서" : "Beverage & Snack", items: [
          { name: "코웨이 정수기·커피머신 임대", desc: "월 임대 · 무료 설치 + A/S", tier: "standard" },
          { name: "유니맥스 자동판매기", desc: "스낵·캔음료 · 약 200~400만원", tier: "standard" },
          { name: "셀프 커피·차 머신 (드롱기 등)", desc: "보급형 · 약 30~80만원", tier: "budget" },
        ]},
        { icon: Sparkles, label: language === "ko" ? "보안·CCTV" : "Security & CCTV", items: [
          { name: "한화비전 IP CCTV 8채널", desc: "무인 운영 표준 · 약 150~300만원", tier: "standard" },
          { name: "에스원 / KT텔레캅 보안 서비스", desc: "월 정액 · 무인 매장 권장", tier: "standard" },
          { name: "기본 NVR + IP 카메라", desc: "최저 비용 · 약 50~100만원", tier: "budget" },
        ]},
      ],
    };

    // ── Sub-industry overrides (sub-industry > category) ──
    //  · 국밥집, 한식백반, 이자카야 같이 sub-industry 가 카테고리 평균과 크게 다른 경우 전용 데이터 노출
    //  · 카테고리 fallback 보다 우선 적용
    const subIndustryEquipment: Record<string, EquipmentCategory[]> = {
      // 면/국밥/해장국 — 국밥집·해장국집·국수 전문점
      "ramen-noodle": [
        { icon: Flame, label: language === "ko" ? "국솥·압력솥·화구 (국물 우리기)" : "Stockpot, Pressure Cooker, Burner", items: [
          { name: "동광 대형 국솥 100~200L", desc: "사골·잡뼈 우리기 · 약 80~180만원 · 국밥집 핵심 장비", tier: "standard" },
          { name: "PN풍년 업소용 압력솥 70~100L", desc: "사골 추출 시간 1/3 단축 · 약 150~300만원", tier: "premium" },
          { name: "린나이 강력 화구 (300,000~500,000kcal/h)", desc: "대형 국솥 가열용 강력 화구 · 약 60~150만원", tier: "standard" },
        ]},
        { icon: Sparkles, label: language === "ko" ? "보온고·밥솥·뚝배기" : "Warming Cabinet, Rice Cooker, Bowls", items: [
          { name: "그랜드 밥보온고 WS-HC050 (50그릇)", desc: "공기밥 대량 보온 · 약 150~250만원 · 점심 회전율 핵심", tier: "standard" },
          { name: "쿠쿠 업소용 IH 밥솥 30인용", desc: "대용량 밥솥 · 약 80~150만원 · 일 200~400공기 매장 표준", tier: "standard" },
          { name: "토가마 업소용 뚝배기 (500ml/700ml)", desc: "여주 직매 토가마 · 개당 약 5,000~12,000원 · 50~100개 초도", tier: "budget" },
        ]},
        { icon: Box, label: language === "ko" ? "냉장·반찬·식기세척" : "Refrigeration & Dishwasher", items: [
          { name: "그랜드우성 4도어 냉장·냉동고", desc: "사골육수·내장·반찬 보관 · 약 200~350만원", tier: "standard" },
          { name: "프리미어 김치냉장고 업소용 600L", desc: "깍두기·열무·배추김치 보관 · 약 150~250만원", tier: "standard" },
          { name: "린나이 도어형 식기세척기", desc: "뚝배기·반찬그릇 회전율 핵심 · 약 250~450만원", tier: "premium" },
        ]},
        { icon: Box, label: language === "ko" ? "POS·주문·키오스크" : "POS & Kiosk", items: [
          { name: "토스플레이스 키오스크 + 배민·요기요 연동", desc: "한식당 표준 · 월 0원~", tier: "budget" },
          { name: "오케이포스(OKPOS) 한식당 패키지", desc: "POS + 주문 + 매출 통합 · 단말기 150~250만원", tier: "standard" },
          { name: "캐시노트 매출관리", desc: "수기 매출 입력 가능 · 무료 (POS 없는 노포 활용)", tier: "budget" },
        ]},
      ],
      // 한식·백반·캐주얼 식사
      "korean-casual": [
        { icon: Flame, label: language === "ko" ? "한식 화구·웍·찜기" : "Korean Burners & Steamers", items: [
          { name: "린나이 상업용 4구 가스레인지", desc: "찌개·전·반찬 동시 조리 · 약 150~250만원", tier: "standard" },
          { name: "PN풍년 업소용 압력솥 30~50L", desc: "갈비찜·찜닭 등 찜요리 · 약 80~150만원", tier: "standard" },
          { name: "동광 대형 찜기 2단 스테인리스", desc: "만두·전 등 대량 찜 조리 · 약 50~100만원", tier: "budget" },
        ]},
        { icon: Sparkles, label: language === "ko" ? "반찬 보관·김치냉장고·밥솥" : "Banchan Storage & Rice Cooker", items: [
          { name: "프리미어 김치냉장고 업소용 1000L+", desc: "김치 5종+ 보관 · 약 250~400만원 · 백반집 필수", tier: "standard" },
          { name: "유니맥스 반찬 토핑 냉장고", desc: "30~40종 반찬 디스플레이 · 약 200~350만원", tier: "standard" },
          { name: "쿠쿠 업소용 IH 밥솥 30인용 ×2대", desc: "대용량 밥솥 2대 운영 · 약 160~300만원", tier: "standard" },
        ]},
        { icon: Box, label: language === "ko" ? "반찬 자동화·식기세척" : "Banchan Automation & Dishwasher", items: [
          { name: "린나이 도어형 식기세척기 + 보조 싱크", desc: "한정식·백반 회전율 핵심 · 약 350~600만원", tier: "premium" },
          { name: "그랜드우성 작업대 냉장고 1500mm", desc: "반찬 전처리 작업대 · 약 200~300만원", tier: "standard" },
          { name: "동광 스테인리스 반찬 진열 매대", desc: "셀프바형 반찬 진열 · 약 80~150만원", tier: "budget" },
        ]},
        { icon: Box, label: language === "ko" ? "POS·키오스크" : "POS & Kiosk", items: [
          { name: "토스플레이스 키오스크 + 배민·쿠팡 통합", desc: "월 0원~ · 한식당 1순위", tier: "budget" },
          { name: "오케이포스 한식당 + 테이블오더", desc: "테이블 QR 주문 · 약 200~350만원", tier: "standard" },
        ]},
      ],
      // 이자카야·주점·포차
      "izakaya-pub": [
        { icon: Flame, label: language === "ko" ? "그릴·꼬치·튀김 장비" : "Grill, Skewer, Fryer", items: [
          { name: "야키도리 숯불 그릴 (린나이 비장탄용)", desc: "꼬치 전문 그릴 · 약 150~300만원", tier: "premium" },
          { name: "유니맥스 튀김기 듀얼 18L", desc: "가라아게·튀김 메뉴 · 약 80~150만원", tier: "standard" },
          { name: "린나이 다코야끼·철판 그리들", desc: "철판 안주 메뉴 · 약 100~200만원", tier: "standard" },
        ]},
        { icon: Wine, label: language === "ko" ? "주류 디스펜서·냉장" : "Drink Dispenser & Refrigeration", items: [
          { name: "타프리 비어 디스펜서 (생맥주 4탭)", desc: "생맥주 매장 필수 · 약 250~400만원", tier: "premium" },
          { name: "사케 전용 냉장고 (-2°C ~ 5°C)", desc: "사케·일본 술 보관 · 약 150~250만원", tier: "standard" },
          { name: "캐리어 음료냉장고 1200L 글래스도어", desc: "병맥주·음료·하이볼 진열 · 약 100~200만원", tier: "standard" },
        ]},
        { icon: Box, label: language === "ko" ? "POS·테이블오더·결제" : "POS, Table Order, Payment", items: [
          { name: "오케이포스 + 테이블오더 (셀프 주문)", desc: "테이블당 QR 주문 · 약 200~350만원", tier: "standard" },
          { name: "토스플레이스 키오스크", desc: "분리 결제·계산 자동화 · 월 0원~", tier: "budget" },
        ]},
      ],
    };

    const subIndustrySupplies: Record<string, { [step: number]: SupplyCategory[] }> = {
      // 면/국밥/해장국 — 국밥집 식자재
      "ramen-noodle": {
        1: [
          { icon: Layers, label: language === "ko" ? "사골·잡뼈·내장 (국물 베이스)" : "Bones & Offal", items: [
            { name: "마장축산물시장 (1차 도매)", desc: "사골·잡뼈·내장 직매 · 도매가 가장 저렴 · 새벽 직접 픽업", tier: "budget" },
            { name: "한국식자재유통", desc: "사골·잡뼈 정육 가공 후 배송 · 안정적 납품", tier: "standard" },
            { name: "CJ프레시웨이 한식 라인", desc: "사골 농축액·완제 육수까지 공급 · 표준화 강점", tier: "standard" },
          ]},
          { icon: Flame, label: language === "ko" ? "순대·내장 가공품 (순대국용)" : "Sundae & Offal (for Sundae-soup)", items: [
            { name: "전주 풍년식품 / 신정사 순대", desc: "순대 전문 OEM · 박스 단위 도매 · 보관 -18°C", tier: "standard" },
            { name: "마장 직거래 양·곱창·머리고기", desc: "1차 도축장 직매 · 신선도 최고 · 가격 변동 큼", tier: "budget" },
          ]},
          { icon: Sprout, label: language === "ko" ? "쌀·반찬 재료 (밥·깍두기·열무)" : "Rice & Banchan Base", items: [
            { name: "농협 직거래 쌀 (이천·여주산)", desc: "20kg 단위 · 한식당 표준 품질 · 월 단위 계약", tier: "standard" },
            { name: "가락시장 새벽 도매 (배추·무·열무)", desc: "김치 자체 담그는 매장용 · 시세 변동 모니터링 필수", tier: "budget" },
            { name: "풀무원·CJ제일제당 김치 OEM", desc: "깍두기·열무 완제품 · 인건비 절감 · 단가 ↑", tier: "standard" },
          ]},
          { icon: Sparkles, label: language === "ko" ? "양념·소금·기름 (간 맞추기)" : "Seasoning, Salt, Oil", items: [
            { name: "샘표 / 대상 청정원 업소용 간장·다시다", desc: "한식 표준 양념 · B2B 대용량", tier: "standard" },
            { name: "신안천일염 (3년 간수 뺀 것)", desc: "한식 짠맛 핵심 · 20kg 단위", tier: "standard" },
            { name: "오뚜기 들기름·참기름 업소용", desc: "고소한 풍미 · 1.8L 대용량", tier: "budget" },
            { name: "광천 새우젓 (육젓)", desc: "순대국·국밥 간 핵심 · 5kg 단위", tier: "standard" },
          ]},
        ],
        2: [
          { icon: Package, label: language === "ko" ? "포장재 (배달·테이크아웃)" : "Packaging (Delivery & To-go)", items: [
            { name: "하나팩 국물 누설 방지 용기 (PP)", desc: "국밥 배달 표준 용기 · 1,200ml · 단가 200~400원", tier: "standard" },
            { name: "원팩 다용도 국물 용기 + 뚜껑", desc: "1회용 누설 방지 · 박스 단위 도매", tier: "standard" },
            { name: "현진팩 친환경 종이 용기", desc: "친환경 트렌드 대응 · 단가 1.5배", tier: "premium" },
          ]},
          { icon: Shield, label: language === "ko" ? "주방 위생 소모품" : "Kitchen Hygiene", items: [
            { name: "유한킴벌리 B2B 행주·위생장갑", desc: "한식당 위생 표준 · 대량 공급", tier: "standard" },
            { name: "3M 업소용 수세미·세제", desc: "뚝배기 전용 강력 세척용", tier: "standard" },
            { name: "아성다이소 기업구매", desc: "일반 청소 소모품 최저가 · 일괄 조달", tier: "budget" },
          ]},
        ],
      },
      // 한식·백반
      "korean-casual": {
        1: [
          { icon: Leaf, label: language === "ko" ? "신선 식재료 (반찬 30종~)" : "Fresh Ingredients (30+ Banchan)", items: [
            { name: "CJ프레시웨이", desc: "식자재 1위 · 반찬 OEM 공급 가능 · 안정적 납품", tier: "standard" },
            { name: "마켓컬리 비즈", desc: "신선도 최고 · 새벽배송 · 소규모 백반집 최적", tier: "standard" },
            { name: "가락시장 새벽 도매", desc: "직접 픽업 · 가격 가장 저렴 · 인력 필요", tier: "budget" },
          ]},
          { icon: Flame, label: language === "ko" ? "양념·소스·장류" : "Seasoning, Sauce, Fermented", items: [
            { name: "샘표·해찬들 된장·고추장 업소용", desc: "한식당 장류 표준 · 5kg 대용량", tier: "standard" },
            { name: "대상 청정원 다시다·간장 업소용", desc: "조미료·간장 1위 · B2B 라인", tier: "standard" },
            { name: "오뚜기 들기름·참기름·식초", desc: "한식 기름 표준 · 1.8L 단위", tier: "budget" },
          ]},
          { icon: Sprout, label: language === "ko" ? "쌀·잡곡·김치 (대량)" : "Rice, Grains, Kimchi (Bulk)", items: [
            { name: "농협 직거래 쌀 (이천·진상)", desc: "백반집 표준 품질 · 20kg 단위 · 월 계약", tier: "standard" },
            { name: "풀무원·종갓집 김치 OEM 5종", desc: "김치 자체 담그기 어려운 매장용 · 일정 단가", tier: "standard" },
            { name: "대상 청정원 김치·반찬 완제품", desc: "30~40종 반찬 외부 조달 · 인건비 절감", tier: "standard" },
          ]},
        ],
        2: [
          { icon: Package, label: language === "ko" ? "포장재·반찬 용기" : "Packaging & Banchan Containers", items: [
            { name: "하나팩 다용도 한식 포장 용기", desc: "백반·도시락 배달 표준 · 박스 단위", tier: "standard" },
            { name: "원팩 반찬 칸막이 용기", desc: "5칸·7칸 분리 용기 · 백반 도시락 전용", tier: "standard" },
            { name: "현진팩 친환경 종이 용기", desc: "친환경 트렌드 대응 · 단가 1.5배", tier: "premium" },
          ]},
        ],
      },
    };

    const stepLabels: Record<number, string> = {
      1: language === "ko" ? "원자재 공급처 추천" : "Raw Material Suppliers",
      2: language === "ko" ? "포장재·소모품 추천" : "Packaging & Consumables",
      3: language === "ko" ? "계약 관리 도구 추천" : "Invoice & Contract Tools",
      4: language === "ko" ? "발주 플랫폼 추천" : "B2B Order Platforms",
    };

    // ── Resolve supplies & equipment with sub-industry override priority ──
    const subSupplyData = selectedIndustryId ? subIndustrySupplies[selectedIndustryId] : undefined;
    const supplies: SupplyCategory[] =
      guideStepIndex === 3 ? step3Supplies :
      guideStepIndex === 4 ? step4Supplies :
      // sub-industry 가 우선, 없으면 category 폴백
      (subSupplyData?.[guideStepIndex] ?? industryStepData[guideStepIndex] ?? []);

    // 운영 장비·기계는 step 1 (원자재 공급처) 진입 시에만 함께 노출 → vendor-setup 단계의 정체성을 강화
    const equipmentList: EquipmentCategory[] = guideStepIndex === 1
      ? (
          (selectedIndustryId ? subIndustryEquipment[selectedIndustryId] : undefined)
          ?? equipmentByCategory[industryCategoryId]
          ?? []
        )
      : [];

    // 사용자에게 sub-industry 맞춤 데이터임을 표시할 라벨
    const usingSubIndustry = guideStepIndex === 1
      && selectedIndustryId
      && (!!subIndustryEquipment[selectedIndustryId] || !!subIndustrySupplies[selectedIndustryId]);

    if (supplies.length === 0 && equipmentList.length === 0) return null;
    const urlMap = VENDOR_URL_MAP;
    const tierConfig = {
      premium: { bg: "rgba(88,86,214,0.12)", fg: "rgb(88,86,214)", label: language === "ko" ? "프리미엄" : "Premium" },
      standard: { bg: "rgba(0,122,255,0.1)", fg: "rgb(0,122,255)", label: language === "ko" ? "표준" : "Standard" },
      budget: { bg: "rgba(52,199,89,0.1)", fg: "rgb(34,167,73)", label: language === "ko" ? "가성비" : "Value" },
    };
    const categoryColors = [
      { bg: "rgba(0,122,255,0.1)",  fg: "rgb(0,122,255)"  },
      { bg: "rgba(52,199,89,0.1)",  fg: "rgb(34,167,73)"  },
      { bg: "rgba(255,149,0,0.1)",  fg: "rgb(210,120,0)"  },
      { bg: "rgba(88,86,214,0.12)", fg: "rgb(88,86,214)"  },
    ];
    const stepTip: Record<number, string> = {
      1: language === "ko" ? "첫 주문 전 반드시 샘플 요청 후 품질 확인. 2~3곳 견적 비교 후 계약하세요." : "Always request samples before the first order. Compare 2\u20133 quotes before committing.",
      2: language === "ko" ? "포장재는 최소 2주치 재고를 미리 확보하세요. 납품 지연 시 영업에 직접 영향을 줍니다." : "Keep at least 2 weeks of packaging stock. Delayed delivery can directly impact operations.",
      3: language === "ko" ? "세금계산서 발행 여부는 계약 전 반드시 확인. 미발행 업체는 부가세 환급이 불가합니다." : "Confirm invoice issuance before signing. Non-issuing vendors forfeit VAT refunds.",
      4: language === "ko" ? "첫 주 재고는 예상 판매량의 1.5배로 시작해 빠른 품절을 방지하세요." : "Start with 1.5\u00d7 expected weekly sales volume to avoid early stockouts.",
    };
    return (
      <>
        {/* ── 운영 장비·기계 (vendor-setup 전용 — 인테리어 단계와 분리) ── */}
        {equipmentList.length > 0 && (
          <>
            <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "16px 0 12px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap" as const, gap: "6px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                {language === "ko" ? "운영 장비·기계 추천" : "Operating Equipment & Machines"}
                {usingSubIndustry && (
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: "#191970",
                    color: "#ffffff",
                    letterSpacing: "0",
                    textTransform: "none" as const,
                    boxShadow: "0 1px 2px rgba(25,25,112,0.25)",
                  }}>
                    {language === "ko" ? "✓ 업종 맞춤" : "✓ Sub-industry"}
                  </span>
                )}
              </span>
              <span style={{ fontSize: "11px", color: "rgba(0,0,0,0.4)" }}>
                {language === "ko" ? "구매·렌탈 비교" : "buy vs lease"}
              </span>
            </div>
            <div style={{
              fontSize: "12.5px",
              color: "rgba(0,80,200,0.85)",
              lineHeight: 1.55,
              padding: "10px 14px",
              borderRadius: "12px",
              background: "rgba(0,122,255,0.06)",
              marginBottom: "12px",
            }}>
              {language === "ko"
                ? "💡 인테리어 단계에서는 마감재·설비·매장 가구를, 이 단계에서는 매장 운영에 쓰는 장비·기계를 다룹니다. 렌탈·할부도 가능하니 초도 자본 부담을 분산하세요."
                : "💡 Construction stage covers finishes, fixtures, and store furniture. This stage covers operating equipment & machines. Rental/installment options can ease initial capital burden."}
            </div>
            {equipmentList.map((eq, ei) => {
              const catColor = categoryColors[ei % categoryColors.length];
              const Icon = eq.icon;
              const selKey = `${currentStage.stageId}_eq_c${ei}`;
              const selectedName = vendorSelections[selKey] ?? "";
              return (
                <div key={`eq-${ei}`} style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "11.5px", fontWeight: 600, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: "6px" }}>
                    {eq.label}
                  </div>
                  <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)" }}>
                    {eq.items.map((item, ii) => {
                      const tier = tierConfig[item.tier];
                      const isSelected = selectedName === item.name;
                      return (
                        <div key={ii}>
                          {ii > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "68px" }} />}
                          <div
                            style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 18px", cursor: "pointer", background: isSelected ? "rgba(0,122,255,0.04)" : "transparent", transition: "background 0.15s" }}
                            onClick={() => setVendorSelections(prev => ({ ...prev, [selKey]: isSelected ? "" : item.name }))}
                          >
                            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: catColor.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: catColor.fg }}>
                              <Icon size={18} strokeWidth={1.8} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "14px", fontWeight: 590, color: "var(--text)", letterSpacing: "-0.3px", marginBottom: "2px" }}>{item.name}</div>
                              <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)", lineHeight: 1.45 }}>{item.desc}</div>
                            </div>
                            <span style={{ fontSize: "10.5px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px", background: tier.bg, color: tier.fg, flexShrink: 0, letterSpacing: "0.02em" }}>{tier.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {supplies.length > 0 && (<>
        <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "16px 0 12px" }} />
        <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
          {stepLabels[guideStepIndex]}
        </div>
        </>)}
        {supplies.map((supply, si) => {
          const catColor = categoryColors[si % categoryColors.length];
          const Icon = supply.icon;
          const selKey = `${currentStage.stageId}_s${guideStepIndex}_c${si}`;
          const selectedName = vendorSelections[selKey] ?? "";
          const customText = vendorCustomInputs[selKey] ?? "";
          const etcKey = `__etc__${selKey}`;
          return (
            <div key={si} style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "11.5px", fontWeight: 600, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: "6px" }}>
                {supply.label}
              </div>
              <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)" }}>
                {supply.items.map((item, ii) => {
                  const tier = tierConfig[item.tier];
                  const isSelected = selectedName === item.name;
                  return (
                    <div key={ii}>
                      {ii > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "68px" }} />}
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 18px", cursor: "pointer", background: isSelected ? "rgba(0,122,255,0.04)" : "transparent", transition: "background 0.15s" }}
                        onClick={() => setVendorSelections(prev => ({ ...prev, [selKey]: isSelected ? "" : item.name }))}
                      >
                        {/* select indicator */}
                        <div style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%", border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.18)", background: isSelected ? "rgb(0,122,255)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: catColor.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: catColor.fg }}>
                          <Icon size={18} strokeWidth={1.5} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px", flexWrap: "wrap" as const }}>
                            <span style={{ fontSize: "14px", fontWeight: isSelected ? 640 : 590, color: isSelected ? "rgb(0,122,255)" : "var(--text)", letterSpacing: "-0.3px" }}>{item.name}</span>
                            <span style={{ fontSize: "10.5px", fontWeight: 600, padding: "2px 7px", borderRadius: "100px", background: tier.bg, color: tier.fg, flexShrink: 0 }}>{tier.label}</span>
                          </div>
                          <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45 }}>{item.desc}</div>
                        </div>
                        {urlMap[item.name] && (
                          <a
                            href={urlMap[item.name]}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.38)", textDecoration: "none" }}
                          >
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                              <path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* 기타 행 */}
                <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "68px" }} />
                <div
                  style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 18px", cursor: "pointer", background: selectedName === etcKey ? "rgba(0,122,255,0.04)" : "transparent", transition: "background 0.15s" }}
                  onClick={() => setVendorSelections(prev => ({ ...prev, [selKey]: selectedName === etcKey ? "" : etcKey }))}
                >
                  <div style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%", border: selectedName === etcKey ? "none" : "1.5px solid rgba(0,0,0,0.18)", background: selectedName === etcKey ? "rgb(0,122,255)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                    {selectedName === etcKey && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "rgba(0,0,0,0.35)" }}>
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/>
                      <circle cx="4" cy="8.5" r="1.2" fill="currentColor"/>
                      <circle cx="13" cy="8.5" r="1.2" fill="currentColor"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: selectedName === etcKey ? 640 : 500, color: selectedName === etcKey ? "rgb(0,122,255)" : "rgba(0,0,0,0.5)", letterSpacing: "-0.2px" }}>
                      {language === "ko" ? "기타 (직접 입력)" : "Other (specify)"}
                    </div>
                    {selectedName === etcKey && (
                      <input
                        autoFocus
                        type="text"
                        placeholder={language === "ko" ? "업체명을 입력하세요" : "Enter supplier name"}
                        value={customText}
                        onClick={e => e.stopPropagation()}
                        onChange={e => setVendorCustomInputs(prev => ({ ...prev, [selKey]: e.target.value }))}
                        style={{ marginTop: "6px", width: "100%", fontSize: "13px", padding: "7px 10px", borderRadius: "10px", border: "1.5px solid rgba(0,122,255,0.35)", outline: "none", background: "rgba(0,122,255,0.04)", color: "var(--text)", boxSizing: "border-box" as const }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "12px", background: "rgba(0,122,255,0.06)", marginBottom: "4px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
            <circle cx="7" cy="7" r="6" stroke="rgb(0,122,255)" strokeWidth="1.4"/>
            <path d="M7 6v4M7 4.5v.5" stroke="rgb(0,122,255)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: "12px", color: "rgba(0,80,200,0.75)", lineHeight: 1.5 }}>
            {stepTip[guideStepIndex] ?? (language === "ko" ? "첫 주문 전 반드시 샘플 요청 후 품질 확인하세요." : "Always request samples before the first order.")}
          </span>
        </div>
      </>
    );
  })();

  // ─── operations_setup 인터랙티브 블록 ───
  const operationsEl: React.ReactNode = (currentStage.code as string) !== "operations_setup" || guideStepIndex === 0 ? null : (() => {
    type OpsItem = { id: string; name: string; desc: string; color: string; url: string; fee?: string; mau?: string; pros?: string[]; cons?: string[] };
    const ko = language === "ko";

    const logisticsItems: OpsItem[] = businessCtx.isDeliveryRelevant
      ? [
          { id: "baemin",     name: ko ? "배달의민족" : "Baemin",      desc: ko ? "MAU 2,170만 · 배달앱 1위" : "MAU 21.7M · #1 delivery app",       color: "#00C73C", url: "https://ceo.baemin.com",      fee: ko ? "2.0~7.8% (차등제)" : "2.0~7.8% tiered",    mau: "2,170만", pros: ko ? ["최대 고객 풀", "광고 효과 최대", "포장 주문 동시 운영"] : ["Largest customer pool", "Best ad reach"], cons: ko ? ["포장 수수료 6.8%", "광고 경쟁 치열"] : ["6.8% takeout fee", "Ad competition"] },
          { id: "coupangeats",name: ko ? "쿠팡이츠" : "Coupang Eats",  desc: ko ? "MAU 1,230만 · 서울 결제액 1위" : "MAU 12.3M · #1 in Seoul GMV", color: "#1460F3", url: "https://store.coupangeats.com", fee: ko ? "2.0~7.8% (차등제)" : "2.0~7.8% tiered",    mau: "1,230만", pros: ko ? ["단건 배달 품질 최고", "와우 멤버십 유입", "포장 수수료 0%"] : ["Best single delivery", "Wow members", "0% takeout"], cons: ko ? ["수도권 외 커버리지 부족", "고가 배달비"] : ["Weak outside metro", "Higher delivery fee"] },
          { id: "yogiyo",     name: ko ? "요기요" : "Yogiyo",          desc: ko ? "MAU 440만 · 하위 매출 환급 혜택" : "MAU 4.4M · Low-tier refund", color: "#FF5A00", url: "https://ceo.yogiyo.co.kr",    fee: ko ? "4.7~9.7% (건수별)" : "4.7~9.7% per order", mau: "440만",   pros: ko ? ["광고비 부담 적음", "하위 40% 수수료 환급", "초기 매장 적합"] : ["Low ad cost", "Bottom 40% refund"], cons: ko ? ["점유율 하락 추세", "유입량 감소"] : ["Declining market share"] },
          { id: "ddangyo",    name: ko ? "땡겨요" : "Ddangyo",         desc: ko ? "MAU 345만 · 공공배달앱 1위" : "MAU 3.45M · #1 public app",       color: "#FF6B35", url: "https://www.ddangyo.com",     fee: ko ? "2% 고정" : "2% fixed",                     mau: "345만",   pros: ko ? ["수수료 최저", "공공앱 신뢰감", "서울·경기 강세"] : ["Lowest fee", "Public trust"], cons: ko ? ["전국 커버리지 부족", "유입 제한적"] : ["Limited nationwide", "Lower traffic"] },
          { id: "naver-order",name: ko ? "네이버 주문" : "Naver Order", desc: ko ? "수수료 ~1.1% · 네이버 검색 연동" : "~1.1% · Naver Search linked", color: "#03C75A", url: "https://new.smartplace.naver.com", fee: ko ? "~1.1% (결제수수료만)" : "~1.1% payment only", mau: "-",   pros: ko ? ["수수료 최저 수준", "네이버 지도·검색 노출", "포장 주문 전환 급증"] : ["Lowest fee", "Naver Maps synergy"], cons: ko ? ["배달 인프라 없음 (포장 전용)", "별도 배달대행 필요"] : ["No delivery infra", "Takeout only"] },
        ]
      : isDigitalCategory
      ? [
          { id: "smartstore", name: ko ? "네이버 스마트스토어" : "Naver Smartstore", desc: ko ? "MAU 536만 · 쇼핑 검색 1위" : "MAU 5.36M · #1 shopping search", color: "#03C75A", url: "https://sell.smartstore.naver.com", fee: ko ? "주문 1.98~3.74% + 판매 0.91~2.73%" : "Order 1.98~3.74% + Sale 0.91~2.73%", mau: "536만", pros: ko ? ["네이버 검색 노출 최강", "결제 수수료 최저", "쇼핑라이브 가능"] : ["Best Naver search exposure", "Lowest payment fee"], cons: ko ? ["광고 없이 노출 어려움", "경쟁 치열"] : ["Hard to get exposure without ads"] },
          { id: "coupang-mp", name: ko ? "쿠팡 마켓플레이스" : "Coupang Marketplace", desc: ko ? "MAU 3,339만 · 이커머스 1위" : "MAU 33.4M · #1 ecommerce", color: "#E52222", url: "https://wing.coupang.com", fee: ko ? "4~10.8% + 월 55,000원" : "4~10.8% + \u20A955K/mo", mau: "3,339만", pros: ko ? ["최대 트래픽", "로켓그로스 풀필먼트", "와우 멤버십 노출"] : ["Most traffic", "Rocket Growth fulfillment"], cons: ko ? ["월 정액비 부담", "가격 경쟁 심화"] : ["Monthly fee", "Price competition"] },
          { id: "kakao-store", name: ko ? "카카오톡 스토어" : "KakaoTalk Store", desc: ko ? "카톡 4,700만 사용자 연동" : "Connected to 47M KakaoTalk users", color: "#F9E000", url: "https://store.kakaotalk.com", fee: ko ? "3.3~10% (경로별)" : "3.3~10% by channel", mau: "4,700만", pros: ko ? ["카톡 메시지 마케팅", "선물하기 입점 가능", "간편 결제"] : ["KakaoTalk marketing", "Gift feature"], cons: ko ? ["선물하기 수수료 ~15%", "자체 검색 유입 약함"] : ["~15% gift fee", "Weak search traffic"] },
          { id: "elevenst",   name: ko ? "11번가" : "11st",             desc: ko ? "MAU 893만 · 신규 셀러 수수료 6%" : "MAU 8.93M · New seller 6%",  color: "#FF0000", url: "https://soffice.11st.co.kr", fee: ko ? "7~13% (카테고리별)" : "7~13% by category", mau: "893만", pros: ko ? ["신규 12개월 수수료 할인", "SKT 멤버십 연계"] : ["12-month new seller discount"], cons: ko ? ["트래픽 감소 추세"] : ["Declining traffic"] },
          { id: "gmarket",     name: ko ? "G마켓/옥션" : "G-Market/Auction", desc: ko ? "G마켓 MAU 706만 + 옥션 296만" : "G-Market 7.06M + Auction 2.96M MAU", color: "#00A34F", url: "https://www.gmarket.co.kr", fee: ko ? "4~15% (평균 9%)" : "4~15% (avg 9%)", mau: "706만+296만", pros: ko ? ["묶음 배송 시스템", "해외 판매 연동"] : ["Bundle shipping", "Global selling"], cons: ko ? ["트래픽 감소 추세", "수수료 높은 편"] : ["Declining traffic", "Higher fees"] },
        ]
      : [
          { id: "cj",    name: ko ? "CJ대한통운" : "CJ Logistics", desc: ko ? "택배 점유율 1위 · D+1 배송" : "#1 courier · D+1 delivery",           color: "#003C71", url: "https://www.cjlogistics.com", fee: ko ? "소형 1,850원~ (계약)" : "Small \u20A91,850+ (contract)", pros: ko ? ["전국 커버리지 최강", "D+1 배송", "편의점 접수"] : ["Best nationwide", "D+1"], cons: ko ? ["초기 물량 적으면 할인 적음"] : ["Low volume = low discount"] },
          { id: "hanjin",name: ko ? "한진택배" : "Hanjin",          desc: ko ? "중대형 화물 경쟁력" : "Mid-large competitive",                       color: "#FF6600", url: "https://www.hanjin.co.kr",    fee: ko ? "소형 5,000원~" : "Small \u20A95,000+",   pros: ko ? ["중대형 화물 강점", "전국 A/S망"] : ["Good for large items"], cons: ko ? ["소형 가격 높음"] : ["Expensive for small items"] },
          { id: "epost", name: ko ? "우체국택배" : "Korea Post",    desc: ko ? "최저가 · 도서산간 추가 없음" : "Cheapest · No island surcharge",       color: "#004098", url: "https://parcel.epost.go.kr",  fee: ko ? "3kg 이하 2,700원" : "Under 3kg \u20A92,700", pros: ko ? ["최저 요금", "도서산간 추가 없음", "우체국 접수"] : ["Cheapest", "No island surcharge"], cons: ko ? ["D+3 배송", "속도 느림"] : ["D+3 delivery", "Slow"] },
        ];
    // Alias for backward compatibility with existing render logic
    const deliveryApps = logisticsItems;

    const posCheckItems: Array<{ id: string; label: string; hint: string }> = [
      { id: "menu-check",       label: language === "ko" ? "메뉴·상품 전체 등록 및 가격 확인" : "All items registered with correct prices", hint: language === "ko" ? "옵션·추가 금액·품절 처리도 함께 점검" : "Check options, add-ons and sold-out handling" },
      { id: "payment-check",    label: language === "ko" ? "카드 실결제 1건 테스트" : "Live card payment test", hint: language === "ko" ? "실제 카드로 결제 후 즉시 취소하세요" : "Use a real card then cancel immediately" },
      { id: "receipt-check",    label: language === "ko" ? "영수증 출력 확인" : "Receipt printing confirmed", hint: language === "ko" ? "사업자 정보·세금 정보 정확한지 확인" : "Verify business name and tax info are correct" },
      { id: "settlement-check", label: language === "ko" ? "일 마감·정산 기능 점검" : "Daily closing & settlement tested", hint: language === "ko" ? "정산 금액 = 매출 합계인지 비교 확인" : "Confirm settlement total matches sales total" },
    ];

    const snsChannels: OpsItem[] = [
      { id: "instagram",      name: "인스타그램 비즈니스", desc: ko ? "MAU 2,000만+ · 비주얼 마케팅 필수" : "MAU 20M+ · Visual marketing essential", color: "#C13584", url: "https://business.instagram.com", fee: ko ? "0% (별도 PG 3~4%)" : "0% (PG 3~4%)", mau: "2,000만+", pros: ko ? ["무료 개설", "리스/스토리 바이럴", "쇼핑 태그 연동"] : ["Free", "Reels/Story viral", "Shopping tags"], cons: ko ? ["인앱 결제 미지원", "알고리즘 변동"] : ["No in-app payment", "Algorithm changes"] },
      { id: "naver-place",    name: "네이버 플레이스",     desc: ko ? "검색 MAU 4,000만+ · 매장 노출 1순위" : "Search MAU 40M+ · #1 store exposure", color: "#03C75A", url: "https://new.smartplace.naver.com", fee: ko ? "무료 (예약 현장결제 0원)" : "Free", mau: "4,000만+", pros: ko ? ["완전 무료", "네이버 검색·지도 노출", "예약·리뷰 통합"] : ["Free", "Naver Search + Maps", "Booking + Reviews"], cons: ko ? ["등록 후 노출까지 시간 소요", "리뷰 관리 필요"] : ["Takes time to rank", "Review management needed"] },
      { id: "kakao-channel",  name: "카카오 채널",         desc: ko ? "카톡 4,700만 · 메시지 마케팅" : "KakaoTalk 47M · Message marketing",           color: "#F9E000", url: "https://ch.kakao.com", fee: ko ? "채널 무료, 메시지 건당 15~20원" : "Channel free, msg \u20A915~20/ea", mau: "4,700만", pros: ko ? ["카톡 푸시 마케팅", "챗봇 무료", "카카오맵 연동"] : ["KakaoTalk push", "Free chatbot"], cons: ko ? ["메시지 비용 누적", "톡스토어 수수료 별도"] : ["Message costs add up"] },
      { id: "google-business",name: "구글 비즈니스",       desc: ko ? "구글맵 노출 · 외국인 필수" : "Google Maps · Essential for foreigners",           color: "#4285F4", url: "https://business.google.com/ko", fee: ko ? "무료" : "Free", pros: ko ? ["완전 무료", "구글맵 노출", "외국인 접근성"] : ["Free", "Google Maps", "Foreign customers"], cons: ko ? ["한국 내 검색 점유율 낮음"] : ["Low domestic search share"] },
    ];

    const renderPlatformCard = (items: OpsItem[], keyPrefix: string, tip: string) => {
      const selectedCount = items.filter(it => opsSelections[`${keyPrefix}-${it.id}`]).length;
      return (
        <>
          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "16px 0 12px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
              {keyPrefix === "delivery"
                ? (businessCtx.isDeliveryRelevant
                    ? (language === "ko" ? "배달 플랫폼 입점" : "Delivery Platforms")
                    : isDigitalCategory
                      ? (language === "ko" ? "판매 플랫폼 선택" : "Sales Platforms")
                      : (language === "ko" ? "택배사 선택" : "Courier Service"))
                : (language === "ko" ? "채널 개설 현황" : "Channel Setup")}
            </span>
            {selectedCount > 0 && (
              <span style={{ fontSize: "11px", fontWeight: 600, color: "rgb(0,122,255)", background: "rgba(0,122,255,0.1)", padding: "2px 8px", borderRadius: "100px" }}>
                {selectedCount}{language === "ko" ? "개 완료" : " done"}
              </span>
            )}
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            {items.map((item) => {
              const selKey = `${keyPrefix}-${item.id}`;
              const isSelected = !!opsSelections[selKey];
              return (
                <div key={item.id}
                  style={{
                    background: isSelected ? `${item.color}06` : "white",
                    borderRadius: "18px", overflow: "hidden", cursor: "pointer",
                    border: isSelected ? `1.5px solid ${item.color}30` : "1px solid rgba(0,0,0,0.06)",
                    boxShadow: isSelected ? `0 0 0 3px ${item.color}08` : "0 1px 4px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setOpsSelections(prev => ({ ...prev, [selKey]: !prev[selKey] }))}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px" }}>
                    <div style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.15)", background: isSelected ? item.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                      {isSelected && <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `${item.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "17px", fontWeight: 750, color: item.color }}>{item.name.charAt(0)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <span style={{ fontSize: "15px", fontWeight: isSelected ? 660 : 600, color: isSelected ? item.color : "var(--text)", letterSpacing: "-0.02em" }}>{item.name}</span>
                        {item.mau && item.mau !== "-" && (
                          <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "6px", background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)" }}>MAU {item.mau}</span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(0,0,0,0.45)", lineHeight: 1.45 }}>{item.desc}</div>
                      {item.fee && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px", padding: "3px 10px", borderRadius: "8px", background: `${item.color}0a`, fontSize: "11px", fontWeight: 620, color: item.color }}>
                          {ko ? "수수료" : "Fee"}: {item.fee}
                        </div>
                      )}
                    </div>
                    <a href={item.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "50%", background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.35)", textDecoration: "none" }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 10.5L10.5 2.5M10.5 2.5H5.5M10.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                  </div>
                  {/* 장단점 — 선택 시 펼침 */}
                  {isSelected && (item.pros?.length || item.cons?.length) && (
                    <div style={{ padding: "0 18px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }} className="bento-fade-in">
                      {item.pros && item.pros.length > 0 && (
                        <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(5,150,105,0.04)" }}>
                          <div style={{ fontSize: "10px", fontWeight: 650, color: "#059669", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>{ko ? "장점" : "Pros"}</div>
                          {item.pros.map((p, pi) => (
                            <div key={pi} style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5, display: "flex", gap: "4px" }}>
                              <span style={{ color: "#059669", flexShrink: 0 }}>+</span> {p}
                            </div>
                          ))}
                        </div>
                      )}
                      {item.cons && item.cons.length > 0 && (
                        <div style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(220,38,38,0.03)" }}>
                          <div style={{ fontSize: "10px", fontWeight: 650, color: "#dc2626", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "4px" }}>{ko ? "주의" : "Cons"}</div>
                          {item.cons.map((c, ci) => (
                            <div key={ci} style={{ fontSize: "12px", color: "rgba(0,0,0,0.55)", lineHeight: 1.5, display: "flex", gap: "4px" }}>
                              <span style={{ color: "#dc2626", flexShrink: 0 }}>-</span> {c}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "12px", background: "rgba(0,122,255,0.06)", marginTop: "10px", marginBottom: "4px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="7" cy="7" r="6" stroke="rgb(0,122,255)" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="rgb(0,122,255)" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <span style={{ fontSize: "12px", color: "rgba(0,80,200,0.75)", lineHeight: 1.5 }}>{tip}</span>
          </div>
        </>
      );
    };

    if (guideStepIndex === 1) {
      return renderPlatformCard(
        deliveryApps,
        "delivery",
        language === "ko"
          ? "배민·쿠팡이츠 중 하나라도 먼저 입점하고, 나머지는 오픈 후 추가해도 됩니다."
          : "Start with at least one platform and add others after opening."
      );
    }

    if (guideStepIndex === 2) {
      const allChecked = posCheckItems.every(c => opsPosChecks[c.id]);
      return (
        <>
          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "16px 0 12px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(0,0,0,0.38)", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
              {language === "ko" ? "POS 점검 체크리스트" : "POS Test Checklist"}
            </span>
            {allChecked && (
              <span style={{ fontSize: "11px", fontWeight: 600, color: "rgb(52,199,89)", background: "rgba(52,199,89,0.1)", padding: "2px 8px", borderRadius: "100px" }}>
                {language === "ko" ? "\u2713 완료" : "\u2713 Done"}
              </span>
            )}
          </div>
          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)" }}>
            {posCheckItems.map((check, i) => {
              const checked = !!opsPosChecks[check.id];
              return (
                <div key={check.id}>
                  {i > 0 && <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", marginLeft: "64px" }} />}
                  <div
                    style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "13px 18px", cursor: "pointer", background: checked ? "rgba(52,199,89,0.04)" : "transparent", transition: "background 0.15s" }}
                    onClick={() => setOpsPosChecks(prev => ({ ...prev, [check.id]: !prev[check.id] }))}
                  >
                    <div style={{ flexShrink: 0, marginTop: "1px", width: "20px", height: "20px", borderRadius: "6px", border: checked ? "none" : "1.5px solid rgba(0,0,0,0.18)", background: checked ? "rgb(52,199,89)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                      {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: checked ? 600 : 500, color: checked ? "rgb(34,167,73)" : "var(--text)", letterSpacing: "-0.2px", textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.7 : 1 }}>{check.label}</div>
                      {!checked && <div style={{ fontSize: "11.5px", color: "rgba(0,0,0,0.38)", marginTop: "2px", lineHeight: 1.4 }}>{check.hint}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "12px", background: "rgba(255,149,0,0.07)", marginTop: "10px", marginBottom: "4px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}><circle cx="7" cy="7" r="6" stroke="rgb(210,120,0)" strokeWidth="1.4"/><path d="M7 6v4M7 4.5v.5" stroke="rgb(210,120,0)" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <span style={{ fontSize: "12px", color: "rgba(150,80,0,0.8)", lineHeight: 1.5 }}>
              {language === "ko" ? "실결제 테스트 후 반드시 취소 처리하세요. 정산 오류 방지를 위해 오픈 전날 완료를 권장합니다." : "Cancel the test transaction immediately. Complete this the day before opening to avoid settlement errors."}
            </span>
          </div>
        </>
      );
    }

    if (guideStepIndex === 3) {
      return renderPlatformCard(
        snsChannels,
        "sns",
        language === "ko"
          ? "네이버 플레이스는 오픈 1주 전에 등록해야 검색 노출이 오픈 당일부터 반영됩니다."
          : "Register Naver Place at least 1 week before opening for search visibility on day one."
      );
    }

    return null;
  })();

  // ── registration_setup: per-step rich enrichment ──────────────
  const registrationSetupEl: React.ReactNode = (() => {
    if (currentStage.code !== "registration_setup" || guideStepIndex === 0) return null;

    const ko = language === "ko";
    const cat = industryCategoryId;

    type RegItem = { text: string; sub?: string };
    type RegSection = { label: string; items: RegItem[] };
    type RegTrap = { label: string; text: string };
    type RegLink = { text: string; href: string };
    type RegStepData = { sections: RegSection[]; traps: RegTrap[]; links: RegLink[] };

    // ── Step 1: 사업자등록 준비·신청 ──────────────────────────────
    const step1: RegStepData = {
      sections: [
        {
          label: ko ? "준비물" : "What to bring",
          items: ko ? [
            { text: "신분증 원본", sub: "운전면허증 또는 여권" },
            { text: "임대차계약서 원본", sub: "임차인 = 대표자 본인 명의여야 함. 가족 명의면 전대차 계약서 추가" },
            cat === "beauty"
              ? { text: "미용사 면허증", sub: "대표자 본인 또는 고용 직원 면허 모두 사용 가능" }
              : cat === "fitness"
                ? { text: "시설 도면(약식)", sub: "면적·공간 배치가 나온 간단한 도면으로도 가능" }
                : { text: "업종 자격증(선택)", sub: "조리사 면허는 의무 아님 — 단, 식품위생교육 이수증은 3단계에서 필수" },
            { text: "도장(선택)", sub: "세무서 방문 시 있으면 편리, 없어도 서명으로 대체 가능" },
          ] : [
            { text: "Government-issued ID (original)", sub: "Driver's license or passport" },
            { text: "Lease contract (original)", sub: "Lessee name must match the representative. Add sub-lease doc if under family name." },
            cat === "beauty"
              ? { text: "Cosmetology license", sub: "Owner's or employed cosmetologist's license both accepted" }
              : { text: "Professional license (if applicable)", sub: "Cook's license not mandatory \u2014 food hygiene certificate needed at Step 3" },
            { text: "Seal/stamp (optional)", sub: "Useful at tax office, can be replaced with signature" },
          ],
        },
        {
          label: ko ? "신청 방법 비교" : "How to register",
          items: ko ? [
            { text: "홈택스 온라인 신청 \u2014 추천", sub: "24시간 신청 가능 · 처리 2~3 영업일 · 공동인증서(민간 포함) 필요 · hometax.go.kr \u2192 신청/제출 \u2192 사업자등록신청" },
            { text: "세무서 직접 방문", sub: "당일 처리 완료 · 복잡한 인허가 업종 창업자에게 추천 · 평일 09:00~18:00" },
          ] : [
            { text: "Hometax online \u2014 recommended", sub: "24/7 · 2\u20133 business days · Joint certificate required · hometax.go.kr \u2192 Application" },
            { text: "Tax office in person", sub: "Same-day completion · Recommended for complex permit industries · Weekdays 09:00\u201318:00" },
          ],
        },
        {
          label: ko ? "내 업종코드" : "Business code",
          items: ko ? (
            cat === "cafe-dessert" ? [
              { text: "522220 커피음료점업", sub: "카페·테이크아웃 커피 전문점 기본 코드" },
              { text: "522210 제과점업", sub: "베이커리·디저트 카페 (빵 비중이 크면 이 코드)" },
              { text: "주류 판매 계획 있으면 \u2192 522111 일반음식점업 추가", sub: "맥주·와인 등 주류를 판다면 업종 추가 등록 필요" },
            ] : cat === "food" ? [
              { text: "522111 한식 음식점업", sub: "찌개·구이·한정식 등 한식 위주" },
              { text: "522121 외국식 음식점업", sub: "이탈리안·일식·중식·양식 등" },
              { text: "522141 기타 간이음식점업", sub: "분식·포장마차·푸드트럭 형태" },
            ] : cat === "beauty" ? [
              { text: "961101 미용업", sub: "헤어 커트·펌·염색 기본 코드" },
              { text: "961201 피부미용업", sub: "피부관리·반영구·속눈썹" },
              { text: "961301 기타 미용업", sub: "네일·화장·종합 뷰티 (복합 서비스)" },
            ] : cat === "fitness" ? [
              { text: "931001 스포츠 시설 운영업", sub: "헬스장·PT 스튜디오 기본 코드" },
              { text: "931003 기타 스포츠 시설 운영업", sub: "요가·필라테스·기타 운동 시설" },
              { text: "무도 종목은 별도 허가 대상", sub: "태권도·유도·합기도 등 \u2192 3단계에서 안내" },
            ] : [
              { text: "세무서 방문 시 직원에게 확인 가능", sub: "업종코드 선택을 도와줌 \u2014 잘 모르면 방문 신청 추천" },
            ]
          ) : (
            cat === "cafe-dessert" ? [
              { text: "522220 \u2014 Caf\u00e9 & coffee shop", sub: "Main code for caf\u00e9s and takeout coffee" },
              { text: "522210 \u2014 Bakery", sub: "Use this if baked goods are your primary product" },
              { text: "Add 522111 (general restaurant) if serving alcohol", sub: "Required for beer/wine sales" },
            ] : cat === "beauty" ? [
              { text: "961101 \u2014 Hair salon", sub: "Cutting, perming, coloring" },
              { text: "961201 \u2014 Skin care studio", sub: "Facials, semi-permanent, lashes" },
              { text: "961301 \u2014 Other beauty services", sub: "Nail art, makeup, multi-service" },
            ] : [
              { text: "522111 \u2014 Korean food restaurant", sub: "Korean cuisine" },
              { text: "522121 \u2014 Foreign food restaurant", sub: "Italian, Japanese, Chinese, Western" },
            ]
          ),
        },
      ],
      traps: ko ? [
        { label: "임차인 명의 불일치 \u2192 즉시 반려", text: "계약서의 임차인이 사업자 대표자 본인이 아니면 접수 자체가 거부됩니다. 부모·배우자 명의 계약서라면 반드시 전대차 계약서(전대인 동의 포함)를 추가 준비하세요." },
        { label: "상호명 상표 분쟁 리스크", text: "기존 상표와 유사한 상호명은 나중에 법적 분쟁이나 간판 교체 비용이 생깁니다. 등록 전 KIPRIS에서 반드시 검색하세요." },
      ] : [
        { label: "Lease name mismatch = instant rejection", text: "The lessee on the contract must be the business representative. If it's a family member's name, prepare a sub-lease document with the original lessee's consent." },
        { label: "Trade name trademark risk", text: "A name similar to an existing trademark can lead to legal disputes and forced rebranding later. Search on KIPRIS before committing." },
      ],
      links: ko ? [
        { text: "\uad6d\uc138\uccad \ud648\ud0dd\uc2a4 \u2014 \uc0ac\uc5c5\uc790\ub4f1\ub85d \uc2e0\uccad", href: "https://www.hometax.go.kr" },
        { text: "KIPRIS \u2014 \uc0c1\ud45c\xb7\uc0c1\ud638 \uac80\uc0c9", href: "https://www.kipris.or.kr" },
      ] : [
        { text: "Hometax \u2014 Business registration", href: "https://www.hometax.go.kr" },
        { text: "KIPRIS \u2014 Trademark search", href: "https://www.kipris.or.kr" },
      ],
    };

    // ── Step 2: 과세유형·업종코드 확정 ──────────────────────────
    const step2: RegStepData = {
      sections: [
        {
          label: ko ? "\uacfc\uc138\uc720\ud615 \ube44\uad50 \u2014 \ub4f1\ub85d \uc804 \uacb0\uc815 \ud544\uc218" : "VAT type \u2014 must decide before filing",
          items: ko ? [
            { text: "\uac04\uc774\uacfc\uc138\uc790 \u2014 \uc5f0 \ub9e4\ucd9c 1\uc5b5 400\ub9cc\uc6d0 \ubbf8\ub9cc \uc608\uc0c1 \uc2dc", sub: "\ubd80\uac00\uc138 \ub0a9\ubd80 \ubd80\ub2f4 \ub0ae\uc74c. \ub2e8, \uc138\uae08\uacc4\uc0b0\uc11c \ubc1c\uae09 \ubd88\uac00 \u2192 B2B \uac70\ub798\uac00 \uc788\uc73c\uba74 \uc120\ud0dd \uae08\uc9c0" },
            { text: "\uc77c\ubc18\uacfc\uc138\uc790 \u2014 \ub9e4\ucd9c 1\uc5b5+ \ub610\ub294 \ucd08\uae30 \ud22c\uc790 \ud070 \uacbd\uc6b0", sub: "\ub9e4\uc785\uc138\uc561 \uc804\uc561 \ud658\uae09 \uac00\ub2a5. \uc778\ud14c\ub9ac\uc5b4\xb7\uc124\ube44 1\uc5b5 \ud22c\uc790 \uc2dc \uc57d 909\ub9cc\uc6d0 \ud658\uae09 \ud6a8\uacfc" },
          ] : [
            { text: "Simplified VAT \u2014 est. revenue < \u20A9104M", sub: "Lower VAT burden. Cannot issue tax invoices \u2192 don't choose if you have B2B clients" },
            { text: "General VAT \u2014 revenue \u2265 \u20A9104M or large initial spend", sub: "Full input VAT refund. \u20A9100M in fit-out costs \u2192 ~\u20A99M refund" },
          ],
        },
        {
          label: ko ? "\uc138\uae08 \uc2e0\uace0 \uc8fc\uae30 \ubbf8\ub9ac \uc54c\uae30" : "Tax filing schedule",
          items: ko ? [
            { text: "\ubd80\uac00\uc138: \uc5f0 2\ud68c (1\xb77\uc6d4)", sub: "\uc77c\ubc18\uacfc\uc138\uc790 \uae30\uc900 \u2014 \uac04\uc774\uacfc\uc138\uc790\ub294 \uc5f0 1\ud68c(1\uc6d4)\ub9cc \uc2e0\uace0" },
            { text: "\uc885\ud569\uc18c\ub4dd\uc138: \ub9e4\ub144 5\uc6d4", sub: "\uc804\ub144\ub3c4 \uc0ac\uc5c5 \uc18c\ub4dd \uc804\uccb4 \uc2e0\uace0. \uc138\ubb34\uc0ac \uc120\uc784 \uc5ec\ubd80\uc5d0 \uad00\uacc4\uc5c6\uc774 \ubcf8\uc778 \ucc45\uc784" },
            { text: "\uc6d0\ucc9c\uc138: \uc9c1\uc6d0 \ucc44\uc6a9 \uc2dc \ub9e4\uc6d4 \uc2e0\uace0", sub: "4\ub300\ubcf4\ud5d8 \uac00\uc785\ub3c4 \uc9c1\uc6d0 \ucc44\uc6a9 \uc989\uc2dc \uc758\ubb34 \u2014 \uace0\uc6a9\ub178\ub3d9\ubd80 EDI\uc5d0\uc11c \uc2e0\uace0" },
          ] : [
            { text: "VAT: twice a year (Jan & Jul)", sub: "General VAT payers \u2014 simplified VAT payers file once in January" },
            { text: "Income tax: every May", sub: "Previous year's total business income. Your responsibility regardless of tax advisor." },
            { text: "Withholding tax: monthly when you have employees", sub: "4 social insurance plans must also be enrolled immediately upon hiring" },
          ],
        },
        {
          label: ko ? "\uc138\ubb34 \ucc98\ub9ac \ubc29\uc2dd \uc120\ud0dd" : "How to handle taxes",
          items: ko ? [
            { text: "\uc9c1\uc811 \uc2e0\uace0 (\ud648\ud0dd\uc2a4)", sub: "\uc9c1\uc6d0 \uc5c6\uace0 \ub2e8\uc21c \ub9e4\ucd9c\uc77c \ub54c \uac00\ub2a5. \ubb34\ub8cc\uc774\ub098 \ubd80\uac00\uc138\xb7\uc885\uc18c\uc138 \uc2e0\uace0 \ubc29\ubc95 \uacf5\ubd80 \ud544\uc694" },
            { text: "\uc138\ubb34\uc0ac(\uc138\ubb34\ub300\ub9ac\uc778) \uc120\uc784 \u2014 \uc6d4 5~15\ub9cc\uc6d0", sub: "\uc6d0\ucc9c\uc138\xb74\ub300\ubcf4\ud5d8\xb7\ubd80\uac00\uc138\xb7\uc885\uc18c\uc138 \uc804\ubd80 \uc704\uc784. \uc9c1\uc6d0 1\uba85 \uc774\uc0c1\uc774\uac70\ub098 \uc815\ucc45\uc790\uae08 \uc2e0\uccad \uc608\uc815\uc774\uba74 \uac70\uc758 \ud544\uc218" },
          ] : [
            { text: "Self-file via Hometax", sub: "Works if no employees and simple revenue. Free but requires learning VAT/income tax filing." },
            { text: "Hire a tax accountant \u2014 \u20A950K\u2013150K/month", sub: "Delegate everything. Nearly essential if you have employees or plan to apply for policy funds." },
          ],
        },
      ],
      traps: ko ? [
        { label: "\uacfc\uc138\uc720\ud615 \ubcc0\uacbd\uc740 \uc5f0 1\ud68c, \ub2e4\uc74c \ud574 1\uc6d4\ub9cc \uac00\ub2a5", text: "\uac1c\uc5c5 \uc2dc \uc798\ubabb \uc120\ud0dd\ud558\uba74 \ucd5c\uc18c 1\ub144\uc744 \uae30\ub2e4\ub824\uc57c \ubc14\uafc0 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \uc778\ud14c\ub9ac\uc5b4\xb7\uc124\ube44 \ud22c\uc790\uac00 1,000\ub9cc\uc6d0 \uc774\uc0c1\uc774\ub77c\uba74 \uc77c\ubc18\uacfc\uc138\uc790\ub97c \uac15\ud558\uac8c \uad8c\uc7a5\ud569\ub2c8\ub2e4." },
        { label: "\uac04\uc774\uacfc\uc138\uc790\uc758 \uc138\uae08\uacc4\uc0b0\uc11c \ubc1c\uae09 \ubd88\uac00", text: "\ub0a9\ud488\uc5c5\uccb4\xb7\uc720\ud1b5\uc5c5\uccb4\uc640 \uac70\ub798\ud560 \ub54c \uc138\uae08\uacc4\uc0b0\uc11c\ub97c \uc694\uad6c\ubc1b\uc73c\uba74 \uac04\uc774\uacfc\uc138\uc790\ub294 \ubc1c\uae09\uc774 \uc548 \ub429\ub2c8\ub2e4. B2B \ub0a9\ud488\uc774\ub098 \uae30\uc5c5 \uac70\ub798\uac00 \uc788\ub2e4\uba74 \ucc98\uc74c\ubd80\ud130 \uc77c\ubc18\uacfc\uc138\uc790\ub85c \ub4f1\ub85d\ud558\uc138\uc694." },
      ] : [
        { label: "VAT type change is only possible once a year, in January", text: "If you choose wrong at registration, you wait a full year to change. Strongly recommend General VAT if fit-out exceeds \u20A910M." },
        { label: "Simplified VAT cannot issue tax invoices", text: "If suppliers or corporate clients demand tax invoices, you can't provide them as a simplified VAT payer. Register as General VAT from the start if B2B matters." },
      ],
      links: ko ? [
        { text: "\uad6d\uc138\uccad \u2014 \uacfc\uc138\uc720\ud615 \uc120\ud0dd \uc548\ub0b4", href: "https://www.nts.go.kr" },
        { text: "\uad6d\uc138\uccad \uc138\ubb34\ub300\ub9ac\uc778(\uc138\ubb34\uc0ac) \uc870\ud68c", href: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2248" },
      ] : [
        { text: "NTS \u2014 VAT type guide", href: "https://www.nts.go.kr" },
        { text: "NTS \u2014 Find a tax accountant", href: "https://www.nts.go.kr" },
      ],
    };

    // ── Step 3: 영업신고·위생교육 (업종별 완전히 다름) ────────────
    const step3Food: RegStepData = {
      sections: [
        {
          label: ko ? "1\ub2e8\uacc4: \uc2dd\ud488\uc704\uc0dd\uad50\uc721 \uba3c\uc800 \uc774\uc218" : "Step A: Food hygiene education first",
          items: ko ? [
            { text: "\uad50\uc721 \uc2dc\uac04: \uc2e0\uaddc \uc601\uc5c5\uc790 6\uc2dc\uac04 (1\uc77c \uc774\uc218)", sub: "\uc628\ub77c\uc778 \uad50\uc721 \uac00\ub2a5 \uae30\uad00\ub3c4 \uc788\uc74c \u2014 \uac01 \uad50\uc721\uc6d0 \uc77c\uc815 \ud655\uc778" },
            { text: "\ube44\uc6a9: \uc57d 20,000~40,000\uc6d0", sub: "\uae30\uad00\ub9c8\ub2e4 \uc0c1\uc774 \u2014 \ud55c\uad6d\uc678\uc2dd\uc5c5\uc911\uc559\ud68c\xb7\uc2dd\ud488\uc704\uc0dd\uad50\uc721\uc6d0 \ub4f1" },
            { text: "\uc774\uc218\uc99d \ubc1c\uae09: \uad50\uc721 \ub2f9\uc77c \ub610\ub294 \ub2e4\uc74c\ub0a0", sub: "\uc774 \uc774\uc218\uc99d \uc5c6\uc774 \uc601\uc5c5\uc2e0\uace0 \uc811\uc218 \ubd88\uac00" },
          ] : [
            { text: "Duration: 6 hours for new operators (1 day)", sub: "Some institutions offer online options \u2014 check their schedules" },
            { text: "Cost: approx. \u20A920,000\u201340,000", sub: "Varies by institution \u2014 Korea Restaurant Association, Food Hygiene Education Center, etc." },
            { text: "Certificate issued same or next day", sub: "Cannot file operating notification without this certificate" },
          ],
        },
        {
          label: ko ? "2\ub2e8\uacc4: \uad00\ud560 \uad6c\uccad \uc704\uc0dd\uacfc \uc601\uc5c5\uc2e0\uace0" : "Step B: Operating notification at district office",
          items: ko ? [
            { text: "\ub2f4\ub2f9 \ubd80\uc11c: \uad00\ud560 \uad6c\uccad(\uc2dc\uccad) \uc704\uc0dd\uacfc \uc2dd\ud488\uc704\uc0dd\ud300", sub: "\uc815\ubd8024 \uc628\ub77c\uc778 \uc2e0\uccad\ub3c4 \uac00\ub2a5 (\ucc98\ub9ac 1~3 \uc601\uc5c5\uc77c)" },
            { text: "\uc900\ube44\ubb3c: \uad50\uc721\uc774\uc218\uc99d + \uc0ac\uc5c5\uc790\ub4f1\ub85d\uc99d + \uc784\ub300\ucc28\uacc4\uc57d\uc11c", sub: "\uc2dc\uc124 \ud3c9\uba74\ub3c4, \uc870\ub9ac \uae30\uad6c \ubaa9\ub85d\uc774 \ud544\uc694\ud55c \uad6c\uccad\ub3c4 \uc788\uc74c \u2014 \ubc29\ubb38 \uc804 \uc804\ud654 \ud655\uc778" },
            { text: "\uc601\uc5c5 \ud615\ud0dc \uc120\ud0dd (\uc911\uc694)", sub: "\uc77c\ubc18\uc74c\uc2dd\uc810: \uc8fc\ub958 \ud310\ub9e4 \uac00\ub2a5 / \ud734\uac8c\uc74c\uc2dd\uc810: \uc8fc\ub958 \ud310\ub9e4 \ubd88\uac00 \u2014 \ub9e5\uc8fc\xb7\uc640\uc778 \uacc4\ud68d\uc774 \uc788\uc73c\uba74 \ubc18\ub4dc\uc2dc \uc77c\ubc18\uc74c\uc2dd\uc810" },
            { text: "\ucc98\ub9ac \uae30\uac04: \uc811\uc218 \ub2f9\uc77c~3 \uc601\uc5c5\uc77c", sub: "\uc2e0\uace0 \uc218\ub9ac \uc804 \uc601\uc5c5 \uc2dc \uc601\uc5c5 \uc815\uc9c0 \ub610\ub294 \uacfc\ud0dc\ub8cc" },
          ] : [
            { text: "Where: district office health department", sub: "Gov.kr online application also available (1\u20133 business days)" },
            { text: "Bring: education cert + business cert + lease", sub: "Some districts also require floor plan and equipment list \u2014 call first" },
            { text: "Choose operating type (critical decision)", sub: "General restaurant: alcohol OK / Snack bar: no alcohol. Must be general restaurant if selling beer/wine." },
            { text: "Processing time: same day to 3 business days", sub: "Operating before acceptance = potential suspension or fine" },
          ],
        },
      ],
      traps: ko ? [
        { label: "\uc704\uc0dd\uad50\uc721 \uc5c6\uc774 \uc2e0\uace0 = 100% \ubc18\ub824", text: "\uad50\uc721\uc774\uc218\uc99d\uc740 \uc601\uc5c5\uc2e0\uace0\uc758 \uccab \ubc88\uc9f8 \ud544\uc218 \uc11c\ub958\uc785\ub2c8\ub2e4. \uc2e0\uace0 \ubc29\ubb38 \uc804\ub0a0 \uad50\uc721\uc744 \uc774\uc218\ud558\uba74 \uc774\uc218\uc99d\uc744 \ubc14\ub85c \uac00\uc838\uac08 \uc218 \uc788\uc2b5\ub2c8\ub2e4." },
        { label: "\ud734\uac8c\uc74c\uc2dd\uc810\uc73c\ub85c \uc798\ubabb \uc2e0\uace0\ud558\uba74 \uc8fc\ub958 \ud310\ub9e4 \uc704\ubc18", text: "\uc624\ud508 \ud6c4 \uc2e0\uace0 \ud615\ud0dc \ubcc0\uacbd\uc774 \uac00\ub2a5\ud558\uc9c0\ub9cc \ubcc0\uacbd \uc2e0\uace0 \uc804 \uc8fc\ub958\ub97c \ud314\uba74 \uc2dd\ud488\uc704\uc0dd\ubc95 \uc704\ubc18\uc785\ub2c8\ub2e4. \uc8fc\ub958 \ud310\ub9e4 \uacc4\ud68d\uc774 \uc870\uae08\uc774\ub77c\ub3c4 \uc788\uc73c\uba74 \ucc98\uc74c\ubd80\ud130 \uc77c\ubc18\uc74c\uc2dd\uc810\uc73c\ub85c \uc2e0\uace0\ud558\uc138\uc694." },
      ] : [
        { label: "No education cert = 100% rejection", text: "The certificate is the first mandatory document for operating notification. Complete training the day before your district office visit." },
        { label: "Wrong operating type = alcohol violation", text: "Selling alcohol after registering as a snack bar violates food sanitation law before you can amend the registration. Register as general restaurant from day one if you plan any alcohol sales." },
      ],
      links: ko ? [
        { text: "\uc2dd\ud488\uc548\uc804\ub098\ub77c \u2014 \uc704\uc0dd\uad50\uc721 \uae30\uad00 \uc870\ud68c", href: "https://www.foodsafetykorea.go.kr" },
        { text: "\uc815\ubd8024 \u2014 \uc74c\uc2dd\uc810 \uc601\uc5c5\uc2e0\uace0 \uc628\ub77c\uc778 \uc2e0\uccad", href: "https://www.gov.kr" },
      ] : [
        { text: "Food Safety Korea \u2014 hygiene education", href: "https://www.foodsafetykorea.go.kr" },
        { text: "Gov.kr \u2014 Restaurant notification (online)", href: "https://www.gov.kr" },
      ],
    };

    const step3Beauty: RegStepData = {
      sections: [
        {
          label: ko ? "\uba74\ud5c8\xb7\uc2dc\uc124 \uae30\uc900 \uc0ac\uc804 \ud655\uc778" : "License & facility requirements",
          items: ko ? [
            { text: "\ubbf8\uc6a9\uc0ac \uba74\ud5c8 \ubcf4\uc720\uc790 \ud544\uc218", sub: "\ub300\ud45c\uc790 \ubcf8\uc778 \ub610\ub294 \uace0\uc6a9 \uc9c1\uc6d0 1\uc778 \uc774\uc0c1 \u2014 \uba74\ud5c8 \uc5c6\uc774\ub294 \uc2e0\uace0 \uc790\uccb4 \ubd88\uac00" },
            { text: "\ubcf5\uc218 \uc11c\ube44\uc2a4 \uc2dc \uba74\ud5c8 \ubd84\ub958", sub: "\ud5e4\uc5b4 \u2192 \ubbf8\uc6a9\uc0ac / \ud53c\ubd80\uad00\ub9ac \u2192 \ud53c\ubd80\ubbf8\uc6a9\uc0ac / \ub124\uc77c \u2192 \ub124\uc77c\uc544\ud2b8\uc0ac \uc790\uaca9 \uac01\uac01 \ud544\uc694" },
            { text: "\uc2dc\uc124 \uae30\uc900: \uc138\uba74\ub300\xb7\uc18c\ub3c5\uae30\uad6c\xb7\uc870\uba85(150\ub8e9\uc2a4+)", sub: "\uad6c\uccad\ub9c8\ub2e4 \uae30\uc900\uc774 \uc870\uae08\uc529 \ub2e4\ub984 \u2014 \ubc29\ubb38 \uc804 \ud574\ub2f9 \ubcf4\uac74\uc18c \uc804\ud654 \ud655\uc778 \ud544\uc218" },
            { text: "\uc601\uc5c5\uc7a5 \ub3c4\uba74(\uc57d\uc2dd)", sub: "\uc138\uba74\ub300\xb7\uc2dc\uc220 \uc758\uc790 \uc704\uce58\uac00 \ud45c\uc2dc\ub41c \uac04\ub7b5\ud55c \uc2a4\ucf00\uce58\ub3c4 \uac00\ub2a5" },
          ] : [
            { text: "Licensed cosmetologist required", sub: "Owner's or employee's license \u2014 no license means no filing" },
            { text: "Multiple services = multiple licenses", sub: "Hair \u2192 cosmetologist / Skin \u2192 esthetician / Nail \u2192 nail artist \u2014 each required" },
            { text: "Facility: washbasin, sterilizer, lighting (150 lux+)", sub: "Standards vary by district \u2014 call local health center first" },
            { text: "Floor plan (sketch-level OK)", sub: "Show washbasin and chair positions" },
          ],
        },
        {
          label: ko ? "\ubcf4\uac74\uc18c\xb7\uad6c\uccad \uc704\uc0dd\uacfc \uc2e0\uace0 \uc808\ucc28" : "Filing procedure",
          items: ko ? [
            { text: "\uc2e0\uace0 \uae30\uad00: \uad00\ud560 \ubcf4\uac74\uc18c \ub610\ub294 \uad6c\uccad \uc704\uc0dd\uacfc", sub: "\uc815\ubd8024 \uc628\ub77c\uc778 \uc2e0\uccad\ub3c4 \uac00\ub2a5\ud558\ub098 \uccab \uc2e0\uace0\ub294 \ubc29\ubb38 \ucd94\ucc9c" },
            { text: "\uc900\ube44\ubb3c: \ubbf8\uc6a9\uc0ac \uba74\ud5c8\uc99d + \ub3c4\uba74 + \uc0ac\uc5c5\uc790\ub4f1\ub85d\uc99d + \uc784\ub300\ucc28\uacc4\uc57d\uc11c", sub: "\uba74\ud5c8\uc99d \ubcf5\uc0ac\ubcf8 \uac00\ub2a5, \uc6d0\ubcf8 \uc9c0\ucc38 \uad8c\uc7a5" },
            { text: "\ucc98\ub9ac \uae30\uac04: \uc811\uc218 \uc989\uc2dc~\ub2f9\uc77c", sub: "\uc2e0\uace0 \uc218\ub9ac\uc99d \ubc1b\uc740 \ud6c4 \uc601\uc5c5 \uc2dc\uc791 \uac00\ub2a5" },
          ] : [
            { text: "Where: local health center or district hygiene office", sub: "Gov.kr online filing available, but visit recommended for first filing" },
            { text: "Bring: license + floor plan + business cert + lease", sub: "Copies acceptable, but bring originals just in case" },
            { text: "Processing: same day", sub: "Can operate after receiving the acceptance notice" },
          ],
        },
      ],
      traps: ko ? [
        { label: "\uba74\ud5c8 \uc5c6\uc774 \uc601\uc5c5 = \uc989\uc2dc \ud3d0\uc1c4\xb7\ud615\uc0ac\ucc98\ubc8c", text: "\ubbf8\uc6a9\uc0ac \uba74\ud5c8 \uc5c6\uc774 \uc601\uc5c5\ud558\uba74 \uc989\uac01 \uc601\uc5c5 \ud3d0\uc1c4 \uba85\ub839\uc774 \ub0b4\ub824\uc9c0\uace0 \ud615\uc0ac\ucc98\ubc8c \ub300\uc0c1\uc774 \ub429\ub2c8\ub2e4. \ub300\ud45c\uc790 \uba74\ud5c8\uac00 \uc5c6\uc73c\uba74 \uba74\ud5c8 \uc788\ub294 \uc9c1\uc6d0 \ucc44\uc6a9 \ud6c4 \uc2e0\uace0\ud558\uc138\uc694." },
        { label: "\uad6c\uccad\ub9c8\ub2e4 \ub2e4\ub978 \uc2dc\uc124 \uae30\uc900", text: "\uc5b4\ub5a4 \uad6c\uccad\uc740 \uc138\uba74\ub300 \uc218, \ub2e4\ub978 \uad6c\uccad\uc740 \ub3c5\ub9bd \ud0c8\uc758 \uacf5\uac04\uc744 \uc694\uad6c\ud569\ub2c8\ub2e4. \uc778\ud14c\ub9ac\uc5b4 \ucc29\uacf5 \uc804\uc5d0 \uad00\ud560 \ubcf4\uac74\uc18c\uc5d0 \uc804\ud654\ub85c \uad6c\uccb4\uc801\uc778 \uae30\uc900\uc744 \ud655\uc778\ud558\uba74 \uacf5\uc0ac \ube44\uc6a9 \ub0ad\ube44\ub97c \ub9c9\uc744 \uc218 \uc788\uc2b5\ub2c8\ub2e4." },
      ] : [
        { label: "No license = immediate closure + criminal liability", text: "Operating a salon without a licensed cosmetologist triggers immediate closure orders and criminal prosecution. Hire a licensed employee before filing if you lack one." },
        { label: "Facility standards differ by district", text: "Some districts require specific washbasin counts, others need a separate dressing area. Confirm exact requirements with your local health center before construction." },
      ],
      links: ko ? [
        { text: "\ubcf4\uac74\ubcf5\uc9c0\ubd80 \u2014 \ubbf8\uc6a9\uc5c5 \uc2e0\uace0 \uc548\ub0b4", href: "https://www.mohw.go.kr" },
        { text: "\uc815\ubd8024 \u2014 \ubbf8\uc6a9\uc5c5 \uc2e0\uace0 \uc628\ub77c\uc778", href: "https://www.gov.kr" },
      ] : [
        { text: "MOHW \u2014 Cosmetology business guide", href: "https://www.mohw.go.kr" },
        { text: "Gov.kr \u2014 Cosmetology filing (online)", href: "https://www.gov.kr" },
      ],
    };

    const step3Fitness: RegStepData = {
      sections: [
        {
          label: ko ? "\uc2e0\uace0\uc81c vs \ud5c8\uac00\uc81c \ubd84\uae30" : "Notification vs permit",
          items: ko ? [
            { text: "\uc2e0\uace0\uc81c (\ucc98\ub9ac \uc989\uc2dc~3\uc77c): \uc77c\ubc18 \ud5ec\uc2a4\uc7a5(\uccb4\ub825\ub2e8\ub828\uc7a5), \uc218\uc601\uc7a5(50\u33a1+), \uace8\ud504\uc5f0\uc2b5\uc7a5 \ub4f1", sub: "\uad00\ud560 \uad6c\uccad \uccb4\uc721 \ub2f4\ub2f9\uacfc\uc5d0 \uc2e0\uace0\uc11c \uc81c\ucd9c\ub9cc\uc73c\ub85c \uc601\uc5c5 \uac00\ub2a5" },
            { text: "\ud5c8\uac00\uc81c (\ucc98\ub9ac 2~4\uc8fc): \ubb34\ub3c4\uc7a5 \u2014 \ud0dc\uad8c\ub3c4\xb7\uc720\ub3c4\xb7\ud569\uae30\ub3c4\xb7\uad8c\ud22c\xb7\uc528\ub984 \ub4f1", sub: "\ud5c8\uac00 \uc2ec\uc0ac\uac00 \uc788\uc5b4 \ucc98\ub9ac \uae30\uac04\uc774 \ud6e8\uc52c \uae38 \uc218 \uc788\uc74c \u2014 \uc624\ud508 2\uac1c\uc6d4 \uc804\ubd80\ud130 \uc900\ube44" },
            { text: "\uc2dc\uc124 \uae30\uc900: \uccb4\ub825\ub2e8\ub828\uc7a5 \ucd5c\uc18c \uba74\uc801 \uad8c\uc7a5 45\u33a1+", sub: "1\uc778 PT \uc2a4\ud29c\ub514\uc624\ub294 \uc18c\ud615\uc774\uc5b4\ub3c4 \uac00\ub2a5\ud55c \uacbd\uc6b0 \uc788\uc74c \u2014 \uad00\ud560 \uad6c\uccad \uc0ac\uc804 \ud655\uc778 \ud544\uc218" },
          ] : [
            { text: "Notification (same day\u20133 days): general gym, pool (50\u33a1+), golf practice range", sub: "Filing at local sports authority is sufficient" },
            { text: "Permit required (2\u20134 weeks): martial arts \u2014 taekwondo, judo, boxing, etc.", sub: "Review process takes much longer \u2014 start 2 months before planned opening" },
            { text: "Facility: minimum 45\u33a1 recommended for fitness centers", sub: "Small PT studios may still qualify \u2014 confirm with district office first" },
          ],
        },
        {
          label: ko ? "\uc2e0\uace0\xb7\ud5c8\uac00 \uc808\ucc28" : "Filing procedure",
          items: ko ? [
            { text: "\ub2f4\ub2f9 \uae30\uad00: \uad00\ud560 \uc2dc\xb7\uad70\xb7\uad6c\uccad \uccb4\uc721 \ub2f4\ub2f9\uacfc", sub: "\ubb38\ud654\uccb4\uc721\uad00\uad11\ubd80 \uc18c\uad00 \uc2dc\uc124 \u2014 \uc704\uc0dd\uacfc\uac00 \uc544\ub2cc \uccb4\uc721 \ub2f4\ub2f9 \ucc3d\uad6c \ubc29\ubb38" },
            { text: "\uc900\ube44\ubb3c: \uc0ac\uc5c5\uc790\ub4f1\ub85d\uc99d + \uc2dc\uc124 \ub3c4\uba74(\uba74\uc801 \uba85\uc2dc) + \uc784\ub300\ucc28\uacc4\uc57d\uc11c", sub: "\ud5c8\uac00\uc81c\ub294 \uc2dc\uc124 \uae30\uc900 \ud655\uc778\uc11c\xb7\uc548\uc804 \uad00\ub828 \uc11c\ub958 \ucd94\uac00 \ud544\uc694" },
            { text: "\uac15\uc0ac \uc790\uaca9 \uc694\uac74 \ud655\uc778", sub: "\uc0dd\ud65c\uc2a4\ud3ec\uce20\uc9c0\ub3c4\uc0ac \uc790\uaca9\uc99d \ub4f1 \u2014 \uc885\ubaa9\xb7\uaddc\ubaa8\uc5d0 \ub530\ub77c \uc758\ubb34 \uc720\ubb34 \uc0c1\uc774, \uccb4\uc721 \ub2f4\ub2f9\uacfc\uc5d0 \ud655\uc778" },
          ] : [
            { text: "Where: local sports authority (not health department)", sub: "Ministry of Culture, Sports and Tourism oversight \u2014 go to the sports division counter" },
            { text: "Bring: business cert + floor plan (area labeled) + lease", sub: "Permit applications require additional safety and facility standard documents" },
            { text: "Check instructor qualification requirements", sub: "Sports instructor certificate may be mandatory depending on sport and scale \u2014 confirm with district" },
          ],
        },
      ],
      traps: ko ? [
        { label: "\ubb34\ub3c4 \uc885\ubaa9 \ud5c8\uac00\uc81c \u2014 \uc624\ud508\uc77c 2\uac1c\uc6d4 \uc804 \uc2dc\uc791\ud574\uc57c", text: "\ud0dc\uad8c\ub3c4\xb7\uc720\ub3c4\xb7\ud569\uae30\ub3c4 \ub4f1 \ubb34\ub3c4 \uc885\ubaa9\uc740 \ud5c8\uac00\uc81c\ub85c, \uc11c\ub958 \uc2ec\uc0ac\uc640 \ud604\uc7a5 \uac80\uc0ac\uac00 \uc788\uc2b5\ub2c8\ub2e4. \uc900\ube44\uac00 \ub2a6\uc5b4\uc9c0\uba74 \uc778\ud14c\ub9ac\uc5b4 \uc644\uacf5 \ud6c4\uc5d0\ub3c4 \uc601\uc5c5\uc744 \ubabb \ud558\ub294 \uc0c1\ud669\uc774 \uc0dd\uae41\ub2c8\ub2e4." },
        { label: "\uc18c\ud615 PT \uc2a4\ud29c\ub514\uc624 \uba74\uc801 \uae30\uc900 \ud568\uc815", text: "\uc77c\ubd80 \uad6c\uccad\uc5d0\uc11c \uccb4\ub825\ub2e8\ub828\uc7a5 \uae30\uc900\uc73c\ub85c \ucd5c\uc18c \uba74\uc801\uc744 \uc694\uad6c\ud569\ub2c8\ub2e4. 18~25\ud3c9 \uc774\ud558 \uc18c\ud615 \uacf5\uac04\uc774\ub77c\uba74 \ucc29\uacf5 \uc804\uc5d0 \uad00\ud560 \uad6c\uccad\uc5d0 \uc804\ud654\ub85c \uc601\uc5c5 \uac00\ub2a5 \uc5ec\ubd80\ub97c \uaf2d \ud655\uc778\ud558\uc138\uc694." },
      ] : [
        { label: "Martial arts permit \u2014 start 2 months before opening", text: "The permit process for martial arts dojangs includes document review and on-site inspection. Late starts can leave you with a finished fit-out and no operating approval." },
        { label: "Small PT studio area requirement trap", text: "Some districts enforce a minimum floor area for fitness centers. If your space is under 60\u201380\u33a1, call the district sports office before construction to confirm operating eligibility." },
      ],
      links: ko ? [
        { text: "\ubb38\ud654\uccb4\uc721\uad00\uad11\ubd80 \u2014 \uccb4\uc721\uc2dc\uc124\uc5c5 \uc548\ub0b4", href: "https://www.mcst.go.kr" },
        { text: "\uc815\ubd8024 \u2014 \uccb4\uc721\uc2dc\uc124 \uc2e0\uace0 \uc628\ub77c\uc778", href: "https://www.gov.kr" },
      ] : [
        { text: "MCST \u2014 Sports facility business guide", href: "https://www.mcst.go.kr" },
        { text: "Gov.kr \u2014 Sports facility filing (online)", href: "https://www.gov.kr" },
      ],
    };

    const step3 = cat === "beauty" ? step3Beauty : cat === "fitness" ? step3Fitness : step3Food;

    // ── Step 4: 카드가맹·POS·현금영수증 ──────────────────────────
    const step4: RegStepData = {
      sections: [
        {
          label: ko ? "\uce74\ub4dc\uac00\ub9f9 \ubc29\ubc95 \uc120\ud0dd" : "Card merchant registration",
          items: ko ? [
            { text: "PG\uc0ac(\uacb0\uc81c \ub300\ud589) \u2014 \uc18c\uaddc\ubaa8 \ucc3d\uc5c5\uc790 \uae30\ubcf8 \ucd94\ucc9c", sub: "\ud1a0\uc2a4\ud398\uc774\uba3c\uce20\xb7KCP\xb7\ub098\uc774\uc2a4\ud398\uc774\uba3c\uce20 \ub4f1 / \uc628\ub77c\uc778 \uc2e0\uccad 3~5 \uc601\uc5c5\uc77c / \ub2e8\ub9d0\uae30 \ubcc4\ub3c4 \uad6c\ub9e4 \ub610\ub294 \uc784\ub300" },
            { text: "\uc740\ud589 \uc9c1\uc811 \uac00\ub9f9", sub: "\uc2e0\ud55c\xb7\uad6d\ubbfc\xb7\ud558\ub098 \ub4f1 \uac70\ub798 \uc740\ud589 \ubc29\ubb38 / \ub2e8\ub9d0\uae30 \uc124\uce58\uae4c\uc9c0 1~2\uc8fc / \uc815\uc0b0 \uc8fc\uae30\uac00 PG\ubcf4\ub2e4 \ube60\ub978 \uacbd\uc6b0 \uc788\uc74c" },
            { text: "\uac04\ud3b8\uacb0\uc81c \ucd94\uac00 (\uc120\ud0dd)", sub: "\uce74\uce74\uc624\ud398\uc774\xb7\ub124\uc774\ubc84\ud398\uc774\xb7\uc81c\ub85c\ud398\uc774 \u2014 \uce74\ub4dc\uac00\ub9f9 \ubcf4\uc644\uc6a9\uc73c\ub85c \ucd94\uac00 \uc124\uc815, QR \ubc29\uc2dd" },
          ] : [
            { text: "PG company \u2014 recommended for new small businesses", sub: "Toss Payments, KCP, NicePay, etc. / Online application, 3\u20135 days / Separate terminal purchase or rental" },
            { text: "Direct bank merchant", sub: "Visit your bank branch / Terminal setup takes 1\u20132 weeks / Sometimes faster settlement" },
            { text: "Mobile payment (optional add-on)", sub: "KakaoPay, NaverPay, ZeroPay \u2014 supplement card payments, QR-based" },
          ],
        },
        {
          label: ko ? "\ud604\uae08\uc601\uc218\uc99d \uac00\ub9f9 (\uc758\ubb34 \ud655\uc778)" : "Cash receipt registration",
          items: ko ? [
            { text: "\uc758\ubb34 \ub300\uc0c1: \uc5f0 \ub9e4\ucd9c 2,400\ub9cc\uc6d0 \uc774\uc0c1 \u2014 \uc74c\uc2dd\uc810\xb7\ubbf8\uc6a9\uc2e4\xb7\ud5ec\uc2a4\uc7a5 \ub4f1 \ud3ec\ud568", sub: "\uac1c\uc5c5 \ucd08\uae30\uc5d0\ub3c4 \uc608\uc0c1 \ub9e4\ucd9c\uc774 \uc774 \uae30\uc900\uc744 \ub118\uc73c\uba74 \uc758\ubb34 \ub4f1\ub85d \ub300\uc0c1" },
            { text: "\ub4f1\ub85d \ubc29\ubc95: \ud648\ud0dd\uc2a4 \u2192 \ud604\uae08\uc601\uc218\uc99d \u2192 \uac00\ub9f9\uc810 \uc2e0\uccad (\ubb34\ub8cc, \uc989\uc2dc)", sub: "\ucc98\ub9ac 1 \uc601\uc5c5\uc77c \uc774\ub0b4" },
            { text: "\uc18c\ube44\uc790 \ubc88\ud638 \uc5c6\uc73c\uba74 \uc790\uc9c4 \ubc1c\uae09 \ubc88\ud638: 010-000-1234", sub: "\uad6d\uc138\uccad \uc9c0\uc815 \ubc88\ud638\ub85c \uc790\uc9c4 \ubc1c\uae09\ud558\uba74 \uc758\ubb34 \uc774\ud589 \uc778\uc815" },
          ] : [
            { text: "Mandatory for: annual revenue \u2265 \u20A924M \u2014 restaurants, salons, gyms included", sub: "Even in the early months, register if you expect to reach this threshold" },
            { text: "How to register: Hometax \u2192 Cash receipt \u2192 Merchant application (free, instant)", sub: "Processed within 1 business day" },
            { text: "If customer has no number: issue to 010-000-1234", sub: "This NTS-designated number counts as voluntary issuance and satisfies the obligation" },
          ],
        },
        {
          label: ko ? "POS \uc624\ud508 \uc804 \uc644\uc131 \uccb4\ud06c" : "POS pre-opening checklist",
          items: ko ? [
            { text: "\uba54\ub274\xb7\uac00\uaca9 \uc804\uccb4 \ub4f1\ub85d \uc644\ub8cc", sub: "\ubc30\ub2ec\uc571 \uba54\ub274\uc640 \ub9e4\uc7a5 \uba54\ub274 \uc77c\uce58 \uc5ec\ubd80\ub3c4 \ud568\uaed8 \ud655\uc778" },
            { text: "\uc601\uc218\uc99d \ucd9c\ub825 \ud655\uc778: \uc0c1\ud638\uba85\xb7\uc0ac\uc5c5\uc790\ubc88\ud638\xb7\ubd80\uac00\uc138 \ud56d\ubaa9 \uc815\ud655\ud55c\uc9c0", sub: "\uc138\uae08\uacc4\uc0b0\uc11c \ubc1c\ud589 \uae30\uc900 \uc815\ubcf4\uac00 \uc5ec\uae30\uc11c \ub098\uc634" },
            { text: "\uc2e4\uacb0\uc81c \ud14c\uc2a4\ud2b8 \ud6c4 \uc989\uc2dc \ucde8\uc18c", sub: "\uc624\ud508 \uc804\ub0a0 \uc644\ub8cc \uad8c\uc7a5 \u2014 \ud14c\uc2a4\ud2b8 \ucde8\uc18c \uc548 \ud558\uba74 \uc815\uc0b0 \uc624\ub958 \ubc1c\uc0dd" },
            { text: "\ubc30\ub2ec\uc571 POS \uc5f0\ub3d9 \uc124\uc815 \ud655\uc778", sub: "\ubc30\ubbfc\xb7\ucfe0\ud321\uc774\uce20 \uc8fc\ubb38\uc774 POS\uc5d0 \uc790\ub3d9 \uc218\uc2e0\ub418\ub294\uc9c0 \ud14c\uc2a4\ud2b8" },
          ] : [
            { text: "All menu items and prices entered", sub: "Cross-check delivery app menu vs dine-in menu for consistency" },
            { text: "Receipt printout check: business name, tax ID, VAT line accurate", sub: "This data is the basis for tax invoice issuance" },
            { text: "Run a real test transaction and cancel immediately", sub: "Ideally the day before opening \u2014 uncanceled test = settlement error" },
            { text: "Delivery app POS integration test", sub: "Confirm Baemin and Coupang Eats orders arrive automatically in POS" },
          ],
        },
      ],
      traps: ko ? [
        { label: "\ud604\uae08\uc601\uc218\uc99d \ubbf8\uac00\ub9f9 = \ubbf8\ubc1c\uae09 \uae08\uc561\uc758 20% \uacfc\ud0dc\ub8cc", text: "\uc758\ubb34 \ubc1c\uae09 \ub300\uc0c1 \uc5c5\uc885\uc5d0\uc11c \uc18c\ube44\uc790 \uc694\uccad\uc5d0\ub3c4 \ud604\uae08\uc601\uc218\uc99d\uc744 \ubc1c\uae09\ud558\uc9c0 \uc54a\uc73c\uba74 \ubbf8\ubc1c\uae09 \uae08\uc561\uc758 20%\uac00 \uac00\uc0b0\uc138\ub85c \ubd80\uacfc\ub429\ub2c8\ub2e4. \uac1c\uc5c5 \ub2f9\uc77c \ud648\ud0dd\uc2a4\uc5d0\uc11c \uac00\ub9f9 \uc2e0\uccad\uc744 \uc644\ub8cc\ud558\uc138\uc694." },
        { label: "POS\uc640 \uce74\ub4dc\ub2e8\ub9d0\uae30 \ud638\ud658\uc131 \ubbf8\ud655\uc778", text: "POS\uc640 \uce74\ub4dc\ub2e8\ub9d0\uae30\ub97c \ub530\ub85c \uad6c\ub9e4\ud558\uba74 \uc5f0\ub3d9\uc774 \uc548 \ub418\ub294 \uacbd\uc6b0\uac00 \uc788\uc2b5\ub2c8\ub2e4. \ud1b5\ud569 POS \uc194\ub8e8\uc158\uc744 \uc120\ud0dd\ud558\uac70\ub098 \uad6c\ub9e4 \uc804 \ubc18\ub4dc\uc2dc \uacf5\uae09\uc0ac\uc5d0 \ud638\ud658\uc131\uc744 \ud655\uc778\ud558\uc138\uc694." },
      ] : [
        { label: "Unregistered cash receipt merchant: 20% surcharge", text: "Failing to issue a cash receipt despite a customer request triggers a 20% penalty on the unissued amount. Complete the Hometax merchant registration on opening day." },
        { label: "POS and terminal incompatibility", text: "Buying POS and card terminal from different vendors can result in incompatibility. Choose an integrated POS solution or confirm compatibility with vendors before purchase." },
      ],
      links: ko ? [
        { text: "\uc5ec\uc2e0\uae08\uc735\ud611\ud68c \u2014 \uce74\ub4dc\uac00\ub9f9\uc810 \uc2e0\uccad", href: "https://www.cardsales.or.kr" },
        { text: "\ud648\ud0dd\uc2a4 \u2014 \ud604\uae08\uc601\uc218\uc99d \uac00\ub9f9 \uc2e0\uccad", href: "https://www.hometax.go.kr" },
        { text: "\ud1a0\uc2a4\ud398\uc774\uba3c\uce20 \u2014 \uc0ac\uc5c5\uc790 \uac00\ub9f9 \uc2e0\uccad", href: "https://www.tosspayments.com" },
      ] : [
        { text: "Korea Card Consortium \u2014 merchant application", href: "https://www.cardsales.or.kr" },
        { text: "Hometax \u2014 cash receipt merchant", href: "https://www.hometax.go.kr" },
        { text: "Toss Payments \u2014 merchant sign-up", href: "https://www.tosspayments.com" },
      ],
    };

    const stepDataMap: Record<number, RegStepData> = { 1: step1, 2: step2, 3: step3, 4: step4 };
    const step = stepDataMap[guideStepIndex];
    if (!step) return null;

    const sectionLabelStyle = {
      fontSize: "11px",
      fontWeight: 700 as const,
      letterSpacing: "0.07em",
      textTransform: "uppercase" as const,
      color: "var(--muted)",
      marginBottom: "6px",
    };
    const itemDotStyle = {
      width: "4px", height: "4px", borderRadius: "50%",
      background: "rgba(17,17,17,0.3)", flexShrink: 0, marginTop: "7px",
    };

    return (
      <div style={{ display: "grid", gap: "14px", marginTop: "2px" }}>

        {/* sections */}
        {step.sections.map((sec) => (
          <div key={sec.label}>
            <div style={sectionLabelStyle}>{sec.label}</div>
            <div style={{ display: "grid", gap: "7px" }}>
              {sec.items.map((item) => (
                <div key={item.text} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <div style={itemDotStyle} />
                  <div>
                    <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--primary)", fontWeight: 500 }}>{item.text}</div>
                    {item.sub && (
                      <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted)", marginTop: "1px" }}>{item.sub}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* traps */}
        {step.traps.length > 0 && (
          <div style={{ display: "grid", gap: "6px" }}>
            {step.traps.map((trap) => (
              <div key={trap.label} style={{ display: "grid", gap: "3px", padding: "11px 13px", borderRadius: "13px", background: "rgba(220,60,30,0.05)", border: "1px solid rgba(200,60,30,0.13)" }}>
                <div style={{ fontSize: "12px", fontWeight: 640, color: "#b83020" }}>\u26a0 {trap.label}</div>
                <div style={{ fontSize: "12px", lineHeight: 1.6, color: "var(--muted)" }}>{trap.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* links */}
        {step.links.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "10px" }}>
            {step.links.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--accent)", textDecoration: "none", fontWeight: 500, padding: "6px 12px", borderRadius: "999px", background: "rgba(0,100,220,0.06)", border: "1px solid rgba(0,100,220,0.12)" }}>
                <span style={{ opacity: 0.7, fontSize: "11px" }}>\u2197</span>
                {link.text}
              </a>
            ))}
          </div>
        )}

      </div>
    );
  })();


  return (
    <div style={styles.guideCard}>
      {/* pager */}
      <div style={styles.guidePager}>
        <span style={styles.guidePagerLabel}>
          {isOverview
            ? (language === "ko" ? "\uac1c\uc694" : "Overview")
            : `${guideStepIndex} / ${steps.length}`}
        </span>
        <div style={styles.guideDots}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              onClick={() => setGuideStepIndex(i)}
              style={{
                width: i === guideStepIndex ? "20px" : "6px",
                height: "6px",
                borderRadius: "100px",
                background: i === guideStepIndex ? "var(--primary)" : "rgba(17,17,17,0.15)",
                cursor: "pointer",
                transition: "width 0.2s ease"
              }}
            />
          ))}
        </div>
      </div>

      {isOverview ? (
        <>
          <div style={styles.guideOverline}>
            {language === "ko" ? "\uc774 \ub2e8\uacc4\uc5d0\uc11c \ud560 \uc77c" : "What to do"}
          </div>
          <p style={styles.guideHeadline}>{stageGuideContent.summary}</p>
          {stageGuideContent.whyNow && (
            <p style={styles.guideBody}>{stageGuideContent.whyNow}</p>
          )}
          {(stageGuideContent.costRange || stageGuideContent.timeEstimate) && (
            <div style={styles.guideMetaRow}>
              {stageGuideContent.costRange && (
                <span style={styles.guideMetaChip}>
                  {language === "ko" ? "\ube44\uc6a9 " : "Cost "}{stageGuideContent.costRange}
                </span>
              )}
              {stageGuideContent.timeEstimate && (
                <span style={styles.guideMetaChip}>
                  {language === "ko" ? "\uae30\uac04 " : "Time "}{stageGuideContent.timeEstimate}
                </span>
              )}
            </div>
          )}
          {stageGuideContent.warnings.map((w, i) => (
            <div
              key={i}
              style={{
                ...styles.guideWarningItem,
                background: w.level === "danger"
                  ? "rgba(220,0,0,0.05)"
                  : w.level === "info"
                    ? "rgba(0,100,220,0.05)"
                    : "rgba(255,160,0,0.07)",
                color: w.level === "danger" ? "#8a1a1a" : w.level === "info" ? "#1a3a6a" : "#7a5500"
              }}
            >
              {w.text}
            </div>
          ))}
        </>
      ) : currentStep ? (
        <>
          <div style={styles.guideOverline}>
            {language === "ko" ? `${guideStepIndex}\ub2e8\uacc4` : `Step ${guideStepIndex}`}
          </div>
          <div style={styles.guideHeadline}>{currentStep.action}</div>
          {currentStep.detail && (
            <p style={styles.guideBody}>{currentStep.detail}</p>
          )}
          {currentStep.url && (
            <a
              href={currentStep.url}
              target="_blank"
              rel="noreferrer"
              style={styles.guideLinkButton}
            >
              {language === "ko" ? "\ubc14\ub85c\uac00\uae30 \u2192" : "Open \u2192"}
            </a>
          )}
          {currentStep.options && currentStep.options.length > 0 && (() => {
            const selectionKey = `${currentStage.stageId}_step${guideStepIndex}`;
            const selected = guideSelections[selectionKey];
            return (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const, margin: "4px 0 8px" }}>
                {currentStep.options!.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setGuideSelections(prev => ({ ...prev, [selectionKey]: opt }))}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "100px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: selected === opt
                        ? "2px solid var(--primary)"
                        : "1.5px solid rgba(17,17,17,0.15)",
                      background: selected === opt
                        ? "var(--primary)"
                        : "rgba(255,255,255,0.8)",
                      color: selected === opt ? "white" : "var(--text)",
                    }}
                  >
                    {selected === opt ? "\u2713 " : ""}{opt}
                  </button>
                ))}
              </div>
            );
          })()}
          {currentStep.tip && (
            <div style={styles.guideTip}>\ud83d\udca1 {currentStep.tip}</div>
          )}
          {currentStep.cost && (
            <span style={styles.guideCostBadge}>{currentStep.cost}</span>
          )}
        </>
      ) : null}

      {vendorEl}
      {registrationSetupEl}

      {/* card nav -- unified style */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 0" }}>
        <button type="button" disabled={guideStepIndex === 0} onClick={() => setGuideStepIndex(i => Math.max(0, i - 1))} style={{
          padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(5,97,252,0.1)",
          background: guideStepIndex === 0 ? "rgba(0,0,0,0.02)" : "white",
          color: guideStepIndex === 0 ? "rgba(0,0,0,0.2)" : "#0f172a",
          fontSize: "13px", fontWeight: 600, cursor: guideStepIndex === 0 ? "default" : "pointer",
        }}>
          \u2190 {language === "ko" ? "\uc774\uc804" : "Prev"}
        </button>
        <div style={{ display: "flex", gap: "6px" }}>
          {Array.from({ length: totalSlides }, (_, i) => (
            <div key={i} onClick={() => setGuideStepIndex(i)} style={{
              width: i === guideStepIndex ? "20px" : "8px", height: "8px", borderRadius: "100px",
              background: i === guideStepIndex ? "#0561fc" : "rgba(0,0,0,0.1)",
              cursor: "pointer", transition: "all 0.2s ease",
            }} />
          ))}
        </div>
        <button type="button" disabled={guideStepIndex >= totalSlides - 1} onClick={() => setGuideStepIndex(i => Math.min(totalSlides - 1, i + 1))} style={{
          padding: "10px 18px", borderRadius: "10px", border: "none",
          background: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.02)" : "#0561fc",
          color: guideStepIndex >= totalSlides - 1 ? "rgba(0,0,0,0.2)" : "#fff",
          fontSize: "13px", fontWeight: 600, cursor: guideStepIndex >= totalSlides - 1 ? "default" : "pointer",
          boxShadow: guideStepIndex >= totalSlides - 1 ? "none" : "0 4px 14px rgba(5,97,252,0.25)",
        }}>
          {language === "ko" ? "\ub2e4\uc74c" : "Next"} \u2192
        </button>
      </div>
    </div>
  );
}
