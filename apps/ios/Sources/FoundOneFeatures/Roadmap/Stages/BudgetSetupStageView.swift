//
//  BudgetSetupStageView.swift — 예산 설정 (iOS 네이티브, 웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/stages/selection/BudgetSetupStage.tsx
//  stageId: "budget-setup"
//
//  섹션 구조:
//    § 0 — 프랜차이즈 비용 패널 (startupType="franchise" + 브랜드 선택 시만 노출)
//    § 1 — 시작 자본금 (슬라이더 + 직접입력 + 프리셋)
//    § 2 — BudgetInsightCard (예산 인사이트 + 정부지원)
//    § 3 — 운영 자본금 / 런웨이 자본 (업종 + 운영 모드 분기)
//    § 4 — 목표 오픈 시점 (프리셋 chip)
//
//  데이터:
//    @AppStorage "stage.budget.startupWon"             — Int
//    @AppStorage "stage.budget.operatingWon"           — Int
//    @AppStorage "stage.budget.openDateId"             — String
//    @AppStorage "stage.budget.startupOperatingMode"   — String (indie/bootstrap/seed/seriesA)
//    @AppStorage "stage.startupType.selected"          — String (independent/franchise/undecided)
//    @AppStorage "stage.franchise.selectedBrandId"     — String (FranchiseView 에서 영속)
//    @AppStorage "roadmap.selectedIndustryId"          — String (IndustrySelection 에서 영속)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

// MARK: - BudgetSetupStageView

public struct BudgetSetupStageView: View {

    @Environment(RoadmapStore.self) private var roadmapStore
    @Environment(\.dismiss) private var dismiss
    private let stageId = "budget-setup"

    @AppStorage("stage.budget.startupWon")           private var startupWon   = 0
    @AppStorage("stage.budget.operatingWon")         private var operatingWon = 0
    @AppStorage("stage.budget.openDateId")           private var openDateId   = ""
    @AppStorage("stage.budget.startupOperatingMode") private var startupMode  = "bootstrap"
    @AppStorage("stage.startupType.selected")        private var startupType  = ""
    @AppStorage("stage.franchise.selectedBrandId")   private var franchiseBrandId = ""
    @AppStorage("roadmap.selectedIndustryId")        private var industryId = ""

    // 슬라이더 바인딩용 Double 캐시
    @State private var startupSlider   = 30_000_000.0
    @State private var operatingSlider = 0.0

    @State private var startupText   = ""
    @State private var operatingText = ""

    // ⚠️ 2026-05-25: 예산 부족 보완용 펀딩 매칭 — Guides 탭의 79개 프로그램 풀에서
    //   선택 업종·자본금에 맞는 상위 4개 추천. 로컬 StartupProgramRegistry 사용 (네트워크 X).
    @State private var matchedFundings: [FundingProgram] = []
    @State private var fundingLoading: Bool = false
    @State private var showAllFundingSheet: Bool = false

    // MARK: - Industry → 월 추정 운영비

    private var categoryId: String? {
        StarterIndustryData.option(by: industryId)?.categoryId
    }
    private var isStartup: Bool { categoryId == "startup-tech" }

    // 스타트업 매트릭스: (sub-industry × mode) → 월 운영비 (원)
    private static let startupMatrix: [String: [String: Int]] = [
        "ai-application":       ["indie":   300_000, "bootstrap":   8_000_000, "seed":  30_000_000, "seriesA":  70_000_000],
        "developer-tools":      ["indie":   300_000, "bootstrap":   7_000_000, "seed":  28_000_000, "seriesA":  65_000_000],
        "b2b-saas":             ["indie":   400_000, "bootstrap":   8_000_000, "seed":  30_000_000, "seriesA":  70_000_000],
        "fintech-startup":      ["indie":   500_000, "bootstrap":  12_000_000, "seed":  40_000_000, "seriesA": 100_000_000],
        "healthtech-startup":   ["indie":   400_000, "bootstrap":  10_000_000, "seed":  35_000_000, "seriesA":  80_000_000],
        "security-startup":     ["indie":   400_000, "bootstrap":   9_000_000, "seed":  32_000_000, "seriesA":  75_000_000],
        "hardware-iot":         ["indie": 1_000_000, "bootstrap":  20_000_000, "seed":  50_000_000, "seriesA": 150_000_000],
        "robotics-physical-ai": ["indie": 2_000_000, "bootstrap":  50_000_000, "seed": 150_000_000, "seriesA": 350_000_000],
        "semiconductor":        ["indie": 5_000_000, "bootstrap": 100_000_000, "seed": 300_000_000, "seriesA": 800_000_000],
        "biotech-medtech":      ["indie": 3_000_000, "bootstrap":  50_000_000, "seed": 150_000_000, "seriesA": 350_000_000],
        "climate-energy":       ["indie": 1_000_000, "bootstrap":  30_000_000, "seed": 100_000_000, "seriesA": 300_000_000],
    ]

    /// 웹 SSOT (BudgetSetupStage.tsx:324) 와 1:1 일치.
    /// pet / living-service / space 는 웹에 명시 없음 → fallback `5_000_000` 사용.
    private static let offlineMonthlyByCategory: [String: Int] = [
        "food":           8_000_000,
        "cafe-dessert":   6_000_000,
        "retail":         5_000_000,
        "beauty":         4_500_000,
        "fitness":        7_000_000,
        "education":      4_000_000,
        "online-digital": 2_500_000,
    ]

    private var monthlyEstimate: Int {
        if isStartup {
            let sub = Self.startupMatrix[industryId] ?? Self.startupMatrix["ai-application"]!
            return sub[startupMode] ?? sub["bootstrap"] ?? 8_000_000
        }
        let cid = categoryId ?? "food"
        return Self.offlineMonthlyByCategory[cid] ?? 5_000_000
    }

    // 권장 운영자본 — 스타트업 12~24개월, 그 외 3~6개월
    private var recommendedMin: Int { isStartup ? monthlyEstimate * 12 : monthlyEstimate * 3 }
    private var recommendedMax: Int { isStartup ? monthlyEstimate * 24 : monthlyEstimate * 6 }
    private var operatingSliderMax: Double {
        isStartup ? Double(max(monthlyEstimate * 36, 100_000_000)) : 200_000_000
    }

    // MARK: - Runway health

    private var ratio: Double { monthlyEstimate > 0 ? Double(operatingWon) / Double(monthlyEstimate) : 0 }
    private var ratioLabel: String {
        if operatingWon == 0 { return "아직 미입력" }
        if isStartup {
            if ratio >= 24 { return "넉넉 (24개월+ 런웨이)" }
            if ratio >= 18 { return "적정 (18~24개월)" }
            if ratio >= 12 { return "타이트 (12~18개월)" }
            if ratio >= 6  { return "부족 (6~12개월)" }
            return "심각 — 시리즈A 전 소진 위험"
        } else {
            if ratio >= 6 { return "매우 여유 (6개월+)" }
            if ratio >= 3 { return "적정 (3~6개월)" }
            if ratio >= 1 { return "부족 (3개월 미만)" }
            return "매우 부족 (1개월 미만)"
        }
    }
    private var ratioColor: Color {
        if operatingWon == 0 { return BUColor.inkMuted }
        if isStartup {
            if ratio >= 18 { return BUColor.success }
            if ratio >= 12 { return Color.orange }
            return Color.red
        } else {
            if ratio >= 3 { return BUColor.success }
            if ratio >= 1 { return Color.orange }
            return Color.red
        }
    }

    // MARK: - Presets

    private let startupPresets: [(String, Int)] = [
        ("1000만", 10_000_000),
        ("3000만", 30_000_000),
        ("5000만", 50_000_000),
        ("1억",   100_000_000),
        ("2억",   200_000_000),
        ("3억",   300_000_000),
    ]

    private let openDatePresets: [(id: String, labelKo: String)] = [
        ("1mo",   "1개월 내"),
        ("3mo",   "3개월 내"),
        ("6mo",   "6개월 내"),
        ("12mo",  "1년 내"),
        ("later", "1년 이상"),
    ]

    public init() {}

    private var canContinue: Bool { startupWon > 0 && !openDateId.isEmpty }

    private var advanceHint: String {
        if startupWon == 0 && openDateId.isEmpty { return "자본금과 오픈 시점을 입력하세요" }
        if startupWon == 0 { return "시작 자본금을 입력하세요" }
        if openDateId.isEmpty { return "오픈 시점을 선택하세요" }
        return "예산·일정 입력 완료 — 다음 단계로"
    }

    private var helperText: String {
        if isStartup {
            return "자본 규모에 따라 런웨이가 결정됩니다. 시리즈A 표준 18~24개월 — Default Alive (자체 매출 생존) 목표."
        }
        return "자본 규모에 따라 로드맵 실행 속도와 우선순위가 달라집니다. 권장 운영자본 3~6개월 — 흑자부도 1순위 원인이 운영자본 부족입니다."
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "예산 설정",
            stageEyebrow: "단계 5 · 자본·일정",
            helperText: helperText,
            canAdvance: canContinue,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(
                    currentStageId: stageId,
                    inputs: [
                        "startupWon": "\(startupWon)",
                        "operatingWon": "\(operatingWon)",
                        "openDateId": openDateId,
                        "startupOperatingMode": isStartup ? startupMode : "",
                    ]
                )
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: stageId,
                    inputs: [
                        "startupWon": "\(startupWon)",
                        "operatingWon": "\(operatingWon)",
                        "openDateId": openDateId,
                        "startupOperatingMode": isStartup ? startupMode : "",
                    ])
            },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 자본 규모 설정", detail: "보유 자본 + 대출 가용액 + 운영자본 6개월 분리 — 3구간 프리셋 비교"),
                .init(label: "2. 오픈 일정 설정", detail: "오픈 희망일 시점에서 역산해 핵심 마일스톤 자동 배치"),
                .init(label: "3. 인테리어·집기 비중 결정", detail: "총 자본 중 시설투자 vs 운영자본 60:40 권장 — 업종 맞춤 조정"),
                .init(label: "4. 자본 vs 매출 시뮬레이션", detail: "월 운영비 추정 + 손익분기 도달 시점 시뮬"),
                ],
                verifyItems: [
                "운영자본 6개월치 별도 확보 — 매출 0원 가정해도 월세·인건비·재료비 견딜 수 있어야 (흑자부도 1순위 원인)",
                "정부지원금·소상공인 대출 가능 여부 — 신청 시점부터 입금까지 평균 4~8주, 일정에 반영",
                "예비비 10~15% 별도 — 인테리어 추가공사·집기 누락·임대 보증금 추가 요구 빈번",
                "오픈 일정 — 임대 계약일부터 영업신고·인테리어·집기 입고·시운전까지 최소 60일 필요",
                "프랜차이즈 가맹비·교육비·인테리어 강제 비용 모두 합산 — 광고비·로열티 매월 별도 발생",
                "업종별 손익분기점 매출 추정 — 통상 매출 대비 인건비 25%, 재료비 30%, 임대료 10% 한계선",
                ],
                nextStageLabel: "상권 후보 비교",
                nextSummary: "자본·일정·예비비 확정 → 상권 후보 비교 단계로 진입"
            )
        ) {
            VStack(alignment: .leading, spacing: 16) {
                franchiseCostPanel
                startupCapitalSection
                BudgetInsightCard(userBudgetWon: startupWon)
                fundingMatchSection
                operatingCapitalSection
                openDateSection
            }
        }
        .onAppear {
            if startupWon > 0 {
                startupSlider = Double(startupWon)
                startupText = String(startupWon / 10_000)
            }
            if operatingWon > 0 {
                operatingSlider = Double(operatingWon)
                operatingText = String(operatingWon / 10_000)
            }
        }
        .task(id: "\(industryId)-\(startupWon)-\(startupType)") {
            await loadFundingMatches()
        }
        .sheet(isPresented: $showAllFundingSheet) {
            FundingFullListSheet(programs: matchedFundings)
        }
    }

    // MARK: - § Funding match (2026-05-25 신규)

    /// 79개 펀딩 프로그램 풀에서 사용자 선택 (업종·자본금·창업 형태) 기준으로 매칭.
    /// personalFitScore 상위 4개를 inline 표시 — 사용자가 자본 부족분을 어떻게 채울지 즉시 확인.
    @MainActor
    private func loadFundingMatches() async {
        fundingLoading = true
        defer { fundingLoading = false }

        let categoryId = categoryId ?? "food"
        // 단계 분류 — 자본금 규모로 추정
        let stage: String = {
            if startupWon < 30_000_000 { return "pre-startup" }
            if startupWon < 100_000_000 { return "early" }
            return "growth"
        }()

        // 사장님 프로필 보강 (출생연도·신용·폐업·장애) — 로컬 전용(UserDefaults). 웹 BudgetFundingMatchCard 패리티.
        let defaults = UserDefaults.standard
        let storedBirthYear = defaults.integer(forKey: "owner.birthYear")
        let storedNcb = defaults.integer(forKey: "owner.ncbScore")
        let currentYear = Calendar.current.component(.year, from: Date())
        let computedAge: Int? = (storedBirthYear >= 1900 && storedBirthYear <= currentYear)
            ? { let a = currentYear - storedBirthYear; return (a >= 0 && a < 120) ? a : nil }()
            : nil
        let criteria = FundingMatchCriteria(
            startupType: startupType.isEmpty ? nil : startupType,
            industryCategoryId: categoryId,
            age: computedAge,
            capital: startupWon > 0 ? startupWon : nil,
            businessStage: stage,
            ncbScore: storedNcb > 0 ? storedNcb : nil,
            consideringClosure: defaults.bool(forKey: "owner.consideringClosure"),
            isDisabledOwner: defaults.bool(forKey: "owner.isDisabledOwner")
        )

        let repo = FundingRepository(supabase: BUSupabase.shared.client)
        do {
            let result = try await repo.matchAll(criteria: criteria, language: "ko")
            // personalFitScore 내림차순 + 자격 있는 것 우선
            let sorted = result.programs.sorted { a, b in
                if a.eligible != b.eligible { return a.eligible }
                return a.personalFitScore > b.personalFitScore
            }
            matchedFundings = Array(sorted.prefix(20))  // 상위 20개 보관 (inline 4 + sheet 16)
        } catch {
            // 로컬 매칭은 throw 안 되지만 방어
            matchedFundings = []
        }
    }

    @ViewBuilder
    private var fundingMatchSection: some View {
        if !matchedFundings.isEmpty {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(alignment: .center) {
                        VStack(alignment: .leading, spacing: 2) {
                            BUEyebrow("예산이 부족하신가요? 정부 지원·정책자금 매칭")
                            Text(fundingMatchSubtitle)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                        Spacer(minLength: 8)
                    }

                    VStack(spacing: 8) {
                        ForEach(matchedFundings.prefix(4)) { prog in
                            FundingMiniCard(program: prog)
                        }
                    }

                    if matchedFundings.count > 4 {
                        Button {
                            showAllFundingSheet = true
                        } label: {
                            HStack {
                                Text("전체 \(matchedFundings.count)개 보기")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(BUColor.midnight)
                                Image(systemName: "arrow.right")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(BUColor.midnight)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        } else if fundingLoading {
            BUCard(.card) {
                HStack(spacing: 10) {
                    ProgressView().scaleEffect(0.8)
                    Text("이 업종에 맞는 지원 프로그램 찾는 중…")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var fundingMatchSubtitle: String {
        let eligibleCount = matchedFundings.filter { $0.eligible }.count
        if eligibleCount > 0 {
            return "\(categoryNounKo) 업종 · 자본 \(formatWon(startupWon)) 기준 — 자격 충족 \(eligibleCount)건, 자본금 부족분을 정책자금으로 보완하세요."
        }
        return "\(categoryNounKo) 업종 기준 — 자본금·업력 정보를 더 입력하면 맞춤 매칭이 정확해집니다."
    }

    private var categoryNounKo: String {
        switch categoryId {
        case "food":           return "음식점"
        case "cafe-dessert":   return "카페·디저트"
        case "retail":         return "소매"
        case "beauty":         return "미용"
        case "fitness":        return "피트니스"
        case "education":      return "교육"
        case "pet":            return "반려동물"
        case "living-service": return "생활서비스"
        case "space":          return "공간 임대"
        case "online-digital": return "온라인·디지털"
        case "startup-tech":   return "스타트업 테크"
        default:               return "이"
        }
    }

    // MARK: - § 0 프랜차이즈 비용 패널

    @ViewBuilder
    private var franchiseCostPanel: some View {
        if startupType == "franchise", !franchiseBrandId.isEmpty,
           let info = FranchiseBrandRegistry.brand(by: franchiseBrandId) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.md) {
                    // header
                    HStack(spacing: 10) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(BUColor.midnight.opacity(0.12))
                                .frame(width: 36, height: 36)
                            Text("₩")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(BUColor.midnight)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text(info.name.ko)
                                .font(.system(size: 16, weight: .bold))
                                .tracking(-0.2)
                                .foregroundStyle(BUColor.ink)
                            Text("예상 창업 비용 안내")
                                .font(.system(size: 11.5, weight: .medium))
                                .foregroundStyle(BUColor.inkMuted)
                        }
                        Spacer()
                    }

                    // total highlight
                    HStack(alignment: .center) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("예상 총 비용")
                                .font(.system(size: 11.5, weight: .medium))
                                .foregroundStyle(BUColor.inkMuted)
                            HStack(alignment: .firstTextBaseline, spacing: 2) {
                                Text(formatManwon(info.startupCostWon))
                                    .font(.system(size: 24, weight: .heavy))
                                    .tracking(-0.6)
                                    .foregroundStyle(BUColor.midnight)
                                    .monospacedDigit()
                            }
                        }
                        Spacer()
                        if info.monthlyRoyalty > 0 {
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("월 로열티")
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(BUColor.inkMuted)
                                HStack(alignment: .firstTextBaseline, spacing: 1) {
                                    Text(info.monthlyRoyalty.truncatingRemainder(dividingBy: 1) == 0
                                         ? "\(Int(info.monthlyRoyalty))"
                                         : String(format: "%.1f", info.monthlyRoyalty))
                                        .font(.system(size: 15, weight: .bold))
                                        .foregroundStyle(BUColor.midnight)
                                        .monospacedDigit()
                                    Text("만/월")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundStyle(BUColor.midnight)
                                }
                            }
                        }
                    }
                    .padding(14)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 14, style: .continuous))

                    // breakdown (있을 때만)
                    if let breakdown = info.costBreakdown, !breakdown.isEmpty {
                        VStack(spacing: 0) {
                            BUEyebrow("비용 항목")
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.bottom, 6)
                            ForEach(Array(breakdown.enumerated()), id: \.offset) { idx, item in
                                if idx > 0 {
                                    Divider().padding(.leading, 0)
                                }
                                HStack {
                                    Text(item.label.ko)
                                        .font(.system(size: 13.5, weight: .medium))
                                        .foregroundStyle(BUColor.inkSecondary)
                                    Spacer()
                                    Text("\(item.amountWon.formatted())만원")
                                        .font(.system(size: 13.5, weight: .semibold))
                                        .foregroundStyle(BUColor.ink)
                                        .monospacedDigit()
                                }
                                .padding(.vertical, 9)
                            }
                        }
                    }

                    // source
                    if let src = info.costSource {
                        HStack(spacing: 5) {
                            Circle().fill(BUColor.success).frame(width: 6, height: 6)
                            Text("출처: \(src) · VAT 별도 · 점포 구입비 별도")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(BUColor.inkMuted)
                        }
                    }

                    // CTA — 정보공개서 startupCostWon (만원) 을 자본금으로 설정
                    Button {
                        let totalWon = info.startupCostWon * 10_000
                        startupWon = totalWon
                        startupSlider = Double(totalWon)
                        startupText = String(info.startupCostWon)
                    } label: {
                        Text("\(formatManwon(info.startupCostWon))을 자본금으로 설정")
                            .font(.system(size: 14.5, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(BUColor.midnight, in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        } else if startupType == "franchise" {
            // 프랜차이즈 선택했지만 브랜드 미선택 — 안내 카드
            BUCard(.card) {
                HStack(spacing: 10) {
                    Image(systemName: "info.circle.fill")
                        .font(.system(size: 17))
                        .foregroundStyle(BUColor.midnight)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("프랜차이즈 브랜드를 먼저 선택하세요")
                            .font(.system(size: 13.5, weight: .heavy))
                            .foregroundStyle(BUColor.ink)
                        Text("프랜차이즈 탭에서 브랜드를 선택하면 자동으로 예상 창업 비용이 여기에 표시됩니다.")
                            .font(.system(size: 11.5, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                            .lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer()
                }
            }
        }
    }

    // MARK: - § 1 시작 자본금

    private var startupCapitalSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack {
                    BUEyebrow("시작 자본금")
                    Spacer()
                    Text(startupWon > 0 ? formatWon(startupWon) : "미입력")
                        .font(BUFont.cardTitleSmall)
                        .foregroundStyle(startupWon > 0 ? BUColor.midnightDeep : BUColor.inkMuted)
                        .monospacedDigit()
                }

                Text("슬라이더로 대략적인 규모를 먼저 잡고, 아래에서 세밀하게 조정하세요.")
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)

                Slider(
                    value: $startupSlider,
                    in: 1_000_000...300_000_000,
                    step: 1_000_000
                ) { _ in
                    startupWon = Int(startupSlider)
                    startupText = String(startupWon / 10_000)
                }
                .tint(BUColor.midnight)

                HStack {
                    Text("100만원")
                    Spacer()
                    Text("3억원")
                }
                .font(BUFont.eyebrow)
                .foregroundStyle(BUColor.inkMuted)

                HStack(spacing: BUSpacing.sm) {
                    TextField("예: 3000", text: $startupText)
                        .buTextFieldStyle()
                        .keyboardType(.numberPad)
                        .onChange(of: startupText) { _, v in
                            let n = Int(v) ?? 0
                            let won = max(1_000_000, min(300_000_000, n * 10_000))
                            startupWon = won
                            startupSlider = Double(won)
                        }
                    Text("만원")
                        .font(BUFont.body)
                        .foregroundStyle(BUColor.inkSecondary)
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(startupPresets, id: \.0) { label, value in
                            BudgetChip(label: label, isSelected: abs(startupWon - value) < 500_000) {
                                startupWon = value
                                startupSlider = Double(value)
                                startupText = String(value / 10_000)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - § 3 운영 자본금 / 런웨이 자본

    private var operatingCapitalTitle: String {
        isStartup ? "런웨이 자본 (자본금과 별도)" : "초기 운영자본금 (자본금과 별도)"
    }
    private var operatingCapitalHelper: String {
        isStartup
            ? "월 번레이트 × 운영 가능 개월 수입니다. 시리즈A 평균 21개월 런웨이가 표준이며, 매출이 비용을 못 덮는 동안 버틸 자금이에요."
            : "오픈 직후 몇 달간 월세·인건비·공과금·재료비로 쓸 현금입니다. 매출이 적자를 덮기 전까지 버티는 연료예요."
    }

    private var operatingCapitalSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                // 스타트업 전용 — 운영 모드 선택 (4 모드)
                if isStartup {
                    startupModeSelector
                }

                HStack {
                    BUEyebrow(operatingCapitalTitle)
                    Spacer()
                    Text(operatingWon > 0 ? formatWon(operatingWon) : "미입력")
                        .font(BUFont.cardTitleSmall)
                        .foregroundStyle(operatingWon > 0 ? BUColor.midnightDeep : BUColor.inkMuted)
                        .monospacedDigit()
                }

                Text(operatingCapitalHelper)
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)

                // 런웨이 건강도
                HStack(spacing: BUSpacing.sm) {
                    Circle()
                        .fill(ratioColor)
                        .frame(width: 8, height: 8)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(ratioLabel)
                            .font(BUFont.bodyCaption.weight(.semibold))
                            .foregroundStyle(ratioColor)
                        Text("권장: \(formatWon(recommendedMin)) ~ \(formatWon(recommendedMax)) (월 \(isStartup ? "번레이트" : "예상 비용") \(formatWon(monthlyEstimate)) × \(isStartup ? "12-24개월" : "3-6개월"))")
                            .font(BUFont.eyebrow)
                            .foregroundStyle(BUColor.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(10)
                .background(ratioColor.opacity(0.08), in: RoundedRectangle(cornerRadius: 10, style: .continuous))

                Slider(
                    value: $operatingSlider,
                    in: 0...operatingSliderMax,
                    step: max(500_000, operatingSliderMax >= 1_000_000_000 ? 10_000_000 : (operatingSliderMax >= 100_000_000 ? 1_000_000 : 500_000))
                ) { _ in
                    operatingWon = Int(operatingSlider)
                    operatingText = String(operatingWon / 10_000)
                }
                .tint(ratioColor)

                HStack {
                    Text("0")
                    Spacer()
                    Text(formatWon(Int(operatingSliderMax)))
                }
                .font(BUFont.eyebrow)
                .foregroundStyle(BUColor.inkMuted)

                HStack(spacing: BUSpacing.sm) {
                    TextField("예: \(isStartup ? "5000" : "2400")", text: $operatingText)
                        .buTextFieldStyle()
                        .keyboardType(.numberPad)
                        .onChange(of: operatingText) { _, v in
                            let n = Int(v) ?? 0
                            let won = max(0, min(Int(operatingSliderMax), n * 10_000))
                            operatingWon = won
                            operatingSlider = Double(won)
                        }
                    Text("만원")
                        .font(BUFont.body)
                        .foregroundStyle(BUColor.inkSecondary)
                }

                // 개월수 프리셋 — startup 12/18/24, offline 3/6/12
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(operatingPresets, id: \.label) { preset in
                            BudgetChip(
                                label: "\(preset.label) · \(formatWon(preset.value))",
                                isSelected: abs(operatingWon - preset.value) < 500_000
                            ) {
                                operatingWon = preset.value
                                operatingSlider = Double(preset.value)
                                operatingText = String(preset.value / 10_000)
                            }
                        }
                    }
                }
            }
        }
    }

    private var operatingPresets: [(label: String, value: Int)] {
        if isStartup {
            return [
                ("12개월 (최소)",      monthlyEstimate * 12),
                ("18개월",             monthlyEstimate * 18),
                ("24개월 (시리즈A 표준)", monthlyEstimate * 24),
            ]
        }
        return [
            ("3개월", monthlyEstimate * 3),
            ("6개월", monthlyEstimate * 6),
            ("1년",   monthlyEstimate * 12),
        ]
    }

    // MARK: - 스타트업 운영 모드 선택 (4 모드)

    private struct ModeOption: Identifiable {
        let id: String
        let label: String
        let desc: String
    }
    private let modeOptions: [ModeOption] = [
        .init(id: "indie",     label: "1인 인디",     desc: "혼자, 인건비 X, 도구·서버만"),
        .init(id: "bootstrap", label: "부트스트랩",   desc: "1-3명, 자비 또는 낮은 인건비"),
        .init(id: "seed",      label: "시드 단계",    desc: "3-5명, 표준 인건비 + 시드 자금"),
        .init(id: "seriesA",   label: "시리즈A 이상", desc: "5-10명, 정규 인건비 + 마케팅"),
    ]

    private var startupModeSelector: some View {
        VStack(alignment: .leading, spacing: 8) {
            BUEyebrow("운영 모드 — 비용 추정용")
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                ForEach(modeOptions) { mode in
                    let active = startupMode == mode.id
                    Button {
                        startupMode = mode.id
                    } label: {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(mode.label)
                                .font(.system(size: 13, weight: .heavy))
                                .tracking(-0.1)
                                .foregroundStyle(active ? BUColor.midnight : BUColor.ink)
                            Text(mode.desc)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(BUColor.inkMuted)
                                .lineSpacing(2)
                                .multilineTextAlignment(.leading)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(active ? BUColor.midnight.opacity(0.06) : Color.white, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .strokeBorder(active ? BUColor.midnight : BUColor.midnight.opacity(0.10), lineWidth: active ? 1.5 : 1)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.bottom, 4)
        }
    }

    // MARK: - § 4 오픈 시점

    private var openDateSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("목표 오픈 시점")
                Text("로드맵 마감과 실행 속도를 이 일정에 맞춥니다.")
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkSecondary)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    ForEach(openDatePresets, id: \.id) { preset in
                        DateChip(label: preset.labelKo, isSelected: openDateId == preset.id) {
                            openDateId = preset.id
                        }
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    private func formatWon(_ won: Int) -> String {
        if won >= 100_000_000 {
            let eok = Double(won) / 100_000_000.0
            return eok == Double(Int(eok)) ? "\(Int(eok))억원" : String(format: "%.1f억원", eok)
        }
        return "\(won / 10_000)만원"
    }

    private func formatManwon(_ manwon: Int) -> String {
        if manwon >= 10_000 {
            let eok = Double(manwon) / 10_000.0
            return eok == Double(Int(eok)) ? "\(Int(eok))억원" : String(format: "%.1f억원", eok)
        }
        return "\(manwon.formatted())만원"
    }
}

// MARK: - Sub-views

private struct BudgetChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 12, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? .white : BUColor.inkSecondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.07), in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct DateChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 12, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? .white : BUColor.inkSecondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(isSelected ? BUColor.midnight : BUColor.midnight.opacity(0.07), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Funding match cards (2026-05-25 신규)

/// 예산 단계에서 표시되는 컴팩트 펀딩 카드 — 외부 URL 링크.
private struct FundingMiniCard: View {
    let program: FundingProgram

    private var statusBadge: (text: String, color: Color)? {
        switch program.applicationStatus {
        case "open":
            if let days = program.daysUntilDeadline, days <= 30 {
                return ("D-\(days)", days <= 7 ? BUColor.danger : Color.orange)
            }
            return ("모집중", BUColor.success)
        case "upcoming":
            return ("예정", BUColor.midnight)
        default:
            return nil
        }
    }

    private var categoryColor: Color {
        switch program.category {
        case "government":  return Color(red: 0.149, green: 0.388, blue: 0.922)
        case "private":     return Color(red: 0.486, green: 0.227, blue: 0.929)
        case "local":       return Color(red: 0.020, green: 0.588, blue: 0.412)
        case "corporate":   return Color(red: 0.918, green: 0.345, blue: 0.047)
        case "competition": return Color(red: 0.859, green: 0.157, blue: 0.467)
        default:            return BUColor.midnight
        }
    }

    private var categoryLabel: String {
        switch program.category {
        case "government":  return "정부"
        case "private":     return "민간"
        case "local":       return "지역"
        case "corporate":   return "대기업"
        case "competition": return "콘테스트"
        default:            return ""
        }
    }

    var body: some View {
        Link(destination: URL(string: program.url) ?? URL(string: "https://k-startup.go.kr")!) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text(categoryLabel)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(categoryColor)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(categoryColor.opacity(0.12), in: Capsule())
                    if program.eligible {
                        Text("자격 충족")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(BUColor.success)
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(BUColor.success.opacity(0.12), in: Capsule())
                    }
                    if let badge = statusBadge {
                        Text(badge.text)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(badge.color)
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(badge.color.opacity(0.12), in: Capsule())
                    }
                    Spacer()
                    Image(systemName: "arrow.up.right.square")
                        .font(.system(size: 12))
                        .foregroundStyle(BUColor.inkMuted)
                }
                Text(program.name)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                    .tracking(-0.1)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                HStack(spacing: 6) {
                    Text(program.organizer)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                    if let amount = program.amount, !amount.isEmpty {
                        Text("·")
                            .font(.system(size: 11))
                            .foregroundStyle(BUColor.inkSubtle)
                        Text(amount)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(BUColor.midnight)
                    }
                }
                Text(program.benefit)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                if let topReason = program.matchReasons.sorted(by: { $0.weight > $1.weight }).first {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 9))
                            .foregroundStyle(BUColor.midnight.opacity(0.7))
                        Text(topReason.text)
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(BUColor.midnight.opacity(0.85))
                            .lineLimit(1)
                    }
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.08), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

/// 전체 매칭 목록 sheet — 상위 20개 표시. "펀딩 탭에서 더 보기" 안내 포함.
private struct FundingFullListSheet: View {
    let programs: [FundingProgram]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("이 업종에 추천 — 전체 \(programs.count)개")
                            .font(.system(size: 22, weight: .heavy))
                            .foregroundStyle(BUColor.ink)
                            .tracking(-0.3)
                        Text("자격 충족 + 매칭 점수 순. 더 자세한 조건 입력은 「펀딩」 탭에서.")
                            .font(BUFont.bodyCaption)
                            .foregroundStyle(BUColor.inkSecondary)
                            .lineSpacing(2)
                    }
                    .padding(.bottom, 4)

                    ForEach(programs) { prog in
                        FundingMiniCard(program: prog)
                    }
                }
                .padding(BUSpacing.md)
                .padding(.bottom, 40)
            }
            .navigationTitle("정부 지원·정책자금")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
            }
        }
    }
}

// MARK: - TextField style

private extension View {
    func buTextFieldStyle() -> some View {
        self
            .font(BUFont.body)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

// MARK: - Preview

#if DEBUG
#Preview("BudgetSetup") {
    BudgetSetupStageView()
}
#endif
