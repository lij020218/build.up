//
//  TargetCustomerStageView.swift — 타깃 고객 정의 단계 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared/TargetCustomerStage.tsx
//  stageId: "target-customer-definition"
//  cluster: offline (외식 path 기본 — 연령대·라이프스타일·가격 민감도)
//
//  3페이지 구조 (웹 탭 → iOS 세그먼트 컨트롤 + 스크롤):
//    pg 0 — Why:    왜 타깃 정의가 모든 후속 결정의 기준선인가
//    pg 1 — Define: 오프라인 페르소나 입력 (연령대 / 라이프스타일 / 가격 민감도)
//    pg 2 — Verify: 반례 검증 체크리스트
//
//  데이터: @AppStorage "stage.tc.*" (추후 DashboardStore.decisions 연동)
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

// MARK: - TargetCustomerStageView

public struct TargetCustomerStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("stage.tc.primaryAgeRange")  private var primaryAgeRange  = ""
    @AppStorage("stage.tc.lifestyleHint")    private var lifestyleHint    = ""
    @AppStorage("stage.tc.priceSensitivity") private var priceSensitivity = ""
    @AppStorage("stage.tc.whyTarget")        private var whyTarget        = ""

    private var filledCount: Int {
        [primaryAgeRange, lifestyleHint, priceSensitivity]
            .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
            .count
    }

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()

                ScrollView {
                    VStack(alignment: .leading, spacing: BUSpacing.cardGap) {
                        heroSection
                            .padding(.horizontal, BUSpacing.md)

                        pageNav
                            .padding(.horizontal, BUSpacing.md)

                        pageContent
                            .padding(.horizontal, BUSpacing.md)
                            .animation(.easeInOut(duration: 0.22), value: page)

                        wrapupSection
                            .padding(.horizontal, BUSpacing.md)

                        Spacer(minLength: BUSpacing.xxxl)
                    }
                    .padding(.top, BUSpacing.md)
                }
            }
            .navigationTitle("타깃 고객 정의")
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
}

// MARK: - Hero

private extension TargetCustomerStageView {

    var heroSection: some View {
        ZStack(alignment: .topLeading) {
            RoundedRectangle(cornerRadius: BURadius.heroOuter, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [BUColor.midnight, BUColor.midnightDeep],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: BURadius.heroOuter, style: .continuous)
                        .strokeBorder(.white.opacity(0.10), lineWidth: 1)
                )

            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                Text("KEY ACTION")
                    .font(BUFont.heroEyebrow)
                    .foregroundStyle(.white.opacity(0.60))
                    .tracking(1.5)
                    .textCase(.uppercase)

                Text("타깃이 없는 가게는\n평균값으로 회귀합니다")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(.white)
                    .tracking(-0.4)
                    .lineSpacing(3)

                Text("외식업 폐업 사유 1위(28%)는 '타깃 불명확 + 차별화 실패'. 페르소나를 정의한 사장님의 폐업률은 미정의 사장님의 절반.")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.72))
                    .lineSpacing(3)

                HStack(spacing: 8) {
                    HeroMiniCard(icon: "person.fill",        label: "한 명",     detail: "구체적 페르소나")
                    HeroMiniCard(icon: "mappin.circle.fill", label: "상황",      detail: "언제·어디서·왜")
                    HeroMiniCard(icon: "scope",              label: "결정 기준", detail: "모든 선택의 시금석")
                }
                .padding(.top, 4)
            }
            .padding(BUSpacing.heroOuterPadding)
        }
        .buShadow(.hero)
    }
}

// MARK: - Page nav

private extension TargetCustomerStageView {

    var pageNav: some View {
        Picker("", selection: $page) {
            Text("왜 중요한가").tag(0)
            Text("페르소나 정의").tag(1)
            Text("검증").tag(2)
        }
        .pickerStyle(.segmented)
    }

    @ViewBuilder
    var pageContent: some View {
        if page == 0 {
            whyPage
        } else if page == 1 {
            definePage
        } else {
            verifyPage
        }
    }
}

// MARK: - pg 0: Why

private extension TargetCustomerStageView {

    var whyPage: some View {
        VStack(spacing: BUSpacing.cardGap) {
            BUCard(.outer) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: BUSpacing.xs) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 13))
                            .foregroundStyle(BUColor.midnight)
                        Text("왜 이게 budget · location 전인가")
                            .buEyebrowStyle()
                    }

                    Text("타깃 페르소나가 없으면 모든 후속 결정 — 입지·메뉴·가격대·광고 채널 — 이 평균값(=경쟁점과 동일)으로 회귀합니다.")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BUColor.ink)
                        .lineSpacing(3)

                    Text("예: 20대 1인 직장인 타깃 → 도심·테이크아웃·1만원 객단가 → 평수 작아도 OK. 4인 가족이면 → 주차장·4인석·2-3만원 → 큰 평수 필수. 같은 외식업이라도 타깃이 모든 선택을 갈라놓습니다.")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                Text("한국 SMB 데이터")
                    .buEyebrowStyle()

                VStack(spacing: 8) {
                    DataPointRow(tag: "외식 폐업 사유", text: "1위 \"타깃 불명확 + 차별화 실패\" 28% — 한국외식산업연구원 2024")
                    DataPointRow(tag: "페르소나 효과", text: "정의한 사장님 폐업률 11% vs 미정의 22% — KOSME 2023")
                    DataPointRow(tag: "광고 ROAS",    text: "타깃 좁힌 캠페인 ROAS 3.2배 — 메타 광고 효율 보고서 2024")
                }
            }
            .padding(BUSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                BUColor.midnight.opacity(0.03),
                in: RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.innerBlock, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.07), lineWidth: 1)
            )
        }
    }
}

// MARK: - pg 1: Define

private extension TargetCustomerStageView {

    var definePage: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.opsGap) {
                HStack(spacing: BUSpacing.xs) {
                    Circle()
                        .fill(BUColor.midnight)
                        .frame(width: 24, height: 24)
                        .overlay(
                            Text("1")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(.white)
                        )
                    Text("타깃 페르소나 한 명을 명시")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                        .tracking(-0.3)
                }

                inputField(label: "1. 주 연령대 *") {
                    TextField(
                        "예: 28-38세 (월급쟁이 직장인 + 자녀 없는 부부)",
                        text: $primaryAgeRange,
                        axis: .vertical
                    )
                    .lineLimit(1...3)
                    .buTextFieldStyle()
                }

                inputField(label: "2. 라이프스타일 + 일상 동선 *") {
                    TextField(
                        "예: 평일 출근 점심 12-13시 (8분 도보권 내) / 주말 브런치 (SNS 업로드)",
                        text: $lifestyleHint,
                        axis: .vertical
                    )
                    .lineLimit(2...5)
                    .buTextFieldStyle()
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("3. 객단가 기대치 + 가격 민감도 *")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                        .tracking(0.3)

                    LazyVGrid(
                        columns: [GridItem(.flexible()), GridItem(.flexible())],
                        spacing: 8
                    ) {
                        PriceChip(label: "가성비 (₩5-10k)",    value: "value-budget", selected: $priceSensitivity)
                        PriceChip(label: "중간 (₩10-20k)",     value: "mid-quality",  selected: $priceSensitivity)
                        PriceChip(label: "프리미엄 (₩20-40k)", value: "premium",      selected: $priceSensitivity)
                        PriceChip(label: "럭셔리 (₩40k↑)",    value: "luxury",       selected: $priceSensitivity)
                    }
                }

                inputField(label: "4. 왜 이 타깃인가 (선택)", isOptional: true) {
                    TextField(
                        "예: 상권 분석에서 28-38세 직장인 비중 42% / 경쟁점은 모두 가족 타깃",
                        text: $whyTarget,
                        axis: .vertical
                    )
                    .lineLimit(2...4)
                    .buTextFieldStyle()
                }

                HStack(spacing: BUSpacing.xs) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(BUColor.midnight.opacity(0.55))
                    Text("필수 3개 중 \(filledCount) 완료")
                        .font(BUFont.bodyCaption)
                        .foregroundStyle(BUColor.inkSecondary)
                }
                .padding(.horizontal, BUSpacing.sm)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    BUColor.midnight.opacity(0.04),
                    in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                )
            }
        }
    }

    @ViewBuilder
    func inputField<Content: View>(
        label: String,
        isOptional: Bool = false,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(isOptional ? BUColor.inkMuted : BUColor.midnight)
                .tracking(0.3)
            content()
        }
    }
}

// MARK: - pg 2: Verify

private extension TargetCustomerStageView {

    var verifyPage: some View {
        BUCard(.outer) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack(spacing: BUSpacing.xs) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 13))
                        .foregroundStyle(BUColor.midnight)
                    Text("반례로 검증하세요")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(BUColor.ink)
                }

                Text("좋은 페르소나는 '누구를 안 받을 것인가' 가 명확합니다. 아래 4개 질문에 모두 답할 수 있어야 페르소나가 의사결정 기준선이 됩니다.")
                    .font(BUFont.bodySmall)
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)

                VStack(spacing: 8) {
                    VerifyCard(
                        number: 1,
                        question: "이 페르소나가 절대 안 살 가격대는?",
                        hint: "범위 명시 (예: 20대 직장인 → 3만원↑ X)"
                    )
                    VerifyCard(
                        number: 2,
                        question: "이 페르소나가 절대 안 갈 위치는?",
                        hint: "구체 (예: 차량 접근만 가능한 외곽)"
                    )
                    VerifyCard(
                        number: 3,
                        question: "이 페르소나가 정말 매주 1회+ 올까?",
                        hint: "오면 안 되는 이유 1개라도 떠오르면 재정의"
                    )
                    VerifyCard(
                        number: 4,
                        question: "경쟁점 중 같은 타깃 가게는?",
                        hint: "이름·차별점 — 안 보이면 시장 없음 신호"
                    )
                }
            }
        }
    }
}

// MARK: - Wrapup

private extension TargetCustomerStageView {

    var wrapupSection: some View {
        VStack(alignment: .leading, spacing: BUSpacing.sm) {
            Text("완료 체크리스트")
                .buEyebrowStyle()

            BUCard(.outer) {
                VStack(alignment: .leading, spacing: 10) {
                    wrapupRow("1. 주 연령대·산업 명시",    detail: "한 명에게 팔린다는 의지로 좁혔는지 확인")
                    wrapupRow("2. 라이프스타일·일상 동선", detail: "언제·어디서·왜 쓰는지 구체화")
                    wrapupRow("3. 객단가·예산 한도",       detail: "안 살 가격대까지 명확")
                    wrapupRow("4. 반례 검증",             detail: "이 페르소나가 절대 안 할 행동 4개")
                }
            }

            Text("다음: 예산·시점 설정")
                .font(BUFont.bodyCaption)
                .foregroundStyle(BUColor.inkMuted)
                .padding(.top, 4)
        }
    }

    @ViewBuilder
    func wrapupRow(_ label: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: BUSpacing.xs) {
            Image(systemName: filledCount >= 3 ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 14))
                .foregroundStyle(filledCount >= 3 ? BUColor.success : BUColor.inkMuted)
                .frame(width: 18)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(BUFont.labelSmall)
                    .foregroundStyle(BUColor.ink)
                Text(detail)
                    .font(BUFont.bodyCaption)
                    .foregroundStyle(BUColor.inkMuted)
            }
        }
    }
}

// MARK: - Sub-components

private struct HeroMiniCard: View {
    let icon: String
    let label: String
    let detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(.white.opacity(0.85))
            Text(label)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.white)
                .tracking(0.5)
                .textCase(.uppercase)
            Text(detail)
                .font(.system(size: 10.5))
                .foregroundStyle(.white.opacity(0.65))
                .lineSpacing(1.5)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10)
        .padding(.vertical, 10)
        .background(
            .white.opacity(0.10),
            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
        )
    }
}

private struct DataPointRow: View {
    let tag: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Text(tag)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(
                    BUColor.midnight.opacity(0.10),
                    in: RoundedRectangle(cornerRadius: 4, style: .continuous)
                )
                .fixedSize(horizontal: true, vertical: false)
            Text(text)
                .font(.system(size: 12))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(2)
        }
    }
}

private struct PriceChip: View {
    let label: String
    let value: String
    @Binding var selected: String

    var body: some View {
        Button { selected = value } label: {
            Text(label)
                .font(.system(size: 12, weight: selected == value ? .bold : .medium))
                .foregroundStyle(selected == value ? BUColor.midnight : BUColor.inkSecondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .padding(.horizontal, 8)
                .background(
                    selected == value ? BUColor.midnight.opacity(0.08) : BUColor.surfaceElevated,
                    in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                        .strokeBorder(
                            selected == value ? BUColor.midnight : BUColor.cardBorder,
                            lineWidth: selected == value ? 1.5 : 1
                        )
                )
        }
        .buttonStyle(.plain)
    }
}

private struct VerifyCard: View {
    let number: Int
    let question: String
    let hint: String

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text("\(number). \(question)")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(BUColor.ink)
            Text(hint)
                .font(.system(size: 11.5))
                .foregroundStyle(BUColor.inkMuted)
                .lineSpacing(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, BUSpacing.sm)
        .padding(.vertical, BUSpacing.sm)
        .background(
            BUColor.midnight.opacity(0.03),
            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.08), lineWidth: 1)
        )
    }
}

// MARK: - View helpers (file-private)

private extension View {
    func buTextFieldStyle() -> some View {
        self
            .font(BUFont.bodySmall)
            .foregroundStyle(BUColor.ink)
            .padding(.horizontal, BUSpacing.sm)
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                BUColor.surfaceElevated,
                in: RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: BURadius.input, style: .continuous)
                    .strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1)
            )
    }
}

// MARK: - Preview

#if DEBUG
#Preview("TargetCustomerStageView — Why") {
    TargetCustomerStageView()
}
#endif
