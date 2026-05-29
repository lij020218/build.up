//
//  StarterIndustryData.swift — Korean SMB starter industry SSOT (iOS mirror)
//
//  Mirrors the web SSOT at:
//    packages/shared/src/starter-data.ts   — `starterIndustryCategories` + `starterIndustryOptions`
//    packages/shared/src/i18n.ts            — Korean titles (lines 320-465)
//    apps/web/app/lib/components/stages/selection/IndustrySelectionStage.tsx
//                                             — INDUSTRY_ICONS (Lucide → ID) + INDUSTRY_COLORS
//
//  This file is pure data; no UI. Use from IndustrySelectionStageView.
//  Icons are SF Symbols (mapped from Lucide one-to-one — see PR for the mapping table).
//

import Foundation

// MARK: - Models

public struct StarterIndustryCategory: Identifiable, Sendable, Hashable {
    public let id: String           // e.g. "food"
    public let titleKo: String      // e.g. "외식업"
    public let summaryKo: String    // e.g. "식당, 배달 전문 주방, 캐주얼 식사형 업종"

    public init(id: String, titleKo: String, summaryKo: String) {
        self.id = id
        self.titleKo = titleKo
        self.summaryKo = summaryKo
    }
}

public struct StarterIndustryOption: Identifiable, Sendable, Hashable {
    public let id: String           // e.g. "korean-casual"
    public let titleKo: String      // e.g. "한식/백반/캐주얼 식사"
    public let categoryId: String   // e.g. "food"
    public let iconSF: String       // SF Symbol fallback (lucide load 실패 시)
    public let iconLucide: String   // Lucide ID (kebab-case, 웹 SSOT 와 1:1 매핑)
    public let colorHex: String     // hex like "#e25822"

    public init(id: String, titleKo: String, categoryId: String, iconSF: String, iconLucide: String, colorHex: String) {
        self.id = id
        self.titleKo = titleKo
        self.categoryId = categoryId
        self.iconSF = iconSF
        self.iconLucide = iconLucide
        self.colorHex = colorHex
    }
}

// MARK: - Data

public enum StarterIndustryData {

    public static let categories: [StarterIndustryCategory] = [
        StarterIndustryCategory(id: "food",            titleKo: "외식업",        summaryKo: "식당, 배달 전문 주방, 캐주얼 식사형 업종"),
        StarterIndustryCategory(id: "cafe-dessert",    titleKo: "카페/디저트",   summaryKo: "커피, 베이커리, 테이크아웃 음료, 디저트 중심 업종"),
        StarterIndustryCategory(id: "retail",          titleKo: "소매업",        summaryKo: "생활용품, 편의형 매장, 전문 소매"),
        StarterIndustryCategory(id: "beauty",          titleKo: "뷰티",          summaryKo: "헤어, 네일, 피부관리 등 예약형 서비스"),
        StarterIndustryCategory(id: "fitness",         titleKo: "피트니스",      summaryKo: "헬스장, 스튜디오, 멤버십 기반 운동 업종"),
        StarterIndustryCategory(id: "education",       titleKo: "교육",          summaryKo: "수업, 과외, 학원, 반복형 교육 서비스"),
        StarterIndustryCategory(id: "pet",             titleKo: "반려동물",      summaryKo: "펫 서비스, 미용, 용품, 케어형 매장"),
        StarterIndustryCategory(id: "living-service",  titleKo: "생활 서비스",   summaryKo: "세탁, 청소, 수리, 동네 편의 서비스"),
        StarterIndustryCategory(id: "space",           titleKo: "공간/숙박",     summaryKo: "스터디룸, 대여 공간, 게스트하우스, 운영형 공간"),
        StarterIndustryCategory(id: "online-digital",  titleKo: "온라인/디지털", summaryKo: "이커머스, 디지털 상품, 크리에이터형 비즈니스"),
        StarterIndustryCategory(id: "startup-tech",    titleKo: "기술 스타트업", summaryKo: "AI, SaaS, 핀테크, 개발도구, 소프트웨어 스타트업")
    ]

    // 2026-05-20: 웹 lucide-react 와 1:1 아이콘 일치
    //   • iconLucide: 웹 INDUSTRY_ICONS 에서 import 한 컴포넌트명을 kebab-case 로 변환.
    //     예: UtensilsCrossed → "utensils-crossed", Building2 → "building-2", Code2 → "code-2"
    //   • LucideIcons SPM 가 SVG → UIImage 변환 (1300+ icons, 모두 동일 stroke 1.5).
    //   • iconSF 는 lucide 로드 실패 시 fallback (네트워크 미지원 케이스 등에는 영향 없음 — 모두 번들)
    public static let options: [StarterIndustryOption] = [
        // ── 외식업 (food) ──  웹 lucide: UtensilsCrossed/Bike/Salad/Soup/Drumstick/Pizza
        StarterIndustryOption(id: "korean-casual",         titleKo: "한식/백반/캐주얼 식사",  categoryId: "food", iconSF: "fork.knife",                          iconLucide: "utensils-crossed",     colorHex: "#e25822"),
        StarterIndustryOption(id: "delivery-meals",        titleKo: "배달 중심 식사형",       categoryId: "food", iconSF: "bicycle",                             iconLucide: "bike",                 colorHex: "#d94f00"),
        StarterIndustryOption(id: "salad-healthy",         titleKo: "샐러드/건강식",          categoryId: "food", iconSF: "leaf.fill",                           iconLucide: "salad",                colorHex: "#16a34a"),
        StarterIndustryOption(id: "ramen-noodle",          titleKo: "면/국밥/해장국",         categoryId: "food", iconSF: "cup.and.heat.waves.fill",             iconLucide: "soup",                 colorHex: "#c2410c"),
        StarterIndustryOption(id: "chicken-burger",        titleKo: "치킨/버거/피자",         categoryId: "food", iconSF: "bird.fill",                           iconLucide: "drumstick",            colorHex: "#dc2626"),
        StarterIndustryOption(id: "western-pasta-brunch",  titleKo: "양식/파스타/브런치",     categoryId: "food", iconSF: "fork.knife.circle.fill",              iconLucide: "pizza",                colorHex: "#b45309"),

        // ── 카페/디저트 (cafe-dessert) ──  웹: Coffee/Coffee/Cake/Croissant/IceCream/CupSoda
        StarterIndustryOption(id: "takeout-coffee",        titleKo: "테이크아웃 커피",        categoryId: "cafe-dessert", iconSF: "cup.and.saucer.fill",         iconLucide: "coffee",               colorHex: "#92400e"),
        StarterIndustryOption(id: "specialty-coffee",      titleKo: "스페셜티 커피 바",       categoryId: "cafe-dessert", iconSF: "mug.fill",                    iconLucide: "coffee",               colorHex: "#78350f"),
        StarterIndustryOption(id: "dessert-cafe",          titleKo: "디저트 카페",            categoryId: "cafe-dessert", iconSF: "birthday.cake.fill",          iconLucide: "cake",                 colorHex: "#db2777"),
        StarterIndustryOption(id: "bakery-studio",         titleKo: "베이커리 스튜디오",      categoryId: "cafe-dessert", iconSF: "fork.knife.circle.fill",      iconLucide: "croissant",            colorHex: "#a16207"),
        StarterIndustryOption(id: "icecream-bingsu",       titleKo: "아이스크림/빙수",        categoryId: "cafe-dessert", iconSF: "snowflake",                   iconLucide: "ice-cream",            colorHex: "#0891b2"),
        StarterIndustryOption(id: "self-serve-cafe",       titleKo: "무인/셀프 카페",         categoryId: "cafe-dessert", iconSF: "cup.and.heat.waves.fill",     iconLucide: "cup-soda",             colorHex: "#6366f1"),

        // ── 소매업 (retail) ──  웹: Store/ShoppingBag/SprayCan/Shirt/Apple/ShoppingCart
        StarterIndustryOption(id: "convenience-small",     titleKo: "동네 편의형 매장",       categoryId: "retail", iconSF: "building.2.fill",                   iconLucide: "store",                colorHex: "#0d9488"),
        StarterIndustryOption(id: "lifestyle-goods",       titleKo: "라이프스타일 소품샵",    categoryId: "retail", iconSF: "bag.fill",                          iconLucide: "shopping-bag",         colorHex: "#7c3aed"),
        StarterIndustryOption(id: "beauty-supplies",       titleKo: "뷰티 소매",              categoryId: "retail", iconSF: "sparkles",                          iconLucide: "spray-can",            colorHex: "#db2777"),
        StarterIndustryOption(id: "fashion-accessories",   titleKo: "패션 액세서리",          categoryId: "retail", iconSF: "tshirt.fill",                       iconLucide: "shirt",                colorHex: "#9333ea"),
        StarterIndustryOption(id: "health-food-store",     titleKo: "건강식품 매장",          categoryId: "retail", iconSF: "leaf.circle.fill",                  iconLucide: "apple",                colorHex: "#16a34a"),
        StarterIndustryOption(id: "unmanned-retail",       titleKo: "무인/편의형 소매",       categoryId: "retail", iconSF: "cart.fill",                         iconLucide: "shopping-cart",        colorHex: "#4f46e5"),

        // ── 뷰티 (beauty) ──  웹: Scissors/Hand/Droplets/Sparkles/Eye/Palette
        StarterIndustryOption(id: "hair-salon",            titleKo: "미용실",                 categoryId: "beauty", iconSF: "scissors",                          iconLucide: "scissors",             colorHex: "#be185d"),
        StarterIndustryOption(id: "nail-studio",           titleKo: "네일 스튜디오",          categoryId: "beauty", iconSF: "hand.raised.fill",                  iconLucide: "hand",                 colorHex: "#e11d48"),
        StarterIndustryOption(id: "skin-care-room",        titleKo: "피부관리실",             categoryId: "beauty", iconSF: "drop.fill",                         iconLucide: "droplets",             colorHex: "#ec4899"),
        StarterIndustryOption(id: "waxing-studio",         titleKo: "왁싱 스튜디오",          categoryId: "beauty", iconSF: "sparkles",                          iconLucide: "sparkles",             colorHex: "#d946ef"),
        StarterIndustryOption(id: "eyelash-brow",          titleKo: "속눈썹/눈썹 스튜디오",   categoryId: "beauty", iconSF: "eye.fill",                          iconLucide: "eye",                  colorHex: "#c026d3"),
        StarterIndustryOption(id: "makeup-bridal",         titleKo: "메이크업/브라이덜",      categoryId: "beauty", iconSF: "paintpalette.fill",                 iconLucide: "palette",              colorHex: "#a21caf"),

        // ── 피트니스 (fitness) ──  웹: PersonStanding/Dumbbell/Sun/Flame/Flag/Timer
        StarterIndustryOption(id: "pilates-studio",        titleKo: "필라테스 스튜디오",      categoryId: "fitness", iconSF: "figure.stand",                     iconLucide: "person-standing",      colorHex: "#0ea5e9"),
        StarterIndustryOption(id: "pt-gym",                titleKo: "PT 중심 헬스장",         categoryId: "fitness", iconSF: "dumbbell.fill",                    iconLucide: "dumbbell",             colorHex: "#1d4ed8"),
        StarterIndustryOption(id: "yoga-studio",           titleKo: "요가 스튜디오",          categoryId: "fitness", iconSF: "sun.max.fill",                     iconLucide: "sun",                  colorHex: "#0d9488"),
        StarterIndustryOption(id: "crossfit-box",          titleKo: "크로스핏/그룹 트레이닝", categoryId: "fitness", iconSF: "flame.fill",                       iconLucide: "flame",                colorHex: "#dc2626"),
        StarterIndustryOption(id: "golf-studio",           titleKo: "스크린골프/골프 스튜디오", categoryId: "fitness", iconSF: "flag.fill",                      iconLucide: "flag",                 colorHex: "#059669"),
        StarterIndustryOption(id: "unmanned-fitness",      titleKo: "무인/24시 피트니스",     categoryId: "fitness", iconSF: "timer",                            iconLucide: "timer",                colorHex: "#6366f1"),

        // ── 교육 (education) ──  웹: BookOpen/School/GraduationCap/Languages/Code/Library
        StarterIndustryOption(id: "study-room",            titleKo: "스터디룸/스터디카페",    categoryId: "education", iconSF: "book.fill",                      iconLucide: "book-open",            colorHex: "#2563eb"),
        StarterIndustryOption(id: "kids-academy",          titleKo: "아동 학원",              categoryId: "education", iconSF: "building.columns.fill",          iconLucide: "school",               colorHex: "#f59e0b"),
        StarterIndustryOption(id: "adult-class",           titleKo: "성인 취미 클래스",       categoryId: "education", iconSF: "graduationcap.fill",             iconLucide: "graduation-cap",       colorHex: "#7c3aed"),
        StarterIndustryOption(id: "language-academy",      titleKo: "어학 학원",              categoryId: "education", iconSF: "character.book.closed.fill",     iconLucide: "languages",            colorHex: "#0891b2"),
        StarterIndustryOption(id: "coding-class",          titleKo: "코딩/디지털 스킬 클래스", categoryId: "education", iconSF: "chevron.left.forwardslash.chevron.right", iconLucide: "code",       colorHex: "#4f46e5"),
        StarterIndustryOption(id: "small-study-room",      titleKo: "공부방/소규모 튜터링",   categoryId: "education", iconSF: "books.vertical.fill",            iconLucide: "library",              colorHex: "#1d4ed8"),

        // ── 반려동물 (pet) ──  웹: ShowerHead/Bone/Bed/PawPrint/Award/MapPin
        StarterIndustryOption(id: "pet-grooming",          titleKo: "펫미용",                 categoryId: "pet", iconSF: "shower.fill",                          iconLucide: "shower-head",          colorHex: "#ea580c"),
        StarterIndustryOption(id: "pet-supplies",          titleKo: "펫용품점",               categoryId: "pet", iconSF: "bag.fill",                             iconLucide: "bone",                 colorHex: "#16a34a"),
        StarterIndustryOption(id: "pet-hotel",             titleKo: "펫호텔/데이케어",        categoryId: "pet", iconSF: "bed.double.fill",                      iconLucide: "bed",                  colorHex: "#0891b2"),
        StarterIndustryOption(id: "pet-cafe",              titleKo: "펫카페",                 categoryId: "pet", iconSF: "pawprint.fill",                        iconLucide: "paw-print",            colorHex: "#92400e"),
        StarterIndustryOption(id: "pet-training-school",   titleKo: "펫 트레이닝/유치원",     categoryId: "pet", iconSF: "rosette",                              iconLucide: "award",                colorHex: "#d97706"),
        StarterIndustryOption(id: "pet-walking-visit",     titleKo: "산책/방문 돌봄",         categoryId: "pet", iconSF: "mappin.circle.fill",                   iconLucide: "map-pin",              colorHex: "#059669"),

        // ── 생활 서비스 (living-service) ──  웹: WashingMachine/Brush/Wrench/Coins/Printer/Smartphone
        StarterIndustryOption(id: "laundry-service",       titleKo: "세탁 서비스",            categoryId: "living-service", iconSF: "washer.fill",               iconLucide: "washing-machine",      colorHex: "#0d9488"),
        StarterIndustryOption(id: "cleaning-service",      titleKo: "청소 서비스",            categoryId: "living-service", iconSF: "sparkles",                  iconLucide: "brush",                colorHex: "#2563eb"),
        StarterIndustryOption(id: "repair-service",        titleKo: "수리/생활 해결 서비스",  categoryId: "living-service", iconSF: "wrench.and.screwdriver.fill", iconLucide: "wrench",             colorHex: "#b45309"),
        StarterIndustryOption(id: "self-laundry",          titleKo: "셀프 빨래방",            categoryId: "living-service", iconSF: "washer.fill",               iconLucide: "coins",                colorHex: "#0891b2"),
        StarterIndustryOption(id: "print-copy",            titleKo: "인쇄/복사 서비스",       categoryId: "living-service", iconSF: "printer.fill",              iconLucide: "printer",              colorHex: "#64748b"),
        StarterIndustryOption(id: "device-repair",         titleKo: "휴대폰/소형기기 수리",   categoryId: "living-service", iconSF: "iphone.gen3",               iconLucide: "smartphone",           colorHex: "#4f46e5"),

        // ── 공간/숙박 (space) ──  웹: Home/Camera/PartyPopper/Armchair/Building2/Music
        StarterIndustryOption(id: "guesthouse",            titleKo: "게스트하우스",           categoryId: "space", iconSF: "house.fill",                         iconLucide: "home",                 colorHex: "#7c3aed"),
        StarterIndustryOption(id: "rental-studio",         titleKo: "대여 스튜디오",          categoryId: "space", iconSF: "camera.fill",                        iconLucide: "camera",               colorHex: "#6366f1"),
        StarterIndustryOption(id: "party-room",            titleKo: "파티룸",                 categoryId: "space", iconSF: "party.popper.fill",                  iconLucide: "party-popper",         colorHex: "#ec4899"),
        StarterIndustryOption(id: "study-cafe-space",      titleKo: "스터디카페",             categoryId: "space", iconSF: "chair.fill",                         iconLucide: "armchair",             colorHex: "#1d4ed8"),
        StarterIndustryOption(id: "shared-office",         titleKo: "공유오피스/소형 워크스페이스", categoryId: "space", iconSF: "building.2.fill",              iconLucide: "building-2",           colorHex: "#0f172a"),
        StarterIndustryOption(id: "practice-room",         titleKo: "연습실/레슨룸",          categoryId: "space", iconSF: "music.note",                         iconLucide: "music",                colorHex: "#9333ea"),

        // ── 온라인/디지털 (online-digital) ──  웹: Monitor/Download/Video/Truck/Mail/Globe
        StarterIndustryOption(id: "smart-store",           titleKo: "스마트스토어 판매",      categoryId: "online-digital", iconSF: "display",                   iconLucide: "monitor",              colorHex: "#2563eb"),
        StarterIndustryOption(id: "digital-products",      titleKo: "디지털 상품",            categoryId: "online-digital", iconSF: "arrow.down.circle.fill",    iconLucide: "download",             colorHex: "#7c3aed"),
        StarterIndustryOption(id: "creator-service",       titleKo: "크리에이터 기반 서비스", categoryId: "online-digital", iconSF: "video.fill",                iconLucide: "video",                colorHex: "#ec4899"),
        StarterIndustryOption(id: "consignment-commerce",  titleKo: "위탁/마켓플레이스 판매", categoryId: "online-digital", iconSF: "shippingbox.fill",          iconLucide: "truck",                colorHex: "#0891b2"),
        StarterIndustryOption(id: "newsletter-membership", titleKo: "뉴스레터/멤버십 콘텐츠", categoryId: "online-digital", iconSF: "envelope.fill",             iconLucide: "mail",                 colorHex: "#6366f1"),
        StarterIndustryOption(id: "global-buying",         titleKo: "해외구매대행/크로스보더 셀링", categoryId: "online-digital", iconSF: "globe",               iconLucide: "globe",                colorHex: "#059669"),

        // ── 기술 스타트업 (startup-tech) — SW ──  웹: Brain/Code2/LayoutDashboard/DollarSign/HeartPulse/Shield
        StarterIndustryOption(id: "ai-application",        titleKo: "AI 애플리케이션 / 에이전트", categoryId: "startup-tech", iconSF: "brain.head.profile",      iconLucide: "brain",                colorHex: "#7c3aed"),
        StarterIndustryOption(id: "developer-tools",       titleKo: "개발자 도구 / 인프라",   categoryId: "startup-tech", iconSF: "curlybraces",                  iconLucide: "code-2",               colorHex: "#0f172a"),
        StarterIndustryOption(id: "b2b-saas",              titleKo: "B2B SaaS / 워크플로 소프트웨어", categoryId: "startup-tech", iconSF: "square.grid.2x2.fill", iconLucide: "layout-dashboard",   colorHex: "#2563eb"),
        StarterIndustryOption(id: "fintech-startup",       titleKo: "핀테크 / 결제 / 자금관리", categoryId: "startup-tech", iconSF: "creditcard.fill",            iconLucide: "dollar-sign",          colorHex: "#059669"),
        StarterIndustryOption(id: "healthtech-startup",    titleKo: "헬스테크 / 케어 운영",   categoryId: "startup-tech", iconSF: "waveform.path.ecg",            iconLucide: "heart-pulse",          colorHex: "#dc2626"),
        StarterIndustryOption(id: "security-startup",      titleKo: "사이버보안 / 트러스트",  categoryId: "startup-tech", iconSF: "shield.fill",                  iconLucide: "shield",               colorHex: "#1e40af"),

        // ── 기술 스타트업 (startup-tech) — HW / Deeptech ──  웹: CircuitBoard/Bot/Cpu/Microscope/Leaf
        StarterIndustryOption(id: "hardware-iot",          titleKo: "하드웨어 / IoT 디바이스", categoryId: "startup-tech", iconSF: "antenna.radiowaves.left.and.right", iconLucide: "circuit-board", colorHex: "#0891b2"),
        StarterIndustryOption(id: "robotics-physical-ai",  titleKo: "로보틱스 / 피지컬 AI",   categoryId: "startup-tech", iconSF: "gearshape.2.fill",             iconLucide: "bot",                  colorHex: "#475569"),
        StarterIndustryOption(id: "semiconductor",         titleKo: "반도체 / 칩 설계",       categoryId: "startup-tech", iconSF: "cpu.fill",                     iconLucide: "cpu",                  colorHex: "#1e293b"),
        StarterIndustryOption(id: "biotech-medtech",       titleKo: "바이오 / 의료기기",      categoryId: "startup-tech", iconSF: "cross.case.fill",              iconLucide: "microscope",           colorHex: "#15803d"),
        StarterIndustryOption(id: "climate-energy",        titleKo: "클린테크 / 에너지",      categoryId: "startup-tech", iconSF: "leaf.fill",                    iconLucide: "leaf",                 colorHex: "#65a30d")
    ]

    // MARK: - Helpers

    public static func options(for categoryId: String) -> [StarterIndustryOption] {
        options.filter { $0.categoryId == categoryId }
    }

    public static func category(for option: StarterIndustryOption) -> StarterIndustryCategory? {
        categories.first { $0.id == option.categoryId }
    }

    public static func option(by id: String) -> StarterIndustryOption? {
        options.first { $0.id == id }
    }

    public static func category(by id: String) -> StarterIndustryCategory? {
        categories.first { $0.id == id }
    }

    /// Map a starter industry option to a `RoadmapStore.cluster` value.
    /// - food, cafe-dessert, retail, beauty, fitness, education, pet, living-service, space → "offline-food"
    /// - online-digital → "online-digital"
    /// - startup-tech: semiconductor / hardware-iot / robotics-physical-ai / biotech-medtech → matching cluster
    /// - other startup-tech (ai, devtools, saas, fintech, healthtech, security, climate) → "startup-tech"
    public static func cluster(for option: StarterIndustryOption) -> String {
        switch option.categoryId {
        case "online-digital":
            return "online-digital"
        case "startup-tech":
            switch option.id {
            case "semiconductor":         return "semiconductor"
            case "hardware-iot":          return "hardware-iot"
            case "robotics-physical-ai":  return "robotics-physical-ai"
            case "biotech-medtech":       return "biotech-medtech"
            case "climate-energy":        return "climate-energy"
            default:                      return "startup-tech"
            }
        default:
            return "offline-food"
        }
    }
}
