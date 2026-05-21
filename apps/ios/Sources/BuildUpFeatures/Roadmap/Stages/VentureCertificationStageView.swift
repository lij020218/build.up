//
//  VentureCertificationStageView.swift — 벤처 인증 (iOS 네이티브)
//
//  stageId: "venture-certification"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct VentureCertificationStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "venture-certification"

    @State private var page = 0

    @AppStorage("vc.certType") private var certType = ""
    @AppStorage("vc.applied")  private var applied  = false
    @AppStorage("vc.done")     private var done     = false

    private let pages = ["인증 종류", "신청 방법"]

    public init() {}

    /// 게이트: 인증 경로 선택 — 4가지 유형 중 하나.
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
                .init(label: "1. 벤처 유형 결정", detail: "벤처투자유형·연구개발유형·혁신성장유형 비교 후 선택"),
                .init(label: "2. 자격 요건 점검", detail: "투자 유치액·R&D 비율·매출·인력 등 유형별 요건 충족 확인"),
                .init(label: "3. 신청 서류 준비", detail: "사업계획서·재무제표·R&D 증빙·연구원 명단 등 사전 준비"),
                .init(label: "4. 인증 신청·발급", detail: "벤처기업종합관리시스템(SMTECH) 신청 + 평균 1~2개월 발급"),
                ],
                verifyItems: [
                "벤처투자유형 — 「벤처투자조합 5천만원 이상」 투자 받아야 자격, 단순 엔젤 X",
                "연구개발유형 — 매출 대비 R&D 비율 5% 이상 + 연구개발전담부서 보유 의무",
                "혁신성장유형 — 평가 점수 70점 이상, 평가 항목 사전 확인 후 보완",
                "법인전환 — 개인사업자는 인증 불가, 법인 전환 후 신청 (전환 후 6개월 매출 자료 필요)",
                "갱신 — 벤처 인증은 3년, 갱신 시 자격 재충족 의무 (미충족 시 인증 취소)",
                "혜택 활용 — 세제 감면·정부지원금 가산점·인재 채용 우대 등 자동 적용 X, 별도 신청 필요",
                ],
                nextStageLabel: "사업자등록",
                nextSummary: "벤처 유형·요건·신청 완료 → 사업자등록 단계로 진입 (또는 다음 정부지원 신청)"
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
                    BUEyebrow("벤처 인증 4가지 유형")
                    let options: [(String, String, String)] = [
                        ("research",    "연구개발기업",   "R&D 비용이 매출의 5% 이상 또는 연구인력 5% 이상. 딥테크 스타트업에 적합."),
                        ("innovation",  "기술혁신형",     "기술보증기금(KIBO) 기술평가 통해 인증. 혁신기술 보유 기업."),
                        ("vc",          "벤처투자기업",   "VC로부터 5000만원 이상 투자 유치. 가장 빠른 취득 경로."),
                        ("government",  "정부지원기업",   "정부 R&D 과제 수행 기업. 중진공·IITP 과제 해당."),
                    ]
                    ForEach(options, id: \.0) { id, title, desc in
                        let isSelected = certType == id
                        Button {
                            certType = isSelected ? "" : id
                        } label: {
                            HStack(alignment: .top, spacing: BUSpacing.sm) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(title)
                                        .font(BUFont.bodySmall.weight(.semibold))
                                        .foregroundStyle(isSelected ? BUColor.midnightDeep : BUColor.ink)
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
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("벤처 인증 혜택")
                    let benefits = [
                        "법인세·소득세 50% 감면 (5년)",
                        "4대보험 50% 감면 (3년)",
                        "공공기관 조달 가점",
                        "정책자금 금리 우대 (0.2-0.5%p)",
                        "코스닥 상장 특례 (일부 유형)",
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
                    BUEyebrow("신청 절차 (벤처확인기관 기준)")
                    let steps = [
                        "벤처확인종합관리시스템 (venturein.or.kr) 접속",
                        "유형 선택 → 필요 서류 확인 (유형마다 다름)",
                        "온라인 신청 + 서류 업로드",
                        "심사 (평균 2-4주) → 확인서 발급",
                        "혜택 즉시 적용 시작",
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
