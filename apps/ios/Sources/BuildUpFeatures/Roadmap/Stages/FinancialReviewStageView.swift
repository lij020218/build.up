//
//  FinancialReviewStageView.swift — 월 운영비 재무 검토 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/shared-tail/FinancialReviewStage.tsx
//  stageId: "financial-review"
//
//  음식점 업종 벤치마크 (한국외식산업연구원 2026):
//    원재료: 35~45% | 인건비: 20~28% | 임대료: 8~12% | 공과금: 4~6%
//    운영수수료: 3~5% | 마케팅: 2~4% | Prime Cost (재료+인건비): 55~65% 기준
//    영업이익률: 10~18%
//
//  3-tab 구조:
//    고정비 (임대료·인건비·공과금·이자)
//    변동비 (식자재·운영수수료)
//    기타 (마케팅·기타)
//    → 하단 시뮬레이션 결과 카드
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct FinancialReviewStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "financial-review"

    @State private var tab = 0 // 0=고정비, 1=변동비, 2=기타

    // 고정비 (만원)
    @AppStorage("fin.rent")       private var rent      = 0
    @AppStorage("fin.labor")      private var labor     = 0
    @AppStorage("fin.utilities")  private var utilities = 0
    @AppStorage("fin.interest")   private var interest  = 0

    // 변동비
    @AppStorage("fin.ingredients") private var ingredients = 0
    @AppStorage("fin.sga")         private var sga         = 0

    // 기타
    @AppStorage("fin.marketing")  private var marketing = 0
    @AppStorage("fin.other")      private var other     = 0

    // 상태
    @AppStorage("fin.done")       private var reviewDone = false

    @State private var rentText      = ""
    @State private var laborText     = ""
    @State private var utilText      = ""
    @State private var intText       = ""
    @State private var ingrText      = ""
    @State private var sgaText       = ""
    @State private var mktText       = ""
    @State private var otherText     = ""

    private var totalFixed: Int    { rent + labor + utilities + interest }
    private var totalVariable: Int { ingredients + sga }
    private var totalOther: Int    { marketing + other }
    private var totalCost: Int     { totalFixed + totalVariable + totalOther }

    private var primeCostPct: Double {
        guard totalCost > 0 else { return 0 }
        return Double(ingredients + labor) / Double(totalCost) * 100
    }
    private var rentPct: Double {
        guard totalCost > 0 else { return 0 }
        return Double(rent) / Double(totalCost) * 100
    }
    private var primeCostStatus: Color {
        if primeCostPct > 65 { return .red }
        if primeCostPct > 55 { return .orange }
        return BUColor.success
    }

    private let tabs = ["고정비", "변동비", "기타"]

    public init() {}

    /// 게이트: 최소 고정비(임대료·인건비)는 입력되어야 다음 단계로.
    private var canCompleteStage: Bool {
        rent > 0 && labor > 0
    }

    private var advanceHint: String {
        if rent <= 0 && labor <= 0 { return "임대료·인건비를 입력하세요" }
        if rent <= 0 { return "임대료를 입력하세요" }
        if labor <= 0 { return "인건비를 입력하세요" }
        return "월 운영비 계산 완료 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "월 운영비",
            stageEyebrow: "단계 20 · 월 운영비 검토",
            helperText: "매달 무조건 나가는 고정비 + 매출 연동 변동비 + 기타. 음식점 Prime Cost(재료+인건비) 목표 55~65%.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: [
                    "totalFixed": "\(totalFixed)",
                    "totalVariable": "\(totalVariable)",
                    "totalCost": "\(totalCost)",
                ])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: stageId, inputs: [
                    "totalFixed": "\(totalFixed)",
                    "totalVariable": "\(totalVariable)",
                    "totalCost": "\(totalCost)",
                ])
            },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 고정비 점검", detail: "임대료·인건비·공과금 3축 — 매출 대비 비율로 업종 평균 비교"),
                .init(label: "2. 변동비 점검", detail: "재료비·일반관리비 2축 — 매출 30% 이내 유지 룰 점검"),
                .init(label: "3. 기타비 점검", detail: "마케팅·이자·기타 3축 — 광고 ROAS·대출 이자 한계점 검토"),
                .init(label: "4. 손익분기·런웨이", detail: "월별 BEP 시뮬 + 보유 자본 잔여 개월 자동 계산"),
                ],
                verifyItems: [
                "고정비 합계 — 매출 70% 미만 유지, 초과 시 변동비 압박으로 흑자 도달 어려움",
                "재료비 — 매출 30% 한계, 35% 초과 시 메뉴·공급처 즉시 재검토 (1순위 적자 원인)",
                "인건비 — 25% 한계, 5인 이상 사업장은 연장수당·연차수당 별도 누적, 누락 시 차액·가산금",
                "운영자본 6개월 — 매출 0원 가정해도 견딜 자본 별도 유지 (흑자부도 1순위 원인)",
                "이자 부담 — 정책자금·일반대출 이자 합산 매출 5% 이내, 초과 시 신규 대출 자제",
                "마케팅 ROAS — 200% 미만이면 즉시 중단·재구성, 「쓸수록 손해」 패턴 인식",
                ],
                nextStageLabel: "개업·론칭",
                nextSummary: "고정·변동·기타 비용 시뮬 + BEP 확인 → 개업·론칭 단계로 진입"
            ),
            currentPage: tab,
            totalPages: tabs.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                BUWizardPageNav(
                    page: tab,
                    totalPages: tabs.count,
                    labels: tabs,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { tab = newPage } }
                )

                Group {
                    switch tab {
                    case 0: fixedTab
                    case 1: variableTab
                    default: otherTab
                    }
                }

                // 항상 표시되는 시뮬레이션 결과
                simulationCard
            }
        }
        .onAppear {
            rentText = rent > 0 ? "\(rent)" : ""
            laborText = labor > 0 ? "\(labor)" : ""
            utilText = utilities > 0 ? "\(utilities)" : ""
            intText = interest > 0 ? "\(interest)" : ""
            ingrText = ingredients > 0 ? "\(ingredients)" : ""
            sgaText = sga > 0 ? "\(sga)" : ""
            mktText = marketing > 0 ? "\(marketing)" : ""
            otherText = other > 0 ? "\(other)" : ""
        }
    }

    // MARK: - 고정비 탭

    private var fixedTab: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("고정비 입력 (만원/월)")
                    finRow(label: "임대료", hint: "월세 + 관리비", text: $rentText) { rent = Int($0) ?? 0 }
                    finRow(label: "인건비", hint: "월급 + 4대보험 사업주 부담", text: $laborText) { labor = Int($0) ?? 0 }
                    finRow(label: "공과금", hint: "전기·가스·수도·통신", text: $utilText) { utilities = Int($0) ?? 0 }
                    finRow(label: "대출 이자", hint: "월 이자 상환 (없으면 0)", text: $intText) { interest = Int($0) ?? 0 }
                    Divider()
                    HStack {
                        Text("고정비 합계").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                        Spacer()
                        Text("\(totalFixed)만원").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight).monospacedDigit()
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.xs) {
                    BUEyebrow("음식점 고정비 벤치마크")
                    benchRow(label: "임대료", range: "월 매출의 8~12%", good: rentPct <= 12)
                    benchRow(label: "인건비", range: "월 매출의 20~28%", good: true)
                }
            }
        }
    }

    // MARK: - 변동비 탭

    private var variableTab: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("변동비 입력 (만원/월)")
                    finRow(label: "식자재 원가", hint: "월 재료비 총액", text: $ingrText) { ingredients = Int($0) ?? 0 }
                    finRow(label: "운영 수수료", hint: "배달앱·POS·카드 수수료", text: $sgaText) { sga = Int($0) ?? 0 }
                    Divider()
                    HStack {
                        Text("변동비 합계").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                        Spacer()
                        Text("\(totalVariable)만원").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight).monospacedDigit()
                    }
                }
            }
        }
    }

    // MARK: - 기타 탭

    private var otherTab: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("기타 비용 입력 (만원/월)")
                    finRow(label: "마케팅·광고", hint: "배달앱 광고·SNS 광고비", text: $mktText) { marketing = Int($0) ?? 0 }
                    finRow(label: "기타", hint: "소모품·수리·예비비 등", text: $otherText) { other = Int($0) ?? 0 }
                    Divider()
                    HStack {
                        Text("기타 합계").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                        Spacer()
                        Text("\(totalOther)만원").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight).monospacedDigit()
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $reviewDone) {
                    Text("월 운영비 검토 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }

    // MARK: - 시뮬레이션 결과 (항상 표시)

    private var simulationCard: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("월 운영비 시뮬레이션")

                HStack {
                    simCell(label: "고정비", value: totalFixed)
                    Spacer()
                    simCell(label: "변동비", value: totalVariable)
                    Spacer()
                    simCell(label: "기타", value: totalOther)
                    Spacer()
                    simCell(label: "총 비용", value: totalCost, highlight: true)
                }

                if totalCost > 0 {
                    Divider()
                    HStack(spacing: BUSpacing.sm) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Prime Cost").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                            Text("\(Int(primeCostPct))%")
                                .font(BUFont.cardTitleSmall).foregroundStyle(primeCostStatus).monospacedDigit()
                            Text("재료+인건비 / 총비용").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                        }
                        Spacer()
                        VStack(alignment: .leading, spacing: 2) {
                            Text("목표").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                            Text("55~65%").font(BUFont.cardTitleSmall).foregroundStyle(BUColor.ink)
                            Text("음식점 업종 평균").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                        }
                    }

                    if primeCostPct > 65 {
                        HStack(spacing: 6) {
                            Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.red).font(.system(size: 12))
                            Text("Prime Cost \(Int(primeCostPct))% — 위험 수준. 식자재 원가 또는 인건비 재조정 필요.")
                                .font(BUFont.eyebrow).foregroundStyle(.red)
                        }
                    } else if primeCostPct > 55 {
                        HStack(spacing: 6) {
                            Image(systemName: "exclamationmark.circle.fill").foregroundStyle(.orange).font(.system(size: 12))
                            Text("Prime Cost 관리 주의 — 매출 증가 또는 원가 절감 필요.")
                                .font(BUFont.eyebrow).foregroundStyle(.orange)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    private func finRow(label: String, hint: String, text: Binding<String>, onChange: @escaping (String) -> Void) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                Text(hint).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
                Spacer()
                TextField("0", text: text)
                    .font(BUFont.body)
                    #if os(iOS)
                    .keyboardType(.numberPad)
                    #endif
                    .multilineTextAlignment(.trailing)
                    .frame(width: 80)
                    .padding(.horizontal, 8).padding(.vertical, 6)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                    .onChange(of: text.wrappedValue) { _, v in onChange(v) }
                Text("만원").font(BUFont.bodySmall).foregroundStyle(BUColor.inkMuted)
            }
        }
    }

    private func simCell(label: String, value: Int, highlight: Bool = false) -> some View {
        VStack(alignment: .center, spacing: 2) {
            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
            Text("\(value)만")
                .font(highlight ? BUFont.cardTitleSmall : BUFont.bodySmall)
                .foregroundStyle(highlight ? BUColor.midnight : BUColor.ink)
                .monospacedDigit()
        }
    }

    private func benchRow(label: String, range: String, good: Bool) -> some View {
        HStack(spacing: BUSpacing.sm) {
            Image(systemName: good ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                .font(.system(size: 14)).foregroundStyle(good ? BUColor.success : .orange)
            Text(label).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
            Spacer()
            Text(range).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
        }
    }
}

#if DEBUG
#Preview("FinancialReview") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["financial-review"] }
    return FinancialReviewStageView().environment(store)
}
#endif
