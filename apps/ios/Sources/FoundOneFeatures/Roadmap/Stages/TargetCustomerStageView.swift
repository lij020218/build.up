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
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

// MARK: - TargetCustomerStageView

public struct TargetCustomerStageView: View {

    @Environment(RoadmapStore.self) private var roadmapStore
    @Environment(\.dismiss) private var dismiss
    @State private var page = 0
    private let stageId = "target-customer-definition"

    @AppStorage("stage.tc.primaryAgeRange")  private var primaryAgeRange  = ""
    @AppStorage("stage.tc.lifestyleHint")    private var lifestyleHint    = ""
    @AppStorage("stage.tc.priceSensitivity") private var priceSensitivity = ""
    @AppStorage("stage.tc.whyTarget")        private var whyTarget        = ""
    @AppStorage("roadmap.selectedIndustryId") private var industryId      = ""

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

    private var helperText: String {
        switch cluster.category {
        case .food, .cafeDessert:
            return "외식 폐업 사유 1위 (28%) 는 '타깃 불명확'. 한 명의 구체적 페르소나가 모든 후속 결정의 기준선입니다."
        case .onlineDigital:
            return "온라인 폐업 사유 1위는 'CAC > LTV'. 정확한 페르소나가 광고 ROAS·전환·리텐션 모두를 결정합니다."
        case .startupTech:
            return "스타트업 실패 42% = '시장이 원하지 않는 제품'. ICP(Ideal Customer Profile) 한 명 명시가 PMF 의 출발점."
        default:
            return "타깃 한 명의 구체적 페르소나 — 입지·서비스·가격·마케팅 모든 후속 결정의 기준선."
        }
    }

    /// onAdvance/onEditSave 공유 입력 — whyTarget 도 포함 (이전엔 누락).
    private var currentInputs: [String: String] {
        [
            "ageRange": primaryAgeRange,
            "lifestyle": lifestyleHint,
            "priceSensitivity": priceSensitivity,
            "whyTarget": whyTarget,
        ]
    }

    // MARK: - Cluster-aware Define labels/placeholders/chips
    //   웹 SSOT (TargetCustomerStage.tsx:218-305) 와 동일하게 tech/online/offline 별로 분기.

    private enum ClusterGroup { case offline, online, tech }
    private var clusterGroup: ClusterGroup {
        switch cluster.category {
        case .startupTech:   return .tech
        case .onlineDigital: return .online
        default:             return .offline
        }
    }

    private var ageRangeLabel: String {
        switch clusterGroup {
        case .tech:    return "1. 타깃 산업·기업 규모 *"
        case .online:  return "1. 주 사용자 (연령 + 유입 채널) *"
        case .offline: return "1. 주 연령대 *"
        }
    }
    private var ageRangePlaceholder: String {
        switch clusterGroup {
        case .tech:    return "예: 50-200인 B2B SaaS / 핀테크 스타트업 (시리즈 A-B)"
        case .online:  return "예: 25-35세 여성 + 인스타·유튜브 유입 + 모바일 80%"
        case .offline: return "예: 28-38세 (월급쟁이 직장인 + 자녀 없는 부부)"
        }
    }

    private var lifestyleLabel: String {
        switch clusterGroup {
        case .tech:    return "2. 핵심 사용자 역할 + 일상 워크플로 *"
        case .online:  return "2. 구매 동선 + 사용 맥락 *"
        case .offline: return "2. 라이프스타일 + 일상 동선 *"
        }
    }
    private var lifestylePlaceholder: String {
        switch clusterGroup {
        case .tech:    return "예: 운영팀 PM — Slack/Notion 풀데이 사용, 매주 화요일 회고에서 우리 도구 데이터 확인"
        case .online:  return "예: 인스타 광고 → 상세페이지 → 장바구니 7일 → 가족 추천 후 결제. 모바일 80%, 야간 21-23시 피크."
        case .offline: return "예: 평일 출근 점심 12-13시 (8분 도보권 내) / 주말 브런치 (SNS 업로드)"
        }
    }

    private var priceLabel: String {
        switch clusterGroup {
        case .tech:    return "3. 도입 결정 권한 + 예산 규모 *"
        case .online:  return "3. 객단가 + 결제 의사 *"
        case .offline: return "3. 객단가 기대치 + 가격 민감도 *"
        }
    }
    private var priceChips: [(label: String, value: String)] {
        switch clusterGroup {
        case .tech: return [
            ("Self-serve (≤$50/mo)", "self-serve-low"),
            ("팀 도입 ($50-500)",    "team-mid"),
            ("연 계약 ($5K-50K)",    "annual-contract"),
            ("엔터프라이즈 (PO)",     "enterprise"),
        ]
        case .online: return [
            ("저가 (₩5-15k)",     "value-budget"),
            ("중가 (₩15-40k)",    "mid-quality"),
            ("프리미엄 (₩40-100k)", "premium"),
            ("럭셔리 (₩100k↑)",   "luxury"),
        ]
        case .offline: return [
            ("가성비 (₩5-10k)",    "value-budget"),
            ("중간 (₩10-20k)",     "mid-quality"),
            ("프리미엄 (₩20-40k)", "premium"),
            ("럭셔리 (₩40k↑)",    "luxury"),
        ]
        }
    }

    private var whyTargetPlaceholder: String {
        switch clusterGroup {
        case .tech:    return "예: 50-200인 SaaS 팀이 우리 ICP. PMF 인터뷰 12건 중 9건이 같은 페인."
        case .online:  return "예: 인스타 광고 ROAS 280% 채널이 이 페르소나. 첫 100 주문 60%가 동일 세그먼트."
        case .offline: return "예: 상권 분석에서 28-38세 직장인 비중 42% / 경쟁점은 모두 가족 타깃"
        }
    }

    private var filledCount: Int {
        [primaryAgeRange, lifestyleHint, priceSensitivity]
            .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
            .count
    }

    /// 게이트: 페르소나 3 항목 모두 입력.
    private var canContinue: Bool { filledCount == 3 }

    private var advanceHint: String {
        switch filledCount {
        case 0: return "페르소나 3항목을 정의하세요"
        case 1, 2: return "\(filledCount)/3 입력됨 — 모두 입력 후 진행"
        default: return "페르소나 정의 완료 — 다음 단계로"
        }
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "타깃 고객 정의",
            stageEyebrow: "단계 4 · 타깃 고객",
            helperText: helperText,
            canAdvance: canContinue,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: currentInputs)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: stageId, inputs: currentInputs)
            },
            wrapup: BUStageWrapupData(
                doneItems: [
                    .init(label: "1. 주 연령대·산업 명시", detail: "한 명에게 팔린다는 의지로 좁혔는지 확인"),
                    .init(label: "2. 라이프스타일·일상 동선", detail: "언제·어디서·왜 쓰는지 구체화"),
                    .init(label: "3. 객단가·예산 한도", detail: "안 살 가격대까지 명확"),
                    .init(label: "4. 반례 검증", detail: "이 페르소나가 절대 안 할 행동 4개"),
                ],
                verifyItems: [
                    "'20-50대 여성' 같은 모호한 정의 X — 한 명의 구체 페르소나로 좁혔는가",
                    "이 페르소나가 절대 안 갈 위치·안 살 가격대 명시했는가",
                    "경쟁점 중 같은 페르소나 타깃 가게 1곳 이상 있는가 (없으면 시장 위험)",
                    "후속 결정 (입지·메뉴·가격·광고) 의 기준선이 될 수 있을 만큼 구체적인가",
                    "주변 지인 의견이 아닌 실제 잠재 고객 5명+ 대화로 검증했는가",
                ],
                nextStageLabel: "예산·시점 설정",
                nextSummary: "타깃 페르소나 확정 → 예산·시점 설정 단계로 진입"
            ),
            currentPage: page,
            totalPages: 3
        ) {
            VStack(alignment: .leading, spacing: 16) {
                pageNav
                pageContent
                    .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }
}

// MARK: - Page nav

private extension TargetCustomerStageView {

    var pageNav: some View {
        BUWizardPageNav(
            page: page,
            totalPages: 3,
            labels: ["왜 중요한가", "페르소나 정의", "검증"],
            onChange: { newPage in
                withAnimation(.easeInOut(duration: 0.22)) { page = newPage }
            }
        )
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
        VStack(alignment: .leading, spacing: BUSpacing.cardGap) {
            // 메인 메시지 카드
            BUCard(.outer) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(BUColor.midnight)
                        Text("왜 이게 BUDGET · LOCATION 전인가")
                            .font(.system(size: 11, weight: .heavy))
                            .tracking(0.6)
                            .textCase(.uppercase)
                            .foregroundStyle(BUColor.midnight)
                    }

                    Text("타깃 페르소나가 없으면 모든 후속 결정 — 입지·메뉴·가격대·광고 채널 — 이 평균값(=경쟁점과 동일)으로 회귀합니다.")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, 2)

                    Text("예: 20대 1인 직장인 타깃 → 도심·테이크아웃·1만원 객단가 → 평수 작아도 OK. 4인 가족이면 → 주차장·4인석·2-3만원 → 큰 평수 필수. 같은 외식업이라도 타깃이 모든 선택을 갈라놓습니다.")
                        .font(.system(size: 13))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            // 한국 SMB 데이터 박스
            VStack(alignment: .leading, spacing: 10) {
                Text("한국 SMB 데이터")
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(0.6)
                    .textCase(.uppercase)
                    .foregroundStyle(BUColor.inkMuted.opacity(0.55))

                VStack(alignment: .leading, spacing: 9) {
                    DataPointRow(tag: "외식 폐업 사유", text: "1위 \"타깃 불명확 + 차별화 실패\" 28% — 한국외식산업연구원 2024")
                    DataPointRow(tag: "페르소나 효과", text: "정의한 사장님 폐업률 11% vs 미정의 22% — KOSME 2023")
                    DataPointRow(tag: "광고 ROAS",    text: "타깃 좁힌 캠페인 ROAS 3.2배 — 메타 광고 효율 보고서 2024")
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                Color(red: 0.95, green: 0.96, blue: 0.98),
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(BUColor.inkMuted.opacity(0.10), lineWidth: 1)
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

                inputField(label: ageRangeLabel) {
                    TextField(ageRangePlaceholder, text: $primaryAgeRange, axis: .vertical)
                        .lineLimit(1...3)
                        .buTextFieldStyle()
                }

                inputField(label: lifestyleLabel) {
                    TextField(lifestylePlaceholder, text: $lifestyleHint, axis: .vertical)
                        .lineLimit(2...5)
                        .buTextFieldStyle()
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text(priceLabel)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(BUColor.midnight)
                        .tracking(0.3)

                    LazyVGrid(
                        columns: [GridItem(.flexible()), GridItem(.flexible())],
                        spacing: 8
                    ) {
                        ForEach(priceChips, id: \.value) { chip in
                            PriceChip(label: chip.label, value: chip.value, selected: $priceSensitivity)
                        }
                    }
                }

                inputField(label: "4. 왜 이 타깃인가 (선택)", isOptional: true) {
                    TextField(whyTargetPlaceholder, text: $whyTarget, axis: .vertical)
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
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            // ⚠️ 2026-05-20 alignment fix:
            //   기존엔 HStack(alignment:.top) + tag.padding(.vertical, 2) 조합으로
            //   tag 의 텍스트 baseline 이 body 텍스트 첫 줄보다 2pt 아래에 와서
            //   "들쑥날쑥" 보임. 웹 SSOT 의 marginTop:1px 미러 + firstTextBaseline 으로 정렬.
            Text(tag)
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.2)
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(
                    BUColor.midnight.opacity(0.10),
                    in: RoundedRectangle(cornerRadius: 4, style: .continuous)
                )
                .fixedSize(horizontal: true, vertical: false)
                .alignmentGuide(.firstTextBaseline) { d in d[.bottom] - 3 } // 텍스트 baseline 보정

            Text(text)
                .font(.system(size: 12))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
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
    let store = RoadmapStore()
    store.pathProvider = { _ in ["target-customer-definition"] }
    return TargetCustomerStageView().environment(store)
}
#endif
