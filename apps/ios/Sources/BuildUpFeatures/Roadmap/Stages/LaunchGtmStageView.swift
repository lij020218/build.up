//
//  LaunchGtmStageView.swift — GTM 론칭 (iOS 네이티브)
//
//  stageId: "launch-gtm"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents
import BuildUpData

public struct LaunchGtmStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "launch-gtm"

    @State private var page = 0

    @AppStorage("gtm.analytics")  private var analytics  = false
    @AppStorage("gtm.billing")    private var billing    = false
    @AppStorage("gtm.monitoring") private var monitoring = false
    @AppStorage("gtm.cs")         private var cs         = false
    @AppStorage("gtm.users100")   private var users100   = false
    @AppStorage("gtm.done")       private var done       = false

    private let pages = ["인프라 셋업", "첫 100 사용자"]

    public init() {}

    /// 게이트: GTM 채널 선정 — 필수 인프라 2개 이상 (애널리틱스/결제/모니터링/CS).
    private var canCompleteStage: Bool {
        let count = [analytics, billing, monitoring, cs].filter { $0 }.count
        return count >= 2
    }

    private var gtmChecksBinding: Binding<Set<String>> {
        Binding(
            get: {
                var s: Set<String> = []
                if analytics  { s.insert("analytics") }
                if billing    { s.insert("billing") }
                if monitoring { s.insert("monitoring") }
                if cs         { s.insert("cs") }
                return s
            },
            set: { new in
                analytics  = new.contains("analytics")
                billing    = new.contains("billing")
                monitoring = new.contains("monitoring")
                cs         = new.contains("cs")
            }
        )
    }

    private var advanceHint: String {
        let count = [analytics, billing, monitoring, cs].filter { $0 }.count
        switch count {
        case 0: return "필수 인프라 항목을 체크하세요"
        case 1: return "1/2 — 인프라 1개 더 체크"
        default: return "GTM 채널 선정 완료 — 다음 단계로"
        }
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "출시 스택 · GTM 전략",
            stageEyebrow: "단계 10 · GTM 론칭",
            helperText: "론칭 전에 측정 도구부터 — 보이지 않으면 개선할 수 없습니다. GTM = 제품을 시장에 내놓는 전략·인프라·첫 사용자.",
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
                .init(label: "1. 출시 스택 4종 셋업", detail: "분석(Mixpanel·Amplitude)·결제(Stripe)·에러(Sentry)·피드백(Canny)"),
                .init(label: "2. 첫 100명 확보 전략", detail: "Airbnb·Stripe·Marc Lou 패턴 — Do things that don't scale"),
                .init(label: "3. 런칭 채널 결정", detail: "웹·PH·HN·디스콰이엇·SEO 5축 비교 후 1~2개 집중"),
                .init(label: "4. 콘텐츠·Build in Public", detail: "트위터·블로그·뉴스레터 — 매출 70%+ 콘텐츠 기여 패턴"),
                ],
                verifyItems: [
                "보안 — Product Hunt·HN 출시 시 트래픽 폭증, OWASP Top 10·DDoS·Rate limit 사전 대비",
                "법적 — GDPR·개인정보보호법 사전 준수, 글로벌 출시 시 EU·미국 사용자 데이터 처리",
                "약관·환불 — 7일 이내 청약철회·환불 명시, SaaS 정기 결제도 cancel 룰 명확",
                "지재권 — 도메인·상표 사전 확보, 출시 후 squat 위험",
                "Product Hunt — 「런칭 1회」 룰, 두 번 시도 시 어카운트 정지 위험",
                "데이터 백업 — 출시 직후 데이터 손실 시 신뢰 회복 불가, 다중 백업 + 복구 시뮬",
                ],
                nextStageLabel: "런타임 운영",
                nextSummary: "출시 스택·첫 100명·콘텐츠 셋업 완료 → 런타임 운영 단계로 진입"
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
                    case 0: infraPage
                    default: users100Page
                    }
                }
            }
        }
    }

    // MARK: - pg 0 인프라 셋업

    private var infraPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUInteractiveChecklist(
                title: "필수 인프라 체크리스트",
                items: [
                    .init(id: "analytics",  label: "애널리틱스 셋업",       detail: "PostHog / Mixpanel / GA4 — 어떤 이벤트가 작동하는지 측정"),
                    .init(id: "billing",    label: "결제 시스템 연동",      detail: "Toss Payments / Stripe — 론칭 전 실 결제 테스트 필수"),
                    .init(id: "monitoring", label: "에러 모니터링",         detail: "Sentry + Slack 알림 — 사용자 이탈 원인 자동 추적"),
                    .init(id: "cs",         label: "CS 채널 셋업",          detail: "카카오톡 채널 / 이메일 자동응답 — 첫 사용자 응대 준비"),
                ],
                checked: gtmChecksBinding
            )

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
        }
    }
}

#if DEBUG
#Preview("LaunchGtm") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["launch-gtm"] }
    return LaunchGtmStageView().environment(store)
}
#endif
