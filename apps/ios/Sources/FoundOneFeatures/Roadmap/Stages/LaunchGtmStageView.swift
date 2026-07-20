//
//  LaunchGtmStageView.swift — GTM 론칭 (iOS 네이티브)
//
//  stageId: "launch-gtm"
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

// MARK: - Sub-industry 분기 (웹 SSOT: getRecommendedStack)
//
// startup-tech 클러스터 내부 sub-industry 별 권장 출시 스택.
// b2b-saas·ai-application 등 SaaS 트랙과 hardware-iot·biotech 등 물리 트랙은 도구가 다름.

private struct GtmStackRecommendation {
    let analyticsTip: String
    let billingTip: String
    let monitoringTip: String
    let csTip: String
}

private func gtmStack(for industryId: String) -> GtmStackRecommendation {
    let cid = StarterIndustryData.option(by: industryId)?.categoryId ?? ""
    // 기본 (B2C·B2B SaaS)
    let base = GtmStackRecommendation(
        analyticsTip: "PostHog (오픈소스 무료) / Mixpanel / GA4 — 5개 핵심 이벤트 + 퍼널 + 주간 대시보드",
        billingTip:   "Toss Payments (국내) / Stripe (글로벌) — 무료→유료 전환 트리거 + 환불 정책",
        monitoringTip: "Sentry (10분 셋업) + Slack 알림 — 사용자 이탈 원인 자동 추적",
        csTip:        "카카오톡 채널 (국내) / Intercom (글로벌) — 24시간 환영 메일 + 인앱 버튼"
    )
    guard cid == "startup-tech" else { return base }

    switch industryId {
    case "b2b-saas":
        return GtmStackRecommendation(
            analyticsTip: "PostHog + HubSpot — 계정·시트별 funnel, MRR 대시보드",
            billingTip:   "Stripe Billing — 시트 기반 + 사용량 기반 (usage-based) 하이브리드, ProRated",
            monitoringTip: "Sentry + PagerDuty + Statuspage — Enterprise 고객은 99.9% uptime 약속 필수",
            csTip:        "Intercom 또는 Zendesk — 계정 매니저 + 헬프센터 + 챗봇 자동응대"
        )
    case "ai-application":
        return GtmStackRecommendation(
            analyticsTip: "PostHog + Helicone (LLM 비용 추적) — 토큰·모델별 단가·전환율",
            billingTip:   "Stripe + Token meter — 사용량(토큰) 기반 + 무료 한도 명시",
            monitoringTip: "Sentry + LangSmith / Helicone — LLM 응답 품질·지연·실패율",
            csTip:        "Intercom + Slack Connect — 파워 유저 직접 채널"
        )
    case "fintech-startup":
        return GtmStackRecommendation(
            analyticsTip: "Amplitude / PostHog — PII 마스킹 + 감사 로그 보관 (PIPA·금융감독)",
            billingTip:   "Toss Payments + 한국 PG (KICC·이니시스) — 금융위 라이센스 동시 검토",
            monitoringTip: "Datadog + PagerDuty — 거래 실패 즉시 알람, 99.95% SLO",
            csTip:        "톡톡 + 1:1 콜센터 — 금융 분쟁 대비 통화 녹취·기록 의무"
        )
    case "healthtech-startup", "biotech-medtech":
        return GtmStackRecommendation(
            analyticsTip: "Mixpanel (HIPAA mode) / PostHog (BAA) — 환자 PII 분리",
            billingTip:   "Stripe (HIPAA BAA 가능) + 보험 청구 분리",
            monitoringTip: "Datadog + Sentry — MFDS 의료기기 등급별 로깅 의무",
            csTip:        "전화 + 채널 (의료 분쟁 대비 통화 녹취 6년 보관)"
        )
    case "hardware-iot":
        return GtmStackRecommendation(
            analyticsTip: "Mixpanel + 디바이스 telemetry (AWS IoT·Particle) — 펌웨어별 분기",
            billingTip:   "Stripe + WMS·물류 통합 — 펀딩→배송→A/S 트래킹",
            monitoringTip: "Sentry + Datadog + 디바이스 로그 (CloudWatch) — OTA 업데이트 실패율",
            csTip:        "톡톡 + RMA (반품·교환) 워크플로 — 하드웨어는 물리적 회수 절차 필수"
        )
    case "robotics-physical-ai":
        return GtmStackRecommendation(
            analyticsTip: "Mixpanel + ROS / Foxglove (로봇 텔레메트리)",
            billingTip:   "Stripe + 리스·구독 모델 — 로봇 유닛 단가 높아 분할 결제 표준",
            monitoringTip: "Datadog + 비상정지 알람 (PagerDuty) — 필드 사고 즉시 대응",
            csTip:        "전화·온사이트 서비스 — 로봇 고장 시 24h 출동 SLA"
        )
    case "semiconductor", "climate-energy":
        return GtmStackRecommendation(
            analyticsTip: "B2B funnel 위주 — HubSpot + Salesforce, 분석 도구 비중 낮음",
            billingTip:   "계약 기반 (PO/Invoice) — Stripe 보다 NetSuite·SAP 통합",
            monitoringTip: "팹·파일럿 라인 텔레메트리 (자체 MES 시스템)",
            csTip:        "고객 응대팀 (Field Application Engineer) — 영업·기술 통합"
        )
    case "security-startup":
        return GtmStackRecommendation(
            analyticsTip: "PostHog (self-hosted) + Datadog — Enterprise 보안 요건",
            billingTip:   "Stripe Enterprise + 연간 계약 (SOC2 보고서 제공)",
            monitoringTip: "Datadog + PagerDuty + Audit log (감사 추적 7년)",
            csTip:        "Intercom + SOC + 24/7 응대 SLA"
        )
    case "developer-tools":
        return GtmStackRecommendation(
            analyticsTip: "PostHog + Open Telemetry — 개발자는 PII 민감, opt-in 위주",
            billingTip:   "Stripe + 사용량 기반 (요청 수·빌드 분)",
            monitoringTip: "Sentry + Statuspage — 개발자는 API uptime 에 매우 민감",
            csTip:        "Discord / Slack Community — 개발자는 챗봇보다 직접 채널"
        )
    default:
        return base
    }
}

public struct LaunchGtmStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    private let stageId = "launch-gtm"

    private var stack: GtmStackRecommendation { gtmStack(for: industryId) }

    @State private var page = 0

    @AppStorage("gtm.analytics")  private var analytics  = false
    @AppStorage("gtm.billing")    private var billing    = false
    @AppStorage("gtm.monitoring") private var monitoring = false
    @AppStorage("gtm.cs")         private var cs         = false
    @AppStorage("gtm.users100")   private var users100   = false
    @AppStorage("gtm.done")       private var done       = false

    private var currentInputs: [String: String] {
        ["analytics": "\(analytics)", "billing": "\(billing)", "monitoring": "\(monitoring)", "cs": "\(cs)", "users100": "\(users100)", "done": "\(done)"]
    }

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
        if let dtk = DeepTechTrack.kind(forIndustryId: industryId) {
            deepTechShell(dtk)
        } else {
            standardBody
        }
    }

    // 딥테크·하드웨어: SW GTM 본문(Product Hunt·HN·앱스토어) 게이팅 → 트랙별 안내.
    private func deepTechShell(_ kind: DeepTechTrack) -> some View {
        BUStageShell(
            stageId: stageId,
            title: "출시 스택 · GTM 전략",
            stageEyebrow: "단계 10 · GTM 론칭",
            helperText: "당신의 트랙(하드웨어·딥테크) GTM 은 Product Hunt·HN 이 아니라 파일럿·디자인윈·규제입니다.",
            canAdvance: true,
            advanceHint: "트랙별 GTM 흐름 확인 — 다음 단계로",
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: { roadmapStore.advanceToNext(currentStageId: stageId, inputs: [:]) },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: [:]) }
        ) {
            DeepTechStageNoticeView(stage: .launch, kind: kind)
        }
    }

    private var standardBody: some View {
        BUStageShell(
            stageId: stageId,
            title: "출시 스택 · GTM 전략",
            stageEyebrow: "단계 10 · GTM 론칭",
            helperText: "론칭 전에 측정 도구부터 — 보이지 않으면 개선할 수 없습니다. GTM = 제품을 시장에 내놓는 전략·인프라·첫 사용자.",
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
                .init(label: "1. 출시 스택 4종 셋업", detail: "분석(PostHog·Mixpanel)·결제(토스페이먼츠·Stripe)·에러(Sentry)·피드백(Discord·Intercom)"),
                .init(label: "2. 첫 100명 확보 전략", detail: "Airbnb·Stripe·Marc Lou 패턴 — Do things that don't scale"),
                .init(label: "3. 런칭 채널 결정", detail: "웹·PH·HN·디스콰이엇·SEO 5축 비교 후 1~2개 집중"),
                .init(label: "4. 콘텐츠·Build in Public", detail: "트위터·블로그·뉴스레터 — 매출 70%+ 콘텐츠 기여 패턴"),
                ],
                verifyItems: [
                "보안 — Product Hunt·HN 출시 시 트래픽 폭증, OWASP Top 10·DDoS·Rate limit 사전 대비",
                "법적 — 개인정보보호법 준수 필수(수집·이용 동의, 인터뷰 녹음 사전동의 등). GDPR(EU)은 EU 사용자를 실제 겨냥해 서비스·마케팅할 때만 적용(단순 접속 가능만으로는 X) — 유럽 타깃 확장 시 처리방침·동의·EU 대리인 검토",
                "약관·환불 — 7일 이내 청약철회·환불 명시, SaaS 정기 결제도 cancel 룰 명확",
                "지재권 — 도메인·상표 사전 확보, 출시 후 squat 위험",
                "Product Hunt — 「런칭 1회」 룰, 두 번 시도 시 어카운트 정지 위험",
                "데이터 백업 — 출시 직후 데이터 손실 시 신뢰 회복 불가, 다중 백업 + 복구 시뮬",
                ],
                nextStageLabel: "런타임 운영",
                nextSummary: "출시 스택·첫 100명·콘텐츠 셋업 완료 → 런타임 운영 단계로 진입"
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
                title: "필수 인프라 체크리스트 (업종별 권장 스택)",
                items: [
                    .init(id: "analytics",  label: "애널리틱스 셋업",       detail: stack.analyticsTip),
                    .init(id: "billing",    label: "결제 시스템 연동",      detail: stack.billingTip),
                    .init(id: "monitoring", label: "에러 모니터링",         detail: stack.monitoringTip),
                    .init(id: "cs",         label: "CS 채널 셋업",          detail: stack.csTip),
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
                        ("D7 리텐션 (B2C)", "20% 이상"),
                        ("Sean Ellis PMF 테스트", "「매우 실망」 40% 이상"),
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
