//
//  StoreInfoSchema.swift — "내 가게" 섹션/필드 스키마 (Swift mirror of web SSOT)
//
//  ⚠️ 웹 SSOT: apps/web/app/lib/data/store-info-schema.ts
//
//  Phase A: 공통 7섹션 (Identity, Legal, Money, People, Insurance, Footprint*2)
//  Phase B (next commit): CATEGORY_SECTIONS 11 cluster
//  Phase C (next): SUBINDUSTRY_MODIFIERS 80 prefills
//

import Foundation

// MARK: - Field types

public enum FieldType: String, Sendable {
    case text
    case textarea
    case number
    case won
    case percent
    case date
    case time
    case select
    case multiselect
    case phone
    case url
    case email
}

public struct FieldOption: Sendable, Hashable {
    public let value: String
    public let label: String

    public init(_ value: String, _ label: String) {
        self.value = value; self.label = label
    }
}

public struct FieldSpec: Sendable, Hashable {
    public let key: String
    public let label: String
    public let type: FieldType
    public let helper: String?
    public let placeholder: String?
    public let options: [FieldOption]
    public let trackExpiry: Bool
    public let optional: Bool
    public let unit: String?

    public init(_ key: String, _ label: String, _ type: FieldType,
                helper: String? = nil, placeholder: String? = nil,
                options: [FieldOption] = [], trackExpiry: Bool = false,
                optional: Bool = false, unit: String? = nil) {
        self.key = key; self.label = label; self.type = type
        self.helper = helper; self.placeholder = placeholder
        self.options = options; self.trackExpiry = trackExpiry
        self.optional = optional; self.unit = unit
    }
}

// MARK: - Section spec

public struct ArrayItemSpec: Sendable {
    public let titleField: String
    public let fields: [FieldSpec]
    public let addLabel: String
    public let emptyText: String
    public let expiryKey: String?

    public init(titleField: String, fields: [FieldSpec], addLabel: String,
                emptyText: String, expiryKey: String? = nil) {
        self.titleField = titleField; self.fields = fields
        self.addLabel = addLabel; self.emptyText = emptyText; self.expiryKey = expiryKey
    }
}

public struct SectionSpec: Sendable {
    public let id: String
    public let title: String
    public let subtitle: String?
    public let icon: String          // SF Symbol
    public let fields: [FieldSpec]
    public let arrayItem: ArrayItemSpec?

    public init(id: String, title: String, subtitle: String? = nil, icon: String,
                fields: [FieldSpec] = [], arrayItem: ArrayItemSpec? = nil) {
        self.id = id; self.title = title; self.subtitle = subtitle
        self.icon = icon; self.fields = fields; self.arrayItem = arrayItem
    }
}

// MARK: - Footprint mode

public enum FootprintMode: String, Sendable {
    case tenancy
    case digital
    case mobile
    case none
}

// MARK: - Common sections

public enum StoreInfoSchema {

    // ── Identity ──
    public static let identity = SectionSpec(
        id: "identity",
        title: "가게 소개 · 위치",
        subtitle: "내 가게의 얼굴 — 사진·소개·연락처·위치",
        icon: "building.2",
        fields: [
            FieldSpec("mission", "미션 (Why)", .textarea,
                     helper: "장기 의사결정·채용·브랜드의 기준. 1~2문장 권장.",
                     placeholder: "예: '바쁜 청년에게 집밥의 따뜻함을 5천원에'", optional: true),
            FieldSpec("shortDescription", "한 줄 소개", .text,
                     placeholder: "예: 청년 사장의 든든한 한 끼", optional: true),
            FieldSpec("longDescription", "긴 소개 (메뉴판·SNS·홈페이지에 사용)", .textarea,
                     placeholder: "5~10줄. 컨셉·강점·운영 철학", optional: true),
            FieldSpec("addressRoad", "도로명 주소", .text,
                     placeholder: "예: 서울 마포구 양화로 162"),
            FieldSpec("addressDetail", "상세 주소", .text,
                     placeholder: "예: 빌딩명·층·호수", optional: true),
            FieldSpec("regionCode", "행정동 / 시군구", .text,
                     placeholder: "예: 서울 마포구 합정동", optional: true),
            FieldSpec("phone", "가게 전화", .phone,
                     placeholder: "02-XXXX-XXXX", optional: true),
            FieldSpec("ownerPhone", "사장 핸드폰 (비공개 가능)", .phone, optional: true),
            FieldSpec("websiteUrl", "홈페이지 / 자체몰", .url, optional: true),
            FieldSpec("instagramUrl", "인스타그램", .url, optional: true),
            FieldSpec("naverPlaceUrl", "네이버 플레이스", .url, optional: true),
            FieldSpec("kakaoPlaceUrl", "카카오맵", .url, optional: true),
            FieldSpec("weeklyHolidays", "정기 휴무일", .multiselect, options: [
                FieldOption("mon", "월"), FieldOption("tue", "화"), FieldOption("wed", "수"),
                FieldOption("thu", "목"), FieldOption("fri", "금"), FieldOption("sat", "토"),
                FieldOption("sun", "일"),
            ], optional: true),
            FieldSpec("breakTime", "브레이크 타임", .text,
                     placeholder: "예: 15:00–17:00", optional: true),
        ]
    )

    // ── Legal ──
    public static let legal = SectionSpec(
        id: "legal",
        title: "법적 · 인허가",
        subtitle: "사업자등록 · 인허가 · 4대보험 만료일 통합 관리",
        icon: "checkmark.shield",
        fields: [
            FieldSpec("bizRegistrationNumber", "사업자등록번호", .text, placeholder: "000-00-00000"),
            FieldSpec("bizRegistrationDate", "사업자등록 발급일", .date),
            FieldSpec("bizRegistrationType", "과세 유형", .select, options: [
                FieldOption("simplified", "간이과세"),
                FieldOption("standard",   "일반과세"),
                FieldOption("vat-exempt", "면세"),
                FieldOption("corporation","법인"),
            ]),
            FieldSpec("industryCode", "업종코드", .text, placeholder: "예: 552111", optional: true),
            FieldSpec("telecomSalesNumber", "통신판매업 신고번호", .text,
                     helper: "온라인 판매·예약 시 필수", optional: true),
            FieldSpec("fourInsuranceEstablished", "4대보험 사업장 성립신고", .select, options: [
                FieldOption("done",          "완료"),
                FieldOption("in-progress",   "진행 중"),
                FieldOption("not-required",  "해당 없음 (1인)"),
            ]),
        ],
        arrayItem: ArrayItemSpec(
            titleField: "name",
            fields: [
                FieldSpec("name", "인허가/면허명", .text,
                         placeholder: "예: 일반음식점 영업신고"),
                FieldSpec("issuedAt", "발급일", .date),
                FieldSpec("expiresAt", "만료일", .date, trackExpiry: true, optional: true),
                FieldSpec("issuedBy", "발급기관", .text,
                         placeholder: "예: 마포구청 위생과", optional: true),
                FieldSpec("certNumber", "증서 번호", .text, optional: true),
                FieldSpec("memo", "메모", .textarea, optional: true),
            ],
            addLabel: "+ 인허가/면허 추가",
            emptyText: "영업신고·인허가·자격증·교육수료 등 만료일이 있는 항목을 추가하세요",
            expiryKey: "expiresAt"
        )
    )

    // ── Money Infrastructure ──
    public static let moneyInfra = SectionSpec(
        id: "money-infra",
        title: "자금 인프라",
        subtitle: "통장 · 카드 · 결제 단말기 · 세무 — 가게의 자금 동맥",
        icon: "creditcard",
        fields: [
            FieldSpec("bizBankName", "사업용 통장 (은행)", .select, options: [
                FieldOption("ibk",        "IBK 기업은행"),
                FieldOption("kakaobank",  "카카오뱅크"),
                FieldOption("woori",      "우리은행"),
                FieldOption("shinhan",    "신한은행"),
                FieldOption("kb",         "국민은행"),
                FieldOption("hana",       "하나은행"),
                FieldOption("nh",         "농협"),
                FieldOption("kbank",      "케이뱅크"),
                FieldOption("toss",       "토스뱅크"),
                FieldOption("other",      "기타"),
            ]),
            FieldSpec("bizBankAccountMasked", "계좌번호 (뒷 4자리)", .text,
                     placeholder: "예: ****-1234", optional: true),
            FieldSpec("bizCardIssued", "사업용 카드 분리 여부", .select, options: [
                FieldOption("yes", "분리됨"),
                FieldOption("no",  "개인카드 혼용"),
            ]),
            FieldSpec("posTerminal", "카드 단말기 / PG", .select, options: [
                FieldOption("tossplace", "토스플레이스"),
                FieldOption("kis",       "KIS정보통신"),
                FieldOption("nice",      "나이스정보통신"),
                FieldOption("smartro",   "스마트로"),
                FieldOption("kcp",       "KCP"),
                FieldOption("inicis",    "이니시스"),
                FieldOption("kakaopay",  "카카오페이"),
                FieldOption("naverpay",  "네이버페이"),
                FieldOption("stripe",    "Stripe"),
                FieldOption("other",     "기타"),
            ], optional: true),
            FieldSpec("taxHandling", "세무 처리 방식", .select, options: [
                FieldOption("self",   "셀프 신고"),
                FieldOption("cpa",    "세무사 위임"),
                FieldOption("hybrid", "혼합 (월 셀프 + 연 세무사)"),
            ]),
            FieldSpec("cpaName", "세무사 사무소명 / 담당자", .text, optional: true),
            FieldSpec("cpaPhone", "세무사 연락처", .phone, optional: true),
        ]
    )

    // ── People ──
    public static let people = SectionSpec(
        id: "people",
        title: "사람 · 거래처",
        subtitle: "직원 · 거래처 · 외주 — 가게를 굴리는 사람들",
        icon: "person.2",
        arrayItem: ArrayItemSpec(
            titleField: "name",
            fields: [
                FieldSpec("name", "이름 / 상호", .text),
                FieldSpec("kind", "구분", .select, options: [
                    FieldOption("employee-fulltime", "직원 (정규)"),
                    FieldOption("employee-parttime", "직원 (아르바이트)"),
                    FieldOption("freelancer",        "프리랜서/외주"),
                    FieldOption("vendor-supplier",   "공급처"),
                    FieldOption("vendor-service",    "서비스 (세무/노무/디자인)"),
                    FieldOption("landlord",          "임대인"),
                ]),
                FieldSpec("role", "역할 / 품목", .text,
                         placeholder: "예: 매니저 / 식자재 도매"),
                FieldSpec("phone", "연락처", .phone, optional: true),
                FieldSpec("startDate", "시작일 / 입사일", .date, optional: true),
                FieldSpec("fourInsurance", "4대보험 가입 (직원만)", .select, options: [
                    FieldOption("yes", "가입"),
                    FieldOption("no",  "미가입"),
                    FieldOption("na",  "해당없음"),
                ], optional: true),
                FieldSpec("wage", "시급/월급/단가", .won, optional: true),
                FieldSpec("memo", "메모", .textarea, optional: true),
            ],
            addLabel: "+ 직원/거래처/외주 추가",
            emptyText: "직원·핵심 거래처·세무사·노무사 등 추가"
        )
    )

    // ── Insurance ──
    public static let insurance = SectionSpec(
        id: "insurance",
        title: "보험",
        subtitle: "화재 · 배상책임 · 근재 · 자동차 — 위험 헷지의 핵심",
        icon: "umbrella",
        arrayItem: ArrayItemSpec(
            titleField: "name",
            fields: [
                FieldSpec("name", "보험명", .text, placeholder: "예: 화재배상책임보험"),
                FieldSpec("type", "종류", .select, options: [
                    FieldOption("fire",              "화재"),
                    FieldOption("general-liability", "배상책임"),
                    FieldOption("workers-comp",      "근로자재해 (근재)"),
                    FieldOption("product-liability", "생산물책임"),
                    FieldOption("auto",              "자동차"),
                    FieldOption("property",          "재산종합"),
                    FieldOption("professional",      "전문직 책임"),
                    FieldOption("cyber",             "사이버"),
                    FieldOption("other",             "기타"),
                ]),
                FieldSpec("insurer", "보험사", .text, placeholder: "예: 삼성화재"),
                FieldSpec("policyNumber", "증권번호", .text, optional: true),
                FieldSpec("startDate", "가입일", .date, optional: true),
                FieldSpec("expiresAt", "갱신/만료일", .date, trackExpiry: true),
                FieldSpec("annualPremium", "연 보험료", .won, optional: true),
                FieldSpec("coverageAmount", "보상한도", .won, optional: true),
                FieldSpec("memo", "특약·비고", .textarea, optional: true),
            ],
            addLabel: "+ 보험 추가",
            emptyText: "보험 정책을 추가하세요",
            expiryKey: "expiresAt"
        )
    )

    // ── Footprint (Tenancy — 오프라인) ──
    public static let footprintTenancy = SectionSpec(
        id: "footprint",
        title: "임대차 · 거점",
        subtitle: "임대 계약 · D-day · 보증금/월세",
        icon: "building",
        fields: [
            FieldSpec("leaseStartDate", "임대 시작일", .date),
            FieldSpec("leaseEndDate", "임대 종료일", .date,
                     helper: "갱신 협의 기점", trackExpiry: true),
            FieldSpec("depositKrw", "보증금", .won),
            FieldSpec("monthlyRentKrw", "월세", .won),
            FieldSpec("monthlyMaintenanceKrw", "관리비", .won, optional: true),
            FieldSpec("areaSqm", "면적", .number, optional: true, unit: "m²"),
            FieldSpec("areaPyeong", "평수", .number, optional: true, unit: "평"),
            FieldSpec("floor", "층수", .text,
                     placeholder: "예: 1층 / B1", optional: true),
            FieldSpec("landlordName", "임대인 / 건물주", .text, optional: true),
            FieldSpec("landlordPhone", "임대인 연락처", .phone, optional: true),
            FieldSpec("renewalIntent", "갱신 의향", .select, options: [
                FieldOption("auto-renew", "자동 갱신 예정"),
                FieldOption("negotiate",  "갱신 협의 중"),
                FieldOption("move-out",   "이전 검토 중"),
                FieldOption("undecided",  "미정"),
            ], optional: true),
        ]
    )

    // ── Footprint (Digital — 온라인·스타트업) ──
    public static let footprintDigital = SectionSpec(
        id: "footprint",
        title: "디지털 거점",
        subtitle: "도메인 · 호스팅 · 물류 — 온라인 가게의 거점",
        icon: "globe",
        arrayItem: ArrayItemSpec(
            titleField: "name",
            fields: [
                FieldSpec("name", "이름 / 서비스명", .text,
                         placeholder: "예: example.co.kr / 카페24 호스팅"),
                FieldSpec("kind", "구분", .select, options: [
                    FieldOption("domain",      "도메인"),
                    FieldOption("hosting",     "호스팅 (자체몰)"),
                    FieldOption("platform",    "쇼핑몰 플랫폼"),
                    FieldOption("cdn",         "CDN"),
                    FieldOption("logistics",   "택배사 / 물류"),
                    FieldOption("fulfillment", "풀필먼트 (3PL)"),
                ]),
                FieldSpec("vendorName", "공급사 / 등록기관", .text, optional: true),
                FieldSpec("monthlyFeeKrw", "월 비용", .won, optional: true),
                FieldSpec("expiresAt", "갱신/만료일", .date,
                         trackExpiry: true, optional: true),
                FieldSpec("memo", "메모", .textarea, optional: true),
            ],
            addLabel: "+ 도메인/호스팅/물류 추가",
            emptyText: "도메인·자체몰 호스팅·택배사 계약 등 추가",
            expiryKey: "expiresAt"
        )
    )

    // ── Footprint (Mobile — 출장형) ──
    public static let footprintVehicles = SectionSpec(
        id: "footprint",
        title: "차량 · 출장 거점",
        subtitle: "출장형 — 차량·이동수단·출장 운영비",
        icon: "car",
        arrayItem: ArrayItemSpec(
            titleField: "name",
            fields: [
                FieldSpec("name", "차량/이동수단", .text,
                         placeholder: "예: 영업용 1톤 트럭"),
                FieldSpec("plateNumber", "차량번호", .text, optional: true),
                FieldSpec("purchaseDate", "구입/리스 시작", .date, optional: true),
                FieldSpec("purchasePriceKrw", "구입가/리스료", .won, optional: true),
                FieldSpec("insuranceExpiresAt", "자동차 보험 만료", .date,
                         trackExpiry: true, optional: true),
                FieldSpec("memo", "메모", .textarea, optional: true),
            ],
            addLabel: "+ 차량/이동수단 추가",
            emptyText: "영업용 차량·이동수단·출장 운영비 추가",
            expiryKey: "insuranceExpiresAt"
        )
    )

    // ── Category section: menu-ingredients (food / cafe-dessert) ──
    public static let menuIngredients = SectionSpec(
        id: "menu-ingredients",
        title: "메뉴 · 식자재",
        subtitle: "실제 매출을 만드는 메뉴와 핵심 식자재 — 원가율·일일 회전 계산의 기초",
        icon: "fork.knife",
        arrayItem: ArrayItemSpec(
            titleField: "name",
            fields: [
                FieldSpec("kind", "종류", .select, options: [
                    FieldOption("menu",       "메뉴"),
                    FieldOption("drink",      "음료"),
                    FieldOption("dessert",    "디저트"),
                    FieldOption("ingredient", "식자재"),
                    FieldOption("supply",     "비품/소모품"),
                ]),
                FieldSpec("name", "이름", .text,
                         placeholder: "예: 김치찌개 / 한우 등심"),
                FieldSpec("unit", "단위", .text,
                         placeholder: "예: 1접시 / 1잔 / kg", optional: true),
                FieldSpec("costPerUnit", "원가/단위", .won, optional: true),
                FieldSpec("pricePerUnit", "판매가", .won, optional: true),
                FieldSpec("dailyTurnover", "일 회전(잔/접시)", .number,
                         optional: true, unit: "건"),
                FieldSpec("note", "메모", .textarea, optional: true),
            ],
            addLabel: "+ 메뉴/식자재 추가",
            emptyText: "시그니처 메뉴와 핵심 식자재를 등록하세요"
        )
    )

    // ── Category section: product-catalog (retail) ──
    public static let productCatalog = SectionSpec(
        id: "product-catalog",
        title: "상품 카탈로그",
        subtitle: "매대 위 상품 — 재고·가격·단가 관리",
        icon: "bag",
        arrayItem: ArrayItemSpec(
            titleField: "name",
            fields: [
                FieldSpec("name", "상품명", .text),
                FieldSpec("sku", "SKU", .text, optional: true),
                FieldSpec("pricePerUnit", "판매가", .won, optional: true),
                FieldSpec("cost", "원가", .won, optional: true),
                FieldSpec("stock", "재고", .number,
                         optional: true, unit: "개"),
                FieldSpec("note", "메모", .textarea, optional: true),
            ],
            addLabel: "+ 상품 추가",
            emptyText: "주력 상품·SKU 를 등록하세요 (전체 카탈로그는 별도 재고 관리 사용)"
        )
    )

    // ── Category section: service-menu (beauty) ──
    public static let serviceMenu = SectionSpec(
        id: "service-menu",
        title: "시술 메뉴",
        subtitle: "제공하는 시술 — 시술 시간·단가·인기도",
        icon: "scissors",
        arrayItem: ArrayItemSpec(
            titleField: "name",
            fields: [
                FieldSpec("name", "시술명", .text,
                         placeholder: "예: 컷 + 펌 / 젤네일"),
                FieldSpec("durationMinutes", "소요(분)", .number,
                         optional: true, unit: "분"),
                FieldSpec("price", "판매가", .won, optional: true),
                FieldSpec("cost", "원가/자재", .won, optional: true),
                FieldSpec("note", "메모", .textarea, optional: true),
            ],
            addLabel: "+ 시술 메뉴 추가",
            emptyText: "주력 시술과 가격을 등록하세요"
        )
    )

    // ── Category section: instructors (fitness) ──
    public static let instructors = SectionSpec(
        id: "instructors",
        title: "강사 · 전문가",
        subtitle: "강의·PT·수업 진행자 — 일정·전문분야·연락처",
        icon: "figure.stand",
        arrayItem: ArrayItemSpec(
            titleField: "name",
            fields: [
                FieldSpec("name", "이름", .text),
                FieldSpec("role", "역할", .text,
                         placeholder: "예: PT 강사 / 필라테스 마스터", optional: true),
                FieldSpec("phone", "연락처", .phone, optional: true),
                FieldSpec("specialty", "전문 분야", .text,
                         placeholder: "예: 필라테스 / 골프 / 요가", optional: true),
                FieldSpec("schedule", "수업 시간", .text,
                         placeholder: "예: 월·수·금 19:00", optional: true),
            ],
            addLabel: "+ 강사 추가",
            emptyText: "강사·트레이너·PT 코치를 추가하세요"
        )
    )

    // ── Category section: sales-channels (online-digital) ──
    public static let salesChannels = SectionSpec(
        id: "sales-channels",
        title: "판매 채널",
        subtitle: "실제 매출이 나는 채널 — 자체몰·스마트스토어·쿠팡·마켓플레이스",
        icon: "cart",
        arrayItem: ArrayItemSpec(
            titleField: "name",
            fields: [
                FieldSpec("name", "채널명", .text,
                         placeholder: "예: 스마트스토어 / 쿠팡 / 자체몰"),
                FieldSpec("url", "채널 URL", .url, optional: true),
                FieldSpec("feeRate", "수수료율", .percent,
                         optional: true, unit: "%"),
                FieldSpec("active", "활성", .select, options: [
                    FieldOption("active",   "운영 중"),
                    FieldOption("paused",   "일시 중지"),
                    FieldOption("inactive", "비활성"),
                ], optional: true),
                FieldSpec("note", "메모", .textarea, optional: true),
            ],
            addLabel: "+ 판매 채널 추가",
            emptyText: "스마트스토어·쿠팡·자체몰 등 입점 채널을 추가하세요"
        )
    )

    // ── Category section: ip (startup-tech) ──
    public static let ip = SectionSpec(
        id: "ip",
        title: "지식재산권",
        subtitle: "특허·상표·저작권·영업비밀 — IP 포트폴리오",
        icon: "doc.badge.gearshape",
        arrayItem: ArrayItemSpec(
            titleField: "title",
            fields: [
                FieldSpec("kind", "종류", .select, options: [
                    FieldOption("patent",       "특허"),
                    FieldOption("trademark",    "상표"),
                    FieldOption("copyright",    "저작권"),
                    FieldOption("trade-secret", "영업비밀"),
                ]),
                FieldSpec("title", "명칭", .text,
                         placeholder: "예: 핵심 알고리즘 특허"),
                FieldSpec("applicationNumber", "출원/등록 번호", .text, optional: true),
                FieldSpec("registeredAt", "출원/등록일", .date,
                         trackExpiry: true, optional: true),
                FieldSpec("country", "국가", .text,
                         placeholder: "예: KR / US / EU", optional: true),
                FieldSpec("note", "메모", .textarea, optional: true),
            ],
            addLabel: "+ IP 추가",
            emptyText: "특허·상표·저작권·영업비밀 항목을 추가하세요",
            expiryKey: "registeredAt"
        )
    )

    // ── Common section list ──
    public static let common: [SectionSpec] = [
        identity, legal, moneyInfra, people, insurance
    ]

    /// Footprint variant 선택 (cluster 별).
    public static func footprint(for mode: FootprintMode) -> SectionSpec? {
        switch mode {
        case .tenancy: return footprintTenancy
        case .digital: return footprintDigital
        case .mobile:  return footprintVehicles
        case .none:    return nil
        }
    }

    /// 카테고리 ID → 동적 섹션 목록 (web SSOT 의 CATEGORY_SECTIONS 미러).
    /// Phase B 구현 — food/cafe-dessert/retail/beauty/fitness/online-digital/startup-tech 만.
    public static func categorySections(for categoryId: String) -> [SectionSpec] {
        switch categoryId {
        case "food", "cafe-dessert":   return [menuIngredients]
        case "retail":                  return [productCatalog]
        case "beauty":                  return [serviceMenu]
        case "fitness":                 return [instructors]
        case "online-digital":          return [salesChannels]
        case "startup-tech":            return [ip]
        default:                        return []
        }
    }

    /// 모든 카테고리별 동적 섹션 ID 의 set — Accessor 라우팅 용.
    public static let categorySectionIds: Set<String> = [
        "menu-ingredients", "product-catalog", "service-menu",
        "instructors", "sales-channels", "ip",
    ]
}
