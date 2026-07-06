//
//  MvpBuildStageView.swift — MVP 개발 (iOS 네이티브)
//
//  stageId: "mvp-build"
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct MvpBuildStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    private let stageId = "mvp-build"

    // 업종 정합(2026-07-02): 딥테크·하드웨어 MVP 는 Next.js·Vercel 이 아니라 프로토타입·벤치·시제.
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""

    @State private var page = 0

    @AppStorage("mvp.coreFlow")  private var coreFlow  = ""
    @AppStorage("mvp.techPath")  private var techPath  = ""
    @AppStorage("mvp.shipped")   private var shipped   = false
    @AppStorage("mvp.ipFiled")   private var ipFiled   = false
    @AppStorage("mvp.done")      private var done      = false

    private let pages = ["핵심 워크플로우", "MVP 개발", "기술 경로 선택"]

    public init() {}

    /// 게이트: MVP 범위 정의 (코어 플로우 입력 + 기술 경로 선택).
    private var canCompleteStage: Bool {
        !coreFlow.trimmingCharacters(in: .whitespaces).isEmpty && !techPath.isEmpty
    }

    private var advanceHint: String {
        if coreFlow.trimmingCharacters(in: .whitespaces).isEmpty { return "핵심 워크플로우를 정의하세요" }
        if techPath.isEmpty { return "기술 경로를 선택하세요" }
        return "MVP 범위 정의 — 다음 단계로"
    }

    public var body: some View {
        if let dtk = DeepTechTrack.kind(forIndustryId: industryId) {
            deepTechShell(dtk)
        } else {
            standardBody
        }
    }

    // 딥테크·하드웨어: SW MVP 본문 게이팅 → 트랙별 안내 단일 페이지.
    private func deepTechShell(_ kind: DeepTechTrack) -> some View {
        BUStageShell(
            stageId: stageId,
            title: "MVP 구축 · IP 보호",
            stageEyebrow: "단계 9 · MVP 개발",
            helperText: "당신의 트랙(하드웨어·딥테크)은 SW MVP 와 절차가 다릅니다. 아래 흐름 + 전용 단계로 진행하세요.",
            canAdvance: true,
            advanceHint: "트랙별 MVP 흐름 확인 — 다음 단계로",
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: { roadmapStore.advanceToNext(currentStageId: stageId, inputs: [:]) },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: [:]) }
        ) {
            DeepTechStageNoticeView(stage: .mvp, kind: kind)
        }
    }

    private var standardBody: some View {
        BUStageShell(
            stageId: stageId,
            title: "MVP 구축 · IP 보호",
            stageEyebrow: "단계 9 · MVP 개발",
            helperText: "MVP = 가장 작은 제품으로 가장 큰 가정을 검증. 6주 안에 실제 사용자에게 전달하는 것이 목표.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(currentStageId: stageId, inputs: ["techPath": techPath])
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: { roadmapStore.saveStageEdit(currentStageId: stageId, inputs: ["techPath": techPath]) },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. MVP 범위 정의", detail: "「북극성 가설 1개 검증」에 필요한 최소 기능만 — Wide vs Deep 트레이드오프"),
                .init(label: "2. 빌드 방법 결정", detail: "AI 앱 빌더(Lovable·v0)·AI 코딩 어시스턴트(Cursor·Claude Code) 기반 프론트·백엔드 스택 확정"),
                .init(label: "3. 1차 MVP 출시", detail: "내부 알파 → 클로즈드 베타 → 오픈 베타 3단계 + 분석 셋업"),
                .init(label: "4. 첫 사용자 10명", detail: "리드 고객 10명 onboard + 1:1 사용자 인터뷰 + 핵심 지표 측정"),
                ],
                verifyItems: [
                "PMF 시그널 — 「제거하면 절망적」 답변 40%+ 가 PMF 신호 (Sean Ellis Test), 미달 시 GTM 전 재정의",
                "보안 — 출시 전 OWASP Top 10 점검 + SQL injection·XSS·CSRF 사전 방어",
                "개인정보 — 수집·이용·제공·파기 4항목 명문화. 절차 위반은 과태료, 유출·불법 제공 등 중대 위반은 매출 3% 이내 과징금",
                "이용약관·환불 — 7일 이내 청약철회·환불 조항 명시, 디지털콘텐츠 예외 조건 명문화",
                "지재권 — 브랜드명·로고 상표권 사전 출원(선점 필수). 소스코드·콘텐츠 저작권은 창작 즉시 자동 발생(무방식주의 — 등록 불요, 증빙만 관리). 특허(핵심 알고리즘 — 신규성·진보성)·디자인권(화면 UI — 신규성·창작성)은 요건 충족 시에만 공개 전 출원 (노출 시 신규성 상실, 한국은 12개월 공지예외)",
                "데이터 백업 — DB·파일 다중 백업·복구 시뮬, 출시 후 데이터 손실 시 신뢰 회복 불가",
                ],
                nextStageLabel: "런칭 GTM",
                nextSummary: "MVP 출시·첫 사용자·PMF 신호 → 런칭 GTM 단계로 진입"
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
                    case 0: workflowPage
                    case 1: buildPage
                    default: techPathPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 핵심 워크플로우

    private var workflowPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("핵심 워크플로우 정의")
                    TextField("사용자가 제품으로 완수하는 핵심 행동 3단계를 서술 (예: 영수증 사진 → 자동 분류 → 리포트 확인)", text: $coreFlow, axis: .vertical)
                        .font(BUFont.bodySmall)
                        .lineLimit(4)
                        .padding(.horizontal, 10).padding(.vertical, 10)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("MVP 범위 결정 — 버릴 것 먼저")
                    let cuts = [
                        "어드민 페이지 — MVP 단계에서는 구글 스프레드시트로 대체",
                        "알림·이메일 — 수동으로 대체 가능하면 나중에",
                        "다국어·다크모드 — 첫 100 사용자에겐 불필요",
                        "소셜 로그인 — 이메일 로그인으로 충분",
                    ]
                    ForEach(cuts, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "xmark.circle").font(.system(size: 13)).foregroundStyle(BUColor.inkMuted)
                            Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 MVP 개발

    private var buildPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("MVP 6주 로드맵")
                    let weeks: [(String, String)] = [
                        ("W1", "기술 스택 선정·환경 셋업"),
                        ("W2-3", "핵심 기능 개발"),
                        ("W4", "내부 테스트·버그 수정"),
                        ("W5", "베타 사용자 5명 온보딩"),
                        ("W6", "피드백 반영·v1 배포"),
                    ]
                    ForEach(weeks, id: \.0) { week, task in
                        HStack(spacing: BUSpacing.sm) {
                            Text(week)
                                .font(BUFont.eyebrow.weight(.bold))
                                .foregroundStyle(BUColor.midnight)
                                .frame(width: 36, alignment: .leading)
                            Text(task).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("완료 체크")
                    Toggle(isOn: $shipped) {
                        Text("MVP 실제 사용자에게 배포 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Toggle(isOn: $ipFiled) {
                        Text("핵심 기술 IP 출원 완료 (또는 해당 없음)").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("추천 기술 스택 (SaaS 기준)")
                    let stack: [(String, String)] = [
                        ("Frontend", "Next.js / React Native"),
                        ("Backend", "Supabase / Firebase (빠른 MVP)"),
                        ("결제", "Toss Payments / Stripe"),
                        ("모니터링", "Sentry + PostHog"),
                    ]
                    ForEach(stack, id: \.0) { label, value in
                        HStack(spacing: BUSpacing.sm) {
                            Text(label)
                                .font(BUFont.eyebrow)
                                .foregroundStyle(BUColor.inkMuted)
                                .frame(width: 64, alignment: .leading)
                            Text(value).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 2 기술 경로 선택

    private var techPathPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                Text("MVP 이후 어떤 기술 경로로 진행하나요? 선택에 따라 다음 단계가 달라집니다.")
                    .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
            }

            let options: [(String, String, String, String)] = [
                ("saas", "SaaS·소프트웨어", "app.badge", "웹·앱 기반 서비스. 즉시 배포·반복 가능. 다음: GTM 론칭"),
                ("hardware", "하드웨어·IoT", "cpu", "실물 제품. EVT→DVT→PVT 프로토타입 단계 필요. 개발 기간 2-3배"),
                ("lab", "로봇·바이오", "flask", "연구소 기반. 현장 테스트·임상시험·규제 허가 필요. 5-10년 경로"),
                ("semi", "반도체·클린테크", "waveform.path.ecg", "EDA 설계·테이프아웃 필요. 초기 비용 수억~수십억. 전문 파운드리 파트너 필수"),
            ]

            ForEach(options, id: \.0) { id, title, icon, desc in
                let isSelected = techPath == id
                Button {
                    techPath = isSelected ? "" : id
                } label: {
                    HStack(alignment: .top, spacing: BUSpacing.sm) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(isSelected ? BUColor.midnight.opacity(0.12) : BUColor.midnight.opacity(0.06))
                                .frame(width: 40, height: 40)
                            Image(systemName: icon).font(.system(size: 18)).foregroundStyle(BUColor.midnight)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text(title).font(BUFont.bodySmall.weight(.bold))
                                .foregroundStyle(isSelected ? BUColor.midnightDeep : BUColor.ink)
                            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                .multilineTextAlignment(.leading)
                        }
                        Spacer()
                        if isSelected {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 16)).foregroundStyle(BUColor.midnight)
                        }
                    }
                    .padding(BUSpacing.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(isSelected ? BUColor.midnight.opacity(0.06) : BUColor.surfaceElevated, in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                            .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }
}

#if DEBUG
#Preview("MvpBuild") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["mvp-build"] }
    return MvpBuildStageView().environment(store)
}
#endif
