//
//  StartupTypeStageView.swift — 창업 형태 선택 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/selection/StartupTypeSelectionStage.tsx
//  stageId: "startup-type"
//
//  선택지 (외식 path):
//    독립창업 — 본인이 직접 브랜드·메뉴를 구성
//    프랜차이즈 — 검증된 브랜드로 빠르게 시작
//    미정 — 아직 결정하지 않음
//
//  모바일 단순화:
//    프랜차이즈 브랜드 picker 는 별도 하위 화면으로 분리 (P2)
//    현재는 선택 저장 + 검증 안내 카드만 표시
//
//  데이터: @AppStorage "stage.startupType.selected" (String)
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

// MARK: - StartupTypeStageView

public struct StartupTypeStageView: View {

    @Environment(\.dismiss) private var dismiss
    @AppStorage("stage.startupType.selected") private var selected = ""

    private let options: [StartupTypeOption] = [
        StartupTypeOption(
            id: "independent",
            icon: "star.fill",
            color: Color(red: 0.15, green: 0.39, blue: 0.92),
            titleKo: "독립창업",
            subtitleKo: "본인이 직접 브랜드와 메뉴를 구성합니다"
        ),
        StartupTypeOption(
            id: "franchise",
            icon: "building.2.fill",
            color: Color(red: 0.49, green: 0.23, blue: 0.93),
            titleKo: "프랜차이즈",
            subtitleKo: "검증된 브랜드로 빠르게 시작합니다"
        ),
        StartupTypeOption(
            id: "undecided",
            icon: "questionmark.circle.fill",
            color: Color(red: 0.42, green: 0.45, blue: 0.50),
            titleKo: "미정",
            subtitleKo: "아직 결정하지 않았습니다"
        ),
    ]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()

                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.lg) {

                        heroBanner
                            .padding(.horizontal, BUSpacing.md)

                        // 선택 카드 그리드
                        VStack(alignment: .leading, spacing: BUSpacing.sm) {
                            BUEyebrow("창업 형태를 선택하세요")
                                .padding(.horizontal, BUSpacing.md)

                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: BUSpacing.sm) {
                                ForEach(options) { opt in
                                    TypeCard(option: opt, isSelected: selected == opt.id) {
                                        selected = opt.id
                                    }
                                }
                                .padding(.horizontal, BUSpacing.md)
                            }
                            .padding(.horizontal, BUSpacing.md)
                        }

                        // 선택에 따른 안내
                        if !selected.isEmpty {
                            selectionGuide
                                .padding(.horizontal, BUSpacing.md)
                        }

                        wrapupSection
                            .padding(.horizontal, BUSpacing.md)

                        Spacer(minLength: BUSpacing.xxxl)
                    }
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle("창업 형태 선택")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }
                        .foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) {
                    Button("닫기") { dismiss() }
                }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Hero

    private var heroBanner: some View {
        BUCard(.hero) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("단계 2 · 창업 형태")
                Text("어떤 방식으로\n시작하실 건가요?")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(BUColor.midnightDeep)
                    .tracking(-0.3)
                    .lineSpacing(4)
                Text("형태 선택에 따라 이후 로드맵 단계(인테리어·메뉴·계약서 검토 등)가 달라집니다.")
                    .font(BUFont.bodySmall)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
            }
        }
    }

    // MARK: - Selection guide

    @ViewBuilder
    private var selectionGuide: some View {
        switch selected {
        case "independent":
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "lightbulb.fill")
                            .foregroundStyle(BUColor.midnight)
                        Text("독립창업 핵심 포인트")
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.ink)
                    }
                    VStack(alignment: .leading, spacing: 6) {
                        GuideRow(text: "브랜드·메뉴·인테리어 모두 본인 부담 — 6~12개월 안정화 자본 별도 확보")
                        GuideRow(text: "검증 레퍼런스 1개 이상 확보 후 진입 권장 (타 매장 분석·메뉴 시연)")
                        GuideRow(text: "자유도 최대 — 메뉴·가격·운영 시간 본인이 결정")
                    }
                }
            }
        case "franchise":
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(Color.orange)
                        Text("프랜차이즈 반드시 확인")
                            .font(BUFont.bodySmall.weight(.semibold))
                            .foregroundStyle(BUColor.ink)
                    }
                    VStack(alignment: .leading, spacing: 6) {
                        GuideRow(text: "공정위 정보공개서(franchise.ftc.go.kr) — 가맹사업자 신고 여부·폐점률 직접 확인")
                        GuideRow(text: "가맹비·인테리어비·로열티 항목별 별도 견적 (계약서 1식 표기 시 주의)")
                        GuideRow(text: "폐점률 20% 이상 브랜드 · 점주 평균 운영기간 5년 미만이면 위험 신호")
                    }
                }
            }
        case "undecided":
            BUCard(.card) {
                HStack(spacing: BUSpacing.sm) {
                    Image(systemName: "clock")
                        .foregroundStyle(BUColor.inkMuted)
                    Text("이후 단계에서 언제든지 변경할 수 있습니다. 일단 로드맵을 진행하면서 결정해도 됩니다.")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }
        default:
            EmptyView()
        }
    }

    // MARK: - Wrapup

    private var wrapupSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("완료 체크리스트")
                CheckRow(label: "창업 형태 선택 완료", done: !selected.isEmpty)
                if selected == "franchise" {
                    CheckRow(label: "프랜차이즈 — 공정위 정보공개서 확인 예정", done: false)
                }
                if selected == "independent" {
                    CheckRow(label: "독립창업 — 레퍼런스 조사 계획 수립", done: false)
                }
            }
        }
    }
}

// MARK: - Sub-views

private struct StartupTypeOption: Identifiable {
    let id: String
    let icon: String
    let color: Color
    let titleKo: String
    let subtitleKo: String
}

private struct TypeCard: View {
    let option: StartupTypeOption
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(isSelected ? option.color.opacity(0.12) : BUColor.midnight.opacity(0.04))
                        .frame(width: 48, height: 48)
                    Image(systemName: option.icon)
                        .font(.system(size: 20))
                        .foregroundStyle(isSelected ? option.color : BUColor.inkMuted)
                }

                Text(option.titleKo)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(isSelected ? option.color : BUColor.ink)

                Text(option.subtitleKo)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(2)
                    .multilineTextAlignment(.leading)
            }
            .padding(BUSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                isSelected
                    ? option.color.opacity(0.06)
                    : BUColor.surfaceElevated,
                in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                    .strokeBorder(
                        isSelected ? option.color.opacity(0.4) : Color.clear,
                        lineWidth: 1.5
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

private struct GuideRow: View {
    let text: String
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Text("•")
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.midnight)
            Text(text)
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
        }
    }
}

private struct CheckRow: View {
    let label: String
    let done: Bool
    var body: some View {
        HStack(spacing: BUSpacing.sm) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 16))
                .foregroundStyle(done ? BUColor.success : BUColor.inkSubtle)
            Text(label)
                .font(BUFont.bodySmall)
                .foregroundStyle(done ? BUColor.ink : BUColor.inkMuted)
            Spacer()
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview("StartupType") {
    StartupTypeStageView()
}
#endif
