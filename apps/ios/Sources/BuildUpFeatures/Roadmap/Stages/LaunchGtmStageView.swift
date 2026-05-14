//
//  LaunchGtmStageView.swift — GTM 론칭 (iOS 네이티브)
//
//  stageId: "launch-gtm"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct LaunchGtmStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

    @AppStorage("gtm.analytics")  private var analytics  = false
    @AppStorage("gtm.billing")    private var billing    = false
    @AppStorage("gtm.monitoring") private var monitoring = false
    @AppStorage("gtm.cs")         private var cs         = false
    @AppStorage("gtm.users100")   private var users100   = false
    @AppStorage("gtm.done")       private var done       = false

    private let pages = ["인프라 셋업", "첫 100 사용자"]

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
                                case 0: infraPage
                                default: users100Page
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("GTM 론칭")
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

    // MARK: - pg 0 인프라 셋업

    private var infraPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.hero) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("GTM 론칭")
                    Text("론칭 전에 측정 도구부터\n— 보이지 않으면 개선할 수 없다")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(BUColor.midnightDeep)
                        .tracking(-0.3)
                        .lineSpacing(4)
                    Text("GTM(Go-To-Market) = 제품을 시장에 내놓는 전략·인프라·첫 사용자 확보")
                        .font(BUFont.bodySmall)
                        .foregroundStyle(BUColor.inkSecondary)
                        .lineSpacing(3)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("필수 인프라 체크리스트")
                    Toggle(isOn: $analytics) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("애널리틱스 셋업 (PostHog / Mixpanel / GA4)")
                                .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                        }
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $billing) {
                        Text("결제 시스템 연동 (Toss Payments / Stripe)")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $monitoring) {
                        Text("에러 모니터링 (Sentry + 알림 설정)")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $cs) {
                        Text("CS 채널 셋업 (카카오톡 채널 / 이메일 자동응답)")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("왜 이것들이 론칭 전에 필요한가")
                    let reasons = [
                        "애널리틱스 없이 론칭하면 무엇이 작동하는지 모름",
                        "결제 오류를 론칭 당일 발견하면 첫 인상이 망가짐",
                        "에러 모니터링 없으면 사용자 이탈 원인을 모름",
                    ]
                    ForEach(reasons, id: \.self) { item in
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
        }
    }

    // MARK: - pg 1 첫 100 사용자

    private var users100Page: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("첫 100 사용자 확보 전략")
                    let channels: [(String, String, String, String)] = [
                        ("person.2.fill", "지인 네트워크", "창업팀 연락처 전수 연락. 직접 온보딩 제공. 정직한 피드백 요청.", "blue"),
                        ("bubble.left.fill", "커뮤니티", "타깃 사용자가 모이는 카카오 오픈채팅·네이버 카페·링크드인 그룹.", "purple"),
                        ("megaphone.fill", "콜드 아웃리치", "잠재 고객에게 직접 DM. 100명 연락 시 5-10명 전환이 정상.", "orange"),
                    ]
                    ForEach(channels, id: \.0) { icon, title, desc, _ in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08))
                                    .frame(width: 32, height: 32)
                                Image(systemName: icon)
                                    .font(.system(size: 14)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title)
                                    .font(BUFont.bodySmall.weight(.semibold))
                                    .foregroundStyle(BUColor.ink)
                                Text(desc)
                                    .font(BUFont.bodyCaption)
                                    .foregroundStyle(BUColor.inkSecondary)
                                    .lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("첫 100 사용자 목표 수치")
                    let metrics: [(String, String)] = [
                        ("활성 사용자 (WAU)", "30명 이상 (첫 4주)"),
                        ("NPS (순추천지수)", "30 이상"),
                        ("리텐션 (2주)", "40% 이상"),
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
                Toggle(isOn: $users100) {
                    Text("첫 100 사용자 확보 완료")
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("GTM 론칭 완료")
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("LaunchGtm") { LaunchGtmStageView() }
#endif
