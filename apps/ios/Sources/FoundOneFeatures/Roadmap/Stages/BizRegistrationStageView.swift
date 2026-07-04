//
//  BizRegistrationStageView.swift — 사업자등록 최종 확인 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/offline/BizRegistrationPanel.tsx
//  stageId: "biz-registration"
//
//  고유 가치 (이전 단계와 중복 없는 내용):
//    1. 상호명 (가게 이름) 최종 확정
//    2. 사업용 통장 개설 가이드 (IBK·카카오뱅크·우리은행·신한)
//    3. 이전 단계 결정 요약 (read-only)
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct BizRegistrationStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "biz-registration"

    @AppStorage("biz.storeName")         private var storeName        = ""
    @AppStorage("biz.bankDone")          private var bankDone         = false
    @AppStorage("biz.storeNameFinal")    private var storeNameFinal   = false
    @AppStorage("roadmap.selectedIndustryId") private var industryId  = ""
    @State private var page = 0
    private let pages = ["이전 결정", "상호명", "사업용 통장"]

    private var cluster: IndustryCluster { IndustryCluster.from(industryId: industryId) }

    /// 업종별 예시 상호 placeholder.
    private var storeNamePlaceholder: String {
        switch cluster.category {
        case .food:           return "예) 연남동 삼겹집, 홍대 떡볶이"
        case .cafeDessert:    return "예) 망원 라테 라운지, 성수 베이커리"
        case .beauty:         return "예) 청담 헤어살롱, 강남 네일아뜰리에"
        case .fitness:        return "예) 한남동 필라테스, 잠실 24시 헬스"
        case .education:      return "예) 분당 수학학원, 신촌 코딩 부트캠프"
        case .pet:            return "예) 마포 펫호텔, 강남 반려동물 미용"
        case .livingService:  return "예) 동작 깔끔세탁, 마포 24시 청소"
        case .space:          return "예) 성수 쉐어스튜디오, 홍대 파티룸"
        case .retail:         return "예) 동대문 패션소품, 합정 라이프스타일샵"
        case .onlineDigital:  return "예) 스마트스토어 브랜드명, 자체몰 도메인"
        case .startupTech:    return "예) 법인명 (㈜영문 + 한글병기 권장)"
        }
    }

    /// startup-tech 는 법인 통장 안내가 다름.
    private var bankSectionTitle: String {
        cluster.isStartupTech ? "법인 통장 개설 가이드" : "사업용 통장 개설 가이드"
    }

    // 이전 단계 상태 (read-only 요약용)
    // ⚠️ 2026-05-25 fix: RegistrationSetupStageView 는 "stage.regSetup.*" 키를 사용.
    //    "reg.*" 는 미작성 키라 항상 기본값(false/"")으로 읽혀 "미확인" 표시 고정되는 버그.
    @AppStorage("stage.regSetup.bizRegDone")    private var bizRegDone    = false
    @AppStorage("stage.regSetup.taxTypeChoice") private var taxTypeChoice = ""
    @AppStorage("hiring.contractDone")          private var contractDone  = false

    public init() {}

    // 2026-07-02: 헤더가 "이전 단계 완료"라고 단정하던 것을 실제 배지 상태와 일치(모순 제거).
    private var priorAllDone: Bool { bizRegDone && !taxTypeChoice.isEmpty && contractDone }
    private var bizHelperText: String {
        priorAllDone
            ? "사업자등록·과세유형·이전 결정이 모두 완료됐습니다. 이 단계는 마지막 두 가지 — 사업용 통장 + 상호명 — 만 처리합니다."
            : "아래 「이전 단계에서 결정된 사항」에 미확인 항목이 있습니다. 해당 단계에서 먼저 마무리한 뒤, 이 단계에서 사업용 통장·상호명을 확정하세요."
    }

    /// 게이트: 상호명 최종 확정 + 사업용 통장 개설 완료 (2/2).
    private var canCompleteStage: Bool {
        storeNameFinal && bankDone && !storeName.isEmpty
    }

    private var advanceHint: String {
        if storeName.isEmpty { return "「상호명」 탭에서 가게 이름을 입력하세요" }
        if !storeNameFinal { return "상호명 확정 토글을 켜세요" }
        if !bankDone { return "「사업용 통장」 탭에서 개설 완료를 체크하세요" }
        return "통장 + 상호명 확정 — 다음 단계로"
    }

    private func stageRef(_ stageId: String, title: String) -> String {
        guard let index = roadmapStore.pathStageIds.firstIndex(of: stageId) else { return "\(title) 단계" }
        return "\(index + 1)번 단계 \(title)"
    }

    private var registrationStageId: String {
        if roadmapStore.pathStageIds.contains("registration-setup") { return "registration-setup" }
        if roadmapStore.pathStageIds.contains("online-registration") { return "online-registration" }
        return "company-setup"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "사업자등록 & 금융 세팅",
            stageEyebrow: "단계 10 · 사업자등록 최종 확인",
            helperText: bizHelperText,
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                // storeName 은 inputs 로 전달 → StageInputProjector 가 store_name 컬럼에 자동 투영(웹 SSOT).
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["storeName": storeName])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["storeName": storeName])
            },
            wrapup: BUStageWrapupData(
                doneItems: [
                    .init(label: "1. 상호명 최종 확정", detail: "사업자등록증·간판·SNS·세금계산서까지 같은 이름 사용"),
                    .init(label: "2. 사업용 통장 개설", detail: "개인 통장과 분리 — 세무 비용 입증의 최소 조건"),
                ],
                verifyItems: [
                    "상호명은 등록 후 변경 시 등록증 재발급 필요 — 간판·메뉴판·온라인까지 일관되게 확정했는지 확인",
                    "개인 통장과 사업 통장 분리 — 혼용 시 세무조사에서 사업 비용 입증 불가",
                    "통장 개설 준비물: 사업자등록증 원본 · 대표자 신분증 (도장 선택)",
                ],
                nextStageLabel: "세무·자금 가이드",
                nextSummary: "상호명·통장 확정 → 과세 신고·정책자금 단계로"
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
                    case 0: previousDecisions
                    case 1: storeNameSection
                    default: bankSection
                    }
                }
            }
        }
    }

    // MARK: - 이전 결정 요약 (read-only)

    private var previousDecisions: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("이전 단계에서 결정된 사항")
                let registrationRef = stageRef(registrationStageId, title: "사업자등록")
                let taxGuideRef = stageRef("tax-guide", title: "세무 가이드")
                let hiringRef = stageRef("hiring-setup", title: "채용 설정")
                let decisions: [(String, String, Bool)] = [
                    ("사업자등록·영업신고", "\(registrationRef) — 홈택스 또는 세무서", bizRegDone),
                    ("과세유형 결정 (간이/일반)", taxTypeChoice.isEmpty ? taxGuideRef : "선택: \(taxTypeChoice == "simplified" ? "간이과세" : "일반과세")", !taxTypeChoice.isEmpty),
                    ("근로계약서 작성·교부", "\(hiringRef) — 채용 설정", contractDone),
                ]
                ForEach(decisions, id: \.0) { label, hint, done in
                    HStack(spacing: BUSpacing.sm) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                .fill(done ? BUColor.success.opacity(0.12) : BUColor.midnight.opacity(0.06))
                                .frame(width: 32, height: 32)
                            Image(systemName: done ? "checkmark.circle.fill" : "clock")
                                .font(.system(size: 14)).foregroundStyle(done ? BUColor.success : BUColor.inkMuted)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text(label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text(hint).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                        }
                        Spacer()
                        Text(done ? "완료" : "미확인")
                            .font(BUFont.eyebrow.weight(.bold))
                            .foregroundStyle(done ? BUColor.success : BUColor.inkMuted)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background((done ? BUColor.success : BUColor.inkSubtle).opacity(0.12), in: Capsule())
                    }
                }
            }
        }
    }

    // MARK: - 상호명

    private var storeNameSection: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("상호명 (가게 이름) 최종 확정")
                TextField(storeNamePlaceholder, text: $storeName)
                    .font(BUFont.body)
                    .padding(.horizontal, 10).padding(.vertical, 10)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                Text("사업자등록증·간판·메뉴판·SNS·세금계산서까지 모두 동일한 이름을 사용합니다. 등록 후 변경 시 등록증 재발급이 필요하므로 신중히 확정하세요.")
                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                Toggle(isOn: $storeNameFinal) {
                    Text("상호명 최종 확정 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
                    .onChange(of: storeNameFinal) { _, isFinal in
                        // 확정 토글을 켜는 즉시 서버에 상호명 저장 (advance 안 해도 웹과 동기화).
                        if isFinal { StoreProfileRepository.persistStoreNameForCurrentUser(storeName) }
                    }

                // 상표권 선출원주의 — 상호 확정 시점에 검토. advisory(미드나잇), 수수료는 시점변동이라 미표기.
                if let url = URL(string: "https://www.kipris.or.kr/khome/main.do") {
                    Link(destination: url) {
                        HStack(alignment: .top, spacing: 8) {
                            Text("상표").font(.system(size: 9.5, weight: .bold)).foregroundStyle(BUColor.midnight)
                                .padding(.horizontal, 7).padding(.vertical, 2)
                                .background(BUColor.midnight.opacity(0.10), in: RoundedRectangle(cornerRadius: 5, style: .continuous))
                            VStack(alignment: .leading, spacing: 3) {
                                Text("상호 확정 = 상표권도 함께 확인 (한국은 선출원주의)")
                                    .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                                    .fixedSize(horizontal: false, vertical: true)
                                Text("먼저 출원한 사람이 권리를 갖습니다. 내 상호·브랜드를 남이 먼저 등록하면 간판·메뉴판을 못 쓰고 분쟁·배상으로 번질 수 있어요. KIPRIS에서 동일·유사 상표를 검색하고, 핵심 브랜드라면 특허청에 상표 출원으로 선점하세요. ↗ KIPRIS 무료 검색")
                                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .padding(BUSpacing.sm)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - 사업용 통장

    private var bankSection: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(BUColor.danger).font(.system(size: 13))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("개인 통장과 사업 통장은 반드시 분리")
                            .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.danger)
                        Text("혼용 시 세무조사에서 사업 비용 입증 불가 → 전부 과세 대상. 사업자등록증 발급 직후 즉시 개설하세요.")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.danger).lineSpacing(2)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("사업용 통장 추천 (소상공인)")
                    let banks: [(String, String, String)] = [
                        ("기업은행 IBK", "소상공인 특화 상품 多 · 정책자금 연계 유리 · 전국 지점", "정책자금 연계"),
                        ("카카오뱅크 사업자", "비대면 즉시 개설 · 수수료 0원 · 앱 거래 관리 간편", "비대면"),
                        ("우리은행 위비기업", "지역 네트워크 강점 · 세무사·노무사 무료 상담 포함", "상담 포함"),
                        ("신한은행 SOL Biz", "여러 은행·카드사 계좌·매입매출 통합관리 · 세무·쇼핑몰 제휴(SOHO)", "통합관리"),
                    ]
                    ForEach(banks, id: \.0) { name, desc, badge in
                        HStack(spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08)).frame(width: 36, height: 36)
                                Image(systemName: "building.columns").font(.system(size: 15)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 6) {
                                    Text(name).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                    Text(badge).font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(BUColor.midnight)
                                        .padding(.horizontal, 6).padding(.vertical, 2)
                                        .background(BUColor.midnight.opacity(0.08), in: Capsule())
                                }
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 11)).foregroundStyle(BUColor.inkSubtle)
                        }
                    }
                    Text("준비물: 사업자등록증 원본 · 대표자 신분증 · 도장 (선택)")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).padding(.top, 4)
                }
            }

            BUCard(.card) {
                Toggle(isOn: $bankDone) {
                    Text("사업용 통장 개설 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("BizRegistration") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["biz-registration"] }
    return BizRegistrationStageView().environment(store)
}
#endif
