//
//  CustomerDiscoveryStageView.swift — 고객 발굴 (iOS 네이티브)
//
//  stageId: "customer-discovery"
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
    @AppStorage("cd.done")           private var done           = false

    private let pages = ["인터뷰 가이드", "인터뷰 기록", "인사이트 정리"]

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
                    case 0: guidePage
                    case 1: recordPage
                    default: insightPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 인터뷰 가이드

    private var guidePage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("인터뷰 황금 5문항")
                    Text("Mom Test·JTBD 원칙 — “살 거예요?” 같은 의견 질문은 답이 늘 Yes. 과거 행동·빈도·강도를 물어 고객이 해결하려는 ‘일(Job-to-be-Done)’을 찾습니다.")
                        .font(.system(size: 12)).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                    let questions: [(Int, String)] = [
                        (1, "지금 이 문제를 어떻게 해결하고 있나요? (현재 행동)"),
                        (2, "마지막으로 이 문제를 경험한 게 언제였나요? (빈도)"),
                        (3, "그때 얼마나 불편하셨나요? 1-10점으로 표현하면? (강도)"),
                        (4, "이 문제가 해결되면 어떤 점이 가장 달라질까요? (가치)"),
                        (5, "지금 쓰는 해결책의 가장 큰 불만은? (경쟁 약점)"),
                    ]
                    ForEach(questions, id: \.0) { num, q in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            ZStack {
                                Circle().fill(BUColor.midnight).frame(width: 22, height: 22)
                                Text("\(num)").font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                            }
                            Text(q).font(BUFont.bodySmall).foregroundStyle(BUColor.ink).lineSpacing(2)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(BUColor.warn).font(.system(size: 13))
                        Text("하지 말아야 할 것").font(BUFont.bodySmall.weight(.bold)).foregroundStyle(BUColor.warn)
                    }
                    let donts = [
                        "제품 피칭 — 인터뷰가 아니라 영업이 됨",
                        "\"이런 기능 쓰실 건가요?\" 가정 질문 — 답이 항상 Yes",
                        "친한 지인만 인터뷰 — 편향된 피드백",
                    ]
                    ForEach(donts, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(BUColor.warn).frame(width: 4, height: 4).padding(.top, 5)
                            Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                        }
                    }
                }
            }
        }
    }

    // MARK: - pg 1 인터뷰 기록

    private var recordPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
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

    // MARK: - pg 2 인사이트 정리

    private var insightPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
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

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("고객 발굴 완료 기준")
                    let criteria = [
                        "10명 이상 인터뷰 완료",
                        "3번 이상 반복 등장한 페인 패턴 식별",
                        "타깃 고객 페르소나 1명 구체화",
                        "핵심 문제 한 문장으로 정의",
                    ]
                    ForEach(criteria, id: \.self) { item in
                        HStack(spacing: BUSpacing.sm) {
                            Image(systemName: "checkmark.circle")
                                .font(.system(size: 14)).foregroundStyle(BUColor.inkSubtle)
                            Text(item).font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("고객 발굴 완료").font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("CustomerDiscovery") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["customer-discovery"] }
    return CustomerDiscoveryStageView().environment(store)
}
#endif
