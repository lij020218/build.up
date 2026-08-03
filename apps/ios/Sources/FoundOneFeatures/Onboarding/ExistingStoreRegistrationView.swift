//
//  ExistingStoreRegistrationView.swift — 이미 운영 중인 가게 등록 (5화면 + 첫 진단, 2026-07-28 개편)
//
//  웹 미러: apps/web/app/lib/components/ExistingBusinessOnboarding.tsx (동일 화면·동일 분기)
//
//  화면 구성 (7단계 → 5화면):
//    ① 업종        — 검색 + 카테고리/세부업종, 선택 즉시 "열리는 도구" 미리보기
//    ② 가게 한 장  — 상호·사업자번호(국세청 자동조회)·운영형태·개업연월·주소·영업시간
//    ③ 가게 스냅샷 — 운영 방식·월매출 구간(스킵 가능)·함께 일하는 사람
//    ④ 채널        — 배달/마켓/툴스택·SNS·POS (업종 분기)
//    ⑤ 첫 진단     — 벤치마크(공식 출처)·이번 주 미션(프리페치)·세금 D-day·연동 안내
//
//  업종 분기 SSOT: BUOnboardingRegistry (OnboardingRegistry.swift — 웹 codegen 자동 생성).
//  "SaaS 에 프랜차이즈·쿠팡이츠 질문 금지" — 질문 자체를 업종이 결정 (2026-07-28 사장님 지시).
//
//  정직성: 벤치마크는 평균 3단 비교(위/겹침/아래)만 · 국세청 배지는 실반환값만 ·
//  미션 미완이면 "마케팅 탭에서 준비" 폴백. 고정비·투자금·세무방식은 온보딩에서 묻지 않음
//  (대시보드 세팅 미션 이관), 보유 인허가 수집 삭제(소비처 0곳).
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneCore
import FoundOneData

// MARK: - Payload

public struct ObtainedPermit: Sendable, Hashable, Codable {
    public let id: String
    public let name: String
    public init(id: String, name: String) { self.id = id; self.name = name }
}

public struct StoreRegistration: Sendable, Hashable {
    public let category: IndustryCategory
    public let industryCategoryId: String     // StarterIndustryData category id
    public let industryOptionId: String       // StarterIndustryOption id
    public let storeName: String
    public let startupType: String            // "independent" | "franchise"
    public let preferredRegion: String
    public let businessOpenTime: String       // "HH:MM" ("" = 미노출 업종)
    public let businessCloseTime: String
    public let weeklyHolidays: [String]
    public let vatType: String                // "general" | "simplified"
    public let hasEmployees: Bool
    public let cpaDecision: String            // 온보딩에서 미수집 — "self" 기본 (세금 탭에서 변경)
    public let launchDate: String             // "YYYY-MM-01" (연·월 선택)
    public let daysSinceLaunch: Int
    public let bizRegistrationNumber: String
    public let monthlyCosts: MonthlyCosts     // 온보딩 미수집 — 0 (대시보드 세팅 미션 이관)
    public let capital: Double                // 온보딩 미수집 — 0
    public let deliveryPlatforms: [String]
    public let snsChannels: [String]
    public let posId: String
    public let addressRoad: String
    public let obtainedPermits: [ObtainedPermit] // 삭제된 수집 — 항상 [] (소비처 0곳)
    // (2026-07-28 신설) — 웹 OnboardingResult 미러
    public let businessModelId: String        // 운영 방식 (BUOnboardingRegistry.businessModelOptions)
    public let revenueBandId: String?         // 월매출 구간 — 벤치마크 비교 전용
    public let employeesBand: String?         // solo | family | staff1_2 | staff3plus
    /// 진단 화면 "지금 연동하러 가기" — 완료 후 내 정보 탭 + 데이터 연결 시트 자동 오픈
    public let wantsDataConnect: Bool

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
        obtainedPermits: [ObtainedPermit],
        businessModelId: String = "",
        revenueBandId: String? = nil,
        employeesBand: String? = nil,
        wantsDataConnect: Bool = false
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
        self.businessModelId = businessModelId
        self.revenueBandId = revenueBandId
        self.employeesBand = employeesBand
        self.wantsDataConnect = wantsDataConnect
    }
}

// MARK: - View

private let TOTAL_STEPS = 5

public struct ExistingStoreRegistrationView: View {

    let onComplete: (StoreRegistration) -> Void
    let onBack: () -> Void

    @State private var step: Int = 1

    // ① 업종
    @State private var selectedCategoryId: String = "food"
    @State private var selectedOptionId: String = ""
    @State private var industryQuery: String = ""

    // ② 가게 한 장
    @State private var storeName: String = ""
    @State private var bizRegistrationNumber: String = ""
    @State private var bizLookupState: BizLookupState = .idle
    @State private var startupType: String = "independent"
    @State private var vatType: String = "general"
    @State private var vatKnown: Bool = false
    @State private var launchYear: Int = 0     // 0 = 미선택
    @State private var launchMonth: Int = 0
    @State private var addressRoad: String = ""
    @State private var showPostcodeSheet: Bool = false
    @State private var businessOpenTime: String = "09:00"
    @State private var businessCloseTime: String = "21:00"
    @State private var weeklyHolidays: [String] = []

    // ③ 가게 스냅샷
    @State private var businessModelId: String = ""
    @State private var revenueBandId: String? = nil
    @State private var employeesBand: String? = nil

    // ④ 채널
    @State private var deliveryPlatforms: [String] = []
    @State private var launchChannels: [String] = []   // 스타트업 영업·배포 채널 (웹과 동일하게 표시용)
    @State private var snsChannels: [String] = []
    @State private var posId: String = ""

    // ⑤ 진단 — 미션 프리페치 (생성 ~40초라 ③ 진입 시 시작)
    @State private var missionState: MissionState = .idle
    @State private var missionFired: Bool = false

    // UI
    @State private var showValidation: Bool = false
    @FocusState private var storeNameFocused: Bool

    enum BizLookupState: Equatable {
        case idle, loading, error
        case done(taxTypeLabel: String, isActive: Bool)
    }
    enum MissionState: Equatable {
        case idle, loading, error
        case ready(mission: String, timeLabel: String?)
    }

    public init(
        onComplete: @escaping (StoreRegistration) -> Void,
        onBack: @escaping () -> Void
    ) {
        self.onComplete = onComplete
        self.onBack = onBack
    }

    // MARK: - Derived

    private var profile: BUOnboardingProfile { BUOnboardingRegistry.profile(for: selectedCategoryId) }
    private var isDelivery: Bool { selectedCategoryId == "food" || selectedCategoryId == "cafe-dessert" }
    private var isOnline: Bool { selectedCategoryId == "online-digital" }
    private var isStartup: Bool { selectedCategoryId == "startup-tech" }

    private var selectedOption: StarterIndustryOption? {
        StarterIndustryData.options.first { $0.id == selectedOptionId }
    }

    private var launchDateString: String {
        guard launchYear > 0, launchMonth > 0 else { return "" }
        return String(format: "%04d-%02d-01", launchYear, launchMonth)
    }

    private var canNext: Bool {
        switch step {
        case 1: return !selectedOptionId.isEmpty
        case 2:
            if storeName.trimmingCharacters(in: .whitespaces).isEmpty { return false }
            if launchYear == 0 || launchMonth == 0 { return false }
            if profile.addressAsk == "required" && addressRoad.trimmingCharacters(in: .whitespaces).isEmpty { return false }
            return true
        case 3: return !businessModelId.isEmpty && employeesBand != nil
        default: return true
        }
    }

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

    /// 주소 앞 2~3토큰 = 지역 요약 (웹 regionFromAddress 미러)
    private func regionFromAddress(_ addr: String) -> String {
        addr.trimmingCharacters(in: .whitespaces)
            .split(separator: " ").prefix(3).joined(separator: " ")
    }

    /// 업종 선택 미리보기 — 실제로 열리는 것만 (과장 금지, 웹 previewTools 미러)
    private var previewToolsText: String {
        var tools: [String] = []
        switch profile.revenueSyncCta {
        case "pos": tools.append("매출 자동 연동")
        case "ecommerce-csv": tools.append("판매내역 업로드 분석")
        default: tools.append("지표(GA4·웹훅) 연동")
        }
        if BUOnboardingRegistry.benchmark(for: selectedCategoryId) != nil { tools.append("업종 벤치마크") }
        if isDelivery { tools.append("배달 수수료 분석") }
        return tools.joined(separator: " · ")
    }

    // MARK: - 국세청 상태조회 (웹 서버 라우트 경유 — NTS 키는 서버 전용)

    private func lookupBizStatus() async {
        let num = bizRegistrationNumber.filter(\.isNumber)
        guard num.count == 10, bizLookupState != .loading else { return }
        bizLookupState = .loading
        guard let token = await BUSupabase.shared.currentSession?.accessToken else {
            bizLookupState = .error; return
        }
        var req = URLRequest(url: BUSupabase.shared.env.webAppURL.appendingPathComponent("api/data/business/status"))
        req.httpMethod = "POST"
        req.timeoutInterval = 12
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["businessNumbers": [num]])
        struct Item: Decodable { let taxType: String?; let operatingStatus: String? }
        struct Resp: Decodable { let data: [Item]? }
        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard (response as? HTTPURLResponse)?.statusCode == 200,
                  let decoded = try? JSONDecoder().decode(Resp.self, from: data),
                  let item = decoded.data?.first, let rawType = item.taxType, !rawType.isEmpty else {
                bizLookupState = .error; return
            }
            // 미등록 ≠ 오류·폐업 — 국세청에 없는 번호는 정직하게 "못 찾음" (기본값 위조 금지)
            if item.operatingStatus == "unregistered" {
                bizLookupState = .error
                return
            }
            // tax_type 예: "부가가치세 일반과세자" / "부가가치세 간이과세자" / "면세사업자"
            if rawType.contains("간이") { vatType = "simplified"; vatKnown = true }
            else if rawType.contains("일반") { vatType = "general"; vatKnown = true }
            bizLookupState = .done(
                taxTypeLabel: rawType.replacingOccurrences(of: "부가가치세 ", with: ""),
                // 상태 누락 = 판정 불가(nil 의미로 false 아님) — "계속사업자" 지어내지 않는다.
                //  status 가 명시 "active" 일 때만 true (2026-08-03 위조 수정, 웹·NtsBizRepository 정합)
                isActive: item.operatingStatus == "active"
            )
        } catch {
            bizLookupState = .error
        }
    }

    // MARK: - 미션 프리페치 (③ 진입 시 1회 — cases 생성 ~40초 흡수, 웹 미러)

    private func prefetchMission() async {
        guard !missionFired, !selectedOptionId.isEmpty else { return }
        missionFired = true
        missionState = .loading
        guard let token = await BUSupabase.shared.currentSession?.accessToken else {
            missionState = .error; return
        }
        var req = URLRequest(url: BUSupabase.shared.env.webAppURL.appendingPathComponent("api/ai/marketing/cases"))
        req.httpMethod = "POST"
        req.timeoutInterval = 75
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        var body: [String: Any] = [
            "industryCategoryId": selectedCategoryId,
            "subIndustryId": selectedOptionId,
            "language": "ko",
        ]
        let name = storeName.trimmingCharacters(in: .whitespaces)
        if !name.isEmpty { body["storeName"] = name }
        let region = regionFromAddress(addressRoad)
        if !region.isEmpty { body["region"] = region }
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        struct Play: Decodable { let title: String?; let mission: String?; let timeLabel: String? }
        struct Resp: Decodable { let plays: [Play]? }
        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard (response as? HTTPURLResponse)?.statusCode == 200,
                  let decoded = try? JSONDecoder().decode(Resp.self, from: data),
                  let first = decoded.plays?.first,
                  let mission = first.mission ?? first.title else {
                missionState = .error; return
            }
            missionState = .ready(mission: mission, timeLabel: first.timeLabel)
        } catch {
            missionState = .error
        }
    }

    // MARK: - 다음 세금 일정 (TaxDataRegistry SSOT — TaxView upcomingEvents 와 동일 규칙)

    private var nextTaxSummary: (summary: String, dDay: String)? {
        let cal = Calendar(identifier: .gregorian)
        let today = cal.startOfDay(for: Date())
        let year = cal.component(.year, from: today)
        let simplified = vatType == "simplified"
        let employed = employeesBand == "staff1_2" || employeesBand == "staff3plus"
        var best: (name: String, days: Int)? = nil
        for e in TaxDataRegistry.events {
            if simplified && !e.appliesToSimplified { continue }
            if e.requiresEmployees && !employed { continue }
            for y in [year, year + 1] {
                if let date = cal.date(from: DateComponents(year: y, month: e.month, day: e.day)) {
                    let days = cal.dateComponents([.day], from: today, to: cal.startOfDay(for: date)).day ?? 0
                    if days >= 0 {
                        if best == nil || days < best!.days { best = (e.title, days) }
                        break
                    }
                }
            }
        }
        guard let best else { return nil }
        return (best.name, best.days == 0 ? "오늘" : "D-\(best.days)")
    }

    // MARK: - Toggle helpers

    private func toggleIn(_ list: inout [String], _ id: String) {
        if list.contains(id) { list.removeAll { $0 == id } } else { list.append(id) }
    }

    private func advance() {
        guard canNext else { showValidation = true; return }
        showValidation = false
        withAnimation(.easeInOut(duration: 0.2)) {
            if step < TOTAL_STEPS { step += 1 }
        }
        if step >= 3 { Task { await prefetchMission() } }
    }

    private func goBack() {
        showValidation = false
        if step > 1 {
            withAnimation(.easeInOut(duration: 0.2)) { step -= 1 }
        } else {
            onBack()
        }
    }

    private func complete(wantsDataConnect: Bool = false) {
        let launchD = ISO8601DateFormatter().date(from: launchDateString + "T00:00:00Z")
        let days = launchD.map { max(0, Int(Date().timeIntervalSince($0) / 86400)) } ?? 0
        let hoursShown = profile.asksBusinessHours
        onComplete(StoreRegistration(
            category: categoryToIndustry(selectedCategoryId),
            industryCategoryId: selectedCategoryId,
            industryOptionId: selectedOptionId,
            storeName: storeName.trimmingCharacters(in: .whitespaces),
            startupType: profile.asksFranchise ? startupType : "independent",
            preferredRegion: regionFromAddress(addressRoad),
            businessOpenTime: hoursShown ? businessOpenTime : "",
            businessCloseTime: hoursShown ? businessCloseTime : "",
            weeklyHolidays: hoursShown ? weeklyHolidays : [],
            vatType: vatType,
            hasEmployees: employeesBand == "staff1_2" || employeesBand == "staff3plus",
            cpaDecision: "self",
            launchDate: launchDateString,
            daysSinceLaunch: days,
            bizRegistrationNumber: bizRegistrationNumber.trimmingCharacters(in: .whitespaces),
            monthlyCosts: MonthlyCosts(ingredients: 0, labor: 0, rent: 0, utilities: 0, other: 0),
            capital: 0,
            deliveryPlatforms: deliveryPlatforms,
            snsChannels: snsChannels,
            posId: posId,
            addressRoad: addressRoad.trimmingCharacters(in: .whitespaces),
            obtainedPermits: [],
            businessModelId: businessModelId,
            revenueBandId: revenueBandId,
            employeesBand: employeesBand,
            wantsDataConnect: wantsDataConnect
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
        .sheet(isPresented: $showPostcodeSheet) {
            PostcodeSearchSheet { addr in
                addressRoad = addr
                showPostcodeSheet = false
            }
            .ignoresSafeArea(edges: .bottom)
        }
    }

    // MARK: - Top / Progress

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
            // "N/5 · 약 3분" — 남은 부담을 알려주는 정보형 (웹 미러)
            Text(step >= TOTAL_STEPS ? "완료" : "\(step)/\(TOTAL_STEPS) · 약 3분")
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(BUColor.midnight.opacity(0.07), in: Capsule())
        }
        .padding(.horizontal, BUSpacing.md)
        .padding(.top, 10)
        .padding(.bottom, 4)
    }

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
        default: step5Diagnosis
        }
    }

    // MARK: - ① 업종

    private var searchedOptions: [StarterIndustryOption]? {
        let q = industryQuery.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return nil }
        return StarterIndustryData.options.filter { $0.titleKo.localizedCaseInsensitiveContains(q) }
    }

    private var step1: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepHeader(eyebrow: "1단계 · 업종", title: "어떤 사업을 운영하세요?", subtitle: "업종에 맞는 관리 도구가 준비됩니다.")

            BUTextField(text: $industryQuery, placeholder: "🔍 업종 검색 (예: 미용실, 빨래방, SaaS)")

            if let results = searchedOptions {
                if results.isEmpty {
                    Text("검색 결과가 없어요 — 아래 카테고리에서 골라주세요.")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                }
                LazyVGrid(
                    columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)],
                    spacing: 10
                ) {
                    ForEach(results.prefix(12)) { opt in
                        industryOptionCard(opt, onSelect: {
                            selectedOptionId = opt.id
                            selectedCategoryId = opt.categoryId
                        })
                    }
                }
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(StarterIndustryData.categories) { cat in
                            categoryChip(cat)
                        }
                    }
                    .padding(.horizontal, 1)
                }

                LazyVGrid(
                    columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)],
                    spacing: 10
                ) {
                    ForEach(StarterIndustryData.options(for: selectedCategoryId)) { opt in
                        industryOptionCard(opt, onSelect: { selectedOptionId = opt.id })
                    }
                }
            }

            if !selectedOptionId.isEmpty {
                Text("선택하면 열려요 — \(previewToolsText)")
                    .font(.system(size: 12.5, weight: .semibold))
                    .foregroundStyle(BUColor.midnight)
                    .lineSpacing(2)
                    .padding(13)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnightDeep.opacity(0.05), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
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

    private func industryOptionCard(_ opt: StarterIndustryOption, onSelect: @escaping () -> Void) -> some View {
        let sel = opt.id == selectedOptionId
        return Button {
            #if canImport(UIKit)
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            #endif
            onSelect()
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

    // MARK: - ② 가게 한 장

    private var step2: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepHeader(
                eyebrow: "2단계 · \(profile.placeNoun) 정보",
                title: "\(profile.placeNoun) 정보를 알려주세요",
                subtitle: "사업자번호를 넣으면 세무 정보는 자동으로 채워요."
            )

            // 사업자번호 + 국세청 조회
            fieldGroup(label: "사업자등록번호 (선택)") {
                HStack(spacing: 8) {
                    BUTextField(text: $bizRegistrationNumber, placeholder: "123-45-67890")
                    Button {
                        Task { await lookupBizStatus() }
                    } label: {
                        Text(bizLookupState == .loading ? "조회 중..." : "국세청 조회")
                            .font(.system(size: 12.5, weight: .heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 13)
                            .padding(.vertical, 13)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .opacity(bizRegistrationNumber.filter(\.isNumber).count == 10 ? 1 : 0.4)
                    }
                    .buttonStyle(.plain)
                    .disabled(bizLookupState == .loading)
                }
                switch bizLookupState {
                case .done(let label, let active):
                    verifiedBadge("\(label) · \(active ? "계속사업자" : "휴·폐업 상태") — 국세청 확인")
                case .error:
                    helperText("조회에 실패했어요 — 아래에서 과세유형만 직접 선택하면 됩니다.")
                default:
                    helperText("안 넣어도 계속할 수 있어요 — 과세유형만 직접 선택하면 됩니다.")
                }
            }

            // 과세유형 — 조회 성공 시 자동, 아니면 직접 (모르겠어요 허용)
            if case .done = bizLookupState {} else {
                fieldGroup(label: "부가세 유형") {
                    HStack(spacing: 8) {
                        toggleChip("일반과세자", selected: vatKnown && vatType == "general") { vatType = "general"; vatKnown = true }
                        toggleChip("간이과세자", selected: vatKnown && vatType == "simplified") { vatType = "simplified"; vatKnown = true }
                        toggleChip("모르겠어요", selected: !vatKnown) { vatType = "general"; vatKnown = false }
                    }
                    if !vatKnown {
                        helperText("일단 일반과세 기준으로 안내하고, 세금 탭에서 확인 후 바꿀 수 있어요.")
                    }
                }
            }

            fieldGroup(label: "\(profile.placeNoun) 이름") {
                BUTextField(text: $storeName, placeholder: isStartup ? "예: 파운드원" : "예: 성수 한잔")
                    .focused($storeNameFocused)
                if showValidation && storeName.trimmingCharacters(in: .whitespaces).isEmpty {
                    validationText("이름을 입력해 주세요")
                }
            }

            // 운영 형태 — 가맹 모델이 실존하는 업종만 (SaaS·온라인엔 질문 자체가 없음)
            if profile.asksFranchise {
                fieldGroup(label: "운영 형태") {
                    HStack(spacing: 8) {
                        toggleChip("독립 매장", selected: startupType == "independent") { startupType = "independent" }
                        toggleChip("프랜차이즈 가맹점", selected: startupType == "franchise") { startupType = "franchise" }
                    }
                }
            }

            fieldGroup(label: "개업 시기") {
                HStack(spacing: 10) {
                    yearMonthPicker("연도", value: $launchYear, range: Array((1997...Calendar.current.component(.year, from: Date())).reversed()), suffix: "년")
                    yearMonthPicker("월", value: $launchMonth, range: Array(1...12), suffix: "월")
                }
                helperText("국세청 조회는 과세유형·영업상태만 제공해요 — 개업 시기는 직접 선택합니다.")
                if showValidation && (launchYear == 0 || launchMonth == 0) {
                    validationText("개업 연·월을 선택해 주세요")
                }
            }

            fieldGroup(label: profile.addressAsk == "optional" ? "주소 (선택 — 지역 혜택·지원사업 안내용)" : "주소") {
                HStack(spacing: 8) {
                    BUTextField(text: $addressRoad, placeholder: "도로명 주소 (예: 서울 성동구 연무장길 00)")
                    Button {
                        showPostcodeSheet = true
                    } label: {
                        Text("주소 검색")
                            .font(.system(size: 12.5, weight: .heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 13)
                            .padding(.vertical, 13)
                            .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
                if showValidation && profile.addressAsk == "required" && addressRoad.trimmingCharacters(in: .whitespaces).isEmpty {
                    validationText("주소를 입력해 주세요 — 상권·지역 맞춤에 쓰여요")
                }
            }

            // 영업시간·휴무 — 물리 영업장 업종만
            if profile.asksBusinessHours {
                fieldGroup(label: "영업 시간") {
                    HStack(spacing: 10) {
                        timeField("오픈", time: $businessOpenTime)
                        Text("~")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(BUColor.inkMuted)
                        timeField("마감", time: $businessCloseTime)
                    }
                }
                fieldGroup(label: "정기 휴무일 (복수 선택 가능)") {
                    holidayChips
                }
            }
        }
        .onAppear { storeNameFocused = false }
    }

    private func yearMonthPicker(_ label: String, value: Binding<Int>, range: [Int], suffix: String) -> some View {
        Menu {
            ForEach(range, id: \.self) { v in
                Button("\(String(v))\(suffix)") { value.wrappedValue = v }
            }
        } label: {
            HStack {
                Text(value.wrappedValue == 0 ? label : "\(String(value.wrappedValue))\(suffix)")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(value.wrappedValue == 0 ? BUColor.inkMuted : BUColor.midnightInk)
                Spacer()
                Image(systemName: "chevron.up.chevron.down")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.10), lineWidth: 0.8)
            )
        }
    }

    private static let weekDays: [(id: String, label: String)] = [
        ("mon","월"),("tue","화"),("wed","수"),
        ("thu","목"),("fri","금"),("sat","토"),("sun","일")
    ]

    private var holidayChips: some View {
        HStack(spacing: 6) {
            ForEach(Self.weekDays, id: \.id) { day in
                toggleChip(day.label, selected: weeklyHolidays.contains(day.id)) {
                    toggleIn(&weeklyHolidays, day.id)
                }
            }
        }
    }

    // MARK: - ③ 가게 스냅샷

    private var operatingMonths: Int? {
        guard launchYear > 0, launchMonth > 0 else { return nil }
        let cal = Calendar.current
        let now = Date()
        let months = (cal.component(.year, from: now) - launchYear) * 12
            + (cal.component(.month, from: now) - launchMonth)
        return max(0, months)
    }

    private var step3: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepHeader(
                eyebrow: "3단계 · \(profile.placeNoun) 스냅샷",
                title: "\(profile.placeNoun)를 조금 더 알려주세요",
                subtitle: "매출은 업종 평균 비교에만 쓰여요 · 언제든 수정할 수 있어요"
            )

            fieldGroup(label: "운영 방식") {
                BUWrapLayout(spacing: 8) {
                    ForEach(BUOnboardingRegistry.businessModelOptions(for: selectedCategoryId)) { opt in
                        toggleChip(opt.titleKo, selected: businessModelId == opt.optionId) {
                            businessModelId = opt.optionId
                        }
                    }
                }
                if showValidation && businessModelId.isEmpty {
                    validationText("운영 방식을 선택해 주세요")
                }
            }

            fieldGroup(label: "\(profile.revenueLabel) (대략적인 구간이면 충분해요)") {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                    ForEach(BUOnboardingRegistry.revenueBands) { band in
                        bandCard(band)
                    }
                }
                helperText("업종 평균과 비교하는 데만 쓰여요 · 건너뛰어도 됩니다")
            }

            fieldGroup(label: profile.teamLabel) {
                BUWrapLayout(spacing: 8) {
                    toggleChip("혼자", selected: employeesBand == "solo") { employeesBand = "solo" }
                    toggleChip(profile.secondBandLabel, selected: employeesBand == "family") { employeesBand = "family" }
                    toggleChip("직원 1~2명", selected: employeesBand == "staff1_2") { employeesBand = "staff1_2" }
                    toggleChip("직원 3명 이상", selected: employeesBand == "staff3plus") { employeesBand = "staff3plus" }
                }
                if showValidation && employeesBand == nil {
                    validationText("선택해 주세요 — 세금 일정 안내에 쓰여요")
                }
            }

            if let months = operatingMonths {
                fieldGroup(label: "운영 기간") {
                    verifiedBadge("\(months / 12 > 0 ? "\(months / 12)년 " : "")\(months % 12)개월 — 개업 시기 기준 자동 계산")
                }
            }
        }
    }

    private func bandCard(_ band: BURevenueBand) -> some View {
        let sel = revenueBandId == band.bandId
        return Button {
            revenueBandId = sel ? nil : band.bandId
        } label: {
            Text(band.labelKo)
                .font(.system(size: 13.5, weight: sel ? .heavy : .semibold))
                .foregroundStyle(sel ? BUColor.midnight : BUColor.midnightInk)
                .padding(.vertical, 14)
                .frame(maxWidth: .infinity)
                .background(
                    sel ? BUColor.midnight.opacity(0.06) : Color.white.opacity(0.7),
                    in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .strokeBorder(sel ? BUColor.midnight.opacity(0.3) : BUColor.midnight.opacity(0.08), lineWidth: sel ? 1.5 : 0.8)
                )
        }
        .buttonStyle(.plain)
    }

    // MARK: - ④ 채널

    private var step4: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepHeader(eyebrow: "4단계 · 채널", title: "지금 쓰는 채널을 알려주세요", subtitle: "수수료 분석과 마케팅 미션이 채널에 맞춰집니다.")

            if isDelivery {
                fieldGroup(label: "배달 플랫폼") {
                    chipGrid([
                        ("baemin",      "배달의민족"),
                        ("coupangeats", "쿠팡이츠"),
                        ("yogiyo",      "요기요"),
                        ("ddangyo",     "땡겨요"),
                        ("naver-order", "네이버 주문"),
                    ], selected: deliveryPlatforms) { toggleIn(&deliveryPlatforms, $0) }
                }
            }

            if isOnline {
                fieldGroup(label: "판매 플랫폼") {
                    chipGrid([
                        ("smartstore",  "스마트스토어"),
                        ("coupang",     "쿠팡"),
                        ("gmarket",     "G마켓"),
                        ("29cm",        "29CM"),
                        ("kakao",       "카카오쇼핑"),
                    ], selected: deliveryPlatforms) { toggleIn(&deliveryPlatforms, $0) }
                }
            }

            if isStartup {
                fieldGroup(label: "핵심 운영 도구") {
                    chipGrid([
                        ("stripe",   "Stripe"),
                        ("hubspot",  "HubSpot"),
                        ("mixpanel", "Mixpanel"),
                        ("sentry",   "Sentry"),
                        ("linear",   "Linear"),
                    ], selected: deliveryPlatforms) { toggleIn(&deliveryPlatforms, $0) }
                }
                fieldGroup(label: "영업·배포 채널") {
                    chipGrid([
                        ("producthunt",      "Product Hunt"),
                        ("linkedin",         "LinkedIn"),
                        ("github",           "GitHub"),
                        ("communities",      "커뮤니티"),
                        ("founder-outbound", "창업자 아웃바운드"),
                    ], selected: launchChannels) { toggleIn(&launchChannels, $0) }
                }
            }

            fieldGroup(label: "SNS · 온라인 채널") {
                if isStartup {
                    chipGrid([
                        ("linkedin-co", "링크드인"),
                        ("twitter",     "X (Twitter)"),
                        ("blog",        "기술 블로그"),
                        ("youtube",     "유튜브"),
                    ], selected: snsChannels) { toggleIn(&snsChannels, $0) }
                } else {
                    chipGrid([
                        ("instagram",   "인스타그램"),
                        ("naver-place", "네이버 플레이스"),
                        ("youtube",     "유튜브"),
                        ("blog",        "블로그"),
                        ("tiktok",      "틱톡"),
                    ], selected: snsChannels) { toggleIn(&snsChannels, $0) }
                }
            }

            // POS — 매출 연동 CTA 가 POS 인 업종만
            if profile.revenueSyncCta == "pos" {
                fieldGroup(label: "POS") {
                    chipGrid([
                        ("tossplace", "토스 플레이스"),
                        ("posbank",   "포스뱅크"),
                        ("other",     "기타"),
                        ("none",      "POS 없음"),
                    ], selected: posId.isEmpty ? [] : [posId]) { id in
                        posId = (posId == id) ? "" : id
                    }
                    if posId == "tossplace" {
                        Text("토스 플레이스를 쓰시네요 — 다음 화면에서 매출을 자동으로 불러올 수 있어요")
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                            .padding(13)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(BUColor.midnightDeep.opacity(0.05), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                }
            }
        }
    }

    // MARK: - ⑤ 첫 진단

    private var step5Diagnosis: some View {
        VStack(alignment: .leading, spacing: 14) {
            stepHeader(
                eyebrow: "첫 진단",
                title: "\(storeName.trimmingCharacters(in: .whitespaces).isEmpty ? profile.placeNoun : storeName) \(profile.ownerTitle), 첫 진단이 나왔어요",
                subtitle: "방금 입력하신 정보만으로 만든 리포트입니다."
            )

            // 벤치마크 — 데이터 있는 업종 + 구간 입력 시에만 (빈 카드·위조 금지)
            if let result = BUOnboardingRegistry.comparePosition(categoryId: selectedCategoryId, bandId: revenueBandId),
               let band = BUOnboardingRegistry.revenueBands.first(where: { $0.bandId == revenueBandId }) {
                diagCard(
                    k: "\(result.benchmark.kstatIndustry) 벤치마크",
                    v: result.position == "above" ? "업종 평균보다 높은 구간이에요"
                        : result.position == "below" ? "업종 평균보다 낮은 구간이에요"
                        : "업종 평균과 겹치는 구간이에요",
                    fine: "\(profile.ownerTitle) 구간 \(band.labelKo) vs 업종 평균 월 약 \(result.benchmark.monthlyRevenueManwon.formatted())만원 (연매출 기준 환산) · 출처: \(BUOnboardingRegistry.benchmarkSourceKo) · 매출을 연동하면 실측 비교로 바뀝니다"
                )
            } else if BUOnboardingRegistry.benchmark(for: selectedCategoryId) != nil {
                diagCard(
                    k: "업종 벤치마크",
                    v: "매출 구간을 입력하면 업종 평균과 비교해 드려요",
                    fine: "이전 화면에서 10초면 입력할 수 있어요"
                )
            }

            // 이번 주 미션 — 프리페치 상태 정직 표기
            switch missionState {
            case .ready(let mission, let timeLabel):
                diagCard(
                    k: "이번 주 마케팅 미션",
                    v: mission,
                    fine: "\(timeLabel.map { "\($0) · " } ?? "")마케팅 탭에서 실제 사례·실행물과 함께 확인하세요"
                )
            case .loading:
                diagCard(
                    k: "이번 주 마케팅 미션",
                    v: "\(profile.ownerTitle) 업종의 실제 사례를 찾는 중이에요...",
                    fine: "약 40초 걸려요 — 먼저 아래를 둘러보셔도 됩니다. 완성되면 마케팅 탭에 있어요."
                )
            default:
                diagCard(
                    k: "이번 주 마케팅 미션",
                    v: "이번 주 미션은 대시보드의 마케팅 탭에서 준비돼요",
                    fine: nil
                )
            }

            // 다가오는 세금 — TaxDataRegistry SSOT
            if let tax = nextTaxSummary {
                diagCard(
                    k: "다가오는 세금",
                    v: "\(tax.summary) — \(tax.dDay)",
                    fine: !vatKnown ? "일반과세 기준 안내 — 세금 탭에서 과세유형 확인 후 정확해집니다"
                                    : "세금 탭에서 전체 일정·예상 세액을 확인하세요"
                )
            }

            // 매출 연동 안내 — 업종별 CTA (유일한 네이비 강조 카드)
            accentSyncCard
        }
    }

    private func diagCard(k: String, v: String, fine: String?) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(k.uppercased())
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.8)
                .foregroundStyle(BUColor.inkMuted)
            Text(v)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(BUColor.midnightDeep)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
            if let fine {
                Text(fine)
                    .font(.system(size: 11.5, weight: .medium))
                    .foregroundStyle(BUColor.inkMuted)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.9))
                .shadow(color: .black.opacity(0.04), radius: 10, x: 0, y: 4)
        )
    }

    private var accentSyncCard: some View {
        let (k, v): (String, String) = {
            switch profile.revenueSyncCta {
            case "pos":
                return ("매출 자동 연동", "\(posId == "tossplace" ? "토스 플레이스" : "POS") 매출을 자동으로 불러올 수 있어요")
            case "ecommerce-csv":
                return ("판매내역 분석", "판매내역 파일을 올리면 매출 분석이 시작돼요")
            default:
                return ("지표 연동", "GA4·웹훅으로 지표를 자동 수집할 수 있어요")
            }
        }()
        return VStack(alignment: .leading, spacing: 6) {
            Text(k.uppercased())
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.8)
                .foregroundStyle(.white.opacity(0.6))
            Text(v)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(.white)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
            Text("1분이면 됩니다 — 연동하면 위 진단이 실측으로 바뀝니다.")
                .font(.system(size: 11.5, weight: .medium))
                .foregroundStyle(.white.opacity(0.6))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
            Button {
                complete(wantsDataConnect: true)
            } label: {
                Text("지금 연동하러 가기 →")
                    .font(.system(size: 13.5, weight: .heavy))
                    .foregroundStyle(BUColor.midnight)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
            }
            .buttonStyle(.plain)
            .padding(.top, 6)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    // MARK: - CTA Bar

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

    private var ctaNextEnabled: Bool { canNext }

    private var nextBtn: some View {
        let label = step < TOTAL_STEPS ? "다음" : "대시보드로 시작하기 →"
        let action: () -> Void = step < TOTAL_STEPS ? advance : { complete() }
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
        // 자연 폭 flow — 균등폭 그리드는 긴 라벨을 꺾음 (BUWrapLayout 원칙)
        BUWrapLayout(spacing: 8) {
            ForEach(items, id: \.0) { (id, label) in
                toggleChip(label, selected: selected.contains(id)) { toggle(id) }
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

    private func verifiedBadge(_ text: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: "checkmark")
                .font(.system(size: 10, weight: .heavy))
            Text(text)
                .font(.system(size: 11.5, weight: .heavy))
        }
        .foregroundStyle(BUColor.midnight)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(BUColor.midnight.opacity(0.08), in: Capsule())
    }

    private func helperText(_ msg: String) -> some View {
        Text(msg)
            .font(.system(size: 11.5, weight: .medium))
            .foregroundStyle(BUColor.inkMuted)
            .lineSpacing(2)
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
        onComplete: { reg in print("등록: \(reg.storeName) / \(reg.industryCategoryId) / \(reg.businessModelId)") },
        onBack: { print("뒤로") }
    )
}
#endif
