//
//  ContractReviewStageView.swift — 임대 계약 검토 (iOS 네이티브)
//
//  stageId: "contract-review"
//
//  3-page (세그먼트):
//    pg 0 — 핵심 조항 (9대 필수 항목)
//    pg 1 — 레드플래그 & 협상 포인트
//    pg 2 — 계약 체크리스트
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct ContractReviewStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "contract-review"

    // 계약 체크
    @AppStorage("contract.check.term")        private var checkTerm        = false
    @AppStorage("contract.check.deposit")     private var checkDeposit     = false
    @AppStorage("contract.check.rent")        private var checkRent        = false
    @AppStorage("contract.check.area")        private var checkArea        = false
    @AppStorage("contract.check.renewal")     private var checkRenewal     = false
    @AppStorage("contract.check.restore")     private var checkRestore     = false
    @AppStorage("contract.check.sublease")    private var checkSublease    = false
    @AppStorage("contract.check.facility")    private var checkFacility    = false
    // ⚠️ 2026-05-25 fix: clausePage 에 9번째 조항 "주요 시설 보수"가 표시되지만
    //    checklistPage 에 대응 체크항목이 없어 allChecked 가 실제 8개만 평가하는 버그.
    //    9번째 체크 추가.
    @AppStorage("contract.check.maintenance") private var checkMaintenance = false
    @AppStorage("contract.check.done")        private var contractDone     = false

    private var allChecked: Bool {
        checkTerm && checkDeposit && checkRent && checkArea &&
        checkRenewal && checkRestore && checkSublease && checkFacility && checkMaintenance
    }

    private let pages = ["핵심 조항", "레드플래그", "체크리스트"]

    private var canCompleteStage: Bool { allChecked && contractDone }

    private var advanceHint: String {
        if !allChecked { return "9대 핵심 조항을 모두 체크하세요" }
        if !contractDone { return "임대 계약서 서명 완료 토글을 켜세요" }
        return "계약 검토 완료 — 다음 단계로"
    }

    public init() {}

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "계약 전 검토",
            stageEyebrow: "단계 8 · 임대 계약 검토",
            helperText: "임대 계약서는 '표준 양식'이 없습니다. 임대인이 유리하게 작성합니다. 사장님이 직접 확인하거나 법무사 검토(5~10만원)를 권장합니다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 서류 발급", detail: "건축물대장 + 등기부등본 — 위반건축물 표시 + 근저당 ÷ 시세 = 부도 위험률"),
                .init(label: "2. 현장 방문 + 인접 점주 인터뷰", detail: "휴대폰 영상 + 30초 인터뷰 + 전기 30A·정화조 직접 검증"),
                .init(label: "3. 특약 5종 협상", detail: "임대료 5% 상한 + 10년 갱신 + 원상복구 「임차 시 상태」 + 업종변경 자유 + 시설보강 임대인 부담"),
                .init(label: "4. 사인 + 당일 확정일자", detail: "동주민센터 30분 — 1,000원 — 보증금 우선변제권 확보"),
                ],
                verifyItems: [
                "확정일자 도장 받은 계약서 원본 보관 + 스캔본 클라우드 (분쟁 시 핵심 증거)",
                "특약 5종 모두 계약서 「특약사항」 란에 명문화 — 구두 약속은 분쟁 시 100% 임차인 불리",
                "근저당 합계 ÷ 시세 50% 이상이면 보증금 후순위 — 보증보험 가입 검토",
                "전기 용량·정화조 용량을 임대인 답변과 다르면 시설보강 임대인 부담 추가 협상",
                "원상복구 범위가 「임차 시 상태」 로 명시됐는지 다시 확인 — 「최초 인도 시」 = 인테리어 철거 1,000~3,000만원 부담",
                ],
                nextStageLabel: "다음 단계(인테리어) 전 반드시 확인",
                nextSummary: "보증금 보호 명문화 완료 → 인테리어·집기 발주 (construction-setup) 진입"
            ),
            currentPage: page,
            totalPages: pages.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )

                Group {
                    switch page {
                    case 0: clausePage
                    case 1: redFlagPage
                    default: checklistPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 핵심 조항

    private var clausePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("9대 핵심 확인 조항")
                    let clauses: [(String, String, String)] = [
                        ("계약 기간", "2년 이상 권장 (상가임대차보호법 최초 10년 갱신 청구권)", "clock"),
                        ("보증금·월세", "금액·지급일·인상률 상한 명시 (5% 이내 권장)", "wonsign"),
                        ("임대 면적", "건축물대장 실면적 vs 계약서 면적 일치 여부 확인", "ruler"),
                        ("권리금", "권리금 있을 경우 별도 계약서 작성 (미작성 시 분쟁 발생)", "doc.text"),
                        ("계약 갱신", "갱신 청구권 10년 보장 (2018년 10월 이후 체결 계약)", "arrow.clockwise"),
                        ("원상복구", "인테리어 원상복구 범위 구체적으로 명시 (무제한 금지)", "arrow.uturn.backward"),
                        ("전대차 금지", "영업 중 사정으로 재임대 필요 시 허용 여부 확인", "person.2"),
                        ("시설 설치", "환기 덕트·후드·간판 설치 허용 특약 삽입 여부", "wrench.and.screwdriver"),
                        ("주요 시설 보수", "냉난방·전기·수도 주요 시설 하자 수리 주체 명확히", "hammer"),
                    ]
                    ForEach(clauses, id: \.0) { title, detail, icon in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                Circle().fill(BUColor.midnight.opacity(0.1)).frame(width: 28, height: 28)
                                Image(systemName: icon).font(.system(size: 11)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 레드플래그 & 협상

    private var redFlagPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            warningCard(title: "절대 사인하면 안 되는 조항", items: [
                "\"임대인 요구 시 즉시 명도\" — 사실상 퇴거 요청 때마다 이사 각오",
                "\"원상복구 무제한\" — 임대인이 전체 리모델링 비용 청구 가능",
                "\"월세 인상률 제한 없음\" — 매년 급격한 인상으로 수익 증발",
                "임차인 권리금 보호 조항 누락 — 권리금 회수 불가능",
            ], color: .red)

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("협상 성공 특약 예시")
                    let specials: [(String, String)] = [
                        ("인테리어 기간 무상 임대", "\"착공일로부터 OO일간 임대료 면제\" — 수백만원 절감"),
                        ("인테리어 비용 일부 임대인 부담", "\"후드·덕트 설치비 50% 임대인 부담\" — 공사비 절감"),
                        ("간판 설치 허용 명시", "\"건물 외벽 간판 설치 동의\" — 추후 분쟁 방지"),
                        ("영업 양도 시 권리금 보호", "\"임차인 권리금 회수 기회 보장\" — 상가임대차보호법 준용"),
                        ("월세 인상 상한 5%", "\"연간 임대료 인상은 5% 초과 불가\" — 5년 수익 예측 가능"),
                    ]
                    ForEach(specials, id: \.0) { title, detail in
                        HStack(alignment: .top, spacing: 8) {
                            Text("✓").font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.success)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("전문가 활용 (5~10만원)")
                    let pros: [(String, String)] = [
                        ("법무사 계약서 검토", "계약서 리스크 조항 식별 + 특약 추가 대행"),
                        ("상가임대차 전문 변호사", "분쟁 이력 있는 건물 또는 고가 권리금 매물"),
                        ("공인중개사 동행 협상", "임대인과 조율 경험 있는 중개사에게 중간 협상 위임"),
                    ]
                    ForEach(pros, id: \.0) { name, desc in
                        HStack(alignment: .top, spacing: 8) {
                            Text("→").font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.midnight).padding(.top, 1)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 2 체크리스트

    private var checklistPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("사인 전 최종 체크리스트")
                    contractCheckRow("계약 기간 2년 이상 + 갱신 청구권 10년 확인", isChecked: $checkTerm)
                    contractCheckRow("보증금·월세 금액·지급일 정확히 기재", isChecked: $checkDeposit)
                    contractCheckRow("임대 면적 건축물대장과 일치 여부 확인", isChecked: $checkArea)
                    contractCheckRow("월세 인상률 상한 조항 삽입", isChecked: $checkRent)
                    contractCheckRow("갱신 청구권 조항 확인 (강행규정)", isChecked: $checkRenewal)
                    contractCheckRow("원상복구 범위 구체적으로 명시", isChecked: $checkRestore)
                    contractCheckRow("후드·간판·덕트 설치 허용 특약 확인", isChecked: $checkFacility)
                    contractCheckRow("전대차 관련 조항 확인", isChecked: $checkSublease)
                    contractCheckRow("냉난방·전기·수도 주요 시설 하자 수리 주체 명확히", isChecked: $checkMaintenance)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("진행 상황")
                    wrapRow(label: "9대 핵심 조항 확인", done: allChecked)
                    if allChecked {
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark.seal.fill").foregroundStyle(BUColor.success)
                            Text("모든 항목 확인 완료! 계약 체결 가능합니다.")
                                .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.success)
                        }.padding(.top, 4)
                    }
                    Toggle(isOn: $contractDone) {
                        Text("임대 계약서 서명 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            warningCard(title: "계약 후 즉시 할 일", items: [
                "계약서 사진·사본 즉시 안전한 곳에 백업 (분실 시 분쟁 증거 불가)",
                "확정일자 받기 — 동사무소 방문 or 인터넷등기소 (600원). 임대인 파산 시 보증금 보호",
                "전입신고 (사업장 주소) — 확정일자와 함께 대항력 확보",
            ], color: .orange)
        }
    }

    // MARK: - Helpers

    private func contractCheckRow(_ label: String, isChecked: Binding<Bool>) -> some View {
        Button { isChecked.wrappedValue.toggle() } label: {
            HStack(alignment: .top, spacing: BUSpacing.sm) {
                Image(systemName: isChecked.wrappedValue ? "checkmark.square.fill" : "square")
                    .font(.system(size: 18)).foregroundStyle(isChecked.wrappedValue ? BUColor.success : BUColor.inkSubtle).padding(.top, 1)
                Text(label).font(BUFont.bodySmall).foregroundStyle(isChecked.wrappedValue ? BUColor.ink : BUColor.inkMuted).multilineTextAlignment(.leading)
                Spacer()
            }
            .padding(.vertical, 8).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func wrapRow(label: String, done: Bool) -> some View {
        HStack(spacing: BUSpacing.sm) {
            Image(systemName: done ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 16)).foregroundStyle(done ? BUColor.success : BUColor.inkSubtle)
            Text(label).font(BUFont.bodySmall).foregroundStyle(done ? BUColor.ink : BUColor.inkMuted)
            Spacer()
        }
    }

    @ViewBuilder
    private func warningCard(title: String, items: [String], color: Color) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.xs) {
                Text(title).font(BUFont.eyebrow.weight(.bold)).foregroundStyle(color)
                ForEach(items, id: \.self) { item in
                    HStack(alignment: .top, spacing: 6) {
                        Circle().fill(color).frame(width: 4, height: 4).padding(.top, 5)
                        Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }
        }
    }
}

#if DEBUG
#Preview("ContractReview") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["contract-review"] }
    return ContractReviewStageView().environment(store)
}
#endif
