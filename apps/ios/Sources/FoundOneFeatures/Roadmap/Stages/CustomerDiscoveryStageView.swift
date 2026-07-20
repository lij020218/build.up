//
//  CustomerDiscoveryStageView.swift — 고객 발굴 (iOS 네이티브)
//
//  웹 SSOT: apps/web/app/lib/components/stages/startup/CustomerDiscoveryStage.tsx
//  stageId: "customer-discovery"
//
//  2026-07-21 웹 4페이지 구조 미러 — 페이지 구성·콘텐츠 1:1:
//    pg 0 — 왜 중요한가 (내 운영 모드 + WHY 42% + 경영 기법 3)
//    pg 1 — 1. 인터뷰 준비 (Mom Test 4질문 + AI 인터뷰지 안내)
//    pg 2 — 2. 인터뷰 실행 (모집 채널 4 + 기준 스탯 3 + 진행 카운터·페인 메모)
//    pg 3 — 3. AI 분석 (AI 분석 안내 + 핵심 문제 정의 + 결과물 체크)
//
//  AI 인터뷰지 생성·결과 분석은 웹 전용 — iOS 는 동일 페이지에 안내 콘텐츠.
//  게이트(인터뷰 10건+ & 핵심 문제 한 문장)는 기존 유지 — 입력을 웹 대응 페이지에 재배치.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct CustomerDiscoveryStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    // 운영 모드 (웹 startupOperatingMode 미러 — 예산 설정 단계에서 저장)
    @AppStorage("stage.budget.startupOperatingMode") private var operatingMode = "bootstrap"
    @State private var page = 0
    private let stageId = "customer-discovery"

    /// Sub-industry 별 인터뷰 패턴 (startup-tech 내부 분기).
    private var helperText: String {
        switch industryId {
        case "b2b-saas":             return "B2B 의사결정자 10명 인터뷰 (현재 도구·우회 방법·결제 권한). 무료 도입 X — 구매 신호 검증."
        case "ai-application":       return "사용자 10명 + 현재 LLM·도구 사용 패턴 인터뷰. AI 신뢰성·환각 대응 의지 검증."
        case "fintech-startup":      return "금융 사용자 + 컴플라이언스 담당 동시 인터뷰. 규제 게이트 사전 식별."
        case "healthtech-startup":   return "환자·의료진·보험사 3축 인터뷰. 임상·보험 청구 워크플로 검증."
        case "hardware-iot":         return "디바이스 사용자 + 유지보수·A/S 시나리오 인터뷰. 물리 회수·OTA 의지 검증."
        case "robotics-physical-ai": return "필드 운영자 + 안전 책임자 인터뷰. 사고·비상정지 시나리오 사전 정의."
        case "biotech-medtech":      return "환자·임상의·IRB 위원 인터뷰. 임상시험 진입 게이트 사전 식별."
        case "semiconductor":        return "B2B 고객·FAE·구매 담당 인터뷰. PO 사이클·납기·BOM 사전 협의."
        case "climate-energy":       return "산업·정부·NGO 3축 인터뷰. 규제·인센티브 사전 식별."
        case "security-startup":     return "SOC·CISO 인터뷰. 감사·SOC2·ISO 인증 요구사항 사전 식별."
        case "developer-tools":      return "개발자 10명 + Open Source 메인테이너 인터뷰. 깃허브·트위터·디스코드 직접 채널."
        default:                     return "10번의 인터뷰가 6개월의 개발을 구합니다. 만들기 전에 먼저 대화하세요."
        }
    }

    @AppStorage("cd.interviewCount") private var interviewCount = 0
    @AppStorage("cd.painPattern")    private var painPattern    = ""
    @AppStorage("cd.wedgeProblem")   private var wedgeProblem   = ""

    private let pages = ["왜 중요한가", "1. 인터뷰 준비", "2. 인터뷰 실행", "3. AI 분석"]

    public init() {}

    /// 게이트: 인터뷰 10건 이상 + Wedge Problem 한 문장 정의 (Mom Test 표준 20-30 권장).
    private var canCompleteStage: Bool {
        interviewCount >= 10 &&
        !wedgeProblem.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private var advanceHint: String {
        let hasWedge = !wedgeProblem.trimmingCharacters(in: .whitespaces).isEmpty
        if interviewCount < 10 && !hasWedge { return "인터뷰 10건+ & 핵심 문제 정의 필요 (Mom Test 20-30 권장)" }
        if interviewCount < 10 { return "인터뷰 \(interviewCount)/10 — 10건 이상 필요" }
        if !hasWedge { return "핵심 문제(Wedge)를 한 문장으로 정의하세요" }
        return "고객 발굴 완료 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "고객 발굴·문제 검증",
            stageEyebrow: "단계 7 · 고객 발굴",
            helperText: helperText,
            canAdvance: canCompleteStage,
            advanceHint: advanceHint,
            isCompleted: roadmapStore.isStageCompleted(stageId),
            onAdvance: {
                roadmapStore.advanceToNext(
                    currentStageId: stageId,
                    inputs: ["interviewCount": "\(interviewCount)", "wedgeProblem": wedgeProblem]
                )
            },
            onUncomplete: { roadmapStore.uncompleteStage(stageId) },
            onEditSave: {
                roadmapStore.saveStageEdit(currentStageId: stageId,
                    inputs: ["interviewCount": "\(interviewCount)", "wedgeProblem": wedgeProblem])
            },
            wrapup: BUStageWrapupData(
                doneItems: [
                .init(label: "1. 타깃 고객 ICP 정의", detail: "산업·역할·예산·구매 권한 4축으로 ICP 명문화"),
                .init(label: "2. Mom Test 인터뷰", detail: "20~30명 직접 인터뷰 + 「과거 행동」 질문 위주, 가설 검증 X 행동 검증"),
                .init(label: "3. 문제 가설 검증", detail: "Top 3 문제 + 빈도 + 강도 + 현재 대안 정량화"),
                .init(label: "4. 솔루션 가설 도출", detail: "랜딩 페이지·LOI·사전 결제 등 강한 시그널 1개 이상 확보"),
                ],
                verifyItems: [
                "Mom Test — 「당신은 이걸 살 거예요?」 같은 가설 질문은 모두 거짓말, 「과거 어떻게 해결했어요?」 행동 질문만",
                "샘플 편향 — 친구·지인 인터뷰 시 데이터 무효, 외부 콜드 아웃리치 80% 이상",
                "결제 의지 — 「관심 있다」 ≠ 「살 의지」, LOI·사전 결제 등 진짜 의지 시그널 확보",
                "TAM·SAM·SOM — 추정 시장 규모 객관 데이터로 산출, 「수십조 시장」 모호한 추정은 투자 거절",
                "경쟁 — 「경쟁자 없음」은 위험 신호, 시장이 없거나 모르거나 둘 중 하나",
                "법적 — 인터뷰 녹음·녹화 시 사전 동의 (개인정보보호법), 미동의 시 데이터 무효 + 위반",
                ],
                nextStageLabel: "MVP 빌드",
                nextSummary: "ICP·문제·솔루션 가설 검증 완료 → MVP 빌드 단계로 진입"
            ),
            currentPage: page,
            onNextPage: { withAnimation { page += 1 } },
            totalPages: pages.count,
            keyActionOverride: .init(
                title: "코드 한 줄 전에, 10명과 대화하세요",
                detail: "스타트업의 42%는 \"시장이 원하지 않는 제품\"을 만들어 실패합니다. 의견이 아닌 과거 행동을 물어, 진짜 고통이 있는지 검증하세요."
            )
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
                    case 1: preparePage
                    case 2: executePage
                    default: analyzePage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 왜 중요한가

    private var whyPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            modePathCard

            // WHY — 왜 이 단계가 중요한가 (웹 미러)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.midnight)
                        BUEyebrow("왜 이게 첫 번째인가")
                    }
                    Text("스타트업의 42%는 \"시장이 필요로 하지 않는 제품\"을 만들어 실패합니다.")
                        .font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink).lineSpacing(3)
                    Text("코드를 한 줄도 쓰기 전에, 실제 사람과 대화해서 \"이 문제가 정말 돈이나 시간을 쓸 만큼 고통스러운지\" 확인해야 합니다. 이 과정을 건너뛰면 6개월 후 아무도 쓰지 않는 제품이 됩니다.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
            }

            // 이 단계에서 적용되는 경영 기법 (웹 미러 — Mom Test / JTBD / Lean Startup)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("이 단계에서 적용되는 경영 기법")
                    let frameworks: [(String, String, String)] = [
                        ("Mom Test", "의견이 아닌 과거 행동을 물어라. \"좋아요\"는 데이터가 아니다. 커밋먼트(시간·돈·소개)를 요청하라.", "https://www.momtestbook.com/"),
                        ("JTBD", "고객이 제품을 '고용'하는 이유를 찾아라. 기능이 아니라 해결하려는 '일(Job)'에 집중.", "https://jtbd.info/"),
                        ("Lean Startup", "가설 → 최소 실험 → 측정 → 학습. 2주 이내 사이클. 감이 아닌 데이터로 결정.", "https://theleanstartup.com/"),
                    ]
                    ForEach(frameworks, id: \.0) { name, desc, url in
                        let inner = HStack(alignment: .top, spacing: 8) {
                            Text(name)
                                .font(.system(size: 10, weight: .bold)).foregroundStyle(BUColor.midnight)
                                .padding(.horizontal, 6).padding(.vertical, 2)
                                .background(BUColor.midnight.opacity(0.06), in: RoundedRectangle(cornerRadius: 4, style: .continuous))
                            Text(desc).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            Spacer(minLength: 0)
                            Image(systemName: "arrow.up.right.square")
                                .font(.system(size: 11)).foregroundStyle(BUColor.midnight.opacity(0.4)).padding(.top, 2)
                        }
                        if let dest = URL(string: url) {
                            Link(destination: dest) { inner }.buttonStyle(.plain)
                        } else {
                            inner
                        }
                    }
                }
            }
        }
    }

    /// 내 운영 모드 카드 — 웹 ModePathCard(stageId: customer-discovery) 기본(접힘) 상태 미러.
    private var modePathCard: some View {
        let content = Self.modeContent[operatingMode] ?? Self.modeContent["bootstrap"]!
        let modeLabel: String = {
            switch operatingMode {
            case "indie":   return "1인 인디"
            case "seed":    return "시드 단계"
            case "seriesA": return "시리즈 A+"
            default:        return "부트스트랩"
            }
        }()
        return BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                HStack {
                    BUEyebrow("내 운영 모드")
                    Spacer()
                    Text("변경: 예산 설정 단계").font(.system(size: 10)).foregroundStyle(BUColor.inkMuted)
                }
                HStack(spacing: 6) {
                    Image(systemName: "checkmark").font(.system(size: 11, weight: .heavy))
                    Text(modeLabel).font(BUFont.bodySmall.weight(.bold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12).padding(.vertical, 7)
                .background(BUColor.midnight, in: RoundedRectangle(cornerRadius: 9, style: .continuous))

                // WHY
                VStack(alignment: .leading, spacing: 4) {
                    Text("왜 이 단계가 필요한가").font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight)
                    Text(content.why).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                }
                // HOW — 핵심 행동
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    Text("이 단계에서 해야 할 핵심 행동").font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight)
                    ForEach(content.actions.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 7, style: .continuous).fill(BUColor.midnight.opacity(0.06)).frame(width: 24, height: 24)
                                Text("\(i + 1)").font(.system(size: 11, weight: .heavy)).foregroundStyle(BUColor.midnight)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(content.actions[i].0).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink).lineSpacing(2)
                                Text(content.actions[i].1).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            Spacer(minLength: 0)
                        }
                    }
                }
                // PACE
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "clock").font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.midnight).padding(.top, 1)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("일정·규모 기준").font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.midnight)
                        Text(content.pace).font(BUFont.bodyCaption.weight(.semibold)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                }
                .padding(BUSpacing.sm)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                // PITFALL
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "exclamationmark.triangle").font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.danger).padding(.top, 1)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("이 모드의 흔한 함정").font(BUFont.eyebrow.weight(.bold)).foregroundStyle(BUColor.danger)
                        Text(content.pitfall).font(BUFont.bodyCaption).foregroundStyle(BUColor.danger.opacity(0.85)).lineSpacing(2)
                    }
                }
                .padding(BUSpacing.sm)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BUColor.danger.opacity(0.04), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                // EVIDENCE
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "quote.opening").font(.system(size: 10)).foregroundStyle(BUColor.inkMuted).padding(.top, 2)
                    Text(content.evidence).font(.system(size: 11)).italic().foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                }
            }
        }
    }

    // MARK: - pg 1 인터뷰 준비

    private var preparePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle().fill(BUColor.midnight).frame(width: 24, height: 24)
                            Text("1").font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                        }
                        Text("AI로 인터뷰 스크립트 만들기").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    }
                    Text("The Mom Test 원칙: 솔루션을 말하지 말고, 문제만 물어보세요. 아래 질문을 기반으로 AI가 업종에 맞는 스크립트를 만들어줍니다.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    let questions: [(String, String)] = [
                        ("이 문제를 지금 어떻게 해결하고 있나요?", "현재 대안 파악 → 10배 나은지 판단 가능"),
                        ("가장 최근에 이 문제를 겪은 게 언제예요?", "빈도와 심각도 확인. 기억도 못 하면 중요한 문제가 아님"),
                        ("이 문제 때문에 돈이나 시간을 얼마나 쓰나요?", "지불 의사 간접 확인. 0원이면 무료 도구도 안 쓸 것"),
                        ("이상적으로 어떻게 되면 좋겠어요?", "고객 언어로 가치 정의 → 마케팅 카피에 직접 활용"),
                    ]
                    ForEach(questions, id: \.0) { q, why in
                        VStack(alignment: .leading, spacing: 3) {
                            Text("\"\(q)\"").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink).lineSpacing(2)
                            Text(why).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                        .padding(BUSpacing.sm)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(BUColor.midnight.opacity(0.02), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(BUColor.midnight.opacity(0.07), lineWidth: 1))
                    }
                }
            }

            // AI 인터뷰지 생성기 — 웹 전용 기능 안내 (동일 위치)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("AI 인터뷰지 생성기")
                    Text("해결하려는 문제와 타깃 고객(ICP)을 입력하면 Mom Test 기반 인터뷰지를 자동 생성하고 PDF로 저장할 수 있습니다.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "macbook").font(.system(size: 12)).foregroundStyle(BUColor.midnight).padding(.top, 1)
                        Text("AI 인터뷰지 생성은 웹 대시보드(고객 발굴 → 1. 인터뷰 준비)에서 가능합니다.")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                    .padding(BUSpacing.sm)
                    .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }

    // MARK: - pg 2 인터뷰 실행

    private var executePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle().fill(BUColor.midnight).frame(width: 24, height: 24)
                            Text("2").font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                        }
                        Text("10명 이상 인터뷰를 실행하세요").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    }
                    // 모집 채널 (웹 미러)
                    let channels: [(String, String, String?)] = [
                        ("링크드인 DM", "타깃 직군에 직접 메시지. 20통 중 4~5통 응답", "https://www.linkedin.com"),
                        ("디스콰이엇", "한국 스타트업 커뮤니티. 초기 유저 모집에 최적", "https://disquiet.io"),
                        ("블라인드", "직장인 익명 커뮤니티. B2B 타깃에 효과적", "https://www.teamblind.com"),
                        ("지인 2차 소개", "\"이 분야 아는 사람 소개해줄 수 있어?\"가 가장 효과적", nil),
                    ]
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                        ForEach(channels, id: \.0) { ch, tip, url in
                            let inner = VStack(alignment: .leading, spacing: 3) {
                                HStack(spacing: 4) {
                                    Text(ch).font(.system(size: 12, weight: .semibold)).foregroundStyle(BUColor.ink)
                                    if url != nil {
                                        Image(systemName: "arrow.up.right.square").font(.system(size: 9)).foregroundStyle(BUColor.midnight.opacity(0.55))
                                    }
                                }
                                Text(tip).font(.system(size: 11)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            }
                            .padding(BUSpacing.sm)
                            .frame(maxWidth: .infinity, minHeight: 64, alignment: .topLeading)
                            .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                            if let u = url, let dest = URL(string: u) {
                                Link(destination: dest) { inner }.buttonStyle(.plain)
                            } else {
                                inner
                            }
                        }
                    }
                    // 기준 스탯 (웹 미러)
                    HStack(spacing: 6) {
                        ForEach([("10+명", "최소 인터뷰 수", "5명=패턴 감지, 10명=확신"),
                                 ("30분", "인터뷰 시간", "15분은 짧고 1시간은 부담"),
                                 ("24h내", "기록 마감", "기억은 빠르게 왜곡됨")], id: \.0) { num, label, detail in
                            VStack(spacing: 2) {
                                Text(num).font(.system(size: 17, weight: .heavy)).foregroundStyle(BUColor.midnight)
                                Text(label).font(.system(size: 11, weight: .semibold)).foregroundStyle(BUColor.ink)
                                Text(detail).font(.system(size: 10)).foregroundStyle(BUColor.inkSecondary)
                                    .multilineTextAlignment(.center)
                            }
                            .padding(.vertical, 10).padding(.horizontal, 4)
                            .frame(maxWidth: .infinity)
                            .background(Color.black.opacity(0.02), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                    }
                }
            }

            // 인터뷰 진행 현황 (게이트 입력 — iOS 재배치: 실행 페이지)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("인터뷰 진행 현황")
                    HStack(spacing: BUSpacing.md) {
                        Button {
                            if interviewCount > 0 { interviewCount -= 1 }
                        } label: {
                            Image(systemName: "minus.circle.fill")
                                .font(.system(size: 28)).foregroundStyle(BUColor.inkMuted)
                        }
                        .buttonStyle(.plain)
                        VStack(spacing: 2) {
                            Text("\(interviewCount)")
                                .font(.system(size: 36, weight: .bold)).foregroundStyle(BUColor.midnight).monospacedDigit()
                            Text("건 완료").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                        }
                        Button {
                            if interviewCount < 50 { interviewCount += 1 }
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 28)).foregroundStyle(BUColor.midnight)
                        }
                        .buttonStyle(.plain)
                    }
                    .frame(maxWidth: .infinity)

                    ProgressView(value: Double(min(interviewCount, 10)), total: 10)
                        .tint(BUColor.midnight)
                        .padding(.top, BUSpacing.xs)

                    let statusText: String = {
                        if interviewCount < 5 { return "시작 단계 — 계속 진행하세요" }
                        if interviewCount < 10 { return "절반 완료 — 다양한 페르소나 시도" }
                        return "충분한 데이터 확보"
                    }()
                    Text(statusText).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                    Text("목표: 10건").font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("페인 패턴 메모")
                    TextField("반복 등장한 고통 패턴", text: $painPattern, axis: .vertical)
                        .font(BUFont.bodySmall)
                        .lineLimit(4)
                        .padding(.horizontal, 10).padding(.vertical, 10)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
        }
    }

    // MARK: - pg 3 AI 분석

    private var analyzePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 8) {
                        ZStack {
                            Circle().fill(BUColor.midnight).frame(width: 24, height: 24)
                            Text("3").font(.system(size: 12, weight: .bold)).foregroundStyle(.white)
                        }
                        Text("AI로 인터뷰 결과를 분석하세요").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.ink)
                    }
                    Text("인터뷰 노트를 AI에게 넘기면 반복 패턴, 핵심 고통, 초기 타깃 세그먼트를 자동 정리해줍니다.")
                        .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(3)
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "macbook").font(.system(size: 12)).foregroundStyle(BUColor.midnight).padding(.top, 1)
                        Text("AI 인터뷰 결과 분석기는 웹 대시보드(고객 발굴 → 3. AI 분석)에서 가능합니다. 인터뷰 노트를 붙여넣으면 「우리가 해결할 문제」·타깃 세그먼트·패턴·다음 행동을 정리해줍니다.")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                    .padding(BUSpacing.sm)
                    .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }

            // 핵심 문제 정의 (게이트 입력 — 웹 결과물 "우리가 해결할 한 가지 문제" 대응)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("핵심 문제 (Wedge Problem)")
                    TextField("가장 많이 등장한 페인 포인트 한 문장", text: $wedgeProblem)
                        .font(BUFont.bodySmall)
                        .padding(.horizontal, 10).padding(.vertical, 10)
                        .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    HStack(spacing: 6) {
                        Image(systemName: "info.circle").font(.system(size: 12)).foregroundStyle(BUColor.midnight)
                        Text("Wedge Problem = 가장 고통스럽고, 빈번하고, 우리가 해결할 수 있는 교차점")
                            .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    }
                    .padding(.top, BUSpacing.xs)
                }
            }

            // 이 단계의 결과물 (웹 미러)
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("이 단계의 결과물")
                    let deliverables = [
                        "핵심 고통 패턴 1~2개 (3명 이상 공통)",
                        "초기 타깃 세그먼트 정의 (누구의, 어떤 상황에서)",
                        "현재 대안 목록과 각 대안의 불만족 이유",
                        "\"우리가 해결할 한 가지 문제\" 문장",
                    ]
                    ForEach(deliverables, id: \.self) { item in
                        HStack(spacing: BUSpacing.sm) {
                            Image(systemName: "checkmark.circle")
                                .font(.system(size: 14)).foregroundStyle(BUColor.inkSubtle)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }
        }
    }

    // MARK: - 모드별 콘텐츠 (웹 packages/shared/src/roadmap/startup-mode-content.ts "customer-discovery" 미러)

    private struct ModeContent {
        let why: String
        let actions: [(String, String)]
        let pace: String
        let pitfall: String
        let evidence: String
    }

    private static let modeContent: [String: ModeContent] = [
        "indie": .init(
            why: "솔로는 '내가 직접 인터뷰' 가 강점이자 약점. 강점은 PM·CS·세일즈 모두 본인이 보니 인사이트가 잃지 않음. 약점은 시간 한계 — 일주일 5명 인터뷰가 한계.",
            actions: [
                ("30-50명 인터뷰 → 패턴 1개 발견까지", "Pieter Levels 패턴: 본인이 잘 아는 niche 의 정확한 1-3개 pain. Twitter DM·Reddit·Discord 에서 직접 모집."),
                ("유료 의향 확인 (가짜 결제 페이지 또는 사전주문)", "Talk is cheap — 신용카드 정보까지 받는 사전주문이 가장 강한 신호. 인디는 자본이 없으니 false positive 회피 필수."),
                ("공개 인터뷰 노트 (X/blog)", "build-in-public 마케팅 + 후속 고객 모집 효과 동시. Marc Lou 모델."),
            ],
            pace: "주 5-10명 인터뷰, 4-6주 내 100명 도달.",
            pitfall: "친구·가족 인터뷰 → 의미 없음. 모르는 사람만 카운트.",
            evidence: "솔로 founder 강점: 'AI 가 무엇을 풀지 알려주지 않는다' — fundamentals 는 동일 (FindSkill.ai 2026)."
        ),
        "bootstrap": .init(
            why: "1-3명 팀은 인터뷰 분담 가능 — 효율 2-3배. 단, 인사이트 통합 단계가 가장 중요 — 분담 후 한자리 모여 패턴 합의해야 같은 방향.",
            actions: [
                ("50-100명 인터뷰 분담 + 주 1회 인사이트 합의", "founders 별 다른 페르소나 담당. 매주 30분 패턴 미팅 — Mom Test 표준 질문."),
                ("VOC 시스템 구축 (Notion + 태깅)", "인터뷰 raw + 인용구 + 태그 (pain·workaround·budget·urgency)."),
                ("유료 사전판매 / Stripe 결제 페이지로 검증", "Stripe + Carrd 1시간이면 셋업 가능. 결제까지 가는 conversion 이 진짜 검증."),
            ],
            pace: "분담 시 4주 내 100명, 주 1회 통합.",
            pitfall: "각자 인터뷰만 하고 통합 안 함 → 다른 PMF 가설 추구로 분열. 매주 30분 무조건 합의 미팅.",
            evidence: "Bootstrap 표준: 'Listen → Build → Listen' (37signals 모델)."
        ),
        "seed": .init(
            why: "시드는 PMF 시그널 강도를 검증하는 단계. 1년 뒤 시리즈A VC 가 가장 먼저 묻는 것: '진짜 고객 데이터 어디 있어?' VOC 시스템 + 정성·정량 양쪽 데이터 다 갖춰야 함.",
            actions: [
                ("Customer Discovery 프로세스화 (Steve Blank)", "Customer Discovery → Validation → Creation → Building. 전담 1명 (PM 또는 founder)이 매주 인터뷰 10-20명."),
                ("Customer Advisory Board 구성 (5-10 deep users)", "최우선 고객 5-10명을 정기 자문단으로. 분기 1회 미팅 + 베타 1순위 + 레퍼런스 활용."),
                ("정량 PMF 신호 트래킹 (NPS·retention·organic·word-of-mouth)", "Sean Ellis Test: 사용 못 하면 매우 실망 ≥ 40% = PMF. 매월 측정."),
            ],
            pace: "9-12개월 내 PMF 또는 명확한 피벗.",
            pitfall: "Customer Discovery 단계 단축하고 채용·기능 빌드 우선 = 시드 소진 후에야 PMF 못 찾았음 깨달음.",
            evidence: "YC: PMF 가 시리즈A 의 전제. Sean Ellis Test 40%+ 가 표준."
        ),
        "seriesA": .init(
            why: "시리즈A+ 는 '검증' 에서 '확장' 으로 전환. Customer Discovery → Customer Success 로 진화. 영업팀 분리 + CSM 역할 등장.",
            actions: [
                ("Customer Success Manager (CSM) 채용 + onboarding 프로세스", "1:1 onboarding 콜 + adoption tracking + 분기 review. 90% retention 목표."),
                ("Customer Advisory Board 정식 운영", "분기 1회 + 제품 로드맵 공유 + 베타 우선권. 영향력 큰 고객을 advocate 으로."),
                ("Voice of Customer (VOC) 분석 시스템", "Gong·Chorus 등 통화 분석 + Mixpanel 행동 분석 통합. 매주 인사이트 → product team."),
            ],
            pace: "CSM 6개월 내 채용. Advisory Board 분기 운영.",
            pitfall: "Customer Discovery 멈춤 → 시장 변화 놓침. 시리즈A 후에도 founder 인터뷰 월 10명은 유지.",
            evidence: "Andrew Chen: compounding growth loops — customer feedback loop 가 핵심 자산."
        ),
    ]
}

#if DEBUG
#Preview("CustomerDiscovery") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["customer-discovery"] }
    return CustomerDiscoveryStageView().environment(store)
}
#endif
