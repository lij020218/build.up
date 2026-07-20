//
//  StartupFoundationStageView.swift — 스타트업 기초 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/startup/StartupFoundationStage.tsx
//  stageId: "startup-foundation"
//
//  2026-07-21 웹·iOS 페이지 구조 통일:
//    웹 6페이지 ["핵심 원칙", "1. 문제 정의", "2. 팀 구성", "3. 법인 vs 개인", "사례", "마무리"] 1:1.
//    pg 0 — 내 운영 모드(ModePathCard 미러) + 핵심 원칙 "먼저 만들고, 법인은 나중에"
//    pg 1 — 문제 정의 (Musk/Thiel 프레임 + AI 활용법 + 나의 문제 정의 입력)
//    pg 2 — 팀 구성 (운영 모드별 why/actions/decisions/resources)
//    pg 3 — 법인 vs 개인 (의사결정만 — 권장 + 4가지 트리거 + 다음 단계 안내)
//    pg 4 — 사례 (모드별 검증 5사례 + 한국 사례)
//    pg 5 — 마무리 (BUStageShell wrapup)
//
//  inputs: problemStatement (웹 SSOT 키 — CustomerDiscovery·AI 라우트가 읽음) + problemConfirmed.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneData

public struct StartupFoundationStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @State private var page = 0
    private let stageId = "startup-foundation"

    @AppStorage("sf.problem")          private var problem          = ""
    @AppStorage("sf.problemConfirmed") private var problemConfirmed = false
    // 웹 SSOT 미러: 운영 모드별 콘텐츠 (예산 단계에서 설정한 모드 공유)
    @AppStorage("stage.budget.startupOperatingMode") private var startupMode = "bootstrap"
    /// 페이지 0 모드 카드의 미리보기 — 저장 모드(startupMode)는 바꾸지 않음 (웹 ModePathCard previewMode 미러).
    @State private var previewMode: String? = nil

    private var displayMode: String { previewMode ?? startupMode }
    private var modeLabel: String { StartupFoundationModeContent.modeLabel(for: startupMode) }

    // 웹 6페이지 1:1
    private let pages = ["핵심 원칙", "1. 문제 정의", "2. 팀 구성", "3. 법인 vs 개인", "사례", "마무리"]

    public init() {}

    /// 게이트: 웹과 동일 — 문제 정의 10자 이상 + 확인.
    private var problemReady: Bool {
        problem.trimmingCharacters(in: .whitespaces).count >= 10
    }

    private var canCompleteStage: Bool {
        problemReady && problemConfirmed
    }

    private var advanceHint: String {
        if !problemReady { return "「1. 문제 정의」에서 나의 문제 정의를 10자 이상 입력하세요" }
        if !problemConfirmed { return "문제 정의 입력 아래 [확인] 버튼을 눌러 확정하세요" }
        return "문제 정의 완료 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "먼저 만들고, 법인은 나중에",
            stageEyebrow: "단계 1 · 스타트업 기초",
            helperText: "지금 당장 필요한 건 법인이 아니라, 해결할 문제와 만들 제품입니다. 문제 정의 → 팀 구성 → 법인 설립 순서로 진행하세요.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(
                    currentStageId: stageId,
                    inputs: ["problemStatement": problem, "problemConfirmed": problemConfirmed ? "true" : "false"]
                )
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: stageId,
                    inputs: ["problemStatement": problem, "problemConfirmed": problemConfirmed ? "true" : "false"])
            },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 공동창업자·지분 합의", detail: "역할·책임·지분·vesting 4년 + cliff 2년(주총 결의일부터 2년 재직 법정 — 상법 §340-4, 벤처기업도 완화 불가) 명문화"),
                .init(label: "2. 시장·문제 정의", detail: "타깃 고객 ICP + 핵심 문제 3개 + 가설 1줄 정리"),
                .init(label: "3. 법인 형태 결정", detail: "개인사업자 vs 법인 의사결정 (실제 등록은 다음 '법인 설립·등록' 단계)"),
                .init(label: "4. 검증 사례·전략 학습", detail: "본인 모드(인디/부트스트랩/시드/시리즈A) 5개 검증 사례 검토 + 교훈 3개 메모"),
                ],
                verifyItems: [
                "공동창업자 지분 — vesting 없이 지분 분배 시 분쟁 1순위. 스톡옵션은 주총 결의일부터 2년 재직해야 행사 가능(상법 §340-4)이며 벤처기업도 이 2년을 단축 못 함. 벤처 예외는 '사망·정년·귀책 없는 퇴직 시 상실 안 됨'일 뿐 cliff 단축 아님",
                "지분 합의 — 시간·자본·아이디어 기여도 별도 명문화, 모호한 합의는 분쟁 후 해결 불가",
                "노무·출자 구조 — 법인 설립 전이므로 공동창업자는 근로계약이 아닌 동업 관계. 초기 자본·용역 출자 비율 명시 + 법인 설립 후 임원 등기·근로/등기임원 계약 전환 조건 사전 합의",
                "지분 매수권 — 퇴사 시 회사가 매수권 보유 명문화, 미명시 시 외부에 팔릴 위험",
                "IP 양도 — 공동창업자·초기 직원 모두 IP 회사 양도 계약, 미체결 시 IP 분쟁",
                "비밀유지 — NDA·경업금지 사전 체결, 핵심 정보 유출 방지 (5년 이내 한계)",
                ],
                nextStageLabel: "고객 발견",
                nextSummary: "공동창업자·지분·비전·팀 셋업 완료 → 고객 발견 단계로 진입"
            ),
            currentPage: page,
            onNextPage: { withAnimation { page += 1 } },
            totalPages: pages.count
        ) {
            VStack(alignment: .leading, spacing: 16) {
                Text("↓ 심화 참고 — 모든 모드에 공통되는 원칙·체크리스트·검증된 사례")
                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)

                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )

                Group {
                    switch page {
                    case 0: principlePage
                    case 1: problemPage
                    case 2: teamPage
                    case 3: corpDecisionPage
                    case 4: casesPage
                    default: EmptyView()  // 마무리 페이지 — BUStageShell 이 wrapup 표시
                    }
                }
            }
        }
    }

    // MARK: - pg 0 핵심 원칙 (웹 PAGE 0 — ModePathCard + 핵심 원칙 카드)

    private var principlePage: some View {
        let guide = StartupFoundationModeContent.stageGuide(for: displayMode)
        return VStack(alignment: .leading, spacing: BUSpacing.md) {
            // 내 운영 모드 (웹 ModePathCard 미러 — 미리보기 칩, 저장 모드 유지)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("내 운영 모드")
                    HStack(spacing: 8) {
                        HStack(spacing: 5) {
                            Image(systemName: "checkmark").font(.system(size: 11, weight: .bold))
                            Text(modeLabel).font(BUFont.bodySmall.weight(.bold))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12).padding(.vertical, 7)
                        .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        Spacer()
                        Text("변경: 예산 설정 단계").font(.system(size: 10.5)).foregroundStyle(BUColor.inkMuted)
                    }
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach([("indie", "1인 인디"), ("bootstrap", "부트스트랩"), ("seed", "시드"), ("seriesA", "시리즈A+")], id: \.0) { key, label in
                                let active = displayMode == key
                                let isSaved = startupMode == key
                                Button {
                                    withAnimation(.easeInOut(duration: 0.18)) { previewMode = (key == startupMode) ? nil : key }
                                } label: {
                                    Text(label + (isSaved ? " ✓" : ""))
                                        .font(.system(size: 11, weight: active ? .bold : .medium))
                                        .foregroundStyle(active ? .white : BUColor.inkSecondary)
                                        .padding(.horizontal, 10).padding(.vertical, 5)
                                        .background(active ? BUColor.midnight : BUColor.midnight.opacity(0.06), in: Capsule())
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    Text("✓ = 저장된 내 모드. 다른 칩은 미리보기만 — 눌러도 저장 모드는 바뀌지 않습니다.")
                        .font(.system(size: 10.5)).foregroundStyle(BUColor.inkMuted)

                    // WHY
                    Divider().opacity(0.5)
                    BUEyebrow("왜 이 단계가 필요한가")
                    Text(guide.why).font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            // HOW — 핵심 행동
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("이 단계에서 해야 할 핵심 행동")
                    ForEach(guide.actions.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08))
                                    .frame(width: 26, height: 26)
                                Text("\(i + 1)").font(.system(size: 12, weight: .heavy)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(guide.actions[i].label).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                                    .fixedSize(horizontal: false, vertical: true)
                                Text(guide.actions[i].detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Spacer()
                        }
                    }
                }
            }

            // PACE + PITFALL + EVIDENCE
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "clock").font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.midnight).padding(.top, 2)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("일정·규모 기준").font(BUFont.eyebrow).foregroundStyle(BUColor.midnight)
                            Text(guide.pace).font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "exclamationmark.triangle").font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.danger).padding(.top, 2)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("이 모드의 흔한 함정").font(BUFont.eyebrow).foregroundStyle(BUColor.danger)
                            Text(guide.pitfall).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "quote.opening").font(.system(size: 11)).foregroundStyle(BUColor.inkMuted).padding(.top, 3)
                        Text(guide.evidence).font(BUFont.bodyCaption.italic()).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }

            // 핵심 원칙 — 먼저 만들고, 법인은 나중에
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("핵심 원칙")
                    Text("먼저 만들고, 법인은 나중에.")
                        .font(BUFont.cardTitleSmall).foregroundStyle(BUColor.ink)
                    Text("Facebook은 하버드 기숙사에서 런칭한 후 6개월 뒤에 법인을 세웠습니다. 배달의민족은 앱 출시 5개월 후에야 회사를 설립했습니다. Stripe는 \"노트북 줘봐\"라며 직접 설치해주는 것부터 시작했습니다. 지금 당장 필요한 건 법인이 아니라, 해결할 문제와 만들 제품입니다.")
                        .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                    quoteBox("\"스타트업 아이디어를 얻는 방법은 스타트업 아이디어를 생각하는 게 아니라, 문제를 찾는 것이다. 가능하면 당신 자신의 문제를.\"", "Paul Graham, Y Combinator")
                    quoteBox("\"가장 위험한 것은 시장이 원하지 않는 것을 만드는 것이다. 실패한 스타트업의 42%가 이것 때문이다.\"", "CB Insights, 스타트업 실패 분석")
                }
            }
        }
    }

    private func quoteBox(_ quote: String, _ author: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            RoundedRectangle(cornerRadius: 2).fill(BUColor.midnight.opacity(0.15)).frame(width: 3)
            VStack(alignment: .leading, spacing: 4) {
                Text(quote).font(BUFont.bodyCaption.italic()).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                Text("— \(author)").font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.inkMuted)
            }
        }
        .padding(BUSpacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    // MARK: - pg 1 문제 정의 (웹 PAGE 1 1:1)

    private var problemPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            // STEP 1 — 핵심 문제 정의 (First Principles)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle().fill(BUColor.midnight).frame(width: 24, height: 24)
                            Text("1").font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                        }
                        Text("해결할 문제를 한 문장으로 정의하세요")
                            .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    }
                    Text("Elon Musk는 로켓 비용이 비싼 이유를 원자재 가격까지 분해했습니다 (재료비 = 가격의 2%). Peter Thiel은 \"대부분의 사람들이 동의하지 않는, 당신이 아는 중요한 진실은 무엇인가?\"라고 묻습니다. 이 질문에 답하세요.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                    let tips: [(String, String, String)] = [
                        ("lightbulb", "나 자신의 문제에서 시작하세요", "YC가 선호하는 아이디어는 창업자가 직접 겪는 문제입니다. 상상이 아닌 경험에서 출발하세요"),
                        ("magnifyingglass", "\"지금 이걸 누가 원하는가?\" 답할 수 있어야 합니다", "많은 사람이 조금 원하는 것보다, 적은 사람이 절실하게 원하는 것을 선택하세요"),
                        ("bolt", "기존 솔루션의 비용을 분해하세요", "Musk 방식: 재료비·인건비·유통비를 분리하면 10배 싸게 만들 수 있는 지점이 보입니다"),
                    ]
                    ForEach(tips, id: \.1) { icon, title, desc in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Image(systemName: icon).font(.system(size: 13)).foregroundStyle(BUColor.midnight).frame(width: 18).padding(.top, 2)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                    .fixedSize(horizontal: false, vertical: true)
                                Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .padding(BUSpacing.xs)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                    VStack(alignment: .leading, spacing: 5) {
                        Text("AI 활용법").font(BUFont.eyebrow).foregroundStyle(BUColor.midnight)
                        Text("\"나는 [분야]에서 [타깃]의 [고통]을 해결하려 해. 1) 이 문제가 충분히 구체적인지, 2) 현재 사람들이 어떻게 해결하고 있는지, 3) 기존 솔루션의 비용 구조를 원자재 수준까지 분해해줘. 4) Peter Thiel의 '비밀' 프레임워크로 이 기회를 평가해줘.\"")
                            .font(BUFont.bodyCaption.italic()).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(BUSpacing.sm)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
            }

            // 문제 정의 입력 + 확인 (웹 "나의 문제 정의" 1:1)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("나의 문제 정의")
                    TextField("예: \"소상공인은 매일 경영 데이터를 분석할 시간이 없다. 기존 솔루션(세무사, 엑셀)은 월 1회 사후 분석만 가능하고, 비용이 월 30만원 이상이다.\"", text: $problem, axis: .vertical)
                        .font(BUFont.bodySmall)
                        .lineLimit(4...8)
                        .padding(.horizontal, 10).padding(.vertical, 10)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    HStack(spacing: 8) {
                        Button {
                            guard problemReady else { return }
                            problemConfirmed = true
                        } label: {
                            Text(problemConfirmed ? "✓ 확인됨" : "확인")
                                .font(BUFont.bodySmall.weight(.semibold))
                                .foregroundStyle(problemReady ? .white : BUColor.inkMuted)
                                .padding(.horizontal, 20).padding(.vertical, 8)
                                .background(problemReady ? BUColor.midnight : BUColor.ink.opacity(0.06),
                                            in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        Text("10자 이상 입력 후 확인을 누르면 체크리스트에 자동 반영됩니다")
                            .font(.system(size: 10.5)).foregroundStyle(BUColor.inkMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
    }

    // MARK: - pg 2 팀 구성 (웹 PAGE 2 — 운영 모드별 구체 가이드)

    private var teamPage: some View {
        let c = StartupFoundationModeContent.content(for: startupMode)
        return VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        ZStack {
                            Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                            Text("2").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                        }
                        Text(c.headline).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Text("운영 모드 기반 — 변경하려면 「핵심 원칙」 페이지의 모드 카드 참고")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                    Divider().opacity(0.5)
                    BUEyebrow("왜 이 단계가 필요한가")
                    ForEach(c.why, id: \.self) { w in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            Text(w).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("어떻게 해야 하는가")
                    ForEach(c.actions) { a in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(a.label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text(a.detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("이 모드에서 꼭 결정해야 할 것")
                    ForEach(c.decisions) { d in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(d.item).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text("→ \(d.recommendation)").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("추천 도구·커뮤니티")
                    ForEach(c.resources) { r in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            (Text(r.name).font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.ink)
                             + Text(" — \(r.desc)").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary))
                                .lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 3 법인 vs 개인 (웹 PAGE 3 — 의사결정만)

    private var corpDecisionPage: some View {
        let g = StartupFoundationModeContent.decisionGuide(for: startupMode)
        return VStack(alignment: .leading, spacing: BUSpacing.md) {
            // 헤더 + 모드별 권장
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        ZStack {
                            Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                            Text("3").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                        }
                        Text("법인 vs 개인사업자 — 의사결정만").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    }
                    Text("이 단계에서는 어느 형태로 시작할지만 결정합니다. 실제 등록·KIPRIS·과세유형·약관 등의 절차는 다음 '법인 설립·등록' 단계에서 처리합니다.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                    VStack(alignment: .leading, spacing: 5) {
                        HStack(spacing: 6) {
                            Text("\(modeLabel) 권장").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                                .padding(.horizontal, 8).padding(.vertical, 2)
                                .background(BUColor.midnight, in: Capsule())
                            Text(g.recommend == "sole" ? "개인사업자" : "법인").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.midnightDeep)
                        }
                        Text(g.headline).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(g.reason).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(BUSpacing.sm)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                    // 결정 트리거 (공통)
                    BUEyebrow("법인이 필요한 시점 — 4가지 트리거 중 하나라도 해당 시")
                    let triggers: [(String, String)] = [
                        ("(a) 외부 투자 (시드·VC·엔젤)", "투자 = 주식 매입. 개인사업자는 주식 발행 불가."),
                        ("(b) 공동창업자 + 지분 합의", "지분 = 주식. SHA 효력은 법인에서만 성립."),
                        ("(c) 첫 정규직 채용", "4대보험·근로기준법 적용 + 직원 스톡옵션 부여."),
                        ("(d) 매출 7억+ 또는 순이익 2억+", "성실신고 대상 전환 + 건강보험 부담 폭발 — 법인이 절세."),
                    ]
                    ForEach(triggers, id: \.0) { trigger, reason in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(trigger).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text(reason).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                        .padding(BUSpacing.xs)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(BUColor.ink.opacity(0.025), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                }
            }

            // Cross-reference: 다음 단계 안내
            BUCard(.card) {
                HStack(alignment: .top, spacing: BUSpacing.sm) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .fill(BUColor.midnight.opacity(0.08))
                            .frame(width: 30, height: 30)
                        Image(systemName: "arrow.right").font(.system(size: 13, weight: .semibold)).foregroundStyle(BUColor.midnight)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("실제 등록·IP·과세 절차는 → '법인 설립·등록' 단계에서")
                            .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                            .fixedSize(horizontal: false, vertical: true)
                        Text("여기서는 의사결정만. 다음 절차는 모두 다음 단계에서 다룹니다:")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        ForEach([
                            "홈택스 사업자등록 + 법인 등기 절차",
                            "KIPRIS·USPTO 트레이드마크·특허 출원",
                            "간이과세 vs 일반과세 vs 법인세 — 과세 유형 결정",
                            "보안·약관·개인정보 처리방침",
                            "헬프미·ZUZU·자비스 등 등록 대행 도구",
                        ], id: \.self) { item in
                            HStack(alignment: .top, spacing: 6) {
                                Circle().fill(BUColor.midnight).frame(width: 3.5, height: 3.5).padding(.top, 5)
                                Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 4 사례 (웹 PAGE 4 — SuccessCasesShowcase + 한국 사례)

    private var casesPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            // 풀-사이즈 사례 쇼케이스 — 현재 모드의 5개 검증된 전설 founders/회사
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "trophy").font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.midnight)
                        Text("\(modeLabel) 전설 사례").font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight)
                    }
                    Text(StartupFoundationModeContent.casesHeadline(for: startupMode))
                        .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                    ForEach(StartupFoundationModeContent.successCases(for: startupMode)) { c in
                        successCaseCard(c)
                    }
                }
            }

            // 영감용 한국 사례 (보조)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("한국 사례 — 작게 시작한 전설들")
                    ForEach(StartupFoundationModeContent.koreanCases, id: \.name) { s in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text(s.year)
                                .font(.system(size: 10.5, weight: .bold)).foregroundStyle(BUColor.midnight)
                                .monospacedDigit()
                                .padding(.horizontal, 8).padding(.vertical, 2)
                                .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(s.name).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                                Text(s.story).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                        .padding(BUSpacing.xs)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                }
            }
        }
    }

    private func successCaseCard(_ c: SFSuccessCase) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            // 회사명 + 시작 연도 + 산업
            Text(c.name).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.midnight)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 6) {
                Text("\(String(c.startYear))~")
                    .font(.system(size: 10.5, weight: .bold)).foregroundStyle(BUColor.midnight)
                    .monospacedDigit()
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
                Text(c.industry)
                    .font(.system(size: 10.5, weight: .semibold)).foregroundStyle(BUColor.inkSecondary)
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(BUColor.ink.opacity(0.04), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
            }
            // 창업자 + 위치
            HStack(spacing: 10) {
                HStack(spacing: 4) {
                    Image(systemName: "person").font(.system(size: 9, weight: .semibold))
                    Text(c.founder).font(.system(size: 11, weight: .semibold))
                }
                .foregroundStyle(BUColor.inkSecondary)
                HStack(spacing: 4) {
                    Image(systemName: "mappin.and.ellipse").font(.system(size: 9))
                    Text(c.location).font(.system(size: 11))
                }
                .foregroundStyle(BUColor.inkMuted)
            }
            // 한 줄 요약
            Text(c.tagline).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
            // 메트릭 그리드
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 6), GridItem(.flexible(), spacing: 6)], spacing: 6) {
                ForEach(c.metrics) { m in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(m.label).font(.system(size: 9.5, weight: .bold)).foregroundStyle(BUColor.inkMuted)
                            .lineLimit(1).minimumScaleFactor(0.8)
                        Text(m.value).font(.system(size: 12, weight: .bold)).foregroundStyle(BUColor.midnight)
                            .monospacedDigit()
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.horizontal, 10).padding(.vertical, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
            // 교훈
            HStack(alignment: .top, spacing: 10) {
                RoundedRectangle(cornerRadius: 2).fill(BUColor.midnight.opacity(0.3)).frame(width: 3)
                (Text("핵심 교훈: ").font(BUFont.bodyCaption.weight(.bold)).foregroundColor(BUColor.midnight)
                 + Text(c.lesson).font(BUFont.bodyCaption).foregroundColor(BUColor.inkSecondary))
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(BUSpacing.xs)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            // 출처
            if let url = URL(string: c.sourceUrl) {
                Link(destination: url) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.up.right").font(.system(size: 8, weight: .bold))
                        Text(c.sourceLabel).font(.system(size: 11, weight: .medium))
                    }
                    .foregroundStyle(BUColor.inkMuted)
                }
            }
        }
        .padding(BUSpacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BUColor.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(BUColor.midnight.opacity(0.10), lineWidth: 1)
        )
    }
}

#if DEBUG
#Preview("StartupFoundation") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["startup-foundation"] }
    return StartupFoundationStageView().environment(store)
}
#endif
