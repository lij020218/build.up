//
//  GrowthEngineStageView.swift — 성장 엔진 구축 (iOS 네이티브)
//
//  stageId: "growth-engine"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct GrowthEngineStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "growth-engine"

    @State private var page = 0

    @AppStorage("ge.northStar")    private var northStar    = ""
    @AppStorage("ge.currentValue") private var currentValue = ""
    @AppStorage("ge.targetValue")  private var targetValue  = ""
    @AppStorage("ge.weeklyReview") private var weeklyReview = false
    @AppStorage("ge.retention")    private var retention    = false
    @AppStorage("ge.done")         private var done         = false

    private let pages = ["북극성 지표", "주간 리뷰 루틴"]

    public init() {}

    /// 게이트: 북극성 지표 정의 — NSM 입력 필수.
    private var canCompleteStage: Bool {
        !northStar.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private var advanceHint: String {
        if northStar.trimmingCharacters(in: .whitespaces).isEmpty { return "북극성 지표(NSM)를 정의하세요" }
        return "NSM 정의 완료 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "성장·리텐션 루프",
            stageEyebrow: "단계 12 · 성장 엔진",
            helperText: "측정하지 않으면 성장하지 않습니다. 북극성 지표(NSM) = 제품이 고객에게 전달하는 핵심 가치를 반영하는 단일 지표.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["northStar": northStar])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["northStar": northStar]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 북극성 지표 정의", detail: "사업 본질 반영 1개 지표 + 측정 방법·임계 정의"),
                .init(label: "2. 주간 리뷰 시스템", detail: "매주 핵심 지표 변화 + 가설·실험 + 학습 로그 공유"),
                .init(label: "3. 리텐션 측정", detail: "D7·D30·D90 코호트 + B2B SaaS D30 40%+·B2C D30 15%+ 기준"),
                .init(label: "4. 성장 가설·실험", detail: "Acquisition·Activation·Revenue·Retention·Referral 5축 실험 우선순위"),
                ],
                verifyItems: [
                "리텐션 미달 — 성장보다 제품 개선 우선, 「깨진 양동이에 물 붓기」 패턴 회피",
                "허영 지표 — DAU·페이지뷰 등 수익·만족 무관 지표 추적 시 잘못된 결정 1순위",
                "유료 광고 — ROAS 200% 미만 시 즉시 중단, 「쓸수록 손해」 패턴 인식",
                "CAC vs LTV — LTV/CAC 3배 미만이면 성장 자제, 단위경제 흑자 보장 후 가속",
                "추적 도구 — Mixpanel·Amplitude 등 셋업, raw 데이터·코호트·funnel 추적 시스템",
                "개인정보 — 트래킹 동의 별도 수집, 위반 시 개인정보보호법 과징금 (매출 3% 이내)",
                ],
                nextStageLabel: "펀드레이징 준비",
                nextSummary: "북극성·주간 리뷰·리텐션·성장 가설 셋업 완료 → 펀드레이징 준비 단계로 진입"
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
                    case 0: northStarPage
                    default: weeklyReviewPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 북극성 지표

    private var northStarPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("북극성 지표 예시 (업종별)")
                    let examples: [(String, String)] = [
                        ("B2B SaaS", "주간 활성 사용자 (WAU)"),
                        ("커머스", "월 구매 전환율 × GMV"),
                        ("콘텐츠 플랫폼", "주간 콘텐츠 소비 시간"),
                        ("핀테크", "월 거래 금액 (TPV)"),
                    ]
                    ForEach(examples, id: \.0) { category, metric in
                        HStack {
                            Text(category)
                                .font(BUFont.bodySmall.weight(.semibold))
                                .foregroundStyle(BUColor.ink)
                            Spacer()
                            Text(metric)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .multilineTextAlignment(.trailing)
                        }
                        if category != examples.last!.0 { Divider() }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("내 북극성 지표 설정")
                    VStack(alignment: .leading, spacing: 4) {
                        Text("북극성 지표").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        TextField("예: 주간 활성 사용자 수", text: $northStar)
                            .font(BUFont.bodySmall)
                            .padding(.horizontal, 10).padding(.vertical, 10)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("현재 수치").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        TextField("현재 측정값", text: $currentValue)
                            .font(BUFont.bodySmall)
                            .padding(.horizontal, 10).padding(.vertical, 10)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("3개월 목표").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        TextField("달성하고 싶은 수치", text: $targetValue)
                            .font(BUFont.bodySmall)
                            .padding(.horizontal, 10).padding(.vertical, 10)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                }
            }
        }
    }

    // MARK: - pg 1 주간 리뷰 루틴

    private var weeklyReviewPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("주간 성장 리뷰 — 매주 월요일 30분")
                    let steps = [
                        "지난 주 북극성 지표 확인 — 올랐나 내렸나",
                        "리텐션 체크 — D7/D30 코호트 분석",
                        "이탈 원인 파악 — CS 로그·NPS 응답 검토",
                        "이번 주 단 하나의 실험 결정 — A/B 테스트 or 신기능",
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
                    BUEyebrow("루틴 셋업 체크")
                    Toggle(isOn: $weeklyReview) {
                        Text("주간 리뷰 루틴 셋업 완료")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $retention) {
                        Text("D7 리텐션 측정 시작 (PostHog/Mixpanel 코호트)")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("주요 성장 지표 목표 (초기 SaaS 기준)")
                    let metrics: [(String, String)] = [
                        ("MoM 성장률", "20-30% (Seed 단계)"),
                        ("D7 리텐션", "40% 이상"),
                        ("NPS", "40+ (추천 의향)"),
                        ("LTV:CAC", "3:1 이상"),
                    ]
                    ForEach(metrics, id: \.0) { label, value in
                        HStack {
                            Text(label)
                                .font(BUFont.bodySmall)
                                .foregroundStyle(BUColor.ink)
                            Spacer()
                            Text(value)
                                .font(BUFont.bodySmall.weight(.semibold))
                                .foregroundStyle(BUColor.success)
                        }
                        if label != metrics.last!.0 { Divider() }
                    }
                }
            }
        }
    }
}

#if DEBUG
#Preview("GrowthEngine") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["growth-engine"] }
    return GrowthEngineStageView().environment(store)
}
#endif
