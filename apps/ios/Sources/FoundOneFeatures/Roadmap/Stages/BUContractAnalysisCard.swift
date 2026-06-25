//
//  BUContractAnalysisCard.swift — 계약서 AI 분석 패널 (iOS).
//
//  웹 SSOT: apps/web/.../ContractAiAnalysisPanel.tsx (contract-review 마무리 interactive ref="contractAiAnalysis").
//  계약서 원문 붙여넣기 → AI 위험조항·누락항목·특이조건·다음행동. web↔iOS 동일.
//

import SwiftUI
import FoundOneDesignSystem
import FoundOneComponents
import FoundOneCore
import FoundOneData

public struct BUContractAnalysisCard: View {

    @State private var text = ""
    @State private var status: Status = .idle
    @State private var result: ContractAnalysisResult?
    @State private var errorMessage = ""

    private enum Status { case idle, loading, error }

    public init() {}

    private var canAnalyze: Bool {
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && status != .loading
    }

    public var body: some View {
        BUCard(.card) {
            VStack(alignment: .leading, spacing: BUSpacing.sm) {
                BUEyebrow("계약서 조항 분석")
                Text("상가 임대차 계약서 원문을 붙여넣으면 위험 조항, 누락 항목, 특이 조건을 먼저 짚어드립니다.")
                    .font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                Text("법률 자문이 아닌 1차 위험 점검입니다. 긴 계약서는 핵심 조항 중심으로 나눠 검토하는 편이 안전합니다.")
                    .font(.system(size: 11)).foregroundStyle(BUColor.inkMuted).lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)

                ZStack(alignment: .topLeading) {
                    if text.isEmpty {
                        Text("임대차 계약서 원문을 붙여넣어 보세요. 예: 임대료, 원상복구, 권리금, 해지 조항...")
                            .font(BUFont.bodySmall).foregroundStyle(BUColor.inkSubtle)
                            .padding(.horizontal, 12).padding(.vertical, 12)
                    }
                    TextEditor(text: $text)
                        .font(BUFont.bodySmall)
                        .frame(minHeight: 120)
                        .scrollContentBackground(.hidden)
                        .padding(.horizontal, 8).padding(.vertical, 6)
                }
                .background(BUColor.midnight.opacity(0.04), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(BUColor.midnight.opacity(0.12), lineWidth: 1))

                Text("최소 100자 이상, 10,000자 이하의 텍스트를 권장합니다.")
                    .font(.system(size: 11)).foregroundStyle(BUColor.inkMuted)

                Button { Task { await analyze() } } label: {
                    HStack(spacing: 6) {
                        if status == .loading { ProgressView().controlSize(.small).tint(.white) }
                        Text(status == .loading ? "분석 중..." : "계약서 분석하기")
                            .font(BUFont.bodySmall.weight(.bold)).foregroundStyle(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(canAnalyze ? BUColor.midnight : BUColor.midnight.opacity(0.4), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .disabled(!canAnalyze)
                .buttonStyle(.plain)

                if status == .error, !errorMessage.isEmpty {
                    Text(errorMessage).font(BUFont.bodyCaption).foregroundStyle(BUColor.danger)
                        .fixedSize(horizontal: false, vertical: true)
                }

                if let r = result { resultView(r) }
            }
        }
    }

    @ViewBuilder
    private func resultView(_ r: ContractAnalysisResult) -> some View {
        VStack(alignment: .leading, spacing: BUSpacing.sm) {
            Divider().padding(.vertical, 2)
            HStack {
                BUEyebrow("AI 해석 · 계약서 원문 기반")
                Spacer()
                Text(riskLabel(r.riskLevel))
                    .font(.system(size: 11, weight: .bold)).foregroundStyle(.white)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(riskColor(r.riskLevel), in: Capsule())
            }
            Text(r.summary).font(BUFont.bodySmall.weight(.semibold)).foregroundStyle(BUColor.ink)
                .fixedSize(horizontal: false, vertical: true)

            if !r.flaggedClauses.isEmpty {
                BUEyebrow("위험 조항")
                ForEach(Array(r.flaggedClauses.prefix(3).enumerated()), id: \.offset) { _, c in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(c.excerpt).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(c.issue).font(BUFont.bodyCaption.weight(.semibold))
                            .foregroundStyle(c.severity == "danger" ? BUColor.danger : BUColor.warn)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(10).frame(maxWidth: .infinity, alignment: .leading)
                    .background(BUColor.midnight.opacity(0.03), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }
            bulletGroup("누락 확인 항목", r.missingItems)
            bulletGroup("특이 조건", r.unusualTerms)
            bulletGroup("다음 행동", r.nextActions)
        }
    }

    @ViewBuilder
    private func bulletGroup(_ title: String, _ items: [String]) -> some View {
        if !items.isEmpty {
            VStack(alignment: .leading, spacing: 3) {
                BUEyebrow(title)
                ForEach(Array(items.prefix(3).enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .top, spacing: 6) {
                        Text("•").font(BUFont.bodyCaption).foregroundStyle(BUColor.midnight)
                        Text(item).font(BUFont.bodyCaption).foregroundStyle(BUColor.inkSecondary).lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
    }

    private func riskLabel(_ level: String) -> String {
        switch level {
        case "critical": return "위험 높음"
        case "high": return "주의 필요"
        case "medium": return "검토 권장"
        default: return "기본 확인"
        }
    }
    private func riskColor(_ level: String) -> Color {
        switch level {
        case "critical", "high": return BUColor.danger
        case "medium": return BUColor.warn
        default: return BUColor.midnight
        }
    }

    private func analyze() async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        status = .loading
        errorMessage = ""
        do {
            let service = await ContractAnalysisService.shared()
            let r = try await service.analyze(trimmed)
            result = r
            status = .idle
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? "계약서 분석 중 오류가 발생했습니다."
            status = .error
        }
    }
}
