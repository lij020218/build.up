//
//  FundraisingReadinessStageView.swift — 투자 준비 (iOS 네이티브)
//
//  stageId: "fundraising-readiness"
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct FundraisingReadinessStageView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(RoadmapStore.self) private var roadmapStore
    @AppStorage("roadmap.selectedIndustryId") private var industryId = ""
    private let stageId = "fundraising-readiness"

    @State private var page = 0

    /// Sub-industry 별 투자 패턴 — startup-tech 9 sub-cluster.
    private var helperText: String {
        switch industryId {
        case "b2b-saas":             return "MRR·NRR·CAC payback 12개월 중심. 시리즈A 평균 21개월 런웨이 + ARR $1M 마일스톤."
        case "ai-application":       return "토큰 단가·LLM 마진 명시. 시리즈A 평균 ARR $2M (B2C) / $500K (B2B AI). 모델 무관성 강조."
        case "fintech-startup":      return "라이센스·컴플라이언스 게이트 명시. TAM = 한국 금융 가구 × ARPA. 시리즈A 평균 50~100억."
        case "healthtech-startup":   return "MFDS 허가·임상 단계 + 보험 청구 마일스톤. 시리즈A 평균 50~150억 (의료기기)."
        case "hardware-iot":         return "BOM·NRE·양산 단가 + GP 마진. NPI 단계별 milestone (EVT→DVT→PVT). 시리즈A 평균 100~200억."
        case "robotics-physical-ai": return "필드 데이터·유닛 경제·안전 인증. 시리즈A 평균 100~300억 (Lab→파일럿)."
        case "biotech-medtech":      return "IND·임상 단계·IP·CRO 비용 명시. 시리즈A 평균 100~500억 (적응증·단계 의존)."
        case "semiconductor":        return "테이프아웃 단계·BOM·OSAT 비용 + 첫 고객 PO. 시리즈A 평균 300~900억 (디노티시아·BOS)."
        case "climate-energy":       return "정부·NGO·산업 인센티브 명시. 시리즈A 평균 50~300억 (소프트웨어 vs 인프라 양극)."
        case "security-startup":     return "SOC2·ISO 인증·SOC 고객 명시. ARR 기반 시리즈A 평균 50~100억."
        case "developer-tools":      return "OSS·유료 전환·기업 도입 funnel. 시리즈A 평균 ARR $500K~$2M."
        default:                     return "런웨이를 측정하고 IR 피치덱과 재무 모델을 완성하세요. 정부 지원도 병행해 활주로를 늘립니다."
        }
    }

    @AppStorage("fr.monthlyBurnText") private var monthlyBurnText = ""
    @AppStorage("fr.cashText")        private var cashText        = ""
    @AppStorage("fr.mrrText")         private var mrrText         = ""
    @AppStorage("fr.pitchDeck")       private var pitchDeck       = false
    @AppStorage("fr.financialModel")  private var financialModel  = false
    @AppStorage("fr.tipsApplied")     private var tipsApplied     = false
    @AppStorage("fr.govSupport")      private var govSupport      = false
    @AppStorage("fr.done")            private var done            = false

    private let pages = ["런웨이 모델", "IR 자료", "정부 지원"]

    public init() {}

    private var runwayMonths: Double? {
        guard
            let cash = Double(cashText), cash > 0,
            let burn = Double(monthlyBurnText), burn > 0
        else { return nil }
        let mrr = Double(mrrText) ?? 0
        let netBurn = burn - mrr
        guard netBurn > 0 else { return nil }
        return cash / netBurn
    }

    /// 게이트: IR 초안 — 피치덱 완성.
    private var canCompleteStage: Bool {
        pitchDeck
    }

    private var advanceHint: String {
        if !pitchDeck { return "IR 피치덱을 완성하세요" }
        return "IR 초안 완성 — 다음 단계로"
    }

    public var body: some View {
        BUStageShell(
            stageId: stageId,
            title: "런웨이·투자 준비",
            stageEyebrow: "단계 13 · 투자 준비",
            helperText: helperText,
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
                .init(label: "1. 캡테이블·런웨이 정리", detail: "지분 구조 + 옵션 풀 + 18개월 런웨이 + 마일스톤"),
                .init(label: "2. 펀딩 라운드 결정", detail: "TIPS·시드·시리즈 A 비교 + 정부지원금 매칭"),
                .init(label: "3. 데크·재무 모델", detail: "10~15페이지 데크 + 5년 재무 모델 + 시나리오 3종"),
                .init(label: "4. 투자자 매칭·미팅", detail: "VC·엔젤 매칭 + 1차 미팅 + 듀딜 자료 사전 준비"),
                ],
                verifyItems: [
                "캡테이블 — 공동창업자 vesting 미설정 시 투자 거절 1순위, 1년 cliff + 4년 vesting 표준",
                "정부지원금 — TIPS·예비창업·초기창업 등 신청 후 입금까지 평균 4~12주, 일정 역산",
                "런웨이 — 18개월 미만이면 fundraising에 집중, 12개월 미만이면 위기",
                "데크 — 「Big Idea + Team + Traction」 3축 명확, 모호한 사업 모델은 즉시 거절",
                "텀시트 — Liquidation Preference·Anti-dilution·Drag-along 등 핵심 조항 변호사 검토",
                "정관 — 우선주·전환사채·전환우선주 사전 정의, 미정의 시 투자 단계에서 재작성 비용",
                ],
                nextStageLabel: "벤처 인증",
                nextSummary: "캡테이블·런웨이·데크·투자자 매칭 완료 → 벤처 인증 단계로 진입"
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
                    case 0: runwayPage
                    case 1: irPage
                    default: govSupportPage
                    }
                }
            }
        }
    }

    // MARK: - pg 0 런웨이 모델

    private var runwayPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("런웨이 계산기")
                    inputRow(label: "현재 보유 현금", hint: "보유 현금 입력", text: $cashText, suffix: "만원")
                    inputRow(label: "월 번레이트 (지출)", hint: "월 지출 입력", text: $monthlyBurnText, suffix: "만원")
                    inputRow(label: "MRR (월 반복 매출)", hint: "월 매출 입력", text: $mrrText, suffix: "만원")

                    if let months = runwayMonths {
                        Divider()
                        HStack {
                            Text("예상 런웨이")
                                .font(BUFont.bodySmall.weight(.semibold))
                                .foregroundStyle(BUColor.ink)
                            Spacer()
                            let (label, color) = runwayStatus(months: months)
                            VStack(alignment: .trailing, spacing: 2) {
                                Text(String(format: "%.1f개월", months))
                                    .font(BUFont.cardTitleSmall.weight(.bold))
                                    .foregroundStyle(color)
                                Text(label)
                                    .font(BUFont.bodyCaption.weight(.semibold))
                                    .foregroundStyle(color)
                            }
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("투자 라운드 기준 (한국 2026)")
                    let rounds: [(String, String, String)] = [
                        ("Pre-seed", "팀+아이디어 · 5000만~3억", "엔젤·액셀러레이터"),
                        ("Seed", "MVP+초기 고객 · 3억~15억", "VC Seed 펀드·TIPS"),
                        ("Series A", "PMF 확인+MRR 1억+ · 20억~100억", "VC 메인 펀드"),
                    ]
                    ForEach(rounds, id: \.0) { round, condition, source in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(round)
                                .font(BUFont.bodySmall.weight(.bold))
                                .foregroundStyle(BUColor.midnightDeep)
                            Text(condition)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.ink)
                            Text(source)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkMuted)
                        }
                        if round != rounds.last!.0 { Divider() }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func inputRow(label: String, hint: String, text: Binding<String>, suffix: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(BUFont.eyebrow).foregroundStyle(BUColor.inkMuted)
            HStack {
                TextField(hint, text: text)
                    .font(BUFont.bodySmall)
                    .keyboardType(.numberPad)
                Text(suffix).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkMuted)
            }
            .padding(.horizontal, 10).padding(.vertical, 10)
            .background(BUColor.midnight.opacity(0.05), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
    }

    private func runwayStatus(months: Double) -> (String, Color) {
        if months >= 18 { return ("Default Alive — 18개월+ 표준", BUColor.success) }
        if months >= 12 { return ("Default Dead 경계 — 12개월은 짧음", .orange) }
        if months >= 6  { return ("주의 — 6개월 이내 라운드", .orange) }
        return ("위험 — 즉시 투자 활동 시작", .red)
    }

    // MARK: - pg 1 IR 자료

    private var irPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("IR 덱 필수 슬라이드 10개")
                    let slides = [
                        "문제", "솔루션", "시장규모", "제품", "비즈니스 모델",
                        "트랙션", "팀", "경쟁 분석", "자금 계획", "요청 금액·사용처",
                    ]
                    ForEach(slides.indices, id: \.self) { i in
                        HStack(alignment: .top, spacing: BUSpacing.sm) {
                            Text("\(i + 1).")
                                .font(BUFont.bodySmall.weight(.bold))
                                .foregroundStyle(BUColor.midnight)
                                .frame(width: 20, alignment: .leading)
                            Text(slides[i])
                                .font(BUFont.bodySmall)
                                .foregroundStyle(BUColor.ink)
                            Spacer()
                        }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("IR 자료 완성 체크")
                    Toggle(isOn: $pitchDeck) {
                        Text("IR 피치덱 완성 (10-15 슬라이드)")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $financialModel) {
                        Text("재무 모델 완성 (3년 예측·번레이트·런웨이)")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.orange)
                            .font(.system(size: 13))
                        Text("투자자가 가장 많이 거절하는 이유")
                            .font(BUFont.bodySmall.weight(.bold))
                            .foregroundStyle(BUColor.ink)
                    }
                    let reasons = [
                        "팀 - 실행력 없거나 도메인 경험 부족",
                        "시장 - TAM이 너무 작음 (1조원 이하)",
                        "트랙션 없음 - 고객 없는 아이디어만",
                        "창업자 commitment - 파트타임 창업",
                    ]
                    ForEach(reasons, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Circle().fill(Color.orange).frame(width: 4, height: 4).padding(.top, 5)
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

    // MARK: - pg 2 정부 지원

    private var govSupportPage: some View {
        VStack(alignment: .leading, spacing: BUSpacing.md) {
            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("주요 스타트업 지원 프로그램 (2026)")
                    let programs: [(String, String)] = [
                        ("TIPS (팁스)", "민간투자 연계 · R&D 5억 + 사업화 3억 = 총 8억 (성공 시 R&D 10% 환수) · 149개 운영사 추천 필수 · jointips.or.kr"),
                        ("중진공 청년창업사관학교", "만 39세 이하. 공간·자금·멘토링. 연 1000명 선정."),
                        ("K-스타트업 창업패키지", "3년 미만 법인. 최대 1억. k-startup.go.kr 공고 확인."),
                        ("산업부 R&D", "딥테크 스타트업. 최대 수억~수십억. 기술성 평가 필수."),
                    ]
                    ForEach(programs, id: \.0) { title, desc in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(title)
                                .font(BUFont.bodySmall.weight(.semibold))
                                .foregroundStyle(BUColor.midnightDeep)
                            Text(desc)
                                .font(BUFont.bodyCaption)
                                .foregroundStyle(BUColor.inkSecondary)
                                .lineSpacing(2)
                        }
                        if title != programs.last!.0 { Divider() }
                    }
                }
            }

            BUCard(.card) {
                VStack(alignment: .leading, spacing: BUSpacing.sm) {
                    BUEyebrow("정부 지원 신청 체크")
                    Toggle(isOn: $tipsApplied) {
                        Text("TIPS 추천 기관 미팅 완료")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                    Divider()
                    Toggle(isOn: $govSupport) {
                        Text("정부 지원 프로그램 1개 이상 신청 완료")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.ink)
                    }.tint(BUColor.midnight)
                }
            }
        }
    }
}

#if DEBUG
#Preview("FundraisingReadiness") {
    let store = RoadmapStore()
    store.pathProvider = { _ in ["fundraising-readiness"] }
    return FundraisingReadinessStageView().environment(store)
}
#endif
