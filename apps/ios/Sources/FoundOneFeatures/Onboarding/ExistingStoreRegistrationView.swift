//
//  ExistingStoreRegistrationView.swift — 이미 운영 중인 가게 등록 (7단계)
//
//  웹 ExistingBusinessOnboarding.tsx 와 데이터 동치 (data parity).
//  수집 데이터:
//    Step 1 업종      — category, industryOptionId
//    Step 2 가게 정보 — storeName, startupType, preferredRegion,
//                       businessOpenTime/CloseTime, weeklyHolidays
//    Step 3 세무·행정 — vatType, hasEmployees, cpaDecision, launchDate,
//                       bizRegistrationNumber (optional)
//    Step 4 월 비용   — monthlyCosts (ingredients/labor/rent/utilities/other),
//                       capital (optional)
//    Step 5 운영 채널 — deliveryPlatforms, snsChannels, posId
//    Step 6 주소·인허가 — addressRoad (optional), obtainedPermits
//    Step 7 등록 완료 — summary review → onComplete 호출
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore

// MARK: - Payload

public struct ObtainedPermit: Sendable, Hashable, Codable {
    public let id: String
    public let name: String
    public init(id: String, name: String) { self.id = id; self.name = name }
}

public struct StoreRegistration: Sendable, Hashable {
    // Step 1
    public let category: IndustryCategory
    public let industryCategoryId: String     // StarterIndustryData category id
    public let industryOptionId: String       // StarterIndustryOption id
    // Step 2
    public let storeName: String
    public let startupType: String            // "independent" | "franchise"
    public let preferredRegion: String
    public let businessOpenTime: String       // "HH:MM"
    public let businessCloseTime: String      // "HH:MM"
    public let weeklyHolidays: [String]       // ["mon","tue",...]
    // Step 3
    public let vatType: String                // "general" | "simplified"
    public let hasEmployees: Bool
    public let cpaDecision: String            // "cpa" | "self"
    public let launchDate: String             // "YYYY-MM-DD"
    public let daysSinceLaunch: Int
    public let bizRegistrationNumber: String
    // Step 4
    public let monthlyCosts: MonthlyCosts
    public let capital: Double
    // Step 5
    public let deliveryPlatforms: [String]
    public let snsChannels: [String]
    public let posId: String
    // Step 6
    public let addressRoad: String
    public let obtainedPermits: [ObtainedPermit]

    public init(
        category: IndustryCategory,
        industryCategoryId: String,
        industryOptionId: String,
        storeName: String,
        startupType: String,
        preferredRegion: String,
        businessOpenTime: String,
        businessCloseTime: String,
        weeklyHolidays: [String],
        vatType: String,
        hasEmployees: Bool,
        cpaDecision: String,
        launchDate: String,
        daysSinceLaunch: Int,
        bizRegistrationNumber: String,
        monthlyCosts: MonthlyCosts,
        capital: Double,
        deliveryPlatforms: [String],
        snsChannels: [String],
        posId: String,
        addressRoad: String,
        obtainedPermits: [ObtainedPermit]
    ) {
        self.category = category
        self.industryCategoryId = industryCategoryId
        self.industryOptionId = industryOptionId
        self.storeName = storeName
        self.startupType = startupType
        self.preferredRegion = preferredRegion
        self.businessOpenTime = businessOpenTime
        self.businessCloseTime = businessCloseTime
        self.weeklyHolidays = weeklyHolidays
        self.vatType = vatType
        self.hasEmployees = hasEmployees
        self.cpaDecision = cpaDecision
        self.launchDate = launchDate
        self.daysSinceLaunch = daysSinceLaunch
        self.bizRegistrationNumber = bizRegistrationNumber
        self.monthlyCosts = monthlyCosts
        self.capital = capital
        self.deliveryPlatforms = deliveryPlatforms
        self.snsChannels = snsChannels
        self.posId = posId
        self.addressRoad = addressRoad
        self.obtainedPermits = obtainedPermits
    }
}

// MARK: - View

private let TOTAL_STEPS = 7

public struct ExistingStoreRegistrationView: View {

    let onComplete: (StoreRegistration) -> Void
    let onBack: () -> Void

    @State private var step: Int = 1

    // Step 1
    @State private var selectedCategoryId: String = "food"
    @State private var selectedOptionId: String = ""

    // Step 2
    @State private var storeName: String = ""
    @State private var startupType: String = "independent"  // "independent" | "franchise"
    @State private var preferredRegion: String = ""
    @State private var businessOpenTime: String = "09:00"
    @State private var businessCloseTime: String = "21:00"
    @State private var weeklyHolidays: [String] = []

    // Step 3
    @State private var vatType: String = "general"
    @State private var hasEmployees: Bool = false
    @State private var cpaDecision: String = "self"
    @State private var launchDate: String = Self.todayString()
    @State private var bizRegistrationNumber: String = ""

    // Step 4
    @State private var costIngredients: String = ""
    @State private var costLabor: String = ""
    @State private var costRent: String = ""
    @State private var costUtilities: String = ""
    @State private var costOther: String = ""
    @State private var capitalText: String = ""

    // Step 5
    @State private var deliveryPlatforms: [String] = []
    @State private var snsChannels: [String] = []
    @State private var posId: String = ""

    // Step 6
    @State private var addressRoad: String = ""
    @State private var obtainedPermits: [ObtainedPermit] = []

    // UI
    @State private var showValidation: Bool = false
    @FocusState private var storeNameFocused: Bool

    public init(
        onComplete: @escaping (StoreRegistration) -> Void,
        onBack: @escaping () -> Void
    ) {
        self.onComplete = onComplete
        self.onBack = onBack
    }

    // MARK: - Helpers

    private static func todayString() -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }

    private func parseManwon(_ text: String) -> Double {
        let t = text.trimmingCharacters(in: .whitespaces)
        if t.isEmpty { return 0 }
        if let v = Double(t.filter { $0.isNumber || $0 == "." }) { return v * 10_000 }
        return 0
    }

    private var canNext: Bool {
        switch step {
        case 1: return !selectedOptionId.isEmpty
        case 2: return !storeName.trimmingCharacters(in: .whitespaces).isEmpty
        case 3: return !launchDate.isEmpty
        default: return true
        }
    }

    private var selectedOption: StarterIndustryOption? {
        StarterIndustryData.options.first { $0.id == selectedOptionId }
    }

    private var isDelivery: Bool { selectedCategoryId == "food" || selectedCategoryId == "cafe-dessert" }
    private var isOnline: Bool { selectedCategoryId == "online-digital" }
    private var isStartup: Bool { selectedCategoryId == "startup-tech" }
    private var isOffline: Bool { !isOnline && !isStartup }

    private func categoryToIndustry(_ catId: String) -> IndustryCategory {
        switch catId {
        case "food":           return .restaurant
        case "cafe-dessert":   return .cafe
        case "retail":         return .retail
        case "beauty":         return .beauty
        case "fitness":        return .fitness
        case "education":      return .education
        case "pet":            return .pet
        case "living-service": return .livingService
        case "space":          return .space
        case "online-digital": return .ecommerce
        case "startup-tech":   return .startupTech
        default:               return .general
        }
    }

    private var permitOptions: [ObtainedPermit] {
        let base = [
            ObtainedPermit(id: "biz-reg",         name: "사업자등록증"),
            ObtainedPermit(id: "operating-permit", name: "영업신고증 / 허가증"),
        ]
        switch selectedCategoryId {
        case "food", "cafe-dessert":
            return base + [
                ObtainedPermit(id: "food-hygiene",  name: "식품위생교육 이수증"),
                ObtainedPermit(id: "health-cert",   name: "보건증 (영업주)"),
                ObtainedPermit(id: "fire-cert",     name: "소방안전관리 선임"),
                ObtainedPermit(id: "liquor-permit", name: "주류판매업 신고"),
            ]
        case "online-digital":
            return base + [
                ObtainedPermit(id: "mail-order",    name: "통신판매업 신고"),
                ObtainedPermit(id: "privacy-policy",name: "개인정보처리방침 게시"),
            ]
        case "retail", "pet", "living-service":
            return base + [
                ObtainedPermit(id: "mail-order",    name: "통신판매업 신고"),
                ObtainedPermit(id: "fire-cert",     name: "소방안전관리 선임"),
            ]
        case "beauty":
            return base + [
                ObtainedPermit(id: "beauty-permit", name: "미용업 신고증"),
                ObtainedPermit(id: "health-cert",   name: "보건증 (영업주)"),
                ObtainedPermit(id: "fire-cert",     name: "소방안전관리 선임"),
            ]
        case "healthcare":
            return base + [
                ObtainedPermit(id: "medical-device",name: "의료기기 판매업 신고"),
                ObtainedPermit(id: "health-cert",   name: "보건증 (영업주)"),
            ]
        default:
            return base
        }
    }

    private func toggleDelivery(_ id: String) {
        if deliveryPlatforms.contains(id) {
            deliveryPlatforms.removeAll { $0 == id }
        } else {
            deliveryPlatforms.append(id)
        }
    }

    private func toggleSNS(_ id: String) {
        if snsChannels.contains(id) {
            snsChannels.removeAll { $0 == id }
        } else {
            snsChannels.append(id)
        }
    }

    private func togglePermit(_ permit: ObtainedPermit) {
        if obtainedPermits.contains(where: { $0.id == permit.id }) {
            obtainedPermits.removeAll { $0.id == permit.id }
        } else {
            obtainedPermits.append(permit)
        }
    }

    private func advance() {
        guard canNext else { showValidation = true; return }
        showValidation = false
        withAnimation(.easeInOut(duration: 0.2)) {
            if step < TOTAL_STEPS { step += 1 }
        }
    }

    private func goBack() {
        showValidation = false
        if step > 1 {
            withAnimation(.easeInOut(duration: 0.2)) { step -= 1 }
        } else {
            onBack()
        }
    }

    private func complete() {
        let launchD = ISO8601DateFormatter().date(from: launchDate + "T00:00:00Z")
        let days = launchD.map { max(0, Int(Date().timeIntervalSince($0) / 86400)) } ?? 0
        onComplete(StoreRegistration(
            category: categoryToIndustry(selectedCategoryId),
            industryCategoryId: selectedCategoryId,
            industryOptionId: selectedOptionId,
            storeName: storeName.trimmingCharacters(in: .whitespaces),
            startupType: startupType,
            preferredRegion: preferredRegion.trimmingCharacters(in: .whitespaces),
            businessOpenTime: businessOpenTime,
            businessCloseTime: businessCloseTime,
            weeklyHolidays: weeklyHolidays,
            vatType: vatType,
            hasEmployees: hasEmployees,
            cpaDecision: cpaDecision,
            launchDate: launchDate,
            daysSinceLaunch: days,
            bizRegistrationNumber: bizRegistrationNumber.trimmingCharacters(in: .whitespaces),
            monthlyCosts: MonthlyCosts(
                ingredients: parseManwon(costIngredients),
                labor: parseManwon(costLabor),
                rent: parseManwon(costRent),
                utilities: parseManwon(costUtilities),
                other: parseManwon(costOther)
            ),
            capital: parseManwon(capitalText),
            deliveryPlatforms: deliveryPlatforms,
            snsChannels: snsChannels,
            posId: posId,
            addressRoad: addressRoad.trimmingCharacters(in: .whitespaces),
            obtainedPermits: obtainedPermits
        ))
    }

    // MARK: - Body

    public var body: some View {
        ZStack {
            BUBackgroundSurface()

            VStack(spacing: 0) {
                topBar
                progressBar
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.bottom, 8)

                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 0) {
                        stepContent
                        Color.clear.frame(height: 100)
                    }
                    .padding(.horizontal, BUSpacing.md)
                    .padding(.top, 4)
                }

                ctaBar
            }
        }
    }

    // MARK: - Top Bar

    private var topBar: some View {
        HStack {
            Button(action: goBack) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(BUColor.midnightInk)
                    .frame(width: 36, height: 36)
                    .background(BUColor.midnight.opacity(0.06), in: Circle())
            }
            .buttonStyle(.plain)
            Spacer()
            Text("\(step)/\(TOTAL_STEPS)")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(BUColor.inkMuted)
        }
        .padding(.horizontal, BUSpacing.md)
        .padding(.top, 10)
        .padding(.bottom, 4)
    }

    // MARK: - Progress Bar

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(BUColor.midnight.opacity(0.08))
                    .frame(height: 4)
                Capsule()
                    .fill(BUColor.midnight)
                    .frame(width: geo.size.width * CGFloat(step) / CGFloat(TOTAL_STEPS), height: 4)
                    .animation(.spring(response: 0.35, dampingFraction: 0.8), value: step)
            }
        }
        .frame(height: 4)
    }

    // MARK: - Step Content

    @ViewBuilder
    private var stepContent: some View {
        switch step {
        case 1: step1
        case 2: step2
        case 3: step3
        case 4: step4
        case 5: step5
        case 6: step6
        default: step7
        }
    }

    // MARK: - Step 1: 업종 선택

    private var step1: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepHeader(eyebrow: "1단계 · 업종", title: "어떤 사업을 운영하고 계신가요?", subtitle: "업종에 맞는 지표와 도구가 활성화됩니다.")

            // 카테고리 칩
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(StarterIndustryData.categories) { cat in
                        categoryChip(cat)
                    }
                }
                .padding(.horizontal, 1)
            }

            // 세부 업종 그리드
            LazyVGrid(
                columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)],
                spacing: 10
            ) {
                ForEach(StarterIndustryData.options(for: selectedCategoryId)) { opt in
                    industryOptionCard(opt)
                }
            }

            if showValidation && selectedOptionId.isEmpty {
                validationText("세부 업종을 선택해 주세요")
            }
        }
    }

    private func categoryChip(_ cat: StarterIndustryCategory) -> some View {
        let sel = cat.id == selectedCategoryId
        return Button {
            if selectedCategoryId != cat.id {
                selectedCategoryId = cat.id
                selectedOptionId = ""
            }
        } label: {
            Text(cat.titleKo)
                .font(.system(size: 13, weight: sel ? .heavy : .semibold))
                .foregroundStyle(sel ? .white : BUColor.midnightInk)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(sel ? BUColor.midnight : BUColor.midnight.opacity(0.06),
                            in: Capsule())
        }
        .buttonStyle(.plain)
    }

    private func industryOptionCard(_ opt: StarterIndustryOption) -> some View {
        let sel = opt.id == selectedOptionId
        return Button {
            #if canImport(UIKit)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            #endif
            selectedOptionId = opt.id
        } label: {
            HStack(spacing: 10) {
                Image(systemName: opt.iconSF)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(sel ? .white : BUColor.midnight)
                    .frame(width: 32, height: 32)
                    .background(
                        sel ? BUColor.midnight : BUColor.midnight.opacity(0.07),
                        in: RoundedRectangle(cornerRadius: 8, style: .continuous)
                    )
                Text(opt.titleKo)
                    .font(.system(size: 13, weight: sel ? .heavy : .semibold))
                    .foregroundStyle(sel ? BUColor.midnight : BUColor.midnightInk)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            }
            .padding(12)
            .background(
                sel
                    ? BUColor.midnight.opacity(0.06)
                    : Color.white.opacity(0.7),
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(
                        sel ? BUColor.midnight.opacity(0.3) : BUColor.midnight.opacity(0.08),
                        lineWidth: sel ? 1.5 : 0.8
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Step 2: 가게 정보

    private var step2: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepHeader(eyebrow: "2단계 · 가게 정보", title: "가게 정보를 알려주세요", subtitle: "홈 대시보드에 표시됩니다.")

            // 상호명
            fieldGroup(label: "상호명") {
                BUTextField(text: $storeName, placeholder: "예: 성수 커피랩")
                    .focused($storeNameFocused)
                if showValidation && storeName.trimmingCharacters(in: .whitespaces).isEmpty {
                    validationText("가게 이름을 입력해 주세요")
                }
            }

            // 사업 유형
            fieldGroup(label: "사업 유형") {
                HStack(spacing: 8) {
                    toggleChip("독립 창업",   selected: startupType == "independent") { startupType = "independent" }
                    toggleChip("프랜차이즈",  selected: startupType == "franchise")   { startupType = "franchise" }
                }
            }

            // 위치
            fieldGroup(label: "가게 위치 (상권·지역)") {
                BUTextField(text: $preferredRegion, placeholder: "예: 서울 성수동, 부산 전포동")
            }

            // 영업 시간 (오프라인만)
            if isOffline {
                fieldGroup(label: "영업 시간") {
                    HStack(spacing: 10) {
                        timeField("오픈", time: $businessOpenTime)
                        Text("~")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                        timeField("마감", time: $businessCloseTime)
                    }
                }

                // 정기 휴무일
                fieldGroup(label: "정기 휴무일 (복수 선택 가능)") {
                    holidayChips
                }
            }
        }
        .onAppear { storeNameFocused = true }
    }

    private static let weekDays: [(id: String, label: String)] = [
        ("mon","월"),("tue","화"),("wed","수"),
        ("thu","목"),("fri","금"),("sat","토"),("sun","일")
    ]

    private var holidayChips: some View {
        HStack(spacing: 6) {
            ForEach(Self.weekDays, id: \.id) { day in
                toggleChip(day.label, selected: weeklyHolidays.contains(day.id)) {
                    if weeklyHolidays.contains(day.id) {
                        weeklyHolidays.removeAll { $0 == day.id }
                    } else {
                        weeklyHolidays.append(day.id)
                    }
                }
            }
        }
    }

    // MARK: - Step 3: 세무·행정

    private var step3: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepHeader(eyebrow: "3단계 · 세무·행정", title: "세무·행정 설정", subtitle: "세금 달력과 알림이 이 정보를 기반으로 작동합니다.")

            fieldGroup(label: "부가세 유형") {
                HStack(spacing: 8) {
                    toggleChip("일반과세자", selected: vatType == "general")    { vatType = "general" }
                    toggleChip("간이과세자", selected: vatType == "simplified") { vatType = "simplified" }
                }
            }

            fieldGroup(label: "직원 유무") {
                HStack(spacing: 8) {
                    toggleChip("있음", selected:  hasEmployees) { hasEmployees = true  }
                    toggleChip("없음", selected: !hasEmployees) { hasEmployees = false }
                }
            }

            fieldGroup(label: "세무 처리 방식") {
                HStack(spacing: 8) {
                    toggleChip("세무사 위임", selected: cpaDecision == "cpa")  { cpaDecision = "cpa"  }
                    toggleChip("직접 처리",  selected: cpaDecision == "self") { cpaDecision = "self" }
                }
            }

            fieldGroup(label: "개업일") {
                dateField(date: $launchDate)
            }

            fieldGroup(label: "사업자등록번호 (선택)") {
                BUTextField(text: $bizRegistrationNumber, placeholder: "예: 123-45-67890")
            }
        }
    }

    // MARK: - Step 4: 월 비용

    private var step4TotalCost: Double {
        [costIngredients, costLabor, costRent, costUtilities, costOther]
            .map { parseManwon($0) }.reduce(0, +)
    }

    private var step4: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepHeader(eyebrow: "4단계 · 월 비용", title: "매달 비용 구조", subtitle: "대략적인 금액이면 충분합니다. 나중에 수정할 수 있어요.")
            costGrid
            step4Summary
        }
    }

    private var costGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            costCell(label: "재료비 (만원)",      binding: $costIngredients, placeholder: "150")
            costCell(label: "인건비 (만원)",      binding: $costLabor,       placeholder: "200")
            costCell(label: "월세 (만원)",        binding: $costRent,        placeholder: "120")
            costCell(label: "공과금 (만원)",      binding: $costUtilities,   placeholder: "30")
            costCell(label: "기타 (만원)",        binding: $costOther,       placeholder: "20")
            costCell(label: "초기 자본금 (만원)", binding: $capitalText,     placeholder: "5000")
        }
    }

    private func costCell(label: String, binding: Binding<String>, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            fieldLabel(label)
            TextField(placeholder, text: binding)
                .keyboardType(.numberPad)
                .font(.system(size: 15, weight: .semibold))
                .padding(.horizontal, 12)
                .padding(.vertical, 11)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .strokeBorder(BUColor.midnight.opacity(0.1), lineWidth: 0.8)
                )
        }
    }

    @ViewBuilder
    private var step4Summary: some View {
        let totalCost = step4TotalCost
        if totalCost > 0 {
            let ingRatio = parseManwon(costIngredients) / totalCost
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("월 고정비")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BUColor.inkMuted)
                    Text("\(Int(totalCost / 10000).formatted())만원")
                        .font(.system(size: 17, weight: .heavy))
                        .foregroundStyle(BUColor.midnightDeep)
                }
                if ingRatio > 0 {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("재료비 비중")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                        Text("\(Int(ingRatio * 100))%")
                            .font(.system(size: 17, weight: .heavy))
                            .foregroundStyle(ingRatio > 0.4 ? BUColor.danger : ingRatio > 0.35 ? BUColor.warn : BUColor.success)
                    }
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }

    // MARK: - Step 5: 운영 채널

    private var step5: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepHeader(eyebrow: "5단계 · 운영 채널", title: "운영 채널", subtitle: "현재 사용 중인 플랫폼을 선택하세요.")

            // 배달 플랫폼 (외식·카페)
            if isDelivery {
                fieldGroup(label: "배달 플랫폼") {
                    chipGrid([
                        ("baemin",      "배달의민족"),
                        ("coupangeats", "쿠팡이츠"),
                        ("yogiyo",      "요기요"),
                        ("ddangyo",     "땡겨요"),
                        ("naver-order", "네이버 주문"),
                    ], selected: deliveryPlatforms, toggle: toggleDelivery)
                }
            }

            // 온라인 판매 플랫폼
            if isOnline {
                fieldGroup(label: "판매 플랫폼") {
                    chipGrid([
                        ("smartstore",  "스마트스토어"),
                        ("coupang",     "쿠팡"),
                        ("gmarket",     "G마켓"),
                        ("29cm",        "29CM"),
                        ("kakao",       "카카오쇼핑"),
                    ], selected: deliveryPlatforms, toggle: toggleDelivery)
                }
            }

            // SNS
            fieldGroup(label: "SNS 채널") {
                chipGrid([
                    ("instagram",       "인스타그램"),
                    ("naver-place",     "네이버 플레이스"),
                    ("kakao-channel",   "카카오채널"),
                    ("google-business", "구글 비즈니스"),
                ], selected: snsChannels, toggle: toggleSNS)
            }

            // POS (오프라인만)
            if isOffline {
                fieldGroup(label: "POS / 결제 시스템") {
                    chipGrid([
                        ("tossplace", "토스플레이스"),
                        ("kis",       "KIS정보통신"),
                        ("smartro",   "스마트로"),
                        ("posbank",   "포스뱅크"),
                        ("other",     "기타"),
                        ("none",      "없음"),
                    ], selected: posId.isEmpty ? [] : [posId]) { id in
                        posId = (posId == id) ? "" : id
                    }
                }
            }
        }
    }

    // MARK: - Step 6: 주소·인허가

    private var step6: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepHeader(eyebrow: "6단계 · 주소·인허가", title: "주소 및 인허가 현황", subtitle: "모두 선택 사항입니다. 설정에서 언제든 수정할 수 있어요.")

            fieldGroup(label: "도로명 주소 (선택)") {
                BUTextField(text: $addressRoad, placeholder: "예: 서울특별시 성동구 성수이로 78")
            }

            fieldGroup(label: "이미 취득한 인허가 (해당하는 것 모두 선택)") {
                VStack(spacing: 8) {
                    ForEach(permitOptions, id: \.id) { permit in
                        permitRow(permit)
                    }
                }
            }
        }
    }

    private func permitRow(_ permit: ObtainedPermit) -> some View {
        let sel = obtainedPermits.contains(where: { $0.id == permit.id })
        return Button { togglePermit(permit) } label: {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .fill(sel ? BUColor.midnight : Color.white)
                        .frame(width: 22, height: 22)
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .strokeBorder(sel ? Color.clear : BUColor.midnight.opacity(0.2), lineWidth: 1)
                        .frame(width: 22, height: 22)
                    if sel {
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                }
                Text(permit.name)
                    .font(.system(size: 15, weight: sel ? .semibold : .regular))
                    .foregroundStyle(BUColor.midnightInk)
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(
                sel ? BUColor.midnight.opacity(0.05) : Color.white.opacity(0.7),
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(sel ? BUColor.midnight.opacity(0.2) : BUColor.midnight.opacity(0.07), lineWidth: sel ? 1.2 : 0.8)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Step 7: 등록 완료

    private var step7SummaryRows: [(String, String)] {
        let totalCost = step4TotalCost
        let catName = StarterIndustryData.categories.first { $0.id == selectedCategoryId }?.titleKo ?? selectedCategoryId
        let optName = selectedOption?.titleKo ?? ""
        return [
            ("가게",      storeName.isEmpty ? "—" : storeName),
            ("업종",      "\(catName) · \(optName)"),
            ("유형",      startupType == "franchise" ? "프랜차이즈" : "독립 창업"),
            ("부가세",    vatType == "general" ? "일반과세자" : "간이과세자"),
            ("세무 처리", cpaDecision == "cpa" ? "세무사 위임" : "직접 처리"),
            ("월 고정비", totalCost > 0 ? "\(Int(totalCost / 10000).formatted())만원" : "—"),
            ("영업 시간", isOffline ? "\(businessOpenTime) ~ \(businessCloseTime)" : "—"),
            ("POS",       posId.isEmpty || posId == "none" ? "—" : posId),
        ]
    }

    private var step7: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepHeader(eyebrow: "준비 완료", title: "대시보드가 준비되었습니다", subtitle: "매일 매출을 입력하면 더 정확한 분석을 받을 수 있어요.")

            // 요약 카드
            VStack(spacing: 0) {
                ForEach(Array(step7SummaryRows.enumerated()), id: \.offset) { i, row in
                    HStack {
                        Text(row.0)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                        Spacer()
                        Text(row.1)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.midnightDeep)
                    }
                    .padding(.vertical, 10)
                    .padding(.horizontal, 16)
                    if i < step7SummaryRows.count - 1 {
                        Divider().opacity(0.4).padding(.horizontal, 16)
                    }
                }

                if !obtainedPermits.isEmpty {
                    Divider().opacity(0.4).padding(.horizontal, 16)
                    HStack(alignment: .top) {
                        Text("보유 인허가")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                        Spacer()
                        Text(obtainedPermits.map { $0.name }.joined(separator: " · "))
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(BUColor.midnightDeep)
                            .multilineTextAlignment(.trailing)
                    }
                    .padding(.vertical, 10)
                    .padding(.horizontal, 16)
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Color.white.opacity(0.9))
                    .shadow(color: .black.opacity(0.04), radius: 12, x: 0, y: 4)
            )

            // 활성화 설명
            HStack(spacing: 8) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(BUColor.midnight)
                Text("세금 달력 · 알림 · P&L 분석 · 원가율 진단 · 생존 진단 · 지원사업 매칭이 활성화됩니다.")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
            }
            .padding(14)
            .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }

    // MARK: - CTA Bar

    private var ctaNextEnabled: Bool { canNext || step >= 4 }

    private var ctaBar: some View {
        VStack(spacing: 0) {
            Divider().opacity(0.4)
            HStack(spacing: 12) {
                backBtn
                nextBtn
            }
            .padding(.horizontal, BUSpacing.md)
            .padding(.top, 10)
            .padding(.bottom, 24)
        }
        .background(.ultraThinMaterial)
    }

    private var backBtn: some View {
        Button(action: goBack) {
            Text(step == 1 ? "← 돌아가기" : "← 이전")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(BUColor.midnightInk)
                .padding(.horizontal, 16)
                .padding(.vertical, 13)
                .background(BUColor.midnight.opacity(0.06),
                            in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private var nextBtn: some View {
        let label = step < TOTAL_STEPS ? "다음" : "등록하고 대시보드로"
        let action: () -> Void = step < TOTAL_STEPS ? advance : complete
        return Button(action: action) {
            Text(label)
                .font(.system(size: 15, weight: .heavy))
                .tracking(-0.3)
                .foregroundStyle(.white)
                .padding(.vertical, 14)
                .frame(maxWidth: .infinity)
                .background(
                    LinearGradient(
                        colors: ctaNextEnabled
                            ? [BUColor.primaryButtonStart, BUColor.primaryButtonEnd]
                            : [BUColor.midnight.opacity(0.18), BUColor.midnight.opacity(0.18)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                )
                .shadow(color: ctaNextEnabled ? BUColor.primaryButtonStart.opacity(0.25) : .clear,
                        radius: 14, x: 0, y: 6)
        }
        .buttonStyle(.plain)
        .disabled(!ctaNextEnabled)
    }

    // MARK: - Reusable Subviews

    private func stepHeader(eyebrow: String, title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 5) {
                Image(systemName: "storefront")
                    .font(.system(size: 10, weight: .semibold))
                Text(eyebrow)
                    .font(.system(size: 10.5, weight: .heavy))
                    .tracking(1.0)
            }
            .foregroundStyle(BUColor.midnight)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(BUColor.midnight.opacity(0.06), in: Capsule())

            Text(title)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(BUColor.midnightDeep)
                .tracking(-0.6)

            Text(subtitle)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
        }
        .padding(.bottom, 4)
    }

    @ViewBuilder
    private func fieldGroup<C: View>(label: String, @ViewBuilder content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            fieldLabel(label)
            content()
        }
    }

    private func fieldLabel(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.system(size: 10.5, weight: .heavy))
            .foregroundStyle(BUColor.midnight.opacity(0.7))
            .tracking(1.0)
    }

    private func toggleChip(_ title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13.5, weight: selected ? .heavy : .semibold))
                .foregroundStyle(selected ? .white : BUColor.midnightInk)
                .padding(.horizontal, 16)
                .padding(.vertical, 9)
                .background(
                    selected ? BUColor.midnight : BUColor.midnight.opacity(0.06),
                    in: Capsule()
                )
        }
        .buttonStyle(.plain)
    }

    private func chipGrid(
        _ items: [(String, String)],
        selected: [String],
        toggle: @escaping (String) -> Void
    ) -> some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 100), spacing: 8)], spacing: 8) {
            ForEach(items, id: \.0) { (id, label) in
                let sel = selected.contains(id)
                Button { toggle(id) } label: {
                    Text(label)
                        .font(.system(size: 13, weight: sel ? .heavy : .semibold))
                        .foregroundStyle(sel ? .white : BUColor.midnightInk)
                        .padding(.vertical, 9)
                        .frame(maxWidth: .infinity)
                        .background(
                            sel ? BUColor.midnight : BUColor.midnight.opacity(0.06),
                            in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                        )
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func timeField(_ label: String, time: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(BUColor.inkMuted)
            TextField(label, text: time)
                .keyboardType(.numbersAndPunctuation)
                .font(.system(size: 15, weight: .semibold))
                .multilineTextAlignment(.center)
                .padding(.vertical, 10)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .strokeBorder(BUColor.midnight.opacity(0.1), lineWidth: 0.8)
                )
        }
    }

    private func dateField(date: Binding<String>) -> some View {
        TextField("YYYY-MM-DD", text: date)
            .keyboardType(.numbersAndPunctuation)
            .font(.system(size: 15, weight: .semibold))
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.1), lineWidth: 0.8)
            )
    }

    private func validationText(_ msg: String) -> some View {
        Text(msg)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(BUColor.danger)
    }
}

// MARK: - BUTextField helper (thin wrapper over TextField with consistent style)

private struct BUTextField: View {
    @Binding var text: String
    let placeholder: String
    @FocusState private var focused: Bool

    var body: some View {
        TextField(placeholder, text: $text)
            .focused($focused)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled(true)
            .font(.system(size: 15, weight: .semibold))
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(focused ? BUColor.midnight : BUColor.midnight.opacity(0.10),
                                  lineWidth: focused ? 1.5 : 0.8)
            )
    }
}

// MARK: - Preview

#if DEBUG
#Preview("ExistingStoreRegistration") {
    ExistingStoreRegistrationView(
        onComplete: { reg in print("등록: \(reg.storeName) / \(reg.industryCategoryId)") },
        onBack: { print("뒤로") }
    )
}
#endif
