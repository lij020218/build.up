//
//  FranchiseApplicationStageView.swift — 프랜차이즈 가맹 절차 (iOS 네이티브, 웹 SSOT 미러)
//
//  웹 SSOT: apps/web/app/lib/components/stages/franchise/FranchiseApplicationStage.tsx
//  stageId: "franchise-application"
//
//  3-page 구조 (웹과 동일):
//    pg 0 — 왜 중요한가  (정보공개서·14일 숙려 핵심 이유 + 한국 가맹 통계)
//    pg 1 — 가맹 절차    (StageTaskRegistry 6 tasks 가 BUStageShell 하단에 자동 노출)
//    pg 2 — 정보공개서 검증 (4항목 점검 리스트 + 외부 링크)
//
//  진입 조건: startup-type 단계에서 "franchise" 선택 시 budget-setup 직후 자동 삽입.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

// MARK: - 6-step franchise process (웹 SSOT — starterTaskMap["franchise-application"])

private struct FranchiseStep {
    let taskId: String
    let title: String
    let time: String
    let detail: String
    let linkLabel: String?
    let linkUrl: String?
}

private let franchiseSteps: [FranchiseStep] = [
    .init(taskId: "fc-inquiry", title: "본사 가맹 상담 신청", time: "1~2주",
          detail: "본사 홈페이지·전화로 상담 예약. 사업 경험·자본금·희망 지역을 전달하고 가맹부 담당자 미팅.",
          linkLabel: nil, linkUrl: nil),
    .init(taskId: "fc-disclosure", title: "정보공개서 수령·검토 (14일 숙려)", time: "14일",
          detail: "가맹사업법 의무 제공 자료. 가맹점 수·폐점률·평균 영업이익·최근 3년 분쟁 이력 4항목을 직접 확인.",
          linkLabel: "공정위 정보공개서 조회", linkUrl: "https://franchise.ftc.go.kr"),
    .init(taskId: "fc-visit", title: "기존 가맹점 3곳 이상 방문", time: "1주",
          detail: "정보공개서 목록의 가맹점 직접 방문 — 실제 일매출·본사 지원 만족도·물류 문제를 점주에게 질문.",
          linkLabel: nil, linkUrl: nil),
    .init(taskId: "fc-legal", title: "가맹계약 법률 검토", time: "2~3일",
          detail: "변호사·가맹거래사 자문 — 영업지역 보호·필수구매 비율·중도 해지 위약금 조항을 review.",
          linkLabel: "표준가맹계약서 양식 (공정위)", linkUrl: "https://www.ftc.go.kr/www/cop/bbs/selectBoardList.do?key=203&bbsId=BBSMSTR_000000002321"),
    .init(taskId: "fc-contract", title: "가맹계약 체결 및 가맹비 납부", time: "1일",
          detail: "가맹비·교육비·인테리어비·로열티 조건 최종 확인. 중도 해지 위약금이 총 투자비 50% 초과면 재협상.",
          linkLabel: nil, linkUrl: nil),
    .init(taskId: "fc-training", title: "본사 교육 프로그램 이수", time: "2~4주",
          detail: "조리법·운영 매뉴얼·POS·위생 교육. 본사 매뉴얼이 부실하면 오픈 후 운영 사고 위험 ↑.",
          linkLabel: nil, linkUrl: nil),
]

// MARK: - contractCheckpoints (웹 SSOT — packages/shared/src/franchise-data.ts:2321)

private struct ContractCheckpoint {
    let id: String
    let title: String
    let description: String
    let riskLevel: String   // "critical" | "important" | "info"
}

private let contractCheckpoints: [ContractCheckpoint] = [
    .init(id: "contract-period",    title: "계약 기간 및 갱신 조건",
          description: "계약 기간이 초기 투자금 회수에 충분한지 확인하세요. 보통 3~5년이며, 갱신 조건(추가 비용, 인테리어 리뉴얼 등)을 반드시 확인하세요.",
          riskLevel: "critical"),
    .init(id: "fee-refund",         title: "가맹비 반환 조건",
          description: "계약 해지 시 가맹비 반환 여부와 조건을 확인하세요. 정보공개서 미제공 또는 허위정보 제공 시 전액 반환 가능합니다.",
          riskLevel: "critical"),
    .init(id: "territory",          title: "영업지역 보호 범위",
          description: "본사가 보장하는 영업지역 범위와 동일 브랜드 출점 제한을 명확히 확인하세요. 모호한 표현은 분쟁의 원인이 됩니다.",
          riskLevel: "critical"),
    .init(id: "termination",        title: "계약 해지 조건 및 위약금",
          description: "본사의 일방적 해지 사유, 가맹점의 해지 가능 조건, 위약금 규모를 반드시 확인하세요. 부당한 해지 조항은 분쟁조정 대상입니다.",
          riskLevel: "critical"),
    .init(id: "royalty-structure",  title: "로열티 구조",
          description: "월 정액인지, 매출 비율인지, 별도 광고 분담금이 있는지 확인하세요. 광고 모델료 점주 분담 여부도 중요합니다.",
          riskLevel: "important"),
    .init(id: "mandatory-purchase", title: "필수 물품 구매 의무",
          description: "본사에서 반드시 구매해야 하는 물품(원재료, 포장재 등)의 범위와 가격 적정성을 확인하세요. 시중 대비 과도하게 높지 않은지 비교하세요.",
          riskLevel: "important"),
    .init(id: "interior-mandate",   title: "인테리어·시설 강제 여부",
          description: "본사 지정 업체 시공 의무, 리뉴얼 주기, 비용 부담 주체를 확인하세요. 계약 갱신 시 인테리어 재시공 조건도 중요합니다.",
          riskLevel: "important"),
    .init(id: "ad-cost-share",      title: "광고·홍보 분담금",
          description: "전국 광고비, 지역 광고비, 오프닝 광고비가 별도로 부과되는지 확인하세요. 광고비가 매출 대비 과도하지 않은지 검토하세요.",
          riskLevel: "important"),
    .init(id: "transfer-restrict",  title: "사업 양도 제한",
          description: "제3자에게 양도 시 본사 승인 절차와 제한 조건을 확인하세요. 양도 시 추가 비용이 발생하는지도 확인하세요.",
          riskLevel: "info"),
    .init(id: "dispute-resolution", title: "분쟁 해결 방식",
          description: "분쟁 발생 시 중재/소송 절차와 비용 부담을 확인하세요. 한국프랜차이즈산업협회 분쟁조정협의회를 활용할 수 있습니다.",
          riskLevel: "info"),
]

private func riskColor(_ level: String) -> Color {
    switch level {
    case "critical":  return Color(red: 0.863, green: 0.149, blue: 0.149) // red
    case "important": return Color(red: 0.918, green: 0.612, blue: 0.047) // amber
    default:          return Color(red: 0.420, green: 0.451, blue: 0.502) // gray
    }
}
private func riskLabel(_ level: String) -> String {
    switch level {
    case "critical":  return "필수"
    case "important": return "중요"
    default:          return "참고"
    }
}

public struct FranchiseApplicationStageView: View {

    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("stage.franchise.selectedBrandId") private var franchiseBrandId = ""
    /// 6 task 체크 상태 — JSON-encoded Set<String> (BUInteractiveChecklist 의 binding 패턴).
    @AppStorage("stage.franchise.stepsDoneJson")   private var stepsDoneRaw = "[]"
    @State private var page = 0
    private let stageId = "franchise-application"

    private let pages = ["왜 중요한가", "가맹 절차", "정보공개서 검증"]

    public init() {}

    private var stepsDone: Set<String> {
        get {
            guard let data = stepsDoneRaw.data(using: .utf8),
                  let arr = try? JSONDecoder().decode([String].self, from: data)
            else { return [] }
            return Set(arr)
        }
    }
    private func setStepsDone(_ s: Set<String>) {
        if let data = try? JSONEncoder().encode(Array(s).sorted()),
           let str = String(data: data, encoding: .utf8) {
            stepsDoneRaw = str
        }
    }
    private var completedCount: Int { stepsDone.count }

    /// 게이트: 6-task 모두 체크되면 진행 가능 — StageTaskRegistry 가 자동 처리.
    /// 사장님이 BUStageTaskList 에서 직접 체크. canAdvance 는 항상 true (체크리스트는 추천이지 강제 아님,
    /// 웹과 동일 — 웹도 task 체크 안 해도 다음 진행은 허용하되 status 만 노출).
    private var canContinue: Bool { true }

    private var advanceHint: String {
        "가맹 절차 검토 — 다음 단계로 진행"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "프랜차이즈 가맹 절차",
            stageEyebrow: "단계 · 프랜차이즈",
            helperText: "가맹은 시스템 구매 — 본사가 보여주는 매출 자료보다 정보공개서 + 기존 점주 증언이 진짜 신호입니다.",
            canAdvance: canContinue,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId)
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId) },
            wrapup: BUStageWrapupData(
                doneItems: [
                    .init(label: "1. 정보공개서 검토", detail: "공정위 franchise.ftc.go.kr — 가맹점 수·폐점률·평균 매출·가맹비 4항목 직접 확인"),
                    .init(label: "2. 본사 미팅·교육", detail: "본사 담당자 직접 면담 + 가맹점 운영 교육 4~12주 일정 확인"),
                    .init(label: "3. 입지·계약 진행", detail: "본사 추천 입지 vs 자율 입지 비교 + 가맹계약서·인테리어 견적 검토"),
                    .init(label: "4. 가맹비·로열티 확정", detail: "가맹금·교육비·인테리어 강제·로열티 5년 총비용 시뮬"),
                ],
                verifyItems: [
                    "정보공개서 — 최근 3년 폐점률 30% 이상 브랜드 회피, 가맹점주 평균 운영기간 5년 미만 위험",
                    "가맹계약 14일 숙려기간 — 가맹사업법 의무, 본사가 압박 시 위반 (공정위 신고 가능)",
                    "인테리어 강제 — 본사 지정 업체만 가능 시 시장가 대비 30~50% 부풀림 흔함, 견적 비교 필수",
                    "필수 구매 비율 — 70% 이상이면 식자재 단가 협상력 X, 마진 압박 위험",
                    "영업지역 보호 — 반경 OO미터 내 추가 가맹점 금지 조항 명문화 (없으면 잠식 리스크)",
                    "본사 광고비 — 분담률·집행 내역 공개 의무, 불투명하면 가맹사업법 위반 신고 가능",
                ],
                nextStageLabel: "인테리어 시공",
                nextSummary: "정보공개서·계약서 검토 완료 → 인테리어 시공·운영 준비 단계로 진입"
            ),
            currentPage: page,
            totalPages: pages.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in
                        withAnimation(.easeInOut(duration: 0.22)) { page = newPage }
                    }
                )

                Group {
                    switch page {
                    case 0: whyPage
                    case 1: processPage
                    default: verifyPage
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: page)
            }
        }
    }

    // MARK: - Brand header (선택된 브랜드 표시)

    @ViewBuilder
    private var brandHeader: some View {
        if !franchiseBrandId.isEmpty,
           let info = FranchiseBrandRegistry.brand(by: franchiseBrandId) {
            BUCard(.card) {
                HStack(spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(LinearGradient(colors: [BUColor.midnight, BUColor.midnight.opacity(0.7)], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 42, height: 42)
                        Text(String(info.name.ko.prefix(1)))
                            .font(.system(size: 17, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(info.name.ko)
                            .font(.system(size: 16, weight: .heavy))
                            .tracking(-0.3)
                            .foregroundStyle(BUColor.ink)
                        Text("선택한 브랜드 — 가맹 절차를 단계별로 진행하세요")
                            .font(.system(size: 11.5, weight: .medium))
                            .foregroundStyle(BUColor.inkMuted)
                    }
                    Spacer()
                }
            }
        }
    }

    // MARK: - Page 0 — Why

    @ViewBuilder
    private var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.cardGap) {
            brandHeader

            BUCard(.outer) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(BUColor.midnight)
                        Text("왜 정보공개서·14일 숙려가 핵심인가")
                            .font(.system(size: 11, weight: .heavy))
                            .tracking(0.6)
                            .textCase(.uppercase)
                            .foregroundStyle(BUColor.midnight)
                    }

                    Text("가맹은 시스템 구매입니다. 본사가 보여주는 매출 자료보다 정보공개서 + 기존 가맹점주의 실제 증언이 진짜 신호입니다.")
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundStyle(BUColor.ink)
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, 2)

                    Text("공정위가 14일 숙려기간을 의무화한 이유 — 가맹비 입금 전 사장님이 정보공개서를 충분히 읽고 결정할 시간을 강제로 확보하기 위함. 본사가 압박해도 신고 가능.")
                        .font(.system(size: 13))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: 10) {
                    BUEyebrow("한국 가맹 데이터")
                    factRow(tag: "가맹 분쟁 1위", body: "공정위 2024 가맹분야 분쟁조정 — '계약 해지 시 위약금·인테리어 강제' 32%")
                    factRow(tag: "3년 폐업률",    body: "가맹점 3년 폐업률 평균 30% — 정보공개서 미검토 사장님 폐업률 47% (KFA 2024)")
                    factRow(tag: "정보공개서 효과", body: "14일 숙려기간 활용한 사장님 분쟁률 11% vs 미활용 26% — 공정위 모니터링 보고서")
                    factRow(tag: "인테리어 강제",  body: "본사 지정 인테리어 평균 시장가 대비 30~50% 부풀림 — 공정위 시정명령 사례 다수")
                }
            }
        }
    }

    private func factRow(tag: String, body: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(tag)
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(BUColor.midnight)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(BUColor.midnight.opacity(0.10), in: RoundedRectangle(cornerRadius: 4, style: .continuous))
                .fixedSize()
                .padding(.top, 1)
            Text(body)
                .font(.system(size: 12.5))
                .foregroundStyle(BUColor.inkSecondary)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Page 1 — Process (6 단계)

    @ViewBuilder
    private var processPage: some View {
        // 6 task 의 본문 narrative — 체크박스 자체는 BUStageShell 의 하단 BUStageTaskList 가 자동 렌더링.
        VStack(alignment: .leading, spacing: BUSpacing.cardGap) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        BUEyebrow("6단계 가맹 절차")
                        Spacer()
                        let allDone = completedCount == franchiseSteps.count
                        Text("\(completedCount) / \(franchiseSteps.count)")
                            .font(.system(size: 11, weight: .heavy))
                            .monospacedDigit()
                            .foregroundStyle(allDone ? Color(red: 0.020, green: 0.588, blue: 0.412) : BUColor.midnight)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(
                                (allDone ? Color(red: 0.020, green: 0.588, blue: 0.412) : BUColor.midnight).opacity(0.10),
                                in: Capsule()
                            )
                    }
                    Text("각 단계 완료 시 체크박스를 눌러주세요. 진행도 \(completedCount)/\(franchiseSteps.count) 표시됩니다.")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineSpacing(2)

                    VStack(spacing: 0) {
                        ForEach(Array(franchiseSteps.enumerated()), id: \.element.taskId) { idx, step in
                            if idx > 0 {
                                Rectangle().fill(BUColor.midnight.opacity(0.08)).frame(height: 0.5)
                            }
                            interactiveStep(step, idx: idx + 1)
                        }
                    }
                }
            }
        }
    }

    private func interactiveStep(_ step: FranchiseStep, idx: Int) -> some View {
        let isDone = stepsDone.contains(step.taskId)
        return Button {
            var s = stepsDone
            if s.contains(step.taskId) { s.remove(step.taskId) } else { s.insert(step.taskId) }
            withAnimation(.easeInOut(duration: 0.18)) { setStepsDone(s) }
        } label: {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(isDone ? BUColor.midnight : Color.white)
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .strokeBorder(isDone ? Color.clear : BUColor.midnight.opacity(0.25), lineWidth: 1.5)
                    if isDone {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(.white)
                    } else {
                        Text("\(idx)")
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(BUColor.midnight.opacity(0.55))
                    }
                }
                .frame(width: 26, height: 26)
                .padding(.top, 2)

                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(step.title)
                            .font(.system(size: 13.5, weight: .heavy))
                            .tracking(-0.1)
                            .foregroundStyle(isDone ? BUColor.ink.opacity(0.55) : BUColor.ink)
                            .strikethrough(isDone, color: BUColor.ink.opacity(0.5))
                        Text(step.time)
                            .font(.system(size: 10.5, weight: .heavy))
                            .foregroundStyle(BUColor.midnight)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(BUColor.midnight.opacity(0.08), in: Capsule())
                    }
                    Text(step.detail)
                        .font(.system(size: 12))
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                    if let label = step.linkLabel, let urlStr = step.linkUrl, let url = URL(string: urlStr) {
                        Link(destination: url) {
                            HStack(spacing: 3) {
                                Text(label)
                                    .font(.system(size: 11, weight: .heavy))
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 9, weight: .heavy))
                            }
                            .foregroundStyle(BUColor.midnight)
                            .padding(.top, 2)
                        }
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    // MARK: - Page 2 — Verify (웹 SSOT contractCheckpoints 10개, riskLevel 컬러)

    @ViewBuilder
    private var verifyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.cardGap) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: 12) {
                    BUEyebrow("가맹계약 10대 체크포인트")
                    Text("공정위 franchise.ftc.go.kr 정보공개서 + 표준가맹계약서 기준. 빨강 = 필수 / 노랑 = 중요 / 회색 = 참고.")
                        .font(.system(size: 12))
                        .foregroundStyle(BUColor.inkMuted)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)

                    VStack(spacing: 0) {
                        ForEach(Array(contractCheckpoints.enumerated()), id: \.element.id) { idx, c in
                            if idx > 0 {
                                Rectangle().fill(BUColor.midnight.opacity(0.08)).frame(height: 0.5)
                            }
                            checkpointRow(c)
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: 8) {
                    BUEyebrow("참고 링크")
                    linkRow(title: "공정위 정보공개서 조회",     url: "https://franchise.ftc.go.kr")
                    linkRow(title: "표준가맹계약서 양식 (공정위)", url: "https://www.ftc.go.kr/www/cop/bbs/selectBoardList.do?key=203&bbsId=BBSMSTR_000000002321")
                    linkRow(title: "한국프랜차이즈산업협회",       url: "https://www.ikfa.or.kr/")
                    linkRow(title: "가맹사업법 안내 (법령정보)",   url: "https://www.law.go.kr/법령/가맹사업거래의공정화에관한법률")
                }
            }
        }
    }

    private func checkpointRow(_ c: ContractCheckpoint) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Circle()
                .fill(riskColor(c.riskLevel))
                .frame(width: 8, height: 8)
                .padding(.top, 7)
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(c.title)
                        .font(.system(size: 13.5, weight: .heavy))
                        .tracking(-0.1)
                        .foregroundStyle(BUColor.ink)
                    Text(riskLabel(c.riskLevel))
                        .font(.system(size: 10, weight: .heavy))
                        .tracking(0.4)
                        .textCase(.uppercase)
                        .foregroundStyle(riskColor(c.riskLevel))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(riskColor(c.riskLevel).opacity(0.10), in: Capsule())
                }
                Text(c.description)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, 10)
    }

    private func verifyRow(label: String, detail: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 14))
                .foregroundStyle(BUColor.midnight)
                .padding(.top, 2)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 13.5, weight: .heavy))
                    .foregroundStyle(BUColor.ink)
                Text(detail)
                    .font(.system(size: 12))
                    .foregroundStyle(BUColor.inkSecondary)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }

    private func linkRow(title: String, url: String) -> some View {
        Link(destination: URL(string: url)!) {
            HStack {
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BUColor.ink)
                Spacer()
                Image(systemName: "arrow.up.right")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(BUColor.inkMuted)
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
    }
}

#if DEBUG
#Preview("FranchiseApplication") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["franchise-application"] }
    return FranchiseApplicationStageView().environment(store)
}
#endif
