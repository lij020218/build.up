"use client";

import { useRef, useState } from "react";
import {
  // food
  UtensilsCrossed, Bike, Salad, Soup, Drumstick, Pizza,
  // cafe
  Coffee, Cake, Croissant, IceCream, CupSoda,
  // retail
  Store, ShoppingBag, SprayCan, Shirt, Apple, ShoppingCart,
  // beauty
  Scissors, Sparkles, Droplets, Eye, Palette, Hand, ShowerHead,
  // fitness — 사장님 audit 2026-05-09: 골프=Flag(핀), 요가=Sun(선예배), 필라테스=PersonStanding
  Dumbbell, PersonStanding, Flame, Timer, Sun, Flag,
  // education
  BookOpen, School, GraduationCap, Languages, Code, Library, Armchair,
  // pet — Coffee/Scissors/GraduationCap 중복 해소: PawPrint·ShowerHead·Award
  Bone, Bed, MapPin, PawPrint, Award,
  // living
  WashingMachine, Brush, Wrench, Printer, Smartphone, Coins,
  // space
  Home, Camera, PartyPopper, Building2, Music,
  // online — ShoppingCart 중복 해소: Truck (위탁배송)
  Monitor, Download, Video, Mail, Globe, Truck,
  // startup — Cpu 중복 해소: AI=Brain(두뇌 메타포), 반도체=Cpu 유지
  Brain, Cpu, Code2, LayoutDashboard, DollarSign, HeartPulse, Shield,
  // startup — hardware / deeptech
  CircuitBoard, Bot, Microscope, Leaf,
  type LucideIcon,
} from "lucide-react";
import { useDashboardCtx } from "../../../contexts/DashboardContext";
import { styles } from "../../../styles";
import { StageWrapup } from "../shared/StageWrapup";
import { KeyActionHero } from "../shared/StageActionHero";
import { getSpecialtyOptions } from "./specialty-data";
import {
  localizeRecommendationItem,
  localizeStarterIndustryCategory,
  starterIndustryCategories,
  starterIndustryOptions,
} from "@foundone/shared";

/**
 * 업종별 아이콘 매핑.
 *  - 모든 아이콘은 lucide-react (SF Symbols 계열 라인 아이콘) 으로 통일.
 *  - 각 ID 는 그 업종의 실물 메타포를 명확히 떠올리는 아이콘으로 매칭.
 *  - 한 아이콘이 두 업종에 중복되지 않도록 주의 (이전엔 makeup-bridal 이 skin-care-room 과 동일 path 였음).
 */
const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  // ── 외식업 (음식) ──
  "korean-casual": UtensilsCrossed,        // 수저
  "delivery-meals": Bike,                  // 배달 자전거
  "salad-healthy": Salad,                  // 샐러드
  "ramen-noodle": Soup,                    // 라면/국밥
  "chicken-burger": Drumstick,             // 치킨 다리
  "western-pasta-brunch": Pizza,           // 양식 (피자/이탈리안 대표)
  // ── 카페/디저트 ──
  "takeout-coffee": Coffee,                // 테이크아웃 커피
  "specialty-coffee": Coffee,              // 스페셜티 (Coffee 으로 충분, 컬러로 구분)
  "dessert-cafe": Cake,                    // 디저트 케이크
  "bakery-studio": Croissant,              // 베이커리 크루아상
  "icecream-bingsu": IceCream,             // 빙수/아이스크림
  "self-serve-cafe": CupSoda,              // 셀프서브 음료
  // ── 소매업 ──
  "convenience-small": Store,              // 편의점
  "lifestyle-goods": ShoppingBag,          // 라이프스타일 잡화
  "beauty-supplies": SprayCan,             // 뷰티용품
  "fashion-accessories": Shirt,            // 패션
  "health-food-store": Apple,              // 건강식품
  "unmanned-retail": ShoppingCart,         // 무인매장 카트
  // ── 뷰티 ──
  "hair-salon": Scissors,                  // 미용실 가위
  "nail-studio": Hand,                     // 네일은 손
  "skin-care-room": Droplets,              // 피부관리 (수분/케어)
  "waxing-studio": Sparkles,               // 왁싱 (매끈한 표현)
  "eyelash-brow": Eye,                     // 속눈썹/눈썹 = 눈
  "makeup-bridal": Palette,                // 메이크업 팔레트
  // ── 피트니스 ── (2026-05-09 audit: 골프·요가·필라테스 매칭 정확화)
  "pilates-studio": PersonStanding,        // 필라테스 = 자세 운동 (사람 서있는 자세)
  "pt-gym": Dumbbell,                      // PT 덤벨
  "yoga-studio": Sun,                      // 요가 = sun salutation·정신 — 가장 인지도 높은 메타포
  "crossfit-box": Flame,                   // 크로스핏 강도
  "golf-studio": Flag,                     // 골프 = 홀의 핀 (Target 보다 직관)
  "unmanned-fitness": Timer,               // 24시간 무인
  // ── 교육 ──
  "study-room": BookOpen,                  // 독서실
  "kids-academy": School,                  // 어린이 학원
  "adult-class": GraduationCap,            // 성인 학습
  "language-academy": Languages,           // 어학
  "coding-class": Code,                    // 코딩
  "small-study-room": Library,             // 작은 독서실/스터디
  // ── 반려동물 ── (2026-05-09 audit: 중복 해소 — Scissors·Coffee·GraduationCap 분리)
  "pet-grooming": ShowerHead,              // 펫 미용·관리 (목욕·관리 메타포)
  "pet-supplies": Bone,                    // 펫 용품
  "pet-hotel": Bed,                        // 펫 호텔
  "pet-cafe": PawPrint,                    // 펫 카페 (발자국 — Coffee 중복 해소)
  "pet-training-school": Award,            // 훈련소 (성취 메타포)
  // ── 생활 서비스 ──
  "laundry-service": WashingMachine,       // 세탁
  "cleaning-service": Brush,               // 청소 빗자루
  "repair-service": Wrench,                // 수리 렌치
  "self-laundry": Coins,                   // 코인세탁
  "print-copy": Printer,                   // 인쇄
  "device-repair": Smartphone,             // 휴대폰 수리
  // ── 공간/숙박 ──
  "guesthouse": Home,                      // 게스트하우스
  "rental-studio": Camera,                 // 렌탈 스튜디오
  "party-room": PartyPopper,               // 파티룸
  "study-cafe-space": Armchair,            // 스터디카페 공간 (편안한 의자 — BookOpen 중복 해소)
  "shared-office": Building2,              // 공유 오피스
  "practice-room": Music,                  // 연습실
  // ── 온라인/디지털 ──
  "smart-store": Monitor,                  // 스마트스토어
  "digital-products": Download,            // 디지털 상품
  "creator-service": Video,                // 크리에이터
  "consignment-commerce": Truck,           // 위탁배송 (ShoppingCart 중복 해소 — 배송 메타포)
  "newsletter-membership": Mail,           // 뉴스레터
  "global-buying": Globe,                  // 글로벌 구매대행
  // ── 기술 스타트업 ── (2026-05-09 audit: AI=Brain, 반도체=Cpu — Cpu 중복 해소)
  "ai-application": Brain,                 // AI = 두뇌 (Cpu 보다 AI 직관)
  "developer-tools": Code2,                // 개발자 도구
  "b2b-saas": LayoutDashboard,             // SaaS 대시보드
  "fintech-startup": DollarSign,           // 핀테크
  "healthtech-startup": HeartPulse,        // 헬스테크
  "security-startup": Shield,              // 보안
  // ── 기술 스타트업 — 하드웨어·딥테크 ──
  "hardware-iot": CircuitBoard,            // 하드웨어·IoT
  "robotics-physical-ai": Bot,             // 로보틱스·피지컬 AI
  "semiconductor": Cpu,                    // 반도체 (Cpu — AI 와 분리됨)
  "biotech-medtech": Microscope,           // 바이오·의료기기
  "climate-energy": Leaf,                  // 클린테크·에너지
};

/** 업종별 테마 색상 — Apple-style 모노톤 + 카테고리별 톤 통일 */
const INDUSTRY_COLORS: Record<string, string> = {
  // food — warm orange/red
  "korean-casual": "#e25822", "delivery-meals": "#d94f00", "salad-healthy": "#1d3557",
  "ramen-noodle": "#191970", "chicken-burger": "#b64c4c", "western-pasta-brunch": "#191970",
  // cafe — brown/warm
  "takeout-coffee": "#92400e", "specialty-coffee": "#78350f", "dessert-cafe": "#db2777",
  "bakery-studio": "#191970", "icecream-bingsu": "#0891b2", "self-serve-cafe": "#6366f1",
  // retail — teal/purple
  "convenience-small": "#0d9488", "lifestyle-goods": "#7c3aed", "beauty-supplies": "#db2777",
  "fashion-accessories": "#9333ea", "health-food-store": "#1d3557", "unmanned-retail": "#4f46e5",
  // beauty — pink/rose/magenta (단계별 농도)
  "hair-salon": "#be185d", "nail-studio": "#e11d48", "skin-care-room": "#ec4899",
  "waxing-studio": "#d946ef", "eyelash-brow": "#c026d3", "makeup-bridal": "#a21caf",
  // fitness — energetic
  "pilates-studio": "#0ea5e9", "pt-gym": "#1d4ed8", "yoga-studio": "#0d9488",
  "crossfit-box": "#b64c4c", "golf-studio": "#1d3557", "unmanned-fitness": "#6366f1",
  // education — calm blue
  "study-room": "#2563eb", "kids-academy": "#191970", "adult-class": "#7c3aed",
  "language-academy": "#0891b2", "coding-class": "#4f46e5", "small-study-room": "#1d4ed8",
  // pet — warm friendly
  "pet-grooming": "#191970", "pet-supplies": "#1d3557", "pet-hotel": "#0891b2",
  "pet-cafe": "#92400e", "pet-training-school": "#191970",
  // living — functional
  "laundry-service": "#0d9488", "cleaning-service": "#2563eb", "repair-service": "#191970",
  "self-laundry": "#0891b2", "print-copy": "#64748b", "device-repair": "#4f46e5",
  // space — indigo/purple
  "guesthouse": "#7c3aed", "rental-studio": "#6366f1", "party-room": "#ec4899",
  "study-cafe-space": "#1d4ed8", "shared-office": "#0f172a", "practice-room": "#9333ea",
  // online — modern
  "smart-store": "#2563eb", "digital-products": "#7c3aed", "creator-service": "#ec4899",
  "consignment-commerce": "#0891b2", "newsletter-membership": "#6366f1", "global-buying": "#1d3557",
  // startup — tech (software)
  "ai-application": "#7c3aed", "developer-tools": "#0f172a", "b2b-saas": "#2563eb",
  "fintech-startup": "#1d3557", "healthtech-startup": "#b64c4c", "security-startup": "#1e40af",
  // startup — hardware / deeptech (high-capital, distinct tones)
  "hardware-iot": "#0891b2", "robotics-physical-ai": "#475569",
  "semiconductor": "#1e293b", "biotech-medtech": "#1d3557", "climate-energy": "#65a30d",
};

// 2026-07-03 정합: 업종 카테고리군(cluster)별 확인 항목 — 오프라인/온라인/스타트업은 상권·자본·인허가 로직이 달라 분기.
//   오프라인 문구는 기존 유지, online(스마트스토어·위탁·구매대행 등)·tech(스타트업)만 전용 항목.
type SelectionCluster = "offline" | "online" | "tech";
const SELECTION_VERIFY_ITEMS_KO: Record<SelectionCluster, string[]> = {
  offline: [
    "선택 업종이 본인 자본·시간·체력 한계에 맞는지 — 평균 창업비 vs 보유 자본 비교 (창업자금 70% 이하 권장)",
    "업종 시장 포화도 확인 — 동네 반경 500m 동일 업종 5개 이상이면 차별화 포인트 필수",
    "업종별 인허가 유형(신고·등록·허가) 확인 — 음식점·미용업은 영업신고, 유흥주점은 허가, 식품제조·가공은 등록 (대부분 외식·미용은 신고 대상)",
    "필수 자격증·교육 미리 확인 — 식품접객업 위생교육, 미용업 면허, 헬스 트레이너 자격 등",
    "업종 트렌드 1~2년 지속성 검토 — 단기 유행이면 손익분기 도달 전 침체 리스크",
    "유사 업종 대비 차별점 1줄로 정리 — 차별점 없으면 가격 경쟁에 휘말림",
  ],
  online: [
    "초기 자본이 소싱·광고비에 맞는지 — 무자본 위탁~소자본 사입, 인테리어·권리금 없이 상품 매입비 + 마케팅(광고) 예산 중심으로 계획",
    "카테고리 경쟁 강도 확인 — 네이버쇼핑 상품 수 대비 검색량(키워드 경쟁률)이 낮은 틈새인지 키워드 분석으로 점검",
    "온라인 판매 필수 신고 확인 — 반복 판매는 통신판매업 신고 필수 + 취급 품목별 추가(식품=식품판매업, 건강기능식품=건강기능식품판매업, 화장품=화장품책임판매업)",
    "마진 구조 검증 — 판매가에서 매입·플랫폼 수수료·광고비·배송비를 빼고 남는지 (위탁판매는 마진 수수료 방식이라 특히 얇음)",
    "아이템 트렌드 지속성 검토 — 단기 유행 상품은 재고·광고비 회수 전 검색량이 꺾일 리스크",
    "동일 카테고리 상위 스토어 대비 차별점 1줄 정리 — 상세페이지·가격·배송 중 하나는 이겨야 노출·전환",
  ],
  tech: [
    "선택 분야가 자금 여력에 맞는지 — 매출 0을 가정하고 개발·인건·인프라 비용으로 최소 1년 이상 버틸 시드(런웨이) 계획",
    "시장 크기·경쟁 검증 — 목표 시장 규모와 경쟁 스타트업·대체재를 조사, '고객이 실제로 돈을 내는 문제'인지 확인",
    "규제 트랙 여부 확인 — 대부분 사업자등록만이나, 핀테크=전자금융업, 헬스·의료기기=식약처 인증 등 별도 인허가가 필요한 분야인지",
    "MVP로 검증할 핵심 가설 1개 정의 — 풀개발 전에 수요·전환을 실측 (가설 검증 없는 선(先)개발 지양)",
    "기술·시장 트렌드 지속성 검토 — 단기 붐에 의존하면 자금 소진 전 피벗할 여력이 필요",
    "경쟁 대비 방어 가능한 차별점(모트) 1줄 — 기술·데이터·네트워크 효과 중 지킬 수 있는 축",
  ],
};

export function IndustrySelectionStage() {
  const d = useDashboardCtx();
  const {
    language,
    copy,
    selectedIndustryCategoryId, setSelectedIndustryCategoryId,
    selectedIndustryId, setSelectedIndustryId,
    selectedSpecialtyId, setSelectedSpecialtyId,
    canCompleteIndustryStep, handleIndustryContinue,
    prevTraversedStage, setViewingStageId,
    resetDemo,
  } = d;
  const optionGridRef = useRef<HTMLDivElement>(null);
  const specialtyRef = useRef<HTMLDivElement>(null);
  const [shakeWarning, setShakeWarning] = useState(false);

  const ko = language === "ko";
  const specialtyOptions = getSpecialtyOptions(selectedIndustryId);
  const requiresSpecialty = specialtyOptions.length > 0;
  const canContinue = !!selectedIndustryId && (!requiresSpecialty || !!selectedSpecialtyId);
  const selectionCluster: SelectionCluster =
    selectedIndustryCategoryId === "startup-tech" ? "tech"
    : selectedIndustryCategoryId === "online-digital" ? "online"
    : "offline";

  return (
    <>
      <KeyActionHero
        ko={ko}
        action={{
          title: ko
            ? "한 업종에 깊게 — 다중 선택은 분산만 키웁니다"
            : "Go deep on one industry — multi-select only dilutes focus",
          detail: ko
            ? "한 업종을 고르면 입지·운영·인허가·세무까지 단계별 가이드가 자동 맞춤. 멀티 카테고리 분산보다 한 업종 집중이 첫 12개월 매출에 4배 효과."
            : "Pick one industry and the step-by-step guide auto-tailors location, operations, permits, and tax. Focusing beats spreading — 4x the month 1–12 revenue impact.",
        }}
      />
      <div style={styles.helper}>
        {copy.home.chooseIndustryHelp}
      </div>
      <div style={styles.categoryTabBar}>
        {starterIndustryCategories.map((rawCategory) => {
          const category = localizeStarterIndustryCategory(rawCategory, language);
          return (
            <button
              key={rawCategory.id}
              type="button"
              style={{
                ...styles.categoryTab,
                ...(selectedIndustryCategoryId === rawCategory.id ? styles.categoryTabSelected : {})
              }}
              onClick={() => {
                setSelectedIndustryCategoryId(rawCategory.id);
                setSelectedIndustryId(undefined);
              }}
            >
              {category.title}
            </button>
          );
        })}
      </div>
      <div ref={optionGridRef} style={{ ...styles.optionGrid, ...(shakeWarning ? { outline: "2px solid #b64c4c", outlineOffset: "4px", borderRadius: "16px", transition: "outline 0.3s ease" } : {}) }}>
        {starterIndustryOptions
          .filter((option) => option.meta?.categoryId === selectedIndustryCategoryId)
          .slice(0, 6)
          .map((rawOption) => {
            const option = localizeRecommendationItem(rawOption, language);
            const selected = selectedIndustryId === rawOption.id;
            const Icon = INDUSTRY_ICONS[rawOption.id];
            const color = INDUSTRY_COLORS[rawOption.id] ?? "#1d3557";
            return (
              <button
                key={rawOption.id}
                type="button"
                style={{
                  ...styles.optionCard,
                  background: selected
                    ? `linear-gradient(160deg, ${color}14 0%, ${color}08 100%)`
                    : `linear-gradient(160deg, ${color}06 0%, rgba(255,255,255,0.9) 100%)`,
                  border: selected ? `1.5px solid ${color}40` : `1.5px solid ${color}10`,
                  boxShadow: selected ? `0 0 0 3px ${color}10, 0 4px 12px ${color}0c` : "none",
                }}
                onClick={() => setSelectedIndustryId(rawOption.id)}
              >
                <div style={{
                  width: "52px", height: "52px", borderRadius: "16px",
                  background: selected ? `${color}1a` : `${color}0d`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "10px",
                  transition: "all 0.2s ease",
                }}>
                  {Icon ? (
                    <Icon
                      size={26}
                      strokeWidth={1.7}
                      color={selected ? color : `${color}cc`}
                      style={{ transition: "color 0.2s ease" }}
                    />
                  ) : (
                    // fallback — 매핑 누락 시 카테고리 색의 ‧ 점
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: color, opacity: 0.5 }} />
                  )}
                </div>
                <div style={{ ...styles.optionTitle, textAlign: "center" as const, color: selected ? color : "#0f172a" }}>{option.title}</div>
              </button>
            );
          })}
      </div>

      {/* ── 세부 specialty 선택 (industry 선택 후 노출) ─────────────────────
          한식/캐주얼 → 국밥집 vs 한정식 처럼, 같은 industry 안에서 무엇을 할지 명확화.
          이게 결정돼야 vendor·permit·construction 추천이 정확해짐. */}
      {requiresSpecialty && (
        <div ref={specialtyRef} style={{ marginTop: "20px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "12px", paddingLeft: "2px",
          }}>
            <span style={{
              fontSize: "11px", fontWeight: 700, color: "#191970",
              letterSpacing: "0.06em", textTransform: "uppercase" as const,
              padding: "3px 9px", borderRadius: "999px",
              background: "rgba(25,25,112,0.08)",
            }}>
              {ko ? "Step 2 — 정확히 무엇을 하나" : "Step 2 — what exactly"}
            </span>
            <span style={{ fontSize: "13px", color: "rgba(15,23,42,0.6)" }}>
              {ko
                ? "같은 업종 안에서도 메뉴·고객·운영 모델이 다릅니다. 하나만 선택하세요."
                : "Same category, very different menus/customers/ops. Pick one."}
            </span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "10px",
          }}>
            {specialtyOptions.map((spec) => {
              const selected = selectedSpecialtyId === spec.id;
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => setSelectedSpecialtyId(spec.id)}
                  style={{
                    display: "flex", flexDirection: "column" as const,
                    alignItems: "flex-start", gap: "5px",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    background: selected
                      ? "linear-gradient(160deg, rgba(25,25,112,0.06) 0%, rgba(25,25,112,0.02) 100%)"
                      : "white",
                    border: selected
                      ? "1.5px solid rgba(25,25,112,0.30)"
                      : "1px solid rgba(0,0,0,0.08)",
                    boxShadow: selected
                      ? "0 4px 16px rgba(25,25,112,0.12)"
                      : "0 1px 3px rgba(0,0,0,0.03)",
                    cursor: "pointer",
                    textAlign: "left" as const,
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                    <span style={{
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: selected ? "#191970" : "white",
                      border: selected ? "none" : "1.5px solid rgba(15,23,42,0.20)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {selected && (
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "white" }} />
                      )}
                    </span>
                    <span style={{
                      fontSize: "14.5px", fontWeight: 700,
                      color: selected ? "#191970" : "#0f172a",
                      letterSpacing: "-0.015em", lineHeight: 1.35,
                      flex: 1, minWidth: 0,
                    }}>
                      {spec.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize: "12.5px", color: "rgba(15,23,42,0.62)",
                    lineHeight: 1.5, paddingLeft: "26px",
                  }}>
                    {spec.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <StageWrapup
        ko={language === "ko"}
        nextStageLabelKo="창업 형태 선택"
        nextStageLabelEn="Startup Type"
        doneItemsKo={[
          { label: "1. 카테고리 탐색", detail: "외식·카페·소매·뷰티·피트니스·교육·펫·라이프·공간·온라인·스타트업 11개 대분류 검토" },
          { label: "2. 세부 업종 선택", detail: "관심 카테고리 안에서 한 가지 세부 업종 확정 (예: 케어 살롱, 베이커리 스튜디오)" },
          { label: "3. 후속 단계 준비", detail: "업종 확정 후 창업 형태(독립창업·프랜차이즈)를 정하는 단계로 진입 준비" },
        ]}
        verifyItemsKo={SELECTION_VERIFY_ITEMS_KO[selectionCluster]}
        nextSummaryKo="업종 확정 → 창업 형태(독립창업·프랜차이즈) 선택 단계로 진입"
        nextSummaryEn="Industry locked → enter startup type selection"
      />

      <div style={styles.stageFooter}>
        {prevTraversedStage ? (
          <button type="button" style={styles.button} onClick={() => setViewingStageId(prevTraversedStage.stageId)}>
            {language === "ko" ? "← 이전 단계" : "← Back"}
          </button>
        ) : null}
        <button
          type="button"
          style={{ ...styles.primaryButton, opacity: canCompleteIndustryStep && canContinue ? 1 : 0.7 }}
          onClick={() => {
            // 1차: industry 미선택 → 업종 그리드로 스크롤
            if (!canCompleteIndustryStep) {
              setShakeWarning(true);
              optionGridRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            // 2차: industry 선택했지만 specialty 미선택 → specialty 그리드로 스크롤
            if (requiresSpecialty && !selectedSpecialtyId) {
              setShakeWarning(true);
              specialtyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setShakeWarning(false), 2000);
              return;
            }
            handleIndustryContinue();
          }}
        >
          {!canCompleteIndustryStep
            ? (ko ? "↑ 세부 업종을 선택하세요" : "↑ Select a sub-industry")
            : requiresSpecialty && !selectedSpecialtyId
              ? (ko ? "↑ 정확히 무엇을 할지 선택하세요" : "↑ Pick what exactly")
              : (ko ? "이 업종으로 다음 단계" : "Use this industry and continue")}
        </button>
        <button type="button" style={styles.button} onClick={resetDemo}>
          {copy.common.resetDemo}
        </button>
      </div>
    </>
  );
}
