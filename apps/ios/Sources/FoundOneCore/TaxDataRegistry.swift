// ⚠️ 자동 생성 파일 — 직접 수정 금지. `npx tsx scripts/gen-tax-data-swift.mts` 로 재생성.
//    웹 SSOT: packages/shared/src/finance/tax-credits.ts · tax-calendar.ts
//    세액공제 자격·감면율·일정은 참고용(세무 자문 아님) — 최종은 홈택스·세무사.

import Foundation

public enum TaxEligibilityLevel: String, Sendable {
    case eligible   // 조문 명시 확정
    case likely     // 대표코드상 해당 추정
    case check      // 업종분류 애매 — 세무사 확인
    case excluded   // 대상 아님

    /// 카드 노출 여부 (eligible/likely 만 "받을 가능성" 으로 노출, check/excluded 는 확인안내).
    public var isSurfaced: Bool { self == .eligible || self == .likely }
}

public struct CommonTaxBenefit: Sendable, Identifiable {
    public let id: String
    public let titleKo: String
    public let summaryKo: String
    public let basis: String
    public let sunset: String?
    public let link: String?
}

public struct SpecialtyTaxMapping: Sendable {
    public let specialtyId: String
    public let categoryId: String
    public let ksicHint: String
    public let startupReduction: TaxEligibilityLevel
    public let specialReduction: TaxEligibilityLevel
    public let note: String
}

public struct TaxScheduleEvent: Sendable, Identifiable {
    public let id: String
    public let category: String
    public let title: String
    public let description: String
    public let month: Int
    public let day: Int
    public let appliesToSimplified: Bool
    public let requiresEmployees: Bool
}

public enum TaxDataRegistry {
    /// 전 업종 공통 세액공제·소득공제 (개인사업자).
    public static let common: [CommonTaxBenefit] = [
        .init(
            id: "yellow-umbrella",
            titleKo: "노란우산공제 (소득공제)",
            summaryKo: "2026년 최대 600만원 소득공제 (사업소득 구간별 200~600만원). 폐업·퇴직 대비 목돈.",
            basis: "조세특례제한법 §86의3",
            sunset: nil,
            link: "https://www.8899.or.kr"
        ),
        .init(
            id: "pension-irp",
            titleKo: "연금저축·IRP 세액공제",
            summaryKo: "납입액의 13.2~16.5%(지방세 포함) 세액공제. 한도 연금저축 600만원 / IRP 합산 900만원.",
            basis: "소득세법 §59의3",
            sunset: nil,
            link: nil
        ),
        .init(
            id: "integrated-employment",
            titleKo: "통합고용세액공제 (고용 증가 시)",
            summaryKo: "상시근로자 증가분 1인당 중소기업 3년 지원 — 청년등 지방 1,550만·수도권 1,450만 / 그 외 지방 950만·수도권 850만.",
            basis: "조세특례제한법 §29의8",
            sunset: "2027-12-31",
            link: "https://www.nts.go.kr"
        ),
        .init(
            id: "sincere-medical-edu",
            titleKo: "성실사업자 의료비·교육비 세액공제",
            summaryKo: "의료비·교육비 지출액의 15%(난임 30%·미숙아 20%) 세액공제. 월세는 종합소득 7천만원 이하.",
            basis: "소득세법 §122의3",
            sunset: "2026-12-31",
            link: nil
        ),
    ]

    /// 세부업종 70종 × 조특법 §6/§7 자격 매핑.
    public static let specialty: [SpecialtyTaxMapping] = [
        .init(
            specialtyId: "korean-casual",
            categoryId: "food",
            ksicHint: "일반/휴게음식점업 (56)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "음식점업 = 창업감면 대상(§6③7). 특별감면(§7) 대상 아님. 창업 5년 이내 신청."
        ),
        .init(
            specialtyId: "delivery-meals",
            categoryId: "food",
            ksicHint: "일반/휴게음식점업 (56)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "음식점업 = 창업감면 대상(§6③7). 특별감면(§7) 대상 아님. 창업 5년 이내 신청."
        ),
        .init(
            specialtyId: "salad-healthy",
            categoryId: "food",
            ksicHint: "일반/휴게음식점업 (56)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "음식점업 = 창업감면 대상(§6③7). 특별감면(§7) 대상 아님. 창업 5년 이내 신청."
        ),
        .init(
            specialtyId: "ramen-noodle",
            categoryId: "food",
            ksicHint: "일반/휴게음식점업 (56)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "음식점업 = 창업감면 대상(§6③7). 특별감면(§7) 대상 아님. 창업 5년 이내 신청."
        ),
        .init(
            specialtyId: "chicken-burger",
            categoryId: "food",
            ksicHint: "일반/휴게음식점업 (56)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "음식점업 = 창업감면 대상(§6③7). 특별감면(§7) 대상 아님. 창업 5년 이내 신청."
        ),
        .init(
            specialtyId: "western-pasta-brunch",
            categoryId: "food",
            ksicHint: "일반/휴게음식점업 (56)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "음식점업 = 창업감면 대상(§6③7). 특별감면(§7) 대상 아님. 창업 5년 이내 신청."
        ),
        .init(
            specialtyId: "takeout-coffee",
            categoryId: "cafe-dessert",
            ksicHint: "비알코올음료점업 (56220)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "카페=음식점업으로 창업감면 대상(§6③7) 통상 인정. 정확 분류는 사업자등록 업종코드 확인."
        ),
        .init(
            specialtyId: "specialty-coffee",
            categoryId: "cafe-dessert",
            ksicHint: "비알코올음료점업 (56220)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "카페=음식점업으로 창업감면 대상(§6③7) 통상 인정. 정확 분류는 사업자등록 업종코드 확인."
        ),
        .init(
            specialtyId: "dessert-cafe",
            categoryId: "cafe-dessert",
            ksicHint: "비알코올음료점업 (56220)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "카페=음식점업으로 창업감면 대상(§6③7) 통상 인정. 정확 분류는 사업자등록 업종코드 확인."
        ),
        .init(
            specialtyId: "icecream-bingsu",
            categoryId: "cafe-dessert",
            ksicHint: "비알코올음료점업 (56220)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "카페=음식점업으로 창업감면 대상(§6③7) 통상 인정. 정확 분류는 사업자등록 업종코드 확인."
        ),
        .init(
            specialtyId: "self-serve-cafe",
            categoryId: "cafe-dessert",
            ksicHint: "비알코올음료점업 (56220)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "카페=음식점업으로 창업감면 대상(§6③7) 통상 인정. 정확 분류는 사업자등록 업종코드 확인."
        ),
        .init(
            specialtyId: "bakery-studio",
            categoryId: "cafe-dessert",
            ksicHint: "제과점업 (56191)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "제과점업=음식점업으로 창업감면 대상. 직접 제조 비중 크면 제조업 분류 가능성(세무사 확인 시 §7도)."
        ),
        .init(
            specialtyId: "convenience-small",
            categoryId: "retail",
            ksicHint: "종합/전문 소매업 (47)",
            startupReduction: .excluded,
            specialReduction: .eligible,
            note: "소매업=창업감면 제외, 특별감면(§7) 도소매 대상(소기업 10%). 온라인 병행 시 통신판매업으로 §6 가능성(세무사 확인)."
        ),
        .init(
            specialtyId: "lifestyle-goods",
            categoryId: "retail",
            ksicHint: "종합/전문 소매업 (47)",
            startupReduction: .excluded,
            specialReduction: .eligible,
            note: "소매업=창업감면 제외, 특별감면(§7) 도소매 대상(소기업 10%). 온라인 병행 시 통신판매업으로 §6 가능성(세무사 확인)."
        ),
        .init(
            specialtyId: "beauty-supplies",
            categoryId: "retail",
            ksicHint: "종합/전문 소매업 (47)",
            startupReduction: .excluded,
            specialReduction: .eligible,
            note: "소매업=창업감면 제외, 특별감면(§7) 도소매 대상(소기업 10%). 온라인 병행 시 통신판매업으로 §6 가능성(세무사 확인)."
        ),
        .init(
            specialtyId: "fashion-accessories",
            categoryId: "retail",
            ksicHint: "종합/전문 소매업 (47)",
            startupReduction: .excluded,
            specialReduction: .eligible,
            note: "소매업=창업감면 제외, 특별감면(§7) 도소매 대상(소기업 10%). 온라인 병행 시 통신판매업으로 §6 가능성(세무사 확인)."
        ),
        .init(
            specialtyId: "health-food-store",
            categoryId: "retail",
            ksicHint: "종합/전문 소매업 (47)",
            startupReduction: .excluded,
            specialReduction: .eligible,
            note: "소매업=창업감면 제외, 특별감면(§7) 도소매 대상(소기업 10%). 온라인 병행 시 통신판매업으로 §6 가능성(세무사 확인)."
        ),
        .init(
            specialtyId: "unmanned-retail",
            categoryId: "retail",
            ksicHint: "종합/전문 소매업 (47)",
            startupReduction: .excluded,
            specialReduction: .eligible,
            note: "소매업=창업감면 제외, 특별감면(§7) 도소매 대상(소기업 10%). 온라인 병행 시 통신판매업으로 §6 가능성(세무사 확인)."
        ),
        .init(
            specialtyId: "hair-salon",
            categoryId: "beauty",
            ksicHint: "이용 및 미용업 (9611)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "이용·미용업 = 창업감면 대상(§6③14나). 특별감면(§7) 대상 아님."
        ),
        .init(
            specialtyId: "nail-studio",
            categoryId: "beauty",
            ksicHint: "이용 및 미용업 (9611)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "이용·미용업 = 창업감면 대상(§6③14나). 특별감면(§7) 대상 아님."
        ),
        .init(
            specialtyId: "skin-care-room",
            categoryId: "beauty",
            ksicHint: "이용 및 미용업 (9611)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "이용·미용업 = 창업감면 대상(§6③14나). 특별감면(§7) 대상 아님."
        ),
        .init(
            specialtyId: "waxing-studio",
            categoryId: "beauty",
            ksicHint: "이용 및 미용업 (9611)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "이용·미용업 = 창업감면 대상(§6③14나). 특별감면(§7) 대상 아님."
        ),
        .init(
            specialtyId: "eyelash-brow",
            categoryId: "beauty",
            ksicHint: "이용 및 미용업 (9611)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "이용·미용업 = 창업감면 대상(§6③14나). 특별감면(§7) 대상 아님."
        ),
        .init(
            specialtyId: "makeup-bridal",
            categoryId: "beauty",
            ksicHint: "이용 및 미용업 (9611)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "이용·미용업 = 창업감면 대상(§6③14나). 특별감면(§7) 대상 아님."
        ),
        .init(
            specialtyId: "pilates-studio",
            categoryId: "fitness",
            ksicHint: "체력단련시설/스포츠교육 (9139·8559)",
            startupReduction: .likely,
            specialReduction: .excluded,
            note: "스포츠서비스업은 창업감면 대상(§6③13)이나 오락장·사행시설은 제외 — 체력단련/스포츠교육 해당 여부 세무사 확인 권장."
        ),
        .init(
            specialtyId: "yoga-studio",
            categoryId: "fitness",
            ksicHint: "체력단련시설/스포츠교육 (9139·8559)",
            startupReduction: .likely,
            specialReduction: .excluded,
            note: "스포츠서비스업은 창업감면 대상(§6③13)이나 오락장·사행시설은 제외 — 체력단련/스포츠교육 해당 여부 세무사 확인 권장."
        ),
        .init(
            specialtyId: "pt-gym",
            categoryId: "fitness",
            ksicHint: "체력단련시설/스포츠교육 (9139·8559)",
            startupReduction: .likely,
            specialReduction: .excluded,
            note: "스포츠서비스업은 창업감면 대상(§6③13)이나 오락장·사행시설은 제외 — 체력단련/스포츠교육 해당 여부 세무사 확인 권장."
        ),
        .init(
            specialtyId: "crossfit-box",
            categoryId: "fitness",
            ksicHint: "체력단련시설/스포츠교육 (9139·8559)",
            startupReduction: .likely,
            specialReduction: .excluded,
            note: "스포츠서비스업은 창업감면 대상(§6③13)이나 오락장·사행시설은 제외 — 체력단련/스포츠교육 해당 여부 세무사 확인 권장."
        ),
        .init(
            specialtyId: "unmanned-fitness",
            categoryId: "fitness",
            ksicHint: "체력단련시설/스포츠교육 (9139·8559)",
            startupReduction: .likely,
            specialReduction: .excluded,
            note: "스포츠서비스업은 창업감면 대상(§6③13)이나 오락장·사행시설은 제외 — 체력단련/스포츠교육 해당 여부 세무사 확인 권장."
        ),
        .init(
            specialtyId: "golf-studio",
            categoryId: "fitness",
            ksicHint: "스크린골프=오락장운영업 가능성 (91221)",
            startupReduction: .check,
            specialReduction: .excluded,
            note: "스크린골프는 '오락장 운영업'으로 창업감면 제외 대상일 수 있음(§6③13 단서). 골프교습이면 대상 가능 — 반드시 세무사 확인."
        ),
        .init(
            specialtyId: "coding-class",
            categoryId: "education",
            ksicHint: "직업기술학원 (8550)",
            startupReduction: .likely,
            specialReduction: .excluded,
            note: "직업기술 분야 교습 학원은 창업감면 대상(§6③15). 코딩=직업기술 해당 가능, 정확 등록업종 확인 권장."
        ),
        .init(
            specialtyId: "kids-academy",
            categoryId: "education",
            ksicHint: "일반교과/외국어학원 (8550)",
            startupReduction: .check,
            specialReduction: .excluded,
            note: "일반 교습학원(입시·외국어)은 창업감면의 '직업기술 학원'에 해당하지 않으면 제외 — 세무사 확인 필요."
        ),
        .init(
            specialtyId: "language-academy",
            categoryId: "education",
            ksicHint: "일반교과/외국어학원 (8550)",
            startupReduction: .check,
            specialReduction: .excluded,
            note: "일반 교습학원(입시·외국어)은 창업감면의 '직업기술 학원'에 해당하지 않으면 제외 — 세무사 확인 필요."
        ),
        .init(
            specialtyId: "adult-class",
            categoryId: "education",
            ksicHint: "일반교과/외국어학원 (8550)",
            startupReduction: .check,
            specialReduction: .excluded,
            note: "일반 교습학원(입시·외국어)은 창업감면의 '직업기술 학원'에 해당하지 않으면 제외 — 세무사 확인 필요."
        ),
        .init(
            specialtyId: "study-room",
            categoryId: "education",
            ksicHint: "독서실운영업 (85)",
            startupReduction: .check,
            specialReduction: .excluded,
            note: "독서실은 교습이 아니라 창업감면 대상 여부 불명확 — 세무사 확인."
        ),
        .init(
            specialtyId: "small-study-room",
            categoryId: "education",
            ksicHint: "독서실운영업 (85)",
            startupReduction: .check,
            specialReduction: .excluded,
            note: "독서실은 교습이 아니라 창업감면 대상 여부 불명확 — 세무사 확인."
        ),
        .init(
            specialtyId: "pet-grooming",
            categoryId: "pet",
            ksicHint: "반려동물 미용 (96 기타개인서비스)",
            startupReduction: .check,
            specialReduction: .excluded,
            note: "반려동물 미용은 '이용·미용업'(사람 대상)과 별개 분류 — 창업감면 대상 여부 세무사 확인."
        ),
        .init(
            specialtyId: "pet-supplies",
            categoryId: "pet",
            ksicHint: "애완용품 소매 (47)",
            startupReduction: .excluded,
            specialReduction: .eligible,
            note: "용품 소매=특별감면(§7) 도소매 대상, 창업감면 제외(소매)."
        ),
        .init(
            specialtyId: "pet-hotel",
            categoryId: "pet",
            ksicHint: "반려동물 위탁관리 (96)",
            startupReduction: .check,
            specialReduction: .excluded,
            note: "반려동물 위탁은 관광숙박업 아님 — 창업감면 대상 여부 불명확, 세무사 확인."
        ),
        .init(
            specialtyId: "pet-cafe",
            categoryId: "pet",
            ksicHint: "음식점업+동물전시 혼합",
            startupReduction: .check,
            specialReduction: .excluded,
            note: "애견카페는 음식점업 비중에 따라 창업감면 가능성 있으나 혼합업종이라 세무사 확인 필요."
        ),
        .init(
            specialtyId: "pet-training-school",
            categoryId: "pet",
            ksicHint: "반려동물 훈련 (96)",
            startupReduction: .check,
            specialReduction: .excluded,
            note: "반려동물 훈련은 직업기술학원 아님 — 창업감면 대상 여부 세무사 확인."
        ),
        .init(
            specialtyId: "laundry-service",
            categoryId: "living-service",
            ksicHint: "세탁업 (9691)",
            startupReduction: .excluded,
            specialReduction: .excluded,
            note: "세탁업은 창업감면·특별감면 대상 아님 — 공통 4종(성실사업자·노란우산 등)만 해당."
        ),
        .init(
            specialtyId: "self-laundry",
            categoryId: "living-service",
            ksicHint: "세탁업 (9691)",
            startupReduction: .excluded,
            specialReduction: .excluded,
            note: "세탁업은 창업감면·특별감면 대상 아님 — 공통 4종(성실사업자·노란우산 등)만 해당."
        ),
        .init(
            specialtyId: "repair-service",
            categoryId: "living-service",
            ksicHint: "개인·소비용품 수리업 (95)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "개인 및 소비용품 수리업 = 창업감면 대상(§6③14가)."
        ),
        .init(
            specialtyId: "device-repair",
            categoryId: "living-service",
            ksicHint: "개인·소비용품 수리업 (95)",
            startupReduction: .eligible,
            specialReduction: .excluded,
            note: "개인 및 소비용품 수리업 = 창업감면 대상(§6③14가)."
        ),
        .init(
            specialtyId: "cleaning-service",
            categoryId: "living-service",
            ksicHint: "사업시설관리/청소 (74)",
            startupReduction: .likely,
            specialReduction: .excluded,
            note: "사업시설 관리·사업지원 서비스업은 창업감면 대상(§6③)이나 세부 청소업 분류 확인 권장."
        ),
        .init(
            specialtyId: "print-copy",
            categoryId: "living-service",
            ksicHint: "인쇄업(18) 또는 출력·복사 서비스",
            startupReduction: .check,
            specialReduction: .check,
            note: "인쇄업이면 제조업으로 §6·§7 대상 가능, 단순 출력·복사면 서비스 — 등록업종 확인 필요."
        ),
        .init(
            specialtyId: "guesthouse",
            categoryId: "space",
            ksicHint: "일반/생활숙박업 (55)",
            startupReduction: .likely,
            specialReduction: .excluded,
            note: "관광진흥법상 '관광숙박업' 등록 시 창업감면 대상(§6③16). 일반 숙박업 등록이면 대상 여부 세무사 확인."
        ),
        .init(
            specialtyId: "rental-studio",
            categoryId: "space",
            ksicHint: "부동산 임대업 (68)",
            startupReduction: .excluded,
            specialReduction: .excluded,
            note: "부동산 임대업은 창업감면·특별감면 대상 아님 — 공통 4종만 해당."
        ),
        .init(
            specialtyId: "shared-office",
            categoryId: "space",
            ksicHint: "부동산 임대업 (68)",
            startupReduction: .excluded,
            specialReduction: .excluded,
            note: "부동산 임대업은 창업감면·특별감면 대상 아님 — 공통 4종만 해당."
        ),
        .init(
            specialtyId: "party-room",
            categoryId: "space",
            ksicHint: "부동산 임대업 (68)",
            startupReduction: .excluded,
            specialReduction: .excluded,
            note: "부동산 임대업은 창업감면·특별감면 대상 아님 — 공통 4종만 해당."
        ),
        .init(
            specialtyId: "practice-room",
            categoryId: "space",
            ksicHint: "부동산 임대업 (68)",
            startupReduction: .excluded,
            specialReduction: .excluded,
            note: "부동산 임대업은 창업감면·특별감면 대상 아님 — 공통 4종만 해당."
        ),
        .init(
            specialtyId: "study-cafe-space",
            categoryId: "space",
            ksicHint: "독서실/스터디카페 (85 또는 68)",
            startupReduction: .check,
            specialReduction: .excluded,
            note: "스터디카페는 독서실운영업/공간임대 혼합 — 창업감면 대상 여부 불명확, 세무사 확인."
        ),
        .init(
            specialtyId: "smart-store",
            categoryId: "online-digital",
            ksicHint: "전자상거래·통신판매업 (47912)",
            startupReduction: .likely,
            specialReduction: .eligible,
            note: "통신판매업은 창업감면 대상(§6③7)일 수 있고, 전자상거래 소매는 특별감면(§7) 도소매 대상. 판매 vs 중개 구조에 따라 다름 — 확인 권장."
        ),
        .init(
            specialtyId: "consignment-commerce",
            categoryId: "online-digital",
            ksicHint: "전자상거래·통신판매업 (47912)",
            startupReduction: .likely,
            specialReduction: .eligible,
            note: "통신판매업은 창업감면 대상(§6③7)일 수 있고, 전자상거래 소매는 특별감면(§7) 도소매 대상. 판매 vs 중개 구조에 따라 다름 — 확인 권장."
        ),
        .init(
            specialtyId: "global-buying",
            categoryId: "online-digital",
            ksicHint: "전자상거래·통신판매업 (47912)",
            startupReduction: .likely,
            specialReduction: .eligible,
            note: "통신판매업은 창업감면 대상(§6③7)일 수 있고, 전자상거래 소매는 특별감면(§7) 도소매 대상. 판매 vs 중개 구조에 따라 다름 — 확인 권장."
        ),
        .init(
            specialtyId: "digital-products",
            categoryId: "online-digital",
            ksicHint: "정보통신업/디지털콘텐츠 (58·63)",
            startupReduction: .likely,
            specialReduction: .likely,
            note: "디지털콘텐츠·정보서비스는 정보통신업으로 §6·§7 대상 가능(비디오감상실·뉴스제공 등 제외 항목 주의)."
        ),
        .init(
            specialtyId: "newsletter-membership",
            categoryId: "online-digital",
            ksicHint: "정보통신업/디지털콘텐츠 (58·63)",
            startupReduction: .likely,
            specialReduction: .likely,
            note: "디지털콘텐츠·정보서비스는 정보통신업으로 §6·§7 대상 가능(비디오감상실·뉴스제공 등 제외 항목 주의)."
        ),
        .init(
            specialtyId: "creator-service",
            categoryId: "online-digital",
            ksicHint: "1인미디어/기타 정보서비스 (63)",
            startupReduction: .check,
            specialReduction: .check,
            note: "크리에이터·1인미디어는 등록업종이 정보통신/광고/기타로 갈려 대상 여부 불명확 — 세무사 확인."
        ),
        .init(
            specialtyId: "ai-application",
            categoryId: "startup-tech",
            ksicHint: "소프트웨어 개발·정보통신업 (582·62·63)",
            startupReduction: .eligible,
            specialReduction: .eligible,
            note: "소프트웨어·정보통신업 = 창업감면(§6③8)·특별감면(§7) 모두 대상. 벤처확인 시 창업벤처 감면 추가 검토."
        ),
        .init(
            specialtyId: "developer-tools",
            categoryId: "startup-tech",
            ksicHint: "소프트웨어 개발·정보통신업 (582·62·63)",
            startupReduction: .eligible,
            specialReduction: .eligible,
            note: "소프트웨어·정보통신업 = 창업감면(§6③8)·특별감면(§7) 모두 대상. 벤처확인 시 창업벤처 감면 추가 검토."
        ),
        .init(
            specialtyId: "b2b-saas",
            categoryId: "startup-tech",
            ksicHint: "소프트웨어 개발·정보통신업 (582·62·63)",
            startupReduction: .eligible,
            specialReduction: .eligible,
            note: "소프트웨어·정보통신업 = 창업감면(§6③8)·특별감면(§7) 모두 대상. 벤처확인 시 창업벤처 감면 추가 검토."
        ),
        .init(
            specialtyId: "fintech-startup",
            categoryId: "startup-tech",
            ksicHint: "소프트웨어 개발·정보통신업 (582·62·63)",
            startupReduction: .eligible,
            specialReduction: .eligible,
            note: "소프트웨어·정보통신업 = 창업감면(§6③8)·특별감면(§7) 모두 대상. 벤처확인 시 창업벤처 감면 추가 검토."
        ),
        .init(
            specialtyId: "healthtech-startup",
            categoryId: "startup-tech",
            ksicHint: "소프트웨어 개발·정보통신업 (582·62·63)",
            startupReduction: .eligible,
            specialReduction: .eligible,
            note: "소프트웨어·정보통신업 = 창업감면(§6③8)·특별감면(§7) 모두 대상. 벤처확인 시 창업벤처 감면 추가 검토."
        ),
        .init(
            specialtyId: "security-startup",
            categoryId: "startup-tech",
            ksicHint: "소프트웨어 개발·정보통신업 (582·62·63)",
            startupReduction: .eligible,
            specialReduction: .eligible,
            note: "소프트웨어·정보통신업 = 창업감면(§6③8)·특별감면(§7) 모두 대상. 벤처확인 시 창업벤처 감면 추가 검토."
        ),
        .init(
            specialtyId: "hardware-iot",
            categoryId: "startup-tech",
            ksicHint: "전자부품·기계 제조업 (26·29)",
            startupReduction: .eligible,
            specialReduction: .eligible,
            note: "제조업 = 창업감면(§6③1)·특별감면(§7) 모두 대상."
        ),
        .init(
            specialtyId: "robotics-physical-ai",
            categoryId: "startup-tech",
            ksicHint: "전자부품·기계 제조업 (26·29)",
            startupReduction: .eligible,
            specialReduction: .eligible,
            note: "제조업 = 창업감면(§6③1)·특별감면(§7) 모두 대상."
        ),
        .init(
            specialtyId: "semiconductor",
            categoryId: "startup-tech",
            ksicHint: "전자부품·기계 제조업 (26·29)",
            startupReduction: .eligible,
            specialReduction: .eligible,
            note: "제조업 = 창업감면(§6③1)·특별감면(§7) 모두 대상."
        ),
        .init(
            specialtyId: "biotech-medtech",
            categoryId: "startup-tech",
            ksicHint: "의료·화학 제조 또는 연구개발 (21·70)",
            startupReduction: .likely,
            specialReduction: .likely,
            note: "제조업이면 §6·§7 대상, 연구개발(R&D)업이면 대상 범위 다름 — 등록업종 확인 권장."
        ),
        .init(
            specialtyId: "climate-energy",
            categoryId: "startup-tech",
            ksicHint: "의료·화학 제조 또는 연구개발 (21·70)",
            startupReduction: .likely,
            specialReduction: .likely,
            note: "제조업이면 §6·§7 대상, 연구개발(R&D)업이면 대상 범위 다름 — 등록업종 확인 권장."
        ),
    ]

    /// 세금 신고 일정 (부가세·종소세·원천세 등).
    public static let events: [TaxScheduleEvent] = [
        .init(
            id: "vat-q1-confirm",
            category: "vat",
            title: "부가세 확정신고 (1기)",
            description: "1~6월 매출·매입에 대한 부가가치세 확정 신고 및 납부",
            month: 7,
            day: 25,
            appliesToSimplified: false,
            requiresEmployees: false
        ),
        .init(
            id: "vat-q2-confirm",
            category: "vat",
            title: "부가세 확정신고 (2기)",
            description: "7~12월 매출·매입에 대한 부가가치세 확정 신고 및 납부",
            month: 1,
            day: 25,
            appliesToSimplified: false,
            requiresEmployees: false
        ),
        .init(
            id: "vat-q1-preliminary",
            category: "vat",
            title: "부가세 예정신고 (1기)",
            description: "1~3월분 부가가치세 예정 신고 (소규모는 고지 납부)",
            month: 4,
            day: 25,
            appliesToSimplified: false,
            requiresEmployees: false
        ),
        .init(
            id: "vat-q2-preliminary",
            category: "vat",
            title: "부가세 예정신고 (2기)",
            description: "7~9월분 부가가치세 예정 신고 (소규모는 고지 납부)",
            month: 10,
            day: 25,
            appliesToSimplified: false,
            requiresEmployees: false
        ),
        .init(
            id: "vat-simplified",
            category: "vat",
            title: "간이과세자 부가세 신고",
            description: "전년도 매출에 대한 부가가치세 신고 및 납부 (연 1회)",
            month: 1,
            day: 25,
            appliesToSimplified: true,
            requiresEmployees: false
        ),
        .init(
            id: "income-tax-annual",
            category: "income_tax",
            title: "종합소득세 신고",
            description: "전년도 사업소득에 대한 종합소득세 확정 신고 및 납부",
            month: 5,
            day: 31,
            appliesToSimplified: true,
            requiresEmployees: false
        ),
        .init(
            id: "income-tax-prepayment",
            category: "income_tax",
            title: "종합소득세 중간예납",
            description: "올해 소득세의 1/2을 미리 납부 (고지서 기반)",
            month: 11,
            day: 30,
            appliesToSimplified: true,
            requiresEmployees: false
        ),
        .init(
            id: "withholding-monthly",
            category: "withholding",
            title: "원천세 신고·납부",
            description: "직원 급여에서 원천징수한 소득세·지방소득세 납부",
            month: 0,
            day: 10,
            appliesToSimplified: true,
            requiresEmployees: true
        ),
        .init(
            id: "withholding-semi",
            category: "withholding",
            title: "원천세 반기 납부 (선택 시)",
            description: "소규모 사업자: 반기별 원천세 일괄 납부 (1~6월분 → 7/10, 7~12월분 → 1/10)",
            month: 7,
            day: 10,
            appliesToSimplified: true,
            requiresEmployees: true
        ),
        .init(
            id: "local-income-tax",
            category: "local_tax",
            title: "지방소득세 신고",
            description: "종합소득세와 함께 지방소득세도 별도 신고 (위택스)",
            month: 5,
            day: 31,
            appliesToSimplified: true,
            requiresEmployees: false
        ),
        .init(
            id: "insurance-monthly",
            category: "insurance",
            title: "4대 보험료 납부",
            description: "국민연금·건강보험·고용보험·산재보험 월 납부",
            month: 0,
            day: 10,
            appliesToSimplified: true,
            requiresEmployees: true
        ),
        .init(
            id: "bookkeeping-monthly",
            category: "bookkeeping",
            title: "월 마감 장부 정리",
            description: "이번 달 매출·매입·경비 장부를 정리하고 다음 달 준비",
            month: 0,
            day: 5,
            appliesToSimplified: true,
            requiresEmployees: false
        ),
    ]

    /// specialtyId 우선, 없으면 categoryId 대표값 폴백.
    public static func mapping(specialtyId: String?, categoryId: String?) -> SpecialtyTaxMapping? {
        if let sid = specialtyId, let exact = specialty.first(where: { $0.specialtyId == sid }) {
            return exact
        }
        if let cid = categoryId {
            return specialty.first(where: { $0.categoryId == cid })
        }
        return nil
    }
}
