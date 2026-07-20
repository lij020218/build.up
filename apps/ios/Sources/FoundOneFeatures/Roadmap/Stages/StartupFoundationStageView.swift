//
//  StartupFoundationStageView.swift — 스타트업 기초 (iOS 네이티브)
//
//  stageId: "startup-foundation"
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

    @AppStorage("sf.problem")   private var problem   = ""
    @AppStorage("sf.targetUser") private var targetUser = ""
    @AppStorage("sf.corpType")  private var corpType  = ""
    @AppStorage("sf.done")      private var done      = false
    // 웹 SSOT 미러: 운영 모드별 팀 구성 콘텐츠 (예산 단계에서 설정한 모드 공유)
    @AppStorage("stage.budget.startupOperatingMode") private var startupMode = "bootstrap"

    private var modeLabel: String {
        ["indie": "1인 인디", "bootstrap": "부트스트랩", "seed": "시드", "seriesA": "시리즈A+"][startupMode] ?? "부트스트랩"
    }

    private let pages = ["왜 중요한가", "문제 정의", "창업팀 정렬", "마무리"]

    public init() {}

    /// 게이트: 문제 정의 + 타깃 사용자 입력 완료.
    private var canCompleteStage: Bool {
        !problem.trimmingCharacters(in: .whitespaces).isEmpty &&
        !targetUser.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private var advanceHint: String {
        let hasProblem = !problem.trimmingCharacters(in: .whitespaces).isEmpty
        let hasUser = !targetUser.trimmingCharacters(in: .whitespaces).isEmpty
        if !hasProblem && !hasUser { return "핵심 문제·타깃 사용자를 입력하세요" }
        if !hasProblem { return "핵심 문제를 입력하세요" }
        if !hasUser { return "타깃 사용자를 입력하세요" }
        return "문제 정의 완료 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "창업팀·법인 기본 구조",
            stageEyebrow: "단계 1 · 스타트업 기초",
            helperText: "스타트업 실패의 42%는 시장이 없는 문제를 풀었기 때문. 팀·문제·시장 세 가지가 먼저입니다.",
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(
                    currentStageId: stageId,
                    inputs: ["problem": problem, "targetUser": targetUser, "corpType": corpType]
                )
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: stageId,
                    inputs: ["problem": problem, "targetUser": targetUser, "corpType": corpType])
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
                BUWizardPageNav(
                    page: page,
                    totalPages: pages.count,
                    labels: pages,
                    onChange: { newPage in withAnimation(.easeInOut(duration: 0.22)) { page = newPage } }
                )

                Group {
                    switch page {
                    case 0: whyPage
                    case 1: problemPage
                    case 2: teamPage
                    default: EmptyView()  // 마무리 페이지 — BUStageShell 이 wrapup 표시
                    }
                }
            }
        }
    }

    // MARK: - pg 0 왜 중요한가

    private var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("기초 구축 3요소")
                    let items: [(String, String, String)] = [
                        ("lightbulb", "문제 명확화", "\"우리는 X라는 문제를 Y가 겪는 걸 봤다\" — 한 문장으로 완성"),
                        ("person.2", "팀 정렬", "공동창업자 역할·지분·풀타임 여부를 첫 주에 명문화"),
                        ("building.2", "법인 형태", "개인사업자 vs 법인 — 투자 받을 계획이면 법인 필수"),
                    ]
                    ForEach(items, id: \.0) { icon, title, detail in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(BUColor.midnight.opacity(0.08))
                                    .frame(width: 32, height: 32)
                                Image(systemName: icon)
                                    .font(.system(size: 14)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer()
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 문제 정의

    private var problemPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("문제 정의 캔버스")
                    VStack(alignment: .leading, spacing: 4) {
                        Text("핵심 문제").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        TextField("\"X는 Y할 때 Z 때문에 어려움을 겪는다\"", text: $problem, axis: .vertical)
                            .font(BUFont.bodySmall)
                            .lineLimit(4)
                            .padding(.horizontal, 10).padding(.vertical, 10)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("타깃 사용자").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        TextField("직업·연령·상황 구체적으로", text: $targetUser)
                            .font(BUFont.bodySmall)
                            .padding(.horizontal, 10).padding(.vertical, 10)
                            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("좋은 문제의 4가지 기준")
                    let criteria = [
                        "빈도 높음 — 매일 혹은 매주 발생하는 문제",
                        "고통 심함 — 현재 해결책이 너무 불편하거나 비쌈",
                        "시장 있음 — 이 문제를 가진 사람이 100만 명 이상",
                        "우리만의 강점 — 왜 우리 팀이 이 문제를 풀기 적합한가",
                    ]
                    ForEach(criteria, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 2 창업팀 정렬

    private var teamPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            modeTeamSection

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("법인 형태 선택")
                    let options: [(String, String, String)] = [
                        ("individual", "개인사업자", "빠른 시작·저비용. 투자 유치 불리. 초기 MVP 검증 단계에 적합."),
                        ("corp", "법인 설립", "투자 유치 가능. 세금 구조 복잡. 팀 2명 이상 + 투자 계획 있으면 권장."),
                        ("undecided", "아직 미결정", "고객 인터뷰 후 결정. 인터뷰 10건 이전이면 서두를 필요 없음."),
                    ]
                    ForEach(options, id: \.0) { id, title, desc in
                        let isSelected = corpType == id
                        Button {
                            corpType = isSelected ? "" : id
                        } label: {
                            HStack(alignment: .top, spacing: BUSpacing.sm) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(title).font(BUFont.bodySmall.weight(.semibold))
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
                            .padding(BUSpacing.sm)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(isSelected ? BUColor.midnight.opacity(0.08) : BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: BURadius.outerCard, style: .continuous)
                                    .strokeBorder(isSelected ? BUColor.midnight.opacity(0.4) : Color.clear, lineWidth: 1.5)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            corpFormSection

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("스타트업 기초 정렬 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }

    // MARK: - 운영 모드별 팀 구성 (웹 SSOT 미러: StartupFoundationStage.tsx § 2)

    private var modeTeamSection: some View {
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
                    }
                    Text("운영 모드를 선택하면 팀·법인 가이드가 모드에 맞게 바뀝니다 (예산 단계와 공유)")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            ForEach([("indie", "1인 인디"), ("bootstrap", "부트스트랩"), ("seed", "시드"), ("seriesA", "시리즈A+")], id: \.0) { key, label in
                                let sel = startupMode == key
                                Button { startupMode = key } label: {
                                    Text(label)
                                        .font(.system(size: 11, weight: sel ? .bold : .medium))
                                        .foregroundStyle(sel ? .white : BUColor.inkSecondary)
                                        .padding(.horizontal, 10).padding(.vertical, 5)
                                        .background(sel ? BUColor.midnight : BUColor.midnight.opacity(0.06), in: Capsule())
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
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
                    BUEyebrow("실행 단계")
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
                    BUEyebrow("이 모드에서 꼭 결정할 것")
                    ForEach(c.decisions) { d in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(d.item).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text(d.recommendation).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("도구·리소스")
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

    // MARK: - 법인 형태 권장·상세 (웹 SSOT 미러: § 3 — Block 2 decisionGuide + Block 3 상세)

    private var corpFormSection: some View {
        let g = StartupFoundationModeContent.decisionGuide(for: startupMode)
        let d = StartupFoundationModeContent.corpDetail(for: startupMode)
        return VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        ZStack {
                            Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                            Text("3").font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                        }
                        Text("법인 vs 개인사업자 — 의사결정만").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    }
                    Text("이 단계에서는 어느 형태로 시작할지만 결정합니다. 실제 등록·과세유형·약관 절차는 다음 '법인 설립·등록' 단계에서 처리합니다.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                    HStack(spacing: 6) {
                        Text("\(modeLabel) 권장").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background(BUColor.midnight, in: Capsule())
                        Text(g.recommend == "sole" ? "개인사업자" : "법인").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.midnightDeep)
                    }
                    Text(g.headline).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                    Text(g.reason).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
            }
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    Text(d.headline).font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    ForEach(d.why, id: \.self) { w in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            Text(w).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("실행 단계")
                    ForEach(d.actions) { a in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(a.label).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                            Text(a.detail).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("장점")
                    ForEach(d.advantages, id: \.self) { a in
                        Text(a).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
            }
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("도구·리소스")
                    ForEach(d.tools) { t in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.midnight).frame(width: 4, height: 4).padding(.top, 5)
                            (Text(t.name).font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.ink)
                             + Text(" — \(t.desc)").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                             + Text(t.price.isEmpty ? "" : " · \(t.price)").font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted))
                                .lineSpacing(2)
                        }
                    }
                }
            }
        }
    }
}

#if DEBUG
#Preview("StartupFoundation") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["startup-foundation"] }
    return StartupFoundationStageView().environment(store)
}
#endif
