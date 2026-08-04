//
//  AIRoadmapWizardView.swift — AI 맞춤 로드맵 위저드 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/AIRoadmapWizard.tsx
//
//  단계: idea → budget → region → storeName → generating → review → (complete 콜백)
//  디자인: BUColor.midnight 단일 톤, BUBackgroundSurface, Apple 미니멀
//

import SwiftUI
#if canImport(UIKit)
import UIKit
#endif
import FoundOneCore
import FoundOneDesignSystem
import FoundOneData

// MARK: - Step

private enum WizardStep {
    case idea, industry, budget, region, storeName, generating, review
}

// MARK: - ViewModel

@MainActor
@Observable
private final class AIRoadmapViewModel {

    var step: WizardStep = .idea
    var ideaText: String = ""
    // 업종 확인 (2026-08-03 분류 분리) — LLM 은 후보만, 확정은 사용자
    var industryCandidates: [IndustryCandidateItem] = []
    var confirmedIndustry: IndustryCandidateItem? = nil
    var classifying = false
    var classifyFailed = false
    var budget: Int? = nil
    var region: String = ""
    var storeName: String = ""
    var genProgress: Int = 0
    var result: AIRoadmapResult? = nil
    var errorMessage: String? = nil

    private let service: AIRoadmapService

    // 생성 단계 레이블 (웹 genSteps 미러 — 오프라인 기본값, ideaText 에 따라 교체)
    var genSteps: [String] {
        let lower = ideaText.lowercased()
        let isTech = lower.contains("앱") || lower.contains("saas") || lower.contains("ai ") ||
                     lower.contains("플랫폼") || lower.contains("소프트웨어") || lower.contains("스타트업") ||
                     lower.contains("개발")
        let isOnline = lower.contains("온라인") || lower.contains("쇼핑몰") || lower.contains("스마트스토어") ||
                       lower.contains("이커머스") || lower.contains("커머스")

        if isTech {
            return ["사업 컨셉 정리 + 업종 매칭", "시장 규모 + 경쟁 환경 분석", "예산 배분 + 인건비 추정",
                    "법인 설립 요건 + 4대보험", "개발 인프라·툴 선정", "정부지원·VC 적합도",
                    "GTM 전략 + 채용 계획", "타임라인 + 리스크 분석"]
        } else if isOnline {
            return ["사업 컨셉 정리 + 업종 매칭", "시장 트렌드 + 카테고리 분석", "예산 배분 + 월 운영비 추정",
                    "사업자등록·통신판매업 절차", "상품 소싱·물류 파트너 추천", "판매 플랫폼 + 결제 PG 선정",
                    "권장 보험 + 자금 인프라", "정부지원사업 + 타임라인 + 리스크"]
        } else {
            return ["사업 컨셉 정리 + 업종 매칭", "상권 데이터 분석 (점수·등급)", "예산 배분 + 월비용 추정",
                    "법무·세무 + 인허가 확인", "공급업체 추천 (서비스 풀에서)", "인테리어 시공·자재·컨셉 선정",
                    "운영 채널 + 자금 인프라", "정부지원사업 + 타임라인 + 리스크"]
        }
    }

    init(service: AIRoadmapService) {
        self.service = service
    }

    func classify() {
        guard !classifying else { return }
        classifying = true
        classifyFailed = false
        Task { @MainActor in
            defer { classifying = false }
            do {
                let candidates = try await service.classify(ideaText: ideaText)
                industryCandidates = candidates
                confirmedIndustry = candidates.first
                step = .industry
            } catch {
                // 분류 실패해도 막지 않는다 — 생성 중 AI 판단 경로로 진행 가능 (거짓 실패 금지)
                industryCandidates = []
                confirmedIndustry = nil
                classifyFailed = true
                step = .industry
            }
        }
    }

    func generate() {
        step = .generating
        genProgress = 0
        errorMessage = nil

        // 웹과 동일한 점진적 진행 (7 딜레이, 마지막은 API 응답까지 holding)
        let delays: [UInt64] = [1_500_000_000, 2_000_000_000, 2_500_000_000,
                                3_500_000_000, 5_000_000_000, 6_000_000_000, 7_000_000_000]
        Task { @MainActor in
            for (i, delay) in delays.enumerated() {
                try? await Task.sleep(nanoseconds: delay)
                if self.step != .generating { return }
                self.genProgress = i + 1
            }
        }

        Task { @MainActor in
            do {
                let input = AIRoadmapInput(
                    ideaText: ideaText,
                    confirmedSubIndustryId: confirmedIndustry?.subIndustryId,
                    confirmedCategoryId: confirmedIndustry?.categoryId,
                    budget: budget,
                    region: region.isEmpty ? nil : region,
                    storeName: storeName.isEmpty ? nil : storeName,
                    teamSize: nil
                )
                let res = try await service.generate(input: input)
                // API 응답 후 남은 단계 빠르게 완료
                for i in genProgress..<genSteps.count {
                    try? await Task.sleep(nanoseconds: 200_000_000)
                    self.genProgress = i + 1
                }
                self.result = res
                self.step = .review
            } catch {
                self.genProgress = 0
                self.errorMessage = error.localizedDescription
                self.step = .idea
            }
        }
    }
}

// MARK: - AIRoadmapWizardView

public struct AIRoadmapWizardView: View {

    let onComplete: (AIRoadmapResult, String) -> Void
    let onBack: () -> Void

    @State private var vm: AIRoadmapViewModel

    public init(
        webAppURL: URL,
        onComplete: @escaping (AIRoadmapResult, String) -> Void,
        onBack: @escaping () -> Void
    ) {
        let service = AIRoadmapService(webAppURL: webAppURL, supabaseClient: BUSupabase.shared.client)
        self._vm = State(initialValue: AIRoadmapViewModel(service: service))
        self.onComplete = onComplete
        self.onBack = onBack
    }

    public var body: some View {
        ZStack {
            BUBackgroundSurface()
            switch vm.step {
            case .idea:
                // 입력 화면 + 뒤로 떠다니는 성공 스타트업 카드(웹 FloatingInspiration 미러).
                // 카드 버튼에서만 hit-test → 빈 영역 탭은 입력으로 통과.
                IdeaStepView(vm: vm, onBack: onBack)
                FloatingInspirationView()
            case .industry:   IndustryStepView(vm: vm)
            case .budget:     BudgetStepView(vm: vm)
            case .region:     RegionStepView(vm: vm)
            case .storeName:  StoreNameStepView(vm: vm)
            case .generating: GeneratingStepView(vm: vm)
            case .review:
                if let result = vm.result {
                    ReviewStepView(
                        result: result,
                        storeName: vm.storeName,
                        onComplete: { onComplete(result, vm.storeName) },
                        onBack: { vm.step = .idea }
                    )
                }
            }
        }
    }
}

// MARK: - Shared Styles

private let midnight = Color(red: 0.098, green: 0.098, blue: 0.439) // #191970

@MainActor
private func primaryButton(label: String, disabled: Bool = false, action: @escaping () -> Void) -> some View {
    Button(action: action) {
        Text(label)
            .font(.system(size: 15, weight: .heavy))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(midnight.opacity(disabled ? 0.35 : 1), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
    .buttonStyle(.plain)
    .disabled(disabled)
}

@MainActor
private func secondaryButton(label: String, action: @escaping () -> Void) -> some View {
    Button(action: action) {
        Text(label)
            .font(.system(size: 14, weight: .semibold))
            .foregroundStyle(midnight)
            .padding(.horizontal, 20)
            .padding(.vertical, 15)
            .background(midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
    .buttonStyle(.plain)
}

private struct StepShell<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 0) {
                content
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 40)
        }
        #if os(iOS)
        // 2026-05-29 P0: 위저드는 셸을 안 써서 키보드 회피가 없었음. numberPad(예산)·TextEditor(아이디어)
        //   입력 시 키보드가 필드를 가리고 닫을 방법이 없던 문제. 드래그 dismiss + "완료" 버튼 부착.
        .scrollDismissesKeyboard(.interactively)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("완료") {
                    UIApplication.shared.sendAction(
                        #selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil
                    )
                }
                .font(.system(size: 16, weight: .semibold))
            }
        }
        #endif
    }
}

private struct StepHeader: View {
    let eyebrow: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Image(systemName: "sparkles")
                    .font(.system(size: 9, weight: .semibold))
                Text(eyebrow)
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(0.8)
            }
            .foregroundStyle(midnight)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(midnight.opacity(0.08), in: Capsule())

            Text(title)
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(Color(red: 0.118, green: 0.102, blue: 0.243))
                .tracking(-0.7)
                .lineSpacing(2)
                .padding(.top, 10)

            Text(subtitle)
                .font(.system(size: 13.5, weight: .medium))
                .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.55))
                .lineSpacing(2)
                .padding(.top, 2)
        }
        .padding(.bottom, 20)
    }
}

// MARK: - Step 1: Idea

private struct IdeaStepView: View {
    @Bindable var vm: AIRoadmapViewModel
    let onBack: () -> Void

    private let examples = ["마포구에서 1인 카페 창업", "온라인 반려동물 용품 쇼핑몰", "AI 기반 B2B SaaS 스타트업"]

    var body: some View {
        GeometryReader { geo in
            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    // 뒤로 — 상단 고정(센터 정렬에서 제외)
                    Button(action: onBack) {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 11, weight: .semibold))
                            Text("뒤로")
                                .font(.system(size: 13, weight: .semibold))
                        }
                        .foregroundStyle(midnight)
                    }
                    .buttonStyle(.plain)

                    // ↑ 콘텐츠를 화면 중앙으로 — 위 아래 동일 여백(떠다니는 카드 공간 확보)
                    Spacer(minLength: 28)

                    StepHeader(
                eyebrow: "Found.One AI",
                title: "어떤 사업을 시작하고 싶으세요?",
                subtitle: "자유롭게 설명해주세요. 한 줄이든 긴 설명이든 괜찮습니다.\nAI가 분석해서 맞춤 로드맵을 만들어드립니다."
            )

            // 텍스트 입력
            ZStack(alignment: .topLeading) {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color.white.opacity(0.88))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(midnight.opacity(0.12), lineWidth: 1)
                    )
                TextEditor(text: $vm.ideaText)
                    .font(.system(size: 15, weight: .regular))
                    .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
                    .scrollContentBackground(.hidden)
                    .padding(14)
                if vm.ideaText.isEmpty {
                    Text("예: 강남역 근처에서 건강한 샐러드 전문 가게를 열고 싶어요. 직장인 점심 수요를 공략하고, 배달도 병행하려 합니다...")
                        .font(.system(size: 14.5, weight: .regular))
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.3))
                        .padding(.horizontal, 18)
                        .padding(.top, 20)
                        .allowsHitTesting(false)
                }
            }
            // 고정 높이 — TextEditor 가 남는 세로 공간을 흡수하지 않게 해 Spacer 가 콘텐츠를 센터링.
            .frame(height: 150)

            // 예시 칩
            HStack(spacing: 6) {
                ForEach(examples, id: \.self) { ex in
                    Button(action: { vm.ideaText = ex }) {
                        Text(ex)
                            .font(.system(size: 11.5, weight: .semibold))
                            .foregroundStyle(midnight)
                            .padding(.horizontal, 11)
                            .padding(.vertical, 6)
                            .background(midnight.opacity(0.06), in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.top, 10)

            // 에러 메시지
            if let err = vm.errorMessage {
                VStack(alignment: .leading, spacing: 8) {
                    Text("생성에 실패했습니다")
                        .font(.system(size: 13.5, weight: .bold))
                        .foregroundStyle(BUColor.danger)
                    Text(err)
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.6))
                        .lineSpacing(2)
                    Text("아래 버튼을 눌러 다시 시도해 주세요. 입력하신 내용은 모두 보존됩니다.")
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.45))
                }
                .padding(16)
                .background(BUColor.danger.opacity(0.05), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(BUColor.danger.opacity(0.15), lineWidth: 1))
                .padding(.top, 14)
            }

                    primaryButton(label: vm.classifying ? "업종 분석 중... (몇 초)" : "다음",
                                  disabled: vm.ideaText.trimmingCharacters(in: .whitespaces).count < 5 || vm.classifying) {
                        vm.classify()
                    }
                    .padding(.top, 20)

                    // ↓ 하단 동일 여백 — 콘텐츠 센터링 + 하단 카드 공간
                    Spacer(minLength: 28)
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 40)
                .frame(minHeight: geo.size.height)
            }
            #if os(iOS)
            .scrollDismissesKeyboard(.interactively)
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("완료") {
                        UIApplication.shared.sendAction(
                            #selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil
                        )
                    }
                    .font(.system(size: 16, weight: .semibold))
                }
            }
            #endif
        }
    }
}

// MARK: - Step 1.5: 업종 확인 (2026-08-03 분류 분리 — 웹 industry 스텝 미러)

private struct IndustryStepView: View {
    @Bindable var vm: AIRoadmapViewModel

    var body: some View {
        StepShell {
            VStack(alignment: .leading, spacing: 0) {
                Button { vm.step = .idea } label: {
                    Label("뒤로", systemImage: "arrow.left")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(midnight.opacity(0.6))
                }
                .buttonStyle(.plain)
                .padding(.bottom, 18)

                Text("업종 확인")
                    .font(.system(size: 10.5, weight: .heavy)).tracking(0.8)
                    .foregroundStyle(midnight)
                    .padding(.bottom, 6)
                Text("어떤 업종이 맞나요?")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(Color(red: 0.118, green: 0.102, blue: 0.243))
                    .padding(.bottom, 4)
                Text("업종이 로드맵 전체(인허가·예산·공급업체)의 기준이 됩니다. AI 추천 중에서 사장님이 확정해주세요.")
                    .font(.system(size: 13.5)).foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.55))
                    .lineSpacing(3)
                    .padding(.bottom, 18)

                if vm.industryCandidates.isEmpty {
                    Text("업종 분석에 실패했어요. 그대로 진행하면 생성 단계에서 AI가 업종을 판단합니다 — 리뷰 화면에서 꼭 확인해주세요.")
                        .font(.system(size: 13)).foregroundStyle(BUColor.danger)
                        .lineSpacing(3)
                        .padding(14)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(BUColor.danger.opacity(0.05), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                } else {
                    VStack(spacing: 10) {
                        ForEach(Array(vm.industryCandidates.enumerated()), id: \.element.subIndustryId) { i, c in
                            candidateCard(c, isTop: i == 0)
                        }
                    }
                    Text("맞는 업종이 없으면 「뒤로」에서 아이디어를 더 구체적으로 적어주세요 — 업종 분석은 생성 횟수를 쓰지 않습니다.")
                        .font(.system(size: 11.5)).foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.45))
                        .lineSpacing(2)
                        .padding(.top, 10)
                }

                primaryButton(label: vm.confirmedIndustry.map { "「\($0.label)」(으)로 진행" } ?? "업종 미정으로 진행") {
                    vm.step = .budget
                }
                .padding(.top, 20)
                Spacer(minLength: 28)
            }
        }
    }

    private func candidateCard(_ c: IndustryCandidateItem, isTop: Bool) -> some View {
        let selected = vm.confirmedIndustry?.subIndustryId == c.subIndustryId
        return Button { vm.confirmedIndustry = c } label: {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(c.label).font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
                    if isTop {
                        Text("AI 추천 1순위")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(midnight)
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background(midnight.opacity(0.08), in: Capsule())
                    }
                    Spacer()
                    if selected {
                        Image(systemName: "checkmark").font(.system(size: 13, weight: .heavy)).foregroundStyle(midnight)
                    }
                }
                Text(c.reason)
                    .font(.system(size: 12.5)).foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.6))
                    .lineSpacing(2)
                    .multilineTextAlignment(.leading)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(selected ? midnight.opacity(0.05) : Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(selected ? midnight : midnight.opacity(0.12), lineWidth: selected ? 2 : 1))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Step 2: Budget

private struct BudgetStepView: View {
    @Bindable var vm: AIRoadmapViewModel
    @State private var customText: String = ""

    private let presets: [(String, Int)] = [
        ("3천만원 이하", 30_000_000),
        ("3~5천만원", 50_000_000),
        ("5천만~1억", 100_000_000),
        ("1억 이상", 150_000_000),
    ]

    var body: some View {
        StepShell {
            backButton { vm.step = .idea }

            StepHeader(
                eyebrow: "2단계: 예산",
                title: "예상 창업 자금은 얼마인가요?",
                subtitle: "대략적인 금액이면 충분합니다"
            )

            // 프리셋 2x2
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(presets, id: \.1) { label, value in
                    Button(action: {
                        vm.budget = value
                        customText = String(value / 10_000)
                    }) {
                        Text(label)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(vm.budget == value ? .white : midnight)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                vm.budget == value ? midnight : midnight.opacity(0.06),
                                in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .strokeBorder(midnight.opacity(vm.budget == value ? 0 : 0.10), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }

            // 직접 입력
            HStack(spacing: 10) {
                Text("또는")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.4))
                TextField("직접 입력 (만원)", text: $customText)
                    .keyboardType(.numberPad)
                    .font(.system(size: 14, weight: .medium))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .background(Color.white.opacity(0.88), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(midnight.opacity(0.12), lineWidth: 1))
                    .onChange(of: customText) { _, newVal in
                        let digits = newVal.filter(\.isNumber)
                        customText = digits
                        if let n = Int(digits), n > 0 {
                            vm.budget = n * 10_000
                        }
                    }
            }
            .padding(.top, 14)

            primaryButton(label: "다음") {
                if vm.budget == nil { vm.budget = 50_000_000 }
                vm.step = .region
            }
            .padding(.top, 24)
        }
    }
}

// MARK: - Step 3: Region

private struct RegionStepView: View {
    @Bindable var vm: AIRoadmapViewModel

    var body: some View {
        StepShell {
            backButton { vm.step = .budget }

            StepHeader(
                eyebrow: "3단계: 상권",
                title: "희망 지역이 있으신가요?",
                subtitle: "구/동 수준이면 충분합니다. 없으면 AI가 추천합니다."
            )

            TextField("예: 강남구 역삼동, 마포구 망원동", text: $vm.region)
                .font(.system(size: 15, weight: .medium))
                .padding(.horizontal, 14)
                .padding(.vertical, 14)
                .background(Color.white.opacity(0.88), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(midnight.opacity(0.12), lineWidth: 1))

            HStack(spacing: 10) {
                primaryButton(label: "다음") {
                    vm.step = .storeName
                }
                secondaryButton(label: "건너뛰기") {
                    vm.region = ""
                    vm.step = .storeName
                }
            }
            .padding(.top, 24)
        }
    }
}

// MARK: - Step 4: Store Name

private struct StoreNameStepView: View {
    @Bindable var vm: AIRoadmapViewModel

    var body: some View {
        StepShell {
            backButton { vm.step = .region }

            StepHeader(
                eyebrow: "4단계: 상호명",
                title: "상호명을 정하셨나요?",
                subtitle: "없으면 나중에 정해도 됩니다.\nAI가 업종에 맞는 이름을 제안할 수도 있어요."
            )

            TextField("예: 그린보울, 맑은샐러드, Fresh Lab", text: $vm.storeName)
                .font(.system(size: 15, weight: .medium))
                .padding(.horizontal, 14)
                .padding(.vertical, 14)
                .background(Color.white.opacity(0.88), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(midnight.opacity(0.12), lineWidth: 1))

            HStack(spacing: 10) {
                primaryButton(label: "로드맵 생성하기") {
                    vm.generate()
                }
                secondaryButton(label: "건너뛰기") {
                    vm.storeName = ""
                    vm.generate()
                }
            }
            .padding(.top, 24)
        }
    }
}

// MARK: - Step 5: Generating

private struct GeneratingStepView: View {
    let vm: AIRoadmapViewModel

    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            VStack(spacing: 24) {
                // 헤더
                VStack(spacing: 10) {
                    HStack(spacing: 5) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 9, weight: .semibold))
                        Text("AI 생성 중")
                            .font(.system(size: 10, weight: .heavy))
                            .tracking(1.4)
                    }
                    .foregroundStyle(midnight)
                    .padding(.horizontal, 11)
                    .padding(.vertical, 5)
                    .background(midnight.opacity(0.10), in: Capsule())

                    Text("로드맵을 구성하고 있습니다")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(Color(red: 0.118, green: 0.102, blue: 0.243))
                        .tracking(-0.55)
                        .multilineTextAlignment(.center)
                    // 실측 26~28초(Pass1) + 선택 호출 — 기대치 설정으로 이탈 방지 (웹 미러, 2026-08-03)
                    Text("보통 30초~1분 걸려요 — 화면을 닫지 마세요")
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundStyle(Color(red: 0.118, green: 0.102, blue: 0.243).opacity(0.5))
                }

                // 단계 리스트
                VStack(alignment: .leading, spacing: 14) {
                    ForEach(Array(vm.genSteps.enumerated()), id: \.offset) { i, stepLabel in
                        HStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(nodeFill(i))
                                    .frame(width: 22, height: 22)
                                if i < vm.genProgress {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 9, weight: .heavy))
                                        .foregroundStyle(.white)
                                } else if i == vm.genProgress {
                                    Circle()
                                        .fill(.white)
                                        .frame(width: 6, height: 6)
                                }
                            }
                            .overlay(
                                Circle()
                                    .strokeBorder(midnight.opacity(i == vm.genProgress ? 0.16 : 0), lineWidth: 4)
                                    .scaleEffect(1.5)
                            )

                            Text(stepLabel + (i == vm.genProgress ? "..." : i < vm.genProgress ? " 완료" : ""))
                                .font(.system(size: 13.5, weight: i <= vm.genProgress ? .semibold : .medium))
                                .foregroundStyle(i <= vm.genProgress
                                    ? Color(red: 0.118, green: 0.102, blue: 0.243)
                                    : Color(red: 0.118, green: 0.102, blue: 0.243).opacity(0.32))
                                .animation(.easeOut(duration: 0.3), value: vm.genProgress)
                        }
                    }
                }
                .padding(22)
                .background(Color.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(midnight.opacity(0.07), lineWidth: 1))
            }
            .padding(.horizontal, 20)
            Spacer()
        }
    }

    private func nodeFill(_ i: Int) -> Color {
        if i < vm.genProgress { return midnight }
        if i == vm.genProgress { return Color(red: 0.357, green: 0.420, blue: 1.0) }
        return midnight.opacity(0.08)
    }
}

// MARK: - Step 6: Review

private struct ReviewStepView: View {
    let result: AIRoadmapResult
    let storeName: String
    let onComplete: () -> Void
    let onBack: () -> Void

    private var totalBudget: Int { result.budgetAllocation.displayTotal }

    // budgetAllocation 은 *만원 단위* (웹과 동일) — 원으로 오인하면 합 15,000만원→"1만원" 으로 깨진다.
    private func fmt(_ manwon: Int) -> String {
        if manwon <= 0 { return "—" }
        var v = abs(manwon)
        // 원 단위 오염 힐링 (2026-08-03, 웹 패리티) — 만원 단위 100억 이상은 비현실 = 원 단위로 판단해 ÷10,000
        if v >= 1_000_000 { v = Int((Double(v) / 10_000).rounded()) }
        if v >= 10_000 {
            let eok = v / 10_000
            let rest = v % 10_000
            return rest > 0 ? "\(eok)억 \(rest.formatted())만원" : "\(eok)억원"
        }
        return "\(v.formatted())만원"
    }

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14) {

                // 헤더
                VStack(spacing: 8) {
                    HStack(spacing: 5) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10, weight: .semibold))
                        Text("Found.One AI")
                            .font(.system(size: 10, weight: .heavy))
                            .tracking(0.8)
                    }
                    .foregroundStyle(midnight)
                    .padding(.horizontal, 11)
                    .padding(.vertical, 5)
                    .background(midnight.opacity(0.08), in: Capsule())

                    Text("로드맵 초안이 완성되었습니다")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(Color(red: 0.118, green: 0.102, blue: 0.243))
                        .tracking(-0.7)
                        .multilineTextAlignment(.center)

                    Text([
                        storeName.isEmpty ? nil : storeName,
                        result.parsed.industryLabel,
                        result.parsed.preferredRegion.isEmpty ? nil : result.parsed.preferredRegion,
                        fmt(totalBudget)
                    ].compactMap { $0 }.joined(separator: " · "))
                        .font(.system(size: 12.5, weight: .medium))
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.55))
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 8)
                .padding(.bottom, 4)

                // 사업 컨셉 hero
                if !result.conceptSummary.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(spacing: 5) {
                            Circle()
                                .fill(midnight.opacity(0.10))
                                .frame(width: 12, height: 12)
                                .overlay(Circle().fill(midnight).frame(width: 5, height: 5))
                            Text("이 사업은")
                                .font(.system(size: 10.5, weight: .heavy))
                                .tracking(0.8)
                                .foregroundStyle(midnight)
                        }
                        Text(result.conceptSummary)
                            .font(.system(size: 15.5, weight: .medium))
                            .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
                            .lineSpacing(4)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                tagChip(result.parsed.industryLabel, color: midnight)
                                tagChip(result.parsed.startupType == "franchise" ? "프랜차이즈" : "독립 창업",
                                        color: Color(red: 0.231, green: 0.490, blue: 0.867))
                                if !result.parsed.preferredRegion.isEmpty {
                                    tagChip("📍 \(result.parsed.preferredRegion)", color: BUColor.warn)
                                }
                                tagChip(fmt(totalBudget), color: BUColor.success)
                            }
                        }
                    }
                    .padding(18)
                    .background(
                        LinearGradient(
                            colors: [midnight.opacity(0.04), Color(red: 0.231, green: 0.490, blue: 0.867).opacity(0.04)],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ),
                        in: RoundedRectangle(cornerRadius: 18, style: .continuous)
                    )
                    .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(midnight.opacity(0.08), lineWidth: 1))
                }

                // ⭐ 분업 선언 — "AI가 해결한 것 vs 사장님이 하실 일" (웹 DivisionOfLabor 미러, 2026-08-03)
                DivisionOfLaborSection(result: result)

                // 업종 매칭 카드
                matchCard

                // 타임라인 카드
                if !result.timeline.phases.isEmpty {
                    timelineCard
                }

                // 정부지원 카드
                if !result.fundingPrograms.isEmpty {
                    fundingCard
                }

                // 내 지역 업체·공급처 — 서버 부착 실데이터 (웹 지역 실명 블록 미러, 2026-08-04)
                if (result.recommendations.regionalInteriorFirms?.isEmpty == false)
                    || (result.recommendations.regionalSupplierPlaces?.isEmpty == false) {
                    regionalVendorsCard
                }

                // 대표 공급 브랜드 — SSOT 시장 검증 (웹 supplyBrands 블록 미러. 프랜차이즈엔 서버가 미부착)
                if result.recommendations.supplyBrands?.isEmpty == false {
                    supplyBrandsCard
                }

                // 시작 버튼
                VStack(spacing: 10) {
                    primaryButton(label: "로드맵 시작하기 →") {
                        onComplete()
                    }
                    Button(action: onBack) {
                        Text("다시 입력하기")
                            .font(.system(size: 13.5, weight: .semibold))
                            .foregroundStyle(midnight.opacity(0.6))
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, 6)
                .padding(.bottom, 20)
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
        }
    }

    // 업종 매칭
    private var matchCard: some View {
        let conf = result.parsed.matchingConfidence
        let isLow = conf < 60
        let accent = isLow ? BUColor.warn : midnight
        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(isLow ? "업종 매칭 — 확인 필요" : "업종 매칭")
                    .font(.system(size: 10.5, weight: .heavy))
                    .tracking(0.7)
                    .foregroundStyle(accent)
                Spacer()
                Text("신뢰도 \(conf)/100")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(accent)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 3)
                    .background(.white, in: Capsule())
                    .overlay(Capsule().strokeBorder(accent.opacity(0.2), lineWidth: 1))
            }
            Text("\(result.parsed.industryLabel)  (\(result.parsed.subIndustryId))")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
            if !result.parsed.matchingReason.isEmpty {
                Text(result.parsed.matchingReason)
                    .font(.system(size: 12.5, weight: .medium))
                    .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.65))
                    .lineSpacing(2)
            }
            if !result.parsed.alternativeSubIndustries.isEmpty {
                Divider().opacity(0.15)
                Text("차선책")
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(0.6)
                    .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.45))
                ForEach(result.parsed.alternativeSubIndustries, id: \.id) { alt in
                    Text("**\(alt.id)** · \(alt.reason)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.65))
                        .lineSpacing(1.8)
                }
            }
        }
        .padding(18)
        .background(accent.opacity(0.04), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(accent.opacity(0.15), lineWidth: 1))
    }

    // 타임라인 카드
    private var timelineCard: some View {
        AISectionCard(icon: "calendar", title: "예상 타임라인") {
            HStack(spacing: 6) {
                Image(systemName: "clock")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(midnight)
                Text("총 \(result.timeline.totalWeeks)주 예상")
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(midnight)
            }
            .padding(.bottom, 8)

            ForEach(result.timeline.phases, id: \.name) { phase in
                HStack(alignment: .top, spacing: 10) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(midnight.opacity(0.18))
                        .frame(width: 3)
                        .padding(.top, 3)
                    VStack(alignment: .leading, spacing: 3) {
                        Text("\(phase.name)  \(phase.weeks)주")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
                        Text(phase.tasks.prefix(3).joined(separator: " · "))
                            .font(.system(size: 11.5, weight: .medium))
                            .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.55))
                            .lineSpacing(1.8)
                    }
                }
                .padding(.bottom, 6)
            }
        }
    }

    // 정부지원 카드
    private var fundingCard: some View {
        AISectionCard(icon: "building.columns", title: "활용 가능한 정부지원") {
            ForEach(result.fundingPrograms.prefix(3), id: \.name) { prog in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(prog.name)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
                        Spacer()
                        Text(prog.amount)
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(midnight)
                    }
                    Text(prog.eligibility)
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.55))
                        .lineSpacing(1.8)
                }
                .padding(.bottom, 8)
            }
        }
    }

    private func tagChip(_ label: String, color: Color) -> some View {
        Text(label)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.08), in: Capsule())
    }

    // 내 지역 업체·공급처 — 웹 지역 실명 블록 미러 (2026-08-04).
    //  신호 배지 3종(업종 특화·등록 확인·영업 확인)·거리·전화, 탭 → 카카오맵.
    private var regionalVendorsCard: some View {
        AISectionCard(icon: "mappin.and.ellipse", title: "내 지역 업체·공급처") {
            VStack(alignment: .leading, spacing: 10) {
                if let firms = result.recommendations.regionalInteriorFirms, !firms.isEmpty {
                    Text("인테리어 — 업종 검색 × 등록 대장 교차")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(midnight)
                    ForEach(Array(firms.enumerated()), id: \.offset) { _, f in
                        regionalFirmRow(f)
                    }
                }
                if let places = result.recommendations.regionalSupplierPlaces, !places.isEmpty {
                    Text("공급처 — 카카오맵 검색")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(midnight)
                        .padding(.top, 4)
                    ForEach(Array(places.enumerated()), id: \.offset) { _, p in
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                tagChip(p.keyword, color: midnight)
                                Text(p.name)
                                    .font(.system(size: 12.5, weight: .bold))
                                    .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
                            }
                            Text([p.phone, p.address].compactMap { $0 }.joined(separator: " · "))
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.55))
                        }
                        .padding(.bottom, 4)
                    }
                }
                Text("업종 특화 업체를 상권에서 가까운 순으로 먼저 보여드려요. 평점이 아니니 반드시 2~3곳 복수 견적을 비교하세요.")
                    .font(.system(size: 10.5, weight: .medium))
                    .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.5))
                    .lineSpacing(1.8)
                    .padding(.top, 2)
            }
        }
    }

    // 대표 공급 브랜드 — 점유율·인증 근거와 출처를 그대로 보여준다 (평점 아님)
    private var supplyBrandsCard: some View {
        AISectionCard(icon: "shippingbox.fill", title: "대표 공급 브랜드 · 시장 검증") {
            VStack(alignment: .leading, spacing: 10) {
                ForEach(Array((result.recommendations.supplyBrands ?? []).enumerated()), id: \.offset) { _, g in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(g.category)
                            .font(.system(size: 10.5, weight: .heavy))
                            .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.55))
                        ForEach(Array(g.brands.enumerated()), id: \.offset) { _, b in
                            HStack(alignment: .top, spacing: 4) {
                                if let url = b.url.flatMap(URL.init(string:)) {
                                    Link(b.name + " ↗", destination: url)
                                        .font(.system(size: 12.5, weight: .bold))
                                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
                                } else {
                                    Text(b.name)
                                        .font(.system(size: 12.5, weight: .bold))
                                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
                                }
                                Text("— " + b.note)
                                    .font(.system(size: 11.5, weight: .medium))
                                    .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.55))
                            }
                        }
                        HStack(spacing: 4) {
                            Text(g.basis)
                                .font(.system(size: 10.5, weight: .medium))
                                .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.5))
                            if let src = URL(string: g.sourceUrl) {
                                Link("출처 →", destination: src)
                                    .font(.system(size: 10.5, weight: .bold))
                                    .foregroundStyle(BUColor.accent)
                            }
                        }
                    }
                    .padding(.bottom, 4)
                }
            }
        }
    }

    private func regionalFirmRow(_ f: AIRoadmapResult.Recommendations.RegionalInteriorFirm) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 5) {
                if let url = f.mapUrl.flatMap(URL.init(string:)) {
                    Link(f.name + " ↗", destination: url)
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
                } else {
                    Text(f.name)
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
                }
                if f.industryMatch { tagChip("업종 특화", color: midnight) }
                if f.licensed { tagChip("등록 확인", color: BUColor.success) }
                if f.operating { tagChip("영업 확인", color: BUColor.accent) }
                if let d = f.distanceM {
                    Text(d < 1000 ? "\(Int(d))m" : String(format: "%.1fkm", d / 1000))
                        .font(.system(size: 10.5, weight: .bold))
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.5))
                }
            }
            Text([f.phone, f.address].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "))
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.55))
        }
        .padding(.bottom, 4)
    }
}

// MARK: - DivisionOfLaborSection

/// 분업 선언 — 웹 AIRoadmapWizard.tsx DivisionOfLabor 와 문구 1:1.
///  목록은 OwnerActionsRegistry(FoundOneCore, 결정론 SSOT 미러)에서. LLM 산출물 아님.
private struct DivisionOfLaborSection: View {
    let result: AIRoadmapResult

    private var taxLabel: String? {
        switch result.legal?.taxType {
        case "simplified": return "간이과세"
        case "standard": return "일반과세"
        case "corporation": return "법인"
        default: return nil
        }
    }

    private var ownerActions: [BUOwnerAction] {
        BUOwnerActions.build(
            track: BUOwnerActions.track(for: result.parsed.industryCategoryId),
            startupType: result.parsed.startupType,
            permits: (result.legal?.permitsDetailed ?? []).map {
                BUOwnerPermitInput(name: $0.name, kind: $0.kind, whereTo: $0.whereTo,
                                   cost: $0.cost, duration: $0.duration, required: $0.required)
            },
            recommendedBankLabel: BUOwnerActions.bankLabel(result.moneyInfra?.recommendedBank),
            taxTypeLabel: taxLabel
        )
    }

    private var aiDone: [String] {
        BUOwnerActions.aiDoneList(
            hasIndustryMatch: true,
            budgetAllocated: result.budgetAllocation.displayTotal > 0,
            permitCount: result.legal?.permitsDetailed?.count ?? 0,
            supplierCount: result.recommendations.suppliers.count
                + (result.recommendations.interiorVendors?.count ?? 0),
            channelCount: result.recommendations.operationalChannels?.count ?? 0,
            hasTaxType: result.legal?.taxType != nil,
            hasInsurance: !(result.insurance ?? []).isEmpty,
            hasMenuOrProducts: result.industrySpecific?.hasAny ?? false
        )
    }

    var body: some View {
        let actions = ownerActions
        if !actions.isEmpty {
            VStack(alignment: .leading, spacing: 0) {
                // 히어로 — 분업 선언 한 문장
                VStack(alignment: .leading, spacing: 7) {
                    Text("역할 분담")
                        .font(.system(size: 10, weight: .heavy))
                        .tracking(1.0)
                        .foregroundStyle(.white.opacity(0.55))
                    Text("복잡한 정리는 AI가 끝냈어요.\n사장님이 직접 하실 일은 \(actions.count)가지뿐이에요.")
                        .font(.system(size: 16.5, weight: .bold))
                        .foregroundStyle(.white)
                        .lineSpacing(3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(18)
                .background(LinearGradient(colors: [midnight, Color(red: 0.059, green: 0.059, blue: 0.29)],
                                           startPoint: .topLeading, endPoint: .bottomTrailing))

                // AI가 끝낸 것
                VStack(alignment: .leading, spacing: 7) {
                    Text("AI가 끝낸 것")
                        .font(.system(size: 10.5, weight: .heavy))
                        .tracking(0.7)
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.45))
                    ForEach(aiDone, id: \.self) { d in
                        HStack(alignment: .top, spacing: 7) {
                            Text("✓").font(.system(size: 12, weight: .bold)).foregroundStyle(midnight)
                            Text(d)
                                .font(.system(size: 12.5, weight: .medium))
                                .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.72))
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)
                .background(Color.white)

                Divider().overlay(midnight.opacity(0.08))

                // 사장님만 할 수 있는 일
                VStack(alignment: .leading, spacing: 12) {
                    Text("사장님만 할 수 있는 일")
                        .font(.system(size: 10.5, weight: .heavy))
                        .tracking(0.7)
                        .foregroundStyle(midnight)
                    ForEach(Array(actions.enumerated()), id: \.element.id) { i, a in
                        HStack(alignment: .top, spacing: 10) {
                            Text("\(i + 1)")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(midnight)
                                .frame(width: 20, height: 20)
                                .background(midnight.opacity(0.08), in: Circle())
                            VStack(alignment: .leading, spacing: 3) {
                                (Text(a.title).font(.system(size: 13.5, weight: .semibold))
                                    .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161))
                                 + Text([a.estimate, a.cost].compactMap { $0 }.isEmpty
                                        ? ""
                                        : "  \([a.estimate, a.cost].compactMap { $0 }.joined(separator: " · "))")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.45)))
                                    .lineSpacing(2)
                                (Text("준비됨: ").font(.system(size: 12, weight: .semibold)).foregroundStyle(midnight)
                                 + Text(a.aiPrepared).font(.system(size: 12, weight: .regular))
                                    .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.55)))
                                    .lineSpacing(2)
                            }
                        }
                    }
                    Text("각 항목은 로드맵의 해당 단계에서 자세히 안내돼요. 소요·비용은 관공서 고지 기준의 대략치입니다.")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.45))
                        .lineSpacing(2)
                        .padding(.top, 2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)
                .background(Color.white)
            }
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(midnight.opacity(0.14), lineWidth: 1))
        }
    }
}

// MARK: - AISectionCard

private struct AISectionCard<Content: View>: View {
    let icon: String
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .fill(midnight.opacity(0.08))
                        .frame(width: 32, height: 32)
                    Image(systemName: icon)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(midnight)
                }
                Text(title)
                    .font(.system(size: 12, weight: .heavy))
                    .tracking(0.7)
                    .foregroundStyle(Color(red: 0.059, green: 0.090, blue: 0.161).opacity(0.5))
                    .textCase(.uppercase)
            }
            content
        }
        .padding(18)
        .background(Color.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(midnight.opacity(0.08), lineWidth: 1))
    }
}

// MARK: - Helpers

@MainActor
private func backButton(action: @escaping () -> Void) -> some View {
    Button(action: action) {
        HStack(spacing: 4) {
            Image(systemName: "chevron.left")
                .font(.system(size: 11, weight: .semibold))
            Text("뒤로")
                .font(.system(size: 13, weight: .semibold))
        }
        .foregroundStyle(midnight)
    }
    .buttonStyle(.plain)
    .padding(.bottom, 16)
}

// MARK: - Preview

#if DEBUG
#Preview("AI 위저드 — 아이디어") {
    let service = AIRoadmapService(
        webAppURL: URL(string: "http://localhost:3000")!,
        supabaseClient: BUSupabase.shared.client
    )
    let vm = AIRoadmapViewModel(service: service)
    return ZStack {
        BUBackgroundSurface()
        IdeaStepView(vm: vm, onBack: {})
    }
}
#endif
