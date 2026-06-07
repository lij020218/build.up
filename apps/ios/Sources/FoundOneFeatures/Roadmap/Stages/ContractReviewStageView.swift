//
//  ContractReviewStageView.swift — 임대 계약 검토 (iOS 네이티브)
//
//  stageId: "contract-review"
//
//  웹 SSOT 미러 (apps/web/.../selection/ContractReviewStage.tsx) — 6 페이지:
//    pg 0 — 개요 (StageOverview)
//    pg 1 — 1. 서류 (WorkStep)
//    pg 2 — 2. 현장 (WorkStep)
//    pg 3 — 3. 특약 (WorkStep + 업종별 특약)
//    pg 4 — 4. 사인 (WorkStep)
//    pg 5 — 마무리 (9대 핵심 조항 체크리스트 + 확정 토글)
//  상단 KEY ACTION 히어로는 BUStageKeyActionRegistry["contract-review"] 자동 노출.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct ContractReviewStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    private let stageId = "contract-review"

    // 계약 체크 (마무리 페이지 — 완료 게이트)
    @AppStorage("contract.check.term")        private var checkTerm        = false
    @AppStorage("contract.check.deposit")     private var checkDeposit     = false
    @AppStorage("contract.check.rent")        private var checkRent        = false
    @AppStorage("contract.check.area")        private var checkArea        = false
    @AppStorage("contract.check.renewal")     private var checkRenewal     = false
    @AppStorage("contract.check.restore")     private var checkRestore     = false
    @AppStorage("contract.check.sublease")    private var checkSublease    = false
    @AppStorage("contract.check.facility")    private var checkFacility    = false
    @AppStorage("contract.check.maintenance") private var checkMaintenance = false
    @AppStorage("contract.check.done")        private var contractDone     = false

    private var currentInputs: [String: String] {
        ["term": "\(checkTerm)", "deposit": "\(checkDeposit)", "rent": "\(checkRent)", "area": "\(checkArea)",
         "renewal": "\(checkRenewal)", "restore": "\(checkRestore)", "sublease": "\(checkSublease)",
         "facility": "\(checkFacility)", "maintenance": "\(checkMaintenance)", "done": "\(contractDone)"]
    }

    private var allChecked: Bool {
        checkTerm && checkDeposit && checkRent && checkArea &&
        checkRenewal && checkRestore && checkSublease && checkFacility && checkMaintenance
    }

    private let pages = ["개요", "1. 서류", "2. 현장", "3. 특약", "4. 사인", "마무리"]

    private var canCompleteStage: Bool { allChecked && contractDone }

    private var advanceHint: String {
        if !allChecked { return "「마무리」 탭에서 9대 핵심 조항을 모두 체크하세요" }
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
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: currentInputs)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: currentInputs) },
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
                    case 0: overviewPage
                    case 1: docsPage
                    case 2: sitePage
                    case 3: clausesPage
                    case 4: signPage
                    default: wrapupPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 개요 (웹 StageOverview 미러)

    private var overviewPage: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 14) {
                BUEyebrow("이 단계 개요")
                Text("계약서 사인 전 75분이 보증금 1,000~5,000만원을 결정합니다")
                    .font(.system(size: 18, weight: .heavy)).tracking(-0.3)
                    .foregroundStyle(BUColor.midnightDeep).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                Text("임대차 계약은 사인 후 정정 가능성이 거의 0%. 건물(용도·정화조·전기)·계약(특약)·보호(확정일자·근저당)를 사전에 점검해야 분쟁·손실을 막습니다. 인근 점주 인터뷰 + 정부 서류 + 표준 특약 5종만으로 80% 리스크 차단.")
                    .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 12) {
                    Text("₩2,800만").font(.system(size: 26, weight: .heavy)).foregroundStyle(BUColor.midnight)
                    Text("분쟁 시 평균 손실액")
                        .font(.system(size: 12, weight: .medium)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    Spacer(minLength: 0)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                VStack(alignment: .leading, spacing: 8) {
                    Text("이 단계에서 진행 — 총 5단계")
                        .font(BUFont.eyebrow).foregroundStyle(BUColor.midnight.opacity(0.7))
                    outlineRow("1. 서류", "건축물대장 + 등기부등본 발급", "20분")
                    outlineRow("2. 현장", "현장 방문 + 영상 + 인접 점주 인터뷰", "30분")
                    outlineRow("3. 특약", "특약 5종 협상 — 임대료·갱신·원상복구·업종·시설", "25분")
                    outlineRow("4. 사인", "사인 즉시 확정일자 (동주민센터)", "당일")
                    outlineRow("마무리", "필수 확인 항목 마킹 + 서명 완료", nil)
                }

                HStack(alignment: .top, spacing: 9) {
                    Image(systemName: "arrow.up.right.circle.fill").font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(BUColor.success).padding(.top, 1)
                    Text("보증금 보호 (확정일자 + 5% 상한 + 갱신 10년 + 원상복구 「임차 시 상태」 기준) 가 모두 계약서에 명문화됩니다. 다음 단계 (인테리어 발주) 부터는 보증금 묶임 리스크가 사라진 상태에서 진행.")
                        .font(.system(size: 12.5)).foregroundStyle(BUColor.ink.opacity(0.78)).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.success.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.success.opacity(0.16), lineWidth: 1))
            }
        }
    }

    private func outlineRow(_ step: String, _ title: String, _ time: String?) -> some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 1) {
                Text(step).font(.system(size: 10.5, weight: .bold)).tracking(0.4).textCase(.uppercase)
                    .foregroundStyle(BUColor.midnight.opacity(0.7))
                Text(title).font(.system(size: 13.5, weight: .bold)).foregroundStyle(BUColor.ink)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
            }
            Spacer(minLength: 0)
            if let time {
                Text(time).font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Color.white, in: Capsule())
                    .overlay(Capsule().strokeBorder(BUColor.midnight.opacity(0.1), lineWidth: 1))
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.06), lineWidth: 1))
    }

    // MARK: - WorkStep 공통 카드 (웹 WorkStep 미러)

    private func workStepCard(stepLabel: String, time: String, headline: String,
                              why: String, how: [(String, String)],
                              watchouts: [(String, String)] = []) -> some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 8) {
                    Text(stepLabel)
                        .font(.system(size: 11, weight: .bold)).tracking(0.5)
                        .foregroundStyle(BUColor.midnight)
                        .padding(.horizontal, 9).padding(.vertical, 3)
                        .background(BUColor.midnight.opacity(0.06), in: Capsule())
                    Text("· \(time)").font(.system(size: 11, weight: .medium)).foregroundStyle(BUColor.inkMuted)
                    Spacer(minLength: 0)
                }
                Text(headline)
                    .font(.system(size: 17, weight: .heavy)).tracking(-0.3)
                    .foregroundStyle(BUColor.midnightDeep).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                Text(why)
                    .font(.system(size: 13)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .leading, spacing: 0) {
                    Text("할 일").font(BUFont.eyebrow).foregroundStyle(BUColor.midnight.opacity(0.75))
                        .padding(.bottom, 8)
                    ForEach(Array(how.enumerated()), id: \.offset) { idx, h in
                        HStack(alignment: .top, spacing: 12) {
                            Text("\(idx + 1)")
                                .font(.system(size: 13, weight: .heavy)).foregroundStyle(BUColor.midnight)
                                .frame(width: 28, height: 28)
                                .background(BUColor.midnight.opacity(0.08), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                            VStack(alignment: .leading, spacing: 3) {
                                Text(h.0).font(.system(size: 14, weight: .bold)).foregroundStyle(BUColor.ink)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                                Text(h.1).font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.vertical, 8)
                        if idx < how.count - 1 { Divider().opacity(0.5) }
                    }
                }

                if !watchouts.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("주의", systemImage: "exclamationmark.triangle.fill")
                            .font(.system(size: 11, weight: .bold)).foregroundStyle(BUColor.danger)
                        ForEach(Array(watchouts.enumerated()), id: \.offset) { _, w in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(w.0).font(.system(size: 13, weight: .bold)).foregroundStyle(BUColor.danger)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                                Text(w.1).font(.system(size: 12)).foregroundStyle(BUColor.danger.opacity(0.85)).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.danger.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.danger.opacity(0.16), lineWidth: 1))
                }
            }
        }
    }

    // MARK: - pg 1 서류

    private var docsPage: some View {
        workStepCard(
            stepLabel: "1. 서류 발급", time: "20분",
            headline: "건축물대장 + 등기부등본을 사인 전에 직접 확인",
            why: "임대인 말로 「용도 OK·근저당 적음」 = 절대 신뢰 X. 정부 서류로만 검증. 근저당 50%↑ 매물은 임대인 부도 시 보증금 회수 위험.",
            how: [
                ("건축물대장 발급 (정부24·무료·5분)", "정부24 → 「건축물대장 등본」 검색 → PDF 다운. 「용도」 + 「위반건축물」 표시 + 「정화조 BOD 용량」 확인."),
                ("등기부등본 발급 (인터넷등기소·700원·5분)", "iros.go.kr → 「등기사항전부증명서」 → 부동산 주소 검색. 「갑구」 = 소유권, 「을구」 = 근저당·압류. 근저당 합계 ÷ 매물 시세 = 부도 위험률."),
            ],
            watchouts: [
                ("위반건축물 표시 = 영업신고 영구 불가", "건축물대장에 「위반건축물」 표기 시 무조건 매물 변경. 무허가 증축·용도 변경은 시정 명령 + 보증금 묶임."),
                ("근저당 50%↑ = 임대인 부도 시 보증금 후순위", "근저당 권자 (은행 등) 가 우선. 보증금이 후순위면 임대인 부도 시 잃을 가능성 큼."),
            ]
        )
    }

    // MARK: - pg 2 현장

    private var sitePage: some View {
        workStepCard(
            stepLabel: "2. 현장 방문", time: "30분",
            headline: "휴대폰 영상 + 옆 가게 점주 인터뷰 = 80% 리스크 차단",
            why: "사진은 못 잡는 「소음·냄새·동선·환기」를 직접 점검. 옆 가게 점주에게 30초만 물어봐도 임대인 평판이 보임.",
            how: [
                ("영상 기록 — 매장 전체 + 외부 + 시설", "휴대폰으로 한 번에 쭉 촬영. 누수·곰팡이·전기 패널·환기 후드·정화조 위치까지. 분쟁 시 증거."),
                ("옆 가게 점주에게 3개 질문", "「이 건물주 어때요?」 + 「임대료 어떻게 인상하세요?」 + 「민원 자주 있나요?」 — 임대인 평판 80% 노출."),
                ("전기 용량·정화조 용량 직접 확인", "전기 패널 30A 표기 확인 + 건물 외부 정화조 위치·크기 확인. 임대인 답변과 다르면 협상 카드."),
            ],
            watchouts: [
                ("낮 시간대만 가지 말 것 — 야간 소음 못 봄", "주거 인접 매물은 저녁 7시·아침 7시 다시 방문해 소음 점검. 영업 후 민원으로 시간 제한 가능성 사전 차단."),
            ]
        )
    }

    // MARK: - pg 3 특약 (+ 업종별 특약)

    private var clausesPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            workStepCard(
                stepLabel: "3. 특약 협상", time: "25분",
                headline: "표준 임대차계약서 + 5종 특약 — 거부 임대인 = 매물 변경",
                why: "사인 후 정정 거의 불가. 5종 특약을 협상 못 하는 임대인은 분쟁 시 일방적. 협상 거부 자체가 위험 신호.",
                how: [
                    ("표준 임대차계약서 사용 (법무부 양식)", "법무부 「상가건물 임대차 표준계약서」 다운. 임대인이 본인 양식 고집하면 추가 위험 조항 의심."),
                    ("특약 5종 명시 — 임대료 5%·갱신 10년·원상복구·업종변경·시설보강", "「특약사항」 란에 5종 모두 명시. ① 임대료 인상 연 5% 이내 ② 10년 갱신권 ③ 원상복구 = 「임차 시 상태」 기준 ④ 업종변경 자유 ⑤ 시설보강 비용 임대인 부담."),
                    ("거부 시 매물 변경 — 협상 못 하는 임대인은 위험", "5종 모두 거부하면 분쟁 가능성 매우 높은 임대인. 보증금 1,000~5,000만원 묶을 가치 없음."),
                ],
                watchouts: [
                    ("「임대료 5% 상한」 미명시 = 무제한 인상 가능", "⚠ 환산보증금 상한 — 서울 9억, 광역시 6.9억, 그 외 5.4억 (상가건물 임대차보호법 시행령 §2). 환산보증금 = 보증금 + (월세 × 100). 상한 초과면 법정 보호(5% 상한·우선변제권) 적용 X — 특약에 「갱신 시 5% 이내」 명시해야 안전. ✓ 대항력·계약갱신요구권(10년)·권리금 회수기회는 환산보증금 상관없이 모든 임차인에게 적용."),
                    ("원상복구 「최초 인도 시 상태」 = 인테리어 철거 1,000~3,000만원", "본인이 한 시공을 모두 철거 + 원래대로 복구해야 함. 「임차 시 상태」 로 명시해야 본인 시공만 책임."),
                ]
            )
            clauseFavorableCard
        }
    }

    // MARK: - pg 4 사인 + 확정일자

    private var signPage: some View {
        workStepCard(
            stepLabel: "4. 사인 + 확정일자", time: "당일 30분",
            headline: "사인 당일 무조건 확정일자 — 1일 늦으면 보증금 후순위",
            why: "확정일자가 보증금 우선변제권 결정. 다른 채권자가 그 사이 등기하면 사장님 보증금이 후순위로 밀려 임대인 부도 시 잃음.",
            how: [
                ("관할 동주민센터 또는 세무서 방문", "임차물건 주소 관할. 1,000원 수수료. 30분 안에 끝남. 토요일 일부 가능 — 평일에 사인하는 게 안전."),
                ("필요 서류 — 임대차계약서 + 신분증", "원본 계약서 + 본인 신분증. 임대인 동행 X (임차인 단독 신청)."),
                ("확정일자 도장 받은 계약서는 절대 분실 X", "스캔본 클라우드 + 원본 금고 보관. 분쟁 시 핵심 증거."),
                ("다음 단계 — 인테리어·집기 발주", "확정일자 받으면 보증금 보호 완료. 다음 단계로 진행."),
            ],
            watchouts: [
                ("확정일자 1일 늦어도 우선변제권 후순위", "사인 후 다른 채권자가 그날 등기하면 사장님 보증금이 후순위. 사인 직후 바로 동주민센터로."),
                ("권리금 회수기회 보호 — 임대차 종료 6개월 전~종료 시점", "상가건물 임대차보호법 §10조의4 — 임대인이 정당한 사유 없이 신규 임차인 거절 시 권리금 손해배상 청구 가능. 환산보증금 무관 모든 임차인에게 적용. 임대인 거절 사유는 서면 요구·증거 확보 필수."),
            ]
        )
    }

    // MARK: - pg 5 마무리 (9대 핵심 조항 체크리스트 + 확정 토글)

    private var wrapupPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("사인 전 최종 체크리스트 (9대 핵심 조항)")
                    contractCheckRow("계약 기간 2년 이상 + 갱신 청구권 10년 확인", isChecked: $checkTerm)
                    contractCheckRow("보증금·월세 금액·지급일 정확히 기재", isChecked: $checkDeposit)
                    contractCheckRow("임대 면적 건축물대장과 일치 여부 확인", isChecked: $checkArea)
                    contractCheckRow("월세 인상률 상한 조항 삽입 (5% 이내)", isChecked: $checkRent)
                    contractCheckRow("갱신 청구권 조항 확인 (강행규정)", isChecked: $checkRenewal)
                    contractCheckRow("원상복구 범위 「임차 시 상태」로 명시", isChecked: $checkRestore)
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
                "확정일자 받기 — 관할 동주민센터/세무서 (1,000원). 임대인 파산 시 보증금 우선변제권 확보",
                "전입신고 (사업장 주소) — 확정일자와 함께 대항력 확보",
            ], color: .orange)
        }
    }

    // MARK: - 업종별 특약 카드 (웹 clauseFavorable 1:1 — web==app)

    private var clauseFavorableCard: some View {
        let tip = clauseFavorableTip(IndustryCluster.from(industryId: industryId).category.rawValue)
        return BUCard(.card) {
            VStack(alignment: .leading, spacing: 10) {
                BUEyebrow("사장님 업종 — 꼭 받을 특약")
                Text(tip.context)
                    .font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    .padding(.horizontal, 10).padding(.vertical, 4)
                    .background(BUColor.midnight08, in: Capsule())
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "checkmark.seal.fill").font(.system(size: 15)).foregroundStyle(BUColor.success).padding(.top, 1)
                    Text(tip.recommendation)
                        .font(.system(size: 14, weight: .bold)).foregroundStyle(BUColor.ink).lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                }
                Text(tip.rationale)
                    .font(.system(size: 12.5)).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    /// 웹 clauseFavorable(ContractReviewStage.tsx) 10업종 1:1 포팅.
    private func clauseFavorableTip(_ categoryId: String) -> (context: String, recommendation: String, rationale: String) {
        switch categoryId {
        case "food":
            return ("음식점 / F&B", "「환기·정화조·전기 보강 비용 임대인 부담」 특약 무조건 받기",
                "후드·덕트·정화조 증축은 임대 후 발견 시 500~3,000만원. 임대인 부담 명시 또는 임대료 5% 인하로 보상. 거부 임대인 = 매물 변경.")
        case "cafe-dessert":
            return ("카페 / 베이커리", "「전기 30A↑ 증설 가능 + 비용 분담」 명시",
                "머신·오븐·제빙기 동시 가동 시 20A 차단기 빈번. 한전 신청 30~80만원. 임대인 부담 또는 임대료 인하로 보상.")
        case "retail":
            return ("리테일 / 소매", "「온라인 판매 병행 가능」 + 「업종변경 자유」 명시",
                "오프라인만 묶이면 매출 다각화 어려움. 스마트스토어 병행이 매출 안전망. 미명시 시 분쟁 발생 시 임대인 우위.")
        case "beauty":
            return ("미용·뷰티", "「소음·향기 민원 시 임대인 1차 중재 책임」 명시",
                "옆 가게 민원으로 영업시간 제한 사례 다수. 임대인이 중재 안 하면 임차인이 직접 분쟁 — 책임 분담 명시 필수.")
        case "fitness":
            return ("필라테스·요가·PT", "「방음 보강 비용 임대인 부담」 + 「영업시간 06-23시 보장」",
                "운동 소음 민원이 폐점 1순위. 방음 보강 1,000~3,000만원을 임대인이 분담 안 하면 매물 변경.")
        case "education":
            return ("학원", "「학원 등록 가능 용도」 + 「소방완비증명서 책임 분담」 명시",
                "건축물 용도 「교육연구시설」 또는 학원 가능 「근린생활시설」 확약 안 받으면 등록 거부. 100㎡↑ 소방완비 필수.")
        case "pet":
            return ("펫", "「소음·냄새 민원 1차 중재 임대인 책임」 + 「업종 폐쇄 명령 시 환불」",
                "펫 업종 민원 영업정지 빈번. 환불 조항 없으면 보증금 묶인 채 폐업. 임대인 중재 + 환불 보장이 안전망.")
        case "online-digital":
            return ("온라인·디지털 (사무실·창고)", "「사업자등록 가능」 명시",
                "주거용 임대차 계약서는 「사업자 등록 금지」 가 default. 사업자등록 못 하면 매출 신고·세금계산서 불가.")
        case "living-service":
            return ("세탁·청소·수리", "「폐수·소음 기준 적합 매물 + 위반 시 임대인 책임」",
                "폐수·소음 위반은 영업정지 사유. 임대인이 사전 적합성 확약 없이 단속 시 임차인 부담.")
        case "space":
            return ("공간 임대", "「숙박 가능 여부 + 데시벨·시간 제한 명시」",
                "건축물 용도 미일치 시 영업허가 거부. 소음·시간 분쟁 1순위 — 특약에 명시.")
        default:
            return clauseFavorableTip("food")
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
