//
//  FundraisingReadinessStageView.swift — 투자 준비 (iOS 네이티브)
//
//  stageId: "fundraising-readiness"
//

import SwiftUI
import BuildUpDesignSystem
import BuildUpComponents

public struct FundraisingReadinessStageView: View {

    @Environment(\.dismiss) private var dismiss
    @State private var page = 0

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

    public var body: some View {
        NavigationStack {
            ZStack {
                BUBackgroundSurface()
                VStack(spacing: 0) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 0) {
                            ForEach(pages.indices, id: \.self) { i in
                                Button {
                                    withAnimation(.easeInOut(duration: 0.2)) { page = i }
                                } label: {
                                    Text(pages[i])
                                        .font(BUFont.bodySmall.weight(page == i ? .semibold : .regular))
                                        .foregroundStyle(page == i ? BUColor.midnight : BUColor.inkMuted)
                                        .padding(.horizontal, BUSpacing.md)
                                        .padding(.vertical, BUSpacing.sm)
                                        .background(page == i ? BUColor.midnight.opacity(0.08) : Color.clear, in: Capsule())
                                }
                            }
                        }
                        .padding(.horizontal, BUSpacing.sm)
                    }
                    .padding(.vertical, BUSpacing.xs)

                    ScrollView {
                        VStack(alignment: .leading, spacing: BUSpacing.lg) {
                            Group {
                                switch page {
                                case 0: runwayPage
                                case 1: irPage
                                default: govSupportPage
                                }
                            }
                            .padding(.horizontal, BUSpacing.md)
                            Spacer(minLength: BUSpacing.xxxl)
                        }
                        .padding(.top, BUSpacing.sm)
                    }
                }
            }
            .navigationTitle("투자 준비")
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
        if months >= 12 { return ("안전", BUColor.success) }
        if months >= 6  { return ("주의", .orange) }
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
                        ("TIPS (팁스)", "민간투자 연계. 최대 5억 R&D 지원. 연 500개 선정. 추천 기관 통해 신청."),
                        ("중진공 청년창업사관학교", "만 39세 이하. 공간·자금·멘토링. 연 1000명 선정."),
                        ("K-스타트업 창업패키지", "3년 미만 법인. 최대 1억. 창업진흥원 공고 확인."),
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

            BUCard(.card) {
                Toggle(isOn: $done) {
                    Text("투자 준비 완료")
                        .font(BUFont.bodySmall.weight(.semibold))
                        .foregroundStyle(BUColor.ink)
                }.tint(BUColor.midnight)
            }
        }
    }
}

#if DEBUG
#Preview("FundraisingReadiness") { FundraisingReadinessStageView() }
#endif
