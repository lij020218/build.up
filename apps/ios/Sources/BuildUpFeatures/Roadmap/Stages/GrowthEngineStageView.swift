//
//  GrowthEngineStageView.swift — 성장 엔진 구축 (iOS 네이티브)
//
//  stageId: "growth-engine"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct GrowthEngineStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("ge.northStar")    private var northStar    = ""
    @AppStorage("ge.currentValue") private var currentValue = ""
    @AppStorage("ge.targetValue")  private var targetValue  = ""
    @AppStorage("ge.weeklyReview") private var weeklyReview = false
    @AppStorage("ge.retention")    private var retention    = false
    @AppStorage("ge.done")         private var done         = false

    private let pages = ["북극성 지표", "주간 리뷰 루틴"]

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    Picker("탭", selection: $page) {
                        ForEach(pages.indices, id: \.self) { i in
                            Text(pages[i]).tag(i)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(BUSpacing.md)

                    ScrollView {
                        VStack(alignment: .leading, spacing: BUSpacing.lg) {
                            Group {
                                switch page {
                                case 0: northStarPage
                                default: weeklyReviewPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("성장 엔진 구축")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .topBarTrailing) {
                    Button("닫기") { dismiss() }.foregroundStyle(BUColor.midnight)
                }
                #else
                ToolbarItem(placement: .cancellationAction) { Button("닫기") { dismiss() } }
                #endif
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - pg 0 북극성 지표

    private var northStarPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("성장 엔진 구축")
                    Text("측정하지 않으면 성장하지 않는다\n— 하나의 숫자에 집중하세요")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(BUColor.midnightDeep)
                        .tracking(-0.3)
                        .lineSpacing(4)
                    Text("북극성 지표 (NSM) = 제품이 고객에게 전달하는 핵심 가치를 반영하는 단일 지표")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

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

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("성장 엔진 구축 완료")
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("GrowthEngine") { GrowthEngineStageView() }
#endif
