//
//  VentureCertificationStageView.swift — 벤처 인증 (iOS 네이티브)
//
//  stageId: "venture-certification"
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct VentureCertificationStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "venture-certification"

    @State private var page = 0

    @AppStorage("vc.certType") private var certType = ""
    @AppStorage("vc.applied")  private var applied  = false
    @AppStorage("vc.done")     private var done     = false
    @AppStorage("stage.budget.startupOperatingMode") private var startupMode = "bootstrap"

    /// 부트스트랩·인디 트랙: VC 유치(벤처투자유형)는 '미래 전환' — 지금 경로는 연구개발·혁신성장유형.
    private var isBootstrapTrack: Bool { startupMode == "bootstrap" || startupMode == "indie" }

    private let pages = ["인증 종류", "신청 방법"]

    public init() {}

    /// 게이트: 인증 경로 선택 — 3가지 유형 중 하나 (2021 개편 후 3-track 체제).
    private var canCompleteStage: Bool {
        !certType.isEmpty
    }

    private var advanceHint: String {
        if certType.isEmpty { return "벤처 인증 유형을 선택하세요" }
        return "인증 경로 선택 완료 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "벤처인증 · 정부 지원사업",
            stageEyebrow: "단계 14 · 벤처 인증",
            helperText: "세제 혜택·보조금·조달 우선권 — 법인 설립 후 가능한 빨리. 2026년 벤처 인증 기업 수 약 4만 2천 개.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["certType": certType])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["certType": certType]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 벤처 유형 결정", detail: "벤처투자유형·연구개발유형·혁신성장유형 3가지 중 선택 (2021 개편 후 3-track)"),
                .init(label: "2. 자격 요건 점검", detail: "투자 유치액·R&D 비율·매출·인력 등 유형별 요건 충족 확인"),
                .init(label: "3. 신청 서류 준비", detail: "사업계획서·재무제표·R&D 증빙·연구원 명단 등 사전 준비"),
                .init(label: "4. 인증 신청·발급", detail: "venture.or.kr 신청 + 평균 1~2개월 발급 (심사기간 30일 기준)"),
                ],
                verifyItems: [
                "벤처투자유형 — 「벤처투자조합 5천만원 이상」 투자 받아야 자격, 단순 엔젤 X",
                "연구개발유형 — 매출 대비 R&D 비율 5% 이상 + 연구개발전담부서 보유 의무",
                "혁신성장유형 — 평가 점수 70점 이상, 평가 항목 사전 확인 후 보완",
                "사업자 형태 — 개인사업자도 벤처인증 신청·획득 가능(중소기업 요건 충족 시, 법인 전환 필수 아님). 법인 전환 시 확인서는 승계 재발급되나 절차가 번거로워 초기부터 법인 설립 권장",
                "갱신 — 벤처 인증은 3년, 갱신 시 자격 재충족 의무 (미충족 시 인증 취소)",
                "스톡옵션 비과세 — 연 2억·누적 5억까지 비과세 (2027.12.31까지 한시), 50% 옵션풀 한도 (일반 10%)",
                "병역특례 — 전문연구요원·산업기능요원 36개월 활용 가능 (인재 채용 핵심 혜택)",
                "개인투자자 소득공제 — 3천만원 이하 100%·5천만원 70%·초과 30%, 투자자 모집 시 강력한 카드",
                ],
                nextStageLabel: "세무 가이드",
                nextSummary: "벤처 유형·요건·신청 완료 → 인증 후 혜택 활성화 + 세무 가이드 단계로 진입"
            ),
            currentPage: page,
            onNextPage: { withAnimation { page += 1 } },
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
                    case 0: certTypePage
                    default: applicationPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 인증 종류

    private var certTypePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("벤처 인증 3가지 유형 (2021 개편 후)")
                    if isBootstrapTrack {
                        Text("부트스트랩 트랙 — 지금 가장 현실적인 건 혁신성장유형(평가만 통과, 연구소·투자 불필요)입니다. 연구개발유형도 가능하지만 기업부설연구소 + 연 5천만원 R&D가 필요해요. 벤처투자유형은 PMF 후 VC로부터 5천만원 이상 유치 시 열리는 미래 경로입니다.")
                            .font(BUFont.bodyCaption)
                            .foregroundStyle(BUColor.inkSecondary)
                            .lineSpacing(2)
                            .padding(BUSpacing.sm)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1))
                    }
                    let options: [(String, String, String)] = [
                        ("vc",         "벤처투자유형",    "벤처투자조합·VC로부터 5천만원 이상 + 자본금 10% 이상 투자 유치. 가장 빠른 취득 경로."),
                        ("research",   "연구개발유형",    "매출 대비 R&D 비율 5% 이상 + 연구개발전담부서 보유. 딥테크·기술기반 스타트업."),
                        ("innovation", "혁신성장유형",    "기술보증기금(KIBO)·벤처기업협회 평가 70점 이상. 매출·기술혁신성 평가형."),
                    ]
                    ForEach(options, id: \.0) { id, title, desc in
                        let isSelected = certType == id
                        let isVcFuture = isBootstrapTrack && id == "vc"
                        Button {
                            certType = isSelected ? "" : id
                        } label: {
                            HStack(alignment: .top, spacing: BUSpacing.sm) {
                                VStack(alignment: .leading, spacing: 2) {
                                    HStack(spacing: 6) {
                                        Text(title)
                                            .font(BUFont.bodySmall.weight(.semibold))
                                            .foregroundStyle(isSelected ? BUColor.midnightDeep : BUColor.ink)
                                        if isVcFuture {
                                            Text("VC 유치 후")
                                                .font(BUFont.bodyCaption.weight(.semibold))
                                                .foregroundStyle(BUColor.midnight)
                                                .padding(.horizontal, 6)
                                                .padding(.vertical, 2)
                                                .background(BUColor.midnight.opacity(0.1), in: Capsule())
                                        }
                                    }
                                    Text(desc)
                                        .font(BUFont.bodyCaption)
                                        .foregroundStyle(BUColor.inkSecondary)
                                        .lineSpacing(2)
                                        .multilineTextAlignment(.leading)
                                }
                                Spacer()
                                if isSelected {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 16))
                                        .foregroundStyle(BUColor.midnight)
                                }
                            }
                            .padding(BUSpacing.sm)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                isSelected ? BUColor.midnight.opacity(0.08) : BUColor.midnight.opacity(0.03),
                                in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5)
                            )
                            .opacity(isVcFuture && !isSelected ? 0.8 : 1)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("벤처 인증 혜택 (2026 기준)")
                    let benefits = [
                        "법인세·소득세 50% 감면 (5년)",
                        "취득세 75% 감면 · 재산세 면제(3년) → 50% 감면(2년)",
                        "스톡옵션 비과세 연 2억·누적 5억 (2027.12.31까지 한시)",
                        "50% 옵션풀 한도 (일반 기업 10% 대비 5배)",
                        "병역특례 — 전문연구요원·산업기능요원 36개월",
                        "개인투자자 소득공제 100%/70%/30% (3천/5천/초과)",
                        "정책자금 금리 우대 + 공공조달 가산점 + 코스닥 상장 특례",
                    ]
                    ForEach(benefits, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(BUColor.success)
                                .padding(.top, 2)
                            Text(item)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 신청 방법

    private var applicationPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("신청 절차 (벤처기업확인기관 기준)")
                    let steps = [
                        "벤처기업확인종합관리시스템 (venture.or.kr) 접속",
                        "유형 선택 → 필요 서류 확인 (유형마다 다름)",
                        "온라인 신청 + 서류 업로드",
                        "심사 (심사기간 30일, 평균 1~2개월 발급) → 확인서 발급",
                        "혜택 별도 신청 — 세제 감면·정책자금 등 자동 적용 X",
                    ]
                    ForEach(steps.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                Circle()
                                    .fill(BUColor.midnight.opacity(0.08))
                                    .frame(width: 24, height: 24)
                                Text("\(i + 1)")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(BUColor.midnight)
                            }
                            Text(steps[i])
                                .font(BUFont.bodySmall)
                                .foregroundStyle(BUColor.ink)
                                .lineSpacing(2)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("준비 서류 (공통)")
                    let docs = [
                        "법인등기부등본",
                        "사업자등록증",
                        "최근 3년 재무제표 (없으면 창업 후 첫 회계연도 내)",
                    ]
                    ForEach(docs, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            Text(item)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $applied) {
                    Text("벤처 인증 신청 완료")
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("VentureCertification") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["venture-certification"] }
    return VentureCertificationStageView().environment(store)
}
#endif
